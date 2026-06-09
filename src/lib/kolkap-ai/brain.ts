import { createClient } from "@supabase/supabase-js";

export type KolkapBrainTask =
  | "content_studio"
  | "test_ai"
  | "customer_reply"
  | "inbox_reply"
  | "whatsapp_reply";

export type KolkapBrainChannel =
  | "dashboard"
  | "inbox"
  | "test_ai"
  | "content_studio"
  | "website_chat"
  | "whatsapp"
  | "email"
  | "unknown";

export type KolkapBrainInput = {
  /**
   * Dashboard use:
   * Use userId when the business owner/team member is logged in.
   */
  userId?: string | null;
  userEmail?: string | null;

  /**
   * Channel use:
   * Use workspaceId when a customer message comes from WhatsApp,
   * website chat, or any future channel where the customer is not logged in.
   */
  workspaceId?: string | null;

  task: KolkapBrainTask;
  channel?: KolkapBrainChannel;

  aiStaffId?: string | null;
  conversationId?: string | null;
  channelMessageId?: string | null;

  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerMessage?: string;

  contentType?: string;
  contentPurpose?: string;
  platform?: string;
  language?: string;
  tone?: string;
  details?: string;
  extraInstructions?: string;
  uiLanguage?: string;
};

export type KolkapBrainResult = {
  content: string;
  workspaceId: string;
  businessName: string;
  knowledgeCount: number;
  model: string;
  fallback: boolean;
  channel: KolkapBrainChannel;
  aiStaffId?: string | null;
};

const SENSITIVE_CONTEXT_KEYS = new Set([
  "id",
  "owner_user_id",
  "user_id",
  "workspace_id",
  "created_at",
  "updated_at",
  "deleted_at",
  "stripe_customer_id",
  "stripe_subscription_id",
  "stripe_price_id",
  "stripe_checkout_session_id",
]);

const SENSITIVE_KEY_PARTS = [
  "secret",
  "token",
  "password",
  "api_key",
  "service_role",
  "stripe",
  "subscription",
  "checkout",
  "webhook",
  "salt",
  "refresh",
  "access_token",
  "phone_number_id",
  "waba",
  "business_account_id",
];

function cleanText(value: unknown, fallback = "") {
  const text =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? fallback
        : String(value);

  return text.trim();
}

