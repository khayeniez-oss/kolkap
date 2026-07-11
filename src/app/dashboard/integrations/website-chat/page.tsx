"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Globe2,
  Inbox,
  MessageCircle,
  RefreshCcw,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
  TestTube2,
  ToggleRight,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type ActiveTab = "overview" | "widget" | "logs" | "settings";

type AiStaffRow = {
  id: string;
  name: string;
  role: string;
  status: string;
};

type ChannelAiAssignmentRow = {
  id: string;
  workspace_id: string;
  channel_type: "website_chat" | "whatsapp";
  channel_connection_id: string;
  ai_staff_id: string;
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
};

type WebsiteChatSettingsRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  selected_ai_staff_id: string | null;
  widget_title: string;
  widget_subtitle: string;
  welcome_message: string;
  is_active: boolean;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  handover_enabled: boolean;
  allowed_domains: string[];
  created_at: string;
  updated_at: string;
};

type WebsiteChatForm = {
  selected_ai_staff_id: string;
  ai_team_staff_ids: string[];
  first_responder_ai_staff_id: string;
  widget_title: string;
  widget_subtitle: string;
  welcome_message: string;
  is_active: boolean;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  handover_enabled: boolean;
  allowed_domains_text: string;
};

type WebsiteChatMessageRow = {
  id: string;
  conversation_id: string;
  workspace_id: string;
  owner_user_id: string;
  ai_staff_id: string | null;
  sender_type: string;
  message_text: string | null;
  created_at: string;
};

type WebsiteChatConversationRow = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_channel: string | null;
  status: string | null;
  lead_status: string | null;
  handover_requested: boolean | null;
  last_message: string | null;
  last_message_at: string | null;
  ai_staff_id: string | null;
  created_at: string;
  updated_at: string;
};

const tabs: { id: ActiveTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "widget", label: "Website Widget" },
  { id: "logs", label: "Message Logs" },
  { id: "settings", label: "Settings" },
];

