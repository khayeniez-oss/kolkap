import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { runKolkapBrain } from "@/lib/kolkap-ai/brain";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import { createKolkapNotification } from "@/lib/kolkap-notifications/createNotification";
import { KOLKAP_WEBSITE_CHAT_REPLY_MIN_CREDITS } from "@/lib/kolkapPlan";
import { chooseDefaultChannelAiStaffId } from "@/lib/kolkap-ai-staff/channelAssignments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBSITE_CHAT_REPLY_CREDIT_COST = KOLKAP_WEBSITE_CHAT_REPLY_MIN_CREDITS;

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
  session_token?: string;
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
  notify_new_lead?: boolean | null;
  notify_handover?: boolean | null;
};

type CreditBalanceRow = {
  workspace_id: string;
  owner_user_id: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  status: string;
};

type WebsiteChatSettingsRow = {
  id: string | null;
  workspace_id: string;
  owner_user_id: string | null;
  selected_ai_staff_id: string | null;
  widget_title: string;
  widget_subtitle: string;
  welcome_message: string;
  is_active: boolean;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
  handover_enabled: boolean;
  allowed_domains: string[];
};

type ConversationRow = {
  id: string;
  ai_staff_id: string | null;
  handover_requested: boolean | null;
};

type WebsiteChatSessionPayload = {
  workspaceId: string;
  conversationId: string;
  visitorId: string;
  expiresAt: number;
};

function getCorsHeaders(request: Request) {
  const origin = cleanText(request.headers.get("origin"));

  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getSessionSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Website Chat session security is not configured.");
  }

  return secret;
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

function createWebsiteChatSessionToken({
  workspaceId,
  conversationId,
  visitorId,
}: Omit<WebsiteChatSessionPayload, "expiresAt">) {
  const payload: WebsiteChatSessionPayload = {
    workspaceId,
    conversationId,
    visitorId,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );

  return `${encoded}.${signValue(encoded)}`;
}

