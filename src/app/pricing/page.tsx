"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  getPlanTeamMemberLabel,
  kolkapTopUpPackages,
  KOLKAP_PRICE_NOTE,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";

type PlanText = {
  name: string;
  description: string;
  features: string[];
};

type FaqItem = {
  q: string;
  a: string;
};

const publicPlanKeys: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
];

const planCopy: Partial<Record<KolkapPlanKey, PlanText>> = {
  starter: {
    name: "Starter AI",
    description:
      "For small businesses that want one AI staff assistant to support customer replies, content, inbox work, and everyday questions.",
    features: [
      "7-day free trial",
      "Payment method needed",
      "No charge today",
      "AI reply testing",
      "Business knowledge setup",
      "Basic inbox support",
      "Usage dashboard",
    ],
  },
  growth: {
    name: "Growth AI",
    description:
      "For growing businesses that need more AI replies, more content support, and stronger customer conversation handling.",
    features: [
      "7-day free trial",
      "Payment method needed",
      "No charge today",
      "More AI staff capacity",
      "Inbox and leads support",
      "Content generation tools",
      "Website chat ready",
    ],
  },
  professional: {
    name: "Professional AI",
    description:
      "For serious businesses that want AI to support replies, leads, content, usage tracking, and daily operations.",
    features: [
      "7-day free trial",
      "Payment method needed",
      "No charge today",
      "Recommended for growing teams",
      "More credits and AI staff",
      "WhatsApp / website chat ready",
      "Auto-reply controls",
      "Reports",
    ],
  },
  business: {
    name: "Business AI",
    description:
      "For busy businesses with higher message volume, multiple AI needs, team access, and stronger automation requirements.",
    features: [
      "7-day free trial",
      "Payment method needed",
      "No charge today",
      "Higher credit allowance",
      "More team access",
      "Team inbox",
      "Priority support",
      "Advanced reports",
    ],
  },
  enterprise: {
    name: "Enterprise",
    description:
      "For agencies, franchises, clinics, hotels, real estate groups, and high-volume teams that need custom setup.",
    features: [
      "Custom onboarding",
      "Custom AI credits",
      "Multiple business locations",
      "Team access",
      "Priority support",
      "Custom automation planning",
    ],
  },
};

const creditRules: [string, string][] = [
  ["Test AI Reply", "3 credits"],
  ["Inbox AI Reply", "3 credits"],
  ["Content Studio content", "10 credits"],
  ["Website Chat AI Reply", "3 credits"],
  ["WhatsApp AI Reply", "5 credits"],
  ["Long content / campaign pack", "more credits"],
];

const faqs: FaqItem[] = [
  {
    q: "Do I need a payment method to start the trial?",
    a: "Yes. A payment method is needed to activate the 7-day trial, but you will not be charged today.",
  },
  {
    q: "Are prices in Australian dollars?",
    a: "Yes. Kolkap pricing is shown in AUD and includes GST.",
  },
  {
    q: "How are credits used?",
    a: "Credits are used whenever Kolkap successfully generates or sends AI-powered output. Test AI, Inbox AI suggestions, manual WhatsApp replies, and Website Chat AI replies use 3 credits. WhatsApp AI replies use 5 credits. Content Studio generations use 10 credits.",
  },
  {
    q: "Can I top up credits?",
    a: "Yes. You can top up anytime when your business needs more AI replies, content, or customer support capacity.",
  },
  {
    q: "What happens when credits run out?",
    a: "AI generation should stop or ask you to top up or upgrade. This helps protect your business from unexpected usage.",
  },
  {
    q: "Is Kolkap replacing my team?",
    a: "No. Kolkap helps reduce repetitive reply work, support customer questions after hours, organise conversations, and assist your team with faster responses.",
  },
];

function getTrialHref(planKey: KolkapPlanKey) {
  if (planKey === "enterprise") return "/contact";

  return `/signup?next=${encodeURIComponent(
    `/dashboard/activate-trial?plan=${planKey}`
  )}`;
}

