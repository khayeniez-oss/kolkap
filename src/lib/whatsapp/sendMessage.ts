import "server-only";

type MetaResponse = { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number }; [key: string]: unknown };
export type SendKolkapWhatsAppTextResult = { metaMessageId: string; raw: MetaResponse };
type Credentials = { accessToken: string; phoneNumberId: string; apiVersion?: string | null };
type TextInput = { to: string; message: string; replyToMessageId?: string | null; callbackId?: string };

export class WhatsAppSendError extends Error {
  constructor(message: string, public uncertain: boolean, public code: string) { super(message); }
}

export function metaGraphVersion(value?: string | null) {
  const version = value || process.env.META_WHATSAPP_API_VERSION || process.env.META_GRAPH_VERSION || "v25.0";
  if (!/^v\d+\.\d+$/.test(version)) throw new Error("Invalid Meta API version.");
  return version;
}

export async function sendMetaWhatsAppPayload(input: Credentials & { payload: Record<string, unknown> }): Promise<SendKolkapWhatsAppTextResult> {
  if (!input.accessToken || !/^\d+$/.test(input.phoneNumberId)) throw new WhatsAppSendError("Reconnect this WhatsApp number.", false, "connection_unavailable");
  let response: Response;
  try {
    response = await fetch(`https://graph.facebook.com/${metaGraphVersion(input.apiVersion)}/${input.phoneNumberId}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(input.payload), signal: AbortSignal.timeout(20_000), cache: "no-store",
    });
  } catch {
    throw new WhatsAppSendError("Delivery is unconfirmed. Check WhatsApp before sending this message again.", true, "delivery_unconfirmed");
  }
  const raw = await response.json().catch(() => ({})) as MetaResponse;
  if (!response.ok || raw.error) {
    // A timeout/server failure can happen after acceptance. Never automatically replay it.
    const uncertain = response.status >= 500 || response.status === 408;
    throw new WhatsAppSendError(uncertain ? "Delivery is unconfirmed. Check WhatsApp before sending this message again."
      : `Meta could not send this message${raw.error?.code ? ` (code ${raw.error.code})` : ""}. Check the number connection and reply window.`,
      uncertain, String(raw.error?.code || response.status));
  }
  const id = raw.messages?.[0]?.id;
  if (!id) throw new WhatsAppSendError("Delivery is unconfirmed. Check WhatsApp before sending this message again.", true, "missing_message_id");
  return { metaMessageId: id, raw };
}

export async function sendMetaWhatsAppTextMessage(input: TextInput & Credentials) {
  const to = input.to.replace(/\D/g, "");
  const message = input.message.trim().slice(0, 4096);
  if (!/^\d{7,15}$/.test(to) || !message) throw new WhatsAppSendError("A recipient and message are required.", false, "invalid_message");
  return sendMetaWhatsAppPayload({ ...input, payload: {
    messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body: message },
    ...(input.replyToMessageId ? { context: { message_id: input.replyToMessageId } } : {}),
    ...(input.callbackId ? { biz_opaque_callback_data: input.callbackId } : {}),
  } });
}

export async function sendKolkapWhatsAppTextMessage(input: TextInput) {
  return sendMetaWhatsAppTextMessage({ ...input, accessToken: process.env.META_WHATSAPP_ACCESS_TOKEN || "", phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || "" });
}
