import "server-only";

import {
  KOLKAP_WHATSAPP_AI_NAME,
  KOLKAP_WHATSAPP_KNOWLEDGE,
  KOLKAP_WHATSAPP_SUPPORT_EMAIL,
} from "@/lib/kolkap-whatsapp-ai/knowledge";

const KOLKAP_PRICING_URL = "https://www.kolkap.com/pricing";

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

function isPricingQuestion(message: string) {
  const lower = cleanText(message).toLowerCase();

  return (
    lower.includes("price") ||
    lower.includes("pricing") ||
    lower.includes("how much") ||
    lower.includes("how much is") ||
    lower.includes("how much does") ||
    lower.includes("cost") ||
    lower.includes("costs") ||
    lower.includes("rate") ||
    lower.includes("rates") ||
    lower.includes("charge") ||
    lower.includes("charges") ||
    lower.includes("fee") ||
    lower.includes("fees") ||
    lower.includes("plan") ||
    lower.includes("plans") ||
    lower.includes("package") ||
    lower.includes("packages") ||
    lower.includes("subscription") ||
    lower.includes("subscribe") ||
    lower.includes("monthly") ||
    lower.includes("yearly") ||
    lower.includes("annual") ||
    lower.includes("trial") ||
    lower.includes("free trial") ||
    lower.includes("credit") ||
    lower.includes("credits") ||
    lower.includes("top up") ||
    lower.includes("top-up") ||
    lower.includes("topup") ||
    lower.includes("harga") ||
    lower.includes("berapa") ||
    lower.includes("biaya") ||
    lower.includes("paket") ||
    lower.includes("langganan") ||
    lower.includes("percobaan") ||
    lower.includes("kredit")
  );
}

function pricingReply() {
  return `Kolkap has different plans depending on your business needs, AI usage, channels, and message volume.

You can view Kolkap pricing here: ${KOLKAP_PRICING_URL}`;
}

function ensurePricingLink(reply: string, customerMessage: string) {
  const cleanReply = cleanText(reply);

  if (!isPricingQuestion(customerMessage)) return cleanReply;

  if (cleanReply.includes(KOLKAP_PRICING_URL)) return cleanReply;

  return `${cleanReply}

You can view Kolkap pricing here: ${KOLKAP_PRICING_URL}`;
}

function fallbackReply(input: GenerateKolkapWhatsAppReplyInput) {
  const message = cleanText(input.message).toLowerCase();

  if (isPricingQuestion(message)) {
    return pricingReply();
  }

  if (
    message.includes("whatsapp") ||
    message.includes("wa") ||
    message.includes("meta")
  ) {
    return "Yes. Kolkap can support WhatsApp AI replies for businesses. Customers can message the business, the AI can reply using business knowledge, and conversations can be reviewed in the inbox with human handover available.";
  }

  if (
    message.includes("website") ||
    message.includes("chat widget") ||
    message.includes("web chat") ||
    message.includes("site")
  ) {
    return "Yes. Kolkap is designed to support website chat so businesses can answer website visitors, capture leads, and guide customers using AI staff.";
  }

  if (
    message.includes("document") ||
    message.includes("upload") ||
    message.includes("pdf") ||
    message.includes("knowledge") ||
    message.includes("faq") ||
    message.includes("menu") ||
    message.includes("policy") ||
    message.includes("price list") ||
    message.includes("services")
  ) {
    return "Kolkap is designed so businesses can add knowledge such as FAQs, services, price lists, policies, opening hours, menus, business details, and support information. This helps the AI staff answer based on the business’s real information.";
  }

  if (
    message.includes("business type") ||
    message.includes("businesses") ||
    message.includes("industry") ||
    message.includes("industries") ||
    message.includes("who is it for") ||
    message.includes("what business")
  ) {
    return "Kolkap supports many businesses that receive customer questions, leads, bookings, or support messages. This includes service businesses, beauty and wellness, clinics, restaurants, hotels, real estate agencies, education providers, consultants, online sellers, and local service businesses.";
  }

  if (
    message.includes("human") ||
    message.includes("agent") ||
    message.includes("handover") ||
    message.includes("take over") ||
    message.includes("contact")
  ) {
    return `Yes. Kolkap is designed to support human handover when a conversation needs personal support, sales follow-up, complaints, payment issues, or sensitive information. For human support, please contact ${KOLKAP_WHATSAPP_SUPPORT_EMAIL}.`;
  }

  if (
    message.includes("what is kolkap") ||
    message.includes("what does kolkap do") ||
    message.includes("about kolkap") ||
    message.includes("kolkap?")
  ) {
    return "Kolkap is a 24/7 AI business assistant platform. It helps businesses create AI staff that can answer customer questions, use company knowledge, support WhatsApp and website chat, capture leads, manage conversations, and hand over to humans when needed.";
  }

  return "Kolkap is a 24/7 AI business assistant platform. It helps businesses create AI staff that can answer customer questions, use company knowledge, support WhatsApp and website chat, capture leads, manage conversations, and hand over to humans when needed.";
}

