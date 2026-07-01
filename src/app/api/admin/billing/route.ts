import { createClient } from "@supabase/supabase-js";
import { kolkapPlans, type KolkapPlanKey } from "@/lib/kolkapPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  credits_total,
  credits_used,
  ai_staff_used,
  created_at,
  updated_at,
  trial_started_at,
  trial_ends_at,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  stripe_checkout_session_id,
  billing_status,
  billing_started_at,
  billing_current_period_start,
  billing_current_period_end,
  trial_activated_at,
  subscription_cancel_at,
  subscription_cancelled_at,
  subscription_updated_at
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

const TOPUP_SELECT = `
  id,
  workspace_id,
  owner_user_id,
  package_id,
  credits,
  amount_cents,
  currency,
  status,
  stripe_checkout_session_id,
  stripe_payment_intent_id,
  stripe_customer_id,
  stripe_price_id,
  metadata,
  created_at,
  updated_at,
  paid_at,
  failed_at,
  cancelled_at
`;

type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

type BillingFilter =
  | "all"
  | "active"
  | "trial"
  | "past_due"
  | "cancelled"
  | "failed"
  | "no_stripe";

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

function normalizeBillingFilter(value?: string | null): BillingFilter {
  const clean = cleanText(value).toLowerCase();

  if (
    clean === "active" ||
    clean === "trial" ||
    clean === "past_due" ||
    clean === "cancelled" ||
    clean === "failed" ||
    clean === "no_stripe"
  ) {
    return clean;
  }

  return "all";
}

function applySearchFilter(query: any, search: string) {
  if (!search) return query;

  return query.or(
    [
      `business_name.ilike.%${search}%`,
      `business_email.ilike.%${search}%`,
      `business_phone.ilike.%${search}%`,
      `country.ilike.%${search}%`,
      `plan_key.ilike.%${search}%`,
      `plan_status.ilike.%${search}%`,
      `billing_status.ilike.%${search}%`,
      `stripe_customer_id.ilike.%${search}%`,
      `stripe_subscription_id.ilike.%${search}%`,
      `stripe_price_id.ilike.%${search}%`,
    ].join(",")
  );
}

function applyBillingFilter(query: any, filter: BillingFilter) {
  if (filter === "active") {
    return query.or(
      "billing_status.eq.active,billing_status.eq.trialing,billing_status.eq.paid,plan_status.eq.active,plan_status.eq.paid,plan_status.eq.subscribed"
    );
  }

  if (filter === "trial") {
    return query.or("billing_status.ilike.%trial%,plan_status.ilike.%trial%");
  }

  if (filter === "past_due") {
    return query.or(
      "billing_status.ilike.%past%,billing_status.ilike.%due%,plan_status.ilike.%past%,plan_status.ilike.%due%"
    );
  }

  if (filter === "cancelled") {
    return query.or(
      "billing_status.ilike.%cancel%,plan_status.ilike.%cancel%,billing_status.eq.inactive,plan_status.eq.inactive"
    );
  }

  if (filter === "failed") {
    return query.or(
      "billing_status.ilike.%failed%,billing_status.ilike.%fail%,plan_status.ilike.%failed%,plan_status.ilike.%fail%"
    );
  }

  if (filter === "no_stripe") {
    return query.is("stripe_customer_id", null);
  }

  return query;
}

function statusText(value: unknown) {
  return cleanText(value).toLowerCase();
}

function getPlanSnapshot(planKey: unknown) {
  const key = cleanText(planKey) as KolkapPlanKey;

  if (!key || !kolkapPlans[key]) {
    return null;
  }

  const plan = kolkapPlans[key];

  return {
    key: plan.key,
    name: plan.name,
    priceLabel: plan.priceLabel,
    monthlyPriceAud: plan.monthlyPriceAud,
    monthlyCredits: plan.monthlyCredits,
    trialDays: plan.trialDays,
    aiStaffLimit: plan.aiStaffLimit,
    teamMemberLimit: plan.teamMemberLimit,
    whatsappNumberLimit: plan.whatsappNumberLimit,
    websiteChatLimit: plan.websiteChatLimit,
    legacyKey: Boolean(plan.legacyKey),
    recommended: Boolean(plan.recommended),
  };
}

