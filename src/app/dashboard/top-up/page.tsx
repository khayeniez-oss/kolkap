"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
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
    badge: "Top Up Credits",
    title: "Add more AI credits when your business needs them.",
    subtitle:
      "Keep your AI staff ready for customer replies, content generation, follow-ups, and campaign support.",
    loading: "Loading your credit balance...",
    failed: "Top-up page could not load.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    currentCredits: "Current Credits",
    creditsRemaining: "Credits Remaining",
    creditsUsed: "Credits Used",
    aiStaffLimit: "AI Staff Limit",
    creditBalance: "Credit Balance",
    creditBalanceText:
      "Your current credit balance is connected to your Kolkap workspace.",
    topUpPackages: "Top-up Packages",
    topUpPackagesText:
      "Choose extra credits when your business needs more AI replies, content, or campaign support.",
    howCreditsWork: "How Credits Work",
    howCreditsWorkText:
      "Credits are used when Kolkap helps your business reply, generate content, or prepare customer follow-ups.",
    checkout: "Checkout",
    comingSoon: "Checkout coming soon",
    openBilling: "Open Billing",
    choosePackage: "Choose Package",
    mostPopular: "Best Value",
    secureCheckout: "Secure Checkout",
    secureCheckoutText:
      "Payment checkout will be connected here. Once active, credits will be added to your workspace after successful payment.",
    usageRules: [
      "1 customer reply uses 1 credit.",
      "1 short social media caption uses 1 credit.",
      "1 property or business description uses 2 credits.",
      "Long content or campaign packs use 3–5 credits depending on length.",
    ],
    packages: [
      {
        name: "$10 Top Up",
        price: "$10",
        credits: "150 credits",
        description: "Good for light testing and small message volume.",
        tag: "",
      },
      {
        name: "$25 Top Up",
        price: "$25",
        credits: "300 credits",
        description: "Helpful for growing inbox activity and basic content.",
        tag: "",
      },
      {
        name: "$50 Top Up",
        price: "$50",
        credits: "800 credits",
        description: "Better value for regular AI replies and content work.",
        tag: "Best Value",
      },
      {
        name: "$100 Top Up",
        price: "$100",
        credits: "1,000 credits",
        description: "For busy teams running more replies and campaigns.",
        tag: "",
      },
    ],
  },

  id: {
    badge: "Top Up Credits",
    title: "Tambah AI credits saat bisnis Anda membutuhkannya.",
    subtitle:
      "Jaga AI staff tetap siap untuk balasan pelanggan, pembuatan konten, follow-up, dan campaign support.",
    loading: "Memuat saldo credits Anda...",
    failed: "Halaman top-up gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    currentCredits: "Credits Saat Ini",
    creditsRemaining: "Credits Tersisa",
    creditsUsed: "Credits Terpakai",
    aiStaffLimit: "Limit AI Staff",
    creditBalance: "Saldo Credits",
    creditBalanceText:
      "Saldo credits Anda terhubung dengan workspace Kolkap Anda.",
    topUpPackages: "Paket Top-up",
    topUpPackagesText:
      "Pilih credits tambahan saat bisnis Anda membutuhkan lebih banyak balasan AI, konten, atau campaign support.",
    howCreditsWork: "Cara Credits Digunakan",
    howCreditsWorkText:
      "Credits digunakan saat Kolkap membantu bisnis Anda membalas, membuat konten, atau menyiapkan follow-up pelanggan.",
    checkout: "Checkout",
    comingSoon: "Checkout segera hadir",
    openBilling: "Buka Billing",
    choosePackage: "Pilih Paket",
    mostPopular: "Best Value",
    secureCheckout: "Secure Checkout",
    secureCheckoutText:
      "Checkout pembayaran akan terhubung di sini. Setelah aktif, credits akan masuk ke workspace Anda setelah pembayaran berhasil.",
    usageRules: [
      "1 balasan pelanggan menggunakan 1 credit.",
      "1 caption social media pendek menggunakan 1 credit.",
      "1 deskripsi properti atau bisnis menggunakan 2 credits.",
      "Konten panjang atau campaign pack menggunakan 3–5 credits tergantung panjang konten.",
    ],
    packages: [
      {
        name: "$10 Top Up",
        price: "$10",
        credits: "150 credits",
        description: "Cocok untuk testing ringan dan volume pesan kecil.",
        tag: "",
      },
      {
        name: "$25 Top Up",
        price: "$25",
        credits: "300 credits",
        description: "Cocok untuk aktivitas inbox yang mulai berkembang dan konten basic.",
        tag: "",
      },
      {
        name: "$50 Top Up",
        price: "$50",
        credits: "800 credits",
        description: "Value lebih baik untuk balasan AI rutin dan pembuatan konten.",
        tag: "Best Value",
      },
      {
        name: "$100 Top Up",
        price: "$100",
        credits: "1.000 credits",
        description: "Untuk team sibuk yang menjalankan lebih banyak balasan dan campaign.",
        tag: "",
      },
    ],
  },

  zh: {
    badge: "充值 Credits",
    title: "当企业需要时，随时添加更多 AI credits。",
    subtitle:
      "让您的 AI 员工随时准备好处理客户回复、内容生成、跟进和活动支持。",
    loading: "正在加载 credit 余额...",
    failed: "充值页面加载失败。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    currentCredits: "当前 Credits",
    creditsRemaining: "剩余 Credits",
    creditsUsed: "已用 Credits",
    aiStaffLimit: "AI 员工限制",
    creditBalance: "Credits 余额",
    creditBalanceText:
      "您的 credit 余额已连接到 Kolkap 工作区。",
    topUpPackages: "充值套餐",
    topUpPackagesText:
      "当企业需要更多 AI 回复、内容或活动支持时，可选择额外 credits。",
    howCreditsWork: "Credits 如何使用",
    howCreditsWorkText:
      "当 Kolkap 帮助您的企业回复客户、生成内容或准备客户跟进时，会使用 credits。",
    checkout: "Checkout",
    comingSoon: "Checkout 即将推出",
    openBilling: "打开账单",
    choosePackage: "选择套餐",
    mostPopular: "Best Value",
    secureCheckout: "安全 Checkout",
    secureCheckoutText:
      "付款 checkout 会连接在这里。启用后，付款成功的 credits 会自动加入您的工作区。",
    usageRules: [
      "1 条客户回复使用 1 credit。",
      "1 条短社交媒体文案使用 1 credit。",
      "1 条房产或企业描述使用 2 credits。",
      "长内容或 campaign pack 根据长度使用 3–5 credits。",
    ],
    packages: [
      {
        name: "$10 Top Up",
        price: "$10",
        credits: "150 credits",
        description: "适合轻量测试和少量消息。",
        tag: "",
      },
      {
        name: "$25 Top Up",
        price: "$25",
        credits: "300 credits",
        description: "适合逐渐增长的收件箱活动和基础内容。",
        tag: "",
      },
      {
        name: "$50 Top Up",
        price: "$50",
        credits: "800 credits",
        description: "适合定期 AI 回复和内容工作，价值更高。",
        tag: "Best Value",
      },
      {
        name: "$100 Top Up",
        price: "$100",
        credits: "1,000 credits",
        description: "适合处理更多回复和 campaign 的繁忙团队。",
        tag: "",
      },
    ],
  },

  ms: {
    badge: "Top Up Credits",
    title: "Tambah AI credits apabila bisnes anda memerlukannya.",
    subtitle:
      "Pastikan AI staff sentiasa bersedia untuk balasan pelanggan, penjanaan kandungan, follow-up, dan campaign support.",
    loading: "Memuat baki credits anda...",
    failed: "Halaman top-up gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    currentCredits: "Credits Semasa",
    creditsRemaining: "Credits Berbaki",
    creditsUsed: "Credits Digunakan",
    aiStaffLimit: "Limit AI Staff",
    creditBalance: "Baki Credits",
    creditBalanceText:
      "Baki credits anda disambungkan dengan workspace Kolkap anda.",
    topUpPackages: "Pakej Top-up",
    topUpPackagesText:
      "Pilih credits tambahan apabila bisnes anda perlukan lebih banyak balasan AI, kandungan, atau campaign support.",
    howCreditsWork: "Cara Credits Digunakan",
    howCreditsWorkText:
      "Credits digunakan apabila Kolkap membantu bisnes anda membalas, menjana kandungan, atau menyediakan follow-up pelanggan.",
    checkout: "Checkout",
    comingSoon: "Checkout akan datang",
    openBilling: "Buka Billing",
    choosePackage: "Pilih Pakej",
    mostPopular: "Best Value",
    secureCheckout: "Secure Checkout",
    secureCheckoutText:
      "Checkout pembayaran akan disambungkan di sini. Selepas aktif, credits akan ditambah ke workspace anda selepas pembayaran berjaya.",
    usageRules: [
      "1 balasan pelanggan menggunakan 1 credit.",
      "1 caption social media pendek menggunakan 1 credit.",
      "1 deskripsi hartanah atau bisnes menggunakan 2 credits.",
      "Kandungan panjang atau campaign pack menggunakan 3–5 credits bergantung pada panjang kandungan.",
    ],
    packages: [
      {
        name: "$10 Top Up",
        price: "$10",
        credits: "150 credits",
        description: "Sesuai untuk testing ringan dan volume mesej kecil.",
        tag: "",
      },
      {
        name: "$25 Top Up",
        price: "$25",
        credits: "300 credits",
        description: "Sesuai untuk aktiviti inbox yang mula berkembang dan kandungan asas.",
        tag: "",
      },
      {
        name: "$50 Top Up",
        price: "$50",
        credits: "800 credits",
        description: "Value lebih baik untuk balasan AI rutin dan kerja kandungan.",
        tag: "Best Value",
      },
      {
        name: "$100 Top Up",
        price: "$100",
        credits: "1,000 credits",
        description: "Untuk team sibuk yang menjalankan lebih banyak balasan dan campaign.",
        tag: "",
      },
    ],
  },
};

