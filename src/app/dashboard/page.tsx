"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Inbox,
  MessageCircle,
  RefreshCcw,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  TestTube2,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type DashboardStats = {
  aiStaffCount: number;
  conversationCount: number;
  leadCount: number;
  handoverCount: number;
  latestConversation: string;
};

type DashboardTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  refresh: string;
  currentPlan: string;
  credits: string;
  aiStaff: string;
  conversations: string;
  leads: string;
  handover: string;
  goLiveStatus: string;
  workspaceStatus: string;
  trialDays: string;
  quickActions: string;
  quickActionsText: string;
  businessFlow: string;
  businessFlowText: string;
  management: string;
  managementText: string;
  latestActivity: string;
  latestActivityText: string;
  noActivity: string;
  openPage: string;
  continue: string;
  viewLeads: string;
  openInbox: string;
  createAI: string;
  testAI: string;
  goLive: string;
  settings: string;
  billing: string;
  topUp: string;
  businessOverview: string;
  reports: string;
  team: string;
  contentStudio: string;
  knowledgeBase: string;
  stepBusiness: string;
  stepBusinessText: string;
  stepCreateAI: string;
  stepCreateAIText: string;
  stepTestAI: string;
  stepTestAIText: string;
  stepGoLive: string;
  stepGoLiveText: string;
  stepInbox: string;
  stepInboxText: string;
  stepLeads: string;
  stepLeadsText: string;
  status: Record<string, string>;
};

