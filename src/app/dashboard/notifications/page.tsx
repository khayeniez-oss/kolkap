"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Bell,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Inbox,
  Loader2,
  MessageCircle,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NotificationStatus = "all" | "unread" | "read" | "archived";

type KolkapNotification = {
  id: string;
  workspace_id: string | null;
  owner_user_id: string | null;
  recipient_user_id: string | null;
  type: string;
  channel: string;
  title: string;
  message: string;
  action_label: string | null;
  action_url: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "unread" | "read" | "archived";
  source_table: string | null;
  source_record_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
  read_at: string | null;
  archived_at: string | null;
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

const filters: { value: NotificationStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
];

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

function getPriorityClass(priority: string) {
  const clean = priority.toLowerCase();

  if (clean === "urgent" || clean === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (clean === "low") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getStatusClass(status: string) {
  if (status === "unread") {
    return "border-[#7CFF3D]/40 bg-[#7CFF3D]/15 text-[#07111F]";
  }

  if (status === "archived") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getNotificationIcon(type: string) {
  const clean = type.toLowerCase();

  if (clean.includes("whatsapp")) return MessageCircle;
  if (clean.includes("billing") || clean.includes("payment")) return CreditCard;
  if (clean.includes("credit")) return WalletCards;
  if (clean.includes("help")) return HelpCircle;
  if (clean.includes("message") || clean.includes("inbox")) return Inbox;

  return Bell;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
        status
      )}`}
    >
      {cleanLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getPriorityClass(
        priority
      )}`}
    >
      {cleanLabel(priority, "Normal")}
    </span>
  );
}

export default function DashboardNotificationsPage() {
  const [notifications, setNotifications] = useState<KolkapNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] =
    useState<PaginationState>(EMPTY_PAGINATION);

  const [filter, setFilter] = useState<NotificationStatus>("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [updatingAll, setUpdatingAll] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const hasUnread = unreadCount > 0;

  const filterLabel = useMemo(() => {
    return filters.find((item) => item.value === filter)?.label || "All";
  }, [filter]);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadNotifications(
    nextFilter = filter,
    nextPage = page,
    showLoading = true
  ) {
    try {
      if (showLoading) setLoading(true);
      setError("");
      setNotice("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in first.");
        setNotifications([]);
        setUnreadCount(0);
        setPagination(EMPTY_PAGINATION);
        return;
      }

      const params = new URLSearchParams({
        status: nextFilter,
        page: String(nextPage),
        pageSize: "25",
      });

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load notifications.");
      }

      setNotifications((result.notifications || []) as KolkapNotification[]);
      setUnreadCount(Number(result.unreadCount || 0));
      setPagination((result.pagination || EMPTY_PAGINATION) as PaginationState);
    } catch (loadError) {
      console.error("Load notifications error:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load notifications."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function updateNotification({
    action,
    notificationId,
  }: {
    action: "mark_read" | "archive";
    notificationId: string;
  }) {
    try {
      setUpdatingId(notificationId);
      setError("");
      setNotice("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in first.");
        return;
      }

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          notificationId,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update notification.");
      }

      setNotice(
        action === "archive"
          ? "Notification archived."
          : "Notification marked as read."
      );

      await loadNotifications(filter, page, false);
    } catch (updateError) {
      console.error("Update notification error:", updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update notification."
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function markAllRead() {
    try {
      setUpdatingAll(true);
      setError("");
      setNotice("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in first.");
        return;
      }

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark_all_read",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to mark notifications as read.");
      }

      setNotice("All unread notifications were marked as read.");
      await loadNotifications(filter, page, false);
    } catch (updateError) {
      console.error("Mark all notifications read error:", updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to mark notifications as read."
      );
    } finally {
      setUpdatingAll(false);
    }
  }

  function changeFilter(nextFilter: NotificationStatus) {
    setFilter(nextFilter);
    setPage(1);
  }

  function goToPreviousPage() {
    if (!pagination.hasPreviousPage) return;
    setPage((currentPage) => Math.max(1, currentPage - 1));
  }

  function goToNextPage() {
    if (!pagination.hasNextPage) return;
    setPage((currentPage) => currentPage + 1);
  }

  useEffect(() => {
    loadNotifications(filter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  return (
    <main className="min-h-screen bg-[#F7F9FA] px-5 py-8 text-[#07111F]">
      <section className="mx-auto grid max-w-7xl gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm shadow-slate-900/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => loadNotifications(filter, page)}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-[#7CFF3D]">
            <Bell className="h-5 w-5" />
            Notification Centre
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Stay updated on your Kolkap workspace.
          </h1>

          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
            See important updates for messages, WhatsApp inquiries, billing,
            credits, Help Centre requests, and workspace activity.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                Unread
              </p>
              <p className="mt-2 text-3xl font-black text-[#7CFF3D]">
                {unreadCount}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                Showing
              </p>
              <p className="mt-2 text-3xl font-black">{filterLabel}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                Total
              </p>
              <p className="mt-2 text-3xl font-black">
                {pagination.totalCount}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Notifications
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Filter your notifications and mark important updates as read.
              </p>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              disabled={!hasUnread || updatingAll}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {updatingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Mark All Read
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((item) => (
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

          {notice ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-[2rem] border border-slate-200 bg-[#F7F9FA]">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                <p className="mt-4 text-sm font-bold text-slate-500">
                  Loading notifications...
                </p>
              </div>
            </div>
          ) : null}

          {!loading && notifications.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8 text-center">
              <div>
                <Bell className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">
                  No notifications yet
                </h3>
                <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                  When there are new messages, WhatsApp inquiries, billing
                  alerts, credit reminders, or Help Centre updates, they will
                  appear here.
                </p>
              </div>
            </div>
          ) : null}

          {!loading && notifications.length > 0 ? (
            <div className="grid gap-3">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const isUnread = notification.status === "unread";
                const isUpdating = updatingId === notification.id;

                return (
                  <article
                    key={notification.id}
                    className={`rounded-[2rem] border p-5 transition ${
                      isUnread
                        ? "border-[#7CFF3D]/40 bg-[#7CFF3D]/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            isUnread
                              ? "bg-[#07111F] text-[#7CFF3D]"
                              : "bg-[#F7F9FA] text-[#07111F]"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black tracking-[-0.04em]">
                              {notification.title}
                            </h3>

                            <StatusBadge status={notification.status} />
                            <PriorityBadge priority={notification.priority} />
                          </div>

                          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">
                            {notification.message}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                            <span>{cleanLabel(notification.type)}</span>
                            <span>•</span>
                            <span>{cleanLabel(notification.channel)}</span>
                            <span>•</span>
                            <span>{formatDate(notification.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {notification.action_url ? (
                          <Link
                            href={notification.action_url}
                            className="inline-flex items-center justify-center rounded-full bg-[#07111F] px-4 py-2 text-xs font-black text-white"
                          >
                            {notification.action_label || "Open"}
                          </Link>
                        ) : null}

                        {notification.status === "unread" ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateNotification({
                                action: "mark_read",
                                notificationId: notification.id,
                              })
                            }
                            disabled={isUpdating}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Mark Read
                          </button>
                        ) : null}

                        {notification.status !== "archived" ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateNotification({
                                action: "archive",
                                notificationId: notification.id,
                              })
                            }
                            disabled={isUpdating}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" />
                            )}
                            Archive
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {!loading && pagination.totalCount > 0 ? (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Showing {pagination.from}-{pagination.to} of{" "}
                {pagination.totalCount} · Page {pagination.page} of{" "}
                {pagination.totalPages}
              </p>

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
          ) : null}
        </section>
      </section>
    </main>
  );
}