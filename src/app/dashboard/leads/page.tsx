"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Inbox,
  MessageCircle,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const LEADS_PER_PAGE = 10;

type AiStaffRow = {
  id: string;
  name: string;
  role: string;
  status: string;
};

type ConversationRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  ai_staff_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_channel: string;
  status: string;
  lead_status: string;
  handover_requested: boolean;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "follow_up", label: "Follow Up" },
  { value: "closed", label: "Closed" },
];

const channelOptions = [
  { value: "all", label: "All Channels" },
  { value: "website_chat", label: "Website Chat" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

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

function statusLabel(value: string | null | undefined) {
  if (!value) return "Open";
  if (value === "open") return "Open";
  if (value === "handover") return "Handover";
  if (value === "closed") return "Closed";
  if (value === "new") return "New";
  if (value === "qualified") return "Qualified";
  if (value === "follow_up") return "Follow Up";
  if (value === "completed") return "Completed";

  return value.replace(/_/g, " ");
}

function channelLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value === "website_chat") return "Website Chat";
  if (value === "whatsapp") return "WhatsApp";
  if (value === "email") return "Email";
  if (value === "inbox") return "Inbox";

  return value.replace(/_/g, " ");
}

function getAiStaffLimitLabel(plan: ReturnType<typeof getKolkapPlan>) {
  if (plan.aiStaffLimit === "custom") {
    return "Custom AI staff limit";
  }

  return `${plan.aiStaffLimit} AI staff included`;
}

