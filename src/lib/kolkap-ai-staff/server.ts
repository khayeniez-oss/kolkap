import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  getKolkapPlan,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";

export type AuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

export type CreditBalanceRow = {
  workspace_id: string;
  owner_user_id: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  status: string | null;
};

const PLAN_KEYS: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
  "free_trial",
  "pro",
];

export function cleanText(value: unknown, fallback = "") {
  const text =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? fallback
        : String(value);

  return text.trim();
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

export function getAdminSupabase() {
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

export async function verifyRequestUser(req: Request): Promise<AuthResult> {
  const supabaseAdmin = getAdminSupabase();
  const token = getBearerToken(req);

  if (!token) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unauthorized. Login is required." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user?.id) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unauthorized. Invalid session." },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    userId: user.id,
    userEmail: user.email || null,
  };
}

export async function getWorkspace(workspaceId: string) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("business_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as Record<string, unknown> | null;
}

export async function userCanAccessWorkspace({
  userId,
  userEmail,
  workspace,
}: {
  userId: string;
  userEmail?: string | null;
  workspace: Record<string, unknown>;
}) {
  const ownerUserId = cleanText(workspace.owner_user_id);

  if (ownerUserId && ownerUserId === userId) {
    return true;
  }

  const email = cleanText(userEmail).toLowerCase();

  if (!email) {
    return false;
  }

  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("workspace_team_members")
    .select("id")
    .eq("workspace_id", cleanText(workspace.id))
    .eq("email", email)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("AI Staff team access check failed:", error.message);
    return false;
  }

  return Boolean(data?.id);
}

export function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return 0;

  return Math.max(
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0),
    0
  );
}

export async function getCreditBalance({
  workspaceId,
  ownerUserId,
}: {
  workspaceId: string;
  ownerUserId: string;
}) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("workspace_credit_balances")
    .select(
      "workspace_id, owner_user_id, plan_credits, purchased_credits, used_credits, status"
    )
    .eq("workspace_id", workspaceId)
    .eq("owner_user_id", ownerUserId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as CreditBalanceRow | null;
}

export function getPlanKeyFromWorkspace(
  workspace: Record<string, unknown>
): KolkapPlanKey {
  const raw = [
    workspace.plan_key,
    workspace.plan,
    workspace.subscription_plan,
    workspace.current_plan,
    workspace.plan_name,
  ]
    .map((value) => cleanText(value).toLowerCase())
    .find(Boolean);

  if (raw && PLAN_KEYS.includes(raw as KolkapPlanKey)) {
    return raw as KolkapPlanKey;
  }

  if (raw?.includes("growth")) return "growth";
  if (raw?.includes("professional")) return "professional";
  if (raw?.includes("business")) return "business";
  if (raw?.includes("enterprise")) return "enterprise";
  if (raw?.includes("trial")) return "free_trial";
  if (raw?.includes("pro")) return "professional";

  return "starter";
}

export async function getAiStaffLimitStatus(
  workspace: Record<string, unknown>
) {
  const workspaceId = cleanText(workspace.id);
  const planKey = getPlanKeyFromWorkspace(workspace);
  const plan = getKolkapPlan(planKey);
  const aiLimit = plan.aiStaffLimit;

  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("ai_staff")
    .select("id,status,deleted_at,activation_credits_charged_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  const activeCount = (data || []).filter((row) => {
    const status = cleanText(row.status).toLowerCase();
    return status !== "draft";
  }).length;

  return {
    planKey,
    aiLimit,
    activeCount,
    hasReachedLimit: aiLimit !== "custom" && activeCount >= aiLimit,
  };
}

export async function refreshWorkspaceAiStaffUsed(workspaceId: string) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("ai_staff")
    .select("id,status,deleted_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  const activeCount = (data || []).filter((row) => {
    const status = cleanText(row.status).toLowerCase();
    return status !== "draft";
  }).length;

  const { error: updateError } = await supabaseAdmin
    .from("business_workspaces")
    .update({
      ai_staff_used: activeCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId);

  if (updateError) {
    console.error("AI staff usage count update failed:", updateError.message);
  }

  return activeCount;
}

export function isMissingColumnError(message = "") {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("column") &&
    (normalized.includes("does not exist") ||
      normalized.includes("could not find"))
  );
}
