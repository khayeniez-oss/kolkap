import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMetaWhatsAppTextMessage } from "@/lib/whatsapp/sendMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type WhatsAppConnectionRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  provider: string;
  status: string;
  connection_label: string | null;
  display_phone_number: string | null;
  meta_phone_number_id: string | null;
  meta_waba_id: string | null;
  selected_ai_staff_id: string | null;
  ai_enabled: boolean | null;
  auto_reply_enabled: boolean | null;
  handover_enabled: boolean | null;
  is_primary: boolean | null;
};

type WhatsAppSecretRow = {
  connection_id: string;
  workspace_id: string;
  provider: string;
  meta_access_token: string | null;
  meta_token_type: string | null;
  meta_token_expires_at: string | null;
};

type AuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

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

function toRawPayload(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

async function verifyUser(req: Request): Promise<AuthResult> {
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
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user?.id) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unauthorized. Invalid session." },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    userId: user.id,
    userEmail: user.email || null,
  };
}

async function userCanAccessWorkspace({
  userId,
  userEmail,
  workspaceId,
  ownerUserId,
}: {
  userId: string;
  userEmail?: string | null;
  workspaceId: string;
  ownerUserId: string;
}) {
  if (ownerUserId === userId) {
    return true;
  }

  const email = cleanText(userEmail).toLowerCase();

  if (!email) {
    return false;
  }

  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("workspace_team_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("email", email)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Inbox send reply team access check failed:", error);
    return false;
  }

  return Boolean(data?.id);
}

async function getConversation(conversationId: string) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("customer_conversations")
    .select(
      "id, workspace_id, owner_user_id, ai_staff_id, customer_name, customer_phone, customer_channel, status, lead_status, handover_requested"
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ConversationRow | null;
}

async function getLatestInboundWhatsAppLog(conversationId: string) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("whatsapp_message_logs")
    .select(
      "id, connection_id, meta_message_id, meta_phone_number_id, customer_phone, display_phone_number, created_at"
    )
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

async function getWhatsAppConnection({
  workspaceId,
  connectionId,
}: {
  workspaceId: string;
  connectionId?: string | null;
}) {
  const supabaseAdmin = getAdminSupabase();

  if (connectionId) {
    const { data, error } = await supabaseAdmin
      .from("workspace_whatsapp_connections")
      .select(
        "id, workspace_id, owner_user_id, provider, status, connection_label, display_phone_number, meta_phone_number_id, meta_waba_id, selected_ai_staff_id, ai_enabled, auto_reply_enabled, handover_enabled, is_primary"
      )
      .eq("id", connectionId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.id) {
      return data as WhatsAppConnectionRow;
    }
  }

  const { data: primaryConnection, error: primaryError } = await supabaseAdmin
    .from("workspace_whatsapp_connections")
    .select(
      "id, workspace_id, owner_user_id, provider, status, connection_label, display_phone_number, meta_phone_number_id, meta_waba_id, selected_ai_staff_id, ai_enabled, auto_reply_enabled, handover_enabled, is_primary"
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "connected")
    .eq("is_primary", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (primaryError) {
    throw primaryError;
  }

  if (primaryConnection?.id) {
    return primaryConnection as WhatsAppConnectionRow;
  }

  const { data: fallbackConnection, error: fallbackError } = await supabaseAdmin
    .from("workspace_whatsapp_connections")
    .select(
      "id, workspace_id, owner_user_id, provider, status, connection_label, display_phone_number, meta_phone_number_id, meta_waba_id, selected_ai_staff_id, ai_enabled, auto_reply_enabled, handover_enabled, is_primary"
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "connected")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackError) {
    throw fallbackError;
  }

  return (fallbackConnection ?? null) as WhatsAppConnectionRow | null;
}

async function getWhatsAppSecret(connectionId: string) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("whatsapp_connection_secrets")
    .select(
      "connection_id, workspace_id, provider, meta_access_token, meta_token_type, meta_token_expires_at"
    )
    .eq("connection_id", connectionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as WhatsAppSecretRow | null;
}

