import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function getTokenExpiry(seconds: unknown) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return null;
  }

  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const metaAppId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;
    const graphVersion = process.env.META_GRAPH_VERSION || "v23.0";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing." },
        { status: 500 }
      );
    }

    if (!metaAppId || !metaAppSecret) {
      return NextResponse.json(
        { error: "Meta Embedded Signup configuration is missing." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Please log in again before connecting WhatsApp." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    const code = cleanString(body?.code);
    const workspaceId = cleanString(body?.workspaceId);
    const phoneNumberId = cleanString(body?.phoneNumberId);
    const wabaId = cleanString(body?.wabaId);
    const businessId = cleanString(body?.businessId);
    const displayPhoneNumber = cleanString(body?.displayPhoneNumber);
    const selectedAiStaffId = cleanString(body?.selectedAiStaffId);
    const notes = cleanString(body?.notes);

    const aiEnabled = cleanBoolean(body?.aiEnabled, false);
    const autoReplyEnabled = cleanBoolean(body?.autoReplyEnabled, false);
    const handoverEnabled = cleanBoolean(body?.handoverEnabled, true);

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace is required." },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Meta connection code is missing." },
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
        { error: "Please log in again before connecting WhatsApp." },
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
        { error: "Workspace access denied." },
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
    });

    const tokenData = await tokenResponse.json().catch(() => ({}));

    if (!tokenResponse.ok || !tokenData?.access_token) {
      return NextResponse.json(
        {
          error:
            tokenData?.error?.message ||
            "Meta connection could not be completed.",
          meta_error: tokenData?.error || null,
        },
        { status: 502 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const nextStatus = phoneNumberId && wabaId ? "connected" : "pending";

    const { data: connection, error: connectionError } = await adminSupabase
      .from("workspace_whatsapp_connections")
      .upsert(
        {
          workspace_id: workspaceId,
          owner_user_id: user.id,
          provider: "meta",
          status: nextStatus,
          display_phone_number: displayPhoneNumber || null,
          meta_phone_number_id: phoneNumberId || null,
          meta_waba_id: wabaId || null,
          meta_business_id: businessId || null,
          selected_ai_staff_id: selectedAiStaffId || null,
          ai_enabled: aiEnabled,
          auto_reply_enabled: autoReplyEnabled,
          handover_enabled: handoverEnabled,
          notes: notes || null,
          last_status_at: new Date().toISOString(),
          last_error_at: null,
          last_error_code: null,
          last_error_message: null,
        },
        { onConflict: "workspace_id" }
      )
      .select("*")
      .single();

    if (connectionError || !connection?.id) {
      return NextResponse.json(
        {
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
        },
        { onConflict: "connection_id" }
      );

    if (secretError) {
      return NextResponse.json(
        { error: "WhatsApp token could not be saved securely." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      connection,
    });
  } catch {
    return NextResponse.json(
      { error: "WhatsApp connection could not be completed." },
      { status: 500 }
    );
  }
}