"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  PlayCircle,
  PlugZap,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";
import { useKolkapLanguage } from "@/app/context/LanguageContext";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type OnboardingTranslation = {
  nav: {
    dashboard: string;
    onboarding: string;
    aiBrain: string;
    aiStaff: string;
    knowledge: string;
    inbox: string;
    usage: string;
    billing: string;
  };
  heroBadge: string;
  heroTitle: string;
  heroText: string;
  createAI: string;
  addKnowledge: string;
  readinessBadge: string;
  readinessTitle: string;
  readinessText: string;
  goLiveChecklist: string;
  checkUsage: string;
  setupPath: string;
  setupTitle: string;
  setupText: string;
  readinessDetails: string;
  readinessDetailsTitle: string;
  safetyRules: string;
  safetyRulesTitle: string;
  goLiveLogic: string;
  goLiveLogicTitle: string;
  goLiveLogicText: string;
  continueSetup: string;
  manageCredits: string;
  statuses: {
    trial: string;
    required: string;
    beforeLive: string;
    important: string;
    channel: string;
    finalStep: string;
    recommended: string;
  };
  setupSteps: {
    title: string;
    text: string;
  }[];
  readinessItems: {
    label: string;
    value: string;
    note: string;
  }[];
  safetyRulesList: string[];
};

