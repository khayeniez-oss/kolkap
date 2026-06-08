import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WorkspaceBillingRow = {
  id: string;
  owner_user_id: string;
  stripe_subscription_id: string | null;
  plan_status: string | null;
  billing_status: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dateFromUnix(timestamp: number | null | undefined) {
  if (!timestamp) return null;

  return new Date(timestamp * 1000).toISOString();
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(stripeSecretKey);
}

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  if (!isRecord(subscription)) return null;

  const topLevelPeriodEnd = getNumber(subscription.current_period_end);

  if (topLevelPeriodEnd) {
    return topLevelPeriodEnd;
  }

  const items = subscription.items;

  if (!isRecord(items) || !Array.isArray(items.data)) {
    return null;
  }

  const firstItem = items.data[0];

  if (!isRecord(firstItem)) {
    return null;
  }

  return getNumber(firstItem.current_period_end);
}

function getTrialEnd(subscription: Stripe.Subscription) {
  if (!isRecord(subscription)) return null;

  return getNumber(subscription.trial_end);
}

function getCancelAt(subscription: Stripe.Subscription) {
  if (!isRecord(subscription)) return null;

  return getNumber(subscription.cancel_at);
}

function getCancelDate(subscription: Stripe.Subscription) {
  return (
    dateFromUnix(getCancelAt(subscription)) ||
    dateFromUnix(getTrialEnd(subscription)) ||
    dateFromUnix(getCurrentPeriodEnd(subscription))
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to cancel your subscription." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedWorkspaceId =
      typeof body?.workspace_id === "string" ? body.workspace_id.trim() : "";

    const adminSupabase = getAdminSupabase();

    let workspaceQuery = adminSupabase
      .from("business_workspaces")
      .select(
        "id, owner_user_id, stripe_subscription_id, plan_status, billing_status"
      )
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (requestedWorkspaceId) {
      workspaceQuery = workspaceQuery.eq("id", requestedWorkspaceId);
    }

    const { data: workspace, error: workspaceError } =
      await workspaceQuery.maybeSingle();

    if (workspaceError) {
      throw workspaceError;
    }

    const billingWorkspace = workspace as WorkspaceBillingRow | null;

    if (!billingWorkspace?.id) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 }
      );
    }

    if (!billingWorkspace.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription was found for this workspace." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const subscription = await stripe.subscriptions.update(
      billingWorkspace.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    const now = new Date().toISOString();
    const cancelAt = getCancelDate(subscription);

    const { error: updateError } = await adminSupabase
      .from("business_workspaces")
      .update({
        billing_status: subscription.status,
        subscription_cancel_at: cancelAt,
        subscription_updated_at: now,
        updated_at: now,
      })
      .eq("id", billingWorkspace.id)
      .eq("owner_user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      workspace_id: billingWorkspace.id,
      subscription_id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: cancelAt,
      message:
        "Your subscription cancellation has been scheduled. You can continue using Kolkap until the trial or billing period ends.",
    });
  } catch (error) {
    console.error(
      "Cancel subscription failed.",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      {
        error:
          "Unable to cancel your subscription right now. Please try again or contact Kolkap support.",
      },
      { status: 500 }
    );
  }
}