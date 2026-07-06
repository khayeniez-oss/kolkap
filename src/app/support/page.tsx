import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CreditCard,
  Globe2,
  HelpCircle,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Support | Kolkap",
  description:
    "Contact Kolkap support for help with your account, billing, WhatsApp connection, Website Chat, AI staff, data deletion, and customer messaging setup.",
};

const supportEmail = "support@kolkap.com";

const supportTopics = [
  {
    title: "Account access",
    text: "Get help with login, workspace access, dashboard issues, or account settings.",
    icon: KeyRound,
  },
  {
    title: "Billing and subscription",
    text: "Get help with trial activation, subscription status, billing, cancellation, or credits.",
    icon: CreditCard,
  },
  {
    title: "WhatsApp connection",
    text: "Get help connecting WhatsApp through Meta, WABA setup, phone number issues, or onboarding errors.",
    icon: Smartphone,
  },
  {
    title: "Website Chat",
    text: "Get help installing the website widget, sending test messages, or reviewing Website Chat activity.",
    icon: Globe2,
  },
  {
    title: "AI staff and knowledge",
    text: "Get help creating AI staff, adding business knowledge, testing replies, and going live.",
    icon: Bot,
  },
  {
    title: "Data deletion",
    text: "Get help deleting your Kolkap account, workspace, conversations, and related data.",
    icon: Trash2,
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FA] px-5 py-10 text-[#07111F] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-black text-[#07111F] shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </Link>

        <section className="mt-8 rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <HelpCircle className="h-5 w-5" />
            Kolkap Support
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Need help with Kolkap?
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            Contact Kolkap support for help with your account, billing,
            WhatsApp connection, Website Chat, AI staff, data deletion, and
            customer messaging setup.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`mailto:${supportEmail}?subject=Kolkap Support Request`}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Email Support
              <Mail className="h-5 w-5" />
            </a>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Log in to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {supportTopics.map((topic) => {
            const Icon = topic.icon;

            return (
              <div
                key={topic.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>

                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  {topic.title}
                </h2>

                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  {topic.text}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-blue-100 bg-blue-50 p-6 shadow-sm shadow-blue-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <UserRound className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
              For logged-in users
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em] text-blue-950">
              Use the dashboard Help page for workspace support.
            </h2>

            <p className="mt-5 text-lg font-semibold leading-8 text-blue-800">
              If you can access your Kolkap dashboard, go to the Help page so
              support can understand your workspace, issue, and connected
              channels more clearly.
            </p>

            <Link
              href="/dashboard/help"
              className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5"
            >
              Open Dashboard Help
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>

          <div className="rounded-[2.2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm shadow-amber-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <LockKeyhole className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-amber-800">
              Cannot access your account?
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em] text-amber-950">
              Email Kolkap support from your account email.
            </h2>

            <p className="mt-5 text-lg font-semibold leading-8 text-amber-900">
              If you cannot log in, email support and include the email address
              connected to your Kolkap account. For security, we may ask you to
              verify ownership before making account changes.
            </p>

            <a
              href={`mailto:${supportEmail}?subject=Kolkap Account Access Help`}
              className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5"
            >
              Email Support
              <Mail className="h-6 w-6" />
            </a>
          </div>
        </section>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Important links
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                Privacy, terms, and data deletion.
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                These pages explain how Kolkap handles account data, service
                terms, and deletion requests.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-base font-black text-[#07111F]"
                >
                  Privacy Policy
                </Link>

                <Link
                  href="/terms"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-base font-black text-[#07111F]"
                >
                  Terms of Service
                </Link>

                <Link
                  href="/data-deletion"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                >
                  Data Deletion
                  <Trash2 className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Customer messages
              </p>

              <h2 className="mt-2 text-4xl font-black leading-tight tracking-[-0.05em]">
                Need help with WhatsApp, Website Chat, or Inbox?
              </h2>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
                Send us the issue, your account email, screenshots if possible,
                and the channel you are trying to set up.
              </p>
            </div>

            <a
              href={`mailto:${supportEmail}?subject=Kolkap Channel Setup Help`}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Contact Support
              <MessageCircle className="h-6 w-6" />
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}