function isValidWebsiteChatSessionToken({
  token,
  workspaceId,
  conversationId,
  visitorId,
}: {
  token: string;
  workspaceId: string;
  conversationId: string;
  visitorId: string;
}) {
  try {
    const [encoded, receivedSignature, extra] = token.split(".");

    if (!encoded || !receivedSignature || extra) return false;

    const expectedSignature = signValue(encoded);
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(receivedSignature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) return false;

    if (!timingSafeEqual(expectedBuffer, receivedBuffer)) return false;

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as WebsiteChatSessionPayload;

    return Boolean(
      payload.workspaceId === workspaceId &&
        payload.conversationId === conversationId &&
        payload.visitorId === visitorId &&
        Number(payload.expiresAt) > Date.now()
    );
  } catch {
    return false;
  }
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

function jsonResponse(body: unknown, status: number, request: Request) {
  return NextResponse.json(body, {
    status,
    headers: getCorsHeaders(request),
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

function normalizeDomain(value: string) {
  const cleaned = cleanText(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");

  return cleaned.split("/")[0].split(":")[0];
}

function getHostFromUrl(value: string) {
  try {
    return normalizeDomain(new URL(value).hostname);
  } catch {
    return normalizeDomain(value);
  }
}

function isHostAllowed(host: string, allowedDomains: string[]) {
  if (!host) return false;

  return allowedDomains.some((domain) => {
    const allowedHost = normalizeDomain(domain);

    if (!allowedHost) return false;

    return host === allowedHost || host.endsWith(`.${allowedHost}`);
  });
}

function getRequestHost(request: Request) {
  const origin = cleanText(request.headers.get("origin"));
  const referer = cleanText(request.headers.get("referer"));

  return getHostFromUrl(origin || referer);
}

function isKolkapOrLocalHost(host: string) {
  return Boolean(
    host === "kolkap.com" ||
      host.endsWith(".kolkap.com") ||
      host === "localhost" ||
      host === "127.0.0.1"
  );
}

function isRequestDomainAllowed(
  request: Request,
  pageUrl: string,
  allowedDomains: string[]
) {
  const requestHost = getRequestHost(request);
  const pageHost = getHostFromUrl(pageUrl);

  if (!requestHost) return false;
  if (pageHost && pageHost !== requestHost) return false;

  if (!allowedDomains.length) {
    return isKolkapOrLocalHost(requestHost);
  }

  return isHostAllowed(requestHost, allowedDomains);
}

function getClientIp(request: Request) {
  const forwardedFor = cleanText(request.headers.get("x-forwarded-for"));

  return (
    forwardedFor.split(",")[0]?.trim() ||
    cleanText(request.headers.get("cf-connecting-ip")) ||
    cleanText(request.headers.get("x-real-ip")) ||
    "unknown"
  );
}

async function isWithinWebsiteChatRateLimit({
  request,
  workspaceId,
  visitorId,
}: {
  request: Request;
  workspaceId: string;
  visitorId: string;
}) {
  const supabase = getAdminSupabase();
  const clientIp = getClientIp(request);
  const clientKey = `${workspaceId}:${
    clientIp === "unknown" ? `visitor:${visitorId}` : `ip:${clientIp}`
  }`;
  const rateKeyHash = signValue(clientKey);

  const { data, error } = await supabase.rpc("check_website_chat_rate_limit", {
    p_workspace_id: workspaceId,
    p_rate_key_hash: rateKeyHash,
    p_request_limit: 12,
    p_window_seconds: 60,
  });

  if (error) {
    throw new Error(`Website Chat protection could not run: ${error.message}`);
  }

  return data === true;
}

async function markWebsiteChatSeen(settingsId: string | null) {
  if (!settingsId) return;

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("workspace_website_chat_settings")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", settingsId);

  if (error) throw error;
}

function getDefaultWebsiteChatSettings(
  workspaceId: string
): WebsiteChatSettingsRow {
  return {
    id: null,
    workspace_id: workspaceId,
    owner_user_id: null,
    selected_ai_staff_id: null,
    widget_title: "Chat with us",
    widget_subtitle: "Ask a question and our AI assistant will help.",
    welcome_message: "Hi, how can we help you today?",
    is_active: false,
    ai_enabled: true,
    auto_reply_enabled: false,
    handover_enabled: true,
    allowed_domains: [],
  };
}

function getVisitorFallbackReply(reason: string) {
  if (reason === "website_chat_inactive") {
    return "Thanks. Your message has been received. The team can follow up when they are available.";
  }

  if (reason === "ai_support_off") {
    return "Thanks. Your message has been received. The team can review it and follow up.";
  }

  if (reason === "auto_reply_off") {
    return "Thanks. Your message has been received. The team can follow up shortly.";
  }

  if (reason === "no_ai_staff_selected") {
    return "Thanks. Your message has been received. The team can follow up when they are available.";
  }

  if (reason === "not_enough_credits") {
    return "Thanks. Your message has been received. The team can follow up when they are available.";
  }

  return "Thanks. Your message has been received and the team can follow up.";
}

function getMessagePreview(message: string) {
  const clean = cleanText(message).replace(/\s+/g, " ");

  if (clean.length <= 140) return clean;

  return `${clean.slice(0, 137)}...`;
}

function getWebsiteChatNotificationTitle(needsAttention: boolean) {
  if (needsAttention) {
    return "New website chat message needs attention";
  }

  return "New website chat message";
}

function getWebsiteChatNotificationMessage({
  customerName,
  customerMessage,
  needsAttention,
}: {
  customerName: string;
  customerMessage: string;
  needsAttention: boolean;
}) {
  const name = customerName || "Website Visitor";
  const preview = getMessagePreview(customerMessage);

  if (needsAttention) {
    return `${name} sent a website chat message and may need human follow-up: "${preview}"`;
  }

  return `${name} sent a website chat message: "${preview}"`;
}

async function getWorkspace(workspaceId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("business_workspaces")
    .select(
      "id, owner_user_id, business_name, plan_key, plan_status, billing_status, stripe_subscription_id, trial_activated_at, billing_started_at, subscription_cancelled_at, notify_new_lead, notify_handover"
    )
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as BusinessWorkspaceRow | null;
}

async function getWebsiteChatSettings(workspaceId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("workspace_website_chat_settings")
    .select(
      "id, workspace_id, owner_user_id, selected_ai_staff_id, widget_title, widget_subtitle, welcome_message, is_active, ai_enabled, auto_reply_enabled, handover_enabled, allowed_domains"
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return getDefaultWebsiteChatSettings(workspaceId);
  }

  return {
    id: data.id,
    workspace_id: data.workspace_id,
    owner_user_id: data.owner_user_id,
    selected_ai_staff_id: data.selected_ai_staff_id,
    widget_title: data.widget_title || "Chat with us",
    widget_subtitle:
      data.widget_subtitle || "Ask a question and our AI assistant will help.",
    welcome_message: data.welcome_message || "Hi, how can we help you today?",
    is_active: Boolean(data.is_active),
    ai_enabled: Boolean(data.ai_enabled),
    auto_reply_enabled: Boolean(data.auto_reply_enabled),
    handover_enabled: Boolean(data.handover_enabled),
    allowed_domains: Array.isArray(data.allowed_domains)
      ? data.allowed_domains
      : [],
  } as WebsiteChatSettingsRow;
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
  customerEmail,
  customerMessage,
  aiStaffId,
  handoverRequested,
}: {
  workspace: BusinessWorkspaceRow;
  conversationId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerMessage: string;
  aiStaffId?: string | null;
  handoverRequested: boolean;
}) {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  if (conversationId) {
    const { data: existingConversation, error: existingError } = await supabase
      .from("customer_conversations")
      .select("id, ai_staff_id, handover_requested")
      .eq("id", conversationId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingConversation?.id) {
      const nextAiStaffId =
        aiStaffId || existingConversation.ai_staff_id || null;

      const nextHandoverRequested = Boolean(
        existingConversation.handover_requested || handoverRequested
      );

      const { error: updateError } = await supabase
        .from("customer_conversations")
        .update({
          ai_staff_id: nextAiStaffId,
          handover_requested: nextHandoverRequested,
          last_message: customerMessage,
          last_message_at: now,
          updated_at: now,
          customer_name: customerName || "Website Visitor",
          customer_phone: customerPhone || null,
          customer_email: customerEmail || null,
        })
        .eq("id", existingConversation.id)
        .eq("workspace_id", workspace.id);

      if (updateError) {
        throw updateError;
      }

      return {
        id: existingConversation.id,
        ai_staff_id: nextAiStaffId,
        handover_requested: nextHandoverRequested,
      } as ConversationRow;
    }
  }

  const { data: newConversation, error: insertError } = await supabase
    .from("customer_conversations")
    .insert({
      workspace_id: workspace.id,
      owner_user_id: workspace.owner_user_id,
      ai_staff_id: aiStaffId || null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      customer_channel: "website_chat",
      status: "open",
      lead_status: "new",
      handover_requested: handoverRequested,
      last_message: customerMessage,
      last_message_at: now,
    })
    .select("id, ai_staff_id, handover_requested")
    .single();

  if (insertError) {
    throw insertError;
  }

  return newConversation as ConversationRow;
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

  const { data, error } = await supabase
    .from("customer_messages")
    .insert({
      conversation_id: conversationId,
      workspace_id: workspace.id,
      owner_user_id: workspace.owner_user_id,
      ai_staff_id: aiStaffId || null,
      sender_type: senderType,
      message_text: messageText,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data?.id || null;
}

async function createWebsiteChatMessageNotification({
  workspace,
  conversationId,
  messageId,
  customerName,
  customerPhone,
  customerEmail,
  customerMessage,
  pageUrl,
  visitorId,
  shouldGenerateAiReply,
  needsAttention,
}: {
  workspace: BusinessWorkspaceRow;
  conversationId: string;
  messageId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerMessage: string;
  pageUrl: string;
  visitorId: string;
  shouldGenerateAiReply: boolean;
  needsAttention: boolean;
}) {
  try {
    if (needsAttention && workspace.notify_handover === false) {
      return;
    }

    if (!needsAttention && workspace.notify_new_lead === false) {
      return;
    }

    await createKolkapNotification({
      workspaceId: workspace.id,
      ownerUserId: workspace.owner_user_id,
      recipientUserId: workspace.owner_user_id,
      type: needsAttention
        ? "website_chat_handover_requested"
        : "website_chat_message_received",
      channel: "website_chat",
      title: getWebsiteChatNotificationTitle(needsAttention),
      message: getWebsiteChatNotificationMessage({
        customerName,
        customerMessage,
        needsAttention,
      }),
      actionLabel: "Open Inbox",
      actionUrl: "/dashboard/inbox",
      priority: needsAttention ? "high" : "normal",
      sourceTable: "customer_messages",
      sourceRecordId: messageId || conversationId,
      metadata: {
        conversation_id: conversationId,
        message_id: messageId || null,
        visitor_id: visitorId || null,
        page_url: pageUrl || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        should_generate_ai_reply: shouldGenerateAiReply,
        needs_attention: needsAttention,
      },
    });
  } catch (error) {
    console.error(
      "Website chat notification error.",
      error instanceof Error ? error.message : error
    );
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
      handover_requested: false,
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

async function logAutoReplySkipped({
  workspace,
  conversationId,
  pageUrl,
  visitorId,
  reason,
  settings,
}: {
  workspace: BusinessWorkspaceRow;
  conversationId: string;
  pageUrl: string;
  visitorId: string;
  reason: string;
  settings: WebsiteChatSettingsRow;
}) {
  await logWorkspaceUsage({
    workspaceId: workspace.id,
    userId: workspace.owner_user_id,
    eventType: "website_chat_auto_reply_skipped",
    channel: "website_chat",
    sourcePage: pageUrl || "website_chat",
    creditsUsed: 0,
    metadata: {
      conversation_id: conversationId,
      visitor_id: visitorId || null,
      reason,
      website_chat_active: settings.is_active,
      ai_enabled: settings.ai_enabled,
      auto_reply_enabled: settings.auto_reply_enabled,
      handover_enabled: settings.handover_enabled,
      selected_ai_staff_id: settings.selected_ai_staff_id || null,
    },
  });
}

async function returnWithoutAiReply({
  request,
  workspace,
  conversation,
  pageUrl,
  visitorId,
  reason,
  settings,
  sessionToken,
}: {
  request: Request;
  workspace: BusinessWorkspaceRow;
  conversation: ConversationRow;
  pageUrl: string;
  visitorId: string;
  reason: string;
  settings: WebsiteChatSettingsRow;
  sessionToken: string;
}) {
  await logAutoReplySkipped({
    workspace,
    conversationId: conversation.id,
    pageUrl,
    visitorId,
    reason,
    settings,
  });

  return jsonResponse(
    {
      reply: getVisitorFallbackReply(reason),
      conversation_id: conversation.id,
      workspace_id: workspace.id,
      business_name: workspace.business_name || "Business",
      ai_reply_generated: false,
      auto_reply_skipped_reason: reason,
      credits_used: 0,
      session_token: sessionToken,
    },
    200,
    request
  );
}

function isConversationAiPaused(value: unknown) {
  return Boolean(
    (value as { handover_requested?: boolean | null })?.handover_requested
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = cleanText(url.searchParams.get("workspace_id"));
    const conversationId = cleanText(url.searchParams.get("conversation_id"));
    const visitorId = cleanText(url.searchParams.get("visitor_id")).slice(0, 160);
    const sessionToken = cleanText(url.searchParams.get("session_token"));
    const pageUrl = cleanText(url.searchParams.get("page_url"));

    if (!isUuid(workspaceId) || !isUuid(conversationId) || !visitorId) {
      return jsonResponse(
        { error: "Website Chat session is incomplete." },
        400,
        request
      );
    }

    if (
      !isValidWebsiteChatSessionToken({
        token: sessionToken,
        workspaceId,
        conversationId,
        visitorId,
      })
    ) {
      return jsonResponse(
        { error: "Website Chat session is not valid." },
        401,
        request
      );
    }

    const [workspace, settings] = await Promise.all([
      getWorkspace(workspaceId),
      getWebsiteChatSettings(workspaceId),
    ]);

    if (!workspace?.id || !hasActiveTrialOrPlan(workspace)) {
      return jsonResponse(
        { error: "This Website Chat is not available." },
        404,
        request
      );
    }

    if (!isRequestDomainAllowed(request, pageUrl, settings.allowed_domains)) {
      return jsonResponse(
        { error: "This website is not allowed to use this Website Chat widget." },
        403,
        request
      );
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("customer_messages")
      .select("id,sender_type,message_text,created_at")
      .eq("workspace_id", workspaceId)
      .eq("conversation_id", conversationId)
      .eq("sender_type", "human")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) throw error;

    return jsonResponse({ messages: data ?? [] }, 200, request);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Website Chat messages could not be loaded.";

    return jsonResponse({ error: message }, 500, request);
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as WebsiteChatBody;

    const workspaceId = cleanText(body.workspace_id);
    const conversationId = cleanText(body.conversation_id);
    const suppliedSessionToken = cleanText(body.session_token);
    const customerMessage = cleanText(body.message).slice(0, 2000);
    const customerName = cleanText(body.customer_name, "Website Visitor").slice(
      0,
      100
    );
    const customerPhone = cleanText(body.customer_phone).slice(0, 40);
    const customerEmail = cleanText(body.customer_email)
      .toLowerCase()
      .slice(0, 254);
    const language = cleanText(body.language, "auto");
    const pageUrl = cleanText(body.page_url);
    const visitorId = cleanText(body.visitor_id).slice(0, 160);

    if (!workspaceId || !isUuid(workspaceId)) {
      return jsonResponse(
        { error: "Workspace is required for website chat." },
        400,
        request
      );
    }

    if (!customerMessage) {
      return jsonResponse(
        { error: "Message is required for website chat." },
        400,
        request
      );
    }

    if (!visitorId) {
      return jsonResponse(
        { error: "Website Chat visitor session is missing." },
        400,
        request
      );
    }

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return jsonResponse(
        { error: "Please enter a valid email address." },
        400,
        request
      );
    }

    const workspace = await getWorkspace(workspaceId);

    if (!workspace?.id) {
      return jsonResponse(
        { error: "Business workspace not found." },
        404,
        request
      );
    }

    const settings = await getWebsiteChatSettings(workspace.id);

    if (!isRequestDomainAllowed(request, pageUrl, settings.allowed_domains)) {
      return jsonResponse(
        {
          error: "This website is not allowed to use this Website Chat widget.",
        },
        403,
        request
      );
    }

    if (
      !(await isWithinWebsiteChatRateLimit({
        request,
        workspaceId: workspace.id,
        visitorId,
      }))
    ) {
      return jsonResponse(
        { error: "Too many messages were sent. Please wait a moment and try again." },
        429,
        request
      );
    }

    await markWebsiteChatSeen(settings.id);

    if (!hasActiveTrialOrPlan(workspace)) {
      return jsonResponse(
        {
          error:
            "This business workspace is not active yet. Please activate a trial or subscription first.",
        },
        402,
        request
      );
    }

    const selectedAiStaffId = settings.id
      ? await chooseDefaultChannelAiStaffId({
          workspaceId: workspace.id,
          channelType: "website_chat",
          channelConnectionId: settings.id,
          fallbackAiStaffId: settings.selected_ai_staff_id || null,
        })
      : settings.selected_ai_staff_id || null;

    const shouldGenerateAiReply = Boolean(
      settings.is_active &&
        settings.ai_enabled &&
        settings.auto_reply_enabled &&
        selectedAiStaffId
    );

    const handoverRequested =
      settings.handover_enabled && !shouldGenerateAiReply;

    const canContinueConversation = Boolean(
      conversationId &&
        suppliedSessionToken &&
        isValidWebsiteChatSessionToken({
          token: suppliedSessionToken,
          workspaceId: workspace.id,
          conversationId,
          visitorId,
        })
    );

    const conversation = await findOrCreateConversation({
      workspace,
      conversationId: canContinueConversation ? conversationId : "",
      customerName,
      customerPhone,
      customerEmail,
      customerMessage,
      aiStaffId: selectedAiStaffId,
      handoverRequested,
    });

    const sessionToken = createWebsiteChatSessionToken({
      workspaceId: workspace.id,
      conversationId: conversation.id,
      visitorId,
    });

    const customerMessageId = await saveMessage({
      conversationId: conversation.id,
      workspace,
      aiStaffId: selectedAiStaffId || conversation.ai_staff_id || null,
      senderType: "customer",
      messageText: customerMessage,
    });

    await createWebsiteChatMessageNotification({
      workspace,
      conversationId: conversation.id,
      messageId: customerMessageId,
      customerName,
      customerPhone,
      customerEmail,
      customerMessage,
      pageUrl,
      visitorId,
      shouldGenerateAiReply,
      needsAttention: handoverRequested || isConversationAiPaused(conversation),
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
        message_id: customerMessageId,
        visitor_id: visitorId || null,
        customer_name: customerName || null,
        has_customer_phone: Boolean(customerPhone),
        has_customer_email: Boolean(customerEmail),
        website_chat_active: settings.is_active,
        ai_enabled: settings.ai_enabled,
        auto_reply_enabled: settings.auto_reply_enabled,
        handover_enabled: settings.handover_enabled,
        selected_ai_staff_id: selectedAiStaffId,
        fallback_selected_ai_staff_id: settings.selected_ai_staff_id || null,
      },
    });

    if (isConversationAiPaused(conversation)) {
      return returnWithoutAiReply({
        request,
        workspace,
        conversation,
        pageUrl,
        visitorId,
        reason: "ai_paused",
        settings,
        sessionToken,
      });
    }

    if (!settings.is_active) {
      return returnWithoutAiReply({
        request,
        workspace,
        conversation,
        pageUrl,
        visitorId,
        reason: "website_chat_inactive",
        settings,
        sessionToken,
      });
    }

    if (!settings.ai_enabled) {
      return returnWithoutAiReply({
        request,
        workspace,
        conversation,
        pageUrl,
        visitorId,
        reason: "ai_support_off",
        settings,
        sessionToken,
      });
    }

    if (!settings.auto_reply_enabled) {
      return returnWithoutAiReply({
        request,
        workspace,
        conversation,
        pageUrl,
        visitorId,
        reason: "auto_reply_off",
        settings,
        sessionToken,
      });
    }

    if (!selectedAiStaffId) {
      return returnWithoutAiReply({
        request,
        workspace,
        conversation,
        pageUrl,
        visitorId,
        reason: "no_ai_staff_selected",
        settings,
        sessionToken,
      });
    }

    const creditBalance = await getCreditBalance(workspace.id);
    const creditsLeft = getCreditsLeft(creditBalance);

    if (creditsLeft < WEBSITE_CHAT_REPLY_CREDIT_COST) {
      return returnWithoutAiReply({
        request,
        workspace,
        conversation,
        pageUrl,
        visitorId,
        reason: "not_enough_credits",
        settings,
        sessionToken,
      });
    }

    const result = await runKolkapBrain({
      workspaceId: workspace.id,
      task: "customer_reply",
      channel: "website_chat",
      aiStaffId: selectedAiStaffId,
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
      aiStaffId: result.aiStaffId || selectedAiStaffId,
      senderType: "ai",
      messageText: result.content,
    });

    await updateConversationAfterAiReply({
      conversationId: conversation.id,
      workspaceId: workspace.id,
      aiStaffId: result.aiStaffId || selectedAiStaffId,
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
        ai_staff_id: result.aiStaffId || selectedAiStaffId,
        selected_ai_staff_id: selectedAiStaffId,
        credit_rule: "website_chat_ai_reply_minimum",
      },
    });

    return jsonResponse(
      {
        reply: result.content,
        conversation_id: conversation.id,
        workspace_id: workspace.id,
        business_name: result.businessName,
        knowledge_count: result.knowledgeCount,
        model: result.model,
        fallback: result.fallback,
        ai_reply_generated: true,
        credits_used: WEBSITE_CHAT_REPLY_CREDIT_COST,
        credits_left_before_reply: creditsLeft,
        session_token: sessionToken,
      },
      200,
      request
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Website chat reply could not be generated.";

    return jsonResponse({ error: message }, 500, request);
  }
}
