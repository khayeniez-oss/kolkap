import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminAuthResult = {
  authorized: boolean;
  userId?: string;
  userEmail?: string | null;
  response?: Response;
};

type HealthStatus = "healthy" | "warning" | "missing";

type HealthItem = {
  key: string;
  label: string;
  configured: boolean;
  required: boolean;
  safeValue?: string;
  note?: string;
};

type HealthGroup = {
  key: string;
  title: string;
  description: string;
  status: HealthStatus;
  items: HealthItem[];
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

function hasEnv(name: string) {
  return Boolean(cleanText(process.env[name]));
}

function envValue(name: string) {
  return cleanText(process.env[name]);
}

function safeUrl(value: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return value.slice(0, 40);
  }
}

function safeModel(value: string) {
  return value || "gpt-4o-mini";
}

function getItem({
  key,
  label,
  env,
  required = true,
  safeValue,
  note,
}: {
  key: string;
  label: string;
  env?: string;
  required?: boolean;
  safeValue?: string;
  note?: string;
}): HealthItem {
  const configured = env ? hasEnv(env) : Boolean(safeValue);

  return {
    key,
    label,
    configured,
    required,
    safeValue,
    note,
  };
}

function getGroupStatus(items: HealthItem[]): HealthStatus {
  const requiredItems = items.filter((item) => item.required);
  const missingRequired = requiredItems.some((item) => !item.configured);

  if (missingRequired) return "missing";

  const missingOptional = items.some((item) => !item.configured);

  if (missingOptional) return "warning";

  return "healthy";
}

function createGroup({
  key,
  title,
  description,
  items,
}: {
  key: string;
  title: string;
  description: string;
  items: HealthItem[];
}): HealthGroup {
  return {
    key,
    title,
    description,
    status: getGroupStatus(items),
    items,
  };
}

async function safeCount(table: string) {
  try {
    const supabaseAdmin = getAdminSupabase();

    const { count, error } = await supabaseAdmin
      .from(table)
      .select("id", { count: "exact", head: true });

    if (error) {
      return {
        table,
        ok: false,
        count: 0,
        error: error.message,
      };
    }

    return {
      table,
      ok: true,
      count: count || 0,
      error: "",
    };
  } catch (error) {
    return {
      table,
      ok: false,
      count: 0,
      error: error instanceof Error ? error.message : "Failed to check table.",
    };
  }
}

