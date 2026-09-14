import { createHmac, timingSafeEqual } from "node:crypto";

export function getWhatsAppAppSecrets(env: NodeJS.ProcessEnv = process.env) {
  // Support the existing internal bot as well as Embedded Signup's app secret.
  // Missing configuration must never disable verification.
  return [...new Set([env.META_APP_SECRET, env.META_WHATSAPP_APP_SECRET]
    .map((value) => value?.trim() || "").filter(Boolean))];
}

export function verifyWhatsAppSignature(
  rawBody: string,
  signature: string | null,
  secrets: readonly string[]
) {
  if (!signature || !/^sha256=[a-fA-F0-9]{64}$/.test(signature)) return false;
  const received = Buffer.from(signature.slice(7), "hex");
  return secrets.some((secret) => {
    if (!secret.trim()) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest();
    return timingSafeEqual(expected, received);
  });
}

export function isInternalWhatsAppNumber(
  phoneNumberId: string,
  wabaId: string,
  env: NodeJS.ProcessEnv = process.env
) {
  const expectedPhone = env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();
  const expectedWaba = env.META_WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();
  return Boolean(expectedPhone && phoneNumberId === expectedPhone &&
    (!expectedWaba || wabaId === expectedWaba));
}

export function hasUsableWhatsAppSecret(
  secret: {
    workspace_id: string;
    meta_access_token: string | null;
    meta_token_expires_at: string | null;
  } | null,
  workspaceId: string,
  now = Date.now()
) {
  if (!secret?.meta_access_token?.trim() || secret.workspace_id !== workspaceId) {
    return false;
  }
  if (!secret.meta_token_expires_at) return true;
  const expiresAt = Date.parse(secret.meta_token_expires_at);
  return Number.isFinite(expiresAt) && expiresAt > now;
}
