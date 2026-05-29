import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Globe2,
  Mail,
  MessageCircle,
  PlugZap,
  Settings,
  ShieldCheck,
  Smartphone,
  Users,
  Webhook,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "AI Staff", href: "/dashboard/agents" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "Content", href: "/dashboard/content-studio" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Settings", href: "/dashboard/settings" },
];

const integrations = [
  {
    name: "WhatsApp",
    status: "Not connected",
    description:
      "Connect a WhatsApp Business number so Kolkap can reply to customer messages, qualify leads, and trigger handover.",
    icon: Smartphone,
    action: "Connect WhatsApp",
    highlighted: true,
  },
  {
    name: "Website Chat",
    status: "Ready soon",
    description:
      "Add a Kolkap chat widget to your website so visitors can ask questions and become leads.",
    icon: MessageCircle,
    action: "Get Embed Code",
    highlighted: false,
  },
  {
    name: "Email",
    status: "Coming soon",
    description:
      "Let Kolkap assist with support email replies, summaries, and customer follow-ups.",
    icon: Mail,
    action: "Coming Soon",
    highlighted: false,
  },
  {
    name: "Instagram DM",
    status: "Coming soon",
    description:
      "Prepare for future Instagram message automation and customer inquiry routing.",
    icon: Globe2,
    action: "Coming Soon",
    highlighted: false,
  },
  {
    name: "Facebook Messenger",
    status: "Coming soon",
    description:
      "Manage Facebook customer conversations and lead capture from one dashboard.",
    icon: Users,
    action: "Coming Soon",
    highlighted: false,
  },
  {
    name: "Custom Webhook",
    status: "Developer setup",
    description:
      "Send customer messages and events into Kolkap from another system or custom app.",
    icon: Webhook,
    action: "View Setup",
    highlighted: false,
  },
];

const setupSteps = [
  "Choose the channel you want to connect",
  "Verify your business or phone number if required",
  "Choose which AI staff should reply",
  "Set handover rules and safety controls",
  "Send a test message before going live",
];

export default function IntegrationsPage() {
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
              Integrations
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Connect Kolkap to the channels your customers use.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Start with website chat and WhatsApp. Later, connect email,
              Instagram, Facebook Messenger, and custom business systems.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5">
                <PlugZap className="h-6 w-6" />
                Connect Channel
              </button>

              <button className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                <Code2 className="h-6 w-6" />
                Developer Setup
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Setup Flow
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Connect safely before going live
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
                  <p className="text-xl font-black leading-7">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Channels
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                Available integrations
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              These are visual cards first. Later each integration will connect
              to real provider settings, tokens, webhooks, and channel status.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {integrations.map((integration) => {
              const Icon = integration.icon;

              return (
                <div
                  key={integration.name}
                  className={`rounded-[2rem] border p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
                    integration.highlighted
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-white text-[#07111F]"
                  }`}
                >
                  <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                      integration.highlighted
                        ? "bg-white text-[#07111F]"
                        : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-3xl font-black tracking-[-0.04em]">
                      {integration.name}
                    </h3>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-black ${
                        integration.highlighted
                          ? "bg-[#7CFF3D] text-[#07111F]"
                          : integration.status === "Coming soon"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {integration.status}
                    </span>
                  </div>

                  <p
                    className={`mt-4 text-lg font-semibold leading-8 ${
                      integration.highlighted
                        ? "text-slate-300"
                        : "text-slate-600"
                    }`}
                  >
                    {integration.description}
                  </p>

                  <button
                    className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-lg font-black ${
                      integration.highlighted
                        ? "bg-white text-[#07111F]"
                        : "bg-[#07111F] text-white"
                    }`}
                  >
                    {integration.action}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <MessageCircle className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Website Chat
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Embed preview
                </h2>
              </div>
            </div>

            <p className="text-xl font-semibold leading-9 text-slate-600">
              Later, users can copy this script and paste it into their website
              so customers can chat with Kolkap.
            </p>

            <div className="mt-6 rounded-3xl bg-[#07111F] p-5 text-white">
              <div className="mb-4 flex items-center gap-3">
                <Code2 className="h-6 w-6 text-[#7CFF3D]" />
                <p className="text-xl font-black">Embed Code</p>
              </div>

              <pre className="overflow-x-auto rounded-2xl bg-black/30 p-5 text-base font-semibold leading-8 text-slate-200">
                {`<script
  src="https://kolkap.com/widget.js"
  data-business-id="demo_business_id"
  data-agent="ai_receptionist">
</script>`}
              </pre>
            </div>

            <button className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5">
              Copy Website Chat Code
            </button>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Safety Controls
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Channel rules
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {[
                "Only approved AI staff can reply on connected channels",
                "AI must use business knowledge before answering",
                "Human handover is required for payment, legal, and complaints",
                "Conversation history must be saved in the inbox",
                "Leads must be scored before follow-up",
              ].map((rule) => (
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
              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Prepare the real backend.
              </h2>
              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                After the UI pages are reviewed, we connect Supabase, Auth,
                database tables, AI provider, and real integration logic.
              </p>
            </div>

            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Review Settings
              <Settings className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}