import { getAdminSupabase } from "@/lib/kolkap-ai-staff/server";

export type ChannelAiType = "website_chat" | "whatsapp";

export type ChannelAiAssignmentRow = {
  id: string;
  workspace_id: string;
  channel_type: ChannelAiType;
  channel_connection_id: string;
  ai_staff_id: string;
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
  routing_notes: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AiStaffChannelCandidate = {
  id: string;
  name: string | null;
  role: string | null;
  status: string | null;
  ai_instruction: string | null;
  business_knowledge: string | null;
};

export type ChannelAiTeamMember = {
  assignment: ChannelAiAssignmentRow;
  aiStaff: AiStaffChannelCandidate | null;
};

export function normalizeChannelAiType(value: unknown): ChannelAiType | null {
  const clean = String(value || "").trim().toLowerCase();

  if (clean === "website_chat") return "website_chat";
  if (clean === "whatsapp") return "whatsapp";

  return null;
}

export function normalizeAiStaffIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const ids: string[] = [];

  for (const item of value) {
    const id = String(item || "").trim();

    if (!id || seen.has(id)) continue;

    seen.add(id);
    ids.push(id);

    if (ids.length >= 50) break;
  }

  return ids;
}

export async function loadChannelAiAssignments({
  workspaceId,
  channelType,
  channelConnectionId,
}: {
  workspaceId: string;
  channelType: ChannelAiType;
  channelConnectionId: string;
}) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("channel_ai_assignments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("channel_type", channelType)
    .eq("channel_connection_id", channelConnectionId)
    .eq("is_enabled", true)
    .order("is_default", { ascending: false })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as ChannelAiAssignmentRow[];
}

export async function loadChannelAiTeam({
  workspaceId,
  channelType,
  channelConnectionId,
}: {
  workspaceId: string;
  channelType: ChannelAiType;
  channelConnectionId: string;
}): Promise<ChannelAiTeamMember[]> {
  const assignments = await loadChannelAiAssignments({
    workspaceId,
    channelType,
    channelConnectionId,
  });

  const aiStaffIds = assignments.map((assignment) => assignment.ai_staff_id);

  if (aiStaffIds.length === 0) {
    return [];
  }

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("ai_staff")
    .select("id,name,role,status,ai_instruction,business_knowledge")
    .eq("workspace_id", workspaceId)
    .in("id", aiStaffIds)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  const staffById = new Map<string, AiStaffChannelCandidate>();

  ((data || []) as AiStaffChannelCandidate[]).forEach((staff) => {
    staffById.set(staff.id, staff);
  });

  return assignments.map((assignment) => ({
    assignment,
    aiStaff: staffById.get(assignment.ai_staff_id) || null,
  }));
}

export async function chooseDefaultChannelAiStaffId({
  workspaceId,
  channelType,
  channelConnectionId,
  fallbackAiStaffId,
}: {
  workspaceId: string;
  channelType: ChannelAiType;
  channelConnectionId: string;
  fallbackAiStaffId?: string | null;
}) {
  const assignments = await loadChannelAiAssignments({
    workspaceId,
    channelType,
    channelConnectionId,
  });

  const defaultAssignment =
    assignments.find((assignment) => assignment.is_default) || assignments[0];

  return defaultAssignment?.ai_staff_id || fallbackAiStaffId || null;
}

export async function replaceChannelAiAssignments({
  workspaceId,
  channelType,
  channelConnectionId,
  aiStaffIds,
  defaultAiStaffId,
  userId,
}: {
  workspaceId: string;
  channelType: ChannelAiType;
  channelConnectionId: string;
  aiStaffIds: string[];
  defaultAiStaffId?: string | null;
  userId?: string | null;
}) {
  const supabase = getAdminSupabase();

  const normalizedIds = normalizeAiStaffIds(aiStaffIds);
  const normalizedDefaultId =
    defaultAiStaffId && normalizedIds.includes(defaultAiStaffId)
      ? defaultAiStaffId
      : normalizedIds[0] || null;

  const { error: deleteError } = await supabase
    .from("channel_ai_assignments")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("channel_type", channelType)
    .eq("channel_connection_id", channelConnectionId);

  if (deleteError) {
    throw deleteError;
  }

  if (normalizedIds.length === 0) {
    return [];
  }

  const rows = normalizedIds.map((aiStaffId, index) => ({
    workspace_id: workspaceId,
    channel_type: channelType,
    channel_connection_id: channelConnectionId,
    ai_staff_id: aiStaffId,
    is_enabled: true,
    is_default: aiStaffId === normalizedDefaultId,
    priority: (index + 1) * 10,
    routing_notes: null,
    created_by_user_id: userId || null,
  }));

  const { data, error: insertError } = await supabase
    .from("channel_ai_assignments")
    .insert(rows)
    .select("*");

  if (insertError) {
    throw insertError;
  }

  return (data || []) as ChannelAiAssignmentRow[];
}
