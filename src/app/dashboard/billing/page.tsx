"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  getPlanTeamMemberLabel,
  kolkapTopUpPackages,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

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

type WorkspaceBillingRecord = {
  id?: string;
  subscription_cancel_at?: string | null;
  subscription_cancelled_at?: string | null;
  billing_current_period_end?: string | null;
  trial_ends_at?: string | null;
  plan_status?: string | null;
  billing_status?: string | null;
};

type BillingTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  back: string;
  refresh: string;
  currentPlan: string;
  planStatus: string;
  creditsLeft: string;
  creditsUsed: string;
  planCredits: string;
  topUpCredits: string;
  aiStaffLimit: string;
  teamLimit: string;
  trialDaysLeft: string;
  billingSummary: string;
  billingSummaryText: string;
  trialTitle: string;
  trialText: string;
  availablePlans: string;
  availablePlansText: string;
  topUpTitle: string;
  topUpText: string;
  invoices: string;
  invoicesText: string;
  upgradePlan: string;
  startTrial: string;
  contactUs: string;
  current: string;
  comingSoon: string;
  invoiceNotReady: string;
  billingPeriod: string;
  paymentNeeded: string;
  noChargeToday: string;
  autoBilling: string;
  noCreditBalance: string;
  includedMonthly: string;
  purchasedExtra: string;
  usedFromBalance: string;
  remainingBalance: string;
  creditWord: string;
  creditGuideTitle: string;
  creditGuideText: string;
  creditRules: [string, string][];
  managePlanTitle: string;
  managePlanText: string;
  keepBuildingTitle: string;
  keepBuildingText: string;
  continueWithKolkap: string;
  cancellationHelpTitle: string;
  cancellationHelpText: string;
  cancelTrial: string;
  cancelSubscription: string;
  cancelling: string;
  cancelScheduledTitle: string;
  cancelScheduledText: string;
  cancelConfirmTitle: string;
  cancelConfirmText: string;
  keepPlan: string;
  confirmCancel: string;
  cancelErrorTitle: string;
  cancelSuccess: string;
  cancelledAt: string;
  noActiveSubscription: string;
  statusLabels: Record<string, string>;
};

const supportedLanguages: SupportedLanguage[] = ["en", "id", "zh", "ms"];

const publicPlanKeys: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
];

