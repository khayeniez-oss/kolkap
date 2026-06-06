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

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type ActivateTrialTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  back: string;
  choosePlan: string;
  choosePlanText: string;
  selectedPlan: string;
  trialTitle: string;
  trialText: string;
  billingText: string;
  noChargeToday: string;
  paymentNeeded: string;
  cancelBeforeTrial: string;
  creditsIncluded: string;
  aiStaffIncluded: string;
  teamIncluded: string;
  activateButton: string;
  comingSoon: string;
  comingSoonText: string;
  flowSteps: string[];
  enterpriseNote: string;
  contactUs: string;
  loading: string;
};

const supportedLanguages: SupportedLanguage[] = ["en", "id", "zh", "ms"];

const planKeys: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
];

const translations: Record<SupportedLanguage, ActivateTrialTranslation> = {
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
    badge: "Aktifkan Trial",
    title: "Mulai 7-day free trial Anda.",
    subtitle:
      "Pilih paket AI staff, aktifkan trial, dan siapkan Kolkap workspace Anda. Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan biaya hari ini.",
    back: "Kembali ke Dashboard",
    choosePlan: "Pilih Paket Anda",
    choosePlanText:
      "Pilih paket yang ingin Anda mulai. Anda bisa upgrade nanti saat penggunaan AI bertambah.",
    selectedPlan: "Paket Terpilih",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan biaya hari ini.",
    billingText:
      "Monthly billing berjalan setelah 7-day trial kecuali dibatalkan sebelum trial selesai.",
    noChargeToday: "Tidak dikenakan biaya hari ini",
    paymentNeeded: "Payment method diperlukan",
    cancelBeforeTrial: "Batalkan sebelum trial selesai",
    creditsIncluded: "Credits termasuk",
    aiStaffIncluded: "AI staff termasuk",
    teamIncluded: "Team access termasuk",
    activateButton: "Lanjutkan Trial Activation",
    comingSoon: "Payment setup segera hadir",
    comingSoonText:
      "Checkout connection akan ditambahkan berikutnya. Untuk sekarang, halaman ini menyiapkan trial flow dan pilihan pricing yang benar.",
    flowSteps: [
      "Pilih paket",
      "Tambahkan payment method",
      "Tidak dikenakan biaya hari ini",
      "Gunakan Kolkap selama 7 hari",
      "Billing berjalan setelah trial kecuali dibatalkan",
    ],
    enterpriseNote:
      "Enterprise membutuhkan custom setup. Hubungi kami, bukan automatic trial activation.",
    contactUs: "Hubungi Kami",
    loading: "Memuat trial activation...",
  },

  zh: {
    badge: "激活试用",
    title: "开始您的 7 天免费试用。",
    subtitle:
      "选择您的 AI 员工方案，激活试用，并准备 Kolkap workspace。需要添加付款方式来激活试用。今天不会收费。",
    back: "返回 Dashboard",
    choosePlan: "选择您的方案",
    choosePlanText:
      "选择您想开始使用的方案。之后可根据 AI usage 增长进行升级。",
    selectedPlan: "已选择方案",
    trialTitle: "7 天免费试用",
    trialText: "需要添加付款方式来激活试用。今天不会收费。",
    billingText:
      "7 天试用结束后将开始按月计费，除非您在试用结束前取消。",
    noChargeToday: "今天不会收费",
    paymentNeeded: "需要付款方式",
    cancelBeforeTrial: "试用结束前可取消",
    creditsIncluded: "包含 credits",
    aiStaffIncluded: "包含 AI 员工",
    teamIncluded: "包含团队权限",
    activateButton: "继续激活试用",
    comingSoon: "付款设置即将推出",
    comingSoonText:
      "Checkout connection 将在下一步添加。目前此页面用于准备正确的试用流程和 pricing 选择。",
    flowSteps: [
      "选择方案",
      "添加付款方式",
      "今天不会收费",
      "使用 Kolkap 7 天",
      "试用结束后开始计费，除非提前取消",
    ],
    enterpriseNote:
      "Enterprise 需要定制设置。请联系我们，而不是使用自动试用激活。",
    contactUs: "联系我们",
    loading: "正在加载试用激活...",
  },

  ms: {
    badge: "Aktifkan Trial",
    title: "Mulakan 7-day free trial anda.",
    subtitle:
      "Pilih pakej AI staff, aktifkan trial, dan sediakan Kolkap workspace anda. Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan caj hari ini.",
    back: "Kembali ke Dashboard",
    choosePlan: "Pilih Pakej Anda",
    choosePlanText:
      "Pilih pakej yang anda mahu mulakan. Anda boleh upgrade kemudian apabila AI usage bertambah.",
    selectedPlan: "Pakej Dipilih",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan caj hari ini.",
    billingText:
      "Monthly billing bermula selepas 7-day trial kecuali dibatalkan sebelum trial tamat.",
    noChargeToday: "Tiada caj hari ini",
    paymentNeeded: "Payment method diperlukan",
    cancelBeforeTrial: "Batal sebelum trial tamat",
    creditsIncluded: "Credits termasuk",
    aiStaffIncluded: "AI staff termasuk",
    teamIncluded: "Team access termasuk",
    activateButton: "Teruskan Trial Activation",
    comingSoon: "Payment setup akan datang",
    comingSoonText:
      "Checkout connection akan ditambah seterusnya. Buat masa ini, halaman ini menyediakan trial flow dan pilihan pricing yang betul.",
    flowSteps: [
      "Pilih pakej",
      "Tambah payment method",
      "Tiada caj hari ini",
      "Gunakan Kolkap selama 7 hari",
      "Billing bermula selepas trial kecuali dibatalkan",
    ],
    enterpriseNote:
      "Enterprise memerlukan custom setup. Hubungi kami, bukan automatic trial activation.",
    contactUs: "Hubungi Kami",
    loading: "Memuat trial activation...",
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : "en";
}

