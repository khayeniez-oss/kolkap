import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedRoles = new Set([
  "Admin",
  "Manager",
  "Inbox Agent",
  "Sales Agent",
  "Content Assistant",
  "Viewer",
]);

const allowedPermissions = new Set([
  "admin",
  "manager",
  "inbox",
  "sales",
  "content",
  "viewer",
]);

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function cleanEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
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

    const workspaceId = cleanText(body.workspace_id);
    const fullName = cleanText(body.full_name);
    const email = cleanEmail(body.email);
    const requestedRole = cleanText(body.role, "Inbox Agent");
    const requestedPermission = cleanText(body.permission_level, "inbox");

    const role = allowedRoles.has(requestedRole)
      ? requestedRole
      : "Inbox Agent";

    const permissionLevel = allowedPermissions.has(requestedPermission)
      ? requestedPermission
      : "inbox";

    if (!workspaceId || !fullName || !email) {
      return NextResponse.json(
        { error: "Missing team member details." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const userSupabase = await getUserSupabase();

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to invite a team member." },
        { status: 401 }
      );
    }

    const adminSupabase = getAdminSupabase();

    const { data: workspace, error: workspaceError } = await adminSupabase
      .from("business_workspaces")
      .select("id, owner_user_id, business_name, business_email")
      .eq("id", workspaceId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (workspaceError) {
      throw workspaceError;
    }

    if (!workspace?.id) {
      return NextResponse.json(
        { error: "Workspace not found or you do not have permission." },
        { status: 403 }
      );
    }

    const { data: existingMember, error: existingError } = await adminSupabase
      .from("workspace_team_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const now = new Date().toISOString();

    const memberPayload = {
      workspace_id: workspaceId,
      owner_user_id: user.id,
      full_name: fullName,
      email,
      role,
      permission_level: permissionLevel,
      status: "invited",
      invited_at: now,
      accepted_at: null,
      updated_at: now,
    };

    let savedMember;

    if (existingMember?.id) {
      const { data, error } = await adminSupabase
        .from("workspace_team_members")
        .update(memberPayload)
        .eq("id", existingMember.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      savedMember = data;
    } else {
      const { data, error } = await adminSupabase
        .from("workspace_team_members")
        .insert(memberPayload)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      savedMember = data;
    }

    let invitedUser = null;
    let inviteWarning = "";

    try {
      const inviteResult = await adminSupabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: fullName,
            workspace_id: workspaceId,
            workspace_name: workspace.business_name || null,
            team_role: role,
            permission_level: permissionLevel,
            invited_by_user_id: user.id,
          },
          redirectTo: `${getBaseUrl()}/team/accept`,
        }
      );

      if (inviteResult.error) {
        inviteWarning = inviteResult.error.message;
      } else {
        invitedUser = inviteResult.data.user;
      }
    } catch (inviteError) {
      inviteWarning =
        inviteError instanceof Error
          ? inviteError.message
          : "Invitation email could not be sent.";
    }

    return NextResponse.json({
      member: savedMember,
      invited_user: invitedUser,
      invite_warning: inviteWarning || null,
      message: inviteWarning
        ? "Team member was saved, but the invitation email could not be sent."
        : "Team member saved and invitation email sent.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invite could not be sent.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}