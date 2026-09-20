import "server-only";

import { Buffer } from "node:buffer";

export const GOOGLE_EMAIL_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
] as const;

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

type GoogleErrorBody = {
  error?: string | { code?: number; message?: string; status?: string };
  error_description?: string;
};

export class GoogleEmailError extends Error {
  constructor(
    message: string,
    public status = 503,
    public code = "google_email_error",
    public uncertain = false
  ) {
    super(message);
  }
}

export type GoogleTokenResult = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export type GmailHeader = { name?: string; value?: string };
export type GmailPart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { data?: string; size?: number; attachmentId?: string };
  parts?: GmailPart[];
};
export type GmailMessage = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  historyId?: string;
  payload?: GmailPart;
};

export type ParsedGmailMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  fromEmail: string;
  fromName: string;
  toEmails: string[];
  ccEmails: string[];
  subject: string;
  rfcMessageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  bodyText: string;
  sentAt: string;
  autoSubmitted: string;
  precedence: string;
  listId: string;
  autoResponseSuppress: string;
};

function required(name: string, value: string | undefined) {
  const clean = value?.trim();
  if (!clean) throw new GoogleEmailError(`${name} is not configured.`, 503, "not_configured");
  return clean;
}

export function emailSiteUrl(env: NodeJS.ProcessEnv = process.env) {
  return (
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://www.kolkap.com"
  ).replace(/\/$/, "");
}

export function googleEmailConfig(env: NodeJS.ProcessEnv = process.env) {
  const siteUrl = emailSiteUrl(env);
  return {
    clientId: required("GOOGLE_GMAIL_CLIENT_ID", env.GOOGLE_GMAIL_CLIENT_ID),
    clientSecret: required(
      "GOOGLE_GMAIL_CLIENT_SECRET",
      env.GOOGLE_GMAIL_CLIENT_SECRET
    ),
    redirectUri:
      env.GOOGLE_GMAIL_REDIRECT_URI?.trim() ||
      `${siteUrl}/api/email/google/callback`,
    topicName:
      env.GOOGLE_GMAIL_PUBSUB_TOPIC?.trim() ||
      "projects/kolkap/topics/kolkap-gmail-notifications",
    siteUrl,
  };
}

export function buildGoogleAuthorizationUrl({
  state,
  codeChallenge,
}: {
  state: string;
  codeChallenge: string;
}) {
  const config = googleEmailConfig();
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_EMAIL_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  return url.toString();
}

async function parseGoogleResponse<T>(response: Response, fallback: string) {
  const body = (await response.json().catch(() => ({}))) as T & GoogleErrorBody;
  if (response.ok) return body;

  const nested = typeof body.error === "object" ? body.error : null;
  const message =
    body.error_description ||
    nested?.message ||
    (typeof body.error === "string" ? body.error : "") ||
    fallback;
  const code = nested?.status || (typeof body.error === "string" ? body.error : "") || "google_error";
  throw new GoogleEmailError(message, response.status, code, false);
}

async function tokenRequest(values: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(values),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new GoogleEmailError(
      "Google authentication could not be reached.",
      503,
      "google_unreachable",
      true
    );
  }

  return parseGoogleResponse<GoogleTokenResult>(
    response,
    "Google authentication failed."
  );
}

