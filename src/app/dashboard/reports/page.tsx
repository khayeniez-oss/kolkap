"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe2,
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
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
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

type UsageEventRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  user_id: string | null;
  event_type: string;
  channel: string;
  source_page: string;
  credits_used: number;
  event_count: number;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
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

function formatValue(value: unknown) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Open";
  if (value === "open") return "Open";
  if (value === "handover") return "Handover";
  if (value === "closed") return "Closed";
  if (value === "new") return "New";
  if (value === "qualified") return "Qualified";
  if (value === "follow_up") return "Follow Up";
  if (value === "completed") return "Completed";
  if (value === "draft") return "Draft";
  if (value === "testing") return "Testing";
  if (value === "live") return "Live";
  if (value === "success") return "Success";
  if (value === "failed") return "Failed";
  if (value === "pending") return "Pending";

  return formatValue(value);
}

function channelLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value === "website_chat") return "Website Chat";
  if (value === "whatsapp") return "WhatsApp";
  if (value === "inbox") return "Inbox";
  if (value === "test_ai") return "Test AI";
  if (value === "content_studio") return "Content Studio";
  if (value === "knowledge_base") return "Knowledge Base";
  if (value === "go_live") return "Go Live";
  if (value === "email") return "Email";
  if (value === "api") return "API";
  if (value === "system") return "System";

  return formatValue(value);
}

function eventLabel(value: string | null | undefined) {
  if (!value) return "Unknown Event";
  if (value === "test_ai_generated") return "Test AI Generated";
  if (value === "ai_reply_generated") return "Inbox AI Suggestion Generated";
  if (value === "website_chat_message_received") return "Website Chat Message Received";
  if (value === "website_chat_ai_reply_generated") return "Website Chat AI Reply Generated";
  if (value === "website_chat_auto_reply_skipped") return "Website Chat Auto-Reply Skipped";
  if (value === "customer_message_received") return "Customer Message Received";
  if (value === "ai_reply_sent") return "AI Reply Sent";
  if (value === "human_reply_sent") return "Human Reply Sent";
  if (value === "whatsapp_message_received") return "WhatsApp Message Received";
  if (value === "whatsapp_message_sent") return "WhatsApp Message Sent";
  if (value === "content_generated") return "Content Generated";
  if (value === "content_saved") return "Content Saved";
  if (value === "knowledge_created") return "Knowledge Created";
  if (value === "knowledge_updated") return "Knowledge Updated";
  if (value === "ai_staff_created") return "AI Staff Created";
  if (value === "team_invite_sent") return "Team Invite Sent";
  if (value === "go_live_enabled") return "Go Live Enabled";
  if (value === "go_live_disabled") return "Go Live Disabled";

  return formatValue(value);
}

function normalizeSenderType(value: string | null | undefined) {
  const normalized = String(value || "").toLowerCase().trim();

  if (
    normalized === "customer" ||
    normalized === "user" ||
    normalized === "client" ||
    normalized === "visitor"
  ) {
    return "customer";
  }

  if (normalized === "ai" || normalized === "assistant" || normalized === "bot") {
    return "ai";
  }

  return "human";
}

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function getDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
  }).format(date);
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

function getAiStaffLimitLabel(plan: ReturnType<typeof getKolkapPlan>) {
  if (plan.aiStaffLimit === "custom") {
    return "Custom AI staff limit";
  }

  return `${plan.aiStaffLimit} AI staff included`;
}

function sumUsageByKey(rows: UsageEventRow[], key: "channel" | "event_type") {
  const result = new Map<string, { count: number; credits: number }>();

  rows.forEach((row) => {
    const current = result.get(row[key]) || { count: 0, credits: 0 };

    result.set(row[key], {
      count: current.count + Number(row.event_count || 1),
      credits: current.credits + Number(row.credits_used || 0),
    });
  });

  return Array.from(result.entries())
    .map(([name, value]) => ({
      name,
      count: value.count,
      credits: value.credits,
    }))
    .sort((a, b) => b.credits - a.credits || b.count - a.count)
    .slice(0, 8);
}