async function insertInboxReply({
  conversation,
  messageText,
  senderType,
}: {
  conversation: ConversationRow;
  messageText: string;
  senderType: "human" | "ai" | "system";
}) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("customer_messages")
    .insert({
      conversation_id: conversation.id,
      workspace_id: conversation.workspace_id,
      owner_user_id: conversation.owner_user_id,
      ai_staff_id: conversation.ai_staff_id || null,
      sender_type: senderType,
      message_text: messageText,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateConversationAfterReply({
  conversationId,
  workspaceId,
  messageText,
}: {
  conversationId: string;
  workspaceId: string;
  messageText: string;
}) {
  const supabaseAdmin = getAdminSupabase();
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("customer_conversations")
    .update({
      last_message: messageText,
      last_message_at: now,
      status: "open",
      handover_requested: false,
      updated_at: now,
    })
    .eq("id", conversationId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }
}

async function insertWhatsAppLog(input: {
  conversation: ConversationRow;
  connection: WhatsAppConnectionRow;
  customerMessageId?: string | null;
  direction: "inbound" | "outbound" | "system";
  status: string;
  customerPhone: string;
  metaMessageId?: string | null;
  messageType: string;
  messageText?: string | null;
  errorCode?: string | null;
  errorTitle?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
  creditsUsed?: number;
  rawMetaPayload?: Record<string, unknown>;
  rawMetaResponse?: Record<string, unknown>;
}) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("whatsapp_message_logs")
    .insert({
      workspace_id: input.conversation.workspace_id,
      connection_id: input.connection.id,
      conversation_id: input.conversation.id,
      customer_message_id: input.customerMessageId || null,
      direction: input.direction,
      status: input.status,
      customer_phone: input.customerPhone || null,
      display_phone_number: input.connection.display_phone_number || null,
      meta_phone_number_id: input.connection.meta_phone_number_id || null,
      meta_waba_id: input.connection.meta_waba_id || null,
      meta_message_id: input.metaMessageId || null,
      message_type: input.messageType || "text",
      message_text: input.messageText || null,
      error_code: input.errorCode || null,
      error_title: input.errorTitle || null,
      error_message: input.errorMessage || null,
      error_details: input.errorDetails || null,
      credits_used: input.creditsUsed || 0,
      raw_meta_payload: input.rawMetaPayload || null,
      raw_meta_response: input.rawMetaResponse || null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data?.id || null;
}

export async function POST(req: Request) {
  const auth = await verifyUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json().catch(() => ({}));

    const conversationId = cleanText(body.conversation_id);
    const messageText = cleanText(body.message_text).slice(0, 3900);

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "Conversation is required." },
        { status: 400 }
      );
    }

    if (!messageText) {
      return NextResponse.json(
        { success: false, error: "Reply message is required." },
        { status: 400 }
      );
    }

    const conversation = await getConversation(conversationId);

    if (!conversation?.id) {
      return NextResponse.json(
        { success: false, error: "Conversation not found." },
        { status: 404 }
      );
    }

    const canAccess = await userCanAccessWorkspace({
      userId: auth.userId!,
      userEmail: auth.userEmail,
      workspaceId: conversation.workspace_id,
      ownerUserId: conversation.owner_user_id,
    });

    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this workspace." },
        { status: 403 }
      );
    }

    const channel = cleanText(conversation.customer_channel).toLowerCase();

    if (channel !== "whatsapp") {
      const savedMessage = await insertInboxReply({
        conversation,
        messageText,
        senderType: "human",
      });

      await updateConversationAfterReply({
        conversationId: conversation.id,
        workspaceId: conversation.workspace_id,
        messageText,
      });

      return NextResponse.json({
        success: true,
        message: savedMessage,
        delivered: false,
        delivery_channel: channel || "inbox",
        delivery_status: "saved_only",
        notice:
          "Reply saved in Inbox. Direct channel delivery is only connected for WhatsApp at this stage.",
      });
    }

    const latestInboundLog = await getLatestInboundWhatsAppLog(conversation.id);

    const connection = await getWhatsAppConnection({
      workspaceId: conversation.workspace_id,
      connectionId: cleanText(latestInboundLog?.connection_id),
    });

    if (!connection?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No connected WhatsApp number was found for this workspace. Please check WhatsApp integration setup.",
        },
        { status: 400 }
      );
    }

    if (connection.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This WhatsApp number is not connected. Please check WhatsApp integration setup.",
        },
        { status: 400 }
      );
    }

    if (!connection.meta_phone_number_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Meta phone number ID for this WhatsApp connection.",
        },
        { status: 400 }
      );
    }

    const secret = await getWhatsAppSecret(connection.id);

    if (!secret?.meta_access_token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Meta access token for this WhatsApp connection. Please reconnect WhatsApp.",
        },
        { status: 400 }
      );
    }

    const customerPhone =
      normalizePhone(conversation.customer_phone) ||
      normalizePhone(latestInboundLog?.customer_phone);

    if (!customerPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer WhatsApp phone number is missing.",
        },
        { status: 400 }
      );
    }

    try {
      const sent = await sendMetaWhatsAppTextMessage({
        to: customerPhone,
        message: messageText,
        accessToken: secret.meta_access_token,
        phoneNumberId: connection.meta_phone_number_id,
        replyToMessageId: cleanText(latestInboundLog?.meta_message_id) || null,
      });

      const savedMessage = await insertInboxReply({
        conversation,
        messageText,
        senderType: "human",
      });

      await updateConversationAfterReply({
        conversationId: conversation.id,
        workspaceId: conversation.workspace_id,
        messageText,
      });

      await insertWhatsAppLog({
        conversation,
        connection,
        customerMessageId: savedMessage.id,
        direction: "outbound",
        status: "sent",
        customerPhone,
        metaMessageId: sent.metaMessageId,
        messageType: "text",
        messageText,
        creditsUsed: 0,
        rawMetaPayload: {
          manual_reply: true,
          sent_by_user_id: auth.userId || null,
        },
        rawMetaResponse: toRawPayload(sent.raw),
      });

      return NextResponse.json({
        success: true,
        message: savedMessage,
        delivered: true,
        delivery_channel: "whatsapp",
        delivery_status: "sent",
        meta_message_id: sent.metaMessageId,
        notice: "Reply sent to WhatsApp and saved in Inbox.",
      });
    } catch (sendError) {
      const sendMessage =
        sendError instanceof Error
          ? sendError.message
          : "WhatsApp reply could not be sent.";

      await insertWhatsAppLog({
        conversation,
        connection,
        direction: "outbound",
        status: "failed",
        customerPhone,
        messageType: "text",
        messageText,
        errorCode: "manual_whatsapp_send_failed",
        errorMessage: sendMessage,
        creditsUsed: 0,
        rawMetaPayload: {
          manual_reply: true,
          sent_by_user_id: auth.userId || null,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: sendMessage,
          delivery_channel: "whatsapp",
          delivery_status: "failed",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Inbox send reply error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Reply could not be sent.",
      },
      { status: 500 }
    );
  }
}