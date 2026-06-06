"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clipboard,
  CreditCard,
  MessageCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  getGenerateButtonLabel,
  getKolkapPlan,
} from "@/lib/kolkapPlan";
import { createClient } from "@/lib/supabase/client";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const MAX_QUESTION_LENGTH = 1200;
const MAX_INSTRUCTION_LENGTH = 1200;
const TEST_AI_CREDIT_COST = 1;

type Option = {
  value: string;
  label: string;
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

const languageOptions: Option[] = [
  { value: "auto", label: "Auto Detect" },
  { value: "en", label: "English" },
  { value: "id", label: "Indonesian" },
  { value: "ms", label: "Malay" },
  { value: "zh", label: "Chinese" },
];

const toneOptions: Option[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "sales", label: "Sales" },
  { value: "simple", label: "Simple" },
  { value: "formal", label: "Formal" },
  { value: "helpful", label: "Helpful" },
];

const sampleQuestions = [
  "What services do you offer?",
  "How much is your price?",
  "How can I contact your team?",
  "Can I speak with a human?",
  "Where is your business located?",
];

const translations = {
  en: {
    loading: "Loading Test AI...",
    failed: "Test AI could not load.",
    back: "Back to Dashboard",
    badge: "Test AI",
    title: "Test your AI before customers see it.",
    subtitle:
      "Ask sample customer questions and check if Kolkap AI Brain replies correctly using your business profile and Knowledge Base.",
    currentPlan: "Current Plan",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    creditCost: "Credit Cost",
    business: "Business",
    purpose: "Purpose",
    purposeText:
      "This page is for safe testing only. It does not send replies to real customers.",
    questionTitle: "Sample Customer Question",
    questionText:
      "Write a question like a real customer would ask. The AI will answer using your logged-in business and Knowledge Base.",
    questionPlaceholder:
      "Example: What services do you offer and how can I contact your team?",
    language: "Reply Language",
    tone: "Reply Tone",
    extraInstructions: "Extra Test Instructions",
    extraInstructionsPlaceholder:
      "Optional: Tell the AI what to pay attention to, such as keep it short, mention WhatsApp, or explain step by step.",
    generate: "Generate Test Reply",
    generating: "Generating...",
    regenerate: "Regenerate Reply",
    clear: "Clear",
    resultTitle: "AI Test Reply",
    resultPlaceholder:
      "The AI reply will appear here after you click Generate Test Reply.",
    copied: "Copied",
    copy: "Copy Reply",
    success:
      "Test reply generated. 1 credit has been used. Review the answer before connecting it to real customer conversations.",
    error: "AI reply could not be generated.",
    questionRequired: "Please write a sample customer question first.",
    questionTooLong: "Sample question is too long.",
    instructionTooLong: "Extra instructions are too long.",
    characters: "characters",
    usingKnowledge: "knowledge items",
    sampleTitle: "Quick sample questions",
    sampleText: "Click one to test faster.",
    whyTitle: "Why this matters",
    whyText:
      "If the AI gives weak answers here, fix your Knowledge Base before going live.",
    safeTest: "Safe Test",
    noCreditBalance: "Credit balance not found yet.",
    includedPlanCredits: "Included plan credits",
    refreshCredits: "Refresh credits",
    oneCreditNote:
      "Every successful test reply generation uses 1 credit.",
  },

  id: {
    loading: "Memuat Test AI...",
    failed: "Test AI gagal dimuat.",
    back: "Kembali ke Dashboard",
    badge: "Test AI",
    title: "Test AI Anda sebelum customer melihatnya.",
    subtitle:
      "Tulis contoh pertanyaan customer dan cek apakah Kolkap AI Brain menjawab dengan benar menggunakan business profile dan Knowledge Base Anda.",
    currentPlan: "Paket Saat Ini",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    creditCost: "Credit Cost",
    business: "Business",
    purpose: "Purpose",
    purposeText:
      "Halaman ini hanya untuk testing aman. Ini tidak mengirim reply ke customer asli.",
    questionTitle: "Sample Customer Question",
    questionText:
      "Tulis pertanyaan seperti customer asli. AI akan menjawab menggunakan bisnis yang sedang login dan Knowledge Base Anda.",
    questionPlaceholder:
      "Contoh: Layanan apa yang Anda tawarkan dan bagaimana cara menghubungi tim Anda?",
    language: "Reply Language",
    tone: "Reply Tone",
    extraInstructions: "Extra Test Instructions",
    extraInstructionsPlaceholder:
      "Optional: Beri instruksi khusus, seperti jawab singkat, sebutkan WhatsApp, atau jelaskan step by step.",
    generate: "Generate Test Reply",
    generating: "Generating...",
    regenerate: "Regenerate Reply",
    clear: "Clear",
    resultTitle: "AI Test Reply",
    resultPlaceholder:
      "AI reply akan muncul di sini setelah klik Generate Test Reply.",
    copied: "Copied",
    copy: "Copy Reply",
    success:
      "Test reply berhasil digenerate. 1 credit sudah digunakan. Review jawabannya sebelum disambungkan ke real customer conversations.",
    error: "AI reply gagal digenerate.",
    questionRequired: "Mohon tulis sample customer question dulu.",
    questionTooLong: "Sample question terlalu panjang.",
    instructionTooLong: "Extra instructions terlalu panjang.",
    characters: "characters",
    usingKnowledge: "knowledge items",
    sampleTitle: "Quick sample questions",
    sampleText: "Klik salah satu untuk test lebih cepat.",
    whyTitle: "Kenapa ini penting",
    whyText:
      "Jika jawaban AI masih lemah di sini, perbaiki Knowledge Base sebelum go live.",
    safeTest: "Safe Test",
    noCreditBalance: "Credit balance belum ditemukan.",
    includedPlanCredits: "Included plan credits",
    refreshCredits: "Refresh credits",
    oneCreditNote:
      "Setiap successful test reply generation menggunakan 1 credit.",
  },
};

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

