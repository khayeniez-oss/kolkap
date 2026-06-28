"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureKolkapWorkspace,
  type KolkapWorkspace,
} from "@/lib/kolkapWorkspace";
import type { KolkapPlanKey } from "@/lib/kolkapPlan";

type WorkspaceRow = KolkapWorkspace & {
  plan_key?: string | null;
  plan_status?: string | null;
  billing_status?: string | null;
  stripe_subscription_id?: string | null;
  trial_activated_at?: string | null;
  billing_started_at?: string | null;
  billing_current_period_end?: string | null;
  subscription_cancel_at?: string | null;
  subscription_cancelled_at?: string | null;
  whatsapp_status?: string | null;
  go_live_status?: string | null;
  trial_ends_at?: string | null;
};

type CreditBalanceRow = {
  plan_credits: number | null;
  purchased_credits: number | null;
  used_credits: number | null;
};

export type KolkapWorkspaceStatus = {
  workspace: KolkapWorkspace | null;
  isLoading: boolean;
  error: string;
  planKey: KolkapPlanKey;
  status: "trial" | "active" | "past_due" | "cancelled";
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  aiStaffUsed: number;
  whatsappStatus: "not_connected" | "connected" | "pending";
  goLiveStatus: "draft" | "testing" | "live" | "pending";
  trialDaysRemaining: number;
};

const BLOCKED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "inactive",
  "incomplete_expired",
  "expired",
]);

