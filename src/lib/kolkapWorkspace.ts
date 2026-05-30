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
      business_phone: null,
      whatsapp_number: null,
      business_address: null,
      country: null,
      timezone: "Asia/Makassar",

      plan_key: "free_trial",
      plan_status: "trial",
      credits_total: 100,
      credits_used: 0,
      ai_staff_used: 0,

      whatsapp_status: "not_connected",
      go_live_status: "draft",

      ai_reply_language: "Auto-detect",
      ai_reply_tone: "Friendly Professional",
      handover_rule: "When customer asks for a human",
      ai_instruction:
        "Reply clearly, collect customer details, and ask the team to take over when the customer requests human support.",

      auto_reply_enabled: true,
      human_handover_enabled: true,
      lead_capture_enabled: true,
      notify_new_lead: true,
      notify_handover: true,
      notify_low_credits: true,
      notify_daily_summary: false,
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