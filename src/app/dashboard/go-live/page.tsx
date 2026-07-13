"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  Globe2,
  MessageCircle,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Smartphone,
  TestTube2,
  WalletCards,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type AiStaffRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  name: string;
  role: string;
  channel: string;
  reply_language: string | null;
  reply_tone: string | null;
  business_knowledge: string | null;
  ai_instruction: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type AiTestRunRow = {
  id: string;
  workspace_id: string;
  ai_staff_id: string;
  owner_user_id: string;
  customer_message: string;
  ai_response: string;
  status: string;
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

type WebsiteChatSettingsRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  selected_ai_staff_id: string | null;
  widget_title: string;
  widget_subtitle: string;
  welcome_message: string;
  is_active: boolean;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  handover_enabled: boolean;
  allowed_domains: string[];
  created_at: string;
  updated_at: string;
};

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Pending";
  if (value === "draft") return "Draft";
  if (value === "testing") return "Testing";
  if (value === "live") return "Live";
  if (value === "pending") return "Pending";
  if (value === "not_connected") return "Not connected";
  if (value === "connected") return "Connected";
  if (value === "trial") return "Trial";
  if (value === "active") return "Active";
  if (value === "past_due") return "Past Due";
  if (value === "cancelled") return "Cancelled";
  if (value === "canceled") return "Cancelled";

  return value.replace(/_/g, " ");
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

function getAiStaffLimitLabel(plan: ReturnType<typeof getKolkapPlan>) {
  if (plan.aiStaffLimit === "custom") {
    return "Custom AI staff limit";
  }

  return `${plan.aiStaffLimit} AI staff included`;
}

function getAutoReplyMinimumCredits(channel?: string | null) {
  const normalized = String(channel || "").toLowerCase();

  if (normalized.includes("whatsapp")) return 5;

  return 3;
}

function getAutoReplyCostNote(channel?: string | null) {
  const normalized = String(channel || "").toLowerCase();

  if (normalized.includes("whatsapp")) {
    return "WhatsApp AI replies use 5 credits.";
  }

  return "Website Chat AI replies use 3 credits.";
}

