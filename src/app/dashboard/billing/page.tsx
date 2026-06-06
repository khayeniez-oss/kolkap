"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  KOLKAP_TRIAL_NOTE,
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  getPlanTeamMemberLabel,
  kolkapTopUpPackages,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type CreditBalanceRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  plan_name: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  billing_period_start: string | null;
  billing_period_end: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const publicPlanKeys: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
];

const translations = {
  en: {
    badge: "Billing",
    title: "Manage your Kolkap plan, trial, and credits.",
    subtitle:
      "View your current plan, 7-day trial status, monthly credits, top-up credits, billing details, and upgrade options.",
    loading: "Loading your billing details...",
    failed: "Billing could not load.",
    back: "Back to Dashboard",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    planStatus: "Plan Status",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    planCredits: "Plan Credits",
    topUpCredits: "Top-Up Credits",
    aiStaffLimit: "AI Staff Limit",
    teamLimit: "Team Limit",
    trialDaysLeft: "Trial Days Left",
    billingSummary: "Billing Summary",
    billingSummaryText:
      "Your billing page shows your active package, trial details, credits, and account status.",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Start with a 7-day free trial. Card is required. Monthly billing starts automatically after the trial unless cancelled before the trial ends.",
    availablePlans: "Available Plans",
    availablePlansText:
      "Choose a package based on how many AI staff, team members, and monthly credits your business needs.",
    topUpTitle: "Top-Up Credit Packages",
    topUpText:
      "Use top-up credits when your business needs extra AI replies or content generations before the next billing cycle.",
    invoices: "Invoices",
    invoicesText:
      "Your payment history and invoices will appear here once billing is activated.",
    upgradePlan: "Upgrade Plan",
    startTrial: "Start 7-Day Trial",
    contactUs: "Contact Us",
    current: "Current",
    comingSoon: "Coming soon",
    invoiceNotReady:
      "Invoices will be available after your first paid subscription or credit top-up.",
    billingPeriod: "Billing Period",
    cardRequired: "Card required",
    autoBilling: "Auto monthly billing after trial unless cancelled.",
    noCreditBalance: "Credit balance has not been created for this workspace yet.",
    includedMonthly: "Included monthly credits",
    purchasedExtra: "Purchased extra credits",
    usedFromBalance: "Used from balance",
    remainingBalance: "Remaining balance",
    statuses: {
      trial: "Trial",
      active: "Active",
      past_due: "Past Due",
      cancelled: "Cancelled",
    },
  },

  id: {
    badge: "Billing",
    title: "Kelola paket, trial, dan credits Kolkap Anda.",
    subtitle:
      "Lihat paket saat ini, status trial 7 hari, monthly credits, top-up credits, detail billing, dan pilihan upgrade.",
    loading: "Memuat detail billing Anda...",
    failed: "Billing gagal dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Refresh",
    currentPlan: "Paket Saat Ini",
    planStatus: "Status Paket",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    planCredits: "Plan Credits",
    topUpCredits: "Top-Up Credits",
    aiStaffLimit: "Limit AI Staff",
    teamLimit: "Team Limit",
    trialDaysLeft: "Sisa Hari Trial",
    billingSummary: "Ringkasan Billing",
    billingSummaryText:
      "Halaman billing menunjukkan paket aktif, detail trial, credits, dan status account Anda.",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Mulai dengan 7-day free trial. Card diperlukan. Monthly billing akan berjalan otomatis setelah trial kecuali dibatalkan sebelum trial selesai.",
    availablePlans: "Paket Tersedia",
    availablePlansText:
      "Pilih paket berdasarkan jumlah AI staff, team member, dan monthly credits yang dibutuhkan bisnis Anda.",
    topUpTitle: "Top-Up Credit Packages",
    topUpText:
      "Gunakan top-up credits saat bisnis Anda membutuhkan extra AI replies atau content generations sebelum billing cycle berikutnya.",
    invoices: "Invoice",
    invoicesText:
      "Riwayat pembayaran dan invoice Anda akan muncul di sini setelah billing aktif.",
    upgradePlan: "Upgrade Paket",
    startTrial: "Start 7-Day Trial",
    contactUs: "Contact Us",
    current: "Saat Ini",
    comingSoon: "Segera hadir",
    invoiceNotReady:
      "Invoice akan tersedia setelah subscription berbayar atau top-up credits pertama.",
    billingPeriod: "Billing Period",
    cardRequired: "Card required",
    autoBilling: "Auto monthly billing setelah trial kecuali dibatalkan.",
    noCreditBalance: "Credit balance belum dibuat untuk workspace ini.",
    includedMonthly: "Included monthly credits",
    purchasedExtra: "Purchased extra credits",
    usedFromBalance: "Used from balance",
    remainingBalance: "Remaining balance",
    statuses: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
  },
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

export default function BillingPage() {
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");

  const creditsLeft = getCreditsLeft(creditBalance);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const usedCredits = Number(creditBalance?.used_credits || 0);

  async function loadCreditBalance() {
    if (!workspace?.id) return;

    setIsLoadingCredits(true);
    setCreditError("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("workspace_credit_balances")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (error) {
      setCreditError(error.message);
      setIsLoadingCredits(false);
      return;
    }

    setCreditBalance((data ?? null) as CreditBalanceRow | null);
    setIsLoadingCredits(false);
  }

  useEffect(() => {
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            {t.loading}
          </div>
        </section>
      </main>
    );
  }

  if (workspaceState.error) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] border border-red-200 bg-red-50 p-8 text-red-700">
            <p className="text-xl font-black">{t.failed}</p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const summaryCards = [
    {
      label: t.currentPlan,
      value: creditBalance?.plan_name || currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.planStatus,
      value: t.statuses[workspaceState.status] || workspaceState.status,
      note:
        workspaceState.status === "trial"
          ? `${workspaceState.trialDaysRemaining} ${t.trialDaysLeft}`
          : t.autoBilling,
      icon: ShieldCheck,
    },
    {
      label: t.creditsLeft,
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance ? t.remainingBalance : t.noCreditBalance,
      icon: CreditCard,
      dark: true,
    },
    {
      label: t.creditsUsed,
      value: usedCredits.toLocaleString(),
      note: t.usedFromBalance,
      icon: Zap,
    },
    {
      label: t.aiStaffLimit,
      value: getPlanAIStaffLabel(currentPlan),
      note: currentPlan.name,
      icon: Bot,
    },
    {
      label: t.teamLimit,
      value: getPlanTeamMemberLabel(currentPlan),
      note: currentPlan.name,
      icon: UsersRound,
    },
  ];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>

            <button
              type="button"
              onClick={loadCreditBalance}
              disabled={isLoadingCredits}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCcw className="h-5 w-5" />
              {isLoadingCredits ? t.loading : t.refresh}
            </button>
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
        </div>

        {creditError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{creditError}</p>
          </div>
        ) : null}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
                  card.dark
                    ? "border-[#7CFF3D] bg-[#07111F] text-white"
                    : "border-slate-200 bg-white text-[#07111F]"
                }`}
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    card.dark
                      ? "bg-[#7CFF3D] text-[#07111F]"
                      : "bg-[#07111F] text-[#7CFF3D]"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <p
                  className={`text-lg font-black ${
                    card.dark ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>

                <p
                  className={`mt-2 text-base font-semibold leading-7 ${
                    card.dark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <CreditCard className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.billingSummary}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.billingSummaryText}
              </h2>
            </div>

            <div className="rounded-[2rem] bg-[#07111F] p-7 text-white">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {creditBalance?.plan_name || currentPlan.name}
              </p>

              <h3 className="mt-3 text-5xl font-black tracking-[-0.06em]">
                {currentPlan.priceLabel}
              </h3>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                {getPlanCreditLabel(currentPlan)} •{" "}
                {getPlanAIStaffLabel(currentPlan)} •{" "}
                {getPlanTeamMemberLabel(currentPlan)}
              </p>

              <div className="mt-6 grid gap-3 rounded-3xl bg-white/5 p-5">
                <BillingRow label={t.planCredits} value={planCredits} />
                <BillingRow label={t.topUpCredits} value={purchasedCredits} />
                <BillingRow label={t.creditsUsed} value={usedCredits} />
                <BillingRow
                  label={t.creditsLeft}
                  value={creditsLeft === null ? "—" : creditsLeft}
                  highlight
                />
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/dashboard/top-up"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-lg font-black text-[#07111F]"
                >
                  <WalletCards className="h-5 w-5" />
                  {t.topUpCredits}
                </Link>

                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-lg font-black text-white"
                >
                  <TrendingUp className="h-5 w-5" />
                  {t.upgradePlan}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CalendarDays className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.trialTitle}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.trialText}
              </h2>

              <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                {KOLKAP_TRIAL_NOTE}
              </p>

              {creditBalance ? (
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                  {t.billingPeriod}:{" "}
                  {formatDate(creditBalance.billing_period_start)} —{" "}
                  {formatDate(creditBalance.billing_period_end)}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
                  {t.cardRequired}
                </span>

                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
                  {t.autoBilling}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.availablePlans}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.availablePlansText}
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
            {publicPlanKeys.map((planKey) => {
              const plan = getKolkapPlan(planKey);
              const isCurrent =
                plan.key === workspaceState.planKey ||
                (workspaceState.planKey === "pro" &&
                  plan.key === "professional");

              return (
                <div
                  key={plan.key}
                  className={`rounded-[2rem] border p-6 ${
                    isCurrent
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-[#F7F9FA] text-[#07111F]"
                  }`}
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isCurrent
                        ? "bg-[#7CFF3D] text-[#07111F]"
                        : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-2xl font-black">
                    {plan.priceLabel}
                  </p>

                  <p
                    className={`mt-4 text-base font-semibold leading-7 ${
                      isCurrent ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mt-6 grid gap-3">
                    <FeatureItem
                      text={getPlanCreditLabel(plan)}
                      isCurrent={isCurrent}
                    />
                    <FeatureItem
                      text={getPlanAIStaffLabel(plan)}
                      isCurrent={isCurrent}
                    />
                    <FeatureItem
                      text={getPlanTeamMemberLabel(plan)}
                      isCurrent={isCurrent}
                    />
                    {plan.cardRequiredForTrial ? (
                      <FeatureItem text={t.cardRequired} isCurrent={isCurrent} />
                    ) : null}
                  </div>

                  <div className="mt-7">
                    {isCurrent ? (
                      <span className="inline-flex w-full items-center justify-center rounded-full bg-[#7CFF3D] px-6 py-4 text-lg font-black text-[#07111F]">
                        {t.current}
                      </span>
                    ) : (
                      <Link
                        href={
                          plan.key === "enterprise" ? "/contact" : "/pricing"
                        }
                        className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white"
                      >
                        {plan.key === "enterprise"
                          ? t.contactUs
                          : t.startTrial}
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.topUpTitle}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.topUpText}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {kolkapTopUpPackages.map((pack) => (
              <div
                key={pack.id}
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Zap className="h-7 w-7" />
                </div>

                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  ${pack.priceUsd}
                </h3>

                <p className="mt-2 text-xl font-black text-slate-700">
                  {pack.credits.toLocaleString()} credits
                </p>

                <Link
                  href="/dashboard/top-up"
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-5 py-4 text-base font-black text-white"
                >
                  {t.topUpCredits}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <FileText className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.invoices}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.invoicesText}
              </h2>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                <Download className="h-7 w-7" />
              </div>

              <h3 className="text-3xl font-black tracking-[-0.04em]">
                {t.comingSoon}
              </h3>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                {t.invoiceNotReady}
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function BillingRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
      <span className="text-sm font-black text-slate-300">{label}</span>
      <span
        className={`text-base font-black ${
          highlight ? "text-[#7CFF3D]" : "text-white"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

function FeatureItem({
  text,
  isCurrent,
}: {
  text: string;
  isCurrent: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2
        className={`mt-1 h-5 w-5 shrink-0 ${
          isCurrent ? "text-[#7CFF3D]" : "text-[#07111F]"
        }`}
      />
      <span className="text-base font-black">{text}</span>
    </div>
  );
}