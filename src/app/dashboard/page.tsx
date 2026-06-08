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
  Sparkles,
  TestTube2,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan, type KolkapPlanKey } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type DashboardStats = {
  aiStaffCount: number;
  conversationCount: number;
  leadCount: number;
  handoverCount: number;
  usageEventCount: number;
  creditsUsedToday: number;
  latestConversation: string;
};

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

type DashboardTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  refresh: string;
  currentPlan: string;
  credits: string;
  creditUnit: string;
  creditsLeft: string;
  creditsUsed: string;
  usage: string;
  usageToday: string;
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
  usagePage: string;
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
  contentStudioQuickText: string;
  usageQuickText: string;
  noCreditBalance: string;
  usedFromBalance: string;
  includedCredits: string;
  monthlyIncluded: string;
  custom: string;
  aiStaffIncluded: string;
  customAIStaffLimit: string;
  planNames: Record<string, string>;
  status: Record<string, string>;
};

const translations: Record<SupportedLanguage, DashboardTranslation> = {
  en: {
    badge: "User Dashboard",
    title: "Your Kolkap workspace is ready.",
    subtitle:
      "Manage your AI staff, test replies, activate your AI, track usage, monitor credits, and follow up with customer leads from one clear dashboard.",
    loading: "Loading your dashboard...",
    failed: "Dashboard could not load.",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    credits: "Credits",
    creditUnit: "credits",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    usage: "Usage",
    usageToday: "credits used today",
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
      "Manage billing, credits, usage, settings, reports, team access, and business knowledge.",
    latestActivity: "Latest Activity",
    latestActivityText:
      "Your latest customer activity will appear here once your inbox starts receiving conversations.",
    noActivity: "No customer conversation yet.",
    openPage: "Open Page",
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
    usagePage: "Usage",
    stepBusiness: "1. Review Business",
    stepBusinessText:
      "Check your business profile, contact details, WhatsApp number, and workspace summary.",
    stepCreateAI: "2. Create AI",
    stepCreateAIText:
      "Create your AI staff and define its role, tone, channel, business knowledge, and instructions.",
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
      "Track customer opportunities, update lead status, and follow up with potential customers.",
    contentStudioQuickText:
      "Generate business content for 5 credits per successful generation.",
    usageQuickText:
      "Track credits used, credits left, AI actions, and workspace activity.",
    noCreditBalance: "Credit balance not found yet.",
    usedFromBalance: "used from balance",
    includedCredits: "total credits",
    monthlyIncluded: "monthly included",
    custom: "Custom",
    aiStaffIncluded: "AI staff included",
    customAIStaffLimit: "Custom AI staff limit",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
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
    badge: "Dashboard Pengguna",
    title: "Workspace Kolkap Anda sudah siap.",
    subtitle:
      "Kelola AI staff, tes balasan, aktifkan AI, pantau penggunaan, monitor kredit, dan follow up leads pelanggan dari satu dashboard yang jelas.",
    loading: "Memuat dashboard Anda...",
    failed: "Dashboard tidak dapat dimuat.",
    refresh: "Muat Ulang",
    currentPlan: "Paket Saat Ini",
    credits: "Kredit",
    creditUnit: "kredit",
    creditsLeft: "Sisa Kredit",
    creditsUsed: "Kredit Terpakai",
    usage: "Penggunaan",
    usageToday: "kredit digunakan hari ini",
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
      "Ini adalah alur setup yang disarankan untuk setiap pemilik bisnis yang menggunakan Kolkap.",
    management: "Manajemen Workspace",
    managementText:
      "Kelola billing, kredit, penggunaan, pengaturan, laporan, akses tim, dan business knowledge.",
    latestActivity: "Aktivitas Terbaru",
    latestActivityText:
      "Aktivitas pelanggan terbaru akan muncul di sini setelah inbox mulai menerima percakapan.",
    noActivity: "Belum ada percakapan pelanggan.",
    openPage: "Buka Halaman",
    viewLeads: "Lihat Leads",
    openInbox: "Buka Inbox",
    createAI: "Buat AI",
    testAI: "Tes AI",
    goLive: "Go Live",
    settings: "Pengaturan",
    billing: "Billing",
    topUp: "Top Up",
    businessOverview: "Ringkasan Bisnis",
    reports: "Laporan",
    team: "Tim",
    contentStudio: "Content Studio",
    knowledgeBase: "Knowledge Base",
    usagePage: "Penggunaan",
    stepBusiness: "1. Review Bisnis",
    stepBusinessText:
      "Cek profil bisnis, detail kontak, nomor WhatsApp, dan ringkasan workspace.",
    stepCreateAI: "2. Buat AI",
    stepCreateAIText:
      "Buat AI staff dan atur role, tone, channel, business knowledge, dan instruksinya.",
    stepTestAI: "3. Tes AI",
    stepTestAIText:
      "Kirim contoh pertanyaan pelanggan dan cek balasan AI sebelum go live.",
    stepGoLive: "4. Go Live",
    stepGoLiveText:
      "Review kesiapan, pilih AI staff, dan aktifkan AI di workspace Kolkap.",
    stepInbox: "5. Inbox",
    stepInboxText:
      "Lihat percakapan pelanggan, balasan AI, balasan human, dan request handover.",
    stepLeads: "6. Leads",
    stepLeadsText:
      "Pantau peluang pelanggan, update status lead, dan follow up calon pelanggan.",
    contentStudioQuickText:
      "Buat konten bisnis dengan 5 kredit untuk setiap hasil yang berhasil dibuat.",
    usageQuickText:
      "Pantau kredit terpakai, sisa kredit, aktivitas AI, dan aktivitas workspace.",
    noCreditBalance: "Saldo kredit belum ditemukan.",
    usedFromBalance: "digunakan dari saldo",
    includedCredits: "total kredit",
    monthlyIncluded: "termasuk bulanan",
    custom: "Custom",
    aiStaffIncluded: "AI staff termasuk",
    customAIStaffLimit: "Limit AI staff custom",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
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
    title: "您的 Kolkap workspace 已准备好。",
    subtitle:
      "在一个清晰的 dashboard 中管理 AI 员工、测试回复、启用 AI、查看使用量、监控积分，并跟进客户线索。",
    loading: "正在加载 dashboard...",
    failed: "Dashboard 无法加载。",
    refresh: "刷新",
    currentPlan: "当前套餐",
    credits: "积分",
    creditUnit: "积分",
    creditsLeft: "剩余积分",
    creditsUsed: "已用积分",
    usage: "使用量",
    usageToday: "今日已用积分",
    aiStaff: "AI 员工",
    conversations: "对话",
    leads: "线索",
    handover: "人工接手",
    goLiveStatus: "上线状态",
    workspaceStatus: "Workspace 状态",
    trialDays: "试用剩余天数",
    quickActions: "快速操作",
    quickActionsText: "快速进入 Kolkap workspace 中最重要的操作。",
    businessFlow: "主要业务流程",
    businessFlowText: "这是每位 Kolkap 企业用户推荐的设置流程。",
    management: "Workspace 管理",
    managementText:
      "管理 billing、积分、使用量、设置、报告、团队权限和企业知识。",
    latestActivity: "最新活动",
    latestActivityText:
      "当 inbox 开始收到客户对话后，最新客户活动会显示在这里。",
    noActivity: "暂无客户对话。",
    openPage: "打开页面",
    viewLeads: "查看线索",
    openInbox: "打开 Inbox",
    createAI: "创建 AI",
    testAI: "测试 AI",
    goLive: "上线",
    settings: "设置",
    billing: "Billing",
    topUp: "充值",
    businessOverview: "企业概览",
    reports: "报告",
    team: "团队",
    contentStudio: "Content Studio",
    knowledgeBase: "Knowledge Base",
    usagePage: "使用量",
    stepBusiness: "1. 查看企业资料",
    stepBusinessText:
      "检查企业资料、联系方式、WhatsApp 号码和 workspace 摘要。",
    stepCreateAI: "2. 创建 AI",
    stepCreateAIText:
      "创建 AI 员工，并设置角色、语气、渠道、企业知识和指令。",
    stepTestAI: "3. 测试 AI",
    stepTestAIText: "发送客户问题示例，在上线前检查 AI 回复。",
    stepGoLive: "4. 上线",
    stepGoLiveText:
      "检查准备情况，选择 AI 员工，并在 Kolkap workspace 中启用。",
    stepInbox: "5. Inbox",
    stepInboxText: "查看客户对话、AI 回复、人工回复和接手请求。",
    stepLeads: "6. 线索",
    stepLeadsText: "追踪客户机会，更新线索状态，并跟进潜在客户。",
    contentStudioQuickText: "每次成功生成业务内容会使用 5 积分。",
    usageQuickText:
      "追踪已用积分、剩余积分、AI 操作和 workspace 活动。",
    noCreditBalance: "尚未找到积分余额。",
    usedFromBalance: "已从余额使用",
    includedCredits: "总积分",
    monthlyIncluded: "每月包含",
    custom: "自定义",
    aiStaffIncluded: "包含 AI 员工",
    customAIStaffLimit: "自定义 AI 员工数量",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    status: {
      trial: "试用",
      active: "有效",
      past_due: "逾期",
      cancelled: "已取消",
      draft: "草稿",
      testing: "测试中",
      live: "已上线",
      pending: "待处理",
      not_connected: "未连接",
      connected: "已连接",
    },
  },

  ms: {
    badge: "Dashboard Pengguna",
    title: "Workspace Kolkap anda sudah siap.",
    subtitle:
      "Urus AI staff, test balasan, aktifkan AI, pantau penggunaan, monitor kredit, dan follow up leads pelanggan dari satu dashboard yang jelas.",
    loading: "Memuatkan dashboard anda...",
    failed: "Dashboard tidak dapat dimuatkan.",
    refresh: "Segar Semula",
    currentPlan: "Pelan Semasa",
    credits: "Kredit",
    creditUnit: "kredit",
    creditsLeft: "Baki Kredit",
    creditsUsed: "Kredit Digunakan",
    usage: "Penggunaan",
    usageToday: "kredit digunakan hari ini",
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
      "Ini ialah alur setup yang disarankan untuk setiap pemilik bisnes yang menggunakan Kolkap.",
    management: "Pengurusan Workspace",
    managementText:
      "Urus billing, kredit, penggunaan, tetapan, laporan, akses team, dan business knowledge.",
    latestActivity: "Aktiviti Terbaru",
    latestActivityText:
      "Aktiviti pelanggan terbaru akan muncul di sini selepas inbox mula menerima perbualan.",
    noActivity: "Belum ada perbualan pelanggan.",
    openPage: "Buka Halaman",
    viewLeads: "Lihat Leads",
    openInbox: "Buka Inbox",
    createAI: "Cipta AI",
    testAI: "Test AI",
    goLive: "Go Live",
    settings: "Tetapan",
    billing: "Billing",
    topUp: "Top Up",
    businessOverview: "Ringkasan Bisnes",
    reports: "Laporan",
    team: "Team",
    contentStudio: "Content Studio",
    knowledgeBase: "Knowledge Base",
    usagePage: "Penggunaan",
    stepBusiness: "1. Review Bisnes",
    stepBusinessText:
      "Semak profil bisnes, detail kontak, nombor WhatsApp, dan ringkasan workspace.",
    stepCreateAI: "2. Cipta AI",
    stepCreateAIText:
      "Cipta AI staff dan tetapkan role, tone, channel, business knowledge, dan arahan.",
    stepTestAI: "3. Test AI",
    stepTestAIText:
      "Hantar contoh soalan pelanggan dan semak balasan AI sebelum go live.",
    stepGoLive: "4. Go Live",
    stepGoLiveText:
      "Review kesiapan, pilih AI staff, dan aktifkan AI dalam workspace Kolkap.",
    stepInbox: "5. Inbox",
    stepInboxText:
      "Lihat perbualan pelanggan, balasan AI, balasan human, dan request handover.",
    stepLeads: "6. Leads",
    stepLeadsText:
      "Pantau peluang pelanggan, update status lead, dan follow up bakal pelanggan.",
    contentStudioQuickText:
      "Jana kandungan bisnes dengan 5 kredit untuk setiap hasil yang berjaya dijana.",
    usageQuickText:
      "Pantau kredit digunakan, baki kredit, aksi AI, dan aktiviti workspace.",
    noCreditBalance: "Baki kredit belum dijumpai.",
    usedFromBalance: "digunakan daripada baki",
    includedCredits: "jumlah kredit",
    monthlyIncluded: "termasuk bulanan",
    custom: "Custom",
    aiStaffIncluded: "AI staff termasuk",
    customAIStaffLimit: "Had AI staff custom",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
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

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
}

function getAIStaffLimit(planKey: KolkapPlanKey) {
  const plan = getKolkapPlan(planKey);

  if (plan.aiStaffLimit === "custom") return "custom";

  return plan.aiStaffLimit;
}

function statusLabel(t: DashboardTranslation, value: string) {
  return t.status[value] || value;
}

function localizePlanName(
  planKey: string | null | undefined,
  fallback: string,
  t: DashboardTranslation
) {
  if (!planKey) return fallback;

  return t.planNames[planKey] || fallback;
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

function formatCredits(amount: number, t: DashboardTranslation) {
  return `${amount.toLocaleString()} ${t.creditUnit}`;
}

function getTodayStartIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export default function DashboardPage() {
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
  const aiLimit = getAIStaffLimit(workspaceState.planKey);

  const [stats, setStats] = useState<DashboardStats>({
    aiStaffCount: 0,
    conversationCount: 0,
    leadCount: 0,
    handoverCount: 0,
    usageEventCount: 0,
    creditsUsedToday: 0,
    latestConversation: "",
  });

  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const creditsLeft = getCreditsLeft(creditBalance);
  const usedCredits = Number(creditBalance?.used_credits || 0);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const totalCredits = planCredits + purchasedCredits;

  const aiLimitValue =
    aiLimit === "custom"
      ? `${stats.aiStaffCount}/${t.custom}`
      : `${stats.aiStaffCount}/${aiLimit}`;

  const aiLimitNote =
    aiLimit === "custom"
      ? t.customAIStaffLimit
      : `${aiLimit} ${t.aiStaffIncluded}`;

  const planCreditNote =
    planCredits > 0
      ? `${formatCredits(planCredits, t)} ${t.monthlyIncluded}`
      : t.includedCredits;

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (!workspace) return;

      setIsLoadingStats(true);
      setStatsError("");

      const supabase = createClient();
      const todayStart = getTodayStartIso();

      const [
        aiResult,
        conversationResult,
        leadResult,
        handoverResult,
        latestResult,
        creditResult,
        usageResult,
        todayUsageResult,
      ] = await Promise.all([
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
        supabase
          .from("workspace_credit_balances")
          .select("*")
          .eq("workspace_id", workspace.id)
          .maybeSingle(),
        supabase
          .from("workspace_usage_events")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id),
        supabase
          .from("workspace_usage_events")
          .select("credits_used")
          .eq("workspace_id", workspace.id)
          .eq("status", "success")
          .gte("created_at", todayStart),
      ]);

      if (!isMounted) return;

      const firstError =
        aiResult.error ||
        conversationResult.error ||
        leadResult.error ||
        handoverResult.error ||
        latestResult.error ||
        creditResult.error ||
        usageResult.error ||
        todayUsageResult.error;

      if (firstError) {
        setStatsError(firstError.message);
        setIsLoadingStats(false);
        return;
      }

      const todayCreditsUsed = (todayUsageResult.data ?? []).reduce(
        (sum, row) => sum + Number(row.credits_used || 0),
        0
      );

      setCreditBalance((creditResult.data ?? null) as CreditBalanceRow | null);

      setStats({
        aiStaffCount: aiResult.count ?? 0,
        conversationCount: conversationResult.count ?? 0,
        leadCount: leadResult.count ?? 0,
        handoverCount: handoverResult.count ?? 0,
        usageEventCount: usageResult.count ?? 0,
        creditsUsedToday: todayCreditsUsed,
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
      value: currentPlanName,
      note: currentPlan.priceLabel,
      icon: WalletCards,
      href: "/dashboard/billing",
    },
    {
      label: t.creditsLeft,
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `${usedCredits.toLocaleString()} ${t.usedFromBalance}`
        : t.noCreditBalance,
      icon: CreditCard,
      href: "/dashboard/usage",
      dark: true,
    },
    {
      label: t.usage,
      value: isLoadingStats ? "..." : `${stats.usageEventCount}`,
      note: `${stats.creditsUsedToday.toLocaleString()} ${t.usageToday}`,
      icon: BarChart3,
      href: "/dashboard/usage",
    },
    {
      label: t.aiStaff,
      value: aiLimitValue,
      note: aiLimitNote,
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
      title: t.contentStudio,
      text: t.contentStudioQuickText,
      href: "/dashboard/content-studio",
      icon: FileText,
    },
    {
      title: t.openInbox,
      text: t.stepInboxText,
      href: "/dashboard/inbox",
      icon: Inbox,
    },
    {
      title: t.usagePage,
      text: t.usageQuickText,
      href: "/dashboard/usage",
      icon: BarChart3,
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
      title: t.usagePage,
      href: "/dashboard/usage",
      icon: BarChart3,
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
  }, [
    workspace,
    stats.aiStaffCount,
    stats.conversationCount,
    workspaceState.goLiveStatus,
  ]);

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
                {t.creditsLeft}
              </p>
              <p className="mt-2 text-2xl font-black text-[#7CFF3D]">
                {creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                {t.usage}
              </p>
              <p className="mt-2 text-2xl font-black">
                {isLoadingStats ? "..." : stats.usageEventCount}
              </p>
            </div>
          </div>
        </div>

        {statsError ? (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="text-base font-black">{statsError}</p>
          </div>
        ) : null}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.label}
                href={card.href}
                className={`group rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
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
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">
                  {t.openPage}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Zap className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.credits}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.creditsLeft}:{" "}
                {creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                {creditBalance
                  ? `${usedCredits.toLocaleString()} ${
                      t.usedFromBalance
                    } • ${totalCredits.toLocaleString()} ${t.includedCredits}`
                  : t.noCreditBalance}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Link
                href="/dashboard/usage"
                className="rounded-[2rem] bg-[#07111F] p-6 text-white"
              >
                <BarChart3 className="mb-5 h-9 w-9 text-[#7CFF3D]" />
                <p className="text-xl font-black">{t.usagePage}</p>
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  {t.creditsUsed}: {usedCredits.toLocaleString()}
                </p>
              </Link>

              <Link
                href="/dashboard/billing"
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
              >
                <CreditCard className="mb-5 h-9 w-9 text-[#07111F]" />
                <p className="text-xl font-black">{t.billing}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {currentPlan.priceLabel}
                </p>
              </Link>

              <Link
                href="/dashboard/top-up"
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
              >
                <WalletCards className="mb-5 h-9 w-9 text-[#07111F]" />
                <p className="text-xl font-black">{t.topUp}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {planCreditNote}
                </p>
              </Link>
            </div>
          </div>
        </section>

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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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