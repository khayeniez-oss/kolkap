import { NextResponse } from "next/server";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import { KOLKAP_GENERATE_KNOWLEDGE_CREDITS } from "@/lib/kolkapPlan";
import {
  cleanText,
  getAdminSupabase,
  getCreditBalance,
  getCreditsLeft,
  getWorkspace,
  userCanAccessWorkspace,
  verifyRequestUser,
} from "@/lib/kolkap-ai-staff/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const CATEGORY_OPTIONS = new Set([
  "business_info",
  "faq",
  "product_service",
  "pricing",
  "policy",
  "sales_instruction",
  "handover_rule",
  "do_not_say",
  "important_link",
  "custom_note",
]);

const LANGUAGE_OPTIONS = new Set(["auto", "en", "zh", "id", "ms"]);

function normalizeCategory(value: unknown) {
  const category = cleanText(value || "custom_note").toLowerCase();
  return CATEGORY_OPTIONS.has(category) ? category : "custom_note";
}

function normalizeLanguage(value: unknown) {
  const language = cleanText(value || "auto").toLowerCase();
  return LANGUAGE_OPTIONS.has(language) ? language : "auto";
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanText(item).toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }

  return cleanText(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function safeJsonParse(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    throw new Error("Generated knowledge could not be read.");
  }
}

function truncate(value: unknown, max: number) {
  return cleanText(value).slice(0, max);
}

async function loadExistingKnowledgeSummary(workspaceId: string) {
  const supabaseAdmin = getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from("workspace_knowledge_base")
    .select("title,category,status")
    .eq("workspace_id", workspaceId)
    .limit(25);

  if (error || !data?.length) {
    return "No existing knowledge items found.";
  }

  return data
    .filter((item) => cleanText(item.status).toLowerCase() !== "archived")
    .slice(0, 20)
    .map((item, index) => {
      const title = cleanText(item.title, `Knowledge ${index + 1}`);
      const category = cleanText(item.category, "general");
      return `${index + 1}. ${title} (${category})`;
    })
    .join("\n");
}

export async function POST(req: Request) {
  const auth = await verifyRequestUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json().catch(() => ({}));

    const workspaceId = cleanText(body.workspace_id);
    const roughDetails = cleanText(
      body.details ||
        body.business_details ||
        body.rough_details ||
        body.prompt ||
        body.content
    ).slice(0, 6000);

    const requestedTitle = truncate(body.title || body.topic, 120);
    const requestedCategory = normalizeCategory(body.category);
    const requestedLanguage = normalizeLanguage(body.language);

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "Workspace is required." },
        { status: 400 }
      );
    }

    if (!roughDetails || roughDetails.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Please add details for the knowledge you want to generate.",
        },
        { status: 400 }
      );
    }

    const workspace = await getWorkspace(workspaceId);

    if (!workspace?.id) {
      return NextResponse.json(
        { success: false, error: "Workspace not found." },
        { status: 404 }
      );
    }

    const canAccess = await userCanAccessWorkspace({
      userId: auth.userId!,
      userEmail: auth.userEmail,
      workspace,
    });

    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this workspace." },
        { status: 403 }
      );
    }

    const ownerUserId = cleanText(workspace.owner_user_id);

    if (!ownerUserId) {
      return NextResponse.json(
        { success: false, error: "Workspace owner could not be found." },
        { status: 400 }
      );
    }

    const creditBalance = await getCreditBalance({
      workspaceId,
      ownerUserId,
    });

    const creditsLeft = getCreditsLeft(creditBalance);

    if (creditsLeft < KOLKAP_GENERATE_KNOWLEDGE_CREDITS) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to generate knowledge. Please open the web dashboard to manage your workspace.",
          error_code: "not_enough_credits",
          credits_left: creditsLeft,
          credits_required: KOLKAP_GENERATE_KNOWLEDGE_CREDITS,
        },
        { status: 402 }
      );
    }

    const openAiKey =
      process.env.OPENAI_API_KEY || process.env.KOLKAP_OPENAI_API_KEY;

    if (!openAiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Knowledge generation is not available right now.",
        },
        { status: 500 }
      );
    }

    const model = process.env.KOLKAP_OPENAI_MODEL || "gpt-4o-mini";
    const businessName = cleanText(workspace.business_name, "the business");
    const existingKnowledge = await loadExistingKnowledgeSummary(workspaceId);

    const systemPrompt = `
You generate structured business knowledge for a private business AI assistant.

Return ONLY valid JSON with this exact shape:
{
  "title": "short title",
  "category": "business_info | faq | product_service | pricing | policy | sales_instruction | handover_rule | do_not_say | important_link | custom_note",
  "language": "auto | en | zh | id | ms",
  "tags": ["tag1", "tag2"],
  "content": "clear factual business knowledge"
}

Rules:
- Do not invent prices, addresses, policies, guarantees, links, discounts, or legal promises.
- Use only the user's details.
- Make the content clear enough for an AI staff member to answer customers.
- Keep content under 4,000 characters.
- If the user gives messy notes, organize them into clean business knowledge.
- If information is missing, say what is known and avoid guessing.
`.trim();

    const userPrompt = `
Business name:
${businessName}

Requested title:
${requestedTitle || "No title provided"}

Requested category:
${requestedCategory}

Requested language:
${requestedLanguage}

Existing knowledge titles in this workspace:
${existingKnowledge}

User details to turn into business knowledge:
${roughDetails}
`.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const result = (await response.json().catch(() => ({}))) as OpenAIChatResponse;

    if (!response.ok) {
      throw new Error(
        result.error?.message || "Knowledge could not be generated."
      );
    }

    const rawContent = cleanText(result.choices?.[0]?.message?.content);

    if (!rawContent) {
      throw new Error("Generated knowledge was empty.");
    }

    const parsed = safeJsonParse(rawContent) as Record<string, unknown>;

    const generated = {
      title: truncate(parsed.title || requestedTitle || "Generated Knowledge", 120),
      category: normalizeCategory(parsed.category || requestedCategory),
      language: normalizeLanguage(parsed.language || requestedLanguage),
      tags: normalizeTags(parsed.tags),
      content: truncate(parsed.content, 4000),
      source_type: "manual",
      source_url: null,
      source_note: null,
    };

    if (!generated.title || !generated.content) {
      throw new Error("Generated knowledge was incomplete.");
    }

    await logWorkspaceUsage({
      workspaceId,
      userId: auth.userId || null,
      eventType: "knowledge_generated",
      channel: "dashboard",
      sourcePage: "knowledge_base",
      creditsUsed: KOLKAP_GENERATE_KNOWLEDGE_CREDITS,
      eventCount: 1,
      status: "success",
      metadata: {
        credit_rule: "knowledge_generate_ai",
        title: generated.title,
        category: generated.category,
        language: generated.language,
      },
    });

    return NextResponse.json({
      success: true,
      generated,
      credits_used: KOLKAP_GENERATE_KNOWLEDGE_CREDITS,
      credits_left_before_action: creditsLeft,
    });
  } catch (error) {
    console.error("Generate knowledge error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Knowledge could not be generated.",
      },
      { status: 500 }
    );
  }
}