function isActiveBilling(workspace: Record<string, unknown>) {
  const billingStatus = statusText(workspace.billing_status);
  const planStatus = statusText(workspace.plan_status);

  const blocked =
    billingStatus.includes("cancel") ||
    billingStatus.includes("inactive") ||
    billingStatus.includes("past") ||
    billingStatus.includes("due") ||
    billingStatus.includes("fail") ||
    planStatus.includes("cancel") ||
    planStatus.includes("inactive") ||
    planStatus.includes("past") ||
    planStatus.includes("due") ||
    planStatus.includes("fail");

  if (blocked) return false;

  return (
    billingStatus === "active" ||
    billingStatus === "trialing" ||
    billingStatus === "paid" ||
    planStatus === "active" ||
    planStatus === "paid" ||
    planStatus === "subscribed"
  );
}

function isTrialBilling(workspace: Record<string, unknown>) {
  const billingStatus = statusText(workspace.billing_status);
  const planStatus = statusText(workspace.plan_status);

  if (billingStatus.includes("trial") || planStatus.includes("trial")) {
    return true;
  }

  const trialEndsAt = cleanText(workspace.trial_ends_at);

  if (!trialEndsAt) return false;

  const end = new Date(trialEndsAt).getTime();

  return Number.isFinite(end) && end > Date.now();
}

function isPastDueBilling(workspace: Record<string, unknown>) {
  const billingStatus = statusText(workspace.billing_status);
  const planStatus = statusText(workspace.plan_status);

  return (
    billingStatus.includes("past") ||
    billingStatus.includes("due") ||
    planStatus.includes("past") ||
    planStatus.includes("due")
  );
}

function isCancelledBilling(workspace: Record<string, unknown>) {
  const billingStatus = statusText(workspace.billing_status);
  const planStatus = statusText(workspace.plan_status);

  return (
    billingStatus.includes("cancel") ||
    planStatus.includes("cancel") ||
    billingStatus === "inactive" ||
    planStatus === "inactive" ||
    Boolean(cleanText(workspace.subscription_cancelled_at))
  );
}

function isFailedBilling(workspace: Record<string, unknown>) {
  const billingStatus = statusText(workspace.billing_status);
  const planStatus = statusText(workspace.plan_status);

  return (
    billingStatus.includes("fail") ||
    billingStatus.includes("error") ||
    planStatus.includes("fail") ||
    planStatus.includes("error")
  );
}

function hasStripeData(workspace: Record<string, unknown>) {
  return Boolean(
    cleanText(workspace.stripe_customer_id) ||
      cleanText(workspace.stripe_subscription_id) ||
      cleanText(workspace.stripe_price_id) ||
      cleanText(workspace.stripe_checkout_session_id)
  );
}

function isPaidTopup(topup: Record<string, unknown>) {
  const status = statusText(topup.status);

  return (
    status === "paid" ||
    status === "succeeded" ||
    status === "success" ||
    status === "completed" ||
    Boolean(cleanText(topup.paid_at))
  );
}

function isFailedTopup(topup: Record<string, unknown>) {
  const status = statusText(topup.status);

  return (
    status.includes("fail") ||
    status.includes("error") ||
    Boolean(cleanText(topup.failed_at))
  );
}

