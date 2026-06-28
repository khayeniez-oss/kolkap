"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Inbox,
  MessageCircle,
  Phone,
  PlugZap,
  Plus,
  RefreshCcw,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";
import { createClient } from "@/lib/supabase/client";
import {
  canAddMoreWhatsAppNumbers,
  getKolkapPlan,
  getPlanWhatsAppNumberLimitLabel,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type AiStaffRow = {
  id: string;
  name: string;
  role: string;
  status: string;
};

type WhatsAppConnectionRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  provider: string;
  status: string;
  connection_label: string | null;
  display_phone_number: string | null;
  selected_ai_staff_id: string | null;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  handover_enabled: boolean;
  is_primary: boolean;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  last_status_at: string | null;
  last_error_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type WhatsAppLogRow = {
  id: string;
  workspace_id: string;
  connection_id: string | null;
  direction: string;
  status: string;
  customer_phone: string | null;
  display_phone_number: string | null;
  message_text: string | null;
  error_code: string | null;
  error_message: string | null;
  credits_used: number;
  created_at: string;
};

type ActiveTab = "overview" | "numbers" | "logs" | "settings";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "AI Staff", href: "/dashboard/create-ai" },
  { label: "Business Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Integrations", href: "/dashboard/integrations" },
  { label: "Go Live", href: "/dashboard/go-live" },
];

const tabs: { id: ActiveTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "numbers", label: "WhatsApp Numbers" },
  { id: "logs", label: "Message Logs" },
  { id: "settings", label: "Settings" },
];

const emptyForm = {
  connection_label: "",
  display_phone_number: "",
  selected_ai_staff_id: "",
  ai_enabled: true,
  auto_reply_enabled: false,
  handover_enabled: true,
  is_primary: false,
  notes: "",
};

