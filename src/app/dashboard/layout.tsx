"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type WorkspaceAccessRow = {
  id?: string | null;
  plan_key?: string | null;
  plan_status?: string | null;
  billing_status?: string | null;
  stripe_subscription_id?: string | null;
  trial_activated_at?: string | null;
  billing_started_at?: string | null;
  subscription_cancel_at?: string | null;
  subscription_cancelled_at?: string | null;
};

const ALLOWED_WITHOUT_ACTIVE_TRIAL = new Set([
  "/dashboard/activate-trial",
  "/dashboard/help",
]);

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

function normalizePlanKey(value: unknown) {
  const plan = String(value || "starter").toLowerCase();

  if (
    plan === "starter" ||
    plan === "growth" ||
    plan === "professional" ||
    plan === "business"
  ) {
    return plan;
  }

  return "starter";
}

function hasActiveTrialOrPlan(workspace: WorkspaceAccessRow | null) {
  if (!workspace) return false;

  const planStatus = normalizeStatus(workspace.plan_status);
  const billingStatus = normalizeStatus(workspace.billing_status);

  if (BLOCKED_STATUSES.has(planStatus) || BLOCKED_STATUSES.has(billingStatus)) {
    return false;
  }

  const hasRealSubscription = Boolean(
    workspace.stripe_subscription_id && !workspace.subscription_cancelled_at
  );

  const hasActivatedTrial = Boolean(
    workspace.trial_activated_at && !workspace.subscription_cancelled_at
  );

  const hasStartedBilling = Boolean(
    workspace.billing_started_at && !workspace.subscription_cancelled_at
  );

  return hasRealSubscription || hasActivatedTrial || hasStartedBilling;
}

function isAllowedWithoutActiveTrial(pathname: string) {
  return Array.from(ALLOWED_WITHOUT_ACTIVE_TRIAL).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

async function checkAdminAccess(accessToken: string) {
  try {
    const response = await fetch("/api/admin/access", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json().catch(() => ({}));

    return Boolean(response.ok && result.success && result.isAdmin);
  } catch (error) {
    console.error("Dashboard admin access check failed:", error);
    return false;
  }
}

async function findWorkspaceForUser({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail?: string | null;
}) {
  const supabase = createClient();

  const selectFields =
    "id, plan_key, plan_status, billing_status, stripe_subscription_id, trial_activated_at, billing_started_at, subscription_cancel_at, subscription_cancelled_at";

  const { data: ownedWorkspace } = await supabase
    .from("business_workspaces")
    .select(selectFields)
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ownedWorkspace?.id) {
    return ownedWorkspace as WorkspaceAccessRow;
  }

  if (!userEmail) {
    return null;
  }

  const { data: teamMember } = await supabase
    .from("workspace_team_members")
    .select("workspace_id")
    .eq("email", userEmail.toLowerCase())
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!teamMember?.workspace_id) {
    return null;
  }

  const { data: teamWorkspace } = await supabase
    .from("business_workspaces")
    .select(selectFields)
    .eq("id", teamMember.workspace_id)
    .maybeSingle();

  return (teamWorkspace ?? null) as WorkspaceAccessRow | null;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkDashboardAccess() {
      const supabase = createClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      const user = session?.user;

      if (sessionError || !user?.id || !session?.access_token) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const isAdmin = await checkAdminAccess(session.access_token);

      if (!isMounted) return;

      if (isAdmin) {
        setIsCheckingAccess(false);
        return;
      }

      if (isAllowedWithoutActiveTrial(pathname)) {
        setIsCheckingAccess(false);
        return;
      }

      const workspace = await findWorkspaceForUser({
        userId: user.id,
        userEmail: user.email,
      });

      if (!isMounted) return;

      const planKey = normalizePlanKey(workspace?.plan_key);
      const hasAccess = hasActiveTrialOrPlan(workspace);

      if (!hasAccess) {
        router.replace(`/dashboard/activate-trial?plan=${planKey}`);
        return;
      }

      setIsCheckingAccess(false);
    }

    checkDashboardAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (isCheckingAccess) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Checking your workspace access...
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}