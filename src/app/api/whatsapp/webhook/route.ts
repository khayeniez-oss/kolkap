import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateKolkapWhatsAppReply,
  type KolkapWhatsAppChatMessage,
} from "@/lib/kolkap-whatsapp-ai/generateReply";
import { sendKolkapWhatsAppTextMessage } from "@/lib/whatsapp/sendMessage";
import { findWhatsAppConnection, receiveWhatsAppMessage, receiveWhatsAppStatus, type WhatsAppConnection as CustomerWhatsAppConnectionRow } from "@/lib/whatsapp/messages";
import { metaTimestamp } from "@/lib/whatsapp/policy";
import { getWhatsAppAppSecrets, isInternalWhatsAppNumber, verifyWhatsAppSignature } from "@/lib/whatsapp/webhookSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KOLKAP_INTERNAL_HANDOVER_MARKER = "[[KOLKAP_HANDOVER]]";

type MetaMessage = {
  id?: string;
  from?: string;
  to?: string;
  timestamp?: string;
  type?: string;
  text?: {
    body?: string;
  };
};

type MetaContact = {
  wa_id?: string;
  profile?: {
    name?: string;
  };
};

type MetaWebhookValue = {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: MetaContact[];
  messages?: MetaMessage[];
  message_echoes?: MetaMessage[];
  statuses?: Array<Record<string, unknown>>;
};

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: MetaWebhookValue;
    }>;
  }>;
};

type InternalConversationRow = {
  id: string;
  customer_wa_id: string;
  customer_name: string | null;
  meta_phone_number_id: string | null;
  meta_business_account_id: string | null;
  status: string | null;
  ai_enabled: boolean | null;
  handover_to_admin: boolean | null;
  handover_reason: string | null;
};

type StoredInternalMessageRow = {
  direction: "inbound" | "outbound" | "system";
  message_text: string | null;
  message: string | null;
};

function cleanText(value: unknown, fallback = "") {
  const text =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? fallback
        : String(value);

  return text.trim();
}

function normalizePhone(value: unknown) {
  return String(value || "")
    .replace(/^whatsapp:/i, "")
    .replace(/\D/g, "");
}

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getVerifyTokens() {
  return [
    process.env.META_WHATSAPP_VERIFY_TOKEN,
    process.env.META_WEBHOOK_VERIFY_TOKEN,
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    process.env.META_VERIFY_TOKEN,
  ]
    .map((value) => cleanText(value))
    .filter(Boolean);
}

function getBusinessAccountId(entryBusinessAccountId?: string | null) {
  return (
    cleanText(entryBusinessAccountId) ||
    cleanText(process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID) ||
    ""
  );
}

function getWindowExpiry() {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry.toISOString();
}

