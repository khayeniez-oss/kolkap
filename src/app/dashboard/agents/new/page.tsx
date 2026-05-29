import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Brain,
  CheckCircle2,
  Globe2,
  MessageCircle,
  PlayCircle,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "AI Staff", href: "/dashboard/agents" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "Billing", href: "/dashboard/billing" },
];

const roleOptions = [
  {
    title: "AI Receptionist",
    text: "Welcome customers, collect details, and route inquiries.",
    active: true,
  },
  {
    title: "WhatsApp Responder",
    text: "Reply to WhatsApp inquiries and qualify leads.",
    active: false,
  },
  {
    title: "Customer Support",
    text: "Answer FAQs, pricing, policies, and support questions.",
    active: false,
  },
  {
    title: "AI Copywriter",
    text: "Create captions, scripts, descriptions, and replies.",
    active: false,
  },
];

const setupChecklist = [
  "Choose AI role",
  "Set name and language",
  "Define tone and behavior",
  "Add handover rules",
  "Connect knowledge base",
  "Test before going live",
];

export default function CreateAIStaffPage() {
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

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <Link
              href="/dashboard/agents"
              className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to AI Staff
            </Link>

            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              New AI Staff
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Create an AI role for your business.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Choose what this AI staff member should do, how it should speak,
              what knowledge it can use, and when it must hand over to a human.
            </p>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Setup Checklist
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Build safely before going live
            </h2>

            <div className="mt-6 space-y-4">
              {setupChecklist.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                    {index + 1}
                  </div>
                  <p className="text-xl font-black leading-7">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Bot className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Step 1
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Choose AI role
                </h2>
              </div>
            </div>

            <div className="grid gap-4">
              {roleOptions.map((role) => (
                <label
                  key={role.title}
                  className={`cursor-pointer rounded-3xl border p-5 transition ${
                    role.active
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:border-blue-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      name="role"
                      defaultChecked={role.active}
                      className="mt-2"
                    />
                    <div>
                      <p className="text-2xl font-black">{role.title}</p>
                      <p
                        className={`mt-2 text-lg font-semibold leading-8 ${
                          role.active ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {role.text}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Brain className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Step 2
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Basic setup
                </h2>
              </div>
            </div>

            <form className="space-y-5">
              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  AI staff name
                </span>
                <input
                  type="text"
                  placeholder="Example: Maya, Alex, Kolkap Assistant"
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    Language
                  </span>
                  <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                    <option>English</option>
                    <option>Indonesian</option>
                    <option>English + Indonesian</option>
                    <option>Auto-detect</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    Tone
                  </span>
                  <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                    <option>Friendly Professional</option>
                    <option>Formal</option>
                    <option>Luxury</option>
                    <option>Direct</option>
                    <option>Warm and helpful</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Main instruction
                </span>
                <textarea
                  rows={5}
                  placeholder="Example: reply to new customers, collect their needs, budget, location, and hand over when they are ready to buy or book."
                  className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>
            </form>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Step 3
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Safety and handover
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {[
                "Hand over when customer asks for a human",
                "Hand over for payment, legal, or complaint questions",
                "Do not invent pricing or policies",
                "Ask for customer name and contact details for serious leads",
                "Summarize conversation before human takeover",
              ].map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 transition hover:border-blue-400 hover:bg-white"
                >
                  <input type="checkbox" defaultChecked className="mt-2" />
                  <span className="text-lg font-black leading-8">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Globe2 className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Step 4
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Knowledge access
                </h2>
              </div>
            </div>

            <p className="mb-5 text-xl font-semibold leading-9 text-slate-600">
              Choose which knowledge categories this AI staff can use when
              replying to customers.
            </p>

            <div className="grid gap-4">
              {[
                "Business Info",
                "FAQ",
                "Pricing",
                "Services",
                "Policies",
                "Uploaded Files",
              ].map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 transition hover:border-blue-400 hover:bg-white"
                >
                  <span className="text-xl font-black">{item}</span>
                  <input type="checkbox" defaultChecked />
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Step 5
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                    Test conversation
                  </h2>
                </div>
              </div>

              <p className="text-xl font-semibold leading-9 text-slate-600">
                Before going live, test how this AI staff replies. Later this
                test box will connect to real OpenAI responses and your selected
                knowledge base.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-lg font-black text-white">
                  <PlayCircle className="h-6 w-6" />
                  Test AI Reply
                </button>

                <button className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-7 py-4 text-lg font-black text-[#07111F]">
                  <Sparkles className="h-6 w-6" />
                  Generate Sample
                </button>
              </div>
            </div>

            <div className="rounded-[1.8rem] bg-[#07111F] p-5 text-white">
              <div className="mb-5 rounded-3xl bg-white/10 p-5">
                <p className="text-base font-black text-slate-300">Customer</p>
                <p className="mt-2 text-lg font-semibold leading-8">
                  Hi, can you tell me about your service and pricing?
                </p>
              </div>

              <div className="ml-auto rounded-3xl border border-blue-400/40 bg-blue-500/15 p-5">
                <p className="text-base font-black text-blue-100">
                  AI Receptionist
                </p>
                <p className="mt-2 text-lg font-semibold leading-8 text-slate-200">
                  Of course. I can help explain our service. May I know what
                  type of business you run so I can recommend the right setup?
                </p>
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#7CFF3D]" />
                  <div>
                    <p className="text-xl font-black">Safe reply preview</p>
                    <p className="mt-2 text-lg font-semibold leading-8 text-slate-300">
                      AI asked a qualifying question instead of guessing the
                      customer’s needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button className="inline-flex flex-1 items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5">
              <Save className="h-6 w-6" />
              Save as Draft
            </button>

            <button className="inline-flex flex-1 items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5">
              <CheckCircle2 className="h-6 w-6" />
              Create AI Staff
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}