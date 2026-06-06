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
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  KOLKAP_TRIAL_NOTE,
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  getPlanTeamMemberLabel,
  kolkapCreditRules,
  kolkapTopUpPackages,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";

const publicPlanKeys: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
];

function getTrialHref(planKey: KolkapPlanKey) {
  if (planKey === "enterprise") return "/contact";

  return `/signup?next=${encodeURIComponent(
    `/dashboard/activate-trial?plan=${planKey}`
  )}`;
}

const translations = {
  en: {
    badge: "Kolkap Pricing",
    title: "AI staff pricing for serious business owners.",
    subtitle:
      "Start with a 7-day free trial. Payment method needed to activate your trial. You won’t be charged today.",
    month: "/month",
    startTrial: "Start 7-Day Free Trial",
    contactUs: "Contact Us",
    popular: "Recommended",
    included: "Included",
    paymentNeeded:
      "Payment method needed to activate your trial. You won’t be charged today.",
    trialIncluded: "7-day free trial",
    noChargeToday: "No charge today",
    autoBilling: "Monthly billing starts after trial unless cancelled.",
    plansTitle: "Choose your AI staff plan",
    plansText:
      "Kolkap is built as a 24/7 AI business assistant for replies, content, inbox support, customer questions, and future WhatsApp or website chat automation.",
    creditTitle: "How AI credits work",
    creditText:
      "Every successful AI generation uses credits. The button will clearly show the cost before the user clicks.",
    topupTitle: "Need more AI credits?",
    topupText:
      "Top up anytime when your business needs more AI replies, content generation, or campaign support before the next billing cycle.",
    faqTitle: "Pricing FAQ",
    finalTitle: "Start with 7 days free.",
    finalText:
      "Create your AI staff, add business knowledge, test the replies, and see how Kolkap can support your business.",
    finalButton: "Start 7-Day Free Trial",
    trialTitle: "7-Day Free Trial",
    trialText: KOLKAP_TRIAL_NOTE,
    choosePlan: "Start Trial",
    topUp: "Top Up",
    createAI: "Create AI",
    creditRules: [
      ["Generate Test AI Reply", "1 credit"],
      ["Generate Inbox AI Reply", "1 credit"],
      ["Generate Content Studio content", "1 credit"],
      ["Website Chat AI Reply", "1 credit"],
      ["WhatsApp AI Reply", "1 credit"],
      ["Long content / campaign pack", "More credits later"],
    ],
    faqs: [
      {
        q: "Do users need a payment method to start the trial?",
        a: "Yes. A payment method is needed to activate the trial, but the user will not be charged today. Monthly billing starts after the 7-day trial unless cancelled before the trial ends.",
      },
      {
        q: "What is 1 credit?",
        a: "One normal AI generation or AI reply uses 1 credit, such as Test AI, Inbox AI Reply, Content Studio, website chat, or WhatsApp AI reply.",
      },
      {
        q: "Can users top up credits?",
        a: "Yes. Users can buy extra credits when their business needs more AI replies or content before the next monthly renewal.",
      },
      {
        q: "What happens when credits run out?",
        a: "AI generation should stop or ask the user to top up or upgrade. This protects the business from unexpected usage.",
      },
    ],
  },

  id: {
    badge: "Harga Kolkap",
    title: "Harga AI staff untuk pemilik bisnis yang serius.",
    subtitle:
      "Mulai dengan 7-day free trial. Payment method needed to activate your trial. You won’t be charged today.",
    month: "/bulan",
    startTrial: "Start 7-Day Free Trial",
    contactUs: "Hubungi Kami",
    popular: "Recommended",
    included: "Termasuk",
    paymentNeeded:
      "Payment method needed to activate your trial. You won’t be charged today.",
    trialIncluded: "7-day free trial",
    noChargeToday: "No charge today",
    autoBilling: "Monthly billing berjalan setelah trial kecuali dibatalkan.",
    plansTitle: "Pilih paket AI staff Anda",
    plansText:
      "Kolkap dibuat sebagai 24/7 AI business assistant untuk replies, content, inbox support, customer questions, dan nanti WhatsApp atau website chat automation.",
    creditTitle: "Cara kerja AI credits",
    creditText:
      "Setiap successful AI generation menggunakan credits. Button akan menunjukkan cost dengan jelas sebelum user klik.",
    topupTitle: "Butuh lebih banyak AI credits?",
    topupText:
      "Top up kapan saja saat bisnis Anda butuh lebih banyak AI replies, content generation, atau campaign support sebelum billing cycle berikutnya.",
    faqTitle: "FAQ Harga",
    finalTitle: "Mulai dengan 7 hari gratis.",
    finalText:
      "Buat AI staff, tambah business knowledge, test replies, dan lihat bagaimana Kolkap bisa mendukung bisnis Anda.",
    finalButton: "Start 7-Day Free Trial",
    trialTitle: "7-Day Free Trial",
    trialText: KOLKAP_TRIAL_NOTE,
    choosePlan: "Start Trial",
    topUp: "Top Up",
    createAI: "Create AI",
    creditRules: [
      ["Generate Test AI Reply", "1 credit"],
      ["Generate Inbox AI Reply", "1 credit"],
      ["Generate Content Studio content", "1 credit"],
      ["Website Chat AI Reply", "1 credit"],
      ["WhatsApp AI Reply", "1 credit"],
      ["Long content / campaign pack", "More credits later"],
    ],
    faqs: [
      {
        q: "Apakah user perlu payment method untuk mulai trial?",
        a: "Ya. Payment method diperlukan untuk mengaktifkan trial, tetapi user tidak akan dikenakan biaya hari ini. Monthly billing berjalan setelah 7-day trial kecuali dibatalkan sebelum trial selesai.",
      },
      {
        q: "Apa itu 1 credit?",
        a: "Satu normal AI generation atau AI reply menggunakan 1 credit, seperti Test AI, Inbox AI Reply, Content Studio, website chat, atau WhatsApp AI reply.",
      },
      {
        q: "Apakah user bisa top up credits?",
        a: "Ya. User bisa membeli extra credits saat bisnis membutuhkan lebih banyak AI replies atau content sebelum renewal bulanan berikutnya.",
      },
      {
        q: "Apa yang terjadi kalau credits habis?",
        a: "AI generation harus stop atau meminta user untuk top up atau upgrade. Ini melindungi bisnis dari usage yang tidak terkontrol.",
      },
    ],
  },
};

