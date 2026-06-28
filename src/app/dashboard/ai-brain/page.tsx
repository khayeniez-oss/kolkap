import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  Database,
  Fingerprint,
  Globe2,
  Inbox,
  LockKeyhole,
  MessageCircle,
  PlugZap,
  Rocket,
  Route,
  Send,
  ShieldCheck,
  TestTube2,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

type BrainStep = {
  number: string;
  title: string;
  text: string;
  icon: LucideIcon;
};

type WorkspaceCard = {
  business: string;
  type: string;
  color: string;
  items: string[];
};

type IdentitySource = {
  title: string;
  text: string;
  icon: LucideIcon;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "AI Brain", href: "/dashboard/ai-brain" },
  { label: "Create AI Staff", href: "/dashboard/create-ai" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Test AI", href: "/dashboard/test-ai" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "Website Chat", href: "/dashboard/integrations/website-chat" },
  { label: "WhatsApp", href: "/dashboard/integrations/whatsapp" },
  { label: "Go Live", href: "/dashboard/go-live" },
];

const brainSteps: BrainStep[] = [
  {
    number: "01",
    title: "Message or request comes in",
    text: "A customer message, test message, inbox reply request, content request, website chat message, or WhatsApp message reaches Kolkap.",
    icon: MessageCircle,
  },
  {
    number: "02",
    title: "Resolve the correct workspace",
    text: "Kolkap identifies the correct workspace from the logged-in user, active team member, selected workspace, website widget, or connected WhatsApp channel.",
    icon: Fingerprint,
  },
  {
    number: "03",
    title: "Load that business profile",
    text: "Kolkap loads the selected business workspace only, including profile, settings, status, trial, billing, and channel readiness.",
    icon: Database,
  },
  {
    number: "04",
    title: "Load the right AI staff",
    text: "Kolkap selects the AI staff member for the channel or task, such as receptionist, WhatsApp responder, support assistant, or content assistant.",
    icon: Bot,
  },
  {
    number: "05",
    title: "Load private knowledge",
    text: "Kolkap loads only that workspace’s active business knowledge, such as FAQs, services, prices, policies, approved answers, URLs, and handover rules.",
    icon: BookOpen,
  },
  {
    number: "06",
    title: "Check credits and safety",
    text: "Kolkap checks workspace access, active trial or subscription, credit balance, safe instructions, tone, language, and handover rules before generating.",
    icon: ShieldCheck,
  },
  {
    number: "07",
    title: "Generate as that business",
    text: "The AI generates a reply or content as the selected business, not as generic Kolkap support, and avoids exposing internal system details.",
    icon: Brain,
  },
  {
    number: "08",
    title: "Save usage and response",
    text: "After successful generation, the API logs usage, credits are deducted by the database trigger, and the result returns to the correct page or channel.",
    icon: Send,
  },
];

const workspaceCards: WorkspaceCard[] = [
  {
    business: "Business A",
    type: "Bali Villa Agency",
    color: "bg-[#7CFF3D] text-[#07111F]",
    items: [
      "workspace_id",
      "AI Staff",
      "Knowledge Base",
      "Inbox",
      "Leads",
      "Settings",
      "Credits",
    ],
  },
  {
    business: "Business B",
    type: "Clinic",
    color: "bg-blue-600 text-white",
    items: [
      "workspace_id",
      "AI Staff",
      "Knowledge Base",
      "Inbox",
      "Leads",
      "Settings",
      "Credits",
    ],
  },
  {
    business: "Business C",
    type: "Restaurant",
    color: "bg-violet-600 text-white",
    items: [
      "workspace_id",
      "AI Staff",
      "Knowledge Base",
      "Inbox",
      "Leads",
      "Settings",
      "Credits",
    ],
  },
];

const dataRules = [
  "Every AI action must resolve the correct workspace_id first.",
  "A logged-in owner uses their own active workspace.",
  "An active team member uses the workspace they were invited to.",
  "One workspace cannot access another workspace’s knowledge.",
  "Every conversation belongs to one business workspace.",
  "Every lead is saved under the correct workspace.",
  "Every usage event is logged under the correct workspace.",
  "Credit deduction happens from the correct workspace balance.",
  "Handover rules are private per workspace.",
];

const identitySources: IdentitySource[] = [
  {
    title: "Dashboard",
    text: "Identify workspace using the logged-in owner or active team member session.",
    icon: Brain,
  },
  {
    title: "Website Chat",
    text: "Identify workspace using the embedded website widget or workspace reference.",
    icon: Globe2,
  },
  {
    title: "WhatsApp",
    text: "Identify workspace using the connected WhatsApp number, phone number ID, or channel connection.",
    icon: PlugZap,
  },
  {
    title: "Custom Webhook",
    text: "Identify workspace using a secure webhook token, channel ID, or future integration reference.",
    icon: Route,
  },
];