function getPlanIcon(planKey: KolkapPlanKey) {
  if (planKey === "starter") return <Sparkles className="h-7 w-7" />;
  if (planKey === "growth") return <Rocket className="h-7 w-7" />;
  if (planKey === "professional") return <Zap className="h-7 w-7" />;
  if (planKey === "business") return <Users className="h-7 w-7" />;

  return <ShieldCheck className="h-7 w-7" />;
}

export default function PricingPage() {
  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Kolkap Pricing
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            AI staff pricing for growing businesses.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
            Start with a 7-day free trial. Add a payment method to activate your
            trial. You will not be charged today.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              7-day free trial
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              No charge today
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              Payment method needed
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              AUD pricing incl. GST
            </span>
          </div>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href={getTrialHref("starter")}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Start 7-Day Free Trial
              <ArrowRight className="h-6 w-6" />
            </Link>

            <Link
              href={getTrialHref("starter")}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Bot className="h-6 w-6" />
              Create AI Staff
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-10 max-w-4xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Choose your AI staff plan
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Choose the right plan for customer replies, inbox support, content
            creation, website chat, WhatsApp inquiries, and daily business
            conversations.
          </h2>

          <p className="mt-5 text-lg font-bold leading-8 text-slate-600">
            {KOLKAP_PRICE_NOTE}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
          {publicPlanKeys.map((planKey) => {
            const plan = getKolkapPlan(planKey);
            const customCopy = planCopy[planKey];
            const highlighted = plan.key === "professional";
            const isEnterprise = plan.key === "enterprise";

            return (
              <div
                key={plan.key}
                className={`relative rounded-[2rem] border p-6 shadow-sm transition hover:-translate-y-1 ${
                  highlighted
                    ? "border-[#07111F] bg-[#07111F] text-white shadow-2xl shadow-slate-900/20"
                    : "border-slate-200 bg-white text-[#07111F] shadow-slate-900/5"
                }`}
              >
                {highlighted ? (
                  <div className="absolute -top-4 left-6 inline-flex items-center gap-2 rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                    <Star className="h-4 w-4" />
                    Recommended
                  </div>
                ) : null}

                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    highlighted
                      ? "bg-white text-[#07111F]"
                      : "bg-[#07111F] text-[#7CFF3D]"
                  }`}
                >
                  {getPlanIcon(plan.key)}
                </div>

                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  {customCopy?.name || plan.name}
                </h3>

                {isEnterprise ? (
                  <p className="mt-3 text-5xl font-black tracking-[-0.06em]">
                    Contact Us
                  </p>
                ) : (
                  <>
                    <p className="mt-3 text-5xl font-black tracking-[-0.06em]">
                      A${plan.monthlyPriceAud}
                      <span
                        className={`text-xl ${
                          highlighted ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        /month
                      </span>
                    </p>

                    <p
                      className={`mt-2 text-sm font-black ${
                        highlighted ? "text-[#7CFF3D]" : "text-blue-600"
                      }`}
                    >
                      Incl. GST
                    </p>
                  </>
                )}

                <p
                  className={`mt-5 text-base font-semibold leading-7 ${
                    highlighted ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {customCopy?.description || plan.description}
                </p>

                <div className="mt-7 space-y-3">
                  <p
                    className={`text-sm font-black uppercase tracking-[0.18em] ${
                      highlighted ? "text-[#7CFF3D]" : "text-blue-600"
                    }`}
                  >
                    Included
                  </p>

                  <PlanFeature
                    text={getPlanCreditLabel(plan)}
                    highlighted={highlighted}
                  />
                  <PlanFeature
                    text={getPlanAIStaffLabel(plan)}
                    highlighted={highlighted}
                  />
                  <PlanFeature
                    text={getPlanTeamMemberLabel(plan)}
                    highlighted={highlighted}
                  />

                  {(customCopy?.features || []).map((feature) => (
                    <PlanFeature
                      key={feature}
                      text={feature}
                      highlighted={highlighted}
                    />
                  ))}
                </div>

                <Link
                  href={getTrialHref(plan.key)}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-lg font-black ${
                    highlighted
                      ? "bg-white text-[#07111F]"
                      : "bg-[#07111F] text-white"
                  }`}
                >
                  {isEnterprise ? "Contact Us" : "Start Trial"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                7-Day Free Trial
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                Add a payment method to activate your trial. You will not be
                charged today.
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-300">
                Monthly billing starts automatically after the trial unless
                cancelled before the trial ends.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-14">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <CreditCard className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            How AI credits work
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Credits are used only when Kolkap successfully generates or sends
            AI-powered output.
          </h2>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="grid gap-3">
            {creditRules.map(([action, credits]) => (
              <CreditRuleRow key={action} action={action} credits={credits} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="mb-8 max-w-4xl">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              Need more AI credits?
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              Top up anytime when your business needs more AI capacity.
            </h2>

            <p className="mt-5 text-lg font-semibold leading-8 text-slate-300">
              Top-up prices are in AUD and include GST.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {kolkapTopUpPackages.map((pack) => {
              const bestValue = pack.id === "topup_500";

              return (
                <div
                  key={pack.id}
                  className={`rounded-[2rem] border p-6 ${
                    bestValue
                      ? "border-[#7CFF3D] bg-white text-[#07111F]"
                      : "border-white/10 bg-white/5 text-white"
                  }`}
                >
                  {bestValue ? (
                    <div className="mb-4 inline-flex rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                      Best Value
                    </div>
                  ) : null}

                  <p className="text-5xl font-black tracking-[-0.06em]">
                    A${pack.priceAud}
                  </p>

                  <p
                    className={`mt-2 text-sm font-black ${
                      bestValue ? "text-blue-600" : "text-[#7CFF3D]"
                    }`}
                  >
                    Incl. GST
                  </p>

                  <p
                    className={`mt-4 text-xl font-black ${
                      bestValue ? "text-[#07111F]" : "text-[#7CFF3D]"
                    }`}
                  >
                    {pack.credits.toLocaleString()} credits
                  </p>

                  <Link
                    href={`/signup?next=${encodeURIComponent(
                      "/dashboard/top-up"
                    )}`}
                    className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full px-5 py-4 text-base font-black ${
                      bestValue
                        ? "bg-[#07111F] text-white"
                        : "bg-white text-[#07111F]"
                    }`}
                  >
                    Top Up
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Pricing FAQ
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <HelpCircle className="h-7 w-7" />
              </div>

              <h3 className="text-2xl font-black tracking-[-0.04em]">
                {faq.q}
              </h3>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-center text-white shadow-2xl shadow-slate-900/20 sm:p-12">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#7CFF3D] text-[#07111F]">
            <ShieldCheck className="h-10 w-10" />
          </div>

          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Start with 7 days free.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
            Create your AI staff, add business knowledge, test the replies, and
            see how Kolkap can support your business before going live.
          </p>

          <Link
            href={getTrialHref("starter")}
            className="mt-9 inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
          >
            Start 7-Day Free Trial
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function PlanFeature({
  text,
  highlighted,
}: {
  text: string;
  highlighted: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2
        className={`mt-1 h-6 w-6 shrink-0 ${
          highlighted ? "text-[#7CFF3D]" : "text-[#07111F]"
        }`}
      />

      <p
        className={`text-base font-black leading-7 ${
          highlighted ? "text-slate-200" : "text-slate-700"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function CreditRuleRow({
  action,
  credits,
}: {
  action: string;
  credits: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <MessageCircle className="h-6 w-6 text-slate-500" />
        <p className="text-lg font-black">{action}</p>
      </div>

      <span className="rounded-full bg-white px-5 py-3 text-base font-black text-[#07111F]">
        {credits}
      </span>
    </div>
  );
}