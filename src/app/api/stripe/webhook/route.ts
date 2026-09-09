import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getKolkapPlan, type KolkapPlanKey } from "@/lib/kolkapPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BillablePlanKey = Extract<
  KolkapPlanKey,
  "starter" | "growth" | "professional" | "business"
>;

type WorkspaceRow = {
  id: string;
  owner_user_id: string;
};

type CreditTopupResultRow = {
  topup_id: string;
  workspace_id: string;
  owner_user_id: string;
  credits_added: number;
  already_processed: boolean;
};

type CreditRenewalResultRow = {
  workspace_id: string;
  credits_added: number;
  credits_left: number;
  already_processed: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringId(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (isRecord(value) && typeof value.id === "string") {
    return value.id;
  }

  return null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(stripeSecretKey);
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

function normalizePlanKey(
  value: string | null | undefined
): BillablePlanKey | null {
  if (
    value === "starter" ||
    value === "growth" ||
    value === "professional" ||
    value === "business"
  ) {
    return value;
  }

  return null;
}

function getPlanKeyFromPriceId(
  priceId: string | null | undefined
): BillablePlanKey | null {
  if (!priceId) return null;

  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) return "growth";
  if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID)
    return "professional";
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return "business";

  return null;
}

function dateFromUnix(timestamp: number | null | undefined) {
  if (!timestamp) return null;

  return new Date(timestamp * 1000).toISOString();
}

function getFallbackTrialEnd() {
  const date = new Date();
  date.setDate(date.getDate() + 7);

  return date.toISOString();
}

function getPlanStatusFromStripeStatus(status: string | null | undefined) {
  if (status === "trialing") return "trial";
  if (status === "active") return "active";
  if (status === "canceled") return "cancelled";

  if (
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete" ||
    status === "incomplete_expired"
  ) {
    return "past_due";
  }

  return "trial";
}

function getFirstSubscriptionItem(subscription: Stripe.Subscription | null) {
  if (!subscription || !isRecord(subscription)) return null;

  const items = subscription.items;

  if (!isRecord(items) || !Array.isArray(items.data)) {
    return null;
  }

  const firstItem = items.data[0];

  return isRecord(firstItem) ? firstItem : null;
}

function getSubscriptionPriceId(subscription: Stripe.Subscription | null) {
  const firstItem = getFirstSubscriptionItem(subscription);

  if (!firstItem) return null;

  const price = firstItem.price;

  if (!isRecord(price)) return null;

  return typeof price.id === "string" ? price.id : null;
}

function getCurrentPeriodStart(subscription: Stripe.Subscription | null) {
  if (!subscription || !isRecord(subscription)) return null;

  const topLevelPeriodStart = getNumber(subscription.current_period_start);

  if (topLevelPeriodStart) {
    return topLevelPeriodStart;
  }

  const firstItem = getFirstSubscriptionItem(subscription);

  return firstItem ? getNumber(firstItem.current_period_start) : null;
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription | null) {
  if (!subscription || !isRecord(subscription)) return null;

  const topLevelPeriodEnd = getNumber(subscription.current_period_end);

  if (topLevelPeriodEnd) {
    return topLevelPeriodEnd;
  }

  const firstItem = getFirstSubscriptionItem(subscription);

  return firstItem ? getNumber(firstItem.current_period_end) : null;
}

function getInvoiceSubscriptionLine(invoice: Stripe.Invoice) {
  if (!isRecord(invoice.lines) || !Array.isArray(invoice.lines.data)) {
    return null;
  }

  const subscriptionLines = invoice.lines.data
    .filter(isRecord)
    .filter((line) => getStringId(line.subscription))
    .sort((first, second) => {
      const firstPeriod = isRecord(first.period)
        ? getNumber(first.period.end) || 0
        : 0;
      const secondPeriod = isRecord(second.period)
        ? getNumber(second.period.end) || 0
        : 0;

      return secondPeriod - firstPeriod;
    });

  return subscriptionLines[0] || null;
}

function getInvoicePriceId(invoiceLine: unknown) {
  if (!isRecord(invoiceLine) || !isRecord(invoiceLine.pricing)) return null;

  const priceDetails = invoiceLine.pricing.price_details;

  if (!isRecord(priceDetails)) return null;

  return getStringId(priceDetails.price);
}

