"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type HelpRequest = {
  id: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  admin_note: string | null;
  created_at: string | null;
  updated_at: string | null;
  resolved_at: string | null;
  closed_at?: string | null;
};

const categories = [
  { value: "whatsapp", label: "WhatsApp setup" },
  { value: "website_chat", label: "Website chat" },
  { value: "ai_staff", label: "AI staff" },
  { value: "billing", label: "Billing / payment" },
  { value: "credits", label: "Credits" },
  { value: "account", label: "Account" },
  { value: "bug", label: "Bug / error" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
  { value: "low", label: "Low" },
];

function cleanLabel(value?: string | null, fallback = "-") {
  const clean = String(value || "").trim();

  if (!clean) return fallback;

  return clean
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function getStatusDescription(value?: string | null) {
  const clean = String(value || "").toLowerCase();

  if (clean === "in_progress") {
    return "Kolkap is reviewing this request.";
  }

  if (clean === "resolved") {
    return "Kolkap marked this request as resolved.";
  }

  if (clean === "closed") {
    return "This request has been closed.";
  }

  return "Kolkap received this request and it is waiting for review.";
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

export default function DashboardHelpPage() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(
    null
  );

  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("normal");
  const [customerPhone, setCustomerPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedStatusDescription = useMemo(() => {
    return getStatusDescription(selectedRequest?.status);
  }, [selectedRequest?.status]);

  const openRequestsCount = useMemo(() => {
    return requests.filter((request) => {
      const status = String(request.status || "").toLowerCase();

      return status !== "resolved" && status !== "closed";
    }).length;
  }, [requests]);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in first.");
        setRequests([]);
        setSelectedRequest(null);
        return;
      }

      const response = await fetch("/api/help/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load help requests.");
      }

      const nextRequests = (result.requests || []) as HelpRequest[];

      setRequests(nextRequests);

      setSelectedRequest((current) => {
        if (!nextRequests.length) return null;

        if (!current?.id) return nextRequests[0];

        return (
          nextRequests.find((request) => request.id === current.id) ||
          nextRequests[0]
        );
      });
    } catch (loadError) {
      console.error("Load help requests error:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load help requests."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSending(true);
      setError("");
      setNotice("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in first.");
        return;
      }

      const response = await fetch("/api/help/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          priority,
          customer_phone: customerPhone,
          subject,
          message,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send help request.");
      }

      setNotice(
        "Your help request was sent to Kolkap. Our team will get back to you within 24 hours."
      );
      setSubject("");
      setMessage("");
      setCustomerPhone("");
      setCategory("other");
      setPriority("normal");

      await loadRequests();
    } catch (submitError) {
      console.error("Submit help request error:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send help request."
      );
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

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
            onClick={loadRequests}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-[#7CFF3D]">
            <HelpCircle className="h-5 w-5" />
            Kolkap Help Centre
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Need help with your Kolkap workspace?
          </h1>

          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
            Send us your issue and our team will get back to you within 24
            hours.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                Total Requests
              </p>

              <p className="mt-2 text-3xl font-black">{requests.length}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                Open Requests
              </p>

              <p className="mt-2 text-3xl font-black text-[#7CFF3D]">
                {openRequestsCount}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                Response Time
              </p>

              <p className="mt-2 text-3xl font-black">24h</p>
            </div>
          </div>
        </section>

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="grid gap-6">
            <form
              onSubmit={submitRequest}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
            >
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Send Help Request
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Tell us what happened. Choose the closest category so our team
                can review it faster.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#07111F]"
                  >
                    {categories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#07111F]"
                  >
                    {priorities.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Phone / WhatsApp Number
                </label>

                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Optional, but helpful if we need to contact you"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#07111F]"
                />
              </div>

              <div className="mt-4">
                <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Subject
                </label>

                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Example: I cannot connect WhatsApp"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#07111F]"
                />
              </div>

              <div className="mt-4">
                <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  What do you need help with?
                </label>

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={8}
                  placeholder="Please explain the issue. Include the page name, error message, payment issue, WhatsApp issue, or anything you need help with."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-[#07111F]"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#07111F] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? "Sending..." : "Send to Kolkap"}
              </button>
            </form>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Your Requests
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Select a request to see the current status and latest update
                from Kolkap.
              </p>

              <div className="mt-5 grid gap-3">
                {loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4 text-sm font-bold text-slate-500">
                    Loading requests...
                  </div>
                ) : null}

                {!loading && requests.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-6 text-center">
                    <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      No help requests yet.
                    </p>
                  </div>
                ) : null}

                {requests.map((request) => {
                  const active = selectedRequest?.id === request.id;

                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className={`rounded-2xl border p-4 text-left transition ${
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
                            className={`mt-1 text-xs font-semibold ${
                              active ? "text-white/60" : "text-slate-500"
                            }`}
                          >
                            {cleanLabel(request.category)}
                          </p>
                        </div>

                        <StatusBadge value={request.status} />
                      </div>

                      <p
                        className={`mt-3 line-clamp-2 text-sm font-semibold leading-6 ${
                          active ? "text-white/75" : "text-slate-600"
                        }`}
                      >
                        {request.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <PriorityBadge value={request.priority} />

                        {request.admin_note ? (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                              active
                                ? "border-white/10 bg-white/10 text-white"
                                : "border-blue-200 bg-blue-50 text-blue-700"
                            }`}
                          >
                            Updated by Kolkap
                          </span>
                        ) : null}
                      </div>

                      <p
                        className={`mt-3 text-xs font-semibold ${
                          active ? "text-white/50" : "text-slate-400"
                        }`}
                      >
                        Sent: {formatDate(request.created_at)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="grid gap-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 xl:sticky xl:top-28">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                Request Status
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Track the latest update from Kolkap here.
              </p>

              {!selectedRequest ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-[#F7F9FA] p-6 text-center">
                  <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />

                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    Select a request to view details.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4">
                  <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                          Selected Request
                        </p>

                        <h3 className="mt-2 text-xl font-black tracking-[-0.04em]">
                          {selectedRequest.subject}
                        </h3>
                      </div>

                      <StatusBadge value={selectedRequest.status} />
                    </div>

                    <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                      {selectedStatusDescription}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <PriorityBadge value={selectedRequest.priority} />

                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {cleanLabel(selectedRequest.category)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-blue-700" />

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
                          Latest Update From Kolkap
                        </p>

                        {selectedRequest.admin_note ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-blue-900">
                            {selectedRequest.admin_note}
                          </p>
                        ) : (
                          <p className="mt-3 text-sm font-bold leading-7 text-blue-900">
                            No admin update yet. Our team will review your
                            request and update you here.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      Original Message
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                      {selectedRequest.message}
                    </p>
                  </div>

                  <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-1 h-5 w-5 shrink-0 text-slate-400" />

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            Submitted
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-700">
                            {formatDate(selectedRequest.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <RefreshCw className="mt-1 h-5 w-5 shrink-0 text-slate-400" />

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            Last Updated
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-700">
                            {formatDate(selectedRequest.updated_at)}
                          </p>
                        </div>
                      </div>

                      {selectedRequest.resolved_at ? (
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />

                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600">
                              Resolved
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-700">
                              {formatDate(selectedRequest.resolved_at)}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {selectedRequest.closed_at ? (
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />

                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600">
                              Closed
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-700">
                              {formatDate(selectedRequest.closed_at)}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    href="/dashboard/notifications"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                  >
                    View Notifications
                    <CheckCircle2 className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}