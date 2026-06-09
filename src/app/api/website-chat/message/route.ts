import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runKolkapBrain } from "@/lib/kolkap-ai/brain";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import { KOLKAP_AI_GENERATION_MIN_CREDITS } from "@/lib/kolkapPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBSITE_CHAT_REPLY_CREDIT_COST = KOLKAP_AI_GENERATION_MIN_CREDITS;

type WebsiteChatBody = {
  workspace_id?: string;
  conversation_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  message?: string;
  language?: string;
  page_url?: string;
  visitor_id?: string;
};

type BusinessWorkspaceRow = {
  id: string;
  owner_user_id: string;
  business_name: string | null;
  plan_key: string | null;
  plan_status: string | null;
  billing_status: string | null;
  stripe_subscription_id: string | null;
  trial_activated_at: string | null;
  billing_started_at: string | null;
  subscription_cancelled_at: string | null;
};

type CreditBalanceRow = {
  workspace_id: string;
  owner_user_id: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  status: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const BLOCKED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "inactive",
  "incomplete_expired",
  "expired",
]);

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function normalizeStatus(value: unknown) {
  return cleanText(value).toLowerCase();
}

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders,
  });
}

function hasActiveTrialOrPlan(workspace: BusinessWorkspaceRow) {
  const planStatus = normalizeStatus(workspace.plan_status);
  const billingStatus = normalizeStatus(workspace.billing_status);

  if (BLOCKED_STATUSES.has(planStatus) || BLOCKED_STATUSES.has(billingStatus)) {
    return false;
  }

  const hasRealSubscription = Boolean(
    workspace.stripe_subscription_id && !workspace.subscription_cancelled_at
  );

  const hasActivatedTrial = Boolean(
    workspace.trial_activated_at && !workspace.subscription_cancelled_at
  );

  const hasStartedBilling = Boolean(
    workspace.billing_started_at && !workspace.subscription_cancelled_at
  );

  return hasRealSubscription || hasActivatedTrial || hasStartedBilling;
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

async function getWorkspace(workspaceId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("business_workspaces")
    .select(
      "id, owner_user_id, business_name, plan_key, plan_status, billing_status, stripe_subscription_id, trial_activated_at, billing_started_at, subscription_cancelled_at"
    )
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as BusinessWorkspaceRow | null;
}

async function getCreditBalance(workspaceId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("workspace_credit_balances")
    .select(
      "workspace_id, owner_user_id, plan_credits, purchased_credits, used_credits, status"
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as CreditBalanceRow | null;
}

async function findOrCreateConversation({
  workspace,
  conversationId,
  customerName,
  customerPhone,
  customerMessage,
}: {
  workspace: BusinessWorkspaceRow;
  conversationId: string;
  customerName: string;
  customerPhone: string;
  customerMessage: string;
}) {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  if (conversationId) {
    const { data: existingConversation, error: existingError } = await supabase
      .from("customer_conversations")
      .select("id, ai_staff_id")
      .eq("id", conversationId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingConversation?.id) {
      const { error: updateError } = await supabase
        .from("customer_conversations")
        .update({
          last_message: customerMessage,
          last_message_at: now,
          updated_at: now,
        })
        .eq("id", existingConversation.id)
        .eq("workspace_id", workspace.id);

      if (updateError) {
        throw updateError;
      }

      return existingConversation as {
        id: string;
        ai_staff_id: string | null;
      };
    }
  }

  const { data: newConversation, error: insertError } = await supabase
    .from("customer_conversations")
    .insert({
      workspace_id: workspace.id,
      owner_user_id: workspace.owner_user_id,
      ai_staff_id: null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      customer_channel: "website_chat",
      status: "open",
      lead_status: "new",
      handover_requested: false,
      last_message: customerMessage,
      last_message_at: now,
    })
    .select("id, ai_staff_id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return newConversation as {
    id: string;
    ai_staff_id: string | null;
  };
}

async function saveMessage({
  conversationId,
  workspace,
  aiStaffId,
  senderType,
  messageText,
}: {
  conversationId: string;
  workspace: BusinessWorkspaceRow;
  aiStaffId?: string | null;
  senderType: "customer" | "ai";
  messageText: string;
}) {
  const supabase = getAdminSupabase();

  const { error } = await supabase.from("customer_messages").insert({
    conversation_id: conversationId,
    workspace_id: workspace.id,
    owner_user_id: workspace.owner_user_id,
    ai_staff_id: aiStaffId || null,
    sender_type: senderType,
    message_text: messageText,
  });

  if (error) {
    throw error;
  }
}

async function updateConversationAfterAiReply({
  conversationId,
  workspaceId,
  aiStaffId,
  aiReply,
}: {
  conversationId: string;
  workspaceId: string;
  aiStaffId?: string | null;
  aiReply: string;
}) {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("customer_conversations")
    .update({
      ai_staff_id: aiStaffId || null,
      last_message: aiReply,
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", conversationId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as WebsiteChatBody;

    const workspaceId = cleanText(body.workspace_id);
    const conversationId = cleanText(body.conversation_id);
    const customerMessage = cleanText(body.message);
    const customerName = cleanText(body.customer_name, "Website Visitor");
    const customerPhone = cleanText(body.customer_phone);
    const customerEmail = cleanText(body.customer_email);
    const language = cleanText(body.language, "auto");
    const pageUrl = cleanText(body.page_url);
    const visitorId = cleanText(body.visitor_id);

    if (!workspaceId) {
      return jsonResponse(
        { error: "Workspace is required for website chat." },
        400
      );
    }

    if (!customerMessage) {
      return jsonResponse(
        { error: "Message is required for website chat." },
        400
      );
    }

    const workspace = await getWorkspace(workspaceId);

    if (!workspace?.id) {
      return jsonResponse({ error: "Business workspace not found." }, 404);
    }

    if (!hasActiveTrialOrPlan(workspace)) {
      return jsonResponse(
        {
          error:
            "This business workspace is not active yet. Please activate a trial or subscription first.",
        },
        402
      );
    }

    const creditBalance = await getCreditBalance(workspace.id);
    const creditsLeft = getCreditsLeft(creditBalance);

    if (creditsLeft < WEBSITE_CHAT_REPLY_CREDIT_COST) {
      return jsonResponse(
        {
          error:
            "This business does not have enough credits for AI website chat replies.",
          credits_left: creditsLeft,
          credits_required: WEBSITE_CHAT_REPLY_CREDIT_COST,
        },
        402
      );
    }

    const conversation = await findOrCreateConversation({
      workspace,
      conversationId,
      customerName,
      customerPhone,
      customerMessage,
    });

    await saveMessage({
      conversationId: conversation.id,
      workspace,
      aiStaffId: conversation.ai_staff_id,
      senderType: "customer",
      messageText: customerMessage,
    });

    await logWorkspaceUsage({
      workspaceId: workspace.id,
      userId: workspace.owner_user_id,
      eventType: "website_chat_message_received",
      channel: "website_chat",
      sourcePage: pageUrl || "website_chat",
      creditsUsed: 0,
      metadata: {
        conversation_id: conversation.id,
        visitor_id: visitorId || null,
        customer_name: customerName || null,
        has_customer_phone: Boolean(customerPhone),
        has_customer_email: Boolean(customerEmail),
      },
    });

    const result = await runKolkapBrain({
      workspaceId: workspace.id,
      task: "customer_reply",
      channel: "website_chat",
      aiStaffId: conversation.ai_staff_id || null,
      conversationId: conversation.id,
      customerName,
      customerPhone,
      customerEmail,
      customerMessage,
      language,
      tone: "professional",
      extraInstructions:
        "Reply as the business website chat AI. Keep the reply friendly, clear, and useful. If the question needs human help, ask for contact details or say the team can follow up.",
      uiLanguage: language,
    });

    await saveMessage({
      conversationId: conversation.id,
      workspace,
      aiStaffId: result.aiStaffId || conversation.ai_staff_id || null,
      senderType: "ai",
      messageText: result.content,
    });

    await updateConversationAfterAiReply({
      conversationId: conversation.id,
      workspaceId: workspace.id,
      aiStaffId: result.aiStaffId || conversation.ai_staff_id || null,
      aiReply: result.content,
    });

    await logWorkspaceUsage({
      workspaceId: workspace.id,
      userId: workspace.owner_user_id,
      eventType: "website_chat_ai_reply_generated",
      channel: "website_chat",
      sourcePage: pageUrl || "website_chat",
      creditsUsed: WEBSITE_CHAT_REPLY_CREDIT_COST,
      metadata: {
        conversation_id: conversation.id,
        visitor_id: visitorId || null,
        model: result.model,
        knowledge_count: result.knowledgeCount,
        fallback: result.fallback,
        ai_staff_id: result.aiStaffId || conversation.ai_staff_id || null,
        credit_rule: "website_chat_ai_reply_minimum",
      },
    });

    return jsonResponse({
      reply: result.content,
      conversation_id: conversation.id,
      workspace_id: workspace.id,
      business_name: result.businessName,
      knowledge_count: result.knowledgeCount,
      model: result.model,
      fallback: result.fallback,
      credits_used: WEBSITE_CHAT_REPLY_CREDIT_COST,
      credits_left_before_reply: creditsLeft,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Website chat reply could not be generated.";

    return jsonResponse({ error: message }, 500);
  }
}