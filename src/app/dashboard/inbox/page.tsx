"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Inbox,
  MessageCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
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

const CONVERSATIONS_PER_PAGE = 8;
const MESSAGES_STEP = 10;

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

type MessageRow = {
  id: string;
  conversation_id: string;
  workspace_id: string;
  owner_user_id: string;
  ai_staff_id: string | null;
  sender_type: string;
  message_text: string;
  created_at: string;
};

type InboxTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  back: string;
  currentPlan: string;
  conversations: string;
  credits: string;
  leads: string;
  needsHandover: string;
  conversationList: string;
  conversationListText: string;
  conversationThread: string;
  conversationThreadText: string;
  noConversations: string;
  noConversationsText: string;
  noMessages: string;
  selectConversation: string;
  allAI: string;
  filterAI: string;
  customer: string;
  aiReply: string;
  humanReply: string;
  sendReply: string;
  sending: string;
  replyPlaceholder: string;
  messageRequired: string;
  requestHandover: string;
  handoverMarked: string;
  newLead: string;
  qualified: string;
  followUp: string;
  closed: string;
  loadMore: string;
  previous: string;
  next: string;
  page: string;
  refresh: string;
  inboxReady: string;
  openLeads: string;
  viewAllLeads: string;
  leadStatus: string;
  conversationStatus: string;
  active: string;
  status: Record<string, string>;
};