function getInvoiceLinePeriod(invoiceLine: unknown) {
  if (!isRecord(invoiceLine) || !isRecord(invoiceLine.period)) {
    return { start: null, end: null };
  }

  return {
    start: getNumber(invoiceLine.period.start),
    end: getNumber(invoiceLine.period.end),
  };
}

function getSubscriptionCancelAt(subscription: Stripe.Subscription) {
  if (!isRecord(subscription)) return null;

  return getNumber(subscription.cancel_at);
}

function getSubscriptionCancelledAt(subscription: Stripe.Subscription) {
  if (!isRecord(subscription)) return null;

  return getNumber(subscription.canceled_at);
}

function isCreditTopupCheckout(session: Stripe.Checkout.Session) {
  return session.metadata?.type === "credit_topup";
}

async function findWorkspaceById(workspaceId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("business_workspaces")
    .select("id, owner_user_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as WorkspaceRow | null;
}

async function findWorkspaceBySubscriptionId(subscriptionId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("business_workspaces")
    .select("id, owner_user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as WorkspaceRow | null;
}

async function syncWorkspaceCreditBalance(input: {
  workspaceId: string;
  ownerUserId: string;
  planKey: BillablePlanKey;
  resetUsedCredits?: boolean;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
}) {
  const supabase = getAdminSupabase();
  const plan = getKolkapPlan(input.planKey);
  const planCredits =
    typeof plan.monthlyCredits === "number" ? plan.monthlyCredits : 0;

  const { data: existingBalance, error: existingError } = await supabase
    .from("workspace_credit_balances")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const basePayload: Record<string, unknown> = {
    plan_name: plan.name,
    status: "active",
    updated_at: new Date().toISOString(),
  };

  if (input.resetUsedCredits) {
    basePayload.plan_credits = planCredits;
    basePayload.used_credits = 0;
  }

  if (input.billingPeriodStart) {
    basePayload.billing_period_start = input.billingPeriodStart;
  }

  if (input.billingPeriodEnd) {
    basePayload.billing_period_end = input.billingPeriodEnd;
  }

  if (existingBalance?.id) {
    const { error: updateError } = await supabase
      .from("workspace_credit_balances")
      .update(basePayload)
      .eq("workspace_id", input.workspaceId);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const { error: insertError } = await supabase
    .from("workspace_credit_balances")
    .insert({
      workspace_id: input.workspaceId,
      owner_user_id: input.ownerUserId,
      plan_name: plan.name,
      plan_credits: planCredits,
      purchased_credits: 0,
      used_credits: 0,
      status: "active",
      billing_period_start: input.billingPeriodStart || null,
      billing_period_end: input.billingPeriodEnd || null,
      updated_at: new Date().toISOString(),
    });

  if (insertError) {
    throw insertError;
  }
}

async function completeCreditTopupFromCheckout(
  session: Stripe.Checkout.Session
) {
  const supabase = getAdminSupabase();

  const topupId = session.metadata?.topup_id || null;
  const workspaceId = session.metadata?.workspace_id || null;
  const paymentIntentId = getStringId(session.payment_intent);
  const customerId = getStringId(session.customer);

  if (!topupId) {
    console.log("Stripe credit top-up skipped. Missing topup_id.", {
      sessionId: session.id,
      metadata: session.metadata,
    });

    return;
  }

  const { data, error } = await supabase.rpc(
    "complete_workspace_credit_topup",
    {
      p_topup_id: topupId,
      p_stripe_checkout_session_id: session.id,
      p_stripe_payment_intent_id: paymentIntentId,
      p_stripe_customer_id: customerId,
    }
  );

  if (error) {
    throw error;
  }

  const resultRows = (data ?? []) as CreditTopupResultRow[];
  const result = resultRows[0];

  await supabase.from("workspace_usage_events").insert({
    workspace_id: result?.workspace_id || workspaceId,
    owner_user_id: result?.owner_user_id || session.metadata?.owner_user_id,
    user_id: result?.owner_user_id || session.metadata?.owner_user_id,
    event_type: "credit_topup_completed",
    channel: "billing",
    source_page: "/dashboard/top-up",
    credits_used: 0,
    event_count: 1,
    status: "success",
    metadata: {
      type: "credit_topup",
      topup_id: topupId,
      checkout_session_id: session.id,
      payment_intent_id: paymentIntentId,
      customer_id: customerId,
      package_id: session.metadata?.package_id || null,
      credits_added: result?.credits_added || 0,
      already_processed: Boolean(result?.already_processed),
    },
  });

  console.log("Kolkap credit top-up completed from Stripe checkout.", {
    sessionId: session.id,
    topupId,
    workspaceId: result?.workspace_id || workspaceId,
    creditsAdded: result?.credits_added || 0,
    alreadyProcessed: Boolean(result?.already_processed),
  });
}

async function markCreditTopupCancelledFromCheckout(
  session: Stripe.Checkout.Session
) {
  const supabase = getAdminSupabase();

  const topupId = session.metadata?.topup_id || null;

  if (!topupId) {
    console.log(
      "Stripe credit top-up cancellation skipped. Missing topup_id.",
      {
        sessionId: session.id,
        metadata: session.metadata,
      }
    );

    return;
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("workspace_credit_topups")
    .update({
      status: "cancelled",
      cancelled_at: now,
      updated_at: now,
    })
    .eq("id", topupId)
    .neq("status", "paid");

  if (error) {
    throw error;
  }

  console.log("Kolkap credit top-up checkout expired/cancelled.", {
    sessionId: session.id,
    topupId,
  });
}

async function activateWorkspaceFromCheckout(
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription | null
) {
  const supabase = getAdminSupabase();

  const workspaceId = session.metadata?.workspace_id || null;
  const metadataPlanKey = normalizePlanKey(session.metadata?.plan_key);
  const subscriptionId = getStringId(session.subscription);
  const customerId = getStringId(session.customer);
  const subscriptionPriceId = getSubscriptionPriceId(subscription);
  const planKey = metadataPlanKey || getPlanKeyFromPriceId(subscriptionPriceId);

  if (!workspaceId || !planKey) {
    console.log("Stripe checkout skipped. Missing workspace or plan.", {
      sessionId: session.id,
      workspaceId,
      planKey,
      subscriptionPriceId,
      metadata: session.metadata,
    });

    return;
  }

  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace?.id || !workspace.owner_user_id) {
    console.log("Stripe checkout skipped. Workspace not found.", {
      sessionId: session.id,
      workspaceId,
    });

    return;
  }

  const plan = getKolkapPlan(planKey);
  const planCredits =
    typeof plan.monthlyCredits === "number" ? plan.monthlyCredits : 0;

  const now = new Date().toISOString();
  const stripeStatus = subscription?.status || "trialing";
  const planStatus = getPlanStatusFromStripeStatus(stripeStatus);
  const trialStartedAt = dateFromUnix(
    isRecord(subscription) ? getNumber(subscription.trial_start) : null
  );
  const trialEndsAt = dateFromUnix(
    isRecord(subscription) ? getNumber(subscription.trial_end) : null
  );

  const currentPeriodStart = getCurrentPeriodStart(subscription);
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  const { error: updateError } = await supabase
    .from("business_workspaces")
    .update({
      plan_key: planKey,
      plan_status: planStatus,
      credits_total: planCredits,
      credits_used: 0,

      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: subscriptionPriceId,
      stripe_checkout_session_id: session.id,

      billing_status: stripeStatus,
      billing_current_period_start: dateFromUnix(currentPeriodStart),
      billing_current_period_end: dateFromUnix(currentPeriodEnd),

      trial_started_at: trialStartedAt || now,
      trial_ends_at: trialEndsAt || getFallbackTrialEnd(),
      trial_activated_at: now,
      subscription_updated_at: now,
      updated_at: now,
    })
    .eq("id", workspace.id);

  if (updateError) {
    throw updateError;
  }

  await syncWorkspaceCreditBalance({
    workspaceId: workspace.id,
    ownerUserId: workspace.owner_user_id,
    planKey,
    resetUsedCredits: true,
    billingPeriodStart: dateFromUnix(currentPeriodStart),
    billingPeriodEnd: dateFromUnix(currentPeriodEnd),
  });

  console.log("Kolkap trial activated from Stripe checkout.", {
    workspaceId: workspace.id,
    planKey,
    stripeStatus,
    sessionId: session.id,
  });
}

async function updateWorkspaceFromSubscription(
  subscription: Stripe.Subscription
) {
  const supabase = getAdminSupabase();

  const subscriptionId = subscription.id;
  const workspaceIdFromMetadata = subscription.metadata?.workspace_id || null;
  const priceId = getSubscriptionPriceId(subscription);
  const planKey =
    normalizePlanKey(subscription.metadata?.plan_key) ||
    getPlanKeyFromPriceId(priceId);

  let workspace: WorkspaceRow | null = null;

  if (workspaceIdFromMetadata) {
    workspace = await findWorkspaceById(workspaceIdFromMetadata);
  }

  if (!workspace) {
    workspace = await findWorkspaceBySubscriptionId(subscriptionId);
  }

  if (!workspace?.id) {
    console.log("Stripe subscription skipped. Workspace not found.", {
      subscriptionId,
      workspaceIdFromMetadata,
      metadata: subscription.metadata,
    });

    return;
  }

  const now = new Date().toISOString();
  const stripeStatus = subscription.status;
  const planStatus = getPlanStatusFromStripeStatus(stripeStatus);
  const currentPeriodStart = getCurrentPeriodStart(subscription);
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);
  const cancelAt = getSubscriptionCancelAt(subscription);
  const cancelledAt = getSubscriptionCancelledAt(subscription);

  const updatePayload: Record<string, unknown> = {
    plan_status: planStatus,
    billing_status: stripeStatus,
    stripe_customer_id: getStringId(subscription.customer),
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    billing_current_period_start: dateFromUnix(currentPeriodStart),
    billing_current_period_end: dateFromUnix(currentPeriodEnd),
    subscription_cancel_at: dateFromUnix(cancelAt),
    subscription_cancelled_at: dateFromUnix(cancelledAt),
    subscription_updated_at: now,
    updated_at: now,
  };

  if (planKey) {
    const plan = getKolkapPlan(planKey);
    const planCredits =
      typeof plan.monthlyCredits === "number" ? plan.monthlyCredits : 0;

    updatePayload.plan_key = planKey;
    updatePayload.credits_total = planCredits;
  }

  const { error: updateError } = await supabase
    .from("business_workspaces")
    .update(updatePayload)
    .eq("id", workspace.id);

  if (updateError) {
    throw updateError;
  }

  if (planKey && workspace.owner_user_id) {
    await syncWorkspaceCreditBalance({
      workspaceId: workspace.id,
      ownerUserId: workspace.owner_user_id,
      planKey,
    });
  }

  console.log("Kolkap workspace updated from Stripe subscription.", {
    workspaceId: workspace.id,
    subscriptionId,
    stripeStatus,
    planKey,
  });
}

async function updateWorkspaceFromInvoice(
  invoice: Stripe.Invoice,
  nextStatus: "active" | "past_due"
) {
  const supabase = getAdminSupabase();

  const subscriptionId = isRecord(invoice)
    ? getStringId(invoice.subscription)
    : null;

  if (!subscriptionId) {
    console.log("Stripe invoice skipped. Subscription missing.", {
      invoiceId: invoice.id,
    });

    return;
  }

  const workspace = await findWorkspaceBySubscriptionId(subscriptionId);

  if (!workspace?.id) {
    console.log("Stripe invoice skipped. Workspace not found.", {
      invoiceId: invoice.id,
      subscriptionId,
    });

    return;
  }

  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    plan_status: nextStatus,
    billing_status: nextStatus,
    subscription_updated_at: now,
    updated_at: now,
  };

  if (nextStatus === "active") {
    updatePayload.billing_started_at = now;
  }

  const { error: updateError } = await supabase
    .from("business_workspaces")
    .update(updatePayload)
    .eq("id", workspace.id);

  if (updateError) {
    throw updateError;
  }

  if (
    nextStatus === "active" &&
    invoice.billing_reason === "subscription_cycle"
  ) {
    const subscription = await getStripe().subscriptions.retrieve(
      subscriptionId
    );
    const invoiceLine = getInvoiceSubscriptionLine(invoice);
    const invoiceLinePeriod = getInvoiceLinePeriod(invoiceLine);
    const priceId =
      getInvoicePriceId(invoiceLine) || getSubscriptionPriceId(subscription);
    const planKey =
      getPlanKeyFromPriceId(priceId) ||
      normalizePlanKey(subscription.metadata?.plan_key);
    const billingPeriodStart = dateFromUnix(
      invoiceLinePeriod.start || invoice.period_start
    );
    const billingPeriodEnd = dateFromUnix(
      invoiceLinePeriod.end || invoice.period_end
    );

    if (!planKey || !billingPeriodStart || !billingPeriodEnd) {
      console.log("Stripe renewal credits skipped. Plan or period missing.", {
        workspaceId: workspace.id,
        invoiceId: invoice.id,
        subscriptionId,
        planKey,
        priceId,
        billingPeriodStart,
        billingPeriodEnd,
      });
    } else {
      const plan = getKolkapPlan(planKey);
      const planCredits =
        typeof plan.monthlyCredits === "number" ? plan.monthlyCredits : 0;

      const { data, error } = await supabase.rpc(
        "renew_workspace_plan_credits",
        {
          p_workspace_id: workspace.id,
          p_stripe_invoice_id: invoice.id,
          p_plan_name: plan.name,
          p_plan_credits: planCredits,
          p_billing_period_start: billingPeriodStart,
          p_billing_period_end: billingPeriodEnd,
        }
      );

      if (error) {
        throw error;
      }

      const renewalRows = (data ?? []) as CreditRenewalResultRow[];
      const renewal = renewalRows[0];

      if (renewal && !renewal.already_processed) {
        const { error: usageError } = await supabase
          .from("workspace_usage_events")
          .insert({
            workspace_id: workspace.id,
            owner_user_id: workspace.owner_user_id,
            user_id: workspace.owner_user_id,
            event_type: "subscription_credits_renewed",
            channel: "billing",
            source_page: "/api/stripe/webhook",
            credits_used: 0,
            event_count: 1,
            status: "success",
            metadata: {
              type: "subscription_credit_renewal",
              invoice_id: invoice.id,
              subscription_id: subscriptionId,
              plan_key: planKey,
              credits_added: renewal.credits_added,
              credits_left: renewal.credits_left,
              billing_period_start: billingPeriodStart,
              billing_period_end: billingPeriodEnd,
            },
          });

        if (usageError) {
          console.error(
            "Subscription credit renewal usage log failed.",
            usageError.message
          );
        }
      }

      console.log("Kolkap subscription credits renewed from Stripe invoice.", {
        workspaceId: workspace.id,
        invoiceId: invoice.id,
        subscriptionId,
        planKey,
        creditsAdded: renewal?.credits_added || 0,
        creditsLeft: renewal?.credits_left ?? null,
        alreadyProcessed: Boolean(renewal?.already_processed),
      });
    }
  }

  console.log("Kolkap workspace updated from Stripe invoice.", {
    workspaceId: workspace.id,
    invoiceId: invoice.id,
    subscriptionId,
    nextStatus,
  });
}

export async function POST(request: Request) {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();

    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      stripeWebhookSecret
    );
  } catch (error) {
    console.error(
      "Stripe webhook verification failed.",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Stripe webhook verification failed." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (isCreditTopupCheckout(session)) {
          await completeCreditTopupFromCheckout(session);
          break;
        }

        const subscriptionId = getStringId(session.subscription);

        const subscription = subscriptionId
          ? await getStripe().subscriptions.retrieve(subscriptionId)
          : null;

        await activateWorkspaceFromCheckout(session, subscription);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (isCreditTopupCheckout(session)) {
          await markCreditTopupCancelledFromCheckout(session);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await updateWorkspaceFromSubscription(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;

        await updateWorkspaceFromInvoice(invoice, "active");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        await updateWorkspaceFromInvoice(invoice, "past_due");
        break;
      }

      default: {
        console.log("Stripe webhook event received but not handled.", {
          type: event.type,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "Stripe webhook handler failed.",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Stripe webhook handler failed." },
      { status: 500 }
    );
  }
}
