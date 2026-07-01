import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKSPACE_SELECT = `
  id,
  owner_user_id,
  business_name,
  business_type,
  business_email,
  business_phone,
  whatsapp_number,
  business_address,
  country,
  timezone,
  plan_key,
  plan_status,
  credits_total,
  credits_used,
  ai_staff_used,
  whatsapp_status,
  go_live_status,
  trial_started_at,
  trial_ends_at,
  created_at,
  updated_at,
  ai_reply_language,
  ai_reply_tone,
  auto_reply_enabled,
  human_handover_enabled,
  lead_capture_enabled,
  live_ai_staff_id,
  go_live_activated_at,
  billing_status,
  billing_started_at,
  billing_current_period_start,
  billing_current_period_end,
  trial_activated_at,
  subscription_cancel_at,
  subscription_cancelled_at,
  subscription_updated_at
`;

type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

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

function applySearchFilter(query: any, search: string) {
  if (!search) return query;

  return query.or(
    [
      `business_name.ilike.%${search}%`,
      `business_type.ilike.%${search}%`,
      `business_email.ilike.%${search}%`,
      `business_phone.ilike.%${search}%`,
      `whatsapp_number.ilike.%${search}%`,
      `country.ilike.%${search}%`,
      `plan_key.ilike.%${search}%`,
      `plan_status.ilike.%${search}%`,
      `billing_status.ilike.%${search}%`,
    ].join(",")
  );
}

function applyPlanFilter(query: any, planFilter: string) {
  if (planFilter === "trial") {
    return query.or("plan_status.ilike.%trial%,billing_status.ilike.%trial%");
  }

  if (planFilter === "active") {
    return query.or(
      "plan_status.eq.active,plan_status.eq.paid,plan_status.eq.subscribed,billing_status.eq.active,billing_status.eq.paid,billing_status.eq.trialing"
    );
  }

  if (planFilter === "past_due") {
    return query.or(
      "plan_status.ilike.%past%,billing_status.ilike.%past%,billing_status.ilike.%due%"
    );
  }

  if (planFilter === "cancelled") {
    return query.or(
      "plan_status.ilike.%cancel%,billing_status.ilike.%cancel%,plan_status.eq.inactive,billing_status.eq.inactive"
    );
  }

  return query;
}

function statusText(value: unknown) {
  return cleanText(value).toLowerCase();
}

function isTrialWorkspace(workspace: Record<string, unknown>) {
  const planStatus = statusText(workspace.plan_status);
  const billingStatus = statusText(workspace.billing_status);

  if (planStatus.includes("trial") || billingStatus.includes("trial")) {
    return true;
  }

  const trialEndsAt = cleanText(workspace.trial_ends_at);

  if (!trialEndsAt) return false;

  const end = new Date(trialEndsAt).getTime();

  return Number.isFinite(end) && end > Date.now();
}

function isActivePaidWorkspace(workspace: Record<string, unknown>) {
  const planStatus = statusText(workspace.plan_status);
  const billingStatus = statusText(workspace.billing_status);

  const inactive =
    planStatus.includes("inactive") ||
    planStatus.includes("cancel") ||
    billingStatus.includes("inactive") ||
    billingStatus.includes("cancel");

  if (inactive) return false;

  return (
    planStatus === "active" ||
    planStatus === "paid" ||
    planStatus === "subscribed" ||
    billingStatus === "active" ||
    billingStatus === "paid" ||
    billingStatus === "trialing"
  );
}

function isWhatsappConnected(workspace: Record<string, unknown>) {
  const whatsappStatus = statusText(workspace.whatsapp_status);
  const whatsappNumber = cleanText(workspace.whatsapp_number);

  if (whatsappNumber) return true;

  return (
    whatsappStatus.includes("connected") ||
    whatsappStatus.includes("active") ||
    whatsappStatus.includes("live") ||
    whatsappStatus.includes("ready")
  );
}

function isGoLiveActive(workspace: Record<string, unknown>) {
  const goLiveStatus = statusText(workspace.go_live_status);
  const activatedAt = cleanText(workspace.go_live_activated_at);

  return (
    Boolean(activatedAt) ||
    goLiveStatus === "live" ||
    goLiveStatus === "active" ||
    goLiveStatus.includes("activated")
  );
}

