"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CreditCard,
  ExternalLink,
  FileText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan, KOLKAP_PRICE_NOTE } from "@/lib/kolkapPlan";
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
};

type BillingHistoryItem = {
  id: string;
  type: "subscription" | "topup";
  description: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string;
  document_url: string | null;
  document_label: "View Invoice" | "View Receipt";
};

const statusLabels: Record<string, string> = {
  trial: "Trial",
  active: "Active",
  past_due: "Payment Due",
  cancelled: "Cancelled",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

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

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: String(currency || "AUD").toUpperCase(),
    }).format(Number(amountCents || 0) / 100);
  } catch {
    return `A$${(Number(amountCents || 0) / 100).toFixed(2)}`;
  }
}

function formatStatus(status: string) {
  return String(status || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function BillingPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const workspaceRecord = (workspace ?? null) as WorkspaceBillingRecord | null;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelAt, setCancelAt] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const creditsLeft = getCreditsLeft(creditBalance);
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

  const billingDate = isTrial
    ? workspaceRecord?.trial_ends_at || creditBalance?.billing_period_end || null
    : workspaceRecord?.billing_current_period_end ||
      creditBalance?.billing_period_end ||
      null;

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
      setCreditError("We could not refresh your credit balance. Please try again.");
      setIsLoadingCredits(false);
      return;
    }

    setCreditBalance((data ?? null) as CreditBalanceRow | null);
    setIsLoadingCredits(false);
  }

  async function loadBillingHistory() {
    if (!workspace?.id) return;

    setIsLoadingHistory(true);
    setHistoryError("");

    try {
      const response = await fetch(
        `/api/billing/history?workspace_id=${encodeURIComponent(workspace.id)}`,
        { cache: "no-store" }
      );
      const result = (await response.json().catch(() => ({}))) as {
        items?: BillingHistoryItem[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Billing history could not be loaded.");
      }

      setBillingHistory(Array.isArray(result.items) ? result.items : []);
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Billing history could not be loaded right now."
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function refreshBilling() {
    loadCreditBalance();
    loadBillingHistory();
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceRecord.id }),
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
          "Cancellation has been scheduled. You can continue using Kolkap until the current trial or billing period ends."
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
    const loadTimer = window.setTimeout(() => {
      loadCreditBalance();
      loadBillingHistory();
    }, 0);

    return () => window.clearTimeout(loadTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your billing details...
          </div>
        </section>
      </main>
    );
  }

  if (workspaceState.error) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700">
            <p className="text-xl font-black">Billing could not load.</p>
            <p className="mt-2 text-base font-semibold">
              Please refresh the page and try again.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={refreshBilling}
              disabled={isLoadingCredits || isLoadingHistory}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCcw className="h-5 w-5" />
              {isLoadingCredits || isLoadingHistory ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Billing
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Billing and subscription.
          </h1>
          <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
            Review your current plan, billing status, and subscription controls.
          </p>
        </div>

        {creditError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{creditError}</p>
          </div>
        ) : null}

        <section className="mb-8 overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <CreditCard className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                    Current Subscription
                  </p>
                  <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                    {currentPlan.name}
                  </h2>
                  <p className="mt-2 text-xl font-black text-slate-600">
                    {currentPlan.priceLabel}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-[#E9FFD9] px-5 py-3 text-sm font-black text-[#214E0B]">
                  {statusLabels[workspaceStatus] || workspaceStatus}
                </span>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <SummaryItem
                  label="Credits Left"
                  value={creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
                />
                <SummaryItem
                  label={
                    cancellationScheduled
                      ? "Access Ends"
                      : isTrial
                        ? "Trial Ends"
                        : "Next Billing Date"
                  }
                  value={formatDate(
                    cancellationScheduled ? effectiveCancelAt : billingDate
                  )}
                  icon={CalendarDays}
                />
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">
                {KOLKAP_PRICE_NOTE}
              </p>
            </div>

            <div className="bg-[#07111F] p-6 text-white sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Quick Links
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                Manage related account areas.
              </h3>

              <div className="mt-6 grid gap-3">
                <BillingLink href="/pricing" label="View Pricing" icon={ShieldCheck} />
                <BillingLink
                  href="/dashboard/top-up"
                  label="Top Up Credits"
                  icon={WalletCards}
                />
                <BillingLink
                  href="/dashboard/usage"
                  label="View Usage"
                  icon={BarChart3}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <FileText className="h-7 w-7" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                Payments &amp; Invoices
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                Your billing history.
              </h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-slate-500">
              Subscription invoices and credit top-up receipts appear here after
              Stripe confirms payment.
            </p>
          </div>

          <div className="mt-7">
            {isLoadingHistory ? (
              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6 text-base font-black text-slate-600">
                Loading payment history...
              </div>
            ) : historyError ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                <p className="text-base font-black">{historyError}</p>
              </div>
            ) : billingHistory.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6">
                <p className="text-lg font-black text-[#07111F]">No payments yet.</p>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                  Your first invoice or receipt will appear here after a
                  successful payment. A free trial does not create a paid receipt.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {billingHistory.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#07111F]">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-black text-[#07111F]">
                          {item.description}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {formatDate(item.paid_at)} · {formatStatus(item.status)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <p className="text-lg font-black text-[#07111F]">
                        {formatMoney(item.amount_cents, item.currency)}
                      </p>
                      {item.document_url ? (
                        <a
                          href={item.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
                        >
                          {item.document_label}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-4 py-2 text-xs font-black text-slate-600">
                          Receipt processing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                Subscription Control
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                Manage your subscription.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
                If you cancel, your workspace remains available until the end of
                the current trial or billing period.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
              {cancellationScheduled ? (
                <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                  <p className="text-lg font-black">Cancellation Scheduled</p>
                  <p className="mt-2 text-base font-semibold leading-7">
                    Your access remains available until {formatDate(effectiveCancelAt)}.
                    You will not be charged again after cancellation takes effect.
                  </p>
                </div>
              ) : null}

              {cancelMessage ? (
                <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                  <p className="text-base font-black">{cancelMessage}</p>
                  {effectiveCancelAt ? (
                    <p className="mt-2 text-sm font-black">
                      Access ends: {formatDate(effectiveCancelAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {cancelError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
                  <p className="text-base font-black">Cancellation failed</p>
                  <p className="mt-2 text-base font-semibold leading-7">{cancelError}</p>
                </div>
              ) : null}

              {!isActiveOrTrial ? (
                <p className="rounded-3xl border border-slate-200 bg-white p-5 text-base font-black leading-7 text-slate-700">
                  No active subscription is connected to this workspace.
                </p>
              ) : showCancelConfirm ? (
                <div>
                  <p className="text-xl font-black text-[#07111F]">
                    Confirm Cancellation
                  </p>
                  <p className="mt-3 text-base font-semibold leading-7 text-slate-700">
                    Do you want to schedule cancellation? You can continue using
                    Kolkap until the current trial or billing period ends.
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
                      {isCancelling ? "Scheduling..." : "Yes, Schedule Cancellation"}
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
                  disabled={cancellationScheduled}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-6 py-4 text-base font-black text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle className="h-5 w-5" />
                  {isTrial
                    ? "Schedule Trial Cancellation"
                    : "Schedule Subscription Cancellation"}
                </button>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon = CreditCard,
}: {
  label: string;
  value: string;
  icon?: typeof CreditCard;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#07111F]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-black text-slate-500">{label}</p>
        <p className="mt-1 text-xl font-black text-[#07111F]">{value}</p>
      </div>
    </div>
  );
}

function BillingLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof CreditCard;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-base font-black text-white transition hover:bg-white/10"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[#7CFF3D]" />
        {label}
      </span>
      <ArrowRight className="h-5 w-5" />
    </Link>
  );
}