const translations: Record<SupportedLanguage, OnboardingTranslation> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      onboarding: "Onboarding",
      aiBrain: "AI Brain",
      aiStaff: "AI Staff",
      knowledge: "Knowledge",
      inbox: "Inbox",
      usage: "Usage",
      billing: "Billing",
    },
    heroBadge: "Get Started",
    heroTitle: "Set up Kolkap before going live.",
    heroText:
      "Follow the setup path so your AI staff can reply safely, use the correct business knowledge, capture leads, and manage credits before real customer conversations begin.",
    createAI: "Create AI Staff",
    addKnowledge: "Add Knowledge",
    readinessBadge: "Workspace Readiness",
    readinessTitle: "Do not go live until the basics are ready.",
    readinessText:
      "Kolkap should only go live after your plan, business profile, AI staff, knowledge, testing, credits, and customer channel are ready.",
    goLiveChecklist: "Go Live Checklist",
    checkUsage: "Check Usage",
    setupPath: "Setup Path",
    setupTitle: "Complete these steps in order",
    setupText:
      "This onboarding page explains the safe setup path before AI replies are activated for real customers.",
    readinessDetails: "Readiness Details",
    readinessDetailsTitle: "What must be ready",
    safetyRules: "Safety Rules",
    safetyRulesTitle: "Must be true before live",
    goLiveLogic: "Go Live Logic",
    goLiveLogicTitle: "Go live only when the workspace is ready.",
    goLiveLogicText:
      "Auto-reply should only run when there is an active trial or plan, at least one AI staff, enough business knowledge, and available credits. Website chat AI replies start from 3 credits, WhatsApp AI replies start from 5 credits, and longer replies may use more credits.",
    continueSetup: "Continue Setup",
    manageCredits: "Manage Credits",
    statuses: {
      trial: "Trial",
      required: "Required",
      beforeLive: "Before live",
      important: "Important",
      channel: "Channel",
      finalStep: "Final step",
      recommended: "Recommended",
    },
    setupSteps: [
      {
        title: "Start your free trial",
        text: "Choose a plan and activate your 7-day free trial. Payment method is needed to activate your trial, but you won’t be charged today.",
      },
      {
        title: "Complete business profile",
        text: "Add business name, industry, website, WhatsApp number, support details, and company description.",
      },
      {
        title: "Create your first AI staff",
        text: "Create an AI receptionist, WhatsApp responder, customer support assistant, copywriter, or another AI role.",
      },
      {
        title: "Add business knowledge",
        text: "Add FAQs, pricing, services, policies, approved answers, and business rules so your AI can answer accurately.",
      },
      {
        title: "Test the AI safely",
        text: "Use Test AI to send sample customer questions, review replies, and improve your Knowledge Base before real customers see it. Each successful Test AI reply starts from 3 credits.",
      },
      {
        title: "Check usage and credits",
        text: "Every successful AI generation or AI reply uses credits. Test AI and Inbox AI Reply start from 3 credits, Content Studio starts from 5 credits, website chat starts from 3 credits, and WhatsApp AI replies start from 5 credits. Longer replies may use more credits.",
      },
      {
        title: "Connect customer channel",
        text: "Choose the customer channel you want to use, such as WhatsApp, website chat, email, or another customer channel, then review it from Go Live before activating real replies.",
      },
      {
        title: "Go live",
        text: "Activate AI replies only after business profile, AI staff, knowledge, testing, credits, and channel setup are ready.",
      },
    ],
    readinessItems: [
      {
        label: "Trial / plan",
        value: "Required",
        note: "Free trial or active subscription should be ready before live.",
      },
      {
        label: "Business profile",
        value: "Required",
        note: "Business details help the AI answer correctly.",
      },
      {
        label: "AI staff setup",
        value: "Required",
        note: "At least one AI staff should be created and configured.",
      },
      {
        label: "Knowledge base",
        value: "Required",
        note: "Add FAQs, pricing, services, policies, and approved answers.",
      },
      {
        label: "Credits",
        value: "Required",
        note: "AI replies and generations use credits. Auto-reply should pause if credits run out.",
      },
      {
        label: "Channel connection",
        value: "Recommended",
        note: "Choose WhatsApp, website chat, email, or another customer channel before going live.",
      },
    ],
    safetyRulesList: [
      "Payment method is needed to activate the free trial, but the user is not charged today.",
      "Monthly billing starts after the 7-day trial unless cancelled before the trial ends.",
      "AI must use the correct business workspace and Knowledge Base.",
      "Every successful AI generation or AI reply should consume credits.",
      "Test AI and Inbox AI Reply start from 3 credits.",
      "Content Studio starts from 5 credits.",
      "Website chat AI replies start from 3 credits.",
      "WhatsApp AI replies start from 5 credits.",
      "Longer replies may use more credits.",
      "Auto-reply should pause if the workspace has no credits left.",
      "Human review should be available for sensitive issues, complaints, payment questions, legal questions, or urgent cases.",
      "Conversations and leads must be saved under the correct business workspace.",
    ],
  },

  id: {
    nav: {
      dashboard: "Dashboard",
      onboarding: "Onboarding",
      aiBrain: "AI Brain",
      aiStaff: "AI Staff",
      knowledge: "Knowledge",
      inbox: "Inbox",
      usage: "Penggunaan",
      billing: "Billing",
    },
    heroBadge: "Mulai Setup",
    heroTitle: "Siapkan Kolkap sebelum go live.",
    heroText:
      "Ikuti alur setup agar AI staff Anda bisa membalas dengan aman, memakai knowledge bisnis yang benar, menangkap leads, dan mengelola kredit sebelum percakapan customer asli dimulai.",
    createAI: "Buat AI Staff",
    addKnowledge: "Tambah Knowledge",
    readinessBadge: "Kesiapan Workspace",
    readinessTitle: "Jangan go live sebelum basic setup siap.",
    readinessText:
      "Kolkap sebaiknya go live setelah paket, profil bisnis, AI staff, knowledge, testing, kredit, dan channel customer sudah siap.",
    goLiveChecklist: "Checklist Go Live",
    checkUsage: "Cek Penggunaan",
    setupPath: "Alur Setup",
    setupTitle: "Selesaikan langkah ini berurutan",
    setupText:
      "Halaman onboarding ini menjelaskan alur setup aman sebelum balasan AI diaktifkan untuk customer asli.",
    readinessDetails: "Detail Kesiapan",
    readinessDetailsTitle: "Yang harus siap",
    safetyRules: "Aturan Keamanan",
    safetyRulesTitle: "Harus benar sebelum live",
    goLiveLogic: "Logika Go Live",
    goLiveLogicTitle: "Go live hanya saat workspace sudah siap.",
    goLiveLogicText:
      "Auto-reply hanya boleh berjalan jika ada trial atau paket aktif, minimal satu AI staff, business knowledge yang cukup, dan kredit tersedia. Balasan AI website chat mulai dari 3 kredit, balasan AI WhatsApp mulai dari 5 kredit, dan balasan yang lebih panjang bisa memakai lebih banyak kredit.",
    continueSetup: "Lanjutkan Setup",
    manageCredits: "Kelola Kredit",
    statuses: {
      trial: "Trial",
      required: "Wajib",
      beforeLive: "Sebelum live",
      important: "Penting",
      channel: "Channel",
      finalStep: "Langkah akhir",
      recommended: "Disarankan",
    },
    setupSteps: [
      {
        title: "Mulai free trial",
        text: "Pilih paket dan aktifkan free trial 7 hari. Payment method diperlukan untuk mengaktifkan trial, tetapi Anda tidak akan dikenakan biaya hari ini.",
      },
      {
        title: "Lengkapi profil bisnis",
        text: "Tambahkan nama bisnis, industri, website, nomor WhatsApp, detail support, dan deskripsi perusahaan.",
      },
      {
        title: "Buat AI staff pertama",
        text: "Buat AI receptionist, WhatsApp responder, customer support assistant, copywriter, atau role AI lainnya.",
      },
      {
        title: "Tambah business knowledge",
        text: "Tambahkan FAQ, harga, layanan, policy, jawaban yang disetujui, dan aturan bisnis agar AI bisa menjawab dengan akurat.",
      },
      {
        title: "Test AI dengan aman",
        text: "Gunakan Test AI untuk mengirim contoh pertanyaan customer, review balasan, dan perbaiki Knowledge Base sebelum customer asli melihatnya. Setiap Test AI reply yang berhasil mulai dari 3 kredit.",
      },
      {
        title: "Cek penggunaan dan kredit",
        text: "Setiap AI generation atau AI reply yang berhasil menggunakan kredit. Test AI dan Inbox AI Reply mulai dari 3 kredit, Content Studio mulai dari 5 kredit, website chat mulai dari 3 kredit, dan WhatsApp AI reply mulai dari 5 kredit. Balasan yang lebih panjang bisa memakai lebih banyak kredit.",
      },
      {
        title: "Hubungkan channel customer",
        text: "Pilih channel customer yang ingin digunakan, seperti WhatsApp, website chat, email, atau channel customer lain, lalu review dari Go Live sebelum mengaktifkan balasan asli.",
      },
      {
        title: "Go live",
        text: "Aktifkan balasan AI hanya setelah profil bisnis, AI staff, knowledge, testing, kredit, dan channel setup sudah siap.",
      },
    ],
    readinessItems: [
      {
        label: "Trial / paket",
        value: "Wajib",
        note: "Free trial atau subscription aktif harus siap sebelum live.",
      },
      {
        label: "Profil bisnis",
        value: "Wajib",
        note: "Detail bisnis membantu AI menjawab dengan benar.",
      },
      {
        label: "Setup AI staff",
        value: "Wajib",
        note: "Minimal satu AI staff harus dibuat dan dikonfigurasi.",
      },
      {
        label: "Knowledge Base",
        value: "Wajib",
        note: "Tambahkan FAQ, harga, layanan, policy, dan jawaban yang disetujui.",
      },
      {
        label: "Kredit",
        value: "Wajib",
        note: "Balasan dan generation AI menggunakan kredit. Auto-reply harus pause jika kredit habis.",
      },
      {
        label: "Channel connection",
        value: "Disarankan",
        note: "Pilih WhatsApp, website chat, email, atau channel customer lain sebelum go live.",
      },
    ],
    safetyRulesList: [
      "Payment method diperlukan untuk mengaktifkan free trial, tetapi user tidak dikenakan biaya hari ini.",
      "Billing bulanan mulai setelah trial 7 hari kecuali dibatalkan sebelum trial berakhir.",
      "AI harus memakai workspace bisnis dan Knowledge Base yang benar.",
      "Setiap AI generation atau AI reply yang berhasil harus menggunakan kredit.",
      "Test AI dan Inbox AI Reply mulai dari 3 kredit.",
      "Content Studio mulai dari 5 kredit.",
      "Balasan AI website chat mulai dari 3 kredit.",
      "Balasan AI WhatsApp mulai dari 5 kredit.",
      "Balasan yang lebih panjang bisa memakai lebih banyak kredit.",
      "Auto-reply harus pause jika workspace tidak memiliki sisa kredit.",
      "Human review harus tersedia untuk masalah sensitif, komplain, pertanyaan pembayaran, pertanyaan legal, atau kasus urgent.",
      "Percakapan dan leads harus disimpan di workspace bisnis yang benar.",
    ],
  },

  zh: {
    nav: {
      dashboard: "Dashboard",
      onboarding: "Onboarding",
      aiBrain: "AI Brain",
      aiStaff: "AI Staff",
      knowledge: "Knowledge",
      inbox: "Inbox",
      usage: "使用量",
      billing: "Billing",
    },
    heroBadge: "开始设置",
    heroTitle: "上线前先设置好 Kolkap。",
    heroText:
      "按照设置流程，让您的 AI staff 能安全回复、使用正确的业务知识、收集 leads，并在真实客户对话开始前管理积分。",
    createAI: "创建 AI Staff",
    addKnowledge: "添加 Knowledge",
    readinessBadge: "Workspace 准备情况",
    readinessTitle: "基础设置未完成前不要 go live。",
    readinessText:
      "Kolkap 应在套餐、业务资料、AI staff、knowledge、测试、积分和客户 channel 都准备好后再 go live。",
    goLiveChecklist: "Go Live Checklist",
    checkUsage: "查看使用量",
    setupPath: "设置流程",
    setupTitle: "按顺序完成这些步骤",
    setupText:
      "此 onboarding 页面说明在为真实客户启用 AI 回复前的安全设置流程。",
    readinessDetails: "准备详情",
    readinessDetailsTitle: "必须准备好的项目",
    safetyRules: "安全规则",
    safetyRulesTitle: "上线前必须满足",
    goLiveLogic: "Go Live 逻辑",
    goLiveLogicTitle: "只有 workspace 准备好后才 go live。",
    goLiveLogicText:
      "Auto-reply 只应在有有效 trial 或套餐、至少一个 AI staff、足够业务知识和可用积分时运行。Website chat AI 回复从 3 积分开始，WhatsApp AI 回复从 5 积分开始，较长回复可能会使用更多积分。",
    continueSetup: "继续设置",
    manageCredits: "管理积分",
    statuses: {
      trial: "Trial",
      required: "必需",
      beforeLive: "上线前",
      important: "重要",
      channel: "Channel",
      finalStep: "最后一步",
      recommended: "建议",
    },
    setupSteps: [
      {
        title: "开始 free trial",
        text: "选择套餐并启用 7 天 free trial。需要 payment method 来启用 trial，但今天不会收费。",
      },
      {
        title: "完成业务资料",
        text: "添加业务名称、行业、website、WhatsApp 号码、support 资料和公司描述。",
      },
      {
        title: "创建第一个 AI staff",
        text: "创建 AI receptionist、WhatsApp responder、customer support assistant、copywriter 或其他 AI 角色。",
      },
      {
        title: "添加 business knowledge",
        text: "添加 FAQ、价格、服务、policy、approved answers 和业务规则，让 AI 能准确回答。",
      },
      {
        title: "安全测试 AI",
        text: "使用 Test AI 发送客户问题示例，检查回复，并在真实客户看到前改进 Knowledge Base。每次成功的 Test AI reply 从 3 积分开始。",
      },
      {
        title: "检查使用量和积分",
        text: "每次成功的 AI generation 或 AI reply 都会使用积分。Test AI 和 Inbox AI Reply 从 3 积分开始，Content Studio 从 5 积分开始，website chat 从 3 积分开始，WhatsApp AI reply 从 5 积分开始。较长回复可能会使用更多积分。",
      },
      {
        title: "连接客户 channel",
        text: "选择要使用的客户 channel，例如 WhatsApp、website chat、email 或其他客户 channel，然后在 Go Live 页面检查后再启用真实回复。",
      },
      {
        title: "Go live",
        text: "只有在业务资料、AI staff、knowledge、testing、积分和 channel setup 都准备好后，才启用 AI 回复。",
      },
    ],
    readinessItems: [
      {
        label: "Trial / 套餐",
        value: "必需",
        note: "Free trial 或有效 subscription 应在 live 前准备好。",
      },
      {
        label: "业务资料",
        value: "必需",
        note: "业务资料帮助 AI 正确回答。",
      },
      {
        label: "AI staff 设置",
        value: "必需",
        note: "至少应创建并设置一个 AI staff。",
      },
      {
        label: "Knowledge Base",
        value: "必需",
        note: "添加 FAQ、价格、服务、policy 和 approved answers。",
      },
      {
        label: "积分",
        value: "必需",
        note: "AI 回复和生成会使用积分。如果积分用完，auto-reply 应暂停。",
      },
      {
        label: "Channel connection",
        value: "建议",
        note: "Go live 前请选择 WhatsApp、website chat、email 或其他客户 channel。",
      },
    ],
    safetyRulesList: [
      "启用 free trial 需要 payment method，但用户今天不会被收费。",
      "7 天 trial 结束后开始 monthly billing，除非 trial 结束前取消。",
      "AI 必须使用正确的业务 workspace 和 Knowledge Base。",
      "每次成功的 AI generation 或 AI reply 都应消耗积分。",
      "Test AI 和 Inbox AI Reply 从 3 积分开始。",
      "Content Studio 从 5 积分开始。",
      "Website chat AI 回复从 3 积分开始。",
      "WhatsApp AI 回复从 5 积分开始。",
      "较长回复可能会使用更多积分。",
      "如果 workspace 没有剩余积分，auto-reply 应暂停。",
      "敏感问题、投诉、付款问题、法律问题或紧急情况应有 human review。",
      "对话和 leads 必须保存到正确的业务 workspace。",
    ],
  },

  ms: {
    nav: {
      dashboard: "Dashboard",
      onboarding: "Onboarding",
      aiBrain: "AI Brain",
      aiStaff: "AI Staff",
      knowledge: "Knowledge",
      inbox: "Inbox",
      usage: "Penggunaan",
      billing: "Billing",
    },
    heroBadge: "Mulakan Setup",
    heroTitle: "Sediakan Kolkap sebelum go live.",
    heroText:
      "Ikuti alur setup supaya AI staff anda boleh membalas dengan selamat, menggunakan business knowledge yang betul, capture leads, dan mengurus kredit sebelum perbualan pelanggan sebenar bermula.",
    createAI: "Cipta AI Staff",
    addKnowledge: "Tambah Knowledge",
    readinessBadge: "Kesiapan Workspace",
    readinessTitle: "Jangan go live sebelum asas setup sudah siap.",
    readinessText:
      "Kolkap sebaiknya go live selepas pelan, business profile, AI staff, knowledge, testing, kredit, dan customer channel sudah siap.",
    goLiveChecklist: "Checklist Go Live",
    checkUsage: "Semak Penggunaan",
    setupPath: "Alur Setup",
    setupTitle: "Lengkapkan langkah ini mengikut urutan",
    setupText:
      "Halaman onboarding ini menerangkan alur setup selamat sebelum balasan AI diaktifkan untuk pelanggan sebenar.",
    readinessDetails: "Detail Kesiapan",
    readinessDetailsTitle: "Apa yang mesti siap",
    safetyRules: "Peraturan Keselamatan",
    safetyRulesTitle: "Mesti benar sebelum live",
    goLiveLogic: "Logik Go Live",
    goLiveLogicTitle: "Go live hanya apabila workspace sudah siap.",
    goLiveLogicText:
      "Auto-reply hanya patut berjalan apabila ada trial atau pelan aktif, sekurang-kurangnya satu AI staff, business knowledge yang mencukupi, dan kredit tersedia. Balasan AI website chat bermula daripada 3 kredit, balasan AI WhatsApp bermula daripada 5 kredit, dan balasan yang lebih panjang mungkin menggunakan lebih banyak kredit.",
    continueSetup: "Teruskan Setup",
    manageCredits: "Urus Kredit",
    statuses: {
      trial: "Trial",
      required: "Wajib",
      beforeLive: "Sebelum live",
      important: "Penting",
      channel: "Channel",
      finalStep: "Langkah akhir",
      recommended: "Disarankan",
    },
    setupSteps: [
      {
        title: "Mulakan free trial",
        text: "Pilih pelan dan aktifkan free trial 7 hari. Payment method diperlukan untuk mengaktifkan trial, tetapi anda tidak akan dicaj hari ini.",
      },
      {
        title: "Lengkapkan business profile",
        text: "Tambah nama bisnes, industri, website, nombor WhatsApp, detail support, dan penerangan syarikat.",
      },
      {
        title: "Cipta AI staff pertama",
        text: "Cipta AI receptionist, WhatsApp responder, customer support assistant, copywriter, atau role AI lain.",
      },
      {
        title: "Tambah business knowledge",
        text: "Tambah FAQ, harga, servis, policy, jawapan yang diluluskan, dan business rules supaya AI boleh menjawab dengan tepat.",
      },
      {
        title: "Test AI dengan selamat",
        text: "Gunakan Test AI untuk hantar contoh soalan pelanggan, review balasan, dan perbaiki Knowledge Base sebelum pelanggan sebenar melihatnya. Setiap Test AI reply yang berjaya bermula daripada 3 kredit.",
      },
      {
        title: "Semak penggunaan dan kredit",
        text: "Setiap AI generation atau AI reply yang berjaya menggunakan kredit. Test AI dan Inbox AI Reply bermula daripada 3 kredit, Content Studio bermula daripada 5 kredit, website chat bermula daripada 3 kredit, dan WhatsApp AI replies bermula daripada 5 kredit. Balasan yang lebih panjang mungkin menggunakan lebih banyak kredit.",
      },
      {
        title: "Sambungkan customer channel",
        text: "Pilih customer channel yang mahu digunakan, seperti WhatsApp, website chat, email, atau customer channel lain, lalu review dari Go Live sebelum mengaktifkan balasan sebenar.",
      },
      {
        title: "Go live",
        text: "Aktifkan balasan AI hanya selepas business profile, AI staff, knowledge, testing, kredit, dan channel setup sudah siap.",
      },
    ],
    readinessItems: [
      {
        label: "Trial / pelan",
        value: "Wajib",
        note: "Free trial atau subscription aktif perlu siap sebelum live.",
      },
      {
        label: "Business profile",
        value: "Wajib",
        note: "Detail bisnes membantu AI menjawab dengan betul.",
      },
      {
        label: "Setup AI staff",
        value: "Wajib",
        note: "Sekurang-kurangnya satu AI staff perlu dicipta dan dikonfigurasi.",
      },
      {
        label: "Knowledge Base",
        value: "Wajib",
        note: "Tambah FAQ, harga, servis, policy, dan jawapan yang diluluskan.",
      },
      {
        label: "Kredit",
        value: "Wajib",
        note: "Balasan dan generation AI menggunakan kredit. Auto-reply perlu pause jika kredit habis.",
      },
      {
        label: "Channel connection",
        value: "Disarankan",
        note: "Pilih WhatsApp, website chat, email, atau customer channel lain sebelum go live.",
      },
    ],
    safetyRulesList: [
      "Payment method diperlukan untuk mengaktifkan free trial, tetapi user tidak dicaj hari ini.",
      "Billing bulanan bermula selepas trial 7 hari kecuali dibatalkan sebelum trial tamat.",
      "AI mesti menggunakan business workspace dan Knowledge Base yang betul.",
      "Setiap AI generation atau AI reply yang berjaya harus menggunakan kredit.",
      "Test AI dan Inbox AI Reply bermula daripada 3 kredit.",
      "Content Studio bermula daripada 5 kredit.",
      "Balasan AI website chat bermula daripada 3 kredit.",
      "Balasan AI WhatsApp bermula daripada 5 kredit.",
      "Balasan yang lebih panjang mungkin menggunakan lebih banyak kredit.",
      "Auto-reply perlu pause jika workspace tiada baki kredit.",
      "Human review perlu tersedia untuk isu sensitif, aduan, soalan bayaran, soalan legal, atau kes urgent.",
      "Perbualan dan leads mesti disimpan di business workspace yang betul.",
    ],
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
}

