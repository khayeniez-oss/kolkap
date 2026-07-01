"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Building2,
  Inbox,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SupportFilter =
  | "all"
  | "handover"
  | "open"
  | "handled"
  | "leads"
  | "recent";

type Workspace = {
  id: string;
  owner_user_id: string;
  business_name: string | null;
  business_type: string | null;
  business_email: string | null;
  business_phone: string | null;
  country: string | null;
  plan_key: string | null;
  plan_status: string | null;
  billing_status: string | null;
};

type OwnerProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
};

type SupportConversation = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  ai_staff_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_channel: string;
  status: string;
  lead_status: string;
  handover_requested: boolean;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  workspace: Workspace | null;
  owner: OwnerProfile | null;
};

type SupportMessage = {
  id: string;
  conversation_id: string;
  workspace_id: string;
  owner_user_id: string;
  ai_staff_id: string | null;
  sender_type: string;
  message_text: string;
  created_at: string | null;
};

type SupportStats = {
  total: number;
  handover: number;
  open: number;
  handled: number;
  leads: number;
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

const SUPPORT_FILTERS: { value: SupportFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "handover", label: "Handover" },
  { value: "open", label: "Open" },
  { value: "handled", label: "Handled" },
  { value: "leads", label: "Leads" },
  { value: "recent", label: "Recent" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const EMPTY_STATS: SupportStats = {
  total: 0,
  handover: 0,
  open: 0,
  handled: 0,
  leads: 0,
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

function getStatusClass(value?: string | null) {
  const clean = String(value || "").toLowerCase();

  if (
    clean.includes("handled") ||
    clean.includes("closed") ||
    clean.includes("resolved")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    clean.includes("handover") ||
    clean.includes("urgent") ||
    clean.includes("help")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (clean.includes("lead") || clean.includes("new")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (clean.includes("pending") || clean.includes("open")) {
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

function MessageBubble({ message }: { message: SupportMessage }) {
  const cleanSender = String(message.sender_type || "").toLowerCase();

  const fromCustomer =
    cleanSender.includes("customer") ||
    cleanSender.includes("visitor") ||
    cleanSender.includes("user");

  const fromAi = cleanSender.includes("ai") || cleanSender.includes("assistant");

  return (
    <div
      className={`flex ${
        fromCustomer ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-2xl border p-4 ${
          fromCustomer
            ? "border-slate-200 bg-[#F7F9FA]"
            : fromAi
              ? "border-blue-100 bg-blue-50"
              : "border-emerald-100 bg-emerald-50"
        }`}
      >
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {fromCustomer ? "Customer" : fromAi ? "AI Staff" : cleanLabel(message.sender_type)}
        </p>

        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
          {message.message_text || "-"}
        </p>

        <p className="mt-3 text-[11px] font-semibold text-slate-400">
          {formatDate(message.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function KolkapAdminSupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [stats, setStats] = useState<SupportStats>(EMPTY_STATS);
  const [pagination, setPagination] =
    useState<PaginationState>(EMPTY_PAGINATION);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [supportFilter, setSupportFilter] = useState<SupportFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [loading, setLoading] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState("");

  const filterLabel = useMemo(() => {
    return (
      SUPPORT_FILTERS.find((item) => item.value === supportFilter)?.label ||
      "All"
    );
  }, [supportFilter]);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadSupport(
    nextSearch = search,
    nextSupportFilter = supportFilter,
    nextPage = page,
    nextPageSize = pageSize
  ) {
    try {
      setLoading(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        setConversations([]);
        setSelectedConversation(null);
        setMessages([]);
        setStats(EMPTY_STATS);
        setPagination(EMPTY_PAGINATION);
        return;
      }

      const params = new URLSearchParams({
        search: nextSearch,
        supportFilter: nextSupportFilter,
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      const response = await fetch(`/api/admin/support?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load support inbox.");
      }

      const nextConversations = (result.conversations ||
        []) as SupportConversation[];

      setConversations(nextConversations);
      setStats((result.stats || EMPTY_STATS) as SupportStats);
      setPagination((result.pagination || EMPTY_PAGINATION) as PaginationState);

      if (
        selectedConversation?.id &&
        !nextConversations.some((item) => item.id === selectedConversation.id)
      ) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (loadError) {
      console.error("Load Kolkap admin support error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load support inbox."));
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(conversationId: string) {
    try {
      setLoadingConversation(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        return;
      }

      const params = new URLSearchParams({
        conversationId,
      });

      const response = await fetch(`/api/admin/support?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load conversation.");
      }

      setSelectedConversation(
        (result.conversation || null) as SupportConversation | null
      );
      setMessages((result.messages || []) as SupportMessage[]);
    } catch (loadError) {
      console.error("Load Kolkap support conversation error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load conversation."));
    } finally {
      setLoadingConversation(false);
    }
  }

  function submitSearch() {
    const clean = searchInput.trim();

    setSearch(clean);
    setPage(1);
    loadSupport(clean, supportFilter, 1, pageSize);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
    loadSupport("", supportFilter, 1, pageSize);
  }

  function changeSupportFilter(nextSupportFilter: SupportFilter) {
    setSupportFilter(nextSupportFilter);
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
    loadSupport(search, supportFilter, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportFilter, page, pageSize]);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Kolkap Admin
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Support Inbox
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              Monitor customer conversations, handover requests, support
              issues, lead status, workspace context, and recent messages. This
              first version is view-only.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadSupport(search, supportFilter, page, pageSize)}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Total
            </p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
              Handover
            </p>
            <p className="mt-2 text-3xl font-black text-red-700">
              {stats.handover}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-500">
              Open
            </p>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {stats.open}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-500">
              Handled
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {stats.handled}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
              Leads
            </p>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {stats.leads}
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
              Search Support
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
                  placeholder="Search name, phone, channel, status, lead status, or message"
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
            Support Filter
          </p>

          <div className="flex flex-wrap gap-2">
            {SUPPORT_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => changeSupportFilter(item.value)}
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                  supportFilter === item.value
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
              This page is monitoring only. Admin reply, assigning, closing, and
              internal notes should be added later after we confirm the support
              workflow.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="grid min-h-[680px] xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="border-b border-slate-100 xl:border-b-0 xl:border-r">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-xl font-black">Conversations</h2>
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
              {!loading && conversations.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center p-8 text-center">
                  <div>
                    <Inbox className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">
                      No support conversations found.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const active = selectedConversation?.id === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => loadConversation(conversation.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-[#07111F] bg-[#07111F] text-white"
                          : "border-slate-200 bg-white hover:bg-[#F7F9FA]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {conversation.customer_name || "Unknown customer"}
                          </p>

                          <p
                            className={`mt-1 truncate text-xs font-semibold ${
                              active ? "text-white/60" : "text-slate-500"
                            }`}
                          >
                            {conversation.customer_phone || "-"}
                          </p>
                        </div>

                        {conversation.handover_requested ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                              active
                                ? "bg-white/10 text-white"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            Handover
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                              active
                                ? "bg-white/10 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {cleanLabel(conversation.status, "Open")}
                          </span>
                        )}
                      </div>

                      <p
                        className={`mt-3 line-clamp-2 text-sm font-semibold leading-6 ${
                          active ? "text-white/75" : "text-slate-600"
                        }`}
                      >
                        {conversation.last_message || "No latest message."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {cleanLabel(conversation.customer_channel, "Channel")}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          Lead: {cleanLabel(conversation.lead_status, "None")}
                        </span>
                      </div>

                      <p
                        className={`mt-3 text-[11px] font-semibold ${
                          active ? "text-white/50" : "text-slate-400"
                        }`}
                      >
                        {formatDate(conversation.last_message_at)}
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

          <div className="min-h-[680px]">
            {!selectedConversation ? (
              <div className="flex min-h-[680px] items-center justify-center p-8 text-center">
                <div>
                  <MessageCircle className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Select a conversation to view support details.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-2xl font-black tracking-[-0.04em]">
                        {selectedConversation.customer_name ||
                          "Unknown customer"}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {selectedConversation.workspace?.business_name ||
                          "Unknown workspace"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge
                          value={selectedConversation.status}
                          fallback="Open"
                        />

                        <StatusBadge
                          value={selectedConversation.lead_status}
                          fallback="No lead status"
                        />

                        {selectedConversation.handover_requested ? (
                          <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">
                            Handover Requested
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {loadingConversation ? (
                      <span className="text-sm font-bold text-slate-400">
                        Loading conversation...
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Customer Phone
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {selectedConversation.customer_phone || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                      <Building2 className="h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Business
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {selectedConversation.workspace?.business_name || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                      <UserRound className="h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Owner
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {selectedConversation.owner?.email || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                      <Bot className="h-5 w-5 text-slate-400" />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Channel
                      </p>
                      <p className="mt-1 truncate text-sm font-black">
                        {cleanLabel(
                          selectedConversation.customer_channel,
                          "Channel"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="max-h-[620px] overflow-y-auto bg-white p-5">
                  {messages.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center text-center">
                      <div>
                        <MessageCircle className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-4 text-sm font-semibold text-slate-500">
                          No messages found for this conversation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}