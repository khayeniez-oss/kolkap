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
  CirclePause,
  Inbox,
  KeyRound,
  MessageCircle,
  Phone,
  PlugZap,
  RefreshCcw,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
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

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (options: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: {
            code?: string;
            accessToken?: string;
            userID?: string;
            expiresIn?: number;
          };
          status?: string;
        }) => void,
        options: Record<string, unknown>
      ) => void;
    };
  }
}

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

type WhatsAppForm = {
  connection_label: string;
  selected_ai_staff_id: string;
  ai_team_staff_ids: string[];
  first_responder_ai_staff_id: string;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  handover_enabled: boolean;
  is_primary: boolean;
  notes: string;
};

type WhatsAppConnectionRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  provider: string;
  status: string;
  connection_label: string | null;
  display_phone_number: string | null;
  meta_phone_number_id?: string | null;
  meta_waba_id?: string | null;
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

type EmbeddedSignupInfo = {
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
  phone_number?: string;
  event?: string;
  raw?: unknown;
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

const emptyForm: WhatsAppForm = {
  connection_label: "",
  selected_ai_staff_id: "",
  ai_team_staff_ids: [],
  first_responder_ai_staff_id: "",
  ai_enabled: true,
  auto_reply_enabled: false,
  handover_enabled: true,
  is_primary: false,
  notes: "",
};

const metaAppId =
  process.env.NEXT_PUBLIC_META_APP_ID ||
  process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
  "";

const metaConfigId =
  process.env.NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID ||
  process.env.NEXT_PUBLIC_META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID ||
  process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID ||
  "";

const metaGraphVersion =
  process.env.NEXT_PUBLIC_META_GRAPH_VERSION ||
  process.env.NEXT_PUBLIC_META_API_VERSION ||
  "v23.0";

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

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

  return status.replace(/_/g, " ");
}

function statusClass(status: string | null) {
  if (status === "connected") return "border-green-200 bg-green-50 text-green-800";
  if (status === "pending") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-800";
  if (status === "paused") return "border-slate-200 bg-slate-100 text-slate-700";

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

function getConnectionTeamSummary({
  connection,
  aiStaffById,
  assignments,
}: {
  connection: WhatsAppConnectionRow;
  aiStaffById: Map<string, AiStaffRow>;
  assignments?: ChannelAiAssignmentRow[];
}) {
  const enabledAssignments = (assignments || []).filter(
    (assignment) => assignment.is_enabled
  );

  const teamIds = enabledAssignments.length
    ? enabledAssignments.map((assignment) => assignment.ai_staff_id)
    : connection.selected_ai_staff_id
      ? [connection.selected_ai_staff_id]
      : [];

  const firstResponderId =
    enabledAssignments.find((assignment) => assignment.is_default)?.ai_staff_id ||
    connection.selected_ai_staff_id ||
    teamIds[0] ||
    "";

  const normalized = normalizeAiTeamIds({
    teamIds,
    firstResponderId,
    fallbackId: connection.selected_ai_staff_id || "",
  });

  const team = normalized.teamIds
    .map((id) => aiStaffById.get(id))
    .filter(Boolean) as AiStaffRow[];

  return {
    teamIds: normalized.teamIds,
    firstResponderId: normalized.firstResponderId,
    team,
    firstResponderAI: normalized.firstResponderId
      ? aiStaffById.get(normalized.firstResponderId)
      : undefined,
  };
}

function parseEmbeddedSignupMessage(data: unknown): EmbeddedSignupInfo | null {
  if (!data || typeof data !== "object") return null;

  const payload = data as Record<string, unknown>;
  const eventType = cleanText(payload.type || payload.event);

  if (
    eventType !== "WA_EMBEDDED_SIGNUP" &&
    eventType !== "whatsapp_embedded_signup" &&
    !payload.phone_number_id &&
    !payload.waba_id
  ) {
    return null;
  }

  const innerData =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : payload;

  return {
    phone_number_id: cleanText(
      innerData.phone_number_id || innerData.phoneNumberId
    ),
    waba_id: cleanText(innerData.waba_id || innerData.wabaId),
    business_id: cleanText(innerData.business_id || innerData.businessId),
    phone_number: cleanText(innerData.phone_number || innerData.phoneNumber),
    event: eventType,
    raw: payload,
  };
}

async function getAccessToken() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token || "";
}

function loadFacebookSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!metaAppId) {
      reject(new Error("Missing NEXT_PUBLIC_META_APP_ID."));
      return;
    }

    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = function fbAsyncInit() {
      window.FB?.init({
        appId: metaAppId,
        autoLogAppEvents: true,
        xfbml: true,
        version: metaGraphVersion,
      });

      resolve();
    };

    const existingScript = document.getElementById("facebook-jssdk");

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () =>
      reject(new Error("Facebook SDK could not be loaded."));

    document.body.appendChild(script);
  });
}

export default function WhatsAppIntegrationPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [aiStaff, setAiStaff] = useState<AiStaffRow[]>([]);
  const [connections, setConnections] = useState<WhatsAppConnectionRow[]>([]);
  const [assignmentsByConnectionId, setAssignmentsByConnectionId] = useState<
    Record<string, ChannelAiAssignmentRow[]>
  >({});
  const [logs, setLogs] = useState<WhatsAppLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingMeta, setIsConnectingMeta] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(
    null
  );
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [embeddedSignupInfo, setEmbeddedSignupInfo] =
    useState<EmbeddedSignupInfo | null>(null);

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

  const autoReplyCount = visibleConnections.filter(
    (item) => item.auto_reply_enabled
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

  const metaReady = Boolean(metaAppId && metaConfigId);

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
              "id,workspace_id,owner_user_id,provider,status,connection_label,display_phone_number,meta_phone_number_id,meta_waba_id,selected_ai_staff_id,ai_enabled,auto_reply_enabled,handover_enabled,is_primary,last_inbound_at,last_outbound_at,last_status_at,last_error_at,last_error_code,last_error_message,notes,created_at,updated_at"
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

      const staffRows = (staffData ?? []) as AiStaffRow[];
      const connectionRows = (connectionData ?? []) as WhatsAppConnectionRow[];
      const connectionIds = connectionRows.map((connection) => connection.id);
      const nextAssignmentsByConnectionId: Record<
        string,
        ChannelAiAssignmentRow[]
      > = {};

      if (connectionIds.length) {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("channel_ai_assignments")
          .select(
            "id,workspace_id,channel_type,channel_connection_id,ai_staff_id,is_enabled,is_default,priority"
          )
          .eq("workspace_id", workspace.id)
          .eq("channel_type", "whatsapp")
          .in("channel_connection_id", connectionIds)
          .eq("is_enabled", true)
          .order("is_default", { ascending: false })
          .order("priority", { ascending: true });

        if (assignmentError) {
          throw assignmentError;
        }

        ((assignmentData ?? []) as ChannelAiAssignmentRow[]).forEach(
          (assignment) => {
            const key = assignment.channel_connection_id;

            if (!nextAssignmentsByConnectionId[key]) {
              nextAssignmentsByConnectionId[key] = [];
            }

            nextAssignmentsByConnectionId[key].push(assignment);
          }
        );
      }

      setAiStaff(staffRows);
      setConnections(connectionRows);
      setAssignmentsByConnectionId(nextAssignmentsByConnectionId);
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

  useEffect(() => {
    function handleMetaMessage(event: MessageEvent) {
      if (
        !event.origin.includes("facebook.com") &&
        !event.origin.includes("facebook.net")
      ) {
        return;
      }

      let parsed: unknown = event.data;

      if (typeof event.data === "string") {
        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }
      }

      const signupInfo = parseEmbeddedSignupMessage(parsed);

      if (signupInfo) {
        setEmbeddedSignupInfo(signupInfo);
      }
    }

    window.addEventListener("message", handleMetaMessage);

    return () => {
      window.removeEventListener("message", handleMetaMessage);
    };
  }, []);

  function openConnectForm() {
    setSuccess("");
    setError("");

    if (!canAddWhatsAppNumber) {
      setActiveTab("numbers");
      setIsFormOpen(false);
      setEditingConnectionId(null);
      setError(limitReachedMessage);
      return;
    }

    const firstStaffId = aiStaff[0]?.id || "";

    setEditingConnectionId(null);
    setForm({
      ...emptyForm,
      selected_ai_staff_id: firstStaffId,
      ai_team_staff_ids: firstStaffId ? [firstStaffId] : [],
      first_responder_ai_staff_id: firstStaffId,
    });
    setIsFormOpen(true);
    setActiveTab("numbers");
  }

  function openEditForm(connection: WhatsAppConnectionRow) {
    const assignments = assignmentsByConnectionId[connection.id] || [];
    const teamIds = assignments.length
      ? assignments.map((assignment) => assignment.ai_staff_id)
      : connection.selected_ai_staff_id
        ? [connection.selected_ai_staff_id]
        : [];
    const firstResponderId =
      assignments.find((assignment) => assignment.is_default)?.ai_staff_id ||
      connection.selected_ai_staff_id ||
      teamIds[0] ||
      "";
    const normalizedTeam = normalizeAiTeamIds({
      teamIds,
      firstResponderId,
      fallbackId: connection.selected_ai_staff_id || "",
    });

    setEditingConnectionId(connection.id);
    setForm({
      connection_label: connection.connection_label ?? "",
      selected_ai_staff_id: normalizedTeam.firstResponderId,
      ai_team_staff_ids: normalizedTeam.teamIds,
      first_responder_ai_staff_id: normalizedTeam.firstResponderId,
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

  async function saveConnectionSettings() {
    if (!workspace?.id || !editingConnectionId) {
      setError("Connection is not ready yet.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      const normalizedTeam = normalizeAiTeamIds({
        teamIds: form.ai_team_staff_ids,
        firstResponderId: form.first_responder_ai_staff_id,
        fallbackId: form.selected_ai_staff_id,
      });

      if (form.is_primary) {
        await supabase
          .from("workspace_whatsapp_connections")
          .update({ is_primary: false })
          .eq("workspace_id", workspace.id)
          .neq("id", editingConnectionId);
      }

      const { error: updateError } = await supabase
        .from("workspace_whatsapp_connections")
        .update({
          connection_label: form.connection_label.trim() || null,
          selected_ai_staff_id: normalizedTeam.firstResponderId || null,
          ai_enabled: form.ai_enabled,
          auto_reply_enabled: form.auto_reply_enabled,
          handover_enabled: form.handover_enabled,
          is_primary: form.is_primary,
          notes: form.notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingConnectionId)
        .eq("workspace_id", workspace.id);

      if (updateError) {
        throw updateError;
      }

      const { error: deleteAssignmentError } = await supabase
        .from("channel_ai_assignments")
        .delete()
        .eq("workspace_id", workspace.id)
        .eq("channel_type", "whatsapp")
        .eq("channel_connection_id", editingConnectionId);

      if (deleteAssignmentError) {
        throw deleteAssignmentError;
      }

      if (normalizedTeam.teamIds.length) {
        const assignmentRows = normalizedTeam.teamIds.map((aiStaffId, index) => ({
          workspace_id: workspace.id,
          channel_type: "whatsapp",
          channel_connection_id: editingConnectionId,
          ai_staff_id: aiStaffId,
          is_enabled: true,
          is_default: aiStaffId === normalizedTeam.firstResponderId,
          priority: (index + 1) * 10,
          routing_notes: null,
          created_by_user_id: null,
        }));

        const { error: assignmentError } = await supabase
          .from("channel_ai_assignments")
          .insert(assignmentRows);

        if (assignmentError) {
          throw assignmentError;
        }
      }

      setSuccess("WhatsApp AI Team saved.");
      setIsFormOpen(false);
      setEditingConnectionId(null);
      setForm(emptyForm);
      await loadWhatsAppSetup();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "WhatsApp settings could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function startMetaEmbeddedSignup() {
    if (!workspace?.id) {
      setError("Workspace is not ready yet.");
      return;
    }

    if (!canAddWhatsAppNumber) {
      setError(limitReachedMessage);
      return;
    }

    if (!metaAppId || !metaConfigId) {
      setError(
        "Meta Embedded Signup is not configured yet. Add NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID to your environment."
      );
      return;
    }

    setIsConnectingMeta(true);
    setError("");
    setSuccess("");
    setEmbeddedSignupInfo(null);

    try {
      await loadFacebookSdk();

      if (!window.FB) {
        throw new Error("Facebook SDK is not ready yet.");
      }

      window.FB.login(
  (response) => {
    void (async () => {
      try {
        const code = cleanText(response.authResponse?.code);

            if (!code) {
              setError(
                "Meta signup was cancelled or did not return an authorization code."
              );
              setIsConnectingMeta(false);
              return;
            }

            const token = await getAccessToken();

            if (!token) {
              setError("Please log in again before connecting WhatsApp.");
              setIsConnectingMeta(false);
              return;
            }

            const normalizedTeam = normalizeAiTeamIds({
              teamIds: form.ai_team_staff_ids,
              firstResponderId: form.first_responder_ai_staff_id,
              fallbackId: form.selected_ai_staff_id,
            });

            const apiResponse = await fetch(
              "/api/meta/whatsapp/embedded-signup",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  code,
                  workspace_id: workspace.id,
                  connection_label: form.connection_label.trim() || null,
                  selected_ai_staff_id: normalizedTeam.firstResponderId || null,
                  ai_enabled: form.ai_enabled,
                  auto_reply_enabled: form.auto_reply_enabled,
                  handover_enabled: form.handover_enabled,
                  is_primary: form.is_primary,
                  notes: form.notes.trim() || null,
                  phone_number_id:
                    embeddedSignupInfo?.phone_number_id || undefined,
                  waba_id: embeddedSignupInfo?.waba_id || undefined,
                  business_id: embeddedSignupInfo?.business_id || undefined,
                  phone_number: embeddedSignupInfo?.phone_number || undefined,
                  embedded_signup_info: embeddedSignupInfo || null,
                }),
              }
            );

            const result = await apiResponse.json().catch(() => ({}));

            if (!apiResponse.ok || result.success === false) {
              setError(
                result.error ||
                  "WhatsApp could not be connected. Please check Meta setup."
              );
              setIsConnectingMeta(false);
              return;
            }

            const createdConnectionId = cleanText(
              (result as {
                connection?: { id?: string };
                connection_id?: string;
                id?: string;
              }).connection?.id ||
                (result as { connection_id?: string }).connection_id ||
                (result as { id?: string }).id
            );

            if (createdConnectionId && normalizedTeam.teamIds.length) {
              const supabase = createClient();

              await supabase
                .from("channel_ai_assignments")
                .delete()
                .eq("workspace_id", workspace.id)
                .eq("channel_type", "whatsapp")
                .eq("channel_connection_id", createdConnectionId);

              await supabase.from("channel_ai_assignments").insert(
                normalizedTeam.teamIds.map((aiStaffId, index) => ({
                  workspace_id: workspace.id,
                  channel_type: "whatsapp",
                  channel_connection_id: createdConnectionId,
                  ai_staff_id: aiStaffId,
                  is_enabled: true,
                  is_default: aiStaffId === normalizedTeam.firstResponderId,
                  priority: (index + 1) * 10,
                  routing_notes: null,
                  created_by_user_id: null,
                }))
              );
            }

            setSuccess(
              "WhatsApp connected. Choose your First Responder AI, test replies, then turn auto-reply on when ready."
            );
            setIsFormOpen(false);
            setEditingConnectionId(null);
            setForm(emptyForm);
            await loadWhatsAppSetup();
          } catch (connectError) {
            setError(
              connectError instanceof Error
                ? connectError.message
                : "WhatsApp could not be connected."
            );
                  } finally {
          setIsConnectingMeta(false);
        }
      })();
    },
    {
      config_id: metaConfigId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: "whatsapp_embedded_signup",
            sessionInfoVersion: "3",
          },
        }
      );
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Meta Embedded Signup could not start."
      );
      setIsConnectingMeta(false);
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
            <p className="text-xl font-black">WhatsApp page could not load.</p>
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
              WhatsApp AI
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                  Connect WhatsApp to your Kolkap AI staff.
                </h1>

                <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
                  Connect your official WhatsApp number with Meta, assign your AI Team, control auto-replies, keep human handover available,
                  and manage every conversation from Inbox.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                      Current Plan Limit
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#7CFF3D]">
                      {currentPlan.name}: {whatsappLimitLabel}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                      Meta Setup
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#7CFF3D]">
                      {metaReady ? "Ready" : "Needs env setup"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={openConnectForm}
                  disabled={!canAddWhatsAppNumber}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PlugZap className="h-6 w-6" />
                  Connect with Meta
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

        {!metaReady ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="text-lg font-black">
              Meta Embedded Signup is not fully configured
            </p>
            <p className="mt-1 text-base font-semibold leading-7">
              Add NEXT_PUBLIC_META_APP_ID and
              NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID to your environment before
              customers can connect WhatsApp from this page.
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

          <SummaryCard icon={Bot} title="AI Support On" value={`${aiEnabledCount}`} />

          <SummaryCard
            icon={Sparkles}
            title="Auto-reply On"
            value={`${autoReplyCount}`}
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
            assignmentsByConnectionId={assignmentsByConnectionId}
            openConnectForm={openConnectForm}
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
              assignmentsByConnectionId={assignmentsByConnectionId}
              openConnectForm={openConnectForm}
              openEditForm={openEditForm}
              canAddWhatsAppNumber={canAddWhatsAppNumber}
            />

            {isFormOpen ? (
              <WhatsAppSetupForm
                form={form}
                setForm={setForm}
                aiStaff={aiStaff}
                isSaving={isSaving}
                isConnectingMeta={isConnectingMeta}
                editing={Boolean(editingConnectionId)}
                metaReady={metaReady}
                embeddedSignupInfo={embeddedSignupInfo}
                onSaveSettings={saveConnectionSettings}
                onConnectWithMeta={startMetaEmbeddedSignup}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingConnectionId(null);
                  setForm(emptyForm);
                }}
              />
            ) : (
              <ConnectNumberSideCard
                openConnectForm={openConnectForm}
                canAddWhatsAppNumber={canAddWhatsAppNumber}
                limitReachedMessage={limitReachedMessage}
                whatsappLimitLabel={whatsappLimitLabel}
                metaReady={metaReady}
              />
            )}
          </section>
        ) : null}

        {activeTab === "logs" ? <MessageLogs logs={logs} /> : null}

        {activeTab === "settings" ? (
          <SettingsPanel
            loadWhatsAppSetup={loadWhatsAppSetup}
            metaReady={metaReady}
          />
        ) : null}
      </div>
    </main>
  );
}

