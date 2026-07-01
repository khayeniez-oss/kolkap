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