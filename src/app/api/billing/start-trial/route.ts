import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ensureKolkapWorkspace } from "@/lib/kolkapWorkspace";
import { getKolkapPlan, type KolkapPlanKey } from "@/lib/kolkapPlan";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BillablePlanKey = Extract<
  KolkapPlanKey,
  "starter" | "growth" | "professional" | "business"
>;

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(stripeSecretKey);
}

function normalizePlanKey(value: unknown): BillablePlanKey {
  if (
    value === "starter" ||
    value === "growth" ||
    value === "professional" ||
    value === "business"
  ) {
    return value;
  }

  return "starter";
}

function getPriceId(planKey: BillablePlanKey) {
  const priceMap: Record<BillablePlanKey, string | undefined> = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    growth: process.env.STRIPE_GROWTH_PRICE_ID,
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    business: process.env.STRIPE_BUSINESS_PRICE_ID,
  };

  const priceId = priceMap[planKey];

  if (!priceId) {
    throw new Error(`Missing Stripe price ID for ${planKey}.`);
  }

  return priceId;
}

function getBaseUrl(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    return origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to start your trial." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const planKey = normalizePlanKey(body?.planKey);
    const plan = getKolkapPlan(planKey);
    const priceId = getPriceId(planKey);
    const workspace = await ensureKolkapWorkspace(supabase);

    if (!workspace?.id) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(request);

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_collection: "always",
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: plan.trialDays || 7,
        metadata: {
          workspace_id: workspace.id,
          owner_user_id: user.id,
          plan_key: planKey,
        },
      },
      metadata: {
        workspace_id: workspace.id,
        owner_user_id: user.id,
        plan_key: planKey,
      },
      success_url: `${baseUrl}/dashboard/create-ai?trial=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/activate-trial?trial=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to start trial checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
      planKey,
      planName: plan.name,
    });
  } catch (error) {
    console.error(
      "Start trial checkout failed.",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Unable to start trial right now." },
      { status: 500 }
    );
  }
}