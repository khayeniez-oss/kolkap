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

function hasConversationHistory(history: KolkapWhatsAppChatMessage[] = []) {
  return sanitizeHistory(history).length > 0;
}

function isGreetingOnly(message: string) {
  const lower = cleanText(message)
    .toLowerCase()
    .replace(/[!?.\s]/g, "");

  return [
    "hi",
    "hello",
    "hey",
    "hai",
    "halo",
    "hallo",
    "morning",
    "goodmorning",
    "afternoon",
    "goodafternoon",
    "evening",
    "goodevening",
  ].includes(lower);
}

function isKnowledgeUploadQuestion(message: string) {
  const lower = cleanText(message).toLowerCase();

  const hasUploadIntent =
    lower.includes("upload") ||
    lower.includes("add") ||
    lower.includes("attach") ||
    lower.includes("submit") ||
    lower.includes("send") ||
    lower.includes("train") ||
    lower.includes("teach") ||
    lower.includes("knowledge") ||
    lower.includes("document") ||
    lower.includes("documents") ||
    lower.includes("file") ||
    lower.includes("files");

  const hasKnowledgeItem =
    lower.includes("faq") ||
    lower.includes("faqs") ||
    lower.includes("price list") ||
    lower.includes("pricelist") ||
    lower.includes("pricing list") ||
    lower.includes("menu") ||
    lower.includes("service list") ||
    lower.includes("services") ||
    lower.includes("policy") ||
    lower.includes("policies") ||
    lower.includes("opening hours") ||
    lower.includes("business details") ||
    lower.includes("brochure") ||
    lower.includes("pdf") ||
    lower.includes("doc") ||
    lower.includes("docx");

  return hasUploadIntent && hasKnowledgeItem;
}

