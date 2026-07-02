import "server-only";

type SendKolkapWhatsAppTextInput = {
  to: string;
  message: string;
  replyToMessageId?: string | null;
};

type SendMetaWhatsAppTextInput = {
  to: string;
  message: string;
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string | null;
  replyToMessageId?: string | null;
};

type MetaWhatsAppSendResponse = {
  messaging_product?: string;
  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;
  messages?: Array<{
    id?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export type SendKolkapWhatsAppTextResult = {
  metaMessageId: string | null;
  raw: MetaWhatsAppSendResponse;
};

function cleanText(value: unknown, fallback = "") {
  const text =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? fallback
        : String(value);

  return text.trim();
}

function truncateWhatsAppText(value: string) {
  const text = cleanText(value);

  if (text.length <= 3900) {
    return text;
  }

  return `${text.slice(0, 3900).trim()}...`;
}

function getMetaApiVersion(value?: string | null) {
  return (
    cleanText(value) ||
    process.env.META_WHATSAPP_API_VERSION ||
    process.env.META_GRAPH_VERSION ||
    "v25.0"
  );
}

function getKolkapMetaWhatsAppConfig() {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = getMetaApiVersion();

  if (!accessToken) {
    throw new Error("Missing META_WHATSAPP_ACCESS_TOKEN.");
  }

  if (!phoneNumberId) {
    throw new Error("Missing META_WHATSAPP_PHONE_NUMBER_ID.");
  }

  return {
    accessToken,
    phoneNumberId,
    apiVersion,
  };
}

async function sendMetaTextMessage(input: {
  to: string;
  message: string;
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string | null;
  replyToMessageId?: string | null;
}): Promise<SendKolkapWhatsAppTextResult> {
  const to = cleanText(input.to).replace(/[^\d]/g, "");
  const message = truncateWhatsAppText(input.message);
  const accessToken = cleanText(input.accessToken);
  const phoneNumberId = cleanText(input.phoneNumberId);
  const apiVersion = getMetaApiVersion(input.apiVersion);
  const replyToMessageId = cleanText(input.replyToMessageId);

  if (!to) {
    throw new Error("WhatsApp recipient number is required.");
  }

  if (!message) {
    throw new Error("WhatsApp message text is required.");
  }

  if (!accessToken) {
    throw new Error("WhatsApp access token is required.");
  }

  if (!phoneNumberId) {
    throw new Error("WhatsApp phone number ID is required.");
  }

  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  };

  if (replyToMessageId) {
    payload.context = {
      message_id: replyToMessageId,
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result = (await response
    .json()
    .catch(() => ({}))) as MetaWhatsAppSendResponse;

  if (!response.ok) {
    throw new Error(
      result.error?.message || "WhatsApp message could not be sent."
    );
  }

  return {
    metaMessageId: result.messages?.[0]?.id || null,
    raw: result,
  };
}

export async function sendKolkapWhatsAppTextMessage(
  input: SendKolkapWhatsAppTextInput
): Promise<SendKolkapWhatsAppTextResult> {
  const { accessToken, phoneNumberId, apiVersion } =
    getKolkapMetaWhatsAppConfig();

  return sendMetaTextMessage({
    to: input.to,
    message: input.message,
    replyToMessageId: input.replyToMessageId,
    accessToken,
    phoneNumberId,
    apiVersion,
  });
}

export async function sendMetaWhatsAppTextMessage(
  input: SendMetaWhatsAppTextInput
): Promise<SendKolkapWhatsAppTextResult> {
  return sendMetaTextMessage({
    to: input.to,
    message: input.message,
    replyToMessageId: input.replyToMessageId,
    accessToken: input.accessToken,
    phoneNumberId: input.phoneNumberId,
    apiVersion: input.apiVersion,
  });
}