# Kolkap Google Email deployment checklist

The database migration must already be applied before deploying this application code. The production database verification should show all ten Email checks as `PASS`.

## 1. Add server environment variables in Vercel

Add these to Production, Preview, and Development as appropriate. Never place the client secret, token-encryption key, Supabase service-role key, or cron secret in variables whose names begin with `NEXT_PUBLIC_`.

```text
NEXT_PUBLIC_SITE_URL=https://www.kolkap.com
GOOGLE_GMAIL_CLIENT_ID=<OAuth web client ID>
GOOGLE_GMAIL_CLIENT_SECRET=<OAuth web client secret>
GOOGLE_GMAIL_REDIRECT_URI=https://www.kolkap.com/api/email/google/callback
GOOGLE_EMAIL_TOKEN_ENCRYPTION_KEY=<32 random bytes encoded as base64>
GOOGLE_GMAIL_PUBSUB_TOPIC=projects/kolkap/topics/kolkap-gmail-notifications
GOOGLE_PUBSUB_SERVICE_ACCOUNT=kolkap-gmail-push@kolkap.iam.gserviceaccount.com
GOOGLE_PUBSUB_AUDIENCE=https://www.kolkap.com/api/email/google/push
GOOGLE_PUBSUB_SUBSCRIPTION=projects/kolkap/subscriptions/kolkap-gmail-push
CRON_SECRET=<long random value>
```

Generate the two new random secrets locally. Store only the output in Vercel; do not paste it into chat or commit it:

```bash
openssl rand -base64 32
openssl rand -hex 32
```

Use the first output for `GOOGLE_EMAIL_TOKEN_ENCRYPTION_KEY` and the second for `CRON_SECRET`. Keep the encryption key stable. Changing or losing it makes existing encrypted mailbox tokens unreadable and requires each business to reconnect.

The existing application variables are also required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the configured OpenAI key.

## 2. Confirm Google Cloud settings

- OAuth application type: Web application.
- Authorized redirect URI: `https://www.kolkap.com/api/email/google/callback`.
- Gmail API enabled.
- OAuth scopes include Gmail read-only and Gmail send.
- While the OAuth app remains in Testing, every mailbox used in a test must be listed as an OAuth test user.
- Pub/Sub topic: `projects/kolkap/topics/kolkap-gmail-notifications`.
- `gmail-api-push@system.gserviceaccount.com` has Pub/Sub Publisher on the topic.
- Push subscription endpoint: `https://www.kolkap.com/api/email/google/push`.
- Push authentication service account: `kolkap-gmail-push@kolkap.iam.gserviceaccount.com`.
- If the Pub/Sub Audience field is left blank, Google uses the push endpoint URL. That matches the configured `GOOGLE_PUBSUB_AUDIENCE` above.
- Confirm the Pub/Sub service agent is allowed to mint OIDC tokens for the push-authentication service account.

## 3. Deploy and connect safely

1. Deploy the application after adding the environment variables.
2. Open **Dashboard → Customer Channels → Email**.
3. Connect a test Gmail or Google Workspace mailbox.
4. Choose the Email AI staff, but initially leave **Reply automatically** off.
5. Send a test customer email to the connected mailbox. Confirm it appears in Kolkap Inbox and uses 0 credits.
6. Send a human reply from Kolkap Inbox. Confirm Gmail sends it and it uses 0 credits.
7. Generate an AI suggestion. Confirm the suggestion appears and exactly 3 credits are used.
8. Turn on automatic replies and send a new customer email. Confirm one Gmail reply is sent and exactly 3 credits are used.
9. Redeliver or retry the same Pub/Sub notification and confirm there is no duplicate reply or duplicate charge.
10. Ask for a human in an email and confirm AI pauses for that conversation.

## 4. Ongoing operation

`vercel.json` calls `/api/email/google/watch` daily. That endpoint first catches up any mailbox history missed by Pub/Sub, then renews Gmail watches expiring within 48 hours. It checks the least-recently-synced connections first so the work rotates safely as the customer count grows. Keep `CRON_SECRET` configured so only Vercel can run it.

If Gmail cannot confirm a send because of a network interruption, Kolkap marks the job as unconfirmed and reconciles it from the Sent folder. It must not blindly resend, because doing so could duplicate the customer reply and credit charge.
