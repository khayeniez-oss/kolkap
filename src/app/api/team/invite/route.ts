import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const workspaceId = String(body.workspace_id || "");
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "Inbox Agent");
    const permissionLevel = String(body.permission_level || "inbox");

    if (!workspaceId || !fullName || !email) {
      return NextResponse.json(
        { error: "Missing team member details." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to invite a team member." },
        { status: 401 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: workspace, error: workspaceError } = await adminSupabase
      .from("business_workspaces")
      .select("id, owner_user_id")
      .eq("id", workspaceId)
      .eq("owner_user_id", user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found or you do not have permission." },
        { status: 403 }
      );
    }

    const { data: inviteData, error: inviteError } =
      await adminSupabase.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          workspace_id: workspaceId,
          team_role: role,
          permission_level: permissionLevel,
        },
        redirectTo: `${siteUrl}/team/accept`,
      });

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      );
    }

    const memberPayload = {
      workspace_id: workspaceId,
      owner_user_id: user.id,
      full_name: fullName,
      email,
      role,
      permission_level: permissionLevel,
      status: "invited",
      invited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: existingMember } = await adminSupabase
      .from("workspace_team_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .maybeSingle();

    if (existingMember) {
      const { data, error } = await adminSupabase
        .from("workspace_team_members")
        .update(memberPayload)
        .eq("id", existingMember.id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ member: data, invited_user: inviteData.user });
    }

    const { data, error } = await adminSupabase
      .from("workspace_team_members")
      .insert(memberPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ member: data, invited_user: inviteData.user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invite could not be sent.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}