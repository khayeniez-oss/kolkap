"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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
  getKolkapPlan,
  KOLKAP_AI_GENERATION_MIN_CREDITS,
} from "@/lib/kolkapPlan";
import { createClient } from "@/lib/supabase/client";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const MAX_QUESTION_LENGTH = 1200;
const MAX_INSTRUCTION_LENGTH = 1200;
const TEST_AI_CREDIT_COST = KOLKAP_AI_GENERATION_MIN_CREDITS;

type SupportedLanguage = "en" | "id" | "zh" | "ms";

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

type TestAITranslation = {
  loading: string;
  failed: string;
  back: string;
  badge: string;
  title: string;
  subtitle: string;
  currentPlan: string;
  creditsLeft: string;
  creditsUsed: string;
  creditCost: string;
  creditUnit: string;
  business: string;
  workspaceFallback: string;
  workspaceNote: string;
  purpose: string;
  purposeText: string;
  questionTitle: string;
  questionText: string;
  questionPlaceholder: string;
  language: string;
  tone: string;
  extraInstructions: string;
  extraInstructionsPlaceholder: string;
  generate: string;
  generateForCredit: string;
  regenerateForCredit: string;
  generating: string;
  clear: string;
  resultTitle: string;
  resultPlaceholder: string;
  copied: string;
  copy: string;
  success: string;
  error: string;
  questionRequired: string;
  questionTooLong: string;
  instructionTooLong: string;
  characters: string;
  usingKnowledge: string;
  sampleTitle: string;
  sampleText: string;
  whyTitle: string;
  whyText: string;
  safeTest: string;
  noCreditBalance: string;
  includedPlanCredits: string;
  topUpCredits: string;
  refreshCredits: string;
  creditCostNote: string;
  planNames: Record<string, string>;
  languageLabels: Record<string, string>;
  toneLabels: Record<string, string>;
  sampleQuestions: string[];
};

const languageValues = ["auto", "en", "id", "ms", "zh"];

const toneValues = [
  "professional",
  "friendly",
  "sales",
  "simple",
  "formal",
  "helpful",
];

