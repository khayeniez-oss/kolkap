"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MessageSquareText,
  Pause,
  Play,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TemplateCategory = "marketing" | "utility";
type RecipientStatusFilter = "all" | "pending" | "sent" | "failed" | "skipped";

type Campaign = {
  id: string;
  name: string;
  template_name: string;
  template_language: string;
  category: string;
  campaign_type: string;
  send_provider: string | null;
  status: string;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  total_skipped: number;
  batch_size: number;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Recipient = {
  id: string;
  campaign_id: string;
  phone_e164: string;
  customer_name: string | null;
  lead_type: string | null;
  source: string | null;
  variables: Record<string, unknown> | null;
  status: string;
  meta_message_id: string | null;
  send_error?: unknown;
  error_type?: string | null;
  error_summary?: string | null;
  sent_at: string | null;
  failed_at: string | null;
  skipped_at: string | null;
  skip_reason: string | null;
  created_at: string;
};

type RecipientCounts = {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
};

type TemplateOption = {
  label: string;
  name: string;
  language: string;
  category: TemplateCategory;
  type: string;
  variableHint: string;
  note: string;
};

const APPROVED_TEMPLATES: TemplateOption[] = [
  {
    label: "Kolkap Business AI Intro",
    name: "kolkap_business_ai_intro",
    language: "en",
    category: "marketing",
    type: "business_initiated",
    variableHint: '{"1":"there"}',
    note: "Use this for first outreach to introduce Kolkap AI staff to business leads. Replace 'there' with the customer's name if available.",
  },
  {
    label: "Kolkap Introduction",
    name: "kolkap_intro_en",
    language: "en",
    category: "marketing",
    type: "business_initiated",
    variableHint: "No variables.",
    note: "Use this after Meta approves this exact template name.",
  },
  {
    label: "Kolkap Trial Follow Up",
    name: "kolkap_trial_followup_en",
    language: "en",
    category: "marketing",
    type: "business_initiated",
    variableHint: "No variables.",
    note: "Use for leads asking about free trial or setup.",
  },
  {
    label: "Kolkap Support Follow Up",
    name: "kolkap_support_followup_en",
    language: "en",
    category: "utility",
    type: "manual_template",
    variableHint: '{"1":"Customer name"}',
    note: "Use only if this utility template is approved in Meta.",
  },
];

const RECIPIENT_FILTERS: { value: RecipientStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
];

const LEAD_TYPES = [
  { value: "unknown", label: "Unknown" },
  { value: "small_business", label: "Small Business" },
  { value: "agency", label: "Agency" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "service_business", label: "Service Business" },
  { value: "manual_admin", label: "Manual Admin" },
];

const EMPTY_COUNTS: RecipientCounts = {
  total: 0,
  pending: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function getStatusClass(status?: string | null) {
  const clean = String(status || "").toLowerCase();

  if (clean === "sent" || clean === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (clean === "failed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (clean === "skipped" || clean === "paused") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (clean === "sending") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function safeJson(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getRecipientErrorText(recipient: Recipient) {
  const status = String(recipient.status || "").toLowerCase();

  if (recipient.error_summary) return recipient.error_summary;

  if (status === "pending") return "Not sent yet.";

  if (status === "skipped") {
    return recipient.skip_reason || "Skipped.";
  }

  if (status === "failed") {
    const raw = safeJson(recipient.send_error);
    return raw || "Failed to send.";
  }

  return "-";
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${getStatusClass(
        status
      )}`}
    >
      {status || "draft"}
    </span>
  );
}

export default function KolkapWhatsAppCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientCounts, setRecipientCounts] =
    useState<RecipientCounts>(EMPTY_COUNTS);
  const [recipientStatusFilter, setRecipientStatusFilter] =
    useState<RecipientStatusFilter>("all");

  const [loading, setLoading] = useState(true);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sendingBatch, setSendingBatch] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [templateName, setTemplateName] = useState("kolkap_business_ai_intro");
  const [templateLanguage, setTemplateLanguage] = useState("en");
  const [templateCategory, setTemplateCategory] =
    useState<TemplateCategory>("marketing");
  const [campaignType, setCampaignType] = useState("business_initiated");
  const [leadType, setLeadType] = useState("manual_admin");
  const [batchSize, setBatchSize] = useState(25);
  const [recipientText, setRecipientText] = useState("");
  const [defaultVariablesText, setDefaultVariablesText] =
    useState('{"1":"there"}');

  const selectedTemplate = useMemo(() => {
    return (
      APPROVED_TEMPLATES.find((item) => item.name === templateName) ||
      APPROVED_TEMPLATES[0]
    );
  }, [templateName]);

  const campaignPending = recipientCounts.pending;
  const campaignFailed = recipientCounts.failed;

  async function getAccessToken() {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        setCampaigns([]);
        return;
      }

      const response = await fetch("/api/admin/whatsapp/template-campaigns", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load campaigns.");
      }

      setCampaigns((result.campaigns || []) as Campaign[]);
    } catch (loadError) {
      console.error("Load Kolkap WhatsApp campaigns error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load campaigns."));
    } finally {
      setLoading(false);
    }
  }

  async function loadCampaign(
    campaignId: string,
    nextRecipientStatusFilter = recipientStatusFilter
  ) {
    try {
      setLoadingCampaign(true);
      setError("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        return;
      }

      const params = new URLSearchParams({
        campaignId,
        includeRecipients: "true",
        recipientStatus: nextRecipientStatusFilter,
      });

      const response = await fetch(
        `/api/admin/whatsapp/template-campaigns?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load campaign.");
      }

      setSelectedCampaign((result.campaign || null) as Campaign | null);
      setRecipients((result.recipients || []) as Recipient[]);
      setRecipientCounts(
        (result.recipientCounts || EMPTY_COUNTS) as RecipientCounts
      );
    } catch (loadError) {
      console.error("Load Kolkap campaign detail error:", loadError);
      setError(getErrorMessage(loadError, "Failed to load campaign."));
    } finally {
      setLoadingCampaign(false);
    }
  }

  function handleRecipientFilter(nextFilter: RecipientStatusFilter) {
    setRecipientStatusFilter(nextFilter);

    if (selectedCampaign?.id) {
      loadCampaign(selectedCampaign.id, nextFilter);
    }
  }

  function handleTemplateSelect(value: string) {
    const selected = APPROVED_TEMPLATES.find((item) => item.name === value);

    setTemplateName(value);

    if (selected) {
      setTemplateLanguage(selected.language);
      setTemplateCategory(selected.category);
      setCampaignType(selected.type);

      if (selected.variableHint.startsWith("{")) {
        setDefaultVariablesText(selected.variableHint);
      } else {
        setDefaultVariablesText("");
      }
    }
  }

  function parseDefaultVariables() {
    const clean = defaultVariablesText.trim();

    if (!clean) return {};

    try {
      return JSON.parse(clean);
    } catch {
      throw new Error(
        'Template variables must be valid JSON, example: {"1":"there"}'
      );
    }
  }

  async function createCampaign() {
    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        return;
      }

      const defaultVariables = parseDefaultVariables();

      const response = await fetch("/api/admin/whatsapp/template-campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          templateName,
          templateLanguage,
          campaignType,
          category: templateCategory,
          leadType,
          batchSize,
          recipients: recipientText,
          defaultVariables,
          sendProvider: "meta_cloud_api",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create campaign.");
      }

      setSuccess(
        `Campaign created with ${result.totalRecipients || 0} recipient(s).`
      );

      setName("");
      setRecipientText("");
      setDefaultVariablesText(selectedTemplate.variableHint.startsWith("{") ? selectedTemplate.variableHint : "");
      setRecipientStatusFilter("all");

      await loadCampaigns();

      if (result.campaignId) {
        await loadCampaign(result.campaignId, "all");
      }
    } catch (createError) {
      console.error("Create Kolkap WhatsApp campaign error:", createError);
      setError(getErrorMessage(createError, "Failed to create campaign."));
    } finally {
      setCreating(false);
    }
  }

  async function processCampaignBatch(
    action: "continue_pending" | "retry_failed"
  ) {
    if (!selectedCampaign?.id) return;

    const isRetryFailed = action === "retry_failed";

    if (isRetryFailed) {
      const confirmed = window.confirm(
        `Retry ${campaignFailed} failed recipient(s)?\n\nThis will only retry recipients with status "failed". It will not resend already sent recipients.`
      );

      if (!confirmed) return;
    }

    try {
      setSendingBatch(true);
      setError("");
      setSuccess("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        return;
      }

      const response = await fetch("/api/admin/whatsapp/template-campaigns", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          campaignId: selectedCampaign.id,
          batchSize,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to process campaign batch.");
      }

      setSuccess(
        `${isRetryFailed ? "Retry failed" : "Pending batch"} processed: ${
          result.sentThisBatch || 0
        } sent, ${result.failedThisBatch || 0} failed, ${
          result.skippedThisBatch || 0
        } skipped, pending left ${result.pendingLeft || 0}.`
      );

      await loadCampaigns();
      await loadCampaign(selectedCampaign.id, recipientStatusFilter);
    } catch (sendError) {
      console.error("Kolkap campaign batch action error:", sendError);
      setError(
        getErrorMessage(sendError, "Failed to process campaign batch.")
      );
    } finally {
      setSendingBatch(false);
    }
  }

  async function updateCampaignStatus(action: "pause" | "resume") {
    if (!selectedCampaign?.id) return;

    try {
      setActionLoading(action);
      setError("");
      setSuccess("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        return;
      }

      const response = await fetch("/api/admin/whatsapp/template-campaigns", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          campaignId: selectedCampaign.id,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed to ${action} campaign.`);
      }

      setSuccess(`Campaign ${action === "pause" ? "paused" : "resumed"}.`);

      await loadCampaigns();
      await loadCampaign(selectedCampaign.id, recipientStatusFilter);
    } catch (statusError) {
      console.error("Kolkap campaign status error:", statusError);
      setError(
        getErrorMessage(statusError, `Failed to ${action} campaign.`)
      );
    } finally {
      setActionLoading("");
    }
  }

  async function deleteSelectedCampaign() {
    if (!selectedCampaign?.id) return;

    const confirmed = window.confirm(
      `Delete campaign "${selectedCampaign.name}"?\n\nThis will delete the campaign, recipients, and send logs. This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingCampaign(true);
      setError("");
      setSuccess("");

      const token = await getAccessToken();

      if (!token) {
        setError("Please log in as admin first.");
        return;
      }

      const response = await fetch("/api/admin/whatsapp/template-campaigns", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "delete_campaign",
          campaignId: selectedCampaign.id,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete campaign.");
      }

      setSuccess(`Campaign "${selectedCampaign.name}" deleted.`);
      setSelectedCampaign(null);
      setRecipients([]);
      setRecipientCounts(EMPTY_COUNTS);

      await loadCampaigns();
    } catch (deleteError) {
      console.error("Delete Kolkap campaign error:", deleteError);
      setError(getErrorMessage(deleteError, "Failed to delete campaign."));
    } finally {
      setDeletingCampaign(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
              WhatsApp Campaigns
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Template Campaigns
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
              Create approved WhatsApp template campaigns for Kolkap outreach,
              trial follow-ups, and support messages. Sending requires Meta
              WhatsApp Cloud API to be connected.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              loadCampaigns();
              if (selectedCampaign?.id) {
                loadCampaign(selectedCampaign.id, recipientStatusFilter);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
            <p className="text-sm font-bold leading-6 text-amber-900">
              Use exact template names approved in Meta. The selected template
              name must match the Meta-approved template name exactly.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {success}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <h2 className="text-xl font-black">Create Campaign</h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Campaign Name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Example: Kolkap Business Leads Batch 1"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Approved Template
              </label>

              <select
                value={templateName}
                onChange={(event) => handleTemplateSelect(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
              >
                {APPROVED_TEMPLATES.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.label} — {item.name}
                  </option>
                ))}
              </select>

              <input
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="Exact approved Meta template name"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
              />

              <div className="mt-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 py-3 text-xs font-semibold leading-5 text-slate-600">
                <p>
                  <span className="font-black text-slate-800">Language:</span>{" "}
                  {templateLanguage}
                </p>
                <p>
                  <span className="font-black text-slate-800">Category:</span>{" "}
                  {templateCategory}
                </p>
                <p>
                  <span className="font-black text-slate-800">Type:</span>{" "}
                  {campaignType}
                </p>
                <p className="mt-1">
                  <span className="font-black text-slate-800">Variables:</span>{" "}
                  {selectedTemplate.variableHint}
                </p>
                <p className="mt-1">
                  <span className="font-black text-slate-800">Note:</span>{" "}
                  {selectedTemplate.note}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Language Code
                </label>
                <input
                  value={templateLanguage}
                  onChange={(event) => setTemplateLanguage(event.target.value)}
                  placeholder="en or id"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Batch Size
                </label>
                <input
                  type="number"
                  value={batchSize}
                  min={1}
                  max={200}
                  onChange={(event) => setBatchSize(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Campaign Type
              </label>
              <select
                value={campaignType}
                onChange={(event) => setCampaignType(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
              >
                <option value="business_initiated">Business Initiated</option>
                <option value="manual_template">Manual Template</option>
                <option value="campaign">Campaign</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Template Category
              </label>
              <select
                value={templateCategory}
                onChange={(event) =>
                  setTemplateCategory(event.target.value as TemplateCategory)
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
              >
                <option value="marketing">Marketing</option>
                <option value="utility">Utility</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Lead Type
              </label>
              <select
                value={leadType}
                onChange={(event) => setLeadType(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
              >
                {LEAD_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Phone Numbers
              </label>
              <textarea
                value={recipientText}
                onChange={(event) => setRecipientText(event.target.value)}
                rows={10}
                placeholder={`Paste one phone number per line:\n61416957890\n+61416957890\n628123456789`}
                className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
              />
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                Use international format without spaces when possible. Example:
                61416957890 or 628123456789.
              </p>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Template Variables Optional
              </label>
              <textarea
                value={defaultVariablesText}
                onChange={(event) => setDefaultVariablesText(event.target.value)}
                rows={3}
                placeholder={`Leave empty if template has no variables.\nExample for {{1}}: {"1":"there"} or {"1":"Michael"}`}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07111F]"
              />
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                For the Kolkap Business AI Intro template, use {"{"}"1":"there"{"}"}
                or replace "there" with the customer name.
              </p>
            </div>

            <button
              type="button"
              onClick={createCampaign}
              disabled={
                creating ||
                !name.trim() ||
                !templateName.trim() ||
                !recipientText.trim()
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? "Creating..." : "Create Campaign"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-xl font-black">Campaigns</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Select a campaign to view recipients, continue pending sends,
              retry failed recipients, pause, resume, or delete a test campaign.
            </p>
          </div>

          <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="max-h-[780px] overflow-y-auto border-b border-slate-100 p-3 lg:border-b-0 lg:border-r">
              {loading ? (
                <p className="p-4 text-sm font-semibold text-slate-500">
                  Loading campaigns...
                </p>
              ) : null}

              {!loading && campaigns.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4 text-sm font-semibold text-slate-500">
                  No campaigns yet.
                </p>
              ) : null}

              <div className="space-y-2">
                {campaigns.map((campaign) => {
                  const active = selectedCampaign?.id === campaign.id;
                  const pending = Math.max(
                    Number(campaign.total_recipients || 0) -
                      Number(campaign.total_sent || 0) -
                      Number(campaign.total_failed || 0) -
                      Number(campaign.total_skipped || 0),
                    0
                  );

                  return (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => loadCampaign(campaign.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-[#07111F] bg-[#07111F] text-white"
                          : "border-slate-200 bg-white hover:bg-[#F7F9FA]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {campaign.name}
                          </p>

                          <p
                            className={`mt-1 truncate text-xs font-semibold ${
                              active ? "text-white/60" : "text-slate-500"
                            }`}
                          >
                            {campaign.template_name}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black ${
                            active
                              ? "bg-white/10 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] font-black">
                        <div
                          className={
                            active
                              ? "rounded-xl bg-white/10 p-2"
                              : "rounded-xl bg-slate-50 p-2 text-slate-600"
                          }
                        >
                          <p>{campaign.total_recipients || 0}</p>
                          <p className="mt-1 opacity-60">Total</p>
                        </div>

                        <div
                          className={
                            active
                              ? "rounded-xl bg-white/10 p-2"
                              : "rounded-xl bg-emerald-50 p-2 text-emerald-700"
                          }
                        >
                          <p>{campaign.total_sent || 0}</p>
                          <p className="mt-1 opacity-60">Sent</p>
                        </div>

                        <div
                          className={
                            active
                              ? "rounded-xl bg-white/10 p-2"
                              : "rounded-xl bg-red-50 p-2 text-red-700"
                          }
                        >
                          <p>{campaign.total_failed || 0}</p>
                          <p className="mt-1 opacity-60">Failed</p>
                        </div>

                        <div
                          className={
                            active
                              ? "rounded-xl bg-white/10 p-2"
                              : "rounded-xl bg-blue-50 p-2 text-blue-700"
                          }
                        >
                          <p>{pending}</p>
                          <p className="mt-1 opacity-60">Pending</p>
                        </div>
                      </div>

                      <p
                        className={`mt-3 text-[11px] font-semibold ${
                          active ? "text-white/50" : "text-slate-400"
                        }`}
                      >
                        {formatDate(campaign.created_at)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-[620px]">
              {!selectedCampaign ? (
                <div className="flex min-h-[620px] items-center justify-center p-6 text-center">
                  <div>
                    <MessageSquareText className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">
                      Select a campaign to view details.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <h3 className="text-2xl font-black tracking-[-0.04em]">
                          {selectedCampaign.name}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {selectedCampaign.template_name} ·{" "}
                          {selectedCampaign.template_language}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusBadge status={selectedCampaign.status} />

                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                            Meta Cloud API
                          </span>

                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-700">
                            {selectedCampaign.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            processCampaignBatch("continue_pending")
                          }
                          disabled={sendingBatch || campaignPending === 0}
                          className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Send className="h-4 w-4" />
                          {sendingBatch ? "Sending..." : "Send Pending"}
                        </button>

                        <button
                          type="button"
                          onClick={() => processCampaignBatch("retry_failed")}
                          disabled={sendingBatch || campaignFailed === 0}
                          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retry Failed
                        </button>

                        <button
                          type="button"
                          onClick={() => updateCampaignStatus("pause")}
                          disabled={Boolean(actionLoading)}
                          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-800 disabled:opacity-40"
                        >
                          <Pause className="h-4 w-4" />
                          Pause
                        </button>

                        <button
                          type="button"
                          onClick={() => updateCampaignStatus("resume")}
                          disabled={Boolean(actionLoading)}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 disabled:opacity-40"
                        >
                          <Play className="h-4 w-4" />
                          Resume
                        </button>

                        <button
                          type="button"
                          onClick={deleteSelectedCampaign}
                          disabled={deletingCampaign}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
                      <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                          Total
                        </p>
                        <p className="mt-2 text-2xl font-black">
                          {recipientCounts.total}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-500">
                          Pending
                        </p>
                        <p className="mt-2 text-2xl font-black text-blue-700">
                          {recipientCounts.pending}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-500">
                          Sent
                        </p>
                        <p className="mt-2 text-2xl font-black text-emerald-700">
                          {recipientCounts.sent}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-red-500">
                          Failed
                        </p>
                        <p className="mt-2 text-2xl font-black text-red-700">
                          {recipientCounts.failed}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-500">
                          Skipped
                        </p>
                        <p className="mt-2 text-2xl font-black text-amber-800">
                          {recipientCounts.skipped}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-slate-100 p-4">
                    <div className="flex flex-wrap gap-2">
                      {RECIPIENT_FILTERS.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleRecipientFilter(item.value)}
                          className={`rounded-full border px-4 py-2 text-xs font-black ${
                            recipientStatusFilter === item.value
                              ? "border-[#07111F] bg-[#07111F] text-white"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-[520px] overflow-y-auto p-4">
                    {loadingCampaign ? (
                      <p className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4 text-sm font-semibold text-slate-500">
                        Loading recipients...
                      </p>
                    ) : null}

                    {!loadingCampaign && recipients.length === 0 ? (
                      <p className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4 text-sm font-semibold text-slate-500">
                        No recipients found for this filter.
                      </p>
                    ) : null}

                    <div className="space-y-2">
                      {recipients.map((recipient) => (
                        <div
                          key={recipient.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-sm font-black">
                                {recipient.customer_name ||
                                  recipient.phone_e164}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {recipient.phone_e164}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {recipient.lead_type || "unknown"} ·{" "}
                                {recipient.source || "campaign"}
                              </p>
                            </div>

                            <StatusBadge status={recipient.status} />
                          </div>

                          <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-500 md:grid-cols-2">
                            <p>
                              <span className="font-black text-slate-700">
                                Message ID:
                              </span>{" "}
                              {recipient.meta_message_id || "-"}
                            </p>

                            <p>
                              <span className="font-black text-slate-700">
                                Sent:
                              </span>{" "}
                              {formatDate(recipient.sent_at)}
                            </p>
                          </div>

                          {recipient.status === "failed" ||
                          recipient.status === "skipped" ||
                          recipient.error_summary ? (
                            <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
                              {getRecipientErrorText(recipient)}
                            </div>
                          ) : null}

                          {recipient.status === "sent" ? (
                            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-black text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" />
                              Sent successfully
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}