export default function LeadsPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [leads, setLeads] = useState<ConversationRow[]>([]);
  const [leadCount, setLeadCount] = useState(0);

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAI, setSelectedAI] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(leadCount / LEADS_PER_PAGE));

  const aiNameMap = useMemo(() => {
    return aiStaffRows.reduce<Record<string, string>>((map, staff) => {
      map[staff.id] = staff.name;
      return map;
    }, {});
  }, [aiStaffRows]);

  const newCount = leads.filter((lead) => lead.lead_status === "new").length;
  const qualifiedCount = leads.filter(
    (lead) => lead.lead_status === "qualified"
  ).length;
  const followUpCount = leads.filter(
    (lead) => lead.lead_status === "follow_up"
  ).length;
  const handoverCount = leads.filter((lead) => lead.handover_requested).length;

  useEffect(() => {
    let isMounted = true;

    async function loadAiStaff() {
      if (!workspace?.id) return;

      const supabase = createClient();

      const { data } = await supabase
        .from("ai_staff")
        .select("id,name,role,status")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      setAiStaffRows((data ?? []) as AiStaffRow[]);
    }

    loadAiStaff();

    return () => {
      isMounted = false;
    };
  }, [workspace?.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadLeads() {
      if (!workspace?.id) return;

      setIsLoading(true);
      setPageError("");

      const from = (currentPage - 1) * LEADS_PER_PAGE;
      const to = from + LEADS_PER_PAGE - 1;

      const supabase = createClient();

      let query = supabase
        .from("customer_conversations")
        .select("*", { count: "exact" })
        .eq("workspace_id", workspace.id)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .range(from, to);

      if (selectedStatus !== "all") {
        query = query.eq("lead_status", selectedStatus);
      }

      if (selectedAI !== "all") {
        query = query.eq("ai_staff_id", selectedAI);
      }

      if (selectedChannel !== "all") {
        query = query.eq("customer_channel", selectedChannel);
      }

      const { data, error, count } = await query;

      if (!isMounted) return;

      if (error) {
        setPageError(error.message);
        setIsLoading(false);
        return;
      }

      setLeads((data ?? []) as ConversationRow[]);
      setLeadCount(count ?? 0);
      setIsLoading(false);
    }

    loadLeads();

    return () => {
      isMounted = false;
    };
  }, [
    workspace?.id,
    selectedStatus,
    selectedAI,
    selectedChannel,
    currentPage,
    reloadKey,
  ]);

  async function updateLead(
    leadId: string,
    updates: Partial<
      Pick<ConversationRow, "lead_status" | "status" | "handover_requested">
    >
  ) {
    setActionMessage("");
    setActionError("");

    if (!workspace?.id) return;

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("customer_conversations")
      .update({
        ...updates,
        updated_at: now,
      })
      .eq("id", leadId)
      .eq("workspace_id", workspace.id);

    if (error) {
      setActionError(error.message || "Lead could not be updated.");
      return;
    }

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              ...updates,
              updated_at: now,
            }
          : lead
      )
    );

    setActionMessage("Lead updated.");
  }

  function resetFilters() {
    setSelectedStatus("all");
    setSelectedAI("all");
    setSelectedChannel("all");
    setCurrentPage(1);
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading leads...
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
            <p className="text-xl font-black">Leads could not load.</p>
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
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/inbox"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-5 py-3 text-base font-black text-[#07111F]"
              >
                <Inbox className="h-5 w-5" />
                Open Inbox
              </Link>

              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
              >
                <RefreshCcw className="h-5 w-5" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Leads
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Manage customer leads from your conversations.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Track potential customers, update lead status, review handover
            needs, and open the related conversation in Inbox.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<WalletCards className="h-7 w-7" />}
            label="Current Plan"
            value={currentPlan.name}
            note={currentPlan.priceLabel}
          />

          <SummaryCard
            icon={<UsersRound className="h-7 w-7" />}
            label="Total Leads"
            value={`${leadCount}`}
            note={`${newCount} new on this page`}
          />

          <SummaryCard
            icon={<Zap className="h-7 w-7" />}
            label="Qualified"
            value={`${qualifiedCount}`}
            note={`${followUpCount} follow-up on this page`}
          />

          <SummaryCard
            icon={<ShieldCheck className="h-7 w-7" />}
            label="Needs Handover"
            value={`${handoverCount}`}
            note={getAiStaffLimitLabel(currentPlan)}
            dark
          />
        </div>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Filter className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Lead List
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Follow up with the right customer at the right time.
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                Leads are created from customer conversations. Use this page to
                qualify, follow up, close, or hand over conversations to your
                team.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FilterSelect
                label="Lead Status"
                value={selectedStatus}
                onChange={(value) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
                options={statusOptions}
              />

              <FilterSelect
                label="Channel"
                value={selectedChannel}
                onChange={(value) => {
                  setSelectedChannel(value);
                  setCurrentPage(1);
                }}
                options={channelOptions}
              />

              <FilterSelect
                label="AI Staff"
                value={selectedAI}
                onChange={(value) => {
                  setSelectedAI(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "all", label: "All AI Staff" },
                  ...aiStaffRows.map((staff) => ({
                    value: staff.id,
                    label: staff.name,
                  })),
                ]}
              />

              <button
                type="button"
                onClick={resetFilters}
                className="mt-auto inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-4 text-sm font-black text-white"
              >
                Reset
              </button>
            </div>
          </div>

          {actionMessage ? (
            <div className="mb-5 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
              <p className="flex items-center gap-3 text-base font-black">
                <CheckCircle2 className="h-5 w-5" />
                {actionMessage}
              </p>
            </div>
          ) : null}

          {actionError ? (
            <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="text-base font-black">{actionError}</p>
            </div>
          ) : null}

          {pageError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-lg font-black text-red-700">
              {pageError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6 text-lg font-black">
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <EmptyLeadsState />
          ) : (
            <div className="grid gap-5">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  aiName={lead.ai_staff_id ? aiNameMap[lead.ai_staff_id] : ""}
                  updateLead={updateLead}
                />
              ))}

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <p className="text-center text-sm font-black text-slate-500">
                  Page {currentPage} / {totalPages}
                </p>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  note,
  dark = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
        dark
          ? "border-[#7CFF3D] bg-[#07111F] text-white"
          : "border-slate-200 bg-white text-[#07111F]"
      }`}
    >
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
          dark ? "bg-[#7CFF3D] text-[#07111F]" : "bg-[#07111F] text-[#7CFF3D]"
        }`}
      >
        {icon}
      </div>

      <p className={`text-lg font-black ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </p>

      <p className="mt-2 text-3xl font-black tracking-[-0.04em]">{value}</p>

      <p
        className={`mt-2 text-base font-semibold leading-7 ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {note}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-600">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-sm font-black outline-none transition focus:border-blue-500 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyLeadsState() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
        <Inbox className="h-8 w-8" />
      </div>

      <h3 className="text-4xl font-black tracking-[-0.05em]">No leads yet.</h3>

      <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
        Leads will appear here once customer conversations are received through
        Website Chat, WhatsApp, or another connected channel.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard/inbox"
          className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
        >
          Open Inbox
          <ArrowRight className="h-5 w-5" />
        </Link>

        <Link
          href="/dashboard/go-live"
          className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-4 text-base font-black text-[#07111F]"
        >
          Go Live
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  aiName,
  updateLead,
}: {
  lead: ConversationRow;
  aiName?: string;
  updateLead: (
    leadId: string,
    updates: Partial<
      Pick<ConversationRow, "lead_status" | "status" | "handover_requested">
    >
  ) => Promise<void>;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <UserRound className="h-7 w-7" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-[-0.04em]">
                  {lead.customer_name || "Customer"}
                </h3>

                <p className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-600">
                  <Phone className="h-4 w-4" />
                  {lead.customer_phone || channelLabel(lead.customer_channel)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge label={statusLabel(lead.lead_status)} />

                {lead.handover_requested ? (
                  <StatusBadge label="Needs Action" warning />
                ) : null}
              </div>
            </div>

            <p className="mt-4 line-clamp-3 text-lg font-semibold leading-8 text-slate-700">
              {lead.last_message || "No message preview yet."}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoPill
                label="Channel"
                value={channelLabel(lead.customer_channel)}
                icon={<MessageCircle className="h-4 w-4" />}
              />
              <InfoPill
                label="AI Staff"
                value={aiName || "Not assigned"}
                icon={<Bot className="h-4 w-4" />}
              />
              <InfoPill
                label="Conversation"
                value={statusLabel(lead.status)}
                icon={<ShieldCheck className="h-4 w-4" />}
              />
              <InfoPill
                label="Last Activity"
                value={formatDate(lead.last_message_at)}
                icon={<Clock3 className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-56 xl:grid-cols-1">
          <Link
            href="/dashboard/inbox"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
          >
            Open Inbox
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() =>
              updateLead(lead.id, {
                lead_status: "new",
                status: "open",
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#07111F]"
          >
            Mark New
          </button>

          <button
            type="button"
            onClick={() =>
              updateLead(lead.id, {
                lead_status: "qualified",
                status: "open",
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#07111F]"
          >
            Mark Qualified
          </button>

          <button
            type="button"
            onClick={() =>
              updateLead(lead.id, {
                lead_status: "follow_up",
                status: "open",
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#07111F]"
          >
            Mark Follow Up
          </button>

          <button
            type="button"
            onClick={() =>
              updateLead(lead.id, {
                handover_requested: true,
                status: "handover",
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-100 px-5 py-3 text-sm font-black text-amber-800"
          >
            Mark Handover
          </button>

          <button
            type="button"
            onClick={() =>
              updateLead(lead.id, {
                lead_status: "closed",
                status: "closed",
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-200 px-5 py-3 text-sm font-black text-slate-800"
          >
            Mark Closed
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  warning = false,
}: {
  label: string;
  warning?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-4 py-2 text-xs font-black ${
        warning ? "bg-amber-100 text-amber-800" : "bg-white text-[#07111F]"
      }`}
    >
      {label}
    </span>
  );
}

function InfoPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {icon}
        {label}
      </div>
      <p className="truncate text-base font-black text-[#07111F]">{value}</p>
    </div>
  );
}