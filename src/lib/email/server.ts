import "server-only";

import { runKolkapBrain } from "@/lib/kolkap-ai/brain";
import {
  channelDatabase,
  channelRpc,
  ChannelError,
} from "@/lib/whatsapp/server";

import { decryptEmailSecret } from "./crypto";
import {
  buildGmailReply,
  emailSiteUrl,
  gmailSend,
  gmailWatch,
  googleEmailConfig,
  GoogleEmailError,
  refreshGoogleAccessToken,
} from "./google";

export type EmailConnection = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  provider: "google";
  mailbox_email: string | null;
  status: string;
  granted_scopes: string[];
  selected_ai_staff_id: string | null;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  handover_enabled: boolean;
  is_primary: boolean;
  last_history_id: string | null;
  last_history_sync_at: string | null;
  watch_expiration: string | null;
};

export type EmailJob = {
  id: string;
  workspace_id: string;
  connection_id: string;
  conversation_id: string;
  request_key: string;
  inbound_message_id: string | null;
  gmail_inbound_id: string | null;
  outbound_message_id: string | null;
  gmail_outbound_id: string | null;
  rfc_outbound_message_id: string | null;
  reply_kind: "ai" | "human" | "suggestion";
  reply_text: string | null;
  reply_payload: Record<string, unknown> | null;
  ai_staff_id: string | null;
  requested_by_user_id: string | null;
  phase: string;
  lease_token: string | null;
  handover_version: number;
  credit_cost: number;
  credits_recorded: number;
  delivery_status: string | null;
  error_code: string | null;
  error_message: string | null;
};

type EmailConversation = {
  id: string;
  workspace_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  ai_staff_id: string | null;
  email_connection_id: string | null;
  email_thread_id: string | null;
  email_subject: string | null;
  email_last_customer_at: string | null;
  handover_requested: boolean;
  handover_version: number;
};

export type EmailSuggestionOptions = {
  language?: string;
  tone?: string;
  extraInstructions?: string;
  uiLanguage?: string;
};

export function emailStep(
  jobId: string,
  action: string,
  token: string | null = null,
  data: Record<string, unknown> = {}
) {
  return channelRpc<EmailJob>("email_job_step", {
    p_job_id: jobId,
    p_action: action,
    p_token: token,
    p_data: data,
  });
}

export async function findEmailConnectionByMailbox(mailboxEmail: string) {
  const { data, error } = await channelDatabase()
    .from("workspace_email_connections")
    .select("*")
    .eq("provider", "google")
    .eq("mailbox_email", mailboxEmail.trim().toLowerCase())
    .eq("status", "connected")
    .maybeSingle();
  if (error) throw new ChannelError("Mailbox connection could not be loaded.", 503);
  return (data || null) as EmailConnection | null;
}

async function markReauthorizationRequired(
  connection: EmailConnection,
  error: GoogleEmailError
) {
  await channelDatabase()
    .from("workspace_email_connections")
    .update({
      status: "reauthorization_required",
      ai_enabled: false,
      auto_reply_enabled: false,
      last_error_at: new Date().toISOString(),
      last_error_code: error.code,
      last_error_message: "Reconnect this Google mailbox to continue.",
    })
    .eq("id", connection.id)
    .eq("workspace_id", connection.workspace_id);
}

export async function emailAccessToken(connection: EmailConnection) {
  const db = channelDatabase();
  const { data: secret, error } = await db
    .from("email_connection_secrets")
    .select("refresh_token_ciphertext,token_key_version")
    .eq("connection_id", connection.id)
    .eq("workspace_id", connection.workspace_id)
    .maybeSingle();
  if (error) throw new ChannelError("Mailbox credentials could not be loaded.", 503);
  if (!secret?.refresh_token_ciphertext) {
    throw new ChannelError(
      "Reconnect this Google mailbox before continuing.",
      409,
      "reconnect_required"
    );
  }

  let refreshToken: string;
  try {
    refreshToken = decryptEmailSecret(
      secret.refresh_token_ciphertext,
      "google-refresh-token"
    );
  } catch {
    throw new ChannelError(
      "Mailbox credentials could not be decrypted. Reconnect this mailbox.",
      409,
      "reconnect_required"
    );
  }

  try {
    const token = await refreshGoogleAccessToken(refreshToken);
    await db
      .from("email_connection_secrets")
      .update({ last_refreshed_at: new Date().toISOString() })
      .eq("connection_id", connection.id)
      .eq("workspace_id", connection.workspace_id);
    return token.access_token;
  } catch (tokenError) {
    if (
      tokenError instanceof GoogleEmailError &&
      (tokenError.code === "invalid_grant" || tokenError.status === 401)
    ) {
      await markReauthorizationRequired(connection, tokenError);
      throw new ChannelError(
        "Reconnect this Google mailbox before continuing.",
        409,
        "reconnect_required"
      );
    }
    throw tokenError;
  }
}

