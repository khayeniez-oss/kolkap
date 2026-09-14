import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";
import { registerNewMetaWhatsAppPhone, subscribeMetaWhatsAppAccount, verifyMetaWhatsAppPhone } from "@/lib/whatsapp/metaOnboarding";
import { normalizeSignupPhone } from "@/lib/whatsapp/embeddedSignup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBodyString(
  body: Record<string, unknown>,
  snakeKey: string,
  camelKey: string
) {
  return cleanString(body[snakeKey]) || cleanString(body[camelKey]);
}

function getBodyBoolean(
  body: Record<string, unknown>,
  snakeKey: string,
  camelKey: string,
  fallback: boolean
) {
  if (typeof body[snakeKey] === "boolean") return body[snakeKey] as boolean;
  if (typeof body[camelKey] === "boolean") return body[camelKey] as boolean;
  return fallback;
}

function getTokenExpiry(seconds: unknown) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const metaAppId =
      process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET || process.env.META_WHATSAPP_APP_SECRET;
    const graphVersion = process.env.META_GRAPH_VERSION || "v23.0";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase server configuration is missing.",
        },
        { status: 500 }
      );
    }

    if (!metaAppId || !metaAppSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta Embedded Signup configuration is missing.",
        },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    const bearerToken = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!bearerToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Please log in again before connecting WhatsApp.",
        },
        { status: 401 }
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const body =
      typeof rawBody === "object" && rawBody !== null
        ? (rawBody as Record<string, unknown>)
        : {};

    const code = cleanString(body.code);
    const numberOption = cleanString(body.number_option);
    const expectedPhone = normalizeSignupPhone(body.expected_phone_number);

    if (!["existing_business_app", "new_number"].includes(numberOption) || !expectedPhone) {
      return NextResponse.json(
        { success: false, error: "Choose a number option and enter your phone number with country code." },
        { status: 400 }
      );
    }

    const workspaceId = getBodyString(body, "workspace_id", "workspaceId");
    const phoneNumberId = getBodyString(
      body,
      "phone_number_id",
      "phoneNumberId"
    );
    const wabaId = getBodyString(body, "waba_id", "wabaId");

    const connectionLabel = getBodyString(
      body,
      "connection_label",
      "connectionLabel"
    );

    const selectedAiStaffId = getBodyString(
      body,
      "selected_ai_staff_id",
      "selectedAiStaffId"
    );

    const notes = cleanString(body.notes);

    const handoverEnabled = getBodyBoolean(
      body,
      "handover_enabled",
      "handoverEnabled",
      true
    );
    const isPrimary = getBodyBoolean(body, "is_primary", "isPrimary", false);

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Workspace is required.",
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta connection code is missing.",
        },
        { status: 400 }
      );
    }

    if (!/^\d+$/.test(phoneNumberId) || !/^\d+$/.test(wabaId)) {
      return NextResponse.json(
        { success: false, error: "Meta did not return a complete WhatsApp account and phone number. Please finish signup again." },
        { status: 400 }
      );
    }

    if (phoneNumberId === process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim()) {
      return NextResponse.json(
        { success: false, error: "Kolkap's support number cannot be linked as a workspace number." },
        { status: 409 }
      );
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser(bearerToken);

    if (userError || !user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Please log in again before connecting WhatsApp.",
        },
        { status: 401 }
      );
    }

    const { data: workspace, error: workspaceError } = await userSupabase
      .from("business_workspaces")
      .select("id, owner_user_id")
      .eq("id", workspaceId)
      .single();

    if (workspaceError || !workspace || workspace.owner_user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Workspace access denied.",
        },
        { status: 403 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (selectedAiStaffId) {
      const { data: staff, error: staffError } = await adminSupabase
        .from("ai_staff").select("id").eq("id", selectedAiStaffId)
        .eq("workspace_id", workspaceId).is("deleted_at", null).maybeSingle();
      if (staffError) throw staffError;
      if (!staff) {
        return NextResponse.json(
          { success: false, error: "Choose AI staff from this workspace." },
          { status: 400 }
        );
      }
    }

    const { data: existingByPhone, error: existingError } = await adminSupabase
      .from("workspace_whatsapp_connections")
      .select("id,workspace_id,status,selected_ai_staff_id,ai_enabled,auto_reply_enabled,is_primary")
      .eq("meta_phone_number_id", phoneNumberId).maybeSingle();
    if (existingError) throw existingError;
    if (existingByPhone && existingByPhone.workspace_id !== workspaceId) {
      return NextResponse.json(
        { success: false, error: "This WhatsApp number is already linked to another workspace." },
        { status: 409 }
      );
    }

    const tokenUrl = new URL(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token`
    );

    tokenUrl.searchParams.set("client_id", metaAppId);
    tokenUrl.searchParams.set("client_secret", metaAppSecret);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const tokenData = await tokenResponse.json().catch(() => ({}));

    if (!tokenResponse.ok || !cleanString(tokenData?.access_token)) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta authorization could not be completed. Please restart WhatsApp signup.",
        },
        { status: 502 }
      );
    }

    let metaPhoneDetails;
    try {
      metaPhoneDetails = await verifyMetaWhatsAppPhone({
        graphVersion, phoneNumberId, wabaId, accessToken: tokenData.access_token,
      });

      if (metaPhoneDetails.display_phone_number?.replace(/\D/g, "") !== expectedPhone.slice(1)) {
        return NextResponse.json(
          { success: false, error: "Meta returned a different phone number. Return to setup and connect the number you entered." },
          { status: 400 }
        );
      }
      if (numberOption === "existing_business_app" &&
          (metaPhoneDetails.is_on_biz_app !== true || metaPhoneDetails.platform_type !== "CLOUD_API")) {
        return NextResponse.json(
          { success: false, error: "Meta has not confirmed a connection that keeps your WhatsApp Business app active. You can try again or use a separate new number. Keep your current WhatsApp account." },
          { status: 409 }
        );
      }
      if (numberOption === "new_number" && metaPhoneDetails.is_on_biz_app !== false) {
        return NextResponse.json(
          { success: false, error: "This number already uses the WhatsApp Business app. Choose the existing-number option, or use a different new number." },
          { status: 409 }
        );
      }
      await subscribeMetaWhatsAppAccount({
        graphVersion, wabaId, accessToken: tokenData.access_token,
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "WhatsApp account verification failed." },
        { status: 502 }
      );
    }

    const finalDisplayPhoneNumber =
      metaPhoneDetails.display_phone_number || null;

    const finalConnectionLabel =
      connectionLabel || metaPhoneDetails.verified_name || "WhatsApp";

    // A new link is not proof that Meta is delivering messages to this server.
    // The first verified inbound message activates a securely saved pending link.
    const nextStatus = existingByPhone?.status === "connected" ? "connected" : "pending";
    const now = new Date().toISOString();
    let existingConnectionId = existingByPhone?.id || "";

    if (!existingConnectionId) {
      const { data: latestPending, error: pendingError } = await adminSupabase
        .from("workspace_whatsapp_connections")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("provider", "meta")
        .eq("status", "pending")
        .is("meta_phone_number_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pendingError) throw pendingError;
      existingConnectionId = latestPending?.id || "";
    }

    const connectionPayload = {
      workspace_id: workspaceId,
      owner_user_id: user.id,
      provider: "meta",
      status: "pending",
      connection_label: finalConnectionLabel,
      display_phone_number: finalDisplayPhoneNumber,
      meta_phone_number_id: phoneNumberId || null,
      meta_waba_id: wabaId || null,
      selected_ai_staff_id: existingByPhone?.selected_ai_staff_id || null,
      ai_enabled: existingByPhone?.ai_enabled ?? false,
      auto_reply_enabled: false,
      handover_enabled: handoverEnabled,
      is_primary: false,
      notes: notes || null,
      last_status_at: now,
      last_error_at: null,
      last_error_code: null,
      last_error_message: null,
      updated_at: now,
    };

    let connection = null;
    let connectionError = null;

    if (existingConnectionId) {
      const result = await adminSupabase
        .from("workspace_whatsapp_connections")
        .update(connectionPayload)
        .eq("id", existingConnectionId)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single();

      connection = result.data;
      connectionError = result.error;
    } else {
      const result = await adminSupabase
        .from("workspace_whatsapp_connections")
        .insert(connectionPayload)
        .select("*")
        .single();

      connection = result.data;
      connectionError = result.error;
    }

    if (connectionError || !connection?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            connectionError?.message ||
            "WhatsApp connection could not be saved.",
        },
        { status: 500 }
      );
    }

    const { error: secretError } = await adminSupabase
      .from("whatsapp_connection_secrets")
      .upsert(
        {
          connection_id: connection.id,
          workspace_id: workspaceId,
          provider: "meta",
          meta_access_token: tokenData.access_token,
          meta_token_type: tokenData.token_type || "bearer",
          meta_token_expires_at: getTokenExpiry(tokenData.expires_in),
          updated_at: now,
        },
        { onConflict: "connection_id" }
      );

    if (secretError) {
      await adminSupabase
        .from("workspace_whatsapp_connections")
        .update({
          status: "failed",
          last_error_at: now,
          last_error_code: "secret_save_failed",
          last_error_message: "WhatsApp credentials could not be saved securely. Please reconnect.",
          updated_at: now,
        })
        .eq("id", connection.id)
        .eq("workspace_id", workspaceId);

      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp token could not be saved securely.",
        },
        { status: 500 }
      );
    }

    // Business-app Coexistence registers the number during Meta's pairing flow.
    // Never send those numbers to the standard registration endpoint.
    if (numberOption === "new_number" && metaPhoneDetails.status !== "CONNECTED") {
      try {
        const { data: savedPin, error: pinReadError } = await adminSupabase
          .from("whatsapp_number_registration_secrets")
          .select("registration_pin")
          .eq("connection_id", connection.id)
          .eq("workspace_id", workspaceId)
          .maybeSingle();
        if (pinReadError) throw pinReadError;
        const pin = savedPin?.registration_pin || String(randomInt(0, 1000000)).padStart(6, "0");
        if (!savedPin) {
          const { error: pinSaveError } = await adminSupabase
            .from("whatsapp_number_registration_secrets")
            .insert({ connection_id: connection.id, workspace_id: workspaceId, registration_pin: pin });
          if (pinSaveError) throw pinSaveError;
        }
        // Save the security PIN before activating the new number, so a retry
        // can use the same PIN. This table is accessible only on the server.
        await registerNewMetaWhatsAppPhone({
          graphVersion, phoneNumberId, accessToken: tokenData.access_token, pin,
        });
      } catch {
        await adminSupabase.from("workspace_whatsapp_connections")
          .update({ status: "failed", last_error_code: "number_activation_failed",
            last_error_message: "New number activation did not finish. Please reconnect or contact support.",
            last_error_at: now, updated_at: now })
          .eq("id", connection.id).eq("workspace_id", workspaceId);
        return NextResponse.json(
          { success: false, error: "New number activation did not finish. Please reconnect or contact support." },
          { status: 502 }
        );
      }
    }

    // Do not demote another number until this connection and its token are saved.
    if (isPrimary) {
      const { error: primaryError } = await adminSupabase
        .from("workspace_whatsapp_connections")
        .update({ is_primary: false, updated_at: now })
        .eq("workspace_id", workspaceId).neq("id", connection.id);
      if (primaryError) throw primaryError;
    }
    const { data: finalized, error: finalizeError } = await adminSupabase
      .from("workspace_whatsapp_connections")
      .update({ status: nextStatus, is_primary: isPrimary, updated_at: now })
      .eq("id", connection.id).eq("workspace_id", workspaceId)
      .select("*").single();
    if (finalizeError) throw finalizeError;

    return NextResponse.json({
      success: true,
      ok: true,
      status: nextStatus,
      connection: finalized,
      notice:
        nextStatus === "connected"
          ? "WhatsApp reconnected. Test a reply before enabling auto-reply."
          : "Number linked. Choose your AI staff below, then send a message from another phone to check delivery. Auto-reply stays off until you enable it.",
    });
  } catch (error) {
    // Do not log OAuth URLs, provider bodies or token-bearing exceptions.
    console.error("Meta WhatsApp embedded signup could not complete.",
      error && typeof error === "object" && "code" in error ? String(error.code) : "request_failed");

    return NextResponse.json(
      {
        success: false,
        error: "WhatsApp connection could not be completed. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
