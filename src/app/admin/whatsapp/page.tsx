"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  customer_wa_id: string | null;
  customer_name: string | null;
  meta_phone_number_id: string | null;
  meta_business_account_id: string | null;
  phone: string | null;
  phone_e164: string | null;
  profile_name: string | null;
  channel: string | null;
  status: string | null;
  ai_enabled: boolean | null;
  handover_to_admin: boolean | null;
  handover_reason: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  window_expires_at: string | null;
  last_message: string | null;
  last_message_direction: string | null;
  last_message_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  direction: string;
  customer_wa_id: string | null;
  customer_name: string | null;
  meta_phone_number_id: string | null;
  meta_business_account_id: string | null;
  meta_message_id: string | null;
  message_type: string | null;
  message_text: string | null;
  ai_replied: boolean | null;
  ai_model: string | null;
  ai_error: string | null;
  send_status: string | null;
  from_number: string | null;
  to_number: string | null;
  phone: string | null;
  profile_name: string | null;
  message: string | null;
  source: string | null;
  ai_generated: boolean | null;
  admin_generated: boolean | null;
  media_count: number | null;
  raw_payload: unknown | null;
  created_at: string | null;
};

type FilterValue = "all" | "needs_admin" | "active_ai" | "paused_ai" | "handled";
type ChannelFilterValue = "all_channels" | "meta_whatsapp" | "unknown_channel";
type BadgeTone = "gray" | "green" | "red" | "amber" | "blue" | "purple";

type ConversationStats = {
  total: number;
  metaDirect: number;
  needsAdmin: number;
  activeAi: number;
  pausedAi: number;
  handled: number;
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

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "needs_admin", label: "Needs Admin" },
  { value: "active_ai", label: "AI Active" },
  { value: "paused_ai", label: "AI Paused" },
  { value: "handled", label: "Handled" },
];

const CHANNEL_FILTERS: { value: ChannelFilterValue; label: string }[] = [
  { value: "all_channels", label: "All Sources" },
  { value: "meta_whatsapp", label: "Meta WhatsApp" },
  { value: "unknown_channel", label: "Unknown" },
];

const MESSAGE_BATCH_SIZE = 30;
const PAGE_SIZE_OPTIONS = [25, 50, 100];

