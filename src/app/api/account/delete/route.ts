import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WorkspaceRow = {
  id: string;
  owner_user_id: string;
  stripe_subscription_id: string | null;
};

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
    error.code === "42P01" || // table does not exist
    error.code === "42703" || // column does not exist
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

async function cancelStripeSubscription(subscriptionId: string | null) {
  if (!subscriptionId) return;

  const stripe = getStripe();

  if (!stripe) return;

  try {
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error(
      "Stripe subscription cancellation failed during account deletion.",
      error instanceof Error ? error.message : error
    );
  }
}

async function deleteWorkspaceData(workspaceId: string) {
  const workspaceScopedTables = [
    // Usage, billing, credits
    "workspace_usage_events",
    "workspace_credit_topups",
    "workspace_credit_balances",

    // AI setup
    "ai_test_runs",
    "ai_staff",

    // Knowledge base
    "workspace_knowledge_base",
    "business_knowledge",

    // Website chat
    "workspace_website_chat_settings",
    "website_chat_messages",
    "website_chat_conversations",

    // WhatsApp / message logs
    "whatsapp_message_logs",
    "whatsapp_numbers",
    "whatsapp_connections",
    "workspace_whatsapp_numbers",

    // Inbox / customer messages
    "customer_messages",
    "conversation_messages",
    "customer_conversations",

    // Leads / team
    "leads",
    "team_members",
  ];

  for (const table of workspaceScopedTables) {
    await deleteByColumn({
      table,
      column: "workspace_id",
      value: workspaceId,
    });
  }

  await deleteByColumn({
    table: "business_workspaces",
    column: "id",
    value: workspaceId,
  });
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

    if (!user?.id) {
      return NextResponse.json(
        { error: "Please log in to delete your account." },
        { status: 401 }
      );
    }

    const supabaseAdmin = getAdminSupabase();

    const { data: workspaces, error: workspaceError } = await supabaseAdmin
      .from("business_workspaces")
      .select("id, owner_user_id, stripe_subscription_id")
      .eq("owner_user_id", user.id);

    if (workspaceError) {
      throw workspaceError;
    }

    const workspaceRows = (workspaces ?? []) as WorkspaceRow[];

    for (const workspace of workspaceRows) {
      await cancelStripeSubscription(workspace.stripe_subscription_id);
      await deleteWorkspaceData(workspace.id);
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