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
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  demoWorkspacePlanStatus,
  getCreditUsagePercent,
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  kolkapPlans,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";

const planOrder: KolkapPlanKey[] = [
  "free_trial",
  "growth",
  "pro",
  "business",
];

function getUniqueFeatures(items: string[]) {
  return Array.from(new Set(items));
}

const translations = {
  en: {
    badge: "Billing",
    title: "Manage your plan, credits, invoices, and subscription.",
    subtitle:
      "Your billing page follows the package selected by the logged-in business owner.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    planStatus: "Plan Status",
    trialDaysLeft: "trial days left",
    creditsUsed: "Credits Used",
    creditsRemaining: "Credits Remaining",
    aiStaffLimit: "AI Staff Limit",
    upgradePlan: "Upgrade Plan",
    topUpCredits: "Top Up Credits",
    planAllowance: "Plan Allowance",
    availablePlans: "Available Plans",
    availablePlansText:
      "Choose a package based on how many AI staff and credits your business needs.",
    included: "Included",
    choosePlan: "Choose Plan",
    contactUs: "Contact Us",
    current: "Current",
    paymentMethod: "Payment Method",
    paymentText:
      "Payment method will appear here after subscription payment is connected.",
    addPayment: "Add Payment Method",
    invoices: "Invoice History",
    invoiceText: "Your receipts and invoices will appear here.",
    download: "Download",
    topUpNote: "Need more AI credits?",
    topUpText:
      "Top up anytime when your business needs more AI replies or content generation.",
    statuses: {
      trial: "Trial",
      active: "Active",
      past_due: "Past Due",
      cancelled: "Cancelled",
    },
    planNames: {
      free_trial: "Free Trial",
      growth: "Growth",
      pro: "Pro",
      business: "Business",
    },
    planDescriptions: {
      free_trial: "Test Kolkap before choosing a paid plan.",
      growth: "For small businesses ready to use AI for replies and leads.",
      pro: "For growing businesses that need more AI staff and credits.",
      business:
        "For agencies, hotels, clinics, real estate groups, and high-volume teams.",
    },
    invoicesList: [
      ["Trial activated", "$0.00", "Today", "Paid"],
      ["AI credits included", "$0.00", "Today", "Included"],
      ["Subscription invoice", "Pending", "After upgrade", "Pending"],
    ],
  },

  id: {
    badge: "Billing",
    title: "Kelola paket, credits, invoice, dan subscription Anda.",
    subtitle:
      "Halaman billing mengikuti paket yang dipilih oleh pemilik bisnis yang sudah login.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    planStatus: "Status Paket",
    trialDaysLeft: "hari trial tersisa",
    creditsUsed: "Credits Terpakai",
    creditsRemaining: "Credits Tersisa",
    aiStaffLimit: "Limit AI Staff",
    upgradePlan: "Upgrade Paket",
    topUpCredits: "Top Up Credits",
    planAllowance: "Allowance Paket",
    availablePlans: "Paket Tersedia",
    availablePlansText:
      "Pilih paket berdasarkan jumlah AI staff dan credits yang dibutuhkan bisnis Anda.",
    included: "Termasuk",
    choosePlan: "Pilih Paket",
    contactUs: "Hubungi Kami",
    current: "Saat Ini",
    paymentMethod: "Metode Pembayaran",
    paymentText:
      "Metode pembayaran akan muncul di sini setelah pembayaran subscription terhubung.",
    addPayment: "Tambah Metode Pembayaran",
    invoices: "Riwayat Invoice",
    invoiceText: "Receipt dan invoice Anda akan muncul di sini.",
    download: "Download",
    topUpNote: "Butuh lebih banyak AI credits?",
    topUpText:
      "Top up kapan saja saat bisnis Anda membutuhkan lebih banyak balasan AI atau konten.",
    statuses: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
    planNames: {
      free_trial: "Free Trial",
      growth: "Growth",
      pro: "Pro",
      business: "Business",
    },
    planDescriptions: {
      free_trial: "Tes Kolkap sebelum memilih paket berbayar.",
      growth:
        "Untuk bisnis kecil yang siap memakai AI untuk balasan dan leads.",
      pro: "Untuk bisnis berkembang yang butuh lebih banyak AI staff dan credits.",
      business:
        "Untuk agency, hotel, klinik, grup real estate, dan tim high-volume.",
    },
    invoicesList: [
      ["Trial aktif", "$0.00", "Hari ini", "Paid"],
      ["AI credits termasuk", "$0.00", "Hari ini", "Included"],
      ["Invoice subscription", "Pending", "Setelah upgrade", "Pending"],
    ],
  },

  zh: {
    badge: "账单",
    title: "管理您的方案、credits、发票和订阅。",
    subtitle: "账单页面会根据已登录企业主选择的方案显示内容。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    planStatus: "方案状态",
    trialDaysLeft: "试用天数剩余",
    creditsUsed: "已用 Credits",
    creditsRemaining: "剩余 Credits",
    aiStaffLimit: "AI 员工限制",
    upgradePlan: "升级方案",
    topUpCredits: "充值 Credits",
    planAllowance: "方案额度",
    availablePlans: "可用方案",
    availablePlansText: "根据企业需要的 AI 员工数量和 credits 选择方案。",
    included: "包含",
    choosePlan: "选择方案",
    contactUs: "联系我们",
    current: "当前",
    paymentMethod: "付款方式",
    paymentText: "订阅付款连接后，付款方式会显示在这里。",
    addPayment: "添加付款方式",
    invoices: "发票记录",
    invoiceText: "您的收据和发票会显示在这里。",
    download: "下载",
    topUpNote: "需要更多 AI credits？",
    topUpText: "当企业需要更多 AI 回复或内容生成时，可以随时充值。",
    statuses: {
      trial: "试用中",
      active: "有效",
      past_due: "逾期",
      cancelled: "已取消",
    },
    planNames: {
      free_trial: "免费试用",
      growth: "Growth",
      pro: "Pro",
      business: "Business",
    },
    planDescriptions: {
      free_trial: "在选择付费方案前测试 Kolkap。",
      growth: "适合想用 AI 回复客户和获取线索的小型企业。",
      pro: "适合需要更多 AI 员工和 credits 的成长型企业。",
      business: "适合代理、酒店、诊所、房地产团队和高使用量企业。",
    },
    invoicesList: [
      ["试用已启用", "$0.00", "今天", "Paid"],
      ["AI credits 已包含", "$0.00", "今天", "Included"],
      ["订阅发票", "Pending", "升级后", "Pending"],
    ],
  },

  ms: {
    badge: "Billing",
    title: "Urus pakej, credits, invoice, dan subscription anda.",
    subtitle:
      "Halaman billing mengikuti pakej yang dipilih oleh pemilik bisnes yang sudah login.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    planStatus: "Status Pakej",
    trialDaysLeft: "hari trial berbaki",
    creditsUsed: "Credits Digunakan",
    creditsRemaining: "Credits Berbaki",
    aiStaffLimit: "Limit AI Staff",
    upgradePlan: "Upgrade Pakej",
    topUpCredits: "Top Up Credits",
    planAllowance: "Allowance Pakej",
    availablePlans: "Pakej Tersedia",
    availablePlansText:
      "Pilih pakej berdasarkan jumlah AI staff dan credits yang diperlukan bisnes anda.",
    included: "Termasuk",
    choosePlan: "Pilih Pakej",
    contactUs: "Hubungi Kami",
    current: "Semasa",
    paymentMethod: "Kaedah Pembayaran",
    paymentText:
      "Kaedah pembayaran akan muncul di sini selepas pembayaran subscription disambungkan.",
    addPayment: "Tambah Kaedah Pembayaran",
    invoices: "Sejarah Invoice",
    invoiceText: "Receipt dan invoice anda akan muncul di sini.",
    download: "Download",
    topUpNote: "Perlukan lebih banyak AI credits?",
    topUpText:
      "Top up bila-bila masa apabila bisnes anda perlukan lebih banyak balasan AI atau kandungan.",
    statuses: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
    planNames: {
      free_trial: "Free Trial",
      growth: "Growth",
      pro: "Pro",
      business: "Business",
    },
    planDescriptions: {
      free_trial: "Uji Kolkap sebelum memilih pakej berbayar.",
      growth:
        "Untuk bisnes kecil yang bersedia menggunakan AI untuk balasan dan leads.",
      pro: "Untuk bisnes berkembang yang perlukan lebih banyak AI staff dan credits.",
      business:
        "Untuk agency, hotel, klinik, kumpulan real estate, dan team high-volume.",
    },
    invoicesList: [
      ["Trial aktif", "$0.00", "Hari ini", "Paid"],
      ["AI credits termasuk", "$0.00", "Hari ini", "Included"],
      ["Invoice subscription", "Pending", "Selepas upgrade", "Pending"],
    ],
  },
};

