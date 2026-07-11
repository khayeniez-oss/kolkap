import { NextResponse } from "next/server";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import { KOLKAP_AI_STAFF_CREATE_CREDITS } from "@/lib/kolkapPlan";
import {
  parseKnowledgeIdsFromBody,
  replaceAiStaffKnowledgeLinks,
} from "@/lib/kolkap-ai-staff/knowledgeLinks";
import {
  cleanText,
  getAdminSupabase,
  getAiStaffLimitStatus,
  getCreditBalance,
  getCreditsLeft,
  getWorkspace,
  isMissingColumnError,
  refreshWorkspaceAiStaffUsed,
  userCanAccessWorkspace,
  verifyRequestUser,
} from "@/lib/kolkap-ai-staff/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeStatus(value: unknown) {
  return cleanText(value).toLowerCase() === "draft" ? "draft" : "active";
}

function cleanOptional(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

async function insertAiStaff(payload: Record<string, unknown>) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("ai_staff")
    .insert(payload)
    .select("*")
    .single();

  if (!error) {
    return data;
  }

  if (!isMissingColumnError(error.message)) {
    throw error;
  }

  const fallbackPayload = {
    workspace_id: payload.workspace_id,
    owner_user_id: payload.owner_user_id,
    name: payload.name,
    role: payload.role,
    channel: payload.channel,
    reply_language: payload.reply_language,
    reply_tone: payload.reply_tone,
    business_knowledge: payload.business_knowledge,
    ai_instruction: payload.ai_instruction,
    status: payload.status,
    activated_at: payload.activated_at,
    activation_credits_charged_at: payload.activation_credits_charged_at,
    activation_credits_used: payload.activation_credits_used,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  };

  const fallbackResult = await supabaseAdmin
    .from("ai_staff")
    .insert(fallbackPayload)
    .select("*")
    .single();

  if (fallbackResult.error) {
    throw fallbackResult.error;
  }

  return fallbackResult.data;
}

export async function POST(req: Request) {
  const auth = await verifyRequestUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json().catch(() => ({}));

    const workspaceId = cleanText(body.workspace_id);
    const name = cleanText(body.name).slice(0, 120);
    const role = cleanText(body.role || body.type).slice(0, 120);
    const channel = cleanText(body.channel || body.primary_channel || "inbox");
    const replyLanguage = cleanText(body.reply_language || body.language || "auto");
    const replyTone = cleanText(body.reply_tone || body.tone || "professional");
    const businessKnowledge = cleanOptional(body.business_knowledge);
    const aiInstruction = cleanText(body.ai_instruction || body.instruction).slice(
      0,
      6000
    );
    const status = normalizeStatus(body.status);
    const { knowledgeIds } = parseKnowledgeIdsFromBody(body);

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "Workspace is required." },
        { status: 400 }
      );
    }

    if (!name || !role || !aiInstruction) {
      return NextResponse.json(
        {
          success: false,
          error: "AI staff name, role, and instruction are required.",
        },
        { status: 400 }
      );
    }

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

    const ownerUserId = cleanText(workspace.owner_user_id);

    if (!ownerUserId) {
      return NextResponse.json(
        { success: false, error: "Workspace owner could not be found." },
        { status: 400 }
      );
    }

    let creditsLeft = 0;
    let creditsUsed = 0;

    if (status === "active") {
      const limitStatus = await getAiStaffLimitStatus(workspace);

      if (limitStatus.hasReachedLimit) {
        return NextResponse.json(
          {
            success: false,
            error:
              "AI staff limit reached. Open the web dashboard to manage your workspace.",
            error_code: "ai_staff_limit_reached",
            ai_staff_used: limitStatus.activeCount,
            ai_staff_limit: limitStatus.aiLimit,
          },
          { status: 403 }
        );
      }

      const creditBalance = await getCreditBalance({
        workspaceId,
        ownerUserId,
      });

      creditsLeft = getCreditsLeft(creditBalance);

      if (creditsLeft < KOLKAP_AI_STAFF_CREATE_CREDITS) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to create AI staff. Please open the web dashboard to manage your workspace.",
            error_code: "not_enough_credits",
            credits_left: creditsLeft,
            credits_required: KOLKAP_AI_STAFF_CREATE_CREDITS,
          },
          { status: 402 }
        );
      }

      creditsUsed = KOLKAP_AI_STAFF_CREATE_CREDITS;
    }

    const now = new Date().toISOString();

    const staff = await insertAiStaff({
      workspace_id: workspaceId,
      owner_user_id: ownerUserId,
      name,
      title: name,
      role,
      type: role,
      channel,
      primary_channel: channel,
      reply_language: replyLanguage,
      language: replyLanguage,
      reply_tone: replyTone,
      tone: replyTone,
      business_knowledge: businessKnowledge,
      ai_instruction: aiInstruction,
      instruction: aiInstruction,
      status,
      activated_at: status === "active" ? now : null,
      activation_credits_charged_at: status === "active" ? now : null,
      activation_credits_used: creditsUsed,
      last_edit_credits_charged_at: null,
      last_edit_credits_used: 0,
      created_at: now,
      updated_at: now,
    });

    const selectedKnowledgeIds = await replaceAiStaffKnowledgeLinks({
      workspaceId,
      aiStaffId: staff.id,
      knowledgeIds,
      userId: auth.userId || null,
    });

    if (status === "active") {
      await logWorkspaceUsage({
        workspaceId,
        userId: auth.userId || null,
        eventType: "ai_staff_created",
        channel,
        sourcePage: "ai_staff",
        creditsUsed,
        eventCount: 1,
        status: "success",
        metadata: {
          ai_staff_id: staff.id,
          credit_rule: "ai_staff_create",
          selected_knowledge_count: selectedKnowledgeIds.length,
        },
      });
    }

    const aiStaffUsed = await refreshWorkspaceAiStaffUsed(workspaceId);

    return NextResponse.json({
      success: true,
      staff,
      status,
      ai_staff_used: aiStaffUsed,
      credits_used: creditsUsed,
      credits_left_before_action: creditsLeft,
      selected_knowledge_ids: selectedKnowledgeIds,
    });
  } catch (error) {
    console.error("AI Staff create error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI staff could not be created.",
      },
      { status: 500 }
    );
  }
}
