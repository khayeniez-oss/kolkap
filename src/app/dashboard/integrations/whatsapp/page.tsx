import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  KeyRound,
  MessageCircle,
  Phone,
  PlugZap,
  Send,
  Server,
  Settings,
  ShieldCheck,
  Smartphone,
  Webhook,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "AI Brain", href: "/dashboard/ai-brain" },
  { label: "AI Staff", href: "/dashboard/agents" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Test AI", href: "/dashboard/test-ai" },
  { label: "Integrations", href: "/dashboard/integrations" },
  { label: "Go Live", href: "/dashboard/go-live" },
];

const setupSteps = [
  {
    title: "Connect WhatsApp Business",
    text: "The business connects its own WhatsApp Business number or provider account.",
    icon: Smartphone,
    status: "Not connected",
  },
  {
    title: "Save phone identity",
    text: "Kolkap stores the phone_number_id, sender number, and maps it to the correct business_id.",
    icon: Phone,
    status: "Required",
  },
  {
    title: "Choose AI staff",
    text: "Select which AI staff should reply to WhatsApp messages for this business.",
    icon: MessageCircle,
    status: "Required",
  },
  {
    title: "Set webhook",
    text: "Incoming WhatsApp messages must be sent to Kolkap so the AI can process them.",
    icon: Webhook,
    status: "Required",
  },
  {
    title: "Test message",
    text: "Send a test WhatsApp message before allowing AI to reply to real customers.",
    icon: Send,
    status: "Before live",
  },
];

const identityRules = [
  "One WhatsApp number belongs to one business workspace.",
  "Incoming messages must identify the correct phone_number_id.",
  "Kolkap uses phone_number_id to find the business_id.",
  "AI loads only that business’s AI staff and knowledge base.",
  "Replies go back through the same WhatsApp number.",
];

const technicalFields = [
  ["Business ID", "business_demo_001"],
  ["WhatsApp Number", "+62 812 0000 0000"],
  ["Phone Number ID", "phone_number_id_from_meta"],
  ["WABA ID", "whatsapp_business_account_id"],
  ["Assigned AI Staff", "AI WhatsApp Responder"],
  ["Status", "Not connected"],
];

export default function WhatsAppIntegrationPage() {
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
                  item.label === "Integrations"
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
              href="/dashboard/integrations"
              className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Integrations
            </Link>

            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              WhatsApp Setup
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Connect a business WhatsApp number to Kolkap.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Each client connects their own WhatsApp Business number. Kolkap
              identifies that number, finds the correct business workspace, and
              replies using that business’s AI staff and knowledge.
            </p>

            <div className="mt-8 rounded-3xl border border-[#7CFF3D]/30 bg-[#7CFF3D]/10 p-5">
              <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 h-8 w-8 shrink-0 text-[#7CFF3D]" />
                <div>
                  <p className="text-2xl font-black text-[#7CFF3D]">
                    Important Rule
                  </p>
                  <p className="mt-2 text-xl font-semibold leading-9 text-slate-200">
                    Kolkap does not need to own many WhatsApp numbers. Each
                    business should connect its own number.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Smartphone className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Connection Status
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              WhatsApp is not connected yet
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
              This is still a visual setup page. Later, this will connect to
              Meta WhatsApp Cloud API, Twilio, or another WhatsApp provider.
            </p>

            <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-start gap-4">
                <AlertCircle className="mt-1 h-7 w-7 shrink-0 text-orange-600" />
                <div>
                  <p className="text-xl font-black text-orange-800">
                    Setup required
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-8 text-orange-700">
                    Add provider credentials, webhook URL, phone number ID, and
                    assigned AI staff before going live.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Setup Steps
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                How WhatsApp connects to Kolkap
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              The key is mapping each WhatsApp number to the correct business
              workspace before AI replies.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {setupSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-8 w-8" />
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <h3 className="text-3xl font-black tracking-[-0.04em]">
                      {step.title}
                    </h3>

                    <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">
                      {step.status}
                    </span>
                  </div>

                  <p className="text-lg font-semibold leading-8 text-slate-600">
                    {step.text}
                  </p>
                </div>
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
                  WhatsApp Identity
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Business-channel mapping
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {technicalFields.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <p className="text-base font-black uppercase tracking-[0.14em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 break-all text-xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <KeyRound className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Provider Setup
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Credentials and webhook
                </h2>
              </div>
            </div>

            <form className="space-y-5">
              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Provider
                </span>
                <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                  <option>Meta WhatsApp Cloud API</option>
                  <option>Twilio WhatsApp</option>
                  <option>Other WhatsApp BSP</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Phone Number ID
                </span>
                <input
                  type="text"
                  placeholder="Paste phone_number_id here"
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Access Token / API Key
                </span>
                <input
                  type="password"
                  placeholder="Paste secure token here"
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Assigned AI Staff
                </span>
                <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                  <option>AI WhatsApp Responder</option>
                  <option>AI Receptionist</option>
                  <option>Customer Support</option>
                </select>
              </label>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
              >
                <PlugZap className="h-6 w-6" />
                Save WhatsApp Setup
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Webhook className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Webhook URL
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Incoming message endpoint
                </h2>
              </div>
            </div>

            <p className="text-xl font-semibold leading-9 text-slate-600">
              Later, WhatsApp provider webhooks will send incoming customer
              messages to this endpoint.
            </p>

            <div className="mt-6 rounded-3xl bg-[#07111F] p-5 text-white">
              <div className="mb-4 flex items-center gap-3">
                <Server className="h-6 w-6 text-[#7CFF3D]" />
                <p className="text-xl font-black">Webhook Endpoint</p>
              </div>

              <pre className="overflow-x-auto rounded-2xl bg-black/30 p-5 text-base font-semibold leading-8 text-slate-200">
                {`https://kolkap.com/api/whatsapp/inbound`}
              </pre>
            </div>

            <button className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5">
              <Copy className="h-6 w-6" />
              Copy Webhook URL
            </button>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Identity Rules
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  WhatsApp must map to business_id
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {identityRules.map((rule) => (
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

        <section className="rounded-[2.2rem] border border-blue-100 bg-blue-50 p-7 shadow-sm shadow-blue-900/5 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
                Test First
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] text-blue-950 sm:text-5xl">
                Send a test WhatsApp message before going live.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-blue-800">
                Kolkap should confirm the correct business, AI staff, knowledge
                base, and reply behavior before live customer conversations are
                activated.
              </p>
            </div>

            <div className="grid gap-4">
              <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5">
                <Send className="h-6 w-6" />
                Send Test Message
              </button>

              <Link
                href="/dashboard/test-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-xl font-black text-[#07111F] shadow-sm transition hover:-translate-y-0.5"
              >
                Open AI Test Page
                <ArrowRight className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Final WhatsApp Flow
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Message in → phone_number_id → business_id → AI reply.
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                This is the WhatsApp logic Kolkap must follow so every client’s
                AI replies with the correct business knowledge.
              </p>
            </div>

            <Link
              href="/dashboard/go-live"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Continue to Go Live
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}