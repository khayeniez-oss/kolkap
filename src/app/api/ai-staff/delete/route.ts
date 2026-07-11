import { NextResponse } from "next/server";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import {
  cleanText,
  getAdminSupabase,
  getWorkspace,
  refreshWorkspaceAiStaffUsed,
  userCanAccessWorkspace,
  verifyRequestUser,
} from "@/lib/kolkap-ai-staff/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAiStaff(staffId: string) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("ai_staff")
    .select("*")
    .eq("id", staffId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as Record<string, unknown> | null;
}

async function isAiStaffConnected({
  workspaceId,
  staffId,
}: {
  workspaceId: string;
  staffId: string;
}) {
  const supabaseAdmin = getAdminSupabase();

  const [whatsappResult, websiteChatResult] = await Promise.all([
    supabaseAdmin
      .from("workspace_whatsapp_connections")
      .select("id, connection_label, display_phone_number, status")
      .eq("workspace_id", workspaceId)
      .eq("selected_ai_staff_id", staffId)
      .limit(1)
      .maybeSingle(),

    supabaseAdmin
      .from("workspace_website_chat_settings")
      .select("id, widget_title, is_active")
      .eq("workspace_id", workspaceId)
      .eq("selected_ai_staff_id", staffId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (whatsappResult.error) {
    throw whatsappResult.error;
  }

  if (websiteChatResult.error) {
    throw websiteChatResult.error;
  }

  if (whatsappResult.data?.id) {
    return {
      connected: true,
      channel: "whatsapp",
      label:
        whatsappResult.data.connection_label ||
        whatsappResult.data.display_phone_number ||
        "WhatsApp",
    };
  }

  if (websiteChatResult.data?.id) {
    return {
      connected: true,
      channel: "website_chat",
      label: websiteChatResult.data.widget_title || "Website Chat",
    };
  }

  return {
    connected: false,
    channel: "",
    label: "",
  };
}

export async function POST(req: Request) {
  const auth = await verifyRequestUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const staffId = cleanText(body.ai_staff_id || body.id);

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: "AI staff is required." },
        { status: 400 }
      );
    }

    const staff = await getAiStaff(staffId);

    if (!staff?.id || staff.deleted_at) {
      return NextResponse.json(
        { success: false, error: "AI staff not found." },
        { status: 404 }
      );
    }

    const workspaceId = cleanText(staff.workspace_id);
    const workspace = await getWorkspace(workspaceId);

    if (!workspace?.id) {
      return NextResponse.json(
        { success: false, error: "Workspace not found." },
        { status: 404 }
      );
    }

    const canAccess = await userCanAccessWorkspace({
      userId: auth.userId!,
      userEmail: auth.userEmail,
      workspace,
    });

    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this workspace." },
        { status: 403 }
      );
    }

    const connection = await isAiStaffConnected({
      workspaceId,
      staffId,
    });

    if (connection.connected) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This AI staff is connected to a channel. Please assign another AI staff or turn off the channel before deleting.",
          error_code: "ai_staff_connected",
          channel: connection.channel,
          label: connection.label,
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const supabaseAdmin = getAdminSupabase();

    const { error: deleteError } = await supabaseAdmin
      .from("ai_staff")
      .update({
        deleted_at: now,
        deleted_by_user_id: auth.userId || null,
        status: "deleted",
        updated_at: now,
      })
      .eq("id", staffId)
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      throw deleteError;
    }

    await logWorkspaceUsage({
      workspaceId,
      userId: auth.userId || null,
      eventType: "ai_staff_deleted",
      channel: cleanText(staff.channel || staff.primary_channel || "ai_staff"),
      sourcePage: "ai_staff",
      creditsUsed: 0,
      eventCount: 1,
      status: "success",
      metadata: {
        ai_staff_id: staffId,
        credit_rule: "ai_staff_delete_no_charge",
      },
    });

    const aiStaffUsed = await refreshWorkspaceAiStaffUsed(workspaceId);

    return NextResponse.json({
      success: true,
      deleted: true,
      ai_staff_id: staffId,
      ai_staff_used: aiStaffUsed,
      credits_used: 0,
    });
  } catch (error) {
    console.error("AI Staff delete error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI staff could not be deleted.",
      },
      { status: 500 }
    );
  }
}
