import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USAGE_EVENT_SELECT = `
  id,
  workspace_id,
  owner_user_id,
  user_id,
  event_type,
  channel,
  source_page,
  credits_used,
  event_count,
  status,
  metadata,
  created_at
`;

const WORKSPACE_SELECT = `
  id,
  owner_user_id,
  business_name,
  business_type,
  business_email,
  country,
  plan_key,
  plan_status,
  billing_status,
  credits_total,
  credits_used
`;

const CREDIT_BALANCE_SELECT = `
  id,
  workspace_id,
  owner_user_id,
  plan_name,
  plan_credits,
  purchased_credits,
  used_credits,
  billing_period_start,
  billing_period_end,
  status,
  metadata,
  created_at,
  updated_at
`;

type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

type DateRange = "all" | "today" | "7d" | "30d";
type UsageCategory =
  | "all"
  | "whatsapp"
  | "website_chat"
  | "test_ai"
  | "content"
  | "inbox"
  | "other";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const STATS_LIMIT = 10000;

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

function normalizeDateRange(value?: string | null): DateRange {
  const clean = cleanText(value).toLowerCase();

  if (clean === "today" || clean === "7d" || clean === "30d") return clean;

  return "all";
}

function normalizeUsageCategory(value?: string | null): UsageCategory {
  const clean = cleanText(value).toLowerCase();

  if (
    clean === "whatsapp" ||
    clean === "website_chat" ||
    clean === "test_ai" ||
    clean === "content" ||
    clean === "inbox" ||
    clean === "other"
  ) {
    return clean;
  }

  return "all";
}

function getDateRangeStart(dateRange: DateRange) {
  const now = new Date();

  if (dateRange === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }

  if (dateRange === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start.toISOString();
  }

  if (dateRange === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start.toISOString();
  }

  return "";
}

function applyDateRangeFilter(query: any, dateRange: DateRange) {
  const start = getDateRangeStart(dateRange);

  if (!start) return query;

  return query.gte("created_at", start);
}

function applySearchFilter(query: any, search: string) {
  if (!search) return query;

  return query.or(
    [
      `event_type.ilike.%${search}%`,
      `channel.ilike.%${search}%`,
      `source_page.ilike.%${search}%`,
      `status.ilike.%${search}%`,
    ].join(",")
  );
}

function applyUsageCategoryFilter(query: any, category: UsageCategory) {
  if (category === "whatsapp") {
    return query.or(
      "event_type.ilike.%whatsapp%,channel.ilike.%whatsapp%,source_page.ilike.%whatsapp%"
    );
  }

  if (category === "website_chat") {
    return query.or(
      "event_type.ilike.%website%,event_type.ilike.%chat%,channel.ilike.%website%,channel.ilike.%chat%,source_page.ilike.%website%,source_page.ilike.%chat%"
    );
  }

  if (category === "test_ai") {
    return query.or(
      "event_type.ilike.%test%,channel.ilike.%test%,source_page.ilike.%test%"
    );
  }

  if (category === "content") {
    return query.or(
      "event_type.ilike.%content%,event_type.ilike.%generate%,event_type.ilike.%generation%,source_page.ilike.%content%,source_page.ilike.%studio%"
    );
  }

  if (category === "inbox") {
    return query.or(
      "event_type.ilike.%inbox%,channel.ilike.%inbox%,source_page.ilike.%inbox%"
    );
  }

  if (category === "other") {
    return query
      .not("event_type", "ilike", "%whatsapp%")
      .not("event_type", "ilike", "%website%")
      .not("event_type", "ilike", "%chat%")
      .not("event_type", "ilike", "%test%")
      .not("event_type", "ilike", "%content%")
      .not("event_type", "ilike", "%generate%")
      .not("source_page", "ilike", "%studio%")
      .not("source_page", "ilike", "%inbox%");
  }

  return query;
}