const livePages = [
  {
    title: "Create AI Staff",
    text: "Create and manage the AI staff profile used by the brain.",
    href: "/dashboard/create-ai",
    icon: Bot,
  },
  {
    title: "Knowledge Base",
    text: "Add the business facts that the AI Brain should use.",
    href: "/dashboard/knowledge-base",
    icon: BookOpen,
  },
  {
    title: "Test AI",
    text: "Test replies before activating real customer channels.",
    href: "/dashboard/test-ai",
    icon: TestTube2,
  },
  {
    title: "Inbox",
    text: "Generate suggested replies and review customer conversations.",
    href: "/dashboard/inbox",
    icon: Inbox,
  },
  {
    title: "Website Chat",
    text: "Prepare website chat AI replies, handover, and status.",
    href: "/dashboard/integrations/website-chat",
    icon: Globe2,
  },
  {
    title: "WhatsApp",
    text: "Prepare WhatsApp AI replies, numbers, and channel rules.",
    href: "/dashboard/integrations/whatsapp",
    icon: MessageCircle,
  },
];

export default function AIBrainPage() {
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
                  item.label === "AI Brain"
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
              Kolkap AI Brain
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              One AI Brain, many private business workspaces.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Kolkap uses one central AI Brain, but every business has its own
              private workspace, AI staff, business knowledge, inbox, leads,
              credits, settings, and rules.
            </p>

            <div className="mt-8 rounded-3xl border border-[#7CFF3D]/30 bg-[#7CFF3D]/10 p-5">
              <div className="flex items-start gap-4">
                <LockKeyhole className="mt-1 h-8 w-8 shrink-0 text-[#7CFF3D]" />

                <div>
                  <p className="text-2xl font-black text-[#7CFF3D]">
                    Golden Rule
                  </p>

                  <p className="mt-2 text-xl font-semibold leading-9 text-slate-200">
                    Every AI reply must resolve the correct workspace_id before
                    loading AI staff, knowledge, credits, or generating a
                    response.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Brain className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Simple Meaning
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Kolkap is shared. Business context is private.
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
              The AI engine can be shared, but the data it uses must always be
              separated by workspace. This prevents one business AI from using
              another business’s private information.
            </p>

            <div className="mt-6 grid gap-4">
              {[
                "Same Kolkap platform",
                "Different workspace_id",
                "Different business knowledge",
                "Different AI staff",
                "Different customer conversations",
                "Different credit balance",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#07111F]" />

                  <p className="text-lg font-black leading-8">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                AI Reply Flow
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                How Kolkap decides what to say
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              This is the live product architecture: every AI action resolves
              the correct workspace first, then uses that business’s private
              data only.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-4">
            {brainSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                      <Icon className="h-8 w-8" />
                    </div>

                    <span className="rounded-full bg-[#F7F9FA] px-4 py-2 text-base font-black text-slate-500">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black tracking-[-0.04em]">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="mb-6">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Private Workspaces
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              Each business gets its own private AI context
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {workspaceCards.map((workspace) => (
              <div
                key={workspace.business}
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black ${workspace.color}`}
                    >
                      {workspace.business.replace("Business ", "")}
                    </span>

                    <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">
                      {workspace.business}
                    </h3>

                    <p className="mt-2 text-lg font-bold text-slate-500">
                      {workspace.type}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600">
                    Private
                  </span>
                </div>

                <div className="grid gap-3">
                  {workspace.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <PlugZap className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Workspace Identity
                </p>

                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  How Kolkap knows the business
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {identitySources.map((source) => {
                const Icon = source.icon;

                return (
                  <div
                    key={source.title}
                    className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                        <Icon className="h-6 w-6" />
                      </div>

                      <div>
                        <p className="text-2xl font-black">{source.title}</p>

                        <p className="mt-2 text-lg font-semibold leading-8 text-slate-600">
                          {source.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Database className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Data Rules
                </p>

                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Every AI table needs workspace_id
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {dataRules.map((rule) => (
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

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="mb-6">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Connected Pages
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              These dashboard pages use the AI Brain flow
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {livePages.map((page) => {
              const Icon = page.icon;

              return (
                <Link
                  key={page.title}
                  href={page.href}
                  className="group rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-black tracking-[-0.04em]">
                      {page.title}
                    </h3>

                    <ArrowRight className="h-5 w-5 text-blue-600 transition group-hover:translate-x-1" />
                  </div>

                  <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                    {page.text}
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
                Core Architecture
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Message in → resolve workspace → load private knowledge → AI
                replies as that business.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                This is the foundation of Kolkap. When this logic is correct,
                the platform can serve many businesses safely without mixing
                data.
              </p>
            </div>

            <Link
              href="/dashboard/go-live"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Continue to Go Live
              <Rocket className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}