export default function TestAIPage() {
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [question, setQuestion] = useState("");
  const [replyLanguage, setReplyLanguage] = useState("auto");
  const [tone, setTone] = useState("professional");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [reply, setReply] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [knowledgeCount, setKnowledgeCount] = useState<number | null>(null);
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

  useEffect(() => {
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!question.trim()) {
      setActionError(t.questionRequired);
      return;
    }

    if (isQuestionTooLong) {
      setActionError(t.questionTooLong);
      return;
    }

    if (isInstructionTooLong) {
      setActionError(t.instructionTooLong);
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
          customer_message: question,
          language: replyLanguage,
          tone,
          extra_instructions: extraInstructions,
          ui_language: language,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setActionError(result.error || t.error);
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
      setActionMessage(t.success);

      await loadCreditBalance();
    } catch (error) {
      const message = error instanceof Error ? error.message : t.error;
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
            {t.loading}
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
            <p className="text-xl font-black">{t.failed}</p>
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
          <div className="mb-7">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Bot className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <InfoCard
            icon={<ShieldCheck className="h-7 w-7" />}
            label={t.currentPlan}
            value={currentPlan.name}
            note={currentPlan.priceLabel}
          />

          <InfoCard
            icon={<CreditCard className="h-7 w-7" />}
            label={t.creditsLeft}
            value={
              creditsLeft === null
                ? "—"
                : creditsLeft.toLocaleString()
            }
            note={
              creditBalance
                ? `${t.creditsUsed}: ${usedCredits.toLocaleString()}`
                : t.noCreditBalance
            }
            dark
          />

          <InfoCard
            icon={<Zap className="h-7 w-7" />}
            label={t.creditCost}
            value="1 Credit"
            note={t.oneCreditNote}
          />

          <InfoCard
            icon={<MessageCircle className="h-7 w-7" />}
            label={t.business}
            value={String(
              workspace?.business_name || businessName || "Workspace"
            )}
            note="Logged-in workspace"
          />

          <InfoCard
            icon={<Sparkles className="h-7 w-7" />}
            label={t.purpose}
            value={t.safeTest}
            note={t.purposeText}
          />
        </div>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.whyTitle}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.whyText}
              </h2>

              {creditBalance ? (
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                  {t.includedPlanCredits}: {planCredits.toLocaleString()} •{" "}
                  Top-Up: {purchasedCredits.toLocaleString()} •{" "}
                  {t.creditsUsed}: {usedCredits.toLocaleString()}
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
                {t.questionTitle}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.questionText}
              </h2>
            </div>

            <form onSubmit={handleGenerate} className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.questionTitle}
                </span>

                <textarea
                  rows={7}
                  value={question}
                  maxLength={MAX_QUESTION_LENGTH + 100}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={t.questionPlaceholder}
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
                  {questionCount} / {MAX_QUESTION_LENGTH} {t.characters}
                </span>
              </label>

              <SelectInput
                label={t.language}
                value={replyLanguage}
                onChange={setReplyLanguage}
                options={languageOptions}
              />

              <SelectInput
                label={t.tone}
                value={tone}
                onChange={setTone}
                options={toneOptions}
              />

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.extraInstructions}
                </span>

                <textarea
                  rows={5}
                  value={extraInstructions}
                  maxLength={MAX_INSTRUCTION_LENGTH + 100}
                  onChange={(event) => setExtraInstructions(event.target.value)}
                  placeholder={t.extraInstructionsPlaceholder}
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
                  {instructionCount} / {MAX_INSTRUCTION_LENGTH} {t.characters}
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
                      {knowledgeCount} {t.usingKnowledge}
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
                    isGenerating || isQuestionTooLong || isInstructionTooLong
                  }
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-lg font-black text-[#07111F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xl"
                >
                  <Send className="h-6 w-6" />
                  {isGenerating
                    ? t.generating
                    : reply
                      ? getGenerateButtonLabel("Regenerate Reply", TEST_AI_CREDIT_COST)
                      : getGenerateButtonLabel("Generate Test Reply", TEST_AI_CREDIT_COST)}
                </button>

                <button
                  type="button"
                  onClick={clearTest}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-8 py-5 text-xl font-black text-[#07111F]"
                >
                  <RefreshCcw className="h-6 w-6" />
                  {t.clear}
                </button>
              </div>

              <button
                type="button"
                onClick={loadCreditBalance}
                disabled={isLoadingCredits}
                className="text-left text-sm font-black text-blue-600 disabled:opacity-50"
              >
                {isLoadingCredits ? t.loading : t.refreshCredits}
              </button>
            </form>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <MessageCircle className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.resultTitle}
              </p>
            </div>

            <textarea
              rows={16}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder={t.resultPlaceholder}
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
                {copied ? t.copied : t.copy}
              </button>
            </div>

            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
              <p className="text-lg font-black text-[#07111F]">
                {t.sampleTitle}
              </p>

              <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                {t.sampleText}
              </p>

              <div className="mt-5 grid gap-3">
                {sampleQuestions.map((sample) => (
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