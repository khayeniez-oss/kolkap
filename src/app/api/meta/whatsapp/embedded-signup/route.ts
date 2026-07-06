import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
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
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return null;
  }

  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function getMetaPhoneDetails({
  graphVersion,
  phoneNumberId,
  accessToken,
}: {
  graphVersion: string;
  phoneNumberId: string;
  accessToken: string;
}) {
  if (!phoneNumberId || !accessToken) {
    return {
      display_phone_number: "",
      verified_name: "",
    };
  }

  try {
    const url = new URL(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}`);
    url.searchParams.set("fields", "display_phone_number,verified_name");
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        display_phone_number: "",
        verified_name: "",
      };
    }

    return {
      display_phone_number: cleanString(data?.display_phone_number),
      verified_name: cleanString(data?.verified_name),
    };
  } catch {
    return {
      display_phone_number: "",
      verified_name: "",
    };
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const metaAppId =
      process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;
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

    if (!authHeader) {
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

    const workspaceId = getBodyString(body, "workspace_id", "workspaceId");
    const phoneNumberId = getBodyString(
      body,
      "phone_number_id",
      "phoneNumberId"
    );
    const wabaId = getBodyString(body, "waba_id", "wabaId");
    const businessId = getBodyString(body, "business_id", "businessId");

    const displayPhoneNumber =
      getBodyString(body, "display_phone_number", "displayPhoneNumber") ||
      getBodyString(body, "phone_number", "phoneNumber");

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

    const aiEnabled = getBodyBoolean(body, "ai_enabled", "aiEnabled", true);
    const autoReplyEnabled = getBodyBoolean(
      body,
      "auto_reply_enabled",
      "autoReplyEnabled",
      false
    );
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

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

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

    const tokenUrl = new URL(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token`
    );

    tokenUrl.searchParams.set("client_id", metaAppId);
    tokenUrl.searchParams.set("client_secret", metaAppSecret);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const tokenData = await tokenResponse.json().catch(() => ({}));

    if (!tokenResponse.ok || !tokenData?.access_token) {
      return NextResponse.json(
        {
          success: false,
          error:
            tokenData?.error?.message ||
            "Meta connection could not be completed.",
          meta_error: tokenData?.error || null,
        },
        { status: 502 }
      );
    }

    const metaPhoneDetails = await getMetaPhoneDetails({
      graphVersion,
      phoneNumberId,
      accessToken: tokenData.access_token,
    });

    const finalDisplayPhoneNumber =
      displayPhoneNumber || metaPhoneDetails.display_phone_number || null;

    const finalConnectionLabel =
      connectionLabel || metaPhoneDetails.verified_name || "WhatsApp";

    const nextStatus = phoneNumberId && wabaId ? "connected" : "pending";
    const now = new Date().toISOString();

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    if (isPrimary) {
      await adminSupabase
        .from("workspace_whatsapp_connections")
        .update({
          is_primary: false,
          updated_at: now,
        })
        .eq("workspace_id", workspaceId);
    }

    let existingConnectionId = "";

    if (phoneNumberId) {
      const { data: existingByPhone } = await adminSupabase
        .from("workspace_whatsapp_connections")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("meta_phone_number_id", phoneNumberId)
        .maybeSingle();

      existingConnectionId = existingByPhone?.id || "";
    }

    if (!existingConnectionId) {
      const { data: latestPending } = await adminSupabase
        .from("workspace_whatsapp_connections")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("provider", "meta")
        .eq("status", "pending")
        .is("meta_phone_number_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      existingConnectionId = latestPending?.id || "";
    }

    const connectionPayload = {
      workspace_id: workspaceId,
      owner_user_id: user.id,
      provider: "meta",
      status: nextStatus,
      connection_label: finalConnectionLabel,
      display_phone_number: finalDisplayPhoneNumber,
      meta_phone_number_id: phoneNumberId || null,
      meta_waba_id: wabaId || null,
      meta_business_id: businessId || null,
      selected_ai_staff_id: selectedAiStaffId || null,
      ai_enabled: aiEnabled,
      auto_reply_enabled: autoReplyEnabled,
      handover_enabled: handoverEnabled,
      is_primary: isPrimary,
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
          last_error_message: secretError.message,
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

    return NextResponse.json({
      success: true,
      ok: true,
      status: nextStatus,
      connection,
      notice:
        nextStatus === "connected"
          ? "WhatsApp connected successfully."
          : "WhatsApp token saved, but phone number ID or WABA ID is still pending.",
    });
  } catch (error) {
    console.error("Meta WhatsApp embedded signup error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "WhatsApp connection could not be completed.",
      },
      { status: 500 }
    );
  }
}