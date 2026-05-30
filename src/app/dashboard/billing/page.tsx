"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const translations = {
  en: {
    badge: "Billing",
    title: "Manage your Kolkap plan and credits.",
    subtitle:
      "View your current package, trial status, credits, AI staff limit, billing details, and upgrade options.",
    loading: "Loading your billing details...",
    failed: "Billing could not load.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    planStatus: "Plan Status",
    credits: "Credits",
    creditsUsed: "Credits Used",
    creditsRemaining: "Credits Remaining",
    aiStaffLimit: "AI Staff Limit",
    trialDaysLeft: "Trial Days Left",
    billingSummary: "Billing Summary",
    billingSummaryText:
      "Your billing page gives you a clear view of your current Kolkap package, credits, and account status.",
    availablePlans: "Available Plans",
    availablePlansText:
      "Choose a package based on how many AI staff and credits your business needs.",
    invoices: "Invoices",
    invoicesText:
      "Your payment history and invoices will appear here once billing is activated.",
    topUpCredits: "Top Up Credits",
    upgradePlan: "Upgrade Plan",
    contactUs: "Contact Us",
    current: "Current",
    comingSoon: "Coming soon",
    invoiceNotReady:
      "Invoices will be available after your first paid subscription or credit top-up.",
    statuses: {
      trial: "Trial",
      active: "Active",
      past_due: "Past Due",
      cancelled: "Cancelled",
    },
    plans: [
      {
        key: "free_trial",
        name: "Free Trial",
        price: "Free",
        description: "Test Kolkap before choosing a paid plan.",
        features: ["1 AI staff", "100 credits", "14 days trial"],
      },
      {
        key: "growth",
        name: "Growth",
        price: "$49.99/month",
        description: "For small businesses ready to use AI for replies and leads.",
        features: ["2 AI staff", "1,500 credits/month", "WhatsApp setup flow"],
      },
      {
        key: "pro",
        name: "Pro",
        price: "$99.00/month",
        description: "For growing businesses that need more AI staff and credits.",
        features: ["5 AI staff", "4,000 credits/month", "Reports and handover"],
      },
      {
        key: "business",
        name: "Business",
        price: "Contact Us",
        description: "For agencies, hotels, clinics, real estate groups, and teams.",
        features: ["10–20 AI staff", "Custom credits", "Team access"],
      },
    ],
  },

  id: {
    badge: "Billing",
    title: "Kelola paket dan credits Kolkap Anda.",
    subtitle:
      "Lihat paket saat ini, status trial, credits, limit AI staff, detail billing, dan pilihan upgrade.",
    loading: "Memuat detail billing Anda...",
    failed: "Billing gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    planStatus: "Status Paket",
    credits: "Credits",
    creditsUsed: "Credits Terpakai",
    creditsRemaining: "Credits Tersisa",
    aiStaffLimit: "Limit AI Staff",
    trialDaysLeft: "Sisa Hari Trial",
    billingSummary: "Ringkasan Billing",
    billingSummaryText:
      "Halaman billing memberi Anda tampilan yang jelas tentang paket Kolkap, credits, dan status akun.",
    availablePlans: "Paket Tersedia",
    availablePlansText:
      "Pilih paket berdasarkan jumlah AI staff dan credits yang dibutuhkan bisnis Anda.",
    invoices: "Invoice",
    invoicesText:
      "Riwayat pembayaran dan invoice Anda akan muncul di sini setelah billing aktif.",
    topUpCredits: "Top Up Credits",
    upgradePlan: "Upgrade Paket",
    contactUs: "Contact Us",
    current: "Saat Ini",
    comingSoon: "Segera hadir",
    invoiceNotReady:
      "Invoice akan tersedia setelah subscription berbayar atau top-up credits pertama.",
    statuses: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
    plans: [
      {
        key: "free_trial",
        name: "Free Trial",
        price: "Gratis",
        description: "Coba Kolkap sebelum memilih paket berbayar.",
        features: ["1 AI staff", "100 credits", "14 hari trial"],
      },
      {
        key: "growth",
        name: "Growth",
        price: "$49.99/bulan",
        description: "Untuk bisnis kecil yang siap memakai AI untuk balasan dan leads.",
        features: ["2 AI staff", "1.500 credits/bulan", "Setup WhatsApp"],
      },
      {
        key: "pro",
        name: "Pro",
        price: "$99.00/bulan",
        description: "Untuk bisnis berkembang yang butuh lebih banyak AI staff dan credits.",
        features: ["5 AI staff", "4.000 credits/bulan", "Reports dan handover"],
      },
      {
        key: "business",
        name: "Business",
        price: "Contact Us",
        description: "Untuk agency, hotel, klinik, real estate group, dan team.",
        features: ["10–20 AI staff", "Custom credits", "Team access"],
      },
    ],
  },

  zh: {
    badge: "账单",
    title: "管理您的 Kolkap 方案和 credits。",
    subtitle:
      "查看当前方案、试用状态、credits、AI 员工限制、账单详情和升级选项。",
    loading: "正在加载账单详情...",
    failed: "账单加载失败。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    planStatus: "方案状态",
    credits: "Credits",
    creditsUsed: "已用 Credits",
    creditsRemaining: "剩余 Credits",
    aiStaffLimit: "AI 员工限制",
    trialDaysLeft: "试用剩余天数",
    billingSummary: "账单摘要",
    billingSummaryText:
      "账单页面清楚显示您的 Kolkap 方案、credits 和账户状态。",
    availablePlans: "可用方案",
    availablePlansText:
      "根据企业所需的 AI 员工数量和 credits 选择合适方案。",
    invoices: "发票",
    invoicesText:
      "付款记录和发票将在账单启用后显示在这里。",
    topUpCredits: "充值 Credits",
    upgradePlan: "升级方案",
    contactUs: "Contact Us",
    current: "当前",
    comingSoon: "即将推出",
    invoiceNotReady:
      "首次付费订阅或 credits 充值后，发票将显示在这里。",
    statuses: {
      trial: "试用中",
      active: "有效",
      past_due: "逾期",
      cancelled: "已取消",
    },
    plans: [
      {
        key: "free_trial",
        name: "Free Trial",
        price: "免费",
        description: "在选择付费方案前先试用 Kolkap。",
        features: ["1 个 AI 员工", "100 credits", "14 天试用"],
      },
      {
        key: "growth",
        name: "Growth",
        price: "$49.99/月",
        description: "适合准备使用 AI 回复和获取线索的小型企业。",
        features: ["2 个 AI 员工", "每月 1,500 credits", "WhatsApp 设置流程"],
      },
      {
        key: "pro",
        name: "Pro",
        price: "$99.00/月",
        description: "适合需要更多 AI 员工和 credits 的成长型企业。",
        features: ["5 个 AI 员工", "每月 4,000 credits", "报告和人工接手"],
      },
      {
        key: "business",
        name: "Business",
        price: "Contact Us",
        description: "适合代理、酒店、诊所、房地产团队和大型团队。",
        features: ["10–20 个 AI 员工", "Custom credits", "团队权限"],
      },
    ],
  },

  ms: {
    badge: "Billing",
    title: "Urus pakej dan credits Kolkap anda.",
    subtitle:
      "Lihat pakej semasa, status trial, credits, limit AI staff, detail billing, dan pilihan upgrade.",
    loading: "Memuat detail billing anda...",
    failed: "Billing gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    planStatus: "Status Pakej",
    credits: "Credits",
    creditsUsed: "Credits Digunakan",
    creditsRemaining: "Credits Berbaki",
    aiStaffLimit: "Limit AI Staff",
    trialDaysLeft: "Hari Trial Berbaki",
    billingSummary: "Ringkasan Billing",
    billingSummaryText:
      "Halaman billing memberi paparan jelas tentang pakej Kolkap, credits, dan status akaun anda.",
    availablePlans: "Pakej Tersedia",
    availablePlansText:
      "Pilih pakej berdasarkan jumlah AI staff dan credits yang bisnes anda perlukan.",
    invoices: "Invoice",
    invoicesText:
      "Sejarah pembayaran dan invoice akan muncul di sini selepas billing aktif.",
    topUpCredits: "Top Up Credits",
    upgradePlan: "Upgrade Pakej",
    contactUs: "Contact Us",
    current: "Semasa",
    comingSoon: "Akan datang",
    invoiceNotReady:
      "Invoice akan tersedia selepas subscription berbayar atau top-up credits pertama.",
    statuses: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
    plans: [
      {
        key: "free_trial",
        name: "Free Trial",
        price: "Percuma",
        description: "Cuba Kolkap sebelum memilih pakej berbayar.",
        features: ["1 AI staff", "100 credits", "14 hari trial"],
      },
      {
        key: "growth",
        name: "Growth",
        price: "$49.99/bulan",
        description: "Untuk bisnes kecil yang bersedia guna AI untuk balasan dan leads.",
        features: ["2 AI staff", "1,500 credits/bulan", "Setup WhatsApp"],
      },
      {
        key: "pro",
        name: "Pro",
        price: "$99.00/bulan",
        description: "Untuk bisnes berkembang yang perlukan lebih banyak AI staff dan credits.",
        features: ["5 AI staff", "4,000 credits/bulan", "Reports dan handover"],
      },
      {
        key: "business",
        name: "Business",
        price: "Contact Us",
        description: "Untuk agency, hotel, klinik, real estate group, dan team.",
        features: ["10–20 AI staff", "Custom credits", "Team access"],
      },
    ],
  },
};

