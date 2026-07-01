import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOTIFICATION_SELECT = `
  id,
  workspace_id,
  owner_user_id,
  recipient_user_id,
  type,
  channel,
  title,
  message,
  action_label,
  action_url,
  priority,
  status,
  source_table,
  source_record_id,
  metadata,
  created_at,
  updated_at,
  read_at,
  archived_at
`;

type AuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

type NotificationStatus = "all" | "unread" | "read" | "archived";

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

  return {
    authorized: true,
    userId: user.id,
    userEmail: user.email || null,
  };
}

async function findWorkspaceForUser(userId: string, userEmail?: string | null) {
  const supabaseAdmin = getAdminSupabase();

  const { data: ownedWorkspace } = await supabaseAdmin
    .from("business_workspaces")
    .select("id, owner_user_id, business_name")
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
    .select("id, owner_user_id, business_name")
    .eq("id", teamMember.workspace_id)
    .maybeSingle();

  return teamWorkspace || null;
}

function getAccessOrFilter({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId?: string | null;
}) {
  const filters = [
    `recipient_user_id.eq.${userId}`,
    `owner_user_id.eq.${userId}`,
  ];

  if (workspaceId) {
    filters.push(`workspace_id.eq.${workspaceId}`);
  }

  return filters.join(",");
}

function getPageNumber(value?: string | null) {
  const page = Number(value || "1");

  if (!Number.isFinite(page) || page < 1) return 1;

  return Math.floor(page);
}

function getPageSize(value?: string | null) {
  const pageSize = Number(value || "25");

  if (!Number.isFinite(pageSize) || pageSize < 1) return 25;

  return Math.min(Math.floor(pageSize), 100);
}

function normalizeStatus(value?: string | null): NotificationStatus {
  const clean = cleanText(value).toLowerCase();

  if (
    clean === "unread" ||
    clean === "read" ||
    clean === "archived" ||
    clean === "all"
  ) {
    return clean;
  }

  return "all";
}

function normalizeAction(value: unknown) {
  const clean = cleanText(value).toLowerCase();

  if (
    clean === "mark_read" ||
    clean === "mark_all_read" ||
    clean === "archive"
  ) {
    return clean;
  }

  return "";
}

export async function GET(req: Request) {
  const auth = await verifyUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const supabaseAdmin = getAdminSupabase();
    const url = new URL(req.url);

    const page = getPageNumber(url.searchParams.get("page"));
    const pageSize = getPageSize(url.searchParams.get("pageSize"));
    const status = normalizeStatus(url.searchParams.get("status"));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const workspace = await findWorkspaceForUser(auth.userId!, auth.userEmail);
    const accessFilter = getAccessOrFilter({
      userId: auth.userId!,
      workspaceId: workspace?.id || null,
    });

    let query = supabaseAdmin
      .from("kolkap_notifications")
      .select(NOTIFICATION_SELECT, { count: "exact" })
      .or(accessFilter);

    if (status === "unread" || status === "read" || status === "archived") {
      query = query.eq("status", status);
    } else {
      query = query.neq("status", "archived");
    }

    query = query
      .order("created_at", { ascending: false })
      .range(from, to);

    const [notificationsResult, unreadResult] = await Promise.all([
      query,
      supabaseAdmin
        .from("kolkap_notifications")
        .select("id", { count: "exact", head: true })
        .or(accessFilter)
        .eq("status", "unread"),
    ]);

    if (notificationsResult.error) {
      console.error("Failed to load notifications:", notificationsResult.error);

      return Response.json(
        { success: false, error: "Failed to load notifications." },
        { status: 500 }
      );
    }

    if (unreadResult.error) {
      console.error("Failed to load unread count:", unreadResult.error);

      return Response.json(
        { success: false, error: "Failed to load notification count." },
        { status: 500 }
      );
    }

    const totalCount = notificationsResult.count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return Response.json({
      success: true,
      notifications: notificationsResult.data || [],
      unreadCount: unreadResult.count || 0,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
        from: totalCount === 0 ? 0 : from + 1,
        to: Math.min(to + 1, totalCount),
      },
    });
  } catch (error) {
    console.error("Notifications GET error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load notifications.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await verifyUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const supabaseAdmin = getAdminSupabase();
    const body = await req.json().catch(() => ({}));

    const action = normalizeAction(body.action);
    const notificationId = cleanText(body.notificationId);

    if (!action) {
      return Response.json(
        { success: false, error: "Invalid notification action." },
        { status: 400 }
      );
    }

    const workspace = await findWorkspaceForUser(auth.userId!, auth.userEmail);
    const accessFilter = getAccessOrFilter({
      userId: auth.userId!,
      workspaceId: workspace?.id || null,
    });

    if (action === "mark_all_read") {
      const { data, error } = await supabaseAdmin
        .from("kolkap_notifications")
        .update({
          status: "read",
          read_at: new Date().toISOString(),
        })
        .or(accessFilter)
        .eq("status", "unread")
        .select(NOTIFICATION_SELECT);

      if (error) {
        console.error("Failed to mark all notifications as read:", error);

        return Response.json(
          { success: false, error: "Failed to mark notifications as read." },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        notifications: data || [],
      });
    }

    if (!notificationId) {
      return Response.json(
        { success: false, error: "Missing notification ID." },
        { status: 400 }
      );
    }

    const { data: existingNotification, error: existingError } =
      await supabaseAdmin
        .from("kolkap_notifications")
        .select("id")
        .eq("id", notificationId)
        .or(accessFilter)
        .maybeSingle();

    if (existingError) {
      console.error("Failed to check notification access:", existingError);

      return Response.json(
        { success: false, error: "Failed to check notification access." },
        { status: 500 }
      );
    }

    if (!existingNotification?.id) {
      return Response.json(
        { success: false, error: "Notification not found." },
        { status: 404 }
      );
    }

    const updates =
      action === "archive"
        ? {
            status: "archived",
            archived_at: new Date().toISOString(),
          }
        : {
            status: "read",
            read_at: new Date().toISOString(),
          };

    const { data, error } = await supabaseAdmin
      .from("kolkap_notifications")
      .update(updates)
      .eq("id", notificationId)
      .select(NOTIFICATION_SELECT)
      .single();

    if (error) {
      console.error("Failed to update notification:", error);

      return Response.json(
        { success: false, error: "Failed to update notification." },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      notification: data,
    });
  } catch (error) {
    console.error("Notifications PATCH error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update notification.",
      },
      { status: 500 }
    );
  }
}