export default function GoLivePage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [testRuns, setTestRuns] = useState<AiTestRunRow[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );
  const [websiteChatSettings, setWebsiteChatSettings] =
    useState<WebsiteChatSettingsRow | null>(null);
  const [knowledgeCount, setKnowledgeCount] = useState(0);

  const [selectedAiStaffId, setSelectedAiStaffId] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isActivating, setIsActivating] = useState(false);
  const [activateMessage, setActivateMessage] = useState("");
  const [activateError, setActivateError] = useState("");

  const creditsLeft = getCreditsLeft(creditBalance);
  const usedCredits = Number(creditBalance?.used_credits || 0);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const totalCredits = planCredits + purchasedCredits;

  const businessProfile = workspace as
    | (typeof workspace & {
        business_email?: string | null;
        business_type?: string | null;
        whatsapp_number?: string | null;
      })
    | null;

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!workspace?.id) return;

      setIsLoadingData(true);
      setDataError("");

      const supabase = createClient();

      const [
        aiStaffResult,
        testRunsResult,
        creditResult,
        websiteChatResult,
        knowledgeResult,
      ] = await Promise.all([
        supabase
          .from("ai_staff")
          .select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("ai_test_runs")
          .select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("workspace_credit_balances")
          .select("*")
          .eq("workspace_id", workspace.id)
          .maybeSingle(),

        supabase
          .from("workspace_website_chat_settings")
          .select("*")
          .eq("workspace_id", workspace.id)
          .maybeSingle(),

        supabase
          .from("workspace_knowledge_base")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id)
          .eq("status", "active"),
      ]);

      if (!isMounted) return;

      const firstError =
        aiStaffResult.error ||
        testRunsResult.error ||
        creditResult.error ||
        websiteChatResult.error ||
        knowledgeResult.error;

      if (firstError) {
        setDataError(firstError.message);
        setIsLoadingData(false);
        return;
      }

      const aiRows = (aiStaffResult.data ?? []) as AiStaffRow[];
      const runRows = (testRunsResult.data ?? []) as AiTestRunRow[];

      const aiIdFromUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("ai")
          : "";

      const matchedAiId =
        aiIdFromUrl && aiRows.some((staff) => staff.id === aiIdFromUrl)
          ? aiIdFromUrl
          : "";

      const liveAi = aiRows.find((staff) => staff.status === "live");
      const testingAi = aiRows.find((staff) => staff.status === "testing");

      setAiStaffRows(aiRows);
      setTestRuns(runRows);
      setCreditBalance((creditResult.data ?? null) as CreditBalanceRow | null);
      setWebsiteChatSettings(
        (websiteChatResult.data ?? null) as WebsiteChatSettingsRow | null
      );
      setKnowledgeCount(knowledgeResult.count ?? 0);

      if (aiRows.length > 0) {
        setSelectedAiStaffId(
          matchedAiId || liveAi?.id || testingAi?.id || aiRows[0].id
        );
      }

      setIsLoadingData(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [workspace?.id, reloadKey]);

  const selectedAiStaff = useMemo(() => {
    return aiStaffRows.find((staff) => staff.id === selectedAiStaffId) ?? null;
  }, [aiStaffRows, selectedAiStaffId]);

  const selectedAiLatestTest = useMemo(() => {
    if (!selectedAiStaff) return null;

    return (
      testRuns.find((run) => run.ai_staff_id === selectedAiStaff.id) ?? null
    );
  }, [testRuns, selectedAiStaff]);

  const hasActivePlan =
    workspaceState.status === "trial" || workspaceState.status === "active";

  const hasBusinessDetails = Boolean(
    businessProfile?.business_name &&
      (businessProfile?.business_email || businessProfile?.business_type)
  );

  const hasAiStaff = Boolean(selectedAiStaff);
  const hasSavedTest = Boolean(selectedAiLatestTest);
  const hasCreditBalance = Boolean(creditBalance);
  const hasCredits = Number(creditsLeft || 0) > 0;
  const hasBusinessKnowledge = knowledgeCount > 0;

  const websiteChatConfigured = Boolean(
    websiteChatSettings?.selected_ai_staff_id &&
      websiteChatSettings?.widget_title &&
      websiteChatSettings?.widget_subtitle
  );

  const websiteChatAutoReplyReady = Boolean(
    websiteChatSettings?.is_active &&
      websiteChatSettings?.ai_enabled &&
      websiteChatSettings?.auto_reply_enabled &&
      websiteChatSettings?.selected_ai_staff_id
  );

  const hasWhatsappNumber = Boolean(businessProfile?.whatsapp_number);
  const hasCustomerChannelReady = websiteChatAutoReplyReady || hasWhatsappNumber;

  const selectedAutoReplyCredits = getAutoReplyMinimumCredits(
    selectedAiStaff?.channel
  );

  const selectedAutoReplyCostNote = getAutoReplyCostNote(
    selectedAiStaff?.channel
  );

  const requiredReady =
    hasActivePlan &&
    hasBusinessDetails &&
    hasAiStaff &&
    hasSavedTest &&
    hasCreditBalance &&
    hasCredits &&
    hasBusinessKnowledge &&
    hasCustomerChannelReady;

  const checklist = [
    {
      label: "Active plan or trial",
      description: "Your workspace must have an active trial or subscription.",
      ready: hasActivePlan,
      type: "Required",
      actionHref: "/dashboard/billing",
      actionLabel: "Open Billing",
    },
    {
      label: "Business profile ready",
      description: "Business name and business contact details should be saved.",
      ready: hasBusinessDetails,
      type: "Required",
      actionHref: "/dashboard/business-overview",
      actionLabel: "Open Business Overview",
    },
    {
      label: "AI staff created",
      description: "At least one AI staff member must exist.",
      ready: hasAiStaff,
      type: "Required",
      actionHref: "/dashboard/create-ai",
      actionLabel: "Create AI Staff",
    },
    {
      label: "AI test completed",
      description:
        "Run a test reply before going live so the AI response quality is checked.",
      ready: hasSavedTest,
      type: "Required",
      actionHref: selectedAiStaff
        ? `/dashboard/test-ai?ai=${selectedAiStaff.id}`
        : "/dashboard/test-ai",
      actionLabel: "Test AI",
    },
    {
      label: "Business knowledge added",
      description:
        "Add FAQs, prices, policies, services, or business rules so AI can answer accurately.",
      ready: hasBusinessKnowledge,
      type: "Required",
      actionHref: "/dashboard/knowledge-base",
      actionLabel: "Add Knowledge",
    },
    {
      label: "Credits available",
      description:
        "Auto-replies and AI suggestions use credits. Keep credits available before going live.",
      ready: hasCreditBalance && hasCredits,
      type: "Required",
      actionHref: "/dashboard/top-up",
      actionLabel: "Top Up",
    },
    {
      label: "Customer channel ready",
      description:
        "Turn on Website Chat auto-reply or add a WhatsApp number before activating automation.",
      ready: hasCustomerChannelReady,
      type: "Required",
      actionHref: "/dashboard/integrations/website-chat",
      actionLabel: "Open Website Chat",
    },
    {
      label: "Website Chat configured",
      description:
        "Widget text, selected AI staff, and Website Chat settings should be saved.",
      ready: websiteChatConfigured,
      type: "Recommended",
      actionHref: "/dashboard/integrations/website-chat",
      actionLabel: "Open Website Chat",
    },
    {
      label: "WhatsApp number added",
      description:
        "Recommended if you want AI replies and handover support through WhatsApp.",
      ready: hasWhatsappNumber,
      type: "Recommended",
      actionHref: "/dashboard/integrations/whatsapp",
      actionLabel: "Open WhatsApp",
    },
  ];

  const summaryCards = [
    {
      label: "Current Plan",
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: <WalletCards className="h-7 w-7" />,
    },
    {
      label: "AI Staff",
      value: `${aiStaffRows.length}`,
      note: getAiStaffLimitLabel(currentPlan),
      icon: <Bot className="h-7 w-7" />,
    },
    {
      label: "Credits Left",
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `Credits used: ${usedCredits.toLocaleString()}`
        : "Credit balance has not been created yet.",
      icon: <CreditCard className="h-7 w-7" />,
      dark: true,
    },
    {
      label: "AI Reply Cost",
      value: `${selectedAutoReplyCredits} Credits`,
      note: selectedAutoReplyCostNote,
      icon: <Zap className="h-7 w-7" />,
    },
    {
      label: "Go Live Status",
      value: statusLabel(workspaceState.goLiveStatus),
      note: `WhatsApp: ${statusLabel(workspaceState.whatsappStatus)}`,
      icon: <ShieldCheck className="h-7 w-7" />,
    },
  ];

  async function handleActivate() {
    setActivateMessage("");
    setActivateError("");

    if (!workspace || !selectedAiStaff || !requiredReady) {
      setActivateError(
        "Complete the required setup items before activating your AI."
      );
      return;
    }

    setIsActivating(true);

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error: aiError } = await supabase
      .from("ai_staff")
      .update({
        status: "live",
        updated_at: now,
      })
      .eq("id", selectedAiStaff.id)
      .eq("workspace_id", workspace.id);

    if (aiError) {
      setActivateError(aiError.message || "AI staff could not be activated.");
      setIsActivating(false);
      return;
    }

    const { error: workspaceError } = await supabase
      .from("business_workspaces")
      .update({
        go_live_status: "live",
        live_ai_staff_id: selectedAiStaff.id,
        go_live_activated_at: now,
        updated_at: now,
      })
      .eq("id", workspace.id);

    if (workspaceError) {
      setActivateError(
        workspaceError.message || "Workspace could not be marked live."
      );
      setIsActivating(false);
      return;
    }

    setAiStaffRows((current) =>
      current.map((staff) =>
        staff.id === selectedAiStaff.id
          ? { ...staff, status: "live", updated_at: now }
          : staff
      )
    );

    setActivateMessage(
      "AI staff is now live in your workspace. Channel auto-reply controls remain managed inside Website Chat and WhatsApp settings."
    );
    setIsActivating(false);
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading Go Live setup...
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
            <p className="text-xl font-black">Go Live page could not load.</p>
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
            <Rocket className="h-5 w-5" />
            Go Live
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Review your AI setup before going live.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Check your plan, credits, AI staff, saved test, business knowledge,
            Website Chat setup, and customer channels before activating AI for
            your workspace.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              note={card.note}
              dark={card.dark}
            />
          ))}
        </div>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Zap className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Important Credit Rule
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                When auto-reply is live, every successful AI reply uses credits.
                Website Chat replies use 3 credits. WhatsApp replies
                use 5 credits.
              </h2>

              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                <CreditRuleCard text="Website Chat AI reply uses 3 credits." />
                <CreditRuleCard text="WhatsApp AI reply uses 5 credits." />
                <CreditRuleCard text="If credits run out, auto-reply should pause until top-up or upgrade." />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Link
                  href="/dashboard/usage"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white"
                >
                  <BarChart3 className="h-5 w-5" />
                  Usage
                </Link>

                <Link
                  href="/dashboard/top-up"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-base font-black text-[#07111F]"
                >
                  <WalletCards className="h-5 w-5" />
                  Top Up
                </Link>

                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white"
                >
                  <CreditCard className="h-5 w-5" />
                  Billing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {isLoadingData ? (
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading Go Live setup...
          </div>
        ) : dataError ? (
          <div className="rounded-[2.2rem] border border-red-200 bg-red-50 p-8 text-xl font-black text-red-700">
            {dataError}
          </div>
        ) : aiStaffRows.length === 0 ? (
          <NoAiStaffState />
        ) : (
          <>
            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Bot className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Select AI Staff
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  Choose which AI staff you want to activate.
                </h2>

                <div className="mt-8 grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      AI Staff
                    </span>

                    <select
                      value={selectedAiStaffId}
                      onChange={(event) => {
                        setSelectedAiStaffId(event.target.value);
                        setActivateMessage("");
                        setActivateError("");
                      }}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    >
                      {aiStaffRows.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} — {staff.role}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedAiStaff ? (
                    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                        Selected AI
                      </p>

                      <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                        {selectedAiStaff.name}
                      </h3>

                      <p className="mt-2 text-lg font-semibold leading-8 text-slate-600">
                        {selectedAiStaff.role} •{" "}
                        {selectedAiStaff.channel || "General"} •{" "}
                        {selectedAiStaff.reply_tone || "Professional"}
                      </p>

                      <p className="mt-4 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]">
                        {statusLabel(selectedAiStaff.status)}
                      </p>

                      <p className="mt-4 rounded-2xl bg-white p-4 text-base font-black leading-7 text-slate-700">
                        Minimum AI reply cost for this channel:{" "}
                        {selectedAutoReplyCredits} credits
                      </p>
                    </div>
                  ) : null}

                  <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                      Latest Saved Test
                    </p>

                    {selectedAiLatestTest ? (
                      <>
                        <p className="mt-3 text-lg font-semibold leading-8 text-slate-700">
                          {selectedAiLatestTest.customer_message}
                        </p>

                        <p className="mt-3 flex items-center gap-2 text-sm font-black text-slate-500">
                          <Clock3 className="h-4 w-4" />
                          {formatDate(selectedAiLatestTest.created_at)}
                        </p>
                      </>
                    ) : (
                      <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                        <p className="text-lg font-black">
                          No saved test found for this AI yet.
                        </p>
                        <p className="mt-2 text-base font-semibold leading-7">
                          Test this AI before going live so you can review its
                          response quality.
                        </p>

                        <Link
                          href={
                            selectedAiStaff
                              ? `/dashboard/test-ai?ai=${selectedAiStaff.id}`
                              : "/dashboard/test-ai"
                          }
                          className="mt-5 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                        >
                          Test AI
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <ShieldCheck className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Go-Live Readiness
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  Complete the required items before activating AI.
                </h2>

                <div className="mt-8 grid gap-4">
                  {checklist.map((item) => (
                    <ChecklistRow
                      key={item.label}
                      label={item.label}
                      description={item.description}
                      ready={item.ready}
                      type={item.type}
                      actionHref={item.actionHref}
                      actionLabel={item.actionLabel}
                    />
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-8 grid gap-6 lg:grid-cols-3">
              <ChannelCard
                icon={<Globe2 className="h-7 w-7" />}
                title="Website Chat"
                status={websiteChatAutoReplyReady ? "Ready" : "Needs setup"}
                text={
                  websiteChatAutoReplyReady
                    ? "Website Chat is active with AI support and auto-reply enabled."
                    : "Open Website Chat settings to select AI staff, activate chat, and turn on auto-reply."
                }
                href="/dashboard/integrations/website-chat"
                action="Open Website Chat"
              />

              <ChannelCard
                icon={<Smartphone className="h-7 w-7" />}
                title="WhatsApp"
                status={hasWhatsappNumber ? "Number added" : "Not ready"}
                text={
                  hasWhatsappNumber
                    ? "A WhatsApp number is saved for this workspace."
                    : "Connect or add a WhatsApp number before using WhatsApp automation."
                }
                href="/dashboard/integrations/whatsapp"
                action="Open WhatsApp"
              />

              <ChannelCard
                icon={<MessageCircle className="h-7 w-7" />}
                title="Inbox"
                status="Ready"
                text="Inbox is your control room for conversations, handover, leads, and saved replies."
                href="/dashboard/inbox"
                action="Open Inbox"
              />
            </section>

            <section className="mt-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                    <Rocket className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                    Activate AI
                  </p>

                  <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                    Activate this AI staff when your setup is ready.
                  </h2>

                  <p className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5 text-base font-semibold leading-8 text-slate-300">
                    Minimum AI reply cost: {selectedAutoReplyCredits} credits •
                    Total credits: {totalCredits.toLocaleString()} •{" "}
                    {creditsLeft === null
                      ? "Credit balance has not been created yet."
                      : `Credits left: ${creditsLeft.toLocaleString()}`}
                  </p>

                  {activateMessage ? (
                    <p className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5 text-lg font-black text-green-800">
                      {activateMessage}
                    </p>
                  ) : null}

                  {activateError ? (
                    <p className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-lg font-black text-red-700">
                      {activateError}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={isActivating || !requiredReady}
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Rocket className="h-6 w-6" />
                    {isActivating ? "Activating..." : "Activate AI"}
                  </button>

                  {selectedAiStaff ? (
                    <Link
                      href={`/dashboard/test-ai?ai=${selectedAiStaff.id}`}
                      className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
                    >
                      <TestTube2 className="h-6 w-6" />
                      Test AI
                    </Link>
                  ) : null}

                  <Link
                    href="/dashboard/top-up"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
                  >
                    Top Up
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                </div>
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
  dark = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
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
    </div>
  );
}

function CreditRuleCard({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-lg font-black text-[#7CFF3D]">{text}</p>
    </div>
  );
}

function ChecklistRow({
  label,
  description,
  ready,
  type,
  actionHref,
  actionLabel,
}: {
  label: string;
  description: string;
  ready: boolean;
  type: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            ready ? "bg-[#07111F] text-[#7CFF3D]" : "bg-amber-100 text-amber-700"
          }`}
        >
          {ready ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <CircleAlert className="h-6 w-6" />
          )}
        </div>

        <div>
          <p className="text-xl font-black">{label}</p>
          <p className="mt-1 text-base font-semibold leading-7 text-slate-600">
            {description}
          </p>
          <p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
            {type} • {ready ? "Complete" : "Needs action"}
          </p>
        </div>
      </div>

      {!ready ? (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function ChannelCard({
  icon,
  title,
  status,
  text,
  href,
  action,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        {icon}
      </div>

      <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
        {title}
      </p>

      <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">{status}</h3>

      <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
        {text}
      </p>

      <Link
        href={href}
        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
      >
        {action}
        <ArrowRight className="h-5 w-5" />
      </Link>
    </div>
  );
}

function NoAiStaffState() {
  return (
    <section className="rounded-[2.2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        <Bot className="h-8 w-8" />
      </div>

      <h2 className="text-4xl font-black tracking-[-0.05em]">
        No AI staff found yet.
      </h2>

      <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
        Create at least one AI staff member before using Go Live.
      </p>

      <Link
        href="/dashboard/create-ai"
        className="mt-7 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white"
      >
        Create AI Staff
        <ArrowRight className="h-6 w-6" />
      </Link>
    </section>
  );
}