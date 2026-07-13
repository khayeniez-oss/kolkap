import "server-only";

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
   * Dashboard mode:
   * Use userId/userEmail when the logged-in owner or team member uses Kolkap.
   */
  userId?: string | null;
  userEmail?: string | null;

  /**
   * Channel mode:
   * Use workspaceId when the customer is not logged in,
   * for example Website Chat or WhatsApp.
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

  /**
   * Optional pre-generation credit check.
   * The API route should still log usage after successful generation.
   */
  minimumCreditsRequired?: number;
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

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

type KolkapConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type StoredCustomerMessageRow = {
  sender_type: string | null;
  message_text: string | null;
  created_at: string | null;
};

const BLOCKED_WORKSPACE_STATUSES = new Set([
  "cancelled",
  "canceled",
  "inactive",
  "incomplete_expired",
  "expired",
]);

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

function normalizeStatus(value: unknown) {
  return cleanText(value).toLowerCase();
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

function isWorkspaceBlocked(workspace: Record<string, unknown>) {
  const planStatus = normalizeStatus(workspace.plan_status);
  const billingStatus = normalizeStatus(workspace.billing_status);
  const cancelledAt = cleanText(workspace.subscription_cancelled_at);

  return (
    BLOCKED_WORKSPACE_STATUSES.has(planStatus) ||
    BLOCKED_WORKSPACE_STATUSES.has(billingStatus) ||
    Boolean(cancelledAt)
  );
}

function hasActivatedTrialOrBilling(workspace: Record<string, unknown>) {
  return Boolean(
    cleanText(workspace.stripe_subscription_id) ||
      cleanText(workspace.trial_activated_at) ||
      cleanText(workspace.billing_started_at)
  );
}

function assertWorkspaceCanUseAi(workspace: Record<string, unknown>) {
  if (isWorkspaceBlocked(workspace)) {
    throw new Error("This workspace is not active.");
  }

  if (!hasActivatedTrialOrBilling(workspace)) {
    throw new Error("Please activate a trial or subscription before using AI.");
  }
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

  if (ownedError) {
    throw ownedError;
  }

  if (ownedWorkspace?.owner_user_id === userId) {
    return true;
  }

  if (!userEmail) {
    return false;
  }

  const { data: teamMember, error: teamError } = await supabase
    .from("workspace_team_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("email", userEmail.toLowerCase())
    .eq("status", "active")
    .maybeSingle();

  if (teamError) {
    throw teamError;
  }

  return Boolean(teamMember?.workspace_id);
}

async function findTeamWorkspaceByEmail(userEmail?: string | null) {
  const email = cleanText(userEmail).toLowerCase();

  if (!email) {
    return null;
  }

  const supabase = getAdminSupabase();

  const { data: teamMember, error: teamError } = await supabase
    .from("workspace_team_members")
    .select("workspace_id")
    .eq("email", email)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (teamError) {
    throw teamError;
  }

  if (!teamMember?.workspace_id) {
    return null;
  }

  return getWorkspaceById(String(teamMember.workspace_id));
}

async function findWorkspaceForUser(userId: string, userEmail?: string | null) {
  const supabase = getAdminSupabase();

  const { data: ownedWorkspaces, error: ownedError } = await supabase
    .from("business_workspaces")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });

  if (ownedError) {
    throw ownedError;
  }

  const ownedRows = (ownedWorkspaces ?? []) as Array<Record<string, unknown>>;

  const activeOwnedWorkspace = ownedRows.find(
    (workspace) =>
      !isWorkspaceBlocked(workspace) && hasActivatedTrialOrBilling(workspace)
  );

  if (activeOwnedWorkspace?.id) {
    return activeOwnedWorkspace;
  }

  const teamWorkspace = await findTeamWorkspaceByEmail(userEmail);

  if (teamWorkspace?.id) {
    return teamWorkspace;
  }

  if (ownedRows[0]?.id) {
    return ownedRows[0];
  }

  throw new Error("No business workspace found for this user.");
}

