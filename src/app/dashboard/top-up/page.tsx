"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  kolkapTopUpPackages,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

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

type TopUpTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  back: string;
  refresh: string;
  currentPlan: string;
  creditsLeft: string;
  planCredits: string;
  purchasedCredits: string;
  purchasedCreditsNote: string;
  creditsUsed: string;
  creditsUsedNote: string;
  aiStaffLimit: string;
  creditBalance: string;
  creditBalanceText: string;
  topUpPackages: string;
  topUpPackagesText: string;
  howCreditsWork: string;
  howCreditsWorkText: string;
  checkout: string;
  comingSoon: string;
  openBilling: string;
  choosePackage: string;
  bestValue: string;
  secureCheckout: string;
  secureCheckoutText: string;
  noCreditBalance: string;
  creditUnit: string;
  topUpPackageDescription: string;
  usageRules: string[];
  planNames: Record<string, string>;
};

const translations: Record<SupportedLanguage, TopUpTranslation> = {
  en: {
    badge: "Top Up Credits",
    title: "Add more AI credits when your business needs them.",
    subtitle:
      "Keep your AI ready for customer replies, website chat, WhatsApp replies, inbox support, content generation, and campaign work.",
    loading: "Loading your credit balance...",
    failed: "Top-up page could not load.",
    back: "Back to Dashboard",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    creditsLeft: "Credits Left",
    planCredits: "Plan Credits",
    purchasedCredits: "Top-Up Credits",
    purchasedCreditsNote: "Extra credits purchased for this workspace",
    creditsUsed: "Credits Used",
    creditsUsedNote: "credits used",
    aiStaffLimit: "AI Staff Limit",
    creditBalance: "Credit Balance",
    creditBalanceText:
      "Your monthly plan credits and purchased top-up credits are connected to your Kolkap workspace.",
    topUpPackages: "Top-Up Packages",
    topUpPackagesText:
      "Choose extra credits when your business needs more AI replies, WhatsApp replies, content, or campaign support before the next billing cycle.",
    howCreditsWork: "How Credits Work",
    howCreditsWorkText:
      "Credits are used whenever Kolkap generates or sends AI-powered output for your business.",
    checkout: "Checkout",
    comingSoon: "Payment setup in progress",
    openBilling: "Open Billing",
    choosePackage: "Choose Package",
    bestValue: "Best Value",
    secureCheckout: "Secure Checkout",
    secureCheckoutText:
      "Top-up checkout will be connected here. Once active, credits will be added to your workspace after successful payment.",
    noCreditBalance: "Credit balance has not been created for this workspace yet.",
    creditUnit: "credits",
    topUpPackageDescription:
      "Extra credits added on top of your monthly plan credits.",
    usageRules: [
      "Website chat AI reply starts from 3 credits.",
      "Inbox AI reply starts from 3 credits.",
      "AI draft or test reply starts from 3 credits.",
      "WhatsApp AI reply starts from 5 credits.",
      "Manual WhatsApp reply through Kolkap starts from 3 credits.",
      "Longer replies, long content, and campaign packs may use more credits.",
    ],
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
  },

  id: {
    badge: "Top Up Kredit",
    title: "Tambah kredit AI saat bisnis Anda membutuhkannya.",
    subtitle:
      "Pastikan AI Anda tetap siap untuk membalas pelanggan, website chat, WhatsApp, inbox, membuat konten, dan mendukung campaign.",
    loading: "Memuat saldo kredit Anda...",
    failed: "Halaman top-up tidak dapat dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Muat Ulang",
    currentPlan: "Paket Saat Ini",
    creditsLeft: "Sisa Kredit",
    planCredits: "Kredit Paket",
    purchasedCredits: "Kredit Top-Up",
    purchasedCreditsNote: "Kredit tambahan yang dibeli untuk workspace ini",
    creditsUsed: "Kredit Terpakai",
    creditsUsedNote: "kredit terpakai",
    aiStaffLimit: "Limit AI Staff",
    creditBalance: "Saldo Kredit",
    creditBalanceText:
      "Kredit bulanan dari paket Anda dan kredit top-up yang dibeli terhubung dengan workspace Kolkap Anda.",
    topUpPackages: "Paket Top-Up",
    topUpPackagesText:
      "Pilih kredit tambahan saat bisnis Anda membutuhkan lebih banyak balasan AI, balasan WhatsApp, konten, atau dukungan campaign sebelum siklus billing berikutnya.",
    howCreditsWork: "Cara Kredit Digunakan",
    howCreditsWorkText:
      "Kredit digunakan setiap kali Kolkap menghasilkan atau mengirim output AI untuk bisnis Anda.",
    checkout: "Checkout",
    comingSoon: "Setup pembayaran sedang disiapkan",
    openBilling: "Buka Billing",
    choosePackage: "Pilih Paket",
    bestValue: "Nilai Terbaik",
    secureCheckout: "Checkout Aman",
    secureCheckoutText:
      "Checkout top-up akan terhubung di sini. Setelah aktif, kredit akan ditambahkan ke workspace Anda setelah pembayaran berhasil.",
    noCreditBalance: "Saldo kredit belum dibuat untuk workspace ini.",
    creditUnit: "kredit",
    topUpPackageDescription:
      "Kredit tambahan yang ditambahkan di atas kredit bulanan paket Anda.",
    usageRules: [
      "Balasan AI website chat mulai dari 3 kredit.",
      "Balasan AI dari Inbox mulai dari 3 kredit.",
      "AI draft atau test reply mulai dari 3 kredit.",
      "Balasan AI WhatsApp mulai dari 5 kredit.",
      "Balasan WhatsApp manual melalui Kolkap mulai dari 3 kredit.",
      "Balasan panjang, konten panjang, dan campaign pack dapat memakai kredit lebih banyak.",
    ],
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
  },

  zh: {
    badge: "充值积分",
    title: "当业务需要更多支持时，随时添加 AI 积分。",
    subtitle:
      "让您的 AI 随时准备好处理客户回复、网站聊天、WhatsApp 回复、收件箱支持、内容生成和营销活动。",
    loading: "正在加载您的积分余额...",
    failed: "充值页面无法加载。",
    back: "返回 Dashboard",
    refresh: "刷新",
    currentPlan: "当前套餐",
    creditsLeft: "剩余积分",
    planCredits: "套餐积分",
    purchasedCredits: "充值积分",
    purchasedCreditsNote: "为此 workspace 购买的额外积分",
    creditsUsed: "已使用积分",
    creditsUsedNote: "已使用积分",
    aiStaffLimit: "AI 员工数量",
    creditBalance: "积分余额",
    creditBalanceText:
      "您的月度套餐积分和购买的充值积分都会连接到您的 Kolkap workspace。",
    topUpPackages: "充值套餐",
    topUpPackagesText:
      "当您的业务在下一个账单周期前需要更多 AI 回复、WhatsApp 回复、内容或营销支持时，可以购买额外积分。",
    howCreditsWork: "积分如何使用",
    howCreditsWorkText:
      "每当 Kolkap 为您的业务生成或发送 AI 输出时，都会使用积分。",
    checkout: "付款",
    comingSoon: "付款设置正在准备中",
    openBilling: "打开 Billing",
    choosePackage: "选择套餐",
    bestValue: "最划算",
    secureCheckout: "安全付款",
    secureCheckoutText:
      "充值付款功能将在这里连接。启用后，付款成功后积分会加入您的 workspace。",
    noCreditBalance: "此 workspace 尚未创建积分余额。",
    creditUnit: "积分",
    topUpPackageDescription:
      "额外积分会添加到您的月度套餐积分之上。",
    usageRules: [
      "网站聊天 AI 回复从 3 积分开始。",
      "Inbox AI 回复从 3 积分开始。",
      "AI 草稿或测试回复从 3 积分开始。",
      "WhatsApp AI 回复从 5 积分开始。",
      "通过 Kolkap 发送的手动 WhatsApp 回复从 3 积分开始。",
      "较长回复、长内容和营销活动套餐可能会使用更多积分。",
    ],
    planNames: {
      starter: "入门",
      growth: "成长",
      professional: "专业",
      business: "商业",
    },
  },

  ms: {
    badge: "Tambah Nilai Kredit",
    title: "Tambah kredit AI apabila bisnes anda memerlukannya.",
    subtitle:
      "Pastikan AI anda sentiasa bersedia untuk balasan pelanggan, website chat, WhatsApp, sokongan inbox, penjanaan kandungan, dan kempen.",
    loading: "Memuatkan baki kredit anda...",
    failed: "Halaman top-up tidak dapat dimuatkan.",
    back: "Kembali ke Dashboard",
    refresh: "Segar Semula",
    currentPlan: "Pelan Semasa",
    creditsLeft: "Baki Kredit",
    planCredits: "Kredit Pelan",
    purchasedCredits: "Kredit Top-Up",
    purchasedCreditsNote: "Kredit tambahan yang dibeli untuk workspace ini",
    creditsUsed: "Kredit Digunakan",
    creditsUsedNote: "kredit digunakan",
    aiStaffLimit: "Had AI Staff",
    creditBalance: "Baki Kredit",
    creditBalanceText:
      "Kredit bulanan daripada pelan anda dan kredit top-up yang dibeli disambungkan kepada workspace Kolkap anda.",
    topUpPackages: "Pakej Top-Up",
    topUpPackagesText:
      "Pilih kredit tambahan apabila bisnes anda memerlukan lebih banyak balasan AI, balasan WhatsApp, kandungan, atau sokongan kempen sebelum kitaran bil seterusnya.",
    howCreditsWork: "Cara Kredit Digunakan",
    howCreditsWorkText:
      "Kredit digunakan setiap kali Kolkap menghasilkan atau menghantar output AI untuk bisnes anda.",
    checkout: "Checkout",
    comingSoon: "Setup pembayaran sedang disediakan",
    openBilling: "Buka Billing",
    choosePackage: "Pilih Pakej",
    bestValue: "Nilai Terbaik",
    secureCheckout: "Checkout Selamat",
    secureCheckoutText:
      "Checkout top-up akan disambungkan di sini. Selepas aktif, kredit akan ditambah ke workspace anda selepas pembayaran berjaya.",
    noCreditBalance: "Baki kredit belum dibuat untuk workspace ini.",
    creditUnit: "kredit",
    topUpPackageDescription:
      "Kredit tambahan ditambah di atas kredit bulanan pelan anda.",
    usageRules: [
      "Balasan AI website chat bermula daripada 3 kredit.",
      "Balasan AI daripada Inbox bermula daripada 3 kredit.",
      "AI draft atau test reply bermula daripada 3 kredit.",
      "Balasan AI WhatsApp bermula daripada 5 kredit.",
      "Balasan WhatsApp manual melalui Kolkap bermula daripada 3 kredit.",
      "Balasan panjang, kandungan panjang, dan pakej kempen mungkin menggunakan lebih banyak kredit.",
    ],
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
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

function formatCredits(amount: number, t: TopUpTranslation) {
  return `${amount.toLocaleString()} ${t.creditUnit}`;
}

function localizePlanName(
  planKey: string | null | undefined,
  fallback: string,
  t: TopUpTranslation
) {
  if (!planKey) return fallback;

  return t.planNames[planKey] || fallback;
}

export default function TopUpPage() {
  const { language } = useKolkapLanguage();
  const activeLanguage = getSupportedLanguage(language);
  const t = translations[activeLanguage];

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);
  const currentPlanName = localizePlanName(
    workspaceState.planKey,
    currentPlan.name,
    t
  );

  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");

  const creditsLeft = getCreditsLeft(creditBalance);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const usedCredits = Number(creditBalance?.used_credits || 0);
  const totalCredits = planCredits + purchasedCredits;

  const creditUsagePercent =
    totalCredits > 0
      ? Math.min(100, Math.round((usedCredits / totalCredits) * 100))
      : 0;

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
      value: currentPlanName,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.creditsLeft,
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `${usedCredits.toLocaleString()} ${t.creditsUsedNote}`
        : t.noCreditBalance,
      icon: Zap,
      dark: true,
    },
    {
      label: t.planCredits,
      value: planCredits.toLocaleString(),
      note: getPlanCreditLabel(currentPlan),
      icon: Sparkles,
    },
    {
      label: t.purchasedCredits,
      value: purchasedCredits.toLocaleString(),
      note: t.purchasedCreditsNote,
      icon: CreditCard,
    },
    {
      label: t.aiStaffLimit,
      value: getPlanAIStaffLabel(currentPlan),
      note: currentPlanName,
      icon: Bot,
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

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
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
                <WalletCards className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.creditBalance}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.creditBalanceText}
              </h2>
            </div>

            <div className="rounded-[2rem] bg-[#07111F] p-7 text-white">
              <div className="mb-3 flex items-center justify-between gap-4 text-base font-black text-slate-300">
                <span>{t.creditsUsed}</span>
                <span>
                  {usedCredits.toLocaleString()}/{totalCredits.toLocaleString()}
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#7CFF3D]"
                  style={{ width: `${creditUsagePercent}%` }}
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                    {t.creditsLeft}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#7CFF3D]">
                    {creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                    {t.currentPlan}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.06em]">
                    {currentPlanName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.topUpPackages}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.topUpPackagesText}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {kolkapTopUpPackages.map((pack) => {
              const isBestValue = pack.id === "topup_250";

              return (
                <div
                  key={pack.id}
                  className={`rounded-[2rem] border p-6 ${
                    isBestValue
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-[#F7F9FA] text-[#07111F]"
                  }`}
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isBestValue
                        ? "bg-[#7CFF3D] text-[#07111F]"
                        : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Zap className="h-7 w-7" />
                  </div>

                  {isBestValue ? (
                    <div className="mb-4 inline-flex rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                      {t.bestValue}
                    </div>
                  ) : null}

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    ${pack.priceUsd}
                  </h3>

                  <p
                    className={`mt-3 text-2xl font-black ${
                      isBestValue ? "text-[#7CFF3D]" : "text-blue-600"
                    }`}
                  >
                    {formatCredits(pack.credits, t)}
                  </p>

                  <p
                    className={`mt-4 text-base font-semibold leading-7 ${
                      isBestValue ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {t.topUpPackageDescription}
                  </p>

                  <button
                    type="button"
                    disabled
                    className={`mt-7 inline-flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-full px-6 py-4 text-lg font-black opacity-70 ${
                      isBestValue
                        ? "bg-[#7CFF3D] text-[#07111F]"
                        : "bg-[#07111F] text-white"
                    }`}
                  >
                    {t.comingSoon}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Sparkles className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.howCreditsWork}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.howCreditsWorkText}
            </h2>

            <div className="mt-7 grid gap-3">
              {t.usageRules.map((rule) => (
                <div
                  key={rule}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{rule}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CreditCard className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {t.secureCheckout}
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
              {t.secureCheckoutText}
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] opacity-70"
              >
                <ShieldCheck className="h-6 w-6" />
                {t.comingSoon}
              </button>

              <Link
                href="/dashboard/billing"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                <WalletCards className="h-6 w-6" />
                {t.openBilling}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}