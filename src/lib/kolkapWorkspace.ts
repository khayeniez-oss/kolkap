import type { SupabaseClient } from "@supabase/supabase-js";

export type KolkapWorkspace = {
  id: string;
  owner_user_id: string;

  business_name: string | null;
  business_type: string | null;
  business_email: string | null;
  business_phone: string | null;
  whatsapp_number: string | null;
  business_address: string | null;
  country: string | null;
  timezone: string | null;

  plan_key: string;
  plan_status: string;
  billing_status?: string | null;

  credits_total: number;
  credits_used: number;
  ai_staff_used: number;

  whatsapp_status: string;
  go_live_status: string;

  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  stripe_checkout_session_id?: string | null;

  billing_started_at?: string | null;
  billing_current_period_start?: string | null;
  billing_current_period_end?: string | null;
  trial_activated_at?: string | null;
  subscription_cancel_at?: string | null;
  subscription_cancelled_at?: string | null;
  subscription_updated_at?: string | null;

  ai_reply_language: string | null;
  ai_reply_tone: string | null;
  handover_rule: string | null;
  ai_instruction: string | null;

  auto_reply_enabled: boolean | null;
  human_handover_enabled: boolean | null;
  lead_capture_enabled: boolean | null;
  notify_new_lead: boolean | null;
  notify_handover: boolean | null;
  notify_low_credits: boolean | null;
  notify_daily_summary: boolean | null;

  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  created_at: string;
  updated_at: string;
};

function cleanEmail(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

async function findOwnedWorkspace(
  supabase: SupabaseClient,
  userId: string
): Promise<KolkapWorkspace | null> {
  const { data, error } = await supabase
    .from("business_workspaces")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as KolkapWorkspace | null;
}

async function findTeamWorkspace(
  supabase: SupabaseClient,
  userEmail: string | null | undefined
): Promise<KolkapWorkspace | null> {
  const email = cleanEmail(userEmail);

  if (!email) {
    return null;
  }

  const { data: teamMember, error: teamError } = await supabase
    .from("workspace_team_members")
    .select("workspace_id")
    .eq("email", email)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (teamError) {
    throw teamError;
  }

  if (!teamMember?.workspace_id) {
    return null;
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("business_workspaces")
    .select("*")
    .eq("id", teamMember.workspace_id)
    .maybeSingle();

  if (workspaceError) {
    throw workspaceError;
  }

  return (workspace ?? null) as KolkapWorkspace | null;
}

async function ensureZeroCreditBalance(input: {
  supabase: SupabaseClient;
  workspaceId: string;
  ownerUserId: string;
  planKey: string;
}) {
  const { supabase, workspaceId, ownerUserId, planKey } = input;

  const { data: existingBalance, error: existingError } = await supabase
    .from("workspace_credit_balances")
    .select("id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existingError) {
    return;
  }

  if (existingBalance?.id) {
    return;
  }

  await supabase.from("workspace_credit_balances").insert({
    workspace_id: workspaceId,
    owner_user_id: ownerUserId,
    plan_name: planKey,
    plan_credits: 0,
    purchased_credits: 0,
    used_credits: 0,
    status: "draft",
  });
}

export async function ensureKolkapWorkspace(
  supabase: SupabaseClient
): Promise<KolkapWorkspace | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const ownedWorkspace = await findOwnedWorkspace(supabase, user.id);

  if (ownedWorkspace?.id) {
    return ownedWorkspace;
  }

  const teamWorkspace = await findTeamWorkspace(supabase, user.email);

  if (teamWorkspace?.id) {
    return teamWorkspace;
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  const businessType =
    typeof user.user_metadata?.business_type === "string"
      ? user.user_metadata.business_type.trim()
      : null;

  const now = new Date().toISOString();

  const { data: newWorkspace, error: insertError } = await supabase
    .from("business_workspaces")
    .insert({
      owner_user_id: user.id,

      business_name: fullName ? `${fullName}'s Business` : "My Business",
      business_type: businessType || null,
      business_email: user.email ?? null,
      business_phone: null,
      whatsapp_number: null,
      business_address: null,
      country: null,
      timezone: "Australia/Sydney",

      plan_key: "starter",
      plan_status: "draft",
      billing_status: "not_started",

      credits_total: 0,
      credits_used: 0,
      ai_staff_used: 0,

      whatsapp_status: "not_connected",
      go_live_status: "draft",

      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_price_id: null,
      stripe_checkout_session_id: null,

      billing_started_at: null,
      billing_current_period_start: null,
      billing_current_period_end: null,
      trial_activated_at: null,
      subscription_cancel_at: null,
      subscription_cancelled_at: null,
      subscription_updated_at: null,

      ai_reply_language: "Auto-detect",
      ai_reply_tone: "Friendly Professional",
      handover_rule: "When customer asks for a human",
      ai_instruction:
        "Reply clearly, collect customer details, and ask the team to take over when the customer requests human support.",

      auto_reply_enabled: false,
      human_handover_enabled: true,
      lead_capture_enabled: true,
      notify_new_lead: true,
      notify_handover: true,
      notify_low_credits: true,
      notify_daily_summary: false,

      trial_started_at: null,
      trial_ends_at: null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const workspaceAfterDuplicate = await findOwnedWorkspace(
        supabase,
        user.id
      );

      return workspaceAfterDuplicate;
    }

    throw insertError;
  }

  const workspace = newWorkspace as KolkapWorkspace;

  await ensureZeroCreditBalance({
    supabase,
    workspaceId: workspace.id,
    ownerUserId: workspace.owner_user_id,
    planKey: workspace.plan_key,
  });

  return workspace;
}