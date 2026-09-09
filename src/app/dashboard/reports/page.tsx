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
  Inbox,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type AiStaffRow = {
  id: string;
  name: string;
  role: string;
  status: string;
  deleted_at: string | null;
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
  if (value === "knowledge_base") return "Train My AI";
  if (value === "go_live") return "Go Live";
  if (value === "email") return "Email";
  if (value === "api") return "API";
  if (value === "system") return "System";

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

export default function ReportsPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [conversationRows, setConversationRows] = useState<ConversationRow[]>([]);
  const [messageRows, setMessageRows] = useState<MessageRow[]>([]);

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

      const [aiResult, conversationsResult, messagesResult] = await Promise.all([
        supabase
          .from("ai_staff")
          .select("id,name,role,status,deleted_at")
          .eq("workspace_id", workspace.id)
          .in("status", ["active", "live"])
          .is("deleted_at", null)
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

      ]);

      if (!isMounted) return;

      const firstError =
        aiResult.error ||
        conversationsResult.error ||
        messagesResult.error;

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

    const activeLeads = newLeads + qualifiedLeads + followUpLeads;

    const handoverCount = conversationRows.filter(
      (conversation) =>
        conversation.handover_requested &&
        conversation.status !== "closed" &&
        conversation.lead_status !== "closed"
    ).length;

    const conversionRate = getPercent(
      qualifiedLeads + closedLeads,
      totalConversations
    );

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
      newLeads,
      qualifiedLeads,
      followUpLeads,
      closedLeads,
      activeLeads,
      handoverCount,
      conversionRate,
      trend,
      maxTrendValue,
      channels,
      aiPerformance,
    };
  }, [conversationRows, messageRows, aiStaffRows]);

  const latestActivity = conversationRows.slice(0, 5);

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
            See how your customer conversations are going.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Check customer conversations, leads, AI replies, and messages that
            need your attention.
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
                icon={<Inbox className="h-7 w-7" />}
                label="Conversations"
                value={`${analytics.totalConversations}`}
                note={`${analytics.customerMessages} customer messages`}
                href="/dashboard/inbox"
              />

              <SummaryCard
                icon={<UsersRound className="h-7 w-7" />}
                label="Leads"
                value={`${analytics.activeLeads}`}
                note={`${analytics.qualifiedLeads} qualified · ${analytics.followUpLeads} follow-up`}
                href="/dashboard/leads"
              />

              <SummaryCard
                icon={<Bot className="h-7 w-7" />}
                label="AI Replies"
                value={`${analytics.aiReplies}`}
                note="Replies sent by your AI staff"
                href="/dashboard/inbox"
              />

              <SummaryCard
                icon={<ShieldCheck className="h-7 w-7" />}
                label="Needs Human Help"
                value={`${analytics.handoverCount}`}
                note={
                  analytics.handoverCount === 1
                    ? "1 conversation awaiting your team"
                    : `${analytics.handoverCount} conversations awaiting your team`
                }
                href="/dashboard/inbox"
              />
            </div>

            <div className="mb-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <TrendingUp className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Last 7 Days
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    Customer activity this week.
                  </h2>
                  <div className="mt-5 flex flex-wrap gap-5 text-sm font-black text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#07111F]" />
                      Conversations
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#7CFF3D]" />
                      Messages
                    </span>
                  </div>
                </div>

              <div className="grid gap-4 sm:grid-cols-7">
                {analytics.trend.map((item) => (
                  <TrendCard
                    key={item.label}
                    label={item.label}
                    conversations={item.conversations}
                    messages={item.messages}
                    maxValue={analytics.maxTrendValue}
                  />
                ))}
              </div>
              </section>

              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <MessageCircle className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Customer Channels
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    Where conversations started.
                  </h2>
                </div>

                <div className="grid gap-4">
                  {analytics.channels.length === 0 ? (
                    <EmptySmall text="No customer conversations yet." />
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

            <div className="mb-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-7">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Target className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Lead Progress
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    See which customers need follow-up.
                  </h2>
                </div>

                <div className="grid gap-4">
                  <MetricBox
                    label="Qualified or Closed"
                    value={`${analytics.conversionRate}%`}
                    note={`${analytics.qualifiedLeads + analytics.closedLeads} of ${analytics.totalConversations} conversations`}
                  />

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
                    <Bot className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    AI Staff Performance
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    See how your active AI staff is helping.
                  </h2>
                </div>

                <div className="grid gap-5">
                  {analytics.aiPerformance.length === 0 ? (
                    <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
                      <p className="text-lg font-black text-slate-700">
                        No active AI staff yet.
                      </p>
                      <p className="mt-2 font-semibold leading-7 text-slate-600">
                        Draft and testing AI staff are not included in customer reports.
                      </p>

                      <Link
                        href="/dashboard/create-ai"
                        className="mt-5 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                      >
                        View AI Staff
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
            </div>

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
  maxValue,
}: {
  label: string;
  conversations: number;
  messages: number;
  maxValue: number;
}) {
  const conversationHeight = Math.max(8, getPercent(conversations, maxValue));
  const messageHeight = Math.max(8, getPercent(messages, maxValue));

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
      </div>

      <p className="mt-4 text-center text-sm font-black text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-center text-xs font-black text-slate-400">
        {conversations} conversations · {messages} messages
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
