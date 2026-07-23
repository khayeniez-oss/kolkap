import type { SupabaseClient, User } from "@supabase/supabase-js";

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

type BillablePlanKey =
  | "starter"
  | "growth"
  | "professional"
  | "business";

function cleanEmail(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function cleanProfileName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePlanKey(value: unknown): BillablePlanKey {
  const planKey = String(value || "")
    .trim()
    .toLowerCase();

  if (
    planKey === "starter" ||
    planKey === "growth" ||
    planKey === "professional" ||
    planKey === "business"
  ) {
    return planKey;
  }

  return "starter";
}

async function ensureKolkapProfile(
  supabase: SupabaseClient,
  user: User
) {
  const email = cleanEmail(user.email);
  const metadataName = cleanProfileName(user.user_metadata?.full_name);
  const now = new Date().toISOString();

  const { data: existingProfile, error: profileLoadError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLoadError) {
    throw profileLoadError;
  }

  if (existingProfile?.id) {
    const existingName = cleanProfileName(existingProfile.full_name);
    const profileName =
      metadataName || existingName || email || "Kolkap User";

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email: email || null,
        full_name: profileName,
        updated_at: now,
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const profileName = metadataName || email || "Kolkap User";

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    email: email || null,
    role: "customer",
    full_name: profileName,
    created_at: now,
    updated_at: now,
  });

  if (insertError) {
    throw insertError;
  }
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
    throw existingError;
  }

  if (existingBalance?.id) {
    return;
  }

  const { error: insertError } = await supabase
    .from("workspace_credit_balances")
    .insert({
      workspace_id: workspaceId,
      owner_user_id: ownerUserId,
      plan_name: normalizePlanKey(planKey),
      plan_credits: 0,
      purchased_credits: 0,
      used_credits: 0,
      status: "inactive",
    });

  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }
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

  await ensureKolkapProfile(supabase, user);

  const ownedWorkspace = await findOwnedWorkspace(supabase, user.id);

  if (ownedWorkspace?.id) {
    await ensureZeroCreditBalance({
      supabase,
      workspaceId: ownedWorkspace.id,
      ownerUserId: ownedWorkspace.owner_user_id,
      planKey: ownedWorkspace.plan_key,
    });

    return ownedWorkspace;
  }

  const teamWorkspace = await findTeamWorkspace(supabase, user.email);

  if (teamWorkspace?.id) {
    return teamWorkspace;
  }

  const fullName = cleanProfileName(user.user_metadata?.full_name);
  const businessType = cleanProfileName(user.user_metadata?.business_type);
  const selectedPlan = normalizePlanKey(
    user.user_metadata?.selected_plan
  );

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

      plan_key: selectedPlan,
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

      if (workspaceAfterDuplicate?.id) {
        await ensureZeroCreditBalance({
          supabase,
          workspaceId: workspaceAfterDuplicate.id,
          ownerUserId: workspaceAfterDuplicate.owner_user_id,
          planKey: workspaceAfterDuplicate.plan_key,
        });
      }

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
