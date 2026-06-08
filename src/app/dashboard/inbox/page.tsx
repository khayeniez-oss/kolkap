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
  CreditCard,
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
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const CONVERSATIONS_PER_PAGE = 8;
const MESSAGES_STEP = 10;
const INBOX_AI_REPLY_CREDIT_COST = 3;

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type AiStaffRow = {
  id: string;
  name: string;
  role: string;
  status: string;
};

type CreditBalanceRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  plan_name: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  billing_period_start: string | null;
  billing_period_end: string | null;
  status: string;
  created_at: string;
  updated_at: string;
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
  creditsLeft: string;
  creditsUsed: string;
  creditCost: string;
  creditUnit: string;
  noCreditBalance: string;
  oneCreditNote: string;
  refreshCredits: string;
  conversations: string;
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
  aiStaffFallback: string;
  aiStaffIncluded: string;
  customAIStaffLimit: string;
  filterAI: string;
  customer: string;
  aiReply: string;
  humanReply: string;
  generateAiReply: string;
  generateAiReplyForCredit: string;
  generatingAiReply: string;
  aiSuggestionReady: string;
  aiReplyCouldNotGenerate: string;
  knowledgeItemsUsed: string;
  noCustomerMessageForAI: string;
  sendReply: string;
  sending: string;
  replySent: string;
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
  active: string;
  customerMessageLabel: string;
  aiMessageLabel: string;
  humanMessageLabel: string;
  replyBoxTitle: string;
  suggestedModeNote: string;
  goLive: string;
  openPage: string;
  planNames: Record<string, string>;
  channelLabels: Record<string, string>;
  status: Record<string, string>;
};