export async function exchangeGoogleCode(code: string, codeVerifier: string) {
  const config = googleEmailConfig();
  const result = await tokenRequest({
    code,
    code_verifier: codeVerifier,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  if (!result.access_token) {
    throw new GoogleEmailError("Google did not return an access token.", 502, "missing_access_token");
  }

  return result;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const config = googleEmailConfig();
  const result = await tokenRequest({
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  });

  if (!result.access_token) {
    throw new GoogleEmailError("Google did not return an access token.", 502, "missing_access_token");
  }

  return result;
}

async function googleJson<T>(
  url: string,
  accessToken: string,
  init: RequestInit = {},
  timeoutMs = 25_000
) {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new GoogleEmailError(
      "Google Mail could not be reached.",
      503,
      "gmail_unreachable",
      true
    );
  }

  return parseGoogleResponse<T>(response, "Google Mail request failed.");
}

export function googleUserInfo(accessToken: string) {
  return googleJson<{ sub?: string; email?: string; email_verified?: boolean }>(
    GOOGLE_USERINFO_URL,
    accessToken
  );
}

export function gmailProfile(accessToken: string) {
  return googleJson<{ emailAddress?: string; historyId?: string; messagesTotal?: number }>(
    `${GMAIL_API}/profile`,
    accessToken
  );
}

export function gmailWatch(accessToken: string, topicName: string) {
  return googleJson<{ historyId?: string; expiration?: string }>(
    `${GMAIL_API}/watch`,
    accessToken,
    { method: "POST", body: JSON.stringify({ topicName }) }
  );
}

export function gmailStopWatch(accessToken: string) {
  return googleJson<Record<string, never>>(`${GMAIL_API}/stop`, accessToken, {
    method: "POST",
    body: "{}",
  });
}

export function gmailHistory(
  accessToken: string,
  startHistoryId: string,
  pageToken?: string
) {
  const url = new URL(`${GMAIL_API}/history`);
  url.searchParams.set("startHistoryId", startHistoryId);
  url.searchParams.set("historyTypes", "messageAdded");
  url.searchParams.set("maxResults", "500");
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  return googleJson<{
    history?: Array<{
      id?: string;
      messagesAdded?: Array<{ message?: GmailMessage }>;
    }>;
    historyId?: string;
    nextPageToken?: string;
  }>(url.toString(), accessToken);
}

export function gmailMessage(accessToken: string, messageId: string) {
  const url = new URL(`${GMAIL_API}/messages/${encodeURIComponent(messageId)}`);
  url.searchParams.set("format", "full");
  return googleJson<GmailMessage>(url.toString(), accessToken);
}

export function gmailSend(
  accessToken: string,
  input: { raw: string; threadId: string }
) {
  return googleJson<{ id?: string; threadId?: string; labelIds?: string[] }>(
    `${GMAIL_API}/messages/send`,
    accessToken,
    { method: "POST", body: JSON.stringify(input) },
    30_000
  );
}

export async function revokeGoogleToken(token: string) {
  let response: Response;
  try {
    response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      }
    );
  } catch {
    throw new GoogleEmailError(
      "Google could not be reached to revoke this mailbox.",
      503,
      "google_unreachable",
      true
    );
  }

  if (!response.ok) {
    throw new GoogleEmailError(
      "Google could not revoke this mailbox connection.",
      response.status,
      "revoke_failed"
    );
  }
}