function toRawPayload(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

async function findExistingInboundMessage(metaMessageId: string) {
  if (!metaMessageId) return null;

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("kolkap_whatsapp_messages")
    .select("id")
    .eq("meta_message_id", metaMessageId)
    .eq("direction", "inbound")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getOrCreateInternalConversation(input: {
  customerWaId: string;
  customerName?: string | null;
  metaPhoneNumberId?: string | null;
  metaBusinessAccountId?: string | null;
  messageText: string;
}) {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const customerWaId = normalizePhone(input.customerWaId);
  const customerName = cleanText(input.customerName);
  const metaPhoneNumberId = cleanText(input.metaPhoneNumberId);
  const metaBusinessAccountId = cleanText(input.metaBusinessAccountId);
  const messageText = cleanText(input.messageText);

  let existingQuery = supabase
    .from("kolkap_whatsapp_conversations")
    .select("*")
    .eq("customer_wa_id", customerWaId);

  if (metaPhoneNumberId) {
    existingQuery = existingQuery.eq("meta_phone_number_id", metaPhoneNumberId);
  } else {
    existingQuery = existingQuery.is("meta_phone_number_id", null);
  }

  const { data: existing, error: existingError } =
    await existingQuery.maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    const { data: updated, error: updateError } = await supabase
      .from("kolkap_whatsapp_conversations")
      .update({
        customer_name: customerName || existing.customer_name || null,
        phone: `whatsapp:${customerWaId}`,
        phone_e164: customerWaId,
        profile_name: customerName || existing.profile_name || null,
        channel: existing.channel || "meta_whatsapp",
        meta_business_account_id:
          metaBusinessAccountId || existing.meta_business_account_id || null,
        status:
          existing.status === "closed" ? "active" : existing.status || "active",
        last_inbound_at: now,
        window_expires_at: getWindowExpiry(),
        last_message: messageText,
        last_message_direction: "inbound",
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    return updated as InternalConversationRow;
  }

  const { data: created, error: createError } = await supabase
    .from("kolkap_whatsapp_conversations")
    .insert({
      customer_wa_id: customerWaId,
      customer_name: customerName || null,
      phone: `whatsapp:${customerWaId}`,
      phone_e164: customerWaId,
      profile_name: customerName || null,
      channel: "meta_whatsapp",
      meta_phone_number_id: metaPhoneNumberId || null,
      meta_business_account_id: metaBusinessAccountId || null,
      status: "active",
      ai_enabled: true,
      handover_to_admin: false,
      handover_reason: null,
      last_inbound_at: now,
      window_expires_at: getWindowExpiry(),
      last_message: messageText,
      last_message_direction: "inbound",
      last_message_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }

  return created as InternalConversationRow;
}

async function saveInternalWhatsAppMessage(input: {
  conversationId: string;
  direction: "inbound" | "outbound" | "system";
  customerWaId: string;
  customerName?: string | null;
  metaPhoneNumberId?: string | null;
  metaBusinessAccountId?: string | null;
  metaMessageId?: string | null;
  messageType?: string | null;
  messageText?: string | null;
  aiReplied?: boolean;
  aiModel?: string | null;
  aiError?: string | null;
  sendStatus?: string | null;
  source?: string | null;
  rawPayload?: Record<string, unknown>;
}) {
  const supabase = getAdminSupabase();
  const customerWaId = normalizePhone(input.customerWaId);
  const messageText = cleanText(input.messageText);

  const { error } = await supabase.from("kolkap_whatsapp_messages").insert({
    conversation_id: input.conversationId,
    direction: input.direction,
    customer_wa_id: customerWaId,
    customer_name: input.customerName || null,
    meta_phone_number_id: input.metaPhoneNumberId || null,
    meta_business_account_id: input.metaBusinessAccountId || null,
    meta_message_id: input.metaMessageId || null,
    message_type: input.messageType || "text",
    message_text: messageText || null,
    ai_replied: input.aiReplied || false,
    ai_model: input.aiModel || null,
    ai_error: input.aiError || null,
    send_status: input.sendStatus || null,
    raw_payload: input.rawPayload || {},

    from_number:
      input.direction === "inbound"
        ? customerWaId
        : input.metaPhoneNumberId || null,
    to_number:
      input.direction === "inbound"
        ? input.metaPhoneNumberId || null
        : customerWaId,
    phone: `whatsapp:${customerWaId}`,
    profile_name: input.customerName || null,
    message: messageText || null,
    source: input.source || null,
    ai_generated: input.direction === "outbound" && Boolean(input.aiReplied),
    admin_generated: false,
    media_count:
      input.messageType &&
      input.messageType !== "text" &&
      input.direction === "inbound"
        ? 1
        : 0,
  });

  if (error) {
    throw error;
  }
}

function stripInternalHandoverMarker(reply: string) {
  return cleanText(reply)
    .split(KOLKAP_INTERNAL_HANDOVER_MARKER)
    .join("")
    .trim();
}

function getInternalHandoverReason(customerMessage: string) {
  const preview = cleanText(customerMessage)
    .replace(/\s+/g, " ")
    .slice(0, 300);

  return preview
    ? `Customer requested or required human follow-up: ${preview}`
    : "Customer requested or required human follow-up.";
}

function buildConfirmedInternalHandoverReply(customerName?: string | null) {
  const firstName = cleanText(customerName).split(/\s+/).filter(Boolean)[0];
  const opening = firstName ? `Thank you, ${firstName}.` : "Thank you.";

  return `${opening} I’ve passed your message to the Kolkap team and paused the AI so a colleague can take over.

They can follow up with you here on WhatsApp, or by email or phone if you share those contact details.

Please also send your email, business name, and any important details about what you need help with.`;
}

function buildFailedInternalHandoverReply() {
  return `I’m sorry, I couldn’t complete the automatic handover.

Please email support@kolkap.com with your name, business name, and what you need help with so the Kolkap team can assist you.`;
}

async function requestInternalKolkapHandover(input: {
  conversation: InternalConversationRow;
  customerWaId: string;
  customerName?: string | null;
  metaPhoneNumberId?: string | null;
  metaBusinessAccountId?: string | null;
  reason: string;
}) {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("kolkap_whatsapp_conversations")
    .update({
      status: "handover",
      handover_to_admin: true,
      handover_reason: input.reason,
      updated_at: now,
    })
    .eq("id", input.conversation.id)
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    console.error(
      "Failed to create Kolkap internal WhatsApp handover.",
      error?.message || "Conversation was not updated."
    );

    return false;
  }

  try {
    await saveInternalSystemMessage({
      conversationId: input.conversation.id,
      customerWaId: input.customerWaId,
      customerName: input.customerName || null,
      metaPhoneNumberId: input.metaPhoneNumberId || null,
      metaBusinessAccountId: input.metaBusinessAccountId || null,
      messageText: `Conversation handed over to Kolkap admin. ${input.reason}`,
      rawPayload: {
        handover_to_admin: true,
        handover_reason: input.reason,
      },
    });
  } catch (error) {
    console.error(
      "Kolkap handover was saved, but the system message could not be stored.",
      error instanceof Error ? error.message : error
    );
  }

  return true;
}

async function loadInternalConversationHistory(
  conversationId: string
): Promise<KolkapWhatsAppChatMessage[]> {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("kolkap_whatsapp_messages")
    .select("direction, message_text, message")
    .eq("conversation_id", conversationId)
    .in("direction", ["inbound", "outbound"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return ((data ?? []) as StoredInternalMessageRow[])
    .reverse()
    .map<KolkapWhatsAppChatMessage>((item) => ({
      role: item.direction === "outbound" ? "assistant" : "user",
      content: item.message_text || item.message || "",
    }))
    .filter((item) => item.content.trim())
    .slice(-8);
}

async function updateInternalConversationAfterOutbound(input: {
  conversationId: string;
  replyText: string;
}) {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("kolkap_whatsapp_conversations")
    .update({
      last_outbound_at: now,
      last_message: input.replyText,
      last_message_direction: "outbound",
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", input.conversationId);

  if (error) {
    console.error("Failed to update Kolkap WhatsApp conversation.", error);
  }
}

async function saveInternalSystemMessage(input: {
  conversationId: string;
  customerWaId: string;
  customerName?: string | null;
  metaPhoneNumberId?: string | null;
  metaBusinessAccountId?: string | null;
  messageText: string;
  rawPayload?: Record<string, unknown>;
}) {
  await saveInternalWhatsAppMessage({
    conversationId: input.conversationId,
    direction: "system",
    customerWaId: input.customerWaId,
    customerName: input.customerName,
    metaPhoneNumberId: input.metaPhoneNumberId,
    metaBusinessAccountId: input.metaBusinessAccountId,
    messageType: "system",
    messageText: input.messageText,
    aiReplied: false,
    source: "kolkap_whatsapp_system",
    rawPayload: input.rawPayload || {},
  });
}

async function sendAndSaveInternalTextReply(input: {
  conversation: InternalConversationRow;
  customerWaId: string;
  customerName?: string | null;
  metaPhoneNumberId?: string | null;
  metaBusinessAccountId?: string | null;
  inboundMessageId?: string | null;
  replyText: string;
  aiReplied: boolean;
  aiModel?: string | null;
  aiError?: string | null;
}) {
  try {
    const sent = await sendKolkapWhatsAppTextMessage({
      to: input.customerWaId,
      message: input.replyText,
      replyToMessageId: input.inboundMessageId || null,
    });

    await saveInternalWhatsAppMessage({
      conversationId: input.conversation.id,
      direction: "outbound",
      customerWaId: input.customerWaId,
      customerName: input.customerName || null,
      metaPhoneNumberId: input.metaPhoneNumberId || null,
      metaBusinessAccountId: input.metaBusinessAccountId || null,
      metaMessageId: sent.metaMessageId,
      messageType: "text",
      messageText: input.replyText,
      aiReplied: input.aiReplied,
      aiModel: input.aiModel || null,
      aiError: input.aiError || null,
      sendStatus: "sent",
      source: input.aiReplied
        ? "kolkap_whatsapp_ai_meta"
        : "kolkap_whatsapp_meta",
      rawPayload: toRawPayload(sent.raw),
    });

    await updateInternalConversationAfterOutbound({
      conversationId: input.conversation.id,
      replyText: input.replyText,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "WhatsApp reply could not be sent.";

    await saveInternalSystemMessage({
      conversationId: input.conversation.id,
      customerWaId: input.customerWaId,
      customerName: input.customerName || null,
      metaPhoneNumberId: input.metaPhoneNumberId || null,
      metaBusinessAccountId: input.metaBusinessAccountId || null,
      messageText: `WhatsApp send failed: ${message}`,
      rawPayload: {
        error: message,
      },
    });
  }
}

async function handleInternalKolkapIncomingMessage(input: {
  payload: MetaWebhookPayload;
  value: MetaWebhookValue;
  message: MetaMessage;
  contact?: MetaContact;
  businessAccountId?: string | null;
}) {
  const messageId = cleanText(input.message.id);
  const customerWaId = normalizePhone(
    input.message.from || input.contact?.wa_id
  );
  const customerName = cleanText(input.contact?.profile?.name);
  const metaPhoneNumberId = cleanText(input.value.metadata?.phone_number_id);
  const metaBusinessAccountId = getBusinessAccountId(input.businessAccountId);
  const messageType = cleanText(input.message.type, "unknown");
  const messageText =
    messageType === "text"
      ? cleanText(input.message.text?.body)
      : "[Customer sent photo, video, or non-text WhatsApp message]";

  if (!customerWaId || !messageId) {
    return;
  }

  const duplicate = await findExistingInboundMessage(messageId);

  if (duplicate?.id) {
    return;
  }

  const conversation = await getOrCreateInternalConversation({
    customerWaId,
    customerName,
    metaPhoneNumberId,
    metaBusinessAccountId,
    messageText,
  });

  await saveInternalWhatsAppMessage({
    conversationId: conversation.id,
    direction: "inbound",
    customerWaId,
    customerName,
    metaPhoneNumberId,
    metaBusinessAccountId,
    metaMessageId: messageId,
    messageType,
    messageText,
    aiReplied: false,
    source: "meta",
    rawPayload: toRawPayload(input.payload),
  });

  if (
    conversation.status === "blocked" ||
    conversation.handover_to_admin ||
    conversation.ai_enabled === false
  ) {
    return;
  }

  if (messageType !== "text" || !messageText) {
    await sendAndSaveInternalTextReply({
      conversation,
      customerWaId,
      customerName,
      metaPhoneNumberId,
      metaBusinessAccountId,
      inboundMessageId: messageId,
      aiReplied: false,
      replyText:
        "Thanks for contacting Kolkap. I can currently reply to text messages. Please type your question about Kolkap, pricing, free trial, credits, WhatsApp AI, website chat, or setup.",
    });

    return;
  }

  const history = await loadInternalConversationHistory(conversation.id);

  const aiResult = await generateKolkapWhatsAppReply({
    message: messageText,
    customerName,
    customerWaId,
    history,
  });

  const needsHumanHandover = aiResult.reply.includes(
    KOLKAP_INTERNAL_HANDOVER_MARKER
  );

  let replyText = stripInternalHandoverMarker(aiResult.reply);

  if (needsHumanHandover) {
    const handoverSaved = await requestInternalKolkapHandover({
      conversation,
      customerWaId,
      customerName,
      metaPhoneNumberId,
      metaBusinessAccountId,
      reason: getInternalHandoverReason(messageText),
    });

    replyText = handoverSaved
      ? buildConfirmedInternalHandoverReply(customerName)
      : buildFailedInternalHandoverReply();
  }

  await sendAndSaveInternalTextReply({
    conversation,
    customerWaId,
    customerName,
    metaPhoneNumberId,
    metaBusinessAccountId,
    inboundMessageId: messageId,
    aiReplied: true,
    aiModel: aiResult.model,
    replyText,
  });
}

/* -------------------------------------------------------------------------- */
/* Webhook extraction and route handlers                                       */
/* -------------------------------------------------------------------------- */

function extractWebhookMessages(payload: MetaWebhookPayload) {
  const items: Array<{
    value: MetaWebhookValue;
    message: MetaMessage;
    contact?: MetaContact;
    businessAccountId?: string | null;
    isBusinessAppEcho: boolean;
  }> = [];

  for (const entry of payload.entry || []) {
    const businessAccountId = cleanText(entry.id);

    for (const change of entry.changes || []) {
      const value = change.value;

      if (!value || value.messaging_product !== "whatsapp") continue;
      const isBusinessAppEcho = change.field === "smb_message_echoes";
      if (change.field !== "messages" && !isBusinessAppEcho) continue;
      const messages = isBusinessAppEcho ? value.message_echoes : value.messages;
      if (!Array.isArray(messages)) continue;

      for (const message of messages) {
        const contact =
          value.contacts?.find(
            (item) => cleanText(item.wa_id) === cleanText(message.from)
          );

        items.push({
          value,
          message,
          contact,
          businessAccountId,
          isBusinessAppEcho,
        });
      }
    }
  }

  return items;
}

async function handleBusinessAppEcho(connection: CustomerWhatsAppConnectionRow, message: MetaMessage) {
  const id = cleanText(message.id);
  const customerPhone = normalizePhone(message.to);
  if (!id || !/^\d{7,15}$/.test(customerPhone) ||
      normalizePhone(message.from) !== normalizePhone(connection.display_phone_number)) return;
  const sentAt = metaTimestamp(message.timestamp);
  if (!sentAt) return;
  const type = cleanText(message.type, "unknown");
  const messageText = type === "text" ? cleanText(message.text?.body).slice(0, 20000)
    : `[WhatsApp Business app activity: ${type}]`;
  const { error } = await getAdminSupabase().rpc("record_whatsapp_business_app_echo", {
    p_connection_id: connection.id, p_meta_message_id: id, p_customer_phone: customerPhone,
    p_message_text: messageText, p_message_type: type, p_sent_at: sentAt,
  });
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = cleanText(searchParams.get("hub.mode"));
  const providedToken = cleanText(searchParams.get("hub.verify_token"));
  const challenge = cleanText(searchParams.get("hub.challenge"));
  const expectedTokens = getVerifyTokens();

  const tokenMatches = expectedTokens.some(
    (expectedToken) => providedToken === expectedToken
  );

  if (mode === "subscribe" && tokenMatches && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: "Meta webhook verification failed.",
      mode,
      hasProvidedToken: Boolean(providedToken),
      expectedTokenCount: expectedTokens.length,
      tokenMatches,
      hasChallenge: Boolean(challenge),
    },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  const secrets = getWhatsAppAppSecrets();
  if (secrets.length === 0) {
    console.error("WhatsApp webhook verification is not configured. Set META_APP_SECRET or META_WHATSAPP_APP_SECRET.");
    return NextResponse.json(
      { success: false, error: "WhatsApp webhook is not configured." },
      { status: 503 }
    );
  }
  try {
    const rawBody = await request.text();

    const isSignatureValid = verifyWhatsAppSignature(
      rawBody,
      request.headers.get("x-hub-signature-256"),
      secrets
    );

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, error: "Invalid WhatsApp webhook signature." },
        { status: 401 }
      );
    }

    let payload: MetaWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as MetaWebhookPayload;
      if (!payload || !Array.isArray(payload.entry)) throw new Error("Invalid payload");
    } catch {
      return NextResponse.json({ success: false, error: "Invalid webhook payload." }, { status: 400 });
    }

    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({ success: true, ignored: true });
    }

    const webhookMessages = extractWebhookMessages(payload);
    let incomplete = false;
    // Delivery-only events do not include a messages array.
    for (const entry of payload.entry || []) for (const change of entry.changes || []) {
      if (change.field !== "messages" || change.value?.messaging_product !== "whatsapp") continue;
      const phoneId = cleanText(change.value.metadata?.phone_number_id);
      if (!phoneId || isInternalWhatsAppNumber(phoneId, cleanText(entry.id))) continue;
      try {
        const connection = await findWhatsAppConnection(phoneId);
        if (!connection || connection.meta_waba_id !== cleanText(entry.id)) continue;
        for (const status of change.value.statuses || []) await receiveWhatsAppStatus(connection, status);
      } catch { incomplete = true; }
    }

    for (const item of webhookMessages) {
      try {
      const metaPhoneNumberId = cleanText(
        item.value.metadata?.phone_number_id
      );

      if (!metaPhoneNumberId) continue;

      // Kolkap's support bot must only receive its configured number's messages.
      // It is never a fallback for an unrecognized customer's business number.
      if (isInternalWhatsAppNumber(metaPhoneNumberId, item.businessAccountId || "")) {
        if (item.isBusinessAppEcho) continue;
        await handleInternalKolkapIncomingMessage({
          payload, value: item.value, message: item.message,
          contact: item.contact, businessAccountId: item.businessAccountId,
        });
        continue;
      }
      if (metaPhoneNumberId === process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim()) continue;

      const customerWorkspaceConnection =
        await findWhatsAppConnection(metaPhoneNumberId);

      if (customerWorkspaceConnection?.id &&
          customerWorkspaceConnection.provider === "meta" &&
          customerWorkspaceConnection.meta_waba_id === item.businessAccountId) {
        if (item.isBusinessAppEcho) {
          await handleBusinessAppEcho(customerWorkspaceConnection, item.message);
          continue;
        }
        await receiveWhatsAppMessage(customerWorkspaceConnection, item.message, cleanText(item.contact?.profile?.name));

        continue;
      }

      // Unknown or mismatched numbers are acknowledged without storing messages,
      // generating AI output, using credits, or sending from another number.
      } catch { incomplete = true; }
    }
    if (incomplete) return NextResponse.json({ success: false, error: "Some messages are still processing." }, { status: 503 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Kolkap WhatsApp webhook error.",
      error instanceof Error ? error.message : error
    );

    // Do not acknowledge a failed database/intake operation as successful.
    // Persisted processing steps make incoming Meta retries safe.
    return NextResponse.json({ success: false, error: "WhatsApp intake could not complete." }, { status: 503 });
  }
}
