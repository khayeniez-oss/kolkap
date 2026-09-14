import "server-only";
import { channelDatabase, channelRpc, ChannelError } from "./server";
import { asksForHuman, isUuid, isWhatsAppWindowOpen, metaTimestamp } from "./policy";
import { hasUsableWhatsAppSecret } from "./webhookSecurity";
import { sendMetaWhatsAppPayload, sendMetaWhatsAppTextMessage, WhatsAppSendError } from "./sendMessage";
import { runKolkapBrain } from "@/lib/kolkap-ai/brain";
import { KOLKAP_WHATSAPP_REPLY_MIN_CREDITS } from "@/lib/kolkapPlan";
import { createKolkapNotification } from "@/lib/kolkap-notifications/createNotification";

export type WhatsAppConnection = {
  id: string; workspace_id: string; owner_user_id: string; provider: string; status: string;
  meta_phone_number_id: string | null; meta_waba_id: string | null; display_phone_number: string | null;
  selected_ai_staff_id: string | null; ai_enabled: boolean; auto_reply_enabled: boolean; handover_enabled: boolean;
};
export type WhatsAppJob = {
  id: string; workspace_id: string; connection_id: string; conversation_id: string; phase: string;
  reply_kind: string; reply_text: string | null; reply_payload: Record<string, unknown> | null;
  lease_token: string | null; ai_staff_id: string | null; handover_version: number;
  inbound_message_id: string | null; meta_inbound_id: string | null; outbound_message_id: string | null;
  credits_recorded: number; credit_cost: number; error_message: string | null; delivery_status: string | null;
};

export async function findWhatsAppConnection(phoneNumberId: string) {
  const { data, error } = await channelDatabase().from("workspace_whatsapp_connections").select("*")
    .eq("provider", "meta").eq("meta_phone_number_id", phoneNumberId).maybeSingle();
  if (error) throw new ChannelError("Number could not be loaded.", 503);
  return data as WhatsAppConnection | null;
}

export async function whatsappCredentials(connection: WhatsAppConnection) {
  const { data, error } = await channelDatabase().from("whatsapp_connection_secrets")
    .select("workspace_id,meta_access_token,meta_token_expires_at").eq("connection_id", connection.id)
    .eq("workspace_id", connection.workspace_id).maybeSingle();
  if (error) throw new ChannelError("Connection could not be checked.", 503);
  if (!hasUsableWhatsAppSecret(data, connection.workspace_id) || !connection.meta_phone_number_id) {
    throw new ChannelError("Reconnect this WhatsApp number before sending replies.", 409, "reconnect_required");
  }
  return { accessToken: data!.meta_access_token as string, phoneNumberId: connection.meta_phone_number_id };
}

export async function whatsappCredits(workspaceId: string, required: number) {
  const { data, error } = await channelDatabase().from("workspace_credit_balances")
    .select("plan_credits,purchased_credits,used_credits").eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw new ChannelError("Credit balance could not be checked.", 503);
  if (!data || Number(data.plan_credits) + Number(data.purchased_credits) - Number(data.used_credits) < required) {
    throw new ChannelError("Not enough credits for this reply. Add credits and try again.", 402, "not_enough_credits");
  }
}

export function whatsappStep(jobId: string, action: string, token: string | null = null, data: Record<string, unknown> = {}) {
  return channelRpc<WhatsAppJob>("whatsapp_job_step", { p_job_id: jobId, p_action: action, p_token: token, p_data: data });
}

