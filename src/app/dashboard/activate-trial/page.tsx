"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  getPlanTeamMemberLabel,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";

const planKeys: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
];

const translations = {
  en: {
    badge: "Activate Trial",
    title: "Start your 7-day free trial.",
    subtitle:
      "Choose your AI staff plan, activate your trial, and prepare your Kolkap workspace. Payment method is needed to activate your trial. You won’t be charged today.",
    back: "Back to Dashboard",
    choosePlan: "Choose Your Plan",
    choosePlanText:
      "Select the plan you want to start with. You can upgrade later as your AI usage grows.",
    selectedPlan: "Selected Plan",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method needed to activate your trial. You won’t be charged today.",
    billingText:
      "Monthly billing starts after your 7-day trial unless cancelled before the trial ends.",
    noChargeToday: "No charge today",
    paymentNeeded: "Payment method needed",
    cancelBeforeTrial: "Cancel before trial ends",
    creditsIncluded: "Credits included",
    aiStaffIncluded: "AI staff included",
    teamIncluded: "Team access included",
    activateButton: "Continue to Trial Activation",
    comingSoon: "Payment setup coming soon",
    comingSoonText:
      "The checkout connection will be added next. For now, this page prepares the correct trial flow and pricing selection.",
    currentFlow: "Trial Flow",
    flowSteps: [
      "Choose your plan",
      "Add payment method",
      "No charge today",
      "Use Kolkap for 7 days",
      "Billing starts after trial unless cancelled",
    ],
    enterpriseNote:
      "Enterprise requires a custom setup. Contact us instead of starting automatic trial activation.",
    contactUs: "Contact Us",
    loading: "Loading trial activation...",
  },

  id: {
    badge: "Activate Trial",
    title: "Start your 7-day free trial.",
    subtitle:
      "Pilih paket AI staff, aktifkan trial, dan siapkan Kolkap workspace Anda. Payment method needed to activate your trial. You won’t be charged today.",
    back: "Kembali ke Dashboard",
    choosePlan: "Pilih Paket Anda",
    choosePlanText:
      "Pilih paket yang ingin Anda mulai. Anda bisa upgrade nanti saat penggunaan AI bertambah.",
    selectedPlan: "Paket Terpilih",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method needed to activate your trial. You won’t be charged today.",
    billingText:
      "Monthly billing berjalan setelah 7-day trial kecuali dibatalkan sebelum trial selesai.",
    noChargeToday: "No charge today",
    paymentNeeded: "Payment method needed",
    cancelBeforeTrial: "Cancel before trial ends",
    creditsIncluded: "Credits included",
    aiStaffIncluded: "AI staff included",
    teamIncluded: "Team access included",
    activateButton: "Continue to Trial Activation",
    comingSoon: "Payment setup coming soon",
    comingSoonText:
      "Checkout connection akan ditambahkan berikutnya. Untuk sekarang, halaman ini menyiapkan trial flow dan pilihan pricing yang benar.",
    currentFlow: "Trial Flow",
    flowSteps: [
      "Pilih paket",
      "Tambahkan payment method",
      "No charge today",
      "Gunakan Kolkap selama 7 hari",
      "Billing berjalan setelah trial kecuali dibatalkan",
    ],
    enterpriseNote:
      "Enterprise membutuhkan custom setup. Hubungi kami, bukan automatic trial activation.",
    contactUs: "Contact Us",
    loading: "Loading trial activation...",
  },
};

function isValidPlanKey(value: string | null): value is KolkapPlanKey {
  return Boolean(value && planKeys.includes(value as KolkapPlanKey));
}