const translations: Record<SupportedLanguage, InboxTranslation> = {
  en: {
    badge: "Inbox",
    title: "Manage customer conversations in one place.",
    subtitle:
      "View customer messages, generate AI suggested replies, send human replies, update lead status, and manage handover activity from your Kolkap workspace.",
    loading: "Loading your inbox...",
    failed: "Inbox could not load.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    creditCost: "Credit Cost",
    creditUnit: "Credits",
    noCreditBalance: "Credit balance not found yet.",
    oneCreditNote: "Every successful inbox AI reply generation uses 3 credits.",
    refreshCredits: "Refresh credits",
    conversations: "Conversations",
    leads: "Leads",
    needsHandover: "Needs Handover",
    conversationList: "Conversations",
    conversationListText:
      "Customer conversations will appear here once your business channels receive messages.",
    conversationThread: "Conversation Thread",
    conversationThreadText:
      "Open a customer conversation, review the messages, generate an AI suggested reply, edit if needed, then send as human.",
    noConversations: "No conversations yet.",
    noConversationsText:
      "Your inbox is ready. New WhatsApp, website chat, or customer messages will appear here once connected.",
    noMessages: "No messages yet.",
    selectConversation: "Select a conversation to view messages.",
    allAI: "All AI Staff",
    aiStaffFallback: "AI Staff",
    aiStaffIncluded: "AI staff included",
    customAIStaffLimit: "Custom AI staff limit",
    filterAI: "Filter by AI Staff",
    customer: "Customer",
    aiReply: "AI Reply",
    humanReply: "Human Reply",
    generateAiReply: "Generate AI Reply",
    generateAiReplyForCredit: "Generate AI Reply for 3 Credits",
    generatingAiReply: "Generating AI Reply...",
    aiSuggestionReady:
      "AI suggested reply is ready. 3 credits have been used. Review it before sending.",
    aiReplyCouldNotGenerate: "AI reply could not be generated.",
    knowledgeItemsUsed: "knowledge item(s) used.",
    noCustomerMessageForAI: "No customer message found for AI to reply to.",
    sendReply: "Send Reply",
    sending: "Sending...",
    replySent: "Reply sent.",
    replyPlaceholder:
      "Write a human reply or generate an AI suggested reply first...",
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
    active: "Active",
    customerMessageLabel: "Customer Message",
    aiMessageLabel: "AI Reply",
    humanMessageLabel: "Human Reply",
    replyBoxTitle: "Reply Box",
    suggestedModeNote:
      "This is manual review mode. AI writes the suggestion, but it only sends after you click Send Reply.",
    goLive: "Go Live",
    openPage: "Open Page",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    channelLabels: {
      dashboard: "Dashboard",
      inbox: "Inbox",
      whatsapp: "WhatsApp",
      website_chat: "Website Chat",
      content_studio: "Content Studio",
      test_ai: "Test AI",
      knowledge_base: "Knowledge Base",
      team: "Team",
      go_live: "Go Live",
      email: "Email",
      api: "API",
      system: "System",
    },
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
      "Lihat pesan pelanggan, buat saran balasan AI, kirim balasan human, update status lead, dan kelola handover dari workspace Kolkap Anda.",
    loading: "Memuat inbox Anda...",
    failed: "Inbox tidak dapat dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    creditsLeft: "Sisa Kredit",
    creditsUsed: "Kredit Terpakai",
    creditCost: "Biaya Kredit",
    creditUnit: "Kredit",
    noCreditBalance: "Saldo kredit belum ditemukan.",
    oneCreditNote:
      "Setiap balasan AI inbox yang berhasil dibuat menggunakan 3 kredit.",
    refreshCredits: "Muat ulang kredit",
    conversations: "Percakapan",
    leads: "Leads",
    needsHandover: "Butuh Handover",
    conversationList: "Percakapan",
    conversationListText:
      "Percakapan pelanggan akan muncul di sini setelah channel bisnis menerima pesan.",
    conversationThread: "Thread Percakapan",
    conversationThreadText:
      "Buka percakapan pelanggan, review pesan, buat saran balasan AI, edit jika perlu, lalu kirim sebagai human.",
    noConversations: "Belum ada percakapan.",
    noConversationsText:
      "Inbox Anda sudah siap. Pesan WhatsApp, website chat, atau pesan pelanggan akan muncul di sini setelah terhubung.",
    noMessages: "Belum ada pesan.",
    selectConversation: "Pilih percakapan untuk melihat pesan.",
    allAI: "Semua AI Staff",
    aiStaffFallback: "AI Staff",
    aiStaffIncluded: "AI staff termasuk",
    customAIStaffLimit: "Limit AI staff custom",
    filterAI: "Filter berdasarkan AI Staff",
    customer: "Pelanggan",
    aiReply: "Balasan AI",
    humanReply: "Balasan Human",
    generateAiReply: "Buat Balasan AI",
    generateAiReplyForCredit: "Buat Balasan AI untuk 3 Kredit",
    generatingAiReply: "Membuat balasan AI...",
    aiSuggestionReady:
      "Saran balasan AI sudah siap. 3 kredit sudah digunakan. Review sebelum dikirim.",
    aiReplyCouldNotGenerate: "Balasan AI tidak dapat dibuat.",
    knowledgeItemsUsed: "knowledge item digunakan.",
    noCustomerMessageForAI: "Tidak ada pesan pelanggan untuk dibalas AI.",
    sendReply: "Kirim Balasan",
    sending: "Mengirim...",
    replySent: "Balasan terkirim.",
    replyPlaceholder:
      "Tulis balasan human atau buat saran balasan AI terlebih dahulu...",
    messageRequired: "Mohon tulis balasan terlebih dahulu.",
    requestHandover: "Tandai Handover",
    handoverMarked: "Handover sudah ditandai untuk percakapan ini.",
    newLead: "Baru",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    loadMore: "Muat pesan sebelumnya",
    previous: "Sebelumnya",
    next: "Berikutnya",
    page: "Halaman",
    refresh: "Muat Ulang",
    inboxReady: "Inbox Siap",
    openLeads: "Buka Leads",
    viewAllLeads: "Lihat Semua Leads",
    leadStatus: "Status Lead",
    active: "Aktif",
    customerMessageLabel: "Pesan Pelanggan",
    aiMessageLabel: "Balasan AI",
    humanMessageLabel: "Balasan Human",
    replyBoxTitle: "Kotak Balasan",
    suggestedModeNote:
      "Ini mode review manual. AI menulis saran, tetapi balasan hanya terkirim setelah Anda klik Kirim Balasan.",
    goLive: "Go Live",
    openPage: "Buka Halaman",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    channelLabels: {
      dashboard: "Dashboard",
      inbox: "Inbox",
      whatsapp: "WhatsApp",
      website_chat: "Website Chat",
      content_studio: "Content Studio",
      test_ai: "Test AI",
      knowledge_base: "Knowledge Base",
      team: "Team",
      go_live: "Go Live",
      email: "Email",
      api: "API",
      system: "System",
    },
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
      "查看客户消息、生成 AI 建议回复、发送人工回复、更新线索状态，并从 Kolkap workspace 管理人工接手。",
    loading: "正在加载收件箱...",
    failed: "收件箱无法加载。",
    back: "返回 Dashboard",
    currentPlan: "当前套餐",
    creditsLeft: "剩余积分",
    creditsUsed: "已用积分",
    creditCost: "积分费用",
    creditUnit: "积分",
    noCreditBalance: "尚未找到积分余额。",
    oneCreditNote: "每次成功生成 inbox AI 回复会使用 3 积分。",
    refreshCredits: "刷新积分",
    conversations: "对话",
    leads: "线索",
    needsHandover: "需要人工接手",
    conversationList: "对话",
    conversationListText:
      "当您的业务渠道收到客户消息后，对话会显示在这里。",
    conversationThread: "对话内容",
    conversationThreadText:
      "打开客户对话、查看消息、生成 AI 建议回复、需要时编辑，然后作为人工回复发送。",
    noConversations: "尚无对话。",
    noConversationsText:
      "您的收件箱已准备好。WhatsApp、website chat 或客户消息连接后会显示在这里。",
    noMessages: "尚无消息。",
    selectConversation: "请选择一个对话查看消息。",
    allAI: "所有 AI Staff",
    aiStaffFallback: "AI Staff",
    aiStaffIncluded: "包含 AI staff",
    customAIStaffLimit: "自定义 AI staff 数量",
    filterAI: "按 AI Staff 筛选",
    customer: "客户",
    aiReply: "AI 回复",
    humanReply: "人工回复",
    generateAiReply: "生成 AI 回复",
    generateAiReplyForCredit: "用 3 积分生成 AI 回复",
    generatingAiReply: "正在生成 AI 回复...",
    aiSuggestionReady:
      "AI 建议回复已准备好。已使用 3 积分。发送前请先检查。",
    aiReplyCouldNotGenerate: "无法生成 AI 回复。",
    knowledgeItemsUsed: "个 knowledge item 已使用。",
    noCustomerMessageForAI: "没有找到可供 AI 回复的客户消息。",
    sendReply: "发送回复",
    sending: "正在发送...",
    replySent: "回复已发送。",
    replyPlaceholder: "输入人工回复或先生成 AI 建议回复...",
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
    active: "活跃",
    customerMessageLabel: "客户消息",
    aiMessageLabel: "AI 回复",
    humanMessageLabel: "人工回复",
    replyBoxTitle: "回复框",
    suggestedModeNote:
      "这是人工审核模式。AI 只生成建议，只有点击发送后才会发送。",
    goLive: "Go Live",
    openPage: "打开页面",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    channelLabels: {
      dashboard: "Dashboard",
      inbox: "Inbox",
      whatsapp: "WhatsApp",
      website_chat: "Website Chat",
      content_studio: "Content Studio",
      test_ai: "Test AI",
      knowledge_base: "Knowledge Base",
      team: "Team",
      go_live: "Go Live",
      email: "Email",
      api: "API",
      system: "System",
    },
    status: {
      open: "Open",
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
      "Lihat mesej pelanggan, jana cadangan balasan AI, hantar balasan human, update status lead, dan urus handover dari workspace Kolkap anda.",
    loading: "Memuatkan inbox anda...",
    failed: "Inbox tidak dapat dimuatkan.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pelan Semasa",
    creditsLeft: "Baki Kredit",
    creditsUsed: "Kredit Digunakan",
    creditCost: "Kos Kredit",
    creditUnit: "Kredit",
    noCreditBalance: "Baki kredit belum dijumpai.",
    oneCreditNote:
      "Setiap balasan AI inbox yang berjaya dijana menggunakan 3 kredit.",
    refreshCredits: "Segar semula kredit",
    conversations: "Perbualan",
    leads: "Leads",
    needsHandover: "Perlu Handover",
    conversationList: "Perbualan",
    conversationListText:
      "Perbualan pelanggan akan muncul di sini selepas channel bisnes menerima mesej.",
    conversationThread: "Thread Perbualan",
    conversationThreadText:
      "Buka perbualan pelanggan, review mesej, jana cadangan balasan AI, edit jika perlu, lalu hantar sebagai human.",
    noConversations: "Belum ada perbualan.",
    noConversationsText:
      "Inbox anda sudah siap. Mesej WhatsApp, website chat, atau mesej pelanggan akan muncul di sini selepas disambungkan.",
    noMessages: "Belum ada mesej.",
    selectConversation: "Pilih perbualan untuk melihat mesej.",
    allAI: "Semua AI Staff",
    aiStaffFallback: "AI Staff",
    aiStaffIncluded: "AI staff termasuk",
    customAIStaffLimit: "Had AI staff custom",
    filterAI: "Filter berdasarkan AI Staff",
    customer: "Pelanggan",
    aiReply: "Balasan AI",
    humanReply: "Balasan Human",
    generateAiReply: "Jana Balasan AI",
    generateAiReplyForCredit: "Jana Balasan AI untuk 3 Kredit",
    generatingAiReply: "Menjana balasan AI...",
    aiSuggestionReady:
      "Cadangan balasan AI sudah siap. 3 kredit sudah digunakan. Review sebelum dihantar.",
    aiReplyCouldNotGenerate: "Balasan AI tidak dapat dijana.",
    knowledgeItemsUsed: "knowledge item digunakan.",
    noCustomerMessageForAI: "Tiada mesej pelanggan untuk dibalas AI.",
    sendReply: "Hantar Balasan",
    sending: "Menghantar...",
    replySent: "Balasan dihantar.",
    replyPlaceholder:
      "Tulis balasan human atau jana cadangan balasan AI terlebih dahulu...",
    messageRequired: "Sila tulis balasan dahulu.",
    requestHandover: "Tanda Handover",
    handoverMarked: "Handover sudah ditanda untuk perbualan ini.",
    newLead: "Baru",
    qualified: "Qualified",
    followUp: "Follow Up",
    closed: "Closed",
    loadMore: "Muat mesej sebelumnya",
    previous: "Sebelumnya",
    next: "Seterusnya",
    page: "Halaman",
    refresh: "Segar Semula",
    inboxReady: "Inbox Siap",
    openLeads: "Buka Leads",
    viewAllLeads: "Lihat Semua Leads",
    leadStatus: "Status Lead",
    active: "Aktif",
    customerMessageLabel: "Mesej Pelanggan",
    aiMessageLabel: "Balasan AI",
    humanMessageLabel: "Balasan Human",
    replyBoxTitle: "Kotak Balasan",
    suggestedModeNote:
      "Ini mode review manual. AI tulis cadangan, tetapi balasan hanya dihantar selepas anda klik Hantar Balasan.",
    goLive: "Go Live",
    openPage: "Buka Halaman",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    channelLabels: {
      dashboard: "Dashboard",
      inbox: "Inbox",
      whatsapp: "WhatsApp",
      website_chat: "Website Chat",
      content_studio: "Content Studio",
      test_ai: "Test AI",
      knowledge_base: "Knowledge Base",
      team: "Team",
      go_live: "Go Live",
      email: "Email",
      api: "API",
      system: "System",
    },
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

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
}

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

function channelText(labels: Record<string, string>, value: string | null) {
  if (!value) return "";
  return labels[value] || String(value).replace(/_/g, " ");
}

function normalizeSenderType(value: string) {
  const normalized = String(value || "").toLowerCase().trim();

  if (
    normalized === "customer" ||
    normalized === "user" ||
    normalized === "client"
  ) {
    return "customer";
  }

  if (normalized === "ai" || normalized === "assistant" || normalized === "bot") {
    return "ai";
  }

  return "human";
}

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

function localizePlanName(
  planKey: string | null | undefined,
  fallback: string,
  t: InboxTranslation
) {
  if (!planKey) return fallback;
  return t.planNames[planKey] || fallback;
}

function getAIStaffLimitLabel(
  plan: ReturnType<typeof getKolkapPlan>,
  t: InboxTranslation
) {
  if (plan.aiStaffLimit === "custom") {
    return t.customAIStaffLimit;
  }

  return `${plan.aiStaffLimit} ${t.aiStaffIncluded}`;
}

export default function InboxPage() {
  const { language } = useKolkapLanguage();
  const activeLanguage = getSupportedLanguage(language);
  const t = translations[activeLanguage];

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);
  const currentPlanName = localizePlanName(
    workspaceState.planKey,
    currentPlan.name,
    t
  );

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );

  const [selectedAiFilter, setSelectedAiFilter] = useState("all");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationCount, setConversationCount] = useState(0);
  const [messageLimit, setMessageLimit] = useState(MESSAGES_STEP);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [error, setError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAiReply, setIsGeneratingAiReply] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const creditsLeft = getCreditsLeft(creditBalance);
  const usedCredits = Number(creditBalance?.used_credits || 0);

  const totalPages = Math.max(
    1,
    Math.ceil(conversationCount / CONVERSATIONS_PER_PAGE)
  );

  async function loadCreditBalance() {
    if (!workspace?.id) return;

    setIsLoadingCredits(true);

    const supabase = createClient();

    const { data } = await supabase
      .from("workspace_credit_balances")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    setCreditBalance((data ?? null) as CreditBalanceRow | null);
    setIsLoadingCredits(false);
  }

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
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

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
      value: currentPlanName,
      note: currentPlan.priceLabel,
      icon: WalletCards,
      href: "/dashboard/billing",
    },
    {
      label: t.creditsLeft,
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `${t.creditsUsed}: ${usedCredits.toLocaleString()}`
        : t.noCreditBalance,
      icon: CreditCard,
      href: "/dashboard/usage",
      dark: true,
    },
    {
      label: t.creditCost,
      value: `${INBOX_AI_REPLY_CREDIT_COST} ${t.creditUnit}`,
      note: t.oneCreditNote,
      icon: Zap,
      href: "/dashboard/usage",
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
      note: getAIStaffLimitLabel(currentPlan, t),
      icon: ShieldCheck,
      href: "/dashboard/leads",
    },
  ];

  function getLatestCustomerMessage() {
    const latestCustomerMessage = [...messages]
      .reverse()
      .find(
        (message) => normalizeSenderType(message.sender_type) === "customer"
      );

    return latestCustomerMessage?.message_text || "";
  }

  async function handleGenerateAiReply() {
    setActionMessage("");
    setActionError("");

    if (!selectedConversation) return;

    const customerMessage = getLatestCustomerMessage();

    if (!customerMessage.trim()) {
      setActionError(t.noCustomerMessageForAI);
      return;
    }

    setIsGeneratingAiReply(true);

    try {
      const response = await fetch("/api/inbox/ai-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          customer_message: customerMessage,
          language: "auto",
          tone: "professional",
          extra_instructions:
            "Create a helpful suggested inbox reply for the business owner or team to review before sending. Do not make it sound robotic. Use the business profile and Knowledge Base.",
          ui_language: activeLanguage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setActionError(result.error || t.aiReplyCouldNotGenerate);
        setIsGeneratingAiReply(false);
        return;
      }

      setReplyText(result.reply || "");

      const knowledgeText =
        typeof result.knowledge_count === "number"
          ? ` ${result.knowledge_count} ${t.knowledgeItemsUsed}`
          : "";

      setActionMessage(`${t.aiSuggestionReady}${knowledgeText}`);
      await loadCreditBalance();
    } catch (generateError) {
      const message =
        generateError instanceof Error
          ? generateError.message
          : t.aiReplyCouldNotGenerate;

      setActionError(message);
    }

    setIsGeneratingAiReply(false);
  }

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
    setActionMessage(t.replySent);
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
        <section className="mx-auto max-w-6xl">
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
        <section className="mx-auto max-w-6xl">
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
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
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
                onClick={() => {
                  setReloadKey((value) => value + 1);
                  loadCreditBalance();
                }}
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

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.label}
                href={card.href}
                className={`group rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
                  card.dark
                    ? "border-[#7CFF3D] bg-[#07111F] text-white"
                    : "border-slate-200 bg-white text-[#07111F]"
                }`}
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    card.dark
                      ? "bg-[#7CFF3D] text-[#07111F]"
                      : "bg-[#07111F] text-[#7CFF3D]"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <p
                  className={`text-lg font-black ${
                    card.dark ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>

                <p
                  className={`mt-2 text-base font-semibold leading-7 ${
                    card.dark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {card.note}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">
                  {t.openPage}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-8">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <MessageCircle className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.conversationList}
                </p>

                <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">
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
                  setReplyText("");
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
                    {t.goLive}
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
                        setReplyText("");
                      }}
                      className={`rounded-3xl border p-5 text-left transition ${
                        isSelected
                          ? "border-[#07111F] bg-[#07111F] text-white"
                          : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:bg-white"
                      }`}
                    >
                      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            isSelected
                              ? "bg-[#7CFF3D] text-[#07111F]"
                              : "bg-white text-[#07111F]"
                          }`}
                        >
                          <UserRound className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                            <div>
                              <p className="truncate text-xl font-black">
                                {conversation.customer_name || t.customer}
                              </p>

                              <p
                                className={`mt-2 line-clamp-2 text-base font-semibold leading-7 ${
                                  isSelected
                                    ? "text-slate-300"
                                    : "text-slate-600"
                                }`}
                              >
                                {conversation.last_message || t.noMessages}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 md:justify-end">
                              <span
                                className={`rounded-full px-4 py-2 text-xs font-black ${
                                  conversation.handover_requested
                                    ? "bg-amber-100 text-amber-700"
                                    : isSelected
                                      ? "bg-white/10 text-white"
                                      : "bg-white text-slate-700"
                                }`}
                              >
                                {statusText(t.status, conversation.status)}
                              </span>

                              <span
                                className={`rounded-full px-4 py-2 text-xs font-black ${
                                  isSelected
                                    ? "bg-white/10 text-white"
                                    : "bg-white text-slate-700"
                                }`}
                              >
                                {statusText(t.status, conversation.lead_status)}
                              </span>
                            </div>
                          </div>

                          <p
                            className={`mt-3 text-sm font-black ${
                              isSelected ? "text-[#7CFF3D]" : "text-blue-600"
                            }`}
                          >
                            {channelText(
                              t.channelLabels,
                              conversation.customer_channel
                            )}
                            {conversation.ai_staff_id
                              ? ` • ${
                                  aiNameMap[conversation.ai_staff_id] ||
                                  t.aiStaffFallback
                                }`
                              : ""}
                          </p>

                          <p
                            className={`mt-2 text-xs font-bold ${
                              isSelected ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {formatDate(conversation.last_message_at)}
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

            <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">
              {t.conversationThreadText}
            </h2>

            {!selectedConversation ? (
              <div className="mt-8 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-7 text-lg font-black text-slate-600">
                {t.selectConversation}
              </div>
            ) : (
              <div className="mt-8 grid gap-5">
                <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
                  <div className="grid gap-5">
                    <div>
                      <h3 className="text-3xl font-black tracking-[-0.04em]">
                        {selectedConversation.customer_name || t.customer}
                      </h3>

                      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                        {selectedConversation.customer_phone ||
                          channelText(
                            t.channelLabels,
                            selectedConversation.customer_channel
                          )}
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {formatDate(selectedConversation.last_message_at)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

                <div className="max-h-[620px] overflow-y-auto rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
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
                        const senderType = normalizeSenderType(
                          message.sender_type
                        );
                        const isCustomer = senderType === "customer";
                        const isAI = senderType === "ai";

                        const label = isCustomer
                          ? t.customerMessageLabel
                          : isAI
                            ? t.aiMessageLabel
                            : t.humanMessageLabel;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isCustomer ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`max-w-full rounded-3xl p-5 sm:max-w-[85%] ${
                                isCustomer
                                  ? "bg-white text-[#07111F]"
                                  : isAI
                                    ? "bg-[#07111F] text-white"
                                    : "bg-[#7CFF3D] text-[#07111F]"
                              }`}
                            >
                              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] opacity-70">
                                {label}
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

                <form
                  onSubmit={handleSendReply}
                  className="grid gap-4 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div>
                    <p className="text-xl font-black tracking-[-0.03em]">
                      {t.replyBoxTitle}
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                      {t.suggestedModeNote}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAiReply}
                    disabled={isGeneratingAiReply || isLoadingMessages}
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-lg font-black text-[#07111F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xl"
                  >
                    <Sparkles className="h-6 w-6" />
                    {isGeneratingAiReply
                      ? t.generatingAiReply
                      : t.generateAiReplyForCredit}
                  </button>

                  <button
                    type="button"
                    onClick={loadCreditBalance}
                    disabled={isLoadingCredits}
                    className="text-left text-sm font-black text-blue-600 disabled:opacity-50"
                  >
                    {isLoadingCredits ? t.loading : t.refreshCredits}
                  </button>

                  <textarea
                    rows={5}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder={t.replyPlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold leading-8 outline-none transition focus:border-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={isSending || isGeneratingAiReply}
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