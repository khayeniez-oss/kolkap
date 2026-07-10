import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateKolkapWhatsAppReply,
  type KolkapWhatsAppChatMessage,
} from "@/lib/kolkap-whatsapp-ai/generateReply";
import {
  sendKolkapWhatsAppTextMessage,
  sendMetaWhatsAppTextMessage,
} from "@/lib/whatsapp/sendMessage";
import { runKolkapBrain } from "@/lib/kolkap-ai/brain";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import { createKolkapNotification } from "@/lib/kolkap-notifications/createNotification";
import { KOLKAP_AI_GENERATION_MIN_CREDITS } from "@/lib/kolkapPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTOMER_WHATSAPP_REPLY_CREDIT_COST = KOLKAP_AI_GENERATION_MIN_CREDITS;

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

type CustomerWhatsAppConnectionRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  provider: string;
  status: string;
  connection_label: string | null;
  display_phone_number: string | null;
  meta_phone_number_id: string | null;
  meta_waba_id: string | null;
  meta_business_id: string | null;
  selected_ai_staff_id: string | null;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  handover_enabled: boolean;
};

type WhatsAppSecretRow = {
  connection_id: string;
  workspace_id: string;
  provider: string;
  meta_access_token: string | null;
  meta_token_type: string | null;
  meta_token_expires_at: string | null;
};

type CustomerConversationRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  ai_staff_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_channel: string;
  status: string;
  lead_status: string;
  handover_requested: boolean;
};

