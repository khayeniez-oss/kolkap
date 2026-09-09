import Link from "next/link";
import {
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  Headphones,
  Inbox,
  MessageCircle,
  PenLine,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";
import { createClient } from "@/lib/supabase/server";

const STARTER_SIGNUP_URL = "/signup?plan=starter";

const benefits = [
  {
    title: "Reply faster",
    text: "Answer common customer questions using the business information you provide.",
    icon: MessageCircle,
  },
  {
    title: "Stay organised",
    text: "Keep customer conversations and follow-up leads together in one workspace.",
    icon: Inbox,
  },
  {
    title: "Step in anytime",
    text: "Pause AI and let a person take over whenever your customer needs one.",
    icon: Headphones,
  },
];

const setupSteps = [
  {
    title: "Choose a role",
    text: "Select the job your AI staff should do.",
    icon: Bot,
  },
  {
    title: "Add your knowledge",
    text: "Teach it your services, pricing, policies, and preferred answers.",
    icon: BookOpen,
  },
  {
    title: "Test the replies",
    text: "Ask real questions and review the answers before customers see them.",
    icon: WandSparkles,
  },
  {
    title: "Connect and go live",
    text: "Choose Website Chat or WhatsApp and activate it when you are ready.",
    icon: Sparkles,
  },
];

const aiRoles = [
  {
    title: "AI Receptionist",
    text: "Welcomes customers, understands what they need, and collects their basic details.",
    icon: Bot,
  },
  {
    title: "Customer Support Assistant",
    text: "Answers questions about your services, pricing, policies, and support.",
    icon: Headphones,
  },
  {
    title: "Sales Assistant",
    text: "Responds to new enquiries and helps interested customers take the next step.",
    icon: Users,
  },
  {
    title: "Booking Assistant",
    text: "Helps customers choose a service and arrange an appointment.",
    icon: CalendarDays,
  },
  {
    title: "Content Assistant",
    text: "Creates captions, scripts, promotional copy, and customer messages.",
    icon: PenLine,
  },
];

const workspacePoints = [
  "Business knowledge organised in your workspace",
  "Customer conversations and leads kept together",
  "Human handover available when your team needs it",
];

export default async function Home() {
  let isLoggedIn = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    isLoggedIn = Boolean(user);
  } catch {
    isLoggedIn = false;
  }

  const primaryAction = isLoggedIn
    ? { href: "/dashboard", label: "Go to Dashboard" }
    : { href: STARTER_SIGNUP_URL, label: "Start Free Trial" };

  const secondaryAction = isLoggedIn
    ? { href: "/dashboard/create-ai", label: "Create AI Staff" }
    : { href: "#how-it-works", label: "See How It Works" };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F9FA] text-[#07111F]">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(37,99,255,0.14),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(124,255,61,0.1),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#F7F9FA_100%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-700 shadow-sm sm:text-lg">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D]" />
              AI staff for customer conversations
            </div>

            <h1 className="max-w-2xl text-[2.8rem] font-black leading-[1.04] tracking-[-0.05em] text-[#07111F] sm:text-[3.7rem] lg:text-[4.25rem] xl:text-[4.65rem]">
              AI staff that helps your business reply faster.
            </h1>

            <p className="mt-7 max-w-2xl text-xl font-semibold leading-9 text-slate-600 sm:text-2xl sm:leading-10">
              Teach Kolkap about your business, connect Website Chat or
              WhatsApp, and let it handle common questions while your team
              stays in control.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href={primaryAction.href}
                className="rounded-full bg-[#07111F] px-8 py-4 text-center text-lg font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
              >
                {primaryAction.label}
              </Link>

              <Link
                href={secondaryAction.href}
                className="rounded-full border border-slate-200 bg-white px-8 py-4 text-center text-lg font-black text-[#07111F] shadow-sm transition hover:-translate-y-0.5"
              >
                {secondaryAction.label}
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
                      <p className="text-2xl font-black">AI Receptionist</p>
                      <p className="text-base font-bold text-slate-300">
                        Ready to help
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                    LIVE
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="max-w-[90%] rounded-2xl bg-white/10 p-5 sm:max-w-[80%]">
                    <p className="text-base font-black text-white">Customer</p>
                    <p className="mt-2 text-lg leading-8 text-slate-300">
                      Hi, are you open this Saturday? I would like to book an
                      appointment.
                    </p>
                  </div>

                  <div className="ml-auto max-w-[94%] rounded-2xl border border-blue-400/40 bg-blue-500/15 p-5 sm:max-w-[88%]">
                    <p className="text-base font-black text-blue-100">
                      AI Receptionist
                    </p>
                    <p className="mt-2 text-lg leading-8 text-slate-200">
                      Yes, we are open Saturday. What time would suit you, and
                      may I have your name?
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-3">
                    {["Answered", "Lead saved", "Handover ready"].map(
                      (status) => (
                        <div key={status} className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#7CFF3D]" />
                          <p className="text-sm font-black text-slate-200">
                            {status}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-18">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-base font-black uppercase tracking-[0.22em] text-blue-600">
            Built for everyday customer conversations
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Helpful AI without losing the human touch.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                  {benefit.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl scroll-mt-28 px-5 py-14 sm:px-6 lg:py-18"
      >
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="max-w-3xl">
            <p className="text-base font-black uppercase tracking-[0.22em] text-[#7CFF3D]">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              From your first AI staff member to live customer replies.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {setupSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-[1.6rem] border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7CFF3D]">
                      Step {index + 1}
                    </p>
                  </div>
                  <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-base font-semibold leading-7 text-slate-300">
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-18">
        <div className="max-w-3xl">
          <p className="text-base font-black uppercase tracking-[0.22em] text-blue-600">
            Build your AI team
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Choose the AI staff your business needs.
          </h2>
          <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
            Start with the job you need help with. Each AI staff member has a
            clear role and follows the business knowledge you provide.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {aiRoles.map((role) => {
            const Icon = role.icon;

            return (
              <div
                key={role.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">
                  {role.title}
                </h3>
                <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                  {role.text}
                </p>
              </div>
            );
          })}

          <div className="flex flex-col justify-between rounded-[2rem] bg-[#07111F] p-7 text-white shadow-xl shadow-slate-900/10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Role first. Channel second.
              </p>
              <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">
                Choose where your AI staff works.
              </h3>
              <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
                Connect customer-facing staff to Website Chat, WhatsApp, or
                your Kolkap Inbox. Use Content Assistant in Content Studio.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["Website Chat", "WhatsApp", "Inbox", "Content Studio"].map(
                (channel) => (
                  <span
                    key={channel}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-200"
                  >
                    {channel}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:py-18">
        <div className="grid gap-6 rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="mt-6 text-base font-black uppercase tracking-[0.22em] text-blue-600">
              Your business workspace
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              Your team stays organised and in control.
            </h2>
          </div>

          <div className="grid gap-3">
            {workspacePoints.map((point) => (
              <div
                key={point}
                className="flex items-start gap-4 rounded-2xl bg-[#F7F9FA] p-5"
              >
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#07111F]" />
                <p className="text-lg font-black leading-8">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-6">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-center text-white shadow-2xl shadow-slate-900/20 sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mx-auto mt-7 max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Let AI handle routine questions. Keep your team in control.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
            Create AI staff that understands your business and helps customers
            across the channels you already use.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={primaryAction.href}
              className="rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              {primaryAction.label}
            </Link>

            <Link
              href={isLoggedIn ? "/dashboard/create-ai" : "/pricing"}
              className="rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              {isLoggedIn ? "Create AI Staff" : "View Pricing"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
