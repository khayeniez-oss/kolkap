"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  FileText,
  Globe2,
  Inbox,
  MessageCircle,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DateRange = "all" | "today" | "7d" | "30d";

type UsageCategory =
  | "all"
  | "whatsapp"
  | "website_chat"
  | "test_ai"
  | "content"
  | "inbox"
  | "other";

type Workspace = {
  id: string;
  owner_user_id: string;
  business_name: string | null;
  business_type: string | null;
  business_email: string | null;
  country: string | null;
  plan_key: string | null;
  plan_status: string | null;
  billing_status: string | null;
  credits_total: number | null;
  credits_used: number | null;
};

type Profile = {
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
  billing_period_start: string | null;
  billing_period_end: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

type UsageEvent = {
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
  created_at: string | null;
  workspace: Workspace | null;
  owner: Profile | null;
  user: Profile | null;
  credit_balance: CreditBalance | null;
  category: UsageCategory;
};

type TopWorkspace = {
  workspaceId: string;
  creditsUsed: number;
  eventCount: number;
  lastUsedAt: string | null;
  workspace: Workspace | null;
  credit_balance: CreditBalance | null;
  creditsRemaining: number;
};

type UsageStats = {
  totalEvents: number;
  sampledEvents: number;
  totalCreditsUsed: number;
  totalEventCount: number;
  failedEvents: number;
  successfulEvents: number;
  todayCredits: number;
  last7DaysCredits: number;
  whatsappCredits: number;
  websiteChatCredits: number;
  testAiCredits: number;
  contentCredits: number;
  inboxCredits: number;
  otherCredits: number;
  creditBalanceTotal: number;
  creditBalanceUsed: number;
  creditBalanceRemaining: number;
  topWorkspaces: TopWorkspace[];
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

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

const CATEGORIES: { value: UsageCategory; label: string }[] = [
  { value: "all", label: "All Usage" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website_chat", label: "Website Chat" },
  { value: "test_ai", label: "Test AI" },
  { value: "content", label: "Content" },
  { value: "inbox", label: "Inbox" },
  { value: "other", label: "Other" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const EMPTY_STATS: UsageStats = {
  totalEvents: 0,
  sampledEvents: 0,
  totalCreditsUsed: 0,
  totalEventCount: 0,
  failedEvents: 0,
  successfulEvents: 0,
  todayCredits: 0,
  last7DaysCredits: 0,
  whatsappCredits: 0,
  websiteChatCredits: 0,
  testAiCredits: 0,
  contentCredits: 0,
  inboxCredits: 0,
  otherCredits: 0,
  creditBalanceTotal: 0,
  creditBalanceUsed: 0,
  creditBalanceRemaining: 0,
  topWorkspaces: [],
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

function getStatusClass(value?: string | null) {
  const clean = String(value || "").toLowerCase();

  if (
    clean.includes("success") ||
    clean.includes("complete") ||
    clean.includes("sent") ||
    clean.includes("active")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    clean.includes("fail") ||
    clean.includes("error") ||
    clean.includes("rejected")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (clean.includes("pending") || clean.includes("processing")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatusBadge({ value }: { value?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getStatusClass(
        value
      )}`}
    >
      {cleanLabel(value, "Unknown")}
    </span>
  );
}

function CategoryBadge({ category }: { category: UsageCategory }) {
  const label =
    CATEGORIES.find((item) => item.value === category)?.label || "Other";

  const classes: Record<UsageCategory, string> = {
    all: "border-slate-200 bg-slate-50 text-slate-700",
    whatsapp: "border-emerald-200 bg-emerald-50 text-emerald-700",
    website_chat: "border-blue-200 bg-blue-50 text-blue-700",
    test_ai: "border-purple-200 bg-purple-50 text-purple-700",
    content: "border-amber-200 bg-amber-50 text-amber-800",
    inbox: "border-cyan-200 bg-cyan-50 text-cyan-700",
    other: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${classes[category]}`}
    >
      {label}
    </span>
  );
}

function getCreditsRemaining(event: UsageEvent) {
  const balance = event.credit_balance;

  if (!balance) return null;

  const total =
    Number(balance.plan_credits || 0) + Number(balance.purchased_credits || 0);
  const used = Number(balance.used_credits || 0);

  return Math.max(total - used, 0);
}

export default function KolkapAdminUsagePage() {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [stats, setStats] = useState<UsageStats>(EMPTY_STATS);
  const [pagination, setPagination] =
    useState<PaginationState>(EMPTY_PAGINATION);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [category, setCategory] = useState<UsageCategory>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dateRangeLabel = useMemo(() => {
    return DATE_RANGES.find((item) => item.value === dateRange)?.label || "Last 7 Days";
  }, [dateRange]);

  const categoryLabel = useMemo(() => {
    return CATEGORIES.find((item) => item.value === category)?.label || "All Usage";
  }, [category]);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadUsage(
    nextSearch = search,
    nextDateRange = dateRange,
    nextCategory = category,
    nextPage = page,
    nextPageSize = pageSize
  ) {
    try {
      setLoading(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        setEvents([]);
        setStats(EMPTY_STATS);
        setPagination(EMPTY_PAGINATION);
        return;
      }

      const params = new URLSearchParams({
        search: nextSearch,
        dateRange: nextDateRange,
        category: nextCategory,
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      const response = await fetch(`/api/admin/usage?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load AI usage.");
      }

      setEvents((result.events || []) as UsageEvent[]);
      setStats((result.stats || EMPTY_STATS) as UsageStats);
      setPagination((result.pagination || EMPTY_PAGINATION) as PaginationState);
    } catch (loadError) {
      console.error("Load Kolkap admin usage error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load AI usage."));
    } finally {
      setLoading(false);
    }
  }

  function submitSearch() {
    const clean = searchInput.trim();

    setSearch(clean);
    setPage(1);
    loadUsage(clean, dateRange, category, 1, pageSize);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
    loadUsage("", dateRange, category, 1, pageSize);
  }

  function changeDateRange(nextDateRange: DateRange) {
    setDateRange(nextDateRange);
    setPage(1);
  }

  function changeCategory(nextCategory: UsageCategory) {
    setCategory(nextCategory);
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
    loadUsage(search, dateRange, category, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, category, page, pageSize]);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Kolkap Admin
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              AI Usage
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              Track Kolkap credit usage, AI replies, test AI activity, content
              generation, WhatsApp usage, website chat usage, and recent usage
              events across customer workspaces.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadUsage(search, dateRange, category, page, pageSize)}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Activity className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.14em]">
                Events
              </p>
            </div>
            <p className="mt-2 text-3xl font-black">
              {numberFormat(stats.totalEvents)}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-500">
              <WalletCards className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.14em]">
                Credits Used
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {numberFormat(stats.totalCreditsUsed)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <CalendarDays className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.14em]">
                Today
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {numberFormat(stats.todayCredits)}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <div className="flex items-center gap-2 text-purple-500">
              <BarChart3 className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.14em]">
                Last 7 Days
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-purple-700">
              {numberFormat(stats.last7DaysCredits)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <MessageCircle className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.14em]">
                WhatsApp
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {numberFormat(stats.whatsappCredits)}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <div className="flex items-center gap-2 text-cyan-600">
              <Globe2 className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.14em]">
                Website Chat
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-cyan-700">
              {numberFormat(stats.websiteChatCredits)}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <FileText className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.14em]">
                Content
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {numberFormat(stats.contentCredits)}
            </p>
          </div>

          <div className="rounded-2xl border border-lime-100 bg-lime-50 p-4">
            <div className="flex items-center gap-2 text-lime-600">
              <Bot className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.14em]">
                Test AI
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-lime-700">
              {numberFormat(stats.testAiCredits)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Credit Balance Total
            </p>
            <p className="mt-2 text-2xl font-black">
              {numberFormat(stats.creditBalanceTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
              Credit Balance Used
            </p>
            <p className="mt-2 text-2xl font-black text-red-700">
              {numberFormat(stats.creditBalanceUsed)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-500">
              Credit Balance Remaining
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-700">
              {numberFormat(stats.creditBalanceRemaining)}
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
              Search Usage
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
                  placeholder="Search event type, channel, source page, or status"
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

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Date Range
            </p>

            <div className="flex flex-wrap gap-2">
              {DATE_RANGES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => changeDateRange(item.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                    dateRange === item.value
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-[#F7F9FA]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Usage Category
            </p>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => changeCategory(item.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                    category === item.value
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-[#F7F9FA]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-black">Top Workspaces</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Workspaces using the most credits in {dateRangeLabel}.
            </p>
          </div>

          <div className="max-h-[760px] overflow-y-auto p-4">
            {stats.topWorkspaces.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-5 text-center text-sm font-semibold text-slate-500">
                No workspace usage yet.
              </div>
            ) : null}

            <div className="space-y-3">
              {stats.topWorkspaces.map((item) => (
                <div
                  key={item.workspaceId}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#07111F]">
                        {item.workspace?.business_name || "Unnamed Business"}
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {item.workspace?.business_type || "Business type not set"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-black">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                      <p>{numberFormat(item.creditsUsed)}</p>
                      <p className="mt-1 opacity-60">Credits</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
                      <p>{numberFormat(item.eventCount)}</p>
                      <p className="mt-1 opacity-60">Events</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-400">
                    Last used: {formatDate(item.lastUsedAt)}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Credits remaining: {numberFormat(item.creditsRemaining)}
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
                <h2 className="text-xl font-black">Recent Usage Events</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Showing {categoryLabel} in {dateRangeLabel}
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

          {!loading && events.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
              <div>
                <Activity className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  No usage events found for the current filter.
                </p>
              </div>
            </div>
          ) : null}

          {events.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="bg-[#F7F9FA] text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Workspace</th>
                      <th className="px-5 py-4">Event</th>
                      <th className="px-5 py-4">Credits</th>
                      <th className="px-5 py-4">Source</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Created</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {events.map((event) => {
                      const remaining = getCreditsRemaining(event);

                      return (
                        <tr key={event.id} className="align-top">
                          <td className="px-5 py-4">
                            <p className="max-w-[230px] truncate text-sm font-black text-[#07111F]">
                              {event.workspace?.business_name ||
                                "Unknown Workspace"}
                            </p>

                            <p className="mt-1 max-w-[230px] truncate text-xs font-semibold text-slate-500">
                              {event.owner?.email ||
                                event.workspace?.business_email ||
                                "-"}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {event.workspace?.plan_key || "No plan"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-black text-slate-700">
                              {cleanLabel(event.event_type, "Usage Event")}
                            </p>

                            <div className="mt-2">
                              <CategoryBadge category={event.category} />
                            </div>

                            <p className="mt-2 text-xs font-semibold text-slate-400">
                              Count: {numberFormat(event.event_count || 1)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-lg font-black text-blue-700">
                              {numberFormat(event.credits_used)}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              Remaining:{" "}
                              {remaining === null
                                ? "-"
                                : numberFormat(remaining)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {cleanLabel(event.channel, "No channel")}
                            </p>

                            <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-slate-500">
                              {event.source_page || "-"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge value={event.status} />
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-600">
                              {formatDate(event.created_at)}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 lg:hidden">
                {events.map((event) => {
                  const remaining = getCreditsRemaining(event);

                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-black">
                            {event.workspace?.business_name ||
                              "Unknown Workspace"}
                          </p>

                          <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                            {cleanLabel(event.event_type, "Usage Event")}
                          </p>
                        </div>

                        <CategoryBadge category={event.category} />
                      </div>

                      <div className="mt-4 grid gap-3 rounded-2xl bg-[#F7F9FA] p-3 text-xs font-semibold text-slate-500">
                        <div className="flex items-start gap-2">
                          <WalletCards className="mt-0.5 h-4 w-4 text-slate-400" />
                          <div>
                            <p className="font-black text-slate-700">Credits</p>
                            <p className="mt-1">
                              Used {numberFormat(event.credits_used)} · Remaining{" "}
                              {remaining === null
                                ? "-"
                                : numberFormat(remaining)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Inbox className="mt-0.5 h-4 w-4 text-slate-400" />
                          <div>
                            <p className="font-black text-slate-700">Source</p>
                            <p className="mt-1">
                              {cleanLabel(event.channel, "No channel")} ·{" "}
                              {event.source_page || "-"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="font-black text-slate-700">Status</p>
                          <div className="mt-2">
                            <StatusBadge value={event.status} />
                          </div>
                        </div>

                        <div>
                          <p className="font-black text-slate-700">Created</p>
                          <p className="mt-1">{formatDate(event.created_at)}</p>
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
      </div>
    </main>
  );
}