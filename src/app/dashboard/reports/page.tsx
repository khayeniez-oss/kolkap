"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  Inbox,
  LineChart,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
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
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type AiStaffRow = {
  id: string;
  name: string;
  role: string;
  status: string;
};

type ConversationRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  ai_staff_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_channel: string;
  status: string;
  lead_status: string;
  handover_requested: boolean;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  workspace_id: string;
  owner_user_id: string;
  ai_staff_id: string | null;
  sender_type: string;
  message_text?: string | null;
  created_at: string;
};

type ReportTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  back: string;
  refresh: string;
  currentPlan: string;
  credits: string;
  aiStaff: string;
  conversations: string;
  leads: string;
  handover: string;
  conversionRate: string;
  responseMix: string;
  analyticsOverview: string;
  analyticsOverviewText: string;
  leadPipeline: string;
  leadPipelineText: string;
  activityTrend: string;
  activityTrendText: string;
  channelBreakdown: string;
  channelBreakdownText: string;
  aiPerformance: string;
  aiPerformanceText: string;
  latestActivity: string;
  latestActivityText: string;
  noActivity: string;
  openInbox: string;
  openLeads: string;
  createAI: string;
  goLive: string;
  totalMessages: string;
  customerMessages: string;
  aiReplies: string;
  humanReplies: string;
  newLead: string;
  qualified: string;
  followUp: string;
  closed: string;
  open: string;
  live: string;
  draft: string;
  testing: string;
  noData: string;
  insightTitle: string;
  insightText: string;
  emptyInsight: string;
  status: Record<string, string>;
};