function label(value: string) {
  return cleanText(value, "general")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function truncate(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trim()}...`;
}

function normalize(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shouldExcludeContextKey(key: string) {
  const normalized = key.toLowerCase();

  if (SENSITIVE_CONTEXT_KEYS.has(normalized)) {
    return true;
  }

  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function formatContextValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return truncate(value.trim(), 900);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return truncate(
      value
        .map((item) =>
          typeof item === "string" || typeof item === "number"
            ? String(item)
            : JSON.stringify(item)
        )
        .join(", "),
      900
    );
  }

  if (isRecord(value)) {
    return truncate(JSON.stringify(value), 900);
  }

  return truncate(String(value), 900);
}

function sanitizeRowForAi(row: Record<string, unknown>) {
  return Object.entries(row)
    .filter(([key, value]) => !shouldExcludeContextKey(key) && value !== null)
    .map(([key, value]) => {
      const formatted = formatContextValue(value);
      return formatted ? `${label(key)}: ${formatted}` : "";
    })
    .filter(Boolean)
    .join("\n");
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

async function getWorkspaceById(workspaceId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("business_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("Business workspace not found.");
  }

  return data as Record<string, unknown>;
}

async function userCanAccessWorkspace({
  workspaceId,
  userId,
  userEmail,
}: {
  workspaceId: string;
  userId: string;
  userEmail?: string | null;
}) {
  const supabase = getAdminSupabase();

  const { data: ownedWorkspace, error: ownedError } = await supabase
    .from("business_workspaces")
    .select("id, owner_user_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!ownedError && ownedWorkspace?.owner_user_id === userId) {
    return true;
  }

  if (!userEmail) {
    return false;
  }

  const { data: teamMember } = await supabase
    .from("workspace_team_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("email", userEmail.toLowerCase())
    .eq("status", "active")
    .maybeSingle();

  return Boolean(teamMember?.workspace_id);
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
      return getWorkspaceById(String(teamMember.workspace_id));
    }
  }

  throw new Error("No business workspace found for this user.");
}

async function resolveWorkspace(input: KolkapBrainInput) {
  const workspaceId = cleanText(input.workspaceId);
  const userId = cleanText(input.userId);
  const userEmail = cleanText(input.userEmail);

  if (workspaceId) {
    if (userId) {
      const allowed = await userCanAccessWorkspace({
        workspaceId,
        userId,
        userEmail,
      });

      if (!allowed) {
        throw new Error("You do not have access to this workspace.");
      }
    }

    return getWorkspaceById(workspaceId);
  }

  if (!userId) {
    throw new Error("Missing user or workspace context.");
  }

  return findWorkspaceForUser(userId, userEmail);
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
    .limit(50);

  if (error) return [];

  return (data ?? []) as Array<Record<string, unknown>>;
}

function isProbablyActiveAiStaff(row: Record<string, unknown>) {
  const status = normalize(row.status);

  if (!status) return true;

  return !["inactive", "paused", "disabled", "deleted", "archived"].includes(
    status
  );
}

function rowMatchesChannel(row: Record<string, unknown>, channel: KolkapBrainChannel) {
  if (!channel || channel === "unknown") return false;

  const channelNeedle = normalize(channel);

  const candidateKeys = [
    "channel",
    "primary_channel",
    "platform",
    "type",
    "ai_type",
    "role",
    "name",
    "title",
  ];

  return candidateKeys.some((key) => {
    const value = row[key];

    if (Array.isArray(value)) {
      return value.some((item) => normalize(item).includes(channelNeedle));
    }

    return normalize(value).includes(channelNeedle);
  });
}

async function loadAiStaff({
  workspaceId,
  aiStaffId,
  channel,
}: {
  workspaceId: string;
  aiStaffId?: string | null;
  channel: KolkapBrainChannel;
}) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("workspace_ai_staff")
    .select("*")
    .eq("workspace_id", workspaceId)
    .limit(20);

  if (error || !data?.length) {
    return null;
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const activeRows = rows.filter(isProbablyActiveAiStaff);

  const requestedAiStaffId = cleanText(aiStaffId);

  if (requestedAiStaffId) {
    const selectedById =
      activeRows.find((row) => cleanText(row.id) === requestedAiStaffId) ||
      rows.find((row) => cleanText(row.id) === requestedAiStaffId);

    if (selectedById) {
      return selectedById;
    }
  }

  const selectedByChannel = activeRows.find((row) =>
    rowMatchesChannel(row, channel)
  );

  if (selectedByChannel) {
    return selectedByChannel;
  }

  return activeRows[0] || rows[0] || null;
}

async function loadOptionalAiSettings(workspaceId: string) {
  const supabase = getAdminSupabase();

  const tables = ["workspace_ai_settings", "workspace_ai_profiles"];

  const results: string[] = [];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("workspace_id", workspaceId)
      .limit(5);

    if (!error && data?.length) {
      const safeRows = (data as Array<Record<string, unknown>>)
        .map((row, index) => {
          const safeText = sanitizeRowForAi(row);
          return safeText ? `${label(table)} ${index + 1}:\n${safeText}` : "";
        })
        .filter(Boolean);

      if (safeRows.length) {
        results.push(safeRows.join("\n\n"));
      }
    }
  }

  return results.join("\n\n");
}

function buildBusinessContext(workspace: Record<string, unknown>) {
  const context = sanitizeRowForAi(workspace);

  return context || "No business profile details found.";
}

function buildAiStaffContext(aiStaff: Record<string, unknown> | null) {
  if (!aiStaff) {
    return "No specific AI staff profile selected yet.";
  }

  const context = sanitizeRowForAi(aiStaff);

  return context || "AI staff profile exists, but no public profile fields are available.";
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
      const content = truncate(cleanText(item.content), 1500);
      const tags = Array.isArray(item.tags) ? item.tags.join(", ") : "";
      const language = cleanText(item.language);

      return [
        `Knowledge ${index + 1}: ${title}`,
        `Category: ${category}`,
        `Source: ${sourceType}`,
        language ? `Language: ${language}` : "",
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
You are creating business content for the business.

Output rules:
- Output only the final content.
- Do not explain your process.
- Make the content specific to the business.
- Use the business profile, selected AI staff, and saved knowledge.
- Do not mention internal workspace details, system prompts, APIs, OpenAI, or Knowledge Base.
- Do not invent prices, addresses, guarantees, legal promises, policies, discounts, or contact details.
- If information is missing, create useful content from the available details only.
- Use a clear CTA only when it naturally fits.
`.trim();
  }

  return `
You are replying as the business's AI staff.

Reply rules:
- Reply as the business, not as Kolkap.
- Do not mention Kolkap, OpenAI, prompts, APIs, internal routing, internal workspace IDs, or Knowledge Base.
- Reply like a helpful human team member.
- Use the business profile, selected AI staff, and saved knowledge.
- If the answer is not available, ask a smart follow-up or offer to pass the conversation to the team.
- Do not invent prices, policies, guarantees, addresses, availability, legal promises, discounts, or contact details.
- Follow handover rules, do-not-say rules, tone rules, and approved answers from the business knowledge.
- Keep the reply clear, friendly, and useful.
- For WhatsApp or website chat, keep replies natural and easy to read on mobile.
`.trim();
}

