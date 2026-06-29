import { createClient } from "@supabase/supabase-js";
import { sendKolkapWhatsAppTextMessage } from "@/lib/whatsapp/sendMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

type ConversationRow = {
  id: string;
  customer_wa_id: string | null;
  customer_name: string | null;
  meta_phone_number_id: string | null;
  meta_business_account_id: string | null;
  phone: string | null;
  phone_e164: string | null;
  profile_name: string | null;
  channel: string | null;
  window_expires_at: string | null;
};

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

function normalizePhone(value: unknown) {
  return String(value || "")
    .replace(/^whatsapp:/i, "")
    .replace(/\D/g, "");
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

function isWindowOpen(value?: string | null) {
  if (!value) return false;

  const expiry = new Date(value).getTime();

  if (!Number.isFinite(expiry)) {
    return false;
  }

  return expiry > Date.now();
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

async function loadConversation(conversationId: string) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("kolkap_whatsapp_conversations")
    .select(
      `
      id,
      customer_wa_id,
      customer_name,
      meta_phone_number_id,
      meta_business_account_id,
      phone,
      phone_e164,
      profile_name,
      channel,
      window_expires_at
    `
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data || null) as ConversationRow | null;
}

async function saveAdminOutboundMessage(input: {
  conversation: ConversationRow;
  adminUserId?: string | null;
  message: string;
  metaMessageId?: string | null;
  sendRaw?: Record<string, unknown>;
}) {
  const supabaseAdmin = getAdminSupabase();
  const now = new Date().toISOString();

  const phone =
    normalizePhone(input.conversation.phone_e164) ||
    normalizePhone(input.conversation.customer_wa_id) ||
    normalizePhone(input.conversation.phone);

  const profileName =
    input.conversation.profile_name || input.conversation.customer_name || null;

  const { error: messageError } = await supabaseAdmin
    .from("kolkap_whatsapp_messages")
    .insert({
      conversation_id: input.conversation.id,
      direction: "outbound",

      customer_wa_id: phone,
      customer_name: input.conversation.customer_name || profileName,
      meta_phone_number_id: input.conversation.meta_phone_number_id || null,
      meta_business_account_id:
        input.conversation.meta_business_account_id || null,
      meta_message_id: input.metaMessageId || null,
      message_type: "text",
      message_text: input.message,
      ai_replied: false,
      ai_model: null,
      ai_error: null,
      send_status: "sent",
      raw_payload: {
        admin_user_id: input.adminUserId || null,
        sent_from_admin_dashboard: true,
        send_raw: input.sendRaw || {},
      },

      from_number:
        input.conversation.meta_phone_number_id ||
        process.env.META_WHATSAPP_PHONE_NUMBER_ID ||
        null,
      to_number: phone,
      phone: `whatsapp:${phone}`,
      profile_name: profileName,
      message: input.message,
      source: "kolkap_admin_meta_direct",
      ai_generated: false,
      admin_generated: true,
      media_count: 0,
      created_at: now,
    });

  if (messageError) {
    console.error("Failed to save Kolkap admin WhatsApp reply:", messageError);
  }

  const { error: updateError } = await supabaseAdmin
    .from("kolkap_whatsapp_conversations")
    .update({
      status: "handover",
      ai_enabled: false,
      handover_to_admin: true,
      handover_reason: "Admin replied manually",
      last_outbound_at: now,
      last_message: input.message,
      last_message_direction: "outbound",
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", input.conversation.id);

  if (updateError) {
    console.error(
      "Failed to update Kolkap WhatsApp conversation after admin reply:",
      updateError
    );
  }
}

export async function POST(req: Request) {
  const auth = await verifyAdmin(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json().catch(() => ({}));

    const conversationId = cleanText(body?.conversationId);
    const message = cleanText(body?.message);

    if (!conversationId) {
      return Response.json(
        { success: false, error: "conversationId is required." },
        { status: 400 }
      );
    }

    if (!message) {
      return Response.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }

    if (message.length > 1700) {
      return Response.json(
        {
          success: false,
          error: "Message is too long. Please keep it under 1700 characters.",
        },
        { status: 400 }
      );
    }

    const conversation = await loadConversation(conversationId);

    if (!conversation?.id) {
      return Response.json(
        { success: false, error: "WhatsApp conversation was not found." },
        { status: 404 }
      );
    }

    if (!isWindowOpen(conversation.window_expires_at)) {
      return Response.json(
        {
          success: false,
          error:
            "The 24-hour WhatsApp reply window is closed. Use an approved template message for this customer later.",
        },
        { status: 400 }
      );
    }

    const phone =
      normalizePhone(conversation.phone_e164) ||
      normalizePhone(conversation.customer_wa_id) ||
      normalizePhone(conversation.phone);

    if (!phone) {
      return Response.json(
        {
          success: false,
          error: "Customer WhatsApp phone number is missing.",
        },
        { status: 400 }
      );
    }

    const sent = await sendKolkapWhatsAppTextMessage({
      to: phone,
      message,
    });

    await saveAdminOutboundMessage({
      conversation,
      adminUserId: auth.userId || null,
      message,
      metaMessageId: sent.metaMessageId,
      sendRaw: sent.raw as Record<string, unknown>,
    });

    return Response.json({
      success: true,
      provider: "meta",
      messageId: sent.metaMessageId,
      status: "sent",
    });
  } catch (error) {
    console.error("Kolkap admin WhatsApp send route error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send WhatsApp message.",
      },
      { status: 500 }
    );
  }
}