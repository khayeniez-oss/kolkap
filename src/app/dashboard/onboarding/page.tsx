"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe2,
  Headphones,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  PlayCircle,
  PlugZap,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

type SetupStep = {
  step: string;
  title: string;
  text: string;
  href: string;
  icon: LucideIcon;
  status: string;
};

type QuickLink = {
  label: string;
  href: string;
};

const navItems: QuickLink[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Onboarding", href: "/dashboard/onboarding" },
  { label: "Create AI", href: "/dashboard/create-ai" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Test AI", href: "/dashboard/test-ai" },
  { label: "Go Live", href: "/dashboard/go-live" },
  { label: "Usage", href: "/dashboard/usage" },
  { label: "Billing", href: "/dashboard/billing" },
];

const setupSteps: SetupStep[] = [
  {
    step: "01",
    title: "Activate trial or plan",
    text: "Choose a plan and activate the workspace. Kolkap needs an active trial or paid plan before real automation should go live.",
    href: "/pricing",
    icon: CreditCard,
    status: "Required",
  },
  {
    step: "02",
    title: "Complete business settings",
    text: "Add business name, business type, contact details, WhatsApp number, address, country, timezone, and default AI preferences.",
    href: "/dashboard/settings",
    icon: Building2,
    status: "Required",
  },
  {
    step: "03",
    title: "Create your first AI staff",
    text: "Create an AI receptionist, WhatsApp responder, website chat assistant, customer support assistant, or another AI role.",
    href: "/dashboard/create-ai",
    icon: Bot,
    status: "Required",
  },
  {
    step: "04",
    title: "Add business knowledge",
    text: "Add FAQs, pricing, services, policies, approved answers, and business rules so the AI can reply accurately.",
    href: "/dashboard/knowledge-base",
    icon: BookOpen,
    status: "Required",
  },
  {
    step: "05",
    title: "Test the AI safely",
    text: "Use Test AI to send sample customer questions, review replies, and improve the knowledge base before real customers see answers.",
    href: "/dashboard/test-ai",
    icon: PlayCircle,
    status: "Before Live",
  },
  {
    step: "06",
    title: "Set up Website Chat",
    text: "Choose widget text, selected AI staff, active status, auto-reply, human handover, and allowed website domains.",
    href: "/dashboard/integrations/website-chat",
    icon: Globe2,
    status: "Channel",
  },
  {
    step: "07",
    title: "Set up WhatsApp",
    text: "Add WhatsApp numbers and manage AI support, auto-reply, human handover, and primary number settings.",
    href: "/dashboard/integrations/whatsapp",
    icon: MessageCircle,
    status: "Channel",
  },
  {
    step: "08",
    title: "Review Go Live checklist",
    text: "Confirm plan, credits, AI staff, saved AI test, business knowledge, and customer channel readiness before activating AI.",
    href: "/dashboard/go-live",
    icon: Rocket,
    status: "Final Step",
  },
];

const readinessItems = [
  {
    label: "Active trial or plan",
    value: "Required",
    note: "The workspace should have an active trial or subscription before real customer automation goes live.",
  },
  {
    label: "Business profile",
    value: "Required",
    note: "Business details help the AI understand the company, location, tone, and customer context.",
  },
  {
    label: "AI staff",
    value: "Required",
    note: "At least one AI staff member should exist and be tested before activation.",
  },
  {
    label: "Business knowledge",
    value: "Required",
    note: "FAQs, services, prices, policies, and approved replies should be saved before live replies.",
  },
  {
    label: "Credits",
    value: "Required",
    note: "AI replies and generated content use credits. Auto-reply should stop when credits run out.",
  },
  {
    label: "Customer channel",
    value: "Required",
    note: "Website Chat or WhatsApp should be configured before AI automation is activated.",
  },
];

const safetyRules = [
  "Test AI, Inbox AI suggestions, and Website Chat AI replies use 3 credits.",
  "WhatsApp AI replies use 5 credits.",
  "Content Studio generations use 10 credits.",
  "Longer replies, campaign content, and larger tasks may use more credits.",
  "Auto-reply should pause when credits are not available.",
  "Human handover should be available for complaints, payment questions, legal questions, urgent issues, or sensitive customer cases.",
  "Conversations, messages, leads, usage, and credits must be saved under the correct business workspace.",
];

const channelCards = [
  {
    title: "Website Chat",
    text: "Install the website chat widget, select the AI staff, and control auto-reply from the Website Chat page.",
    href: "/dashboard/integrations/website-chat",
    icon: Globe2,
  },
  {
    title: "WhatsApp",
    text: "Manage WhatsApp numbers, AI support, auto-reply, primary number, and human handover from the WhatsApp page.",
    href: "/dashboard/integrations/whatsapp",
    icon: MessageCircle,
  },
  {
    title: "Inbox",
    text: "Review customer messages, AI suggestions, handover, leads, and conversation status from Inbox.",
    href: "/dashboard/inbox",
    icon: Inbox,
  },
];

const finalLinks = [
  {
    title: "Usage",
    text: "Track credits used, AI actions, messages, skipped auto-replies, and billing activity.",
    href: "/dashboard/usage",
    icon: BarChart3,
  },
  {
    title: "Top Up",
    text: "Buy extra credits through Stripe when your workspace needs more capacity.",
    href: "/dashboard/top-up",
    icon: WalletCards,
  },
  {
    title: "Reports",
    text: "Review conversations, leads, AI activity, channel performance, handover, and credit usage.",
    href: "/dashboard/reports",
    icon: TrendingUp,
  },
  {
    title: "Team",
    text: "Invite and manage people who can help operate the workspace.",
    href: "/dashboard/team",
    icon: UsersRound,
  },
];

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 lg:flex-row lg:items-center lg:justify-between">
          <KolkapLogo size="sm" />

          <nav className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-5 py-3 text-base font-black transition ${
                  item.href === "/dashboard/onboarding"
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              Get Started
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Set up Kolkap before going live.
            </h1>

            <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
              Follow the safe setup path so your AI staff can reply using the
              correct business knowledge, capture leads, manage handover, and
              use credits properly before real customer conversations begin.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard/create-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                Create AI Staff
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/knowledge-base"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Add Knowledge
                <BookOpen className="h-6 w-6" />
              </Link>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Workspace Readiness
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Do not go live until the basics are ready.
            </h2>

            <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
              Kolkap should only go live after your plan, business profile, AI
              staff, knowledge, testing, credits, and customer channel are ready.
            </p>

            <div className="mt-7 grid gap-3">
              <Link
                href="/dashboard/go-live"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
              >
                Go Live Checklist
                <Rocket className="h-5 w-5" />
              </Link>

              <Link
                href="/dashboard/usage"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-base font-black text-[#07111F]"
              >
                Check Usage
                <BarChart3 className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Setup Path
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                Complete these steps in order.
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              This onboarding page shows the safest order before real AI replies
              are activated for customers.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {setupSteps.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.step}
                  href={item.href}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                        <Icon className="h-8 w-8" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-[#F7F9FA] px-4 py-2 text-sm font-black text-slate-500">
                            {item.step}
                          </span>

                          <span className="rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                            {item.status}
                          </span>
                        </div>

                        <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">
                          {item.title}
                        </h3>

                        <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                          {item.text}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="h-7 w-7 shrink-0 text-slate-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Settings className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Readiness Details
                </p>

                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  What must be ready.
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {readinessItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xl font-black">{item.label}</p>

                      <p className="mt-2 text-lg font-semibold leading-8 text-slate-600">
                        {item.note}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-white px-4 py-2 text-base font-black text-[#07111F]">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Safety Rules
                </p>

                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Must be true before live.
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {safetyRules.map((rule) => (
                <div
                  key={rule}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#07111F]" />

                  <p className="text-lg font-black leading-8">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Customer Channels
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              Connect the channels customers will use.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {channelCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-8 w-8" />
                  </div>

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    {card.title}
                  </h3>

                  <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                    {card.text}
                  </p>

                  <p className="mt-6 inline-flex items-center gap-2 text-base font-black text-blue-600">
                    Open
                    <ArrowRight className="h-5 w-5" />
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Go Live Logic
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Go live only when the workspace is ready.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                Auto-reply should only run when there is an active trial or
                plan, at least one AI staff, enough business knowledge, a saved
                AI test, available credits, and at least one customer channel
                ready.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/go-live"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                Continue Setup
                <Rocket className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/top-up"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                Manage Credits
                <WalletCards className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              After Setup
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              Monitor performance after going live.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {finalLinks.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-2xl font-black tracking-[-0.04em]">
                    {card.title}
                  </h3>

                  <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                    {card.text}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <LayoutDashboard className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Ready to continue?
              </p>

              <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.05em]">
                Return to Dashboard when your onboarding steps are clear.
              </h2>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white"
            >
              Open Dashboard
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}