function OverviewPanel({
  connections,
  aiStaffById,
  assignmentsByConnectionId,
  openConnectForm,
  openEditForm,
  setActiveTab,
  canAddWhatsAppNumber,
  limitReachedMessage,
}: {
  connections: WhatsAppConnectionRow[];
  aiStaffById: Map<string, AiStaffRow>;
  assignmentsByConnectionId: Record<string, ChannelAiAssignmentRow[]>;
  openConnectForm: () => void;
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
              WhatsApp numbers connected to this workspace
            </h2>
          </div>

          <button
            type="button"
            onClick={openConnectForm}
            disabled={!canAddWhatsAppNumber}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlugZap className="h-5 w-5" />
            Connect with Meta
          </button>
        </div>

        {!canAddWhatsAppNumber ? (
          <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="text-base font-black">{limitReachedMessage}</p>
          </div>
        ) : null}

        {connections.length === 0 ? (
          <EmptyNumbersState
            openConnectForm={openConnectForm}
            canAddWhatsAppNumber={canAddWhatsAppNumber}
          />
        ) : (
          <div className="grid gap-4">
            {connections.slice(0, 3).map((connection) => {
              const teamSummary = getConnectionTeamSummary({
                connection,
                aiStaffById,
                assignments: assignmentsByConnectionId[connection.id],
              });

              return (
                <NumberRow
                  key={connection.id}
                  connection={connection}
                  firstResponderAI={teamSummary.firstResponderAI}
                  aiTeam={teamSummary.team}
                  openEditForm={openEditForm}
                />
              );
            })}

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
          How it works
        </p>

        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
          Connect, test, then activate auto-reply.
        </h2>

        <div className="mt-6 grid gap-4">
          <FlowStep
            number="1"
            title="Connect with Meta"
            text="The business owner connects their official WhatsApp number through Meta Embedded Signup."
          />
          <FlowStep
            number="2"
            title="Choose AI staff"
            text="Choose an AI Team and set your Admin AI or Reception AI as the First Responder."
          />
          <FlowStep
            number="3"
            title="Turn auto-reply on"
            text="When auto-reply is on, AI replies automatically. When off, Inbox can still generate suggestions."
          />
          <FlowStep
            number="4"
            title="Manage in Inbox"
            text="All inbound messages, AI replies, and human replies are saved in the customer Inbox."
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard/test-ai"
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5"
          >
            <Send className="h-5 w-5" />
            Test AI
          </Link>

          <Link
            href="/dashboard/inbox"
            className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-base font-black text-[#07111F] transition hover:-translate-y-0.5"
          >
            <Inbox className="h-5 w-5" />
            Inbox
          </Link>

          <Link
            href="/dashboard/go-live"
            className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-base font-black text-[#07111F] transition hover:-translate-y-0.5"
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
  assignmentsByConnectionId,
  openConnectForm,
  openEditForm,
  canAddWhatsAppNumber,
}: {
  isLoading: boolean;
  connections: WhatsAppConnectionRow[];
  aiStaffById: Map<string, AiStaffRow>;
  assignmentsByConnectionId: Record<string, ChannelAiAssignmentRow[]>;
  openConnectForm: () => void;
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
            Official WhatsApp API connections
          </h2>
        </div>

        <button
          type="button"
          onClick={openConnectForm}
          disabled={!canAddWhatsAppNumber}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlugZap className="h-5 w-5" />
          Connect
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6 text-lg font-black text-slate-600">
          Loading WhatsApp numbers...
        </div>
      ) : connections.length === 0 ? (
        <EmptyNumbersState
          openConnectForm={openConnectForm}
          canAddWhatsAppNumber={canAddWhatsAppNumber}
        />
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => {
            const teamSummary = getConnectionTeamSummary({
              connection,
              aiStaffById,
              assignments: assignmentsByConnectionId[connection.id],
            });

            return (
              <NumberRow
                key={connection.id}
                connection={connection}
                firstResponderAI={teamSummary.firstResponderAI}
                aiTeam={teamSummary.team}
                openEditForm={openEditForm}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyNumbersState({
  openConnectForm,
  canAddWhatsAppNumber,
}: {
  openConnectForm: () => void;
  canAddWhatsAppNumber: boolean;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-[#F7F9FA] p-7 text-center">
      <Smartphone className="mx-auto h-10 w-10 text-slate-400" />

      <h3 className="mt-4 text-2xl font-black">
        No WhatsApp number connected yet.
      </h3>

      <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
        Connect an official WhatsApp number through Meta, assign AI staff, then
        test replies before turning auto-reply on.
      </p>

      <button
        type="button"
        onClick={openConnectForm}
        disabled={!canAddWhatsAppNumber}
        className="mt-6 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-base font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlugZap className="h-5 w-5" />
        Connect with Meta
      </button>
    </div>
  );
}

function NumberRow({
  connection,
  firstResponderAI,
  aiTeam,
  openEditForm,
}: {
  connection: WhatsAppConnectionRow;
  firstResponderAI?: AiStaffRow;
  aiTeam: AiStaffRow[];
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
            {connection.display_phone_number || "Number not available yet"}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-500">
            First Responder AI: {firstResponderAI?.name || "Not selected"}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-500">
            AI Team: {aiTeam.length ? `${aiTeam.length} selected` : "Not selected"}
          </p>

          {connection.meta_phone_number_id || connection.meta_waba_id ? (
            <p className="mt-1 text-xs font-bold text-slate-400">
              Meta ID connected
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openEditForm(connection)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <Settings className="h-4 w-4" />
            Edit Controls
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

      {hasIssue ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="text-sm font-black">
            {connection.last_error_code || "WhatsApp issue"}
          </p>
          <p className="mt-1 text-sm font-semibold">
            {connection.last_error_message || "Please check the setup."}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 text-sm font-bold text-slate-500 sm:grid-cols-2">
        <p>Last inbound: {formatDate(connection.last_inbound_at)}</p>
        <p>Last outbound: {formatDate(connection.last_outbound_at)}</p>
      </div>
    </div>
  );
}

function ConnectNumberSideCard({
  openConnectForm,
  canAddWhatsAppNumber,
  limitReachedMessage,
  whatsappLimitLabel,
  metaReady,
}: {
  openConnectForm: () => void;
  canAddWhatsAppNumber: boolean;
  limitReachedMessage: string;
  whatsappLimitLabel: string;
  metaReady: boolean;
}) {
  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        <PlugZap className="h-8 w-8" />
      </div>

      <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
        Connect
      </p>

      <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
        Connect WhatsApp through Meta.
      </h2>

      <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
        Your current plan includes {whatsappLimitLabel}. Each connected number
        can have its own AI Team, First Responder AI, auto-reply setting, and handover controls.
      </p>

      {!metaReady ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="text-base font-black">
            Meta environment variables are missing.
          </p>
        </div>
      ) : null}

      {!canAddWhatsAppNumber ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="text-base font-black">{limitReachedMessage}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={openConnectForm}
        disabled={!canAddWhatsAppNumber}
        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlugZap className="h-6 w-6" />
        Start Meta Setup
      </button>
    </div>
  );
}

function WhatsAppSetupForm({
  form,
  setForm,
  aiStaff,
  isSaving,
  isConnectingMeta,
  editing,
  metaReady,
  embeddedSignupInfo,
  onSaveSettings,
  onConnectWithMeta,
  onCancel,
}: {
  form: WhatsAppForm;
  setForm: Dispatch<SetStateAction<WhatsAppForm>>;
  aiStaff: AiStaffRow[];
  isSaving: boolean;
  isConnectingMeta: boolean;
  editing: boolean;
  metaReady: boolean;
  embeddedSignupInfo: EmbeddedSignupInfo | null;
  onSaveSettings: () => void;
  onConnectWithMeta: () => void;
  onCancel: () => void;
}) {
  const selectedAiTeam = useMemo(() => {
    return form.ai_team_staff_ids
      .map((id) => aiStaff.find((item) => item.id === id))
      .filter(Boolean) as AiStaffRow[];
  }, [aiStaff, form.ai_team_staff_ids]);

  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          {editing ? <Settings className="h-8 w-8" /> : <PlugZap className="h-8 w-8" />}
        </div>

        <div>
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {editing ? "Edit Controls" : "Meta Setup"}
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
            {editing ? "WhatsApp AI controls" : "Connect official WhatsApp"}
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

        <div className="grid gap-3">
          <div>
            <p className="text-base font-black text-slate-700">
              WhatsApp AI Team
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
              Choose one or more AI staff for this number. The First Responder AI
              should normally be your Admin AI or Reception AI.
            </p>
          </div>

          {aiStaff.length ? (
            <div className="grid gap-3">
              {aiStaff.map((item) => {
                const checked = form.ai_team_staff_ids.includes(item.id);

                return (
                  <label
                    key={item.id}
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
                          ? uniqueIds([...form.ai_team_staff_ids, item.id])
                          : form.ai_team_staff_ids.filter((id) => id !== item.id);

                        const nextFirstResponder =
                          nextIds.includes(form.first_responder_ai_staff_id)
                            ? form.first_responder_ai_staff_id
                            : nextIds[0] || "";

                        setForm((current) => ({
                          ...current,
                          ai_team_staff_ids: nextIds,
                          first_responder_ai_staff_id: nextFirstResponder,
                          selected_ai_staff_id: nextFirstResponder,
                        }));
                      }}
                      className="mt-1 h-5 w-5"
                    />

                    <span>
                      <span className="block text-lg font-black">
                        {item.name}
                      </span>
                      <span
                        className={`mt-1 block text-sm font-bold ${
                          checked ? "text-slate-200" : "text-slate-500"
                        }`}
                      >
                        {item.role} — {statusLabel(item.status)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="text-base font-black">
                Create active AI staff before assigning a WhatsApp AI Team.
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

              setForm((current) => ({
                ...current,
                ai_team_staff_ids: normalized.teamIds,
                first_responder_ai_staff_id: normalized.firstResponderId,
                selected_ai_staff_id: normalized.firstResponderId,
              }));
            }}
            disabled={!form.ai_team_staff_ids.length}
            className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
          >
            <option value="">Choose First Responder AI</option>
            {selectedAiTeam.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {item.role}
              </option>
            ))}
          </select>

          <span className="text-sm font-bold text-slate-500">
            This AI replies first before future smart routing sends the customer
            to Sales, Support, Booking, or another specialist AI.
          </span>
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
            text="Allow the WhatsApp AI Team to help with this number."
            checked={form.ai_enabled}
            onChange={(value) =>
              setForm((current) => ({ ...current, ai_enabled: value }))
            }
          />

          <ToggleRow
            title="Auto-reply"
            text="If this is on, AI can reply automatically to customer WhatsApp messages."
            checked={form.auto_reply_enabled}
            onChange={(value) =>
              setForm((current) => ({ ...current, auto_reply_enabled: value }))
            }
          />

          <ToggleRow
            title="Human handover"
            text="Keep human handover available when the customer needs your team."
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
            placeholder="Example: This number is for bookings or customer support."
            rows={4}
            className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </label>

        {!editing ? (
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
            <div className="flex items-start gap-4">
              <KeyRound className="mt-1 h-6 w-6 shrink-0" />
              <div>
                <p className="text-lg font-black">
                  Meta will verify and connect the official number.
                </p>
                <p className="mt-2 text-base font-semibold leading-7">
                  After Meta signup finishes, Kolkap saves the real WhatsApp
                  phone number ID, WABA ID, and access token through the backend.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {embeddedSignupInfo ? (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
            <p className="text-base font-black">
              Meta signup information received.
            </p>
            <p className="mt-1 text-sm font-semibold">
              Phone number ID: {embeddedSignupInfo.phone_number_id || "Pending"}
            </p>
            <p className="mt-1 text-sm font-semibold">
              WABA ID: {embeddedSignupInfo.waba_id || "Pending"}
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {editing ? (
            <button
              type="button"
              onClick={onSaveSettings}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-5 text-lg font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-6 w-6" />
              {isSaving ? "Saving..." : "Save Controls"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectWithMeta}
              disabled={isConnectingMeta || !metaReady}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-5 text-lg font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlugZap className="h-6 w-6" />
              {isConnectingMeta ? "Connecting..." : "Connect with Meta"}
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving || isConnectingMeta}
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
  metaReady,
}: {
  loadWhatsAppSetup: () => void;
  metaReady: boolean;
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
          System Status
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
          Reload WhatsApp status.
        </h2>

        <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
          Refresh this page to check the latest WhatsApp numbers, message
          activity, setup status, and Meta connection state.
        </p>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
            Meta Embedded Signup
          </p>
          <p className="mt-1 text-xl font-black">
            {metaReady ? "Configured" : "Missing environment variables"}
          </p>
        </div>

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
            Once WhatsApp is active, incoming messages, AI replies, manual
            replies, failed sends, and skipped auto-replies will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[1.15fr_0.9fr_1fr_1fr_1.6fr_0.9fr_0.65fr] border-b border-slate-200 bg-[#F7F9FA] px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-slate-500">
              <p>Date</p>
              <p>Direction</p>
              <p>From</p>
              <p>To</p>
              <p>Message</p>
              <p>Status</p>
              <p>Credits</p>
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
                  className="grid grid-cols-[1.15fr_0.9fr_1fr_1fr_1.6fr_0.9fr_0.65fr] border-b border-slate-200 px-5 py-5 text-base font-semibold text-slate-700 last:border-b-0"
                >
                  <p className="font-black text-blue-600">
                    {formatDate(log.created_at)}
                  </p>

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
                    {log.message_text || log.error_message || "No preview"}
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

function FlowStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#07111F] text-sm font-black text-[#7CFF3D]">
        {number}
      </div>
      <p className="text-lg font-black">{title}</p>
      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
        {text}
      </p>
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