type CreditBalanceRow = {
  workspace_id: string;
  owner_user_id: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  status: string;
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

function getMessagePreview(message: string) {
  const clean = cleanText(message).replace(/\s+/g, " ");

  if (clean.length <= 140) return clean;

  return `${clean.slice(0, 137)}...`;
}

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return 0;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

/* -------------------------------------------------------------------------- */
/* Customer workspace WhatsApp flow                                           */
/* -------------------------------------------------------------------------- */

async function findCustomerWorkspaceConnection(metaPhoneNumberId: string) {
  if (!metaPhoneNumberId) return null;

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("workspace_whatsapp_connections")
    .select(
      "id, workspace_id, owner_user_id, provider, status, connection_label, display_phone_number, meta_phone_number_id, meta_waba_id, meta_business_id, selected_ai_staff_id, ai_enabled, auto_reply_enabled, handover_enabled"
    )
    .eq("meta_phone_number_id", metaPhoneNumberId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as CustomerWhatsAppConnectionRow | null;
}

async function findCustomerInboundLog(metaMessageId: string) {
  if (!metaMessageId) return null;

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("whatsapp_message_logs")
    .select("id")
    .eq("meta_message_id", metaMessageId)
    .eq("direction", "inbound")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getCustomerWhatsAppSecret(connectionId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("whatsapp_connection_secrets")
    .select(
      "connection_id, workspace_id, provider, meta_access_token, meta_token_type, meta_token_expires_at"
    )
    .eq("connection_id", connectionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as WhatsAppSecretRow | null;
}

async function getCreditBalance(workspaceId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("workspace_credit_balances")
    .select(
      "workspace_id, owner_user_id, plan_credits, purchased_credits, used_credits, status"
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as CreditBalanceRow | null;
}

async function findOrCreateCustomerConversation(input: {
  connection: CustomerWhatsAppConnectionRow;
  customerName: string;
  customerPhone: string;
  customerMessage: string;
  handoverRequested: boolean;
}) {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("customer_conversations")
    .select(
      "id, workspace_id, owner_user_id, ai_staff_id, customer_name, customer_phone, customer_channel, status, lead_status, handover_requested"
    )
    .eq("workspace_id", input.connection.workspace_id)
    .eq("customer_channel", "whatsapp")
    .eq("customer_phone", input.customerPhone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    const { data: updated, error: updateError } = await supabase
      .from("customer_conversations")
      .update({
        ai_staff_id:
          input.connection.selected_ai_staff_id || existing.ai_staff_id || null,
        customer_name: input.customerName || existing.customer_name || null,
        status: existing.status === "closed" ? "open" : existing.status || "open",
        lead_status: existing.lead_status || "new",
        handover_requested: input.handoverRequested,
        last_message: input.customerMessage,
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select(
        "id, workspace_id, owner_user_id, ai_staff_id, customer_name, customer_phone, customer_channel, status, lead_status, handover_requested"
      )
      .single();

    if (updateError) {
      throw updateError;
    }

    return updated as CustomerConversationRow;
  }

  const { data: created, error: createError } = await supabase
    .from("customer_conversations")
    .insert({
      workspace_id: input.connection.workspace_id,
      owner_user_id: input.connection.owner_user_id,
      ai_staff_id: input.connection.selected_ai_staff_id || null,
      customer_name: input.customerName || null,
      customer_phone: input.customerPhone || null,
      customer_channel: "whatsapp",
      status: "open",
      lead_status: "new",
      handover_requested: input.handoverRequested,
      last_message: input.customerMessage,
      last_message_at: now,
      created_at: now,
      updated_at: now,
    })
    .select(
      "id, workspace_id, owner_user_id, ai_staff_id, customer_name, customer_phone, customer_channel, status, lead_status, handover_requested"
    )
    .single();

  if (createError) {
    throw createError;
  }

  return created as CustomerConversationRow;
}

async function saveCustomerInboxMessage(input: {
  conversation: CustomerConversationRow;
  senderType: "customer" | "ai" | "system";
  messageText: string;
  aiStaffId?: string | null;
}) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("customer_messages")
    .insert({
      conversation_id: input.conversation.id,
      workspace_id: input.conversation.workspace_id,
      owner_user_id: input.conversation.owner_user_id,
      ai_staff_id: input.aiStaffId || input.conversation.ai_staff_id || null,
      sender_type: input.senderType,
      message_text: input.messageText,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data?.id || null;
}

async function saveCustomerWhatsAppLog(input: {
  connection: CustomerWhatsAppConnectionRow;
  conversationId?: string | null;
  customerMessageId?: string | null;
  direction: "inbound" | "outbound" | "system";
  status: string;
  customerPhone: string;
  metaMessageId?: string | null;
  messageType: string;
  messageText?: string | null;
  errorCode?: string | null;
  errorTitle?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
  creditsUsed?: number;
  rawMetaPayload?: Record<string, unknown>;
  rawMetaResponse?: Record<string, unknown>;
}) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("whatsapp_message_logs")
    .insert({
      workspace_id: input.connection.workspace_id,
      connection_id: input.connection.id,
      conversation_id: input.conversationId || null,
      customer_message_id: input.customerMessageId || null,
      direction: input.direction,
      status: input.status,
      customer_phone: input.customerPhone || null,
      display_phone_number: input.connection.display_phone_number || null,
      meta_phone_number_id: input.connection.meta_phone_number_id || null,
      meta_waba_id: input.connection.meta_waba_id || null,
      meta_message_id: input.metaMessageId || null,
      message_type: input.messageType || "text",
      message_text: input.messageText || null,
      error_code: input.errorCode || null,
      error_title: input.errorTitle || null,
      error_message: input.errorMessage || null,
      error_details: input.errorDetails || null,
      credits_used: input.creditsUsed || 0,
      raw_meta_payload: input.rawMetaPayload || null,
      raw_meta_response: input.rawMetaResponse || null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data?.id || null;
}

async function updateCustomerConnection(input: {
  connectionId: string;
  values: Record<string, unknown>;
}) {
  const supabase = getAdminSupabase();

  const { error } = await supabase
    .from("workspace_whatsapp_connections")
    .update({
      ...input.values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.connectionId);

  if (error) {
    console.error("Failed to update customer WhatsApp connection.", error);
  }
}

async function updateCustomerConversationAfterAiReply(input: {
  conversationId: string;
  replyText: string;
}) {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("customer_conversations")
    .update({
      handover_requested: false,
      last_message: input.replyText,
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", input.conversationId);

  if (error) {
    console.error("Failed to update customer conversation after AI reply.", error);
  }
}

async function notifyWorkspaceOwnerAboutWhatsApp(input: {
  connection: CustomerWhatsAppConnectionRow;
  conversation: CustomerConversationRow;
  customerMessageId?: string | null;
  customerName: string;
  customerPhone: string;
  messageText: string;
  needsAttention: boolean;
}) {
  const name = input.customerName || input.customerPhone || "WhatsApp customer";
  const preview = getMessagePreview(input.messageText);

  await createKolkapNotification({
    workspaceId: input.connection.workspace_id,
    ownerUserId: input.connection.owner_user_id,
    recipientUserId: input.connection.owner_user_id,
    type: input.needsAttention
      ? "whatsapp_handover_requested"
      : "whatsapp_message_received",
    channel: "whatsapp",
    title: input.needsAttention
      ? "New WhatsApp message needs attention"
      : "New WhatsApp message",
    message: input.needsAttention
      ? `${name} sent a WhatsApp message and may need human follow-up: "${preview}"`
      : `${name} sent a WhatsApp message: "${preview}"`,
    actionLabel: "Open Inbox",
    actionUrl: "/dashboard/inbox",
    priority: input.needsAttention ? "high" : "normal",
    sourceTable: "customer_messages",
    sourceRecordId: input.customerMessageId || input.conversation.id,
    metadata: {
      conversation_id: input.conversation.id,
      customer_message_id: input.customerMessageId || null,
      customer_phone: input.customerPhone || null,
      customer_name: input.customerName || null,
      connection_id: input.connection.id,
      meta_phone_number_id: input.connection.meta_phone_number_id || null,
      needs_attention: input.needsAttention,
    },
  });
}

async function handleCustomerWorkspaceWhatsAppMessage(input: {
  payload: MetaWebhookPayload;
  value: MetaWebhookValue;
  message: MetaMessage;
  contact?: MetaContact;
  connection: CustomerWhatsAppConnectionRow;
}) {
  const messageId = cleanText(input.message.id);
  const customerPhone = normalizePhone(input.message.from || input.contact?.wa_id);
  const customerName = cleanText(input.contact?.profile?.name);
  const messageType = cleanText(input.message.type, "unknown");
  const messageText =
    messageType === "text"
      ? cleanText(input.message.text?.body)
      : "[Customer sent photo, video, or non-text WhatsApp message]";

  if (!messageId || !customerPhone) {
    return;
  }

  const duplicate = await findCustomerInboundLog(messageId);

  if (duplicate?.id) {
    return;
  }

  const canAttemptAiReply = Boolean(
    input.connection.status === "connected" &&
      input.connection.ai_enabled &&
      input.connection.auto_reply_enabled &&
      input.connection.selected_ai_staff_id &&
      messageType === "text" &&
      messageText
  );

  const handoverRequested = Boolean(
    input.connection.handover_enabled && !canAttemptAiReply
  );

  const conversation = await findOrCreateCustomerConversation({
    connection: input.connection,
    customerName,
    customerPhone,
    customerMessage: messageText,
    handoverRequested,
  });

  const customerMessageId = await saveCustomerInboxMessage({
    conversation,
    senderType: "customer",
    messageText,
    aiStaffId: input.connection.selected_ai_staff_id || null,
  });

  await saveCustomerWhatsAppLog({
    connection: input.connection,
    conversationId: conversation.id,
    customerMessageId,
    direction: "inbound",
    status: "received",
    customerPhone,
    metaMessageId: messageId,
    messageType,
    messageText,
    creditsUsed: 0,
    rawMetaPayload: toRawPayload(input.payload),
  });

  await updateCustomerConnection({
    connectionId: input.connection.id,
    values: {
      last_inbound_at: new Date().toISOString(),
      last_status_at: new Date().toISOString(),
      last_error_at: null,
      last_error_code: null,
      last_error_message: null,
    },
  });

  await notifyWorkspaceOwnerAboutWhatsApp({
    connection: input.connection,
    conversation,
    customerMessageId,
    customerName,
    customerPhone,
    messageText,
    needsAttention: handoverRequested || isConversationAiPaused(conversation),
  });

  if (isConversationAiPaused(conversation)) {
    await saveCustomerWhatsAppLog({
      connection: input.connection,
      conversationId: conversation.id,
      direction: "system",
      status: "skipped",
      customerPhone,
      messageType: "system",
      messageText: "WhatsApp AI reply skipped because AI is paused for this conversation.",
      errorCode: "ai_paused",
      errorMessage: "AI is paused for this conversation.",
      creditsUsed: 0,
      rawMetaPayload: toRawPayload(input.payload),
    });

    return;
  }

  if (!canAttemptAiReply) {
    return;
  }

  const balance = await getCreditBalance(input.connection.workspace_id);
  const creditsLeft = getCreditsLeft(balance);

  if (creditsLeft < CUSTOMER_WHATSAPP_REPLY_CREDIT_COST) {
    await updateCustomerConnection({
      connectionId: input.connection.id,
      values: {
        last_error_at: new Date().toISOString(),
        last_error_code: "not_enough_credits",
        last_error_message: "Not enough credits to send WhatsApp AI reply.",
      },
    });

    await saveCustomerWhatsAppLog({
      connection: input.connection,
      conversationId: conversation.id,
      direction: "system",
      status: "skipped",
      customerPhone,
      messageType: "system",
      messageText: "WhatsApp AI reply skipped because workspace has low credits.",
      errorCode: "not_enough_credits",
      errorMessage: "Not enough credits to send WhatsApp AI reply.",
      creditsUsed: 0,
      rawMetaPayload: toRawPayload(input.payload),
    });

    return;
  }

  const secret = await getCustomerWhatsAppSecret(input.connection.id);

  if (!secret?.meta_access_token) {
    await updateCustomerConnection({
      connectionId: input.connection.id,
      values: {
        last_error_at: new Date().toISOString(),
        last_error_code: "missing_meta_access_token",
        last_error_message:
          "WhatsApp AI reply could not send because the Meta token is missing.",
      },
    });

    await saveCustomerWhatsAppLog({
      connection: input.connection,
      conversationId: conversation.id,
      direction: "system",
      status: "failed",
      customerPhone,
      messageType: "system",
      messageText: "WhatsApp AI reply failed because Meta token is missing.",
      errorCode: "missing_meta_access_token",
      errorMessage: "Meta access token is missing.",
      creditsUsed: 0,
      rawMetaPayload: toRawPayload(input.payload),
    });

    return;
  }

  let aiReply = "";
  let aiModel = "";
  let aiStaffId = input.connection.selected_ai_staff_id || null;

  try {
    const result = await runKolkapBrain({
      userId: input.connection.owner_user_id,
      workspaceId: input.connection.workspace_id,
      task: "customer_reply",
      channel: "whatsapp",
      aiStaffId,
      conversationId: conversation.id,
      customerName,
      customerPhone,
      customerMessage: messageText,
      language: "auto",
      tone: "professional",
      extraInstructions:
        "Reply as the business WhatsApp AI assistant. Keep the reply friendly, clear, and useful. If the customer needs human help, collect the important details and say the team can follow up.",
      uiLanguage: "auto",
    });

    aiReply = result.content;
    aiModel = result.model;
    aiStaffId = result.aiStaffId || aiStaffId;

    await logWorkspaceUsage({
      workspaceId: result.workspaceId,
      userId: input.connection.owner_user_id,
      eventType: "whatsapp_ai_reply_generated",
      channel: "whatsapp",
      sourcePage: "/api/whatsapp/webhook",
      creditsUsed: CUSTOMER_WHATSAPP_REPLY_CREDIT_COST,
      metadata: {
        conversation_id: conversation.id,
        customer_message_id: customerMessageId || null,
        customer_phone: customerPhone,
        meta_inbound_message_id: messageId,
        connection_id: input.connection.id,
        meta_phone_number_id: input.connection.meta_phone_number_id || null,
        model: result.model,
        knowledge_count: result.knowledgeCount,
        fallback: result.fallback,
        ai_staff_id: aiStaffId,
        credit_rule: "customer_whatsapp_ai_reply_minimum",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "WhatsApp AI reply failed.";

    await updateCustomerConnection({
      connectionId: input.connection.id,
      values: {
        last_error_at: new Date().toISOString(),
        last_error_code: "ai_generation_failed",
        last_error_message: errorMessage,
      },
    });

    await saveCustomerWhatsAppLog({
      connection: input.connection,
      conversationId: conversation.id,
      direction: "system",
      status: "failed",
      customerPhone,
      messageType: "system",
      messageText: "WhatsApp AI reply failed during generation.",
      errorCode: "ai_generation_failed",
      errorMessage,
      creditsUsed: 0,
      rawMetaPayload: toRawPayload(input.payload),
    });

    return;
  }

  try {
    const sent = await sendMetaWhatsAppTextMessage({
      to: customerPhone,
      message: aiReply,
      accessToken: secret.meta_access_token,
      phoneNumberId: input.connection.meta_phone_number_id || "",
      replyToMessageId: messageId,
    });

    const aiMessageId = await saveCustomerInboxMessage({
      conversation,
      senderType: "ai",
      messageText: aiReply,
      aiStaffId,
    });

    await updateCustomerConversationAfterAiReply({
      conversationId: conversation.id,
      replyText: aiReply,
    });

    await saveCustomerWhatsAppLog({
      connection: input.connection,
      conversationId: conversation.id,
      customerMessageId: aiMessageId,
      direction: "outbound",
      status: "sent",
      customerPhone,
      metaMessageId: sent.metaMessageId,
      messageType: "text",
      messageText: aiReply,
      creditsUsed: CUSTOMER_WHATSAPP_REPLY_CREDIT_COST,
      rawMetaPayload: toRawPayload(input.payload),
      rawMetaResponse: toRawPayload(sent.raw),
    });

    await updateCustomerConnection({
      connectionId: input.connection.id,
      values: {
        last_outbound_at: new Date().toISOString(),
        last_status_at: new Date().toISOString(),
        last_error_at: null,
        last_error_code: null,
        last_error_message: null,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "WhatsApp AI reply could not send.";

    await updateCustomerConnection({
      connectionId: input.connection.id,
      values: {
        last_error_at: new Date().toISOString(),
        last_error_code: "whatsapp_send_failed",
        last_error_message: errorMessage,
      },
    });

    await saveCustomerWhatsAppLog({
      connection: input.connection,
      conversationId: conversation.id,
      direction: "outbound",
      status: "failed",
      customerPhone,
      messageType: "text",
      messageText: aiReply,
      errorCode: "whatsapp_send_failed",
      errorMessage,
      creditsUsed: CUSTOMER_WHATSAPP_REPLY_CREDIT_COST,
      rawMetaPayload: toRawPayload(input.payload),
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Kolkap internal WhatsApp flow                                               */
/* -------------------------------------------------------------------------- */

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

  await sendAndSaveInternalTextReply({
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

/* -------------------------------------------------------------------------- */
/* Webhook extraction and route handlers                                       */
/* -------------------------------------------------------------------------- */

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

function isConversationAiPaused(value: unknown) {
  return Boolean(
    (value as { handover_requested?: boolean | null })?.handover_requested
  );
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
      const metaPhoneNumberId = cleanText(
        item.value.metadata?.phone_number_id
      );

      const customerWorkspaceConnection =
        await findCustomerWorkspaceConnection(metaPhoneNumberId);

      if (customerWorkspaceConnection?.id) {
        await handleCustomerWorkspaceWhatsAppMessage({
          payload,
          value: item.value,
          message: item.message,
          contact: item.contact,
          connection: customerWorkspaceConnection,
        });

        continue;
      }

      await handleInternalKolkapIncomingMessage({
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