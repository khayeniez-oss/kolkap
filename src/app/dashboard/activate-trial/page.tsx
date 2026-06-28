"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  getPlanTeamMemberLabel,
  KOLKAP_PRICE_NOTE,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";

const planKeys: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
];

function isValidPlanKey(value: string | null): value is KolkapPlanKey {
  return Boolean(value && planKeys.includes(value as KolkapPlanKey));
}

function getPlanPriceLine(planKey: KolkapPlanKey) {
  const plan = getKolkapPlan(planKey);

  if (plan.monthlyPriceAud === null) {
    return "Custom pricing";
  }

  return `A$${plan.monthlyPriceAud}/month incl. GST`;
}

function ActivateTrialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedPlan = searchParams.get("plan");
  const initialPlanKey = isValidPlanKey(requestedPlan)
    ? requestedPlan
    : "starter";

  const [selectedPlanKey, setSelectedPlanKey] =
    useState<KolkapPlanKey>(initialPlanKey);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [setupError, setSetupError] = useState("");

  const selectedPlan = useMemo(
    () => getKolkapPlan(selectedPlanKey),
    [selectedPlanKey]
  );

  const isEnterprise = selectedPlan.key === "enterprise";

  async function handleStartTrial() {
    setSetupError("");

    if (isEnterprise) {
      router.push("/contact");
      return;
    }

    try {
      setIsStartingTrial(true);

      const response = await fetch("/api/billing/start-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planKey: selectedPlan.key,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.url) {
        throw new Error(
          result.error ||
            "Please try again. If this keeps happening, contact Kolkap support."
        );
      }

      window.location.href = result.url;
    } catch (error) {
      setSetupError(
        error instanceof Error
          ? error.message
          : "Please try again. If this keeps happening, contact Kolkap support."
      );
      setIsStartingTrial(false);
    }
  }

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Activate Trial
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Start your 7-day free trial.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Add a payment method to activate your trial. You will not be charged
            today. Monthly billing starts automatically after your trial unless
            cancelled before the trial ends.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <TrialPill text="No charge today" />
            <TrialPill text="Payment method needed" />
            <TrialPill text="Cancel before trial ends" />
            <TrialPill text="AUD pricing incl. GST" />
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <WalletCards className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Select Your Trial Plan
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Choose the AI staff plan you want to start with. You can upgrade
                later as your business grows.
              </h2>

              <p className="mt-4 text-base font-bold leading-7 text-slate-600">
                {KOLKAP_PRICE_NOTE}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {planKeys.map((planKey) => {
                const plan = getKolkapPlan(planKey);
                const selected = selectedPlanKey === plan.key;

                return (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => {
                      setSelectedPlanKey(plan.key);
                      setSetupError("");
                    }}
                    className={`rounded-[2rem] border p-6 text-left transition hover:-translate-y-1 ${
                      selected
                        ? "border-[#07111F] bg-[#07111F] text-white shadow-xl shadow-slate-900/15"
                        : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:bg-white"
                    }`}
                  >
                    <div
                      className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                        selected
                          ? "bg-[#7CFF3D] text-[#07111F]"
                          : "bg-[#07111F] text-[#7CFF3D]"
                      }`}
                    >
                      <Bot className="h-7 w-7" />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-3xl font-black tracking-[-0.04em]">
                          {plan.name}
                        </h3>

                        <p
                          className={`mt-2 text-2xl font-black ${
                            selected ? "text-[#7CFF3D]" : "text-blue-600"
                          }`}
                        >
                          {getPlanPriceLine(plan.key)}
                        </p>
                      </div>

                      {selected ? (
                        <CheckCircle2 className="h-7 w-7 shrink-0 text-[#7CFF3D]" />
                      ) : null}
                    </div>

                    <p
                      className={`mt-4 text-base font-semibold leading-7 ${
                        selected ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {plan.description}
                    </p>

                    <div className="mt-6 grid gap-3">
                      <FeatureLine
                        selected={selected}
                        text={getPlanCreditLabel(plan)}
                      />
                      <FeatureLine
                        selected={selected}
                        text={getPlanAIStaffLabel(plan)}
                      />
                      <FeatureLine
                        selected={selected}
                        text={getPlanTeamMemberLabel(plan)}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-8">
            <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                <CreditCard className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Selected Plan
              </p>

              <h2 className="mt-3 text-5xl font-black tracking-[-0.06em]">
                {selectedPlan.name}
              </h2>

              <p className="mt-3 text-3xl font-black text-[#7CFF3D]">
                {getPlanPriceLine(selectedPlan.key)}
              </p>

              <p className="mt-5 text-lg font-semibold leading-8 text-slate-300">
                {selectedPlan.description}
              </p>

              <div className="mt-7 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                <SummaryRow
                  label="Credits included"
                  value={getPlanCreditLabel(selectedPlan)}
                />
                <SummaryRow
                  label="AI staff included"
                  value={getPlanAIStaffLabel(selectedPlan)}
                />
                <SummaryRow
                  label="Team access included"
                  value={getPlanTeamMemberLabel(selectedPlan)}
                />
              </div>

              {isEnterprise ? (
                <p className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-base font-black leading-7 text-amber-800">
                  Enterprise requires a custom setup. Contact us instead of
                  starting automatic trial activation.
                </p>
              ) : null}

              {setupError ? (
                <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-900">
                  <p className="text-base font-black">
                    Trial setup could not start
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6">
                    {setupError}
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleStartTrial}
                disabled={isStartingTrial}
                className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isEnterprise
                  ? "Contact Us"
                  : isStartingTrial
                    ? "Opening secure trial setup..."
                    : "Activate Free Trial — No Charge Today"}
                <ArrowRight className="h-6 w-6" />
              </button>

              <p className="mt-4 text-center text-sm font-bold leading-6 text-slate-400">
                {isEnterprise
                  ? "Enterprise requires a custom setup."
                  : "Secure trial setup"}
              </p>
            </div>

            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <CalendarDays className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                7-Day Free Trial
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Payment method needed to activate your trial. You will not be
                charged today.
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                Monthly billing starts automatically after your trial unless
                cancelled before the trial ends.
              </p>

              <div className="mt-7 grid gap-3">
                {[
                  "Select your trial plan",
                  "Add payment method",
                  "No charge today",
                  "Use Kolkap for 7 days",
                  "Monthly billing starts after trial unless cancelled",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-base font-black text-[#7CFF3D]">
                      {index + 1}
                    </span>

                    <p className="text-lg font-black leading-7">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-blue-100 bg-blue-50 p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
                Secure trial setup
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-blue-950">
                Kolkap will open a secure payment-method step. Once your payment
                method is confirmed, your trial and credits will be activated
                automatically.
              </h2>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function TrialPill({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
      {text}
    </span>
  );
}

function FeatureLine({
  selected,
  text,
}: {
  selected: boolean;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2
        className={`mt-1 h-5 w-5 shrink-0 ${
          selected ? "text-[#7CFF3D]" : "text-[#07111F]"
        }`}
      />

      <span className="text-base font-black leading-7">{text}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-black text-slate-300">{label}</span>
      <span className="text-base font-black text-white">{value}</span>
    </div>
  );
}

export default function ActivateTrialPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
          <div className="mx-auto max-w-7xl rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading trial activation...
          </div>
        </main>
      }
    >
      <ActivateTrialContent />
    </Suspense>
  );
}