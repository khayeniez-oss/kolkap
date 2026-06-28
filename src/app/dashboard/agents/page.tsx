import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  Globe2,
  Headphones,
  Inbox,
  MessageCircle,
  PenLine,
  PlayCircle,
  Plus,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  TestTube2,
  UsersRound,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

type NavItem = {
  label: string;
  href: string;
};

type AiRole = {
  name: string;
  status: "Recommended" | "Optional" | "Advanced";
  icon: LucideIcon;
  description: string;
  tasks: string[];
};

type SetupStep = {
  title: string;
  text: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "AI Staff", href: "/dashboard/agents" },
  { label: "Create AI", href: "/dashboard/create-ai" },
  { label: "AI Brain", href: "/dashboard/ai-brain" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Test AI", href: "/dashboard/test-ai" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Go Live", href: "/dashboard/go-live" },
];

const aiRoles: AiRole[] = [
  {
    name: "AI Receptionist",
    status: "Recommended",
    icon: Bot,
    description:
      "Welcomes customers, asks what they need, collects basic details, and routes the conversation.",
    tasks: [
      "Welcome customers",
      "Collect name and contact",
      "Ask customer needs",
      "Route inquiry",
    ],
  },
  {
    name: "AI WhatsApp Responder",
    status: "Recommended",
    icon: MessageCircle,
    description:
      "Replies to WhatsApp inquiries using your business knowledge, tone, handover rules, and approved answers.",
    tasks: [
      "Answer common questions",
      "Qualify leads",
      "Send next steps",
      "Trigger handover",
    ],
  },
  {
    name: "AI Customer Support",
    status: "Optional",
    icon: Headphones,
    description:
      "Handles support questions based on your services, prices, policies, FAQs, and business rules.",
    tasks: [
      "Support replies",
      "Policy answers",
      "Pricing questions",
      "Escalation",
    ],
  },
  {
    name: "AI Copywriter",
    status: "Optional",
    icon: PenLine,
    description:
      "Creates captions, scripts, ad copy, WhatsApp messages, customer replies, and other business content.",
    tasks: [
      "Social captions",
      "Ad copy",
      "Customer messages",
      "Content ideas",
    ],
  },
  {
    name: "Website Chat Assistant",
    status: "Advanced",
    icon: Globe2,
    description:
      "Supports website visitors, answers questions, captures leads, and hands over to a human when needed.",
    tasks: [
      "Website chat replies",
      "Lead capture",
      "Visitor questions",
      "Human handover",
    ],
  },
  {
    name: "Inbox Reply Assistant",
    status: "Advanced",
    icon: Inbox,
    description:
      "Generates suggested inbox replies for the business owner or team to review before sending.",
    tasks: [
      "Suggested replies",
      "Conversation context",
      "Customer follow-up",
      "Manual review",
    ],
  },
];

const setupSteps: SetupStep[] = [
  {
    title: "Create AI staff",
    text: "Create the AI role, name, tone, language, and customer reply behavior.",
    href: "/dashboard/create-ai",
    icon: Plus,
  },
  {
    title: "Add business knowledge",
    text: "Add FAQs, services, prices, policies, URLs, approved answers, and handover rules.",
    href: "/dashboard/knowledge-base",
    icon: BookOpen,
  },
  {
    title: "Review AI Brain",
    text: "Understand how Kolkap resolves the correct workspace before loading business knowledge.",
    href: "/dashboard/ai-brain",
    icon: Brain,
  },
  {
    title: "Test before going live",
    text: "Ask sample customer questions and review the AI replies before customers see them.",
    href: "/dashboard/test-ai",
    icon: TestTube2,
  },
  {
    title: "Connect channels",
    text: "Prepare Website Chat and WhatsApp so the AI can support real customer conversations.",
    href: "/dashboard/integrations/website-chat",
    icon: Globe2,
  },
  {
    title: "Go live safely",
    text: "Review readiness, credits, AI staff, knowledge, and channel setup before activation.",
    href: "/dashboard/go-live",
    icon: Rocket,
  },
];

const importantRules = [
  "AI staff must reply based on the correct workspace only.",
  "AI staff should use the business knowledge added by that business.",
  "AI staff should not invent prices, policies, availability, guarantees, or contact details.",
  "AI staff should hand over to a human when the customer asks for a real person.",
  "AI staff should be tested before Website Chat or WhatsApp goes live.",
  "Credits are used when AI generates replies, tests, content, or channel responses.",
];

function getStatusClass(status: AiRole["status"]) {
  if (status === "Recommended") {
    return "bg-[#7CFF3D] text-[#07111F]";
  }

  if (status === "Optional") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-slate-200 text-slate-700";
}

export default function AgentsPage() {
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
                  item.label === "AI Staff"
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              AI Staff Overview
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Build AI staff that replies based on your business knowledge.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Your AI staff should understand your business, use your saved
              knowledge, follow your tone, capture leads, support customers, and
              hand over to humans when needed.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard/create-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                <Plus className="h-6 w-6" />
                Create AI Staff
              </Link>

              <Link
                href="/dashboard/test-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <PlayCircle className="h-6 w-6" />
                Test AI
              </Link>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Setup Flow
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Create AI staff safely.
            </h2>

            <div className="mt-6 grid gap-4">
              {setupSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <Link
                    key={step.title}
                    href={step.href}
                    className="group flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 transition hover:bg-white"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xl font-black">{step.title}</p>
                        <Icon className="h-5 w-5 shrink-0 text-blue-600" />
                      </div>

                      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                        {step.text}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                AI Roles
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                Common AI staff roles
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              These roles explain how businesses can use Kolkap. Your actual AI
              staff setup is managed from the Create AI Staff page.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {aiRoles.map((role) => {
              const Icon = role.icon;

              return (
                <div
                  key={role.name}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                        <Icon className="h-8 w-8" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-3xl font-black tracking-[-0.04em]">
                            {role.name}
                          </h3>

                          <span
                            className={`rounded-full px-4 py-2 text-sm font-black ${getStatusClass(
                              role.status
                            )}`}
                          >
                            {role.status}
                          </span>
                        </div>

                        <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {role.tasks.map((task) => (
                      <div
                        key={task}
                        className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 py-3 text-base font-black text-slate-700"
                      >
                        {task}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/dashboard/create-ai"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white"
                    >
                      <Settings className="h-5 w-5" />
                      Create or Configure
                    </Link>

                    <Link
                      href="/dashboard/test-ai"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-lg font-black text-[#07111F]"
                    >
                      <PlayCircle className="h-5 w-5" />
                      Test Role
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Brain className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                AI Brain Rule
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                AI staff should never guess from random data.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
                Kolkap AI Brain must resolve the correct workspace first, then
                load only that business profile, AI staff, business knowledge,
                rules, and credit balance.
              </p>
            </div>

            <div className="grid gap-4">
              {importantRules.map((rule) => (
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
                Next Step
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                Train your AI with business knowledge.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                AI staff should not invent answers. Add FAQs, prices, services,
                policies, company details, approved answers, URLs, and handover
                rules so replies are based on real business information.
              </p>
            </div>

            <Link
              href="/dashboard/knowledge-base"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Go to Knowledge Base
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}