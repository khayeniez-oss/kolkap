"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  MessageCircle,
  RefreshCcw,
  Search,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

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

type Option = {
  value: string;
  label: string;
};

const channelOptions: Option[] = [
  { value: "all", label: "All Channels" },
  { value: "dashboard", label: "Dashboard" },
  { value: "inbox", label: "Inbox" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website_chat", label: "Website Chat" },
  { value: "content_studio", label: "Content Studio" },
  { value: "test_ai", label: "Test AI" },
  { value: "knowledge_base", label: "Knowledge Base" },
  { value: "team", label: "Team" },
  { value: "go_live", label: "Go Live" },
  { value: "email", label: "Email" },
  { value: "api", label: "API" },
  { value: "system", label: "System" },
];

const eventTypeOptions: Option[] = [
  { value: "all", label: "All Events" },
  { value: "customer_message_received", label: "Customer Message Received" },
  { value: "ai_reply_generated", label: "AI Reply Generated" },
  { value: "ai_reply_sent", label: "AI Reply Sent" },
  { value: "human_reply_sent", label: "Human Reply Sent" },
  { value: "whatsapp_message_received", label: "WhatsApp Message Received" },
  { value: "whatsapp_message_sent", label: "WhatsApp Message Sent" },
  { value: "website_chat_message_received", label: "Website Chat Message" },
  { value: "content_generated", label: "Content Generated" },
  { value: "content_saved", label: "Content Saved" },
  { value: "test_ai_generated", label: "Test AI Generated" },
  { value: "team_invite_sent", label: "Team Invite Sent" },
  { value: "knowledge_created", label: "Knowledge Created" },
  { value: "knowledge_updated", label: "Knowledge Updated" },
  { value: "ai_staff_created", label: "AI Staff Created" },
  { value: "go_live_enabled", label: "Go Live Enabled" },
  { value: "go_live_disabled", label: "Go Live Disabled" },
  { value: "email_sent", label: "Email Sent" },
  { value: "system_event", label: "System Event" },
];

const translations = {
  en: {
    loading: "Loading usage...",
    failed: "Usage page could not load.",
    back: "Back to Dashboard",
    refresh: "Refresh",
    badge: "Usage",
    title: "Track your workspace activity and credits.",
    subtitle:
      "See credits left, credits used, AI replies, content generations, inbox actions, messages, and workspace activity.",
    currentPlan: "Current Plan",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    planCredits: "Plan Credits",
    purchasedCredits: "Top-Up Credits",
    totalActivity: "Total Activity",
    aiActions: "AI Actions",
    messageActions: "Messages",
    today: "Today",
    overviewTitle: "Usage Overview",
    overviewText:
      "Every successful AI action creates a usage event. Supabase automatically deducts the credit, then this page shows the updated balance.",
    search: "Search",
    searchPlaceholder: "Search usage history...",
    channel: "Channel",
    eventType: "Event Type",
    historyTitle: "Usage History",
    historyText:
      "This shows recent activity from Content Studio, Test AI, Inbox, WhatsApp, website chat, team, and other connected tools.",
    noUsage: "No usage recorded yet.",
    noUsageText:
      "Usage will appear after you generate content, test AI, generate inbox replies, send messages, or connect WhatsApp.",
    topChannels: "Usage by Channel",
    topEvents: "Usage by Action",
    status: "Status",
    credits: "Credits",
    count: "Count",
    date: "Date",
    success: "Success",
    failedStatus: "Failed",
    pending: "Pending",
    shown: "shown",
    noExtraDetails: "No extra details.",
    knowledgeUsed: "Knowledge used",
    contentType: "Content type",
    purpose: "Purpose",
    platform: "Platform",
    businessAction: "Business action",
    recentActivity: "Recent activity",
    trackedCredits: "Tracked credit usage",
    includedInPlan: "Included in monthly plan",
    extraCredits: "Purchased extra credits",
    aiGenerations: "AI generations and replies",
    messageVolume: "Messages and replies",
    billingPeriod: "Billing period",
    noCreditBalance:
      "Credit balance has not been created for this workspace yet.",
  },

  id: {
    loading: "Memuat usage...",
    failed: "Usage page gagal dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Refresh",
    badge: "Usage",
    title: "Pantau aktivitas dan credits workspace Anda.",
    subtitle:
      "Lihat credits left, credits used, AI replies, content generation, inbox action, message, dan aktivitas workspace.",
    currentPlan: "Paket Saat Ini",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    planCredits: "Plan Credits",
    purchasedCredits: "Top-Up Credits",
    totalActivity: "Total Activity",
    aiActions: "AI Actions",
    messageActions: "Messages",
    today: "Today",
    overviewTitle: "Usage Overview",
    overviewText:
      "Setiap AI action yang berhasil akan membuat usage event. Supabase otomatis deduct credit, lalu halaman ini menampilkan balance terbaru.",
    search: "Search",
    searchPlaceholder: "Cari usage history...",
    channel: "Channel",
    eventType: "Event Type",
    historyTitle: "Usage History",
    historyText:
      "Ini menampilkan aktivitas terbaru dari Content Studio, Test AI, Inbox, WhatsApp, website chat, team, dan tools lain yang terhubung.",
    noUsage: "Belum ada usage.",
    noUsageText:
      "Usage akan muncul setelah Anda generate content, test AI, generate inbox replies, kirim message, atau connect WhatsApp.",
    topChannels: "Usage by Channel",
    topEvents: "Usage by Action",
    status: "Status",
    credits: "Credits",
    count: "Count",
    date: "Date",
    success: "Success",
    failedStatus: "Failed",
    pending: "Pending",
    shown: "shown",
    noExtraDetails: "Tidak ada detail tambahan.",
    knowledgeUsed: "Knowledge used",
    contentType: "Content type",
    purpose: "Purpose",
    platform: "Platform",
    businessAction: "Business action",
    recentActivity: "Recent activity",
    trackedCredits: "Tracked credit usage",
    includedInPlan: "Included in monthly plan",
    extraCredits: "Purchased extra credits",
    aiGenerations: "AI generations and replies",
    messageVolume: "Messages and replies",
    billingPeriod: "Billing period",
    noCreditBalance:
      "Credit balance belum dibuat untuk workspace ini.",
  },
};

function getOptionLabel(options: Option[], value: string) {
  return options.find((item) => item.value === value)?.label || value;
}

function getEventLabel(value: string) {
  return getOptionLabel(eventTypeOptions, value);
}

function getChannelLabel(value: string) {
  return getOptionLabel(channelOptions, value);
}

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString();
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function statusLabel(
  value: string,
  t: typeof translations.en | typeof translations.id
) {
  if (value === "success") return t.success;
  if (value === "failed") return t.failedStatus;
  if (value === "pending") return t.pending;
  return value;
}

function sumByKey(rows: UsageEventRow[], key: "channel" | "event_type") {
  const result = new Map<string, number>();

  rows.forEach((row) => {
    const current = result.get(row[key]) || 0;
    result.set(row[key], current + (row.event_count || 1));
  });

  return Array.from(result.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function formatValue(value: unknown) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFriendlyMetadata(
  metadata: Record<string, unknown> | null,
  t: typeof translations.en | typeof translations.id
) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return [];
  }

  const details: { label: string; value: string }[] = [];

  if (
    metadata.knowledge_count !== undefined &&
    metadata.knowledge_count !== null
  ) {
    details.push({
      label: t.knowledgeUsed,
      value: String(metadata.knowledge_count),
    });
  }

  if (metadata.content_type) {
    details.push({
      label: t.contentType,
      value: formatValue(metadata.content_type),
    });
  }

  if (metadata.content_purpose) {
    details.push({
      label: t.purpose,
      value: formatValue(metadata.content_purpose),
    });
  }

  if (metadata.platform) {
    details.push({
      label: t.platform,
      value: formatValue(metadata.platform),
    });
  }

  return details;
}

function getActivitySentence(event: UsageEventRow) {
  return `${getEventLabel(event.event_type)} in ${getChannelLabel(
    event.channel
  )}`;
}

export default function UsagePage() {
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [usageEvents, setUsageEvents] = useState<UsageEventRow[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedEventType, setSelectedEventType] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadUsage() {
      if (!workspace) return;

      setIsLoading(true);
      setPageError("");

      const supabase = createClient();

      const [usageResponse, creditResponse] = await Promise.all([
        supabase
          .from("workspace_usage_events")
          .select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false })
          .limit(300),

        supabase
          .from("workspace_credit_balances")
          .select("*")
          .eq("workspace_id", workspace.id)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      if (usageResponse.error) {
        setPageError(usageResponse.error.message);
        setIsLoading(false);
        return;
      }

      if (creditResponse.error) {
        setPageError(creditResponse.error.message);
        setIsLoading(false);
        return;
      }

      setUsageEvents((usageResponse.data ?? []) as UsageEventRow[]);
      setCreditBalance((creditResponse.data ?? null) as CreditBalanceRow | null);
      setIsLoading(false);
    }

    loadUsage();

    return () => {
      isMounted = false;
    };
  }, [workspace, reloadKey]);

  const filteredEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return usageEvents.filter((event) => {
      const eventLabel = getEventLabel(event.event_type).toLowerCase();
      const channelLabel = getChannelLabel(event.channel).toLowerCase();

      const friendlyMetadata = getFriendlyMetadata(event.metadata, t)
        .map((item) => `${item.label} ${item.value}`)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        eventLabel.includes(search) ||
        channelLabel.includes(search) ||
        event.status.toLowerCase().includes(search) ||
        friendlyMetadata.includes(search);

      const matchesChannel =
        selectedChannel === "all" || event.channel === selectedChannel;

      const matchesEventType =
        selectedEventType === "all" || event.event_type === selectedEventType;

      return matchesSearch && matchesChannel && matchesEventType;
    });
  }, [usageEvents, searchTerm, selectedChannel, selectedEventType, t]);

  const totalEvents = usageEvents.reduce(
    (sum, event) => sum + (event.event_count || 1),
    0
  );

  const todayEvents = usageEvents
    .filter((event) => isToday(event.created_at))
    .reduce((sum, event) => sum + (event.event_count || 1), 0);

  const totalCreditsUsedFromEvents = usageEvents.reduce(
    (sum, event) => sum + (event.credits_used || 0),
    0
  );

  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const usedCredits = Number(
    creditBalance?.used_credits ?? totalCreditsUsedFromEvents
  );
  const creditsLeft = Math.max(0, planCredits + purchasedCredits - usedCredits);

  const aiActions = usageEvents
    .filter((event) =>
      [
        "ai_reply_generated",
        "ai_reply_sent",
        "content_generated",
        "test_ai_generated",
      ].includes(event.event_type)
    )
    .reduce((sum, event) => sum + (event.event_count || 1), 0);

  const messageActions = usageEvents
    .filter((event) =>
      [
        "customer_message_received",
        "human_reply_sent",
        "ai_reply_sent",
        "whatsapp_message_received",
        "whatsapp_message_sent",
        "website_chat_message_received",
        "email_sent",
      ].includes(event.event_type)
    )
    .reduce((sum, event) => sum + (event.event_count || 1), 0);

  const channelBreakdown = sumByKey(usageEvents, "channel");
  const eventBreakdown = sumByKey(usageEvents, "event_type");

  const summaryCards = [
    {
      label: t.currentPlan,
      value: creditBalance?.plan_name || currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.creditsLeft,
      value: creditBalance ? creditsLeft.toLocaleString() : "—",
      note: creditBalance ? t.trackedCredits : t.noCreditBalance,
      icon: CreditCard,
      important: true,
    },
    {
      label: t.creditsUsed,
      value: usedCredits.toLocaleString(),
      note: t.trackedCredits,
      icon: Zap,
    },
    {
      label: t.planCredits,
      value: planCredits.toLocaleString(),
      note: t.includedInPlan,
      icon: Sparkles,
    },
    {
      label: t.purchasedCredits,
      value: purchasedCredits.toLocaleString(),
      note: t.extraCredits,
      icon: CreditCard,
    },
    {
      label: t.totalActivity,
      value: `${totalEvents}`,
      note: `${filteredEvents.length} ${t.shown}`,
      icon: BarChart3,
    },
    {
      label: t.today,
      value: `${todayEvents}`,
      note: t.recentActivity,
      icon: Clock3,
    },
    {
      label: t.aiActions,
      value: `${aiActions}`,
      note: t.aiGenerations,
      icon: Bot,
    },
    {
      label: t.messageActions,
      value: `${messageActions}`,
      note: t.messageVolume,
      icon: MessageCircle,
    },
  ];

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

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
                  card.important
                    ? "border-[#7CFF3D] bg-[#07111F] text-white"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    card.important
                      ? "bg-[#7CFF3D] text-[#07111F]"
                      : "bg-[#07111F] text-[#7CFF3D]"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <p
                  className={`text-base font-black ${
                    card.important ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {card.label}
                </p>

                <p className="mt-2 break-words text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>

                <p
                  className={`mt-2 text-sm font-semibold leading-6 ${
                    card.important ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.overviewTitle}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.overviewText}
              </h2>

              {creditBalance ? (
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                  {t.billingPeriod}: {formatDate(creditBalance.billing_period_start)} —{" "}
                  {formatDate(creditBalance.billing_period_end)}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          <BreakdownCard
            title={t.topChannels}
            rows={channelBreakdown}
            labelFormatter={getChannelLabel}
          />

          <BreakdownCard
            title={t.topEvents}
            rows={eventBreakdown}
            labelFormatter={getEventLabel}
          />
        </div>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <CalendarDays className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.historyTitle}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.historyText}
            </h2>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-base font-black text-slate-700">
                {t.search}
              </span>

              <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5">
                <Search className="h-5 w-5 text-slate-500" />

                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="h-full w-full bg-transparent text-lg font-semibold outline-none"
                />
              </div>
            </label>

            <SelectInput
              label={t.channel}
              value={selectedChannel}
              onChange={setSelectedChannel}
              options={channelOptions}
            />

            <SelectInput
              label={t.eventType}
              value={selectedEventType}
              onChange={setSelectedEventType}
              options={eventTypeOptions}
            />
          </div>

          {pageError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="text-base font-black">{pageError}</p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6 text-lg font-black">
              {t.loading}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                <FileText className="h-8 w-8" />
              </div>

              <h3 className="text-4xl font-black tracking-[-0.05em]">
                {t.noUsage}
              </h3>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
                {t.noUsageText}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => {
                const details = getFriendlyMetadata(event.metadata, t);

                return (
                  <div
                    key={event.id}
                    className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge text={getEventLabel(event.event_type)} />
                          <Badge text={getChannelLabel(event.channel)} />
                          <Badge text={statusLabel(event.status, t)} />
                        </div>

                        <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">
                          {getActivitySentence(event)}
                        </h3>

                        <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                          {t.businessAction}
                        </p>

                        {details.length > 0 ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {details.map((detail) => (
                              <div
                                key={`${event.id}-${detail.label}`}
                                className="rounded-2xl bg-white p-4"
                              >
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                                  {detail.label}
                                </p>

                                <p className="mt-2 text-lg font-black text-[#07111F]">
                                  {detail.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
                            {t.noExtraDetails}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                        <MiniMetric
                          label={t.credits}
                          value={`${event.credits_used}`}
                        />
                        <MiniMetric
                          label={t.count}
                          value={`${event.event_count}`}
                        />
                        <MiniMetric
                          label={t.date}
                          value={formatDate(event.created_at)}
                          small
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
      {text}
    </span>
  );
}

function MiniMetric({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 font-black tracking-[-0.03em] text-[#07111F] ${
          small ? "text-sm leading-6" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
  labelFormatter,
}: {
  title: string;
  rows: { name: string; count: number }[];
  labelFormatter: (value: string) => string;
}) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        <BarChart3 className="h-8 w-8" />
      </div>

      <h2 className="text-3xl font-black tracking-[-0.04em]">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
          No data yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {rows.map((row) => (
            <div key={row.name} className="grid gap-2">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-black text-[#07111F]">
                  {labelFormatter(row.name)}
                </p>

                <p className="text-base font-black text-slate-500">
                  {row.count}
                </p>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#7CFF3D]"
                  style={{ width: `${Math.max(8, (row.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-base font-black text-slate-700">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-lg font-black outline-none transition focus:border-blue-500 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}