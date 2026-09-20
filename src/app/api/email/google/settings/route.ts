import {
  channelAccess,
  channelErrorResponse,
  channelRpc,
  ChannelError,
} from "@/lib/whatsapp/server";
import { isUuid } from "@/lib/whatsapp/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const workspaceId = new URL(request.url).searchParams.get("workspace_id") || "";
    const { db } = await channelAccess(request, workspaceId, "settings");
    const [{ data: connections, error }, { data: assignments, error: assignmentError }] =
      await Promise.all([
        db
          .from("workspace_email_connections")
          .select("*")
          .eq("workspace_id", workspaceId)
          .neq("status", "revoked")
          .order("created_at", { ascending: false }),
        db
          .from("channel_ai_assignments")
          .select("channel_connection_id,ai_staff_id,is_default,is_enabled,priority")
          .eq("workspace_id", workspaceId)
          .eq("channel_type", "email")
          .order("priority", { ascending: true }),
      ]);
    if (error || assignmentError) {
      throw new ChannelError("Email settings could not be loaded.", 503);
    }
    return Response.json({ success: true, connections, assignments });
  } catch (error) {
    return channelErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = typeof body.workspace_id === "string" ? body.workspace_id : "";
    const connectionId = typeof body.connection_id === "string" ? body.connection_id : "";
    const { user, workspace } = await channelAccess(request, workspaceId, "settings");
    if (workspace.owner_user_id !== user.id) {
      throw new ChannelError(
        "Only the workspace owner can change Email settings.",
        403
      );
    }
    if (!isUuid(connectionId)) throw new ChannelError("Choose a valid mailbox.");

    const staffIds = Array.isArray(body.staff_ids)
      ? [...new Set(body.staff_ids.filter(isUuid))]
      : [];
    const selectedStaffId = isUuid(body.selected_ai_staff_id)
      ? body.selected_ai_staff_id
      : null;
    if (selectedStaffId && !staffIds.includes(selectedStaffId)) {
      staffIds.unshift(selectedStaffId);
    }
    if (body.ai_enabled === true && !selectedStaffId) {
      throw new ChannelError("Choose AI staff before enabling Email AI.");
    }

    const connection = await channelRpc("save_workspace_email_settings", {
      p_connection_id: connectionId,
      p_workspace_id: workspaceId,
      p_actor_user_id: user.id,
      p_settings: {
        connection_label:
          typeof body.connection_label === "string"
            ? body.connection_label.trim().slice(0, 100)
            : "",
        selected_ai_staff_id: selectedStaffId,
        ai_enabled: body.ai_enabled === true,
        auto_reply_enabled: body.auto_reply_enabled === true,
        handover_enabled: body.handover_enabled !== false,
        is_primary: body.is_primary !== false,
      },
      p_staff_ids: staffIds,
    });
    return Response.json({ success: true, connection });
  } catch (error) {
    return channelErrorResponse(error);
  }
}
