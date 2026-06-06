import { createClient } from "@supabase/supabase-js";

type UsageStatus = "success" | "failed" | "pending";

type LogWorkspaceUsageInput = {
  workspaceId: string;
  userId?: string | null;
  eventType: string;
  channel: string;
  sourcePage: string;
  creditsUsed?: number;
  eventCount?: number;
  status?: UsageStatus;
  metadata?: Record<string, unknown>;
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

export async function logWorkspaceUsage(input: LogWorkspaceUsageInput) {
  try {
    if (!input.workspaceId) return;

    const supabase = getAdminSupabase();

    const { data: workspace, error: workspaceError } = await supabase
      .from("business_workspaces")
      .select("owner_user_id")
      .eq("id", input.workspaceId)
      .maybeSingle();

    if (workspaceError || !workspace?.owner_user_id) {
      console.error("Usage log skipped. Workspace owner not found.", {
        workspaceId: input.workspaceId,
        error: workspaceError?.message,
      });
      return;
    }

    const { error } = await supabase.from("workspace_usage_events").insert({
      workspace_id: input.workspaceId,
      owner_user_id: workspace.owner_user_id,
      user_id: input.userId || null,
      event_type: input.eventType,
      channel: input.channel,
      source_page: input.sourcePage,
      credits_used: input.creditsUsed ?? 0,
      event_count: input.eventCount ?? 1,
      status: input.status || "success",
      metadata: input.metadata || {},
    });

    if (error) {
      console.error("Usage log failed.", error.message);
    }
  } catch (error) {
    console.error(
      "Usage log error.",
      error instanceof Error ? error.message : error
    );
  }
}