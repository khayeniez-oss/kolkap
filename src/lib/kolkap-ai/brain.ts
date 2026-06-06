import { createClient } from "@supabase/supabase-js";

export type KolkapBrainTask =
  | "content_studio"
  | "test_ai"
  | "customer_reply"
  | "inbox_reply"
  | "whatsapp_reply";

export type KolkapBrainInput = {
  userId: string;
  userEmail?: string | null;
  task: KolkapBrainTask;

  contentType?: string;
  contentPurpose?: string;
  platform?: string;
  language?: string;
  tone?: string;
  details?: string;
  extraInstructions?: string;
  customerMessage?: string;
  uiLanguage?: string;
};

export type KolkapBrainResult = {
  content: string;
  workspaceId: string;
  businessName: string;
  knowledgeCount: number;
  model: string;
  fallback: boolean;
};

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function label(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function truncate(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trim()}...`;
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

async function findWorkspaceForUser(userId: string, userEmail?: string | null) {
  const supabase = getAdminSupabase();

  const { data: ownedWorkspace, error: ownedError } = await supabase
    .from("business_workspaces")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ownedError && ownedWorkspace?.id) {
    return ownedWorkspace as Record<string, unknown>;
  }

  if (userEmail) {
    const { data: teamMember } = await supabase
      .from("workspace_team_members")
      .select("workspace_id")
      .eq("email", userEmail.toLowerCase())
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (teamMember?.workspace_id) {
      const { data: teamWorkspace } = await supabase
        .from("business_workspaces")
        .select("*")
        .eq("id", teamMember.workspace_id)
        .maybeSingle();

      if (teamWorkspace?.id) {
        return teamWorkspace as Record<string, unknown>;
      }
    }
  }

  throw new Error("No business workspace found for this user.");
}

async function loadKnowledge(workspaceId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("workspace_knowledge_base")
    .select(
      "title, category, content, source_type, source_url, source_note, tags, language, priority, updated_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("priority", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) return [];

  return (data ?? []) as Array<Record<string, unknown>>;
}

async function loadOptionalAiSettings(workspaceId: string) {
  const supabase = getAdminSupabase();

  const tables = [
    "workspace_ai_settings",
    "workspace_ai_staff",
    "workspace_ai_profiles",
  ];

  const results: string[] = [];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("workspace_id", workspaceId)
      .limit(3);

    if (!error && data?.length) {
      results.push(
        `${table}:\n${data
          .map((row) => JSON.stringify(row, null, 2))
          .join("\n")}`
      );
    }
  }

  return results.join("\n\n");
}

function buildBusinessContext(workspace: Record<string, unknown>) {
  const excluded = new Set([
    "id",
    "owner_user_id",
    "created_at",
    "updated_at",
    "deleted_at",
  ]);

  return Object.entries(workspace)
    .filter(([key, value]) => !excluded.has(key) && value !== null && value !== "")
    .map(([key, value]) => `${label(key)}: ${truncate(String(value), 700)}`)
    .join("\n");
}

function buildKnowledgeContext(items: Array<Record<string, unknown>>) {
  if (!items.length) {
    return "No active Knowledge Base entries yet.";
  }

  return items
    .map((item, index) => {
      const title = cleanText(item.title, `Knowledge ${index + 1}`);
      const category = cleanText(item.category, "general");
      const sourceType = cleanText(item.source_type, "manual");
      const sourceUrl = cleanText(item.source_url);
      const sourceNote = cleanText(item.source_note);
      const content = truncate(cleanText(item.content), 1400);
      const tags = Array.isArray(item.tags) ? item.tags.join(", ") : "";

      return [
        `Knowledge ${index + 1}: ${title}`,
        `Category: ${category}`,
        `Source: ${sourceType}`,
        sourceUrl ? `Important URL: ${sourceUrl}` : "",
        sourceNote ? `URL Note: ${sourceNote}` : "",
        tags ? `Tags: ${tags}` : "",
        `Information:\n${content}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

function buildTaskInstruction(input: KolkapBrainInput) {
  if (input.task === "content_studio") {
    return `
You are creating business content.

Output rules:
- Output only the final content.
- Do not explain your process.
- Do not mention "Knowledge Base" unless the content needs it.
- Make the content specific to the logged-in business.
- Use the business profile and saved knowledge.
- Do not invent prices, addresses, guarantees, legal promises, policies, discounts, or contact details.
- If information is missing, write useful content using the user's main details, but do not pretend missing facts are known.
- Avoid generic phrases like "contact us now" unless it naturally fits. Prefer a clear CTA based on the business context.
`.trim();
  }

  return `
You are replying as the business AI assistant.

Reply rules:
- Reply like a helpful human team member.
- Use the business profile and saved knowledge.
- If the answer is not in the business context, ask a smart follow-up or offer handover.
- Do not invent prices, policies, guarantees, addresses, or legal promises.
- Follow any handover rules and do-not-say rules in the Knowledge Base.
- Keep the reply clear, friendly, and useful.
`.trim();
}

function buildUserPrompt({
  input,
  workspace,
  businessContext,
  knowledgeContext,
  aiSettingsContext,
}: {
  input: KolkapBrainInput;
  workspace: Record<string, unknown>;
  businessContext: string;
  knowledgeContext: string;
  aiSettingsContext: string;
}) {
  const businessName = cleanText(workspace.business_name, "the business");
  const language =
    input.language === "auto" || !input.language
      ? `Use the same language as the user's request. If unclear, use ${input.uiLanguage || "English"}.`
      : label(input.language);

  return `
BUSINESS NAME:
${businessName}

BUSINESS PROFILE:
${businessContext || "No business profile details found."}

AI SETTINGS:
${aiSettingsContext || "No separate AI settings found."}

KNOWLEDGE BASE:
${knowledgeContext}

TASK:
${label(input.task)}

CONTENT / REPLY REQUEST:
Content Format: ${label(input.contentType || "general")}
Purpose: ${label(input.contentPurpose || "general")}
Platform: ${label(input.platform || "general")}
Language: ${language}
Tone: ${label(input.tone || "professional")}

MAIN DETAILS:
${cleanText(input.details) || "No main details provided."}

EXTRA INSTRUCTIONS:
${cleanText(input.extraInstructions) || "No extra instructions."}

CUSTOMER MESSAGE:
${cleanText(input.customerMessage) || "No customer message."}

Now generate the best final answer/content.
`.trim();
}

function fallbackContent(input: KolkapBrainInput, businessName: string) {
  const isIndonesian =
    input.language === "id" || input.uiLanguage === "id";

  const details = cleanText(input.details || input.customerMessage);

  if (isIndonesian) {
    return `${businessName}\n\n${details}\n\nKami dapat membantu Anda dengan informasi yang tersedia. Silakan berikan detail tambahan agar tim kami bisa membantu dengan lebih tepat.`;
  }

  return `${businessName}\n\n${details}\n\nWe can help with the available business information. Please share more details so our team can assist you more accurately.`;
}

export async function runKolkapBrain(
  input: KolkapBrainInput
): Promise<KolkapBrainResult> {
  if (!input.userId) {
    throw new Error("Missing user ID.");
  }

  const workspace = await findWorkspaceForUser(input.userId, input.userEmail);
  const workspaceId = String(workspace.id);
  const businessName = cleanText(workspace.business_name, "your business");

  const [knowledgeItems, aiSettingsContext] = await Promise.all([
    loadKnowledge(workspaceId),
    loadOptionalAiSettings(workspaceId),
  ]);

  const businessContext = buildBusinessContext(workspace);
  const knowledgeContext = buildKnowledgeContext(knowledgeItems);

  const openAiKey =
    process.env.OPENAI_API_KEY || process.env.KOLKAP_OPENAI_API_KEY;

  const model = process.env.KOLKAP_OPENAI_MODEL || "gpt-4o-mini";

  if (!openAiKey) {
    return {
      content: fallbackContent(input, businessName),
      workspaceId,
      businessName,
      knowledgeCount: knowledgeItems.length,
      model: "fallback",
      fallback: true,
    };
  }

  const systemPrompt = `
You are Kolkap AI Brain.

You are the central intelligence for Kolkap.
Every output must be based on the logged-in business, its workspace profile, AI settings, and Knowledge Base.

${buildTaskInstruction(input)}
`.trim();

  const userPrompt = buildUserPrompt({
    input,
    workspace,
    businessContext,
    knowledgeContext,
    aiSettingsContext,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: input.task === "content_studio" ? 0.75 : 0.45,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error?.message || "Kolkap AI Brain could not generate a response."
    );
  }

  const content = cleanText(result?.choices?.[0]?.message?.content);

  if (!content) {
    throw new Error("Kolkap AI Brain returned empty content.");
  }

  return {
    content,
    workspaceId,
    businessName,
    knowledgeCount: knowledgeItems.length,
    model,
    fallback: false,
  };
}