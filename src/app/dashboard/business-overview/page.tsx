"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Crown,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const statusLabels: Record<string, string> = {
  trial: "Trial",
  active: "Active",
  past_due: "Past Due",
  cancelled: "Cancelled",
  not_connected: "Not connected",
  connected: "Connected",
  pending: "Pending",
  draft: "Draft",
  testing: "Testing",
  live: "Live",
};

function statusLabel(value: string | null | undefined) {
  if (!value) return "Not provided yet";

  return statusLabels[value] || value;
}

export default function BusinessOverviewPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your business overview...
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
            <p className="text-xl font-black">
              Business Overview could not load.
            </p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const valueOrFallback = (value?: string | null) =>
    value && value.trim() ? value : "Not provided yet";

  const summaryCards = [
    {
      label: "Current Plan",
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: "Credits",
      value: `${workspaceState.creditsRemaining}/${workspaceState.creditsTotal}`,
      note: getPlanCreditLabel(currentPlan),
      icon: Sparkles,
    },
    {
      label: "AI Staff Limit",
      value: getPlanAIStaffLabel(currentPlan),
      note: "Included in your plan",
      icon: Bot,
    },
    {
      label: "Go Live Status",
      value: statusLabel(workspaceState.goLiveStatus),
      note: "Workspace readiness",
      icon: ShieldCheck,
    },
  ];

  const businessAccount = [
    {
      label: "Business Name",
      value: valueOrFallback(workspace?.business_name),
      icon: Building2,
    },
    {
      label: "Business Email",
      value: valueOrFallback(workspace?.business_email),
      icon: Mail,
    },
    {
      label: "Account Role",
      value: "Owner",
      icon: Crown,
    },
  ];

  const businessDetails = [
    {
      label: "Business Name",
      value: valueOrFallback(workspace?.business_name),
      icon: Building2,
    },
    {
      label: "Business Type",
      value: valueOrFallback(workspace?.business_type),
      icon: Sparkles,
    },
    {
      label: "Business Email",
      value: valueOrFallback(workspace?.business_email),
      icon: Mail,
    },
    {
      label: "Business Phone",
      value: valueOrFallback(workspace?.business_phone),
      icon: Phone,
    },
    {
      label: "WhatsApp Number",
      value: valueOrFallback(workspace?.whatsapp_number),
      icon: MessageCircle,
    },
    {
      label: "Business Address",
      value: valueOrFallback(workspace?.business_address),
      icon: MapPin,
    },
    {
      label: "Country",
      value: valueOrFallback(workspace?.country),
      icon: Globe2,
    },
    {
      label: "Timezone",
      value: valueOrFallback(workspace?.timezone),
      icon: Globe2,
    },
  ];

  const workspaceDetails = [
    {
      label: "Plan Status",
      value: statusLabel(workspaceState.status),
    },
    {
      label: "Trial Days Left",
      value: `${workspaceState.trialDaysRemaining}`,
    },
    {
      label: "WhatsApp Status",
      value: statusLabel(workspaceState.whatsappStatus),
    },
    {
      label: "Go Live Status",
      value: statusLabel(workspaceState.goLiveStatus),
    },
    {
      label: "Credits",
      value: `${workspaceState.creditsRemaining}/${workspaceState.creditsTotal}`,
    },
    {
      label: "AI Staff Limit",
      value: getPlanAIStaffLabel(currentPlan),
    },
  ];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <Link
            href="/dashboard"
            className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Business Overview
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Review your business profile and workspace setup.
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            This page shows the business account connected to your Kolkap
            workspace, including your plan, credits, AI staff limit, channel
            status, and go-live progress.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>

                <p className="text-lg font-black text-slate-500">
                  {card.label}
                </p>

                <p className="mt-2 text-2xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>

                <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#7CFF3D] text-[#07111F]">
              <UserRound className="h-10 w-10" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              Business Account
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              The main business identity connected to this Kolkap workspace.
            </h2>

            <div className="mt-8 grid gap-4">
              {businessAccount.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                        <Icon className="h-6 w-6" />
                      </div>

                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-2 text-xl font-black">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Building2 className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Business Profile
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              These details help Kolkap understand your business and prepare
              your AI staff setup.
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {businessDetails.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                        <Icon className="h-6 w-6" />
                      </div>

                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-2 text-lg font-black">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Workspace Setup
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              Your plan, credits, AI staff limit, channel status, and go-live
              progress in one place.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceDetails.map((item) => (
              <div
                key={item.label}
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
              >
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </p>

                <p className="mt-3 text-3xl font-black tracking-[-0.04em]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2.2rem] border border-blue-100 bg-blue-50 p-7 shadow-sm shadow-blue-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
              Business Summary
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] text-blue-950">
              Kolkap uses your business profile, AI staff setup, business
              knowledge, channels, credits, and workspace status to help your
              team reply faster and manage customer conversations more clearly.
            </h2>
          </section>

          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <WalletCards className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {currentPlan.name}
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
              {currentPlan.priceLabel} • {getPlanCreditLabel(currentPlan)}
            </h2>

            <div className="mt-8 grid gap-4">
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F]"
              >
                Edit Business Details
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/create-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                Create AI Staff
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/knowledge-base"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                Add Business Knowledge
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/integrations"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                Connect Channels
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/billing"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                Open Billing
                <ArrowRight className="h-6 w-6" />
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}