export async function processWhatsAppJob(jobId: string) {
  const claim = await channelRpc<{ action: string; job?: WhatsAppJob }>("whatsapp_job_step", {
    p_job_id: jobId, p_action: "claim", p_token: null, p_data: {},
  });
  if (claim.action === "busy") throw new ChannelError("This conversation is processing a reply. Try again shortly.", 503, "processing");
  let job = claim.job!;
  if (claim.action === "done") return job;
  const token = job.lease_token;
  const db = channelDatabase();
  try {
    const [{ data: connection, error: connectionError }, { data: conversation, error: conversationError }] = await Promise.all([
      db.from("workspace_whatsapp_connections").select("*").eq("id", job.connection_id).eq("workspace_id", job.workspace_id).single(),
      db.from("customer_conversations").select("*").eq("id", job.conversation_id).eq("workspace_id", job.workspace_id).single(),
    ]);
    if (connectionError || conversationError) throw new ChannelError("Conversation could not be loaded.", 503);
    let credentials;
    try { credentials = await whatsappCredentials(connection); }
    catch (error) {
      if (!(error instanceof ChannelError) || error.status >= 500) throw error;
      return await whatsappStep(job.id, "skip", token, { code: error.code, message: error.message });
    }
    if (claim.action === "generate") {
      if (connection.status !== "connected" || !connection.ai_enabled || !connection.auto_reply_enabled ||
        conversation.handover_requested || conversation.handover_version !== job.handover_version ||
        !job.ai_staff_id || connection.selected_ai_staff_id !== job.ai_staff_id ||
        !isWhatsAppWindowOpen(conversation.whatsapp_last_customer_at)) {
        return await whatsappStep(job.id, "skip", token, { code: "ai_paused", message: "AI is paused, unavailable, or the reply window has closed." });
      }
      const { data: staff, error: staffError } = await db.from("ai_staff").select("id,status").eq("id", job.ai_staff_id)
        .eq("workspace_id", job.workspace_id).is("deleted_at", null).maybeSingle();
      if (staffError) throw new ChannelError("AI staff could not be checked.", 503);
      if (!staff || ["deleted", "disabled", "inactive", "archived"].includes(String(staff.status).toLowerCase())) {
        return await whatsappStep(job.id, "skip", token, { code: "ai_unavailable", message: "Choose active AI staff for this number." });
      }
      try { await whatsappCredits(job.workspace_id, job.credit_cost); }
      catch (error) {
        if (!(error instanceof ChannelError) || error.status >= 500) throw error;
        return await whatsappStep(job.id, "skip", token, { code: error.code, message: error.message });
      }
      const { data: incoming, error } = await db.from("customer_messages").select("message_text").eq("id", job.inbound_message_id).single();
      if (error) throw new ChannelError("Customer message could not be loaded.", 503);
      const result = await runKolkapBrain({ userId: connection.owner_user_id, workspaceId: job.workspace_id,
        task: "customer_reply", channel: "whatsapp", aiStaffId: job.ai_staff_id, conversationId: job.conversation_id,
        customerName: conversation.customer_name || "", customerPhone: conversation.customer_phone || "",
        customerMessage: incoming.message_text, language: "auto", tone: "professional", uiLanguage: "auto",
        extraInstructions: "Reply using this business's reviewed knowledge. Be clear and concise. Do not claim a payment, booking, or other action has completed unless the supplied business data confirms it.",
      });
      job = await whatsappStep(job.id, "ready", token, { text: result.content.trim().slice(0, 4096),
        metadata: { model: result.model, knowledge_count: result.knowledgeCount, ai_staff_id: result.aiStaffId, fallback: result.fallback } });
    }
    job = await whatsappStep(job.id, "begin_send", token);
    if (job.phase !== "sending") return job;
    let sent;
    try {
      sent = job.reply_kind === "template" ? await sendMetaWhatsAppPayload({ ...credentials, payload: {
        messaging_product: "whatsapp", to: conversation.customer_phone, type: "template", template: job.reply_payload,
        biz_opaque_callback_data: job.id,
      } }) : await sendMetaWhatsAppTextMessage({ ...credentials, to: conversation.customer_phone,
        message: job.reply_text || "", callbackId: job.id });
    } catch (error) {
      if (!(error instanceof WhatsAppSendError)) throw error;
      return await whatsappStep(job.id, error.uncertain ? "unknown" : "failed", token, { code: error.code, message: error.message });
    }
    // If this write fails, do not resend. Signed delivery callbacks can reconcile it.
    return await whatsappStep(job.id, "accepted", token, { meta_message_id: sent.metaMessageId, status: "sent", at: new Date().toISOString() });
  } catch (error) {
    await whatsappStep(job.id, "release", token).catch(() => {});
    throw error;
  }
}

