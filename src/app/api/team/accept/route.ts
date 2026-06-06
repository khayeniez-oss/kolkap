import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phoneNumber = String(body.phone_number || "").trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    const userSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { error: "This invitation session is not active. Please open the newest invitation email." },
        { status: 401 }
      );
    }

    const email = user.email.toLowerCase();
    const invitedWorkspaceId =
      typeof user.user_metadata?.workspace_id === "string"
        ? user.user_metadata.workspace_id
        : "";

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let memberQuery = adminSupabase
      .from("workspace_team_members")
      .select("*")
      .eq("email", email)
      .neq("status", "disabled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invitedWorkspaceId) {
      memberQuery = adminSupabase
        .from("workspace_team_members")
        .select("*")
        .eq("email", email)
        .eq("workspace_id", invitedWorkspaceId)
        .neq("status", "disabled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    }

    const { data: member, error: memberError } = await memberQuery;

    if (memberError || !member) {
      return NextResponse.json(
        {
          error:
            "No matching team invitation was found. Please use the newest invitation email and the same email address that was invited.",
        },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const { data: updatedMember, error: updateError } = await adminSupabase
      .from("workspace_team_members")
      .update({
        status: "active",
        phone_number: phoneNumber || null,
        accepted_at: now,
        updated_at: now,
      })
      .eq("id", member.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    await adminSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        phone_number: phoneNumber || null,
        workspace_id: member.workspace_id,
        team_role: member.role,
        permission_level: member.permission_level,
      },
    });

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