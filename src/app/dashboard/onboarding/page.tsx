import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  PlayCircle,
  PlugZap,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Onboarding", href: "/dashboard/onboarding" },
  { label: "AI Brain", href: "/dashboard/ai-brain" },
  { label: "AI Staff", href: "/dashboard/create-ai" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Usage", href: "/dashboard/usage" },
  { label: "Billing", href: "/dashboard/billing" },
];

const setupSteps = [
  {
    step: "01",
    title: "Start your free trial",
    text: "Choose a plan and activate your 7-day free trial. Payment method is needed to activate your trial, but you won’t be charged today.",
    href: "/pricing",
    icon: CreditCard,
    status: "Trial",
  },
  {
    step: "02",
    title: "Complete business profile",
    text: "Add business name, industry, website, WhatsApp number, support details, and company description.",
    href: "/dashboard/settings",
    icon: Building2,
    status: "Required",
  },
  {
    step: "03",
    title: "Create your first AI staff",
    text: "Create an AI receptionist, WhatsApp responder, customer support assistant, copywriter, or another AI role.",
    href: "/dashboard/create-ai",
    icon: Bot,
    status: "Required",
  },
  {
    step: "04",
    title: "Add business knowledge",
    text: "Add FAQs, pricing, services, policies, approved answers, and business rules so your AI can answer accurately.",
    href: "/dashboard/knowledge-base",
    icon: BookOpen,
    status: "Required",
  },
  {
    step: "05",
    title: "Test the AI safely",
    text: "Use Test AI to send sample customer questions, review replies, and improve your Knowledge Base before real customers see it.",
    href: "/dashboard/test-ai",
    icon: PlayCircle,
    status: "Before live",
  },
  {
    step: "06",
    title: "Check usage and credits",
    text: "Every successful AI generation uses credits. Test AI, Inbox AI Reply, Content Studio, website chat, and WhatsApp AI replies normally use 1 credit.",
    href: "/dashboard/usage",
    icon: BarChart3,
    status: "Important",
  },
  {
    step: "07",
    title: "Connect customer channel",
    text: "Connect WhatsApp, website chat, email, or another customer channel so real messages can reach Kolkap.",
    href: "/dashboard/integrations",
    icon: PlugZap,
    status: "Channel",
  },
  {
    step: "08",
    title: "Go live",
    text: "Activate AI replies only after business profile, AI staff, knowledge, testing, credits, and channel setup are ready.",
    href: "/dashboard/go-live",
    icon: Rocket,
    status: "Final step",
  },
];

const readinessItems = [
  {
    label: "Trial / plan",
    value: "Required",
    note: "Free trial or active subscription should be ready before live.",
  },
  {
    label: "Business profile",
    value: "Required",
    note: "Business details help the AI answer correctly.",
  },
  {
    label: "AI staff setup",
    value: "Required",
    note: "At least one AI staff should be created and configured.",
  },
  {
    label: "Knowledge base",
    value: "Required",
    note: "Add FAQs, pricing, services, policies, and approved answers.",
  },
  {
    label: "Credits",
    value: "Required",
    note: "AI replies and generations use credits. Auto-reply should pause if credits run out.",
  },
  {
    label: "Channel connection",
    value: "Recommended",
    note: "Connect WhatsApp, website chat, email, or another customer channel.",
  },
];

const safetyRules = [
  "Payment method is needed to activate the free trial, but the user is not charged today.",
  "Monthly billing starts after the 7-day trial unless cancelled before the trial ends.",
  "AI must use the correct business workspace and Knowledge Base.",
  "Every successful AI generation or AI reply should consume credits.",
  "Auto-reply should pause if the workspace has no credits left.",
  "Human review should be available for sensitive issues, complaints, payment questions, legal questions, or urgent cases.",
  "Conversations and leads must be saved under the correct business workspace.",
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
                key={item.label}
                href={item.href}
                className={`rounded-full border px-5 py-3 text-base font-black transition ${
                  item.label === "Onboarding"
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
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              Get Started
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Set up Kolkap before going live.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Follow the setup path so your AI staff can reply safely, use the
              correct business knowledge, capture leads, and manage credits
              before real customer conversations begin.
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
                Complete these steps in order
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              This onboarding page explains the safe setup path before AI
              replies are activated for real customers.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {setupSteps.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
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
                  What must be ready
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
                  Must be true before live
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
                plan, at least one AI staff, enough business knowledge, and
                available credits. Every successful AI reply uses 1 credit.
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
      </div>
    </main>
  );
}