import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  LockKeyhole,
  MessageCircle,
  PlayCircle,
  PlugZap,
  Power,
  Rocket,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Onboarding", href: "/dashboard/onboarding" },
  { label: "AI Brain", href: "/dashboard/ai-brain" },
  { label: "AI Staff", href: "/dashboard/agents" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Test AI", href: "/dashboard/test-ai" },
  { label: "Integrations", href: "/dashboard/integrations" },
  { label: "Go Live", href: "/dashboard/go-live" },
];

const readinessChecks = [
  {
    title: "Business profile completed",
    text: "Business name, industry, website, WhatsApp number, support hours, and business description are ready.",
    status: "Incomplete",
    icon: Building2,
  },
  {
    title: "AI staff created",
    text: "At least one AI staff member is configured with role, tone, language, and main instructions.",
    status: "Draft",
    icon: Bot,
  },
  {
    title: "Knowledge base added",
    text: "FAQs, pricing, services, policies, files, and approved answers are added for safe AI replies.",
    status: "Needs work",
    icon: BookOpen,
  },
  {
    title: "Channel connected",
    text: "WhatsApp, website chat, email, or another customer channel is connected to the correct business workspace.",
    status: "Not connected",
    icon: PlugZap,
  },
  {
    title: "AI test passed",
    text: "AI replies have been tested for pricing, handover, lead capture, and unknown questions.",
    status: "Pending test",
    icon: PlayCircle,
  },
  {
    title: "Team access reviewed",
    text: "Only the right team members have access to inbox, leads, AI staff, billing, and settings.",
    status: "Review",
    icon: Users,
  },
];

const launchRules = [
  "AI must know the correct business_id before replying.",
  "AI must only use that business’s private knowledge base.",
  "AI must save every conversation to the correct inbox.",
  "AI must create leads under the correct business workspace.",
  "AI must hand over payment, legal, complaint, and urgent requests.",
  "AI must be tested before replying to real customers.",
];

const goLiveFlow = [
  {
    step: "01",
    title: "Prepare workspace",
    text: "Complete business profile, AI staff, knowledge base, team access, and billing.",
  },
  {
    step: "02",
    title: "Connect channel",
    text: "Connect WhatsApp, website chat, email, or webhook to the correct business workspace.",
  },
  {
    step: "03",
    title: "Run AI tests",
    text: "Send test questions and confirm that AI replies safely using approved knowledge.",
  },
  {
    step: "04",
    title: "Activate AI",
    text: "Turn on live replies only after all safety and readiness checks are complete.",
  },
];

export default function GoLivePage() {
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
                  item.label === "Go Live"
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
              Go Live Checklist
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Activate AI only when the workspace is ready.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Before Kolkap replies to real customers, the business profile, AI
              staff, knowledge base, integrations, tests, and team access must
              be reviewed.
            </p>

            <div className="mt-8 rounded-3xl border border-orange-300/30 bg-orange-400/10 p-5">
              <div className="flex items-start gap-4">
                <AlertCircle className="mt-1 h-8 w-8 shrink-0 text-orange-300" />
                <div>
                  <p className="text-2xl font-black text-orange-200">
                    Not ready to go live yet
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-9 text-slate-200">
                    Live AI replies should stay locked until all required setup
                    steps are complete.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <LockKeyhole className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Launch Status
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Workspace readiness
            </h2>

            <p className="mt-5 text-6xl font-black tracking-[-0.06em]">
              24%
            </p>

            <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
              Setup is started, but key items are still missing before live
              customer replies can be activated.
            </p>

            <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[24%] rounded-full bg-[#7CFF3D]" />
            </div>

            <button className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-slate-200 px-8 py-5 text-xl font-black text-slate-500">
              <Power className="h-6 w-6" />
              Go Live Locked
            </button>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Readiness Checks
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                Complete these before activation
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              Later these checks will be dynamic and read from Supabase. For
              now, this is the visual launch control page.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {readinessChecks.map((check) => {
              const Icon = check.icon;

              return (
                <div
                  key={check.title}
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
                            {check.title}
                          </h3>

                          <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">
                            {check.status}
                          </span>
                        </div>

                        <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                          {check.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Rocket className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Go Live Flow
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Safe activation process
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {goLiveFlow.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                      {item.step}
                    </div>

                    <div>
                      <p className="text-2xl font-black">{item.title}</p>
                      <p className="mt-2 text-lg font-semibold leading-8 text-slate-600">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Required Rules
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  AI safety must be enforced
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {launchRules.map((rule) => (
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

        <section className="rounded-[2.2rem] border border-orange-200 bg-orange-50 p-7 shadow-sm shadow-orange-900/5 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-orange-600">
                Locked Action
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] text-orange-950 sm:text-5xl">
                Live replies are blocked until setup is complete.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-orange-800">
                This protects the business from wrong answers, missing handover,
                mixed knowledge, or AI replying without correct business
                context.
              </p>
            </div>

            <div className="grid gap-4">
              <Link
                href="/dashboard/onboarding"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
              >
                Continue Onboarding
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/test-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-xl font-black text-[#07111F] shadow-sm transition hover:-translate-y-0.5"
              >
                Test AI First
                <PlayCircle className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Final Live Flow
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Customer message → business identified → AI replies safely.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                This page becomes the final checkpoint before real customer
                channels are activated.
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10">
              <Send className="h-6 w-6" />
              Launch When Ready
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}