const translations: Record<SupportedLanguage, BillingTranslation> = {
  en: {
    badge: "Billing",
    title: "Manage your Kolkap plan, trial, and credits.",
    subtitle:
      "View your current plan, trial status, monthly credits, top-up credits, billing details, and upgrade options.",
    loading: "Loading your billing details...",
    failed: "Billing could not load.",
    back: "Back to Dashboard",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    planStatus: "Plan Status",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    planCredits: "Plan Credits",
    topUpCredits: "Top-Up Credits",
    aiStaffLimit: "AI Staff Limit",
    teamLimit: "Team Limit",
    trialDaysLeft: "Trial Days Left",
    billingSummary: "Billing Summary",
    billingSummaryText:
      "Your billing page shows your active package, trial details, credits, and account status.",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method needed to activate your trial. You won’t be charged today. Monthly billing starts after the trial unless cancelled before the trial ends.",
    availablePlans: "Available Plans",
    availablePlansText:
      "Choose a package based on how many AI staff, team members, and monthly credits your business needs.",
    topUpTitle: "Top-Up Credit Packages",
    topUpText:
      "Use top-up credits when your business needs extra AI replies or content generations before the next billing cycle.",
    invoices: "Invoices",
    invoicesText:
      "Your payment history and invoices will appear here once billing is activated.",
    upgradePlan: "Upgrade Plan",
    startTrial: "Start 7-Day Trial",
    contactUs: "Contact Us",
    current: "Current",
    comingSoon: "Coming soon",
    invoiceNotReady:
      "Invoices will be available after your first paid subscription or credit top-up.",
    billingPeriod: "Billing Period",
    paymentNeeded: "Payment method needed",
    noChargeToday: "No charge today",
    autoBilling: "Monthly billing starts after trial unless cancelled.",
    noCreditBalance: "Credit balance has not been created for this workspace yet.",
    includedMonthly: "Included monthly credits",
    purchasedExtra: "Purchased extra credits",
    usedFromBalance: "Used from balance",
    remainingBalance: "Remaining balance",
    creditWord: "credits",
    creditGuideTitle: "How Credits Are Used",
    creditGuideText:
      "Kolkap uses credits only when AI successfully generates or sends output.",
    creditRules: [
      ["Test AI Reply", "3 credits"],
      ["Inbox AI Reply", "3 credits"],
      ["Content Studio Generation", "5 credits"],
      ["Website Chat AI Reply", "from 3 credits"],
      ["WhatsApp AI Reply", "from 5 credits"],
      ["Longer replies / campaign content", "more credits"],
    ],
    managePlanTitle: "Manage Your Plan",
    managePlanText:
      "You are always in control of your Kolkap plan. You can keep building, upgrade when you need more capacity, or schedule cancellation before the next billing period.",
    keepBuildingTitle: "Keep building with Kolkap",
    keepBuildingText:
      "Your AI staff, inbox, leads, knowledge base, and credit history stay inside your workspace so your business can continue smoothly.",
    continueWithKolkap: "Continue with Kolkap",
    cancellationHelpTitle: "Need to stop your plan?",
    cancellationHelpText:
      "You can schedule cancellation anytime. Your workspace remains available until the current trial or billing period ends.",
    cancelTrial: "Schedule Trial Cancellation",
    cancelSubscription: "Schedule Subscription Cancellation",
    cancelling: "Scheduling cancellation...",
    cancelScheduledTitle: "Cancellation Scheduled",
    cancelScheduledText:
      "Your Kolkap access remains available until the current trial or billing period ends. You will not be charged again after cancellation takes effect.",
    cancelConfirmTitle: "Confirm Cancellation",
    cancelConfirmText:
      "Do you want to schedule cancellation for this plan? You can still use Kolkap until the current trial or billing period ends.",
    keepPlan: "Keep My Plan",
    confirmCancel: "Yes, Schedule Cancellation",
    cancelErrorTitle: "Cancellation failed",
    cancelSuccess:
      "Cancellation has been scheduled. You can continue using Kolkap until the trial or billing period ends.",
    cancelledAt: "Ends on",
    noActiveSubscription:
      "No active subscription is connected to this workspace yet.",
    statusLabels: {
      trial: "Trial",
      active: "Active",
      past_due: "Past Due",
      cancelled: "Cancelled",
    },
  },

  id: {
    badge: "Billing",
    title: "Kelola paket, trial, dan credits Kolkap Anda.",
    subtitle:
      "Lihat paket saat ini, status trial, monthly credits, top-up credits, detail billing, dan pilihan upgrade.",
    loading: "Memuat detail billing Anda...",
    failed: "Billing gagal dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Refresh",
    currentPlan: "Paket Saat Ini",
    planStatus: "Status Paket",
    creditsLeft: "Sisa Credits",
    creditsUsed: "Credits Terpakai",
    planCredits: "Plan Credits",
    topUpCredits: "Top-Up Credits",
    aiStaffLimit: "Limit AI Staff",
    teamLimit: "Limit Team",
    trialDaysLeft: "Sisa Hari Trial",
    billingSummary: "Ringkasan Billing",
    billingSummaryText:
      "Halaman billing menunjukkan paket aktif, detail trial, credits, dan status account Anda.",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan biaya hari ini. Monthly billing berjalan setelah trial kecuali dibatalkan sebelum trial selesai.",
    availablePlans: "Paket Tersedia",
    availablePlansText:
      "Pilih paket berdasarkan jumlah AI staff, team member, dan monthly credits yang dibutuhkan bisnis Anda.",
    topUpTitle: "Paket Top-Up Credits",
    topUpText:
      "Gunakan top-up credits saat bisnis Anda membutuhkan extra AI replies atau content generations sebelum billing cycle berikutnya.",
    invoices: "Invoice",
    invoicesText:
      "Riwayat pembayaran dan invoice Anda akan muncul di sini setelah billing aktif.",
    upgradePlan: "Upgrade Paket",
    startTrial: "Mulai 7-Day Trial",
    contactUs: "Hubungi Kami",
    current: "Saat Ini",
    comingSoon: "Segera Hadir",
    invoiceNotReady:
      "Invoice akan tersedia setelah subscription berbayar atau top-up credits pertama.",
    billingPeriod: "Periode Billing",
    paymentNeeded: "Payment method diperlukan",
    noChargeToday: "Tidak dikenakan biaya hari ini",
    autoBilling: "Monthly billing berjalan setelah trial kecuali dibatalkan.",
    noCreditBalance: "Credit balance belum dibuat untuk workspace ini.",
    includedMonthly: "Monthly credits termasuk",
    purchasedExtra: "Extra credits yang dibeli",
    usedFromBalance: "Terpakai dari balance",
    remainingBalance: "Sisa balance",
    creditWord: "credits",
    creditGuideTitle: "Cara Credits Digunakan",
    creditGuideText:
      "Kolkap menggunakan credits hanya saat AI berhasil membuat atau mengirim output.",
    creditRules: [
      ["Test AI Reply", "3 credits"],
      ["Inbox AI Reply", "3 credits"],
      ["Content Studio Generation", "5 credits"],
      ["Website Chat AI Reply", "mulai dari 3 credits"],
      ["WhatsApp AI Reply", "mulai dari 5 credits"],
      ["Balasan panjang / campaign content", "lebih banyak credits"],
    ],
    managePlanTitle: "Kelola Paket Anda",
    managePlanText:
      "Anda selalu punya kontrol atas paket Kolkap. Anda bisa lanjut membangun, upgrade saat butuh kapasitas lebih, atau menjadwalkan pembatalan sebelum periode billing berikutnya.",
    keepBuildingTitle: "Lanjut membangun dengan Kolkap",
    keepBuildingText:
      "AI staff, inbox, leads, knowledge base, dan riwayat credits tetap tersimpan di workspace agar bisnis Anda bisa berjalan lancar.",
    continueWithKolkap: "Lanjut dengan Kolkap",
    cancellationHelpTitle: "Perlu menghentikan paket?",
    cancellationHelpText:
      "Anda bisa menjadwalkan pembatalan kapan saja. Workspace tetap tersedia sampai trial atau billing period saat ini berakhir.",
    cancelTrial: "Jadwalkan Pembatalan Trial",
    cancelSubscription: "Jadwalkan Pembatalan Subscription",
    cancelling: "Menjadwalkan pembatalan...",
    cancelScheduledTitle: "Pembatalan Dijadwalkan",
    cancelScheduledText:
      "Akses Kolkap tetap tersedia sampai trial atau billing period saat ini berakhir. Anda tidak akan ditagih lagi setelah pembatalan berlaku.",
    cancelConfirmTitle: "Konfirmasi Pembatalan",
    cancelConfirmText:
      "Apakah Anda ingin menjadwalkan pembatalan paket ini? Anda tetap bisa menggunakan Kolkap sampai trial atau billing period saat ini berakhir.",
    keepPlan: "Tetap Gunakan Paket",
    confirmCancel: "Ya, Jadwalkan Pembatalan",
    cancelErrorTitle: "Pembatalan gagal",
    cancelSuccess:
      "Pembatalan telah dijadwalkan. Anda tetap bisa menggunakan Kolkap sampai trial atau billing period selesai.",
    cancelledAt: "Berakhir pada",
    noActiveSubscription:
      "Belum ada subscription aktif yang terhubung ke workspace ini.",
    statusLabels: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
  },

  zh: {
    badge: "账单",
    title: "管理您的 Kolkap 方案、试用和 credits。",
    subtitle:
      "查看当前方案、试用状态、monthly credits、top-up credits、账单详情和升级选项。",
    loading: "正在加载账单详情...",
    failed: "账单无法加载。",
    back: "返回 Dashboard",
    refresh: "刷新",
    currentPlan: "当前方案",
    planStatus: "方案状态",
    creditsLeft: "剩余 Credits",
    creditsUsed: "已使用 Credits",
    planCredits: "方案 Credits",
    topUpCredits: "Top-Up Credits",
    aiStaffLimit: "AI 员工限制",
    teamLimit: "团队限制",
    trialDaysLeft: "剩余试用天数",
    billingSummary: "账单摘要",
    billingSummaryText:
      "账单页面会显示您的当前方案、试用详情、credits 和账户状态。",
    trialTitle: "7 天免费试用",
    trialText:
      "需要添加付款方式来激活试用。今天不会收费。试用结束后将按月计费，除非您在试用结束前取消。",
    availablePlans: "可用方案",
    availablePlansText:
      "根据您的企业需要多少 AI 员工、团队成员和 monthly credits 来选择方案。",
    topUpTitle: "Top-Up Credit 套餐",
    topUpText:
      "当您的业务在下一个 billing cycle 前需要更多 AI 回复或内容生成时，可以使用 top-up credits。",
    invoices: "发票",
    invoicesText:
      "付款记录和发票将在 billing 激活后显示在这里。",
    upgradePlan: "升级方案",
    startTrial: "开始 7 天试用",
    contactUs: "联系我们",
    current: "当前",
    comingSoon: "即将推出",
    invoiceNotReady:
      "发票将在第一次付费 subscription 或 credit top-up 后可用。",
    billingPeriod: "账单周期",
    paymentNeeded: "需要付款方式",
    noChargeToday: "今天不会收费",
    autoBilling: "试用结束后将按月计费，除非提前取消。",
    noCreditBalance: "此 workspace 还没有创建 credit balance。",
    includedMonthly: "包含的 monthly credits",
    purchasedExtra: "已购买的 extra credits",
    usedFromBalance: "已从 balance 使用",
    remainingBalance: "剩余 balance",
    creditWord: "credits",
    creditGuideTitle: "Credits 如何使用",
    creditGuideText:
      "Kolkap 只会在 AI 成功生成或发送输出时使用 credits。",
    creditRules: [
      ["Test AI Reply", "3 credits"],
      ["Inbox AI Reply", "3 credits"],
      ["Content Studio Generation", "5 credits"],
      ["Website Chat AI Reply", "从 3 credits 起"],
      ["WhatsApp AI Reply", "从 5 credits 起"],
      ["较长回复 / campaign content", "使用更多 credits"],
    ],
    managePlanTitle: "管理您的方案",
    managePlanText:
      "您始终可以控制 Kolkap 方案。您可以继续使用、在需要更多容量时升级，或在下一个账单周期前安排取消。",
    keepBuildingTitle: "继续使用 Kolkap",
    keepBuildingText:
      "您的 AI 员工、inbox、leads、knowledge base 和 credits 历史会保留在 workspace 中，帮助业务继续顺利运行。",
    continueWithKolkap: "继续使用 Kolkap",
    cancellationHelpTitle: "需要停止方案？",
    cancellationHelpText:
      "您可以随时安排取消。当前试用或账单周期结束前，workspace 仍可继续使用。",
    cancelTrial: "安排取消试用",
    cancelSubscription: "安排取消订阅",
    cancelling: "正在安排取消...",
    cancelScheduledTitle: "取消已安排",
    cancelScheduledText:
      "您的 Kolkap 访问权限将保留到当前试用或账单周期结束。取消生效后不会再次收费。",
    cancelConfirmTitle: "确认取消",
    cancelConfirmText:
      "您确定要安排取消此套餐吗？在当前试用或账单周期结束前，您仍可继续使用 Kolkap。",
    keepPlan: "保留套餐",
    confirmCancel: "是的，安排取消",
    cancelErrorTitle: "取消失败",
    cancelSuccess:
      "取消已安排。您仍可继续使用 Kolkap，直到试用或账单周期结束。",
    cancelledAt: "结束于",
    noActiveSubscription: "此 workspace 尚未连接有效订阅。",
    statusLabels: {
      trial: "试用",
      active: "有效",
      past_due: "逾期",
      cancelled: "已取消",
    },
  },

  ms: {
    badge: "Billing",
    title: "Urus pakej, trial, dan credits Kolkap anda.",
    subtitle:
      "Lihat pakej semasa, status trial, monthly credits, top-up credits, detail billing, dan pilihan upgrade.",
    loading: "Memuat detail billing anda...",
    failed: "Billing gagal dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Refresh",
    currentPlan: "Pakej Semasa",
    planStatus: "Status Pakej",
    creditsLeft: "Baki Credits",
    creditsUsed: "Credits Digunakan",
    planCredits: "Plan Credits",
    topUpCredits: "Top-Up Credits",
    aiStaffLimit: "Limit AI Staff",
    teamLimit: "Limit Team",
    trialDaysLeft: "Baki Hari Trial",
    billingSummary: "Ringkasan Billing",
    billingSummaryText:
      "Halaman billing menunjukkan pakej aktif, detail trial, credits, dan status account anda.",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan caj hari ini. Monthly billing bermula selepas trial kecuali dibatalkan sebelum trial tamat.",
    availablePlans: "Pakej Tersedia",
    availablePlansText:
      "Pilih pakej berdasarkan jumlah AI staff, team member, dan monthly credits yang diperlukan oleh bisnes anda.",
    topUpTitle: "Pakej Top-Up Credits",
    topUpText:
      "Gunakan top-up credits apabila bisnes anda memerlukan extra AI replies atau content generations sebelum billing cycle seterusnya.",
    invoices: "Invoice",
    invoicesText:
      "Sejarah pembayaran dan invoice anda akan muncul di sini selepas billing aktif.",
    upgradePlan: "Upgrade Pakej",
    startTrial: "Mulakan 7-Day Trial",
    contactUs: "Hubungi Kami",
    current: "Semasa",
    comingSoon: "Akan Datang",
    invoiceNotReady:
      "Invoice akan tersedia selepas subscription berbayar atau top-up credits pertama.",
    billingPeriod: "Tempoh Billing",
    paymentNeeded: "Payment method diperlukan",
    noChargeToday: "Tiada caj hari ini",
    autoBilling: "Monthly billing bermula selepas trial kecuali dibatalkan.",
    noCreditBalance: "Credit balance belum dibuat untuk workspace ini.",
    includedMonthly: "Monthly credits termasuk",
    purchasedExtra: "Extra credits dibeli",
    usedFromBalance: "Digunakan dari balance",
    remainingBalance: "Baki balance",
    creditWord: "credits",
    creditGuideTitle: "Cara Credits Digunakan",
    creditGuideText:
      "Kolkap menggunakan credits hanya apabila AI berjaya menjana atau menghantar output.",
    creditRules: [
      ["Test AI Reply", "3 credits"],
      ["Inbox AI Reply", "3 credits"],
      ["Content Studio Generation", "5 credits"],
      ["Website Chat AI Reply", "bermula daripada 3 credits"],
      ["WhatsApp AI Reply", "bermula daripada 5 credits"],
      ["Balasan panjang / campaign content", "lebih banyak credits"],
    ],
    managePlanTitle: "Urus Pelan Anda",
    managePlanText:
      "Anda sentiasa mempunyai kawalan ke atas pelan Kolkap. Anda boleh terus membina, upgrade apabila perlukan kapasiti lebih, atau menjadualkan pembatalan sebelum billing period seterusnya.",
    keepBuildingTitle: "Terus membina dengan Kolkap",
    keepBuildingText:
      "AI staff, inbox, leads, knowledge base, dan sejarah credits kekal dalam workspace supaya bisnes anda boleh terus berjalan lancar.",
    continueWithKolkap: "Teruskan dengan Kolkap",
    cancellationHelpTitle: "Perlu hentikan pelan?",
    cancellationHelpText:
      "Anda boleh menjadualkan pembatalan bila-bila masa. Workspace kekal tersedia sehingga trial atau billing period semasa tamat.",
    cancelTrial: "Jadualkan Pembatalan Trial",
    cancelSubscription: "Jadualkan Pembatalan Subscription",
    cancelling: "Menjadualkan pembatalan...",
    cancelScheduledTitle: "Pembatalan Dijadualkan",
    cancelScheduledText:
      "Akses Kolkap anda akan kekal tersedia sehingga trial atau billing period semasa tamat. Anda tidak akan dicaj lagi selepas pembatalan berkuat kuasa.",
    cancelConfirmTitle: "Sahkan Pembatalan",
    cancelConfirmText:
      "Adakah anda mahu menjadualkan pembatalan pelan ini? Anda masih boleh menggunakan Kolkap sehingga trial atau billing period semasa tamat.",
    keepPlan: "Kekalkan Pelan",
    confirmCancel: "Ya, Jadualkan Pembatalan",
    cancelErrorTitle: "Pembatalan gagal",
    cancelSuccess:
      "Pembatalan telah dijadualkan. Anda masih boleh menggunakan Kolkap sehingga trial atau billing period tamat.",
    cancelledAt: "Tamat pada",
    noActiveSubscription:
      "Belum ada subscription aktif yang disambungkan ke workspace ini.",
    statusLabels: {
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunggak",
      cancelled: "Dibatalkan",
    },
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : "en";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
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

function getStatusLabel(labels: Record<string, string>, value: string) {
  return labels[value] || value;
}

function localizePlanLabel(label: string, language: SupportedLanguage) {
  if (language === "zh") {
    return label
      .replace("credits/month", "credits/月")
      .replace("Custom credits", "定制 credits")
      .replace("trial credits", "试用 credits")
      .replace("AI staff", "AI 员工")
      .replace("Team members", "团队成员")
      .replace("Team member", "团队成员")
      .replace("Custom team members", "定制团队成员")
      .replace("Custom", "定制");
  }

  if (language === "id") {
    return label
      .replace("credits/month", "credits/bulan")
      .replace("Custom credits", "Custom credits")
      .replace("trial credits", "trial credits")
      .replace("Custom AI staff", "Custom AI staff")
      .replace("Custom team members", "Custom team members");
  }

  if (language === "ms") {
    return label
      .replace("credits/month", "credits/bulan")
      .replace("Custom credits", "Custom credits")
      .replace("trial credits", "trial credits")
      .replace("Custom AI staff", "Custom AI staff")
      .replace("Custom team members", "Custom team members");
  }

  return label;
}

export default function BillingPage() {
  const { language } = useKolkapLanguage();
  const lang = getSupportedLanguage(language);
  const t = translations[lang];

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const workspaceRecord = (workspace ?? null) as WorkspaceBillingRecord | null;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelAt, setCancelAt] = useState<string | null>(
    workspaceRecord?.subscription_cancel_at || null
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const creditsLeft = getCreditsLeft(creditBalance);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const usedCredits = Number(creditBalance?.used_credits || 0);

  const workspaceStatus = workspaceState.status;
  const isTrial = workspaceStatus === "trial";
  const isActiveOrTrial =
    workspaceStatus === "trial" ||
    workspaceStatus === "active" ||
    workspaceStatus === "past_due";

  const effectiveCancelAt =
    cancelAt ||
    workspaceRecord?.subscription_cancel_at ||
    workspaceRecord?.subscription_cancelled_at ||
    null;

  const cancellationScheduled = Boolean(effectiveCancelAt);

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

  async function handleCancelSubscription() {
    setCancelError("");
    setCancelMessage("");

    if (!workspaceRecord?.id) {
      setCancelError(t.noActiveSubscription);
      return;
    }

    try {
      setIsCancelling(true);

      const response = await fetch("/api/billing/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspace_id: workspaceRecord.id,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        cancel_at?: string | null;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || t.noActiveSubscription);
      }

      setCancelAt(result.cancel_at || null);
      setCancelMessage(result.message || t.cancelSuccess);
      setShowCancelConfirm(false);
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : t.noActiveSubscription
      );
    } finally {
      setIsCancelling(false);
    }
  }

  useEffect(() => {
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  useEffect(() => {
    if (workspaceRecord?.subscription_cancel_at) {
      setCancelAt(workspaceRecord.subscription_cancel_at);
    }
  }, [workspaceRecord?.subscription_cancel_at]);

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

  const summaryCards = [
    {
      label: t.currentPlan,
      value: creditBalance?.plan_name || currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.planStatus,
      value: getStatusLabel(t.statusLabels, workspaceState.status),
      note:
        workspaceState.status === "trial"
          ? `${workspaceState.trialDaysRemaining} ${t.trialDaysLeft}`
          : t.autoBilling,
      icon: ShieldCheck,
    },
    {
      label: t.creditsLeft,
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance ? t.remainingBalance : t.noCreditBalance,
      icon: CreditCard,
      dark: true,
    },
    {
      label: t.creditsUsed,
      value: usedCredits.toLocaleString(),
      note: t.usedFromBalance,
      icon: Zap,
    },
    {
      label: t.aiStaffLimit,
      value: localizePlanLabel(getPlanAIStaffLabel(currentPlan), lang),
      note: currentPlan.name,
      icon: Bot,
    },
    {
      label: t.teamLimit,
      value: localizePlanLabel(getPlanTeamMemberLabel(currentPlan), lang),
      note: currentPlan.name,
      icon: UsersRound,
    },
  ];

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
              onClick={loadCreditBalance}
              disabled={isLoadingCredits}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCcw className="h-5 w-5" />
              {isLoadingCredits ? t.loading : t.refresh}
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        {creditError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="text-base font-black">{creditError}</p>
          </div>
        ) : null}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                <CreditCard className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.billingSummary}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.billingSummaryText}
              </h2>
            </div>

            <div className="rounded-[2rem] bg-[#07111F] p-7 text-white">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {creditBalance?.plan_name || currentPlan.name}
              </p>

              <h3 className="mt-3 text-5xl font-black tracking-[-0.06em]">
                {currentPlan.priceLabel}
              </h3>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                {localizePlanLabel(getPlanCreditLabel(currentPlan), lang)} •{" "}
                {localizePlanLabel(getPlanAIStaffLabel(currentPlan), lang)} •{" "}
                {localizePlanLabel(getPlanTeamMemberLabel(currentPlan), lang)}
              </p>

              <div className="mt-6 grid gap-3 rounded-3xl bg-white/5 p-5">
                <BillingRow label={t.planCredits} value={planCredits} />
                <BillingRow label={t.topUpCredits} value={purchasedCredits} />
                <BillingRow label={t.creditsUsed} value={usedCredits} />
                <BillingRow
                  label={t.creditsLeft}
                  value={creditsLeft === null ? "—" : creditsLeft}
                  highlight
                />
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/dashboard/top-up"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-lg font-black text-[#07111F]"
                >
                  <WalletCards className="h-5 w-5" />
                  {t.topUpCredits}
                </Link>

                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-lg font-black text-white"
                >
                  <TrendingUp className="h-5 w-5" />
                  {t.upgradePlan}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.managePlanTitle}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.managePlanText}
              </h2>

              {cancellationScheduled ? (
                <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                  <p className="text-base font-black">
                    {t.cancelScheduledTitle}
                  </p>
                  <p className="mt-2 text-base font-semibold leading-7">
                    {t.cancelScheduledText}
                  </p>
                  <p className="mt-3 text-sm font-black">
                    {t.cancelledAt}: {formatDate(effectiveCancelAt)}
                  </p>
                </div>
              ) : null}

              {cancelMessage ? (
                <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                  <p className="text-base font-black">{t.cancelSuccess}</p>
                  {effectiveCancelAt ? (
                    <p className="mt-2 text-sm font-black">
                      {t.cancelledAt}: {formatDate(effectiveCancelAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {cancelError ? (
                <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
                  <p className="text-base font-black">{t.cancelErrorTitle}</p>
                  <p className="mt-2 text-base font-semibold leading-7">
                    {cancelError}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-5">
              <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Sparkles className="h-7 w-7" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.keepBuildingTitle}
                </p>

                <p className="mt-3 text-lg font-semibold leading-8 text-slate-700">
                  {t.keepBuildingText}
                </p>

                <Link
                  href="/dashboard"
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white transition hover:-translate-y-0.5"
                >
                  {t.continueWithKolkap}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-[#07111F]">
                  <HelpCircle className="h-7 w-7" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-slate-500">
                  {t.cancellationHelpTitle}
                </p>

                <p className="mt-3 text-lg font-semibold leading-8 text-slate-700">
                  {t.cancellationHelpText}
                </p>

                {!isActiveOrTrial ? (
                  <p className="mt-6 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-base font-black leading-7 text-slate-700">
                    {t.noActiveSubscription}
                  </p>
                ) : null}

                {showCancelConfirm ? (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                    <p className="text-xl font-black text-[#07111F]">
                      {t.cancelConfirmTitle}
                    </p>

                    <p className="mt-3 text-base font-semibold leading-7 text-slate-700">
                      {t.cancelConfirmText}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={isCancelling}
                        className="rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white disabled:opacity-60"
                      >
                        {t.keepPlan}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                        className="rounded-full border border-slate-300 bg-white px-6 py-4 text-base font-black text-slate-700 disabled:opacity-60"
                      >
                        {isCancelling ? t.cancelling : t.confirmCancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError("");
                      setCancelMessage("");
                      setShowCancelConfirm(true);
                    }}
                    disabled={!isActiveOrTrial || cancellationScheduled}
                    className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-6 py-4 text-lg font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <XCircle className="h-5 w-5" />
                    {isTrial ? t.cancelTrial : t.cancelSubscription}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <HelpCircle className="h-8 w-8" />
            </div>

            <div className="w-full">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.creditGuideTitle}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.creditGuideText}
              </h2>

              <div className="mt-7 grid gap-3 lg:grid-cols-2">
                {t.creditRules.map(([action, cost]) => (
                  <div
                    key={action}
                    className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-[#7CFF3D]" />
                      <p className="text-base font-black text-white">
                        {action}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                      {cost}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CalendarDays className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.trialTitle}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.trialText}
              </h2>

              {creditBalance ? (
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                  {t.billingPeriod}:{" "}
                  {formatDate(creditBalance.billing_period_start)} —{" "}
                  {formatDate(creditBalance.billing_period_end)}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
                  {t.paymentNeeded}
                </span>

                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
                  {t.noChargeToday}
                </span>

                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
                  {t.autoBilling}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.availablePlans}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.availablePlansText}
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
            {publicPlanKeys.map((planKey) => {
              const plan = getKolkapPlan(planKey);
              const isCurrent =
                plan.key === workspaceState.planKey ||
                (workspaceState.planKey === "pro" &&
                  plan.key === "professional");

              return (
                <div
                  key={plan.key}
                  className={`rounded-[2rem] border p-6 ${
                    isCurrent
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-[#F7F9FA] text-[#07111F]"
                  }`}
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isCurrent
                        ? "bg-[#7CFF3D] text-[#07111F]"
                        : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    {plan.name}
                  </h3>

                  <p className="mt-2 text-2xl font-black">
                    {plan.priceLabel}
                  </p>

                  <p
                    className={`mt-4 text-base font-semibold leading-7 ${
                      isCurrent ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mt-6 grid gap-3">
                    <FeatureItem
                      text={localizePlanLabel(getPlanCreditLabel(plan), lang)}
                      isCurrent={isCurrent}
                    />
                    <FeatureItem
                      text={localizePlanLabel(getPlanAIStaffLabel(plan), lang)}
                      isCurrent={isCurrent}
                    />
                    <FeatureItem
                      text={localizePlanLabel(
                        getPlanTeamMemberLabel(plan),
                        lang
                      )}
                      isCurrent={isCurrent}
                    />
                    {plan.cardRequiredForTrial ? (
                      <FeatureItem
                        text={t.paymentNeeded}
                        isCurrent={isCurrent}
                      />
                    ) : null}
                  </div>

                  <div className="mt-7">
                    {isCurrent ? (
                      <span className="inline-flex w-full items-center justify-center rounded-full bg-[#7CFF3D] px-6 py-4 text-lg font-black text-[#07111F]">
                        {t.current}
                      </span>
                    ) : (
                      <Link
                        href={
                          plan.key === "enterprise"
                            ? "/contact"
                            : `/dashboard/activate-trial?plan=${plan.key}`
                        }
                        className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white"
                      >
                        {plan.key === "enterprise"
                          ? t.contactUs
                          : t.startTrial}
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.topUpTitle}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.topUpText}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {kolkapTopUpPackages.map((pack) => (
              <div
                key={pack.id}
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Zap className="h-7 w-7" />
                </div>

                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  ${pack.priceUsd}
                </h3>

                <p className="mt-2 text-xl font-black text-slate-700">
                  {pack.credits.toLocaleString()} {t.creditWord}
                </p>

                <Link
                  href="/dashboard/top-up"
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-5 py-4 text-base font-black text-white"
                >
                  {t.topUpCredits}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <FileText className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.invoices}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.invoicesText}
              </h2>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                <Download className="h-7 w-7" />
              </div>

              <h3 className="text-3xl font-black tracking-[-0.04em]">
                {t.comingSoon}
              </h3>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                {t.invoiceNotReady}
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function BillingRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3">
      <span className="text-sm font-black text-slate-300">{label}</span>
      <span
        className={`text-base font-black ${
          highlight ? "text-[#7CFF3D]" : "text-white"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

function FeatureItem({
  text,
  isCurrent,
}: {
  text: string;
  isCurrent: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2
        className={`mt-1 h-5 w-5 shrink-0 ${
          isCurrent ? "text-[#7CFF3D]" : "text-[#07111F]"
        }`}
      />
      <span className="text-base font-black">{text}</span>
    </div>
  );
}