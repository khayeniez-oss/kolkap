import "server-only";

import { createClient } from "@supabase/supabase-js";

type NotificationPriority = "low" | "normal" | "high" | "urgent";

type CreateKolkapNotificationInput = {
  workspaceId?: string | null;
  ownerUserId?: string | null;
  recipientUserId?: string | null;
  type: string;
  channel?: string;
  title: string;
  message: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  priority?: NotificationPriority;
  sourceTable?: string | null;
  sourceRecordId?: string | null;
  metadata?: Record<string, unknown>;
};

type CreateLowCreditsNotificationInput = {
  workspaceId: string;
  ownerUserId?: string | null;
};

type CreditThreshold = {
  key: "twenty_percent" | "ten_percent" | "exhausted";
  label: string;
  priority: NotificationPriority;
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

function safeText(value: unknown, fallback = "") {
  const text =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? fallback
        : String(value);

  return text.trim();
}

function safeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return numberValue;
}

function getRemainingCredits({
  planCredits,
  purchasedCredits,
  usedCredits,
}: {
  planCredits: number;
  purchasedCredits: number;
  usedCredits: number;
}) {
  const totalCredits = Math.max(0, planCredits + purchasedCredits);
  const remainingCredits = Math.max(0, totalCredits - Math.max(0, usedCredits));

  return {
    totalCredits,
    remainingCredits,
    usedCredits: Math.max(0, usedCredits),
  };
}

function getLowCreditThreshold({
  totalCredits,
  remainingCredits,
}: {
  totalCredits: number;
  remainingCredits: number;
}): CreditThreshold | null {
  if (totalCredits <= 0) {
    return null;
  }

  const remainingRatio = remainingCredits / totalCredits;

  if (remainingCredits <= 0) {
    return {
      key: "exhausted",
      label: "0 credits",
      priority: "urgent",
    };
  }

  if (remainingRatio <= 0.1) {
    return {
      key: "ten_percent",
      label: "10% credits remaining",
      priority: "high",
    };
  }

  if (remainingRatio <= 0.2) {
    return {
      key: "twenty_percent",
      label: "20% credits remaining",
      priority: "normal",
    };
  }

  return null;
}

function getLowCreditTitle(threshold: CreditThreshold) {
  if (threshold.key === "exhausted") {
    return "Your Kolkap credits are exhausted";
  }

  return "Your Kolkap credits are running low";
}

function getLowCreditMessage({
  threshold,
  totalCredits,
  remainingCredits,
}: {
  threshold: CreditThreshold;
  totalCredits: number;
  remainingCredits: number;
}) {
  if (threshold.key === "exhausted") {
    return "Your workspace has 0 credits remaining. Top up your credits to continue using AI actions and automated replies.";
  }

  return `Your workspace has ${remainingCredits.toLocaleString()} of ${totalCredits.toLocaleString()} credits remaining. You are now at ${threshold.label}.`;
}

export async function createKolkapNotification(
  input: CreateKolkapNotificationInput
) {
  try {
    const recipientUserId = safeText(input.recipientUserId || input.ownerUserId);

    if (!recipientUserId) {
      return null;
    }

    const title = safeText(input.title);
    const message = safeText(input.message);

    if (!title || !message) {
      return null;
    }

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("kolkap_notifications")
      .insert({
        workspace_id: input.workspaceId || null,
        owner_user_id: input.ownerUserId || null,
        recipient_user_id: recipientUserId,
        type: safeText(input.type, "general") || "general",
        channel: safeText(input.channel, "system") || "system",
        title,
        message,
        action_label: input.actionLabel || null,
        action_url: input.actionUrl || null,
        priority: input.priority || "normal",
        status: "unread",
        source_table: input.sourceTable || null,
        source_record_id: input.sourceRecordId || null,
        metadata: input.metadata || {},
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create Kolkap notification.", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error(
      "Create Kolkap notification error.",
      error instanceof Error ? error.message : error
    );

    return null;
  }
}

export async function createLowCreditsNotification(
  input: CreateLowCreditsNotificationInput
) {
  try {
    if (!input.workspaceId) {
      return;
    }

    const supabase = getAdminSupabase();

    const { data: workspace, error: workspaceError } = await supabase
      .from("business_workspaces")
      .select("id, owner_user_id, notify_low_credits")
      .eq("id", input.workspaceId)
      .maybeSingle();

    if (workspaceError || !workspace?.id) {
      console.error("Low credits notification skipped. Workspace not found.", {
        workspaceId: input.workspaceId,
        error: workspaceError?.message,
      });

      return;
    }

    if (workspace.notify_low_credits === false) {
      return;
    }

    const ownerUserId =
      safeText(input.ownerUserId) || safeText(workspace.owner_user_id);

    if (!ownerUserId) {
      return;
    }

    const { data: balance, error: balanceError } = await supabase
      .from("workspace_credit_balances")
      .select(
        "id, workspace_id, owner_user_id, plan_credits, purchased_credits, used_credits, billing_period_start, billing_period_end, status"
      )
      .eq("workspace_id", input.workspaceId)
      .maybeSingle();

    if (balanceError || !balance?.id) {
      console.error("Low credits notification skipped. Balance not found.", {
        workspaceId: input.workspaceId,
        error: balanceError?.message,
      });

      return;
    }

    const planCredits = safeNumber(balance.plan_credits, 0);
    const purchasedCredits = safeNumber(balance.purchased_credits, 0);
    const usedCredits = safeNumber(balance.used_credits, 0);

    const { totalCredits, remainingCredits } = getRemainingCredits({
      planCredits,
      purchasedCredits,
      usedCredits,
    });

    const threshold = getLowCreditThreshold({
      totalCredits,
      remainingCredits,
    });

    if (!threshold) {
      return;
    }

    const periodKey =
      safeText(balance.billing_period_start) ||
      safeText(balance.billing_period_end) ||
      "no-period";

    const sourceRecordId = [
      balance.id,
      threshold.key,
      periodKey,
      totalCredits,
    ].join(":");

    const { data: existingNotification, error: existingError } = await supabase
      .from("kolkap_notifications")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("type", "low_credits")
      .eq("source_table", "workspace_credit_balances")
      .eq("source_record_id", sourceRecordId)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Failed to check existing low credits notification.",
        existingError.message
      );

      return;
    }

    if (existingNotification?.id) {
      return;
    }

    await createKolkapNotification({
      workspaceId: input.workspaceId,
      ownerUserId,
      recipientUserId: ownerUserId,
      type: "low_credits",
      channel: "system",
      title: getLowCreditTitle(threshold),
      message: getLowCreditMessage({
        threshold,
        totalCredits,
        remainingCredits,
      }),
      actionLabel: "Top Up Credits",
      actionUrl: "/dashboard/top-up",
      priority: threshold.priority,
      sourceTable: "workspace_credit_balances",
      sourceRecordId,
      metadata: {
        threshold_key: threshold.key,
        threshold_label: threshold.label,
        total_credits: totalCredits,
        remaining_credits: remainingCredits,
        used_credits: usedCredits,
        plan_credits: planCredits,
        purchased_credits: purchasedCredits,
        billing_period_start: balance.billing_period_start || null,
        billing_period_end: balance.billing_period_end || null,
      },
    });
  } catch (error) {
    console.error(
      "Low credits notification error.",
      error instanceof Error ? error.message : error
    );
  }
}