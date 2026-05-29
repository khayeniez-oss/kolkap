import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  Database,
  Fingerprint,
  LockKeyhole,
  MessageCircle,
  PlugZap,
  Route,
  Send,
  ShieldCheck,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "AI Brain", href: "/dashboard/ai-brain" },
  { label: "AI Staff", href: "/dashboard/agents" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "Integrations", href: "/dashboard/integrations" },
  { label: "Billing", href: "/dashboard/billing" },
];

const brainSteps = [
  {
    number: "01",
    title: "Incoming message received",
    text: "A customer sends a message through WhatsApp, website chat, email, or another connected channel.",
    icon: MessageCircle,
  },
  {
    number: "02",
    title: "Identify the business",
    text: "Kolkap checks the channel ID, phone number, widget ID, or webhook token to find the correct business_id.",
    icon: Fingerprint,
  },
  {
    number: "03",
    title: "Load the right AI staff",
    text: "Kolkap checks which AI role should answer, such as receptionist, WhatsApp responder, or support agent.",
    icon: Bot,
  },
  {
    number: "04",
    title: "Load business knowledge",
    text: "Kolkap loads only that business’s FAQs, pricing, services, policies, files, and approved answers.",
    icon: BookOpen,
  },
  {
    number: "05",
    title: "Apply rules and safety",
    text: "Kolkap applies tone, language, handover rules, blocked topics, and safety instructions before replying.",
    icon: ShieldCheck,
  },
  {
    number: "06",
    title: "Reply as that business",
    text: "The AI reply goes back through the same channel and the conversation is saved under that business only.",
    icon: Send,
  },
];

const workspaceCards = [
  {
    business: "Business A",
    type: "Bali Villa Agency",
    color: "bg-[#7CFF3D] text-[#07111F]",
    items: ["business_id", "AI Staff", "Knowledge Base", "Inbox", "Leads", "Settings"],
  },
  {
    business: "Business B",
    type: "Clinic",
    color: "bg-blue-600 text-white",
    items: ["business_id", "AI Staff", "Knowledge Base", "Inbox", "Leads", "Settings"],
  },
  {
    business: "Business C",
    type: "Restaurant",
    color: "bg-violet-600 text-white",
    items: ["business_id", "AI Staff", "Knowledge Base", "Inbox", "Leads", "Settings"],
  },
];

const dataRules = [
  "Every AI reply must know the business_id first.",
  "One business cannot access another business’s knowledge.",
  "Every conversation belongs to one business workspace.",
  "Every lead must be saved under the correct business.",
  "Every connected channel must map back to a business_id.",
  "Handover rules are private per business.",
];

const identitySources = [
  {
    title: "WhatsApp",
    text: "Identify business using phone_number_id or connected WhatsApp sender.",
    icon: PlugZap,
  },
  {
    title: "Website Chat",
    text: "Identify business using widget business_id from the embedded script.",
    icon: CodeBox,
  },
  {
    title: "Custom Webhook",
    text: "Identify business using a secure webhook token or channel_id.",
    icon: Route,
  },
];

function CodeBox({ className = "" }: { className?: string }) {
  return <Database className={className} />;
}

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
              One AI platform, many private business workspaces.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Kolkap uses one main AI system, but every business has its own
              private workspace, knowledge base, AI staff, conversations, leads,
              and rules.
            </p>

            <div className="mt-8 rounded-3xl border border-[#7CFF3D]/30 bg-[#7CFF3D]/10 p-5">
              <div className="flex items-start gap-4">
                <LockKeyhole className="mt-1 h-8 w-8 shrink-0 text-[#7CFF3D]" />
                <div>
                  <p className="text-2xl font-black text-[#7CFF3D]">
                    Golden Rule
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-9 text-slate-200">
                    Every AI reply must identify the correct business_id before
                    loading knowledge or sending a response.
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
              The AI engine can be the same, but the data it uses must always be
              separated by business. This prevents one client’s AI from using
              another client’s information.
            </p>

            <div className="mt-6 grid gap-4">
              {[
                "Same Kolkap platform",
                "Different business data",
                "Different AI staff",
                "Different customer conversations",
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
              This is the future backend logic. For now, this page is visual so
              the product architecture stays clear.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
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

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
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
                  Channel Identity
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
                  Every table needs business_id
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

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Core Architecture
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Message in → identify business → load private workspace → AI replies as that business.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                This is the foundation of Kolkap. If this logic is correct, the
                platform can serve many businesses safely without mixing data.
              </p>
            </div>

            <Link
              href="/dashboard/integrations"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Continue to Integrations
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}