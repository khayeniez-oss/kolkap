import { decryptEmailSecret } from "@/lib/email/crypto";
import { gmailStopWatch, revokeGoogleToken } from "@/lib/email/google";
import { emailAccessToken, type EmailConnection } from "@/lib/email/server";
import {
  channelAccess,
  channelErrorResponse,
  ChannelError,
} from "@/lib/whatsapp/server";
import { isUuid } from "@/lib/whatsapp/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = typeof body.workspace_id === "string" ? body.workspace_id : "";
    const connectionId = typeof body.connection_id === "string" ? body.connection_id : "";
    const { db, user, workspace } = await channelAccess(request, workspaceId, "settings");
    if (workspace.owner_user_id !== user.id) {
      throw new ChannelError(
        "Only the workspace owner can disconnect a Google mailbox.",
        403
      );
    }
    if (!isUuid(connectionId)) throw new ChannelError("Choose a valid mailbox.");

    const [{ data: row, error }, { data: secret }] = await Promise.all([
      db
        .from("workspace_email_connections")
        .select("*")
        .eq("id", connectionId)
        .eq("workspace_id", workspaceId)
        .neq("status", "revoked")
        .maybeSingle(),
      db
        .from("email_connection_secrets")
        .select("refresh_token_ciphertext")
        .eq("connection_id", connectionId)
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
    ]);
    if (error || !row) throw new ChannelError("Mailbox connection was not found.", 404);
    const connection = row as EmailConnection;

    try {
      const accessToken = await emailAccessToken(connection);
      await gmailStopWatch(accessToken);
    } catch {
      // Local revocation still prevents Kolkap from accessing the mailbox.
    }
    try {
      if (secret?.refresh_token_ciphertext) {
        await revokeGoogleToken(
          decryptEmailSecret(
            secret.refresh_token_ciphertext,
            "google-refresh-token"
          )
        );
      }
    } catch {
      // The encrypted token is deleted below even if Google's revoke endpoint is unavailable.
    }

    await Promise.all([
      db
        .from("channel_ai_assignments")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("channel_type", "email")
        .eq("channel_connection_id", connectionId),
      db
        .from("email_connection_secrets")
        .delete()
        .eq("connection_id", connectionId)
        .eq("workspace_id", workspaceId),
    ]);
    const { error: updateError } = await db
      .from("workspace_email_connections")
      .update({
        status: "revoked",
        ai_enabled: false,
        auto_reply_enabled: false,
        is_primary: false,
        watch_expiration: null,
        last_error_at: null,
        last_error_code: null,
        last_error_message: null,
      })
      .eq("id", connectionId)
      .eq("workspace_id", workspaceId);
    if (updateError) throw new ChannelError("Mailbox could not be disconnected.", 503);

    return Response.json({ success: true });
  } catch (error) {
    return channelErrorResponse(error);
  }
}