export async function receiveWhatsAppMessage(connection: WhatsAppConnection, message: { id?: string; from?: string; timestamp?: string; type?: string; text?: { body?: string } }, customerName: string) {
  const at = metaTimestamp(message.timestamp);
  const phone = String(message.from || "").replace(/\D/g, "");
  if (!message.id || !at || !/^\d{7,15}$/.test(phone)) return;
  const isText = message.type === "text" && Boolean(message.text?.body?.trim());
  const body = isText ? message.text!.body!.trim().slice(0, 20000) : `[WhatsApp ${message.type || "unsupported"} message — review in WhatsApp]`;
  if (connection.status === "pending") {
    try {
      await whatsappCredentials(connection);
      const { error } = await channelDatabase().from("workspace_whatsapp_connections").update({ status: "connected", last_error_message: null, last_error_code: null })
        .eq("id", connection.id).eq("status", "pending");
      if (error) throw new ChannelError("Number status could not be saved.", 503);
      connection.status = "connected";
    } catch (error) { if (!(error instanceof ChannelError) || error.status >= 500) throw error; }
  }
  const pause = asksForHuman(body) || (!isText && connection.handover_enabled);
  const result = await channelRpc<{ job?: WhatsAppJob; created: boolean }>("receive_workspace_whatsapp_message", {
    p_connection_id: connection.id, p_meta_message_id: message.id, p_customer_phone: phone, p_customer_name: customerName,
    p_message_text: body, p_message_type: message.type || "unknown", p_sent_at: at,
    p_ai_staff_id: isText ? connection.selected_ai_staff_id : null, p_handover: pause,
    p_credit_cost: KOLKAP_WHATSAPP_REPLY_MIN_CREDITS, p_raw: message,
  });
  if (!result.job) return;
  if (result.created) await createKolkapNotification({ workspaceId: connection.workspace_id, ownerUserId: connection.owner_user_id,
    recipientUserId: connection.owner_user_id, type: pause ? "whatsapp_handover_requested" : "whatsapp_message_received", channel: "whatsapp",
    title: pause ? "WhatsApp customer needs your team" : "New WhatsApp message", message: `${customerName || phone}: ${body.slice(0, 140)}`,
    actionLabel: "Open Inbox", actionUrl: "/dashboard/inbox", priority: pause ? "high" : "normal", sourceTable: "customer_messages",
    sourceRecordId: result.job.inbound_message_id!, metadata: { conversation_id: result.job.conversation_id, connection_id: connection.id },
  }).catch(() => console.error("WhatsApp notification could not be saved."));
  await processWhatsAppJob(result.job.id);
}

export async function receiveWhatsAppStatus(connection: WhatsAppConnection, status: Record<string, unknown>) {
  const at = metaTimestamp(status.timestamp);
  if (typeof status.id !== "string" || !at || !["sent", "delivered", "read", "failed"].includes(String(status.status))) return;
  let query = channelDatabase().from("whatsapp_message_jobs").select("id,conversation_id").eq("connection_id", connection.id).eq("workspace_id", connection.workspace_id);
  query = isUuid(status.biz_opaque_callback_data) ? query.eq("id", status.biz_opaque_callback_data) : query.eq("meta_outbound_id", status.id);
  const { data: job, error } = await query.maybeSingle();
  if (error) throw new ChannelError("Delivery update could not be read.", 503);
  if (!job) return; // Older releases have no job; never guess another number or conversation.
  const { data: conversation, error: conversationError } = await channelDatabase().from("customer_conversations")
    .select("customer_phone").eq("id", job.conversation_id).single();
  if (conversationError) throw new ChannelError("Delivery recipient could not be checked.", 503);
  if (status.recipient_id && String(status.recipient_id).replace(/\D/g, "") !== conversation.customer_phone) return;
  const errors = status.errors as Array<{ code?: number }> | undefined;
  await whatsappStep(job.id, "receipt", null, { meta_message_id: status.id, status: status.status, at,
    code: String(errors?.[0]?.code || ""), error: status.status === "failed" ? `Meta could not deliver the message${errors?.[0]?.code ? ` (code ${errors[0].code})` : ""}.` : null });
}
