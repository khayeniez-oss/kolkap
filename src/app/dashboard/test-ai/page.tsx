"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clipboard,
  CreditCard,
  Inbox,
  MessageCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import {
  getKolkapPlan,
  KOLKAP_AI_GENERATION_MIN_CREDITS,
} from "@/lib/kolkapPlan";
import { createClient } from "@/lib/supabase/client";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const MAX_QUESTION_LENGTH = 1200;
const MAX_INSTRUCTION_LENGTH = 1200;
const TEST_AI_CREDIT_COST = KOLKAP_AI_GENERATION_MIN_CREDITS;

type Option = {
  value: string;
  label: string;
};

type AiStaffRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  name: string;
  role: string;
  channel: string;
  reply_language: string | null;
  reply_tone: string | null;
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

const TONE_OPTIONS: Option[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "sales", label: "Sales" },
  { value: "simple", label: "Simple" },
  { value: "formal", label: "Formal" },
  { value: "helpful", label: "Helpful" },
];

const TEST_CHANNEL_OPTIONS: Option[] = [
  { value: "website_chat", label: "Website Chat Style" },
  { value: "whatsapp", label: "WhatsApp Style" },
  { value: "inbox", label: "Inbox Reply Style" },
  { value: "test_ai", label: "General Test" },
];

