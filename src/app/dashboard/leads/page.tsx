"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Filter,
  Inbox,
  MessageCircle,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
} from "@/lib/kolkapPlan";
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

const translations = {
  en: {
    badge: "Leads",
    title: "Manage customer leads from your conversations.",
    subtitle:
      "Track potential customers, update lead status, review handover needs, and open the related conversation in your inbox.",
    loading: "Loading your leads...",
    failed: "Leads could not load.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    totalLeads: "Total Leads",
    credits: "Credits",
    handover: "Handover",
    leadList: "Lead List",
    leadListText:
      "Every customer conversation can become a lead. Use this page to manage follow-ups and sales opportunities.",
    noLeads: "No leads yet.",
    noLeadsText:
      "Your leads will appear here once customer conversations are received through WhatsApp, website chat, or another connected channel.",
    filterByStatus: "Filter by Lead Status",
    filterByAI: "Filter by AI Staff",
    allStatuses: "All Statuses",
    allAI: "All AI Staff",
    refresh: "Refresh",
    customer: "Customer",
    phone: "Phone",
    channel: "Channel",
    aiStaff: "AI Staff",
    lastMessage: "Last Message",
    lastActivity: "Last Activity",
    leadStatus: "Lead Status",
    conversationStatus: "Conversation Status",
    actions: "Actions",
    openInbox: "Open Inbox",
    markNew: "Mark New",
    markQualified: "Mark Qualified",
    markFollowUp: "Mark Follow Up",
    markClosed: "Mark Closed",
    markHandover: "Mark Handover",
    updated: "Lead updated.",
    updateFailed: "Lead could not be updated.",
    previous: "Previous",
    next: "Next",
    page: "Page",
    active: "Active",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    newLead: "New",
    needsAction: "Needs Action",
    status: {
      open: "Open",
      handover: "Handover",
      closed: "Closed",
      new: "New",
      qualified: "Qualified",
      follow_up: "Follow Up",
    },
  },

  id: {
    badge: "Leads",
    title: "Kelola leads pelanggan dari percakapan Anda.",
    subtitle:
      "Pantau calon pelanggan, update status lead, review kebutuhan handover, dan buka percakapan terkait di inbox.",
    loading: "Memuat leads Anda...",
    failed: "Leads gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    totalLeads: "Total Leads",
    credits: "Credits",
    handover: "Handover",
    leadList: "Daftar Leads",
    leadListText:
      "Setiap percakapan pelanggan bisa menjadi lead. Gunakan halaman ini untuk mengelola follow-up dan peluang sales.",
    noLeads: "Belum ada leads.",
    noLeadsText:
      "Leads Anda akan muncul di sini setelah percakapan pelanggan masuk melalui WhatsApp, website chat, atau channel lain yang terhubung.",
    filterByStatus: "Filter berdasarkan Status Lead",
    filterByAI: "Filter berdasarkan AI Staff",
    allStatuses: "Semua Status",
    allAI: "Semua AI Staff",
    refresh: "Refresh",
    customer: "Customer",
    phone: "Telepon",
    channel: "Channel",
    aiStaff: "AI Staff",
    lastMessage: "Pesan Terakhir",
    lastActivity: "Aktivitas Terakhir",
    leadStatus: "Status Lead",
    conversationStatus: "Status Percakapan",
    actions: "Aksi",
    openInbox: "Buka Inbox",
    markNew: "Tandai Baru",
    markQualified: "Tandai Qualified",
    markFollowUp: "Tandai Follow Up",
    markClosed: "Tandai Closed",
    markHandover: "Tandai Handover",
    updated: "Lead berhasil diperbarui.",
    updateFailed: "Lead gagal diperbarui.",
    previous: "Sebelumnya",
    next: "Berikutnya",
    page: "Halaman",
    active: "Aktif",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    newLead: "Baru",
    needsAction: "Perlu Tindakan",
    status: {
      open: "Open",
      handover: "Handover",
      closed: "Closed",
      new: "Baru",
      qualified: "Qualified",
      follow_up: "Follow Up",
    },
  },

  zh: {
    badge: "线索",
    title: "从客户对话中管理销售线索。",
    subtitle:
      "追踪潜在客户、更新线索状态、查看人工接手需求，并打开相关收件箱对话。",
    loading: "正在加载线索...",
    failed: "线索加载失败。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    totalLeads: "总线索",
    credits: "Credits",
    handover: "人工接手",
    leadList: "线索列表",
    leadListText:
      "每个客户对话都可以成为线索。使用此页面管理跟进和销售机会。",
    noLeads: "尚无线索。",
    noLeadsText:
      "通过 WhatsApp、网站聊天或其他连接渠道收到客户对话后，线索会显示在这里。",
    filterByStatus: "按线索状态筛选",
    filterByAI: "按 AI 员工筛选",
    allStatuses: "所有状态",
    allAI: "所有 AI 员工",
    refresh: "刷新",
    customer: "客户",
    phone: "电话",
    channel: "渠道",
    aiStaff: "AI 员工",
    lastMessage: "最后消息",
    lastActivity: "最后活动",
    leadStatus: "线索状态",
    conversationStatus: "对话状态",
    actions: "操作",
    openInbox: "打开收件箱",
    markNew: "标记新线索",
    markQualified: "标记已筛选",
    markFollowUp: "标记跟进",
    markClosed: "标记关闭",
    markHandover: "标记人工接手",
    updated: "线索已更新。",
    updateFailed: "线索更新失败。",
    previous: "上一页",
    next: "下一页",
    page: "页面",
    active: "活跃",
    qualified: "已筛选",
    followUp: "跟进",
    closed: "已关闭",
    newLead: "新线索",
    needsAction: "需要处理",
    status: {
      open: "打开",
      handover: "人工接手",
      closed: "已关闭",
      new: "新线索",
      qualified: "已筛选",
      follow_up: "跟进",
    },
  },

  ms: {
    badge: "Leads",
    title: "Urus leads pelanggan daripada perbualan anda.",
    subtitle:
      "Pantau bakal pelanggan, update status lead, review keperluan handover, dan buka perbualan berkaitan di inbox.",
    loading: "Memuat leads anda...",
    failed: "Leads gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    totalLeads: "Total Leads",
    credits: "Credits",
    handover: "Handover",
    leadList: "Senarai Leads",
    leadListText:
      "Setiap perbualan pelanggan boleh menjadi lead. Gunakan halaman ini untuk mengurus follow-up dan peluang sales.",
    noLeads: "Belum ada leads.",
    noLeadsText:
      "Leads anda akan muncul di sini selepas perbualan pelanggan masuk melalui WhatsApp, website chat, atau channel lain yang disambungkan.",
    filterByStatus: "Filter berdasarkan Status Lead",
    filterByAI: "Filter berdasarkan AI Staff",
    allStatuses: "Semua Status",
    allAI: "Semua AI Staff",
    refresh: "Refresh",
    customer: "Customer",
    phone: "Telefon",
    channel: "Channel",
    aiStaff: "AI Staff",
    lastMessage: "Mesej Terakhir",
    lastActivity: "Aktiviti Terakhir",
    leadStatus: "Status Lead",
    conversationStatus: "Status Perbualan",
    actions: "Aksi",
    openInbox: "Buka Inbox",
    markNew: "Tanda Baru",
    markQualified: "Tanda Qualified",
    markFollowUp: "Tanda Follow Up",
    markClosed: "Tanda Closed",
    markHandover: "Tanda Handover",
    updated: "Lead berjaya dikemas kini.",
    updateFailed: "Lead gagal dikemas kini.",
    previous: "Sebelumnya",
    next: "Seterusnya",
    page: "Halaman",
    active: "Aktif",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    newLead: "Baru",
    needsAction: "Perlu Tindakan",
    status: {
      open: "Open",
      handover: "Handover",
      closed: "Closed",
      new: "Baru",
      qualified: "Qualified",
      follow_up: "Follow Up",
    },
  },
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function getStatusLabel(statuses: Record<string, string>, value: string | null) {
  if (!value) return "—";
  return statuses[value] || value;
}

export default function LeadsPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [leads, setLeads] = useState<ConversationRow[]>([]);
  const [leadCount, setLeadCount] = useState(0);

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAI, setSelectedAI] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(leadCount / LEADS_PER_PAGE));

  useEffect(() => {
    let isMounted = true;

    async function loadAIStaff() {
      if (!workspace) return;

      const supabase = createClient();

      const { data } = await supabase
        .from("ai_staff")
        .select("id,name,role,status")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      setAiStaffRows((data ?? []) as AiStaffRow[]);
    }

    loadAIStaff();

    return () => {
      isMounted = false;
    };
  }, [workspace]);

  useEffect(() => {
    let isMounted = true;

    async function loadLeads() {
      if (!workspace) return;

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
  }, [workspace, selectedStatus, selectedAI, currentPage, reloadKey]);

  const aiNameMap = useMemo(() => {
    return aiStaffRows.reduce<Record<string, string>>((map, staff) => {
      map[staff.id] = staff.name;
      return map;
    }, {});
  }, [aiStaffRows]);

  const qualifiedCount = leads.filter(
    (lead) => lead.lead_status === "qualified"
  ).length;

  const followUpCount = leads.filter(
    (lead) => lead.lead_status === "follow_up"
  ).length;

  const handoverCount = leads.filter((lead) => lead.handover_requested).length;

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.totalLeads,
      value: `${leadCount}`,
      note: `${qualifiedCount} ${t.qualified}`,
      icon: UserRound,
    },
    {
      label: t.credits,
      value: `${workspaceState.creditsRemaining}/${workspaceState.creditsTotal}`,
      note: getPlanCreditLabel(currentPlan),
      icon: Zap,
    },
    {
      label: t.handover,
      value: `${handoverCount}`,
      note: `${followUpCount} ${t.followUp}`,
      icon: ShieldCheck,
    },
  ];

  async function updateLead(
    leadId: string,
    updates: Partial<Pick<ConversationRow, "lead_status" | "status" | "handover_requested">>
  ) {
    setActionMessage("");
    setActionError("");

    if (!workspace) return;

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
      setActionError(error.message || t.updateFailed);
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

    setActionMessage(t.updated);
  }

  function handleFilterStatus(value: string) {
    setSelectedStatus(value);
    setCurrentPage(1);
  }

  function handleFilterAI(value: string) {
    setSelectedAI(value);
    setCurrentPage(1);
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            {t.loading}
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
            <p className="text-xl font-black">{t.failed}</p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <Link
            href="/dashboard"
            className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
            {t.back}
          </Link>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>

                <p className="text-lg font-black text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Filter className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.leadList}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.leadListText}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-600">
                  {t.filterByStatus}
                </span>
                <select
                  value={selectedStatus}
                  onChange={(event) => handleFilterStatus(event.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-sm font-black outline-none"
                >
                  <option value="all">{t.allStatuses}</option>
                  <option value="new">{t.newLead}</option>
                  <option value="qualified">{t.qualified}</option>
                  <option value="follow_up">{t.followUp}</option>
                  <option value="closed">{t.closed}</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-600">
                  {t.filterByAI}
                </span>
                <select
                  value={selectedAI}
                  onChange={(event) => handleFilterAI(event.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-sm font-black outline-none"
                >
                  <option value="all">{t.allAI}</option>
                  {aiStaffRows.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-4 text-sm font-black text-white"
              >
                <RefreshCcw className="h-4 w-4" />
                {t.refresh}
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
              {t.loading}
            </div>
          ) : leads.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                <Inbox className="h-8 w-8" />
              </div>

              <h3 className="text-4xl font-black tracking-[-0.05em]">
                {t.noLeads}
              </h3>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
                {t.noLeadsText}
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
                    <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                        <UserRound className="h-7 w-7" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-2xl font-black tracking-[-0.04em]">
                              {lead.customer_name || t.customer}
                            </h3>
                            <p className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-600">
                              <Phone className="h-4 w-4" />
                              {lead.customer_phone || lead.customer_channel}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
                              {getStatusLabel(t.status, lead.lead_status)}
                            </span>

                            {lead.handover_requested ? (
                              <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-800">
                                {t.needsAction}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <p className="mt-4 text-lg font-semibold leading-8 text-slate-700">
                          {lead.last_message || t.lastMessage}
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <InfoPill
                            label={t.channel}
                            value={lead.customer_channel}
                            icon="message"
                          />
                          <InfoPill
                            label={t.aiStaff}
                            value={
                              lead.ai_staff_id
                                ? aiNameMap[lead.ai_staff_id] || "AI Staff"
                                : "—"
                            }
                            icon="bot"
                          />
                          <InfoPill
                            label={t.conversationStatus}
                            value={getStatusLabel(t.status, lead.status)}
                            icon="shield"
                          />
                          <InfoPill
                            label={t.lastActivity}
                            value={formatDate(lead.last_message_at)}
                            icon="clock"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:w-56 xl:grid-cols-1">
                      <Link
                        href={`/dashboard/inbox`}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
                      >
                        {t.openInbox}
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          updateLead(lead.id, {
                            lead_status: "qualified",
                          })
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#07111F]"
                      >
                        {t.markQualified}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateLead(lead.id, {
                            lead_status: "follow_up",
                          })
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#07111F]"
                      >
                        {t.markFollowUp}
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
                        {t.markHandover}
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
                        {t.markClosed}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t.previous}
                </button>

                <p className="text-center text-sm font-black text-slate-500">
                  {t.page} {currentPage} / {totalPages}
                </p>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.next}
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

function InfoPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "message" | "bot" | "shield" | "clock";
}) {
  const Icon =
    icon === "message"
      ? MessageCircle
      : icon === "bot"
        ? Bot
        : icon === "shield"
          ? ShieldCheck
          : Clock3;

  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="truncate text-base font-black text-[#07111F]">{value}</p>
    </div>
  );
}