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

type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

type AttentionFilter =
  | "all"
  | "needs_attention"
  | "in_progress"
  | "resolved"
  | "closed"
  | "high_priority";

type HelpStatus = "needs_attention" | "in_progress" | "resolved" | "closed";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

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

function getAdminEmails() {
  return cleanText(process.env.KOLKAP_ADMIN_EMAILS)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

async function verifyAdmin(req: Request): Promise<AdminAuthResult> {
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
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unauthorized. Invalid session." },
        { status: 401 }
      ),
    };
  }

  const userEmail = cleanText(user.email).toLowerCase();
  const adminEmails = getAdminEmails();
  const emailAllowed = Boolean(userEmail && adminEmails.includes(userEmail));

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError && !emailAllowed) {
    console.error("Failed to verify Kolkap admin profile:", profileError);

    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Unable to verify admin access." },
        { status: 500 }
      ),
    };
  }

  const role = String((profile as { role?: string } | null)?.role || "")
    .toLowerCase()
    .trim();

  const roleAllowed = role.includes("admin");

  if (!emailAllowed && !roleAllowed) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, error: "Forbidden. Admin access is required." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: user.id,
    userEmail: user.email,
  };
}

function getPageNumber(value?: string | null) {
  const page = Number(value || "1");

  if (!Number.isFinite(page) || page < 1) return 1;

  return Math.floor(page);
}

function getPageSize(value?: string | null) {
  const pageSize = Number(value || String(DEFAULT_PAGE_SIZE));

  if (!Number.isFinite(pageSize) || pageSize < 1) return DEFAULT_PAGE_SIZE;

  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}

