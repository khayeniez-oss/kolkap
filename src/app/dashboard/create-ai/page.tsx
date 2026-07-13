"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  RefreshCcw,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  KOLKAP_AI_STAFF_CREATE_CREDITS,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type AiStaffRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  name: string;
  role: string;
  channel: string;
  reply_language: string | null;
  reply_tone: string | null;
  business_knowledge: string | null;
  ai_instruction: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

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

const channelOptions = [
  "Website Chat",
  "WhatsApp",
  "Inbox / Manual Reply",
  "General Business Support",
];

const replyLanguageOptions = [
  "Auto-detect customer language",
  "English only",
  "Use business preference",
];

const replyToneOptions = [
  "Friendly Professional",
  "Warm",
  "Formal",
  "Direct",
  "Sales-focused",
  "Luxury",
  "Supportive",
  "Casual",
];

const roleOptions = [
  "AI Customer Support Assistant",
  "AI Website Chat Assistant",
  "AI WhatsApp Responder",
  "AI Sales Follow-up Assistant",
  "AI Receptionist",
  "AI Booking Assistant",
  "AI Lead Qualifier",
  "AI Content Assistant",
];

const statusLabels: Record<string, string> = {
  draft: "Draft",
  testing: "Testing",
  live: "Live",
  inactive: "Inactive",
  connected: "Connected",
  not_connected: "Not connected",
  pending: "Pending",
};

function statusLabel(value: string | null | undefined) {
  if (!value) return "Draft";

  return statusLabels[value] || value;
}

function getAIStaffLimit(
  planKey: KolkapPlanKey,
  plan: { aiStaffLimit?: number | "custom" }
): number | "custom" {
  if (typeof plan.aiStaffLimit === "number") return plan.aiStaffLimit;
  if (plan.aiStaffLimit === "custom") return "custom";

  if (planKey === "free_trial") return 1;
  if (planKey === "starter") return 1;
  if (planKey === "growth") return 3;
  if (planKey === "pro") return 5;
  if (planKey === "professional") return 5;
  if (planKey === "business") return 10;

  return "custom";
}

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

function getCreditsTotal(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return (
    Number(balance.plan_credits || 0) + Number(balance.purchased_credits || 0)
  );
}

