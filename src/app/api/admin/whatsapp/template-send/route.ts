import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

type SendProvider = "meta_cloud_api";
type TemplateSendStatus = "sent" | "failed" | "skipped";

type ContactRow = {
  id: string;
  phone_e164: string;
  status?: string | null;
  opted_out_at?: string | null;
};

type ConversationRow = {
  id: string;
  business_initiated_count?: number | null;
  opted_out_at?: string | null;
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

function cleanText(value?: unknown) {
  return String(value || "").trim();
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

function normalizePhone(value?: unknown) {
  let phone = String(value || "")
    .replace(/^whatsapp:/i, "")
    .replace(/\D/g, "");

  if (!phone) return "";

  const defaultCountryCode =
    cleanText(process.env.KOLKAP_DEFAULT_COUNTRY_CODE) || "62";

  if (phone.startsWith("0")) {
    phone = `${defaultCountryCode}${phone.slice(1)}`;
  }

  if (phone.startsWith("8") && defaultCountryCode === "62") {
    phone = `62${phone}`;
  }

  return phone;
}

function phoneDisplay(phoneE164: string) {
  return phoneE164.startsWith("+") ? phoneE164 : `+${phoneE164}`;
}

function normalizeBodyVariables(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    return Object.keys(record)
      .sort((a, b) => {
        const numA = Number(a);
        const numB = Number(b);

        if (Number.isFinite(numA) && Number.isFinite(numB)) {
          return numA - numB;
        }

        return a.localeCompare(b);
      })
      .map((key) => cleanText(record[key]))
      .filter(Boolean);
  }

  const single = cleanText(value);
  return single ? [single] : [];
}

function getMetaAccessToken() {
  return cleanText(process.env.META_WHATSAPP_ACCESS_TOKEN);
}

function getMetaPhoneNumberId() {
  return cleanText(process.env.META_WHATSAPP_PHONE_NUMBER_ID);
}

function getMetaBusinessAccountId() {
  return cleanText(process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID);
}

function getGraphVersion() {
  return (
    cleanText(process.env.META_WHATSAPP_API_VERSION) ||
    cleanText(process.env.META_GRAPH_VERSION) ||
    "v25.0"
  );
}

function getSendSource(sendType: string) {
  if (sendType === "manual_template") return "kolkap_admin_meta_template";
  if (sendType === "campaign") return "kolkap_meta_template_campaign";
  return "kolkap_meta_template_business_initiated";
}

async function getCampaignConfig(campaignId: string | null) {
  if (!campaignId) return null;

  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("kolkap_whatsapp_template_campaigns")
    .select("id, template_name, template_language, category, campaign_type, send_provider")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load Kolkap WhatsApp campaign config:", error);
    return null;
  }

  return data as Record<string, unknown> | null;
}

