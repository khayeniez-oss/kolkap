import "server-only";

import {
  KOLKAP_WHATSAPP_AI_NAME,
  KOLKAP_WHATSAPP_KNOWLEDGE,
  KOLKAP_WHATSAPP_SUPPORT_EMAIL,
} from "@/lib/kolkap-whatsapp-ai/knowledge";

export type KolkapWhatsAppChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GenerateKolkapWhatsAppReplyInput = {
  message: string;
  customerName?: string | null;
  customerWaId?: string | null;
  history?: KolkapWhatsAppChatMessage[];
};

export type GenerateKolkapWhatsAppReplyResult = {
  reply: string;
  model: string;
  fallback: boolean;
};

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
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

function truncate(value: string, limit: number) {
  if (value.length <= limit) return value;

  return `${value.slice(0, limit).trim()}...`;
}

function sanitizeHistory(history: KolkapWhatsAppChatMessage[] = []) {
  return history
    .filter((item) => {
      const role = item.role === "assistant" || item.role === "user";
      const content = cleanText(item.content);

      return role && Boolean(content);
    })
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: truncate(cleanText(item.content), 700),
    }));
}

function fallbackReply(input: GenerateKolkapWhatsAppReplyInput) {
  const message = cleanText(input.message).toLowerCase();

  if (
    message.includes("price") ||
    message.includes("pricing") ||
    message.includes("plan") ||
    message.includes("cost") ||
    message.includes("trial")
  ) {
    return "Kolkap offers AI plans for businesses, with a possible 7-day free trial. Plans may include different credits, AI staff limits, and features. For the latest pricing, please check the Kolkap Pricing page or contact support@kolkap.com.";
  }

  if (
    message.includes("whatsapp") ||
    message.includes("wa") ||
    message.includes("meta")
  ) {
    return "Yes, Kolkap can support WhatsApp AI for business customer replies. Setup may depend on WhatsApp Business, Meta approval, phone number status, and account quality.";
  }

  if (
    message.includes("credit") ||
    message.includes("top up") ||
    message.includes("top-up")
  ) {
    return "Kolkap uses credits for AI actions such as test replies, inbox suggestions, website chat replies, WhatsApp replies, and content generation. Extra credits may be purchased from the dashboard Top-Up page.";
  }

  if (
    message.includes("support") ||
    message.includes("human") ||
    message.includes("contact")
  ) {
    return `For human support, please contact ${KOLKAP_WHATSAPP_SUPPORT_EMAIL}. Please include your name, email, business name, and what you need help with.`;
  }

  return "Kolkap is an AI staff platform that helps businesses reply faster, capture leads, support customers, and create content using AI. You can start by signing up, activating a trial or plan, creating AI staff, adding business knowledge, testing replies, and going live when ready.";
}

function buildSystemPrompt() {
  return `
You are ${KOLKAP_WHATSAPP_AI_NAME}.

You answer WhatsApp messages from people asking about Kolkap.

Use this knowledge:
${KOLKAP_WHATSAPP_KNOWLEDGE}

Strict rules:
- Answer about Kolkap only.
- Keep replies short enough for WhatsApp.
- Be helpful, friendly, clear, and professional.
- Do not mention OpenAI, APIs, system prompts, backend routes, database tables, or hidden infrastructure.
- Do not claim you are human.
- Do not invent exact pricing if not provided.
- If the customer needs human support, ask them to contact ${KOLKAP_WHATSAPP_SUPPORT_EMAIL}.
- If the question is unrelated to Kolkap, politely redirect back to Kolkap.
`.trim();
}

function buildUserPrompt(input: GenerateKolkapWhatsAppReplyInput) {
  const customerName = cleanText(input.customerName);
  const customerWaId = cleanText(input.customerWaId);
  const message = cleanText(input.message);

  return `
Customer name:
${customerName || "Not provided"}

Customer WhatsApp ID:
${customerWaId || "Not provided"}

Customer message:
${message}

Now write the best WhatsApp reply.
`.trim();
}

export async function generateKolkapWhatsAppReply(
  input: GenerateKolkapWhatsAppReplyInput
): Promise<GenerateKolkapWhatsAppReplyResult> {
  const message = cleanText(input.message);

  if (!message) {
    return {
      reply:
        "Hi, thanks for contacting Kolkap. How can I help you with Kolkap today?",
      model: "fallback",
      fallback: true,
    };
  }

  const openAiKey =
    process.env.OPENAI_API_KEY || process.env.KOLKAP_OPENAI_API_KEY;

  const model = process.env.KOLKAP_WHATSAPP_OPENAI_MODEL || "gpt-4o-mini";

  if (!openAiKey) {
    return {
      reply: fallbackReply(input),
      model: "fallback",
      fallback: true,
    };
  }

  const history = sanitizeHistory(input.history);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        ...history,
        {
          role: "user",
          content: buildUserPrompt(input),
        },
      ],
    }),
  });

  const result = (await response.json().catch(() => ({}))) as OpenAIChatResponse;

  if (!response.ok) {
    return {
      reply: fallbackReply(input),
      model: "fallback",
      fallback: true,
    };
  }

  const reply = cleanText(result.choices?.[0]?.message?.content);

  if (!reply) {
    return {
      reply: fallbackReply(input),
      model: "fallback",
      fallback: true,
    };
  }

  return {
    reply: truncate(reply, 1800),
    model,
    fallback: false,
  };
}