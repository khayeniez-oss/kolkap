import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const token = getBearerToken(req);

    if (!token) {
      return Response.json(
        { success: false, isAdmin: false, error: "Login is required." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user?.id) {
      return Response.json(
        { success: false, isAdmin: false, error: "Invalid session." },
        { status: 401 }
      );
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
      return Response.json(
        { success: false, isAdmin: false, error: "Unable to verify admin." },
        { status: 500 }
      );
    }

    const role = String((profile as { role?: string } | null)?.role || "")
      .toLowerCase()
      .trim();

    const roleAllowed = role.includes("admin");
    const isAdmin = emailAllowed || roleAllowed;

    return Response.json({
      success: true,
      isAdmin,
    });
  } catch (error) {
    console.error("Admin access check error:", error);

    return Response.json(
      {
        success: false,
        isAdmin: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to check admin access.",
      },
      { status: 500 }
    );
  }
}