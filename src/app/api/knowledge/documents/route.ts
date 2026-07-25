import { NextResponse } from "next/server";

import {
  cleanText,
  getAdminSupabase,
  getWorkspace,
  userCanAccessWorkspace,
  verifyRequestUser,
} from "@/lib/kolkap-ai-staff/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await verifyRequestUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const url = new URL(req.url);
    const workspaceId = cleanText(url.searchParams.get("workspace_id"));
    const status = cleanText(url.searchParams.get("status")).toLowerCase();

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Workspace is required.",
        },
        { status: 400 }
      );
    }

    const workspace = await getWorkspace(workspaceId);

    if (!workspace?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Workspace not found.",
        },
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
        {
          success: false,
          error: "You do not have access to this workspace.",
        },
        { status: 403 }
      );
    }

    const allowedStatuses = new Set([
      "uploaded",
      "processing",
      "ready",
      "failed",
      "archived",
    ]);

    if (status && !allowedStatuses.has(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid document status.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminSupabase();

    let query = supabaseAdmin
      .from("workspace_knowledge_documents")
      .select(
        [
          "id",
          "workspace_id",
          "owner_user_id",
          "file_name",
          "storage_path",
          "mime_type",
          "file_size",
          "status",
          "processing_error",
          "processed_at",
          "created_at",
          "updated_at",
        ].join(",")
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    } else {
      query = query.neq("status", "archived");
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      documents: data ?? [],
    });
  } catch (error) {
    console.error("Knowledge document list error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Knowledge documents could not be loaded.",
      },
      { status: 500 }
    );
  }
}