function normalizeStatus(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function safePlanKey(value: unknown): KolkapPlanKey {
  const plan = String(value || "starter").trim().toLowerCase();

  if (plan === "starter") return "starter" as KolkapPlanKey;
  if (plan === "growth") return "growth" as KolkapPlanKey;
  if (plan === "professional" || plan === "pro") {
    return "professional" as KolkapPlanKey;
  }
  if (plan === "business") return "business" as KolkapPlanKey;

  return "starter" as KolkapPlanKey;
}

function safeStatus(workspace: WorkspaceRow | null): KolkapWorkspaceStatus["status"] {
  if (!workspace) return "trial";

  const planStatus = normalizeStatus(workspace.plan_status);
  const billingStatus = normalizeStatus(workspace.billing_status);

  if (
    BLOCKED_STATUSES.has(planStatus) ||
    BLOCKED_STATUSES.has(billingStatus) ||
    workspace.subscription_cancelled_at
  ) {
    return "cancelled";
  }

  if (
    billingStatus === "past_due" ||
    billingStatus === "unpaid" ||
    billingStatus === "incomplete"
  ) {
    return "past_due";
  }

  if (
    billingStatus === "active" ||
    planStatus === "active" ||
    workspace.billing_started_at
  ) {
    return "active";
  }

  if (
    billingStatus === "trialing" ||
    planStatus === "trial" ||
    workspace.trial_activated_at
  ) {
    return "trial";
  }

  return "trial";
}

function safeWhatsappStatus(
  value: unknown
): KolkapWorkspaceStatus["whatsappStatus"] {
  const status = normalizeStatus(value);

  if (
    status === "not_connected" ||
    status === "connected" ||
    status === "pending"
  ) {
    return status;
  }

  return "not_connected";
}

function safeGoLiveStatus(value: unknown): KolkapWorkspaceStatus["goLiveStatus"] {
  const status = normalizeStatus(value);

  if (
    status === "draft" ||
    status === "testing" ||
    status === "live" ||
    status === "pending"
  ) {
    return status;
  }

  return "draft";
}

function getTrialDaysRemaining(workspace: WorkspaceRow | null) {
  const possibleEndDate =
    workspace?.billing_current_period_end ||
    workspace?.subscription_cancel_at ||
    workspace?.trial_ends_at ||
    "";

  if (!possibleEndDate) return 0;

  const end = new Date(possibleEndDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (Number.isNaN(end) || diff <= 0) {
    return 0;
  }

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function hasActiveTrialOrPlan(workspace: WorkspaceRow | null) {
  if (!workspace) return false;

  const planStatus = normalizeStatus(workspace.plan_status);
  const billingStatus = normalizeStatus(workspace.billing_status);

  if (
    BLOCKED_STATUSES.has(planStatus) ||
    BLOCKED_STATUSES.has(billingStatus) ||
    workspace.subscription_cancelled_at
  ) {
    return false;
  }

  return Boolean(
    workspace.stripe_subscription_id ||
      workspace.trial_activated_at ||
      workspace.billing_started_at
  );
}

async function findWorkspaceForUser({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail?: string | null;
}) {
  const supabase = createClient();

  const { data: ownedWorkspaces, error: ownedError } = await supabase
    .from("business_workspaces")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });

  if (ownedError) {
    throw ownedError;
  }

  const ownedRows = (ownedWorkspaces ?? []) as WorkspaceRow[];

  const activeOwnedWorkspace = ownedRows.find((workspace) =>
    hasActiveTrialOrPlan(workspace)
  );

  if (activeOwnedWorkspace?.id) {
    return activeOwnedWorkspace;
  }

  if (userEmail) {
    const { data: teamMember, error: teamError } = await supabase
      .from("workspace_team_members")
      .select("workspace_id")
      .eq("email", userEmail.toLowerCase())
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (teamError) {
      throw teamError;
    }

    if (teamMember?.workspace_id) {
      const { data: teamWorkspace, error: teamWorkspaceError } = await supabase
        .from("business_workspaces")
        .select("*")
        .eq("id", teamMember.workspace_id)
        .maybeSingle();

      if (teamWorkspaceError) {
        throw teamWorkspaceError;
      }

      if (teamWorkspace?.id) {
        return teamWorkspace as WorkspaceRow;
      }
    }
  }

  if (ownedRows[0]?.id) {
    return ownedRows[0];
  }

  return null;
}

async function loadCreditBalance(workspaceId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("workspace_credit_balances")
    .select("plan_credits, purchased_credits, used_credits")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as CreditBalanceRow | null;
}

async function countAiStaff(workspaceId: string) {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("ai_staff")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export function useKolkapWorkspace(): KolkapWorkspaceStatus {
  const [workspace, setWorkspace] = useState<WorkspaceRow | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );
  const [aiStaffUsed, setAiStaffUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspace() {
      setIsLoading(true);
      setError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user?.id) {
          throw new Error("Please log in to access your workspace.");
        }

        let workspaceData = await findWorkspaceForUser({
          userId: user.id,
          userEmail: user.email,
        });

        if (!workspaceData?.id) {
          const createdWorkspace = await ensureKolkapWorkspace(supabase);
          workspaceData = createdWorkspace as WorkspaceRow;
        }

        const [balanceData, aiStaffCount] = await Promise.all([
          loadCreditBalance(workspaceData.id),
          countAiStaff(workspaceData.id),
        ]);

        if (!isMounted) return;

        setWorkspace(workspaceData);
        setCreditBalance(balanceData);
        setAiStaffUsed(aiStaffCount);
      } catch (workspaceError) {
        if (!isMounted) return;

        setError(
          workspaceError instanceof Error
            ? workspaceError.message
            : "Unable to load workspace."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(() => {
    const planCredits = Number(creditBalance?.plan_credits || 0);
    const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
    const creditsUsed = Number(creditBalance?.used_credits || 0);
    const creditsTotal = planCredits + purchasedCredits;
    const creditsRemaining = Math.max(creditsTotal - creditsUsed, 0);

    return {
      workspace,
      isLoading,
      error,
      planKey: safePlanKey(workspace?.plan_key),
      status: safeStatus(workspace),
      creditsTotal,
      creditsUsed,
      creditsRemaining,
      aiStaffUsed,
      whatsappStatus: safeWhatsappStatus(workspace?.whatsapp_status),
      goLiveStatus: safeGoLiveStatus(workspace?.go_live_status),
      trialDaysRemaining: getTrialDaysRemaining(workspace),
    };
  }, [workspace, creditBalance, aiStaffUsed, isLoading, error]);
}