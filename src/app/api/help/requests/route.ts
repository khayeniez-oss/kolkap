import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HELP_SELECT = `
  id,
  workspace_id,
  owner_user_id,
  submitted_by_user_id,
  business_name,
  customer_name,
  customer_email,
  customer_phone,
  category,
  priority,
  subject,
  message,
  status,
  admin_note,
  assigned_to_admin_id,
  created_at,
  updated_at,
  resolved_at,
  closed_at
`;

type AuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  userName?: string | null;
  response?: Response;
};

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

function cleanText(value: unknown, fallback = "") {
  const text =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? fallback
        : String(value);

  return text.trim();
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

function normalizeCategory(value: unknown) {
  const clean = cleanText(value).toLowerCase();

  if (
    clean === "whatsapp" ||
    clean === "website_chat" ||
    clean === "ai_staff" ||
    clean === "billing" ||
    clean === "credits" ||
    clean === "account" ||
    clean === "bug" ||
    clean === "other"
  ) {
    return clean;
  }

  return "other";
}

function normalizePriority(value: unknown) {
  const clean = cleanText(value).toLowerCase();

  if (
    clean === "low" ||
    clean === "normal" ||
    clean === "high" ||
    clean === "urgent"
  ) {
    return clean;
  }

  return "normal";
}

async function verifyUser(req: Request): Promise<AuthResult> {
  const supabaseAdmin = getAdminSupabase();
  const token = getBearerToken(req);

  if (!token) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unauthorized. Login is required." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user?.id) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unauthorized. Invalid session." },
        { status: 401 }
      ),
    };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    authorized: true,
    userId: user.id,
    userEmail: user.email || profile?.email || null,
    userName: profile?.full_name || null,
  };
}

async function findWorkspaceForUser(userId: string, userEmail?: string | null) {
  const supabaseAdmin = getAdminSupabase();

  const { data: ownedWorkspace } = await supabaseAdmin
    .from("business_workspaces")
    .select("id, owner_user_id, business_name, business_email, business_phone")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ownedWorkspace?.id) {
    return ownedWorkspace;
  }

  if (!userEmail) {
    return null;
  }

  const { data: teamMember } = await supabaseAdmin
    .from("workspace_team_members")
    .select("workspace_id")
    .eq("email", userEmail.toLowerCase())
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!teamMember?.workspace_id) {
    return null;
  }

  const { data: teamWorkspace } = await supabaseAdmin
    .from("business_workspaces")
    .select("id, owner_user_id, business_name, business_email, business_phone")
    .eq("id", teamMember.workspace_id)
    .maybeSingle();

  return teamWorkspace || null;
}

export async function GET(req: Request) {
  const auth = await verifyUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const supabaseAdmin = getAdminSupabase();
    const workspace = await findWorkspaceForUser(auth.userId!, auth.userEmail);

    let query = supabaseAdmin
      .from("kolkap_help_requests")
      .select(HELP_SELECT)
      .order("created_at", { ascending: false })
      .limit(20);

    if (workspace?.id) {
      query = query.or(
        `submitted_by_user_id.eq.${auth.userId},owner_user_id.eq.${auth.userId},workspace_id.eq.${workspace.id}`
      );
    } else {
      query = query.or(
        `submitted_by_user_id.eq.${auth.userId},owner_user_id.eq.${auth.userId}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to load help requests:", error);

      return Response.json(
        { success: false, error: "Failed to load help requests." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      requests: data || [],
    });
  } catch (error) {
    console.error("Help requests GET error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load help requests.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await verifyUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const supabaseAdmin = getAdminSupabase();
    const body = await req.json().catch(() => ({}));

    const subject = cleanText(body.subject).slice(0, 160);
    const message = cleanText(body.message).slice(0, 5000);
    const category = normalizeCategory(body.category);
    const priority = normalizePriority(body.priority);
    const customerPhone = cleanText(body.customer_phone).slice(0, 80);

    if (!subject) {
      return Response.json(
        { success: false, error: "Please enter a subject." },
        { status: 400 }
      );
    }

    if (!message) {
      return Response.json(
        { success: false, error: "Please describe the problem." },
        { status: 400 }
      );
    }

    const workspace = await findWorkspaceForUser(auth.userId!, auth.userEmail);

    const ownerUserId = workspace?.owner_user_id || auth.userId;
    const businessName = workspace?.business_name || null;

    const { data, error } = await supabaseAdmin
      .from("kolkap_help_requests")
      .insert({
        workspace_id: workspace?.id || null,
        owner_user_id: ownerUserId,
        submitted_by_user_id: auth.userId,
        business_name: businessName,
        customer_name: auth.userName || null,
        customer_email: auth.userEmail || null,
        customer_phone: customerPhone || workspace?.business_phone || null,
        category,
        priority,
        subject,
        message,
        status: "needs_attention",
      })
      .select(HELP_SELECT)
      .single();

    if (error) {
      console.error("Failed to create help request:", error);

      return Response.json(
        { success: false, error: "Failed to send help request." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      request: data,
    });
  } catch (error) {
    console.error("Help requests POST error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send help request.",
      },
      { status: 500 }
    );
  }
}