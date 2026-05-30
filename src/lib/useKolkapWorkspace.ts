"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureKolkapWorkspace,
  type KolkapWorkspace,
} from "@/lib/kolkapWorkspace";
import type { KolkapPlanKey } from "@/lib/kolkapPlan";

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

function safePlanKey(value: string): KolkapPlanKey {
  if (
    value === "free_trial" ||
    value === "growth" ||
    value === "pro" ||
    value === "business"
  ) {
    return value;
  }

  return "free_trial";
}

function safeStatus(value: string): KolkapWorkspaceStatus["status"] {
  if (
    value === "trial" ||
    value === "active" ||
    value === "past_due" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "trial";
}

function safeWhatsappStatus(
  value: string
): KolkapWorkspaceStatus["whatsappStatus"] {
  if (
    value === "not_connected" ||
    value === "connected" ||
    value === "pending"
  ) {
    return value;
  }

  return "not_connected";
}

function safeGoLiveStatus(
  value: string
): KolkapWorkspaceStatus["goLiveStatus"] {
  if (
    value === "draft" ||
    value === "testing" ||
    value === "live" ||
    value === "pending"
  ) {
    return value;
  }

  return "draft";
}

function getTrialDaysRemaining(trialEndsAt: string) {
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  const diff = end - now;

  if (Number.isNaN(end) || diff <= 0) {
    return 0;
  }

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function useKolkapWorkspace(): KolkapWorkspaceStatus {
  const [workspace, setWorkspace] = useState<KolkapWorkspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspace() {
      setIsLoading(true);
      setError("");

      try {
        const supabase = createClient();
        const workspaceData = await ensureKolkapWorkspace(supabase);

        if (isMounted) {
          setWorkspace(workspaceData);
        }
      } catch (workspaceError) {
        if (isMounted) {
          setError(
            workspaceError instanceof Error
              ? workspaceError.message
              : "Unable to load workspace."
          );
        }
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
    const creditsTotal = workspace?.credits_total ?? 100;
    const creditsUsed = workspace?.credits_used ?? 0;
    const creditsRemaining = Math.max(creditsTotal - creditsUsed, 0);

    return {
      workspace,
      isLoading,
      error,
      planKey: safePlanKey(workspace?.plan_key ?? "free_trial"),
      status: safeStatus(workspace?.plan_status ?? "trial"),
      creditsTotal,
      creditsUsed,
      creditsRemaining,
      aiStaffUsed: workspace?.ai_staff_used ?? 0,
      whatsappStatus: safeWhatsappStatus(
        workspace?.whatsapp_status ?? "not_connected"
      ),
      goLiveStatus: safeGoLiveStatus(workspace?.go_live_status ?? "draft"),
      trialDaysRemaining: getTrialDaysRemaining(
        workspace?.trial_ends_at ?? new Date().toISOString()
      ),
    };
  }, [workspace, isLoading, error]);
}