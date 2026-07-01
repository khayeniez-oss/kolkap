"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Building2,
  CheckCircle2,
  Globe2,
  MessageCircle,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PlanFilter = "all" | "trial" | "active" | "past_due" | "cancelled";

type OwnerProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
};

type CreditBalance = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  plan_name: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  status: string;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type WebsiteChatSetting = {
  id: string;
  workspace_id: string;
  selected_ai_staff_id: string | null;
  widget_title: string | null;
  is_active: boolean | null;
  ai_enabled: boolean | null;
  auto_reply_enabled: boolean | null;
  handover_enabled: boolean | null;
  updated_at: string | null;
};

type Workspace = {
  id: string;
  owner_user_id: string;
  business_name: string | null;
  business_type: string | null;
  business_email: string | null;
  business_phone: string | null;
  whatsapp_number: string | null;
  business_address: string | null;
  country: string | null;
  timezone: string | null;
  plan_key: string;
  plan_status: string;
  credits_total: number;
  credits_used: number;
  ai_staff_used: number;
  whatsapp_status: string;
  go_live_status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  ai_reply_language: string | null;
  ai_reply_tone: string | null;
  auto_reply_enabled: boolean | null;
  human_handover_enabled: boolean | null;
  lead_capture_enabled: boolean | null;
  live_ai_staff_id: string | null;
  go_live_activated_at: string | null;
  billing_status: string | null;
  billing_started_at: string | null;
  billing_current_period_start: string | null;
  billing_current_period_end: string | null;
  trial_activated_at: string | null;
  subscription_cancel_at: string | null;
  subscription_cancelled_at: string | null;
  subscription_updated_at: string | null;
  owner: OwnerProfile | null;
  credit_balance: CreditBalance | null;
  website_chat: WebsiteChatSetting | null;
  ai_staff_count: number;
};