async function resolveWorkspace(input: KolkapBrainInput) {
  const workspaceId = cleanText(input.workspaceId);
  const userId = cleanText(input.userId);
  const userEmail = cleanText(input.userEmail);

  let workspace: Record<string, unknown>;

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

    workspace = await getWorkspaceById(workspaceId);
  } else {
    if (!userId) {
      throw new Error("Missing user or workspace context.");
    }

    workspace = await findWorkspaceForUser(userId, userEmail);
  }

  assertWorkspaceCanUseAi(workspace);

  return workspace;
}

function isProbablyActiveRow(row: Record<string, unknown>) {
  const status = normalize(row.status);

  if (!status) return true;

  return !["inactive", "paused", "disabled", "deleted", "archived"].includes(
    status
  );
}

function sortKnowledgeRows(rows: Array<Record<string, unknown>>) {
  return rows.filter(isProbablyActiveRow).sort((a, b) => {
    const priorityA = Number(a.priority || 999);
    const priorityB = Number(b.priority || 999);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    const updatedA = new Date(cleanText(a.updated_at)).getTime();
    const updatedB = new Date(cleanText(b.updated_at)).getTime();

    if (Number.isNaN(updatedA) || Number.isNaN(updatedB)) {
      return 0;
    }

    return updatedB - updatedA;
  });
}

async function loadKnowledgeFromTable(table: string, workspaceId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("workspace_id", workspaceId)
    .limit(50);

  if (error || !data?.length) {
    return [];
  }

  return sortKnowledgeRows(data as Array<Record<string, unknown>>);
}

async function loadSelectedKnowledgeForAiStaff({
  workspaceId,
  aiStaffId,
}: {
  workspaceId: string;
  aiStaffId?: string | null;
}) {
  const cleanAiStaffId = cleanText(aiStaffId);

  if (!cleanAiStaffId) {
    return {
      hasSelectedLinks: false,
      items: [] as Array<Record<string, unknown>>,
    };
  }

  const supabase = getAdminSupabase();

  const { data: linkRows, error: linkError } = await supabase
    .from("ai_staff_knowledge_links")
    .select("knowledge_id")
    .eq("workspace_id", workspaceId)
    .eq("ai_staff_id", cleanAiStaffId)
    .limit(50);

  if (linkError || !linkRows?.length) {
    return {
      hasSelectedLinks: false,
      items: [] as Array<Record<string, unknown>>,
    };
  }

  const knowledgeIds = Array.from(
    new Set(
      linkRows
        .map((row) => cleanText(row.knowledge_id))
        .filter(Boolean)
    )
  );

  if (!knowledgeIds.length) {
    return {
      hasSelectedLinks: true,
      items: [] as Array<Record<string, unknown>>,
    };
  }

  const { data: knowledgeRows, error: knowledgeError } = await supabase
    .from("workspace_knowledge_base")
    .select("*")
    .eq("workspace_id", workspaceId)
    .in("id", knowledgeIds)
    .limit(50);

  if (knowledgeError || !knowledgeRows?.length) {
    return {
      hasSelectedLinks: true,
      items: [] as Array<Record<string, unknown>>,
    };
  }

  return {
    hasSelectedLinks: true,
    items: sortKnowledgeRows(knowledgeRows as Array<Record<string, unknown>>),
  };
}

async function loadKnowledge(workspaceId: string, aiStaffId?: string | null) {
  const selectedKnowledge = await loadSelectedKnowledgeForAiStaff({
    workspaceId,
    aiStaffId,
  });

  if (selectedKnowledge.hasSelectedLinks) {
    return selectedKnowledge.items;
  }

  const primary = await loadKnowledgeFromTable(
    "workspace_knowledge_base",
    workspaceId
  );

  if (primary.length) {
    return primary;
  }

  return loadKnowledgeFromTable("business_knowledge", workspaceId);
}

