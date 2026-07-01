"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CreditCard,
  Receipt,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type BillingFilter =
  | "all"
  | "active"
  | "trial"
  | "past_due"
  | "cancelled"
  | "failed"
  | "no_stripe";

type OwnerProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
};

type PlanSnapshot = {
  key: string;
  name: string;
  priceLabel: string;
  monthlyPriceAud: number | null;
  monthlyCredits: number | "custom";
  trialDays: number;
  aiStaffLimit: number | "custom";
  teamMemberLimit: number | "custom";
  whatsappNumberLimit: number | "custom";
  websiteChatLimit: number | "custom";
  legacyKey: boolean;
  recommended: boolean;
};

type CreditBalance = {
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
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

type CreditNumbers = {
  total: number;
  used: number;
  remaining: number;
};

type Topup = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  package_id: string;
  credits: number;
  amount_cents: number;
  currency: string;
  status: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  paid_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  workspace?: BillingWorkspace | null;
  owner?: OwnerProfile | null;
};

type TopupSummary = {
  totalTopups: number;
  paidTopups: number;
  failedTopups: number;
  cancelledTopups: number;
  paidCredits: number;
  paidAmountCents: number;
  latestTopup: Topup | null;
};

type BillingWorkspace = {
  id: string;
  owner_user_id: string;
  business_name: string | null;
  business_type: string | null;
  business_email: string | null;
  business_phone: string | null;
  country: string | null;
  plan_key: string;
  plan_status: string;
  credits_total: number;
  credits_used: number;
  ai_staff_used: number;
  created_at: string | null;
  updated_at: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_checkout_session_id: string | null;
  billing_status: string | null;
  billing_started_at: string | null;
  billing_current_period_start: string | null;
  billing_current_period_end: string | null;
  trial_activated_at: string | null;
  subscription_cancel_at: string | null;
  subscription_cancelled_at: string | null;
  subscription_updated_at: string | null;
  owner: OwnerProfile | null;
  plan_snapshot: PlanSnapshot | null;
  credit_balance: CreditBalance | null;
  credit_numbers: CreditNumbers;
  topup_summary: TopupSummary;
};

type BillingStats = {
  totalWorkspaces: number;
  activeBilling: number;
  trialBilling: number;
  pastDueBilling: number;
  cancelledBilling: number;
  failedBilling: number;
  withStripeCustomer: number;
  withoutStripeCustomer: number;
  potentialMonthlyRevenueAud: number;
  creditBalanceTotal: number;
  creditBalanceUsed: number;
  creditBalanceRemaining: number;
  totalTopups: number;
  paidTopups: number;
  failedTopups: number;
  cancelledTopups: number;
  paidTopupRevenueCents: number;
  paidTopupCredits: number;
};

type PaginationState = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  from: number;
  to: number;
};

const BILLING_FILTERS: { value: BillingFilter; label: string }[] = [
  { value: "all", label: "All Billing" },
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "past_due", label: "Past Due" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
  { value: "no_stripe", label: "No Stripe" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const EMPTY_STATS: BillingStats = {
  totalWorkspaces: 0,
  activeBilling: 0,
  trialBilling: 0,
  pastDueBilling: 0,
  cancelledBilling: 0,
  failedBilling: 0,
  withStripeCustomer: 0,
  withoutStripeCustomer: 0,
  potentialMonthlyRevenueAud: 0,
  creditBalanceTotal: 0,
  creditBalanceUsed: 0,
  creditBalanceRemaining: 0,
  totalTopups: 0,
  paidTopups: 0,
  failedTopups: 0,
  cancelledTopups: 0,
  paidTopupRevenueCents: 0,
  paidTopupCredits: 0,
};

const EMPTY_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  from: 0,
  to: 0,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function formatAud(value: number | null | undefined) {
  const safe = Number(value || 0);

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(safe) ? safe : 0);
}

function formatMoneyFromCents(
  cents: number | null | undefined,
  currency = "AUD"
) {
  const safeCents = Number(cents || 0);
  const safeCurrency = String(currency || "AUD").toUpperCase();

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: safeCurrency,
  }).format((Number.isFinite(safeCents) ? safeCents : 0) / 100);
}

function numberFormat(value: number | null | undefined) {
  const safe = Number(value || 0);

  return new Intl.NumberFormat("en-ID").format(
    Number.isFinite(safe) ? safe : 0
  );
}