export function emailRfcMessageId(jobId: string) {
  let host = "mail.kolkap.com";
  try {
    host = new URL(emailSiteUrl()).hostname.replace(/[^a-z0-9.-]/gi, "") || host;
  } catch {
    // Use the stable Kolkap domain when a local site URL is malformed.
  }
  return `<kolkap-email-${jobId}@${host}>`;
}

async function loadEmailJobContext(job: EmailJob) {
  const db = channelDatabase();
  const [connectionResult, conversationResult] = await Promise.all([
    db
      .from("workspace_email_connections")
      .select("*")
      .eq("id", job.connection_id)
      .eq("workspace_id", job.workspace_id)
      .single(),
    db
      .from("customer_conversations")
      .select("*")
      .eq("id", job.conversation_id)
      .eq("workspace_id", job.workspace_id)
      .single(),
  ]);
  if (connectionResult.error || conversationResult.error) {
    throw new ChannelError("Email conversation could not be loaded.", 503);
  }
  return {
    connection: connectionResult.data as EmailConnection,
    conversation: conversationResult.data as EmailConversation,
  };
}

async function generateEmailReply(
  job: EmailJob,
  connection: EmailConnection,
  conversation: EmailConversation,
  options: EmailSuggestionOptions
) {
  const db = channelDatabase();
  let query = db
    .from("customer_messages")
    .select("id,message_text")
    .eq("conversation_id", conversation.id)
    .eq("workspace_id", job.workspace_id)
    .eq("sender_type", "customer")
    .order("created_at", { ascending: false })
    .limit(1);
  if (job.inbound_message_id) query = query.eq("id", job.inbound_message_id);
  const { data: incoming, error } = await query.maybeSingle();
  if (error || !incoming?.message_text) {
    throw new ChannelError("Customer email could not be loaded.", 503);
  }

  return runKolkapBrain({
    userId: connection.owner_user_id,
    workspaceId: job.workspace_id,
    task: job.reply_kind === "suggestion" ? "inbox_reply" : "customer_reply",
    channel: "email",
    aiStaffId: job.ai_staff_id,
    conversationId: job.conversation_id,
    customerName: conversation.customer_name,
    customerPhone: conversation.customer_phone,
    customerEmail: conversation.customer_email,
    customerMessage: incoming.message_text,
    language: options.language || "auto",
    tone: options.tone || "professional",
    uiLanguage: options.uiLanguage || "auto",
    extraInstructions:
      options.extraInstructions ||
      (job.reply_kind === "suggestion"
        ? "Write a helpful email reply for a human team member to review. Output only the reply body and do not say it was sent."
        : "Reply as a concise, helpful business email. Output only the email body. Do not claim a booking, payment, refund, or other action completed unless the supplied business data confirms it."),
  });
}

function googleFailureAction(error: unknown) {
  if (error instanceof GoogleEmailError) {
    const uncertain = error.uncertain || error.status === 429 || error.status >= 500;
    return {
      action: uncertain ? "unknown" : "failed",
      code: error.code,
      message: uncertain
        ? "Gmail delivery could not be confirmed. Kolkap will reconcile the Sent folder before any retry."
        : error.message,
    };
  }
  return {
    action: "unknown",
    code: "delivery_unconfirmed",
    message:
      "Gmail delivery could not be confirmed. Kolkap will reconcile the Sent folder before any retry.",
  };
}