function ActivateTrialContent() {
  const searchParams = useSearchParams();
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const requestedPlan = searchParams.get("plan");
  const initialPlanKey = isValidPlanKey(requestedPlan) ? requestedPlan : "starter";

  const [selectedPlanKey, setSelectedPlanKey] =
    useState<KolkapPlanKey>(initialPlanKey);

  const selectedPlan = useMemo(
    () => getKolkapPlan(selectedPlanKey),
    [selectedPlanKey]
  );

  const isEnterprise = selectedPlan.key === "enterprise";

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <TrialPill text={t.noChargeToday} />
            <TrialPill text={t.paymentNeeded} />
            <TrialPill text={t.cancelBeforeTrial} />
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <WalletCards className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.choosePlan}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.choosePlanText}
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {planKeys.map((planKey) => {
                const plan = getKolkapPlan(planKey);
                const selected = selectedPlanKey === plan.key;

                return (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => setSelectedPlanKey(plan.key)}
                    className={`rounded-[2rem] border p-6 text-left transition hover:-translate-y-1 ${
                      selected
                        ? "border-[#07111F] bg-[#07111F] text-white shadow-xl shadow-slate-900/15"
                        : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:bg-white"
                    }`}
                  >
                    <div
                      className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                        selected
                          ? "bg-[#7CFF3D] text-[#07111F]"
                          : "bg-[#07111F] text-[#7CFF3D]"
                      }`}
                    >
                      <Bot className="h-7 w-7" />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-3xl font-black tracking-[-0.04em]">
                          {plan.name}
                        </h3>

                        <p
                          className={`mt-2 text-2xl font-black ${
                            selected ? "text-[#7CFF3D]" : "text-blue-600"
                          }`}
                        >
                          {plan.priceLabel}
                        </p>
                      </div>

                      {selected ? (
                        <CheckCircle2 className="h-7 w-7 shrink-0 text-[#7CFF3D]" />
                      ) : null}
                    </div>

                    <p
                      className={`mt-4 text-base font-semibold leading-7 ${
                        selected ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {plan.description}
                    </p>

                    <div className="mt-6 grid gap-3">
                      <FeatureLine
                        selected={selected}
                        text={getPlanCreditLabel(plan)}
                      />
                      <FeatureLine
                        selected={selected}
                        text={getPlanAIStaffLabel(plan)}
                      />
                      <FeatureLine
                        selected={selected}
                        text={getPlanTeamMemberLabel(plan)}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-8">
            <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                <CreditCard className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.selectedPlan}
              </p>

              <h2 className="mt-3 text-5xl font-black tracking-[-0.06em]">
                {selectedPlan.name}
              </h2>

              <p className="mt-3 text-3xl font-black text-[#7CFF3D]">
                {selectedPlan.priceLabel}
              </p>

              <p className="mt-5 text-lg font-semibold leading-8 text-slate-300">
                {selectedPlan.description}
              </p>

              <div className="mt-7 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                <SummaryRow
                  label={t.creditsIncluded}
                  value={getPlanCreditLabel(selectedPlan)}
                />
                <SummaryRow
                  label={t.aiStaffIncluded}
                  value={getPlanAIStaffLabel(selectedPlan)}
                />
                <SummaryRow
                  label={t.teamIncluded}
                  value={getPlanTeamMemberLabel(selectedPlan)}
                />
              </div>

              {isEnterprise ? (
                <p className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-base font-black leading-7 text-amber-800">
                  {t.enterpriseNote}
                </p>
              ) : null}

              <Link
                href={isEnterprise ? "/contact" : "/dashboard/billing"}
                className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                {isEnterprise ? t.contactUs : t.activateButton}
                <ArrowRight className="h-6 w-6" />
              </Link>

              <p className="mt-4 text-center text-sm font-bold leading-6 text-slate-400">
                {isEnterprise ? t.enterpriseNote : t.comingSoon}
              </p>
            </div>

            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <CalendarDays className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.trialTitle}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.trialText}
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                {t.billingText}
              </p>

              <div className="mt-7 grid gap-3">
                {t.flowSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-base font-black text-[#7CFF3D]">
                      {index + 1}
                    </span>

                    <p className="text-lg font-black leading-7">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-blue-100 bg-blue-50 p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
                {t.comingSoon}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-blue-950">
                {t.comingSoonText}
              </h2>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function TrialPill({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
      {text}
    </span>
  );
}

function FeatureLine({
  selected,
  text,
}: {
  selected: boolean;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2
        className={`mt-1 h-5 w-5 shrink-0 ${
          selected ? "text-[#7CFF3D]" : "text-[#07111F]"
        }`}
      />

      <span className="text-base font-black leading-7">{text}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-black text-slate-300">{label}</span>
      <span className="text-base font-black text-white">{value}</span>
    </div>
  );
}

export default function ActivateTrialPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
          <div className="mx-auto max-w-7xl rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading trial activation...
          </div>
        </main>
      }
    >
      <ActivateTrialContent />
    </Suspense>
  );
}