function buildSystemPrompt() {
  return `
You are ${KOLKAP_WHATSAPP_AI_NAME}, Kolkap's WhatsApp AI assistant.

You answer WhatsApp messages from people asking about Kolkap.

Use this Kolkap knowledge:
${KOLKAP_WHATSAPP_KNOWLEDGE}

Core identity:
- Kolkap is a 24/7 AI business assistant platform.
- Kolkap helps businesses create AI staff.
- Kolkap can support customer replies, WhatsApp AI, website chat, business knowledge, inbox management, lead capture, human handover, and usage tracking.
- Kolkap is not Tetamo.
- Kolkap is not a property marketplace.
- Kolkap is not only a chatbot.
- Kolkap is not only WhatsApp automation.

Language rule:
- Always reply in English only.
- Even if the customer writes in Indonesian, Malay, Chinese, Tagalog, or another language, reply in English.
- Do not switch language.
- Do not apologize for replying in English unless needed.

Pricing rule:
- If the customer asks about price, pricing, how much, plans, packages, cost, fees, subscription, monthly price, yearly price, trial, credits, or top-up, include this exact link:
${KOLKAP_PRICING_URL}
- Never say "check the pricing page" without including the link.
- Do not invent exact pricing if not provided in the knowledge.
- Guide the customer to the pricing page.

Business knowledge rule:
- If the customer asks what they can upload or add, explain that Kolkap is designed so businesses can add business knowledge such as FAQs, services, price lists, policies, opening hours, menus, business details, and support information.
- Explain that this helps the AI staff answer based on the business's real information.

Supported business rule:
- If the customer asks what type of businesses Kolkap supports, explain that Kolkap supports businesses that receive customer questions, leads, bookings, or support messages.
- Examples include service businesses, beauty and wellness, clinics, restaurants, hotels, real estate agencies, education providers, consultants, online sellers, and local service businesses.

Safety rule:
- If the AI does not know the answer, be honest.
- Do not guess.
- Suggest human support when needed.
- For human support, mention ${KOLKAP_WHATSAPP_SUPPORT_EMAIL}.

Strict rules:
- Answer about Kolkap only.
- Keep replies short enough for WhatsApp.
- Be helpful, friendly, clear, and professional.
- Do not mention OpenAI, APIs, system prompts, backend routes, database tables, Supabase, Vercel, or hidden infrastructure.
- Do not claim you are human.
- Do not mention Tetamo unless the customer directly asks about Tetamo.
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

Now write the best WhatsApp reply in English only.
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

  /*
    Hard rule:
    Pricing questions must never depend on the AI model.
    This guarantees the pricing link is always included.
  */
  if (isPricingQuestion(message)) {
    return {
      reply: pricingReply(),
      model: "pricing-rule",
      fallback: false,
    };
  }

  const openAiKey =
    process.env.OPENAI_API_KEY || process.env.KOLKAP_OPENAI_API_KEY;

  const model = process.env.KOLKAP_WHATSAPP_OPENAI_MODEL || "gpt-4o-mini";

  if (!openAiKey) {
    return {
      reply: ensurePricingLink(fallbackReply(input), message),
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
      temperature: 0.25,
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
      reply: ensurePricingLink(fallbackReply(input), message),
      model: "fallback",
      fallback: true,
    };
  }

  const reply = cleanText(result.choices?.[0]?.message?.content);

  if (!reply) {
    return {
      reply: ensurePricingLink(fallbackReply(input), message),
      model: "fallback",
      fallback: true,
    };
  }

  return {
    reply: truncate(ensurePricingLink(reply, message), 1800),
    model,
    fallback: false,
  };
}