type WorkspaceStats = {
  total: number;
  trial: number;
  activePaid: number;
  whatsappConnected: number;
  websiteChatActive: number;
  aiStaffCreated: number;
  goLiveActive: number;
  recentCreated: number;
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

const PLAN_FILTERS: { value: PlanFilter; label: string }[] = [
  { value: "all", label: "All Workspaces" },
  { value: "trial", label: "Trial" },
  { value: "active", label: "Active/Paid" },
  { value: "past_due", label: "Past Due" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const EMPTY_STATS: WorkspaceStats = {
  total: 0,
  trial: 0,
  activePaid: 0,
  whatsappConnected: 0,
  websiteChatActive: 0,
  aiStaffCreated: 0,
  goLiveActive: 0,
  recentCreated: 0,
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
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getStatusClass(value?: string | null) {
  const clean = String(value || "").toLowerCase();

  if (
    clean.includes("active") ||
    clean.includes("connected") ||
    clean.includes("live") ||
    clean.includes("paid") ||
    clean.includes("trialing")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    clean.includes("past") ||
    clean.includes("failed") ||
    clean.includes("cancel") ||
    clean.includes("inactive")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (clean.includes("trial") || clean.includes("pending") || clean.includes("setup")) {
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
  const label = cleanLabel(value, fallback);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getStatusClass(
        value || fallback
      )}`}
    >
      {label}
    </span>
  );
}

function BooleanBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function getCreditNumbers(workspace: Workspace) {
  const balance = workspace.credit_balance;

  const total =
    Number(balance?.plan_credits || 0) +
    Number(balance?.purchased_credits || 0);

  const used = Number(balance?.used_credits || workspace.credits_used || 0);
  const fallbackTotal = Number(workspace.credits_total || 0);

  return {
    total: total > 0 ? total : fallbackTotal,
    used,
    remaining: Math.max((total > 0 ? total : fallbackTotal) - used, 0),
  };
}

function isWebsiteChatActive(workspace: Workspace) {
  return Boolean(workspace.website_chat?.is_active);
}

function isWhatsappConnected(workspace: Workspace) {
  const status = String(workspace.whatsapp_status || "").toLowerCase();

  return (
    Boolean(workspace.whatsapp_number) ||
    status.includes("connected") ||
    status.includes("active") ||
    status.includes("ready") ||
    status.includes("live")
  );
}

export default function KolkapAdminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [stats, setStats] = useState<WorkspaceStats>(EMPTY_STATS);
  const [pagination, setPagination] =
    useState<PaginationState>(EMPTY_PAGINATION);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredLabel = useMemo(() => {
    return (
      PLAN_FILTERS.find((item) => item.value === planFilter)?.label ||
      "All Workspaces"
    );
  }, [planFilter]);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadWorkspaces(
    nextSearch = search,
    nextPlanFilter = planFilter,
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
        setStats(EMPTY_STATS);
        setPagination(EMPTY_PAGINATION);
        return;
      }

      const params = new URLSearchParams({
        search: nextSearch,
        planFilter: nextPlanFilter,
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      const response = await fetch(
        `/api/admin/workspaces?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load workspaces.");
      }

      setWorkspaces((result.workspaces || []) as Workspace[]);
      setStats((result.stats || EMPTY_STATS) as WorkspaceStats);
      setPagination((result.pagination || EMPTY_PAGINATION) as PaginationState);
    } catch (loadError) {
      console.error("Load Kolkap admin workspaces error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load workspaces."));
    } finally {
      setLoading(false);
    }
  }

  function submitSearch() {
    const clean = searchInput.trim();

    setSearch(clean);
    setPage(1);
    loadWorkspaces(clean, planFilter, 1, pageSize);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
    loadWorkspaces("", planFilter, 1, pageSize);
  }

  function changePlanFilter(nextPlanFilter: PlanFilter) {
    setPlanFilter(nextPlanFilter);
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
    loadWorkspaces(search, planFilter, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planFilter, page, pageSize]);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Kolkap Admin
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Workspaces
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              Monitor Kolkap customer businesses, plans, trials, credits,
              WhatsApp setup, website chat setup, AI staff, and go-live status.
              This first version is view-only.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadWorkspaces(search, planFilter, page, pageSize)}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Total
            </p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-500">
              Trial
            </p>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {stats.trial}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-500">
              Active/Paid
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {stats.activePaid}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
              WhatsApp
            </p>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {stats.whatsappConnected}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-500">
              Website Chat
            </p>
            <p className="mt-2 text-3xl font-black text-purple-700">
              {stats.websiteChatActive}
            </p>
          </div>

          <div className="rounded-2xl border border-lime-100 bg-lime-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-lime-600">
              AI Staff
            </p>
            <p className="mt-2 text-3xl font-black text-lime-700">
              {stats.aiStaffCreated}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-600">
              Go Live
            </p>
            <p className="mt-2 text-3xl font-black text-cyan-700">
              {stats.goLiveActive}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              New 7 Days
            </p>
            <p className="mt-2 text-3xl font-black">{stats.recentCreated}</p>
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
              Search Workspaces
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
                  placeholder="Search business name, email, phone, country, plan, or status"
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
            Plan Filter
          </p>

          <div className="flex flex-wrap gap-2">
            {PLAN_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => changePlanFilter(item.value)}
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                  planFilter === item.value
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-[#F7F9FA]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">Customer Workspaces</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Showing {filteredLabel}
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
              <Building2 className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-semibold text-slate-500">
                No workspaces found for the current filter.
              </p>
            </div>
          </div>
        ) : null}

        {workspaces.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1200px] text-left">
                <thead className="bg-[#F7F9FA] text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Business</th>
                    <th className="px-5 py-4">Owner</th>
                    <th className="px-5 py-4">Plan</th>
                    <th className="px-5 py-4">Credits</th>
                    <th className="px-5 py-4">Setup</th>
                    <th className="px-5 py-4">Go Live</th>
                    <th className="px-5 py-4">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {workspaces.map((workspace) => {
                    const credits = getCreditNumbers(workspace);

                    return (
                      <tr key={workspace.id} className="align-top">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                              <Building2 className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[260px] truncate text-sm font-black text-[#07111F]">
                                {workspace.business_name || "Unnamed Business"}
                              </p>

                              <p className="mt-1 max-w-[260px] truncate text-xs font-semibold text-slate-500">
                                {workspace.business_type || "Business type not set"}
                              </p>

                              <p className="mt-1 font-mono text-[11px] font-semibold text-slate-400">
                                {shortId(workspace.id)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-700">
                            {workspace.owner?.full_name || "No owner name"}
                          </p>

                          <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-slate-500">
                            {workspace.owner?.email ||
                              workspace.business_email ||
                              "-"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {workspace.country || "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <StatusBadge
                              value={workspace.plan_key}
                              fallback="No plan"
                            />

                            <StatusBadge
                              value={workspace.plan_status}
                              fallback="No plan status"
                            />

                            <StatusBadge
                              value={workspace.billing_status}
                              fallback="No billing status"
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-3">
                            <p className="text-sm font-black text-[#07111F]">
                              {credits.remaining} left
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {credits.used} used / {credits.total} total
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {workspace.credit_balance?.plan_name ||
                                workspace.plan_key ||
                                "No credit plan"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <BooleanBadge
                              active={isWhatsappConnected(workspace)}
                              activeLabel="WhatsApp Ready"
                              inactiveLabel="WhatsApp Not Ready"
                            />

                            <BooleanBadge
                              active={isWebsiteChatActive(workspace)}
                              activeLabel="Website Chat Active"
                              inactiveLabel="Website Chat Off"
                            />

                            <span className="inline-flex rounded-full border border-lime-200 bg-lime-50 px-2.5 py-1 text-xs font-black text-lime-700">
                              {workspace.ai_staff_count} AI Staff
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <StatusBadge
                              value={workspace.go_live_status}
                              fallback="Not live"
                            />

                            <p className="text-xs font-semibold text-slate-500">
                              {workspace.go_live_activated_at
                                ? formatDate(workspace.go_live_activated_at)
                                : "No activation date"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-600">
                            {formatDate(workspace.created_at)}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Updated {formatDate(workspace.updated_at)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 xl:hidden">
              {workspaces.map((workspace) => {
                const credits = getCreditNumbers(workspace);

                return (
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
                          {workspace.business_type || "Business type not set"}
                        </p>
                      </div>

                      <StatusBadge
                        value={workspace.plan_status}
                        fallback="No status"
                      />
                    </div>

                    <div className="mt-4 grid gap-3 rounded-2xl bg-[#F7F9FA] p-3 text-xs font-semibold text-slate-500">
                      <div className="flex items-start gap-2">
                        <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-black text-slate-700">Owner</p>
                          <p className="mt-1">
                            {workspace.owner?.full_name || "No owner name"}
                          </p>
                          <p className="mt-1">
                            {workspace.owner?.email ||
                              workspace.business_email ||
                              "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <WalletCards className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-black text-slate-700">Credits</p>
                          <p className="mt-1">
                            {credits.remaining} left · {credits.used} used /{" "}
                            {credits.total} total
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <BooleanBadge
                          active={isWhatsappConnected(workspace)}
                          activeLabel="WhatsApp Ready"
                          inactiveLabel="WhatsApp Not Ready"
                        />

                        <BooleanBadge
                          active={isWebsiteChatActive(workspace)}
                          activeLabel="Website Chat Active"
                          inactiveLabel="Website Chat Off"
                        />

                        <span className="inline-flex rounded-full border border-lime-200 bg-lime-50 px-2.5 py-1 text-xs font-black text-lime-700">
                          {workspace.ai_staff_count} AI Staff
                        </span>
                      </div>

                      <div>
                        <p className="font-black text-slate-700">Go Live</p>
                        <div className="mt-2">
                          <StatusBadge
                            value={workspace.go_live_status}
                            fallback="Not live"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="font-black text-slate-700">Created</p>
                        <p className="mt-1">{formatDate(workspace.created_at)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
    </main>
  );
}