function getHealthGroups() {
  const appUrl =
    envValue("NEXT_PUBLIC_APP_URL") ||
    envValue("NEXT_PUBLIC_SITE_URL") ||
    envValue("NEXT_PUBLIC_BASE_URL");

  const openAiKey =
    envValue("OPENAI_API_KEY") || envValue("KOLKAP_OPENAI_API_KEY");

  const metaApiVersion =
    envValue("META_WHATSAPP_API_VERSION") ||
    envValue("META_GRAPH_VERSION") ||
    "v23.0";

  const supportEmail =
    envValue("KOLKAP_SUPPORT_EMAIL") ||
    envValue("NEXT_PUBLIC_SUPPORT_EMAIL") ||
    "support@kolkap.com";

  const defaultCountryCode = envValue("KOLKAP_DEFAULT_COUNTRY_CODE") || "62";

  const groups: HealthGroup[] = [
    createGroup({
      key: "supabase",
      title: "Supabase",
      description:
        "Database, auth, API access, and server-side service role setup.",
      items: [
        getItem({
          key: "supabase_url",
          label: "NEXT_PUBLIC_SUPABASE_URL",
          env: "NEXT_PUBLIC_SUPABASE_URL",
        }),
        getItem({
          key: "supabase_anon",
          label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          env: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        }),
        getItem({
          key: "supabase_service_role",
          label: "SUPABASE_SERVICE_ROLE_KEY",
          env: "SUPABASE_SERVICE_ROLE_KEY",
          note: "Used only server-side. Secret value is not exposed.",
        }),
      ],
    }),

    createGroup({
      key: "admin",
      title: "Admin Access",
      description:
        "Admin email allowlist and protected internal admin API access.",
      items: [
        getItem({
          key: "admin_emails",
          label: "KOLKAP_ADMIN_EMAILS",
          env: "KOLKAP_ADMIN_EMAILS",
          safeValue: `${getAdminEmails().length} admin email(s) configured`,
          note: "Only count is shown. Emails are not exposed here.",
        }),
      ],
    }),

    createGroup({
      key: "stripe",
      title: "Stripe Billing",
      description:
        "Subscription billing, trial checkout, top-ups, and Stripe webhook processing.",
      items: [
        getItem({
          key: "stripe_secret",
          label: "STRIPE_SECRET_KEY",
          env: "STRIPE_SECRET_KEY",
          note: "Used by billing APIs. Secret value is not exposed.",
        }),
        getItem({
          key: "stripe_webhook",
          label: "STRIPE_WEBHOOK_SECRET",
          env: "STRIPE_WEBHOOK_SECRET",
          note: "Needed for webhook verification.",
        }),
        getItem({
          key: "stripe_starter",
          label: "STRIPE_STARTER_PRICE_ID",
          env: "STRIPE_STARTER_PRICE_ID",
        }),
        getItem({
          key: "stripe_growth",
          label: "STRIPE_GROWTH_PRICE_ID",
          env: "STRIPE_GROWTH_PRICE_ID",
        }),
        getItem({
          key: "stripe_professional",
          label: "STRIPE_PROFESSIONAL_PRICE_ID",
          env: "STRIPE_PROFESSIONAL_PRICE_ID",
        }),
        getItem({
          key: "stripe_business",
          label: "STRIPE_BUSINESS_PRICE_ID",
          env: "STRIPE_BUSINESS_PRICE_ID",
        }),
      ],
    }),

    createGroup({
      key: "meta",
      title: "Meta WhatsApp",
      description:
        "Meta WhatsApp Cloud API, embedded signup, template sending, and webhook setup.",
      items: [
        getItem({
          key: "meta_token",
          label: "META_WHATSAPP_ACCESS_TOKEN",
          env: "META_WHATSAPP_ACCESS_TOKEN",
          note: "Secret value is not exposed.",
        }),
        getItem({
          key: "meta_phone_number",
          label: "META_WHATSAPP_PHONE_NUMBER_ID",
          env: "META_WHATSAPP_PHONE_NUMBER_ID",
        }),
        getItem({
          key: "meta_waba",
          label: "META_WHATSAPP_BUSINESS_ACCOUNT_ID",
          env: "META_WHATSAPP_BUSINESS_ACCOUNT_ID",
        }),
        getItem({
          key: "meta_api_version",
          label: "Meta API version",
          safeValue: metaApiVersion,
          required: false,
        }),
        getItem({
          key: "meta_app_id",
          label: "META_APP_ID / NEXT_PUBLIC_META_APP_ID",
          safeValue: hasEnv("META_APP_ID") || hasEnv("NEXT_PUBLIC_META_APP_ID")
            ? "Configured"
            : "",
          required: false,
        }),
        getItem({
          key: "meta_app_secret",
          label: "META_APP_SECRET",
          env: "META_APP_SECRET",
          required: false,
          note: "Needed for embedded signup token exchange.",
        }),
        getItem({
          key: "meta_verify_token",
          label: "META webhook verify token",
          safeValue:
            hasEnv("META_WHATSAPP_VERIFY_TOKEN") ||
            hasEnv("META_WEBHOOK_VERIFY_TOKEN") ||
            hasEnv("META_VERIFY_TOKEN")
              ? "Configured"
              : "",
          required: false,
        }),
      ],
    }),

    createGroup({
      key: "openai",
      title: "OpenAI / Kolkap AI",
      description:
        "AI brain, Kai reply route, website chat AI, Test AI, and content generation.",
      items: [
        getItem({
          key: "openai_key",
          label: "OPENAI_API_KEY / KOLKAP_OPENAI_API_KEY",
          safeValue: openAiKey ? "Configured" : "",
          note: "Secret value is not exposed.",
        }),
        getItem({
          key: "openai_model",
          label: "KOLKAP_OPENAI_MODEL",
          safeValue: safeModel(envValue("KOLKAP_OPENAI_MODEL")),
          required: false,
          note: "Falls back to gpt-4o-mini when not set.",
        }),
      ],
    }),

    createGroup({
      key: "app",
      title: "App Defaults",
      description:
        "Public site URL, support email, country code fallback, and app defaults.",
      items: [
        getItem({
          key: "app_url",
          label: "NEXT_PUBLIC_APP_URL / SITE_URL / BASE_URL",
          safeValue: appUrl ? safeUrl(appUrl) : "",
          required: false,
        }),
        getItem({
          key: "support_email",
          label: "Support email",
          safeValue: supportEmail,
          required: false,
        }),
        getItem({
          key: "country_code",
          label: "KOLKAP_DEFAULT_COUNTRY_CODE",
          safeValue: defaultCountryCode,
          required: false,
          note: "Falls back to 62 when not set.",
        }),
      ],
    }),
  ];

  return groups;
}

function getOverallStatus(groups: HealthGroup[]): HealthStatus {
  if (groups.some((group) => group.status === "missing")) return "missing";
  if (groups.some((group) => group.status === "warning")) return "warning";
  return "healthy";
}

export async function GET(req: Request) {
  const auth = await verifyAdmin(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const groups = getHealthGroups();
    const databaseChecks = await Promise.all([
      safeCount("profiles"),
      safeCount("business_workspaces"),
      safeCount("workspace_credit_balances"),
      safeCount("workspace_usage_events"),
      safeCount("workspace_credit_topups"),
      safeCount("kolkap_help_requests"),
      safeCount("kolkap_whatsapp_conversations"),
      safeCount("kolkap_whatsapp_template_campaigns"),
    ]);

    return Response.json({
      success: true,
      generatedAt: new Date().toISOString(),
      checkedBy: auth.userEmail || null,
      overallStatus: getOverallStatus(groups),
      groups,
      databaseChecks,
      notes: [
        "This page only shows whether configuration exists. It never exposes secret values.",
        "Editable settings should be added later only after the admin workflow is confirmed.",
      ],
    });
  } catch (error) {
    console.error("Kolkap admin settings API error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load system settings.",
      },
      { status: 500 }
    );
  }
}