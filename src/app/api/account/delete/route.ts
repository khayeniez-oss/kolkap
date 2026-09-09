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
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(stripeSecretKey);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMissingStripeResource(error: unknown) {
  return isRecord(error) && error.code === "resource_missing";
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

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.status !== "canceled") {
      await stripe.subscriptions.cancel(subscriptionId);
    }
  } catch (error) {
    if (isMissingStripeResource(error)) return;

    throw error;
  }
}

async function deleteKnowledgeFiles(workspaceId: string) {
  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin
    .from("workspace_knowledge_documents")
    .select("storage_path")
    .eq("workspace_id", workspaceId);

  if (error && !shouldIgnoreDeleteError(error)) {
    throw error;
  }

  const storagePaths = (data ?? [])
    .map((row) => String(row.storage_path || "").trim())
    .filter(Boolean);

  if (!storagePaths.length) return;

  const { error: storageError } = await supabaseAdmin.storage
    .from("kolkap-knowledge-documents")
    .remove(storagePaths);

  if (storageError) {
    throw storageError;
  }
}

async function deleteWorkspaceData(workspaceId: string) {
  const workspaceScopedTables = [
    // AI links must be removed before AI staff and knowledge records.
    "ai_staff_knowledge_links",
    "channel_ai_assignments",

    // WhatsApp child records and connection secrets.
    "kolkap_whatsapp_template_send_logs",
    "kolkap_whatsapp_template_recipients",
    "kolkap_whatsapp_template_campaigns",
    "kolkap_whatsapp_messages",
    "kolkap_whatsapp_conversations",
    "kolkap_whatsapp_contacts",
    "whatsapp_connection_secrets",
    "whatsapp_message_logs",
    "workspace_whatsapp_connections",

    // Website chat and inbox records.
    "website_chat_messages",
    "website_chat_conversations",
    "customer_messages",
    "conversation_messages",
    "customer_conversations",
    "workspace_website_chat_settings",

    // Usage, billing, credits, content, and support.
    "workspace_usage_events",
    "workspace_credit_topups",
    "workspace_credit_balances",
    "workspace_content_studio",
    "kolkap_notifications",
    "kolkap_help_requests",

    // AI setup and knowledge base.
    "ai_test_runs",
    "ai_staff",
    "workspace_knowledge_documents",
    "workspace_knowledge_base",
    "business_knowledge",

    // Leads and team access.
    "leads",
    "workspace_team_members",
    "team_members",
  ];

  await deleteKnowledgeFiles(workspaceId);

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

    // Cancel every Stripe subscription before deleting any local data.
    // If Stripe is unavailable, deletion stops and the account stays intact.
    for (const workspace of workspaceRows) {
      await cancelStripeSubscription(workspace.stripe_subscription_id);
    }

    for (const workspace of workspaceRows) {
      await deleteWorkspaceData(workspace.id);
    }

    if (user.email) {
      await deleteByColumn({
        table: "workspace_team_members",
        column: "email",
        value: user.email.toLowerCase(),
      });
    }

    await deleteByColumn({
      table: "team_members",
      column: "user_id",
      value: user.id,
    });

    await deleteByColumn({
      table: "profiles",
      column: "id",
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
