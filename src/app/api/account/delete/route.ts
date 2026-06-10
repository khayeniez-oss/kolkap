import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return null;
  }

  return new Stripe(stripeSecretKey);
}

function shouldIgnoreDeleteError(error: { code?: string } | null) {
  if (!error) return true;

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST116"
  );
}

async function deleteByColumn(input: {
  table: string;
  column: string;
  value: string;
}) {
  const supabaseAdmin = getAdminSupabase();

  const { error } = await supabaseAdmin
    .from(input.table)
    .delete()
    .eq(input.column, input.value);

  if (error && !shouldIgnoreDeleteError(error)) {
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body?.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Please type DELETE to confirm account deletion." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to delete your account." },
        { status: 401 }
      );
    }

    const supabaseAdmin = getAdminSupabase();

    const { data: workspaces, error: workspaceError } = await supabaseAdmin
      .from("business_workspaces")
      .select("id, stripe_subscription_id")
      .eq("owner_user_id", user.id);

    if (workspaceError) {
      throw workspaceError;
    }

    const stripe = getStripe();

    for (const workspace of workspaces || []) {
      const workspaceId = workspace.id as string;
      const stripeSubscriptionId = workspace.stripe_subscription_id as
        | string
        | null;

      if (stripe && stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(stripeSubscriptionId);
        } catch (stripeError) {
          console.error(
            "Stripe subscription cancellation failed during account deletion.",
            stripeError instanceof Error ? stripeError.message : stripeError
          );
        }
      }

      await deleteByColumn({
        table: "workspace_usage_events",
        column: "workspace_id",
        value: workspaceId,
      });

      await deleteByColumn({
        table: "workspace_credit_balances",
        column: "workspace_id",
        value: workspaceId,
      });

      await deleteByColumn({
        table: "ai_staff",
        column: "workspace_id",
        value: workspaceId,
      });

      await deleteByColumn({
        table: "business_knowledge",
        column: "workspace_id",
        value: workspaceId,
      });

      await deleteByColumn({
        table: "customer_conversations",
        column: "workspace_id",
        value: workspaceId,
      });

      await deleteByColumn({
        table: "conversation_messages",
        column: "workspace_id",
        value: workspaceId,
      });

      await deleteByColumn({
        table: "leads",
        column: "workspace_id",
        value: workspaceId,
      });

      await deleteByColumn({
        table: "team_members",
        column: "workspace_id",
        value: workspaceId,
      });

      await deleteByColumn({
        table: "business_workspaces",
        column: "id",
        value: workspaceId,
      });
    }

    await deleteByColumn({
      table: "team_members",
      column: "user_id",
      value: user.id,
    });

    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      throw deleteUserError;
    }

    return NextResponse.json({
      ok: true,
      deleted: true,
    });
  } catch (error) {
    console.error(
      "Account deletion failed.",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Unable to delete account right now." },
      { status: 500 }
    );
  }
}