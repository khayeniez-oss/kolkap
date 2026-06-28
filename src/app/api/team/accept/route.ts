import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getUserSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phoneNumber = cleanText(body.phone_number);

    const userSupabase = await getUserSupabase();

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user?.id || !user.email) {
      return NextResponse.json(
        {
          error:
            "This invitation session is not active. Please open the newest invitation email.",
        },
        { status: 401 }
      );
    }

    const email = user.email.toLowerCase();

    const invitedWorkspaceId =
      typeof user.user_metadata?.workspace_id === "string"
        ? user.user_metadata.workspace_id
        : "";

    const adminSupabase = getAdminSupabase();

    let memberQuery = adminSupabase
      .from("workspace_team_members")
      .select("*")
      .eq("email", email)
      .neq("status", "disabled");

    if (invitedWorkspaceId) {
      memberQuery = memberQuery.eq("workspace_id", invitedWorkspaceId);
    }

    const { data: member, error: memberError } = await memberQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }

    if (!member?.id) {
      return NextResponse.json(
        {
          error:
            "No matching team invitation was found. Please use the newest invitation email and the same email address that was invited.",
        },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      status: "active",
      accepted_at: now,
      updated_at: now,
    };

    if (phoneNumber) {
      updatePayload.phone_number = phoneNumber;
    }

    const { data: updatedMember, error: updateError } = await adminSupabase
      .from("workspace_team_members")
      .update(updatePayload)
      .eq("id", member.id)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    const { error: userUpdateError } =
      await adminSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          ...(phoneNumber ? { phone_number: phoneNumber } : {}),
          workspace_id: member.workspace_id,
          team_role: member.role,
          permission_level: member.permission_level,
          team_member_id: member.id,
        },
      });

    if (userUpdateError) {
      throw userUpdateError;
    }

    return NextResponse.json({
      member: updatedMember,
      message: "Team invitation accepted.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Team invitation could not be accepted.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}