function sanitizeSearch(value?: string | null) {
  return cleanText(value)
    .replace(/[%_,]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

function normalizeFilter(value?: string | null): AttentionFilter {
  const clean = cleanText(value).toLowerCase();

  if (
    clean === "needs_attention" ||
    clean === "in_progress" ||
    clean === "resolved" ||
    clean === "closed" ||
    clean === "high_priority"
  ) {
    return clean;
  }

  return "all";
}

function normalizeHelpStatus(value: unknown): HelpStatus | "" {
  const clean = cleanText(value).toLowerCase();

  if (
    clean === "needs_attention" ||
    clean === "in_progress" ||
    clean === "resolved" ||
    clean === "closed"
  ) {
    return clean;
  }

  return "";
}

function sevenDaysAgoIso() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString();
}

function applySearchFilter(query: any, search: string) {
  if (!search) return query;

  return query.or(
    [
      `business_name.ilike.%${search}%`,
      `customer_name.ilike.%${search}%`,
      `customer_email.ilike.%${search}%`,
      `customer_phone.ilike.%${search}%`,
      `category.ilike.%${search}%`,
      `priority.ilike.%${search}%`,
      `subject.ilike.%${search}%`,
      `message.ilike.%${search}%`,
      `status.ilike.%${search}%`,
    ].join(",")
  );
}

function applyAttentionFilter(query: any, filter: AttentionFilter) {
  if (filter === "needs_attention") {
    return query.eq("status", "needs_attention");
  }

  if (filter === "in_progress") {
    return query.eq("status", "in_progress");
  }

  if (filter === "resolved") {
    return query.eq("status", "resolved");
  }

  if (filter === "closed") {
    return query.eq("status", "closed");
  }

  if (filter === "high_priority") {
    return query.in("priority", ["high", "urgent"]);
  }

  return query;
}

async function countRequests(apply?: (query: any) => any) {
  const supabaseAdmin = getAdminSupabase();

  let query = supabaseAdmin
    .from("kolkap_help_requests")
    .select("id", { count: "exact", head: true });

  if (apply) {
    query = apply(query);
  }

  const { count, error } = await query;

  if (error) throw error;

  return count || 0;
}

async function getStats() {
  const [
    total,
    needsAttention,
    inProgress,
    resolved,
    closed,
    highPriority,
    recent,
  ] = await Promise.all([
    countRequests(),
    countRequests((query) => query.eq("status", "needs_attention")),
    countRequests((query) => query.eq("status", "in_progress")),
    countRequests((query) => query.eq("status", "resolved")),
    countRequests((query) => query.eq("status", "closed")),
    countRequests((query) => query.in("priority", ["high", "urgent"])),
    countRequests((query) => query.gte("created_at", sevenDaysAgoIso())),
  ]);

  return {
    total,
    needsAttention,
    inProgress,
    resolved,
    closed,
    highPriority,
    recent,
  };
}

function getNotificationTitle(status: HelpStatus) {
  if (status === "in_progress") return "Kolkap is reviewing your request";
  if (status === "resolved") return "Your help request was marked resolved";
  if (status === "closed") return "Your help request was closed";
  return "Kolkap received your help request update";
}

function getNotificationMessage({
  status,
  subject,
  adminNote,
}: {
  status: HelpStatus;
  subject: string;
  adminNote: string;
}) {
  const statusText = status.replace(/_/g, " ");

  if (adminNote) {
    return `Update for "${subject}": ${adminNote}`;
  }

  return `Your help request "${subject}" was updated to ${statusText}.`;
}

async function createHelpRequestNotification({
  request,
  status,
  adminNote,
}: {
  request: any;
  status: HelpStatus;
  adminNote: string;
}) {
  const supabaseAdmin = getAdminSupabase();

  const recipientUserId =
    request.submitted_by_user_id || request.owner_user_id || null;

  if (!recipientUserId) {
    return;
  }

  const { error } = await supabaseAdmin.from("kolkap_notifications").insert({
    workspace_id: request.workspace_id || null,
    owner_user_id: request.owner_user_id || null,
    recipient_user_id: recipientUserId,
    type: "help_request_updated",
    channel: "system",
    title: getNotificationTitle(status),
    message: getNotificationMessage({
      status,
      subject: request.subject || "Help request",
      adminNote,
    }),
    action_label: "Open Help Centre",
    action_url: "/dashboard/help",
    priority: status === "resolved" || status === "closed" ? "normal" : "high",
    status: "unread",
    source_table: "kolkap_help_requests",
    source_record_id: request.id,
    metadata: {
      help_request_id: request.id,
      help_status: status,
      category: request.category,
      subject: request.subject,
    },
  });

  if (error) {
    console.error("Failed to create help request notification:", error);
  }
}

export async function GET(req: Request) {
  const auth = await verifyAdmin(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const supabaseAdmin = getAdminSupabase();
    const url = new URL(req.url);

    const search = sanitizeSearch(url.searchParams.get("search"));
    const attentionFilter = normalizeFilter(url.searchParams.get("filter"));
    const page = getPageNumber(url.searchParams.get("page"));
    const pageSize = getPageSize(url.searchParams.get("pageSize"));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("kolkap_help_requests")
      .select(HELP_SELECT, { count: "exact" });

    query = applySearchFilter(query, search);
    query = applyAttentionFilter(query, attentionFilter);

    query = query
      .order("created_at", { ascending: false })
      .range(from, to);

    const [{ data, error, count }, stats] = await Promise.all([
      query,
      getStats(),
    ]);

    if (error) {
      console.error("Failed to load needs attention:", error);

      return Response.json(
        { success: false, error: "Failed to load needs attention requests." },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return Response.json({
      success: true,
      requests: data || [],
      stats,
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
    console.error("Needs attention API error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load needs attention requests.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const auth = await verifyAdmin(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const supabaseAdmin = getAdminSupabase();
    const body = await req.json().catch(() => ({}));

    const requestId = cleanText(body.requestId);
    const nextStatus = normalizeHelpStatus(body.status);
    const adminNote = cleanText(body.adminNote).slice(0, 5000);
    const notifyCustomer = body.notifyCustomer !== false;

    if (!requestId) {
      return Response.json(
        { success: false, error: "Missing help request ID." },
        { status: 400 }
      );
    }

    if (!nextStatus) {
      return Response.json(
        { success: false, error: "Invalid help request status." },
        { status: 400 }
      );
    }

    const { data: existingRequest, error: existingError } = await supabaseAdmin
      .from("kolkap_help_requests")
      .select(HELP_SELECT)
      .eq("id", requestId)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to check help request:", existingError);

      return Response.json(
        { success: false, error: "Failed to check help request." },
        { status: 500 }
      );
    }

    if (!existingRequest?.id) {
      return Response.json(
        { success: false, error: "Help request not found." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const updates: Record<string, string | null> = {
      status: nextStatus,
      admin_note: adminNote || null,
      assigned_to_admin_id: auth.userId || null,
      resolved_at: nextStatus === "resolved" ? now : null,
      closed_at: nextStatus === "closed" ? now : null,
    };

    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from("kolkap_help_requests")
      .update(updates)
      .eq("id", requestId)
      .select(HELP_SELECT)
      .single();

    if (updateError) {
      console.error("Failed to update help request:", updateError);

      return Response.json(
        { success: false, error: "Failed to update help request." },
        { status: 500 }
      );
    }

    if (notifyCustomer) {
      await createHelpRequestNotification({
        request: updatedRequest,
        status: nextStatus,
        adminNote,
      });
    }

    return Response.json({
      success: true,
      request: updatedRequest,
      notifiedCustomer: notifyCustomer,
    });
  } catch (error) {
    console.error("Needs attention PATCH error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update help request.",
      },
      { status: 500 }
    );
  }
}