function cleanLabel(value?: string | null, fallback = "-") {
  const clean = String(value || "").trim();

  if (!clean) return fallback;

  return clean
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getStatusClass(value?: string | null) {
  const clean = String(value || "").toLowerCase();

  if (
    clean.includes("active") ||
    clean.includes("paid") ||
    clean.includes("trialing") ||
    clean.includes("complete") ||
    clean.includes("success") ||
    clean.includes("succeeded")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    clean.includes("past") ||
    clean.includes("due") ||
    clean.includes("fail") ||
    clean.includes("error") ||
    clean.includes("cancel") ||
    clean.includes("inactive")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (clean.includes("trial") || clean.includes("pending") || clean.includes("draft")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatusBadge({
  value,
  fallback = "Not set",
}: {
  value?: string | null;
  fallback?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getStatusClass(
        value || fallback
      )}`}
    >
      {cleanLabel(value, fallback)}
    </span>
  );
}

function hasStripeData(workspace: BillingWorkspace) {
  return Boolean(
    workspace.stripe_customer_id ||
      workspace.stripe_subscription_id ||
      workspace.stripe_price_id ||
      workspace.stripe_checkout_session_id
  );
}

export default function KolkapAdminBillingPage() {
  const [workspaces, setWorkspaces] = useState<BillingWorkspace[]>([]);
  const [recentTopups, setRecentTopups] = useState<Topup[]>([]);
  const [stats, setStats] = useState<BillingStats>(EMPTY_STATS);
  const [pagination, setPagination] =
    useState<PaginationState>(EMPTY_PAGINATION);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filterLabel = useMemo(() => {
    return (
      BILLING_FILTERS.find((item) => item.value === billingFilter)?.label ||
      "All Billing"
    );
  }, [billingFilter]);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadBilling(
    nextSearch = search,
    nextBillingFilter = billingFilter,
    nextPage = page,
    nextPageSize = pageSize
  ) {
    try {
      setLoading(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        setWorkspaces([]);
        setRecentTopups([]);
        setStats(EMPTY_STATS);
        setPagination(EMPTY_PAGINATION);
        return;
      }

      const params = new URLSearchParams({
        search: nextSearch,
        billingFilter: nextBillingFilter,
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      const response = await fetch(`/api/admin/billing?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load billing data.");
      }

      setWorkspaces((result.workspaces || []) as BillingWorkspace[]);
      setRecentTopups((result.recentTopups || []) as Topup[]);
      setStats((result.stats || EMPTY_STATS) as BillingStats);
      setPagination((result.pagination || EMPTY_PAGINATION) as PaginationState);
    } catch (loadError) {
      console.error("Load Kolkap admin billing error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load billing data."));
    } finally {
      setLoading(false);
    }
  }

  function submitSearch() {
    const clean = searchInput.trim();

    setSearch(clean);
    setPage(1);
    loadBilling(clean, billingFilter, 1, pageSize);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
    loadBilling("", billingFilter, 1, pageSize);
  }

  function changeBillingFilter(nextBillingFilter: BillingFilter) {
    setBillingFilter(nextBillingFilter);
    setPage(1);
  }

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function goToPreviousPage() {
    if (!pagination.hasPreviousPage) return;
    setPage((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    if (!pagination.hasNextPage) return;
    setPage((prev) => prev + 1);
  }

  useEffect(() => {
    loadBilling(search, billingFilter, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingFilter, page, pageSize]);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Kolkap Admin
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Billing
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              Monitor Kolkap plans, trials, Stripe subscription status, billing
              periods, top-ups, credit balances, cancellations, and payment
              issues. This first version is view-only.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadBilling(search, billingFilter, page, pageSize)}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Workspaces
            </p>
            <p className="mt-2 text-3xl font-black">
              {numberFormat(stats.totalWorkspaces)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-500">
              Active Billing
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {numberFormat(stats.activeBilling)}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-500">
              Trials
            </p>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {numberFormat(stats.trialBilling)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
              Issues
            </p>
            <p className="mt-2 text-3xl font-black text-red-700">
              {numberFormat(stats.pastDueBilling + stats.failedBilling)}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
              Potential MRR
            </p>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {formatAud(stats.potentialMonthlyRevenueAud)}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-500">
              Paid Top-Ups
            </p>
            <p className="mt-2 text-3xl font-black text-purple-700">
              {numberFormat(stats.paidTopups)}
            </p>
          </div>

          <div className="rounded-2xl border border-lime-100 bg-lime-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-lime-600">
              Top-Up Revenue
            </p>
            <p className="mt-2 text-3xl font-black text-lime-700">
              {formatMoneyFromCents(stats.paidTopupRevenueCents, "AUD")}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-600">
              Credits Left
            </p>
            <p className="mt-2 text-3xl font-black text-cyan-700">
              {numberFormat(stats.creditBalanceRemaining)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Stripe Connected
            </p>
            <p className="mt-2 text-2xl font-black">
              {numberFormat(stats.withStripeCustomer)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              No Stripe
            </p>
            <p className="mt-2 text-2xl font-black">
              {numberFormat(stats.withoutStripeCustomer)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Cancelled
            </p>
            <p className="mt-2 text-2xl font-black">
              {numberFormat(stats.cancelledBilling)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Top-Up Credits
            </p>
            <p className="mt-2 text-2xl font-black">
              {numberFormat(stats.paidTopupCredits)}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex-1">
            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Search Billing
            </label>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitSearch();
                  }}
                  placeholder="Search business, email, phone, plan, status, or Stripe ID"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#07111F]"
                />
              </div>

              <button
                type="button"
                onClick={submitSearch}
                className="rounded-2xl bg-[#07111F] px-5 py-3 text-sm font-black text-white"
              >
                Search
              </button>

              <button
                type="button"
                onClick={clearSearch}
                className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-sm font-black text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Page Size
            </label>

            <select
              value={pageSize}
              onChange={(event) => changePageSize(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none xl:w-[150px]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Billing Filter
          </p>

          <div className="flex flex-wrap gap-2">
            {BILLING_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => changeBillingFilter(item.value)}
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                  billingFilter === item.value
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-[#F7F9FA]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-700" />

            <p className="text-sm font-bold leading-6 text-amber-900">
              This page is monitoring only. Do not manually change Stripe,
              subscription, or credit data here yet. Billing actions should stay
              inside Stripe webhook and billing APIs.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-black">Recent Top-Ups</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Latest credit top-up checkout/payment records.
            </p>
          </div>

          <div className="max-h-[760px] overflow-y-auto p-4">
            {recentTopups.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-5 text-center text-sm font-semibold text-slate-500">
                No top-ups yet.
              </div>
            ) : null}

            <div className="space-y-3">
              {recentTopups.map((topup) => (
                <div
                  key={topup.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#07111F]">
                        {topup.workspace?.business_name || "Unknown Workspace"}
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {topup.owner?.email || "-"}
                      </p>
                    </div>

                    <StatusBadge value={topup.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-black">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                      <p>{numberFormat(topup.credits)}</p>
                      <p className="mt-1 opacity-60">Credits</p>
                    </div>

                    <div className="rounded-xl bg-lime-50 p-3 text-lime-700">
                      <p>
                        {formatMoneyFromCents(
                          topup.amount_cents,
                          topup.currency
                        )}
                      </p>
                      <p className="mt-1 opacity-60">Amount</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-400">
                    Package: {topup.package_id}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Created: {formatDate(topup.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">Customer Billing</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Showing {filterLabel}
                  {search ? ` matching "${search}"` : ""}.
                </p>
              </div>

              {loading ? (
                <span className="text-sm font-bold text-slate-400">
                  Loading...
                </span>
              ) : null}
            </div>
          </div>

          {!loading && workspaces.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
              <div>
                <CreditCard className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  No billing records found for the current filter.
                </p>
              </div>
            </div>
          ) : null}

          {workspaces.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1250px] text-left">
                  <thead className="bg-[#F7F9FA] text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Business</th>
                      <th className="px-5 py-4">Owner</th>
                      <th className="px-5 py-4">Plan</th>
                      <th className="px-5 py-4">Billing</th>
                      <th className="px-5 py-4">Credits</th>
                      <th className="px-5 py-4">Top-Ups</th>
                      <th className="px-5 py-4">Stripe</th>
                      <th className="px-5 py-4">Period</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {workspaces.map((workspace) => (
                      <tr key={workspace.id} className="align-top">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                              <Building2 className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[230px] truncate text-sm font-black text-[#07111F]">
                                {workspace.business_name || "Unnamed Business"}
                              </p>

                              <p className="mt-1 max-w-[230px] truncate text-xs font-semibold text-slate-500">
                                {workspace.business_type || "Business type not set"}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {workspace.country || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-700">
                            {workspace.owner?.full_name || "No owner name"}
                          </p>

                          <p className="mt-1 max-w-[210px] truncate text-xs font-semibold text-slate-500">
                            {workspace.owner?.email ||
                              workspace.business_email ||
                              "-"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {workspace.business_phone || "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-700">
                            {workspace.plan_snapshot?.name ||
                              cleanLabel(workspace.plan_key, "No plan")}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {workspace.plan_snapshot?.priceLabel || "-"}
                          </p>

                          <div className="mt-2">
                            <StatusBadge
                              value={workspace.plan_status}
                              fallback="No plan status"
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <StatusBadge
                              value={workspace.billing_status}
                              fallback="No billing status"
                            />

                            <p className="text-xs font-semibold text-slate-500">
                              Trial ends: {formatDate(workspace.trial_ends_at)}
                            </p>

                            <p className="text-xs font-semibold text-slate-500">
                              Cancel at:{" "}
                              {formatDate(workspace.subscription_cancel_at)}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-3">
                            <p className="text-sm font-black text-[#07111F]">
                              {numberFormat(workspace.credit_numbers.remaining)}{" "}
                              left
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {numberFormat(workspace.credit_numbers.used)} used
                              / {numberFormat(workspace.credit_numbers.total)}{" "}
                              total
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {workspace.credit_balance?.plan_name ||
                                workspace.plan_snapshot?.name ||
                                "-"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-700">
                            {numberFormat(workspace.topup_summary.paidTopups)}{" "}
                            paid
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {numberFormat(workspace.topup_summary.paidCredits)}{" "}
                            credits
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatMoneyFromCents(
                              workspace.topup_summary.paidAmountCents,
                              "AUD"
                            )}
                          </p>

                          {workspace.topup_summary.failedTopups > 0 ? (
                            <p className="mt-1 text-xs font-black text-red-600">
                              {workspace.topup_summary.failedTopups} failed
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1 text-xs font-semibold text-slate-500">
                            <p>
                              Customer:{" "}
                              <span className="font-mono">
                                {shortId(workspace.stripe_customer_id)}
                              </span>
                            </p>

                            <p>
                              Sub:{" "}
                              <span className="font-mono">
                                {shortId(workspace.stripe_subscription_id)}
                              </span>
                            </p>

                            <p>
                              Price:{" "}
                              <span className="font-mono">
                                {shortId(workspace.stripe_price_id)}
                              </span>
                            </p>

                            <p
                              className={
                                hasStripeData(workspace)
                                  ? "font-black text-emerald-700"
                                  : "font-black text-red-600"
                              }
                            >
                              {hasStripeData(workspace)
                                ? "Stripe linked"
                                : "No Stripe data"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-black text-slate-700">
                            Current Period
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatDate(workspace.billing_current_period_start)}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            to {formatDate(workspace.billing_current_period_end)}
                          </p>

                          <p className="mt-2 text-xs font-semibold text-slate-400">
                            Updated{" "}
                            {formatDate(workspace.subscription_updated_at)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 xl:hidden">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black">
                          {workspace.business_name || "Unnamed Business"}
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                          {workspace.owner?.email ||
                            workspace.business_email ||
                            "-"}
                        </p>
                      </div>

                      <StatusBadge
                        value={workspace.billing_status}
                        fallback="No billing"
                      />
                    </div>

                    <div className="mt-4 grid gap-3 rounded-2xl bg-[#F7F9FA] p-3 text-xs font-semibold text-slate-500">
                      <div className="flex items-start gap-2">
                        <CreditCard className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-black text-slate-700">Plan</p>
                          <p className="mt-1">
                            {workspace.plan_snapshot?.name ||
                              cleanLabel(workspace.plan_key, "No plan")}
                          </p>
                          <p className="mt-1">
                            {workspace.plan_snapshot?.priceLabel || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <WalletCards className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-black text-slate-700">Credits</p>
                          <p className="mt-1">
                            {numberFormat(workspace.credit_numbers.remaining)}{" "}
                            left · {numberFormat(workspace.credit_numbers.used)}{" "}
                            used /{" "}
                            {numberFormat(workspace.credit_numbers.total)} total
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Receipt className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-black text-slate-700">Top-Ups</p>
                          <p className="mt-1">
                            {numberFormat(workspace.topup_summary.paidTopups)}{" "}
                            paid ·{" "}
                            {formatMoneyFromCents(
                              workspace.topup_summary.paidAmountCents,
                              "AUD"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-black text-slate-700">Stripe</p>
                          <p
                            className={`mt-1 font-black ${
                              hasStripeData(workspace)
                                ? "text-emerald-700"
                                : "text-red-600"
                            }`}
                          >
                            {hasStripeData(workspace)
                              ? "Stripe linked"
                              : "No Stripe data"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-black text-slate-700">
                            Billing Period
                          </p>
                          <p className="mt-1">
                            {formatDate(workspace.billing_current_period_start)}{" "}
                            to{" "}
                            {formatDate(workspace.billing_current_period_end)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div className="border-t border-slate-100 bg-[#F7F9FA] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-semibold text-slate-500">
                Showing {pagination.from}-{pagination.to} of{" "}
                {pagination.totalCount} · Page {pagination.page} of{" "}
                {pagination.totalPages}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={!pagination.hasPreviousPage || loading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={!pagination.hasNextPage || loading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}