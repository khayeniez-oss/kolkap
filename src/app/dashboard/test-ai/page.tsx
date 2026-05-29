import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  MessageCircle,
  PlayCircle,
  RefreshCcw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Onboarding", href: "/dashboard/onboarding" },
  { label: "AI Brain", href: "/dashboard/ai-brain" },
  { label: "AI Staff", href: "/dashboard/agents" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Integrations", href: "/dashboard/integrations" },
  { label: "Billing", href: "/dashboard/billing" },
];

const testScenarios = [
  {
    title: "Customer asks about pricing",
    prompt: "Hi, can you tell me your price and package?",
    status: "Safe",
  },
  {
    title: "Customer wants human help",
    prompt: "Can I speak with a real person?",
    status: "Handover",
  },
  {
    title: "Customer is a hot lead",
    prompt: "I want to book this week. Can someone contact me?",
    status: "Lead",
  },
  {
    title: "Customer asks unknown question",
    prompt: "Can you promise this result for me?",
    status: "Needs knowledge",
  },
];

const testMessages = [
  {
    sender: "customer",
    name: "Test Customer",
    message: "Hi, what does your business offer and how much does it cost?",
  },
  {
    sender: "ai",
    name: "AI Receptionist",
    message:
      "Hi! I can help. We offer AI staff for customer replies, lead capture, support, and content generation. To recommend the right package, may I know what type of business you run and which channel you want to connect first?",
  },
];

const safetyChecks = [
  "AI identified this as a business inquiry.",
  "AI did not invent exact pricing without approved knowledge.",
  "AI asked a qualifying question before recommending a package.",
  "No human handover needed yet.",
];

const knowledgeSources = [
  "Business profile",
  "FAQ knowledge",
  "Pricing overview",
  "AI behavior rules",
];

export default function TestAIPage() {
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
                className="rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
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
              AI Test Playground
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Test your AI before customers see it.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Send sample questions, check the AI reply, review knowledge
              sources, and confirm if the AI should continue or hand over to a
              human.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5">
                <PlayCircle className="h-6 w-6" />
                Run Test
              </button>

              <button className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                <RefreshCcw className="h-6 w-6" />
                Reset Test
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Test Rules
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              AI must pass safety before going live
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
              Later, Kolkap should block “Go Live” until the AI passes basic
              tests for knowledge, handover, lead capture, and business identity.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr_0.85fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
            <div className="mb-6">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Test Setup
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                Choose AI staff
              </h2>
            </div>

            <div className="space-y-4">
              {[
                "AI Receptionist",
                "WhatsApp Responder",
                "Customer Support",
                "AI Copywriter",
              ].map((role, index) => (
                <label
                  key={role}
                  className={`flex cursor-pointer items-start gap-4 rounded-3xl border p-5 transition ${
                    index === 0
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:border-blue-400 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="aiRole"
                    defaultChecked={index === 0}
                    className="mt-2"
                  />
                  <div>
                    <p className="text-xl font-black">{role}</p>
                    <p
                      className={`mt-2 text-base font-semibold leading-7 ${
                        index === 0 ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      Test how this AI role answers customer questions.
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
              <div className="mb-3 flex items-center gap-3">
                <Settings className="h-6 w-6 text-slate-500" />
                <p className="text-xl font-black">Current settings</p>
              </div>
              <p className="text-lg font-semibold leading-8 text-slate-600">
                Tone: Friendly Professional
                <br />
                Language: Auto-detect
                <br />
                Handover: Enabled
              </p>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
            <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.04em]">
                    AI Receptionist Test
                  </h2>
                  <p className="text-lg font-bold text-slate-500">
                    Safe preview conversation
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-[#7CFF3D] px-5 py-3 text-base font-black text-[#07111F]">
                <CheckCircle2 className="h-5 w-5" />
                Passed
              </span>
            </div>

            <div className="space-y-5">
              {testMessages.map((message) => {
                const isAI = message.sender === "ai";

                return (
                  <div
                    key={message.name}
                    className={`flex ${isAI ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-3xl p-5 sm:max-w-[78%] ${
                        isAI
                          ? "border border-blue-400/30 bg-blue-50"
                          : "bg-[#F7F9FA]"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        {isAI ? (
                          <Bot className="h-5 w-5 text-blue-700" />
                        ) : (
                          <UserRound className="h-5 w-5 text-slate-500" />
                        )}
                        <p
                          className={`text-base font-black ${
                            isAI ? "text-blue-700" : "text-[#07111F]"
                          }`}
                        >
                          {message.name}
                        </p>
                      </div>

                      <p className="text-lg font-semibold leading-8 text-slate-700">
                        {message.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
              <label className="grid gap-3">
                <span className="text-base font-black text-slate-700">
                  Test customer message
                </span>
                <textarea
                  rows={5}
                  placeholder="Type a customer question here..."
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500"
                />
              </label>

              <button className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5">
                <Send className="h-6 w-6" />
                Send Test Message
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
            <div className="mb-6">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                AI Review
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                Safety result
              </h2>
            </div>

            <div className="space-y-4">
              {safetyChecks.map((check) => (
                <div
                  key={check}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{check}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-start gap-4">
                <AlertCircle className="mt-1 h-7 w-7 shrink-0 text-orange-600" />
                <div>
                  <p className="text-xl font-black text-orange-800">
                    Needs real AI connection
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-8 text-orange-700">
                    This is still sample output. Later this page will call
                    Kolkap AI Brain and return a real AI reply.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Knowledge Used
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Source preview
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {knowledgeSources.map((source) => (
                <div
                  key={source}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <p className="text-xl font-black">{source}</p>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600">
                    Checked
                  </span>
                </div>
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
                  Test Scenarios
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Try common customer questions
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {testScenarios.map((scenario) => (
                <div
                  key={scenario.title}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-black">{scenario.title}</p>
                      <p className="mt-2 text-lg font-semibold leading-8 text-slate-600">
                        {scenario.prompt}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-black ${
                        scenario.status === "Safe"
                          ? "bg-[#7CFF3D] text-[#07111F]"
                          : scenario.status === "Handover"
                            ? "bg-orange-100 text-orange-700"
                            : scenario.status === "Lead"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {scenario.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Go Live Check
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Test first. Connect later. Go live only when safe.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                This page will become the safety checkpoint before activating AI
                replies on WhatsApp, website chat, or any connected channel.
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