const translations: Record<string, InboxTranslation> = {
  en: {
    badge: "Inbox",
    title: "Manage customer conversations in one place.",
    subtitle:
      "View customer messages, AI replies, human replies, lead status, and handover activity from your Kolkap workspace.",
    loading: "Loading your inbox...",
    failed: "Inbox could not load.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    conversations: "Conversations",
    credits: "Credits",
    leads: "Leads",
    needsHandover: "Needs Handover",
    conversationList: "Conversations",
    conversationListText:
      "Customer conversations will appear here once your business channels receive messages.",
    conversationThread: "Conversation Thread",
    conversationThreadText:
      "Review the conversation, reply as human, update the lead status, and manage handover.",
    noConversations: "No conversations yet.",
    noConversationsText:
      "Your inbox is ready. New WhatsApp, website chat, or customer messages will appear here once connected.",
    noMessages: "No messages yet.",
    selectConversation: "Select a conversation to view messages.",
    allAI: "All AI Staff",
    filterAI: "Filter by AI Staff",
    customer: "Customer",
    aiReply: "AI Reply",
    humanReply: "Human Reply",
    sendReply: "Send Reply",
    sending: "Sending...",
    replyPlaceholder: "Write a human reply...",
    messageRequired: "Please write a reply first.",
    requestHandover: "Mark Handover",
    handoverMarked: "Handover marked for this conversation.",
    newLead: "New",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    loadMore: "Load older messages",
    previous: "Previous",
    next: "Next",
    page: "Page",
    refresh: "Refresh",
    inboxReady: "Inbox Ready",
    openLeads: "Open Leads",
    viewAllLeads: "View All Leads",
    leadStatus: "Lead Status",
    conversationStatus: "Conversation Status",
    active: "Active",
    status: {
      open: "Open",
      handover: "Handover",
      closed: "Closed",
      new: "New",
      qualified: "Qualified",
      follow_up: "Follow Up",
      completed: "Completed",
    },
  },

  id: {
    badge: "Inbox",
    title: "Kelola percakapan pelanggan dalam satu tempat.",
    subtitle:
      "Lihat pesan pelanggan, balasan AI, balasan human, status lead, dan aktivitas handover dari workspace Kolkap Anda.",
    loading: "Memuat inbox Anda...",
    failed: "Inbox gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    conversations: "Percakapan",
    credits: "Credits",
    leads: "Leads",
    needsHandover: "Butuh Handover",
    conversationList: "Percakapan",
    conversationListText:
      "Percakapan pelanggan akan muncul di sini setelah channel bisnis menerima pesan.",
    conversationThread: "Thread Percakapan",
    conversationThreadText:
      "Review percakapan, balas sebagai human, update status lead, dan kelola handover.",
    noConversations: "Belum ada percakapan.",
    noConversationsText:
      "Inbox Anda sudah siap. Pesan WhatsApp, website chat, atau customer message akan muncul di sini setelah terhubung.",
    noMessages: "Belum ada pesan.",
    selectConversation: "Pilih percakapan untuk melihat pesan.",
    allAI: "Semua AI Staff",
    filterAI: "Filter berdasarkan AI Staff",
    customer: "Customer",
    aiReply: "Balasan AI",
    humanReply: "Balasan Human",
    sendReply: "Kirim Balasan",
    sending: "Mengirim...",
    replyPlaceholder: "Tulis balasan human...",
    messageRequired: "Mohon tulis balasan terlebih dahulu.",
    requestHandover: "Tandai Handover",
    handoverMarked: "Handover sudah ditandai untuk percakapan ini.",
    newLead: "Baru",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    loadMore: "Load pesan sebelumnya",
    previous: "Sebelumnya",
    next: "Berikutnya",
    page: "Halaman",
    refresh: "Refresh",
    inboxReady: "Inbox Siap",
    openLeads: "Buka Leads",
    viewAllLeads: "Lihat Semua Leads",
    leadStatus: "Status Lead",
    conversationStatus: "Status Percakapan",
    active: "Aktif",
    status: {
      open: "Open",
      handover: "Handover",
      closed: "Closed",
      new: "Baru",
      qualified: "Qualified",
      follow_up: "Follow Up",
      completed: "Selesai",
    },
  },

  zh: {
    badge: "收件箱",
    title: "在一个地方管理客户对话。",
    subtitle:
      "查看客户消息、AI 回复、人工回复、线索状态和人工接手活动。",
    loading: "正在加载收件箱...",
    failed: "收件箱加载失败。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    conversations: "对话",
    credits: "Credits",
    leads: "线索",
    needsHandover: "需要人工接手",
    conversationList: "对话",
    conversationListText: "当业务渠道收到客户消息后，对话会显示在这里。",
    conversationThread: "对话内容",
    conversationThreadText: "查看对话、人工回复、更新线索状态并管理接手。",
    noConversations: "尚无对话。",
    noConversationsText:
      "您的收件箱已准备好。WhatsApp、网站聊天或客户消息连接后会显示在这里。",
    noMessages: "尚无消息。",
    selectConversation: "请选择一个对话查看消息。",
    allAI: "所有 AI 员工",
    filterAI: "按 AI 员工筛选",
    customer: "客户",
    aiReply: "AI 回复",
    humanReply: "人工回复",
    sendReply: "发送回复",
    sending: "正在发送...",
    replyPlaceholder: "输入人工回复...",
    messageRequired: "请先填写回复内容。",
    requestHandover: "标记人工接手",
    handoverMarked: "此对话已标记需要人工接手。",
    newLead: "新线索",
    qualified: "已筛选",
    followUp: "跟进",
    closed: "已关闭",
    loadMore: "加载较早消息",
    previous: "上一页",
    next: "下一页",
    page: "页面",
    refresh: "刷新",
    inboxReady: "收件箱已准备",
    openLeads: "打开线索",
    viewAllLeads: "查看所有线索",
    leadStatus: "线索状态",
    conversationStatus: "对话状态",
    active: "活跃",
    status: {
      open: "打开",
      handover: "人工接手",
      closed: "已关闭",
      new: "新线索",
      qualified: "已筛选",
      follow_up: "跟进",
      completed: "完成",
    },
  },

  ms: {
    badge: "Inbox",
    title: "Urus perbualan pelanggan dalam satu tempat.",
    subtitle:
      "Lihat mesej pelanggan, balasan AI, balasan human, status lead, dan aktiviti handover dari workspace Kolkap anda.",
    loading: "Memuat inbox anda...",
    failed: "Inbox gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    conversations: "Perbualan",
    credits: "Credits",
    leads: "Leads",
    needsHandover: "Perlu Handover",
    conversationList: "Perbualan",
    conversationListText:
      "Perbualan pelanggan akan muncul di sini selepas channel bisnes menerima mesej.",
    conversationThread: "Thread Perbualan",
    conversationThreadText:
      "Review perbualan, balas sebagai human, update status lead, dan urus handover.",
    noConversations: "Belum ada perbualan.",
    noConversationsText:
      "Inbox anda sudah siap. Mesej WhatsApp, website chat, atau customer message akan muncul di sini selepas disambungkan.",
    noMessages: "Belum ada mesej.",
    selectConversation: "Pilih perbualan untuk melihat mesej.",
    allAI: "Semua AI Staff",
    filterAI: "Filter berdasarkan AI Staff",
    customer: "Customer",
    aiReply: "Balasan AI",
    humanReply: "Balasan Human",
    sendReply: "Hantar Balasan",
    sending: "Menghantar...",
    replyPlaceholder: "Tulis balasan human...",
    messageRequired: "Sila tulis balasan dahulu.",
    requestHandover: "Tanda Handover",
    handoverMarked: "Handover sudah ditanda untuk perbualan ini.",
    newLead: "Baru",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    loadMore: "Load mesej sebelumnya",
    previous: "Sebelumnya",
    next: "Seterusnya",
    page: "Halaman",
    refresh: "Refresh",
    inboxReady: "Inbox Siap",
    openLeads: "Buka Leads",
    viewAllLeads: "Lihat Semua Leads",
    leadStatus: "Status Lead",
    conversationStatus: "Status Perbualan",
    active: "Aktif",
    status: {
      open: "Open",
      handover: "Handover",
      closed: "Closed",
      new: "Baru",
      qualified: "Qualified",
      follow_up: "Follow Up",
      completed: "Selesai",
    },
  },
};

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function statusText(statuses: Record<string, string>, value: string | null) {
  if (!value) return "";
  return statuses[value] || value;
}

