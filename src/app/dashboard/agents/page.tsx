import Link from "next/link";
import {
  Bot,
  MessageCircle,
  Headphones,
  PenLine,
  Share2,
  Home,
  Plus,
  Settings,
  PlayCircle,
  Power,
  ArrowRight,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["AI Staff", "/dashboard/agents"],
  ["Knowledge", "/dashboard/knowledge-base"],
  ["Inbox", "/dashboard/inbox"],
  ["Leads", "/dashboard/leads"],
  ["Billing", "/dashboard/billing"],
];

const aiRoles = [
  {
    name: "AI Receptionist",
    status: "Active",
    icon: Bot,
    description:
      "Welcomes customers, asks what they need, collects basic details, and routes the conversation.",
    tasks: ["Welcome message", "Collect name", "Ask customer needs", "Route inquiry"],
  },
  {
    name: "AI WhatsApp Responder",
    status: "Active",
    icon: MessageCircle,
    description:
      "Replies to WhatsApp inquiries 24/7 using your business knowledge and handover rules.",
    tasks: ["Answer FAQs", "Qualify leads", "Send next steps", "Trigger handover"],
  },
  {
    name: "AI Customer Support",
    status: "Draft",
    icon: Headphones,
    description:
      "Handles support questions based on your pricing, policies, services, and FAQs.",
    tasks: ["Support replies", "Policy answers", "Pricing questions", "Escalation"],
  },
  {
    name: "AI Copywriter",
    status: "Draft",
    icon: PenLine,
    description:
      "Creates property copy, captions, ad copy, website text, and customer messages.",
    tasks: ["Descriptions", "Captions", "Ad copy", "WhatsApp templates"],
  },
  {
    name: "AI Social Media Manager",
    status: "Inactive",
    icon: Share2,
    description:
      "Plans content ideas, captions, hashtags, campaign angles, and weekly post direction.",
    tasks: ["Content ideas", "Captions", "Hashtags", "Campaign angles"],
  },
  {
    name: "AI Listing Assistant",
    status: "Inactive",
    icon: Home,
    description:
      "Helps real estate users improve listing details, descriptions, titles, and buyer-facing content.",
    tasks: ["Listing title", "Property details", "Missing info", "Better description"],
  },
];

const setupSteps = [
  "Choose AI role",
  "Name your AI staff",
  "Set tone and language",
  "Add instructions",
  "Connect knowledge base",
  "Test before going live",
];

export default function AgentsPage() {
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
                  label === "AI Staff"
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
              AI Staff Control
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Build the AI roles your business needs.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Start with receptionist and WhatsApp responder. Then add support,
              copywriting, social media, and listing assistants as your business
              grows.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5">
                <Plus className="h-6 w-6" />
                Create AI Staff
              </button>

              <button className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                <PlayCircle className="h-6 w-6" />
                Test AI
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Setup Flow
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Create AI staff in 6 steps
            </h2>

            <div className="mt-6 space-y-4">
              {setupSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                    {index + 1}
                  </div>
                  <p className="text-xl font-black">{step}</p>
                </div>
              ))}
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
                Your AI business team
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              These are sample roles for the UI first. Later they will be loaded
              from the AI agents table in Supabase.
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
                            className={`rounded-full px-4 py-2 text-sm font-black ${
                              role.status === "Active"
                                ? "bg-[#7CFF3D] text-[#07111F]"
                                : role.status === "Draft"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-200 text-slate-700"
                            }`}
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
                    <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white">
                      <Settings className="h-5 w-5" />
                      Configure
                    </button>

                    <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-lg font-black text-[#07111F]">
                      <Power className="h-5 w-5" />
                      Toggle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Next Step
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                Train your AI with business knowledge.
              </h2>
              <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
                AI staff should not guess. Add FAQs, pricing, services,
                policies, and company details so replies are based on real
                business information.
              </p>
            </div>

            <Link
              href="/dashboard/knowledge-base"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
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