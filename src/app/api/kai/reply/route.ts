import { NextResponse } from "next/server";
import { KAI_KNOWLEDGE, KAI_SUPPORT_EMAIL } from "@/lib/kai-ai/knowledge";

export const runtime = "nodejs";

type KaiMessage = {
  role: "user" | "assistant";
  content: string;
};

type KaiSource = "web" | "mobile";

const MOBILE_KAI_INSTRUCTION = `
This conversation is coming from the Kolkap mobile app.

Mobile-specific rules:
- Introduce yourself as "Kai", not "Kai AI".
- The user must already be logged in before the mobile app allows them to send a message.
- Help the user understand how to use Kolkap's mobile and general product features.
- You may explain AI staff, Knowledge, Inbox, WhatsApp, Website Chat, Content Studio, Integrations, Leads, Reports, Settings, human handover, and general setup.
- Do not claim to access the user's private workspace, AI staff, Inbox, leads, business knowledge, usage, or account records.
- Do not provide plan prices, subscription details, billing instructions, payment instructions, credit balances, top-up instructions, upgrade instructions, or cancellation management inside the mobile app.
- If the user asks about pricing, plans, subscriptions, billing, payments, credits, top-ups, upgrades, or managing a subscription, kindly direct them to the Kolkap website.
- Use wording similar to: "Pricing, subscriptions, billing, and credit management are handled through the Kolkap website. Please open kolkap.com and sign in to your account."
- Do not show or calculate credit costs in mobile replies.
- Keep replies short, clear, friendly, and practical.
`;

function cleanMessage(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 1200);
}

function cleanHistory(value: unknown): KaiMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => {
      return (
        item &&
        typeof item === "object" &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
      );
    })
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 1200),
    }))
    .filter((item) => item.content.length > 0);
}

function cleanSource(value: unknown): KaiSource {
  return value === "mobile" ? "mobile" : "web";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const message = cleanMessage(body?.message);
    const history = cleanHistory(body?.history);
    const source = cleanSource(body?.source);

    if (!message) {
      return NextResponse.json(
        {
          reply:
            source === "mobile"
              ? "Please type your question first. I can help you understand how to use Kolkap."
              : "Please type your question first. I can help with Kolkap, pricing, trial, credits, WhatsApp, setup, billing, or support.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.OPENAI_API_KEY || process.env.KOLKAP_OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          reply: `Kai is not ready right now. Please contact ${KAI_SUPPORT_EMAIL} for support.`,
        },
        { status: 500 }
      );
    }

    const model = process.env.KOLKAP_OPENAI_MODEL || "gpt-4o-mini";

    const systemMessages = [
      {
        role: "system" as const,
        content: KAI_KNOWLEDGE,
      },
    ];

    if (source === "mobile") {
      systemMessages.push({
        role: "system",
        content: MOBILE_KAI_INSTRUCTION,
      });
    }

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.35,
          max_tokens: 420,
          messages: [
            ...systemMessages,
            ...history,
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    if (!openAiResponse.ok) {
      return NextResponse.json(
        {
          reply: `Kai is having trouble replying right now. Please contact ${KAI_SUPPORT_EMAIL} for support.`,
        },
        { status: 502 }
      );
    }

    const data = await openAiResponse.json();

    const fallbackReply =
      source === "mobile"
        ? `I can help you understand how to use Kolkap. You can also contact ${KAI_SUPPORT_EMAIL} for support.`
        : `I can help with Kolkap, pricing, trial, credits, WhatsApp, setup, billing, or support. You can also contact ${KAI_SUPPORT_EMAIL}.`;

    const reply =
      data?.choices?.[0]?.message?.content?.trim() || fallbackReply;

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      {
        reply: `Kai is having trouble replying right now. Please contact ${KAI_SUPPORT_EMAIL} for support.`,
      },
      { status: 500 }
    );
  }
}