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
  credits_total: number;
  credits_used: number;
  ai_staff_used: number;
  whatsapp_status: string;
  go_live_status: string;
  trial_started_at: string;
  trial_ends_at: string;
  created_at: string;
  updated_at: string;
};

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

  const { data: existingWorkspace, error: existingError } = await supabase
    .from("business_workspaces")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingWorkspace) {
    return existingWorkspace as KolkapWorkspace;
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";

  const businessType =
    typeof user.user_metadata?.business_type === "string"
      ? user.user_metadata.business_type
      : null;

  const { data: newWorkspace, error: insertError } = await supabase
    .from("business_workspaces")
    .insert({
      owner_user_id: user.id,
      business_name: fullName ? `${fullName}'s Business` : "My Business",
      business_type: businessType,
      business_email: user.email ?? null,
      plan_key: "free_trial",
      plan_status: "trial",
      credits_total: 100,
      credits_used: 0,
      ai_staff_used: 0,
      whatsapp_status: "not_connected",
      go_live_status: "draft",
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: workspaceAfterDuplicate, error: duplicateFetchError } =
        await supabase
          .from("business_workspaces")
          .select("*")
          .eq("owner_user_id", user.id)
          .maybeSingle();

      if (duplicateFetchError) {
        throw duplicateFetchError;
      }

      return workspaceAfterDuplicate as KolkapWorkspace;
    }

    throw insertError;
  }

  return newWorkspace as KolkapWorkspace;
}