function isValidPlanKey(value: string | null): value is KolkapPlanKey {
  return Boolean(value && planKeys.includes(value as KolkapPlanKey));
}

function localizePlanLabel(label: string, language: SupportedLanguage) {
  if (language === "zh") {
    return label
      .replace("AI credits/month", "AI credits/月")
      .replace("Custom credits", "定制 credits")
      .replace("AI staff", "AI 员工")
      .replace("Team member", "团队成员")
      .replace("Team members", "团队成员")
      .replace("Custom", "定制");
  }

  if (language === "id" || language === "ms") {
    return label
      .replace("AI credits/month", "AI credits/bulan")
      .replace("Custom credits", "Custom credits");
  }

  return label;
}

function ActivateTrialContent() {
  const searchParams = useSearchParams();
  const { language } = useKolkapLanguage();
  const lang = getSupportedLanguage(language);
  const t = translations[lang];

  const requestedPlan = searchParams.get("plan");
  const initialPlanKey = isValidPlanKey(requestedPlan)
    ? requestedPlan
    : "starter";

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
                        text={localizePlanLabel(getPlanCreditLabel(plan), lang)}
                      />
                      <FeatureLine
                        selected={selected}
                        text={localizePlanLabel(getPlanAIStaffLabel(plan), lang)}
                      />
                      <FeatureLine
                        selected={selected}
                        text={localizePlanLabel(
                          getPlanTeamMemberLabel(plan),
                          lang
                        )}
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
                  value={localizePlanLabel(getPlanCreditLabel(selectedPlan), lang)}
                />
                <SummaryRow
                  label={t.aiStaffIncluded}
                  value={localizePlanLabel(getPlanAIStaffLabel(selectedPlan), lang)}
                />
                <SummaryRow
                  label={t.teamIncluded}
                  value={localizePlanLabel(
                    getPlanTeamMemberLabel(selectedPlan),
                    lang
                  )}
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