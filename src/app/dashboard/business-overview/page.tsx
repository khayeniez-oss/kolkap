"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Crown,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
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
    badge: "Business Overview",
    title: "Your Kolkap business overview.",
    subtitle:
      "View your business account summary, owner details, business identity, plan, credits, AI staff limit, WhatsApp status, and setup progress.",
    loading: "Loading your business overview...",
    failed: "Business Overview could not load.",
    back: "Back to Dashboard",

    ownerDetails: "Owner Details",
    ownerDetailsText:
      "The main contact connected to this Kolkap business account.",

    businessDetails: "Business Details",
    businessDetailsText:
      "A simple summary of the business connected to this Kolkap workspace.",

    workspaceSummary: "Workspace Summary",
    workspaceSummaryText:
      "A quick overview of your package, credits, AI staff, WhatsApp status, and setup progress.",

    currentPlan: "Current Plan",
    credits: "Credits",
    aiStaffLimit: "AI Staff Limit",
    whatsappStatus: "WhatsApp Status",
    goLiveStatus: "Go Live Status",
    accountRole: "Account Role",
    ownerName: "Owner Name",
    ownerEmail: "Owner Email",
    businessName: "Business Name",
    businessType: "Business Type",
    businessEmail: "Business Email",
    businessPhone: "Business Phone",
    whatsappNumber: "WhatsApp Number",
    businessAddress: "Business Address",
    country: "Country",
    timezone: "Timezone",
    planStatus: "Plan Status",
    trialDays: "Trial Days Left",
    editSettings: "Edit Settings",
    openBilling: "Open Billing",
    openInbox: "Open Inbox",
    createAI: "Create AI",
    notProvided: "Not provided yet",

    overviewNote: "Business Summary",
