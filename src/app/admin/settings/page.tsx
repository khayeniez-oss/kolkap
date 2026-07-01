"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CreditCard,
  Database,
  Globe2,
  KeyRound,
  Mail,
  MessageCircle,
  RefreshCw,
  Settings,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type HealthStatus = "healthy" | "warning" | "missing";

type HealthItem = {
  key: string;
  label: string;
  configured: boolean;
  required: boolean;
  safeValue?: string;
  note?: string;
};

type HealthGroup = {
  key: string;
  title: string;
  description: string;
  status: HealthStatus;
  items: HealthItem[];
};

type DatabaseCheck = {
  table: string;
  ok: boolean;
  count: number;
  error: string;
};

type SettingsResponse = {
  success: boolean;
  generatedAt: string;
  checkedBy: string | null;
  overallStatus: HealthStatus;
  groups: HealthGroup[];
  databaseChecks: DatabaseCheck[];
  notes: string[];
};

const EMPTY_RESPONSE: SettingsResponse = {
  success: false,
  generatedAt: "",
  checkedBy: null,
  overallStatus: "missing",
  groups: [],
  databaseChecks: [],
  notes: [],
};

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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function getStatusLabel(status: HealthStatus) {
  if (status === "healthy") return "Healthy";
  if (status === "warning") return "Needs Review";
  return "Missing Setup";
}

function getStatusClass(status: HealthStatus) {
  if (status === "healthy") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function ConfigBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
      <XCircle className="h-3.5 w-3.5" />
      Missing
    </span>
  );
}

function getGroupIcon(key: string) {
  if (key === "supabase") return Database;
  if (key === "admin") return ShieldCheck;
  if (key === "stripe") return CreditCard;
  if (key === "meta") return MessageCircle;
  if (key === "openai") return Bot;
  if (key === "app") return Globe2;

  return Settings;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse>(EMPTY_RESPONSE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const groups = settings.groups || [];
    const healthy = groups.filter((group) => group.status === "healthy").length;
    const warning = groups.filter((group) => group.status === "warning").length;
    const missing = groups.filter((group) => group.status === "missing").length;

    return {
      total: groups.length,
      healthy,
      warning,
      missing,
    };
  }, [settings.groups]);

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        setSettings(EMPTY_RESPONSE);
        return;
      }

      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load system settings.");
      }

      setSettings(result as SettingsResponse);
    } catch (loadError) {
      console.error("Load admin settings error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load system settings."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              Kolkap Admin
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Settings
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              View-only system health checks for Supabase, Stripe, Meta
              WhatsApp, OpenAI, admin access, app defaults, and database tables.
              Secret values are never shown here.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Overall
            </p>

            <div className="mt-3">
              <StatusBadge status={settings.overallStatus} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-500">
              Healthy
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {summary.healthy}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-500">
              Review
            </p>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {summary.warning}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
              Missing
            </p>
            <p className="mt-2 text-3xl font-black text-red-700">
              {summary.missing}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-slate-600">
              Checked by:{" "}
              <span className="font-black text-[#07111F]">
                {settings.checkedBy || "-"}
              </span>
            </p>

            <p className="text-sm font-bold text-slate-600">
              Last checked:{" "}
              <span className="font-black text-[#07111F]">
                {formatDate(settings.generatedAt)}
              </span>
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 py-3 text-sm font-bold text-slate-500">
            Loading system health...
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {settings.groups.map((group) => {
          const Icon = getGroupIcon(group.key);

          return (
            <div
              key={group.key}
              className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black tracking-[-0.04em]">
                      {group.title}
                    </h2>

                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      {group.description}
                    </p>
                  </div>
                </div>

                <StatusBadge status={group.status} />
              </div>

              <div className="mt-5 grid gap-3">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-[#07111F]">
                          {item.label}
                        </p>

                        {item.safeValue ? (
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Value: {item.safeValue}
                          </p>
                        ) : null}

                        {item.note ? (
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                            {item.note}
                          </p>
                        ) : null}

                        {!item.required ? (
                          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                            Optional / fallback available
                          </p>
                        ) : null}
                      </div>

                      <ConfigBadge configured={item.configured} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <Database className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-black tracking-[-0.04em]">
              Database Tables
            </h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Quick availability check for important Kolkap operational tables.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden bg-[#F7F9FA] text-xs font-black uppercase tracking-[0.12em] text-slate-400 md:grid md:grid-cols-[minmax(0,1fr)_140px_140px]">
            <div className="px-4 py-3">Table</div>
            <div className="px-4 py-3">Rows</div>
            <div className="px-4 py-3">Status</div>
          </div>

          <div className="divide-y divide-slate-100">
            {settings.databaseChecks.map((check) => (
              <div
                key={check.table}
                className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_140px_140px] md:items-center"
              >
                <div>
                  <p className="font-mono text-sm font-black text-[#07111F]">
                    {check.table}
                  </p>

                  {!check.ok && check.error ? (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {check.error}
                    </p>
                  ) : null}
                </div>

                <p className="text-sm font-black text-slate-700">
                  {numberFormat(check.count)}
                </p>

                {check.ok ? (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Available
                  </span>
                ) : (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                    <XCircle className="h-3.5 w-3.5" />
                    Check
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-700" />

          <div>
            <h2 className="text-base font-black text-amber-900">
              View-only settings
            </h2>

            <p className="mt-1 text-sm font-bold leading-6 text-amber-900">
              This page does not edit environment variables, Stripe settings,
              Meta settings, or database records. It only checks configuration
              readiness so we do not accidentally expose or change production
              secrets from the browser.
            </p>

            {settings.notes.length > 0 ? (
              <div className="mt-3 grid gap-1">
                {settings.notes.map((note) => (
                  <p
                    key={note}
                    className="flex items-start gap-2 text-xs font-bold leading-5 text-amber-900"
                  >
                    <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {note}
                  </p>
                ))}
              </div>
            ) : null}

            <p className="mt-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-amber-900">
              <Mail className="h-4 w-4" />
              Support: support@kolkap.com
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}