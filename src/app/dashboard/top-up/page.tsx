"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  kolkapTopUpPackages,
  KOLKAP_PRICE_NOTE,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type CreditBalanceRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  plan_name: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  billing_period_start: string | null;
  billing_period_end: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const usageRules = [
  "Website Chat AI reply starts from 3 credits.",
  "Inbox AI suggestion starts from 3 credits.",
  "Test AI reply starts from 3 credits.",
  "WhatsApp AI reply starts from 5 credits.",
  "Manual WhatsApp reply through Kolkap starts from 3 credits.",
  "Longer replies, long content, and campaign packs may use more credits.",
];

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

function formatCredits(amount: number) {
  return `${amount.toLocaleString()} credits`;
}

export default function TopUpPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");

  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [startingPackageId, setStartingPackageId] = useState("");

  const creditsLeft = getCreditsLeft(creditBalance);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const usedCredits = Number(creditBalance?.used_credits || 0);
  const totalCredits = planCredits + purchasedCredits;

  const creditUsagePercent =
    totalCredits > 0
      ? Math.min(100, Math.round((usedCredits / totalCredits) * 100))
      : 0;

  async function loadCreditBalance() {
    if (!workspace?.id) return;

    setIsLoadingCredits(true);
    setCreditError("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("workspace_credit_balances")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (error) {
      setCreditError(error.message);
      setIsLoadingCredits(false);
      return;
    }

    setCreditBalance((data ?? null) as CreditBalanceRow | null);
    setIsLoadingCredits(false);
  }

  async function startTopUpCheckout(packageId: string) {
    setCheckoutMessage("");
    setCheckoutError("");
    setStartingPackageId(packageId);

    try {
      const response = await fetch("/api/billing/start-top-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_id: packageId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setCheckoutError(result.error || "Top-up checkout could not be started.");
        setStartingPackageId("");
        return;
      }

      if (!result.checkout_url) {
        setCheckoutError("Stripe checkout URL was not returned.");
        setStartingPackageId("");
        return;
      }

      window.location.href = result.checkout_url;
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Top-up checkout could not be started."
      );
      setStartingPackageId("");
    }
  }

  useEffect(() => {
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const topupStatus = params.get("topup");

    if (topupStatus === "success") {
      setCheckoutMessage(
        "Payment successful. Credits will appear after Stripe confirms the payment through the webhook. Refresh this page if the balance has not updated yet."
      );
      window.setTimeout(() => {
        loadCreditBalance();
      }, 2500);
    }

    if (topupStatus === "cancelled") {
      setCheckoutError("Top-up checkout was cancelled. No credits were added.");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your credit balance...
          </div>
        </section>
      </main>
    );
  }

  if (workspaceState.error) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] border border-red-200 bg-red-50 p-8 text-red-700">
            <p className="text-xl font-black">Top-up page could not load.</p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const summaryCards = [
    {
      label: "Current Plan",
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: "Credits Left",
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `${usedCredits.toLocaleString()} credits used`
        : "Credit balance has not been created for this workspace yet.",
      icon: Zap,
      dark: true,
    },
    {
      label: "Plan Credits",
      value: planCredits.toLocaleString(),
      note: getPlanCreditLabel(currentPlan),
      icon: Sparkles,
    },
    {
      label: "Top-Up Credits",
      value: purchasedCredits.toLocaleString(),
      note: "Extra credits purchased for this workspace",
      icon: CreditCard,
    },
    {
      label: "AI Staff Limit",
      value: getPlanAIStaffLabel(currentPlan),
      note: currentPlan.name,
      icon: Bot,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={loadCreditBalance}
              disabled={isLoadingCredits}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCcw className="h-5 w-5" />
              {isLoadingCredits ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Top Up Credits
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Add more AI credits when your business needs them.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Keep your AI ready for customer replies, Website Chat, WhatsApp
            replies, Inbox support, content generation, and campaign work.
          </p>

          <p className="mt-5 text-base font-bold leading-7 text-slate-400">
            Top-up prices are in AUD and include GST.
          </p>
        </div>

        {checkoutMessage ? (
          <div className="mb-8 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
            <p className="flex items-center gap-3 text-base font-black">
              <CheckCircle2 className="h-5 w-5" />
              {checkoutMessage}
            </p>
          </div>
        ) : null}

        {checkoutError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{checkoutError}</p>
          </div>
        ) : null}

        {creditError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{creditError}</p>
          </div>
        ) : null}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
                  card.dark
                    ? "border-[#7CFF3D] bg-[#07111F] text-white"
                    : "border-slate-200 bg-white text-[#07111F]"
                }`}
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    card.dark
                      ? "bg-[#7CFF3D] text-[#07111F]"
                      : "bg-[#07111F] text-[#7CFF3D]"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <p
                  className={`text-lg font-black ${
                    card.dark ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>

                <p
                  className={`mt-2 text-base font-semibold leading-7 ${
                    card.dark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <WalletCards className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Credit Balance
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Your monthly plan credits and purchased top-up credits are
                connected to your Kolkap workspace.
              </h2>

              <p className="mt-4 text-base font-bold leading-7 text-slate-600">
                {KOLKAP_PRICE_NOTE}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#07111F] p-7 text-white">
              <div className="mb-3 flex items-center justify-between gap-4 text-base font-black text-slate-300">
                <span>Credits Used</span>
                <span>
                  {usedCredits.toLocaleString()}/{totalCredits.toLocaleString()}
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#7CFF3D]"
                  style={{ width: `${creditUsagePercent}%` }}
                />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                    Credits Left
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#7CFF3D]">
                    {creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                    Current Plan
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.06em]">
                    {currentPlan.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Top-Up Packages
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              Choose extra credits when your business needs more AI replies,
              WhatsApp replies, content, or campaign support before the next
              billing cycle.
            </h2>

            <p className="mt-4 text-base font-bold leading-7 text-slate-600">
              Top-up prices are in AUD and include GST.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {kolkapTopUpPackages.map((pack) => {
              const isBestValue = pack.id === "topup_500";
              const isStarting = startingPackageId === pack.id;

              return (
                <div
                  key={pack.id}
                  className={`rounded-[2rem] border p-6 ${
                    isBestValue
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-[#F7F9FA] text-[#07111F]"
                  }`}
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isBestValue
                        ? "bg-[#7CFF3D] text-[#07111F]"
                        : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Zap className="h-7 w-7" />
                  </div>

                  {isBestValue ? (
                    <div className="mb-4 inline-flex rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                      Best Value
                    </div>
                  ) : null}

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    A${pack.priceAud}
                  </h3>

                  <p
                    className={`mt-2 text-sm font-black ${
                      isBestValue ? "text-[#7CFF3D]" : "text-blue-600"
                    }`}
                  >
                    Incl. GST
                  </p>

                  <p
                    className={`mt-3 text-2xl font-black ${
                      isBestValue ? "text-[#7CFF3D]" : "text-blue-600"
                    }`}
                  >
                    {formatCredits(pack.credits)}
                  </p>

                  <p
                    className={`mt-4 text-base font-semibold leading-7 ${
                      isBestValue ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Extra credits added on top of your monthly plan credits after
                    successful Stripe payment.
                  </p>

                  <button
                    type="button"
                    onClick={() => startTopUpCheckout(pack.id)}
                    disabled={Boolean(startingPackageId)}
                    className={`mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-lg font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isBestValue
                        ? "bg-[#7CFF3D] text-[#07111F]"
                        : "bg-[#07111F] text-white"
                    }`}
                  >
                    {isStarting ? "Opening Stripe..." : "Buy Credits"}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Sparkles className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              How Credits Work
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              Credits are used whenever Kolkap generates or sends AI-powered
              output for your business.
            </h2>

            <div className="mt-7 grid gap-3">
              {usageRules.map((rule) => (
                <div
                  key={rule}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{rule}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CreditCard className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              Secure Checkout
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
              Top-up checkout is handled through Stripe. Credits are only added
              after Stripe confirms successful payment through the webhook.
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/usage"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F]"
              >
                <ShieldCheck className="h-6 w-6" />
                View Usage
              </Link>

              <Link
                href="/dashboard/billing"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                <WalletCards className="h-6 w-6" />
                Open Billing
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}