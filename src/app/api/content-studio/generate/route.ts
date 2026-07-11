import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { runKolkapBrain } from "@/lib/kolkap-ai/brain";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";

const CONTENT_GENERATION_CREDIT_COST = 10;

type GenerateBody = {
  content_type?: string;
  content_purpose?: string;
  platform?: string;
  language?: string;
  tone?: string;
  details?: string;
  prompt?: string;
  ui_language?: string;
};

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as GenerateBody;

    const contentType = cleanText(body.content_type, "social_caption");
    const contentPurpose = cleanText(body.content_purpose, "promotion");
    const platform = cleanText(body.platform, "general");
    const language = cleanText(body.language, "auto");
    const tone = cleanText(body.tone, "professional");
    const details = cleanText(body.details);
    const extraInstructions = cleanText(body.prompt);
    const uiLanguage = cleanText(body.ui_language, "en");

    if (!details) {
      return NextResponse.json(
        { error: "Main details are required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";

    let user: { id: string; email?: string | null } | null = null;

    if (bearerToken) {
      const mobileSupabase = createSupabaseClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
          },
        }
      );

      const {
        data: { user: mobileUser },
        error: mobileUserError,
      } = await mobileSupabase.auth.getUser(bearerToken);

      if (mobileUserError || !mobileUser) {
        return NextResponse.json(
          { error: "You must be logged in to generate content." },
          { status: 401 }
        );
      }

      user = mobileUser;
    } else {
      const cookieStore = await cookies();

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      });

      const {
        data: { user: webUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !webUser) {
        return NextResponse.json(
          { error: "You must be logged in to generate content." },
          { status: 401 }
        );
      }

      user = webUser;
    }

    const result = await runKolkapBrain({
      userId: user.id,
      userEmail: user.email,
      task: "content_studio",
      channel: "content_studio",
      contentType,
      contentPurpose,
      platform,
      language,
      tone,
      details,
      extraInstructions,
      uiLanguage,
    });

    await logWorkspaceUsage({
      workspaceId: result.workspaceId,
      userId: user.id,
      eventType: "content_generated",
      channel: "content_studio",
      sourcePage: bearerToken ? "mobile_content_studio" : "/dashboard/content-studio",
      creditsUsed: CONTENT_GENERATION_CREDIT_COST,
      metadata: {
        content_type: contentType,
        content_purpose: contentPurpose,
        platform,
        model: result.model,
        knowledge_count: result.knowledgeCount,
        fallback: result.fallback,
        ai_staff_id: result.aiStaffId || null,
        credit_rule: "content_generation_minimum",
      },
    });

    return NextResponse.json({
      content: result.content,
      business_name: result.businessName,
      workspace_id: result.workspaceId,
      knowledge_count: result.knowledgeCount,
      model: result.model,
      fallback: result.fallback,
      credits_used: CONTENT_GENERATION_CREDIT_COST,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Content could not be generated.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}