export default function TopUpPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const creditUsagePercent =
    workspaceState.creditsTotal > 0
      ? Math.min(
          100,
          Math.round(
            (workspaceState.creditsUsed / workspaceState.creditsTotal) * 100
          )
        )
      : 0;

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
      label: t.creditsRemaining,
      value: `${workspaceState.creditsRemaining}`,
      note: `${workspaceState.creditsUsed}/${workspaceState.creditsTotal} ${t.creditsUsed}`,
      icon: Zap,
    },
    {
      label: t.currentCredits,
      value: `${workspaceState.creditsTotal}`,
      note: getPlanCreditLabel(currentPlan),
      icon: Sparkles,
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
                  {workspaceState.creditsUsed}/{workspaceState.creditsTotal}
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
                    {t.creditsRemaining}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#7CFF3D]">
                    {workspaceState.creditsRemaining}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                    {t.currentPlan}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.06em]">
                    {currentPlan.name}
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

          <div className="grid gap-5 lg:grid-cols-4">
            {t.packages.map((pack) => {
              const isBestValue = pack.tag === t.mostPopular || pack.tag === "Best Value";

              return (
                <div
                  key={pack.name}
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

                  {pack.tag ? (
                    <div
                      className={`mb-4 inline-flex rounded-full px-4 py-2 text-sm font-black ${
                        isBestValue
                          ? "bg-[#7CFF3D] text-[#07111F]"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {pack.tag}
                    </div>
                  ) : null}

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    {pack.name}
                  </h3>

                  <p className="mt-2 text-5xl font-black tracking-[-0.06em]">
                    {pack.price}
                  </p>

                  <p
                    className={`mt-3 text-2xl font-black ${
                      isBestValue ? "text-[#7CFF3D]" : "text-blue-600"
                    }`}
                  >
                    {pack.credits}
                  </p>

                  <p
                    className={`mt-4 text-base font-semibold leading-7 ${
                      isBestValue ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {pack.description}
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