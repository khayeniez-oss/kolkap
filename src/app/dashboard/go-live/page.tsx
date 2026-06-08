"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

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

type AiTestRunRow = {
  id: string;
  workspace_id: string;
  ai_staff_id: string;
  owner_user_id: string;
  customer_message: string;
  ai_response: string;
  status: string;
  created_at: string;
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

type GoLiveTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  back: string;
  refresh: string;
  currentPlan: string;
  aiStaff: string;
  aiStaffIncluded: string;
  customAIStaffLimit: string;
  creditsLeft: string;
  creditsUsed: string;
  creditUnit: string;
  creditsUnit: string;
  planCredits: string;
  topUpCredits: string;
  creditCost: string;
  goLiveStatus: string;
  whatsappStatus: string;
  selectAI: string;
  selectAIText: string;
  readiness: string;
  readinessText: string;
  creditRuleTitle: string;
  creditRuleText: string;
  websiteReplyCost: string;
  whatsappReplyCost: string;
  longerReplyNote: string;
  businessReady: string;
  aiReady: string;
  testReady: string;
  creditsReady: string;
  activePlanReady: string;
  whatsappReady: string;
  activateTitle: string;
  activateText: string;
  activateAI: string;
  activating: string;
  activated: string;
  activateFailed: string;
  cannotActivate: string;
  noAI: string;
  createAI: string;
  testAI: string;
  openSettings: string;
  selectedAI: string;
  recentTest: string;
  noTest: string;
  required: string;
  recommended: string;
  complete: string;
  needsAction: string;
  topUp: string;
  usage: string;
  billing: string;
  selectedCostNote: string;
  noCreditBalance: string;
  planNames: Record<string, string>;
  statuses: Record<string, string>;
};