export default function CreateAIPage() {
  const router = useRouter();

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);
  const aiLimit = getAIStaffLimit(workspaceState.planKey, currentPlan);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [aiListError, setAiListError] = useState("");

  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");

  const [name, setName] = useState("");
  const [role, setRole] = useState(roleOptions[0]);
  const [channel, setChannel] = useState(channelOptions[0]);
  const [replyLanguage, setReplyLanguage] = useState(replyLanguageOptions[0]);
  const [replyTone, setReplyTone] = useState(replyToneOptions[0]);
  const [businessKnowledge, setBusinessKnowledge] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const aiStaffUsed = aiStaffRows.length;
  const hasReachedLimit = aiLimit !== "custom" && aiStaffUsed >= aiLimit;

  const creditsLeft = getCreditsLeft(creditBalance);
  const creditsTotal = getCreditsTotal(creditBalance);
  const creditsUsed = Number(creditBalance?.used_credits || 0);

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

  useEffect(() => {
    if (!workspace) return;

    setReplyLanguage(workspace.ai_reply_language ?? replyLanguageOptions[0]);
    setReplyTone(workspace.ai_reply_tone ?? replyToneOptions[0]);

    setBusinessKnowledge(
      [
        workspace.business_name
          ? `Business name: ${workspace.business_name}`
          : "",
        workspace.business_type
          ? `Business type: ${workspace.business_type}`
          : "",
        workspace.business_email ? `Email: ${workspace.business_email}` : "",
        workspace.business_phone ? `Phone: ${workspace.business_phone}` : "",
        workspace.whatsapp_number
          ? `WhatsApp: ${workspace.whatsapp_number}`
          : "",
        workspace.business_address
          ? `Address: ${workspace.business_address}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );

    setAiInstruction(
      workspace.ai_instruction ??
        "Reply clearly, answer based on business knowledge, collect customer details when useful, and ask the team to take over when the customer needs human support."
    );
  }, [workspace]);

  useEffect(() => {
    let isMounted = true;

    async function loadAIStaff() {
      if (!workspace?.id) {
        setIsLoadingAI(false);
        return;
      }

      setIsLoadingAI(true);
      setAiListError("");

      const supabase = createClient();

      const { data, error } = await supabase
        .from("ai_staff")
        .select("*")
        .eq("workspace_id", workspace.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setAiListError(error.message);
        setIsLoadingAI(false);
        return;
      }

      setAiStaffRows((data ?? []) as AiStaffRow[]);
      setIsLoadingAI(false);
    }

    loadAIStaff();

    return () => {
      isMounted = false;
    };
  }, [workspace]);

  useEffect(() => {
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  async function handleSaveAndTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaveError("");

    if (!workspace) {
      setSaveError("AI staff could not be saved.");
      return;
    }

    if (!name.trim() || !role.trim() || !aiInstruction.trim()) {
      setSaveError("Please add an AI staff name, role, and instruction.");
      return;
    }

    if (hasReachedLimit) {
      setSaveError("Your current plan has reached the AI staff limit.");
      return;
    }

    setIsSaving(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setSaveError("Please log in again before creating AI staff.");
      setIsSaving(false);
      return;
    }

    const response = await fetch("/api/ai-staff/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        workspace_id: workspace.id,
        name: name.trim(),
        role,
        channel,
        reply_language: replyLanguage,
        reply_tone: replyTone,
        business_knowledge: businessKnowledge.trim() || null,
        ai_instruction: aiInstruction.trim(),
        status: "active",
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      setSaveError(result.error || "AI staff could not be created.");
      setIsSaving(false);
      return;
    }

    const savedAiStaff = result.staff as AiStaffRow;

    setAiStaffRows((previous) => [savedAiStaff, ...previous]);
    await loadCreditBalance();

    router.push(`/dashboard/test-ai?ai=${savedAiStaff.id}`);
  }

  const aiLimitValue =
    aiLimit === "custom" ? `${aiStaffUsed}/Custom` : `${aiStaffUsed}/${aiLimit}`;

  const aiLimitNote =
    aiLimit === "custom"
      ? "Custom AI staff limit"
      : getPlanAIStaffLabel(currentPlan);

  const summaryCards = useMemo(
    () => [
      {
        label: "Current Plan",
        value: currentPlan.name,
        note: currentPlan.priceLabel,
        icon: WalletCards,
      },
      {
        label: "AI Staff Usage",
        value: aiLimitValue,
        note: aiLimitNote,
        icon: Bot,
      },
      {
        label: "Credits",
        value:
          creditsLeft === null || creditsTotal === null
            ? "—"
            : `${creditsLeft.toLocaleString()}/${creditsTotal.toLocaleString()}`,
        note: creditBalance
          ? `${creditsUsed.toLocaleString()} credits used`
          : "Credit balance has not been created yet.",
        icon: Zap,
      },
      {
        label: "Go Live Status",
        value: statusLabel(workspaceState.goLiveStatus),
        note: `Channel status: ${statusLabel(workspaceState.whatsappStatus)}`,
        icon: ShieldCheck,
      },
    ],
    [
      currentPlan,
      aiLimitValue,
      aiLimitNote,
      creditsLeft,
      creditsTotal,
      creditsUsed,
      creditBalance,
      workspaceState.goLiveStatus,
      workspaceState.whatsappStatus,
    ]
  );

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your AI staff setup...
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
              Create AI Staff page could not load.
            </p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
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
              {isLoadingCredits ? "Loading credits..." : "Refresh Credits"}
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Create AI Staff
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Create AI staff for customer replies and business support.
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            Set the AI staff name, role, channel, tone, and instructions. After
            saving, you can test how it replies before going live.
          </p>
        </div>

        {creditError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{creditError}</p>
          </div>
        ) : null}

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

                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>

                <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Before you test
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                Give this AI staff clear instructions. Better setup means better
                replies when you test it or connect it to customer
                conversations.
              </h2>

              <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                Saving AI staff does not use credits. Testing AI after saving
                uses 3 credits.
              </p>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-300">
                For full company-wide knowledge, use the Business Knowledge page
                after creating your AI staff.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Bot className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Your AI Staff
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              Manage the AI staff already created for this workspace.
            </h2>

            <div className="mt-8 grid gap-4">
              {isLoadingAI ? (
                <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black">
                  Loading AI staff...
                </div>
              ) : aiListError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-lg font-black text-red-700">
                  {aiListError}
                </div>
              ) : aiStaffRows.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black text-slate-600">
                  No AI staff created yet.
                </div>
              ) : (
                aiStaffRows.map((staff) => (
                  <div
                    key={staff.id}
                    className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                          <Bot className="h-6 w-6" />
                        </div>

                        <div>
                          <p className="text-xl font-black">{staff.name}</p>
                          <p className="mt-1 text-base font-semibold text-slate-500">
                            {staff.role} • {staff.channel}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:items-end">
                        <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]">
                          {statusLabel(staff.status)}
                        </span>

                        <Link
                          href={`/dashboard/test-ai?ai=${staff.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
                        >
                          Test AI
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <UserRound className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              AI Staff Setup
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              Choose what this AI staff should do and how it should reply.
            </h2>

            <form onSubmit={handleSaveAndTest} className="mt-8 grid gap-5">
              {hasReachedLimit ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                  <p className="text-base font-black">
                    Your current plan has reached the AI staff limit.
                  </p>
                </div>
              ) : null}

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  AI staff name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Website Chat Assistant"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <div className="grid gap-5 2xl:grid-cols-2">
                <SelectInput
                  label="AI role"
                  value={role}
                  onChange={setRole}
                  options={roleOptions}
                />
                <SelectInput
                  label="Main channel"
                  value={channel}
                  onChange={setChannel}
                  options={channelOptions}
                />
              </div>

              <div className="grid gap-5 2xl:grid-cols-2">
                <SelectInput
                  label="Reply language"
                  value={replyLanguage}
                  onChange={setReplyLanguage}
                  options={replyLanguageOptions}
                />
                <SelectInput
                  label="Reply tone"
                  value={replyTone}
                  onChange={setReplyTone}
                  options={replyToneOptions}
                />
              </div>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  AI-specific knowledge
                </span>
                <textarea
                  rows={6}
                  value={businessKnowledge}
                  onChange={(event) => setBusinessKnowledge(event.target.value)}
                  placeholder="Add extra details this AI staff should know, such as services, prices, FAQs, opening hours, booking rules, location details, and customer support notes."
                  className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  AI instruction
                </span>
                <textarea
                  rows={6}
                  value={aiInstruction}
                  onChange={(event) => setAiInstruction(event.target.value)}
                  placeholder="Tell this AI staff how to reply, what to ask, what to avoid, when to collect customer details, and when to ask a human to take over."
                  className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              {saveError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                  <p className="text-base font-black">{saveError}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSaving || hasReachedLimit}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-6 w-6" />
                {isSaving ? "Saving AI staff..." : "Save & Test AI"}
                <ArrowRight className="h-6 w-6" />
              </button>

              <p className="text-center text-sm font-black leading-6 text-slate-500">
                Saving AI staff does not use credits. Testing AI after saving
                uses 3 credits.
              </p>

              <p className="text-center text-sm font-bold leading-6 text-slate-500">
                Plan includes {getPlanCreditLabel(currentPlan)}.
              </p>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="block truncate text-base font-black text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full min-w-0 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}