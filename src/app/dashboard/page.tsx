"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CreditCard,
  FileText,
  Globe2,
  HelpCircle,
  Inbox,
  MessageCircle,
  RefreshCcw,
  Rocket,
  Settings,
  Sparkles,
  TestTube2,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type DashboardStats = {
  activeAiStaffCount: number;
  draftAiStaffCount: number;
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

const statusLabels: Record<string, string> = {
  trial: "Trial",
  active: "Active",
  past_due: "Past Due",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  draft: "Draft",
  testing: "Testing",
  live: "Live",
  pending: "Pending",
  not_connected: "Not connected",
  connected: "Connected",
  checkout_created: "Checkout Created",
};

function statusLabel(value: string | null | undefined) {
  if (!value) return "Not set";

  return statusLabels[value] || value.replace(/_/g, " ");
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

function getTodayStartIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export default function DashboardPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [stats, setStats] = useState<DashboardStats>({
    activeAiStaffCount: 0,
    draftAiStaffCount: 0,
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

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (!workspace?.id) {
        setIsLoadingStats(false);
        return;
      }

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
          .select("status, deleted_at")
          .eq("workspace_id", workspace.id)
          .is("deleted_at", null),

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

      const latestData = latestResult.data as {
        last_message?: string | null;
      } | null;

      const aiStaffRows = (aiResult.data ?? []) as Array<{
        status?: string | null;
      }>;
      const activeAiStaffCount = aiStaffRows.filter(
        (row) => String(row.status || "").trim().toLowerCase() !== "draft"
      ).length;
      const draftAiStaffCount = aiStaffRows.length - activeAiStaffCount;

      setCreditBalance((creditResult.data ?? null) as CreditBalanceRow | null);

      setStats({
        activeAiStaffCount,
        draftAiStaffCount,
        conversationCount: conversationResult.count ?? 0,
        leadCount: leadResult.count ?? 0,
        handoverCount: handoverResult.count ?? 0,
        usageEventCount: usageResult.count ?? 0,
        creditsUsedToday: todayCreditsUsed,
        latestConversation: latestData?.last_message ?? "",
      });

      setIsLoadingStats(false);
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [workspace?.id, reloadKey]);

  const overviewCards = [
    {
      label: "Credits Left",
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `${stats.creditsUsedToday.toLocaleString()} used today`
        : "Credit balance not found yet.",
      icon: <CreditCard className="h-7 w-7" />,
      href: "/dashboard/usage",
    },
    {
      label: "AI Staff",
      value: isLoadingStats
        ? "..."
        : `${stats.activeAiStaffCount.toLocaleString()} active`,
      note: isLoadingStats
        ? "Checking AI staff..."
        : `${stats.draftAiStaffCount.toLocaleString()} ${
            stats.draftAiStaffCount === 1 ? "draft" : "drafts"
          } · ${
            currentPlan.aiStaffLimit === "custom"
              ? "Custom active limit"
              : `Plan allows ${currentPlan.aiStaffLimit} active`
          }`,
      icon: <Bot className="h-7 w-7" />,
      href: "/dashboard/create-ai",
    },
    {
      label: "Inbox",
      value: isLoadingStats ? "..." : stats.conversationCount.toLocaleString(),
      note: `${stats.leadCount.toLocaleString()} open leads`,
      icon: <Inbox className="h-7 w-7" />,
      href: "/dashboard/inbox",
    },
    {
      label: "Go Live",
      value: statusLabel(workspaceState.goLiveStatus),
      note: "Review readiness",
      icon: <Rocket className="h-7 w-7" />,
      href: "/dashboard/go-live",
    },
  ];

  const nextAction = !workspace?.business_name
    ? {
        eyebrow: "Start here",
        title: "Complete your business settings",
        text: "Add the business details your AI staff will use across your workspace.",
        href: "/dashboard/settings",
        label: "Open Settings",
        icon: <Settings className="h-8 w-8" />,
      }
    : stats.activeAiStaffCount === 0 && stats.draftAiStaffCount > 0
    ? {
        eyebrow: "Continue setup",
        title: "Test your saved AI staff",
        text: `You have ${stats.draftAiStaffCount} saved ${
          stats.draftAiStaffCount === 1 ? "draft" : "drafts"
        }. Test the replies before choosing which AI staff member to activate.`,
        href: "/dashboard/test-ai",
        label: "Test AI Staff",
        icon: <TestTube2 className="h-8 w-8" />,
      }
    : stats.activeAiStaffCount === 0
    ? {
        eyebrow: "Next step",
        title: "Create your first AI staff member",
        text: "Choose a role, reply style, language, and instructions for your AI staff.",
        href: "/dashboard/create-ai",
        label: "Create AI Staff",
        icon: <Bot className="h-8 w-8" />,
      }
    : workspaceState.goLiveStatus !== "live"
    ? {
        eyebrow: "Continue setup",
        title: "Review your go-live checklist",
        text: "Check your AI test, business knowledge, credits, and customer channel readiness in one place.",
        href: "/dashboard/go-live",
        label: "Review Checklist",
        icon: <Rocket className="h-8 w-8" />,
      }
    : {
        eyebrow: "AI staff is live",
        title: "Review your customer conversations",
        text: "Open your inbox to monitor replies, handover requests, and new customer messages.",
        href: "/dashboard/inbox",
        label: "Open Inbox",
        icon: <Inbox className="h-8 w-8" />,
      };

  const toolGroups = [
    {
      title: "Build & improve",
      items: [
        {
          title: "Train My AI",
          text: "Teach your AI approved business information",
          href: "/dashboard/knowledge-base",
          icon: <BookOpen className="h-6 w-6" />,
        },
        {
          title: "Test AI",
          text: "Review replies before customers see them",
          href: "/dashboard/test-ai",
          icon: <TestTube2 className="h-6 w-6" />,
        },
        {
          title: "Integrations",
          text: "Website Chat and WhatsApp",
          href: "/dashboard/integrations",
          icon: <Globe2 className="h-6 w-6" />,
        },
      ],
    },
    {
      title: "Operate & grow",
      items: [
        {
          title: "Content Studio",
          text: "Captions, scripts, and customer messages",
          href: "/dashboard/content-studio",
          icon: <FileText className="h-6 w-6" />,
        },
        {
          title: "Reports",
          text: "Customer, channel, and AI performance",
          href: "/dashboard/reports",
          icon: <TrendingUp className="h-6 w-6" />,
        },
        {
          title: "Team",
          text: "People who can access your workspace",
          href: "/dashboard/team",
          icon: <UsersRound className="h-6 w-6" />,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Top Up",
          text: "Buy additional AI credits",
          href: "/dashboard/top-up",
          icon: <WalletCards className="h-6 w-6" />,
        },
        {
          title: "Billing",
          text: "Plan, subscription, and billing status",
          href: "/dashboard/billing",
          icon: <CreditCard className="h-6 w-6" />,
        },
        {
          title: "Settings",
          text: "Business, AI, notifications, and account",
          href: "/dashboard/settings",
          icon: <Settings className="h-6 w-6" />,
        },
      ],
    },
  ];

  const latestConversationPreview = stats.latestConversation.trim()
    ? stats.latestConversation.length > 160
      ? `${stats.latestConversation.slice(0, 157)}...`
      : stats.latestConversation
    : "No customer conversations yet.";

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your dashboard...
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
            <p className="text-xl font-black">Dashboard could not load.</p>
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
        <div className="mb-6 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              Dashboard
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/help"
                className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
              >
                <HelpCircle className="h-5 w-5" />
                Need Help?
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
          </div>

          <h1 className="mt-7 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {workspace?.business_name || "Your Kolkap workspace"}
          </h1>

          <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
            See what needs attention, monitor customer activity, and open the
            tools you need.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <HeaderPill
              label="Plan"
              value={`${currentPlan.name} · ${currentPlan.priceLabel}`}
            />
            <HeaderPill
              label="Workspace"
              value={statusLabel(workspaceState.status)}
            />
            {workspaceState.status === "trial" ? (
              <HeaderPill
                label="Trial"
                value={`${workspaceState.trialDaysRemaining} days left`}
                highlight
              />
            ) : null}
          </div>
        </div>

        {statsError ? (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="text-base font-black">{statsError}</p>
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewCards.map((card) => (
            <OverviewLinkCard
              key={card.label}
              href={card.href}
              icon={card.icon}
              label={card.label}
              value={card.value}
              note={card.note}
            />
          ))}
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              {nextAction.icon}
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {nextAction.eyebrow}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {nextAction.title}
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-slate-300">
              {nextAction.text}
            </p>

            <Link
              href={nextAction.href}
              className="mt-7 inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-base font-black text-[#07111F] transition hover:-translate-y-0.5"
            >
              {nextAction.label}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <MessageCircle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                  Customer Activity
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Conversations at a glance
                </h2>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] bg-[#07111F] p-6 text-white">
              <div className="grid gap-3 sm:grid-cols-3">
                <ActivityStat
                  label="Conversations"
                  value={stats.conversationCount}
                />
                <ActivityStat label="Open Leads" value={stats.leadCount} />
                <ActivityStat label="Handover" value={stats.handoverCount} />
              </div>

              <p className="mt-6 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                Latest message
              </p>
              <p className="mt-2 text-lg font-semibold leading-8 text-slate-200">
                {latestConversationPreview}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                  View Leads
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Workspace Tools
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
            Manage your workspace.
          </h2>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {toolGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-[1.8rem] border border-slate-200 bg-[#F7F9FA] p-5"
              >
                <h3 className="text-xl font-black">{group.title}</h3>
                <div className="mt-4 grid gap-3">
                  {group.items.map((item) => (
                    <ToolLink key={item.title} {...item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function HeaderPill({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300">
      <span className="text-slate-400">{label}:</span>{" "}
      <span className={highlight ? "text-[#7CFF3D]" : "text-white"}>
        {value}
      </span>
    </div>
  );
}

function OverviewLinkCard({
  href,
  icon,
  label,
  value,
  note,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.8rem] border border-slate-200 bg-white p-5 text-[#07111F] shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          {icon}
        </div>
        <ArrowRight className="h-5 w-5 text-blue-600 transition group-hover:translate-x-1" />
      </div>

      <p className="mt-5 text-base font-black text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-[-0.04em]">{value}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {note}
      </p>
    </Link>
  );
}

function ToolLink({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl bg-white p-4 transition hover:shadow-md hover:shadow-slate-900/5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#07111F] text-[#7CFF3D]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-black">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
          {text}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-blue-600 transition group-hover:translate-x-1" />
    </Link>
  );
}

function ActivityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