const translations: Record<string, ReportTranslation> = {
  en: {
    badge: "Reports",
    title: "Understand your customer activity at a glance.",
    subtitle:
      "Track conversations, leads, handover needs, AI usage, message activity, and workspace performance in a simple analytics view.",
    loading: "Loading your reports...",
    failed: "Reports could not load.",
    back: "Back to Dashboard",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    credits: "Credits",
    aiStaff: "AI Staff",
    conversations: "Conversations",
    leads: "Leads",
    handover: "Handover",
    conversionRate: "Lead Conversion",
    responseMix: "Response Mix",
    analyticsOverview: "Analytics Overview",
    analyticsOverviewText:
      "A simple summary of how your Kolkap workspace is performing.",
    leadPipeline: "Lead Pipeline",
    leadPipelineText:
      "See where your customer opportunities are sitting right now.",
    activityTrend: "7-Day Activity Trend",
    activityTrendText:
      "A quick view of customer conversations and messages from the last 7 days.",
    channelBreakdown: "Channel Breakdown",
    channelBreakdownText:
      "Understand where conversations are coming from.",
    aiPerformance: "AI Staff Performance",
    aiPerformanceText:
      "See which AI staff is connected to conversations and customer activity.",
    latestActivity: "Latest Customer Activity",
    latestActivityText:
      "Recent customer activity from your inbox and lead flow.",
    noActivity: "No customer activity yet.",
    openInbox: "Open Inbox",
    openLeads: "Open Leads",
    createAI: "Create AI",
    goLive: "Go Live",
    totalMessages: "Total Messages",
    customerMessages: "Customer Messages",
    aiReplies: "AI Replies",
    humanReplies: "Human Replies",
    newLead: "New",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    open: "Open",
    live: "Live",
    draft: "Draft",
    testing: "Testing",
    noData: "No data yet",
    insightTitle: "Business Insight",
    insightText:
      "Once customer messages start coming in, this report will help you see which leads need follow-up, which AI staff is active, and where your customer activity is growing.",
    emptyInsight:
      "Your reports are ready. Connect customer channels and start receiving conversations to unlock deeper analytics.",
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
      open: "Open",
      handover: "Handover",
      closed: "Closed",
      new: "New",
      qualified: "Qualified",
      follow_up: "Follow Up",
    },
  },

  id: {
    badge: "Reports",
    title: "Pahami aktivitas pelanggan dalam satu tampilan.",
    subtitle:
      "Pantau percakapan, leads, kebutuhan handover, penggunaan AI, aktivitas pesan, dan performa workspace dalam tampilan analytics yang sederhana.",
    loading: "Memuat reports Anda...",
    failed: "Reports gagal dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Refresh",
    currentPlan: "Paket Saat Ini",
    credits: "Credits",
    aiStaff: "AI Staff",
    conversations: "Percakapan",
    leads: "Leads",
    handover: "Handover",
    conversionRate: "Konversi Lead",
    responseMix: "Campuran Balasan",
    analyticsOverview: "Ringkasan Analytics",
    analyticsOverviewText:
      "Ringkasan sederhana tentang performa workspace Kolkap Anda.",
    leadPipeline: "Pipeline Leads",
    leadPipelineText:
      "Lihat posisi peluang customer Anda saat ini.",
    activityTrend: "Tren Aktivitas 7 Hari",
    activityTrendText:
      "Tampilan cepat percakapan dan pesan customer dalam 7 hari terakhir.",
    channelBreakdown: "Breakdown Channel",
    channelBreakdownText:
      "Pahami dari mana percakapan customer berasal.",
    aiPerformance: "Performa AI Staff",
    aiPerformanceText:
      "Lihat AI staff mana yang terhubung dengan percakapan dan aktivitas customer.",
    latestActivity: "Aktivitas Customer Terbaru",
    latestActivityText:
      "Aktivitas customer terbaru dari inbox dan lead flow Anda.",
    noActivity: "Belum ada aktivitas customer.",
    openInbox: "Buka Inbox",
    openLeads: "Buka Leads",
    createAI: "Create AI",
    goLive: "Go Live",
    totalMessages: "Total Pesan",
    customerMessages: "Pesan Customer",
    aiReplies: "Balasan AI",
    humanReplies: "Balasan Human",
    newLead: "Baru",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    open: "Open",
    live: "Live",
    draft: "Draft",
    testing: "Testing",
    noData: "Belum ada data",
    insightTitle: "Insight Bisnis",
    insightText:
      "Setelah pesan customer mulai masuk, report ini akan membantu melihat leads yang perlu follow-up, AI staff yang aktif, dan pertumbuhan aktivitas customer.",
    emptyInsight:
      "Reports Anda sudah siap. Hubungkan channel customer dan mulai terima percakapan untuk membuka analytics yang lebih dalam.",
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
      open: "Open",
      handover: "Handover",
      closed: "Closed",
      new: "Baru",
      qualified: "Qualified",
      follow_up: "Follow Up",
    },
  },

  zh: {
    badge: "报告",
    title: "一眼了解客户活动。",
    subtitle:
      "用简单的 analytics 页面追踪对话、线索、人工接手、AI 使用、消息活动和工作区表现。",
    loading: "正在加载报告...",
    failed: "报告加载失败。",
    back: "返回仪表板",
    refresh: "刷新",
    currentPlan: "当前方案",
    credits: "Credits",
    aiStaff: "AI 员工",
    conversations: "对话",
    leads: "线索",
    handover: "人工接手",
    conversionRate: "线索转化",
    responseMix: "回复比例",
    analyticsOverview: "Analytics 概览",
    analyticsOverviewText: "清晰查看 Kolkap 工作区的表现。",
    leadPipeline: "线索管道",
    leadPipelineText: "查看客户机会目前所在阶段。",
    activityTrend: "7 天活动趋势",
    activityTrendText: "快速查看过去 7 天的客户对话和消息。",
    channelBreakdown: "渠道分析",
    channelBreakdownText: "了解客户对话来自哪里。",
    aiPerformance: "AI 员工表现",
    aiPerformanceText: "查看哪些 AI 员工连接到客户对话和活动。",
    latestActivity: "最新客户活动",
    latestActivityText: "来自 inbox 和 lead flow 的最新客户活动。",
    noActivity: "暂无客户活动。",
    openInbox: "打开收件箱",
    openLeads: "打开线索",
    createAI: "创建 AI",
    goLive: "上线",
    totalMessages: "总消息",
    customerMessages: "客户消息",
    aiReplies: "AI 回复",
    humanReplies: "人工回复",
    newLead: "新线索",
    qualified: "已筛选",
    followUp: "跟进",
    closed: "已关闭",
    open: "打开",
    live: "Live",
    draft: "草稿",
    testing: "测试中",
    noData: "暂无数据",
    insightTitle: "业务洞察",
    insightText:
      "客户消息进入后，此报告会帮助您看到需要跟进的线索、活跃 AI 员工和客户活动增长。",
    emptyInsight:
      "Reports 已准备好。连接客户渠道并开始接收对话后，将显示更深入的 analytics。",
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
      open: "打开",
      handover: "人工接手",
      closed: "已关闭",
      new: "新线索",
      qualified: "已筛选",
      follow_up: "跟进",
    },
  },

  ms: {
    badge: "Reports",
    title: "Fahami aktiviti pelanggan dalam satu paparan.",
    subtitle:
      "Pantau perbualan, leads, keperluan handover, penggunaan AI, aktiviti mesej, dan prestasi workspace dalam paparan analytics yang mudah.",
    loading: "Memuat reports anda...",
    failed: "Reports gagal dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Refresh",
    currentPlan: "Pakej Semasa",
    credits: "Credits",
    aiStaff: "AI Staff",
    conversations: "Perbualan",
    leads: "Leads",
    handover: "Handover",
    conversionRate: "Konversi Lead",
    responseMix: "Campuran Balasan",
    analyticsOverview: "Ringkasan Analytics",
    analyticsOverviewText:
      "Ringkasan mudah tentang prestasi workspace Kolkap anda.",
    leadPipeline: "Pipeline Leads",
    leadPipelineText:
      "Lihat kedudukan peluang customer anda sekarang.",
    activityTrend: "Trend Aktiviti 7 Hari",
    activityTrendText:
      "Paparan cepat perbualan dan mesej customer dalam 7 hari terakhir.",
    channelBreakdown: "Breakdown Channel",
    channelBreakdownText:
      "Fahami dari mana perbualan customer datang.",
    aiPerformance: "Prestasi AI Staff",
    aiPerformanceText:
      "Lihat AI staff mana yang disambungkan dengan perbualan dan aktiviti customer.",
    latestActivity: "Aktiviti Customer Terbaru",
    latestActivityText:
      "Aktiviti customer terbaru daripada inbox dan lead flow anda.",
    noActivity: "Belum ada aktiviti customer.",
    openInbox: "Buka Inbox",
    openLeads: "Buka Leads",
    createAI: "Create AI",
    goLive: "Go Live",
    totalMessages: "Total Mesej",
    customerMessages: "Mesej Customer",
    aiReplies: "Balasan AI",
    humanReplies: "Balasan Human",
    newLead: "Baru",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    open: "Open",
    live: "Live",
    draft: "Draft",
    testing: "Testing",
    noData: "Belum ada data",
    insightTitle: "Insight Bisnes",
    insightText:
      "Selepas mesej customer mula masuk, report ini akan membantu melihat leads yang perlu follow-up, AI staff yang aktif, dan pertumbuhan aktiviti customer.",
    emptyInsight:
      "Reports anda sudah siap. Sambungkan channel customer dan mula terima perbualan untuk membuka analytics yang lebih mendalam.",
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
      open: "Open",
      handover: "Handover",
      closed: "Closed",
      new: "Baru",
      qualified: "Qualified",
      follow_up: "Follow Up",
    },
  },
};

