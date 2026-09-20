import "server-only";

import { createKolkapNotification } from "@/lib/kolkap-notifications/createNotification";
import { asksForHuman } from "@/lib/whatsapp/policy";
import {
  channelDatabase,
  channelRpc,
  ChannelError,
} from "@/lib/whatsapp/server";

import {
  gmailHistory,
  gmailMessage,
  GoogleEmailError,
  isAutomaticReplyCandidate,
  parseGmailMessage,
} from "./google";
import {
  emailAccessToken,
  findEmailConnectionByMailbox,
  processEmailJob,
  renewEmailWatch,
  type EmailConnection,
  type EmailJob,
} from "./server";

export type GmailPushData = { emailAddress?: string; historyId?: string };

function safeHistoryId(value: unknown) {
  const clean = typeof value === "string" ? value.trim() : String(value || "");
  return /^\d+$/.test(clean) ? clean : "";
}

function newestHistoryId(first: string, second: string) {
  try {
    return BigInt(first) >= BigInt(second) ? first : second;
  } catch {
    return second || first;
  }
}

async function saveIncomingMessage(
  connection: EmailConnection,
  parsed: NonNullable<ReturnType<typeof parseGmailMessage>>,
  historyId: string
) {
  const requestHuman = asksForHuman(parsed.bodyText);
  const candidate = isAutomaticReplyCandidate(parsed, connection.mailbox_email || "");
  const result = await channelRpc<{
    created?: boolean;
    auto_reply_queued?: boolean;
    message?: { id?: string };
    job?: EmailJob;
  }>("receive_workspace_email_message", {
    p_connection_id: connection.id,
    p_gmail_message_id: parsed.id,
    p_gmail_thread_id: parsed.threadId,
    p_rfc_message_id: parsed.rfcMessageId,
    p_sender_email: parsed.fromEmail,
    p_sender_name: parsed.fromName,
    p_subject: parsed.subject,
    p_body_text: parsed.bodyText,
    p_sent_at: parsed.sentAt,
    p_auto_reply_candidate: candidate,
    p_request_human: requestHuman,
    p_provider_metadata: {
      label_ids: parsed.labelIds,
      history_id: historyId,
      in_reply_to: parsed.inReplyTo,
      references: parsed.references,
    },
  });

  if (result.created && result.message?.id) {
    await createKolkapNotification({
      workspaceId: connection.workspace_id,
      ownerUserId: connection.owner_user_id,
      recipientUserId: connection.owner_user_id,
      type: requestHuman ? "email_handover_requested" : "email_message_received",
      channel: "email",
      title: requestHuman ? "Email customer needs your team" : "New customer email",
      message: `${parsed.fromName || parsed.fromEmail}: ${
        parsed.bodyText.trim().slice(0, 140) || "Email received"
      }`,
      actionLabel: "Open Inbox",
      actionUrl: "/dashboard/inbox",
      priority: requestHuman ? "high" : "normal",
      sourceTable: "customer_messages",
      sourceRecordId: result.message.id,
      metadata: {
        connection_id: connection.id,
        conversation_id: result.job?.conversation_id || null,
      },
    });
  }

  if (
    result.job &&
    ["pending", "generating", "ready"].includes(result.job.phase)
  ) {
    await processEmailJob(result.job.id);
  }
}

async function saveSentMessage(
  connection: EmailConnection,
  parsed: NonNullable<ReturnType<typeof parseGmailMessage>>,
  historyId: string
) {
  const mailbox = connection.mailbox_email?.toLowerCase() || "";
  const customerEmail = [...parsed.toEmails, ...parsed.ccEmails].find(
    (email) => email.toLowerCase() !== mailbox
  );

  if (!customerEmail) {
    if (!parsed.rfcMessageId) return;
    const { data: knownJob, error } = await channelDatabase()
      .from("email_message_jobs")
      .select("id")
      .eq("connection_id", connection.id)
      .eq("rfc_outbound_message_id", parsed.rfcMessageId)
      .maybeSingle();
    if (error) throw new ChannelError("Sent email could not be matched.", 503);
    if (!knownJob) return;
  }

  await channelRpc("record_workspace_email_sent_message", {
    p_connection_id: connection.id,
    p_gmail_message_id: parsed.id,
    p_gmail_thread_id: parsed.threadId,
    p_rfc_message_id: parsed.rfcMessageId,
    p_customer_email: customerEmail || "",
    p_subject: parsed.subject,
    p_body_text: parsed.bodyText,
    p_sent_at: parsed.sentAt,
    p_provider_metadata: {
      label_ids: parsed.labelIds,
      history_id: historyId,
      in_reply_to: parsed.inReplyTo,
      references: parsed.references,
    },
  });
}