export default function PricingPage() {
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
            {t.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.trialIncluded}
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.noChargeToday}
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.autoBilling}
            </span>
          </div>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href={getTrialHref("starter")}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              {t.startTrial}
              <ArrowRight className="h-6 w-6" />
            </Link>

            <Link
              href={getTrialHref("starter")}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Bot className="h-6 w-6" />
              {t.createAI}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-10 max-w-4xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.plansTitle}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.plansText}
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
          {publicPlanKeys.map((planKey) => {
            const plan = getKolkapPlan(planKey);
            const highlighted = plan.key === "professional";

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
                    {t.popular}
                  </div>
                ) : null}

                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    highlighted
                      ? "bg-white text-[#07111F]"
                      : "bg-[#07111F] text-[#7CFF3D]"
                  }`}
                >
                  {plan.key === "starter" ? (
                    <Sparkles className="h-7 w-7" />
                  ) : plan.key === "growth" ? (
                    <Rocket className="h-7 w-7" />
                  ) : plan.key === "professional" ? (
                    <Zap className="h-7 w-7" />
                  ) : (
                    <Users className="h-7 w-7" />
                  )}
                </div>

                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  {plan.name}
                </h3>

                <p className="mt-3 text-5xl font-black tracking-[-0.06em]">
                  {plan.priceLabel === "Custom"
                    ? "Custom"
                    : `$${plan.monthlyPriceUsd}`}
                  {plan.monthlyPriceUsd ? (
                    <span
                      className={`text-xl ${
                        highlighted ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {t.month}
                    </span>
                  ) : null}
                </p>

                <p
                  className={`mt-5 text-base font-semibold leading-7 ${
                    highlighted ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {plan.description}
                </p>

                <div className="mt-7 space-y-3">
                  <p
                    className={`text-sm font-black uppercase tracking-[0.18em] ${
                      highlighted ? "text-[#7CFF3D]" : "text-blue-600"
                    }`}
                  >
                    {t.included}
                  </p>

                  <PlanFeature
                    text={t.trialIncluded}
                    highlighted={highlighted}
                  />
                  <PlanFeature
                    text={t.paymentNeeded}
                    highlighted={highlighted}
                  />
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

                  {plan.features.slice(5, 9).map((feature) => (
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
                  {plan.key === "enterprise" ? t.contactUs : t.choosePlan}
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
                {t.trialTitle}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.trialText}
              </h2>
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
            {t.creditTitle}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.creditText}
          </h2>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="grid gap-3">
            {t.creditRules.map(([action, credits]) => (
              <CreditRuleRow key={action} action={action} credits={credits} />
            ))}

            {kolkapCreditRules.slice(0, 4).map((rule) => (
              <CreditRuleRow
                key={rule.label}
                action={rule.label}
                credits={`${rule.credits} credit${
                  rule.credits === 1 ? "" : "s"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="mb-8 max-w-4xl">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {t.topupTitle}
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              {t.topupText}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {kolkapTopUpPackages.map((pack) => {
              const bestValue = pack.id === "topup_250";

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
                    ${pack.priceUsd}
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
                    {t.topUp}
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
            {t.faqTitle}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {t.faqs.map((faq) => (
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
            {t.finalTitle}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
            {t.finalText}
          </p>

          <Link
            href={getTrialHref("starter")}
            className="mt-9 inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
          >
            {t.finalButton}
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