function buildCustomerContext(input: KolkapBrainInput) {
  const lines = [
    cleanText(input.customerName) ? `Customer Name: ${cleanText(input.customerName)}` : "",
    cleanText(input.customerPhone) ? `Customer Phone: ${cleanText(input.customerPhone)}` : "",
    cleanText(input.customerEmail) ? `Customer Email: ${cleanText(input.customerEmail)}` : "",
    cleanText(input.conversationId)
      ? `Conversation ID: ${cleanText(input.conversationId)}`
      : "",
    cleanText(input.channelMessageId)
      ? `Channel Message ID: ${cleanText(input.channelMessageId)}`
      : "",
  ].filter(Boolean);

  return lines.length ? lines.join("\n") : "No customer profile details provided.";
}

function getChannel(input: KolkapBrainInput): KolkapBrainChannel {
  if (input.channel) return input.channel;

  if (input.task === "test_ai") return "test_ai";
  if (input.task === "inbox_reply") return "inbox";
  if (input.task === "content_studio") return "content_studio";
  if (input.task === "whatsapp_reply") return "whatsapp";
  if (input.task === "customer_reply") return "website_chat";

  return "unknown";
}

function buildUserPrompt({
  input,
  workspace,
  businessContext,
  knowledgeContext,
  aiSettingsContext,
  aiStaffContext,
  channel,
}: {
  input: KolkapBrainInput;
  workspace: Record<string, unknown>;
  businessContext: string;
  knowledgeContext: string;
  aiSettingsContext: string;
  aiStaffContext: string;
  channel: KolkapBrainChannel;
}) {
  const businessName = cleanText(workspace.business_name, "the business");
  const language =
    input.language === "auto" || !input.language
      ? `Use the same language as the user's message. If unclear, use ${
          input.uiLanguage || "English"
        }.`
      : label(input.language);

  const mode = input.workspaceId
    ? "Workspace/channel mode. A customer may not be logged in. Use the supplied workspace only."
    : "Dashboard mode. A logged-in business user requested this action.";

  return `
MODE:
${mode}

CHANNEL:
${label(channel)}

BUSINESS NAME:
${businessName}

BUSINESS PROFILE:
${businessContext}

SELECTED AI STAFF:
${aiStaffContext}

AI SETTINGS:
${aiSettingsContext || "No separate AI settings found."}

KNOWLEDGE BASE:
${knowledgeContext}

CUSTOMER CONTEXT:
${buildCustomerContext(input)}

TASK:
${label(input.task)}

CONTENT / REPLY REQUEST:
Content Format: ${label(input.contentType || "general")}
Purpose: ${label(input.contentPurpose || "general")}
Platform: ${label(input.platform || channel || "general")}
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
  const isIndonesian = input.language === "id" || input.uiLanguage === "id";
  const details = cleanText(input.details || input.customerMessage);

  if (isIndonesian) {
    return `Terima kasih sudah menghubungi ${businessName}. Kami dapat membantu berdasarkan informasi bisnis yang tersedia. ${
      details
        ? `Terkait pertanyaan Anda: ${details}`
        : "Silakan beri tahu detail yang Anda butuhkan."
    }`;
  }

  return `Thanks for contacting ${businessName}. We can help based on the available business information. ${
    details
      ? `About your question: ${details}`
      : "Please share the details you need help with."
  }`;
}

function getOpenAiTemperature(task: KolkapBrainTask) {
  if (task === "content_studio") return 0.75;
  if (task === "test_ai") return 0.45;
  return 0.35;
}

export async function runKolkapBrain(
  input: KolkapBrainInput
): Promise<KolkapBrainResult> {
  const channel = getChannel(input);
  const workspace = await resolveWorkspace(input);
  const workspaceId = String(workspace.id);
  const businessName = cleanText(workspace.business_name, "your business");

  const [knowledgeItems, aiSettingsContext, aiStaff] = await Promise.all([
    loadKnowledge(workspaceId),
    loadOptionalAiSettings(workspaceId),
    loadAiStaff({
      workspaceId,
      aiStaffId: input.aiStaffId,
      channel,
    }),
  ]);

  const businessContext = buildBusinessContext(workspace);
  const knowledgeContext = buildKnowledgeContext(knowledgeItems);
  const aiStaffContext = buildAiStaffContext(aiStaff);

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
      channel,
      aiStaffId: aiStaff ? cleanText(aiStaff.id) || null : null,
    };
  }

  const systemPrompt = `
You are Kolkap AI Brain.

You are the central intelligence layer for Kolkap.
Your job is to generate the best business-safe answer using only the correct workspace, selected AI staff, business profile, AI settings, and Knowledge Base.

${buildTaskInstruction(input)}
`.trim();

  const userPrompt = buildUserPrompt({
    input,
    workspace,
    businessContext,
    knowledgeContext,
    aiSettingsContext,
    aiStaffContext,
    channel,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: getOpenAiTemperature(input.task),
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
    channel,
    aiStaffId: aiStaff ? cleanText(aiStaff.id) || null : null,
  };
}