const SAMPLE_QUESTIONS = [
  "What services do you offer?",
  "How much is your price?",
  "How can I contact your team?",
  "Can I speak with a human?",
  "Where is your business located?",
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

function getOptionLabel(options: Option[], value: string) {
  return options.find((option) => option.value === value)?.label || value;
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Draft";
  if (value === "draft") return "Draft";
  if (value === "testing") return "Testing";
  if (value === "live") return "Live";
  if (value === "inactive") return "Inactive";

  return value;
}

export default function TestAIPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [selectedAiStaffId, setSelectedAiStaffId] = useState("");
  const [isLoadingAiStaff, setIsLoadingAiStaff] = useState(false);
  const [aiStaffError, setAiStaffError] = useState("");

  const [question, setQuestion] = useState("");
  const [tone, setTone] = useState("professional");
  const [testChannel, setTestChannel] = useState("website_chat");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [reply, setReply] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [knowledgeCount, setKnowledgeCount] = useState<number | null>(null);
  const [testedAiStaffId, setTestedAiStaffId] = useState<string | null>(null);
  const [testedChannel, setTestedChannel] = useState("");
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const questionCount = question.length;
  const instructionCount = extraInstructions.length;

  const isQuestionTooLong = questionCount > MAX_QUESTION_LENGTH;
  const isInstructionTooLong = instructionCount > MAX_INSTRUCTION_LENGTH;

  const creditsLeft = getCreditsLeft(creditBalance);
  const usedCredits = Number(creditBalance?.used_credits || 0);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);

  const selectedAiStaff = useMemo(() => {
    return aiStaffRows.find((item) => item.id === selectedAiStaffId) || null;
  }, [aiStaffRows, selectedAiStaffId]);

  const testedAiStaff = useMemo(() => {
    return aiStaffRows.find((item) => item.id === testedAiStaffId) || null;
  }, [aiStaffRows, testedAiStaffId]);

  const hasEnoughCredits =
    creditsLeft === null || creditsLeft >= TEST_AI_CREDIT_COST;

  async function loadCreditBalance() {
    if (!workspace?.id) return;

    setIsLoadingCredits(true);

    const supabase = createClient();

    const { data } = await supabase
      .from("workspace_credit_balances")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    setCreditBalance((data ?? null) as CreditBalanceRow | null);
    setIsLoadingCredits(false);
  }

  async function loadAiStaff() {
    if (!workspace?.id) return;

    setIsLoadingAiStaff(true);
    setAiStaffError("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("ai_staff")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (error) {
      setAiStaffError(error.message || "AI staff could not load.");
      setIsLoadingAiStaff(false);
      return;
    }

    const rows = (data ?? []) as AiStaffRow[];
    setAiStaffRows(rows);

    setSelectedAiStaffId((current) => {
      if (current && rows.some((item) => item.id === current)) {
        return current;
      }

      return rows[0]?.id || "";
    });

    setIsLoadingAiStaff(false);
  }

  useEffect(() => {
    loadCreditBalance();
    loadAiStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  useEffect(() => {
    if (!aiStaffRows.length) return;

    const params = new URLSearchParams(window.location.search);
    const aiIdFromUrl = params.get("ai");

    if (aiIdFromUrl && aiStaffRows.some((item) => item.id === aiIdFromUrl)) {
      setSelectedAiStaffId(aiIdFromUrl);
    }
  }, [aiStaffRows]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!selectedAiStaffId) {
      setActionError("Please choose an AI staff member to test.");
      return;
    }

    if (!question.trim()) {
      setActionError("Please write a sample customer question first.");
      return;
    }

    if (isQuestionTooLong) {
      setActionError("Sample question is too long.");
      return;
    }

    if (isInstructionTooLong) {
      setActionError("Extra instructions are too long.");
      return;
    }

    if (!hasEnoughCredits) {
      setActionError("You do not have enough credits to test AI.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/test-ai/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ai_staff_id: selectedAiStaffId,
          test_channel: testChannel,
          customer_message: question,
          language: "auto",
          tone,
          extra_instructions: extraInstructions,
          ui_language: "en",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setActionError(result.error || "AI reply could not be generated.");
        setIsGenerating(false);
        return;
      }

      setReply(result.reply || "");
      setBusinessName(result.business_name || "");
      setKnowledgeCount(
        typeof result.knowledge_count === "number"
          ? result.knowledge_count
          : null
      );
      setTestedAiStaffId(result.ai_staff_id || selectedAiStaffId);
      setTestedChannel(result.test_channel || testChannel);

      setActionMessage(
        `Test reply generated. ${result.credits_used || TEST_AI_CREDIT_COST} credits have been used. This was only a test and was not sent to a real customer.`
      );

      await loadCreditBalance();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "AI reply could not be generated.";

      setActionError(message);
    }

    setIsGenerating(false);
  }

  function clearTest() {
    setQuestion("");
    setExtraInstructions("");
    setReply("");
    setActionMessage("");
    setActionError("");
    setKnowledgeCount(null);
    setBusinessName("");
    setTestedAiStaffId(null);
    setTestedChannel("");
  }

  async function copyReply() {
    if (!reply.trim()) return;

    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading Test AI...
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
            <p className="text-xl font-black">Test AI could not load.</p>
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
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>

            <Link
              href="/dashboard/go-live"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              Go Live
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Bot className="h-5 w-5" />
            Test AI
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Test one AI staff before going live.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Choose an AI staff member, select a test style, ask a sample customer
            question, and review the reply. This page does not send messages to
            real customers.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <InfoCard
            icon={<ShieldCheck className="h-7 w-7" />}
            label="Current Plan"
            value={currentPlan.name}
            note={currentPlan.priceLabel}
          />

          <InfoCard
            icon={<CreditCard className="h-7 w-7" />}
            label="Credits Left"
            value={creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
            note={
              creditBalance
                ? `Credits used: ${usedCredits.toLocaleString()}`
                : "Credit balance not found yet."
            }
            dark
          />

          <InfoCard
            icon={<Zap className="h-7 w-7" />}
            label="Credit Cost"
            value={`${TEST_AI_CREDIT_COST} Credits`}
            note="Every successful test reply uses credits."
          />

          <InfoCard
            icon={<Bot className="h-7 w-7" />}
            label="AI Staff"
            value={selectedAiStaff?.name || "Not selected"}
            note={
              aiStaffRows.length
                ? `${aiStaffRows.length} AI staff available`
                : "Create AI staff before testing."
            }
          />

          <InfoCard
            icon={<Sparkles className="h-7 w-7" />}
            label="Mode"
            value="Test Only"
            note="No customer message will be sent from this page."
          />
        </div>

        {!aiStaffRows.length && !isLoadingAiStaff ? (
          <section className="mb-8 rounded-[2.2rem] border border-amber-200 bg-amber-50 p-7 text-amber-900 shadow-sm shadow-amber-900/5 sm:p-8">
            <h2 className="text-3xl font-black tracking-[-0.04em]">
              Create AI staff before testing.
            </h2>
            <p className="mt-3 text-lg font-semibold leading-8">
              Test AI works best when you choose the exact AI staff member you
              want to test.
            </p>
            <Link
              href="/dashboard/create-ai"
              className="mt-6 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-base font-black text-white"
            >
              Create AI Staff
              <ArrowRight className="h-5 w-5" />
            </Link>
          </section>
        ) : null}

        {aiStaffError ? (
          <section className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{aiStaffError}</p>
          </section>
        ) : null}

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Test before live replies
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                If the answer is not strong yet, improve your AI staff setup and
                business knowledge before going live.
              </h2>

              {creditBalance ? (
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                  Included plan credits: {planCredits.toLocaleString()} • Top-up
                  credits: {purchasedCredits.toLocaleString()} • Credits used:{" "}
                  {usedCredits.toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Wand2 className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Test Setup
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Choose who replies and where the reply is being tested.
              </h2>
            </div>

            <form onSubmit={handleGenerate} className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Choose AI Staff
                </span>

                <select
                  value={selectedAiStaffId}
                  onChange={(event) => setSelectedAiStaffId(event.target.value)}
                  disabled={isLoadingAiStaff || !aiStaffRows.length}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-lg font-black outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-60"
                >
                  {isLoadingAiStaff ? (
                    <option value="">Loading AI staff...</option>
                  ) : aiStaffRows.length ? (
                    aiStaffRows.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} — {staff.role} — {statusLabel(staff.status)}
                      </option>
                    ))
                  ) : (
                    <option value="">No AI staff created yet</option>
                  )}
                </select>
              </label>

              <SelectInput
                label="Test Style"
                value={testChannel}
                onChange={setTestChannel}
                options={TEST_CHANNEL_OPTIONS}
              />

              <SelectInput
                label="Reply Tone"
                value={tone}
                onChange={setTone}
                options={TONE_OPTIONS}
              />

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Sample Customer Question
                </span>

                <textarea
                  rows={7}
                  value={question}
                  maxLength={MAX_QUESTION_LENGTH + 100}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Example: What services do you offer and how can I contact your team?"
                  className={`w-full rounded-2xl border px-5 py-4 text-lg font-semibold leading-8 outline-none transition ${
                    isQuestionTooLong
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 bg-[#F7F9FA] focus:border-blue-500 focus:bg-white"
                  }`}
                />

                <span
                  className={`text-sm font-black ${
                    isQuestionTooLong ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {questionCount} / {MAX_QUESTION_LENGTH} characters
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Extra Test Instructions
                </span>

                <textarea
                  rows={5}
                  value={extraInstructions}
                  maxLength={MAX_INSTRUCTION_LENGTH + 100}
                  onChange={(event) => setExtraInstructions(event.target.value)}
                  placeholder="Optional: Tell your AI what to pay attention to, such as keeping the answer short, mentioning booking steps, or asking for customer details."
                  className={`w-full rounded-2xl border px-5 py-4 text-lg font-semibold leading-8 outline-none transition ${
                    isInstructionTooLong
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 bg-[#F7F9FA] focus:border-blue-500 focus:bg-white"
                  }`}
                />

                <span
                  className={`text-sm font-black ${
                    isInstructionTooLong ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {instructionCount} / {MAX_INSTRUCTION_LENGTH} characters
                </span>
              </label>

              {actionMessage ? (
                <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                  <p className="flex items-center gap-3 text-base font-black">
                    <CheckCircle2 className="h-5 w-5" />
                    {actionMessage}
                  </p>

                  {knowledgeCount !== null ? (
                    <p className="mt-2 text-sm font-bold">
                      {businessName ? `${businessName} • ` : ""}
                      {knowledgeCount} business knowledge item(s) used
                    </p>
                  ) : null}
                </div>
              ) : null}

              {actionError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                  <p className="text-base font-black">{actionError}</p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={
                    isGenerating ||
                    isQuestionTooLong ||
                    isInstructionTooLong ||
                    !selectedAiStaffId ||
                    !hasEnoughCredits
                  }
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-lg font-black text-[#07111F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xl"
                >
                  <Send className="h-6 w-6" />
                  {isGenerating
                    ? "Generating..."
                    : reply
                      ? `Test Again for ${TEST_AI_CREDIT_COST} Credits`
                      : `Test AI for ${TEST_AI_CREDIT_COST} Credits`}
                </button>

                <button
                  type="button"
                  onClick={clearTest}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-8 py-5 text-xl font-black text-[#07111F]"
                >
                  <RefreshCcw className="h-6 w-6" />
                  Clear
                </button>
              </div>

              <button
                type="button"
                onClick={loadCreditBalance}
                disabled={isLoadingCredits}
                className="text-left text-sm font-black text-blue-600 disabled:opacity-50"
              >
                {isLoadingCredits ? "Refreshing credits..." : "Refresh credits"}
              </button>
            </form>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <MessageCircle className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                AI Test Reply
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Review the reply before letting AI answer real customers.
              </h2>
            </div>

            {reply ? (
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <MiniCard
                  icon={<Bot className="h-5 w-5" />}
                  label="AI Staff"
                  value={testedAiStaff?.name || selectedAiStaff?.name || "AI Staff"}
                />
                <MiniCard
                  icon={<Smartphone className="h-5 w-5" />}
                  label="Test Style"
                  value={getOptionLabel(
                    TEST_CHANNEL_OPTIONS,
                    testedChannel || testChannel
                  )}
                />
                <MiniCard
                  icon={<Zap className="h-5 w-5" />}
                  label="Credits Used"
                  value={`${TEST_AI_CREDIT_COST}`}
                />
              </div>
            ) : null}

            <textarea
              rows={16}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder={`The AI reply will appear here after you click Test AI for ${TEST_AI_CREDIT_COST} Credits.`}
              className="w-full rounded-3xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold leading-8 outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyReply}
                disabled={!reply.trim()}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Clipboard className="h-6 w-6" />
                {copied ? "Copied" : "Copy Reply"}
              </button>

              <Link
                href="/dashboard/go-live"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] transition hover:-translate-y-0.5"
              >
                <CheckCircle2 className="h-6 w-6" />
                Continue to Go Live
              </Link>
            </div>

            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
              <p className="text-lg font-black text-[#07111F]">
                Quick sample questions
              </p>

              <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                Click one to test faster.
              </p>

              <div className="mt-5 grid gap-3">
                {SAMPLE_QUESTIONS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setQuestion(sample)}
                    className="rounded-2xl bg-white px-5 py-4 text-left text-base font-black text-[#07111F] transition hover:bg-slate-100"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
              <div className="mb-3 flex items-center gap-3">
                <Inbox className="h-5 w-5" />
                <p className="text-base font-black">Test mode only</p>
              </div>
              <p className="text-base font-semibold leading-7">
                This page previews the AI reply. Real Website Chat, WhatsApp,
                and Inbox conversations are handled from their own customer
                messaging flows.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
  note,
  dark = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
        dark
          ? "border-[#7CFF3D] bg-[#07111F] text-white"
          : "border-slate-200 bg-white text-[#07111F]"
      }`}
    >
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
          dark ? "bg-[#7CFF3D] text-[#07111F]" : "bg-[#07111F] text-[#7CFF3D]"
        }`}
      >
        {icon}
      </div>

      <p
        className={`text-lg font-black ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-black tracking-[-0.04em]">
        {value}
      </p>

      <p
        className={`mt-2 text-base font-semibold leading-7 ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {note}
      </p>
    </div>
  );
}

function MiniCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-500">{icon}</div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-[#07111F]">{value}</p>
    </div>
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
  options: Option[];
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-base font-black text-slate-700">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-lg font-black outline-none transition focus:border-blue-500 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}