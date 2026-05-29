"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Copy,
  FileText,
  Megaphone,
  MessageCircle,
  PenLine,
  RefreshCcw,
  Save,
  Sparkles,
  Video,
  WandSparkles,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["AI Staff", "/dashboard/agents"],
  ["Knowledge", "/dashboard/knowledge-base"],
  ["Inbox", "/dashboard/inbox"],
  ["Leads", "/dashboard/leads"],
  ["Content", "/dashboard/content-studio"],
  ["Billing", "/dashboard/billing"],
];

const contentTypes = [
  {
    id: "property",
    title: "Property Description",
    description: "Generate titles, descriptions, highlights, and inquiry messages.",
    icon: FileText,
    inputTitle: "Property description generator",
    inputNote: "Create polished property copy from simple listing details.",
    fields: [
      ["Property type", "Villa, apartment, office, land..."],
      ["Location", "Berawa, Bali"],
      ["Price / budget", "Rp 3B"],
      ["Key details", "Private pool, near cafes, bright living area, good access..."],
    ],
    outputs: [
      {
        label: "Title",
        content: "Modern 3-Bedroom Villa in Berawa with Private Pool",
      },
      {
        label: "Description",
        content:
          "Located in one of Berawa’s most convenient lifestyle areas, this modern 3-bedroom villa offers a private pool, bright living spaces, and easy access to cafes, beaches, restaurants, and daily essentials.",
      },
      {
        label: "WhatsApp Message",
        content:
          "Hi, thanks for your interest. This villa is located in Berawa and features 3 bedrooms, a private pool, and easy access to cafes and beaches. Would you like more details or schedule a viewing?",
      },
    ],
  },
  {
    id: "social",
    title: "Social Caption",
    description: "Create Instagram, Facebook, LinkedIn, and TikTok captions.",
    icon: PenLine,
    inputTitle: "Social caption generator",
    inputNote: "Create captions that are clear, engaging, and ready to post.",
    fields: [
      ["Platform", "Instagram, Facebook, LinkedIn, TikTok..."],
      ["Topic", "AI receptionist for real estate agents"],
      ["Tone", "Professional, friendly, premium, direct..."],
      ["Key message", "Save time, reply faster, capture more leads..."],
    ],
    outputs: [
      {
        label: "Caption",
        content:
          "Your customers should never wait hours for a reply. With Kolkap, your AI receptionist can respond instantly, capture lead details, and notify your team when a human follow-up is needed.",
      },
      {
        label: "CTA",
        content: "Start building your AI business team with Kolkap.",
      },
      {
        label: "Hashtags",
        content:
          "#AIStaff #CustomerSupport #LeadGeneration #BusinessAutomation #Kolkap",
      },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp Follow-up",
    description: "Write clear messages for hot, warm, and cold leads.",
    icon: MessageCircle,
    inputTitle: "WhatsApp follow-up generator",
    inputNote: "Create reply templates for customer conversations and lead follow-up.",
    fields: [
      ["Lead type", "Hot, warm, cold, follow-up..."],
      ["Customer interest", "Villa in Bali, AI support package, content service..."],
      ["Next action", "Schedule viewing, send package, book demo..."],
      ["Tone", "Friendly but professional"],
    ],
    outputs: [
      {
        label: "Follow-up Message",
        content:
          "Hi Budi, thank you for your interest. Since you’re looking to view this week, I can help arrange the next step. Would you prefer to schedule a viewing in Canggu or Berawa first?",
      },
      {
        label: "Short Version",
        content:
          "Hi Budi, would you like me to help schedule a viewing for the Berawa/Canggu villa options this week?",
      },
      {
        label: "Handover Note",
        content:
          "Customer is a hot lead. Budget Rp 3B, prefers Canggu/Berawa, wants viewing this week.",
      },
    ],
  },
  {
    id: "video",
    title: "Video Script",
    description: "Create short scripts for reels, ads, and explainers.",
    icon: Video,
    inputTitle: "Video script generator",
    inputNote: "Create short scripts for reels, product videos, tutorials, and ads.",
    fields: [
      ["Video type", "Reel, explainer, ad, tutorial..."],
      ["Topic", "How Kolkap replies to customers 24/7"],
      ["Length", "30 seconds, 45 seconds, 1 minute..."],
      ["Key points", "AI replies, lead capture, human handover..."],
    ],
    outputs: [
      {
        label: "Hook",
        content:
          "What if your business could reply to every customer instantly, even while you sleep?",
      },
      {
        label: "Script",
        content:
          "Meet Kolkap — your AI business team. It replies to customer questions, captures lead details, summarizes conversations, and alerts your team when human follow-up is needed.",
      },
      {
        label: "CTA",
        content:
          "Start with your AI receptionist and turn more conversations into customers.",
      },
    ],
  },
  {
    id: "ad",
    title: "Ad Copy",
    description: "Generate campaign copy for Facebook, Instagram, and Google.",
    icon: Megaphone,
    inputTitle: "Ad copy generator",
    inputNote: "Create direct-response copy for campaigns and landing pages.",
    fields: [
      ["Audience", "Business owners, agents, agencies, clinics..."],
      ["Offer", "AI receptionist, WhatsApp responder, lead capture..."],
      ["Pain point", "Slow replies, missed leads, no time for content..."],
      ["CTA", "Start trial, book demo, join waitlist..."],
    ],
    outputs: [
      {
        label: "Headline",
        content: "Stop Missing Customer Messages",
      },
      {
        label: "Primary Text",
        content:
          "Kolkap helps your business reply faster, capture more leads, and support customers with AI staff that works 24/7.",
      },
      {
        label: "CTA",
        content: "Build your AI business team today.",
      },
    ],
  },
  {
    id: "calendar",
    title: "Content Calendar",
    description: "Plan weekly content ideas and posting angles.",
    icon: CalendarDays,
    inputTitle: "Content calendar generator",
    inputNote: "Plan content topics for the week based on your business goals.",
    fields: [
      ["Business type", "Real estate, hotel, clinic, agency..."],
      ["Goal", "Get leads, educate customers, build trust..."],
      ["Posting frequency", "3 posts/week, daily, weekly..."],
      ["Main topics", "AI support, property listings, lead generation..."],
    ],
    outputs: [
      {
        label: "Monday",
        content:
          "Educational post: Why fast customer replies increase trust and lead conversion.",
      },
      {
        label: "Wednesday",
        content:
          "Product post: How Kolkap’s AI receptionist captures customer details automatically.",
      },
      {
        label: "Friday",
        content:
          "Case-style post: Example of a WhatsApp lead being qualified by AI and handed over to a human.",
      },
    ],
  },
];

const recentContent = [
  "Villa listing description for Berawa",
  "WhatsApp reply for hot lead follow-up",
  "Instagram caption for AI receptionist",
  "Facebook ad copy for property owners",
];

export default function ContentStudioPage() {
  const [selectedId, setSelectedId] = useState("property");

  const selectedType = useMemo(() => {
    return contentTypes.find((type) => type.id === selectedId) || contentTypes[0];
  }, [selectedId]);

  const SelectedIcon = selectedType.icon;

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 lg:flex-row lg:items-center lg:justify-between">
          <KolkapLogo size="sm" />

          <nav className="flex flex-wrap gap-3">
            {navItems.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className={`rounded-full border px-5 py-3 text-base font-black transition ${
                  label === "Content"
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              Content Studio
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Create business content with AI.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Choose the content type, add the details, and preview the output.
              Later this will connect to real AI generation.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5">
                <WandSparkles className="h-6 w-6" />
                Generate Content
              </button>

              <button className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                <Sparkles className="h-6 w-6" />
                Use Business Knowledge
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Recent Content
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Saved drafts
            </h2>

            <div className="mt-6 space-y-4">
              {recentContent.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="text-xl font-black leading-7">{item}</p>
                  </div>

                  <ArrowRight className="h-6 w-6 shrink-0 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Choose Content Type
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                What do you want to create?
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              Click a content type below. The input form and output preview will
              change based on your selection.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              const active = selectedId === type.id;

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedId(type.id)}
                  className={`rounded-[2rem] border p-6 text-left shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
                    active
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-white text-[#07111F] hover:border-blue-400"
                  }`}
                >
                  <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                      active ? "bg-white text-[#07111F]" : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    {type.title}
                  </h3>

                  <p
                    className={`mt-4 text-lg font-semibold leading-8 ${
                      active ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <SelectedIcon className="h-8 w-8" />
              </div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Input Details
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                {selectedType.inputTitle}
              </h2>
              <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                {selectedType.inputNote}
              </p>
            </div>

            <form className="space-y-5">
              {selectedType.fields.map(([label, placeholder], index) => (
                <label key={label} className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {label}
                  </span>

                  {index === selectedType.fields.length - 1 ? (
                    <textarea
                      placeholder={placeholder}
                      rows={6}
                      className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={placeholder}
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  )}
                </label>
              ))}

              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
              >
                <WandSparkles className="h-6 w-6" />
                Generate {selectedType.title}
              </button>
            </form>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  AI Output
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {selectedType.title} preview
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-[#07111F]">
                  <RefreshCcw className="h-5 w-5" />
                  Regenerate
                </button>
                <button className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-base font-black text-white">
                  <Save className="h-5 w-5" />
                  Save
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {selectedType.outputs.map((output) => (
                <div
                  key={output.label}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-base font-black uppercase tracking-[0.14em] text-slate-500">
                      {output.label}
                    </p>

                    <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700">
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>

                  <p className="text-lg font-semibold leading-8 text-slate-700">
                    {output.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Next Step
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Track usage and billing.
              </h2>
              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                AI content generation and replies cost money, so users need a
                clear billing and usage page.
              </p>
            </div>

            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Go to Billing
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}