export async function processEmailJob(
  jobId: string,
  options: EmailSuggestionOptions = {}
) {
  const claim = await channelRpc<{ action: string; job?: EmailJob }>(
    "email_job_step",
    { p_job_id: jobId, p_action: "claim", p_token: null, p_data: {} }
  );
  if (claim.action === "busy") {
    throw new ChannelError(
      "This email conversation is processing another reply. Try again shortly.",
      503,
      "processing"
    );
  }
  if (!claim.job) throw new ChannelError("Email job could not be loaded.", 503);
  let job = claim.job;
  if (claim.action === "done") return job;
  const token = job.lease_token;

  try {
    const { connection, conversation } = await loadEmailJobContext(job);

    if (claim.action === "generate") {
      const result = await generateEmailReply(job, connection, conversation, options);
      job = await emailStep(job.id, "ready", token, {
        text: result.content.trim().slice(0, 100_000),
        metadata: {
          model: result.model,
          knowledge_count: result.knowledgeCount,
          ai_staff_id: result.aiStaffId,
          fallback: result.fallback,
        },
      });
    }

    if (job.reply_kind === "suggestion" || job.phase === "generated") return job;
    if (job.phase !== "ready") return job;
    if (!conversation.customer_email || !conversation.email_thread_id || !connection.mailbox_email) {
      return emailStep(job.id, "skip", token, {
        code: "missing_recipient",
        message: "This email conversation has no confirmed recipient or Gmail thread.",
      });
    }

    // Refresh credentials before the irreversible send transition. If Google
    // requires reauthorization, the ready job remains safely retryable.
    const accessToken = await emailAccessToken(connection);
    const rfcMessageId = emailRfcMessageId(job.id);
    const { data: inboundLog, error: logError } = await channelDatabase()
      .from("email_message_logs")
      .select("rfc_message_id,provider_metadata")
      .eq("connection_id", connection.id)
      .eq("conversation_id", conversation.id)
      .eq("direction", "inbound")
      .order("message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (logError) throw new ChannelError("Email thread headers could not be loaded.", 503);
    const metadata = (inboundLog?.provider_metadata || {}) as Record<string, unknown>;
    const raw = buildGmailReply({
      from: connection.mailbox_email,
      to: conversation.customer_email,
      subject: conversation.email_subject || "Your enquiry",
      text: job.reply_text || "",
      rfcMessageId,
      inReplyTo: inboundLog?.rfc_message_id || null,
      references: typeof metadata.references === "string" ? metadata.references : null,
    });

    // Nothing after this transition may run except the Gmail send itself and
    // its accepted/failed/unknown reconciliation write.
    job = await emailStep(job.id, "begin_send", token, {
      rfc_message_id: rfcMessageId,
    });
    if (job.phase !== "sending") return job;

    let sent: { id?: string; threadId?: string };
    try {
      sent = await gmailSend(accessToken, {
        raw,
        threadId: conversation.email_thread_id,
      });
    } catch (sendError) {
      const failure = googleFailureAction(sendError);
      return emailStep(job.id, failure.action, token, {
        code: failure.code,
        message: failure.message,
      });
    }

    if (!sent.id) {
      return emailStep(job.id, "unknown", token, {
        code: "missing_gmail_message_id",
        message:
          "Gmail accepted the request without a message ID. Kolkap will reconcile the Sent folder before any retry.",
      });
    }

    return emailStep(job.id, "accepted", token, {
      gmail_message_id: sent.id,
      rfc_message_id: rfcMessageId,
      at: new Date().toISOString(),
      metadata: { gmail_thread_id: sent.threadId || conversation.email_thread_id },
    });
  } catch (error) {
    await emailStep(job.id, "release", token).catch(() => {});
    throw error;
  }
}

export function processEmailSuggestion(
  jobId: string,
  options: EmailSuggestionOptions = {}
) {
  return processEmailJob(jobId, options);
}

export async function renewEmailWatch(connection: EmailConnection) {
  const accessToken = await emailAccessToken(connection);
  const topicName = googleEmailConfig().topicName;
  const result = await gmailWatch(accessToken, topicName);
  const historyId = result.historyId?.trim();
  const expirationMs = Number(result.expiration);
  if (!historyId || !/^\d+$/.test(historyId) || !Number.isFinite(expirationMs)) {
    throw new ChannelError("Gmail returned an invalid watch response.", 502);
  }

  return channelRpc<EmailConnection>("save_workspace_email_watch", {
    p_connection_id: connection.id,
    p_history_id: historyId,
    p_watch_expiration: new Date(expirationMs).toISOString(),
    p_topic_name: topicName,
  });
}
