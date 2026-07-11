"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  CircleAlert,
  Globe2,
  Headphones,
  Inbox,
  Loader2,
  MessageCircle,
  PenLine,
  PlayCircle,
  Save,
  ShieldCheck,
  Sparkles,
  TestTube2,
  WalletCards,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  KOLKAP_AI_STAFF_CREATE_CREDITS,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type AiStaffRow = {
  id: string;
  workspace_id: string;
  owner_user_id?: string | null;
  name?: string | null;
  title?: string | null;
  role?: string | null;
  channel?: string | null;
  primary_channel?: string | null;
  reply_language?: string | null;
  language?: string | null;
  reply_tone?: string | null;
  tone?: string | null;
  business_knowledge?: string | null;
  ai_instruction?: string | null;
  instruction?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CreditBalanceRow = {
  plan_credits: number | null;
  purchased_credits: number | null;
  used_credits: number | null;
};

type RoleOption = {
  title: string;
  value: string;
  channel: string;
  text: string;
  icon: ReactNode;
  defaultName: string;
  defaultInstruction: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "AI Staff", href: "/dashboard/agents" },
  { label: "Create AI", href: "/dashboard/agents/new" },
  { label: "AI Brain", href: "/dashboard/ai-brain" },
  { label: "Knowledge", href: "/dashboard/knowledge-base" },
  { label: "Test AI", href: "/dashboard/test-ai" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Go Live", href: "/dashboard/go-live" },
];

const roleOptions: RoleOption[] = [
  {
    title: "AI Receptionist",
    value: "AI Receptionist",
    channel: "website_chat",
    text: "Welcome customers, collect details, ask what they need, and route inquiries safely.",
    icon: <Bot className="h-8 w-8" />,
    defaultName: "Maya",
    defaultInstruction:
      "Welcome customers warmly, ask what they need, collect their name and contact details, answer based on business knowledge only, and hand over to a human when needed.",
  },
  {
    title: "WhatsApp Responder",
    value: "WhatsApp Responder",
    channel: "whatsapp",
    text: "Reply to WhatsApp inquiries, qualify leads, and follow handover rules.",
    icon: <MessageCircle className="h-8 w-8" />,
    defaultName: "Kai",
    defaultInstruction:
      "Reply naturally for WhatsApp, keep messages short and clear, qualify the customer, collect contact details, and hand over when the customer asks for a person or needs special approval.",
  },
  {
    title: "Customer Support",
    value: "Customer Support",
    channel: "inbox",
    text: "Answer FAQs, pricing, services, policies, support questions, and customer follow-ups.",
    icon: <Headphones className="h-8 w-8" />,
    defaultName: "Alex",
    defaultInstruction:
      "Answer customer support questions using business knowledge only. Do not invent prices, policies, refunds, availability, or guarantees. Escalate complaints and sensitive requests to the team.",
  },
  {
    title: "AI Copywriter",
    value: "AI Copywriter",
    channel: "content_studio",
    text: "Create captions, scripts, ad copy, WhatsApp messages, and customer reply drafts.",
    icon: <PenLine className="h-8 w-8" />,
    defaultName: "Nova",
    defaultInstruction:
      "Create clear, useful business content based on the business profile and saved knowledge. Do not invent prices, contact details, discounts, guarantees, or policies.",
  },
  {
    title: "Inbox Reply Assistant",
    value: "Inbox Reply Assistant",
    channel: "inbox",
    text: "Generate suggested inbox replies for the team to review before sending.",
    icon: <Inbox className="h-8 w-8" />,
    defaultName: "Lina",
    defaultInstruction:
      "Generate safe suggested replies for inbox conversations. Use business knowledge only, keep replies helpful, and recommend human handover when information is missing or sensitive.",
  },
];

const languageOptions = [
  "Auto-detect",
  "English",
  "Indonesian",
  "English + Indonesian",
  "Chinese",
  "Malay",
];

const toneOptions = [
  "Friendly Professional",
  "Warm and helpful",
  "Formal",
  "Premium",
  "Direct",
  "Luxury",
];

const safetyRules = [
  "Hand over when customer asks for a human.",
  "Hand over for payment, legal, refund, complaint, or special approval questions.",
  "Do not invent pricing, policies, availability, discounts, or guarantees.",
  "Ask for customer name and contact details for serious leads.",
  "Use only the correct business workspace knowledge.",
  "Summarize the conversation before human takeover.",
];

const knowledgeCategories = [
  "Business Info",
  "FAQ",
  "Pricing",
  "Services",
  "Policies",
  "Important URLs",
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

function getAiStaffLimit(planKey: string) {
  if (planKey === "starter" || planKey === "free_trial") return 1;
  if (planKey === "growth") return 3;
  if (planKey === "professional" || planKey === "pro") return 6;
  if (planKey === "business") return 10;

  return 1;
}

function getStatusClass(status: string | null | undefined) {
  if (status === "active") return "bg-[#7CFF3D] text-[#07111F]";
  if (status === "draft") return "bg-blue-100 text-blue-700";

  return "bg-slate-200 text-slate-700";
}

function statusLabel(status: string | null | undefined) {
  if (!status) return "Draft";

  return status.replace(/_/g, " ");
}

function getStaffName(staff: AiStaffRow) {
  return staff.name || staff.title || "AI Staff";
}

function getStaffRole(staff: AiStaffRow) {
  return staff.role || "AI Staff";
}

function getStaffChannel(staff: AiStaffRow) {
  return staff.channel || staff.primary_channel || "general";
}

function isMissingColumnError(message: string) {
  const text = message.toLowerCase();

  return (
    text.includes("column") ||
    text.includes("schema cache") ||
    text.includes("could not find")
  );
}

export default function NewAgentPage() {
  const router = useRouter();
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const aiLimit = getAiStaffLimit(String(workspaceState.planKey));
  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );

  const [selectedRole, setSelectedRole] = useState<RoleOption>(roleOptions[0]);
  const [name, setName] = useState(roleOptions[0].defaultName);
  const [replyLanguage, setReplyLanguage] = useState("Auto-detect");
  const [replyTone, setReplyTone] = useState("Friendly Professional");
  const [businessContext, setBusinessContext] = useState("");
  const [aiInstruction, setAiInstruction] = useState(
    roleOptions[0].defaultInstruction
  );

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const creditsLeft = getCreditsLeft(creditBalance);
  const usedCredits = Number(creditBalance?.used_credits || 0);
  const totalCredits =
    Number(creditBalance?.plan_credits || 0) +
    Number(creditBalance?.purchased_credits || 0);

  const hasReachedLimit = aiStaffRows.length >= aiLimit;

  const summaryCards = useMemo(
    () => [
      {
        label: "Current Plan",
        value: currentPlan.name,
        note: currentPlan.priceLabel,
        icon: <WalletCards className="h-7 w-7" />,
      },
      {
        label: "AI Staff Used",
        value: `${aiStaffRows.length}/${aiLimit}`,
        note: getPlanAIStaffLabel(currentPlan),
        icon: <Bot className="h-7 w-7" />,
      },
      {
        label: "Credits Left",
        value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
        note:
          creditsLeft === null
            ? "Credit balance not found yet."
            : `${usedCredits.toLocaleString()} used of ${totalCredits.toLocaleString()} total`,
        icon: <Sparkles className="h-7 w-7" />,
      },
      {
        label: "Go Live",
        value: workspaceState.goLiveStatus,
        note: "Review readiness after setup",
        icon: <ShieldCheck className="h-7 w-7" />,
      },
    ],
    [
      aiLimit,
      aiStaffRows.length,
      creditsLeft,
      currentPlan,
      totalCredits,
      usedCredits,
      workspaceState.goLiveStatus,
    ]
  );

  useEffect(() => {
    if (!workspace) return;

    const profileText = [
      workspace.business_name ? `Business name: ${workspace.business_name}` : "",
      workspace.business_type ? `Business type: ${workspace.business_type}` : "",
      workspace.business_email ? `Email: ${workspace.business_email}` : "",
      workspace.business_phone ? `Phone: ${workspace.business_phone}` : "",
      workspace.whatsapp_number ? `WhatsApp: ${workspace.whatsapp_number}` : "",
      workspace.business_address ? `Address: ${workspace.business_address}` : "",
      workspace.country ? `Country: ${workspace.country}` : "",
      workspace.timezone ? `Timezone: ${workspace.timezone}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setBusinessContext(profileText);
  }, [workspace]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!workspace?.id) {
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      setPageError("");

      const supabase = createClient();

      const [staffResult, creditResult] = await Promise.all([
        supabase
          .from("ai_staff")
          .select("*")
          .eq("workspace_id", workspace.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),

        supabase
          .from("workspace_credit_balances")
          .select("plan_credits, purchased_credits, used_credits")
          .eq("workspace_id", workspace.id)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      const firstError = staffResult.error || creditResult.error;

      if (firstError) {
        setPageError(firstError.message);
        setIsLoadingData(false);
        return;
      }

      setAiStaffRows((staffResult.data ?? []) as AiStaffRow[]);
      setCreditBalance((creditResult.data ?? null) as CreditBalanceRow | null);
      setIsLoadingData(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [workspace?.id]);

  function handleRoleChange(role: RoleOption) {
    setSelectedRole(role);
    setName(role.defaultName);
    setAiInstruction(role.defaultInstruction);
  }

  async function saveAiStaff(status: "draft" | "active") {
    setActionMessage("");
    setActionError("");

    if (!workspace?.id) {
      setActionError("Workspace is not ready yet.");
      return;
    }

    if (!workspace.owner_user_id) {
      setActionError("Workspace owner could not be found.");
      return;
    }

    if (!name.trim()) {
      setActionError("Please add an AI staff name.");
      return;
    }

    if (!selectedRole.value.trim()) {
      setActionError("Please choose an AI role.");
      return;
    }

    if (!aiInstruction.trim()) {
      setActionError("Please add the main AI instruction.");
      return;
    }

    if (hasReachedLimit) {
      setActionError(
        `Your current plan allows ${aiLimit} AI staff. Upgrade your plan or remove an old AI staff member before creating another one.`
      );
      return;
    }

    if (status === "draft") {
      setIsSavingDraft(true);
    } else {
      setIsCreating(true);
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please log in again before saving AI staff.");
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
          role: selectedRole.value,
          type: selectedRole.value,
          channel: selectedRole.channel,
          primary_channel: selectedRole.channel,
          reply_language: replyLanguage,
          language: replyLanguage,
          reply_tone: replyTone,
          tone: replyTone,
          business_knowledge: businessContext.trim() || null,
          ai_instruction: aiInstruction.trim(),
          instruction: aiInstruction.trim(),
          status,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || "AI staff could not be saved.");
      }

      const savedStaff = result.staff as AiStaffRow;
      const nextRows = [savedStaff, ...aiStaffRows];

      setAiStaffRows(nextRows);

      setActionMessage(
        status === "draft"
          ? "AI staff saved as draft."
          : `AI staff created. ${
              result.credits_used || KOLKAP_AI_STAFF_CREATE_CREDITS
            } credits have been used. Redirecting to Test AI...`
      );

      if (status === "active") {
        window.setTimeout(() => {
          router.push(`/dashboard/test-ai?ai=${savedStaff.id}`);
        }, 800);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "AI staff could not be saved."
      );
    }

    setIsSavingDraft(false);
    setIsCreating(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveAiStaff("active");
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading AI staff setup...
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
            <p className="text-xl font-black">Create AI page could not load.</p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 lg:flex-row lg:items-center lg:justify-between">
          <KolkapLogo size="sm" />

          <nav className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full border px-5 py-3 text-base font-black transition ${
                  item.label === "Create AI"
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <Link
              href="/dashboard/agents"
              className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to AI Staff
            </Link>

            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              New AI Staff
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Create AI staff for this business workspace.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              This AI staff will be saved under the logged-in business
              workspace. Kolkap Brain will use this workspace, this AI staff,
              and this business knowledge when generating replies.
            </p>

            <div className="mt-8 rounded-3xl border border-[#7CFF3D]/30 bg-[#7CFF3D]/10 p-5">
              <p className="text-xl font-black text-[#7CFF3D]">
                Correct business context
              </p>

              <p className="mt-2 text-lg font-semibold leading-8 text-slate-200">
                AI staff is linked to workspace_id:{" "}
                {workspace?.id ? workspace.id.slice(0, 8) : "loading"}...
              </p>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Workspace Summary
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Create safely before going live.
            </h2>

            <div className="mt-6 grid gap-4">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                      {card.icon}
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                        {card.label}
                      </p>

                      <p className="mt-1 text-2xl font-black">{card.value}</p>

                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                        {card.note}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasReachedLimit ? (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                <p className="flex items-start gap-3 text-base font-black leading-7">
                  <CircleAlert className="mt-1 h-5 w-5 shrink-0" />
                  AI staff limit reached. Upgrade your plan before creating a
                  new AI staff member.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {pageError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{pageError}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="grid gap-8">
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Bot className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Step 1
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                    Choose AI role
                  </h2>
                </div>
              </div>

              <div className="grid gap-4">
                {roleOptions.map((role) => {
                  const isSelected = selectedRole.value === role.value;

                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`rounded-3xl border p-5 text-left transition ${
                        isSelected
                          ? "border-[#07111F] bg-[#07111F] text-white"
                          : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:border-blue-400 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                            isSelected
                              ? "bg-[#7CFF3D] text-[#07111F]"
                              : "bg-white text-[#07111F]"
                          }`}
                        >
                          {role.icon}
                        </div>

                        <div>
                          <p className="text-2xl font-black">{role.title}</p>

                          <p
                            className={`mt-2 text-base font-semibold leading-7 ${
                              isSelected ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {role.text}
                          </p>

                          <p
                            className={`mt-2 text-sm font-black ${
                              isSelected ? "text-[#7CFF3D]" : "text-blue-600"
                            }`}
                          >
                            Channel: {role.channel.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Brain className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Step 2
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                    Basic setup
                  </h2>
                </div>
              </div>

              <div className="grid gap-5">
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    AI staff name
                  </span>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Example: Maya, Kai, Alex, Nova"
                    className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      Language
                    </span>

                    <select
                      value={replyLanguage}
                      onChange={(event) => setReplyLanguage(event.target.value)}
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    >
                      {languageOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      Tone
                    </span>

                    <select
                      value={replyTone}
                      onChange={(event) => setReplyTone(event.target.value)}
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    >
                      {toneOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    Main instruction
                  </span>

                  <textarea
                    rows={6}
                    value={aiInstruction}
                    onChange={(event) => setAiInstruction(event.target.value)}
                    placeholder="Tell this AI staff how to reply, what to collect, and when to hand over."
                    className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <ShieldCheck className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Step 3
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                    Safety and handover
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {safetyRules.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#07111F]" />
                    <span className="text-lg font-black leading-8">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Globe2 className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Step 4
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                    Business context
                  </h2>
                </div>
              </div>

              <p className="mb-5 text-lg font-semibold leading-8 text-slate-600">
                This is extra context saved on the AI staff profile. Your full
                Knowledge Base is managed separately and loaded by Kolkap Brain.
              </p>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Business context preview
                </span>

                <textarea
                  rows={9}
                  value={businessContext}
                  onChange={(event) => setBusinessContext(event.target.value)}
                  placeholder="Business facts, service notes, or extra context for this AI staff."
                  className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {knowledgeCategories.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 py-3 text-base font-black text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <MessageCircle className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                      Step 5
                    </p>

                    <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                      Preview and test
                    </h2>
                  </div>
                </div>

                <p className="text-xl font-semibold leading-9 text-slate-600">
                  After creating this AI staff, test real customer questions
                  through the Test AI page. Testing uses credits because it
                  generates AI output.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/dashboard/test-ai"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-lg font-black text-white"
                  >
                    <TestTube2 className="h-6 w-6" />
                    Open Test AI
                  </Link>

                  <Link
                    href="/dashboard/knowledge-base"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-7 py-4 text-lg font-black text-[#07111F]"
                  >
                    <BookOpen className="h-6 w-6" />
                    Add Knowledge
                  </Link>
                </div>
              </div>

              <div className="rounded-[1.8rem] bg-[#07111F] p-5 text-white">
                <div className="mb-5 rounded-3xl bg-white/10 p-5">
                  <p className="text-base font-black text-slate-300">
                    Customer
                  </p>

                  <p className="mt-2 text-lg font-semibold leading-8">
                    Hi, can you tell me about your service and pricing?
                  </p>
                </div>

                <div className="ml-auto rounded-3xl border border-blue-400/40 bg-blue-500/15 p-5">
                  <p className="text-base font-black text-blue-100">
                    {name.trim() || selectedRole.title}
                  </p>

                  <p className="mt-2 text-lg font-semibold leading-8 text-slate-200">
                    Of course. I can help explain our services. May I ask what
                    you need help with first so I can guide you correctly?
                  </p>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#7CFF3D]" />

                    <div>
                      <p className="text-xl font-black">Safe reply preview</p>

                      <p className="mt-2 text-lg font-semibold leading-8 text-slate-300">
                        AI asks a qualifying question instead of guessing the
                        customer’s needs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {actionMessage ? (
              <div className="mt-8 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                <p className="text-base font-black">{actionMessage}</p>
              </div>
            ) : null}

            {actionError ? (
              <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                <p className="text-base font-black">{actionError}</p>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => saveAiStaff("draft")}
                disabled={isSavingDraft || isCreating || hasReachedLimit}
                className="inline-flex flex-1 items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingDraft ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Save className="h-6 w-6" />
                )}
                {isSavingDraft ? "Saving draft..." : "Save as Draft"}
              </button>

              <button
                type="submit"
                disabled={isSavingDraft || isCreating || hasReachedLimit}
                className="inline-flex flex-1 items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
                {isCreating ? "Creating..." : `Create AI Staff & Test for ${KOLKAP_AI_STAFF_CREATE_CREDITS} Credits`}
              </button>
            </div>
          </section>
        </form>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Existing AI Staff
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                AI staff already saved in this workspace
              </h2>
            </div>

            <Link
              href="/dashboard/test-ai"
              className="hidden items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-base font-black text-white sm:inline-flex"
            >
              Test AI
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoadingData ? (
            <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-base font-black text-slate-600">
              Loading AI staff...
            </div>
          ) : aiStaffRows.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6">
              <p className="text-2xl font-black">No AI staff yet.</p>

              <p className="mt-2 text-lg font-semibold leading-8 text-slate-600">
                Create your first AI staff above, then test it before going live.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {aiStaffRows.map((staff) => (
                <div
                  key={staff.id}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                      <Bot className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-2xl font-black">
                          {getStaffName(staff)}
                        </p>

                        <span
                          className={`rounded-full px-4 py-2 text-xs font-black ${getStatusClass(
                            staff.status
                          )}`}
                        >
                          {statusLabel(staff.status)}
                        </span>
                      </div>

                      <p className="mt-2 text-base font-bold text-slate-600">
                        {getStaffRole(staff)}
                      </p>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Channel: {getStaffChannel(staff).replace(/_/g, " ")}
                      </p>

                      <Link
                        href={`/dashboard/test-ai?ai=${staff.id}`}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Test this AI
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}