export default function InboxPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  const [selectedAiFilter, setSelectedAiFilter] = useState("all");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationCount, setConversationCount] = useState(0);
  const [messageLimit, setMessageLimit] = useState(MESSAGES_STEP);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(
    1,
    Math.ceil(conversationCount / CONVERSATIONS_PER_PAGE)
  );

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

    async function loadConversations() {
      if (!workspace) return;

      setIsLoadingConversations(true);
      setError("");

      const from = (conversationPage - 1) * CONVERSATIONS_PER_PAGE;
      const to = from + CONVERSATIONS_PER_PAGE - 1;

      const supabase = createClient();

      let query = supabase
        .from("customer_conversations")
        .select("*", { count: "exact" })
        .eq("workspace_id", workspace.id)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .range(from, to);

      if (selectedAiFilter !== "all") {
        query = query.eq("ai_staff_id", selectedAiFilter);
      }

      const { data, error: conversationError, count } = await query;

      if (!isMounted) return;

      if (conversationError) {
        setError(conversationError.message);
        setIsLoadingConversations(false);
        return;
      }

      const rows = (data ?? []) as ConversationRow[];

      setConversations(rows);
      setConversationCount(count ?? 0);
      setSelectedConversationId((current) =>
        rows.some((row) => row.id === current) ? current : rows[0]?.id ?? ""
      );
      setIsLoadingConversations(false);
    }

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, [workspace, selectedAiFilter, conversationPage, reloadKey]);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!workspace || !selectedConversationId) {
        setMessages([]);
        return;
      }

      setIsLoadingMessages(true);
      setActionError("");

      const supabase = createClient();

      const { data, error: messagesError } = await supabase
        .from("customer_messages")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("conversation_id", selectedConversationId)
        .order("created_at", { ascending: false })
        .range(0, messageLimit - 1);

      if (!isMounted) return;

      if (messagesError) {
        setActionError(messagesError.message);
        setIsLoadingMessages(false);
        return;
      }

      setMessages(((data ?? []) as MessageRow[]).reverse());
      setIsLoadingMessages(false);
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [workspace, selectedConversationId, messageLimit]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId
      ) ?? null,
    [conversations, selectedConversationId]
  );

  const aiNameMap = useMemo(() => {
    return aiStaffRows.reduce<Record<string, string>>((map, staff) => {
      map[staff.id] = staff.name;
      return map;
    }, {});
  }, [aiStaffRows]);

  const leadCount = conversations.filter(
    (conversation) => conversation.lead_status !== "closed"
  ).length;

  const handoverCount = conversations.filter(
    (conversation) => conversation.handover_requested
  ).length;

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
      href: "/dashboard/billing",
    },
    {
      label: t.conversations,
      value: `${conversationCount}`,
      note: `${conversations.length} ${t.active}`,
      icon: Inbox,
      href: "/dashboard/inbox",
    },
    {
      label: t.leads,
      value: `${leadCount}`,
      note: t.openLeads,
      icon: UsersRound,
      href: "/dashboard/leads",
    },
    {
      label: t.needsHandover,
      value: `${handoverCount}`,
      note: getPlanAIStaffLabel(currentPlan),
      icon: ShieldCheck,
      href: "/dashboard/leads",
    },
  ];

  async function handleSendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!workspace || !selectedConversation || !replyText.trim()) {
      setActionError(t.messageRequired);
      return;
    }

    setIsSending(true);

    const supabase = createClient();
    const now = new Date().toISOString();

    const { data, error: insertError } = await supabase
      .from("customer_messages")
      .insert({
        conversation_id: selectedConversation.id,
        workspace_id: workspace.id,
        owner_user_id: workspace.owner_user_id,
        ai_staff_id: selectedConversation.ai_staff_id,
        sender_type: "human",
        message_text: replyText.trim(),
      })
      .select("*")
      .single();

    if (insertError) {
      setActionError(insertError.message);
      setIsSending(false);
      return;
    }

    await supabase
      .from("customer_conversations")
      .update({
        last_message: replyText.trim(),
        last_message_at: now,
        status: "open",
        updated_at: now,
      })
      .eq("id", selectedConversation.id);

    setMessages((current) => [...current, data as MessageRow]);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              last_message: replyText.trim(),
              last_message_at: now,
              status: "open",
              updated_at: now,
            }
          : conversation
      )
    );

    setReplyText("");
    setIsSending(false);
  }

  async function handleMarkHandover() {
    setActionMessage("");
    setActionError("");

    if (!workspace || !selectedConversation) return;

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error: handoverError } = await supabase
      .from("customer_conversations")
      .update({
        handover_requested: true,
        status: "handover",
        updated_at: now,
      })
      .eq("id", selectedConversation.id);

    if (handoverError) {
      setActionError(handoverError.message);
      return;
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              handover_requested: true,
              status: "handover",
              updated_at: now,
            }
          : conversation
      )
    );

    setActionMessage(t.handoverMarked);
  }

  async function handleLeadStatusChange(value: string) {
    setActionMessage("");
    setActionError("");

    if (!workspace || !selectedConversation) return;

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error: leadError } = await supabase
      .from("customer_conversations")
      .update({
        lead_status: value,
        updated_at: now,
      })
      .eq("id", selectedConversation.id);

    if (leadError) {
      setActionError(leadError.message);
      return;
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? { ...conversation, lead_status: value, updated_at: now }
          : conversation
      )
    );
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
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/leads"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-5 py-3 text-base font-black text-[#07111F]"
              >
                <UsersRound className="h-5 w-5" />
                {t.openLeads}
              </Link>

              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
              >
                <RefreshCcw className="h-5 w-5" />
                {t.refresh}
              </button>
            </div>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Inbox className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-lg font-black text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                  {card.note}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <MessageCircle className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.conversationList}
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  {t.conversationListText}
                </h2>
              </div>

              <Link
                href="/dashboard/leads"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
              >
                <UsersRound className="h-5 w-5" />
                {t.viewAllLeads}
              </Link>
            </div>

            <div className="mb-5 grid gap-2">
              <span className="text-base font-black text-slate-700">
                {t.filterAI}
              </span>
              <select
                value={selectedAiFilter}
                onChange={(event) => {
                  setSelectedAiFilter(event.target.value);
                  setConversationPage(1);
                  setSelectedConversationId("");
                }}
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              >
                <option value="all">{t.allAI}</option>
                {aiStaffRows.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-lg font-black text-red-700">
                {error}
              </div>
            ) : null}

            {isLoadingConversations ? (
              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black">
                {t.loading}
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-7">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                  <Inbox className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  {t.inboxReady}
                </h3>
                <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                  {t.noConversationsText}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/dashboard/go-live"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                  >
                    Go Live
                    <ArrowRight className="h-5 w-5" />
                  </Link>

                  <Link
                    href="/dashboard/leads"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-4 text-base font-black text-[#07111F]"
                  >
                    {t.openLeads}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {conversations.map((conversation) => {
                  const isSelected = conversation.id === selectedConversationId;

                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversationId(conversation.id);
                        setMessageLimit(MESSAGES_STEP);
                        setActionMessage("");
                        setActionError("");
                      }}
                      className={`rounded-3xl border p-5 text-left transition ${
                        isSelected
                          ? "border-[#07111F] bg-[#07111F] text-white"
                          : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            isSelected
                              ? "bg-[#7CFF3D] text-[#07111F]"
                              : "bg-white text-[#07111F]"
                          }`}
                        >
                          <UserRound className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="truncate text-xl font-black">
                              {conversation.customer_name || t.customer}
                            </p>
                            <span
                              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${
                                conversation.handover_requested
                                  ? "bg-amber-100 text-amber-700"
                                  : isSelected
                                    ? "bg-white/10 text-white"
                                    : "bg-white text-slate-700"
                              }`}
                            >
                              {statusText(t.status, conversation.status)}
                            </span>
                          </div>

                          <p
                            className={`mt-2 line-clamp-2 text-base font-semibold leading-7 ${
                              isSelected ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {conversation.last_message || t.noMessages}
                          </p>

                          <p
                            className={`mt-3 text-sm font-black ${
                              isSelected ? "text-[#7CFF3D]" : "text-blue-600"
                            }`}
                          >
                            {conversation.customer_channel}
                            {conversation.ai_staff_id
                              ? ` • ${
                                  aiNameMap[conversation.ai_staff_id] ||
                                  "AI Staff"
                                }`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    disabled={conversationPage <= 1}
                    onClick={() =>
                      setConversationPage((page) => Math.max(1, page - 1))
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t.previous}
                  </button>

                  <p className="text-center text-sm font-black text-slate-500">
                    {t.page} {conversationPage} / {totalPages}
                  </p>

                  <button
                    type="button"
                    disabled={conversationPage >= totalPages}
                    onClick={() =>
                      setConversationPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
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

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Bot className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.conversationThread}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.conversationThreadText}
            </h2>

            {!selectedConversation ? (
              <div className="mt-8 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-7 text-lg font-black text-slate-600">
                {t.selectConversation}
              </div>
            ) : (
              <div className="mt-8 grid gap-5">
                <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <h3 className="text-3xl font-black tracking-[-0.04em]">
                        {selectedConversation.customer_name || t.customer}
                      </h3>
                      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                        {selectedConversation.customer_phone ||
                          selectedConversation.customer_channel}{" "}
                        • {formatDate(selectedConversation.last_message_at)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleMarkHandover}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-100 px-5 py-3 text-sm font-black text-amber-800"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {t.requestHandover}
                      </button>

                      <select
                        value={selectedConversation.lead_status}
                        onChange={(event) =>
                          handleLeadStatusChange(event.target.value)
                        }
                        className="h-12 rounded-full border border-slate-200 bg-white px-5 text-sm font-black outline-none"
                      >
                        <option value="new">{t.newLead}</option>
                        <option value="qualified">{t.qualified}</option>
                        <option value="follow_up">{t.followUp}</option>
                        <option value="closed">{t.closed}</option>
                      </select>

                      <Link
                        href="/dashboard/leads"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
                      >
                        {t.openLeads}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="max-h-[560px] overflow-y-auto rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
                  {isLoadingMessages ? (
                    <div className="rounded-3xl bg-white p-5 text-lg font-black">
                      {t.loading}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-3xl bg-white p-5 text-lg font-black text-slate-600">
                      {t.noMessages}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {messages.length >= messageLimit ? (
                        <button
                          type="button"
                          onClick={() =>
                            setMessageLimit((limit) => limit + MESSAGES_STEP)
                          }
                          className="mx-auto inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]"
                        >
                          {t.loadMore}
                        </button>
                      ) : null}

                      {messages.map((message) => {
                        const isCustomer = message.sender_type === "customer";
                        const isAI = message.sender_type === "ai";

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isCustomer ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-3xl p-5 ${
                                isCustomer
                                  ? "bg-white text-[#07111F]"
                                  : isAI
                                    ? "bg-[#07111F] text-white"
                                    : "bg-[#7CFF3D] text-[#07111F]"
                              }`}
                            >
                              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] opacity-70">
                                {isCustomer
                                  ? t.customer
                                  : isAI
                                    ? t.aiReply
                                    : t.humanReply}
                              </p>
                              <p className="whitespace-pre-wrap text-base font-semibold leading-7">
                                {message.message_text}
                              </p>
                              <p className="mt-3 flex items-center gap-2 text-xs font-black opacity-60">
                                <Clock3 className="h-3 w-3" />
                                {formatDate(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

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

                <form onSubmit={handleSendReply} className="grid gap-4">
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder={t.replyPlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />

                  <button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-6 w-6" />
                    {isSending ? t.sending : t.sendReply}
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}