import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import Stripe from "stripe";
import { kolkapTopUpPackages } from "@/lib/kolkapPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function getBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    request.nextUrl.origin
  ).replace(/\/$/, "");
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(stripeSecretKey);
}

async function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const packageId = cleanText(body.package_id);

    if (!packageId) {
      return NextResponse.json(
        { error: "Top-up package is required." },
        { status: 400 }
      );
    }

    const topUpPackage = kolkapTopUpPackages.find(
      (item) => item.id === packageId
    );

    if (!topUpPackage) {
      return NextResponse.json(
        { error: "Top-up package was not found." },
        { status: 404 }
      );
    }

    const supabase = await getSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to buy credits." },
        { status: 401 }
      );
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from("business_workspaces")
      .select(
        "id, owner_user_id, business_name, business_email, stripe_customer_id"
      )
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (workspaceError) {
      throw workspaceError;
    }

    if (!workspace?.id) {
      return NextResponse.json(
        { error: "Business workspace not found." },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl(request);
    const amountCents = Math.round(Number(topUpPackage.priceAud) * 100);

    const { data: topup, error: topupError } = await supabase
      .from("workspace_credit_topups")
      .insert({
        workspace_id: workspace.id,
        owner_user_id: user.id,
        package_id: topUpPackage.id,
        credits: topUpPackage.credits,
        amount_cents: amountCents,
        currency: "aud",
        status: "pending",
        stripe_customer_id: workspace.stripe_customer_id || null,
        metadata: {
          package_id: topUpPackage.id,
          credits: topUpPackage.credits,
          price_aud: topUpPackage.priceAud,
          business_name: workspace.business_name || null,
          source: "dashboard_top_up",
        },
      })
      .select("id")
      .single();

    if (topupError) {
      throw topupError;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: workspace.stripe_customer_id || undefined,
      customer_email: workspace.stripe_customer_id
        ? undefined
        : workspace.business_email || user.email || undefined,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "aud",
            unit_amount: amountCents,
            product_data: {
              name: `Kolkap ${topUpPackage.credits.toLocaleString()} Credits`,
              description:
                "One-time credit top-up for Kolkap AI replies, tests, content, and customer automation.",
              metadata: {
                package_id: topUpPackage.id,
                credits: String(topUpPackage.credits),
              },
            },
          },
        },
      ],
      success_url: `${baseUrl}/dashboard/top-up?topup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/top-up?topup=cancelled`,
      metadata: {
        type: "credit_topup",
        topup_id: topup.id,
        workspace_id: workspace.id,
        owner_user_id: user.id,
        package_id: topUpPackage.id,
        credits: String(topUpPackage.credits),
      },
    });

    const { error: updateError } = await supabase
      .from("workspace_credit_topups")
      .update({
        status: "checkout_created",
        stripe_checkout_session_id: checkoutSession.id,
        stripe_customer_id:
          typeof checkoutSession.customer === "string"
            ? checkoutSession.customer
            : workspace.stripe_customer_id || null,
      })
      .eq("id", topup.id)
      .eq("workspace_id", workspace.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id,
      topup_id: topup.id,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Top-up checkout could not be started.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}