async function processHistoryMessage(
  connection: EmailConnection,
  accessToken: string,
  messageId: string,
  historyId: string
) {
  let message;
  try {
    message = await gmailMessage(accessToken, messageId);
  } catch (error) {
    // A message can be deleted between the history event and the fetch.
    if (error instanceof GoogleEmailError && error.status === 404) return;
    throw error;
  }
  const parsed = parseGmailMessage(message);
  if (!parsed) return;

  const labels = new Set(parsed.labelIds);
  if (labels.has("DRAFT") || labels.has("TRASH") || labels.has("SPAM")) return;

  if (labels.has("SENT")) {
    await saveSentMessage(connection, parsed, historyId);
    return;
  }

  if (labels.has("INBOX") && parsed.fromEmail) {
    await saveIncomingMessage(connection, parsed, historyId);
  }
}

export async function processGoogleMailboxNotification(data: GmailPushData) {
  const mailbox = data.emailAddress?.trim().toLowerCase() || "";
  const notificationHistoryId = safeHistoryId(data.historyId);
  if (!mailbox || !notificationHistoryId) {
    throw new ChannelError("Invalid Gmail notification.", 400, "invalid_notification");
  }

  const connection = await findEmailConnectionByMailbox(mailbox);
  if (!connection) return { processed: false, reason: "mailbox_not_connected" };
  const startHistoryId = safeHistoryId(connection.last_history_id);
  if (!startHistoryId) {
    await renewEmailWatch(connection);
    return { processed: false, reason: "watch_restarted" };
  }

  try {
    if (BigInt(notificationHistoryId) <= BigInt(startHistoryId)) {
      return { processed: false, reason: "duplicate_notification" };
    }
  } catch {
    throw new ChannelError("Invalid Gmail history cursor.", 400);
  }

  const accessToken = await emailAccessToken(connection);
  const messageIds = new Map<string, string>();
  let pageToken: string | undefined;
  let finalHistoryId = newestHistoryId(startHistoryId, notificationHistoryId);

  try {
    do {
      const page = await gmailHistory(accessToken, startHistoryId, pageToken);
      finalHistoryId = newestHistoryId(
        finalHistoryId,
        safeHistoryId(page.historyId) || finalHistoryId
      );
      for (const history of page.history || []) {
        const eventHistoryId = safeHistoryId(history.id) || finalHistoryId;
        for (const added of history.messagesAdded || []) {
          const messageId = added.message?.id?.trim();
          if (messageId) messageIds.set(messageId, eventHistoryId);
        }
      }
      pageToken = page.nextPageToken || undefined;
    } while (pageToken);
  } catch (error) {
    if (error instanceof GoogleEmailError && error.status === 404) {
      await renewEmailWatch(connection);
      await createKolkapNotification({
        workspaceId: connection.workspace_id,
        ownerUserId: connection.owner_user_id,
        recipientUserId: connection.owner_user_id,
        type: "email_watch_restarted",
        channel: "email",
        title: "Google Mail sync restarted",
        message:
          "Kolkap renewed the Gmail watch after Google expired the old history cursor. Review Gmail for any messages received during the sync gap.",
        actionLabel: "Open Email Setup",
        actionUrl: "/dashboard/integrations/email",
        priority: "high",
        metadata: { connection_id: connection.id },
      });
      return { processed: false, reason: "history_expired" };
    }
    throw error;
  }

  for (const [messageId, historyId] of messageIds) {
    await processHistoryMessage(connection, accessToken, messageId, historyId);
  }

  const advanced = await channelRpc<boolean>("advance_workspace_email_history", {
    p_connection_id: connection.id,
    p_expected_history_id: startHistoryId,
    p_new_history_id: finalHistoryId,
  });

  return { processed: true, messages: messageIds.size, advanced };
}

export function decodeGmailPushData(value: unknown): GmailPushData | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as GmailPushData;
  } catch {
    return null;
  }
}

export async function markEmailConnectionFailure(
  connectionId: string,
  code: string,
  message: string
) {
  await channelDatabase()
    .from("workspace_email_connections")
    .update({
      last_error_at: new Date().toISOString(),
      last_error_code: code.slice(0, 120),
      last_error_message: message.slice(0, 1000),
    })
    .eq("id", connectionId);
}
