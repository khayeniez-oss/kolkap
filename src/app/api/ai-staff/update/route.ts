import { NextResponse } from "next/server";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import {
  KOLKAP_AI_STAFF_CREATE_CREDITS,
  KOLKAP_AI_STAFF_EDIT_CREDITS,
} from "@/lib/kolkapPlan";
import {
  cleanText,
  getAdminSupabase,
  getAiStaffLimitStatus,
  getCreditBalance,
  getCreditsLeft,
  getWorkspace,
  refreshWorkspaceAiStaffUsed,
  userCanAccessWorkspace,
  verifyRequestUser,
} from "@/lib/kolkap-ai-staff/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeStatus(value: unknown, fallback = "draft") {
  const status = cleanText(value || fallback).toLowerCase();
  return status === "draft" ? "draft" : "active";
}

function cleanOptional(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function pickText(bodyValue: unknown, currentValue: unknown, max = 6000) {
  const hasBodyValue = bodyValue !== undefined && bodyValue !== null;
  const value = hasBodyValue ? bodyValue : currentValue;
  return cleanText(value).slice(0, max);
}

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

    const currentStaff = await getAiStaff(staffId);

    if (!currentStaff?.id || currentStaff.deleted_at) {
      return NextResponse.json(
        { success: false, error: "AI staff not found." },
        { status: 404 }
      );
    }

    const workspaceId = cleanText(currentStaff.workspace_id);
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

    const name = pickText(body.name, currentStaff.name, 120);
    const role = pickText(body.role || body.type, currentStaff.role || currentStaff.type, 120);
    const channel = pickText(
      body.channel || body.primary_channel,
      currentStaff.channel || currentStaff.primary_channel || "inbox",
      80
    );
    const replyLanguage = pickText(
      body.reply_language || body.language,
      currentStaff.reply_language || currentStaff.language || "auto",
      80
    );
    const replyTone = pickText(
      body.reply_tone || body.tone,
      currentStaff.reply_tone || currentStaff.tone || "professional",
      80
    );
    const businessKnowledge =
      body.business_knowledge === undefined
        ? cleanOptional(currentStaff.business_knowledge)
        : cleanOptional(body.business_knowledge);
    const aiInstruction = pickText(
      body.ai_instruction || body.instruction,
      currentStaff.ai_instruction || currentStaff.instruction,
      6000
    );

    const currentStatus = normalizeStatus(currentStaff.status, "draft");
    const nextStatus = normalizeStatus(body.status, currentStatus);

    if (!name || !role || !aiInstruction) {
      return NextResponse.json(
        {
          success: false,
          error: "AI staff name, role, and instruction are required.",
        },
        { status: 400 }
      );
    }

    const isActivatingUnchargedDraft =
      currentStatus === "draft" &&
      nextStatus === "active" &&
      !currentStaff.activation_credits_charged_at;

    const shouldChargeEdit = !isActivatingUnchargedDraft && currentStatus !== "draft";

    let creditsRequired = 0;
    let eventType = "";
    let creditRule = "";

    if (isActivatingUnchargedDraft) {
      creditsRequired = KOLKAP_AI_STAFF_CREATE_CREDITS;
      eventType = "ai_staff_created";
      creditRule = "ai_staff_create";
    } else if (shouldChargeEdit) {
      creditsRequired = KOLKAP_AI_STAFF_EDIT_CREDITS;
      eventType = "ai_staff_edited";
      creditRule = "ai_staff_edit";
    }

    if (nextStatus === "active" && currentStatus === "draft") {
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
    }

    let creditsLeft = 0;

    if (creditsRequired > 0) {
      const creditBalance = await getCreditBalance({
        workspaceId,
        ownerUserId,
      });

      creditsLeft = getCreditsLeft(creditBalance);

      if (creditsLeft < creditsRequired) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to update AI staff. Please open the web dashboard to manage your workspace.",
            error_code: "not_enough_credits",
            credits_left: creditsLeft,
            credits_required: creditsRequired,
          },
          { status: 402 }
        );
      }
    }

    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
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
      status: nextStatus,
      updated_at: now,
    };

    if (isActivatingUnchargedDraft) {
      updatePayload.activated_at = now;
      updatePayload.activation_credits_charged_at = now;
      updatePayload.activation_credits_used = creditsRequired;
    }

    if (shouldChargeEdit) {
      updatePayload.last_edit_credits_charged_at = now;
      updatePayload.last_edit_credits_used = creditsRequired;
    }

    const supabaseAdmin = getAdminSupabase();

    const { data: updatedStaff, error: updateError } = await supabaseAdmin
      .from("ai_staff")
      .update(updatePayload)
      .eq("id", staffId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    if (creditsRequired > 0) {
      await logWorkspaceUsage({
        workspaceId,
        userId: auth.userId || null,
        eventType,
        channel,
        sourcePage: "ai_staff",
        creditsUsed: creditsRequired,
        eventCount: 1,
        status: "success",
        metadata: {
          ai_staff_id: staffId,
          credit_rule: creditRule,
          previous_status: currentStatus,
          next_status: nextStatus,
        },
      });
    }

    const aiStaffUsed = await refreshWorkspaceAiStaffUsed(workspaceId);

    return NextResponse.json({
      success: true,
      staff: updatedStaff,
      status: nextStatus,
      ai_staff_used: aiStaffUsed,
      credits_used: creditsRequired,
      credits_left_before_action: creditsLeft,
    });
  } catch (error) {
    console.error("AI Staff update error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "AI staff could not be updated.",
      },
      { status: 500 }
    );
  }
}
