import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";

const CONTENT_GENERATION_CREDIT_COST = 5;

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

function getLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pickBusinessContext(workspace: Record<string, unknown>) {
  const usefulKeys = [
    "business_name",
    "business_email",
    "business_phone",
    "business_type",
    "industry",
    "website_url",
    "business_website",
    "location",
    "city",
    "country",
    "description",
    "business_description",
    "preferred_language",
  ];

  return usefulKeys
    .map((key) => {
      const value = workspace[key];

      if (!value) return "";

      return `${getLabel(key)}: ${String(value)}`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildKnowledgeContext(items: Array<Record<string, unknown>>) {
  if (!items.length) {
    return "No saved Knowledge Base entries found yet.";
  }

  return items
    .map((item, index) => {
      const title = cleanText(item.title, `Knowledge ${index + 1}`);
      const category = cleanText(item.category, "general");
      const content = cleanText(item.content);
      const sourceType = cleanText(item.source_type, "manual");
      const sourceUrl = cleanText(item.source_url);
      const sourceNote = cleanText(item.source_note);
      const tags = Array.isArray(item.tags) ? item.tags.join(", ") : "";

      return [
        `Knowledge ${index + 1}: ${title}`,
        `Category: ${category}`,
        `Source Type: ${sourceType}`,
        sourceUrl ? `URL: ${sourceUrl}` : "",
        sourceNote ? `URL Note: ${sourceNote}` : "",
        tags ? `Tags: ${tags}` : "",
        `Content: ${content}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

function fallbackContent({
  businessName,
  contentType,
  contentPurpose,
  platform,
  language,
  tone,
  details,
  prompt,
}: {
  businessName: string;
  contentType: string;
  contentPurpose: string;
  platform: string;
  language: string;
  tone: string;
  details: string;
  prompt: string;
}) {
  const isIndonesian = language === "id";
  const name = businessName || (isIndonesian ? "bisnis kami" : "our business");

  if (isIndonesian) {
    return `${getLabel(contentType)} untuk ${getLabel(platform)}
Tujuan: ${getLabel(contentPurpose)}
Bisnis: ${name}
Tone: ${getLabel(tone)}

${details}

${prompt ? `${prompt}\n\n` : ""}Jika Anda tertarik atau membutuhkan informasi lebih lanjut, silakan hubungi ${name}. Tim kami siap membantu Anda.`;
  }

  return `${getLabel(contentType)} for ${getLabel(platform)}
Purpose: ${getLabel(contentPurpose)}
Business: ${name}
Tone: ${getLabel(tone)}

${details}

${prompt ? `${prompt}\n\n` : ""}If you are interested or need more information, please contact ${name}. Our team will be happy to assist you.`;
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
    const prompt = cleanText(body.prompt);
    const uiLanguage = cleanText(body.ui_language, "en");

    if (!details) {
      return NextResponse.json(
        { error: "Main details are required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    const userSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to generate content." },
        { status: 401 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: ownedWorkspace } = await adminSupabase
      .from("business_workspaces")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let workspace = ownedWorkspace as Record<string, unknown> | null;

    if (!workspace && user.email) {
      const { data: teamMember } = await adminSupabase
        .from("workspace_team_members")
        .select("workspace_id")
        .eq("email", user.email.toLowerCase())
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (teamMember?.workspace_id) {
        const { data: teamWorkspace } = await adminSupabase
          .from("business_workspaces")
          .select("*")
          .eq("id", teamMember.workspace_id)
          .maybeSingle();

        workspace = teamWorkspace as Record<string, unknown> | null;
      }
    }

    if (!workspace?.id) {
      return NextResponse.json(
        { error: "No business workspace found for this user." },
        { status: 404 }
      );
    }

    const workspaceId = String(workspace.id);
    const businessName = cleanText(workspace.business_name, "your business");

    const { data: knowledgeItems } = await adminSupabase
      .from("workspace_knowledge_base")
      .select(
        "title, category, content, source_type, source_url, source_note, tags, language, priority, updated_at"
      )
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("priority", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(30);

    const knowledgeCount = knowledgeItems?.length ?? 0;
    const businessContext = pickBusinessContext(workspace);
    const knowledgeContext = buildKnowledgeContext(
      (knowledgeItems ?? []) as Array<Record<string, unknown>>
    );

    const openAiKey =
      process.env.OPENAI_API_KEY || process.env.KOLKAP_OPENAI_API_KEY;

    const model = process.env.KOLKAP_OPENAI_MODEL || "gpt-4o-mini";

    if (!openAiKey) {
      const content = fallbackContent({
        businessName,
        contentType,
        contentPurpose,
        platform,
        language: language === "auto" ? uiLanguage : language,
        tone,
        details,
        prompt,
      });

      await logWorkspaceUsage({
        workspaceId,
        userId: user.id,
        eventType: "content_generated",
        channel: "content_studio",
        sourcePage: "/dashboard/content-studio",
        creditsUsed: CONTENT_GENERATION_CREDIT_COST,
        metadata: {
          content_type: contentType,
          content_purpose: contentPurpose,
          platform,
          model: "fallback",
          knowledge_count: knowledgeCount,
          credit_rule: "content_generation_minimum",
        },
      });

      return NextResponse.json({
        content,
        business_name: businessName,
        knowledge_count: knowledgeCount,
        fallback: true,
        credits_used: CONTENT_GENERATION_CREDIT_COST,
      });
    }

    const targetLanguage =
      language === "auto"
        ? "Use the same language as the user's main details. If unclear, use the dashboard language."
        : getLabel(language);

    const systemPrompt = `
You are Kolkap Content Studio.

Your job:
Generate ready-to-use business content for the logged-in business.

Rules:
- Use the Business Workspace and Knowledge Base below.
- Do not generate generic content if business details are available.
- Mention the business name naturally when it helps.
- Do not invent prices, discounts, guarantees, addresses, legal promises, policies, or contact details.
- If the Knowledge Base contains official pricing, policy, service, product, FAQ, or important URL information, use it.
- If the user gives specific Main Details, combine them with the business context.
- The output must be only the final content. No explanation. No markdown title unless it fits the requested format.
- Make it useful, specific, clear, and ready to copy.
- Avoid empty generic CTA like "Contact us now" unless it fits the business and details. Prefer a specific CTA based on the platform and business context.
`.trim();

    const userPrompt = `
BUSINESS WORKSPACE:
${businessContext || `Business Name: ${businessName}`}

KNOWLEDGE BASE:
${knowledgeContext}

CONTENT REQUEST:
Content Format: ${getLabel(contentType)}
Content Purpose: ${getLabel(contentPurpose)}
Platform: ${getLabel(platform)}
Language: ${targetLanguage}
Tone: ${getLabel(tone)}

MAIN DETAILS FROM USER:
${details}

EXTRA INSTRUCTIONS:
${prompt || "No extra instructions."}

Generate the final content now.
`.trim();

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const openAiResult = await openAiResponse.json();

    if (!openAiResponse.ok) {
      return NextResponse.json(
        {
          error:
            openAiResult?.error?.message ||
            "Content could not be generated. Please try again.",
        },
        { status: 500 }
      );
    }

    const content = cleanText(openAiResult?.choices?.[0]?.message?.content);

    if (!content) {
      return NextResponse.json(
        { error: "No generated content returned." },
        { status: 500 }
      );
    }

    await logWorkspaceUsage({
      workspaceId,
      userId: user.id,
      eventType: "content_generated",
      channel: "content_studio",
      sourcePage: "/dashboard/content-studio",
      creditsUsed: CONTENT_GENERATION_CREDIT_COST,
      metadata: {
        content_type: contentType,
        content_purpose: contentPurpose,
        platform,
        model,
        knowledge_count: knowledgeCount,
        credit_rule: "content_generation_minimum",
      },
    });

    return NextResponse.json({
      content,
      business_name: businessName,
      knowledge_count: knowledgeCount,
      fallback: false,
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