function rowSearchText(row: Record<string, unknown>) {
  return [
    row.event_type,
    row.channel,
    row.source_page,
    row.status,
  ]
    .map((item) => cleanText(item).toLowerCase())
    .join(" ");
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function getRowCategory(row: Record<string, unknown>) {
  const text = rowSearchText(row);

  if (includesAny(text, ["whatsapp"])) return "whatsapp";
  if (includesAny(text, ["website", "chat", "widget"])) return "website_chat";
  if (includesAny(text, ["test"])) return "test_ai";
  if (includesAny(text, ["content", "generate", "generation", "studio"])) {
    return "content";
  }
  if (includesAny(text, ["inbox"])) return "inbox";

  return "other";
}

function isFailedEvent(row: Record<string, unknown>) {
  const status = cleanText(row.status).toLowerCase();

  return (
    status.includes("fail") ||
    status.includes("error") ||
    status.includes("rejected")
  );
}

function getCreditsUsed(row: Record<string, unknown>) {
  const credits = Number(row.credits_used || 0);

  if (!Number.isFinite(credits) || credits < 0) return 0;

  return credits;
}

function getEventCount(row: Record<string, unknown>) {
  const count = Number(row.event_count || 0);

  if (!Number.isFinite(count) || count < 1) return 1;

  return count;
}

function latestByWorkspace(rows: Record<string, unknown>[]) {
  const map = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const workspaceId = cleanText(row.workspace_id);

    if (!workspaceId) continue;

    const existing = map.get(workspaceId);

    if (!existing) {
      map.set(workspaceId, row);
      continue;
    }

    const existingDate = new Date(cleanText(existing.updated_at)).getTime();
    const rowDate = new Date(cleanText(row.updated_at)).getTime();

    if (
      Number.isFinite(rowDate) &&
      (!Number.isFinite(existingDate) || rowDate > existingDate)
    ) {
      map.set(workspaceId, row);
    }
  }

  return map;
}

function getCreditBalanceNumbers(row: Record<string, unknown> | null) {
  if (!row) {
    return {
      total: 0,
      used: 0,
      remaining: 0,
    };
  }

  const planCredits = Number(row.plan_credits || 0);
  const purchasedCredits = Number(row.purchased_credits || 0);
  const usedCredits = Number(row.used_credits || 0);
  const total = Math.max(planCredits + purchasedCredits, 0);
  const used = Math.max(usedCredits, 0);

  return {
    total,
    used,
    remaining: Math.max(total - used, 0),
  };
}