const translations: Record<SupportedLanguage, GoLiveTranslation> = {
  en: {
    badge: "Go Live",
    title: "Review your AI setup before going live.",
    subtitle:
      "Check your AI staff, saved test, business details, credits, and workspace status before activating your AI.",
    loading: "Loading your go-live setup...",
    failed: "Go Live page could not load.",
    back: "Back to Dashboard",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    aiStaff: "AI Staff",
    aiStaffIncluded: "AI staff included",
    customAIStaffLimit: "Custom AI staff limit",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    creditUnit: "Credit",
    creditsUnit: "Credits",
    planCredits: "Plan credits",
    topUpCredits: "Top-Up credits",
    creditCost: "Auto-Reply Cost",
    goLiveStatus: "Go Live Status",
    whatsappStatus: "WhatsApp Status",
    selectAI: "Select AI Staff",
    selectAIText:
      "Choose which AI staff you want to activate for your business workspace.",
    readiness: "Go-Live Readiness",
    readinessText:
      "Your AI is ready when the important setup items are complete.",
    creditRuleTitle: "Important Credit Rule",
    creditRuleText:
      "When auto-reply is live, every successful AI reply uses credits. Website chat replies start from 3 credits, WhatsApp replies start from 5 credits, and longer replies may use more credits. If credits run out, auto-reply should pause until the workspace tops up or upgrades.",
    websiteReplyCost: "Website chat AI reply starts from 3 credits",
    whatsappReplyCost: "WhatsApp AI reply starts from 5 credits",
    longerReplyNote: "Longer replies may use more credits",
    businessReady: "Business details added",
    aiReady: "AI staff created",
    testReady: "AI test saved",
    creditsReady: "Credits available",
    activePlanReady: "Active plan or trial",
    whatsappReady: "WhatsApp number added",
    activateTitle: "Activate AI",
    activateText:
      "Once activated, this AI staff will be marked live in your Kolkap workspace. Auto-reply uses credits, so keep your credits topped up before going live.",
    activateAI: "Activate AI",
    activating: "Activating...",
    activated: "AI staff is now live in your workspace.",
    activateFailed: "AI staff could not be activated.",
    cannotActivate:
      "Complete the required setup items before activating your AI.",
    noAI: "No AI staff found yet.",
    createAI: "Create AI Staff",
    testAI: "Test AI",
    openSettings: "Open Settings",
    selectedAI: "Selected AI",
    recentTest: "Latest Saved Test",
    noTest:
      "No saved test found for this AI yet. Please test the AI before going live.",
    required: "Required",
    recommended: "Recommended",
    complete: "Complete",
    needsAction: "Needs action",
    topUp: "Top Up",
    usage: "Usage",
    billing: "Billing",
    selectedCostNote: "Minimum cost based on the selected AI channel",
    noCreditBalance:
      "Credit balance has not been created for this workspace yet.",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    statuses: {
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      pending: "Pending",
      not_connected: "Not connected",
      connected: "Connected",
      trial: "Trial",
      active: "Active",
      past_due: "Past Due",
      cancelled: "Cancelled",
    },
  },

  id: {
    badge: "Go Live",
    title: "Review setup AI sebelum go live.",
    subtitle:
      "Cek AI staff, test yang tersimpan, detail bisnis, kredit, dan status workspace sebelum mengaktifkan AI.",
    loading: "Memuat setup go-live Anda...",
    failed: "Halaman Go Live tidak dapat dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Muat Ulang",
    currentPlan: "Paket Saat Ini",
    aiStaff: "AI Staff",
    aiStaffIncluded: "AI staff termasuk",
    customAIStaffLimit: "Limit AI staff custom",
    creditsLeft: "Sisa Kredit",
    creditsUsed: "Kredit Terpakai",
    creditUnit: "Kredit",
    creditsUnit: "Kredit",
    planCredits: "Kredit paket",
    topUpCredits: "Kredit Top-Up",
    creditCost: "Biaya Auto-Reply",
    goLiveStatus: "Status Go Live",
    whatsappStatus: "Status WhatsApp",
    selectAI: "Pilih AI Staff",
    selectAIText:
      "Pilih AI staff yang ingin diaktifkan untuk workspace bisnis Anda.",
    readiness: "Kesiapan Go-Live",
    readinessText:
      "AI Anda siap saat bagian setup penting sudah lengkap.",
    creditRuleTitle: "Aturan Kredit Penting",
    creditRuleText:
      "Saat auto-reply live, setiap balasan AI yang berhasil menggunakan kredit. Balasan website chat mulai dari 3 kredit, balasan WhatsApp mulai dari 5 kredit, dan balasan yang lebih panjang dapat memakai lebih banyak kredit. Jika kredit habis, auto-reply harus pause sampai workspace melakukan top up atau upgrade.",
    websiteReplyCost: "Balasan AI website chat mulai dari 3 kredit",
    whatsappReplyCost: "Balasan AI WhatsApp mulai dari 5 kredit",
    longerReplyNote: "Balasan yang lebih panjang dapat memakai lebih banyak kredit",
    businessReady: "Detail bisnis sudah ditambahkan",
    aiReady: "AI staff sudah dibuat",
    testReady: "Test AI sudah disimpan",
    creditsReady: "Kredit tersedia",
    activePlanReady: "Paket aktif atau trial",
    whatsappReady: "Nomor WhatsApp sudah ditambahkan",
    activateTitle: "Aktifkan AI",
    activateText:
      "Setelah diaktifkan, AI staff ini akan ditandai live di workspace Kolkap Anda. Auto-reply menggunakan kredit, jadi pastikan kredit cukup sebelum go live.",
    activateAI: "Aktifkan AI",
    activating: "Mengaktifkan...",
    activated: "AI staff sekarang live di workspace Anda.",
    activateFailed: "AI staff tidak dapat diaktifkan.",
    cannotActivate:
      "Lengkapi setup yang dibutuhkan sebelum mengaktifkan AI.",
    noAI: "Belum ada AI staff.",
    createAI: "Buat AI Staff",
    testAI: "Test AI",
    openSettings: "Buka Settings",
    selectedAI: "AI Terpilih",
    recentTest: "Test Tersimpan Terbaru",
    noTest:
      "Belum ada test tersimpan untuk AI ini. Silakan test AI sebelum go live.",
    required: "Wajib",
    recommended: "Disarankan",
    complete: "Lengkap",
    needsAction: "Perlu dilengkapi",
    topUp: "Top Up",
    usage: "Penggunaan",
    billing: "Billing",
    selectedCostNote: "Minimum biaya berdasarkan channel AI yang dipilih",
    noCreditBalance: "Saldo kredit belum dibuat untuk workspace ini.",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    statuses: {
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      pending: "Menunggu",
      not_connected: "Belum terhubung",
      connected: "Terhubung",
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
  },

  zh: {
    badge: "Go Live",
    title: "上线前检查您的 AI 设置。",
    subtitle:
      "启用 AI 前，请检查 AI staff、已保存测试、业务资料、积分和 workspace 状态。",
    loading: "正在加载 go-live 设置...",
    failed: "Go Live 页面无法加载。",
    back: "返回 Dashboard",
    refresh: "刷新",
    currentPlan: "当前套餐",
    aiStaff: "AI Staff",
    aiStaffIncluded: "包含 AI staff",
    customAIStaffLimit: "自定义 AI staff 数量",
    creditsLeft: "剩余积分",
    creditsUsed: "已用积分",
    creditUnit: "积分",
    creditsUnit: "积分",
    planCredits: "套餐积分",
    topUpCredits: "充值积分",
    creditCost: "Auto-Reply 积分费用",
    goLiveStatus: "Go Live 状态",
    whatsappStatus: "WhatsApp 状态",
    selectAI: "选择 AI Staff",
    selectAIText: "选择您要为业务 workspace 启用的 AI staff。",
    readiness: "Go-Live 准备情况",
    readinessText: "当重要设置项目完成后，您的 AI 就可以准备上线。",
    creditRuleTitle: "重要积分规则",
    creditRuleText:
      "Auto-reply 上线后，每次成功的 AI 回复都会使用积分。Website chat AI 回复从 3 积分开始，WhatsApp AI 回复从 5 积分开始，较长回复可能会使用更多积分。如果积分用完，auto-reply 应暂停，直到 workspace top up 或升级。",
    websiteReplyCost: "Website chat AI 回复从 3 积分开始",
    whatsappReplyCost: "WhatsApp AI 回复从 5 积分开始",
    longerReplyNote: "较长回复可能会使用更多积分",
    businessReady: "业务资料已添加",
    aiReady: "AI staff 已创建",
    testReady: "AI 测试已保存",
    creditsReady: "积分可用",
    activePlanReady: "有效套餐或 trial",
    whatsappReady: "WhatsApp 号码已添加",
    activateTitle: "启用 AI",
    activateText:
      "启用后，此 AI staff 会在您的 Kolkap workspace 中标记为 live。Auto-reply 会使用积分，请确保上线前积分充足。",
    activateAI: "启用 AI",
    activating: "正在启用...",
    activated: "AI staff 现在已在您的 workspace 中 live。",
    activateFailed: "AI staff 无法启用。",
    cannotActivate: "请先完成所需设置，再启用 AI。",
    noAI: "尚未找到 AI staff。",
    createAI: "创建 AI Staff",
    testAI: "Test AI",
    openSettings: "打开 Settings",
    selectedAI: "已选择 AI",
    recentTest: "最新已保存测试",
    noTest: "此 AI 尚未保存测试。请先测试 AI，再 go live。",
    required: "必需",
    recommended: "建议",
    complete: "完成",
    needsAction: "需要处理",
    topUp: "Top Up",
    usage: "使用量",
    billing: "Billing",
    selectedCostNote: "最低积分费用会根据所选 AI 渠道显示",
    noCreditBalance: "此 workspace 尚未创建积分余额。",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    statuses: {
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      pending: "待处理",
      not_connected: "未连接",
      connected: "已连接",
      trial: "Trial",
      active: "有效",
      past_due: "逾期",
      cancelled: "已取消",
    },
  },

  ms: {
    badge: "Go Live",
    title: "Review setup AI sebelum go live.",
    subtitle:
      "Semak AI staff, test yang disimpan, detail bisnes, kredit, dan status workspace sebelum mengaktifkan AI.",
    loading: "Memuatkan setup go-live anda...",
    failed: "Halaman Go Live tidak dapat dimuatkan.",
    back: "Kembali ke Dashboard",
    refresh: "Segar Semula",
    currentPlan: "Pelan Semasa",
    aiStaff: "AI Staff",
    aiStaffIncluded: "AI staff termasuk",
    customAIStaffLimit: "Had AI staff custom",
    creditsLeft: "Baki Kredit",
    creditsUsed: "Kredit Digunakan",
    creditUnit: "Kredit",
    creditsUnit: "Kredit",
    planCredits: "Kredit pelan",
    topUpCredits: "Kredit Top-Up",
    creditCost: "Kos Auto-Reply",
    goLiveStatus: "Status Go Live",
    whatsappStatus: "Status WhatsApp",
    selectAI: "Pilih AI Staff",
    selectAIText:
      "Pilih AI staff yang anda mahu aktifkan untuk workspace bisnes anda.",
    readiness: "Kesiapan Go-Live",
    readinessText:
      "AI anda sedia apabila item setup penting sudah lengkap.",
    creditRuleTitle: "Peraturan Kredit Penting",
    creditRuleText:
      "Apabila auto-reply live, setiap balasan AI yang berjaya menggunakan kredit. Balasan website chat bermula daripada 3 kredit, balasan WhatsApp bermula daripada 5 kredit, dan balasan yang lebih panjang mungkin menggunakan lebih banyak kredit. Jika kredit habis, auto-reply harus pause sehingga workspace top up atau upgrade.",
    websiteReplyCost: "Balasan AI website chat bermula daripada 3 kredit",
    whatsappReplyCost: "Balasan AI WhatsApp bermula daripada 5 kredit",
    longerReplyNote: "Balasan yang lebih panjang mungkin menggunakan lebih banyak kredit",
    businessReady: "Detail bisnes sudah ditambah",
    aiReady: "AI staff sudah dibuat",
    testReady: "Test AI sudah disimpan",
    creditsReady: "Kredit tersedia",
    activePlanReady: "Pelan aktif atau trial",
    whatsappReady: "Nombor WhatsApp sudah ditambah",
    activateTitle: "Aktifkan AI",
    activateText:
      "Selepas diaktifkan, AI staff ini akan ditanda live dalam workspace Kolkap anda. Auto-reply menggunakan kredit, jadi pastikan kredit mencukupi sebelum go live.",
    activateAI: "Aktifkan AI",
    activating: "Mengaktifkan...",
    activated: "AI staff kini live dalam workspace anda.",
    activateFailed: "AI staff tidak dapat diaktifkan.",
    cannotActivate:
      "Lengkapkan setup yang diperlukan sebelum mengaktifkan AI.",
    noAI: "Belum ada AI staff.",
    createAI: "Cipta AI Staff",
    testAI: "Test AI",
    openSettings: "Buka Settings",
    selectedAI: "AI Dipilih",
    recentTest: "Test Tersimpan Terkini",
    noTest:
      "Belum ada test tersimpan untuk AI ini. Sila test AI sebelum go live.",
    required: "Wajib",
    recommended: "Disarankan",
    complete: "Lengkap",
    needsAction: "Perlu dilengkapkan",
    topUp: "Top Up",
    usage: "Penggunaan",
    billing: "Billing",
    selectedCostNote: "Kos minimum berdasarkan channel AI yang dipilih",
    noCreditBalance: "Baki kredit belum dibuat untuk workspace ini.",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    statuses: {
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      pending: "Menunggu",
      not_connected: "Belum bersambung",
      connected: "Bersambung",
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
}

function statusLabel(
  statuses: Record<string, string>,
  value: string | null | undefined
) {
  if (!value) return statuses.pending;
  return statuses[value] || value;
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
  t: GoLiveTranslation
) {
  if (!planKey) return fallback;
  return t.planNames[planKey] || fallback;
}

function getAIStaffLimitLabel(
  plan: ReturnType<typeof getKolkapPlan>,
  t: GoLiveTranslation
) {
  if (plan.aiStaffLimit === "custom") {
    return t.customAIStaffLimit;
  }

  return `${plan.aiStaffLimit} ${t.aiStaffIncluded}`;
}

function getAutoReplyMinimumCredits(channel?: string | null) {
  const normalized = String(channel || "").toLowerCase();

  if (normalized.includes("whatsapp")) return 5;

  return 3;
}

function getAutoReplyCostLabel(
  channel: string | null | undefined,
  t: GoLiveTranslation
) {
  const credits = getAutoReplyMinimumCredits(channel);

  return `${credits} ${t.creditsUnit}`;
}

function getAutoReplyCostNote(
  channel: string | null | undefined,
  t: GoLiveTranslation
) {
  const normalized = String(channel || "").toLowerCase();

  if (normalized.includes("whatsapp")) {
    return t.whatsappReplyCost;
  }

  return t.websiteReplyCost;
}

export default function GoLivePage() {
  const { language } = useKolkapLanguage();
  const activeLanguage = getSupportedLanguage(language);
  const t = translations[activeLanguage];

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);
  const currentPlanName = localizePlanName(
    workspaceState.planKey,
    currentPlan.name,
    t
  );

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [testRuns, setTestRuns] = useState<AiTestRunRow[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );

  const [selectedAiStaffId, setSelectedAiStaffId] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isActivating, setIsActivating] = useState(false);
  const [activateMessage, setActivateMessage] = useState("");
  const [activateError, setActivateError] = useState("");

  const creditsLeft = getCreditsLeft(creditBalance);
  const usedCredits = Number(creditBalance?.used_credits || 0);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const totalCredits = planCredits + purchasedCredits;

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!workspace) return;

      setIsLoadingData(true);
      setDataError("");

      const supabase = createClient();

      const [aiStaffResult, testRunsResult, creditResult] = await Promise.all([
        supabase
          .from("ai_staff")
          .select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("ai_test_runs")
          .select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("workspace_credit_balances")
          .select("*")
          .eq("workspace_id", workspace.id)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      const firstError =
        aiStaffResult.error || testRunsResult.error || creditResult.error;

      if (firstError) {
        setDataError(firstError.message);
        setIsLoadingData(false);
        return;
      }

      const aiRows = (aiStaffResult.data ?? []) as AiStaffRow[];
      const runRows = (testRunsResult.data ?? []) as AiTestRunRow[];

      const aiIdFromUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("ai")
          : "";

      const matchedAiId =
        aiIdFromUrl && aiRows.some((staff) => staff.id === aiIdFromUrl)
          ? aiIdFromUrl
          : "";

      const liveAi = aiRows.find((staff) => staff.status === "live");
      const testingAi = aiRows.find((staff) => staff.status === "testing");

      setAiStaffRows(aiRows);
      setTestRuns(runRows);
      setCreditBalance((creditResult.data ?? null) as CreditBalanceRow | null);

      if (aiRows.length > 0) {
        setSelectedAiStaffId(
          matchedAiId || liveAi?.id || testingAi?.id || aiRows[0].id
        );
      }

      setIsLoadingData(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [workspace, reloadKey]);

  const selectedAiStaff = useMemo(
    () => aiStaffRows.find((staff) => staff.id === selectedAiStaffId) ?? null,
    [aiStaffRows, selectedAiStaffId]
  );

  const selectedAiLatestTest = useMemo(() => {
    if (!selectedAiStaff) return null;

    return (
      testRuns.find((run) => run.ai_staff_id === selectedAiStaff.id) ?? null
    );
  }, [testRuns, selectedAiStaff]);

  const hasBusinessDetails = Boolean(
    workspace?.business_name && workspace?.business_type
  );
  const hasAiStaff = Boolean(selectedAiStaff);
  const hasSavedTest = Boolean(selectedAiLatestTest);
  const hasCredits = Number(creditsLeft || 0) > 0;
  const hasCreditBalance = Boolean(creditBalance);
  const hasActivePlan =
    workspaceState.status === "trial" || workspaceState.status === "active";
  const hasWhatsappNumber = Boolean(workspace?.whatsapp_number);

  const selectedAutoReplyCostLabel = getAutoReplyCostLabel(
    selectedAiStaff?.channel,
    t
  );
  const selectedAutoReplyCostNote = getAutoReplyCostNote(
    selectedAiStaff?.channel,
    t
  );

  const requiredReady =
    hasBusinessDetails &&
    hasAiStaff &&
    hasSavedTest &&
    hasCredits &&
    hasCreditBalance &&
    hasActivePlan;

  const checklist = [
    {
      label: t.activePlanReady,
      ready: hasActivePlan,
      type: t.required,
      actionHref: "/dashboard/billing",
      actionLabel: t.billing,
    },
    {
      label: t.businessReady,
      ready: hasBusinessDetails,
      type: t.required,
      actionHref: "/dashboard/settings",
      actionLabel: t.openSettings,
    },
    {
      label: t.aiReady,
      ready: hasAiStaff,
      type: t.required,
      actionHref: "/dashboard/create-ai",
      actionLabel: t.createAI,
    },
    {
      label: t.testReady,
      ready: hasSavedTest,
      type: t.required,
      actionHref: selectedAiStaff
        ? `/dashboard/test-ai?ai=${selectedAiStaff.id}`
        : "/dashboard/test-ai",
      actionLabel: t.testAI,
    },
    {
      label: t.creditsReady,
      ready: hasCredits && hasCreditBalance,
      type: t.required,
      actionHref: "/dashboard/top-up",
      actionLabel: t.topUp,
    },
    {
      label: t.whatsappReady,
      ready: hasWhatsappNumber,
      type: t.recommended,
      actionHref: "/dashboard/settings",
      actionLabel: t.openSettings,
    },
  ];

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlanName,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.aiStaff,
      value: `${aiStaffRows.length}`,
      note: getAIStaffLimitLabel(currentPlan, t),
      icon: Bot,
    },
    {
      label: t.creditsLeft,
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `${t.creditsUsed}: ${usedCredits.toLocaleString()}`
        : t.noCreditBalance,
      icon: CreditCard,
      dark: true,
    },
    {
      label: t.creditCost,
      value: selectedAutoReplyCostLabel,
      note: selectedAutoReplyCostNote,
      icon: Zap,
    },
    {
      label: t.goLiveStatus,
      value: statusLabel(t.statuses, workspaceState.goLiveStatus),
      note: statusLabel(t.statuses, workspaceState.whatsappStatus),
      icon: ShieldCheck,
    },
  ];

  async function handleActivate() {
    setActivateMessage("");
    setActivateError("");

    if (!workspace || !selectedAiStaff || !requiredReady) {
      setActivateError(t.cannotActivate);
      return;
    }

    setIsActivating(true);

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error: aiError } = await supabase
      .from("ai_staff")
      .update({
        status: "live",
        updated_at: now,
      })
      .eq("id", selectedAiStaff.id);

    if (aiError) {
      setActivateError(aiError.message || t.activateFailed);
      setIsActivating(false);
      return;
    }

    const { error: workspaceError } = await supabase
      .from("business_workspaces")
      .update({
        go_live_status: "live",
        live_ai_staff_id: selectedAiStaff.id,
        go_live_activated_at: now,
        updated_at: now,
      })
      .eq("id", workspace.id);

    if (workspaceError) {
      setActivateError(workspaceError.message || t.activateFailed);
      setIsActivating(false);
      return;
    }

    setAiStaffRows((current) =>
      current.map((staff) =>
        staff.id === selectedAiStaff.id
          ? { ...staff, status: "live", updated_at: now }
          : staff
      )
    );

    setActivateMessage(t.activated);
    setIsActivating(false);
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
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>

            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
              {t.refresh}
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Rocket className="h-5 w-5" />
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

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Zap className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.creditRuleTitle}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.creditRuleText}
              </h2>

              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-lg font-black text-[#7CFF3D]">
                    {t.websiteReplyCost}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-lg font-black text-[#7CFF3D]">
                    {t.whatsappReplyCost}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-lg font-black text-[#7CFF3D]">
                    {t.longerReplyNote}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Link
                  href="/dashboard/usage"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white"
                >
                  <BarChart3 className="h-5 w-5" />
                  {t.usage}
                </Link>

                <Link
                  href="/dashboard/top-up"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-base font-black text-[#07111F]"
                >
                  <WalletCards className="h-5 w-5" />
                  {t.topUp}
                </Link>

                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white"
                >
                  <CreditCard className="h-5 w-5" />
                  {t.billing}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {isLoadingData ? (
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            {t.loading}
          </div>
        ) : dataError ? (
          <div className="rounded-[2.2rem] border border-red-200 bg-red-50 p-8 text-xl font-black text-red-700">
            {dataError}
          </div>
        ) : aiStaffRows.length === 0 ? (
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Bot className="h-8 w-8" />
            </div>

            <h2 className="text-4xl font-black tracking-[-0.05em]">
              {t.noAI}
            </h2>

            <Link
              href="/dashboard/create-ai"
              className="mt-7 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white"
            >
              {t.createAI}
              <ArrowRight className="h-6 w-6" />
            </Link>
          </section>
        ) : (
          <>
            <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Bot className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.selectAI}
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  {t.selectAIText}
                </h2>

                <div className="mt-8 grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.aiStaff}
                    </span>

                    <select
                      value={selectedAiStaffId}
                      onChange={(event) => {
                        setSelectedAiStaffId(event.target.value);
                        setActivateMessage("");
                        setActivateError("");
                      }}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    >
                      {aiStaffRows.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} — {staff.role}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedAiStaff ? (
                    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                        {t.selectedAI}
                      </p>

                      <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                        {selectedAiStaff.name}
                      </h3>

                      <p className="mt-2 text-lg font-semibold leading-8 text-slate-600">
                        {selectedAiStaff.role} • {selectedAiStaff.channel} •{" "}
                        {selectedAiStaff.reply_tone}
                      </p>

                      <p className="mt-4 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]">
                        {statusLabel(t.statuses, selectedAiStaff.status)}
                      </p>

                      <p className="mt-4 rounded-2xl bg-white p-4 text-base font-black leading-7 text-slate-700">
                        {t.selectedCostNote}: {selectedAutoReplyCostLabel}
                      </p>
                    </div>
                  ) : null}

                  <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                      {t.recentTest}
                    </p>

                    {selectedAiLatestTest ? (
                      <>
                        <p className="mt-3 text-lg font-semibold leading-8 text-slate-700">
                          {selectedAiLatestTest.customer_message}
                        </p>

                        <p className="mt-3 flex items-center gap-2 text-sm font-black text-slate-500">
                          <Clock3 className="h-4 w-4" />
                          {new Date(
                            selectedAiLatestTest.created_at
                          ).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="mt-3 text-lg font-black leading-8 text-amber-700">
                        {t.noTest}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <ShieldCheck className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.readiness}
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  {t.readinessText}
                </h2>

                <div className="mt-8 grid gap-4">
                  {checklist.map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            item.ready
                              ? "bg-[#07111F] text-[#7CFF3D]"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.ready ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <CircleAlert className="h-6 w-6" />
                          )}
                        </div>

                        <div>
                          <p className="text-xl font-black">{item.label}</p>
                          <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                            {item.type} •{" "}
                            {item.ready ? t.complete : t.needsAction}
                          </p>
                        </div>
                      </div>

                      {!item.ready ? (
                        <Link
                          href={item.actionHref}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
                        >
                          {item.actionLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                    <Rocket className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                    {t.activateTitle}
                  </p>

                  <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                    {t.activateText}
                  </h2>

                  <p className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5 text-base font-semibold leading-8 text-slate-300">
                    {t.selectedCostNote}: {selectedAutoReplyCostLabel} •{" "}
                    {t.planCredits}: {totalCredits.toLocaleString()} •{" "}
                    {creditsLeft === null
                      ? t.noCreditBalance
                      : `${t.creditsLeft}: ${creditsLeft.toLocaleString()}`}
                  </p>

                  {activateMessage ? (
                    <p className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5 text-lg font-black text-green-800">
                      {activateMessage}
                    </p>
                  ) : null}

                  {activateError ? (
                    <p className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-lg font-black text-red-700">
                      {activateError}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={isActivating || !requiredReady}
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Rocket className="h-6 w-6" />
                    {isActivating ? t.activating : t.activateAI}
                  </button>

                  {selectedAiStaff ? (
                    <Link
                      href={`/dashboard/test-ai?ai=${selectedAiStaff.id}`}
                      className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
                    >
                      {t.testAI}
                      <ArrowRight className="h-6 w-6" />
                    </Link>
                  ) : null}

                  <Link
                    href="/dashboard/top-up"
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
                  >
                    {t.topUp}
                    <ArrowRight className="h-6 w-6" />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}