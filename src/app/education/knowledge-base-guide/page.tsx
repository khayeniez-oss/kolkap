"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clipboard,
  FileText,
  Link2,
  Sparkles,
} from "lucide-react";

type SampleTemplate = {
  title: string;
  category: string;
  source: "Write Information" | "Add Important URL";
  description: string;
  template: string;
};

const sampleTemplates: SampleTemplate[] = [
  {
    title: "Business Information",
    category: "Business Information",
    source: "Write Information",
    description:
      "Use this to explain what your business does, who you help, and how customers can contact you.",
    template:
      "Our business is [Business Name]. We provide [products/services] for [target customers]. We are located in [location] and customers can contact us through [WhatsApp/email/phone/website]. Our main goal is to help customers with [main benefit].",
  },
  {
    title: "Products or Services",
    category: "Product / Service",
    source: "Write Information",
    description:
      "Use this to teach your AI what you sell or what services you offer.",
    template:
      "We offer [product/service name]. This is suitable for customers who need [customer need]. The service includes [what is included]. Customers usually ask about [common question]. If customers are interested, guide them to [next step: book, contact, pay, schedule, visit website].",
  },
  {
    title: "Pricing or Packages",
    category: "Pricing / Packages",
    source: "Write Information",
    description:
      "Use this so your AI can answer price and package questions clearly.",
    template:
      "Our pricing is: [Package 1] costs [price] and includes [details]. [Package 2] costs [price] and includes [details]. Payment can be made through [payment methods]. If customers ask for discounts or special pricing, politely ask them to contact our team.",
  },
  {
    title: "Common FAQ",
    category: "FAQ",
    source: "Write Information",
    description:
      "Use this for common customer questions and the official answers.",
    template:
      "Question: [Customer question]\nAnswer: [Official answer]. If the customer needs more help, ask for their name, contact number, and what they need assistance with.",
  },
  {
    title: "Booking or Appointment Rules",
    category: "Policy",
    source: "Write Information",
    description:
      "Use this if your business accepts appointments, reservations, viewings, or bookings.",
    template:
      "Customers can book by providing their name, phone number, preferred date, preferred time, and service/property/product they are interested in. Our team will confirm the schedule before the appointment is final. If the requested time is not available, offer the closest available option.",
  },
  {
    title: "Refund, Cancellation, or Policy",
    category: "Policy",
    source: "Write Information",
    description:
      "Use this to make sure your AI gives safe and official policy answers.",
    template:
      "Our policy is: [write refund/cancellation/warranty/delivery policy]. Customers must contact us within [time period] if they have an issue. The AI should explain the policy politely and avoid promising approval unless our team confirms it.",
  },
  {
    title: "Handover to Human Rule",
    category: "Handover Rule",
    source: "Write Information",
    description:
      "Use this to tell your AI when it should stop and pass the conversation to your team.",
    template:
      "The AI should hand over to a human when the customer asks for a special discount, has a complaint, requests a refund, wants legal/contract advice, asks for custom pricing, or is ready to speak with a staff member. Before handover, collect the customer’s name, phone number, and question.",
  },
  {
    title: "Do Not Say Rule",
    category: "Do Not Say",
    source: "Write Information",
    description:
      "Use this to prevent your AI from making wrong promises.",
    template:
      "The AI must not promise guaranteed approval, guaranteed availability, guaranteed discount, guaranteed refund, or guaranteed delivery time unless this is officially confirmed by our team. If unsure, the AI should say that our team will confirm the details.",
  },
  {
    title: "Important Website URL",
    category: "Important Link",
    source: "Add Important URL",
    description:
      "Use this when your business already has an official page the AI should know about.",
    template:
      "Title: [Pricing Page / FAQ Page / Policy Page / Services Page]\nURL: https://yourcompany.com/[page]\nNote: AI should use this page when customers ask about [pricing / policy / services / FAQ / terms].",
  },
  {
    title: "Location and Opening Hours",
    category: "Business Information",
    source: "Write Information",
    description:
      "Use this so your AI can answer where you are and when you are open.",
    template:
      "Our business is located at [full location or service area]. We are open from [opening days and hours]. Customers can visit by [appointment/walk-in/booking only]. If customers ask for directions, guide them to [Google Maps link or landmark].",
  },
];

export default function KnowledgeBaseGuidePage() {
  const [copiedTitle, setCopiedTitle] = useState("");

  async function copyTemplate(template: string, title: string) {
    try {
      await navigator.clipboard.writeText(template);
      setCopiedTitle(title);

      window.setTimeout(() => {
        setCopiedTitle("");
      }, 1800);
    } catch {
      setCopiedTitle("");
    }
  }

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7">
            <Link
              href="/dashboard/knowledge-base"
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Knowledge Base
            </Link>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <BookOpen className="h-5 w-5" />
            Knowledge Base Guide
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Sample templates to help you write your AI knowledge base.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Use these examples as a guide. You can copy a sample, edit the
            details, then paste it into your Knowledge Base so your AI can
            answer customers correctly.
          </p>
        </div>

        <section className="mb-8 rounded-[2.2rem] border border-blue-100 bg-blue-50 p-6 text-blue-950 shadow-sm shadow-blue-900/5 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700">
              <Sparkles className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
                Simple Rule
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                Write clear facts. One topic per entry. Keep it simple, direct,
                and useful for customer questions.
              </h2>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {sampleTemplates.map((sample, index) => {
            const isCopied = copiedTitle === sample.title;

            return (
              <article
                key={sample.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#07111F] px-4 py-2 text-sm font-black text-[#7CFF3D]">
                      <FileText className="h-4 w-4" />
                      Sample {index + 1}
                    </div>

                    <h2 className="text-3xl font-black tracking-[-0.05em]">
                      {sample.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyTemplate(sample.template, sample.title)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#F7F9FA] px-4 py-3 text-sm font-black text-[#07111F] transition hover:bg-slate-100"
                  >
                    {isCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                    {sample.category}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">
                    <Link2 className="h-3 w-3" />
                    {sample.source}
                  </span>
                </div>

                <p className="mb-5 text-base font-semibold leading-8 text-slate-600">
                  {sample.description}
                </p>

                <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                  <pre className="whitespace-pre-wrap break-words text-base font-semibold leading-8 text-slate-800">
                    {sample.template}
                  </pre>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-[2.2rem] bg-[#07111F] p-7 text-white sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              Ready to add your knowledge?
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Go back to Knowledge Base and create your first entry.
            </h2>
          </div>

          <Link
            href="/dashboard/knowledge-base"
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-base font-black text-[#07111F] transition hover:-translate-y-0.5"
          >
            Back to Knowledge Base
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Link>
        </div>
      </section>
    </main>
  );
}