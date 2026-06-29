import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONVERSATION_SELECT = `
  id,
  customer_wa_id,
  customer_name,
  meta_phone_number_id,
  meta_business_account_id,
  phone,
  phone_e164,
  profile_name,
  channel,
  status,
  ai_enabled,
  handover_to_admin,
  handover_reason,
  last_inbound_at,
  last_outbound_at,
  window_expires_at,
  last_message,
  last_message_direction,
  last_message_at,
  created_at,
  updated_at
`;

const MESSAGE_SELECT = `
  id,
  conversation_id,
  direction,
  customer_wa_id,
  customer_name,
  meta_phone_number_id,
  meta_business_account_id,
  meta_message_id,
  message_type,
  message_text,
  ai_replied,
  ai_model,
  ai_error,
  send_status,
  from_number,
  to_number,
  phone,
  profile_name,
  message,
  source,
  ai_generated,
  admin_generated,
  media_count,
  raw_payload,
  created_at
`;

type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

type ConversationStats = {
  total: number;
  metaDirect: number;
  needsAdmin: number;
  activeAi: number;
  pausedAi: number;
  handled: number;
};

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

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

function cleanText(value: unknown, fallback = "") {
  const text =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? fallback
        : String(value);

  return text.trim();
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

function getAdminEmails() {
  return cleanText(process.env.KOLKAP_ADMIN_EMAILS)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getPageNumber(value?: string | null) {
  const page = Number(value || "1");

  if (!Number.isFinite(page) || page < 1) return 1;

  return Math.floor(page);
}

function getPageSize(value?: string | null) {
  const pageSize = Number(value || String(DEFAULT_PAGE_SIZE));

  if (!Number.isFinite(pageSize) || pageSize < 1) return DEFAULT_PAGE_SIZE;

  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}

function applyStatusFilter(query: any, filter: string) {
  if (filter === "needs_admin") {
    return query.eq("handover_to_admin", true);
  }

  if (filter === "active_ai") {
    return query.eq("ai_enabled", true).eq("handover_to_admin", false);
  }

  if (filter === "paused_ai") {
    return query.eq("ai_enabled", false);
  }

  if (filter === "handled") {
    return query.eq("status", "handled");
  }

  return query;
}

function applyChannelFilter(query: any, channelFilter: string) {
  if (channelFilter === "meta_whatsapp") {
    return query.ilike("channel", "%meta%");
  }

  if (channelFilter === "unknown_channel") {
    return query.is("channel", null);
  }

  return query;
}

async function verifyAdmin(req: Request): Promise<AdminAuthResult> {
  const supabaseAdmin = getAdminSupabase();
  const token = getBearerToken(req);

  if (!token) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unauthorized. Login is required." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unauthorized. Invalid session." },
        { status: 401 }
      ),
    };
  }

  const userEmail = cleanText(user.email).toLowerCase();
  const adminEmails = getAdminEmails();
  const emailAllowed = Boolean(userEmail && adminEmails.includes(userEmail));

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError && !emailAllowed) {
    console.error("Failed to verify Kolkap admin profile:", profileError);

    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unable to verify admin access." },
        { status: 500 }
      ),
    };
  }

  const role = String((profile as { role?: string } | null)?.role || "")
    .toLowerCase()
    .trim();

  const roleAllowed = role.includes("admin");

  if (!emailAllowed && !roleAllowed) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Forbidden. Admin access is required." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: user.id,
    userEmail: user.email,
  };
}

