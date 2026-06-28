"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
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

const DEFAULT_CHANNELS = [
  "all",
  "dashboard",
  "inbox",
  "whatsapp",
  "website_chat",
  "content_studio",
  "test_ai",
  "knowledge_base",
  "team",
  "go_live",
  "billing",
  "email",
  "api",
  "system",
];

const DEFAULT_EVENT_TYPES = [
  "all",
  "test_ai_generated",
  "ai_reply_generated",
  "website_chat_message_received",
  "website_chat_ai_reply_generated",
  "website_chat_auto_reply_skipped",
  "customer_message_received",
  "ai_reply_sent",
  "human_reply_sent",
  "whatsapp_message_received",
  "whatsapp_message_sent",
  "content_generated",
  "content_saved",
  "knowledge_created",
  "knowledge_updated",
  "ai_staff_created",
  "team_invite_sent",
  "go_live_enabled",
  "go_live_disabled",
  "email_sent",
  "system_event",
];

function formatValue(value: unknown) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function channelLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value === "all") return "All Channels";
  if (value === "website_chat") return "Website Chat";
  if (value === "content_studio") return "Content Studio";
  if (value === "test_ai") return "Test AI";
  if (value === "knowledge_base") return "Knowledge Base";
  if (value === "go_live") return "Go Live";
  if (value === "whatsapp") return "WhatsApp";
  if (value === "inbox") return "Inbox";
  if (value === "dashboard") return "Dashboard";
  if (value === "billing") return "Billing";
  if (value === "email") return "Email";
  if (value === "api") return "API";
  if (value === "system") return "System";

  return formatValue(value);
}

