"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  RefreshCcw,
  Rocket,
  Settings,
  Sparkles,
  TestTube2,
  TrendingUp,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan, getPlanAIStaffLabel } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

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

function formatCredits(amount: number) {
  return `${amount.toLocaleString()} credits`;
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

  const planCreditNote =
    planCredits > 0
      ? `${formatCredits(planCredits)} monthly included`
      : "Plan credits";

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

      const latestData = latestResult.data as {
        last_message?: string | null;
      } | null;

      setCreditBalance((creditResult.data ?? null) as CreditBalanceRow | null);

      setStats({
        aiStaffCount: aiResult.count ?? 0,
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

  const summaryCards = [
    {
      label: "Current Plan",
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: <WalletCards className="h-7 w-7" />,
      href: "/dashboard/billing",
    },
    {
      label: "Credits Left",
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `${usedCredits.toLocaleString()} credits used`
        : "Credit balance not found yet.",
      icon: <CreditCard className="h-7 w-7" />,
      href: "/dashboard/usage",
      dark: true,
    },
    {
      label: "AI Staff",
      value: `${stats.aiStaffCount}`,
      note: getPlanAIStaffLabel(currentPlan),
      icon: <Bot className="h-7 w-7" />,
      href: "/dashboard/create-ai",
    },
    {
      label: "Inbox",
      value: isLoadingStats ? "..." : stats.conversationCount.toLocaleString(),
      note: "Customer conversations",
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

  const quickActions = [
    {
      title: "Onboarding",
      text: "Follow the safe setup order before activating AI replies for real customers.",
      href: "/dashboard/onboarding",
      icon: <LayoutDashboard className="h-6 w-6" />,
    },
    {
      title: "Create AI Staff",
      text: "Build your AI staff role, tone, behavior, and customer reply style.",
      href: "/dashboard/create-ai",
      icon: <Bot className="h-6 w-6" />,
    },
    {
      title: "Knowledge Base",
      text: "Add FAQs, services, prices, policies, and approved answers for your AI.",
      href: "/dashboard/knowledge-base",
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      title: "Test AI",
      text: "Send sample customer questions and review replies before going live.",
      href: "/dashboard/test-ai",
      icon: <TestTube2 className="h-6 w-6" />,
    },
    {
      title: "Website Chat",
      text: "Set widget status, selected AI staff, auto-reply, and handover rules.",
      href: "/dashboard/integrations/website-chat",
      icon: <Globe2 className="h-6 w-6" />,
    },
    {
      title: "WhatsApp",
      text: "Manage WhatsApp numbers, AI support, auto-reply, and handover.",
      href: "/dashboard/integrations/whatsapp",
      icon: <MessageCircle className="h-6 w-6" />,
    },
    {
      title: "Need Help?",
      text: "Send a help request to Kolkap for WhatsApp, billing, AI staff, credits, bugs, or account issues.",
      href: "/dashboard/help",
      icon: <HelpCircle className="h-6 w-6" />,
    },
  ];

  const setupFlow = [
    {
      title: "1. Settings",
      text: "Complete business profile, contact details, timezone, and default AI preferences.",
      href: "/dashboard/settings",
      icon: <Settings className="h-6 w-6" />,
      done: Boolean(workspace?.business_name),
    },
    {
      title: "2. Create AI Staff",
      text: "Create the AI staff member that will help with customer replies and automation.",
      href: "/dashboard/create-ai",
      icon: <Bot className="h-6 w-6" />,
      done: stats.aiStaffCount > 0,
    },
    {
      title: "3. Knowledge Base",
      text: "Add services, prices, FAQs, policies, and instructions so replies are accurate.",
      href: "/dashboard/knowledge-base",
      icon: <BookOpen className="h-6 w-6" />,
      done: false,
    },
    {
      title: "4. Test AI",
      text: "Test common customer questions before activating real customer replies.",
      href: "/dashboard/test-ai",
      icon: <TestTube2 className="h-6 w-6" />,
      done: false,
    },
    {
      title: "5. Website Chat",
      text: "Prepare your website widget, AI staff, auto-reply, and human handover controls.",
      href: "/dashboard/integrations/website-chat",
      icon: <Globe2 className="h-6 w-6" />,
      done: false,
    },
    {
      title: "6. WhatsApp",
      text: "Add WhatsApp numbers and control AI support, auto-reply, primary number, and handover.",
      href: "/dashboard/integrations/whatsapp",
      icon: <MessageCircle className="h-6 w-6" />,
      done: workspaceState.whatsappStatus === "connected",
    },
    {
      title: "7. Go Live",
      text: "Review plan, credits, AI staff, knowledge, testing, and channel readiness.",
      href: "/dashboard/go-live",
      icon: <Rocket className="h-6 w-6" />,
      done: workspaceState.goLiveStatus === "live",
    },
    {
      title: "8. Inbox & Leads",
      text: "Review conversations, handover, AI replies, leads, and follow-up activity.",
      href: "/dashboard/inbox",
      icon: <Inbox className="h-6 w-6" />,
      done: stats.conversationCount > 0,
    },
  ];

  const managementCards = [
    {
      title: "Content Studio",
      text: "Generate captions, WhatsApp messages, ad copy, scripts, and customer replies.",
      href: "/dashboard/content-studio",
      icon: <FileText className="h-6 w-6" />,
    },
    {
      title: "Usage",
      text: "Track AI actions, messages, skipped replies, and credit deductions.",
      href: "/dashboard/usage",
      icon: <BarChart3 className="h-6 w-6" />,
    },
    {
      title: "Reports",
      text: "Review channel performance, leads, handover, AI activity, and credit usage.",
      href: "/dashboard/reports",
      icon: <TrendingUp className="h-6 w-6" />,
    },
    {
      title: "Top Up",
      text: "Buy extra credits through Stripe when your workspace needs more capacity.",
      href: "/dashboard/top-up",
      icon: <WalletCards className="h-6 w-6" />,
    },
    {
      title: "Billing",
      text: "Manage your plan, subscription, cancellation, and billing status.",
      href: "/dashboard/billing",
      icon: <CreditCard className="h-6 w-6" />,
    },
    {
      title: "Team",
      text: "Invite and manage team members who help operate your workspace.",
      href: "/dashboard/team",
      icon: <UsersRound className="h-6 w-6" />,
    },
    {
      title: "Settings",
      text: "Update business profile, notifications, AI preferences, and account settings.",
      href: "/dashboard/settings",
      icon: <Settings className="h-6 w-6" />,
    },
    {
      title: "Leads",
      text: "Track customer opportunities, lead status, and follow-up activity.",
      href: "/dashboard/leads",
      icon: <UserRound className="h-6 w-6" />,
    },
    {
      title: "Inbox",
      text: "Manage customer conversations, AI suggestions, and human handover.",
      href: "/dashboard/inbox",
      icon: <Inbox className="h-6 w-6" />,
    },
    {
      title: "Help",
      text: "Contact Kolkap support about your workspace, billing, WhatsApp setup, AI staff, or technical issues.",
      href: "/dashboard/help",
      icon: <HelpCircle className="h-6 w-6" />,
    },
  ];

  const workspaceHealth = useMemo(() => {
    const items = [
      Boolean(workspace?.business_name),
      stats.aiStaffCount > 0,
      workspaceState.whatsappStatus === "connected",
      workspaceState.goLiveStatus === "live",
      stats.conversationCount > 0,
    ];

    return items.filter(Boolean).length;
  }, [
    workspace?.business_name,
    stats.aiStaffCount,
    stats.conversationCount,
    workspaceState.goLiveStatus,
    workspaceState.whatsappStatus,
  ]);

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
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              Kolkap Dashboard
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

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Manage your AI staff, channels, credits, and customer conversations.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Create AI staff, add knowledge, test replies, activate Website Chat
            or WhatsApp, review Inbox and Leads, track credits, and manage your
            workspace from one dashboard.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat
              label="Workspace Status"
              value={statusLabel(workspaceState.status)}
            />

            <HeroStat
              label="Trial Days Left"
              value={String(workspaceState.trialDaysRemaining)}
            />

            <HeroStat
              label="Credits Left"
              value={creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
              highlight
            />

            <HeroStat
              label="Go Live"
              value={statusLabel(workspaceState.goLiveStatus)}
            />
          </div>
        </div>

        {statsError ? (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="text-base font-black">{statsError}</p>
          </div>
        ) : null}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <SummaryLinkCard
              key={card.label}
              href={card.href}
              icon={card.icon}
              label={card.label}
              value={card.value}
              note={card.note}
              dark={card.dark}
            />
          ))}
        </div>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Zap className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Credits
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Credits Left:{" "}
                {creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                {creditBalance
                  ? `${usedCredits.toLocaleString()} used • ${totalCredits.toLocaleString()} total credits • ${stats.creditsUsedToday.toLocaleString()} used today`
                  : "Credit balance not found yet."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MiniLinkCard
                href="/dashboard/usage"
                title="Usage"
                text={`Credits used: ${usedCredits.toLocaleString()}`}
                icon={<BarChart3 className="h-9 w-9 text-[#7CFF3D]" />}
                dark
              />

              <MiniLinkCard
                href="/dashboard/billing"
                title="Billing"
                text={currentPlan.priceLabel}
                icon={<CreditCard className="h-9 w-9 text-[#07111F]" />}
              />

              <MiniLinkCard
                href="/dashboard/top-up"
                title="Top Up"
                text={planCreditNote}
                icon={<WalletCards className="h-9 w-9 text-[#07111F]" />}
              />
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              Quick Actions
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              Jump into the actions that move your AI workspace forward.
            </h2>

            <div className="mt-8 grid gap-4">
              {quickActions.map((action) => (
                <DarkActionLink
                  key={action.title}
                  href={action.href}
                  icon={action.icon}
                  title={action.title}
                  text={action.text}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Rocket className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Main Setup Flow
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              Follow this flow before your AI staff starts helping real
              customers.
            </h2>

            <div className="mt-8 grid gap-4">
              {setupFlow.map((item) => (
                <SetupFlowLink
                  key={item.title}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  text={item.text}
                  done={item.done}
                />
              ))}
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
                Workspace Management
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Manage content, usage, reports, credits, billing, team, inbox,
                leads, settings, and help requests.
              </h2>
            </div>

            <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-blue-700">
                Setup Progress
              </p>

              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-blue-950">
                {workspaceHealth}/5
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {managementCards.map((item) => (
              <ManagementLink
                key={item.title}
                href={item.href}
                icon={item.icon}
                title={item.title}
                text={item.text}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <MessageCircle className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Customer Activity
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Customer conversations, leads, and handover activity will appear
                here as your channels start receiving messages.
              </h2>
            </div>

            <div className="rounded-[2rem] bg-[#07111F] p-6 text-white">
              <div className="grid gap-4 sm:grid-cols-3">
                <ActivityStat
                  label="Conversations"
                  value={stats.conversationCount}
                />

                <ActivityStat label="Leads" value={stats.leadCount} />

                <ActivityStat label="Handover" value={stats.handoverCount} />
              </div>

              <p className="mt-6 text-xl font-black leading-9">
                {stats.latestConversation || "No customer conversation yet."}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
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
          </div>
        </section>
      </section>
    </main>
  );
}

function HeroStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          highlight ? "text-[#7CFF3D]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryLinkCard({
  href,
  icon,
  label,
  value,
  note,
  dark = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
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

      <p
        className={`text-lg font-black ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
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

function MiniLinkCard({
  href,
  title,
  text,
  icon,
  dark = false,
}: {
  href: string;
  title: string;
  text: string;
  icon: ReactNode;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[2rem] p-6 ${
        dark
          ? "bg-[#07111F] text-white"
          : "border border-slate-200 bg-[#F7F9FA] text-[#07111F]"
      }`}
    >
      <div className="mb-5">{icon}</div>

      <p className="text-xl font-black">{title}</p>

      <p
        className={`mt-2 text-sm font-semibold ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {text}
      </p>
    </Link>
  );
}

function DarkActionLink({
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
      className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-black">{title}</p>
            <ArrowRight className="h-5 w-5 shrink-0 transition group-hover:translate-x-1" />
          </div>

          <p className="mt-2 text-base font-semibold leading-7 text-slate-300">
            {text}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SetupFlowLink({
  href,
  icon,
  title,
  text,
  done,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  text: string;
  done: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 transition hover:bg-white"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-black">{title}</p>

            {done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <ArrowRight className="h-5 w-5 shrink-0 text-blue-600 transition group-hover:translate-x-1" />
            )}
          </div>

          <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
            {text}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ManagementLink({
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
      className="group rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 transition hover:bg-white"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#07111F]">
        {icon}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-black">{title}</p>
        <ArrowRight className="h-4 w-4 text-blue-600 transition group-hover:translate-x-1" />
      </div>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {text}
      </p>
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