function formatDate(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusLabel(status: string | null) {
  if (!status || status === "not_connected") return "Not connected";
  if (status === "pending") return "Pending setup";
  if (status === "connected") return "Connected";
  if (status === "failed") return "Needs attention";
  if (status === "paused") return "Paused";

  return status;
}

function statusClass(status: string | null) {
  if (status === "connected") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (status === "pending") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "paused") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-slate-200 bg-[#F7F9FA] text-slate-700";
}

function messageStatusText(status: string | null) {
  if (!status) return "Pending";
  if (status === "received") return "Received";
  if (status === "pending_send") return "Preparing";
  if (status === "sent") return "Sent";
  if (status === "delivered") return "Delivered";
  if (status === "read") return "Read";
  if (status === "failed") return "Failed";
  if (status === "skipped") return "Skipped";
  if (status === "ignored") return "Ignored";

  return statusLabel(status);
}

export default function WhatsAppIntegrationPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [aiStaff, setAiStaff] = useState<AiStaffRow[]>([]);
  const [connections, setConnections] = useState<WhatsAppConnectionRow[]>([]);
  const [logs, setLogs] = useState<WhatsAppLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(
    null
  );
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const aiStaffById = useMemo(() => {
    return new Map(aiStaff.map((item) => [item.id, item]));
  }, [aiStaff]);

  const visibleConnections = useMemo(() => {
    return connections.filter(
      (item) =>
        item.display_phone_number ||
        item.connection_label ||
        item.status !== "not_connected"
    );
  }, [connections]);

  const connectedCount = visibleConnections.filter(
    (item) => item.status === "connected"
  ).length;

  const aiEnabledCount = visibleConnections.filter(
    (item) => item.ai_enabled
  ).length;

  const lastIssue = visibleConnections.find(
    (item) => item.last_error_code || item.last_error_message
  );

  const whatsappLimitLabel = getPlanWhatsAppNumberLimitLabel(currentPlan);
  const canAddWhatsAppNumber = canAddMoreWhatsAppNumbers(
    currentPlan,
    visibleConnections.length
  );

  const whatsappLimitValue =
    currentPlan.whatsappNumberLimit === "custom"
      ? `${visibleConnections.length}/Custom`
      : `${visibleConnections.length}/${currentPlan.whatsappNumberLimit}`;

  const limitReachedMessage =
    currentPlan.whatsappNumberLimit === "custom"
      ? ""
      : `Your ${currentPlan.name} plan includes ${whatsappLimitLabel}. Upgrade your plan to add more WhatsApp numbers.`;

  async function loadWhatsAppSetup() {
    if (!workspace?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const [{ data: staffData }, { data: connectionData }, { data: logData }] =
        await Promise.all([
          supabase
            .from("ai_staff")
            .select("id,name,role,status")
            .eq("workspace_id", workspace.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("workspace_whatsapp_connections")
            .select(
              "id,workspace_id,owner_user_id,provider,status,connection_label,display_phone_number,selected_ai_staff_id,ai_enabled,auto_reply_enabled,handover_enabled,is_primary,last_inbound_at,last_outbound_at,last_status_at,last_error_at,last_error_code,last_error_message,notes,created_at,updated_at"
            )
            .eq("workspace_id", workspace.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("whatsapp_message_logs")
            .select(
              "id,workspace_id,connection_id,direction,status,customer_phone,display_phone_number,message_text,error_code,error_message,credits_used,created_at"
            )
            .eq("workspace_id", workspace.id)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

      setAiStaff((staffData ?? []) as AiStaffRow[]);
      setConnections((connectionData ?? []) as WhatsAppConnectionRow[]);
      setLogs((logData ?? []) as WhatsAppLogRow[]);
    } catch {
      setError("WhatsApp setup could not load. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWhatsAppSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  function openAddForm() {
    setSuccess("");
    setError("");

    if (!canAddWhatsAppNumber) {
      setActiveTab("numbers");
      setIsFormOpen(false);
      setEditingConnectionId(null);
      setError(limitReachedMessage);
      return;
    }

    setEditingConnectionId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setActiveTab("numbers");
  }

  function openEditForm(connection: WhatsAppConnectionRow) {
    setEditingConnectionId(connection.id);
    setForm({
      connection_label: connection.connection_label ?? "",
      display_phone_number: connection.display_phone_number ?? "",
      selected_ai_staff_id: connection.selected_ai_staff_id ?? "",
      ai_enabled: connection.ai_enabled,
      auto_reply_enabled: connection.auto_reply_enabled,
      handover_enabled: connection.handover_enabled,
      is_primary: connection.is_primary,
      notes: connection.notes ?? "",
    });
    setIsFormOpen(true);
    setActiveTab("numbers");
    setSuccess("");
    setError("");
  }

  async function saveWhatsAppNumber() {
    if (!workspace?.id) {
      setError("Workspace is not ready yet.");
      return;
    }

    if (!editingConnectionId && !canAddWhatsAppNumber) {
      setError(limitReachedMessage);
      setIsFormOpen(false);
      return;
    }

    if (!form.display_phone_number.trim()) {
      setError("Please add a business WhatsApp number first.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error("Please log in again before saving WhatsApp setup.");
      }

      if (form.is_primary) {
        const clearPrimaryQuery = supabase
          .from("workspace_whatsapp_connections")
          .update({ is_primary: false })
          .eq("workspace_id", workspace.id);

        if (editingConnectionId) {
          await clearPrimaryQuery.neq("id", editingConnectionId);
        } else {
          await clearPrimaryQuery;
        }
      }

      const currentConnection = connections.find(
        (item) => item.id === editingConnectionId
      );

      const nextStatus =
        currentConnection?.status === "connected" ? "connected" : "pending";

      const payload = {
        workspace_id: workspace.id,
        owner_user_id: user.id,
        provider: "meta",
        status: nextStatus,
        connection_label: form.connection_label.trim() || null,
        display_phone_number: form.display_phone_number.trim(),
        selected_ai_staff_id: form.selected_ai_staff_id || null,
        ai_enabled: form.ai_enabled,
        auto_reply_enabled: form.auto_reply_enabled,
        handover_enabled: form.handover_enabled,
        is_primary: form.is_primary,
        notes: form.notes.trim() || null,
      };

      let saveError = null;

      if (editingConnectionId) {
        const result = await supabase
          .from("workspace_whatsapp_connections")
          .update(payload)
          .eq("id", editingConnectionId)
          .eq("workspace_id", workspace.id);

        saveError = result.error;
      } else {
        const result = await supabase
          .from("workspace_whatsapp_connections")
          .insert(payload);

        saveError = result.error;
      }

      if (saveError) {
        throw saveError;
      }

      setSuccess(
        editingConnectionId
          ? "WhatsApp number updated."
          : "WhatsApp number added. Status is pending setup."
      );

      setIsFormOpen(false);
      setEditingConnectionId(null);
      setForm(emptyForm);
      await loadWhatsAppSetup();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "WhatsApp setup could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading WhatsApp setup...
          </div>
        </section>
      </main>
    );
  }

  if (workspaceState.error) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] border border-red-200 bg-red-50 p-8 text-red-700">
            <p className="text-xl font-black">
              WhatsApp page could not load.
            </p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 lg:flex-row lg:items-center lg:justify-between">
          <KolkapLogo size="sm" />

          <nav className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full border px-5 py-3 text-base font-black transition ${
                  item.label === "Integrations"
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section>
          <Link
            href="/dashboard/integrations"
            className="mb-6 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-700 transition hover:border-[#07111F]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Customer Channels
          </Link>

          <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Smartphone className="h-5 w-5" />
              WhatsApp
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                  Manage WhatsApp numbers for customer replies.
                </h1>

                <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
                  Add business WhatsApp numbers, assign AI staff, control
                  auto-replies, keep human handover available, and track message
                  activity from your Kolkap workspace.
                </p>

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                    Current Plan Limit
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#7CFF3D]">
                    {currentPlan.name}: {whatsappLimitLabel}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={openAddForm}
                  disabled={!canAddWhatsAppNumber}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-6 w-6" />
                  Add WhatsApp Number
                </button>

                <Link
                  href="/dashboard/inbox"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <Inbox className="h-6 w-6" />
                  Open Inbox
                </Link>
              </div>
            </div>
          </div>
        </section>

        {!canAddWhatsAppNumber ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="text-lg font-black">WhatsApp number limit reached</p>
            <p className="mt-1 text-base font-semibold leading-7">
              {limitReachedMessage}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-lg font-black">Something needs attention</p>
            <p className="mt-1 text-base font-semibold leading-7">{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
            <p className="text-lg font-black">{success}</p>
          </div>
        ) : null}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={Phone}
            title="WhatsApp Numbers"
            value={whatsappLimitValue}
          />

          <SummaryCard
            icon={ShieldCheck}
            title="Connected"
            value={`${connectedCount}`}
          />

          <SummaryCard
            icon={Bot}
            title="AI Support On"
            value={`${aiEnabledCount}`}
          />

          <SummaryCard
            icon={AlertCircle}
            title="Setup Status"
            value={lastIssue ? "Needs attention" : "No issue"}
            danger={Boolean(lastIssue)}
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-5 py-3 text-base font-black transition ${
                  activeTab === tab.id
                    ? "bg-[#07111F] text-white"
                    : "bg-[#F7F9FA] text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "overview" ? (
          <OverviewPanel
            connections={visibleConnections}
            aiStaffById={aiStaffById}
            openAddForm={openAddForm}
            openEditForm={openEditForm}
            setActiveTab={setActiveTab}
            canAddWhatsAppNumber={canAddWhatsAppNumber}
            limitReachedMessage={limitReachedMessage}
          />
        ) : null}

        {activeTab === "numbers" ? (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <WhatsAppNumbersInventory
              isLoading={isLoading}
              connections={visibleConnections}
              aiStaffById={aiStaffById}
              openAddForm={openAddForm}
              openEditForm={openEditForm}
              canAddWhatsAppNumber={canAddWhatsAppNumber}
            />

            {isFormOpen ? (
              <WhatsAppNumberForm
                form={form}
                setForm={setForm}
                aiStaff={aiStaff}
                isSaving={isSaving}
                editing={Boolean(editingConnectionId)}
                onSave={saveWhatsAppNumber}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingConnectionId(null);
                  setForm(emptyForm);
                }}
              />
            ) : (
              <AddNumberSideCard
                openAddForm={openAddForm}
                canAddWhatsAppNumber={canAddWhatsAppNumber}
                limitReachedMessage={limitReachedMessage}
                whatsappLimitLabel={whatsappLimitLabel}
              />
            )}
          </section>
        ) : null}

        {activeTab === "logs" ? <MessageLogs logs={logs} /> : null}

        {activeTab === "settings" ? (
          <SettingsPanel loadWhatsAppSetup={loadWhatsAppSetup} />
        ) : null}
      </div>
    </main>
  );
}

function OverviewPanel({
  connections,
  aiStaffById,
  openAddForm,
  openEditForm,
  setActiveTab,
  canAddWhatsAppNumber,
  limitReachedMessage,
}: {
  connections: WhatsAppConnectionRow[];
  aiStaffById: Map<string, AiStaffRow>;
  openAddForm: () => void;
  openEditForm: (connection: WhatsAppConnectionRow) => void;
  setActiveTab: Dispatch<SetStateAction<ActiveTab>>;
  canAddWhatsAppNumber: boolean;
  limitReachedMessage: string;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Overview
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
              WhatsApp numbers in this workspace
            </h2>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            disabled={!canAddWhatsAppNumber}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            Add WhatsApp Number
          </button>
        </div>

        {!canAddWhatsAppNumber ? (
          <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="text-base font-black">{limitReachedMessage}</p>
          </div>
        ) : null}

        {connections.length === 0 ? (
          <EmptyNumbersState
            openAddForm={openAddForm}
            canAddWhatsAppNumber={canAddWhatsAppNumber}
          />
        ) : (
          <div className="grid gap-4">
            {connections.slice(0, 3).map((connection) => (
              <NumberRow
                key={connection.id}
                connection={connection}
                assignedAI={
                  connection.selected_ai_staff_id
                    ? aiStaffById.get(connection.selected_ai_staff_id)
                    : undefined
                }
                openEditForm={openEditForm}
              />
            ))}

            <button
              type="button"
              onClick={() => setActiveTab("numbers")}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-4 text-base font-black text-[#07111F] transition hover:-translate-y-0.5"
            >
              View all WhatsApp numbers
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
          Quick Actions
        </p>

        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
          Prepare WhatsApp replies before going live.
        </h2>

        <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
          Create AI staff, add business knowledge, test replies, then turn on
          WhatsApp support when your team is ready.
        </p>

        <div className="mt-6 grid gap-3">
          <Link
            href="/dashboard/test-ai"
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-base font-black text-white transition hover:-translate-y-0.5"
          >
            <Send className="h-5 w-5" />
            Test AI
          </Link>

          <Link
            href="/dashboard/inbox"
            className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-7 py-4 text-base font-black text-[#07111F] transition hover:-translate-y-0.5"
          >
            <Inbox className="h-5 w-5" />
            Open Inbox
          </Link>

          <Link
            href="/dashboard/go-live"
            className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-7 py-4 text-base font-black text-[#07111F] transition hover:-translate-y-0.5"
          >
            Go Live
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhatsAppNumbersInventory({
  isLoading,
  connections,
  aiStaffById,
  openAddForm,
  openEditForm,
  canAddWhatsAppNumber,
}: {
  isLoading: boolean;
  connections: WhatsAppConnectionRow[];
  aiStaffById: Map<string, AiStaffRow>;
  openAddForm: () => void;
  openEditForm: (connection: WhatsAppConnectionRow) => void;
  canAddWhatsAppNumber: boolean;
}) {
  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            WhatsApp Numbers
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
            Numbers connected to this workspace
          </h2>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          disabled={!canAddWhatsAppNumber}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          Add Number
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6 text-lg font-black text-slate-600">
          Loading WhatsApp numbers...
        </div>
      ) : connections.length === 0 ? (
        <EmptyNumbersState
          openAddForm={openAddForm}
          canAddWhatsAppNumber={canAddWhatsAppNumber}
        />
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <NumberRow
              key={connection.id}
              connection={connection}
              assignedAI={
                connection.selected_ai_staff_id
                  ? aiStaffById.get(connection.selected_ai_staff_id)
                  : undefined
              }
              openEditForm={openEditForm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyNumbersState({
  openAddForm,
  canAddWhatsAppNumber,
}: {
  openAddForm: () => void;
  canAddWhatsAppNumber: boolean;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-[#F7F9FA] p-7 text-center">
      <Smartphone className="mx-auto h-10 w-10 text-slate-400" />
      <h3 className="mt-4 text-2xl font-black">
        No WhatsApp number added yet.
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
        Add a business WhatsApp number, assign AI staff, and prepare it for
        customer replies.
      </p>

      <button
        type="button"
        onClick={openAddForm}
        disabled={!canAddWhatsAppNumber}
        className="mt-6 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-base font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-5 w-5" />
        Add WhatsApp Number
      </button>
    </div>
  );
}

function NumberRow({
  connection,
  assignedAI,
  openEditForm,
}: {
  connection: WhatsAppConnectionRow;
  assignedAI?: AiStaffRow;
  openEditForm: (connection: WhatsAppConnectionRow) => void;
}) {
  const hasIssue = Boolean(
    connection.last_error_code || connection.last_error_message
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-black tracking-[-0.04em]">
              {connection.connection_label ||
                connection.display_phone_number ||
                "WhatsApp Number"}
            </h3>

            {connection.is_primary ? (
              <span className="rounded-full bg-[#07111F] px-3 py-1 text-xs font-black text-white">
                Primary
              </span>
            ) : null}

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                connection.status
              )}`}
            >
              {statusLabel(connection.status)}
            </span>

            {hasIssue ? (
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                Check setup
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-lg font-bold text-slate-600">
            {connection.display_phone_number || "Number not added"}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-500">
            AI Staff: {assignedAI?.name || "Not selected"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openEditForm(connection)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <Settings className="h-4 w-4" />
            Edit Setup
          </button>

          <button
            type="button"
            onClick={() => openEditForm(connection)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#07111F] transition hover:-translate-y-0.5"
          >
            <PlugZap className="h-4 w-4" />
            Manage Number
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStatus
          label="AI support"
          value={connection.ai_enabled ? "On" : "Off"}
        />
        <MiniStatus
          label="Auto-reply"
          value={connection.auto_reply_enabled ? "On" : "Off"}
        />
        <MiniStatus
          label="Handover"
          value={connection.handover_enabled ? "On" : "Off"}
        />
      </div>

      {connection.last_status_at ? (
        <p className="mt-4 text-sm font-bold text-slate-500">
          Last status update: {formatDate(connection.last_status_at)}
        </p>
      ) : null}
    </div>
  );
}

function AddNumberSideCard({
  openAddForm,
  canAddWhatsAppNumber,
  limitReachedMessage,
  whatsappLimitLabel,
}: {
  openAddForm: () => void;
  canAddWhatsAppNumber: boolean;
  limitReachedMessage: string;
  whatsappLimitLabel: string;
}) {
  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        <MessageCircle className="h-8 w-8" />
      </div>

      <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
        Setup
      </p>

      <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
        Add numbers based on your business needs.
      </h2>

      <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
        Your current plan includes {whatsappLimitLabel}. Add separate WhatsApp
        numbers for sales, support, bookings, branches, or different business
        teams when your plan allows it.
      </p>

      {!canAddWhatsAppNumber ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="text-base font-black">{limitReachedMessage}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={openAddForm}
        disabled={!canAddWhatsAppNumber}
        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-6 w-6" />
        Add WhatsApp Number
      </button>
    </div>
  );
}

function WhatsAppNumberForm({
  form,
  setForm,
  aiStaff,
  isSaving,
  editing,
  onSave,
  onCancel,
}: {
  form: typeof emptyForm;
  setForm: Dispatch<SetStateAction<typeof emptyForm>>;
  aiStaff: AiStaffRow[];
  isSaving: boolean;
  editing: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          <Plus className="h-8 w-8" />
        </div>

        <div>
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {editing ? "Edit Number" : "Add Number"}
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
            WhatsApp number details
          </h2>
        </div>
      </div>

      <div className="grid gap-5">
        <Field
          label="Label"
          value={form.connection_label}
          placeholder="Sales, Support, Booking, Branch Sydney"
          onChange={(value) =>
            setForm((current) => ({ ...current, connection_label: value }))
          }
        />

        <Field
          label="Business WhatsApp number"
          value={form.display_phone_number}
          placeholder="+61 4XX XXX XXX"
          onChange={(value) =>
            setForm((current) => ({ ...current, display_phone_number: value }))
          }
        />

        <label className="grid gap-2">
          <span className="text-base font-black text-slate-700">
            AI staff for this number
          </span>

          <select
            value={form.selected_ai_staff_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                selected_ai_staff_id: event.target.value,
              }))
            }
            className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
          >
            <option value="">Select AI staff</option>
            {aiStaff.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {item.role}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3">
          <ToggleRow
            title="Primary number"
            text="Mark this as the main WhatsApp number for this workspace."
            checked={form.is_primary}
            onChange={(value) =>
              setForm((current) => ({ ...current, is_primary: value }))
            }
          />

          <ToggleRow
            title="AI support"
            text="Allow selected AI staff to help with this WhatsApp number."
            checked={form.ai_enabled}
            onChange={(value) =>
              setForm((current) => ({ ...current, ai_enabled: value }))
            }
          />

          <ToggleRow
            title="Auto-reply"
            text="Allow AI to reply automatically when this number is active."
            checked={form.auto_reply_enabled}
            onChange={(value) =>
              setForm((current) => ({ ...current, auto_reply_enabled: value }))
            }
          />

          <ToggleRow
            title="Human handover"
            text="Keep human handover available when the customer needs help from your team."
            checked={form.handover_enabled}
            onChange={(value) =>
              setForm((current) => ({ ...current, handover_enabled: value }))
            }
          />
        </div>

        <label className="grid gap-2">
          <span className="text-base font-black text-slate-700">Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Example: This number is for sales inquiries."
            rows={4}
            className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-5 text-lg font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-6 w-6" />
            {isSaving
              ? "Saving..."
              : editing
                ? "Save Changes"
                : "Continue Setup"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-7 py-5 text-lg font-black text-[#07111F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  loadWhatsAppSetup,
}: {
  loadWhatsAppSetup: () => void;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-[2.2rem] border border-blue-100 bg-blue-50 p-6 shadow-sm shadow-blue-900/5 sm:p-7">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          <Send className="h-8 w-8" />
        </div>

        <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
          Test First
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-blue-950">
          Test your AI before WhatsApp replies go live.
        </h2>

        <p className="mt-5 text-lg font-semibold leading-8 text-blue-800">
          Make sure your AI staff, business knowledge, tone, and lead collection
          questions are ready before customers receive replies.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/test-ai"
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5"
          >
            Test AI
            <ArrowRight className="h-5 w-5" />
          </Link>

          <Link
            href="/dashboard/go-live"
            className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-base font-black text-[#07111F] transition hover:-translate-y-0.5"
          >
            Go Live
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          <RefreshCcw className="h-8 w-8" />
        </div>

        <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
          Refresh
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
          Reload WhatsApp status.
        </h2>

        <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
          Refresh this page to check the latest WhatsApp numbers, message
          activity, and setup status.
        </p>

        <button
          type="button"
          onClick={loadWhatsAppSetup}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5"
        >
          <RefreshCcw className="h-6 w-6" />
          Refresh Status
        </button>
      </div>
    </section>
  );
}

function MessageLogs({ logs }: { logs: WhatsAppLogRow[] }) {
  return (
    <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Message Logs
          </p>

          <h2 className="mt-2 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            WhatsApp message activity.
          </h2>
        </div>

        <Link
          href="/dashboard/inbox"
          className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5"
        >
          <Inbox className="h-5 w-5" />
          Open Inbox
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-[#F7F9FA] p-8 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-slate-400" />

          <h3 className="mt-4 text-2xl font-black">
            No WhatsApp activity yet.
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Once WhatsApp is active, incoming messages, replies, delivery
            status, read status, and failed messages will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <div className="min-w-[1180px]">
            <div className="grid grid-cols-[1.15fr_0.9fr_0.9fr_1fr_1fr_1.6fr_0.9fr_0.65fr_0.65fr] border-b border-slate-200 bg-[#F7F9FA] px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-slate-500">
              <p>Date</p>
              <p>Service</p>
              <p>Direction</p>
              <p>From</p>
              <p>To</p>
              <p>Body</p>
              <p>Status</p>
              <p>Credits</p>
              <p>Media</p>
            </div>

            {logs.map((log) => {
              const isInbound = log.direction === "inbound";
              const fromValue = isInbound
                ? log.customer_phone || "-"
                : log.display_phone_number || "-";
              const toValue = isInbound
                ? log.display_phone_number || "-"
                : log.customer_phone || "-";

              return (
                <div
                  key={log.id}
                  className="grid grid-cols-[1.15fr_0.9fr_0.9fr_1fr_1fr_1.6fr_0.9fr_0.65fr_0.65fr] border-b border-slate-200 px-5 py-5 text-base font-semibold text-slate-700 last:border-b-0"
                >
                  <p className="font-black text-blue-600">
                    {formatDate(log.created_at)}
                  </p>

                  <p>WhatsApp</p>

                  <p className="font-black">
                    {isInbound
                      ? "Inbound"
                      : log.direction === "outbound"
                        ? "Outbound"
                        : "Update"}
                  </p>

                  <p className="break-all">{fromValue}</p>

                  <p className="break-all">{toValue}</p>

                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {log.message_text || "No preview"}
                  </p>

                  <p
                    className={`font-black ${
                      log.status === "failed" || log.error_message
                        ? "text-red-600"
                        : "text-green-700"
                    }`}
                  >
                    {messageStatusText(log.status)}
                  </p>

                  <p>{log.credits_used}</p>

                  <p>-</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  danger = false,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
          danger ? "bg-red-50 text-red-600" : "bg-[#07111F] text-[#7CFF3D]"
        }`}
      >
        <Icon className="h-7 w-7" />
      </div>

      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>

      <p
        className={`mt-3 text-2xl font-black tracking-[-0.04em] ${
          danger ? "text-red-700" : "text-[#07111F]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-black">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-base font-black text-slate-700">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
      />
    </label>
  );
}

function ToggleRow({
  title,
  text,
  checked,
  onChange,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 accent-[#07111F]"
      />

      <span>
        <span className="block text-lg font-black text-[#07111F]">{title}</span>
        <span className="mt-1 block text-base font-semibold leading-7 text-slate-600">
          {text}
        </span>
      </span>
    </label>
  );
}