function eventLabel(value: string | null | undefined) {
  if (!value) return "Unknown Event";
  if (value === "all") return "All Events";
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
  if (value === "email_sent") return "Email Sent";
  if (value === "system_event") return "System Event";

  return formatValue(value);
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Success";
  if (value === "success") return "Success";
  if (value === "failed") return "Failed";
  if (value === "pending") return "Pending";

  return formatValue(value);
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

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
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

function getOptionValues(defaultValues: string[], events: UsageEventRow[], key: "channel" | "event_type") {
  return Array.from(
    new Set([
      ...defaultValues,
      ...events.map((event) => event[key]).filter(Boolean),
    ])
  );
}

function getOptions(values: string[], labelFormatter: (value: string) => string): Option[] {
  return values.map((value) => ({
    value,
    label: labelFormatter(value),
  }));
}

function sumByKey(rows: UsageEventRow[], key: "channel" | "event_type") {
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

function getMetadataDetails(metadata: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return [];
  }

  const details: { label: string; value: string }[] = [];

  const fieldMap: Array<[string, string]> = [
    ["knowledge_count", "Knowledge Used"],
    ["model", "AI Model"],
    ["fallback", "Fallback"],
    ["selected_test_channel", "Test Style"],
    ["brain_channel", "Brain Channel"],
    ["customer_channel", "Customer Channel"],
    ["reason", "Reason"],
    ["credit_rule", "Credit Rule"],
    ["content_type", "Content Type"],
    ["content_purpose", "Purpose"],
    ["platform", "Platform"],
    ["test_mode", "Test Mode"],
    ["manual_review_mode", "Manual Review"],
    ["website_chat_active", "Website Chat Active"],
    ["ai_enabled", "AI Support"],
    ["auto_reply_enabled", "Auto-Reply"],
    ["handover_enabled", "Human Handover"],
  ];

  fieldMap.forEach(([key, label]) => {
    const value = metadata[key];

    if (value !== undefined && value !== null && value !== "") {
      details.push({
        label,
        value:
          typeof value === "boolean"
            ? value
              ? "Yes"
              : "No"
            : formatValue(value),
      });
    }
  });

  return details.slice(0, 8);
}

function getActivitySentence(event: UsageEventRow) {
  return `${eventLabel(event.event_type)} in ${channelLabel(event.channel)}`;
}

export default function UsagePage() {
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
      if (!workspace?.id) return;

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
  }, [workspace?.id, reloadKey]);

  const channelOptions = useMemo(() => {
    return getOptions(
      getOptionValues(DEFAULT_CHANNELS, usageEvents, "channel"),
      channelLabel
    );
  }, [usageEvents]);

  const eventTypeOptions = useMemo(() => {
    return getOptions(
      getOptionValues(DEFAULT_EVENT_TYPES, usageEvents, "event_type"),
      eventLabel
    );
  }, [usageEvents]);

  const filteredEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return usageEvents.filter((event) => {
      const metadataText = JSON.stringify(event.metadata || {}).toLowerCase();

      const matchesSearch =
        !search ||
        eventLabel(event.event_type).toLowerCase().includes(search) ||
        channelLabel(event.channel).toLowerCase().includes(search) ||
        statusLabel(event.status).toLowerCase().includes(search) ||
        event.source_page?.toLowerCase().includes(search) ||
        metadataText.includes(search);

      const matchesChannel =
        selectedChannel === "all" || event.channel === selectedChannel;

      const matchesEventType =
        selectedEventType === "all" || event.event_type === selectedEventType;

      return matchesSearch && matchesChannel && matchesEventType;
    });
  }, [usageEvents, searchTerm, selectedChannel, selectedEventType]);

  const totalEvents = usageEvents.reduce(
    (sum, event) => sum + Number(event.event_count || 1),
    0
  );

  const todayEvents = usageEvents
    .filter((event) => isToday(event.created_at))
    .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

  const totalCreditsUsedFromEvents = usageEvents.reduce(
    (sum, event) => sum + Number(event.credits_used || 0),
    0
  );

  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const usedCredits = Number(
    creditBalance?.used_credits ?? totalCreditsUsedFromEvents
  );
  const creditsLeft = getCreditsLeft(creditBalance);

  const aiActions = usageEvents
    .filter((event) =>
      [
        "ai_reply_generated",
        "website_chat_ai_reply_generated",
        "content_generated",
        "test_ai_generated",
      ].includes(event.event_type)
    )
    .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

  const messageActions = usageEvents
    .filter((event) =>
      [
        "customer_message_received",
        "website_chat_message_received",
        "website_chat_ai_reply_generated",
        "website_chat_auto_reply_skipped",
        "human_reply_sent",
        "ai_reply_sent",
        "whatsapp_message_received",
        "whatsapp_message_sent",
        "email_sent",
      ].includes(event.event_type)
    )
    .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

  const skippedAutoReplies = usageEvents
    .filter((event) => event.event_type === "website_chat_auto_reply_skipped")
    .reduce((sum, event) => sum + Number(event.event_count || 1), 0);

  const channelBreakdown = sumByKey(usageEvents, "channel");
  const eventBreakdown = sumByKey(usageEvents, "event_type");

  const currentPlanLabel = creditBalance?.plan_name
    ? formatValue(creditBalance.plan_name)
    : currentPlan.name;

  const summaryCards = [
    {
      label: "Current Plan",
      value: currentPlanLabel,
      note: currentPlan.priceLabel,
      icon: <WalletCards className="h-7 w-7" />,
    },
    {
      label: "Credits Left",
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? "Available credits after tracked usage."
        : "Credit balance has not been created yet.",
      icon: <CreditCard className="h-7 w-7" />,
      important: true,
    },
    {
      label: "Credits Used",
      value: usedCredits.toLocaleString(),
      note: "Tracked deducted credits.",
      icon: <Zap className="h-7 w-7" />,
    },
    {
      label: "Plan Credits",
      value: planCredits.toLocaleString(),
      note: "Included in the current plan.",
      icon: <Sparkles className="h-7 w-7" />,
    },
    {
      label: "Top-Up Credits",
      value: purchasedCredits.toLocaleString(),
      note: "Purchased extra credits.",
      icon: <CreditCard className="h-7 w-7" />,
    },
    {
      label: "Total Activity",
      value: `${totalEvents}`,
      note: `${filteredEvents.length} event(s) shown.`,
      icon: <BarChart3 className="h-7 w-7" />,
    },
    {
      label: "Today",
      value: `${todayEvents}`,
      note: "Activity recorded today.",
      icon: <Clock3 className="h-7 w-7" />,
    },
    {
      label: "AI Actions",
      value: `${aiActions}`,
      note: "AI generations, tests, and replies.",
      icon: <Bot className="h-7 w-7" />,
    },
    {
      label: "Messages",
      value: `${messageActions}`,
      note: `${skippedAutoReplies} auto-reply skipped event(s).`,
      icon: <MessageCircle className="h-7 w-7" />,
    },
  ];

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading usage...
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
            <p className="text-xl font-black">Usage page could not load.</p>
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
            <Sparkles className="h-5 w-5" />
            Usage
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Track workspace activity and credits.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            See credits left, credits used, Test AI activity, Inbox AI
            suggestions, Website Chat auto-replies, skipped replies, messages,
            and other workspace events.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              note={card.note}
              important={card.important}
            />
          ))}
        </div>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Usage Overview
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                Every successful AI action creates a usage event. Credits are
                deducted through the credit system, and this page shows the
                activity trail behind the balance.
              </h2>

              {creditBalance ? (
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                  Billing period: {formatDate(creditBalance.billing_period_start)} —{" "}
                  {formatDate(creditBalance.billing_period_end)}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard/top-up"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-base font-black text-[#07111F]"
                >
                  Top Up Credits
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white"
                >
                  Open Billing
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          <BreakdownCard
            title="Usage by Channel"
            rows={channelBreakdown}
            labelFormatter={channelLabel}
            noDataText="No channel usage yet."
          />

          <BreakdownCard
            title="Usage by Action"
            rows={eventBreakdown}
            labelFormatter={eventLabel}
            noDataText="No action usage yet."
          />
        </div>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <CalendarDays className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Usage History
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              Review recent usage events from connected tools.
            </h2>

            <p className="mt-4 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
              This includes Content Studio, Test AI, Inbox suggestions, Website
              Chat, WhatsApp, billing events, team actions, and system events
              when they are logged.
            </p>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-base font-black text-slate-700">
                Search
              </span>

              <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5">
                <Search className="h-5 w-5 text-slate-500" />

                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search usage history..."
                  className="h-full w-full bg-transparent text-lg font-semibold outline-none"
                />
              </div>
            </label>

            <SelectInput
              label="Channel"
              value={selectedChannel}
              onChange={setSelectedChannel}
              options={channelOptions}
            />

            <SelectInput
              label="Event Type"
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
              Loading usage...
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyUsageState />
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => {
                const details = getMetadataDetails(event.metadata);

                return (
                  <div
                    key={event.id}
                    className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge text={eventLabel(event.event_type)} />
                          <Badge text={channelLabel(event.channel)} />
                          <Badge text={statusLabel(event.status)} />
                        </div>

                        <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">
                          {getActivitySentence(event)}
                        </h3>

                        <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                          Source: {event.source_page || "Workspace activity"}
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

                                <p className="mt-2 break-words text-lg font-black text-[#07111F]">
                                  {detail.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
                            No extra details.
                          </p>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                        <MiniMetric
                          label="Credits"
                          value={`${event.credits_used}`}
                        />
                        <MiniMetric
                          label="Count"
                          value={`${event.event_count}`}
                        />
                        <MiniMetric
                          label="Date"
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

function SummaryCard({
  icon,
  label,
  value,
  note,
  important = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  important?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
        important
          ? "border-[#7CFF3D] bg-[#07111F] text-white"
          : "border-slate-200 bg-white text-[#07111F]"
      }`}
    >
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
          important
            ? "bg-[#7CFF3D] text-[#07111F]"
            : "bg-[#07111F] text-[#7CFF3D]"
        }`}
      >
        {icon}
      </div>

      <p
        className={`text-base font-black ${
          important ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 break-words text-3xl font-black tracking-[-0.04em]">
        {value}
      </p>

      <p
        className={`mt-2 text-sm font-semibold leading-6 ${
          important ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {note}
      </p>
    </div>
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

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
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

function EmptyUsageState() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
        <FileText className="h-8 w-8" />
      </div>

      <h3 className="text-4xl font-black tracking-[-0.05em]">
        No usage recorded yet.
      </h3>

      <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
        Usage will appear after Test AI, Inbox AI suggestions, Website Chat
        messages, auto-replies, Content Studio generations, WhatsApp activity,
        or other connected workspace actions.
      </p>
    </div>
  );
}