function isCancelledTopup(topup: Record<string, unknown>) {
  const status = statusText(topup.status);

  return status.includes("cancel") || Boolean(cleanText(topup.cancelled_at));
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

function summarizeTopups(rows: Record<string, unknown>[]) {
  const map = new Map<
    string,
    {
      totalTopups: number;
      paidTopups: number;
      failedTopups: number;
      cancelledTopups: number;
      paidCredits: number;
      paidAmountCents: number;
      latestTopup: Record<string, unknown> | null;
    }
  >();

  for (const row of rows) {
    const workspaceId = cleanText(row.workspace_id);

    if (!workspaceId) continue;

    const existing =
      map.get(workspaceId) ||
      {
        totalTopups: 0,
        paidTopups: 0,
        failedTopups: 0,
        cancelledTopups: 0,
        paidCredits: 0,
        paidAmountCents: 0,
        latestTopup: null,
      };

    existing.totalTopups += 1;

    if (isPaidTopup(row)) {
      existing.paidTopups += 1;
      existing.paidCredits += Number(row.credits || 0);
      existing.paidAmountCents += Number(row.amount_cents || 0);
    }

    if (isFailedTopup(row)) {
      existing.failedTopups += 1;
    }

    if (isCancelledTopup(row)) {
      existing.cancelledTopups += 1;
    }

    const existingDate = new Date(
      cleanText(existing.latestTopup?.created_at)
    ).getTime();
    const rowDate = new Date(cleanText(row.created_at)).getTime();

    if (
      !existing.latestTopup ||
      (Number.isFinite(rowDate) &&
        (!Number.isFinite(existingDate) || rowDate > existingDate))
    ) {
      existing.latestTopup = row;
    }

    map.set(workspaceId, existing);
  }

  return map;
}

async function getBillingStats() {
  const supabaseAdmin = getAdminSupabase();

  const [workspaceResult, balanceResult, topupResult] = await Promise.all([
    supabaseAdmin
      .from("business_workspaces")
      .select(WORKSPACE_SELECT)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabaseAdmin
      .from("workspace_credit_balances")
      .select(CREDIT_BALANCE_SELECT)
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabaseAdmin
      .from("workspace_credit_topups")
      .select(TOPUP_SELECT)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  if (workspaceResult.error) throw workspaceResult.error;
  if (balanceResult.error) throw balanceResult.error;
  if (topupResult.error) throw topupResult.error;

  const workspaces = (workspaceResult.data || []) as Record<string, unknown>[];
  const balances = (balanceResult.data || []) as Record<string, unknown>[];
  const topups = (topupResult.data || []) as Record<string, unknown>[];

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

  const paidTopups = topups.filter(isPaidTopup);
  const failedTopups = topups.filter(isFailedTopup);
  const cancelledTopups = topups.filter(isCancelledTopup);

  const paidTopupRevenueCents = paidTopups.reduce((total, topup) => {
    return total + Number(topup.amount_cents || 0);
  }, 0);

  const paidTopupCredits = paidTopups.reduce((total, topup) => {
    return total + Number(topup.credits || 0);
  }, 0);

  const potentialMonthlyRevenueAud = workspaces
    .filter(isActiveBilling)
    .reduce((total, workspace) => {
      const plan = getPlanSnapshot(workspace.plan_key);

      return total + Number(plan?.monthlyPriceAud || 0);
    }, 0);

  return {
    totalWorkspaces: workspaces.length,
    activeBilling: workspaces.filter(isActiveBilling).length,
    trialBilling: workspaces.filter(isTrialBilling).length,
    pastDueBilling: workspaces.filter(isPastDueBilling).length,
    cancelledBilling: workspaces.filter(isCancelledBilling).length,
    failedBilling: workspaces.filter(isFailedBilling).length,
    withStripeCustomer: workspaces.filter(hasStripeData).length,
    withoutStripeCustomer: workspaces.filter((workspace) => !hasStripeData(workspace))
      .length,
    potentialMonthlyRevenueAud,
    creditBalanceTotal: creditTotals.total,
    creditBalanceUsed: creditTotals.used,
    creditBalanceRemaining: creditTotals.remaining,
    totalTopups: topups.length,
    paidTopups: paidTopups.length,
    failedTopups: failedTopups.length,
    cancelledTopups: cancelledTopups.length,
    paidTopupRevenueCents,
    paidTopupCredits,
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
    const billingFilter = normalizeBillingFilter(
      url.searchParams.get("billingFilter")
    );
    const page = getPageNumber(url.searchParams.get("page"));
    const pageSize = getPageSize(url.searchParams.get("pageSize"));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("business_workspaces")
      .select(WORKSPACE_SELECT, { count: "exact" });

    query = applySearchFilter(query, search);
    query = applyBillingFilter(query, billingFilter);

    query = query
      .order("created_at", { ascending: false })
      .range(from, to);

    const [{ data, error, count }, stats, recentTopupsResult] =
      await Promise.all([
        query,
        getBillingStats(),
        supabaseAdmin
          .from("workspace_credit_topups")
          .select(TOPUP_SELECT)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (error) {
      console.error("Failed to load Kolkap admin billing:", error);

      return Response.json(
        { success: false, error: "Failed to load billing data." },
        { status: 500 }
      );
    }

    if (recentTopupsResult.error) throw recentTopupsResult.error;

    const workspaces = (data || []) as Record<string, unknown>[];
    const workspaceIds = workspaces
      .map((workspace) => cleanText(workspace.id))
      .filter(Boolean);

    const ownerIds = Array.from(
      new Set(
        workspaces
          .map((workspace) => cleanText(workspace.owner_user_id))
          .filter(Boolean)
      )
    );

    const [ownersResult, balancesResult, topupsResult] = await Promise.all([
      ownerIds.length
        ? supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, role")
            .in("id", ownerIds)
        : Promise.resolve({ data: [], error: null }),
      workspaceIds.length
        ? supabaseAdmin
            .from("workspace_credit_balances")
            .select(CREDIT_BALANCE_SELECT)
            .in("workspace_id", workspaceIds)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      workspaceIds.length
        ? supabaseAdmin
            .from("workspace_credit_topups")
            .select(TOPUP_SELECT)
            .in("workspace_id", workspaceIds)
            .order("created_at", { ascending: false })
            .limit(5000)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (ownersResult.error) throw ownersResult.error;
    if (balancesResult.error) throw balancesResult.error;
    if (topupsResult.error) throw topupsResult.error;

    const ownersById = new Map(
      ((ownersResult.data || []) as Record<string, unknown>[]).map((owner) => [
        cleanText(owner.id),
        owner,
      ])
    );

    const latestBalances = latestByWorkspace(
      (balancesResult.data || []) as Record<string, unknown>[]
    );

    const topupSummaries = summarizeTopups(
      (topupsResult.data || []) as Record<string, unknown>[]
    );

    const enrichedWorkspaces = workspaces.map((workspace) => {
      const workspaceId = cleanText(workspace.id);
      const ownerId = cleanText(workspace.owner_user_id);
      const creditBalance = latestBalances.get(workspaceId) || null;

      return {
        ...workspace,
        owner: ownersById.get(ownerId) || null,
        plan_snapshot: getPlanSnapshot(workspace.plan_key),
        credit_balance: creditBalance,
        credit_numbers: getCreditBalanceNumbers(creditBalance),
        topup_summary: topupSummaries.get(workspaceId) || {
          totalTopups: 0,
          paidTopups: 0,
          failedTopups: 0,
          cancelledTopups: 0,
          paidCredits: 0,
          paidAmountCents: 0,
          latestTopup: null,
        },
      };
    });

    const recentTopups = (recentTopupsResult.data || []) as Record<
      string,
      unknown
    >[];

    const recentWorkspaceIds = Array.from(
      new Set(
        recentTopups.map((topup) => cleanText(topup.workspace_id)).filter(Boolean)
      )
    );

    const recentOwnerIds = Array.from(
      new Set(
        recentTopups.map((topup) => cleanText(topup.owner_user_id)).filter(Boolean)
      )
    );

    const [recentWorkspacesResult, recentOwnersResult] = await Promise.all([
      recentWorkspaceIds.length
        ? supabaseAdmin
            .from("business_workspaces")
            .select(WORKSPACE_SELECT)
            .in("id", recentWorkspaceIds)
        : Promise.resolve({ data: [], error: null }),
      recentOwnerIds.length
        ? supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, role")
            .in("id", recentOwnerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (recentWorkspacesResult.error) throw recentWorkspacesResult.error;
    if (recentOwnersResult.error) throw recentOwnersResult.error;

    const recentWorkspacesById = new Map(
      ((recentWorkspacesResult.data || []) as Record<string, unknown>[]).map(
        (workspace) => [cleanText(workspace.id), workspace]
      )
    );

    const recentOwnersById = new Map(
      ((recentOwnersResult.data || []) as Record<string, unknown>[]).map(
        (owner) => [cleanText(owner.id), owner]
      )
    );

    const enrichedRecentTopups = recentTopups.map((topup) => {
      const workspaceId = cleanText(topup.workspace_id);
      const ownerId = cleanText(topup.owner_user_id);

      return {
        ...topup,
        workspace: recentWorkspacesById.get(workspaceId) || null,
        owner: recentOwnersById.get(ownerId) || null,
      };
    });

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return Response.json({
      success: true,
      workspaces: enrichedWorkspaces,
      recentTopups: enrichedRecentTopups,
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
    console.error("Kolkap admin billing API error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load billing data.",
      },
      { status: 500 }
    );
  }
}