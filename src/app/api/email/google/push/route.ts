import {
  decodeGmailPushData,
  processGoogleMailboxNotification,
} from "@/lib/email/intake";
import { verifyGooglePubSubRequest } from "@/lib/email/pubsubSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PubSubEnvelope = {
  message?: { data?: unknown; messageId?: string; publishTime?: string };
  subscription?: string;
};

export async function POST(request: Request) {
  try {
    const claims = await verifyGooglePubSubRequest(
      request.headers.get("authorization")
    );
    if (!claims) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as PubSubEnvelope | null;
    const expectedSubscription = process.env.GOOGLE_PUBSUB_SUBSCRIPTION?.trim();
    if (
      !body?.message ||
      (expectedSubscription && body.subscription !== expectedSubscription)
    ) {
      return Response.json({ error: "Invalid Pub/Sub message." }, { status: 400 });
    }

    const data = decodeGmailPushData(body.message.data);
    if (!data) {
      return Response.json({ error: "Invalid Gmail notification." }, { status: 400 });
    }

    await processGoogleMailboxNotification(data);
    return new Response(null, { status: 204 });
  } catch {
    console.error("Google Mail push processing failed.");
    return Response.json(
      { error: "Email notification could not be processed." },
      { status: 503 }
    );
  }
}
