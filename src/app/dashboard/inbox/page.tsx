"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
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
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  KOLKAP_AI_GENERATION_MIN_CREDITS,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const CONVERSATIONS_PER_PAGE = 8;
const MESSAGES_STEP = 10;
const INBOX_AI_REPLY_CREDIT_COST = KOLKAP_AI_GENERATION_MIN_CREDITS;

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

function normalizeSenderType(value: string) {
  const normalized = String(value || "").toLowerCase().trim();

  if (
    normalized === "customer" ||
    normalized === "user" ||
    normalized === "client" ||
    normalized === "visitor"
  ) {
    return "customer";
  }

  if (normalized === "ai" || normalized === "assistant" || normalized === "bot") {
    return "ai";
  }

  return "human";
}

function channelLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value === "website_chat") return "Website Chat";
  if (value === "whatsapp") return "WhatsApp";
  if (value === "email") return "Email";
  if (value === "inbox") return "Inbox";
  return value.replace(/_/g, " ");
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

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

function getAiStaffLimitLabel(plan: ReturnType<typeof getKolkapPlan>) {
  if (plan.aiStaffLimit === "custom") {
    return "Custom AI staff limit";
  }

  return `${plan.aiStaffLimit} AI staff included`;
}

export default function InboxPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );

  const [selectedAiFilter, setSelectedAiFilter] = useState("all");
  const [selectedChannelFilter, setSelectedChannelFilter] = useState("all");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationCount, setConversationCount] = useState(0);
  const [messageLimit, setMessageLimit] = useState(MESSAGES_STEP);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [error, setError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [isGeneratingAiReply, setIsGeneratingAiReply] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const creditsLeft = getCreditsLeft(creditBalance);
  const usedCredits = Number(creditBalance?.used_credits || 0);
  const hasEnoughCredits =
    creditsLeft === null || creditsLeft >= INBOX_AI_REPLY_CREDIT_COST;

  const totalPages = Math.max(
    1,
    Math.ceil(conversationCount / CONVERSATIONS_PER_PAGE)
  );

  const selectedConversation = useMemo(() => {
    return (
      conversations.find(
        (conversation) => conversation.id === selectedConversationId
      ) ?? null
    );
  }, [conversations, selectedConversationId]);

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

  async function refreshInbox() {
    setReloadKey((value) => value + 1);
    await loadCreditBalance();
  }

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
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      if (!workspace?.id) return;

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

      if (selectedChannelFilter !== "all") {
        query = query.eq("customer_channel", selectedChannelFilter);
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
  }, [
    workspace?.id,
    selectedAiFilter,
    selectedChannelFilter,
    conversationPage,
    reloadKey,
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!workspace?.id || !selectedConversationId) {
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
  }, [workspace?.id, selectedConversationId, messageLimit, reloadKey]);

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
      setActionError("No customer message found for AI to reply to.");
      return;
    }

    if (!hasEnoughCredits) {
      setActionError("You do not have enough credits to generate an AI reply.");
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
          language: "auto",
          tone: "professional",
          extra_instructions:
            "Create a helpful suggested inbox reply for the business owner or team to review before saving. Do not send the reply automatically.",
          ui_language: "en",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setActionError(result.error || "AI reply could not be generated.");
        setIsGeneratingAiReply(false);
        return;
      }

      setReplyText(result.reply || "");

      const knowledgeText =
        typeof result.knowledge_count === "number"
          ? ` ${result.knowledge_count} business knowledge item(s) used.`
          : "";

      setActionMessage(
        `AI suggested reply is ready. ${result.credits_used || INBOX_AI_REPLY_CREDIT_COST} credits have been used. Review it before saving.${knowledgeText}`
      );

      await loadCreditBalance();
    } catch (generateError) {
      const message =
        generateError instanceof Error
          ? generateError.message
          : "AI reply could not be generated.";

      setActionError(message);
    }

    setIsGeneratingAiReply(false);
  }

  async function handleSaveReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!workspace || !selectedConversation || !replyText.trim()) {
      setActionError("Please write a reply first.");
      return;
    }

    setIsSavingReply(true);

    const supabase = createClient();
    const now = new Date().toISOString();
    const cleanReply = replyText.trim();

    const { data, error: insertError } = await supabase
      .from("customer_messages")
      .insert({
        conversation_id: selectedConversation.id,
        workspace_id: workspace.id,
        owner_user_id: workspace.owner_user_id,
        ai_staff_id: selectedConversation.ai_staff_id,
        sender_type: "human",
        message_text: cleanReply,
      })
      .select("*")
      .single();

    if (insertError) {
      setActionError(insertError.message);
      setIsSavingReply(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("customer_conversations")
      .update({
        last_message: cleanReply,
        last_message_at: now,
        status: "open",
        updated_at: now,
      })
      .eq("id", selectedConversation.id)
      .eq("workspace_id", workspace.id);

    if (updateError) {
      setActionError(updateError.message);
      setIsSavingReply(false);
      return;
    }

    setMessages((current) => [...current, data as MessageRow]);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              last_message: cleanReply,
              last_message_at: now,
              status: "open",
              updated_at: now,
            }
          : conversation
      )
    );

    setReplyText("");
    setActionMessage(
      "Reply saved in Inbox. Channel delivery for Website Chat and WhatsApp will be connected separately."
    );
    setIsSavingReply(false);
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
      .eq("id", selectedConversation.id)
      .eq("workspace_id", workspace.id);

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

    setActionMessage("Handover marked for this conversation.");
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
      .eq("id", selectedConversation.id)
      .eq("workspace_id", workspace.id);

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
            Loading Inbox...
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
            <p className="text-xl font-black">Inbox could not load.</p>
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
                href="/dashboard/leads"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-5 py-3 text-base font-black text-[#07111F]"
              >
                <UsersRound className="h-5 w-5" />
                Open Leads
              </Link>

              <button
                type="button"
                onClick={refreshInbox}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
              >
                <RefreshCcw className="h-5 w-5" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Inbox className="h-5 w-5" />
            Inbox
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Manage customer conversations in one place.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            View Website Chat and WhatsApp conversations, generate AI suggested
            replies, save internal replies, update lead status, and manage
            handover from your Kolkap workspace.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            icon={<WalletCards className="h-7 w-7" />}
            label="Current Plan"
            value={currentPlan.name}
            note={currentPlan.priceLabel}
            href="/dashboard/billing"
          />

          <SummaryCard
            icon={<CreditCard className="h-7 w-7" />}
            label="Credits Left"
            value={creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
            note={
              creditBalance
                ? `Credits used: ${usedCredits.toLocaleString()}`
                : "Credit balance not found yet."
            }
            href="/dashboard/usage"
            dark
          />

          <SummaryCard
            icon={<Zap className="h-7 w-7" />}
            label="AI Reply Cost"
            value={`${INBOX_AI_REPLY_CREDIT_COST} Credits`}
            note="Every successful inbox AI suggestion uses credits."
            href="/dashboard/usage"
          />

          <SummaryCard
            icon={<Inbox className="h-7 w-7" />}
            label="Conversations"
            value={`${conversationCount}`}
            note={`${conversations.length} shown on this page`}
            href="/dashboard/inbox"
          />

          <SummaryCard
            icon={<UsersRound className="h-7 w-7" />}
            label="Leads"
            value={`${leadCount}`}
            note="Open Leads"
            href="/dashboard/leads"
          />

          <SummaryCard
            icon={<ShieldCheck className="h-7 w-7" />}
            label="Needs Handover"
            value={`${handoverCount}`}
            note={getAiStaffLimitLabel(currentPlan)}
            href="/dashboard/leads"
          />
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <MessageCircle className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Conversations
                </p>

                <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em]">
                  Customer conversations from connected channels.
                </h2>
              </div>
            </div>

            <div className="mb-5 grid gap-4 md:grid-cols-2">
              <FilterSelect
                label="Filter by Channel"
                value={selectedChannelFilter}
                onChange={(value) => {
                  setSelectedChannelFilter(value);
                  setConversationPage(1);
                  setSelectedConversationId("");
                  setReplyText("");
                }}
                options={channelOptions}
              />

              <FilterSelect
                label="Filter by AI Staff"
                value={selectedAiFilter}
                onChange={(value) => {
                  setSelectedAiFilter(value);
                  setConversationPage(1);
                  setSelectedConversationId("");
                  setReplyText("");
                }}
                options={[
                  { value: "all", label: "All AI Staff" },
                  ...aiStaffRows.map((staff) => ({
                    value: staff.id,
                    label: staff.name,
                  })),
                ]}
              />
            </div>

            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-lg font-black text-red-700">
                {error}
              </div>
            ) : null}

            {isLoadingConversations ? (
              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <EmptyInboxState />
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
                                {conversation.customer_name || "Customer"}
                              </p>

                              <p
                                className={`mt-2 line-clamp-2 text-base font-semibold leading-7 ${
                                  isSelected
                                    ? "text-slate-300"
                                    : "text-slate-600"
                                }`}
                              >
                                {conversation.last_message || "No messages yet"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 md:justify-end">
                              <StatusPill
                                selected={isSelected}
                                danger={conversation.handover_requested}
                                label={statusLabel(conversation.status)}
                              />

                              <StatusPill
                                selected={isSelected}
                                label={statusLabel(conversation.lead_status)}
                              />
                            </div>
                          </div>

                          <p
                            className={`mt-3 text-sm font-black ${
                              isSelected ? "text-[#7CFF3D]" : "text-blue-600"
                            }`}
                          >
                            {channelLabel(conversation.customer_channel)}
                            {conversation.ai_staff_id
                              ? ` • ${
                                  aiNameMap[conversation.ai_staff_id] ||
                                  "AI Staff"
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
                    Previous
                  </button>

                  <p className="text-center text-sm font-black text-slate-500">
                    Page {conversationPage} / {totalPages}
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
                    Next
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
              Conversation Thread
            </p>

            <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-[-0.04em]">
              Review messages, generate an AI suggestion, and save your team
              reply.
            </h2>

            {!selectedConversation ? (
              <div className="mt-8 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-7 text-lg font-black text-slate-600">
                Select a conversation to view messages.
              </div>
            ) : (
              <div className="mt-8 grid gap-5">
                <ConversationHeader
                  conversation={selectedConversation}
                  onMarkHandover={handleMarkHandover}
                  onLeadStatusChange={handleLeadStatusChange}
                />

                <div className="max-h-[620px] overflow-y-auto rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
                  {isLoadingMessages ? (
                    <div className="rounded-3xl bg-white p-5 text-lg font-black">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-3xl bg-white p-5 text-lg font-black text-slate-600">
                      No messages yet.
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
                          Load older messages
                        </button>
                      ) : null}

                      {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
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
                  onSubmit={handleSaveReply}
                  className="grid gap-4 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div>
                    <p className="text-xl font-black tracking-[-0.03em]">
                      Reply Box
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                      AI can draft a suggested reply for review. Saving here
                      stores the reply in Kolkap Inbox. Channel delivery for
                      Website Chat and WhatsApp will be connected separately.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAiReply}
                    disabled={
                      isGeneratingAiReply || isLoadingMessages || !hasEnoughCredits
                    }
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-lg font-black text-[#07111F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xl"
                  >
                    <Sparkles className="h-6 w-6" />
                    {isGeneratingAiReply
                      ? "Generating AI Reply..."
                      : `Generate AI Suggestion for ${INBOX_AI_REPLY_CREDIT_COST} Credits`}
                  </button>

                  <button
                    type="button"
                    onClick={loadCreditBalance}
                    disabled={isLoadingCredits}
                    className="text-left text-sm font-black text-blue-600 disabled:opacity-50"
                  >
                    {isLoadingCredits ? "Refreshing credits..." : "Refresh credits"}
                  </button>

                  <textarea
                    rows={5}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="Write a reply or generate an AI suggested reply first..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold leading-8 outline-none transition focus:border-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={isSavingReply || isGeneratingAiReply}
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-6 w-6" />
                    {isSavingReply ? "Saving..." : "Save Reply to Inbox"}
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

function SummaryCard({
  icon,
  label,
  value,
  note,
  href,
  dark = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  href: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${
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

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">
        Open Page
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
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
      <span className="text-base font-black text-slate-700">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
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

function StatusPill({
  label,
  selected,
  danger = false,
}: {
  label: string;
  selected: boolean;
  danger?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-4 py-2 text-xs font-black ${
        danger
          ? "bg-amber-100 text-amber-700"
          : selected
            ? "bg-white/10 text-white"
            : "bg-white text-slate-700"
      }`}
    >
      {label}
    </span>
  );
}

function EmptyInboxState() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-7">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
        <Inbox className="h-7 w-7" />
      </div>

      <h3 className="text-3xl font-black tracking-[-0.04em]">Inbox ready.</h3>

      <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
        New Website Chat, WhatsApp, or customer messages will appear here once
        your channels are connected and receiving messages.
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
          Open Leads
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

function ConversationHeader({
  conversation,
  onMarkHandover,
  onLeadStatusChange,
}: {
  conversation: ConversationRow;
  onMarkHandover: () => void;
  onLeadStatusChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5">
      <div className="grid gap-5">
        <div>
          <h3 className="text-3xl font-black tracking-[-0.04em]">
            {conversation.customer_name || "Customer"}
          </h3>

          <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
            {conversation.customer_phone || channelLabel(conversation.customer_channel)}
          </p>

          <p className="mt-1 text-sm font-bold text-slate-500">
            {formatDate(conversation.last_message_at)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={onMarkHandover}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-100 px-5 py-3 text-sm font-black text-amber-800"
          >
            <ShieldCheck className="h-4 w-4" />
            Mark Handover
          </button>

          <select
            value={conversation.lead_status}
            onChange={(event) => onLeadStatusChange(event.target.value)}
            className="h-12 rounded-full border border-slate-200 bg-white px-5 text-sm font-black outline-none"
          >
            <option value="new">New</option>
            <option value="qualified">Qualified</option>
            <option value="follow_up">Follow Up</option>
            <option value="closed">Closed</option>
          </select>

          <Link
            href="/dashboard/leads"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
          >
            Open Leads
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: MessageRow }) {
  const senderType = normalizeSenderType(message.sender_type);
  const isCustomer = senderType === "customer";
  const isAI = senderType === "ai";

  const label = isCustomer
    ? "Customer Message"
    : isAI
      ? "AI Reply"
      : "Saved Team Reply";

  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
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
}