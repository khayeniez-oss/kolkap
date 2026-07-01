"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Save,
  Search,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AttentionFilter =
  | "all"
  | "needs_attention"
  | "in_progress"
  | "resolved"
  | "closed"
  | "high_priority";

type HelpStatus = "needs_attention" | "in_progress" | "resolved" | "closed";

type HelpRequest = {
  id: string;
  workspace_id: string | null;
  owner_user_id: string | null;
  submitted_by_user_id: string | null;
  business_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  admin_note: string | null;
  assigned_to_admin_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
};

type AttentionStats = {
  total: number;
  needsAttention: number;
  inProgress: number;
  resolved: number;
  closed: number;
  highPriority: number;
  recent: number;
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

const FILTERS: { value: AttentionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "high_priority", label: "High Priority" },
];

const HELP_STATUSES: { value: HelpStatus; label: string }[] = [
  { value: "needs_attention", label: "Needs Attention" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const EMPTY_STATS: AttentionStats = {
  total: 0,
  needsAttention: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
  highPriority: 0,
  recent: 0,
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

function cleanLabel(value?: string | null, fallback = "-") {
  const clean = String(value || "").trim();

  if (!clean) return fallback;

  return clean
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeHelpStatus(value?: string | null): HelpStatus {
  const clean = String(value || "").toLowerCase();

  if (
    clean === "needs_attention" ||
    clean === "in_progress" ||
    clean === "resolved" ||
    clean === "closed"
  ) {
    return clean;
  }

  return "needs_attention";
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

function statusClass(value?: string | null) {
  const clean = String(value || "").toLowerCase();

  if (clean.includes("resolved") || clean.includes("closed")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (clean.includes("progress")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function priorityClass(value?: string | null) {
  const clean = String(value || "").toLowerCase();

  if (clean === "urgent" || clean === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (clean === "low") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function StatusBadge({ value }: { value?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
        value
      )}`}
    >
      {cleanLabel(value, "Needs Attention")}
    </span>
  );
}

function PriorityBadge({ value }: { value?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${priorityClass(
        value
      )}`}
    >
      {cleanLabel(value, "Normal")}
    </span>
  );
}

export default function AdminNeedsAttentionPage() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(
    null
  );
  const [stats, setStats] = useState<AttentionStats>(EMPTY_STATS);
  const [pagination, setPagination] =
    useState<PaginationState>(EMPTY_PAGINATION);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AttentionFilter>("needs_attention");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [statusDraft, setStatusDraft] =
    useState<HelpStatus>("needs_attention");
  const [adminNoteDraft, setAdminNoteDraft] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const [loading, setLoading] = useState(true);
  const [updatingRequest, setUpdatingRequest] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filterLabel = useMemo(() => {
    return FILTERS.find((item) => item.value === filter)?.label || "All";
  }, [filter]);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadRequests(
    nextSearch = search,
    nextFilter = filter,
    nextPage = page,
    nextPageSize = pageSize
  ) {
    try {
      setLoading(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        setRequests([]);
        setSelectedRequest(null);
        setStats(EMPTY_STATS);
        setPagination(EMPTY_PAGINATION);
        return;
      }

      const params = new URLSearchParams({
        search: nextSearch,
        filter: nextFilter,
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      const response = await fetch(
        `/api/admin/needs-attention?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load requests.");
      }

      const nextRequests = (result.requests || []) as HelpRequest[];

      setRequests(nextRequests);
      setStats((result.stats || EMPTY_STATS) as AttentionStats);
      setPagination((result.pagination || EMPTY_PAGINATION) as PaginationState);

      if (
        selectedRequest?.id &&
        !nextRequests.some((item) => item.id === selectedRequest.id)
      ) {
        setSelectedRequest(null);
      }
    } catch (loadError) {
      console.error("Load needs attention error:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load requests."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateSelectedRequest() {
    if (!selectedRequest?.id) return;

    try {
      setUpdatingRequest(true);
      setError("");
      setNotice("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        return;
      }

      const response = await fetch("/api/admin/needs-attention", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: statusDraft,
          adminNote: adminNoteDraft,
          notifyCustomer,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update request.");
      }

      const updatedRequest = result.request as HelpRequest;

      setSelectedRequest(updatedRequest);
      setStatusDraft(normalizeHelpStatus(updatedRequest.status));
      setAdminNoteDraft(updatedRequest.admin_note || "");

      setNotice(
        result.notifiedCustomer
          ? "Request updated and customer notification was sent."
          : "Request updated without customer notification."
      );

      await loadRequests(search, filter, page, pageSize);
    } catch (updateError) {
      console.error("Update help request error:", updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update request."
      );
    } finally {
      setUpdatingRequest(false);
    }
  }

  function selectRequest(request: HelpRequest) {
    setSelectedRequest(request);
    setStatusDraft(normalizeHelpStatus(request.status));
    setAdminNoteDraft(request.admin_note || "");
    setNotifyCustomer(true);
    setNotice("");
    setError("");
  }

  function submitSearch() {
    const clean = searchInput.trim();

    setSearch(clean);
    setPage(1);
    loadRequests(clean, filter, 1, pageSize);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
    loadRequests("", filter, 1, pageSize);
  }

  function changeFilter(nextFilter: AttentionFilter) {
    setFilter(nextFilter);
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
    loadRequests(search, filter, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, pageSize]);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Kolkap Admin
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Needs Attention
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              Review help requests submitted by Kolkap customers, update the
              request status, add admin notes, and notify the customer when
              action has been taken.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadRequests(search, filter, page, pageSize)}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-7">
          <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Total
            </p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-500">
              Needs Attention
            </p>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {stats.needsAttention}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
              In Progress
            </p>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {stats.inProgress}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-500">
              Resolved
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {stats.resolved}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Closed
            </p>
            <p className="mt-2 text-3xl font-black">{stats.closed}</p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
              High Priority
            </p>
            <p className="mt-2 text-3xl font-black text-red-700">
              {stats.highPriority}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-500">
              Recent
            </p>
            <p className="mt-2 text-3xl font-black text-purple-700">
              {stats.recent}
            </p>
          </div>
        </div>

        {notice ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {notice}
          </div>
        ) : null}

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
              Search Requests
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
                  placeholder="Search business, customer, email, category, subject, or message"
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

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => changeFilter(item.value)}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                filter === item.value
                  ? "border-[#07111F] bg-[#07111F] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-[#F7F9FA]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="grid min-h-[650px] xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="border-b border-slate-100 xl:border-b-0 xl:border-r">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-xl font-black">Help Requests</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Showing {filterLabel}
                {search ? ` matching "${search}"` : ""}.
              </p>

              {loading ? (
                <p className="mt-2 text-sm font-bold text-slate-400">
                  Loading...
                </p>
              ) : null}
            </div>

            <div className="max-h-[720px] overflow-y-auto p-3">
              {!loading && requests.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center p-8 text-center">
                  <div>
                    <HelpCircle className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">
                      No help requests found.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                {requests.map((request) => {
                  const active = selectedRequest?.id === request.id;

                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => selectRequest(request)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-[#07111F] bg-[#07111F] text-white"
                          : "border-slate-200 bg-white hover:bg-[#F7F9FA]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {request.subject}
                          </p>

                          <p
                            className={`mt-1 truncate text-xs font-semibold ${
                              active ? "text-white/60" : "text-slate-500"
                            }`}
                          >
                            {request.business_name || "No business name"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {cleanLabel(request.status)}
                        </span>
                      </div>

                      <p
                        className={`mt-3 text-sm font-semibold leading-6 ${
                          active ? "text-white/75" : "text-slate-600"
                        }`}
                      >
                        {request.message.slice(0, 130)}
                        {request.message.length > 130 ? "..." : ""}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {cleanLabel(request.category)}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {cleanLabel(request.priority)}
                        </span>
                      </div>

                      <p
                        className={`mt-3 text-[11px] font-semibold ${
                          active ? "text-white/50" : "text-slate-400"
                        }`}
                      >
                        {formatDate(request.created_at)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-[#F7F9FA] p-4">
              <div className="flex flex-col gap-3">
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
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={!pagination.hasNextPage || loading}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-[650px]">
            {!selectedRequest ? (
              <div className="flex min-h-[650px] items-center justify-center p-8 text-center">
                <div>
                  <MessageSquareText className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Select a help request to view details.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-100 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-2xl font-black tracking-[-0.04em]">
                        {selectedRequest.subject}
                      </h3>

                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        {selectedRequest.business_name || "No business name"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatusBadge value={selectedRequest.status} />
                        <PriorityBadge value={selectedRequest.priority} />
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          {cleanLabel(selectedRequest.category)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                      <Building2 className="h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Business
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {selectedRequest.business_name || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {selectedRequest.customer_email || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Phone
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {selectedRequest.customer_phone || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                      <AlertTriangle className="h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Created
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {formatDate(selectedRequest.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-6">
                  <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      Customer Message
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-base font-semibold leading-8 text-slate-700">
                      {selectedRequest.message}
                    </p>
                  </div>

                  <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
                    <div className="flex items-start gap-3">
                      <Send className="mt-1 h-5 w-5 shrink-0 text-blue-700" />

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
                          Admin Action
                        </p>

                        <h4 className="mt-2 text-xl font-black tracking-[-0.04em] text-blue-950">
                          Update this help request
                        </h4>

                        <p className="mt-2 text-sm font-bold leading-6 text-blue-900">
                          Change the status, add a note, and optionally notify
                          the customer in their Notification Centre.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
                          Status
                        </label>

                        <select
                          value={statusDraft}
                          onChange={(event) =>
                            setStatusDraft(
                              normalizeHelpStatus(event.target.value)
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-blue-950 outline-none focus:border-blue-500"
                        >
                          {HELP_STATUSES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-blue-950">
                          <input
                            type="checkbox"
                            checked={notifyCustomer}
                            onChange={(event) =>
                              setNotifyCustomer(event.target.checked)
                            }
                            className="h-4 w-4 accent-[#07111F]"
                          />
                          Notify customer
                        </label>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
                        Admin Note
                      </label>

                      <textarea
                        value={adminNoteDraft}
                        onChange={(event) =>
                          setAdminNoteDraft(event.target.value)
                        }
                        rows={5}
                        placeholder="Example: We are checking your WhatsApp setup and will update you shortly."
                        className="mt-2 w-full resize-none rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold leading-6 text-blue-950 outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={updateSelectedRequest}
                      disabled={updatingRequest}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#07111F] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingRequest ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {updatingRequest ? "Updating..." : "Update Request"}
                    </button>
                  </div>

                  {selectedRequest.admin_note ? (
                    <div className="rounded-[2rem] border border-blue-100 bg-white p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" />

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
                            Current Admin Note
                          </p>

                          <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-blue-900">
                            {selectedRequest.admin_note}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}