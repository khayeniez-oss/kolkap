"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  Clock3,
  CreditCard,
  Gauge,
  Inbox,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  demoWorkspacePlanStatus,
  getAIStaffLimitLabel,
  getCreditUsagePercent,
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
} from "@/lib/kolkapPlan";

const translations = {
  en: {
    badge: "Business Owner Dashboard",
    title: "Your Kolkap control center.",
    subtitle:
      "Track your trial, AI credits, AI staff, WhatsApp setup, inbox, leads, billing, and business growth from one simple dashboard.",
    currentPlan: "Current Plan",
    planStatus: "Plan Status",
    aiStaffUsage: "AI Staff Usage",
    creditUsage: "Credit Usage",
    remaining: "Remaining",
    used: "Used",
    quickActions: "Quick Actions",
    quickActionsText: "Continue the most important setup steps.",
    continueCreateAI: "Continue Create AI",
    openInbox: "Open Inbox",
    topUpCredits: "Top Up Credits",
    viewBilling: "View Billing",
    upgrade: "Upgrade Plan",
    setupProgress: "Setup Progress",
    setupProgressText: "Complete these steps before activating AI replies.",
    inboxTitle: "Inbox Overview",
    inboxText:
      "Customer conversations, leads, and human handover will appear here after your AI goes live.",
    leadTitle: "Leads Overview",
    leadText:
      "Kolkap will help capture customer details, needs, budget, timeline, and follow-up status.",
    growthTitle: "Business Growth",
    growthText:
      "After your AI is live, reports will show replies, leads, handover rate, and credit usage.",
    pagesTitle: "Dashboard Pages",
    pagesText: "Manage your business workspace from here.",
    lockedNote:
      "Dashboard pages are private for business owners and will follow the selected package, credits, and AI staff limit.",
    trialDays: "trial days left",
    creditsLeft: "credits remaining",
    goLiveStatus: "Go Live Status",
    open: "Open",
    statuses: {
      trial: "Trial",
      active: "Active",
      past_due: "Past Due",
      cancelled: "Cancelled",
      not_connected: "Not connected",
      connected: "Connected",
      pending: "Pending",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
    },
    setupSteps: [
      { label: "Create AI staff", status: "Started" },
      { label: "Add business knowledge", status: "Next" },
      { label: "Connect WhatsApp", status: "Pending" },
      { label: "Test AI replies", status: "Pending" },
      { label: "Go live", status: "Pending" },
    ],
    pages: {
      inbox: ["Inbox", "Conversations, leads, and handover"],
      billing: ["Billing", "Plan, invoices, and subscription"],
      topUp: ["Top Up", "Buy more AI credits anytime"],
      team: ["Team", "Invite and manage team access"],
      reports: ["Reports", "AI replies, leads, and usage reports"],
      settings: ["Settings", "Business profile and account settings"],
      businessOverview: [
        "Business Overview",
        "Business account summary and status",
      ],
    },
  },

  id: {
    badge: "Dashboard Pemilik Bisnis",
    title: "Pusat kontrol Kolkap Anda.",
    subtitle:
      "Pantau trial, AI credits, AI staff, setup WhatsApp, inbox, leads, billing, dan pertumbuhan bisnis dari satu dashboard sederhana.",
    currentPlan: "Paket Saat Ini",
    planStatus: "Status Paket",
    aiStaffUsage: "Pemakaian AI Staff",
    creditUsage: "Pemakaian Credits",
    remaining: "Tersisa",
    used: "Terpakai",
    quickActions: "Aksi Cepat",
    quickActionsText: "Lanjutkan langkah setup yang paling penting.",
    continueCreateAI: "Lanjut Create AI",
    openInbox: "Buka Inbox",
    topUpCredits: "Top Up Credits",
    viewBilling: "Lihat Billing",
    upgrade: "Upgrade Paket",
    setupProgress: "Progress Setup",
    setupProgressText: "Selesaikan langkah ini sebelum mengaktifkan balasan AI.",
    inboxTitle: "Ringkasan Inbox",
    inboxText:
      "Percakapan pelanggan, leads, dan human handover akan muncul di sini setelah AI aktif.",
    leadTitle: "Ringkasan Leads",
    leadText:
      "Kolkap membantu menangkap detail pelanggan, kebutuhan, budget, timeline, dan status follow-up.",
    growthTitle: "Pertumbuhan Bisnis",
    growthText:
      "Setelah AI aktif, reports akan menampilkan balasan, leads, handover rate, dan pemakaian credits.",
    pagesTitle: "Halaman Dashboard",
    pagesText: "Kelola workspace bisnis Anda dari sini.",
    lockedNote:
      "Halaman dashboard adalah halaman pribadi untuk pemilik bisnis dan akan mengikuti paket, credits, dan limit AI staff yang dipilih.",
    trialDays: "hari trial tersisa",
    creditsLeft: "credits tersisa",
    goLiveStatus: "Status Go Live",
    open: "Buka",
    statuses: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
      not_connected: "Belum terhubung",
      connected: "Terhubung",
      pending: "Menunggu",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
    },
    setupSteps: [
      { label: "Buat AI staff", status: "Dimulai" },
      { label: "Tambah business knowledge", status: "Berikutnya" },
      { label: "Hubungkan WhatsApp", status: "Menunggu" },
      { label: "Tes balasan AI", status: "Menunggu" },
      { label: "Aktifkan", status: "Menunggu" },
    ],
    pages: {
      inbox: ["Inbox", "Percakapan, leads, dan handover"],
      billing: ["Billing", "Paket, invoice, dan subscription"],
      topUp: ["Top Up", "Beli AI credits tambahan kapan saja"],
      team: ["Team", "Undang dan kelola akses team"],
      reports: ["Reports", "Balasan AI, leads, dan laporan usage"],
      settings: ["Settings", "Profil bisnis dan pengaturan akun"],
      businessOverview: [
        "Business Overview",
        "Ringkasan akun bisnis dan status",
      ],
    },
  },

  zh: {
    badge: "企业主仪表板",
    title: "您的 Kolkap 控制中心。",
    subtitle:
      "在一个简单的仪表板中查看试用、AI credits、AI 员工、WhatsApp 设置、收件箱、线索、账单和业务增长。",
    currentPlan: "当前方案",
    planStatus: "方案状态",
    aiStaffUsage: "AI 员工使用情况",
    creditUsage: "Credits 使用情况",
    remaining: "剩余",
    used: "已用",
    quickActions: "快捷操作",
    quickActionsText: "继续最重要的设置步骤。",
    continueCreateAI: "继续创建 AI",
    openInbox: "打开收件箱",
    topUpCredits: "充值 Credits",
    viewBilling: "查看账单",
    upgrade: "升级方案",
    setupProgress: "设置进度",
    setupProgressText: "启用 AI 回复前请完成这些步骤。",
    inboxTitle: "收件箱概览",
    inboxText: "AI 上线后，客户对话、线索和人工接手会显示在这里。",
    leadTitle: "线索概览",
    leadText: "Kolkap 将帮助收集客户资料、需求、预算、时间线和跟进状态。",
    growthTitle: "业务增长",
    growthText: "AI 上线后，报告会显示回复、线索、人工接手率和 credits 使用情况。",
    pagesTitle: "仪表板页面",
    pagesText: "从这里管理您的企业工作区。",
    lockedNote:
      "仪表板页面是企业主的私有页面，并会根据所选方案、credits 和 AI 员工限制显示内容。",
    trialDays: "试用天数剩余",
    creditsLeft: "credits 剩余",
    goLiveStatus: "上线状态",
    open: "打开",
    statuses: {
      trial: "试用中",
      active: "有效",
      past_due: "逾期",
      cancelled: "已取消",
      not_connected: "未连接",
      connected: "已连接",
      pending: "待处理",
      draft: "草稿",
      testing: "测试中",
      live: "已上线",
    },
    setupSteps: [
      { label: "创建 AI 员工", status: "已开始" },
      { label: "添加企业知识", status: "下一步" },
      { label: "连接 WhatsApp", status: "待完成" },
      { label: "测试 AI 回复", status: "待完成" },
      { label: "上线", status: "待完成" },
    ],
    pages: {
      inbox: ["收件箱", "对话、线索和人工接手"],
      billing: ["账单", "方案、发票和订阅"],
      topUp: ["充值", "随时购买更多 AI credits"],
      team: ["团队", "邀请和管理团队权限"],
      reports: ["报告", "AI 回复、线索和使用报告"],
      settings: ["设置", "企业资料和账户设置"],
      businessOverview: ["企业概览", "企业账户摘要和状态"],
    },
  },

  ms: {
    badge: "Dashboard Pemilik Bisnes",
    title: "Pusat kawalan Kolkap anda.",
    subtitle:
      "Pantau trial, AI credits, AI staff, setup WhatsApp, inbox, leads, billing, dan pertumbuhan bisnes dari satu dashboard mudah.",
    currentPlan: "Pakej Semasa",
    planStatus: "Status Pakej",
    aiStaffUsage: "Penggunaan AI Staff",
    creditUsage: "Penggunaan Credits",
    remaining: "Baki",
    used: "Digunakan",
    quickActions: "Tindakan Pantas",
    quickActionsText: "Teruskan langkah setup yang paling penting.",
    continueCreateAI: "Teruskan Create AI",
    openInbox: "Buka Inbox",
    topUpCredits: "Top Up Credits",
    viewBilling: "Lihat Billing",
    upgrade: "Upgrade Pakej",
    setupProgress: "Progress Setup",
    setupProgressText: "Lengkapkan langkah ini sebelum mengaktifkan balasan AI.",
    inboxTitle: "Ringkasan Inbox",
    inboxText:
      "Perbualan pelanggan, leads, dan human handover akan muncul di sini selepas AI aktif.",
    leadTitle: "Ringkasan Leads",
    leadText:
      "Kolkap membantu menangkap detail pelanggan, keperluan, bajet, timeline, dan status follow-up.",
    growthTitle: "Pertumbuhan Bisnes",
    growthText:
      "Selepas AI aktif, reports akan menunjukkan balasan, leads, handover rate, dan penggunaan credits.",
    pagesTitle: "Halaman Dashboard",
    pagesText: "Urus workspace bisnes anda dari sini.",
    lockedNote:
      "Halaman dashboard ialah halaman peribadi untuk pemilik bisnes dan akan mengikuti pakej, credits, dan limit AI staff yang dipilih.",
    trialDays: "hari trial berbaki",
    creditsLeft: "credits berbaki",
    goLiveStatus: "Status Go Live",
    open: "Buka",
    statuses: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
      not_connected: "Belum bersambung",
      connected: "Bersambung",
      pending: "Menunggu",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
    },
    setupSteps: [
      { label: "Cipta AI staff", status: "Dimulakan" },
      { label: "Tambah business knowledge", status: "Seterusnya" },
      { label: "Sambung WhatsApp", status: "Menunggu" },
      { label: "Uji balasan AI", status: "Menunggu" },
      { label: "Aktifkan", status: "Menunggu" },
    ],
    pages: {
      inbox: ["Inbox", "Perbualan, leads, dan handover"],
      billing: ["Billing", "Pakej, invoice, dan subscription"],
      topUp: ["Top Up", "Beli AI credits tambahan bila-bila masa"],
      team: ["Team", "Jemput dan urus akses team"],
      reports: ["Reports", "Balasan AI, leads, dan laporan usage"],
      settings: ["Settings", "Profil bisnes dan tetapan akaun"],
      businessOverview: [
        "Business Overview",
        "Ringkasan akaun bisnes dan status",
      ],
    },
  },
};