const translations: Record<SupportedLanguage, TestAITranslation> = {
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
    creditUnit: "Credits",
    business: "Business",
    workspaceFallback: "Workspace",
    workspaceNote: "Logged-in workspace",
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
    generateForCredit: "Test AI for 3 Credits",
    regenerateForCredit: "Test Again for 3 Credits",
    generating: "Generating...",
    clear: "Clear",
    resultTitle: "AI Test Reply",
    resultPlaceholder:
      "The AI reply will appear here after you click Test AI for 3 Credits.",
    copied: "Copied",
    copy: "Copy Reply",
    success:
      "Test reply generated. 3 credits have been used. Review the answer before connecting it to real customer conversations.",
    error: "AI reply could not be generated.",
    questionRequired: "Please write a sample customer question first.",
    questionTooLong: "Sample question is too long.",
    instructionTooLong: "Extra instructions are too long.",
    characters: "characters",
    usingKnowledge: "knowledge item(s)",
    sampleTitle: "Quick sample questions",
    sampleText: "Click one to test faster.",
    whyTitle: "Why this matters",
    whyText:
      "If the AI gives weak answers here, fix your Knowledge Base before going live.",
    safeTest: "Safe Test",
    noCreditBalance: "Credit balance not found yet.",
    includedPlanCredits: "Included plan credits",
    topUpCredits: "Top-Up credits",
    refreshCredits: "Refresh credits",
    creditCostNote: "Every successful test reply generation uses 3 credits.",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    languageLabels: {
      auto: "Auto Detect",
      en: "English",
      id: "Indonesian",
      ms: "Malay",
      zh: "Chinese",
    },
    toneLabels: {
      professional: "Professional",
      friendly: "Friendly",
      sales: "Sales",
      simple: "Simple",
      formal: "Formal",
      helpful: "Helpful",
    },
    sampleQuestions: [
      "What services do you offer?",
      "How much is your price?",
      "How can I contact your team?",
      "Can I speak with a human?",
      "Where is your business located?",
    ],
  },

  id: {
    loading: "Memuat Test AI...",
    failed: "Test AI tidak dapat dimuat.",
    back: "Kembali ke Dashboard",
    badge: "Test AI",
    title: "Tes AI Anda sebelum dilihat customer.",
    subtitle:
      "Tulis contoh pertanyaan customer dan cek apakah Kolkap AI Brain menjawab dengan benar menggunakan business profile dan Knowledge Base Anda.",
    currentPlan: "Paket Saat Ini",
    creditsLeft: "Sisa Kredit",
    creditsUsed: "Kredit Terpakai",
    creditCost: "Biaya Kredit",
    creditUnit: "Kredit",
    business: "Bisnis",
    workspaceFallback: "Workspace",
    workspaceNote: "Workspace yang sedang login",
    purpose: "Tujuan",
    purposeText:
      "Halaman ini hanya untuk testing aman. Ini tidak mengirim balasan ke customer asli.",
    questionTitle: "Contoh Pertanyaan Customer",
    questionText:
      "Tulis pertanyaan seperti customer asli. AI akan menjawab menggunakan bisnis yang sedang login dan Knowledge Base Anda.",
    questionPlaceholder:
      "Contoh: Layanan apa yang Anda tawarkan dan bagaimana cara menghubungi tim Anda?",
    language: "Bahasa Balasan",
    tone: "Tone Balasan",
    extraInstructions: "Instruksi Test Tambahan",
    extraInstructionsPlaceholder:
      "Opsional: Beri instruksi khusus, seperti jawab singkat, sebutkan WhatsApp, atau jelaskan step by step.",
    generate: "Buat Balasan Test",
    generateForCredit: "Tes AI untuk 3 Kredit",
    regenerateForCredit: "Tes Ulang untuk 3 Kredit",
    generating: "Membuat...",
    clear: "Bersihkan",
    resultTitle: "Balasan Test AI",
    resultPlaceholder:
      "Balasan AI akan muncul di sini setelah Anda klik Tes AI untuk 3 Kredit.",
    copied: "Copied",
    copy: "Copy Balasan",
    success:
      "Balasan test berhasil dibuat. 3 kredit sudah digunakan. Review jawabannya sebelum disambungkan ke percakapan customer asli.",
    error: "Balasan AI tidak dapat dibuat.",
    questionRequired: "Mohon tulis contoh pertanyaan customer terlebih dahulu.",
    questionTooLong: "Contoh pertanyaan terlalu panjang.",
    instructionTooLong: "Instruksi tambahan terlalu panjang.",
    characters: "karakter",
    usingKnowledge: "knowledge item",
    sampleTitle: "Contoh pertanyaan cepat",
    sampleText: "Klik salah satu untuk tes lebih cepat.",
    whyTitle: "Kenapa ini penting",
    whyText:
      "Jika jawaban AI masih lemah di sini, perbaiki Knowledge Base sebelum go live.",
    safeTest: "Test Aman",
    noCreditBalance: "Saldo kredit belum ditemukan.",
    includedPlanCredits: "Kredit termasuk paket",
    topUpCredits: "Kredit Top-Up",
    refreshCredits: "Muat ulang kredit",
    creditCostNote:
      "Setiap balasan test yang berhasil dibuat menggunakan 3 kredit.",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    languageLabels: {
      auto: "Auto Detect",
      en: "English",
      id: "Indonesian",
      ms: "Malay",
      zh: "Chinese",
    },
    toneLabels: {
      professional: "Professional",
      friendly: "Friendly",
      sales: "Sales",
      simple: "Simple",
      formal: "Formal",
      helpful: "Helpful",
    },
    sampleQuestions: [
      "Layanan apa yang Anda tawarkan?",
      "Berapa harganya?",
      "Bagaimana cara menghubungi tim Anda?",
      "Bisa bicara dengan manusia?",
      "Di mana lokasi bisnis Anda?",
    ],
  },

  zh: {
    loading: "正在加载 Test AI...",
    failed: "Test AI 无法加载。",
    back: "返回 Dashboard",
    badge: "Test AI",
    title: "在客户看到之前先测试您的 AI。",
    subtitle:
      "输入客户可能会问的问题，并检查 Kolkap AI Brain 是否能根据您的 business profile 和 Knowledge Base 正确回答。",
    currentPlan: "当前套餐",
    creditsLeft: "剩余积分",
    creditsUsed: "已用积分",
    creditCost: "积分费用",
    creditUnit: "积分",
    business: "业务",
    workspaceFallback: "Workspace",
    workspaceNote: "当前登录的 workspace",
    purpose: "用途",
    purposeText:
      "此页面仅用于安全测试。它不会把回复发送给真实客户。",
    questionTitle: "客户问题示例",
    questionText:
      "写一个真实客户可能会问的问题。AI 会使用当前登录的业务资料和 Knowledge Base 来回答。",
    questionPlaceholder:
      "例：你们提供什么服务？我要如何联系你们的团队？",
    language: "回复语言",
    tone: "回复语气",
    extraInstructions: "额外测试指令",
    extraInstructionsPlaceholder:
      "可选：告诉 AI 需要注意什么，例如保持简短、提到 WhatsApp，或一步一步解释。",
    generate: "生成测试回复",
    generateForCredit: "用 3 积分测试 AI",
    regenerateForCredit: "用 3 积分再次测试",
    generating: "正在生成...",
    clear: "清除",
    resultTitle: "AI 测试回复",
    resultPlaceholder:
      "点击用 3 积分测试 AI 后，AI 回复会显示在这里。",
    copied: "已复制",
    copy: "复制回复",
    success:
      "测试回复已生成。已使用 3 积分。连接到真实客户对话前，请先检查答案。",
    error: "无法生成 AI 回复。",
    questionRequired: "请先填写客户问题示例。",
    questionTooLong: "客户问题示例太长。",
    instructionTooLong: "额外指令太长。",
    characters: "字符",
    usingKnowledge: "个 knowledge item",
    sampleTitle: "快速示例问题",
    sampleText: "点击一个问题，可以更快测试。",
    whyTitle: "为什么这很重要",
    whyText:
      "如果 AI 在这里回答得不够好，请先完善 Knowledge Base，然后再 go live。",
    safeTest: "安全测试",
    noCreditBalance: "尚未找到积分余额。",
    includedPlanCredits: "套餐包含积分",
    topUpCredits: "充值积分",
    refreshCredits: "刷新积分",
    creditCostNote: "每次成功生成测试回复会使用 3 积分。",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    languageLabels: {
      auto: "自动识别",
      en: "英语",
      id: "印尼语",
      ms: "马来语",
      zh: "中文",
    },
    toneLabels: {
      professional: "专业",
      friendly: "友好",
      sales: "销售",
      simple: "简单",
      formal: "正式",
      helpful: "有帮助",
    },
    sampleQuestions: [
      "你们提供什么服务？",
      "价格是多少？",
      "我要如何联系你们的团队？",
      "我可以和真人沟通吗？",
      "你们的业务在哪里？",
    ],
  },

  ms: {
    loading: "Memuatkan Test AI...",
    failed: "Test AI tidak dapat dimuatkan.",
    back: "Kembali ke Dashboard",
    badge: "Test AI",
    title: "Test AI anda sebelum pelanggan melihatnya.",
    subtitle:
      "Tulis contoh soalan pelanggan dan semak sama ada Kolkap AI Brain menjawab dengan betul menggunakan business profile dan Knowledge Base anda.",
    currentPlan: "Pelan Semasa",
    creditsLeft: "Baki Kredit",
    creditsUsed: "Kredit Digunakan",
    creditCost: "Kos Kredit",
    creditUnit: "Kredit",
    business: "Bisnes",
    workspaceFallback: "Workspace",
    workspaceNote: "Workspace yang sedang login",
    purpose: "Tujuan",
    purposeText:
      "Halaman ini hanya untuk testing selamat. Ia tidak menghantar balasan kepada pelanggan sebenar.",
    questionTitle: "Contoh Soalan Pelanggan",
    questionText:
      "Tulis soalan seperti pelanggan sebenar. AI akan menjawab menggunakan bisnes yang sedang login dan Knowledge Base anda.",
    questionPlaceholder:
      "Contoh: Apakah servis yang anda tawarkan dan bagaimana saya boleh hubungi team anda?",
    language: "Bahasa Balasan",
    tone: "Tone Balasan",
    extraInstructions: "Arahan Test Tambahan",
    extraInstructionsPlaceholder:
      "Opsional: Beri arahan khas, seperti jawab pendek, sebut WhatsApp, atau jelaskan step by step.",
    generate: "Jana Balasan Test",
    generateForCredit: "Test AI untuk 3 Kredit",
    regenerateForCredit: "Test Semula untuk 3 Kredit",
    generating: "Menjana...",
    clear: "Kosongkan",
    resultTitle: "Balasan Test AI",
    resultPlaceholder:
      "Balasan AI akan muncul di sini selepas anda klik Test AI untuk 3 Kredit.",
    copied: "Copied",
    copy: "Copy Balasan",
    success:
      "Balasan test berjaya dijana. 3 kredit sudah digunakan. Review jawapan sebelum disambungkan kepada perbualan pelanggan sebenar.",
    error: "Balasan AI tidak dapat dijana.",
    questionRequired: "Sila tulis contoh soalan pelanggan dahulu.",
    questionTooLong: "Contoh soalan terlalu panjang.",
    instructionTooLong: "Arahan tambahan terlalu panjang.",
    characters: "aksara",
    usingKnowledge: "knowledge item",
    sampleTitle: "Contoh soalan cepat",
    sampleText: "Klik salah satu untuk test lebih cepat.",
    whyTitle: "Kenapa ini penting",
    whyText:
      "Jika jawapan AI masih lemah di sini, perbaiki Knowledge Base sebelum go live.",
    safeTest: "Test Selamat",
    noCreditBalance: "Baki kredit belum dijumpai.",
    includedPlanCredits: "Kredit termasuk pelan",
    topUpCredits: "Kredit Top-Up",
    refreshCredits: "Segar semula kredit",
    creditCostNote:
      "Setiap balasan test yang berjaya dijana menggunakan 3 kredit.",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    languageLabels: {
      auto: "Auto Detect",
      en: "English",
      id: "Indonesian",
      ms: "Malay",
      zh: "Chinese",
    },
    toneLabels: {
      professional: "Professional",
      friendly: "Friendly",
      sales: "Sales",
      simple: "Simple",
      formal: "Formal",
      helpful: "Helpful",
    },
    sampleQuestions: [
      "Apakah servis yang anda tawarkan?",
      "Berapa harga anda?",
      "Bagaimana saya boleh hubungi team anda?",
      "Boleh saya bercakap dengan manusia?",
      "Di mana lokasi bisnes anda?",
    ],
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
}