const translations: Record<string, DashboardTranslation> = {
  en: {
    badge: "User Dashboard",
    title: "Your Kolkap workspace is ready.",
    subtitle:
      "Manage your AI staff, test replies, activate your AI, track conversations, and follow up with customer leads from one clear dashboard.",
    loading: "Loading your dashboard...",
    failed: "Dashboard could not load.",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    credits: "Credits",
    aiStaff: "AI Staff",
    conversations: "Conversations",
    leads: "Leads",
    handover: "Handover",
    goLiveStatus: "Go Live Status",
    workspaceStatus: "Workspace Status",
    trialDays: "Trial Days Left",
    quickActions: "Quick Actions",
    quickActionsText:
      "Jump directly to the most important actions in your Kolkap workspace.",
    businessFlow: "Main Business Flow",
    businessFlowText:
      "This is the recommended setup flow for every business owner using Kolkap.",
    management: "Workspace Management",
    managementText:
      "Manage billing, credits, settings, reports, team access, and business knowledge.",
    latestActivity: "Latest Activity",
    latestActivityText:
      "Your latest customer activity will appear here once your inbox starts receiving conversations.",
    noActivity: "No customer conversation yet.",
    openPage: "Open Page",
    continue: "Continue",
    viewLeads: "View Leads",
    openInbox: "Open Inbox",
    createAI: "Create AI",
    testAI: "Test AI",
    goLive: "Go Live",
    settings: "Settings",
    billing: "Billing",
    topUp: "Top Up",
    businessOverview: "Business Overview",
    reports: "Reports",
    team: "Team",
    contentStudio: "Content Studio",
    knowledgeBase: "Knowledge Base",
    stepBusiness: "1. Review Business",
    stepBusinessText:
      "Check your business profile, contact details, WhatsApp number, and workspace summary.",
    stepCreateAI: "2. Create AI",
    stepCreateAIText:
      "Create your AI staff and define its role, tone, channel, business knowledge, and instruction.",
    stepTestAI: "3. Test AI",
    stepTestAIText:
      "Send sample customer questions and check how your AI replies before going live.",
    stepGoLive: "4. Go Live",
    stepGoLiveText:
      "Review readiness, select the AI staff, and activate it in your Kolkap workspace.",
    stepInbox: "5. Inbox",
    stepInboxText:
      "View customer conversations, AI replies, human replies, and handover requests.",
    stepLeads: "6. Leads",
    stepLeadsText:
      "Track customer opportunities, update lead status, and follow up with potential buyers.",
    status: {
      trial: "Trial",
      active: "Active",
      past_due: "Past Due",
      cancelled: "Cancelled",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      pending: "Pending",
      not_connected: "Not connected",
      connected: "Connected",
    },
  },

  id: {
    badge: "User Dashboard",
    title: "Workspace Kolkap Anda sudah siap.",
    subtitle:
      "Kelola AI staff, test balasan, aktifkan AI, pantau percakapan, dan follow up leads pelanggan dari satu dashboard yang jelas.",
    loading: "Memuat dashboard Anda...",
    failed: "Dashboard gagal dimuat.",
    refresh: "Refresh",
    currentPlan: "Paket Saat Ini",
    credits: "Credits",
    aiStaff: "AI Staff",
    conversations: "Percakapan",
    leads: "Leads",
    handover: "Handover",
    goLiveStatus: "Status Go Live",
    workspaceStatus: "Status Workspace",
    trialDays: "Sisa Hari Trial",
    quickActions: "Aksi Cepat",
    quickActionsText:
      "Masuk langsung ke aksi paling penting di workspace Kolkap Anda.",
    businessFlow: "Alur Utama Bisnis",
    businessFlowText:
      "Ini adalah alur setup yang disarankan untuk setiap pemilik bisnis di Kolkap.",
    management: "Manajemen Workspace",
    managementText:
      "Kelola billing, credits, settings, reports, team access, dan business knowledge.",
    latestActivity: "Aktivitas Terbaru",
    latestActivityText:
      "Aktivitas pelanggan terbaru akan muncul di sini setelah inbox mulai menerima percakapan.",
    noActivity: "Belum ada percakapan pelanggan.",
    openPage: "Buka Halaman",
    continue: "Lanjutkan",
    viewLeads: "Lihat Leads",
    openInbox: "Buka Inbox",
    createAI: "Create AI",
    testAI: "Test AI",
    goLive: "Go Live",
    settings: "Settings",
    billing: "Billing",
    topUp: "Top Up",
    businessOverview: "Business Overview",
    reports: "Reports",
    team: "Team",
    contentStudio: "Content Studio",
    knowledgeBase: "Knowledge Base",
    stepBusiness: "1. Review Bisnis",
    stepBusinessText:
      "Cek profil bisnis, detail kontak, nomor WhatsApp, dan ringkasan workspace.",
    stepCreateAI: "2. Buat AI",
    stepCreateAIText:
      "Buat AI staff dan atur role, tone, channel, business knowledge, dan instruksinya.",
    stepTestAI: "3. Test AI",
    stepTestAIText:
      "Kirim contoh pertanyaan customer dan cek balasan AI sebelum go live.",
    stepGoLive: "4. Go Live",
    stepGoLiveText:
      "Review kesiapan, pilih AI staff, dan aktifkan AI di workspace Kolkap.",
    stepInbox: "5. Inbox",
    stepInboxText:
      "Lihat percakapan customer, balasan AI, balasan human, dan request handover.",
    stepLeads: "6. Leads",
    stepLeadsText:
      "Pantau peluang customer, update status lead, dan follow up calon pembeli.",
    status: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      pending: "Menunggu",
      not_connected: "Belum terhubung",
      connected: "Terhubung",
    },
  },

  zh: {
    badge: "用户仪表板",
    title: "您的 Kolkap 工作区已准备好。",
    subtitle:
      "在一个清晰的仪表板中管理 AI 员工、测试回复、启用 AI、查看对话并跟进客户线索。",
    loading: "正在加载仪表板...",
    failed: "仪表板加载失败。",
    refresh: "刷新",
    currentPlan: "当前方案",
    credits: "Credits",
    aiStaff: "AI 员工",
    conversations: "对话",
    leads: "线索",
    handover: "人工接手",
    goLiveStatus: "上线状态",
    workspaceStatus: "工作区状态",
    trialDays: "试用剩余天数",
    quickActions: "快速操作",
    quickActionsText: "快速进入 Kolkap 工作区中最重要的操作。",
    businessFlow: "主要业务流程",
    businessFlowText: "这是每位 Kolkap 企业主推荐的设置流程。",
    management: "工作区管理",
    managementText: "管理账单、credits、设置、报告、团队和企业知识。",
    latestActivity: "最新活动",
    latestActivityText: "客户对话开始进入收件箱后，最新活动会显示在这里。",
    noActivity: "暂无客户对话。",
    openPage: "打开页面",
    continue: "继续",
    viewLeads: "查看线索",
    openInbox: "打开收件箱",
    createAI: "创建 AI",
    testAI: "测试 AI",
    goLive: "上线",
    settings: "设置",
    billing: "账单",
    topUp: "充值",
    businessOverview: "企业概览",
    reports: "报告",
    team: "团队",
    contentStudio: "内容工作室",
    knowledgeBase: "知识库",
    stepBusiness: "1. 查看企业资料",
    stepBusinessText: "检查企业资料、联系方式、WhatsApp 号码和工作区摘要。",
    stepCreateAI: "2. 创建 AI",
    stepCreateAIText: "创建 AI 员工并设置角色、语气、渠道、企业知识和指令。",
    stepTestAI: "3. 测试 AI",
    stepTestAIText: "发送客户问题示例，在上线前检查 AI 回复。",
    stepGoLive: "4. 上线",
    stepGoLiveText: "检查准备情况，选择 AI 员工，并在工作区启用。",
    stepInbox: "5. 收件箱",
    stepInboxText: "查看客户对话、AI 回复、人工回复和接手请求。",
    stepLeads: "6. 线索",
    stepLeadsText: "追踪客户机会，更新线索状态，并跟进潜在客户。",
    status: {
      trial: "试用",
      active: "有效",
      past_due: "逾期",
      cancelled: "取消",
      draft: "草稿",
      testing: "测试中",
      live: "已上线",
      pending: "待处理",
      not_connected: "未连接",
      connected: "已连接",
    },
  },

  ms: {
    badge: "User Dashboard",
    title: "Workspace Kolkap anda sudah siap.",
    subtitle:
      "Urus AI staff, test balasan, aktifkan AI, pantau perbualan, dan follow up leads pelanggan dari satu dashboard yang jelas.",
    loading: "Memuat dashboard anda...",
    failed: "Dashboard gagal dimuat.",
    refresh: "Refresh",
    currentPlan: "Pakej Semasa",
    credits: "Credits",
    aiStaff: "AI Staff",
    conversations: "Perbualan",
    leads: "Leads",
    handover: "Handover",
    goLiveStatus: "Status Go Live",
    workspaceStatus: "Status Workspace",
    trialDays: "Hari Trial Berbaki",
    quickActions: "Aksi Cepat",
    quickActionsText:
      "Masuk terus ke aksi paling penting dalam workspace Kolkap anda.",
    businessFlow: "Alur Utama Bisnes",
    businessFlowText:
      "Ini ialah alur setup yang disarankan untuk setiap pemilik bisnes di Kolkap.",
    management: "Pengurusan Workspace",
    managementText:
      "Urus billing, credits, settings, reports, team access, dan business knowledge.",
    latestActivity: "Aktiviti Terbaru",
    latestActivityText:
      "Aktiviti pelanggan terbaru akan muncul di sini selepas inbox mula menerima perbualan.",
    noActivity: "Belum ada perbualan pelanggan.",
    openPage: "Buka Halaman",
    continue: "Teruskan",
    viewLeads: "Lihat Leads",
    openInbox: "Buka Inbox",
    createAI: "Create AI",
    testAI: "Test AI",
    goLive: "Go Live",
    settings: "Settings",
    billing: "Billing",
    topUp: "Top Up",
    businessOverview: "Business Overview",
    reports: "Reports",
    team: "Team",
    contentStudio: "Content Studio",
    knowledgeBase: "Knowledge Base",
    stepBusiness: "1. Review Bisnes",
    stepBusinessText:
      "Semak profil bisnes, detail kontak, nombor WhatsApp, dan ringkasan workspace.",
    stepCreateAI: "2. Cipta AI",
    stepCreateAIText:
      "Cipta AI staff dan tetapkan role, tone, channel, business knowledge, dan arahan.",
    stepTestAI: "3. Test AI",
    stepTestAIText:
      "Hantar contoh soalan customer dan semak balasan AI sebelum go live.",
    stepGoLive: "4. Go Live",
    stepGoLiveText:
      "Review kesiapan, pilih AI staff, dan aktifkan AI dalam workspace Kolkap.",
    stepInbox: "5. Inbox",
    stepInboxText:
      "Lihat perbualan customer, balasan AI, balasan human, dan request handover.",
    stepLeads: "6. Leads",
    stepLeadsText:
      "Pantau peluang customer, update status lead, dan follow up bakal pelanggan.",
    status: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      pending: "Menunggu",
      not_connected: "Belum bersambung",
      connected: "Bersambung",
    },
  },
};

