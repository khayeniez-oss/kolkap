"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  getPlanTeamMemberLabel,
  kolkapTopUpPackages,
  KOLKAP_PRICE_NOTE,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

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

type WorkspaceBillingRecord = {
  id?: string;
  subscription_cancel_at?: string | null;
  subscription_cancelled_at?: string | null;
  billing_current_period_end?: string | null;
  trial_ends_at?: string | null;
  plan_status?: string | null;
  billing_status?: string | null;
};

const publicPlanKeys: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
];

const statusLabels: Record<string, string> = {
  trial: "Trial",
  active: "Active",
  past_due: "Past Due",
  cancelled: "Cancelled",
};

const creditRules: [string, string][] = [
  ["Test AI Reply", "3 credits"],
  ["Inbox AI Reply", "3 credits"],
  ["Content Studio Generation", "5 credits"],
  ["Website Chat AI Reply", "from 3 credits"],
  ["WhatsApp AI Reply", "from 5 credits"],
  ["Longer replies / campaign content", "more credits"],
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function getStatusLabel(value: string) {
  return statusLabels[value] || value;
}

export default function BillingPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const workspaceRecord = (workspace ?? null) as WorkspaceBillingRecord | null;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelAt, setCancelAt] = useState<string | null>(
    workspaceRecord?.subscription_cancel_at || null
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const creditsLeft = getCreditsLeft(creditBalance);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const usedCredits = Number(creditBalance?.used_credits || 0);

  const workspaceStatus = workspaceState.status;
  const isTrial = workspaceStatus === "trial";
  const isActiveOrTrial =
    workspaceStatus === "trial" ||
    workspaceStatus === "active" ||
    workspaceStatus === "past_due";

  const effectiveCancelAt =
    cancelAt ||
    workspaceRecord?.subscription_cancel_at ||
    workspaceRecord?.subscription_cancelled_at ||
    null;

  const cancellationScheduled = Boolean(effectiveCancelAt);

  async function loadCreditBalance() {
    if (!workspace?.id) return;

    setIsLoadingCredits(true);
    setCreditError("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("workspace_credit_balances")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (error) {
      setCreditError(error.message);
      setIsLoadingCredits(false);
      return;
    }

    setCreditBalance((data ?? null) as CreditBalanceRow | null);
    setIsLoadingCredits(false);
  }

  async function handleCancelSubscription() {
    setCancelError("");
    setCancelMessage("");

    if (!workspaceRecord?.id) {
      setCancelError("No active subscription is connected to this workspace yet.");
      return;
    }

    try {
      setIsCancelling(true);

      const response = await fetch("/api/billing/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspace_id: workspaceRecord.id,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        cancel_at?: string | null;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "No active subscription is connected to this workspace yet."
        );
      }

      setCancelAt(result.cancel_at || null);
      setCancelMessage(
        result.message ||
          "Cancellation has been scheduled. You can continue using Kolkap until the trial or billing period ends."
      );
      setShowCancelConfirm(false);
    } catch (error) {
      setCancelError(
        error instanceof Error
          ? error.message
          : "No active subscription is connected to this workspace yet."
      );
    } finally {
      setIsCancelling(false);
    }
  }

  useEffect(() => {
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  useEffect(() => {
    if (workspaceRecord?.subscription_cancel_at) {
      setCancelAt(workspaceRecord.subscription_cancel_at);
    }
  }, [workspaceRecord?.subscription_cancel_at]);

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your billing details...
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
            <p className="text-xl font-black">Billing could not load.</p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const summaryCards = [
    {
      label: "Current Plan",
      value: creditBalance?.plan_name || currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: "Plan Status",
      value: getStatusLabel(workspaceState.status),
      note:
        workspaceState.status === "trial"
          ? `${workspaceState.trialDaysRemaining} Trial Days Left`
          : "Monthly billing starts after trial unless cancelled.",
      icon: ShieldCheck,
    },
    {
      label: "Credits Left",
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? "Remaining balance"
        : "Credit balance has not been created for this workspace yet.",
      icon: CreditCard,
      dark: true,
    },
    {
      label: "Credits Used",
      value: usedCredits.toLocaleString(),
      note: "Used from balance",
      icon: Zap,
    },
    {
      label: "AI Staff Limit",
      value: getPlanAIStaffLabel(currentPlan),
      note: currentPlan.name,
      icon: Bot,
    },
    {
      label: "Team Limit",
      value: getPlanTeamMemberLabel(currentPlan),
      note: currentPlan.name,
      icon: UsersRound,
    },
  ];

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
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={loadCreditBalance}
              disabled={isLoadingCredits}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCcw className="h-5 w-5" />
              {isLoadingCredits ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Billing
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Manage your Kolkap plan, trial, credits, and billing.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            View your current plan, trial status, monthly credits, top-up
            credits, billing details, upgrade options, and cancellation status.
          </p>

          <p className="mt-5 text-base font-bold leading-7 text-slate-400">
            {KOLKAP_PRICE_NOTE}
          </p>
        </div>

        {creditError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{creditError}</p>
          </div>
        ) : null}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
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
              </div>
            );
          })}
        </div>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <CreditCard className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Billing Summary
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Your billing page shows your active package, trial details,
                credits, and account status.
              </h2>
            </div>

            <div className="rounded-[2rem] bg-[#07111F] p-7 text-white">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {creditBalance?.plan_name || currentPlan.name}
              </p>

              <h3 className="mt-3 text-5xl font-black tracking-[-0.06em]">
                {currentPlan.priceLabel}
              </h3>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                {getPlanCreditLabel(currentPlan)} •{" "}
                {getPlanAIStaffLabel(currentPlan)} •{" "}
                {getPlanTeamMemberLabel(currentPlan)}
              </p>

              <div className="mt-6 grid gap-3 rounded-3xl bg-white/5 p-5">
                <BillingRow label="Plan Credits" value={planCredits} />
                <BillingRow label="Top-Up Credits" value={purchasedCredits} />
                <BillingRow label="Credits Used" value={usedCredits} />
                <BillingRow
                  label="Credits Left"
                  value={creditsLeft === null ? "—" : creditsLeft}
                  highlight
                />
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/dashboard/top-up"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-lg font-black text-[#07111F]"
                >
                  <WalletCards className="h-5 w-5" />
                  Top Up Credits
                </Link>

                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-lg font-black text-white"
                >
                  <TrendingUp className="h-5 w-5" />
                  Upgrade Plan
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Manage Your Plan
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                You are always in control of your Kolkap plan.
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                You can keep building, upgrade when you need more capacity, or
                schedule cancellation before the next billing period.
              </p>

              {cancellationScheduled ? (
                <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                  <p className="text-base font-black">
                    Cancellation Scheduled
                  </p>
                  <p className="mt-2 text-base font-semibold leading-7">
                    Your Kolkap access remains available until the current trial
                    or billing period ends. You will not be charged again after
                    cancellation takes effect.
                  </p>
                  <p className="mt-3 text-sm font-black">
                    Ends on: {formatDate(effectiveCancelAt)}
                  </p>
                </div>
              ) : null}

              {cancelMessage ? (
                <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                  <p className="text-base font-black">
                    Cancellation has been scheduled. You can continue using
                    Kolkap until the trial or billing period ends.
                  </p>
                  {effectiveCancelAt ? (
                    <p className="mt-2 text-sm font-black">
                      Ends on: {formatDate(effectiveCancelAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {cancelError ? (
                <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
                  <p className="text-base font-black">Cancellation failed</p>
                  <p className="mt-2 text-base font-semibold leading-7">
                    {cancelError}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-5">
              <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Sparkles className="h-7 w-7" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Keep building with Kolkap
                </p>

                <p className="mt-3 text-lg font-semibold leading-8 text-slate-700">
                  Your AI staff, inbox, leads, business knowledge, and credit
                  history stay inside your workspace so your business can
                  continue smoothly.
                </p>

                <Link
                  href="/dashboard"
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white transition hover:-translate-y-0.5"
                >
                  Continue with Kolkap
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-[#07111F]">
                  <HelpCircle className="h-7 w-7" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-slate-500">
                  Need to stop your plan?
                </p>

                <p className="mt-3 text-lg font-semibold leading-8 text-slate-700">
                  You can schedule cancellation anytime. Your workspace remains
                  available until the current trial or billing period ends.
                </p>

                {!isActiveOrTrial ? (
                  <p className="mt-6 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-base font-black leading-7 text-slate-700">
                    No active subscription is connected to this workspace yet.
                  </p>
                ) : null}

                {showCancelConfirm ? (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                    <p className="text-xl font-black text-[#07111F]">
                      Confirm Cancellation
                    </p>

                    <p className="mt-3 text-base font-semibold leading-7 text-slate-700">
                      Do you want to schedule cancellation for this plan? You can
                      still use Kolkap until the current trial or billing period
                      ends.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={isCancelling}
                        className="rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white disabled:opacity-60"
                      >
                        Keep My Plan
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                        className="rounded-full border border-slate-300 bg-white px-6 py-4 text-base font-black text-slate-700 disabled:opacity-60"
                      >
                        {isCancelling
                          ? "Scheduling cancellation..."
                          : "Yes, Schedule Cancellation"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError("");
                      setCancelMessage("");
                      setShowCancelConfirm(true);
                    }}
                    disabled={!isActiveOrTrial || cancellationScheduled}
                    className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-6 py-4 text-lg font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <XCircle className="h-5 w-5" />
                    {isTrial
                      ? "Schedule Trial Cancellation"
                      : "Schedule Subscription Cancellation"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <HelpCircle className="h-8 w-8" />
            </div>

            <div className="w-full">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                How Credits Are Used
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                Kolkap uses credits only when AI successfully generates or sends
                output.
              </h2>

              <div className="mt-7 grid gap-3 lg:grid-cols-2">
                {creditRules.map(([action, cost]) => (
                  <div
                    key={action}
                    className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-[#7CFF3D]" />
                      <p className="text-base font-black text-white">
                        {action}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                      {cost}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CalendarDays className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                7-Day Free Trial
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                Payment method needed to activate your trial. You will not be
                charged today. Monthly billing starts after the trial unless
                cancelled before the trial ends.
              </h2>

              {creditBalance ? (
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                  Billing Period:{" "}
                  {formatDate(creditBalance.billing_period_start)} —{" "}
                  {formatDate(creditBalance.billing_period_end)}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
                  Payment method needed
                </span>

                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
                  No charge today
                </span>

                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
                  Monthly billing starts after trial unless cancelled.
                </span>

                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
                  AUD pricing incl. GST
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Available Plans
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              Choose a package based on how many AI staff, team members, and
              monthly credits your business needs.
            </h2>

            <p className="mt-4 text-base font-bold leading-7 text-slate-600">
              {KOLKAP_PRICE_NOTE}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
            {publicPlanKeys.map((planKey) => {
              const plan = getKolkapPlan(planKey);
              const isCurrent =
                plan.key === workspaceState.planKey ||
                (workspaceState.planKey === "pro" &&
                  plan.key === "professional");

              return (
                <div
                  key={plan.key}
                  className={`rounded-[2rem] border p-6 ${
                    isCurrent
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-[#F7F9FA] text-[#07111F]"
                  }`}
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isCurrent
                        ? "bg-[#7CFF3D] text-[#07111F]"
                        : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-2xl font-black">
                    {plan.priceLabel}
                  </p>

                  <p
                    className={`mt-4 text-base font-semibold leading-7 ${
                      isCurrent ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mt-6 grid gap-3">
                    <FeatureItem
                      text={getPlanCreditLabel(plan)}
                      isCurrent={isCurrent}
                    />
                    <FeatureItem
                      text={getPlanAIStaffLabel(plan)}
                      isCurrent={isCurrent}
                    />
                    <FeatureItem
                      text={getPlanTeamMemberLabel(plan)}
                      isCurrent={isCurrent}
                    />
                    {plan.cardRequiredForTrial ? (
                      <FeatureItem
                        text="Payment method needed"
                        isCurrent={isCurrent}
                      />
                    ) : null}
                  </div>

                  <div className="mt-7">
                    {isCurrent ? (
                      <span className="inline-flex w-full items-center justify-center rounded-full bg-[#7CFF3D] px-6 py-4 text-lg font-black text-[#07111F]">
                        Current
                      </span>
                    ) : (
                      <Link
                        href={
                          plan.key === "enterprise"
                            ? "/contact"
                            : `/dashboard/activate-trial?plan=${plan.key}`
                        }
                        className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white"
                      >
                        {plan.key === "enterprise"
                          ? "Contact Us"
                          : "Start 7-Day Trial"}
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Top-Up Credit Packages
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              Use top-up credits when your business needs extra AI replies or
              content generations before the next billing cycle.
            </h2>

            <p className="mt-4 text-base font-bold leading-7 text-slate-600">
              Top-up prices are in AUD and include GST.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {kolkapTopUpPackages.map((pack) => (
              <div
                key={pack.id}
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Zap className="h-7 w-7" />
                </div>

                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  A${pack.priceAud}
                </h3>

                <p className="mt-2 text-sm font-black text-blue-600">
                  Incl. GST
                </p>

                <p className="mt-2 text-xl font-black text-slate-700">
                  {pack.credits.toLocaleString()} credits
                </p>

                <Link
                  href="/dashboard/top-up"
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-5 py-4 text-base font-black text-white"
                >
                  Top Up Credits
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <FileText className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Invoices
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Your payment history and invoices will appear here once billing
                is activated.
              </h2>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                <Download className="h-7 w-7" />
              </div>

              <h3 className="text-3xl font-black tracking-[-0.04em]">
                Coming soon
              </h3>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                Invoices will be available after your first paid subscription or
                credit top-up.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function BillingRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
      <span className="text-sm font-black text-slate-300">{label}</span>
      <span
        className={`text-base font-black ${
          highlight ? "text-[#7CFF3D]" : "text-white"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

function FeatureItem({
  text,
  isCurrent,
}: {
  text: string;
  isCurrent: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2
        className={`mt-1 h-5 w-5 shrink-0 ${
          isCurrent ? "text-[#7CFF3D]" : "text-[#07111F]"
        }`}
      />
      <span className="text-base font-black">{text}</span>
    </div>
  );
}