export default function BillingPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const currentPlan = getKolkapPlan(workspaceState.planKey);

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
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.planStatus,
      value: t.statuses[workspaceState.status],
      note: `${workspaceState.trialDaysRemaining} ${t.trialDaysLeft}`,
      icon: ShieldCheck,
    },
    {
      label: t.creditsRemaining,
      value: `${workspaceState.creditsRemaining}`,
      note: `${workspaceState.creditsUsed}/${workspaceState.creditsTotal} ${t.creditsUsed}`,
      icon: Zap,
    },
    {
      label: t.aiStaffLimit,
      value: getPlanAIStaffLabel(currentPlan),
      note: currentPlan.name,
      icon: Bot,
    },
  ];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <Link
            href="/dashboard"
            className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
            {t.back}
          </Link>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-lg font-black text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
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
                {currentPlan.name}
              </p>

              <h3 className="mt-3 text-5xl font-black tracking-[-0.06em]">
                {currentPlan.priceLabel}
              </h3>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                {getPlanCreditLabel(currentPlan)} •{" "}
                {getPlanAIStaffLabel(currentPlan)}
              </p>

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

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.availablePlans}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.availablePlansText}
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-4">
            {t.plans.map((plan) => {
              const isCurrent = plan.key === workspaceState.planKey;

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

                  <p className="mt-2 text-2xl font-black">{plan.price}</p>

                  <p
                    className={`mt-4 text-base font-semibold leading-7 ${
                      isCurrent ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mt-6 grid gap-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <CheckCircle2
                          className={`mt-1 h-5 w-5 shrink-0 ${
                            isCurrent ? "text-[#7CFF3D]" : "text-[#07111F]"
                          }`}
                        />
                        <span className="text-base font-black">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7">
                    {isCurrent ? (
                      <span className="inline-flex w-full items-center justify-center rounded-full bg-[#7CFF3D] px-6 py-4 text-lg font-black text-[#07111F]">
                        {t.current}
                      </span>
                    ) : (
                      <Link
                        href={plan.key === "business" ? "/contact" : "/pricing"}
                        className={`inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-lg font-black ${
                          isCurrent
                            ? "bg-[#7CFF3D] text-[#07111F]"
                            : "bg-[#07111F] text-white"
                        }`}
                      >
                        {plan.key === "business" ? t.contactUs : t.upgradePlan}
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
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