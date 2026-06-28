import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Headphones,
  MessageCircle,
  PenLine,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const STARTER_SIGNUP_URL = "/signup?plan=starter";

const whatCards = [
  {
    title: "Reply faster",
    text: "Answer common customer questions faster across WhatsApp, website chat, and inbox conversations.",
  },
  {
    title: "Capture better leads",
    text: "Collect important customer details like name, contact, needs, budget, timeline, and next steps.",
  },
  {
    title: "Support your team",
    text: "Let AI handle repetitive questions while your team takes over when a human is needed.",
  },
];

const setupSteps = [
  {
    title: "Create your AI staff",
    text: "Choose the role your AI staff should play in your business.",
  },
  {
    title: "Add business knowledge",
    text: "Add your FAQs, services, pricing, policies, tone, and approved answers.",
  },
  {
    title: "Connect WhatsApp",
    text: "Connect your business WhatsApp through a guided customer-friendly flow.",
  },
  {
    title: "Test replies",
    text: "Ask sample questions and review the answers before customers see them.",
  },
  {
    title: "Go live",
    text: "Activate your AI staff when your business is ready.",
  },
];

const aiRoles = [
  {
    title: "AI Receptionist",
    text: "Welcomes customers, asks what they need, and collects basic details.",
  },
  {
    title: "AI WhatsApp Responder",
    text: "Replies to WhatsApp inquiries and helps qualify customer leads.",
  },
  {
    title: "AI Customer Support",
    text: "Answers common questions about services, pricing, policies, and support.",
  },
  {
    title: "AI Copywriter",
    text: "Creates captions, scripts, ad copy, and customer messages.",
  },
];

const privateRules = [
  "Your business knowledge stays inside your own workspace.",
  "Customer conversations are organized under the correct business.",
  "Leads are saved clearly for follow-up.",
  "Human handover is available when your team needs to step in.",
];

