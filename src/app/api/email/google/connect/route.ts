import { buildGoogleAuthorizationUrl } from "@/lib/email/google";
import {
  createGoogleOauthState,
  createPkcePair,
  encryptEmailSecret,
  safeOauthReturnTo,
  sha256Hex,
} from "@/lib/email/crypto";
import {
  channelAccess,
  channelErrorResponse,
  channelRpc,
  ChannelError,
} from "@/lib/whatsapp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = typeof body.workspace_id === "string" ? body.workspace_id : "";
    const { user, workspace } = await channelAccess(request, workspaceId, "settings");
    if (workspace.owner_user_id !== user.id) {
      throw new ChannelError(
        "Only the workspace owner can connect a Google mailbox.",
        403
      );
    }

    const state = createGoogleOauthState();
    const pkce = createPkcePair();
    const returnTo = safeOauthReturnTo(body.return_to);
    await channelRpc("create_email_oauth_state", {
      p_state_hash: sha256Hex(state),
      p_workspace_id: workspaceId,
      p_actor_user_id: user.id,
      p_pkce_verifier_ciphertext: encryptEmailSecret(
        pkce.verifier,
        "oauth-pkce"
      ),
      p_return_to: returnTo,
    });

    return Response.json({
      success: true,
      authorization_url: buildGoogleAuthorizationUrl({
        state,
        codeChallenge: pkce.challenge,
      }),
    });
  } catch (error) {
    return channelErrorResponse(error);
  }
}