const EMPTY_STATS: ConversationStats = {
  total: 0,
  metaDirect: 0,
  needsAdmin: 0,
  activeAi: 0,
  pausedAi: 0,
  handled: 0,
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

function shortText(value?: string | null, length = 95) {
  const clean = String(value || "").trim();

  if (!clean) return "-";
  if (clean.length <= length) return clean;

  return `${clean.slice(0, length).trim()}...`;
}

function isDateOpen(value?: string | null) {
  if (!value) return false;

  const expiry = new Date(value).getTime();

  if (!Number.isFinite(expiry)) return false;

  return expiry > Date.now();
}

function getReplyWindowLabel(value?: string | null) {
  return isDateOpen(value) ? "24h Reply Open" : "24h Reply Closed";
}

function getChannelMeta(channel?: string | null): {
  label: string;
  tone: BadgeTone;
} {
  const clean = String(channel || "").toLowerCase();

  if (clean.includes("meta")) {
    return {
      label: "Meta WhatsApp",
      tone: "blue",
    };
  }

  return {
    label: "Unknown Source",
    tone: "gray",
  };
}

function getMessageText(message: Message) {
  return message.message_text || message.message || "";
}

function getMessageSourceMeta(message: Message): {
  label: string;
  tone: BadgeTone;
} {
  const source = String(message.source || "").toLowerCase();

  if (source === "meta") return { label: "Customer via Meta", tone: "blue" };
  if (source.includes("kolkap_whatsapp_ai")) {
    return { label: "Kolkap WhatsApp AI", tone: "green" };
  }
  if (source.includes("admin")) return { label: "Admin Reply", tone: "purple" };
  if (message.ai_generated || message.ai_replied) {
    return { label: "AI Reply", tone: "green" };
  }
  if (message.admin_generated) return { label: "Admin Reply", tone: "purple" };
  if (message.direction === "system") return { label: "System", tone: "gray" };

  return { label: source || "Message", tone: "gray" };
}

function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const classes: Record<BadgeTone, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

export default function KolkapAdminWhatsappInboxPage() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [channelFilter, setChannelFilter] =
    useState<ChannelFilterValue>("all_channels");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<ConversationStats>(EMPTY_STATS);
  const [pagination, setPagination] =
    useState<PaginationState>(EMPTY_PAGINATION);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [visibleMessageCount, setVisibleMessageCount] =
    useState(MESSAGE_BATCH_SIZE);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [replyMessage, setReplyMessage] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedConversationId = selectedConversation?.id || "";
  const selectedReplyWindowOpen = isDateOpen(
    selectedConversation?.window_expires_at
  );

  const visibleMessages = useMemo(() => {
    if (messages.length <= visibleMessageCount) return messages;
    return messages.slice(messages.length - visibleMessageCount);
  }, [messages, visibleMessageCount]);

  const hiddenMessagesCount = Math.max(messages.length - visibleMessageCount, 0);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadConversations(
    nextFilter = filter,
    nextPage = page,
    nextChannelFilter = channelFilter,
    nextPageSize = pageSize
  ) {
    try {
      setLoadingConversations(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        setConversations([]);
        setStats(EMPTY_STATS);
        setPagination(EMPTY_PAGINATION);
        return;
      }

      const params = new URLSearchParams({
        filter: nextFilter,
        channelFilter: nextChannelFilter,
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      const response = await fetch(
        `/api/admin/whatsapp/conversations?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to load WhatsApp conversations."
        );
      }

      const nextConversations = (result.conversations || []) as Conversation[];

      setConversations(nextConversations);
      setStats((result.stats || EMPTY_STATS) as ConversationStats);
      setPagination((result.pagination || EMPTY_PAGINATION) as PaginationState);

      if (nextConversations.length === 0) {
        setSelectedConversation(null);
        setMessages([]);
        setVisibleMessageCount(MESSAGE_BATCH_SIZE);
        return;
      }

      if (
        !selectedConversationId ||
        !nextConversations.some((item) => item.id === selectedConversationId)
      ) {
        setSelectedConversation(nextConversations[0]);
      }
    } catch (loadError) {
      console.error("Load Kolkap WhatsApp conversations error:", loadError);
      setError(
        getErrorMessage(loadError, "Failed to load WhatsApp conversations.")
      );
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadMessages(conversationId: string) {
    if (!conversationId) return;

    try {
      setLoadingMessages(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        setMessages([]);
        setVisibleMessageCount(MESSAGE_BATCH_SIZE);
        return;
      }

      const response = await fetch(
        `/api/admin/whatsapp/conversations?conversationId=${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load WhatsApp messages.");
      }

      setSelectedConversation((result.conversation || null) as Conversation | null);
      setMessages((result.messages || []) as Message[]);
      setVisibleMessageCount(MESSAGE_BATCH_SIZE);
    } catch (loadError) {
      console.error("Load Kolkap WhatsApp messages error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load WhatsApp messages."));
    } finally {
      setLoadingMessages(false);
    }
  }

  async function updateConversation(action: string) {
    if (!selectedConversationId) return;

    try {
      setActionLoading(action);
      setError("");
      setSuccessMessage("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        return;
      }

      const response = await fetch("/api/admin/whatsapp/conversations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          action,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update conversation.");
      }

      setSuccessMessage("Conversation updated.");

      await loadConversations(filter, page, channelFilter, pageSize);
      await loadMessages(selectedConversationId);
    } catch (actionError) {
      console.error("Update Kolkap WhatsApp conversation error:", actionError);
      setError(getErrorMessage(actionError, "Failed to update conversation."));
    } finally {
      setActionLoading("");
    }
  }

  async function sendAdminReply() {
    if (!selectedConversationId) return;

    const cleanMessage = replyMessage.trim();

    if (!cleanMessage) {
      setError("Please write a reply before sending.");
      return;
    }

    if (!selectedReplyWindowOpen) {
      setError(
        "The 24-hour reply window is closed. Use an approved template message later."
      );
      return;
    }

    try {
      setSendingReply(true);
      setError("");
      setSuccessMessage("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        return;
      }

      const response = await fetch("/api/admin/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          message: cleanMessage,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send WhatsApp reply.");
      }

      setReplyMessage("");
      setSuccessMessage(
        "Reply sent through Meta WhatsApp. AI is paused for this conversation until you resume it."
      );

      await loadConversations(filter, page, channelFilter, pageSize);
      await loadMessages(selectedConversationId);
    } catch (sendError) {
      console.error("Send Kolkap WhatsApp reply error:", sendError);
      setError(getErrorMessage(sendError, "Failed to send WhatsApp reply."));
    } finally {
      setSendingReply(false);
    }
  }

  function loadMoreMessages() {
    setVisibleMessageCount((prev) => prev + MESSAGE_BATCH_SIZE);
  }

  function changeFilter(nextFilter: FilterValue) {
    setFilter(nextFilter);
    setPage(1);
  }

  function changeChannelFilter(nextChannelFilter: ChannelFilterValue) {
    setChannelFilter(nextChannelFilter);
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
    loadConversations(filter, page, channelFilter, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, channelFilter, pageSize]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedConversation(null);
      setMessages([]);
      return;
    }

    if (
      !selectedConversationId ||
      !conversations.some((item) => item.id === selectedConversationId)
    ) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversationId]);

  return (
    <main className="min-h-screen bg-[#F7F9FA] px-5 py-8 text-[#07111F]">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                Kolkap Admin
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                WhatsApp AI Inbox
              </h1>

              <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
                Monitor customers who ask about Kolkap through WhatsApp. Kolkap
                WhatsApp AI can reply automatically, and you can pause AI,
                resume AI, mark handled, or reply manually.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                loadConversations(filter, page, channelFilter, pageSize);
                if (selectedConversationId) loadMessages(selectedConversationId);
              }}
              className="rounded-full bg-[#07111F] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
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

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
                Meta
              </p>
              <p className="mt-2 text-3xl font-black text-blue-700">
                {stats.metaDirect}
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
                Needs Admin
              </p>
              <p className="mt-2 text-3xl font-black text-red-700">
                {stats.needsAdmin}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-500">
                AI Active
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-700">
                {stats.activeAi}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-500">
                AI Paused
              </p>
              <p className="mt-2 text-3xl font-black text-amber-800">
                {stats.pausedAi}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-500">
                Handled
              </p>
              <p className="mt-2 text-3xl font-black text-purple-700">
                {stats.handled}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="mt-6">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Status Filter
            </p>

            <div className="flex flex-wrap gap-2">
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
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Channel Source
            </p>

            <div className="flex flex-wrap gap-2">
              {CHANNEL_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => changeChannelFilter(item.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                    channelFilter === item.value
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

        <div className="mt-6 grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5 sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-black">Conversations</h2>

              {loadingConversations ? (
                <span className="text-xs font-bold text-slate-400">
                  Loading...
                </span>
              ) : null}
            </div>

            <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
              {!loadingConversations && conversations.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 py-6 text-center text-sm font-semibold text-slate-500">
                  No conversations found.
                </div>
              ) : null}

              {conversations.map((conversation) => {
                const active = selectedConversationId === conversation.id;
                const channelMeta = getChannelMeta(conversation.channel);
                const replyWindowOpen = isDateOpen(
                  conversation.window_expires_at
                );

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setSelectedConversation(conversation);
                      setError("");
                      setSuccessMessage("");
                      setReplyMessage("");
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#07111F] bg-[#07111F] text-white"
                        : "border-slate-200 bg-white hover:bg-[#F7F9FA]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {conversation.profile_name ||
                            conversation.customer_name ||
                            conversation.phone_e164 ||
                            conversation.customer_wa_id ||
                            "WhatsApp Customer"}
                        </p>

                        <p
                          className={`mt-1 truncate text-xs font-semibold ${
                            active ? "text-white/65" : "text-slate-500"
                          }`}
                        >
                          {conversation.phone_e164 ||
                            conversation.customer_wa_id ||
                            "-"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                          conversation.handover_to_admin
                            ? active
                              ? "bg-red-400 text-white"
                              : "bg-red-50 text-red-700"
                            : conversation.ai_enabled
                              ? active
                                ? "bg-emerald-400 text-white"
                                : "bg-emerald-50 text-emerald-700"
                              : active
                                ? "bg-amber-300 text-[#07111F]"
                                : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {conversation.handover_to_admin
                          ? "Needs Admin"
                          : conversation.ai_enabled
                            ? "AI Active"
                            : "AI Paused"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-black ${
                          active
                            ? "border-white/20 bg-white/10 text-white"
                            : channelMeta.tone === "blue"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-[#F7F9FA] text-slate-600"
                        }`}
                      >
                        {channelMeta.label}
                      </span>

                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-black ${
                          active
                            ? "border-white/20 bg-white/10 text-white"
                            : replyWindowOpen
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-[#F7F9FA] text-slate-600"
                        }`}
                      >
                        {getReplyWindowLabel(conversation.window_expires_at)}
                      </span>
                    </div>

                    <p
                      className={`mt-3 text-sm font-semibold leading-5 ${
                        active ? "text-white/80" : "text-slate-600"
                      }`}
                    >
                      {shortText(conversation.last_message)}
                    </p>

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

            <div className="mt-4 rounded-2xl border border-slate-200 bg-[#F7F9FA] p-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                  <span>
                    Showing {pagination.from}-{pagination.to} of{" "}
                    {pagination.totalCount}
                  </span>

                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <select
                    value={pageSize}
                    onChange={(event) =>
                      changePageSize(Number(event.target.value))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 outline-none"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} per page
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={goToPreviousPage}
                      disabled={
                        !pagination.hasPreviousPage || loadingConversations
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={goToNextPage}
                      disabled={!pagination.hasNextPage || loadingConversations}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
            {!selectedConversation ? (
              <div className="flex min-h-[420px] items-center justify-center p-6 text-center text-sm font-semibold text-slate-500">
                Select a conversation to view the message history.
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black">
                        {selectedConversation.profile_name ||
                          selectedConversation.customer_name ||
                          selectedConversation.phone_e164 ||
                          selectedConversation.customer_wa_id ||
                          "WhatsApp Customer"}
                      </h2>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {selectedConversation.phone_e164 ||
                          selectedConversation.customer_wa_id ||
                          "-"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone={getChannelMeta(selectedConversation.channel).tone}>
                          {getChannelMeta(selectedConversation.channel).label}
                        </Badge>

                        {selectedReplyWindowOpen ? (
                          <Badge tone="green">24h Reply Window Open</Badge>
                        ) : (
                          <Badge tone="gray">24h Reply Window Closed</Badge>
                        )}

                        {selectedConversation.handover_to_admin ? (
                          <Badge tone="red">Needs Admin</Badge>
                        ) : selectedConversation.ai_enabled ? (
                          <Badge tone="green">AI Active</Badge>
                        ) : (
                          <Badge tone="amber">AI Paused</Badge>
                        )}

                        <Badge tone="gray">
                          {selectedConversation.status || "active"}
                        </Badge>

                        {selectedConversation.handover_reason ? (
                          <Badge tone="blue">
                            {selectedConversation.handover_reason}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-[#F7F9FA] p-3 text-xs font-semibold leading-5 text-slate-500">
                        <p className="font-black text-slate-700">
                          24h Reply Window
                        </p>

                        <p className="mt-1">
                          Expires:{" "}
                          {formatDate(selectedConversation.window_expires_at)}
                        </p>

                        <p className="mt-1">
                          Normal admin text replies can only be sent while this
                          window is open.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateConversation("pause_ai")}
                        disabled={Boolean(actionLoading)}
                        className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-800 disabled:opacity-50"
                      >
                        {actionLoading === "pause_ai"
                          ? "Pausing..."
                          : "Pause AI"}
                      </button>

                      <button
                        type="button"
                        onClick={() => updateConversation("resume_ai")}
                        disabled={Boolean(actionLoading)}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading === "resume_ai"
                          ? "Resuming..."
                          : "Resume AI"}
                      </button>

                      <button
                        type="button"
                        onClick={() => updateConversation("mark_handled")}
                        disabled={Boolean(actionLoading)}
                        className="rounded-full border border-slate-200 bg-[#07111F] px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                      >
                        {actionLoading === "mark_handled"
                          ? "Saving..."
                          : "Mark Handled"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="max-h-[620px] overflow-y-auto bg-[#F7F9FA] p-4 sm:p-5">
                  {loadingMessages ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center text-sm font-semibold text-slate-500">
                      Loading messages...
                    </div>
                  ) : null}

                  {!loadingMessages && messages.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center text-sm font-semibold text-slate-500">
                      No messages yet.
                    </div>
                  ) : null}

                  {hiddenMessagesCount > 0 ? (
                    <div className="mb-4 text-center">
                      <button
                        type="button"
                        onClick={loadMoreMessages}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700"
                      >
                        Load {Math.min(hiddenMessagesCount, MESSAGE_BATCH_SIZE)}{" "}
                        older message(s)
                      </button>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {visibleMessages.map((message) => {
                      const isOutbound = message.direction === "outbound";
                      const isSystem = message.direction === "system";
                      const meta = getMessageSourceMeta(message);

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isSystem
                              ? "justify-center"
                              : isOutbound
                                ? "justify-end"
                                : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[86%] rounded-2xl border px-4 py-3 ${
                              isSystem
                                ? "border-slate-200 bg-white text-center text-slate-500"
                                : isOutbound
                                  ? "border-[#07111F] bg-[#07111F] text-white"
                                  : "border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Badge tone={meta.tone}>{meta.label}</Badge>

                              {message.send_status ? (
                                <Badge tone="gray">{message.send_status}</Badge>
                              ) : null}

                              {message.ai_model ? (
                                <Badge tone="purple">{message.ai_model}</Badge>
                              ) : null}
                            </div>

                            <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
                              {getMessageText(message) || "-"}
                            </p>

                            {message.ai_error ? (
                              <p className="mt-2 text-xs font-bold text-red-500">
                                AI error: {message.ai_error}
                              </p>
                            ) : null}

                            <p
                              className={`mt-2 text-[11px] font-semibold ${
                                isOutbound ? "text-white/50" : "text-slate-400"
                              }`}
                            >
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 p-4 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {selectedReplyWindowOpen ? (
                      <Badge tone="green">Admin reply allowed</Badge>
                    ) : (
                      <Badge tone="red">Reply window closed</Badge>
                    )}

                    <Badge tone="amber">
                      Manual reply pauses AI for this conversation
                    </Badge>
                  </div>

                  <textarea
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    rows={4}
                    placeholder={
                      selectedReplyWindowOpen
                        ? "Write your manual WhatsApp reply..."
                        : "24-hour reply window is closed."
                    }
                    disabled={!selectedReplyWindowOpen || sendingReply}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#07111F] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold text-slate-500">
                      {replyMessage.trim().length}/1700 characters
                    </p>

                    <button
                      type="button"
                      onClick={sendAdminReply}
                      disabled={
                        sendingReply ||
                        !selectedReplyWindowOpen ||
                        !replyMessage.trim()
                      }
                      className="rounded-full bg-[#07111F] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingReply ? "Sending..." : "Send Manual Reply"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}