export default function BillingPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;

  const workspace = demoWorkspacePlanStatus;
  const currentPlan = getKolkapPlan(workspace.planKey);
  const creditUsagePercent = getCreditUsagePercent(workspace);

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

        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <CreditCard className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.currentPlan}
            </p>

            <h2 className="mt-2 text-5xl font-black tracking-[-0.06em]">
              {t.planNames[workspace.planKey]}
            </h2>

            <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
              {currentPlan.priceLabel}
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.planStatus}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {t.statuses[workspace.status]}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.aiStaffLimit}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {getPlanAIStaffLabel(currentPlan)}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.planAllowance}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {getPlanCreditLabel(currentPlan)}
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
              <div className="mb-3 flex items-center justify-between gap-4 text-base font-black text-slate-600">
                <span>{t.creditsUsed}</span>
                <span>
                  {workspace.creditsUsed}/{workspace.creditsTotal}
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#7CFF3D]"
                  style={{ width: `${creditUsagePercent}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-sm font-black text-slate-500">
                <span>
                  {t.creditsUsed}: {workspace.creditsUsed}
                </span>
                <span>
                  {t.creditsRemaining}: {workspace.creditsRemaining}
                </span>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-lg font-black text-white"
              >
                <TrendingUp className="h-5 w-5" />
                {t.upgradePlan}
              </Link>

              <Link
                href="/dashboard/top-up"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-7 py-4 text-lg font-black text-[#07111F]"
              >
                <WalletCards className="h-5 w-5" />
                {t.topUpCredits}
              </Link>
            </div>
          </section>

          <section className="grid gap-6">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.planStatus}
              </p>

              <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                {t.statuses[workspace.status]}
              </h3>

              <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
                {workspace.trialDaysRemaining} {t.trialDaysLeft}
              </p>
            </div>

            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <CreditCard className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.paymentMethod}
              </p>

              <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
                {t.paymentText}
              </p>

              <button className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-lg font-black text-white">
                <CreditCard className="h-5 w-5" />
                {t.addPayment}
              </button>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.availablePlans}
            </p>
            <h2 className="mt-2 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.availablePlansText}
            </h2>
          </div>

          <div className="grid gap-5">
            {planOrder.map((planKey) => {
              const plan = kolkapPlans[planKey];
              const isCurrent = workspace.planKey === planKey;
              const features = getUniqueFeatures([
                getPlanAIStaffLabel(plan),
                getPlanCreditLabel(plan),
                ...plan.features,
              ]);

              return (
                <div
                  key={plan.key}
                  className={`rounded-[2rem] border p-6 transition ${
                    isCurrent
                      ? "border-[#07111F] bg-[#07111F] text-white shadow-xl shadow-slate-900/15"
                      : "border-slate-200 bg-[#F7F9FA] text-[#07111F]"
                  }`}
                >
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.35fr_auto] lg:items-center">
                    <div>
                      <div
                        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                          isCurrent
                            ? "bg-white text-[#07111F]"
                            : "bg-[#07111F] text-[#7CFF3D]"
                        }`}
                      >
                        {planKey === "free_trial" ? (
                          <Sparkles className="h-7 w-7" />
                        ) : planKey === "growth" ? (
                          <Bot className="h-7 w-7" />
                        ) : planKey === "pro" ? (
                          <TrendingUp className="h-7 w-7" />
                        ) : (
                          <ShieldCheck className="h-7 w-7" />
                        )}
                      </div>

                      <h3 className="text-3xl font-black tracking-[-0.04em]">
                        {t.planNames[planKey]}
                      </h3>

                      <p className="mt-3 text-2xl font-black">
                        {plan.priceLabel}
                      </p>

                      <p
                        className={`mt-4 text-lg font-semibold leading-8 ${
                          isCurrent ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {t.planDescriptions[planKey]}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`mb-4 text-sm font-black uppercase tracking-[0.18em] ${
                          isCurrent ? "text-[#7CFF3D]" : "text-blue-600"
                        }`}
                      >
                        {t.included}
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {features.map((feature, featureIndex) => (
                          <div
                            key={`${plan.key}-${featureIndex}-${feature}`}
                            className={`flex items-start gap-3 rounded-2xl p-4 ${
                              isCurrent ? "bg-white/5" : "bg-white"
                            }`}
                          >
                            <CheckCircle2
                              className={`mt-1 h-5 w-5 shrink-0 ${
                                isCurrent
                                  ? "text-[#7CFF3D]"
                                  : "text-[#07111F]"
                              }`}
                            />
                            <p
                              className={`text-base font-black leading-7 ${
                                isCurrent
                                  ? "text-slate-200"
                                  : "text-slate-700"
                              }`}
                            >
                              {feature}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:min-w-[190px]">
                      <Link
                        href={
                          planKey === "business"
                            ? "/pricing"
                            : "/signup?next=/dashboard/create-ai"
                        }
                        className={`inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-base font-black ${
                          isCurrent
                            ? "bg-[#7CFF3D] text-[#07111F]"
                            : "bg-[#07111F] text-white"
                        }`}
                      >
                        {isCurrent
                          ? t.current
                          : planKey === "business"
                            ? t.contactUs
                            : t.choosePlan}
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ReceiptText className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.invoices}
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              {t.invoiceText}
            </h2>

            <div className="mt-7 grid gap-3">
              {t.invoicesList.map(([name, amount, date, status]) => (
                <div
                  key={`${name}-${date}-${status}`}
                  className="grid gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 sm:grid-cols-[1fr_auto_auto]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-lg font-black">{name}</p>
                      <p className="text-base font-semibold text-slate-500">
                        {date}
                      </p>
                    </div>
                  </div>

                  <p className="text-lg font-black">{amount}</p>

                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]">
                    <Download className="h-4 w-4" />
                    {status === "Pending" ? status : t.download}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <WalletCards className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {t.topUpNote}
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
              {t.topUpText}
            </h2>

            <Link
              href="/dashboard/top-up"
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F]"
            >
              {t.topUpCredits}
              <ArrowRight className="h-6 w-6" />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}