const roleIcons = [Bot, MessageCircle, Headphones, PenLine];
const featureIcons = [MessageCircle, Users, Headphones];
const stepIcons = [Bot, BookOpen, MessageCircle, WandSparkles, Rocket];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F9FA] text-[#07111F]">
      <section className="relative">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_12%_8%,rgba(37,99,255,0.15),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(124,255,61,0.1),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#F7F9FA_100%)]" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-700 shadow-sm sm:text-lg">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D]" />
              AI staff for replies, leads, support, and content
            </div>

            <h1 className="max-w-2xl text-[2.8rem] font-black leading-[1.04] tracking-[-0.05em] text-[#07111F] sm:text-[3.7rem] lg:text-[4.25rem] xl:text-[4.65rem]">
              AI staff that helps your business reply faster.
            </h1>

            <p className="mt-7 max-w-2xl text-xl font-semibold leading-9 text-slate-600 sm:text-2xl sm:leading-10">
              Kolkap helps businesses create AI staff for customer replies,
              WhatsApp conversations, website chat, lead capture, support, and
              content — all in one simple workspace.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href={STARTER_SIGNUP_URL}
                className="rounded-full bg-[#07111F] px-8 py-4 text-center text-lg font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
              >
                Start Free Trial
              </Link>

              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white px-8 py-4 text-center text-lg font-black text-[#07111F] shadow-sm transition hover:-translate-y-0.5"
              >
                Log in
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-blue-500/16 via-transparent to-[#7CFF3D]/14 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[#05070A] p-4 shadow-2xl shadow-slate-900/20 sm:rounded-[2.4rem] sm:p-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,255,0.34),transparent_34%),radial-gradient(circle_at_95%_0%,rgba(124,255,61,0.16),transparent_30%),#07111F] p-5 text-white sm:p-7 lg:p-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <KolkapLogo size="sm" showText={false} />
                    <div>
                      <p className="text-2xl font-black">Kolkap Inbox</p>
                      <p className="text-base font-bold text-slate-300">
                        AI online now
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                    LIVE
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="max-w-[90%] rounded-2xl bg-white/10 p-5 sm:max-w-[78%]">
                    <p className="text-base font-black text-white">Customer</p>
                    <p className="mt-2 text-lg leading-8 text-slate-300">
                      Hi, can your AI help reply to my customers on WhatsApp?
                    </p>
                  </div>

                  <div className="ml-auto max-w-[94%] rounded-2xl border border-blue-400/40 bg-blue-500/15 p-5 sm:max-w-[86%]">
                    <p className="text-base font-black text-blue-100">
                      Kolkap AI
                    </p>
                    <p className="mt-2 text-lg leading-8 text-slate-200">
                      Yes. Create your AI staff, add your business knowledge,
                      test the replies, and go live when you are ready.
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-3">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
                        Setup
                      </p>
                      <p className="mt-2 text-xl font-black text-[#7CFF3D]">
                        Simple
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
                        Channel
                      </p>
                      <p className="mt-2 text-xl font-black">WhatsApp</p>
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
                        Handover
                      </p>
                      <p className="mt-2 text-xl font-black">Ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-lg font-black uppercase tracking-[0.22em] text-blue-600">
              What is Kolkap?
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              Kolkap is an AI staff platform for businesses that receive
              customer messages.
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
              Kolkap is built for business owners and teams who want AI support
              without confusion. Your AI staff can learn your business
              knowledge, help reply to customers, support your inbox, capture
              leads, and assist your daily work.
            </p>
          </div>

          <div className="grid gap-5">
            {whatCards.map((card, index) => {
              const Icon = featureIcons[index];

              return (
                <div
                  key={card.title}
                  className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-start"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-8 w-8" />
                  </div>

                  <div>
                    <h3 className="text-3xl font-black tracking-[-0.04em]">
                      {card.title}
                    </h3>

                    <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                      {card.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-10 max-w-3xl">
            <p className="text-lg font-black uppercase tracking-[0.22em] text-[#7CFF3D]">
              Simple setup
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              Create your AI staff, teach it your business, then go live.
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
              Kolkap keeps the setup simple for business users. You create your
              AI staff, add your business information, test the replies, connect
              your customer channels, and activate it when ready.
            </p>
          </div>

          <div className="grid gap-5">
            {setupSteps.map((step, index) => {
              const Icon = stepIcons[index];

              return (
                <div
                  key={step.title}
                  className="grid gap-5 rounded-[1.8rem] border border-white/10 bg-white/5 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                    <Icon className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="text-base font-black text-[#7CFF3D]">
                      Step {index + 1}
                    </p>

                    <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
                      {step.text}
                    </p>
                  </div>

                  <ArrowRight className="hidden h-7 w-7 text-slate-500 sm:block" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="mb-10 max-w-3xl">
          <p className="text-lg font-black uppercase tracking-[0.22em] text-blue-600">
            AI staff roles
          </p>

          <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Choose the AI role your business needs.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {aiRoles.map((role, index) => {
            const Icon = roleIcons[index];

            return (
              <div
                key={role.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-8 w-8" />
                </div>

                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  {role.title}
                </h3>

                <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                  {role.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.22em] text-blue-600">
              Private business workspace
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              Your AI staff works with your own business information.
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
              Each business has its own workspace, AI staff, business knowledge,
              inbox, leads, settings, and team access. Kolkap keeps every
              business experience separate and organized.
            </p>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
            <div className="space-y-4">
              {privateRules.map((item) => (
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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-6">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-center text-white shadow-2xl shadow-slate-900/20 sm:p-12">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#7CFF3D] text-[#07111F]">
            <Sparkles className="h-10 w-10" />
          </div>

          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Give your business AI staff without making things complicated.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
            Start with a simple trial. Create your AI staff, add your business
            knowledge, test replies, and go live when you are ready.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={STARTER_SIGNUP_URL}
              className="rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Start Free Trial
            </Link>

            <Link
              href="/pricing"
              className="rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}