function getAIStaffLimit(planKey: KolkapPlanKey) {
  if (planKey === "free_trial") return 1;
  if (planKey === "growth") return 2;
  if (planKey === "pro") return 5;
  return 20;
}

function statusLabel(t: DashboardTranslation, value: string) {
  return t.status[value] || value;
}

export default function DashboardPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);
  const aiLimit = getAIStaffLimit(workspaceState.planKey);

  const [stats, setStats] = useState<DashboardStats>({
    aiStaffCount: 0,
    conversationCount: 0,
    leadCount: 0,
    handoverCount: 0,
    latestConversation: "",
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (!workspace) return;

      setIsLoadingStats(true);
      setStatsError("");

      const supabase = createClient();

      const [aiResult, conversationResult, leadResult, handoverResult, latestResult] =
        await Promise.all([
          supabase
            .from("ai_staff")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace.id),
          supabase
            .from("customer_conversations")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace.id),
          supabase
            .from("customer_conversations")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace.id)
            .neq("lead_status", "closed"),
          supabase
            .from("customer_conversations")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace.id)
            .eq("handover_requested", true),
          supabase
            .from("customer_conversations")
            .select("last_message")
            .eq("workspace_id", workspace.id)
            .order("last_message_at", { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (!isMounted) return;

      const firstError =
        aiResult.error ||
        conversationResult.error ||
        leadResult.error ||
        handoverResult.error ||
        latestResult.error;

      if (firstError) {
        setStatsError(firstError.message);
        setIsLoadingStats(false);
        return;
      }

      setStats({
        aiStaffCount: aiResult.count ?? 0,
        conversationCount: conversationResult.count ?? 0,
        leadCount: leadResult.count ?? 0,
        handoverCount: handoverResult.count ?? 0,
        latestConversation: latestResult.data?.last_message ?? "",
      });

      setIsLoadingStats(false);
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [workspace, reloadKey]);

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
      href: "/dashboard/billing",
    },
    {
      label: t.credits,
      value: `${workspaceState.creditsRemaining}/${workspaceState.creditsTotal}`,
      note: getPlanCreditLabel(currentPlan),
      icon: Zap,
      href: "/dashboard/top-up",
    },
    {
      label: t.aiStaff,
      value: `${stats.aiStaffCount}/${aiLimit}`,
      note: getPlanAIStaffLabel(currentPlan),
      icon: Bot,
      href: "/dashboard/create-ai",
    },
    {
      label: t.goLiveStatus,
      value: statusLabel(t, workspaceState.goLiveStatus),
      note: statusLabel(t, workspaceState.whatsappStatus),
      icon: Rocket,
      href: "/dashboard/go-live",
    },
  ];

  const quickActions = [
    {
      title: t.createAI,
      text: t.stepCreateAIText,
      href: "/dashboard/create-ai",
      icon: Bot,
    },
    {
      title: t.testAI,
      text: t.stepTestAIText,
      href: "/dashboard/test-ai",
      icon: TestTube2,
    },
    {
      title: t.openInbox,
      text: t.stepInboxText,
      href: "/dashboard/inbox",
      icon: Inbox,
    },
    {
      title: t.viewLeads,
      text: t.stepLeadsText,
      href: "/dashboard/leads",
      icon: UsersRound,
    },
  ];

  const flowCards = [
    {
      title: t.stepBusiness,
      text: t.stepBusinessText,
      href: "/dashboard/business-overview",
      icon: Building2,
    },
    {
      title: t.stepCreateAI,
      text: t.stepCreateAIText,
      href: "/dashboard/create-ai",
      icon: Bot,
    },
    {
      title: t.stepTestAI,
      text: t.stepTestAIText,
      href: "/dashboard/test-ai",
      icon: TestTube2,
    },
    {
      title: t.stepGoLive,
      text: t.stepGoLiveText,
      href: "/dashboard/go-live",
      icon: Rocket,
    },
    {
      title: t.stepInbox,
      text: t.stepInboxText,
      href: "/dashboard/inbox",
      icon: Inbox,
    },
    {
      title: t.stepLeads,
      text: t.stepLeadsText,
      href: "/dashboard/leads",
      icon: UsersRound,
    },
  ];

  const managementCards = [
    {
      title: t.businessOverview,
      href: "/dashboard/business-overview",
      icon: Building2,
    },
    {
      title: t.billing,
      href: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      title: t.topUp,
      href: "/dashboard/top-up",
      icon: WalletCards,
    },
    {
      title: t.settings,
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: t.reports,
      href: "/dashboard/reports",
      icon: BarChart3,
    },
    {
      title: t.team,
      href: "/dashboard/team",
      icon: UserRound,
    },
    {
      title: t.contentStudio,
      href: "/dashboard/content-studio",
      icon: FileText,
    },
    {
      title: t.knowledgeBase,
      href: "/dashboard/knowledge-base",
      icon: MessageCircle,
    },
  ];

  const workspaceHealth = useMemo(() => {
    const items = [
      Boolean(workspace?.business_name),
      stats.aiStaffCount > 0,
      workspaceState.goLiveStatus === "live",
      stats.conversationCount > 0,
    ];

    return items.filter(Boolean).length;
  }, [workspace, stats.aiStaffCount, stats.conversationCount, workspaceState.goLiveStatus]);

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
            <p className="mt-2 text-base font-semibold">{workspaceState.error}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              {t.badge}
            </div>

            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
              {t.refresh}
            </button>
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                {t.workspaceStatus}
              </p>
              <p className="mt-2 text-2xl font-black">
                {statusLabel(t, workspaceState.status)}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                {t.trialDays}
              </p>
              <p className="mt-2 text-2xl font-black">
                {workspaceState.trialDaysRemaining}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                {t.conversations}
              </p>
              <p className="mt-2 text-2xl font-black">
                {isLoadingStats ? "..." : stats.conversationCount}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                {t.leads}
              </p>
              <p className="mt-2 text-2xl font-black">
                {isLoadingStats ? "..." : stats.leadCount}
              </p>
            </div>
          </div>
        </div>

        {statsError ? (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="text-base font-black">{statsError}</p>
          </div>
        ) : null}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-lg font-black text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                  {card.note}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">
                  {t.openPage}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mb-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {t.quickActions}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.quickActionsText}
            </h2>

            <div className="mt-8 grid gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xl font-black">{action.title}</p>
                          <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-1" />
                        </div>
                        <p className="mt-2 text-base font-semibold leading-7 text-slate-300">
                          {action.text}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Rocket className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.businessFlow}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.businessFlowText}
            </h2>

            <div className="mt-8 grid gap-4">
              {flowCards.map((item, index) => {
                const Icon = item.icon;
                const isDone =
                  (index === 0 && Boolean(workspace?.business_name)) ||
                  (index === 1 && stats.aiStaffCount > 0) ||
                  (index === 2 && stats.aiStaffCount > 0) ||
                  (index === 3 && workspaceState.goLiveStatus === "live") ||
                  (index === 4 && stats.conversationCount > 0) ||
                  (index === 5 && stats.leadCount > 0);

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 transition hover:bg-white"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xl font-black">{item.title}</p>
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                          ) : (
                            <ArrowRight className="h-5 w-5 shrink-0 text-blue-600 transition group-hover:translate-x-1" />
                          )}
                        </div>
                        <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Settings className="h-8 w-8" />
              </div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.management}
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.managementText}
              </h2>
            </div>

            <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-blue-700">
                {t.workspaceStatus}
              </p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-blue-950">
                {workspaceHealth}/4
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {managementCards.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 transition hover:bg-white"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black">{item.title}</p>
                    <ArrowRight className="h-4 w-4 text-blue-600 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <MessageCircle className="h-8 w-8" />
              </div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.latestActivity}
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.latestActivityText}
              </h2>
            </div>

            <div className="rounded-[2rem] bg-[#07111F] p-6 text-white">
              <p className="text-xl font-black leading-9">
                {stats.latestConversation || t.noActivity}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/dashboard/inbox"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-base font-black text-[#07111F]"
                >
                  {t.openInbox}
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  href="/dashboard/leads"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white"
                >
                  {t.viewLeads}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}