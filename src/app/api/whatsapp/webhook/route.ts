import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateKolkapWhatsAppReply,
  type KolkapWhatsAppChatMessage,
} from "@/lib/kolkap-whatsapp-ai/generateReply";
import { sendKolkapWhatsAppTextMessage } from "@/lib/whatsapp/sendMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MetaMessage = {
  id?: string;
  from?: string;
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

type ConversationRow = {
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

type StoredMessageRow = {
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

function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;

  if (!appSecret) {
    return true;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = `sha256=${createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signatureHeader, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
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

async function getOrCreateConversation(input: {
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
        status: existing.status === "closed" ? "active" : existing.status || "active",
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

    return updated as ConversationRow;
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

  return created as ConversationRow;
}

async function saveWhatsAppMessage(input: {
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
      input.direction === "inbound" ? customerWaId : input.metaPhoneNumberId || null,
    to_number:
      input.direction === "inbound" ? input.metaPhoneNumberId || null : customerWaId,
    phone: `whatsapp:${customerWaId}`,
    profile_name: input.customerName || null,
    message: messageText || null,
    source: input.source || null,
    ai_generated: input.direction === "outbound" && Boolean(input.aiReplied),
    admin_generated: false,
    media_count:
      input.messageType && input.messageType !== "text" && input.direction === "inbound"
        ? 1
        : 0,
  });

  if (error) {
    throw error;
  }
}

async function loadConversationHistory(
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

  return ((data ?? []) as StoredMessageRow[])
    .reverse()
    .map<KolkapWhatsAppChatMessage>((item) => ({
      role: item.direction === "outbound" ? "assistant" : "user",
      content: item.message_text || item.message || "",
    }))
    .filter((item) => item.content.trim())
    .slice(-8);
}

async function updateConversationAfterOutbound(input: {
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

async function saveSystemMessage(input: {
  conversationId: string;
  customerWaId: string;
  customerName?: string | null;
  metaPhoneNumberId?: string | null;
  metaBusinessAccountId?: string | null;
  messageText: string;
  rawPayload?: Record<string, unknown>;
}) {
  await saveWhatsAppMessage({
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

async function sendAndSaveTextReply(input: {
  conversation: ConversationRow;
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

    await saveWhatsAppMessage({
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
      source: input.aiReplied ? "kolkap_whatsapp_ai_meta" : "kolkap_whatsapp_meta",
      rawPayload: toRawPayload(sent.raw),
    });

    await updateConversationAfterOutbound({
      conversationId: input.conversation.id,
      replyText: input.replyText,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WhatsApp reply could not be sent.";

    await saveSystemMessage({
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

async function handleIncomingMessage(input: {
  payload: MetaWebhookPayload;
  value: MetaWebhookValue;
  message: MetaMessage;
  contact?: MetaContact;
  businessAccountId?: string | null;
}) {
  const messageId = cleanText(input.message.id);
  const customerWaId = normalizePhone(input.message.from || input.contact?.wa_id);
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

  const conversation = await getOrCreateConversation({
    customerWaId,
    customerName,
    metaPhoneNumberId,
    metaBusinessAccountId,
    messageText,
  });

  await saveWhatsAppMessage({
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
    await sendAndSaveTextReply({
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

  const history = await loadConversationHistory(conversation.id);

  const aiResult = await generateKolkapWhatsAppReply({
    message: messageText,
    customerName,
    customerWaId,
    history,
  });

  await sendAndSaveTextReply({
    conversation,
    customerWaId,
    customerName,
    metaPhoneNumberId,
    metaBusinessAccountId,
    inboundMessageId: messageId,
    aiReplied: true,
    aiModel: aiResult.model,
    replyText: aiResult.reply,
  });
}

function extractWebhookMessages(payload: MetaWebhookPayload) {
  const items: Array<{
    value: MetaWebhookValue;
    message: MetaMessage;
    contact?: MetaContact;
    businessAccountId?: string | null;
  }> = [];

  for (const entry of payload.entry || []) {
    const businessAccountId = cleanText(entry.id);

    for (const change of entry.changes || []) {
      const value = change.value;

      if (!value?.messages?.length) {
        continue;
      }

      for (const message of value.messages) {
        const contact =
          value.contacts?.find(
            (item) => cleanText(item.wa_id) === cleanText(message.from)
          ) || value.contacts?.[0];

        items.push({
          value,
          message,
          contact,
          businessAccountId,
        });
      }
    }
  }

  return items;
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
  try {
    const rawBody = await request.text();

    const isSignatureValid = verifyMetaSignature(
      rawBody,
      request.headers.get("x-hub-signature-256")
    );

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, error: "Invalid WhatsApp webhook signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody || "{}") as MetaWebhookPayload;

    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({ success: true, ignored: true });
    }

    const webhookMessages = extractWebhookMessages(payload);

    for (const item of webhookMessages) {
      await handleIncomingMessage({
        payload,
        value: item.value,
        message: item.message,
        contact: item.contact,
        businessAccountId: item.businessAccountId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Kolkap WhatsApp webhook error.",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json({ success: true, error_logged: true });
  }
}