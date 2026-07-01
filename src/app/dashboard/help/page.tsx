"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
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

export default function DashboardHelpPage() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("normal");
  const [customerPhone, setCustomerPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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

      setRequests((result.requests || []) as HelpRequest[]);
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
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <form
            onSubmit={submitRequest}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
          >
            <h2 className="text-2xl font-black tracking-[-0.04em]">
              Send Help Request
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Tell us what happened. Choose the closest category so our team can
              review it faster.
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

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-2xl font-black tracking-[-0.04em]">
              Your Recent Requests
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              You can check the latest requests you sent to Kolkap here.
            </p>

            <div className="mt-5 grid gap-3">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4 text-sm font-bold text-slate-500">
                  Loading requests...
                </div>
              ) : null}

              {!loading && requests.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-5 text-center">
                  <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    No help requests yet.
                  </p>
                </div>
              ) : null}

              {requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">
                        {request.subject}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {cleanLabel(request.category)}
                      </p>
                    </div>

                    <StatusBadge value={request.status} />
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
                    {request.message}
                  </p>

                  {request.admin_note ? (
                    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                      <div className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                        <p className="text-xs font-bold leading-5 text-blue-900">
                          {request.admin_note}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <p className="mt-3 text-xs font-semibold text-slate-400">
                    Sent: {formatDate(request.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}