async function getWorkspaceStats() {
  const supabaseAdmin = getAdminSupabase();

  const [
    totalResult,
    workspaceResult,
    aiStaffResult,
    websiteChatResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("business_workspaces")
      .select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("business_workspaces")
      .select(
        "id, plan_status, billing_status, whatsapp_status, whatsapp_number, go_live_status, go_live_activated_at, trial_ends_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5000),
    supabaseAdmin
      .from("ai_staff")
      .select("workspace_id")
      .limit(5000),
    supabaseAdmin
      .from("workspace_website_chat_settings")
      .select("workspace_id, is_active")
      .eq("is_active", true)
      .limit(5000),
  ]);

  if (totalResult.error) throw totalResult.error;
  if (workspaceResult.error) throw workspaceResult.error;
  if (aiStaffResult.error) throw aiStaffResult.error;
  if (websiteChatResult.error) throw websiteChatResult.error;

  const workspaces = (workspaceResult.data || []) as Record<string, unknown>[];
  const aiStaffWorkspaceIds = new Set(
    (aiStaffResult.data || [])
      .map((item: { workspace_id?: string | null }) => item.workspace_id)
      .filter(Boolean)
  );
  const websiteChatWorkspaceIds = new Set(
    (websiteChatResult.data || [])
      .map((item: { workspace_id?: string | null }) => item.workspace_id)
      .filter(Boolean)
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return {
    total: totalResult.count || 0,
    trial: workspaces.filter(isTrialWorkspace).length,
    activePaid: workspaces.filter(isActivePaidWorkspace).length,
    whatsappConnected: workspaces.filter(isWhatsappConnected).length,
    websiteChatActive: websiteChatWorkspaceIds.size,
    aiStaffCreated: aiStaffWorkspaceIds.size,
    goLiveActive: workspaces.filter(isGoLiveActive).length,
    recentCreated: workspaces.filter((workspace) => {
      const createdAt = cleanText(workspace.created_at);
      if (!createdAt) return false;

      const created = new Date(createdAt).getTime();

      return Number.isFinite(created) && created >= sevenDaysAgo.getTime();
    }).length,
  };
}

function byWorkspaceId<T extends Record<string, unknown>>(
  rows: T[],
  pickLatest = false
) {
  const map = new Map<string, T>();

  for (const row of rows) {
    const workspaceId = cleanText(row.workspace_id);

    if (!workspaceId) continue;

    if (!pickLatest || !map.has(workspaceId)) {
      map.set(workspaceId, row);
      continue;
    }

    const existing = map.get(workspaceId);
    const existingDate = new Date(cleanText(existing?.updated_at)).getTime();
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

function countByWorkspaceId(rows: Record<string, unknown>[]) {
  const map = new Map<string, number>();

  for (const row of rows) {
    const workspaceId = cleanText(row.workspace_id);

    if (!workspaceId) continue;

    map.set(workspaceId, (map.get(workspaceId) || 0) + 1);
  }

  return map;
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
    const planFilter = cleanText(url.searchParams.get("planFilter") || "all");
    const page = getPageNumber(url.searchParams.get("page"));
    const pageSize = getPageSize(url.searchParams.get("pageSize"));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("business_workspaces")
      .select(WORKSPACE_SELECT, { count: "exact" });

    query = applySearchFilter(query, search);
    query = applyPlanFilter(query, planFilter);

    query = query
      .order("created_at", { ascending: false })
      .range(from, to);

    const [{ data, error, count }, stats] = await Promise.all([
      query,
      getWorkspaceStats(),
    ]);

    if (error) {
      console.error("Failed to load Kolkap admin workspaces:", error);

      return Response.json(
        { success: false, error: "Failed to load workspaces." },
        { status: 500 }
      );
    }

    const workspaces = (data || []) as Record<string, unknown>[];
    const workspaceIds = workspaces.map((item) => cleanText(item.id)).filter(Boolean);
    const ownerIds = Array.from(
      new Set(workspaces.map((item) => cleanText(item.owner_user_id)).filter(Boolean))
    );

    const [
      ownersResult,
      creditBalancesResult,
      aiStaffResult,
      websiteChatResult,
    ] = await Promise.all([
      ownerIds.length
        ? supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, role")
            .in("id", ownerIds)
        : Promise.resolve({ data: [], error: null }),
      workspaceIds.length
        ? supabaseAdmin
            .from("workspace_credit_balances")
            .select(
              "id, workspace_id, owner_user_id, plan_name, plan_credits, purchased_credits, used_credits, status, billing_period_start, billing_period_end, created_at, updated_at"
            )
            .in("workspace_id", workspaceIds)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      workspaceIds.length
        ? supabaseAdmin
            .from("ai_staff")
            .select("id, workspace_id, name, role, channel, status, created_at")
            .in("workspace_id", workspaceIds)
        : Promise.resolve({ data: [], error: null }),
      workspaceIds.length
        ? supabaseAdmin
            .from("workspace_website_chat_settings")
            .select(
              "id, workspace_id, selected_ai_staff_id, widget_title, is_active, ai_enabled, auto_reply_enabled, handover_enabled, updated_at"
            )
            .in("workspace_id", workspaceIds)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (ownersResult.error) throw ownersResult.error;
    if (creditBalancesResult.error) throw creditBalancesResult.error;
    if (aiStaffResult.error) throw aiStaffResult.error;
    if (websiteChatResult.error) throw websiteChatResult.error;

    const ownersById = new Map(
      ((ownersResult.data || []) as Record<string, unknown>[]).map((owner) => [
        cleanText(owner.id),
        owner,
      ])
    );

    const creditBalancesByWorkspace = byWorkspaceId(
      (creditBalancesResult.data || []) as Record<string, unknown>[],
      true
    );

    const websiteChatByWorkspace = byWorkspaceId(
      (websiteChatResult.data || []) as Record<string, unknown>[],
      true
    );

    const aiStaffCountsByWorkspace = countByWorkspaceId(
      (aiStaffResult.data || []) as Record<string, unknown>[]
    );

    const enrichedWorkspaces = workspaces.map((workspace) => {
      const workspaceId = cleanText(workspace.id);
      const ownerId = cleanText(workspace.owner_user_id);
      const creditBalance = creditBalancesByWorkspace.get(workspaceId) || null;
      const websiteChat = websiteChatByWorkspace.get(workspaceId) || null;

      return {
        ...workspace,
        owner: ownersById.get(ownerId) || null,
        credit_balance: creditBalance,
        website_chat: websiteChat,
        ai_staff_count: aiStaffCountsByWorkspace.get(workspaceId) || 0,
      };
    });

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return Response.json({
      success: true,
      workspaces: enrichedWorkspaces,
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
    console.error("Kolkap admin workspaces API error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load workspaces.",
      },
      { status: 500 }
    );
  }
}