const defaultForm: WebsiteChatForm = {
  selected_ai_staff_id: "",
  ai_team_staff_ids: [],
  first_responder_ai_staff_id: "",
  widget_title: "Chat with us",
  widget_subtitle: "Ask a question and our AI assistant will help.",
  welcome_message: "Hi, how can we help you today?",
  is_active: false,
  ai_enabled: true,
  auto_reply_enabled: false,
  handover_enabled: true,
  allowed_domains_text: "",
};

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseAllowedDomains(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function formatAllowedDomains(value: string[] | null | undefined) {
  if (!value?.length) return "";
  return value.join("\n");
}

function uniqueIds(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeAiTeamIds({
  teamIds,
  firstResponderId,
  fallbackId,
}: {
  teamIds: string[];
  firstResponderId?: string;
  fallbackId?: string;
}) {
  const ids = uniqueIds(teamIds);
  const fallback = firstResponderId || fallbackId || ids[0] || "";

  if (fallback && !ids.includes(fallback)) {
    ids.unshift(fallback);
  }

  return {
    teamIds: ids,
    firstResponderId: fallback || "",
  };
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Draft";
  if (value === "draft") return "Draft";
  if (value === "testing") return "Testing";
  if (value === "live") return "Live";
  if (value === "inactive") return "Inactive";
  if (value === "open") return "Open";
  if (value === "closed") return "Closed";
  return value;
}

function formatDate(value: string | null | undefined) {
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

function senderLabel(value: string | null | undefined) {
  if (value === "customer") return "Visitor";
  if (value === "ai") return "AI Reply";
  if (value === "team") return "Team";
  return value || "Message";
}

export default function WebsiteChatIntegrationPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [settings, setSettings] = useState<WebsiteChatSettingsRow | null>(null);
  const [form, setForm] = useState<WebsiteChatForm>(defaultForm);

  const [messages, setMessages] = useState<WebsiteChatMessageRow[]>([]);
  const [conversations, setConversations] = useState<
    WebsiteChatConversationRow[]
  >([]);

  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const workspaceId = workspace?.id || "YOUR_WORKSPACE_ID";

  const selectedAiStaff = useMemo(() => {
    return aiStaffRows.find(
      (item) =>
        item.id ===
        (form.first_responder_ai_staff_id || form.selected_ai_staff_id)
    );
  }, [
    aiStaffRows,
    form.first_responder_ai_staff_id,
    form.selected_ai_staff_id,
  ]);

  const selectedAiTeam = useMemo(() => {
    return form.ai_team_staff_ids
      .map((id) => aiStaffRows.find((item) => item.id === id))
      .filter(Boolean) as AiStaffRow[];
  }, [aiStaffRows, form.ai_team_staff_ids]);

  const aiStaffById = useMemo(() => {
    return new Map(aiStaffRows.map((item) => [item.id, item]));
  }, [aiStaffRows]);

  const widgetCode = useMemo(() => {
    return `<script
  src="https://www.kolkap.com/widget.js"
  data-workspace-id="${escapeAttribute(workspaceId)}"
  data-title="${escapeAttribute(form.widget_title)}"
  data-subtitle="${escapeAttribute(form.widget_subtitle)}"
  data-welcome-message="${escapeAttribute(form.welcome_message)}">
</script>`;
  }, [
    workspaceId,
    form.widget_title,
    form.widget_subtitle,
    form.welcome_message,
  ]);

  async function loadWebsiteChatSetup() {
    if (!workspace?.id) {
      setIsLoadingSetup(false);
      return;
    }

    setIsLoadingSetup(true);
    setActionError("");

    const supabase = createClient();

    const [{ data: staffData }, { data: settingsData, error: settingsError }] =
      await Promise.all([
        supabase
          .from("ai_staff")
          .select("id,name,role,status")
          .eq("workspace_id", workspace.id)
          .is("deleted_at", null)
          .eq("status", "active")
          .order("created_at", { ascending: false }),

        supabase
          .from("workspace_website_chat_settings")
          .select("*")
          .eq("workspace_id", workspace.id)
          .maybeSingle(),
      ]);

    const staffRows = (staffData ?? []) as AiStaffRow[];
    setAiStaffRows(staffRows);

    if (settingsError) {
      setActionError(
        settingsError.message || "Website Chat settings could not load."
      );
      setIsLoadingSetup(false);
      return;
    }

    const loadedSettings = (settingsData ??
      null) as WebsiteChatSettingsRow | null;
    setSettings(loadedSettings);

    if (loadedSettings) {
      let teamIds = loadedSettings.selected_ai_staff_id
        ? [loadedSettings.selected_ai_staff_id]
        : [];
      let firstResponderId = loadedSettings.selected_ai_staff_id || "";

      if (loadedSettings.id) {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("channel_ai_assignments")
          .select(
            "id,workspace_id,channel_type,channel_connection_id,ai_staff_id,is_enabled,is_default,priority"
          )
          .eq("workspace_id", workspace.id)
          .eq("channel_type", "website_chat")
          .eq("channel_connection_id", loadedSettings.id)
          .eq("is_enabled", true)
          .order("is_default", { ascending: false })
          .order("priority", { ascending: true });

        if (assignmentError) {
          throw assignmentError;
        }

        const assignments = (assignmentData ?? []) as ChannelAiAssignmentRow[];

        if (assignments.length) {
          teamIds = assignments.map((assignment) => assignment.ai_staff_id);
          firstResponderId =
            assignments.find((assignment) => assignment.is_default)?.ai_staff_id ||
            teamIds[0] ||
            firstResponderId;
        }
      }

      const normalizedTeam = normalizeAiTeamIds({
        teamIds,
        firstResponderId,
        fallbackId: loadedSettings.selected_ai_staff_id || "",
      });

      setForm({
        selected_ai_staff_id: normalizedTeam.firstResponderId,
        ai_team_staff_ids: normalizedTeam.teamIds,
        first_responder_ai_staff_id: normalizedTeam.firstResponderId,
        widget_title: loadedSettings.widget_title || defaultForm.widget_title,
        widget_subtitle:
          loadedSettings.widget_subtitle || defaultForm.widget_subtitle,
        welcome_message:
          loadedSettings.welcome_message || defaultForm.welcome_message,
        is_active: Boolean(loadedSettings.is_active),
        ai_enabled: Boolean(loadedSettings.ai_enabled),
        auto_reply_enabled: Boolean(loadedSettings.auto_reply_enabled),
        handover_enabled: Boolean(loadedSettings.handover_enabled),
        allowed_domains_text: formatAllowedDomains(
          loadedSettings.allowed_domains
        ),
      });
    } else {
      const firstStaffId = staffRows[0]?.id || "";

      setForm({
        ...defaultForm,
        selected_ai_staff_id: firstStaffId,
        ai_team_staff_ids: firstStaffId ? [firstStaffId] : [],
        first_responder_ai_staff_id: firstStaffId,
      });
    }

    setIsLoadingSetup(false);
  }

  async function loadWebsiteChatLogs() {
    if (!workspace?.id) return;

    setIsLoadingLogs(true);
    setActionError("");

    try {
      const supabase = createClient();

      const { data: conversationData, error: conversationError } =
        await supabase
          .from("customer_conversations")
          .select(
            "id,customer_name,customer_phone,customer_channel,status,lead_status,handover_requested,last_message,last_message_at,ai_staff_id,created_at,updated_at"
          )
          .eq("workspace_id", workspace.id)
          .eq("customer_channel", "website_chat")
          .order("last_message_at", { ascending: false })
          .limit(30);

      if (conversationError) {
        throw conversationError;
      }

      const websiteChatConversations =
        (conversationData ?? []) as WebsiteChatConversationRow[];

      setConversations(websiteChatConversations);

      const conversationIds = websiteChatConversations.map((item) => item.id);

      if (!conversationIds.length) {
        setMessages([]);
        return;
      }

      const { data: messageData, error: messageError } = await supabase
        .from("customer_messages")
        .select(
          "id,conversation_id,workspace_id,owner_user_id,ai_staff_id,sender_type,message_text,created_at"
        )
        .eq("workspace_id", workspace.id)
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .limit(50);

      if (messageError) {
        throw messageError;
      }

      setMessages((messageData ?? []) as WebsiteChatMessageRow[]);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Website Chat logs could not load."
      );
    } finally {
      setIsLoadingLogs(false);
    }
  }

  useEffect(() => {
    loadWebsiteChatSetup();
    loadWebsiteChatLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  function updateForm<Key extends keyof WebsiteChatForm>(
    key: Key,
    value: WebsiteChatForm[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveSettings() {
    if (!workspace?.id) {
      setActionError("Workspace is not ready yet.");
      return;
    }

    if (!form.widget_title.trim()) {
      setActionError("Please add a widget title.");
      return;
    }

    if (!form.widget_subtitle.trim()) {
      setActionError("Please add a widget subtitle.");
      return;
    }

    if (!form.welcome_message.trim()) {
      setActionError("Please add a welcome message.");
      return;
    }

    setIsSaving(true);
    setActionMessage("");
    setActionError("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        throw new Error(
          "Please log in again before saving Website Chat settings."
        );
      }

      const normalizedTeam = normalizeAiTeamIds({
        teamIds: form.ai_team_staff_ids,
        firstResponderId: form.first_responder_ai_staff_id,
        fallbackId: form.selected_ai_staff_id,
      });

      const payload = {
        workspace_id: workspace.id,
        owner_user_id: user.id,
        selected_ai_staff_id: normalizedTeam.firstResponderId || null,
        widget_title: form.widget_title.trim(),
        widget_subtitle: form.widget_subtitle.trim(),
        welcome_message: form.welcome_message.trim(),
        is_active: form.is_active,
        ai_enabled: form.ai_enabled,
        auto_reply_enabled: form.auto_reply_enabled,
        handover_enabled: form.handover_enabled,
        allowed_domains: parseAllowedDomains(form.allowed_domains_text),
      };

      const { data, error } = await supabase
        .from("workspace_website_chat_settings")
        .upsert(payload, { onConflict: "workspace_id" })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const savedSettings = data as WebsiteChatSettingsRow;

      await supabase
        .from("channel_ai_assignments")
        .delete()
        .eq("workspace_id", workspace.id)
        .eq("channel_type", "website_chat")
        .eq("channel_connection_id", savedSettings.id);

      if (normalizedTeam.teamIds.length) {
        const assignmentRows = normalizedTeam.teamIds.map((aiStaffId, index) => ({
          workspace_id: workspace.id,
          channel_type: "website_chat",
          channel_connection_id: savedSettings.id,
          ai_staff_id: aiStaffId,
          is_enabled: true,
          is_default: aiStaffId === normalizedTeam.firstResponderId,
          priority: (index + 1) * 10,
          routing_notes: null,
          created_by_user_id: user.id,
        }));

        const { error: assignmentError } = await supabase
          .from("channel_ai_assignments")
          .insert(assignmentRows);

        if (assignmentError) {
          throw assignmentError;
        }
      }

      setSettings(savedSettings);
      setForm((current) => ({
        ...current,
        selected_ai_staff_id: normalizedTeam.firstResponderId,
        ai_team_staff_ids: normalizedTeam.teamIds,
        first_responder_ai_staff_id: normalizedTeam.firstResponderId,
      }));
      setActionMessage("Website Chat AI Team saved.");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Website Chat settings could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function copyWidgetCode() {
    try {
      await navigator.clipboard.writeText(widgetCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading website chat setup...
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
              Website Chat page could not load.
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
        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <Link
              href="/dashboard/integrations"
              className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Customer Channels
            </Link>

            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              Website Chat
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Manage Website Chat for customer replies.
            </h1>

            <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
              Control your website widget, choose your AI Team, manage auto-replies,
              review website chat activity, and prepare your channel before Go
              Live.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/test-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                <TestTube2 className="h-6 w-6" />
                Test AI
              </Link>

              <Link
                href="/dashboard/inbox"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Inbox className="h-6 w-6" />
                Open Inbox
              </Link>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Website Chat Status
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {form.is_active
                ? "Website Chat is active."
                : "Website Chat is paused."}
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
              {form.is_active
                ? "Your Website Chat can receive visitor messages once the widget code is installed."
                : "Keep Website Chat paused until your AI staff, business knowledge, and settings are ready."}
            </p>

            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-base font-black uppercase tracking-[0.14em] text-blue-700">
                Workspace
              </p>
              <p className="mt-2 break-all text-2xl font-black text-blue-950">
                {workspace?.business_name || "Your business"}
              </p>
            </div>
          </div>
        </section>

        {actionMessage ? (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
            <p className="flex items-center gap-3 text-base font-black">
              <CheckCircle2 className="h-5 w-5" />
              {actionMessage}
            </p>
          </div>
        ) : null}

        {actionError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{actionError}</p>
          </div>
        ) : null}

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
          <OverviewTab
            form={form}
            selectedAiStaff={selectedAiStaff}
            selectedAiTeam={selectedAiTeam}
            settings={settings}
            conversations={conversations}
            messages={messages}
            setActiveTab={setActiveTab}
          />
        ) : null}

        {activeTab === "widget" ? (
          <WidgetTab
            form={form}
            updateForm={updateForm}
            widgetCode={widgetCode}
            copied={copied}
            copyWidgetCode={copyWidgetCode}
            saveSettings={saveSettings}
            isSaving={isSaving}
          />
        ) : null}

        {activeTab === "logs" ? (
          <MessageLogsTab
            isLoadingLogs={isLoadingLogs}
            messages={messages}
            conversations={conversations}
            aiStaffById={aiStaffById}
            loadWebsiteChatLogs={loadWebsiteChatLogs}
          />
        ) : null}

        {activeTab === "settings" ? (
          <SettingsTab
            form={form}
            updateForm={updateForm}
            aiStaffRows={aiStaffRows}
            selectedAiTeam={selectedAiTeam}
            isLoadingSetup={isLoadingSetup}
            saveSettings={saveSettings}
            isSaving={isSaving}
          />
        ) : null}

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Ready to activate?
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Continue to Go Live when your AI staff, business knowledge,
                plan, credits, and Website Chat settings are ready.
              </h2>
            </div>

            <Link
              href="/dashboard/go-live"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Continue to Go Live
              <Rocket className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function OverviewTab({
  form,
  selectedAiStaff,
  selectedAiTeam,
  settings,
  conversations,
  messages,
  setActiveTab,
}: {
  form: WebsiteChatForm;
  selectedAiStaff?: AiStaffRow;
  selectedAiTeam: AiStaffRow[];
  settings: WebsiteChatSettingsRow | null;
  conversations: WebsiteChatConversationRow[];
  messages: WebsiteChatMessageRow[];
  setActiveTab: (tab: ActiveTab) => void;
}) {
  return (
    <div className="grid gap-8">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={<Globe2 className="h-7 w-7" />}
          label="Website Chat"
          value={form.is_active ? "Active" : "Paused"}
          note="Main website chat status"
        />

        <StatusCard
          icon={<Bot className="h-7 w-7" />}
          label="AI Team"
          value={
            selectedAiTeam.length
              ? `${selectedAiTeam.length} selected`
              : "Not selected"
          }
          note={
            selectedAiStaff
              ? `First responder: ${selectedAiStaff.name}`
              : "Choose your first responder AI"
          }
        />

        <StatusCard
          icon={<ToggleRight className="h-7 w-7" />}
          label="Auto-Reply"
          value={form.auto_reply_enabled ? "On" : "Off"}
          note="Controls automatic visitor replies"
        />

        <StatusCard
          icon={<UserRound className="h-7 w-7" />}
          label="Human Handover"
          value={form.handover_enabled ? "On" : "Off"}
          note="Allows your team to take over"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Overview
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
            Website Chat setup summary.
          </h2>

          <div className="mt-7 grid gap-4">
            <SummaryRow
              label="AI support"
              value={form.ai_enabled ? "On" : "Off"}
            />
            <SummaryRow
              label="Auto-reply"
              value={form.auto_reply_enabled ? "On" : "Off"}
            />
            <SummaryRow
              label="First Responder AI"
              value={selectedAiStaff?.name || "Not selected"}
            />
            <SummaryRow
              label="AI Team"
              value={
                selectedAiTeam.length
                  ? selectedAiTeam.map((staff) => staff.name).join(", ")
                  : "Not selected"
              }
            />
            <SummaryRow
              label="Allowed domains"
              value={
                form.allowed_domains_text.trim()
                  ? `${parseAllowedDomains(form.allowed_domains_text).length} domain(s)`
                  : "Not restricted"
              }
            />
            <SummaryRow
              label="Last saved"
              value={
                settings?.updated_at
                  ? formatDate(settings.updated_at)
                  : "Not saved yet"
              }
            />
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <MessageCircle className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Activity
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
            Website Chat activity.
          </h2>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <MiniStat label="Conversations" value={`${conversations.length}`} />
            <MiniStat label="Recent Messages" value={`${messages.length}`} />
          </div>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("widget")}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-base font-black text-white"
            >
              Open Website Widget
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-7 py-4 text-base font-black text-[#07111F]"
            >
              Open Settings
              <ArrowRight className="h-5 w-5" />
            </button>

            <Link
              href="/dashboard/inbox"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-7 py-4 text-base font-black text-[#07111F]"
            >
              Open Inbox
              <Inbox className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ActionCard
          icon={<Sparkles className="h-7 w-7" />}
          eyebrow="AI Staff"
          title="Create and test AI staff before showing chat to visitors."
          href="/dashboard/create-ai"
          action="Create AI Staff"
        />

        <ActionCard
          icon={<MessageCircle className="h-7 w-7" />}
          eyebrow="Business Knowledge"
          title="Add FAQs, prices, policies, and service details for better answers."
          href="/dashboard/knowledge-base"
          action="Add Business Knowledge"
        />

        <ActionCard
          icon={<Inbox className="h-7 w-7" />}
          eyebrow="Inbox"
          title="Website chat messages will appear in your Kolkap Inbox."
          href="/dashboard/inbox"
          action="Open Inbox"
        />
      </section>
    </div>
  );
}

function WidgetTab({
  form,
  updateForm,
  widgetCode,
  copied,
  copyWidgetCode,
  saveSettings,
  isSaving,
}: {
  form: WebsiteChatForm;
  updateForm: <Key extends keyof WebsiteChatForm>(
    key: Key,
    value: WebsiteChatForm[Key]
  ) => void;
  widgetCode: string;
  copied: boolean;
  copyWidgetCode: () => void;
  saveSettings: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="grid gap-8">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <Sparkles className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Website Widget
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
            Customise what visitors see.
          </h2>

          <div className="mt-7 grid gap-5">
            <TextInput
              label="Widget Title"
              value={form.widget_title}
              placeholder="Chat with us"
              onChange={(value) => updateForm("widget_title", value)}
            />

            <TextInput
              label="Widget Subtitle"
              value={form.widget_subtitle}
              placeholder="Ask a question and our AI assistant will help."
              onChange={(value) => updateForm("widget_subtitle", value)}
            />

            <label className="grid gap-2">
              <span className="text-base font-black text-slate-700">
                Welcome Message
              </span>

              <textarea
                value={form.welcome_message}
                onChange={(event) =>
                  updateForm("welcome_message", event.target.value)
                }
                rows={4}
                placeholder="Hi, how can we help you today?"
                className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-base font-black text-slate-700">
                Allowed Website Domains
              </span>

              <textarea
                value={form.allowed_domains_text}
                onChange={(event) =>
                  updateForm("allowed_domains_text", event.target.value)
                }
                rows={4}
                placeholder={`example.com\nwww.example.com`}
                className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              />

              <span className="text-sm font-bold text-slate-500">
                Optional. Add one domain per line. Leave empty while testing.
              </span>
            </label>

            <button
              type="button"
              onClick={saveSettings}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-6 w-6" />
              {isSaving ? "Saving..." : "Save Widget Settings"}
            </button>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <Globe2 className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Install Code
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
            Copy this code and add it to your website.
          </h2>

          <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
            Paste the code before the closing body tag on your website.
          </p>

          <div className="mt-7 rounded-[2.2rem] bg-[#07111F] p-6 text-white shadow-2xl shadow-slate-900/20">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Widget Code
              </p>

              <button
                type="button"
                onClick={copyWidgetCode}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7CFF3D] px-5 py-3 text-sm font-black text-[#07111F]"
              >
                {copied ? (
                  <ClipboardCheck className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>

            <pre className="overflow-x-auto rounded-3xl bg-black/35 p-5 text-base font-semibold leading-8 text-slate-200">
              {widgetCode}
            </pre>
          </div>
        </div>
      </section>

      <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <div className="mb-7">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Simple Setup
          </p>

          <h2 className="mt-2 max-w-4xl text-4xl font-black tracking-[-0.05em]">
            Add Kolkap chat to your website in five simple steps.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {[
            "Choose your AI Team and First Responder AI, then save Website Chat settings.",
            "Copy the Website Chat install code.",
            "Paste it before the closing body tag on your website.",
            "Send a test message from the widget.",
            "Review the conversation in Kolkap Inbox.",
          ].map((step, index) => (
            <div
              key={step}
              className="rounded-[1.7rem] border border-slate-200 bg-[#F7F9FA] p-5"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                {index + 1}
              </div>

              <p className="text-lg font-black leading-7">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MessageLogsTab({
  isLoadingLogs,
  messages,
  conversations,
  aiStaffById,
  loadWebsiteChatLogs,
}: {
  isLoadingLogs: boolean;
  messages: WebsiteChatMessageRow[];
  conversations: WebsiteChatConversationRow[];
  aiStaffById: Map<string, AiStaffRow>;
  loadWebsiteChatLogs: () => void;
}) {
  const conversationById = useMemo(() => {
    return new Map(conversations.map((item) => [item.id, item]));
  }, [conversations]);

  return (
    <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Message Logs
          </p>

          <h2 className="mt-2 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Website Chat activity.
          </h2>
        </div>

        <button
          type="button"
          onClick={loadWebsiteChatLogs}
          disabled={isLoadingLogs}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <RefreshCcw className="h-5 w-5" />
          {isLoadingLogs ? "Refreshing..." : "Refresh Logs"}
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-[#F7F9FA] p-8 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-slate-400" />

          <h3 className="mt-4 text-2xl font-black">
            No Website Chat messages yet.
          </h3>

          <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Once visitors send messages from your website widget, recent
            activity will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <div className="min-w-[1040px]">
            <div className="grid grid-cols-[1.15fr_0.85fr_1fr_1fr_2fr_0.9fr_0.9fr] border-b border-slate-200 bg-[#F7F9FA] px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-slate-500">
              <p>Date</p>
              <p>Sender</p>
              <p>Visitor</p>
              <p>AI Staff</p>
              <p>Message</p>
              <p>Status</p>
              <p>Inbox</p>
            </div>

            {messages.map((message) => {
              const conversation = conversationById.get(
                message.conversation_id
              );
              const aiStaff = message.ai_staff_id
                ? aiStaffById.get(message.ai_staff_id)
                : null;

              return (
                <div
                  key={message.id}
                  className="grid grid-cols-[1.15fr_0.85fr_1fr_1fr_2fr_0.9fr_0.9fr] border-b border-slate-200 px-5 py-5 text-base font-semibold text-slate-700 last:border-b-0"
                >
                  <p className="font-black text-blue-600">
                    {formatDate(message.created_at)}
                  </p>

                  <p className="font-black">
                    {senderLabel(message.sender_type)}
                  </p>

                  <p className="break-words">
                    {conversation?.customer_name || "Website Visitor"}
                  </p>

                  <p>{aiStaff?.name || "Not assigned"}</p>

                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {message.message_text || "No message preview"}
                  </p>

                  <p className="font-black">
                    {statusLabel(conversation?.status)}
                  </p>

                  <Link
                    href="/dashboard/inbox"
                    className="font-black text-blue-600"
                  >
                    Open
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function SettingsTab({
  form,
  updateForm,
  aiStaffRows,
  selectedAiTeam,
  isLoadingSetup,
  saveSettings,
  isSaving,
}: {
  form: WebsiteChatForm;
  updateForm: <Key extends keyof WebsiteChatForm>(
    key: Key,
    value: WebsiteChatForm[Key]
  ) => void;
  aiStaffRows: AiStaffRow[];
  selectedAiTeam: AiStaffRow[];
  isLoadingSetup: boolean;
  saveSettings: () => void;
  isSaving: boolean;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          <MessageCircle className="h-8 w-8" />
        </div>

        <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
          Settings
        </p>

        <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
          Choose how Website Chat should behave.
        </h2>

        <div className="mt-7 grid gap-5">
          <ToggleRow
            title="Website Chat active"
            text="Turn this on when you are ready for website visitors to use the chat widget."
            checked={form.is_active}
            onChange={(value) => updateForm("is_active", value)}
          />

          <ToggleRow
            title="AI support"
            text="Allow the selected AI staff to help with Website Chat messages."
            checked={form.ai_enabled}
            onChange={(value) => updateForm("ai_enabled", value)}
          />

          <ToggleRow
            title="Auto-reply"
            text="Allow AI to reply automatically when Website Chat is active."
            checked={form.auto_reply_enabled}
            onChange={(value) => updateForm("auto_reply_enabled", value)}
          />

          <ToggleRow
            title="Human handover"
            text="Keep human handover available when a visitor needs help from your team."
            checked={form.handover_enabled}
            onChange={(value) => updateForm("handover_enabled", value)}
          />
        </div>
      </div>

      <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          <Bot className="h-8 w-8" />
        </div>

        <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
          AI Team
        </p>

        <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
          Choose your Website Chat AI Team.
        </h2>

        <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
          Choose one or more AI staff for this channel. The First Responder AI is
          usually your Admin AI or Reception AI because it greets the customer
          first.
        </p>

        <div className="mt-7 grid gap-5">
          <div className="grid gap-3">
            <p className="text-base font-black text-slate-700">
              AI Team Members
            </p>

            {isLoadingSetup ? (
              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-base font-black text-slate-600">
                Loading AI staff...
              </div>
            ) : aiStaffRows.length ? (
              <div className="grid gap-3">
                {aiStaffRows.map((staff) => {
                  const checked = form.ai_team_staff_ids.includes(staff.id);

                  return (
                    <label
                      key={staff.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-3xl border p-5 transition ${
                        checked
                          ? "border-[#07111F] bg-[#07111F] text-white"
                          : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const nextIds = event.target.checked
                            ? uniqueIds([...form.ai_team_staff_ids, staff.id])
                            : form.ai_team_staff_ids.filter(
                                (id) => id !== staff.id
                              );

                          const nextFirstResponder =
                            nextIds.includes(form.first_responder_ai_staff_id)
                              ? form.first_responder_ai_staff_id
                              : nextIds[0] || "";

                          updateForm("ai_team_staff_ids", nextIds);
                          updateForm(
                            "first_responder_ai_staff_id",
                            nextFirstResponder
                          );
                          updateForm("selected_ai_staff_id", nextFirstResponder);
                        }}
                        className="mt-1 h-5 w-5"
                      />

                      <span>
                        <span className="block text-lg font-black">
                          {staff.name}
                        </span>
                        <span
                          className={`mt-1 block text-sm font-bold ${
                            checked ? "text-slate-200" : "text-slate-500"
                          }`}
                        >
                          {staff.role} — {statusLabel(staff.status)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <p className="text-base font-black">
                  No active AI staff found.
                </p>
              </div>
            )}
          </div>

          <label className="grid gap-2">
            <span className="text-base font-black text-slate-700">
              First Responder AI
            </span>

            <select
              value={form.first_responder_ai_staff_id}
              onChange={(event) => {
                const nextId = event.target.value;
                const normalized = normalizeAiTeamIds({
                  teamIds: form.ai_team_staff_ids,
                  firstResponderId: nextId,
                  fallbackId: nextId,
                });

                updateForm("ai_team_staff_ids", normalized.teamIds);
                updateForm(
                  "first_responder_ai_staff_id",
                  normalized.firstResponderId
                );
                updateForm("selected_ai_staff_id", normalized.firstResponderId);
              }}
              disabled={isLoadingSetup || !form.ai_team_staff_ids.length}
              className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
            >
              <option value="">Choose First Responder AI</option>
              {selectedAiTeam.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} — {staff.role}
                </option>
              ))}
            </select>

            <span className="text-sm font-bold text-slate-500">
              This should normally be your Admin AI or Reception AI.
            </span>
          </label>

          {!aiStaffRows.length && !isLoadingSetup ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="text-base font-black">
                Create AI staff before activating Website Chat.
              </p>

              <Link
                href="/dashboard/create-ai"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
              >
                Create AI Staff
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          <button
            type="button"
            onClick={saveSettings}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-6 w-6" />
            {isSaving ? "Saving..." : "Save Website Chat Settings"}
          </button>
        </div>
      </div>
    </section>
  );
}

function StatusCard({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        {icon}
      </div>

      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#07111F]">
        {value}
      </p>

      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
        {note}
      </p>
    </div>
  );
}

function ActionCard({
  icon,
  eyebrow,
  title,
  href,
  action,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        {icon}
      </div>

      <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
        {title}
      </h3>

      <Link
        href={href}
        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
      >
        {action}
        <ArrowRight className="h-5 w-5" />
      </Link>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="text-base font-black text-[#07111F]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-5">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#07111F]">
        {value}
      </p>
    </div>
  );
}

function TextInput({
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