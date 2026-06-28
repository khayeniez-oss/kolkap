"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  CirclePause,
  Globe2,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type ChannelStatus = "ready" | "later";

type ChannelCard = {
  name: string;
  status: ChannelStatus;
  statusLabel: string;
  description: string;
  icon: LucideIcon;
  action: string;
  href?: string;
  highlighted?: boolean;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "AI Staff", href: "/dashboard/create-ai" },
  { label: "Business Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "Content", href: "/dashboard/content-studio" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Settings", href: "/dashboard/settings" },
];

const setupSteps = [
  {
    title: "Create AI staff",
    text: "Set up the AI role, tone, reply style, and purpose.",
  },
  {
    title: "Add business knowledge",
    text: "Add services, prices, FAQs, policies, opening hours, and approved answers.",
  },
  {
    title: "Connect channels",
    text: "Choose where customers can talk to your business.",
  },
  {
    title: "Test replies",
    text: "Send sample questions and improve the answer before customers see it.",
  },
  {
    title: "Go live or pause",
    text: "Turn AI replies on when ready. Pause anytime when your team needs control.",
  },
];

const messageFlowItems = [
  {
    title: "Customer sends a message",
    text: "From Website Chat, WhatsApp, or a future supported channel.",
  },
  {
    title: "Kolkap receives it",
    text: "Kolkap connects the message to the correct business workspace.",
  },
  {
    title: "AI staff helps reply",
    text: "The reply uses your selected AI staff and saved business knowledge.",
  },
  {
    title: "Inbox and leads update",
    text: "The conversation, lead activity, and usage are recorded for your team.",
  },
];

const userControlsList = [
  "Choose which AI staff replies",
  "Test messages before going live",
  "Turn AI replies on or off",
  "Pause a channel anytime",
  "Review conversations in Inbox",
  "Keep human handover available",
];

const kolkapHandlesList = [
  "Customer message intake",
  "Workspace matching",
  "Assigned AI staff selection",
  "Business knowledge use",
  "Conversation logging",
  "Lead and usage tracking",
];

function StatusPill({
  status,
  label,
}: {
  status: ChannelStatus;
  label: string;
}) {
  const className =
    status === "ready"
      ? "bg-[#7CFF3D] text-[#07111F]"
      : "bg-slate-200 text-slate-700";

  return (
    <span className={`rounded-full px-4 py-2 text-xs font-black ${className}`}>
      {label}
    </span>
  );
}

export default function IntegrationsPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;

  const channels: ChannelCard[] = [
    {
      name: "Website Chat",
      status: "ready",
      statusLabel: "Ready",
      description:
        "Let visitors message your business from your website and receive AI-assisted replies.",
      icon: MessageCircle,
      action: "Manage Website Chat",
      href: "/dashboard/integrations/website-chat",
      highlighted: true,
    },
    {
      name: "WhatsApp",
      status: "ready",
      statusLabel: "Ready",
      description:
        "Let customers message your business on WhatsApp and receive AI-assisted replies.",
      icon: Smartphone,
      action: "Manage WhatsApp",
      href: "/dashboard/integrations/whatsapp",
      highlighted: true,
    },
    {
      name: "SMS",
      status: "later",
      statusLabel: "Coming Later",
      description:
        "SMS support will be added later as a separate customer channel for businesses that need text message replies.",
      icon: Smartphone,
      action: "Coming Later",
    },
  ];

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading customer channels...
          </div>
        </section>
      </main>
    );
  }

  if (workspaceState.error) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] border border-red-200 bg-red-50 p-8 text-red-700">
            <p className="text-xl font-black">
              Customer Channels page could not load.
            </p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <nav className="flex flex-wrap items-center justify-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <Link
              href="/dashboard"
              className="mb-7 inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>

            <div className="mb-7 flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              Customer Channels
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Choose where customers can talk to your business.
            </h1>

            <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
              Connect Website Chat and WhatsApp, then choose which AI staff
              should help with replies. SMS support will be added later as a
              separate channel.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="#channels"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                <Globe2 className="h-6 w-6" />
                Choose Channel
              </a>

              <Link
                href="/dashboard/go-live"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Rocket className="h-6 w-6" />
                Go Live
              </Link>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <WalletCards className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Workspace
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {workspace?.business_name || "Your business"}
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
              Kolkap keeps channel setup simple. You choose the customer
              channel, assign your AI staff, test replies, and go live when your
              setup is ready.
            </p>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Simple Flow
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              Create, connect, test, then go live.
            </h2>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              Your business should not need to manage technical setup. Kolkap
              helps keep the connection work in the background so your team can
              focus on customers.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            {setupSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.7rem] border border-slate-200 bg-[#F7F9FA] p-5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                  {index + 1}
                </div>

                <h3 className="text-xl font-black tracking-[-0.03em]">
                  {step.title}
                </h3>

                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="channels">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Channels
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                Available customer channels
              </h2>
            </div>

            <p className="max-w-lg text-lg font-semibold leading-8 text-slate-600">
              Choose where Kolkap AI staff should support customer
              conversations.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {channels.map((channel) => {
              const Icon = channel.icon;

              const cardContent = (
                <>
                  <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                      channel.highlighted
                        ? "bg-white text-[#07111F]"
                        : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-3xl font-black tracking-[-0.04em]">
                      {channel.name}
                    </h3>

                    <StatusPill
                      status={channel.status}
                      label={channel.statusLabel}
                    />
                  </div>

                  <p
                    className={`mt-4 text-lg font-semibold leading-8 ${
                      channel.highlighted ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {channel.description}
                  </p>

                  <div
                    className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-base font-black ${
                      channel.highlighted
                        ? "bg-white text-[#07111F]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {channel.action}
                    {channel.href ? <ArrowRight className="h-5 w-5" /> : null}
                  </div>
                </>
              );

              const className = `rounded-[2rem] border p-6 shadow-sm shadow-slate-900/5 transition ${
                channel.highlighted
                  ? "border-[#07111F] bg-[#07111F] text-white hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                  : "cursor-not-allowed border-slate-200 bg-white text-[#07111F] opacity-85"
              }`;

              if (!channel.href) {
                return (
                  <div key={channel.name} className={className}>
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link key={channel.name} href={channel.href} className={className}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Sparkles className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              How Kolkap Works
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
              Kolkap connects your customer channels to your AI staff and Inbox.
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
              When a customer sends a message, Kolkap helps match it to your
              workspace, uses the assigned AI staff, supports the reply, and
              records the conversation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {messageFlowItems.map((item, index) => (
              <div
                key={item.title}
                className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                  {index + 1}
                </div>

                <h3 className="text-xl font-black tracking-[-0.03em]">
                  {item.title}
                </h3>

                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <UsersRound className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              What You Control
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Simple business controls.
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
              Your team controls the business side: AI staff, replies, channels,
              handover, and customer conversations.
            </p>

            <div className="mt-6 space-y-4">
              {userControlsList.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Bot className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              What Kolkap Supports
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Kolkap keeps the connection work in the background.
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
              Kolkap is designed so business users can manage customer channels
              without needing to handle technical setup themselves.
            </p>

            <div className="mt-6 space-y-4">
              {kolkapHandlesList.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Ready to Go Live
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Your AI staff should work only after setup and testing.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                Before going live, make sure your AI staff is created, business
                knowledge is added, test replies look good, your plan or trial
                is active, and credits are available.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/test-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                Test AI
                <Bot className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/go-live"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F]"
              >
                Go Live
                <CirclePause className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}