export default function ReportsPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [conversationRows, setConversationRows] = useState<ConversationRow[]>([]);
  const [messageRows, setMessageRows] = useState<MessageRow[]>([]);
  const [usageRows, setUsageRows] = useState<UsageEventRow[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );

  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [reportError, setReportError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      if (!workspace?.id) return;

      setIsLoadingReports(true);
      setReportError("");

      const supabase = createClient();

      const [
        aiResult,
        conversationsResult,
        messagesResult,
        usageResult,
        creditResult,
      ] = await Promise.all([
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
          .select(
            "id,conversation_id,workspace_id,owner_user_id,ai_staff_id,sender_type,message_text,created_at"
          )
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false })
          .limit(1000),

        supabase
          .from("workspace_usage_events")
          .select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false })
          .limit(500),

        supabase
          .from("workspace_credit_balances")
          .select("*")
          .eq("workspace_id", workspace.id)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      const firstError =
        aiResult.error ||
        conversationsResult.error ||
        messagesResult.error ||
        usageResult.error ||
        creditResult.error;

      if (firstError) {
        setReportError(firstError.message);
        setIsLoadingReports(false);
        return;
      }

      setAiStaffRows((aiResult.data ?? []) as AiStaffRow[]);
      setConversationRows((conversationsResult.data ?? []) as ConversationRow[]);
      setMessageRows((messagesResult.data ?? []) as MessageRow[]);
      setUsageRows((usageResult.data ?? []) as UsageEventRow[]);
      setCreditBalance((creditResult.data ?? null) as CreditBalanceRow | null);
      setIsLoadingReports(false);
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [workspace?.id, reloadKey]);

  const analytics = useMemo(() => {
    const totalConversations = conversationRows.length;
    const totalMessages = messageRows.length;

    const customerMessages = messageRows.filter(
      (message) => normalizeSenderType(message.sender_type) === "customer"
    ).length;

    const aiReplies = messageRows.filter(
      (message) => normalizeSenderType(message.sender_type) === "ai"
    ).length;

    const humanReplies = messageRows.filter(
      (message) => normalizeSenderType(message.sender_type) === "human"
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

    const activeLeads = Math.max(0, totalConversations - closedLeads);

    const handoverCount = conversationRows.filter(
      (conversation) => conversation.handover_requested
    ).length;

    const websiteChatConversations = conversationRows.filter(
      (conversation) => conversation.customer_channel === "website_chat"
    ).length;

    const whatsappConversations = conversationRows.filter(
      (conversation) => conversation.customer_channel === "whatsapp"
    ).length;

    const totalCreditsUsed = usageRows.reduce(
      (sum, event) => sum + Number(event.credits_used || 0),
      0
    );

    const testAiRuns = usageRows
      .filter((event) => event.event_type === "test_ai_generated")
      .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

    const inboxAiSuggestions = usageRows
      .filter((event) => event.event_type === "ai_reply_generated")
      .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

    const websiteChatMessages = usageRows
      .filter((event) => event.event_type === "website_chat_message_received")
      .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

    const websiteChatAiReplies = usageRows
      .filter((event) => event.event_type === "website_chat_ai_reply_generated")
      .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

    const skippedAutoReplies = usageRows
      .filter((event) => event.event_type === "website_chat_auto_reply_skipped")
      .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

    const aiActions = usageRows
      .filter((event) =>
        [
          "ai_reply_generated",
          "website_chat_ai_reply_generated",
          "content_generated",
          "test_ai_generated",
        ].includes(event.event_type)
      )
      .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

    const conversionRate = getPercent(
      qualifiedLeads + closedLeads,
      totalConversations
    );

    const aiReplyPercent = getPercent(aiReplies, totalMessages);
    const humanReplyPercent = getPercent(humanReplies, totalMessages);
    const handoverRate = getPercent(handoverCount, totalConversations);

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

      const credits = usageRows
        .filter((event) => {
          const createdAt = new Date(event.created_at);
          return createdAt >= day && createdAt < nextDay;
        })
        .reduce((sum, event) => sum + Number(event.credits_used || 0), 0);

      return {
        label: getDayLabel(day),
        conversations,
        messages,
        credits,
      };
    });

    const maxTrendValue = Math.max(
      1,
      ...trend.map((item) =>
        Math.max(item.conversations, item.messages, item.credits)
      )
    );

    const channelMap = conversationRows.reduce<Record<string, number>>(
      (map, conversation) => {
        const channel = conversation.customer_channel || "unknown";
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

      const aiMessages = messageRows.filter(
        (message) =>
          message.ai_staff_id === staff.id &&
          normalizeSenderType(message.sender_type) === "ai"
      ).length;

      return {
        ...staff,
        conversations,
        messages,
        aiMessages,
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
      handoverRate,
      websiteChatConversations,
      whatsappConversations,
      totalCreditsUsed,
      testAiRuns,
      inboxAiSuggestions,
      websiteChatMessages,
      websiteChatAiReplies,
      skippedAutoReplies,
      aiActions,
      conversionRate,
      aiReplyPercent,
      humanReplyPercent,
      trend,
      maxTrendValue,
      channels,
      aiPerformance,
    };
  }, [conversationRows, messageRows, usageRows, aiStaffRows]);

  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const usedCredits = Number(
    creditBalance?.used_credits ?? analytics.totalCreditsUsed
  );
  const creditsLeft = getCreditsLeft(creditBalance);

  const channelUsageBreakdown = useMemo(
    () => sumUsageByKey(usageRows, "channel"),
    [usageRows]
  );

  const eventUsageBreakdown = useMemo(
    () => sumUsageByKey(usageRows, "event_type"),
    [usageRows]
  );

  const latestActivity = conversationRows.slice(0, 6);

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading reports...
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
            <p className="text-xl font-black">Reports could not load.</p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
              Refresh
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <BarChart3 className="h-5 w-5" />
            Reports
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Understand customer activity and AI performance.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Track conversations, leads, handover needs, Website Chat activity,
            AI suggestions, auto-replies, credits used, and recent workspace
            performance.
          </p>
        </div>

        {reportError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{reportError}</p>
          </div>
        ) : null}

        {isLoadingReports ? (
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading reports...
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={<WalletCards className="h-7 w-7" />}
                label="Current Plan"
                value={currentPlan.name}
                note={currentPlan.priceLabel}
                href="/dashboard/billing"
              />

              <SummaryCard
                icon={<CreditCard className="h-7 w-7" />}
                label="Credits Left"
                value={creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
                note={`${usedCredits.toLocaleString()} used • ${planCredits + purchasedCredits} total`}
                href="/dashboard/usage"
                dark
              />

              <SummaryCard
                icon={<Inbox className="h-7 w-7" />}
                label="Conversations"
                value={`${analytics.totalConversations}`}
                note={`${analytics.totalMessages} total messages`}
                href="/dashboard/inbox"
              />

              <SummaryCard
                icon={<UsersRound className="h-7 w-7" />}
                label="Active Leads"
                value={`${analytics.activeLeads}`}
                note={`${analytics.qualifiedLeads} qualified`}
                href="/dashboard/leads"
              />

              <SummaryCard
                icon={<Globe2 className="h-7 w-7" />}
                label="Website Chat"
                value={`${analytics.websiteChatConversations}`}
                note={`${analytics.websiteChatAiReplies} AI replies generated`}
                href="/dashboard/integrations/website-chat"
              />

              <SummaryCard
                icon={<Bot className="h-7 w-7" />}
                label="AI Actions"
                value={`${analytics.aiActions}`}
                note={`${analytics.testAiRuns} tests • ${analytics.inboxAiSuggestions} inbox suggestions`}
                href="/dashboard/usage"
              />

              <SummaryCard
                icon={<ShieldCheck className="h-7 w-7" />}
                label="Handover"
                value={`${analytics.handoverCount}`}
                note={`${analytics.handoverRate}% of conversations`}
                href="/dashboard/leads"
              />

              <SummaryCard
                icon={<MessageCircle className="h-7 w-7" />}
                label="Skipped Auto-Replies"
                value={`${analytics.skippedAutoReplies}`}
                note="Usually caused by inactive chat, no AI staff, or auto-reply off"
                href="/dashboard/usage"
              />
            </div>

            <div className="mb-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <LineChart className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Analytics Overview
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    A simple view of how your workspace is performing.
                  </h2>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <MetricBox
                    label="Lead Conversion"
                    value={`${analytics.conversionRate}%`}
                    note={`${analytics.qualifiedLeads + analytics.closedLeads}/${analytics.totalConversations} leads qualified or closed`}
                  />

                  <MetricBox
                    label="AI Reply Mix"
                    value={`${analytics.aiReplyPercent}%`}
                    note={`${analytics.aiReplies} AI replies saved in conversations`}
                  />

                  <MetricBox
                    label="Human Reply Mix"
                    value={`${analytics.humanReplyPercent}%`}
                    note={`${analytics.humanReplies} saved team replies`}
                  />

                  <MetricBox
                    label="Credits Used"
                    value={`${usedCredits.toLocaleString()}`}
                    note="Tracked deducted credits"
                  />
                </div>
              </section>

              <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                  <Sparkles className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                  Business Insight
                </p>

                <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                  {analytics.totalConversations > 0
                    ? "Use this report to see where customers are coming from, which leads need follow-up, where AI is helping, and whether handover is increasing."
                    : "Reports are ready. Connect Website Chat or WhatsApp and start receiving customer conversations to unlock deeper analytics."}
                </h2>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/dashboard/inbox"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-base font-black text-[#07111F]"
                  >
                    Open Inbox
                    <ArrowRight className="h-5 w-5" />
                  </Link>

                  <Link
                    href="/dashboard/leads"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white"
                  >
                    Open Leads
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
                    7-Day Activity Trend
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    Conversations, messages, and credits used.
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricBox
                    label="Total Messages"
                    value={`${analytics.totalMessages}`}
                    note="All saved customer, AI, and team messages"
                  />

                  <MetricBox
                    label="Customer Messages"
                    value={`${analytics.customerMessages}`}
                    note="Incoming customer messages"
                  />

                  <MetricBox
                    label="Website Chat Messages"
                    value={`${analytics.websiteChatMessages}`}
                    note="Tracked website chat messages"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-7">
                {analytics.trend.map((item) => (
                  <TrendCard
                    key={item.label}
                    label={item.label}
                    conversations={item.conversations}
                    messages={item.messages}
                    credits={item.credits}
                    maxValue={analytics.maxTrendValue}
                  />
                ))}
              </div>
            </section>

            <div className="mb-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Target className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Lead Pipeline
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    See where customer opportunities are sitting.
                  </h2>
                </div>

                <div className="grid gap-4">
                  <PipelineRow
                    label="New"
                    value={analytics.newLeads}
                    total={analytics.totalConversations}
                    icon={<UserRound className="h-5 w-5" />}
                  />

                  <PipelineRow
                    label="Qualified"
                    value={analytics.qualifiedLeads}
                    total={analytics.totalConversations}
                    icon={<Target className="h-5 w-5" />}
                  />

                  <PipelineRow
                    label="Follow Up"
                    value={analytics.followUpLeads}
                    total={analytics.totalConversations}
                    icon={<Clock3 className="h-5 w-5" />}
                  />

                  <PipelineRow
                    label="Closed"
                    value={analytics.closedLeads}
                    total={analytics.totalConversations}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                  />
                </div>
              </section>

              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <MessageCircle className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Conversation Channels
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    Understand where conversations are coming from.
                  </h2>
                </div>

                <div className="grid gap-4">
                  {analytics.channels.length === 0 ? (
                    <EmptySmall text="No channel data yet." />
                  ) : (
                    analytics.channels.map((item) => (
                      <MetricLine
                        key={item.channel}
                        label={channelLabel(item.channel)}
                        value={`${item.count}`}
                        percent={item.percent}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="mb-8 grid gap-8 xl:grid-cols-2">
              <UsageBreakdownCard
                title="Credit Usage by Channel"
                rows={channelUsageBreakdown}
                labelFormatter={channelLabel}
                noDataText="No usage by channel yet."
              />

              <UsageBreakdownCard
                title="Credit Usage by Action"
                rows={eventUsageBreakdown}
                labelFormatter={eventLabel}
                noDataText="No usage by action yet."
              />
            </div>

            <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Bot className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  AI Staff Performance
                </p>

                <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
                  See which AI staff is connected to conversations and messages.
                </h2>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {analytics.aiPerformance.length === 0 ? (
                  <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
                    <p className="text-lg font-black text-slate-600">
                      No AI staff data yet.
                    </p>

                    <Link
                      href="/dashboard/create-ai"
                      className="mt-5 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                    >
                      Create AI Staff
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                ) : (
                  analytics.aiPerformance.map((staff) => (
                    <AiStaffCard
                      key={staff.id}
                      staff={staff}
                      totalMessages={analytics.totalMessages}
                    />
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
                    Latest Customer Activity
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    Recent activity from Inbox and Leads.
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                  <Link
                    href="/dashboard/inbox"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                  >
                    Open Inbox
                    <ArrowRight className="h-5 w-5" />
                  </Link>

                  <Link
                    href="/dashboard/leads"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-base font-black text-[#07111F]"
                  >
                    Open Leads
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                {latestActivity.length === 0 ? (
                  <EmptySmall text="No customer activity yet." />
                ) : (
                  latestActivity.map((conversation) => (
                    <LatestActivityCard
                      key={conversation.id}
                      conversation={conversation}
                    />
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

function SummaryCard({
  icon,
  label,
  value,
  note,
  href,
  dark = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  href: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
        dark
          ? "border-[#7CFF3D] bg-[#07111F] text-white"
          : "border-slate-200 bg-white text-[#07111F]"
      }`}
    >
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
          dark ? "bg-[#7CFF3D] text-[#07111F]" : "bg-[#07111F] text-[#7CFF3D]"
        }`}
      >
        {icon}
      </div>

      <p className={`text-lg font-black ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </p>

      <p className="mt-2 text-3xl font-black tracking-[-0.04em]">{value}</p>

      <p
        className={`mt-2 text-base font-semibold leading-7 ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {note}
      </p>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">
        Open Page
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
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

function TrendCard({
  label,
  conversations,
  messages,
  credits,
  maxValue,
}: {
  label: string;
  conversations: number;
  messages: number;
  credits: number;
  maxValue: number;
}) {
  const conversationHeight = Math.max(8, getPercent(conversations, maxValue));
  const messageHeight = Math.max(8, getPercent(messages, maxValue));
  const creditHeight = Math.max(8, getPercent(credits, maxValue));

  return (
    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-4">
      <div className="flex h-40 items-end justify-center gap-2">
        <div
          className="w-4 rounded-full bg-[#07111F]"
          style={{ height: `${conversationHeight}%` }}
          title={`${conversations} conversations`}
        />
        <div
          className="w-4 rounded-full bg-[#7CFF3D]"
          style={{ height: `${messageHeight}%` }}
          title={`${messages} messages`}
        />
        <div
          className="w-4 rounded-full bg-slate-300"
          style={{ height: `${creditHeight}%` }}
          title={`${credits} credits`}
        />
      </div>

      <p className="mt-4 text-center text-sm font-black text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-center text-xs font-black text-slate-400">
        {conversations} conv • {messages} msg • {credits} cr
      </p>
    </div>
  );
}

function PipelineRow({
  label,
  value,
  total,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  icon: ReactNode;
}) {
  const percent = getPercent(value, total);

  return (
    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#07111F]">
            {icon}
          </div>

          <p className="text-lg font-black">{label}</p>
        </div>

        <p className="text-2xl font-black">{value}</p>
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

      <div className="h-3 overflow-hidden rounded-full bg-[#F7F9FA]">
        <div
          className="h-full rounded-full bg-[#07111F]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function UsageBreakdownCard({
  title,
  rows,
  labelFormatter,
  noDataText,
}: {
  title: string;
  rows: { name: string; count: number; credits: number }[];
  labelFormatter: (value: string) => string;
  noDataText: string;
}) {
  const max = rows.length
    ? Math.max(...rows.map((row) => Math.max(row.credits, row.count)), 1)
    : 1;

  return (
    <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        <BarChart3 className="h-8 w-8" />
      </div>

      <h2 className="text-3xl font-black tracking-[-0.04em]">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
          {noDataText}
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {rows.map((row) => {
            const score = Math.max(row.credits, row.count);

            return (
              <div key={row.name} className="grid gap-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base font-black text-[#07111F]">
                    {labelFormatter(row.name)}
                  </p>

                  <p className="text-base font-black text-slate-500">
                    {row.credits} credits • {row.count} event(s)
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[#F7F9FA]">
                  <div
                    className="h-full rounded-full bg-[#7CFF3D]"
                    style={{
                      width: `${Math.max(8, (score / max) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AiStaffCard({
  staff,
  totalMessages,
}: {
  staff: AiStaffRow & {
    conversations: number;
    messages: number;
    aiMessages: number;
    percent: number;
  };
  totalMessages: number;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
        <Bot className="h-7 w-7" />
      </div>

      <h3 className="text-2xl font-black tracking-[-0.04em]">{staff.name}</h3>

      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
        {staff.role}
      </p>

      <div className="mt-5 grid gap-3">
        <MetricLine
          label="Conversations"
          value={`${staff.conversations}`}
          percent={staff.percent}
        />

        <MetricLine
          label="Messages"
          value={`${staff.messages}`}
          percent={getPercent(staff.messages, totalMessages)}
        />

        <MetricLine
          label="AI Replies"
          value={`${staff.aiMessages}`}
          percent={getPercent(staff.aiMessages, totalMessages)}
        />
      </div>

      <p className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]">
        {statusLabel(staff.status)}
      </p>
    </div>
  );
}

function LatestActivityCard({
  conversation,
}: {
  conversation: ConversationRow;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xl font-black">
            {conversation.customer_name || "Customer"}
          </p>

          <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
            {conversation.last_message || "No message preview yet."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
            {channelLabel(conversation.customer_channel)}
          </span>

          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
            {statusLabel(conversation.lead_status)}
          </span>

          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
            {formatDate(conversation.last_message_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptySmall({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black text-slate-600">
      {text}
    </div>
  );
}