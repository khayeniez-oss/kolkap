import { NextResponse } from "next/server";
import { KAI_KNOWLEDGE, KAI_SUPPORT_EMAIL } from "@/lib/kai-ai/knowledge";

export const runtime = "nodejs";

type KaiMessage = {
  role: "user" | "assistant";
  content: string;
};

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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const message = cleanMessage(body?.message);
    const history = cleanHistory(body?.history);

    if (!message) {
      return NextResponse.json(
        {
          reply:
            "Please type your question first. I can help with Kolkap, pricing, trial, credits, WhatsApp, setup, billing, or support.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.OPENAI_API_KEY || process.env.KOLKAP_OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          reply: `Kai AI is not ready yet. Please contact ${KAI_SUPPORT_EMAIL} for support.`,
        },
        { status: 500 }
      );
    }

    const model = process.env.KOLKAP_OPENAI_MODEL || "gpt-4o-mini";

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
            {
              role: "system",
              content: KAI_KNOWLEDGE,
            },
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
          reply: `Kai AI is having trouble replying right now. Please contact ${KAI_SUPPORT_EMAIL} for support.`,
        },
        { status: 502 }
      );
    }

    const data = await openAiResponse.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      `I can help with Kolkap, pricing, trial, credits, WhatsApp, setup, billing, or support. You can also contact ${KAI_SUPPORT_EMAIL}.`;

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      {
        reply: `Kai AI is having trouble replying right now. Please contact ${KAI_SUPPORT_EMAIL} for support.`,
      },
      { status: 500 }
    );
  }
}