async function getOrCreateContact(input: {
  phoneE164: string;
  customerName: string | null;
  leadType: string;
  source: string;
}) {
  const supabaseAdmin = getAdminSupabase();
  const now = new Date().toISOString();

  const { data: existingContact, error: existingError } = await supabaseAdmin
    .from("kolkap_whatsapp_contacts")
    .select("id, phone_e164, status, opted_out_at")
    .eq("phone_e164", input.phoneE164)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to check Kolkap WhatsApp contact:", existingError);
  }

  if (existingContact?.id) {
    const updatePayload: Record<string, unknown> = {
      updated_at: now,
    };

    if (input.customerName) updatePayload.profile_name = input.customerName;
    if (input.leadType) updatePayload.lead_type = input.leadType;
    if (input.source) updatePayload.source = input.source;

    await supabaseAdmin
      .from("kolkap_whatsapp_contacts")
      .update(updatePayload)
      .eq("id", existingContact.id);

    return existingContact as ContactRow;
  }

  const { data: createdContact, error: createError } = await supabaseAdmin
    .from("kolkap_whatsapp_contacts")
    .insert({
      phone_e164: input.phoneE164,
      phone_display: phoneDisplay(input.phoneE164),
      profile_name: input.customerName,
      lead_type: input.leadType || "unknown",
      source: input.source || "campaign_import",
      status: "active",
      first_seen_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("id, phone_e164, status, opted_out_at")
    .maybeSingle();

  if (createError || !createdContact?.id) {
    console.error("Failed to create Kolkap WhatsApp contact:", createError);
    return null;
  }

  return createdContact as ContactRow;
}

async function getOrCreateConversation(input: {
  phoneE164: string;
  customerName: string | null;
  contactId: string | null;
}) {
  const supabaseAdmin = getAdminSupabase();
  const now = new Date().toISOString();
  const metaPhoneNumberId = getMetaPhoneNumberId();

  const { data: existingConversation, error: existingError } = await supabaseAdmin
    .from("kolkap_whatsapp_conversations")
    .select("id, status")
    .eq("customer_wa_id", input.phoneE164)
    .eq("meta_phone_number_id", metaPhoneNumberId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to check Kolkap WhatsApp conversation:", existingError);
  }

  if (existingConversation?.id) {
    await supabaseAdmin
      .from("kolkap_whatsapp_conversations")
      .update({
        customer_name: input.customerName || null,
        phone: `whatsapp:${input.phoneE164}`,
        phone_e164: input.phoneE164,
        profile_name: input.customerName || null,
        channel: "meta_whatsapp",
        meta_business_account_id: getMetaBusinessAccountId() || null,
        updated_at: now,
      })
      .eq("id", existingConversation.id);

    return existingConversation as ConversationRow;
  }

  const { data: createdConversation, error: createError } = await supabaseAdmin
    .from("kolkap_whatsapp_conversations")
    .insert({
      customer_wa_id: input.phoneE164,
      customer_name: input.customerName || null,
      meta_phone_number_id: metaPhoneNumberId || null,
      meta_business_account_id: getMetaBusinessAccountId() || null,
      phone: `whatsapp:${input.phoneE164}`,
      phone_e164: input.phoneE164,
      profile_name: input.customerName || null,
      channel: "meta_whatsapp",
      status: "active",
      ai_enabled: true,
      handover_to_admin: false,
      handover_reason: null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .maybeSingle();

  if (createError || !createdConversation?.id) {
    console.error("Failed to create Kolkap WhatsApp conversation:", createError);
    return null;
  }

  return createdConversation as ConversationRow;
}

async function sendMetaTemplate(input: {
  phoneE164: string;
  templateName: string;
  templateLanguage: string;
  bodyVariables: string[];
}) {
  const accessToken = getMetaAccessToken();
  const phoneNumberId = getMetaPhoneNumberId();

  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      messageId: null,
      result: {
        error:
          "Missing Meta environment variables. Check META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID.",
      },
      payload: {},
    };
  }

  const templatePayload: Record<string, unknown> = {
    name: input.templateName,
    language: {
      code: input.templateLanguage,
    },
  };

  if (input.bodyVariables.length > 0) {
    templatePayload.components = [
      {
        type: "body",
        parameters: input.bodyVariables.map((text) => ({
          type: "text",
          text,
        })),
      },
    ];
  }

  const payload = {
    messaging_product: "whatsapp",
    to: input.phoneE164,
    type: "template",
    template: templatePayload,
  };

  const response = await fetch(
    `https://graph.facebook.com/${getGraphVersion()}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      success: false,
      messageId: null,
      result,
      payload,
    };
  }

  return {
    success: true,
    messageId: result?.messages?.[0]?.id || null,
    result,
    payload,
  };
}

async function markRecipient(input: {
  recipientId: string | null;
  status: TemplateSendStatus;
  metaMessageId?: string | null;
  errorPayload?: unknown;
  skipReason?: string | null;
}) {
  if (!input.recipientId) return;

  const supabaseAdmin = getAdminSupabase();
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    status: input.status,
    updated_at: now,
  };

  if (input.status === "sent") {
    updatePayload.sent_at = now;
    updatePayload.meta_message_id = input.metaMessageId || null;
    updatePayload.send_error = null;
  }

  if (input.status === "failed") {
    updatePayload.failed_at = now;
    updatePayload.send_error = input.errorPayload || null;
  }

  if (input.status === "skipped") {
    updatePayload.skipped_at = now;
    updatePayload.skip_reason = input.skipReason || "Skipped by system";
  }

  await supabaseAdmin
    .from("kolkap_whatsapp_template_recipients")
    .update(updatePayload)
    .eq("id", input.recipientId);
}

async function insertSendLog(input: {
  campaignId: string | null;
  recipientId: string | null;
  conversationId: string | null;
  contactId: string | null;
  phoneE164: string;
  templateName: string;
  templateLanguage: string;
  templateCategory: string;
  sendType: string;
  sendProvider: SendProvider;
  status: TemplateSendStatus;
  metaMessageId?: string | null;
  errorPayload?: unknown;
  rawPayload?: unknown;
}) {
  const supabaseAdmin = getAdminSupabase();
  const now = new Date().toISOString();

  await supabaseAdmin.from("kolkap_whatsapp_template_send_logs").insert({
    campaign_id: input.campaignId,
    recipient_id: input.recipientId,
    conversation_id: input.conversationId,
    contact_id: input.contactId,
    phone_e164: input.phoneE164,
    template_name: input.templateName,
    template_language: input.templateLanguage,
    template_category: input.templateCategory,
    send_type: input.sendType,
    provider: "meta",
    send_provider: input.sendProvider,
    status: input.status,
    meta_message_id: input.metaMessageId || null,
    error_payload: input.errorPayload || null,
    raw_payload: input.rawPayload || {},
    sent_at: input.status === "sent" ? now : null,
    failed_at: input.status === "failed" ? now : null,
    created_at: now,
    updated_at: now,
  });
}

async function saveOutboundTemplateMessage(input: {
  conversationId: string;
  contactId: string | null;
  phoneE164: string;
  customerName: string | null;
  templateName: string;
  templateLanguage: string;
  bodyVariables: string[];
  sendType: string;
  metaMessageId: string | null;
  sendResult: unknown;
}) {
  const supabaseAdmin = getAdminSupabase();
  const now = new Date().toISOString();
  const source = getSendSource(input.sendType);

  const message =
    input.bodyVariables.length > 0
      ? `[Template] ${input.templateName}\nVariables: ${input.bodyVariables.join(
          " | "
        )}`
      : `[Template] ${input.templateName}`;

  await supabaseAdmin.from("kolkap_whatsapp_messages").insert({
    conversation_id: input.conversationId,
    direction: "outbound",
    customer_wa_id: input.phoneE164,
    customer_name: input.customerName,
    meta_phone_number_id: getMetaPhoneNumberId() || null,
    meta_business_account_id: getMetaBusinessAccountId() || null,
    meta_message_id: input.metaMessageId,
    message_type: "template",
    message_text: message,
    ai_replied: false,
    ai_model: null,
    ai_error: null,
    send_status: "sent",
    raw_payload: {
      template_name: input.templateName,
      template_language: input.templateLanguage,
      body_variables: input.bodyVariables,
      send_type: input.sendType,
      send_provider: "meta_cloud_api",
      meta_message_id: input.metaMessageId,
      send_result: input.sendResult,
      contact_id: input.contactId,
    },

    from_number: getMetaPhoneNumberId() || "meta_whatsapp",
    to_number: input.phoneE164,
    phone: `whatsapp:${input.phoneE164}`,
    profile_name: input.customerName,
    message,
    source,
    ai_generated: false,
    admin_generated: true,
    media_count: 0,
    created_at: now,
  });
}

async function updateAfterSuccessfulSend(input: {
  conversationId: string;
  contactId: string | null;
  phoneE164: string;
  templateName: string;
}) {
  const supabaseAdmin = getAdminSupabase();
  const now = new Date().toISOString();

  await supabaseAdmin
    .from("kolkap_whatsapp_conversations")
    .update({
      last_outbound_at: now,
      last_message: `[Template] ${input.templateName}`,
      last_message_direction: "outbound",
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", input.conversationId);

  if (input.contactId) {
    await supabaseAdmin
      .from("kolkap_whatsapp_contacts")
      .update({
        last_outbound_at: now,
        last_template_sent_at: now,
        updated_at: now,
      })
      .eq("id", input.contactId);
  }
}

export async function POST(req: Request) {
  const auth = await verifyAdmin(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json().catch(() => null);

    const phoneE164 = normalizePhone(body?.phoneE164 || body?.phone || body?.to);
    const campaignId = cleanText(body?.campaignId || body?.campaign_id) || null;
    const recipientId = cleanText(body?.recipientId || body?.recipient_id) || null;

    const campaignConfig = await getCampaignConfig(campaignId);

    const templateName = cleanText(
      body?.templateName ||
        body?.template_name ||
        campaignConfig?.template_name ||
        ""
    );

    const templateLanguage = cleanText(
      body?.templateLanguage ||
        body?.template_language ||
        campaignConfig?.template_language ||
        "en"
    );

    const templateCategory = cleanText(
      body?.templateCategory ||
        body?.template_category ||
        campaignConfig?.category ||
        "marketing"
    );

    const sendType =
      cleanText(body?.sendType || body?.send_type || campaignConfig?.campaign_type) ||
      "business_initiated";

    const sendProvider: SendProvider = "meta_cloud_api";

    const customerName =
      cleanText(body?.customerName || body?.customer_name) || null;

    const leadType = cleanText(body?.leadType || body?.lead_type) || "unknown";
    const source = cleanText(body?.source) || "template_send_api";

    const bodyVariables = normalizeBodyVariables(
      body?.bodyVariables || body?.body_variables || body?.variables
    );

    if (!phoneE164) {
      return Response.json(
        { success: false, error: "phoneE164 is required." },
        { status: 400 }
      );
    }

    if (!templateName) {
      return Response.json(
        { success: false, error: "templateName is required." },
        { status: 400 }
      );
    }

    if (!getMetaAccessToken() || !getMetaPhoneNumberId()) {
      return Response.json(
        {
          success: false,
          error:
            "Missing Meta environment variables. Check META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID.",
        },
        { status: 500 }
      );
    }

    const contact = await getOrCreateContact({
      phoneE164,
      customerName,
      leadType,
      source,
    });

    if (!contact?.id) {
      return Response.json(
        { success: false, error: "Failed to create or load WhatsApp contact." },
        { status: 500 }
      );
    }

    if (contact.opted_out_at || contact.status === "opted_out") {
      await markRecipient({
        recipientId,
        status: "skipped",
        skipReason: "Contact opted out.",
      });

      await insertSendLog({
        campaignId,
        recipientId,
        conversationId: null,
        contactId: contact.id,
        phoneE164,
        templateName,
        templateLanguage,
        templateCategory,
        sendType,
        sendProvider,
        status: "skipped",
        errorPayload: { reason: "Contact opted out." },
      });

      return Response.json({
        success: true,
        skipped: true,
        reason: "Contact opted out.",
      });
    }

    const conversation = await getOrCreateConversation({
      phoneE164,
      customerName,
      contactId: contact.id,
    });

    if (!conversation?.id) {
      return Response.json(
        {
          success: false,
          error: "Failed to create or load WhatsApp conversation.",
        },
        { status: 500 }
      );
    }

    const sendResult = await sendMetaTemplate({
      phoneE164,
      templateName,
      templateLanguage,
      bodyVariables,
    });

    if (!sendResult.success) {
      await markRecipient({
        recipientId,
        status: "failed",
        errorPayload: sendResult.result,
      });

      await insertSendLog({
        campaignId,
        recipientId,
        conversationId: conversation.id,
        contactId: contact.id,
        phoneE164,
        templateName,
        templateLanguage,
        templateCategory,
        sendType,
        sendProvider,
        status: "failed",
        errorPayload: sendResult.result,
        rawPayload: sendResult.payload,
      });

      return Response.json(
        {
          success: false,
          error: "Meta template send failed.",
          details: sendResult.result,
        },
        { status: 502 }
      );
    }

    const metaMessageId = sendResult.messageId;

    await saveOutboundTemplateMessage({
      conversationId: conversation.id,
      contactId: contact.id,
      phoneE164,
      customerName,
      templateName,
      templateLanguage,
      bodyVariables,
      sendType,
      metaMessageId,
      sendResult: sendResult.result,
    });

    await updateAfterSuccessfulSend({
      conversationId: conversation.id,
      contactId: contact.id,
      phoneE164,
      templateName,
    });

    await markRecipient({
      recipientId,
      status: "sent",
      metaMessageId,
    });

    await insertSendLog({
      campaignId,
      recipientId,
      conversationId: conversation.id,
      contactId: contact.id,
      phoneE164,
      templateName,
      templateLanguage,
      templateCategory,
      sendType,
      sendProvider,
      status: "sent",
      metaMessageId,
      rawPayload: {
        meta_payload: sendResult.payload,
        meta_result: sendResult.result,
      },
    });

    return Response.json({
      success: true,
      provider: "meta",
      sendProvider,
      phoneE164,
      conversationId: conversation.id,
      contactId: contact.id,
      templateName,
      templateLanguage,
      sendType,
      metaMessageId,
    });
  } catch (error) {
    console.error("Kolkap WhatsApp template send API error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send WhatsApp template.",
      },
      { status: 500 }
    );
  }
}