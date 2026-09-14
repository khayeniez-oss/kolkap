import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { runKolkapBrain } from "@/lib/kolkap-ai/brain";
import { createKolkapNotification } from "@/lib/kolkap-notifications/createNotification";
import { chooseDefaultChannelAiStaffId } from "@/lib/kolkap-ai-staff/channelAssignments";
import { allowedWebsiteRequest, websiteHost, websitePageUrl } from "@/lib/website-chat/policy";
import { asksForHuman } from "@/lib/whatsapp/policy";
import { channelRpc } from "@/lib/whatsapp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;


type WebsiteChatBody = {
  request_id?: string;
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

type WebsiteChatSessionPayload = {
  workspaceId: string;
  conversationId: string;
  visitorId: string;
  expiresAt: number;
  host?: string;
};

function getCorsHeaders(request: Request) {
  const origin = cleanText(request.headers.get("origin"));

  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Kolkap-Session",
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
  host,
}: Omit<WebsiteChatSessionPayload, "expiresAt">) {
  const payload: WebsiteChatSessionPayload = {
    workspaceId,
    conversationId,
    visitorId,
    host,
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
  host,
}: {
  token: string;
  host: string;
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
        Number(payload.expiresAt) > Date.now() && (!payload.host || payload.host === host)
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

const isRequestDomainAllowed = allowedWebsiteRequest;
function getRequestHost(request: Request) {
  return websiteHost(request.headers.get("origin") || request.headers.get("referer"));
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

type WebsiteRequest = {
  id: string; conversation_id: string; incoming_message_id: string;
  reply_message_id: string | null; reply_text: string | null;
  ai_staff_id: string | null; completed: boolean; generation_allowed: boolean;
  credits_recorded: number;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = cleanText(url.searchParams.get("workspace_id"));
    if (!isUuid(workspaceId)) return jsonResponse({ error: "Invalid workspace." }, 400, request);
    const [workspace, settings] = await Promise.all([getWorkspace(workspaceId), getWebsiteChatSettings(workspaceId)]);
    if (!workspace || !isRequestDomainAllowed(request, cleanText(url.searchParams.get("page_url")), settings.allowed_domains)) {
      return jsonResponse({ error: "Website Chat is unavailable for this website." }, 403, request);
    }
    if (url.searchParams.get("mode") === "config") {
      const active = settings.is_active && hasActiveTrialOrPlan(workspace);
      if (active) await markWebsiteChatSeen(settings.id).catch(() => {});
      return jsonResponse({ active, title: settings.widget_title, subtitle: settings.widget_subtitle, welcome_message: settings.welcome_message }, 200, request);
    }
    const conversationId = cleanText(url.searchParams.get("conversation_id"));
    const visitorId = cleanText(url.searchParams.get("visitor_id")).slice(0, 160);
    const token = request.headers.get("x-kolkap-session") || cleanText(url.searchParams.get("session_token"));
    if (!isUuid(conversationId) || !isValidWebsiteChatSessionToken({token, workspaceId, conversationId, visitorId, host: getRequestHost(request)})) {
      return jsonResponse({ error: "Your chat session has expired. Please send your message again." }, 401, request);
    }
    const db = getAdminSupabase();
    const {data: conversation, error: conversationError} = await db.from("customer_conversations")
      .select("id").eq("id", conversationId).eq("workspace_id", workspaceId).eq("customer_channel", "website_chat").maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation) return jsonResponse({ error: "Your chat session is no longer available." }, 401, request);
    const cursor = url.searchParams.get("after") || "0";
    if (!/^\d{1,15}$/.test(cursor)) return jsonResponse({ error: "Invalid message cursor." }, 400, request);
    const history = url.searchParams.get("mode") === "history";
    let query = db.from("customer_messages").select("id,sender_type,message_text,created_at,website_message_sequence")
      .eq("workspace_id", workspaceId).eq("conversation_id", conversationId).in("sender_type", history ? ["human", "ai", "customer"] : ["human"]);
    if (history) query = query.gt("website_message_sequence", Number(cursor));
    const {data, error} = await query.order("website_message_sequence", {ascending: history}).limit(100);
    if (error) throw error;
    const messages = data || [];
    if (!history) messages.reverse();
    return jsonResponse({ messages, next_cursor: messages.at(-1)?.website_message_sequence || Number(cursor), has_more: history && messages.length === 100 }, 200, request);
  } catch {
    return jsonResponse({ error: "Messages could not be loaded. Please try again." }, 503, request);
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as WebsiteChatBody;
    const workspaceId = cleanText(body.workspace_id);
    const conversationId = cleanText(body.conversation_id);
    const visitorId = cleanText(body.visitor_id).slice(0, 160);
    const customerMessage = typeof body.message === "string" ? body.message.trim() : "";
    const customerName = cleanText(body.customer_name).slice(0, 100);
    const customerEmail = cleanText(body.customer_email).toLowerCase().slice(0, 254);
    const customerPhone = cleanText(body.customer_phone).slice(0, 40);
    const pageUrl = websitePageUrl(body.page_url);
    const language = cleanText(body.language, "auto").slice(0, 30);
    // Older tabs continue working; the updated widget supplies a stable retry ID.
    const requestId = cleanText(body.request_id) || randomUUID();
    if (!isUuid(workspaceId) || !isUuid(requestId) || !visitorId || !customerMessage || customerMessage.length > 2000) {
      return jsonResponse({ error: "Enter a message of up to 2,000 characters." }, 400, request);
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return jsonResponse({ error: "Please enter a valid email address." }, 400, request);
    if (conversationId && (!isUuid(conversationId) || !isValidWebsiteChatSessionToken({
      token: cleanText(body.session_token), workspaceId, conversationId, visitorId, host: getRequestHost(request),
    }))) return jsonResponse({ error: "Your chat session has expired. Please send your message again." }, 401, request);
    const [workspace, settings] = await Promise.all([getWorkspace(workspaceId), getWebsiteChatSettings(workspaceId)]);
    if (!workspace || !isRequestDomainAllowed(request, pageUrl, settings.allowed_domains)) {
      return jsonResponse({ error: "Website Chat is unavailable for this website." }, 403, request);
    }
    if (!settings.is_active || !hasActiveTrialOrPlan(workspace)) return jsonResponse({ error: "This business's chat is currently unavailable." }, 409, request);
    if (!(await isWithinWebsiteChatRateLimit({request, workspaceId, visitorId}))) return jsonResponse({ error: "Please wait a moment before sending another message." }, 429, request);
    const selectedAiStaffId = settings.id ? await chooseDefaultChannelAiStaffId({workspaceId, channelType: "website_chat", channelConnectionId: settings.id, fallbackAiStaffId: settings.selected_ai_staff_id}) : null;
    const received = await channelRpc<{created: boolean; request: WebsiteRequest}>("receive_website_chat_message", {
      p_workspace_id: workspaceId, p_conversation_id: conversationId || null, p_request_id: requestId,
      p_visitor_hash: signValue(JSON.stringify([workspaceId, getRequestHost(request), visitorId])),
      p_fingerprint: signValue(JSON.stringify([customerMessage, customerName, customerEmail, customerPhone, language])),
      p_text: customerMessage, p_name: customerName, p_email: customerEmail, p_phone: customerPhone,
      p_staff_id: selectedAiStaffId, p_request_human: asksForHuman(customerMessage),
    });
    let operation = received.request;
    if (received.created) {
      await createWebsiteChatMessageNotification({workspace, conversationId: operation.conversation_id, messageId: operation.incoming_message_id,
        customerName, customerEmail, customerPhone, customerMessage, pageUrl, visitorId,
        shouldGenerateAiReply: operation.generation_allowed, needsAttention: !operation.generation_allowed});
      if (operation.generation_allowed) {
        let generated: Awaited<ReturnType<typeof runKolkapBrain>> | null = null;
        try {
          generated = await runKolkapBrain({workspaceId, task: "customer_reply", channel: "website_chat", aiStaffId: operation.ai_staff_id,
            conversationId: operation.conversation_id, customerName, customerPhone, customerEmail, customerMessage, language,
            tone: "professional", uiLanguage: language,
            extraInstructions: "Reply as the business website chat AI. Keep the reply friendly, clear, and useful. If human help is needed, ask for contact details so the team can follow up."});
        } catch { console.error("Website Chat generation could not complete."); }
        const args = {p_request_id: operation.id, p_reply: generated?.content || "", p_generated: Boolean(generated?.content),
          p_metadata: generated ? {model: generated.model, knowledge_count: generated.knowledgeCount, fallback: generated.fallback, ai_staff_id: operation.ai_staff_id} : {}};
        // Completion is atomic and idempotent. Retry storage, never generation.
        try { operation = await channelRpc<WebsiteRequest>("complete_website_chat_reply", args); }
        catch { operation = await channelRpc<WebsiteRequest>("complete_website_chat_reply", args); }
      }
    }
    return jsonResponse({ conversation_id: operation.conversation_id, workspace_id: workspaceId,
      session_token: createWebsiteChatSessionToken({workspaceId, conversationId: operation.conversation_id, visitorId, host: getRequestHost(request)}),
      incoming_message_id: operation.incoming_message_id, reply_message_id: operation.reply_message_id,
      reply: operation.reply_text, pending: !operation.completed, ai_reply_generated: operation.credits_recorded > 0,
      credits_used: operation.credits_recorded, request_id: requestId }, operation.completed ? 200 : 202, request);
  } catch {
    return jsonResponse({ error: "Your message could not be confirmed. Please try again; your draft has been kept." }, 503, request);
  }
}
