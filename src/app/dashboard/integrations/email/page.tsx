"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  CircleAlert,
  Mail,
  Save,
  ShieldCheck,
  Unplug,
  UsersRound,
  Zap,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type EmailConnection = {
  id: string;
  mailbox_email: string | null;
  connection_label: string | null;
  status: string;
  selected_ai_staff_id: string | null;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  handover_enabled: boolean;
  is_primary: boolean;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  last_error_message: string | null;
};

type Assignment = {
  channel_connection_id: string;
  ai_staff_id: string;
  is_default: boolean;
  is_enabled: boolean;
  priority: number;
};

type AiStaff = { id: string; name: string; role: string | null; status: string | null };

async function accessToken() {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token || "";
}

function dateLabel(value: string | null) {
  if (!value) return "Not available yet";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusText(connection: EmailConnection | null) {
  if (!connection) return "Ready to connect";
  if (connection.status === "reauthorization_required") return "Reconnect your email";
  if (connection.status === "failed") return "Connection needs attention";
  if (connection.status !== "connected") return "Email paused";
  if (
    connection.ai_enabled &&
    connection.auto_reply_enabled &&
    connection.selected_ai_staff_id
  ) {
    return "Automatic AI replies live";
  }
  return "Connected — AI replies off";
}

function statusBadgeText(connection: EmailConnection | null) {
  if (!connection) return "Not connected";
  if (connection.status === "connected") return "Connected";
  if (connection.status === "reauthorization_required") return "Reconnect";
  if (connection.status === "failed") return "Needs attention";
  return "Paused";
}

export default function EmailIntegrationPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const workspaceId = workspace?.id || "";
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [staff, setStaff] = useState<AiStaff[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [label, setLabel] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [handoverEnabled, setHandoverEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => connections.find((item) => item.id === selectedId) || connections[0] || null,
    [connections, selectedId]
  );

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const token = await accessToken();
    setIsLoading(true);
    setError("");
    try {
      const [settingsResponse, staffResult] = await Promise.all([
        fetch(
          `/api/email/google/settings?workspace_id=${encodeURIComponent(workspaceId)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        ),
        createClient()
          .from("ai_staff")
          .select("id,name,role,status")
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
      ]);
      const settings = await settingsResponse.json().catch(() => ({}));
      if (!settingsResponse.ok) throw new Error(settings.error || "Email settings could not be loaded.");
      if (staffResult.error) throw staffResult.error;
      const nextConnections = (settings.connections || []) as EmailConnection[];
      const nextAssignments = (settings.assignments || []) as Assignment[];
      const nextSelected =
        nextConnections.find((item) => item.is_primary) || nextConnections[0] || null;
      const nextDefaultAssignment = nextSelected
        ? nextAssignments.find(
            (item) =>
              item.channel_connection_id === nextSelected.id && item.is_default
          )
        : null;
      setConnections(nextConnections);
      setAssignments(nextAssignments);
      setStaff((staffResult.data || []) as AiStaff[]);
      setSelectedId(nextSelected?.id || "");
      setSelectedStaffId(
        nextDefaultAssignment?.ai_staff_id ||
          nextSelected?.selected_ai_staff_id ||
          ""
      );
      setLabel(nextSelected?.connection_label || "");
      setAiEnabled(nextSelected?.ai_enabled || false);
      setAutoReplyEnabled(nextSelected?.auto_reply_enabled || false);
      setHandoverEnabled(nextSelected?.handover_enabled !== false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Email settings could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const values = new URLSearchParams(window.location.search);
    const timer = window.setTimeout(() => {
      if (values.get("email_connected") === "1") {
        setNotice(`${values.get("mailbox") || "Google mailbox"} connected successfully. Choose the AI staff and save your settings.`);
        window.history.replaceState({}, "", window.location.pathname);
      } else if (values.get("email_error")) {
        setError("Google could not finish connecting this mailbox. Check the setup and try again.");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function chooseConnection(connection: EmailConnection) {
    const defaultAssignment = assignments.find(
      (item) => item.channel_connection_id === connection.id && item.is_default
    );
    setSelectedId(connection.id);
    setSelectedStaffId(
      defaultAssignment?.ai_staff_id || connection.selected_ai_staff_id || ""
    );
    setLabel(connection.connection_label || "");
    setAiEnabled(connection.ai_enabled);
    setAutoReplyEnabled(connection.auto_reply_enabled);
    setHandoverEnabled(connection.handover_enabled);
  }

  async function connectMailbox() {
    if (!workspace?.id) return;
    setIsWorking(true);
    setError("");
    setNotice("");
    try {
      const token = await accessToken();
      const response = await fetch("/api/email/google/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspace_id: workspace.id,
          return_to: "/dashboard/integrations/email",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.authorization_url) {
        throw new Error(result.error || "Google connection could not be started.");
      }
      window.location.assign(result.authorization_url);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Google connection could not be started.");
      setIsWorking(false);
    }
  }

  async function saveSettings() {
    if (!workspace?.id || !selected) return;
    if (aiEnabled && !selectedStaffId) {
      setError("Choose AI staff before enabling Email AI.");
      return;
    }
    if (autoReplyEnabled && !aiEnabled) {
      setError("Turn on AI before enabling automatic replies.");
      return;
    }
    setIsWorking(true);
    setError("");
    setNotice("");
    try {
      const token = await accessToken();
      const response = await fetch("/api/email/google/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspace_id: workspace.id,
          connection_id: selected.id,
          connection_label: label,
          selected_ai_staff_id: selectedStaffId || null,
          staff_ids: selectedStaffId ? [selectedStaffId] : [],
          ai_enabled: aiEnabled,
          auto_reply_enabled: autoReplyEnabled,
          handover_enabled: handoverEnabled,
          is_primary: true,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Email settings could not be saved.");
      setNotice(
        autoReplyEnabled
          ? "Saved. Automatic AI email replies are now active. Each successful AI reply uses 3 credits."
          : "Saved. Emails will continue to arrive in your business mailbox and appear in Kolkap Inbox. AI replies are off."
      );
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Email settings could not be saved.");
    } finally {
      setIsWorking(false);
    }
  }

  async function disconnect() {
    if (!workspace?.id || !selected) return;
    if (!window.confirm(`Disconnect ${selected.mailbox_email || "this mailbox"} from Kolkap?`)) return;
    setIsWorking(true);
    setError("");
    try {
      const token = await accessToken();
      const response = await fetch("/api/email/google/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ workspace_id: workspace.id, connection_id: selected.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Mailbox could not be disconnected.");
      setNotice("Mailbox disconnected. Kolkap can no longer read or send mail from it.");
      setSelectedId("");
      await load();
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Mailbox could not be disconnected.");
    } finally {
      setIsWorking(false);
    }
  }

  if (workspaceState.isLoading || isLoading) {
    return <main className="min-h-screen bg-[#F7F9FA] p-8 text-xl font-black text-[#07111F]">Loading Email setup...</main>;
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-6xl flex-col gap-7 px-5 py-7 sm:px-7">
        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <Link href="/dashboard/integrations" className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-base font-black">
            <ArrowLeft className="h-5 w-5" /> Back to Customer Channels
          </Link>
          <div className="mt-7 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]"><Mail className="h-8 w-8" /></div>
            <div>
              <p className="font-black uppercase tracking-[0.18em] text-[#7CFF3D]">Email Integration</p>
              <h1 className="mt-1 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Connect Gmail or Google Workspace.</h1>
            </div>
          </div>
          <p className="mt-6 max-w-4xl text-lg font-semibold leading-8 text-slate-300">
            Customer emails continue to arrive in your business mailbox and also appear in Kolkap Inbox. Your team or assigned AI staff can reply from the same email address, inside the original email thread.
          </p>
        </section>

        {notice ? <div className="flex items-start gap-3 rounded-3xl border border-lime-300 bg-lime-50 p-5 font-bold text-lime-900"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />{notice}</div> : null}
        {error || workspaceState.error ? <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 font-bold text-red-700"><CircleAlert className="mt-0.5 h-6 w-6 shrink-0" />{error || workspaceState.error}</div> : null}

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <Mail className="h-10 w-10" />
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">Gmail &amp; Google Workspace</h2>
            <p className="mt-3 font-semibold leading-7 text-slate-600">
              Works with Gmail and Google Workspace, including company email addresses using your own domain. Your mailbox remains with Google.
            </p>
            {connections.length > 1 ? (
              <div className="mt-5 space-y-2">
                {connections.map((item) => (
                  <button key={item.id} onClick={() => chooseConnection(item)} className={`w-full rounded-2xl border p-4 text-left font-black ${selected?.id === item.id ? "border-[#07111F] bg-slate-100" : "border-slate-200"}`}>{item.mailbox_email}</button>
                ))}
              </div>
            ) : null}
            <button disabled={isWorking} onClick={connectMailbox} className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white disabled:opacity-50">
              <Mail className="h-5 w-5" />{selected ? "Reconnect with Google" : "Connect with Google"}
            </button>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Email status</p>
                <h2 className="mt-2 text-3xl font-black">{statusText(selected)}</h2>
                <p className="mt-2 text-lg font-bold text-slate-600">{selected?.mailbox_email || "Connect an email account to get started."}</p>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-black ${selected?.status === "connected" ? "bg-lime-100 text-lime-900" : "bg-amber-100 text-amber-900"}`}>{statusBadgeText(selected)}</span>
            </div>
            {selected ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-100 p-4"><p className="text-xs font-black uppercase text-slate-500">Last customer email</p><p className="mt-2 font-bold">{dateLabel(selected.last_inbound_at)}</p></div>
                <div className="rounded-2xl bg-slate-100 p-4"><p className="text-xs font-black uppercase text-slate-500">Last reply sent</p><p className="mt-2 font-bold">{dateLabel(selected.last_outbound_at)}</p></div>
              </div>
            ) : null}
            {selected?.last_error_message ? <p className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{selected.last_error_message}</p> : null}
          </div>
        </section>

        {selected ? (
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-4"><Bot className="h-10 w-10" /><div><p className="font-black uppercase tracking-[0.18em] text-blue-600">AI staff settings</p><h2 className="text-3xl font-black">Choose how email replies should work.</h2></div></div>
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              <label className="font-black">Mailbox label<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Customer Enquiries" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-4 font-semibold outline-none focus:border-[#07111F]" /></label>
              <label className="font-black">Assigned AI staff<select value={selectedStaffId} onChange={(event) => setSelectedStaffId(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 font-semibold outline-none focus:border-[#07111F]"><option value="">Choose AI staff</option>{staff.filter((item) => !item.status || item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name}{item.role ? ` — ${item.role}` : ""}</option>)}</select></label>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <label className="flex cursor-pointer gap-4 rounded-3xl border border-slate-200 p-5"><input type="checkbox" checked={aiEnabled} onChange={(event) => { setAiEnabled(event.target.checked); if (!event.target.checked) setAutoReplyEnabled(false); }} className="mt-1 h-5 w-5" /><span><strong className="block text-lg">Enable AI assistance</strong><span className="mt-1 block font-semibold text-slate-600">Allows AI suggestions and automatic replies.</span></span></label>
              <label className="flex cursor-pointer gap-4 rounded-3xl border border-slate-200 p-5"><input type="checkbox" checked={autoReplyEnabled} onChange={(event) => { setAutoReplyEnabled(event.target.checked); if (event.target.checked) setAiEnabled(true); }} className="mt-1 h-5 w-5" /><span><strong className="block text-lg">Reply automatically</strong><span className="mt-1 block font-semibold text-slate-600">Uses 3 credits for each successful automatic AI reply.</span></span></label>
              <label className="flex cursor-pointer gap-4 rounded-3xl border border-slate-200 p-5"><input type="checkbox" checked={handoverEnabled} onChange={(event) => setHandoverEnabled(event.target.checked)} className="mt-1 h-5 w-5" /><span><strong className="block text-lg">Human handover</strong><span className="mt-1 block font-semibold text-slate-600">Stops AI when the customer asks for a person.</span></span></label>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button disabled={isWorking} onClick={saveSettings} className="inline-flex items-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black disabled:opacity-50"><Save className="h-5 w-5" />Save Email Settings</button>
              <button disabled={isWorking} onClick={disconnect} className="inline-flex items-center gap-3 rounded-full border border-red-200 px-6 py-4 font-black text-red-700 disabled:opacity-50"><Unplug className="h-5 w-5" />Disconnect</button>
            </div>
          </section>
        ) : null}

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6"><ShieldCheck className="h-9 w-9" /><h3 className="mt-4 text-xl font-black">Your mailbox stays yours</h3><p className="mt-2 font-semibold leading-7 text-slate-600">Your emails remain in Gmail or Google Workspace. You can disconnect Kolkap at any time.</p></div>
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6"><Zap className="h-9 w-9" /><h3 className="mt-4 text-xl font-black">Simple credit use</h3><p className="mt-2 font-semibold leading-7 text-slate-600">Receiving emails and replies written by your team are free. Each AI-generated reply uses 3 credits.</p></div>
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6"><UsersRound className="h-9 w-9" /><h3 className="mt-4 text-xl font-black">You stay in control</h3><p className="mt-2 font-semibold leading-7 text-slate-600">Your team can take over any conversation and reply personally at any time.</p></div>
        </section>

      </div>
    </main>
  );
}