async function countConversations(apply?: (query: any) => any) {
  const supabaseAdmin = getAdminSupabase();

  let query = supabaseAdmin
    .from("kolkap_whatsapp_conversations")
    .select("id", { count: "exact", head: true });

  if (apply) {
    query = apply(query);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count || 0;
}

async function getConversationStats(): Promise<ConversationStats> {
  const [total, metaDirect, needsAdmin, activeAi, pausedAi, handled] =
    await Promise.all([
      countConversations(),
      countConversations((query) => query.ilike("channel", "%meta%")),
      countConversations((query) => query.eq("handover_to_admin", true)),
      countConversations((query) =>
        query.eq("ai_enabled", true).eq("handover_to_admin", false)
      ),
      countConversations((query) => query.eq("ai_enabled", false)),
      countConversations((query) => query.eq("status", "handled")),
    ]);

  return {
    total,
    metaDirect,
    needsAdmin,
    activeAi,
    pausedAi,
    handled,
  };
}

function getActionUpdate(action: string) {
  const now = new Date().toISOString();

  if (action === "mark_handled") {
    return {
      status: "handled",
      handover_to_admin: false,
      ai_enabled: false,
      handover_reason: null,
      updated_at: now,
    };
  }

  if (action === "resume_ai") {
    return {
      status: "active",
      handover_to_admin: false,
      ai_enabled: true,
      handover_reason: null,
      updated_at: now,
    };
  }

  if (action === "pause_ai") {
    return {
      status: "handover",
      handover_to_admin: true,
      ai_enabled: false,
      handover_reason: "AI paused by admin - needs admin attention",
      updated_at: now,
    };
  }

  return null;
}

function getSystemMessage(action: string) {
  if (action === "mark_handled") {
    return "Admin marked this conversation as handled.";
  }

  if (action === "resume_ai") {
    return "Admin resumed Kolkap WhatsApp AI for this conversation.";
  }

  if (action === "pause_ai") {
    return "Admin paused Kolkap WhatsApp AI. This conversation now needs admin attention.";
  }

  return "Admin updated this conversation.";
}

async function insertSystemMessage(input: {
  conversation: any;
  action: string;
  adminUserId?: string;
}) {
  const supabaseAdmin = getAdminSupabase();
  const now = new Date().toISOString();

  const customerWaId = cleanText(input.conversation?.customer_wa_id);
  const phoneE164 = cleanText(input.conversation?.phone_e164) || customerWaId;

  if (!customerWaId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from("kolkap_whatsapp_messages")
    .insert({
      conversation_id: input.conversation.id,
      direction: "system",
      customer_wa_id: customerWaId,
      customer_name: input.conversation.customer_name || null,
      meta_phone_number_id: input.conversation.meta_phone_number_id || null,
      meta_business_account_id:
        input.conversation.meta_business_account_id || null,
      meta_message_id: null,
      message_type: "system",
      message_text: getSystemMessage(input.action),
      ai_replied: false,
      ai_model: null,
      ai_error: null,
      send_status: null,

      from_number: "kolkap_admin_dashboard",
      to_number: phoneE164 || null,
      phone: input.conversation.phone || `whatsapp:${phoneE164}`,
      profile_name: input.conversation.profile_name || null,
      message: getSystemMessage(input.action),
      source: "kolkap_admin_dashboard",
      ai_generated: false,
      admin_generated: true,
      media_count: 0,
      raw_payload: {
        action: input.action,
        admin_user_id: input.adminUserId || null,
      },
      created_at: now,
    });

  if (error) {
    console.error("Failed to insert Kolkap WhatsApp system message:", error);
  }
}

export async function GET(req: Request) {
  const auth = await verifyAdmin(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  const supabaseAdmin = getAdminSupabase();
  const url = new URL(req.url);

  const conversationId = url.searchParams.get("conversationId") || "";
  const filter = url.searchParams.get("filter") || "all";
  const channelFilter = url.searchParams.get("channelFilter") || "all_channels";
  const page = getPageNumber(url.searchParams.get("page"));
  const pageSize = getPageSize(url.searchParams.get("pageSize"));

  if (conversationId) {
    const { data: conversation, error: conversationError } =
      await supabaseAdmin
        .from("kolkap_whatsapp_conversations")
        .select(CONVERSATION_SELECT)
        .eq("id", conversationId)
        .maybeSingle();

    if (conversationError) {
      console.error(
        "Failed to load Kolkap WhatsApp conversation:",
        conversationError
      );

      return Response.json(
        { success: false, error: "Failed to load WhatsApp conversation." },
        { status: 500 }
      );
    }

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("kolkap_whatsapp_messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Failed to load Kolkap WhatsApp messages:", messagesError);

      return Response.json(
        { success: false, error: "Failed to load WhatsApp messages." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      conversation,
      messages: messages || [],
    });
  }

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("kolkap_whatsapp_conversations")
      .select(CONVERSATION_SELECT, { count: "exact" });

    query = applyStatusFilter(query, filter);
    query = applyChannelFilter(query, channelFilter);

    query = query
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    const [{ data, error, count }, stats] = await Promise.all([
      query,
      getConversationStats(),
    ]);

    if (error) {
      console.error("Failed to load Kolkap WhatsApp conversations:", error);

      return Response.json(
        { success: false, error: "Failed to load WhatsApp conversations." },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return Response.json({
      success: true,
      conversations: data || [],
      stats,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
        from: totalCount === 0 ? 0 : from + 1,
        to: Math.min(to + 1, totalCount),
      },
    });
  } catch (error) {
    console.error("Failed to load Kolkap WhatsApp inbox data:", error);

    return Response.json(
      { success: false, error: "Failed to load WhatsApp inbox data." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await verifyAdmin(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  const supabaseAdmin = getAdminSupabase();
  const body = await req.json().catch(() => ({}));

  const conversationId = cleanText(body?.conversationId);
  const action = cleanText(body?.action);

  if (!conversationId) {
    return Response.json(
      { success: false, error: "conversationId is required." },
      { status: 400 }
    );
  }

  const updatePayload = getActionUpdate(action);

  if (!updatePayload) {
    return Response.json(
      { success: false, error: "Invalid action." },
      { status: 400 }
    );
  }

  const { data: updatedConversation, error: updateError } = await supabaseAdmin
    .from("kolkap_whatsapp_conversations")
    .update(updatePayload)
    .eq("id", conversationId)
    .select(CONVERSATION_SELECT)
    .maybeSingle();

  if (updateError) {
    console.error("Failed to update Kolkap WhatsApp conversation:", updateError);

    return Response.json(
      { success: false, error: "Failed to update WhatsApp conversation." },
      { status: 500 }
    );
  }

  if (!updatedConversation?.id) {
    return Response.json(
      { success: false, error: "WhatsApp conversation was not found." },
      { status: 404 }
    );
  }

  await insertSystemMessage({
    conversation: updatedConversation,
    action,
    adminUserId: auth.userId,
  });

  return Response.json({
    success: true,
    conversation: updatedConversation,
  });
}