export default function DashboardPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspace = demoWorkspacePlanStatus;
  const currentPlan = getKolkapPlan(workspace.planKey);
  const creditUsagePercent = getCreditUsagePercent(workspace);
  const aiStaffLabel = getAIStaffLimitLabel(workspace);

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: Clock3,
    },
    {
      label: t.creditUsage,
      value: `${workspace.creditsRemaining}`,
      note: t.creditsLeft,
      icon: WalletCards,
    },
    {
      label: t.aiStaffUsage,
      value: aiStaffLabel,
      note: getPlanAIStaffLabel(currentPlan),
      icon: Bot,
    },
    {
      label: t.goLiveStatus,
      value: t.statuses[workspace.goLiveStatus],
      note: t.statuses[workspace.whatsappStatus],
      icon: ShieldCheck,
    },
  ];

  const dashboardPages = [
    {
      title: t.pages.inbox[0],
      text: t.pages.inbox[1],
      href: "/dashboard/inbox",
      icon: Inbox,
    },
    {
      title: t.pages.billing[0],
      text: t.pages.billing[1],
      href: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      title: t.pages.topUp[0],
      text: t.pages.topUp[1],
      href: "/dashboard/top-up",
      icon: WalletCards,
    },
    {
      title: t.pages.team[0],
      text: t.pages.team[1],
      href: "/dashboard/team",
      icon: Users,
    },
    {
      title: t.pages.reports[0],
      text: t.pages.reports[1],
      href: "/dashboard/reports",
      icon: BarChart3,
    },
    {
      title: t.pages.settings[0],
      text: t.pages.settings[1],
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: t.pages.businessOverview[0],
      text: t.pages.businessOverview[1],
      href: "/dashboard/business-overview",
      icon: Building2,
    },
  ];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              {t.badge}
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              {t.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard/create-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                <Bot className="h-6 w-6" />
                {t.continueCreateAI}
              </Link>

              <Link
                href="/dashboard/inbox"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Inbox className="h-6 w-6" />
                {t.openInbox}
              </Link>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.currentPlan}
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              {currentPlan.name}
            </h2>

            <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
              {currentPlan.priceLabel} • {getPlanCreditLabel(currentPlan)} •{" "}
              {getPlanAIStaffLabel(currentPlan)}
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                <div className="mb-3 flex items-center justify-between gap-4 text-base font-black text-slate-600">
                  <span>{t.creditUsage}</span>
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
                    {t.used}: {workspace.creditsUsed}
                  </span>
                  <span>
                    {t.remaining}: {workspace.creditsRemaining}
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                <p className="text-base font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.planStatus}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {t.statuses[workspace.status]} •{" "}
                  {workspace.trialDaysRemaining} {t.trialDays}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white"
              >
                <TrendingUp className="h-5 w-5" />
                {t.upgrade}
              </Link>

              <Link
                href="/dashboard/top-up"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-4 text-lg font-black text-[#07111F]"
              >
                <WalletCards className="h-5 w-5" />
                {t.topUpCredits}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.setupProgress}
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              {t.setupProgressText}
            </h2>

            <div className="mt-7 grid gap-4">
              {t.setupSteps.map((step, index) => (
                <div
                  key={step.label}
                  className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${
                      index === 0
                        ? "bg-[#07111F] text-[#7CFF3D]"
                        : index === 1
                          ? "bg-blue-100 text-blue-700"
                          : "bg-white text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-black">{step.label}</p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-black ${
                      index === 0
                        ? "bg-[#7CFF3D] text-[#07111F]"
                        : index === 1
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Inbox className="h-8 w-8" />
              </div>

              <h3 className="text-3xl font-black tracking-[-0.04em]">
                {t.inboxTitle}
              </h3>

              <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
                {t.inboxText}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <MessageCircle className="h-7 w-7" />
                </div>

                <h3 className="text-2xl font-black tracking-[-0.04em]">
                  {t.leadTitle}
                </h3>

                <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                  {t.leadText}
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Gauge className="h-7 w-7" />
                </div>

                <h3 className="text-2xl font-black tracking-[-0.04em]">
                  {t.growthTitle}
                </h3>

                <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                  {t.growthText}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.pagesTitle}
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.pagesText}
              </h2>
            </div>

            <p className="max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              {t.lockedNote}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardPages.map((page) => {
              const Icon = page.icon;

              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6 transition hover:-translate-y-1 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-2xl font-black tracking-[-0.04em]">
                    {page.title}
                  </h3>

                  <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                    {page.text}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 text-base font-black text-blue-600">
                    {t.open}
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.quickActions}
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                {t.quickActionsText}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/create-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F]"
              >
                <Bot className="h-6 w-6" />
                {t.continueCreateAI}
              </Link>

              <Link
                href="/dashboard/top-up"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                <WalletCards className="h-6 w-6" />
                {t.topUpCredits}
              </Link>

              <Link
                href="/dashboard/inbox"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                <Inbox className="h-6 w-6" />
                {t.openInbox}
              </Link>

              <Link
                href="/dashboard/billing"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                <CreditCard className="h-6 w-6" />
                {t.viewBilling}
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}