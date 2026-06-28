import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { runKolkapBrain } from "@/lib/kolkap-ai/brain";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import { KOLKAP_AI_GENERATION_MIN_CREDITS } from "@/lib/kolkapPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INBOX_AI_REPLY_CREDIT_COST = KOLKAP_AI_GENERATION_MIN_CREDITS;

type ConversationRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  ai_staff_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_channel: string | null;
  status: string | null;
  lead_status: string | null;
  handover_requested: boolean | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  workspace_id: string;
  sender_type: string;
  message_text: string | null;
  created_at: string;
};

type CreditBalanceRow = {
  workspace_id: string;
  owner_user_id: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  status: string;
};

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function normalizeSenderType(value: unknown) {
  const normalized = cleanText(value).toLowerCase();

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

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return 0;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

async function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

async function getConversation({
  supabase,
  conversationId,
}: {
  supabase: Awaited<ReturnType<typeof getSupabase>>;
  conversationId: string;
}) {
  const { data, error } = await supabase
    .from("customer_conversations")
    .select(
      "id,workspace_id,owner_user_id,ai_staff_id,customer_name,customer_phone,customer_channel,status,lead_status,handover_requested"
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ConversationRow | null;
}

async function getLatestCustomerMessage({
  supabase,
  workspaceId,
  conversationId,
}: {
  supabase: Awaited<ReturnType<typeof getSupabase>>;
  workspaceId: string;
  conversationId: string;
}) {
  const { data, error } = await supabase
    .from("customer_messages")
    .select("id,conversation_id,workspace_id,sender_type,message_text,created_at")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw error;
  }

  const messages = (data ?? []) as MessageRow[];

  return (
    messages.find(
      (message) =>
        normalizeSenderType(message.sender_type) === "customer" &&
        cleanText(message.message_text)
    ) ?? null
  );
}

async function getCreditBalance({
  supabase,
  workspaceId,
}: {
  supabase: Awaited<ReturnType<typeof getSupabase>>;
  workspaceId: string;
}) {
  const { data, error } = await supabase
    .from("workspace_credit_balances")
    .select(
      "workspace_id,owner_user_id,plan_credits,purchased_credits,used_credits,status"
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as CreditBalanceRow | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const conversationId = cleanText(body.conversation_id);
    const language = cleanText(body.language, "auto");
    const tone = cleanText(body.tone, "professional");
    const extraInstructions = cleanText(
      body.extra_instructions,
      "Generate a helpful suggested reply for the business owner or team to review before sending. Do not send the reply automatically."
    );
    const uiLanguage = cleanText(body.ui_language, "en");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation is required." },
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to generate an inbox reply." },
        { status: 401 }
      );
    }

    const conversation = await getConversation({
      supabase,
      conversationId,
    });

    if (!conversation?.id) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const latestCustomerMessage = await getLatestCustomerMessage({
      supabase,
      workspaceId: conversation.workspace_id,
      conversationId: conversation.id,
    });

    const customerMessage = cleanText(latestCustomerMessage?.message_text);

    if (!customerMessage) {
      return NextResponse.json(
        { error: "No customer message found for AI to reply to." },
        { status: 400 }
      );
    }

    const creditBalance = await getCreditBalance({
      supabase,
      workspaceId: conversation.workspace_id,
    });

    const creditsLeft = getCreditsLeft(creditBalance);

    if (creditsLeft < INBOX_AI_REPLY_CREDIT_COST) {
      return NextResponse.json(
        {
          error: "Not enough credits to generate an inbox AI reply.",
          credits_left: creditsLeft,
          credits_required: INBOX_AI_REPLY_CREDIT_COST,
        },
        { status: 402 }
      );
    }

    const result = await runKolkapBrain({
      userId: user.id,
      userEmail: user.email,
      workspaceId: conversation.workspace_id,
      task: "inbox_reply",
      channel: "inbox",
      aiStaffId: conversation.ai_staff_id || null,
      conversationId: conversation.id,
      customerName: conversation.customer_name,
      customerPhone: conversation.customer_phone,
      customerMessage,
      language,
      tone,
      extraInstructions,
      uiLanguage,
    });

    await logWorkspaceUsage({
      workspaceId: result.workspaceId,
      userId: user.id,
      eventType: "ai_reply_generated",
      channel: "inbox",
      sourcePage: "/dashboard/inbox",
      creditsUsed: INBOX_AI_REPLY_CREDIT_COST,
      metadata: {
        conversation_id: conversation.id,
        latest_customer_message_id: latestCustomerMessage?.id || null,
        customer_channel: conversation.customer_channel || null,
        model: result.model,
        knowledge_count: result.knowledgeCount,
        fallback: result.fallback,
        ai_staff_id: result.aiStaffId || conversation.ai_staff_id || null,
        brain_channel: result.channel,
        credit_rule: "inbox_ai_reply_minimum",
        manual_review_mode: true,
      },
    });

    return NextResponse.json({
      reply: result.content,
      business_name: result.businessName,
      workspace_id: result.workspaceId,
      conversation_id: conversation.id,
      customer_channel: conversation.customer_channel || null,
      knowledge_count: result.knowledgeCount,
      model: result.model,
      fallback: result.fallback,
      ai_staff_id: result.aiStaffId || conversation.ai_staff_id || null,
      credits_used: INBOX_AI_REPLY_CREDIT_COST,
      credits_left_before_reply: creditsLeft,
      manual_review_mode: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Inbox AI reply could not be generated.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}