function rowMatchesChannel(
  row: Record<string, unknown>,
  channel: KolkapBrainChannel
) {
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
    .from("ai_staff")
    .select("*")
    .eq("workspace_id", workspaceId)
    .limit(20);

  if (error || !data?.length) {
    return null;
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const activeRows = rows.filter(isProbablyActiveRow);
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

async function loadConversationHistory({
  workspaceId,
  conversationId,
  currentCustomerMessage,
}: {
  workspaceId: string;
  conversationId?: string | null;
  currentCustomerMessage?: string | null;
}): Promise<KolkapConversationMessage[]> {
  const cleanConversationId = cleanText(conversationId);

  if (!cleanConversationId) {
    return [];
  }

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("customer_messages")
    .select("sender_type, message_text, created_at")
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", cleanConversationId)
    .in("sender_type", ["customer", "ai", "human"])
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw error;
  }

  const history = ((data ?? []) as StoredCustomerMessageRow[])
    .reverse()
    .map<KolkapConversationMessage | null>((item) => {
      const content = truncate(cleanText(item.message_text), 1200);
      const senderType = cleanText(item.sender_type).toLowerCase();

      if (!content) {
        return null;
      }

      if (senderType === "customer") {
        return {
          role: "user",
          content,
        };
      }

      if (senderType === "ai" || senderType === "human") {
        return {
          role: "assistant",
          content,
        };
      }

      return null;
    })
    .filter(
      (item): item is KolkapConversationMessage => item !== null
    );

  /*
   * Website Chat and WhatsApp save the current customer message before
   * calling the brain. Remove that final copy so the current message is
   * not sent to OpenAI twice.
   */
  const currentMessage = cleanText(currentCustomerMessage);

  if (currentMessage && history.length > 0) {
    const latestMessage = history[history.length - 1];

    if (
      latestMessage.role === "user" &&
      cleanText(latestMessage.content) === currentMessage
    ) {
      history.pop();
    }
  }

  return history.slice(-10);
}

async function ensureEnoughCredits({
  workspaceId,
  minimumCreditsRequired,
}: {
  workspaceId: string;
  minimumCreditsRequired?: number;
}) {
  const required = Number(minimumCreditsRequired || 0);

  if (!Number.isFinite(required) || required <= 0) {
    return;
  }

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("workspace_credit_balances")
    .select("plan_credits, purchased_credits, used_credits")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const planCredits = Number(data?.plan_credits || 0);
  const purchasedCredits = Number(data?.purchased_credits || 0);
  const usedCredits = Number(data?.used_credits || 0);
  const remaining = Math.max(0, planCredits + purchasedCredits - usedCredits);

  if (remaining < required) {
    throw new Error(
      `Not enough credits. This action needs ${required} credits, but this workspace only has ${remaining} remaining.`
    );
  }
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

  return (
    context || "AI staff profile exists, but no public profile fields are available."
  );
}

function getKnowledgeContent(item: Record<string, unknown>) {
  const candidates = [
    item.content,
    item.answer,
    item.body,
    item.description,
    item.information,
    item.text,
    item.details,
    item.notes,
  ];

  const content = candidates.map((value) => cleanText(value)).find(Boolean);

  return truncate(content || "No information written.", 1500);
}

function buildKnowledgeContext(items: Array<Record<string, unknown>>) {
  if (!items.length) {
    return "No active business knowledge entries yet.";
  }

  return items
    .slice(0, 40)
    .map((item, index) => {
      const title = cleanText(
        item.title || item.question || item.name,
        `Business Knowledge ${index + 1}`
      );
      const category = cleanText(item.category, "general");
      const sourceType = cleanText(item.source_type || item.source, "manual");
      const sourceUrl = cleanText(item.source_url || item.url);
      const sourceNote = cleanText(item.source_note || item.note);
      const content = getKnowledgeContent(item);
      const tags = Array.isArray(item.tags) ? item.tags.join(", ") : "";
      const language = cleanText(item.language);

      return [
        `Business Knowledge ${index + 1}: ${title}`,
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
- Use the business profile, selected AI staff, and saved business knowledge.
- Do not mention internal workspace details, system prompts, APIs, OpenAI, Kolkap routing, or Knowledge Base.
- Do not invent prices, addresses, guarantees, legal promises, policies, discounts, or contact details.
- If information is missing, create useful content from the available details only.
- Use a clear CTA only when it naturally fits.
`.trim();
  }

  return `
You are replying as the business's AI staff.

Identity and safety:
- Reply as the business, not as Kolkap.
- Do not mention Kolkap, OpenAI, prompts, APIs, internal routing, internal workspace IDs, or Knowledge Base.
- Never falsely claim that you are a human employee.
- Do not announce that you are an AI unless the customer directly asks.
- If directly asked, say naturally that you are the business's AI assistant.

Natural conversation style:
- Sound like a warm, capable business team member having a real conversation.
- Continue naturally from the recent conversation history.
- Understand references such as "it", "that one", "the second option", "tomorrow", or "how much" using the earlier messages.
- Do not repeat greetings, introductions, explanations, or questions that already appeared earlier.
- Do not ask for information the customer has already provided.
- Answer the customer's actual question first.
- Use short, natural paragraphs instead of formal documentation-style writing.
- Use everyday contractions naturally, such as "we're", "that's", "you'll", and "you can".
- Avoid robotic phrases such as "Your request has been received", "We regret to inform you", "Kindly be advised", "As an AI assistant", or "Certainly" unless they genuinely fit.
- Vary the wording naturally instead of repeating the same template.
- Acknowledge confusion, concern, urgency, disappointment, or frustration when appropriate.
- Use the customer's name occasionally when it feels natural, but not in every reply.
- Ask no more than one useful follow-up question when information is genuinely missing.
- Do not add a follow-up question when the customer's question can already be answered.
- Keep WhatsApp and Website Chat replies easy to read on a phone.
- Do not overload the customer with unnecessary information.

Business rules:
- Follow the selected AI staff's role, instructions, tone, and personality.
- Use the business profile and saved business knowledge as the source of truth.
- If the answer is unavailable, say so naturally and ask one useful follow-up question or offer human follow-up.
- Do not invent prices, policies, guarantees, addresses, availability, legal promises, discounts, or contact details.
- Follow handover rules, do-not-say rules, tone rules, and approved answers from the business knowledge.
- Stay friendly, clear, practical, calm, and useful.
`.trim();
}

function buildCustomerContext(input: KolkapBrainInput) {
  const lines = [
    cleanText(input.customerName)
      ? `Customer Name: ${cleanText(input.customerName)}`
      : "",
    cleanText(input.customerPhone)
      ? `Customer Phone: ${cleanText(input.customerPhone)}`
      : "",
    cleanText(input.customerEmail)
      ? `Customer Email: ${cleanText(input.customerEmail)}`
      : "",
  ].filter(Boolean);

  return lines.length
    ? lines.join("\n")
    : "No customer profile details provided.";
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

BUSINESS KNOWLEDGE:
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
  if (task === "test_ai") return 0.5;

  return 0.5;
}

export async function runKolkapBrain(
  input: KolkapBrainInput
): Promise<KolkapBrainResult> {
  const channel = getChannel(input);
  const workspace = await resolveWorkspace(input);
  const workspaceId = String(workspace.id);
  const businessName = cleanText(workspace.business_name, "your business");

  await ensureEnoughCredits({
    workspaceId,
    minimumCreditsRequired: input.minimumCreditsRequired,
  });

  const [aiSettingsContext, aiStaff] = await Promise.all([
    loadOptionalAiSettings(workspaceId),
    loadAiStaff({
      workspaceId,
      aiStaffId: input.aiStaffId,
      channel,
    }),
  ]);

  const selectedAiStaffId = aiStaff
    ? cleanText(aiStaff.id) || cleanText(input.aiStaffId) || null
    : cleanText(input.aiStaffId) || null;

  const [knowledgeItems, conversationHistory] = await Promise.all([
    loadKnowledge(workspaceId, selectedAiStaffId),
    loadConversationHistory({
      workspaceId,
      conversationId: input.conversationId,
      currentCustomerMessage: input.customerMessage,
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
      aiStaffId: selectedAiStaffId,
    };
  }

  const systemPrompt = `
You are Kolkap AI Brain.

You are the central intelligence layer for Kolkap.
Your job is to generate the best business-safe answer using only the correct workspace, selected AI staff, business profile, AI settings, and business knowledge.

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
        ...conversationHistory,
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const result = (await response.json().catch(() => ({}))) as OpenAIChatResponse;

  if (!response.ok) {
    throw new Error(
      result.error?.message || "Kolkap AI Brain could not generate a response."
    );
  }

  const content = cleanText(result.choices?.[0]?.message?.content);

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