const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function loadServerModule(relativePath) {
  const filename = path.join(root, relativePath);
  const source = fs
    .readFileSync(filename, "utf8")
    .replace(/^import "server-only";\s*/m, "");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  instance._compile(output, filename);
  return instance.exports;
}

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function withEnv(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    return callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const cryptoModule = loadServerModule("src/lib/email/crypto.ts");
const google = loadServerModule("src/lib/email/google.ts");

withEnv(
  {
    GOOGLE_EMAIL_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"),
  },
  () => {
    const encrypted = cryptoModule.encryptEmailSecret(
      "test-refresh-token",
      "google-refresh-token"
    );
    assert.notEqual(encrypted, "test-refresh-token");
    assert.equal(
      cryptoModule.decryptEmailSecret(encrypted, "google-refresh-token"),
      "test-refresh-token"
    );
    assert.throws(() => cryptoModule.decryptEmailSecret(encrypted, "oauth-pkce"));
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("a") ? "b" : "a"}`;
    assert.throws(() =>
      cryptoModule.decryptEmailSecret(tampered, "google-refresh-token")
    );
    const state = cryptoModule.createGoogleOauthState();
    const pkce = cryptoModule.createPkcePair();
    assert.match(state, /^[A-Za-z0-9_-]{40,}$/);
    assert.match(pkce.verifier, /^[A-Za-z0-9_-]{43,}$/);
    assert.match(pkce.challenge, /^[A-Za-z0-9_-]{43,}$/);
    assert.match(cryptoModule.sha256Hex(state), /^[a-f0-9]{64}$/);
  }
);

assert.equal(
  cryptoModule.safeOauthReturnTo("//attacker.example/callback"),
  "/dashboard/integrations/email"
);
assert.equal(
  cryptoModule.safeOauthReturnTo("/dashboard/integrations/email?tab=google"),
  "/dashboard/integrations/email?tab=google"
);

withEnv(
  {
    GOOGLE_GMAIL_CLIENT_ID: "client-id.apps.googleusercontent.com",
    GOOGLE_GMAIL_CLIENT_SECRET: "client-secret",
    NEXT_PUBLIC_SITE_URL: "https://www.kolkap.com/",
  },
  () => {
    const authorization = new URL(
      google.buildGoogleAuthorizationUrl({
        state: "safe-state",
        codeChallenge: "safe-challenge",
      })
    );
    assert.equal(authorization.origin, "https://accounts.google.com");
    assert.equal(authorization.searchParams.get("access_type"), "offline");
    assert.equal(authorization.searchParams.get("prompt"), "consent");
    assert.equal(authorization.searchParams.get("code_challenge_method"), "S256");
    assert.equal(
      authorization.searchParams.get("redirect_uri"),
      "https://www.kolkap.com/api/email/google/callback"
    );
    const scopes = authorization.searchParams.get("scope") || "";
    assert.match(scopes, /gmail\.readonly/);
    assert.match(scopes, /gmail\.send/);
  }
);

const plainBody = Buffer.from("Hello from the customer", "utf8").toString(
  "base64url"
);
const parsed = google.parseGmailMessage({
  id: "gmail-message-1",
  threadId: "gmail-thread-1",
  internalDate: "1700000000000",
  labelIds: ["INBOX"],
  payload: {
    mimeType: "text/plain",
    headers: [
      { name: "From", value: 'Customer Name <customer@example.com>' },
      { name: "To", value: "inquiry@kolkap.com" },
      { name: "Subject", value: "Price question" },
      { name: "Message-ID", value: "<customer-message@example.com>" },
    ],
    body: { data: plainBody },
  },
});
assert.ok(parsed);
assert.equal(parsed.fromEmail, "customer@example.com");
assert.equal(parsed.fromName, "Customer Name");
assert.equal(parsed.bodyText, "Hello from the customer");
assert.equal(
  google.trimQuotedEmail(
    "Can you send the price list?\n\nOn Mon, Customer Support wrote:\n> Earlier reply"
  ),
  "Can you send the price list?"
);
assert.equal(
  google.isAutomaticReplyCandidate(parsed, "inquiry@kolkap.com"),
  true
);
assert.equal(
  google.isAutomaticReplyCandidate(
    { ...parsed, fromEmail: "no-reply@example.com" },
    "inquiry@kolkap.com"
  ),
  false
);
assert.equal(
  google.isAutomaticReplyCandidate(
    { ...parsed, autoSubmitted: "auto-replied" },
    "inquiry@kolkap.com"
  ),
  false
);

const raw = google.buildGmailReply({
  from: "inquiry@kolkap.com",
  to: "customer@example.com",
  subject: "Price question",
  text: "Thanks for your enquiry.",
  rfcMessageId: "<kolkap-email-test@kolkap.com>",
  inReplyTo: "<customer-message@example.com>",
});
const mime = Buffer.from(raw, "base64url").toString("utf8");
assert.match(mime, /Subject: Re: Price question/);
assert.match(mime, /Message-ID: <kolkap-email-test@kolkap\.com>/);
assert.match(mime, /In-Reply-To: <customer-message@example\.com>/);
assert.doesNotMatch(mime, /\r\nBcc:/i);

const pushRoute = source("src/app/api/email/google/push/route.ts");
assert.match(pushRoute, /verifyGooglePubSubRequest/);
assert.match(pushRoute, /GOOGLE_PUBSUB_SUBSCRIPTION/);
const callbackRoute = source("src/app/api/email/google/callback/route.ts");
assert.match(callbackRoute, /consume_email_oauth_state/);
assert.match(callbackRoute, /encryptEmailSecret\(tokens\.refresh_token/);
const sendRoute = source("src/app/api/inbox/send-reply/route.ts");
assert.match(sendRoute, /prepare_email_human_send/);
assert.match(sendRoute, /credits_used:0/);
const emailServer = source("src/lib/email/server.ts");
assert.match(emailServer, /emailStep\(job\.id, "accepted"/);
assert.match(emailServer, /Gmail delivery could not be confirmed/);
const watchRoute = source("src/app/api/email/google/watch/route.ts");
assert.match(watchRoute, /processGoogleMailboxNotification/);
assert.match(watchRoute, /gmailProfile/);
assert.match(watchRoute, /last_history_sync_at/);
const intake = source("src/lib/email/intake.ts");
assert.match(intake, /Buffer\.from\(value, "base64url"\)/);

const vercel = JSON.parse(source("vercel.json"));
assert.ok(
  vercel.crons.some((cron) => cron.path === "/api/email/google/watch"),
  "Daily Gmail watch renewal must be scheduled."
);

console.log("Email application checks passed (OAuth, encryption, parsing, MIME, routes, cron).")