export default function OnboardingPage() {
  const { language } = useKolkapLanguage();
  const t = translations[getSupportedLanguage(language)];

  const navItems = [
    { label: t.nav.dashboard, href: "/dashboard" },
    { label: t.nav.onboarding, href: "/dashboard/onboarding" },
    { label: t.nav.aiBrain, href: "/dashboard/ai-brain" },
    { label: t.nav.aiStaff, href: "/dashboard/create-ai" },
    { label: t.nav.knowledge, href: "/dashboard/knowledge-base" },
    { label: t.nav.inbox, href: "/dashboard/inbox" },
    { label: t.nav.usage, href: "/dashboard/usage" },
    { label: t.nav.billing, href: "/dashboard/billing" },
  ];

  const setupSteps = [
    {
      step: "01",
      title: t.setupSteps[0].title,
      text: t.setupSteps[0].text,
      href: "/pricing",
      icon: CreditCard,
      status: t.statuses.trial,
    },
    {
      step: "02",
      title: t.setupSteps[1].title,
      text: t.setupSteps[1].text,
      href: "/dashboard/settings",
      icon: Building2,
      status: t.statuses.required,
    },
    {
      step: "03",
      title: t.setupSteps[2].title,
      text: t.setupSteps[2].text,
      href: "/dashboard/create-ai",
      icon: Bot,
      status: t.statuses.required,
    },
    {
      step: "04",
      title: t.setupSteps[3].title,
      text: t.setupSteps[3].text,
      href: "/dashboard/knowledge-base",
      icon: BookOpen,
      status: t.statuses.required,
    },
    {
      step: "05",
      title: t.setupSteps[4].title,
      text: t.setupSteps[4].text,
      href: "/dashboard/test-ai",
      icon: PlayCircle,
      status: t.statuses.beforeLive,
    },
    {
      step: "06",
      title: t.setupSteps[5].title,
      text: t.setupSteps[5].text,
      href: "/dashboard/usage",
      icon: BarChart3,
      status: t.statuses.important,
    },
    {
      step: "07",
      title: t.setupSteps[6].title,
      text: t.setupSteps[6].text,
      href: "/dashboard/go-live",
      icon: PlugZap,
      status: t.statuses.channel,
    },
    {
      step: "08",
      title: t.setupSteps[7].title,
      text: t.setupSteps[7].text,
      href: "/dashboard/go-live",
      icon: Rocket,
      status: t.statuses.finalStep,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 lg:flex-row lg:items-center lg:justify-between">
          <KolkapLogo size="sm" />

          <nav className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-5 py-3 text-base font-black transition ${
                  item.href === "/dashboard/onboarding"
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
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              {t.heroBadge}
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {t.heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              {t.heroText}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard/create-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                {t.createAI}
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/knowledge-base"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                {t.addKnowledge}
                <BookOpen className="h-6 w-6" />
              </Link>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.readinessBadge}
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {t.readinessTitle}
            </h2>

            <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
              {t.readinessText}
            </p>

            <div className="mt-7 grid gap-3">
              <Link
                href="/dashboard/go-live"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
              >
                {t.goLiveChecklist}
                <Rocket className="h-5 w-5" />
              </Link>

              <Link
                href="/dashboard/usage"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-4 text-base font-black text-[#07111F]"
              >
                {t.checkUsage}
                <BarChart3 className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.setupPath}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.setupTitle}
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              {t.setupText}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {setupSteps.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.step}
                  href={item.href}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                        <Icon className="h-8 w-8" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-[#F7F9FA] px-4 py-2 text-sm font-black text-slate-500">
                            {item.step}
                          </span>
                          <span className="rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                            {item.status}
                          </span>
                        </div>

                        <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">
                          {item.title}
                        </h3>

                        <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                          {item.text}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="h-7 w-7 shrink-0 text-slate-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Settings className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.readinessDetails}
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  {t.readinessDetailsTitle}
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {t.readinessItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xl font-black">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold leading-8 text-slate-600">
                        {item.note}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-white px-4 py-2 text-base font-black text-[#07111F]">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.safetyRules}
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  {t.safetyRulesTitle}
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {t.safetyRulesList.map((rule) => (
                <div
                  key={rule}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.goLiveLogic}
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                {t.goLiveLogicTitle}
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                {t.goLiveLogicText}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/go-live"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                {t.continueSetup}
                <Rocket className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/top-up"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                {t.manageCredits}
                <WalletCards className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}