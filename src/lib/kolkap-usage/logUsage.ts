import "server-only";

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

function safeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return fallback;
  }

  return Math.floor(numberValue);
}

function safeEventCount(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 1) {
    return 1;
  }

  return Math.floor(numberValue);
}

export async function logWorkspaceUsage(input: LogWorkspaceUsageInput) {
  if (!input.workspaceId) {
    throw new Error("Workspace ID is required to record usage.");
  }

  const supabase = getAdminSupabase();

  const { data: workspace, error: workspaceError } = await supabase
    .from("business_workspaces")
    .select("owner_user_id")
    .eq("id", input.workspaceId)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(
      `Workspace owner could not be loaded: ${workspaceError.message}`
    );
  }

  if (!workspace?.owner_user_id) {
    throw new Error("Workspace owner could not be found.");
  }

  const creditsUsed = safeNumber(input.creditsUsed, 0);
  const eventCount = safeEventCount(input.eventCount);
  const status = input.status || "success";

  const { error } = await supabase.rpc("record_workspace_usage", {
    p_workspace_id: input.workspaceId,
    p_owner_user_id: workspace.owner_user_id,
    p_user_id: input.userId || null,
    p_event_type: input.eventType,
    p_channel: input.channel,
    p_source_page: input.sourcePage,
    p_credits_used: creditsUsed,
    p_event_count: eventCount,
    p_status: status,
    p_metadata: input.metadata || {},
  });

  if (error) {
    console.error("Workspace usage recording failed.", {
      workspaceId: input.workspaceId,
      eventType: input.eventType,
      creditsUsed,
      error: error.message,
    });

    throw new Error(`Usage could not be recorded: ${error.message}`);
  }
}