function statusLabel(statuses: Record<string, string>, value: string | null) {
  if (!value) return "—";
  return statuses[value] || value;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function getDayLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
  });
}

export default function ReportsPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [conversationRows, setConversationRows] = useState<ConversationRow[]>([]);
  const [messageRows, setMessageRows] = useState<MessageRow[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [reportError, setReportError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      if (!workspace) return;

      setIsLoadingReports(true);
      setReportError("");

      const supabase = createClient();

      const [aiResult, conversationsResult, messagesResult] =
        await Promise.all([
          supabase
            .from("ai_staff")
            .select("id,name,role,status")
            .eq("workspace_id", workspace.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("customer_conversations")
            .select("*")
            .eq("workspace_id", workspace.id)
            .order("last_message_at", {
              ascending: false,
              nullsFirst: false,
            })
            .limit(500),
          supabase
            .from("customer_messages")
            .select("id,conversation_id,workspace_id,owner_user_id,ai_staff_id,sender_type,created_at")
            .eq("workspace_id", workspace.id)
            .order("created_at", { ascending: false })
            .limit(1000),
        ]);

      if (!isMounted) return;

      const firstError =
        aiResult.error || conversationsResult.error || messagesResult.error;

      if (firstError) {
        setReportError(firstError.message);
        setIsLoadingReports(false);
        return;
      }

      setAiStaffRows((aiResult.data ?? []) as AiStaffRow[]);
      setConversationRows((conversationsResult.data ?? []) as ConversationRow[]);
      setMessageRows((messagesResult.data ?? []) as MessageRow[]);
      setIsLoadingReports(false);
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [workspace, reloadKey]);

  const analytics = useMemo(() => {
    const totalConversations = conversationRows.length;
    const totalMessages = messageRows.length;
    const customerMessages = messageRows.filter(
      (message) => message.sender_type === "customer"
    ).length;
    const aiReplies = messageRows.filter(
      (message) => message.sender_type === "ai"
    ).length;
    const humanReplies = messageRows.filter(
      (message) => message.sender_type === "human"
    ).length;

    const newLeads = conversationRows.filter(
      (conversation) => conversation.lead_status === "new"
    ).length;
    const qualifiedLeads = conversationRows.filter(
      (conversation) => conversation.lead_status === "qualified"
    ).length;
    const followUpLeads = conversationRows.filter(
      (conversation) => conversation.lead_status === "follow_up"
    ).length;
    const closedLeads = conversationRows.filter(
      (conversation) => conversation.lead_status === "closed"
    ).length;
    const activeLeads = totalConversations - closedLeads;
    const handoverCount = conversationRows.filter(
      (conversation) => conversation.handover_requested
    ).length;

    const conversionRate = getPercent(qualifiedLeads + closedLeads, totalConversations);
    const aiReplyPercent = getPercent(aiReplies, totalMessages);
    const humanReplyPercent = getPercent(humanReplies, totalMessages);

    const today = new Date();
    const trend = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const conversations = conversationRows.filter((conversation) => {
        const createdAt = new Date(conversation.created_at);
        return createdAt >= day && createdAt < nextDay;
      }).length;

      const messages = messageRows.filter((message) => {
        const createdAt = new Date(message.created_at);
        return createdAt >= day && createdAt < nextDay;
      }).length;

      return {
        label: getDayLabel(day),
        conversations,
        messages,
      };
    });

    const maxTrendValue = Math.max(
      1,
      ...trend.map((item) => Math.max(item.conversations, item.messages))
    );

    const channelMap = conversationRows.reduce<Record<string, number>>(
      (map, conversation) => {
        const channel = conversation.customer_channel || "Unknown";
        map[channel] = (map[channel] || 0) + 1;
        return map;
      },
      {}
    );

    const channels = Object.entries(channelMap)
      .map(([channel, count]) => ({
        channel,
        count,
        percent: getPercent(count, totalConversations),
      }))
      .sort((a, b) => b.count - a.count);

    const aiPerformance = aiStaffRows.map((staff) => {
      const conversations = conversationRows.filter(
        (conversation) => conversation.ai_staff_id === staff.id
      ).length;
      const messages = messageRows.filter(
        (message) => message.ai_staff_id === staff.id
      ).length;

      return {
        ...staff,
        conversations,
        messages,
        percent: getPercent(conversations, totalConversations),
      };
    });

    return {
      totalConversations,
      totalMessages,
      customerMessages,
      aiReplies,
      humanReplies,
      newLeads,
      qualifiedLeads,
      followUpLeads,
      closedLeads,
      activeLeads,
      handoverCount,
      conversionRate,
      aiReplyPercent,
      humanReplyPercent,
      trend,
      maxTrendValue,
      channels,
      aiPerformance,
    };
  }, [conversationRows, messageRows, aiStaffRows]);

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
      href: "/dashboard/billing",
    },
    {
      label: t.conversations,
      value: `${analytics.totalConversations}`,
      note: `${analytics.totalMessages} ${t.totalMessages}`,
      icon: Inbox,
      href: "/dashboard/inbox",
    },
    {
      label: t.leads,
      value: `${analytics.activeLeads}`,
      note: `${analytics.qualifiedLeads} ${t.qualified}`,
      icon: UsersRound,
      href: "/dashboard/leads",
    },
    {
      label: t.credits,
      value: `${workspaceState.creditsRemaining}/${workspaceState.creditsTotal}`,
      note: getPlanCreditLabel(currentPlan),
      icon: Zap,
      href: "/dashboard/top-up",
    },
  ];

  const pipelineCards = [
    {
      label: t.newLead,
      value: analytics.newLeads,
      icon: UserRound,
    },
    {
      label: t.qualified,
      value: analytics.qualifiedLeads,
      icon: Target,
    },
    {
      label: t.followUp,
      value: analytics.followUpLeads,
      icon: Clock3,
    },
    {
      label: t.closed,
      value: analytics.closedLeads,
      icon: CheckCircle2,
    },
  ];

  const latestActivity = conversationRows.slice(0, 6);

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
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>

            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
              {t.refresh}
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <BarChart3 className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        {reportError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{reportError}</p>
          </div>
        ) : null}

        {isLoadingReports ? (
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            {t.loading}
          </div>
        ) : (
          <>
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
                    <p className="text-lg font-black text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                      {card.value}
                    </p>
                    <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                      {card.note}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mb-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <LineChart className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    {t.analyticsOverview}
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    {t.analyticsOverviewText}
                  </h2>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <MetricBox
                    label={t.conversionRate}
                    value={`${analytics.conversionRate}%`}
                    note={`${analytics.qualifiedLeads + analytics.closedLeads}/${analytics.totalConversations} ${t.leads}`}
                  />
                  <MetricBox
                    label={t.handover}
                    value={`${analytics.handoverCount}`}
                    note={t.handover}
                  />
                  <MetricBox
                    label={t.responseMix}
                    value={`${analytics.aiReplyPercent}%`}
                    note={`${analytics.aiReplies} ${t.aiReplies}`}
                  />
                  <MetricBox
                    label={t.aiStaff}
                    value={`${aiStaffRows.length}`}
                    note={getPlanAIStaffLabel(currentPlan)}
                  />
                </div>
              </section>

              <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                  <Sparkles className="h-8 w-8" />
                </div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                  {t.insightTitle}
                </p>
                <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                  {analytics.totalConversations > 0 ? t.insightText : t.emptyInsight}
                </h2>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
                    {t.openLeads}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </section>
            </div>

            <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                <div>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    {t.activityTrend}
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    {t.activityTrendText}
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricBox
                    label={t.totalMessages}
                    value={`${analytics.totalMessages}`}
                    note={t.totalMessages}
                  />
                  <MetricBox
                    label={t.customerMessages}
                    value={`${analytics.customerMessages}`}
                    note={t.customerMessages}
                  />
                  <MetricBox
                    label={t.humanReplies}
                    value={`${analytics.humanReplies}`}
                    note={`${analytics.humanReplyPercent}%`}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-7">
                {analytics.trend.map((item) => {
                  const conversationHeight = Math.max(
                    8,
                    getPercent(item.conversations, analytics.maxTrendValue)
                  );
                  const messageHeight = Math.max(
                    8,
                    getPercent(item.messages, analytics.maxTrendValue)
                  );

                  return (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-4"
                    >
                      <div className="flex h-36 items-end justify-center gap-2">
                        <div
                          className="w-5 rounded-full bg-[#07111F]"
                          style={{ height: `${conversationHeight}%` }}
                          title={`${item.conversations} ${t.conversations}`}
                        />
                        <div
                          className="w-5 rounded-full bg-[#7CFF3D]"
                          style={{ height: `${messageHeight}%` }}
                          title={`${item.messages} ${t.totalMessages}`}
                        />
                      </div>
                      <p className="mt-4 text-center text-sm font-black text-slate-600">
                        {item.label}
                      </p>
                      <p className="mt-1 text-center text-xs font-black text-slate-400">
                        {item.conversations}/{item.messages}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mb-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Target className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    {t.leadPipeline}
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    {t.leadPipelineText}
                  </h2>
                </div>

                <div className="grid gap-4">
                  {pipelineCards.map((item) => {
                    const Icon = item.icon;
                    const percent = getPercent(
                      item.value,
                      analytics.totalConversations
                    );

                    return (
                      <div
                        key={item.label}
                        className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                      >
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-lg font-black">{item.label}</p>
                          </div>
                          <p className="text-2xl font-black">{item.value}</p>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-[#07111F]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    {t.channelBreakdown}
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    {t.channelBreakdownText}
                  </h2>
                </div>

                <div className="grid gap-4">
                  {analytics.channels.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black text-slate-600">
                      {t.noData}
                    </div>
                  ) : (
                    analytics.channels.map((item) => (
                      <div
                        key={item.channel}
                        className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                      >
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <p className="text-lg font-black">{item.channel}</p>
                          <p className="text-2xl font-black">{item.count}</p>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-[#07111F]"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Bot className="h-8 w-8" />
                </div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.aiPerformance}
                </p>
                <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
                  {t.aiPerformanceText}
                </h2>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {analytics.aiPerformance.length === 0 ? (
                  <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
                    <p className="text-lg font-black text-slate-600">
                      {t.noData}
                    </p>
                    <Link
                      href="/dashboard/create-ai"
                      className="mt-5 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                    >
                      {t.createAI}
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                ) : (
                  analytics.aiPerformance.map((staff) => (
                    <div
                      key={staff.id}
                      className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
                    >
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                        <Bot className="h-7 w-7" />
                      </div>
                      <h3 className="text-2xl font-black tracking-[-0.04em]">
                        {staff.name}
                      </h3>
                      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                        {staff.role}
                      </p>

                      <div className="mt-5 grid gap-3">
                        <MetricLine
                          label={t.conversations}
                          value={`${staff.conversations}`}
                          percent={staff.percent}
                        />
                        <MetricLine
                          label={t.totalMessages}
                          value={`${staff.messages}`}
                          percent={getPercent(staff.messages, analytics.totalMessages)}
                        />
                      </div>

                      <p className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]">
                        {statusLabel(t.status, staff.status)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                <div>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Clock3 className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    {t.latestActivity}
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    {t.latestActivityText}
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                  <Link
                    href="/dashboard/inbox"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                  >
                    {t.openInbox}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/dashboard/leads"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-base font-black text-[#07111F]"
                  >
                    {t.openLeads}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                {latestActivity.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black text-slate-600">
                    {t.noActivity}
                  </div>
                ) : (
                  latestActivity.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                    >
                      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                        <div>
                          <p className="text-xl font-black">
                            {conversation.customer_name || t.open}
                          </p>
                          <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                            {conversation.last_message || t.noActivity}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
                            {conversation.customer_channel}
                          </span>
                          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
                            {statusLabel(t.status, conversation.lead_status)}
                          </span>
                          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
                            {formatDate(conversation.last_message_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function MetricBox({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black tracking-[-0.06em]">{value}</p>
      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
        {note}
      </p>
    </div>
  );
}

function MetricLine({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <p className="text-sm font-black text-[#07111F]">{value}</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-[#07111F]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}