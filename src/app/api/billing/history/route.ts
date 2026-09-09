import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WorkspaceBillingRow = {
  id: string;
  owner_user_id: string;
  stripe_customer_id: string | null;
};

type CreditTopupRow = {
  id: string;
  credits: number;
  amount_cents: number;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
  paid_at: string | null;
};

type BillingHistoryItem = {
  id: string;
  type: "subscription" | "topup";
  description: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string;
  document_url: string | null;
  document_label: "View Invoice" | "View Receipt";
};

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

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function dateFromUnix(timestamp: number) {
  return new Date(timestamp * 1000).toISOString();
}

function getInvoiceDescription(invoice: Stripe.Invoice) {
  const firstDescription = invoice.lines.data.find((line) => line.description)
    ?.description;

  return firstDescription || "Kolkap subscription";
}

async function getTopupReceiptUrl(
  stripe: Stripe,
  paymentIntentId: string | null
) {
  if (!paymentIntentId) return null;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const charge = paymentIntent.latest_charge;

    if (!charge || typeof charge === "string") return null;

    return charge.receipt_url || null;
  } catch (error) {
    console.error(
      "Billing receipt lookup failed.",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Please log in to view billing history." },
        { status: 401 }
      );
    }

    const requestedWorkspaceId = request.nextUrl.searchParams
      .get("workspace_id")
      ?.trim();

    if (!requestedWorkspaceId) {
      return NextResponse.json(
        { error: "Workspace is required." },
        { status: 400 }
      );
    }

    const admin = getAdminSupabase();
    const { data: workspace, error: workspaceError } = await admin
      .from("business_workspaces")
      .select("id, owner_user_id, stripe_customer_id")
      .eq("id", requestedWorkspaceId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (workspaceError) throw workspaceError;

    const billingWorkspace = workspace as WorkspaceBillingRow | null;

    if (!billingWorkspace?.id) {
      return NextResponse.json(
        { error: "Billing history is available to the workspace owner." },
        { status: 403 }
      );
    }

    const { data: topupData, error: topupError } = await admin
      .from("workspace_credit_topups")
      .select(
        "id, credits, amount_cents, currency, status, stripe_payment_intent_id, created_at, paid_at"
      )
      .eq("workspace_id", billingWorkspace.id)
      .eq("owner_user_id", user.id)
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(20);

    if (topupError) throw topupError;

    const stripe = getStripe();
    const topups = (topupData ?? []) as CreditTopupRow[];

    const [invoiceResult, topupItems] = await Promise.all([
      billingWorkspace.stripe_customer_id
        ? stripe.invoices.list({
            customer: billingWorkspace.stripe_customer_id,
            limit: 20,
          })
        : Promise.resolve(null),
      Promise.all(
        topups.map(async (topup): Promise<BillingHistoryItem> => ({
          id: topup.id,
          type: "topup",
          description: `${Number(topup.credits || 0).toLocaleString()} credit top-up`,
          amount_cents: Number(topup.amount_cents || 0),
          currency: String(topup.currency || "aud").toLowerCase(),
          status: "paid",
          paid_at: topup.paid_at || topup.created_at,
          document_url: await getTopupReceiptUrl(
            stripe,
            topup.stripe_payment_intent_id
          ),
          document_label: "View Receipt",
        }))
      ),
    ]);

    const invoiceItems: BillingHistoryItem[] = (invoiceResult?.data ?? [])
      .filter(
        (invoice) =>
          Number(invoice.amount_paid || 0) > 0 ||
          Number(invoice.amount_due || 0) > 0
      )
      .map((invoice) => ({
        id: invoice.id,
        type: "subscription",
        description: getInvoiceDescription(invoice),
        amount_cents:
          Number(invoice.amount_paid || 0) || Number(invoice.amount_due || 0),
        currency: String(invoice.currency || "aud").toLowerCase(),
        status: String(invoice.status || "pending"),
        paid_at: dateFromUnix(invoice.created),
        document_url: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
        document_label: "View Invoice",
      }));

    const items = [...invoiceItems, ...topupItems]
      .sort(
        (first, second) =>
          new Date(second.paid_at).getTime() -
          new Date(first.paid_at).getTime()
      )
      .slice(0, 20);

    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Billing history failed.",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Billing history could not be loaded right now." },
      { status: 500 }
    );
  }
}
