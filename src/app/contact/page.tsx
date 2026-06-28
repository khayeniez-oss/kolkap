import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

type ContactCard = {
  title: string;
  text: string;
  action: string;
  href: string;
};

const supportEmail = "support@kolkap.com";
const businessAddress = "168 Kent St, Sydney NSW 2000, Australia";

const contactCards: ContactCard[] = [
  {
    title: "General Support",
    text: "Questions about Kolkap, AI staff, setup, dashboard, or how to get started.",
    action: "Contact support",
    href: "mailto:support@kolkap.com?subject=Kolkap%20General%20Support",
  },
  {
    title: "Billing & Subscription",
    text: "Help with trial, monthly plan, credits, payment status, cancellation, or billing questions.",
    action: "Billing help",
    href: "mailto:support@kolkap.com?subject=Kolkap%20Billing%20Support",
  },
  {
    title: "Account Deletion",
    text: "Need help deleting your account or understanding what happens to your workspace data.",
    action: "Deletion help",
    href: "mailto:support@kolkap.com?subject=Kolkap%20Account%20Deletion%20Support",
  },
  {
    title: "WhatsApp & AI Staff",
    text: "Help with AI staff setup, WhatsApp connection, replies, handover, and customer conversations.",
    action: "AI setup help",
    href: "mailto:support@kolkap.com?subject=Kolkap%20AI%20Staff%20Support",
  },
];

const helpItems = [
  "Your name and account email",
  "Your business name, if available",
  "The page or feature you need help with",
  "A short explanation of the issue",
  "A screenshot, if it helps explain the problem",
];

const cardIcons: LucideIcon[] = [LifeBuoy, CreditCard, Trash2, Bot];

export default function ContactPage() {
  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Contact Kolkap
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            Need help with Kolkap?
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
            Contact our support team for help with your account, billing,
            subscription, AI staff setup, WhatsApp connection, privacy, or
            account deletion.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              <Mail className="h-6 w-6" />
              Email Support
            </a>

            <a
              href="#kai-ai"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Bot className="h-6 w-6" />
              Ask Kai AI
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <Mail className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Email
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
            {supportEmail}
          </h2>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            Send us your question and our support team will help you with the
            next step.
          </p>
        </div>

        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <MapPin className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
            Business Address
          </p>

          <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
            {businessAddress}
          </h2>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Support
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            How can we help?
          </h2>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            Choose the support topic that matches what you need. Our team can
            help guide you to the right next step.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contactCards.map((card, index) => {
            const Icon = cardIcons[index] || HelpCircle;

            return (
              <div
                key={card.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="text-2xl font-black tracking-[-0.04em]">
                  {card.title}
                </h3>

                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  {card.text}
                </p>

                <a
                  href={card.href}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                >
                  {card.action}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <MessageCircle className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Before contacting support
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            To help us support you faster, please include the right details in
            your message.
          </h2>
        </div>

        <div className="grid gap-3">
          {helpItems.map((item) => (
            <div
              key={item}
              className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5"
            >
              <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />
              <p className="text-lg font-black leading-8 text-slate-700">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="kai-ai"
        className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-2 lg:px-8"
      >
        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <Bot className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
            Kai AI
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            Kai AI is available 24/7.
          </h2>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-300">
            You can also use the Kai AI chat bubble on the website to ask quick
            questions about Kolkap, pricing, trial, credits, WhatsApp, setup,
            billing, privacy, terms, and support.
          </p>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Legal and privacy information
          </p>

          <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
            For privacy, billing, subscription, refund, and account deletion
            details, please read our Privacy Policy and Terms & Conditions.
          </h2>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-base font-black text-slate-700 transition hover:border-[#07111F] hover:bg-white"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="inline-flex items-center justify-center rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            We’re here to help you use Kolkap with confidence.
          </h2>

          <p className="mt-5 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            Send us your question and our support team will help you with the
            next step.
          </p>

          <a
            href={`mailto:${supportEmail}`}
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
          >
            <Mail className="h-6 w-6" />
            Contact Support
          </a>
        </div>
      </section>
    </main>
  );
}