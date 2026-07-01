import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONVERSATION_SELECT = `
  id,
  workspace_id,
  owner_user_id,
  ai_staff_id,
  customer_name,
  customer_phone,
  customer_channel,
  status,
  lead_status,
  handover_requested,
  last_message,
  last_message_at,
  created_at,
  updated_at
`;

const MESSAGE_SELECT = `
  id,
  conversation_id,
  workspace_id,
  owner_user_id,
  ai_staff_id,
  sender_type,
  message_text,
  created_at
`;

const WORKSPACE_SELECT = `
  id,
  owner_user_id,
  business_name,
  business_type,
  business_email,
  business_phone,
  country,
  plan_key,
  plan_status,
  billing_status
`;

type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

type SupportFilter =
  | "all"
  | "handover"
  | "open"
  | "handled"
  | "leads"
  | "recent";

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

function normalizeSupportFilter(value?: string | null): SupportFilter {
  const clean = cleanText(value).toLowerCase();

  if (
    clean === "handover" ||
    clean === "open" ||
    clean === "handled" ||
    clean === "leads" ||
    clean === "recent"
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
      `customer_name.ilike.%${search}%`,
      `customer_phone.ilike.%${search}%`,
      `customer_channel.ilike.%${search}%`,
      `status.ilike.%${search}%`,
      `lead_status.ilike.%${search}%`,
      `last_message.ilike.%${search}%`,
    ].join(",")
  );
}

function applySupportFilter(query: any, filter: SupportFilter) {
  if (filter === "handover") {
    return query.eq("handover_requested", true);
  }

  if (filter === "open") {
    return query.not("status", "eq", "handled");
  }

  if (filter === "handled") {
    return query.eq("status", "handled");
  }

  if (filter === "leads") {
    return query
      .not("lead_status", "is", null)
      .not("lead_status", "eq", "none")
      .not("lead_status", "eq", "");
  }

  if (filter === "recent") {
    return query.gte("updated_at", sevenDaysAgoIso());
  }

  return query;
}

async function countConversations(apply?: (query: any) => any) {
  const supabaseAdmin = getAdminSupabase();

  let query = supabaseAdmin
    .from("customer_conversations")
    .select("id", { count: "exact", head: true });

  if (apply) {
    query = apply(query);
  }

  const { count, error } = await query;

  if (error) throw error;

  return count || 0;
}

async function getSupportStats() {
  const [
    total,
    handover,
    open,
    handled,
    leads,
    recent,
  ] = await Promise.all([
    countConversations(),
    countConversations((query) => query.eq("handover_requested", true)),
    countConversations((query) => query.not("status", "eq", "handled")),
    countConversations((query) => query.eq("status", "handled")),
    countConversations((query) =>
      query
        .not("lead_status", "is", null)
        .not("lead_status", "eq", "none")
        .not("lead_status", "eq", "")
    ),
    countConversations((query) => query.gte("updated_at", sevenDaysAgoIso())),
  ]);

  return {
    total,
    handover,
    open,
    handled,
    leads,
    recent,
  };
}

function mapById(rows: Record<string, unknown>[]) {
  return new Map(rows.map((row) => [cleanText(row.id), row]));
}

async function enrichConversations(conversations: Record<string, unknown>[]) {
  const supabaseAdmin = getAdminSupabase();

  const workspaceIds = Array.from(
    new Set(
      conversations
        .map((conversation) => cleanText(conversation.workspace_id))
        .filter(Boolean)
    )
  );

  const ownerIds = Array.from(
    new Set(
      conversations
        .map((conversation) => cleanText(conversation.owner_user_id))
        .filter(Boolean)
    )
  );

  const [workspacesResult, ownersResult] = await Promise.all([
    workspaceIds.length
      ? supabaseAdmin
          .from("business_workspaces")
          .select(WORKSPACE_SELECT)
          .in("id", workspaceIds)
      : Promise.resolve({ data: [], error: null }),
    ownerIds.length
      ? supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, role")
          .in("id", ownerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (workspacesResult.error) throw workspacesResult.error;
  if (ownersResult.error) throw ownersResult.error;

  const workspacesById = mapById(
    (workspacesResult.data || []) as Record<string, unknown>[]
  );

  const ownersById = mapById(
    (ownersResult.data || []) as Record<string, unknown>[]
  );

  return conversations.map((conversation) => {
    const workspaceId = cleanText(conversation.workspace_id);
    const ownerId = cleanText(conversation.owner_user_id);

    return {
      ...conversation,
      workspace: workspacesById.get(workspaceId) || null,
      owner: ownersById.get(ownerId) || null,
    };
  });
}

export async function GET(req: Request) {
  const auth = await verifyAdmin(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const supabaseAdmin = getAdminSupabase();
    const url = new URL(req.url);

    const conversationId = cleanText(url.searchParams.get("conversationId"));
    const search = sanitizeSearch(url.searchParams.get("search"));
    const supportFilter = normalizeSupportFilter(
      url.searchParams.get("supportFilter")
    );
    const page = getPageNumber(url.searchParams.get("page"));
    const pageSize = getPageSize(url.searchParams.get("pageSize"));

    if (conversationId) {
      const { data: conversation, error: conversationError } =
        await supabaseAdmin
          .from("customer_conversations")
          .select(CONVERSATION_SELECT)
          .eq("id", conversationId)
          .maybeSingle();

      if (conversationError) {
        console.error("Failed to load support conversation:", conversationError);

        return Response.json(
          { success: false, error: "Failed to load support conversation." },
          { status: 500 }
        );
      }

      if (!conversation?.id) {
        return Response.json(
          { success: false, error: "Conversation not found." },
          { status: 404 }
        );
      }

      const { data: messages, error: messagesError } = await supabaseAdmin
        .from("customer_messages")
        .select(MESSAGE_SELECT)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Failed to load support messages:", messagesError);

        return Response.json(
          { success: false, error: "Failed to load support messages." },
          { status: 500 }
        );
      }

      const [enrichedConversation] = await enrichConversations([
        conversation as Record<string, unknown>,
      ]);

      return Response.json({
        success: true,
        conversation: enrichedConversation,
        messages: messages || [],
      });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("customer_conversations")
      .select(CONVERSATION_SELECT, { count: "exact" });

    query = applySearchFilter(query, search);
    query = applySupportFilter(query, supportFilter);

    query = query
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .range(from, to);

    const [{ data, error, count }, stats] = await Promise.all([
      query,
      getSupportStats(),
    ]);

    if (error) {
      console.error("Failed to load admin support conversations:", error);

      return Response.json(
        { success: false, error: "Failed to load support inbox." },
        { status: 500 }
      );
    }

    const conversations = await enrichConversations(
      (data || []) as Record<string, unknown>[]
    );

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return Response.json({
      success: true,
      conversations,
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
    console.error("Kolkap admin support API error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load support inbox.",
      },
      { status: 500 }
    );
  }
}