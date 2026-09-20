import { NextResponse } from "next/server";

import {
  decryptEmailSecret,
  encryptEmailSecret,
  safeOauthReturnTo,
  sha256Hex,
} from "@/lib/email/crypto";
import {
  emailSiteUrl,
  exchangeGoogleCode,
  gmailProfile,
  googleUserInfo,
} from "@/lib/email/google";
import { renewEmailWatch, type EmailConnection } from "@/lib/email/server";
import { channelDatabase, channelRpc } from "@/lib/whatsapp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OauthStateRow = {
  workspace_id: string;
  actor_user_id: string;
  pkce_verifier_ciphertext: string;
  return_to: string | null;
};

function callbackRedirect(
  returnTo: string,
  values: Record<string, string>
) {
  const url = new URL(safeOauthReturnTo(returnTo), emailSiteUrl());
  for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

function publicErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code || "");
    if (/^[a-z0-9_]{1,80}$/i.test(code)) return code;
  }
  return "connection_failed";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state")?.trim() || "";
  let oauthState: OauthStateRow | null = null;
  let returnTo = "/dashboard/integrations/email";

  try {
    if (!state) throw new Error("missing_state");
    oauthState = await channelRpc<OauthStateRow>("consume_email_oauth_state", {
      p_state_hash: sha256Hex(state),
    });
    returnTo = safeOauthReturnTo(oauthState.return_to);

    const oauthError = url.searchParams.get("error")?.trim();
    if (oauthError) {
      return callbackRedirect(returnTo, { email_error: oauthError });
    }

    const code = url.searchParams.get("code")?.trim();
    if (!code) throw new Error("missing_code");
    const verifier = decryptEmailSecret(
      oauthState.pkce_verifier_ciphertext,
      "oauth-pkce"
    );
    const tokens = await exchangeGoogleCode(code, verifier);
    const [userinfo, profile] = await Promise.all([
      googleUserInfo(tokens.access_token),
      gmailProfile(tokens.access_token),
    ]);
    const mailbox = (profile.emailAddress || userinfo.email || "").trim().toLowerCase();
    const googleSubject = userinfo.sub?.trim() || "";
    if (!mailbox || !googleSubject || userinfo.email_verified !== true) {
      throw new Error("unverified_google_identity");
    }

    const scopes = (tokens.scope || "")
      .split(/\s+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
    const connection = await channelRpc<EmailConnection>(
      "complete_workspace_email_connection",
      {
        p_workspace_id: oauthState.workspace_id,
        p_actor_user_id: oauthState.actor_user_id,
        p_connection_id: null,
        p_mailbox_email: mailbox,
        p_google_subject: googleSubject,
        p_granted_scopes: scopes,
        p_refresh_token_ciphertext: tokens.refresh_token
          ? encryptEmailSecret(tokens.refresh_token, "google-refresh-token")
          : "",
        p_token_key_version: 1,
        p_initial_history_id: profile.historyId || null,
      }
    );

    try {
      await renewEmailWatch(connection);
    } catch (watchError) {
      await channelDatabase()
        .from("workspace_email_connections")
        .update({
          status: "failed",
          ai_enabled: false,
          auto_reply_enabled: false,
          last_error_at: new Date().toISOString(),
          last_error_code: "watch_setup_failed",
          last_error_message:
            "The mailbox connected, but Gmail notifications could not be started. Retry from Email setup.",
        })
        .eq("id", connection.id)
        .eq("workspace_id", connection.workspace_id);
      throw watchError;
    }

    return callbackRedirect(returnTo, {
      email_connected: "1",
      mailbox,
    });
  } catch (error) {
    console.error("Google mailbox callback failed.", publicErrorCode(error));
    return callbackRedirect(returnTo, { email_error: publicErrorCode(error) });
  }
}