async function getUsageStats(dateRange: DateRange) {
  const supabaseAdmin = getAdminSupabase();

  let eventsQuery = supabaseAdmin
    .from("workspace_usage_events")
    .select(
      "id, workspace_id, event_type, channel, source_page, credits_used, event_count, status, created_at",
      { count: "exact" }
    );

  eventsQuery = applyDateRangeFilter(eventsQuery, dateRange);

  const [eventsResult, balancesResult] = await Promise.all([
    eventsQuery.order("created_at", { ascending: false }).limit(STATS_LIMIT),
    supabaseAdmin
      .from("workspace_credit_balances")
      .select(CREDIT_BALANCE_SELECT)
      .order("updated_at", { ascending: false })
      .limit(5000),
  ]);

  if (eventsResult.error) throw eventsResult.error;
  if (balancesResult.error) throw balancesResult.error;

  const events = (eventsResult.data || []) as Record<string, unknown>[];
  const balances = (balancesResult.data || []) as Record<string, unknown>[];

  const latestBalances = latestByWorkspace(balances);
  const balanceRows = Array.from(latestBalances.values());

  const creditTotals = balanceRows.reduce<{
  total: number;
  used: number;
  remaining: number;
}>(
  (acc, row) => {
    const numbers = getCreditBalanceNumbers(row);

    return {
      total: acc.total + numbers.total,
      used: acc.used + numbers.used,
      remaining: acc.remaining + numbers.remaining,
    };
  },
  {
    total: 0,
    used: 0,
    remaining: 0,
  }
);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const categoryCredits = {
    whatsapp: 0,
    websiteChat: 0,
    testAi: 0,
    content: 0,
    inbox: 0,
    other: 0,
  };

  let totalCreditsUsed = 0;
  let totalEventCount = 0;
  let failedEvents = 0;
  let todayCredits = 0;
  let last7DaysCredits = 0;

  const topWorkspaceMap = new Map<
    string,
    {
      workspaceId: string;
      creditsUsed: number;
      eventCount: number;
      lastUsedAt: string | null;
    }
  >();

  for (const event of events) {
    const credits = getCreditsUsed(event);
    const eventCount = getEventCount(event);
    const category = getRowCategory(event);
    const createdAt = cleanText(event.created_at);
    const createdTime = new Date(createdAt).getTime();
    const workspaceId = cleanText(event.workspace_id);

    totalCreditsUsed += credits;
    totalEventCount += eventCount;

    if (isFailedEvent(event)) failedEvents += 1;

    if (Number.isFinite(createdTime) && createdTime >= todayStart.getTime()) {
      todayCredits += credits;
    }

    if (Number.isFinite(createdTime) && createdTime >= sevenDaysAgo.getTime()) {
      last7DaysCredits += credits;
    }

    if (category === "whatsapp") categoryCredits.whatsapp += credits;
    if (category === "website_chat") categoryCredits.websiteChat += credits;
    if (category === "test_ai") categoryCredits.testAi += credits;
    if (category === "content") categoryCredits.content += credits;
    if (category === "inbox") categoryCredits.inbox += credits;
    if (category === "other") categoryCredits.other += credits;

    if (workspaceId) {
      const existing = topWorkspaceMap.get(workspaceId);

      if (!existing) {
        topWorkspaceMap.set(workspaceId, {
          workspaceId,
          creditsUsed: credits,
          eventCount,
          lastUsedAt: createdAt || null,
        });
      } else {
        existing.creditsUsed += credits;
        existing.eventCount += eventCount;

        const oldTime = new Date(cleanText(existing.lastUsedAt)).getTime();

        if (
          Number.isFinite(createdTime) &&
          (!Number.isFinite(oldTime) || createdTime > oldTime)
        ) {
          existing.lastUsedAt = createdAt || existing.lastUsedAt;
        }
      }
    }
  }

  const topWorkspaceBase = Array.from(topWorkspaceMap.values())
    .sort((a, b) => b.creditsUsed - a.creditsUsed)
    .slice(0, 8);

  const topWorkspaceIds = topWorkspaceBase
    .map((item) => item.workspaceId)
    .filter(Boolean);

  let topWorkspaces: Array<Record<string, unknown>> = [];

  if (topWorkspaceIds.length > 0) {
    const { data: workspaceRows, error: workspaceError } = await supabaseAdmin
      .from("business_workspaces")
      .select(WORKSPACE_SELECT)
      .in("id", topWorkspaceIds);

    if (workspaceError) throw workspaceError;

    const workspaceById = new Map(
      ((workspaceRows || []) as Record<string, unknown>[]).map((workspace) => [
        cleanText(workspace.id),
        workspace,
      ])
    );

    topWorkspaces = topWorkspaceBase.map((item) => {
      const workspace = workspaceById.get(item.workspaceId) || null;
      const balance = latestBalances.get(item.workspaceId) || null;
      const numbers = getCreditBalanceNumbers(balance);

      return {
        ...item,
        workspace,
        credit_balance: balance,
        creditsRemaining: numbers.remaining,
      };
    });
  }

  return {
    totalEvents: eventsResult.count || events.length,
    sampledEvents: events.length,
    totalCreditsUsed,
    totalEventCount,
    failedEvents,
    successfulEvents: Math.max(events.length - failedEvents, 0),
    todayCredits,
    last7DaysCredits,
    whatsappCredits: categoryCredits.whatsapp,
    websiteChatCredits: categoryCredits.websiteChat,
    testAiCredits: categoryCredits.testAi,
    contentCredits: categoryCredits.content,
    inboxCredits: categoryCredits.inbox,
    otherCredits: categoryCredits.other,
    creditBalanceTotal: creditTotals.total,
    creditBalanceUsed: creditTotals.used,
    creditBalanceRemaining: creditTotals.remaining,
    topWorkspaces,
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
    const dateRange = normalizeDateRange(url.searchParams.get("dateRange"));
    const category = normalizeUsageCategory(url.searchParams.get("category"));
    const page = getPageNumber(url.searchParams.get("page"));
    const pageSize = getPageSize(url.searchParams.get("pageSize"));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("workspace_usage_events")
      .select(USAGE_EVENT_SELECT, { count: "exact" });

    query = applyDateRangeFilter(query, dateRange);
    query = applyUsageCategoryFilter(query, category);
    query = applySearchFilter(query, search);

    query = query
      .order("created_at", { ascending: false })
      .range(from, to);

    const [eventsResult, stats] = await Promise.all([
      query,
      getUsageStats(dateRange),
    ]);

    if (eventsResult.error) {
      console.error("Failed to load Kolkap admin usage events:", eventsResult.error);

      return Response.json(
        { success: false, error: "Failed to load usage events." },
        { status: 500 }
      );
    }

    const events = (eventsResult.data || []) as Record<string, unknown>[];
    const workspaceIds = Array.from(
      new Set(events.map((item) => cleanText(item.workspace_id)).filter(Boolean))
    );

    const ownerIdsFromEvents = events
      .map((item) => cleanText(item.owner_user_id))
      .filter(Boolean);

    const userIdsFromEvents = events
      .map((item) => cleanText(item.user_id))
      .filter(Boolean);

    const [workspacesResult, balancesResult] = await Promise.all([
      workspaceIds.length
        ? supabaseAdmin
            .from("business_workspaces")
            .select(WORKSPACE_SELECT)
            .in("id", workspaceIds)
        : Promise.resolve({ data: [], error: null }),
      workspaceIds.length
        ? supabaseAdmin
            .from("workspace_credit_balances")
            .select(CREDIT_BALANCE_SELECT)
            .in("workspace_id", workspaceIds)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (workspacesResult.error) throw workspacesResult.error;
    if (balancesResult.error) throw balancesResult.error;

    const workspaces = (workspacesResult.data || []) as Record<string, unknown>[];
    const balances = (balancesResult.data || []) as Record<string, unknown>[];

    const workspaceById = new Map(
      workspaces.map((workspace) => [cleanText(workspace.id), workspace])
    );

    const latestBalances = latestByWorkspace(balances);

    const ownerIdsFromWorkspaces = workspaces
      .map((workspace) => cleanText(workspace.owner_user_id))
      .filter(Boolean);

    const profileIds = Array.from(
      new Set([
        ...ownerIdsFromEvents,
        ...userIdsFromEvents,
        ...ownerIdsFromWorkspaces,
      ])
    );

    const profilesResult = profileIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, role")
          .in("id", profileIds)
      : { data: [], error: null };

    if (profilesResult.error) throw profilesResult.error;

    const profileById = new Map(
      ((profilesResult.data || []) as Record<string, unknown>[]).map((profile) => [
        cleanText(profile.id),
        profile,
      ])
    );

    const enrichedEvents = events.map((event) => {
      const workspaceId = cleanText(event.workspace_id);
      const ownerId = cleanText(event.owner_user_id);
      const userId = cleanText(event.user_id);
      const workspace = workspaceById.get(workspaceId) || null;
      const balance = latestBalances.get(workspaceId) || null;

      return {
        ...event,
        workspace,
        owner: profileById.get(ownerId) || null,
        user: profileById.get(userId) || null,
        credit_balance: balance,
        category: getRowCategory(event),
      };
    });

    const totalCount = eventsResult.count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return Response.json({
      success: true,
      events: enrichedEvents,
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
    console.error("Kolkap admin usage API error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load AI usage data.",
      },
      { status: 500 }
    );
  }
}