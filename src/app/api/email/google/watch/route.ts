import { timingSafeEqual } from "node:crypto";

import { gmailProfile } from "@/lib/email/google";
import { processGoogleMailboxNotification } from "@/lib/email/intake";
import {
  emailAccessToken,
  renewEmailWatch,
  type EmailConnection,
} from "@/lib/email/server";
import {
  channelAccess,
  channelDatabase,
  channelErrorResponse,
  ChannelError,
} from "@/lib/whatsapp/server";
import { isUuid } from "@/lib/whatsapp/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sameSecret(actual: string, expected: string) {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = typeof body.workspace_id === "string" ? body.workspace_id : "";
    const connectionId = typeof body.connection_id === "string" ? body.connection_id : "";
    const { db } = await channelAccess(request, workspaceId, "settings");
    if (!isUuid(connectionId)) throw new ChannelError("Choose a valid mailbox.");
    const { data, error } = await db
      .from("workspace_email_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("workspace_id", workspaceId)
      .neq("status", "revoked")
      .maybeSingle();
    if (error || !data) throw new ChannelError("Mailbox connection was not found.", 404);
    const connection = await renewEmailWatch(data as EmailConnection);
    return Response.json({ success: true, connection });
  } catch (error) {
    return channelErrorResponse(error);
  }
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET?.trim() || "";
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || !sameSecret(actual, expected)) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const db = channelDatabase();
    const checkedAt = new Date().toISOString();
    const renewalCutoffMs = Date.now() + 48 * 60 * 60 * 1000;
    const { data, error } = await db
      .from("workspace_email_connections")
      .select("*")
      .eq("provider", "google")
      .eq("status", "connected")
      .order("last_history_sync_at", { ascending: true, nullsFirst: true })
      .limit(10);
    if (error) throw new ChannelError("Email watches could not be loaded.", 503);

    const results = [];
    for (const row of (data || []) as EmailConnection[]) {
      try {
        const accessToken = await emailAccessToken(row);
        const profile = await gmailProfile(accessToken);
        const profileHistoryId = profile.historyId?.trim() || "";
        const mailbox = (row.mailbox_email || profile.emailAddress || "")
          .trim()
          .toLowerCase();
        if (!mailbox || !/^\d+$/.test(profileHistoryId)) {
          throw new ChannelError("Gmail returned an invalid mailbox profile.", 502);
        }

        let syncResult: Awaited<
          ReturnType<typeof processGoogleMailboxNotification>
        > | null = null;
        let renewedConnection: EmailConnection | null = null;
        const savedHistoryId = row.last_history_id?.trim() || "";

        if (!/^\d+$/.test(savedHistoryId)) {
          renewedConnection = await renewEmailWatch(row);
        } else if (BigInt(profileHistoryId) > BigInt(savedHistoryId)) {
          syncResult = await processGoogleMailboxNotification({
            emailAddress: mailbox,
            historyId: profileHistoryId,
          });
          if (
            syncResult.reason === "history_expired" ||
            syncResult.reason === "watch_restarted"
          ) {
            renewedConnection = row;
          }
        }

        const expirationMs = Date.parse(
          renewedConnection?.watch_expiration || row.watch_expiration || ""
        );
        if (
          !renewedConnection &&
          (!Number.isFinite(expirationMs) || expirationMs <= renewalCutoffMs)
        ) {
          renewedConnection = await renewEmailWatch(row);
        }

        await db
          .from("workspace_email_connections")
          .update({ last_history_sync_at: checkedAt })
          .eq("id", row.id)
          .eq("workspace_id", row.workspace_id);

        results.push({
          connection_id: row.id,
          synced: Boolean(syncResult?.processed),
          messages: syncResult?.processed ? syncResult.messages : 0,
          sync_reason: syncResult?.reason || null,
          renewed: Boolean(renewedConnection),
          expiration:
            renewedConnection?.watch_expiration || row.watch_expiration || null,
        });
      } catch {
        results.push({
          connection_id: row.id,
          synced: false,
          renewed: false,
          error: "Mailbox catch-up or watch renewal failed.",
        });
      }
    }
    return Response.json({ success: true, checked: results.length, results });
  } catch (error) {
    return channelErrorResponse(error);
  }
}