function isPricingQuestion(message: string) {
  const lower = cleanText(message).toLowerCase();

  if (isKnowledgeUploadQuestion(lower)) return false;

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

You can view Kolkap pricing here:
${KOLKAP_PRICING_URL}

What type of business are you planning to use Kolkap for?`;
}

function knowledgeUploadReply() {
  return `Yes. Kolkap is designed so businesses can add knowledge such as FAQs, price lists, services, policies, opening hours, menus, business details, and support information.

That helps the AI staff answer customers based on your real business information instead of guessing.

Do you already have your FAQ and price list prepared, or are you still organizing them?`;
}

function greetingReply() {
  return `Hi, welcome to Kolkap. I can help you understand how Kolkap works for WhatsApp AI, website chat, AI staff, business knowledge, pricing, and setup.

What type of business are you looking to support with AI?`;
}

function removeRepeatedGreeting(reply: string, shouldAllowGreeting: boolean) {
  let clean = cleanText(reply);

  if (shouldAllowGreeting) return clean;

  const greetingPatterns = [
    /^hi[,!\s]+/i,
    /^hello[,!\s]+/i,
    /^hey[,!\s]+/i,
    /^hi there[,!\s]+/i,
    /^hello there[,!\s]+/i,
    /^thanks for contacting kolkap[.!,\s]*/i,
    /^thank you for contacting kolkap[.!,\s]*/i,
  ];

  for (const pattern of greetingPatterns) {
    clean = clean.replace(pattern, "").trim();
  }

  return clean || reply;
}

function removeRoboticClosings(reply: string) {
  let clean = cleanText(reply);

  const closingPatterns = [
    /(?:\n|\s)*if you have any other questions,?\s*feel free to ask[.!]*\s*$/i,
    /(?:\n|\s)*if you have more specific needs or questions,?\s*feel free to ask[.!]*\s*$/i,
    /(?:\n|\s)*feel free to ask[.!]*\s*$/i,
    /(?:\n|\s)*let me know if you have any questions[.!]*\s*$/i,
    /(?:\n|\s)*let me know if you need anything else[.!]*\s*$/i,
    /(?:\n|\s)*i'?m here to help[.!]*\s*$/i,
    /(?:\n|\s)*hope this helps[.!]*\s*$/i,
  ];

  for (const pattern of closingPatterns) {
    clean = clean.replace(pattern, "").trim();
  }

  return clean || reply;
}

function ensurePricingLink(reply: string, customerMessage: string) {
  const cleanReply = cleanText(reply);

  if (!isPricingQuestion(customerMessage)) return cleanReply;

  if (cleanReply.includes(KOLKAP_PRICING_URL)) return cleanReply;

  return `${cleanReply}

You can view Kolkap pricing here:
${KOLKAP_PRICING_URL}`;
}

function hasQuestion(reply: string) {
  return cleanText(reply).includes("?");
}

function shouldAddSalesQuestion(reply: string, customerMessage: string) {
  const cleanReply = cleanText(reply);
  const lowerMessage = cleanText(customerMessage).toLowerCase();

  if (!cleanReply) return false;
  if (hasQuestion(cleanReply)) return false;
  if (cleanReply.includes(KOLKAP_WHATSAPP_SUPPORT_EMAIL)) return false;

  if (
    lowerMessage.includes("support") ||
    lowerMessage.includes("human") ||
    lowerMessage.includes("complaint") ||
    lowerMessage.includes("refund") ||
    lowerMessage.includes("problem")
  ) {
    return false;
  }

  return true;
}

function nextSalesQuestion(customerMessage: string) {
  const lower = cleanText(customerMessage).toLowerCase();

  if (
    lower.includes("whatsapp") ||
    lower.includes("wa") ||
    lower.includes("website") ||
    lower.includes("chat")
  ) {
    return "Are you planning to use Kolkap mainly for WhatsApp, website chat, or both?";
  }

  if (
    lower.includes("business") ||
    lower.includes("industry") ||
    lower.includes("business type")
  ) {
    return "What type of business are you setting this up for?";
  }

  if (
    lower.includes("knowledge") ||
    lower.includes("upload") ||
    lower.includes("faq") ||
    lower.includes("document") ||
    lower.includes("pdf") ||
    lower.includes("menu") ||
    lower.includes("policy") ||
    lower.includes("pricelist") ||
    lower.includes("price list")
  ) {
    return "Do you already have FAQs, services, prices, or policies ready for the AI to learn from?";
  }

  return "What type of business are you planning to use Kolkap for?";
}

function polishReply(reply: string, input: GenerateKolkapWhatsAppReplyInput) {
  const message = cleanText(input.message);
  const allowGreeting =
    !hasConversationHistory(input.history) || isGreetingOnly(message);

  let clean = cleanText(reply);
  clean = removeRepeatedGreeting(clean, allowGreeting);
  clean = removeRoboticClosings(clean);
  clean = ensurePricingLink(clean, message);

  if (shouldAddSalesQuestion(clean, message)) {
    clean = `${clean}

${nextSalesQuestion(message)}`;
  }

  return truncate(clean, 1800);
}

function fallbackReply(input: GenerateKolkapWhatsAppReplyInput) {
  const message = cleanText(input.message).toLowerCase();

  if (isKnowledgeUploadQuestion(message)) {
    return knowledgeUploadReply();
  }

  if (isPricingQuestion(message)) {
    return pricingReply();
  }

  if (isGreetingOnly(message)) {
    return greetingReply();
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
    message.includes("pricelist") ||
    message.includes("services")
  ) {
    return knowledgeUploadReply();
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

  return "Kolkap is a 24/7 AI business assistant platform. It helps businesses create AI staff that can answer customer questions, use company knowledge, support WhatsApp and website chat, capture leads, manage conversations, and hand over to humans when needed.";
}

function buildSystemPrompt(input: GenerateKolkapWhatsAppReplyInput) {
  const isOngoingConversation = hasConversationHistory(input.history);

  return `
You are ${KOLKAP_WHATSAPP_AI_NAME}, Kolkap's WhatsApp AI assistant.

You answer WhatsApp messages from people asking about Kolkap.

Use this Kolkap knowledge:
${KOLKAP_WHATSAPP_KNOWLEDGE}

Current conversation state:
- This is ${isOngoingConversation ? "an ongoing conversation" : "a new conversation"}.
- If it is an ongoing conversation, continue naturally. Do not restart with "Hi", "Hello", or "Thanks for contacting Kolkap".
- If it is a new conversation and the customer only greets you, welcome them warmly and ask what business they want to support with AI.

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

Tone rule:
- Sound human, warm, friendly, firm, professional, and sales-smart.
- Do not sound like a machine.
- Do not over-explain.
- Do not repeat the same introduction in every reply.
- Use natural continuation like a real sales/support conversation.
- Keep the reply short enough for WhatsApp.
- Prefer 1 to 3 short paragraphs.
- End with a useful next-step question when appropriate.

Forbidden robotic endings:
- Do not say "feel free to ask".
- Do not say "if you have more specific needs or questions, feel free to ask".
- Do not say "let me know if you need anything else".
- Do not say "hope this helps".
- Do not end with generic customer-service filler.

Pricing rule:
- If the customer asks about Kolkap price, pricing, how much, plans, packages, cost, fees, subscription, monthly price, yearly price, trial, credits, or top-up, include this exact link:
${KOLKAP_PRICING_URL}
- Never say "check the pricing page" without including the link.
- Do not confuse "price list" or "pricelist" upload questions with Kolkap pricing questions.
- Do not invent exact pricing if not provided in the knowledge.
- After sharing the pricing link, ask what type of business they are planning to use Kolkap for.

Business knowledge rule:
- If the customer asks what they can upload or add, explain that Kolkap is designed so businesses can add business knowledge such as FAQs, services, price lists, policies, opening hours, menus, business details, and support information.
- Explain that this helps the AI staff answer based on the business's real information.
- If the customer asks about uploading a price list, pricelist, menu, FAQ, document, or policy, answer about business knowledge. Do not answer with the Kolkap pricing link.

Supported business rule:
- If the customer asks what type of businesses Kolkap supports, explain that Kolkap supports businesses that receive customer questions, leads, bookings, or support messages.
- Examples include service businesses, beauty and wellness, clinics, restaurants, hotels, real estate agencies, education providers, consultants, online sellers, and local service businesses.

Sales direction:
- When the customer shows interest, guide them to the next practical step.
- Ask what type of business they operate.
- Ask whether they want WhatsApp, website chat, or both.
- Ask whether their main goal is sales inquiries, support, bookings, lead capture, or all of them.

Safety rule:
- If the AI does not know the answer, be honest.
- Do not guess.
- Suggest human support when needed.
- For human support, mention ${KOLKAP_WHATSAPP_SUPPORT_EMAIL}.

Strict rules:
- Answer about Kolkap only.
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

Write the best WhatsApp reply in English only.
Make it sound natural, human, warm, professional, and sales-smart.
Do not use generic chatbot closings.
`.trim();
}

export async function generateKolkapWhatsAppReply(
  input: GenerateKolkapWhatsAppReplyInput
): Promise<GenerateKolkapWhatsAppReplyResult> {
  const message = cleanText(input.message);

  if (!message) {
    return {
      reply:
        "Hi, thanks for contacting Kolkap. What type of business are you looking to support with AI?",
      model: "fallback",
      fallback: true,
    };
  }

  /*
    Hard rule:
    Upload / business knowledge questions must not be confused with pricing.
    Example: "Can I upload my pricelist and FAQ?" should explain business knowledge,
    not send the Kolkap pricing page.
  */
  if (isKnowledgeUploadQuestion(message)) {
    return {
      reply: knowledgeUploadReply(),
      model: "knowledge-rule",
      fallback: false,
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
      reply: polishReply(fallbackReply(input), input),
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
      temperature: 0.45,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(input),
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
      reply: polishReply(fallbackReply(input), input),
      model: "fallback",
      fallback: true,
    };
  }

  const reply = cleanText(result.choices?.[0]?.message?.content);

  if (!reply) {
    return {
      reply: polishReply(fallbackReply(input), input),
      model: "fallback",
      fallback: true,
    };
  }

  return {
    reply: polishReply(reply, input),
    model,
    fallback: false,
  };
}