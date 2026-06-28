"use client";

import { FormEvent, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SUPPORT_EMAIL = "support@kolkap.com";

const FIRST_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I’m Kai AI. I can help with Kolkap, pricing, free trial, credits, WhatsApp, website chat, setup, billing, privacy, terms, or support.",
};

const quickQuestions = [
  "What is Kolkap?",
  "How does the free trial work?",
  "How do credits work?",
  "Can Kolkap connect WhatsApp?",
];

function isGreetingMessage(message: ChatMessage) {
  return (
    message.role === "assistant" &&
    message.content === FIRST_MESSAGE.content
  );
}

export default function KaiChatBubble() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([FIRST_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function sendMessage(customMessage?: string) {
    const message = (customMessage ?? input).trim();

    if (!message || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: message,
    };

    const nextMessages: ChatMessage[] = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/kai/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: messages.filter((item) => !isGreetingMessage(item)),
        }),
      });

      const data = await response.json().catch(() => ({}));

      const reply =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : "Kai AI is having trouble replying right now. Please contact support@kolkap.com.";

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: reply,
        },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Kai AI is having trouble replying right now. Please contact support@kolkap.com.",
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function openChat() {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 150);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      {isOpen ? (
        <div className="mb-4 w-[calc(100vw-2.5rem)] max-w-[420px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <div className="bg-[#07111F] p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                  <Bot className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xl font-black leading-none">Kai AI</p>
                  <p className="mt-1 text-sm font-bold text-slate-300">
                    Kolkap 24/7 AI support
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
                aria-label="Close Kai AI chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] space-y-4 overflow-y-auto bg-[#F7F9FA] p-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${
                    message.role === "user"
                      ? "bg-[#07111F] text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isSending ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kai is replying...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickQuestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => sendMessage(item)}
                  disabled={isSending}
                  className="rounded-full border border-slate-200 bg-[#F7F9FA] px-3 py-2 text-xs font-black text-slate-600 transition hover:border-[#07111F] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {item}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Kai about Kolkap..."
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-[#F7F9FA] px-4 py-3 text-sm font-semibold text-[#07111F] outline-none transition focus:border-[#07111F] focus:bg-white"
              />

              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#07111F] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>

            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-3 flex items-center justify-center gap-2 text-xs font-black text-slate-500 transition hover:text-[#07111F]"
            >
              <Mail className="h-4 w-4" />
              Need human support? {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={openChat}
        className="group flex h-16 w-16 items-center justify-center rounded-full bg-[#07111F] text-[#7CFF3D] shadow-2xl shadow-slate-900/25 ring-1 ring-white/10 transition hover:-translate-y-1"
        aria-label="Open Kai AI chat"
      >
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#7CFF3D] text-[#07111F]">
          <Sparkles className="h-3.5 w-3.5" />
        </span>

        <MessageCircle className="h-7 w-7 transition group-hover:scale-110" />
      </button>
    </div>
  );
}