overviewNoteText:
  "Your Kolkap account brings your business details, plan, credits, AI setup, and workspace status together in one clear overview. Update your business information and AI preferences anytime from Settings.",
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
  },

  id: {
    badge: "Business Overview",
    title: "Ringkasan bisnis Kolkap Anda.",
    subtitle:
      "Lihat ringkasan akun bisnis, detail owner, identitas bisnis, paket, credits, limit AI staff, status WhatsApp, dan progress setup.",
    loading: "Memuat business overview Anda...",
    failed: "Business Overview gagal dimuat.",
    back: "Kembali ke Dashboard",

    ownerDetails: "Detail Owner",
    ownerDetailsText:
      "Kontak utama yang terhubung dengan akun bisnis Kolkap ini.",

    businessDetails: "Detail Bisnis",
    businessDetailsText:
      "Ringkasan sederhana tentang bisnis yang terhubung dengan workspace Kolkap ini.",

    workspaceSummary: "Ringkasan Workspace",
    workspaceSummaryText:
      "Ringkasan paket, credits, AI staff, status WhatsApp, dan progress setup.",

    currentPlan: "Paket Saat Ini",
    credits: "Credits",
    aiStaffLimit: "Limit AI Staff",
    whatsappStatus: "Status WhatsApp",
    goLiveStatus: "Status Go Live",
    accountRole: "Role Akun",
    ownerName: "Nama Owner",
    ownerEmail: "Email Owner",
    businessName: "Nama Bisnis",
    businessType: "Jenis Bisnis",
    businessEmail: "Email Bisnis",
    businessPhone: "Telepon Bisnis",
    whatsappNumber: "Nomor WhatsApp",
    businessAddress: "Alamat Bisnis",
    country: "Negara",
    timezone: "Zona Waktu",
    planStatus: "Status Paket",
    trialDays: "Sisa Hari Trial",
    editSettings: "Edit Settings",
    openBilling: "Buka Billing",
    openInbox: "Buka Inbox",
    createAI: "Create AI",
    notProvided: "Belum diisi",

    overviewNote: "Ringkasan Bisnis",
overviewNoteText:
  "Ringkasan akun Kolkap Anda menampilkan detail bisnis, paket, credits, setup AI, dan status workspace dalam satu tampilan yang rapi. Anda dapat memperbarui informasi bisnis dan preferensi AI kapan saja melalui Settings.",

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
  },

  zh: {
    badge: "企业概览",
    title: "您的 Kolkap 企业概览。",
    subtitle:
      "查看企业账户摘要、owner 资料、企业身份、方案、credits、AI 员工限制、WhatsApp 状态和设置进度。",
    loading: "正在加载企业概览...",
    failed: "企业概览加载失败。",
    back: "返回仪表板",

    ownerDetails: "Owner 资料",
    ownerDetailsText: "连接到此 Kolkap 企业账户的主要联系人。",

    businessDetails: "企业资料",
    businessDetailsText: "连接到此 Kolkap 工作区的企业摘要。",

    workspaceSummary: "工作区摘要",
    workspaceSummaryText:
      "快速查看方案、credits、AI 员工、WhatsApp 状态和设置进度。",

    currentPlan: "当前方案",
    credits: "Credits",
    aiStaffLimit: "AI 员工限制",
    whatsappStatus: "WhatsApp 状态",
    goLiveStatus: "上线状态",
    accountRole: "账户角色",
    ownerName: "Owner 名称",
    ownerEmail: "Owner 邮箱",
    businessName: "企业名称",
    businessType: "企业类型",
    businessEmail: "企业邮箱",
    businessPhone: "企业电话",
    whatsappNumber: "WhatsApp 号码",
    businessAddress: "企业地址",
    country: "国家",
    timezone: "时区",
    planStatus: "方案状态",
    trialDays: "试用剩余天数",
    editSettings: "编辑设置",
    openBilling: "打开账单",
    openInbox: "打开收件箱",
    createAI: "创建 AI",
    notProvided: "尚未填写",

    overviewNote: "企业摘要",
overviewNoteText:
  "您的 Kolkap 账户会将企业资料、方案、credits、AI 设置和工作区状态集中在一个清晰的概览中。您可以随时在 Settings 中更新企业信息和 AI 偏好。",

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
  },

  ms: {
    badge: "Business Overview",
    title: "Ringkasan bisnes Kolkap anda.",
    subtitle:
      "Lihat ringkasan akaun bisnes, detail owner, identiti bisnes, pakej, credits, limit AI staff, status WhatsApp, dan progress setup.",
    loading: "Memuat business overview anda...",
    failed: "Business Overview gagal dimuat.",
    back: "Kembali ke Dashboard",

    ownerDetails: "Detail Owner",
    ownerDetailsText:
      "Kontak utama yang disambungkan dengan akaun bisnes Kolkap ini.",

    businessDetails: "Detail Bisnes",
    businessDetailsText:
      "Ringkasan mudah tentang bisnes yang disambungkan dengan workspace Kolkap ini.",

    workspaceSummary: "Ringkasan Workspace",
    workspaceSummaryText:
      "Ringkasan pakej, credits, AI staff, status WhatsApp, dan progress setup.",

    currentPlan: "Pakej Semasa",
    credits: "Credits",
    aiStaffLimit: "Limit AI Staff",
    whatsappStatus: "Status WhatsApp",
    goLiveStatus: "Status Go Live",
    accountRole: "Role Akaun",
    ownerName: "Nama Owner",
    ownerEmail: "Email Owner",
    businessName: "Nama Bisnes",
    businessType: "Jenis Bisnes",
    businessEmail: "Email Bisnes",
    businessPhone: "Telefon Bisnes",
    whatsappNumber: "Nombor WhatsApp",
    businessAddress: "Alamat Bisnes",
    country: "Negara",
    timezone: "Zon Masa",
    planStatus: "Status Pakej",
    trialDays: "Hari Trial Berbaki",
    editSettings: "Edit Settings",
    openBilling: "Buka Billing",
    openInbox: "Buka Inbox",
    createAI: "Create AI",
    notProvided: "Belum diisi",

    overviewNote: "Ringkasan Bisnes",
overviewNoteText:
  "Ringkasan akaun Kolkap anda memaparkan detail bisnes, pakej, credits, setup AI, dan status workspace dalam satu paparan yang kemas. Anda boleh mengemas kini maklumat bisnes dan pilihan AI bila-bila masa melalui Settings.",

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
  },
};

