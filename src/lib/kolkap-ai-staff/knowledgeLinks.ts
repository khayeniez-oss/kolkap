import { cleanText, getAdminSupabase } from "@/lib/kolkap-ai-staff/server";

type ParsedKnowledgeSelection = {
  hasKnowledgeSelection: boolean;
  knowledgeIds: string[];
};

type ReplaceKnowledgeLinksInput = {
  workspaceId: string;
  aiStaffId: string;
  knowledgeIds: string[];
  userId?: string | null;
};

function normalizeKnowledgeIds(value: unknown) {
  let rawIds: unknown[] = [];

  if (Array.isArray(value)) {
    rawIds = value;
  } else if (typeof value === "string") {
    rawIds = value.split(",");
  }

  return Array.from(
    new Set(
      rawIds
        .map((item) => cleanText(item))
        .filter(Boolean)
    )
  ).slice(0, 50);
}

export function parseKnowledgeIdsFromBody(
  body: Record<string, unknown>
): ParsedKnowledgeSelection {
  const candidates = [
    body.knowledge_ids,
    body.knowledgeIds,
    body.selected_knowledge_ids,
    body.selectedKnowledgeIds,
  ];

  const hasKnowledgeSelection = candidates.some(
    (value) => value !== undefined
  );

  const selectedValue = candidates.find((value) => value !== undefined);

  return {
    hasKnowledgeSelection,
    knowledgeIds: normalizeKnowledgeIds(selectedValue),
  };
}

export async function replaceAiStaffKnowledgeLinks({
  workspaceId,
  aiStaffId,
  knowledgeIds,
  userId,
}: ReplaceKnowledgeLinksInput) {
  const cleanWorkspaceId = cleanText(workspaceId);
  const cleanAiStaffId = cleanText(aiStaffId);
  const selectedKnowledgeIds = normalizeKnowledgeIds(knowledgeIds);

  if (!cleanWorkspaceId || !cleanAiStaffId) {
    return [];
  }

  const supabaseAdmin = getAdminSupabase();

  if (selectedKnowledgeIds.length > 0) {
    const { data: validKnowledgeRows, error: knowledgeError } =
      await supabaseAdmin
        .from("workspace_knowledge_base")
        .select("id,status")
        .eq("workspace_id", cleanWorkspaceId)
        .in("id", selectedKnowledgeIds);

    if (knowledgeError) {
      throw knowledgeError;
    }

    const validKnowledgeIds = new Set(
      (validKnowledgeRows || [])
        .filter((row) => cleanText(row.status).toLowerCase() !== "archived")
        .map((row) => cleanText(row.id))
        .filter(Boolean)
    );

    const hasInvalidKnowledge = selectedKnowledgeIds.some(
      (knowledgeId) => !validKnowledgeIds.has(knowledgeId)
    );

    if (hasInvalidKnowledge) {
      throw new Error(
        "Some selected knowledge items could not be found for this workspace."
      );
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("ai_staff_knowledge_links")
    .delete()
    .eq("workspace_id", cleanWorkspaceId)
    .eq("ai_staff_id", cleanAiStaffId);

  if (deleteError) {
    throw deleteError;
  }

  if (selectedKnowledgeIds.length === 0) {
    return [];
  }

  const rows = selectedKnowledgeIds.map((knowledgeId) => ({
    workspace_id: cleanWorkspaceId,
    ai_staff_id: cleanAiStaffId,
    knowledge_id: knowledgeId,
    created_by_user_id: userId || null,
  }));

  const { data: insertedRows, error: insertError } = await supabaseAdmin
    .from("ai_staff_knowledge_links")
    .insert(rows)
    .select("knowledge_id");

  if (insertError) {
    throw insertError;
  }

  return (insertedRows || [])
    .map((row) => cleanText(row.knowledge_id))
    .filter(Boolean);
}