function getOptions(values: string[], labels: Record<string, string>): Option[] {
  return values.map((value) => ({
    value,
    label: labels[value] || value,
  }));
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

function localizePlanName(
  planKey: string | null | undefined,
  fallback: string,
  t: TestAITranslation
) {
  if (!planKey) return fallback;
  return t.planNames[planKey] || fallback;
}

export default function TestAIPage() {
  const { language } = useKolkapLanguage();
  const activeLanguage = getSupportedLanguage(language);
  const t = translations[activeLanguage];

  const languageOptions = useMemo(
    () => getOptions(languageValues, t.languageLabels),
    [t.languageLabels]
  );

  const toneOptions = useMemo(
    () => getOptions(toneValues, t.toneLabels),
    [t.toneLabels]
  );

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);
  const currentPlanName = localizePlanName(
    workspaceState.planKey,
    currentPlan.name,
    t
  );

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
          ui_language: activeLanguage,
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
            value={currentPlanName}
            note={currentPlan.priceLabel}
          />

          <InfoCard
            icon={<CreditCard className="h-7 w-7" />}
            label={t.creditsLeft}
            value={creditsLeft === null ? "—" : creditsLeft.toLocaleString()}
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
            value={`${TEST_AI_CREDIT_COST} ${t.creditUnit}`}
            note={t.creditCostNote}
          />

          <InfoCard
            icon={<MessageCircle className="h-7 w-7" />}
            label={t.business}
            value={String(
              workspace?.business_name || businessName || t.workspaceFallback
            )}
            note={t.workspaceNote}
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
                  {t.topUpCredits}: {purchasedCredits.toLocaleString()} •{" "}
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
                      ? t.regenerateForCredit
                      : t.generateForCredit}
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
                {t.sampleQuestions.map((sample) => (
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