import "server-only";

import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

import { emailSiteUrl } from "./google";

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ALLOWED_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

type JwtHeader = { alg?: string; kid?: string; typ?: string };
export type GooglePushClaims = {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  iat?: number;
  exp?: number;
};

type GoogleJwk = JsonWebKey & { kid?: string; alg?: string; use?: string };

let jwksCache: { keys: GoogleJwk[]; expiresAt: number } | null = null;

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

async function googleJwks() {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;

  const response = await fetch(GOOGLE_JWKS_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Google signing keys could not be loaded.");

  const body = (await response.json()) as { keys?: GoogleJwk[] };
  if (!Array.isArray(body.keys) || !body.keys.length) {
    throw new Error("Google signing keys are unavailable.");
  }

  const maxAge = Number(
    response.headers.get("cache-control")?.match(/max-age=(\d+)/i)?.[1] || 3600
  );
  jwksCache = {
    keys: body.keys,
    expiresAt: Date.now() + Math.max(60, Math.min(maxAge, 21_600)) * 1000,
  };
  return body.keys;
}

function expectedAudience(env: NodeJS.ProcessEnv = process.env) {
  return (
    env.GOOGLE_PUBSUB_AUDIENCE?.trim() ||
    `${emailSiteUrl(env)}/api/email/google/push`
  );
}

function expectedServiceAccount(env: NodeJS.ProcessEnv = process.env) {
  return (
    env.GOOGLE_PUBSUB_SERVICE_ACCOUNT?.trim().toLowerCase() ||
    "kolkap-gmail-push@kolkap.iam.gserviceaccount.com"
  );
}

function includesAudience(aud: string | string[] | undefined, expected: string) {
  return Array.isArray(aud) ? aud.includes(expected) : aud === expected;
}

export async function verifyGooglePubSubRequest(
  authorization: string | null,
  env: NodeJS.ProcessEnv = process.env,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const token = authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const header = decodeJson<JwtHeader>(parts[0]);
  const claims = decodeJson<GooglePushClaims>(parts[1]);
  if (!header || !claims || header.alg !== "RS256" || !header.kid) return null;

  const keys = await googleJwks();
  const jwk = keys.find(
    (item) => item.kid === header.kid && (!item.alg || item.alg === "RS256")
  );
  if (!jwk) {
    jwksCache = null;
    return null;
  }

  let validSignature = false;
  try {
    const key = createPublicKey({ key: jwk, format: "jwk" });
    validSignature = verify(
      "RSA-SHA256",
      Buffer.from(`${parts[0]}.${parts[1]}`, "ascii"),
      key,
      Buffer.from(parts[2], "base64url")
    );
  } catch {
    return null;
  }

  if (!validSignature) return null;
  if (!claims.iss || !ALLOWED_ISSUERS.has(claims.iss)) return null;
  if (!includesAudience(claims.aud, expectedAudience(env))) return null;
  if (!claims.exp || claims.exp < nowSeconds - 30) return null;
  if (!claims.iat || claims.iat > nowSeconds + 60) return null;
  if (claims.iat < nowSeconds - 3600) return null;
  if (String(claims.email_verified).toLowerCase() !== "true") return null;
  if (claims.email?.toLowerCase() !== expectedServiceAccount(env)) return null;
  return claims;
}