export default function BusinessOverviewPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
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

  const valueOrFallback = (value?: string | null) =>
    value && value.trim() ? value : t.notProvided;

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      icon: WalletCards,
    },
    {
      label: t.credits,
      value: `${workspaceState.creditsRemaining}/${workspaceState.creditsTotal}`,
      icon: Sparkles,
    },
    {
      label: t.aiStaffLimit,
      value: getPlanAIStaffLabel(currentPlan),
      icon: Bot,
    },
    {
      label: t.goLiveStatus,
      value: t.statuses[workspaceState.goLiveStatus],
      icon: ShieldCheck,
    },
  ];

  const ownerDetails = [
    {
      label: t.ownerName,
      value: valueOrFallback(workspace?.business_name),
      icon: UserRound,
    },
    {
      label: t.ownerEmail,
      value: valueOrFallback(workspace?.business_email),
      icon: Mail,
    },
    {
      label: t.accountRole,
      value: "Owner",
      icon: Crown,
    },
  ];

  const businessDetails = [
    {
      label: t.businessName,
      value: valueOrFallback(workspace?.business_name),
      icon: Building2,
    },
    {
      label: t.businessType,
      value: valueOrFallback(workspace?.business_type),
      icon: Sparkles,
    },
    {
      label: t.businessEmail,
      value: valueOrFallback(workspace?.business_email),
      icon: Mail,
    },
    {
      label: t.businessPhone,
      value: valueOrFallback(workspace?.business_phone),
      icon: Phone,
    },
    {
      label: t.whatsappNumber,
      value: valueOrFallback(workspace?.whatsapp_number),
      icon: MessageCircle,
    },
    {
      label: t.businessAddress,
      value: valueOrFallback(workspace?.business_address),
      icon: MapPin,
    },
    {
      label: t.country,
      value: valueOrFallback(workspace?.country),
      icon: Globe2,
    },
    {
      label: t.timezone,
      value: valueOrFallback(workspace?.timezone),
      icon: Globe2,
    },
  ];

  const workspaceDetails = [
    {
      label: t.planStatus,
      value: t.statuses[workspaceState.status],
    },
    {
      label: t.trialDays,
      value: `${workspaceState.trialDaysRemaining}`,
    },
    {
      label: t.whatsappStatus,
      value: t.statuses[workspaceState.whatsappStatus],
    },
    {
      label: t.goLiveStatus,
      value: t.statuses[workspaceState.goLiveStatus],
    },
    {
      label: t.credits,
      value: `${workspaceState.creditsRemaining}/${workspaceState.creditsTotal}`,
    },
    {
      label: t.aiStaffLimit,
      value: getPlanAIStaffLabel(currentPlan),
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
                <p className="mt-2 text-2xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#7CFF3D] text-[#07111F]">
              <UserRound className="h-10 w-10" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {t.ownerDetails}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.ownerDetailsText}
            </h2>

            <div className="mt-8 grid gap-4">
              {ownerDetails.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-2 text-xl font-black">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Building2 className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.businessDetails}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.businessDetailsText}
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {businessDetails.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-2 text-lg font-black">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.workspaceSummary}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.workspaceSummaryText}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceDetails.map((item) => (
              <div
                key={item.label}
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
              >
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-black tracking-[-0.04em]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2.2rem] border border-blue-100 bg-blue-50 p-7 shadow-sm shadow-blue-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
              {t.overviewNote}
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] text-blue-950">
              {t.overviewNoteText}
            </h2>
          </section>

          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <WalletCards className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {currentPlan.name}
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
              {currentPlan.priceLabel} • {getPlanCreditLabel(currentPlan)}
            </h2>

            <div className="mt-8 grid gap-4">
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F]"
              >
                {t.editSettings}
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/billing"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                {t.openBilling}
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/inbox"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                {t.openInbox}
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/create-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                {t.createAI}
                <ArrowRight className="h-6 w-6" />
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}