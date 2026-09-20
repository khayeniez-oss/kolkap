import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const CIPHER_VERSION = "v1";
const IV_BYTES = 12;

export type EmailSecretPurpose = "oauth-pkce" | "google-refresh-token";

function encryptionKey(env: NodeJS.ProcessEnv = process.env) {
  const configured = env.GOOGLE_EMAIL_TOKEN_ENCRYPTION_KEY?.trim();

  if (!configured) {
    throw new Error("GOOGLE_EMAIL_TOKEN_ENCRYPTION_KEY is not configured.");
  }

  const key = /^[a-f0-9]{64}$/i.test(configured)
    ? Buffer.from(configured, "hex")
    : Buffer.from(configured, "base64");

  if (key.length !== 32) {
    throw new Error(
      "GOOGLE_EMAIL_TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64 or 64 hexadecimal characters."
    );
  }

  return key;
}

function aad(purpose: EmailSecretPurpose) {
  return Buffer.from(`kolkap-email:${purpose}:${CIPHER_VERSION}`, "utf8");
}

export function encryptEmailSecret(
  plaintext: string,
  purpose: EmailSecretPurpose,
  env: NodeJS.ProcessEnv = process.env
) {
  if (!plaintext) throw new Error("Cannot encrypt an empty email secret.");

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(env), iv);
  cipher.setAAD(aad(purpose));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    CIPHER_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptEmailSecret(
  encrypted: string,
  purpose: EmailSecretPurpose,
  env: NodeJS.ProcessEnv = process.env
) {
  const [version, ivValue, tagValue, ciphertextValue, extra] = encrypted.split(".");

  if (
    version !== CIPHER_VERSION ||
    !ivValue ||
    !tagValue ||
    !ciphertextValue ||
    extra
  ) {
    throw new Error("Encrypted email secret has an unsupported format.");
  }

  const iv = Buffer.from(ivValue, "base64url");
  const tag = Buffer.from(tagValue, "base64url");
  const ciphertext = Buffer.from(ciphertextValue, "base64url");

  if (iv.length !== IV_BYTES || tag.length !== 16 || !ciphertext.length) {
    throw new Error("Encrypted email secret is invalid.");
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(env), iv);
  decipher.setAAD(aad(purpose));
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function createGoogleOauthState() {
  return randomBytes(32).toString("base64url");
}

export function createPkcePair() {
  const verifier = randomBytes(64).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier, "ascii")
    .digest("base64url");

  return { verifier, challenge };
}

export function safeOauthReturnTo(value: unknown) {
  const path = typeof value === "string" ? value.trim() : "";
  return path.startsWith("/") && !path.startsWith("//")
    ? path
    : "/dashboard/integrations/email";
}