function decodeBase64Url(value: string) {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

function htmlToText(html: string) {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectText(part: GmailPart | undefined, type: "text/plain" | "text/html") {
  if (!part) return [] as string[];
  const values: string[] = [];
  if (part.mimeType?.toLowerCase() === type && part.body?.data) {
    values.push(decodeBase64Url(part.body.data));
  }
  for (const child of part.parts || []) values.push(...collectText(child, type));
  return values.filter(Boolean);
}

export function trimQuotedEmail(value: string) {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  let end = lines.length;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (
      /^on .{3,200}wrote:$/i.test(line) ||
      /^-{2,}\s*original message\s*-{2,}$/i.test(line) ||
      (/^from:\s+.+@.+/i.test(line) &&
        lines.slice(index, index + 5).some((item) => /^sent:\s+/i.test(item.trim()))) ||
      (line.startsWith(">") && index > 0)
    ) {
      end = index;
      break;
    }
  }
  const current = lines.slice(0, end).join("\n").trim();
  return current || value.trim();
}

function headerMap(headers: GmailHeader[] = []) {
  const result = new Map<string, string>();
  for (const header of headers) {
    const name = header.name?.trim().toLowerCase();
    if (name && !result.has(name)) result.set(name, header.value?.trim() || "");
  }
  return result;
}

export function parseEmailAddress(value: string) {
  const clean = value.replace(/[\r\n]/g, " ").trim();
  const bracket = clean.match(/^(.*)<([^<>\s]+@[^<>\s]+)>$/);
  const email = (bracket?.[2] || clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "")
    .trim()
    .toLowerCase();
  const name = (bracket?.[1] || "").replace(/^\s*["']|["']\s*$/g, "").trim();
  return { email, name };
}

export function parseEmailAddressList(value: string) {
  return value
    .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
    .map((item) => parseEmailAddress(item).email)
    .filter(Boolean);
}

export function parseGmailMessage(message: GmailMessage): ParsedGmailMessage | null {
  const id = message.id?.trim();
  const threadId = message.threadId?.trim();
  if (!id || !threadId) return null;

  const headers = headerMap(message.payload?.headers);
  const plain = collectText(message.payload, "text/plain").join("\n\n").trim();
  const html = collectText(message.payload, "text/html").join("\n\n").trim();
  const rootBody = message.payload?.body?.data
    ? decodeBase64Url(message.payload.body.data)
    : "";
  const bodyText = trimQuotedEmail(
    plain || (html ? htmlToText(html) : rootBody)
  ).slice(0, 100_000);
  const from = parseEmailAddress(headers.get("from") || "");
  const millis = Number(message.internalDate);
  const sentAt = Number.isFinite(millis) && millis > 0
    ? new Date(millis).toISOString()
    : new Date().toISOString();

  return {
    id,
    threadId,
    labelIds: message.labelIds || [],
    fromEmail: from.email,
    fromName: from.name,
    toEmails: parseEmailAddressList(headers.get("to") || ""),
    ccEmails: parseEmailAddressList(headers.get("cc") || ""),
    subject: (headers.get("subject") || "").slice(0, 998),
    rfcMessageId: (headers.get("message-id") || "").slice(0, 998) || null,
    inReplyTo: (headers.get("in-reply-to") || "").slice(0, 998) || null,
    references: (headers.get("references") || "").slice(0, 4000) || null,
    bodyText,
    sentAt,
    autoSubmitted: headers.get("auto-submitted") || "",
    precedence: headers.get("precedence") || "",
    listId: headers.get("list-id") || "",
    autoResponseSuppress: headers.get("x-auto-response-suppress") || "",
  };
}

export function isAutomaticReplyCandidate(
  message: ParsedGmailMessage,
  mailboxEmail: string
) {
  const sender = message.fromEmail.toLowerCase();
  const autoSubmitted = message.autoSubmitted.trim().toLowerCase();
  const precedence = message.precedence.trim().toLowerCase();
  if (!sender || sender === mailboxEmail.toLowerCase() || !message.bodyText.trim()) return false;
  if (/^(mailer-daemon|postmaster|no-?reply|do-?not-?reply)@/i.test(sender)) return false;
  if (autoSubmitted && autoSubmitted !== "no") return false;
  if (["bulk", "list", "junk"].includes(precedence)) return false;
  if (message.listId || message.autoResponseSuppress) return false;
  return true;
}

function cleanHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodedHeader(value: string) {
  const clean = cleanHeader(value);
  return /^[\x20-\x7E]*$/.test(clean)
    ? clean
    : `=?UTF-8?B?${Buffer.from(clean, "utf8").toString("base64")}?=`;
}

export function buildGmailReply({
  from,
  to,
  subject,
  text,
  rfcMessageId,
  inReplyTo,
  references,
}: {
  from: string;
  to: string;
  subject: string;
  text: string;
  rfcMessageId: string;
  inReplyTo?: string | null;
  references?: string | null;
}) {
  const normalizedSubject = /^\s*re:/i.test(subject) ? subject : `Re: ${subject || "Your enquiry"}`;
  const referenceChain = [references, inReplyTo].filter(Boolean).join(" ").trim();
  const headers = [
    `From: ${cleanHeader(from)}`,
    `To: ${cleanHeader(to)}`,
    `Subject: ${encodedHeader(normalizedSubject)}`,
    `Message-ID: ${cleanHeader(rfcMessageId)}`,
    inReplyTo ? `In-Reply-To: ${cleanHeader(inReplyTo)}` : "",
    referenceChain ? `References: ${cleanHeader(referenceChain)}` : "",
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ].filter(Boolean);
  const body = Buffer.from(text.replace(/\r?\n/g, "\r\n"), "utf8")
    .toString("base64")
    .replace(/.{1,76}/g, "$&\r\n")
    .trimEnd();
  const mime = `${headers.join("\r\n")}\r\n\r\n${body}\r\n`;
  return Buffer.from(mime, "utf8").toString("base64url");
}
