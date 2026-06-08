"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  getPlanTeamMemberLabel,
  kolkapTopUpPackages,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type PlanText = {
  name: string;
  description: string;
  features: string[];
};

type FaqItem = {
  q: string;
  a: string;
};

type PricingTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  month: string;
  startTrial: string;
  contactUs: string;
  popular: string;
  included: string;
  paymentNeeded: string;
  trialIncluded: string;
  noChargeToday: string;
  autoBilling: string;
  plansTitle: string;
  plansText: string;
  creditTitle: string;
  creditText: string;
  topupTitle: string;
  topupText: string;
  faqTitle: string;
  finalTitle: string;
  finalText: string;
  finalButton: string;
  trialTitle: string;
  trialText: string;
  choosePlan: string;
  topUp: string;
  createAI: string;
  bestValue: string;
  creditWord: string;
  creditRules: [string, string][];
  faqs: FaqItem[];
};

const supportedLanguages: SupportedLanguage[] = ["en", "id", "zh", "ms"];

const publicPlanKeys: KolkapPlanKey[] = [
  "starter",
  "growth",
  "professional",
  "business",
  "enterprise",
];

function getTrialHref(planKey: KolkapPlanKey) {
  if (planKey === "enterprise") return "/contact";

  return `/signup?next=${encodeURIComponent(
    `/dashboard/activate-trial?plan=${planKey}`
  )}`;
}

const planCopy: Record<
  SupportedLanguage,
  Partial<Record<KolkapPlanKey, PlanText>>
> = {
  en: {
    free_trial: {
      name: "Free Trial",
      description: "Try Kolkap before choosing a paid plan.",
      features: [
        "7-day free trial",
        "Payment method needed",
        "No charge today",
        "Test AI replies",
      ],
    },
    starter: {
      name: "Starter AI",
      description:
        "For small businesses that want to start using AI for customer replies, content, and basic automation.",
      features: [
        "7-day free trial",
        "Payment method needed",
        "No charge today",
        "AI reply testing",
        "Business knowledge setup",
        "Basic inbox support",
      ],
    },
    growth: {
      name: "Growth AI",
      description:
        "For growing businesses that need more AI replies, more content, and stronger customer support automation.",
      features: [
        "7-day free trial",
        "Payment method needed",
        "No charge today",
        "More AI staff capacity",
        "Inbox and leads support",
        "Content generation tools",
      ],
    },
    professional: {
      name: "Professional AI",
      description:
        "For serious businesses that want AI to support replies, leads, content, usage tracking, and daily operations.",
      features: [
        "7-day free trial",
        "Payment method needed",
        "No charge today",
        "Recommended for growing teams",
        "More credits and AI staff",
        "Priority workspace setup",
      ],
    },
    business: {
      name: "Business AI",
      description:
        "For busy businesses with higher message volume, multiple AI needs, and stronger automation requirements.",
      features: [
        "7-day free trial",
        "Payment method needed",
        "No charge today",
        "Higher credit allowance",
        "More team access",
        "Best for active operations",
      ],
    },
    enterprise: {
      name: "Enterprise",
      description:
        "For agencies, hotels, clinics, real estate groups, and high-volume teams that need custom setup.",
      features: [
        "Custom onboarding",
        "Custom AI credits",
        "Multiple business locations",
        "Team access",
        "Priority support",
        "Custom automation planning",
      ],
    },
  },

  id: {
    free_trial: {
      name: "Free Trial",
      description: "Coba Kolkap sebelum memilih paket berbayar.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tidak dikenakan biaya hari ini",
        "Test balasan AI",
      ],
    },
    starter: {
      name: "Starter AI",
      description:
        "Untuk bisnis kecil yang ingin mulai memakai AI untuk balasan pelanggan, content, dan basic automation.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tidak dikenakan biaya hari ini",
        "Test balasan AI",
        "Setup business knowledge",
        "Basic inbox support",
      ],
    },
    growth: {
      name: "Growth AI",
      description:
        "Untuk bisnis yang sedang berkembang dan membutuhkan lebih banyak AI replies, content, dan customer support automation.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tidak dikenakan biaya hari ini",
        "Kapasitas AI staff lebih besar",
        "Support inbox dan leads",
        "Tools content generation",
      ],
    },
    professional: {
      name: "Professional AI",
      description:
        "Untuk bisnis serius yang ingin AI membantu replies, leads, content, usage tracking, dan operasional harian.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tidak dikenakan biaya hari ini",
        "Recommended untuk growing teams",
        "Lebih banyak credits dan AI staff",
        "Priority workspace setup",
      ],
    },
    business: {
      name: "Business AI",
      description:
        "Untuk bisnis yang sibuk dengan volume pesan lebih tinggi, kebutuhan AI lebih banyak, dan automation lebih kuat.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tidak dikenakan biaya hari ini",
        "Credit allowance lebih tinggi",
        "Team access lebih besar",
        "Cocok untuk operasional aktif",
      ],
    },
    enterprise: {
      name: "Enterprise",
      description:
        "Untuk agency, hotel, klinik, real estate group, dan high-volume team yang membutuhkan custom setup.",
      features: [
        "Custom onboarding",
        "Custom AI credits",
        "Multiple business locations",
        "Team access",
        "Priority support",
        "Custom automation planning",
      ],
    },
  },

  zh: {
    free_trial: {
      name: "免费试用",
      description: "在选择付费方案前先体验 Kolkap。",
      features: ["7 天免费试用", "需要付款方式", "今天不会收费", "测试 AI 回复"],
    },
    starter: {
      name: "Starter AI",
      description:
        "适合想开始使用 AI 处理客户回复、内容生成和基础自动化的小型企业。",
      features: [
        "7 天免费试用",
        "需要付款方式",
        "今天不会收费",
        "AI 回复测试",
        "业务知识设置",
        "基础 inbox 支持",
      ],
    },
    growth: {
      name: "Growth AI",
      description:
        "适合正在成长、需要更多 AI 回复、更多内容生成和更强客户支持自动化的企业。",
      features: [
        "7 天免费试用",
        "需要付款方式",
        "今天不会收费",
        "更多 AI 员工容量",
        "Inbox 和 leads 支持",
        "内容生成工具",
      ],
    },
    professional: {
      name: "Professional AI",
      description:
        "适合希望用 AI 支持回复、leads、内容、usage tracking 和日常运营的企业。",
      features: [
        "7 天免费试用",
        "需要付款方式",
        "今天不会收费",
        "推荐给成长型团队",
        "更多 credits 和 AI 员工",
        "优先 workspace 设置",
      ],
    },
    business: {
      name: "Business AI",
      description:
        "适合消息量更高、AI 需求更多、需要更强自动化能力的忙碌企业。",
      features: [
        "7 天免费试用",
        "需要付款方式",
        "今天不会收费",
        "更高 credit 配额",
        "更多团队权限",
        "适合活跃运营团队",
      ],
    },
    enterprise: {
      name: "Enterprise",
      description:
        "适合 agency、酒店、诊所、房地产集团和高用量团队，需要定制设置。",
      features: [
        "定制 onboarding",
        "定制 AI credits",
        "多个业务地点",
        "团队权限",
        "优先支持",
        "定制自动化规划",
      ],
    },
  },

  ms: {
    free_trial: {
      name: "Free Trial",
      description: "Cuba Kolkap sebelum memilih pakej berbayar.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tiada caj hari ini",
        "Test balasan AI",
      ],
    },
    starter: {
      name: "Starter AI",
      description:
        "Untuk bisnes kecil yang mahu mula menggunakan AI untuk balasan pelanggan, content, dan basic automation.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tiada caj hari ini",
        "Test balasan AI",
        "Setup business knowledge",
        "Basic inbox support",
      ],
    },
    growth: {
      name: "Growth AI",
      description:
        "Untuk bisnes yang sedang berkembang dan memerlukan lebih banyak AI replies, content, dan customer support automation.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tiada caj hari ini",
        "Kapasiti AI staff lebih besar",
        "Support inbox dan leads",
        "Tools content generation",
      ],
    },
    professional: {
      name: "Professional AI",
      description:
        "Untuk bisnes serius yang mahu AI membantu replies, leads, content, usage tracking, dan operasi harian.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tiada caj hari ini",
        "Disyorkan untuk growing teams",
        "Lebih banyak credits dan AI staff",
        "Priority workspace setup",
      ],
    },
    business: {
      name: "Business AI",
      description:
        "Untuk bisnes yang sibuk dengan volume mesej lebih tinggi, keperluan AI lebih banyak, dan automation lebih kuat.",
      features: [
        "7-day free trial",
        "Payment method diperlukan",
        "Tiada caj hari ini",
        "Credit allowance lebih tinggi",
        "Team access lebih besar",
        "Sesuai untuk operasi aktif",
      ],
    },
    enterprise: {
      name: "Enterprise",
      description:
        "Untuk agency, hotel, klinik, real estate group, dan high-volume team yang memerlukan custom setup.",
      features: [
        "Custom onboarding",
        "Custom AI credits",
        "Multiple business locations",
        "Team access",
        "Priority support",
        "Custom automation planning",
      ],
    },
  },
};

const translations: Record<SupportedLanguage, PricingTranslation> = {
  en: {
    badge: "Kolkap Pricing",
    title: "AI staff pricing for serious business owners.",
    subtitle:
      "Start with a 7-day free trial. Payment method needed to activate your trial. You won’t be charged today.",
    month: "/month",
    startTrial: "Start 7-Day Free Trial",
    contactUs: "Contact Us",
    popular: "Recommended",
    included: "Included",
    paymentNeeded:
      "Payment method needed to activate your trial. You won’t be charged today.",
    trialIncluded: "7-day free trial",
    noChargeToday: "No charge today",
    autoBilling: "Monthly billing starts after trial unless cancelled.",
    plansTitle: "Choose your AI staff plan",
    plansText:
      "Kolkap is built as a 24/7 AI business assistant for replies, content, inbox support, customer questions, and future WhatsApp or website chat automation.",
    creditTitle: "How AI credits work",
    creditText:
      "Every successful AI generation or AI reply uses credits. The button will clearly show the cost before the user clicks.",
    topupTitle: "Need more AI credits?",
    topupText:
      "Top up anytime when your business needs more AI replies, content generation, or campaign support before the next billing cycle.",
    faqTitle: "Pricing FAQ",
    finalTitle: "Start with 7 days free.",
    finalText:
      "Create your AI staff, add business knowledge, test the replies, and see how Kolkap can support your business.",
    finalButton: "Start 7-Day Free Trial",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method needed to activate your trial. You won’t be charged today. Monthly billing starts after your 7-day trial unless cancelled before the trial ends.",
    choosePlan: "Start Trial",
    topUp: "Top Up",
    createAI: "Create AI",
    bestValue: "Best Value",
    creditWord: "credits",
    creditRules: [
      ["Generate Test AI Reply", "3 credits"],
      ["Generate Inbox AI Reply", "3 credits"],
      ["Generate Content Studio content", "5 credits"],
      ["Website Chat AI Reply", "from 3 credits"],
      ["WhatsApp AI Reply", "from 5 credits"],
      ["Long content / campaign pack", "more credits"],
    ],
    faqs: [
      {
        q: "Do users need a payment method to start the trial?",
        a: "Yes. A payment method is needed to activate the trial, but the user will not be charged today. Monthly billing starts after the 7-day trial unless cancelled before the trial ends.",
      },
      {
        q: "How are credits used?",
        a: "Credits are used whenever Kolkap generates or sends AI-powered output. Test AI and Inbox AI Reply start from 3 credits, Content Studio starts from 5 credits, Website Chat starts from 3 credits, and WhatsApp AI Reply starts from 5 credits. Longer replies may use more credits.",
      },
      {
        q: "Can users top up credits?",
        a: "Yes. Users can buy extra credits when their business needs more AI replies or content before the next monthly renewal.",
      },
      {
        q: "What happens when credits run out?",
        a: "AI generation should stop or ask the user to top up or upgrade. This protects the business from unexpected usage.",
      },
    ],
  },

  id: {
    badge: "Harga Kolkap",
    title: "Harga AI staff untuk pemilik bisnis yang serius.",
    subtitle:
      "Mulai dengan 7-day free trial. Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan biaya hari ini.",
    month: "/bulan",
    startTrial: "Mulai 7-Day Free Trial",
    contactUs: "Hubungi Kami",
    popular: "Recommended",
    included: "Termasuk",
    paymentNeeded:
      "Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan biaya hari ini.",
    trialIncluded: "7-day free trial",
    noChargeToday: "Tidak dikenakan biaya hari ini",
    autoBilling: "Monthly billing berjalan setelah trial kecuali dibatalkan.",
    plansTitle: "Pilih paket AI staff Anda",
    plansText:
      "Kolkap dibuat sebagai 24/7 AI business assistant untuk replies, content, inbox support, pertanyaan customer, dan nanti WhatsApp atau website chat automation.",
    creditTitle: "Cara kerja AI credits",
    creditText:
      "Setiap successful AI generation atau AI reply menggunakan credits. Button akan menunjukkan cost dengan jelas sebelum user klik.",
    topupTitle: "Butuh lebih banyak AI credits?",
    topupText:
      "Top up kapan saja saat bisnis Anda butuh lebih banyak AI replies, content generation, atau campaign support sebelum billing cycle berikutnya.",
    faqTitle: "FAQ Harga",
    finalTitle: "Mulai dengan 7 hari gratis.",
    finalText:
      "Buat AI staff, tambah business knowledge, test replies, dan lihat bagaimana Kolkap bisa mendukung bisnis Anda.",
    finalButton: "Mulai 7-Day Free Trial",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan biaya hari ini. Monthly billing berjalan setelah 7-day trial kecuali dibatalkan sebelum trial selesai.",
    choosePlan: "Mulai Trial",
    topUp: "Top Up",
    createAI: "Buat AI",
    bestValue: "Best Value",
    creditWord: "credits",
    creditRules: [
      ["Generate Test AI Reply", "3 credits"],
      ["Generate Inbox AI Reply", "3 credits"],
      ["Generate Content Studio content", "5 credits"],
      ["Website Chat AI Reply", "mulai dari 3 credits"],
      ["WhatsApp AI Reply", "mulai dari 5 credits"],
      ["Long content / campaign pack", "lebih banyak credits"],
    ],
    faqs: [
      {
        q: "Apakah user perlu payment method untuk mulai trial?",
        a: "Ya. Payment method diperlukan untuk mengaktifkan trial, tetapi user tidak akan dikenakan biaya hari ini. Monthly billing berjalan setelah 7-day trial kecuali dibatalkan sebelum trial selesai.",
      },
      {
        q: "Bagaimana credits digunakan?",
        a: "Credits digunakan setiap kali Kolkap membuat atau mengirim output AI. Test AI dan Inbox AI Reply mulai dari 3 credits, Content Studio mulai dari 5 credits, Website Chat mulai dari 3 credits, dan WhatsApp AI Reply mulai dari 5 credits. Balasan yang lebih panjang bisa memakai lebih banyak credits.",
      },
      {
        q: "Apakah user bisa top up credits?",
        a: "Ya. User bisa membeli extra credits saat bisnis membutuhkan lebih banyak AI replies atau content sebelum renewal bulanan berikutnya.",
      },
      {
        q: "Apa yang terjadi kalau credits habis?",
        a: "AI generation harus stop atau meminta user untuk top up atau upgrade. Ini melindungi bisnis dari usage yang tidak terkontrol.",
      },
    ],
  },

  zh: {
    badge: "Kolkap 价格",
    title: "为认真经营的企业主打造的 AI 员工价格。",
    subtitle:
      "从 7 天免费试用开始。需要添加付款方式来激活试用。今天不会收费。",
    month: "/月",
    startTrial: "开始 7 天免费试用",
    contactUs: "联系我们",
    popular: "推荐",
    included: "包含",
    paymentNeeded: "需要添加付款方式来激活试用。今天不会收费。",
    trialIncluded: "7 天免费试用",
    noChargeToday: "今天不会收费",
    autoBilling: "试用结束后将按月计费，除非提前取消。",
    plansTitle: "选择您的 AI 员工方案",
    plansText:
      "Kolkap 是 24/7 AI business assistant，可支持客户回复、内容生成、inbox support、客户问题，以及未来的 WhatsApp 或网站聊天自动化。",
    creditTitle: "AI credits 如何运作",
    creditText:
      "每次成功的 AI generation 或 AI reply 都会使用 credits。按钮会在用户点击前清楚显示所需 credits。",
    topupTitle: "需要更多 AI credits？",
    topupText:
      "当业务在下一个 billing cycle 前需要更多 AI 回复、内容生成或 campaign support 时，可以随时 top up。",
    faqTitle: "价格常见问题",
    finalTitle: "从 7 天免费试用开始。",
    finalText:
      "创建您的 AI 员工、添加业务知识、测试回复，并了解 Kolkap 如何支持您的业务。",
    finalButton: "开始 7 天免费试用",
    trialTitle: "7 天免费试用",
    trialText:
      "需要添加付款方式来激活试用。今天不会收费。7 天试用结束后将按月计费，除非您在试用结束前取消。",
    choosePlan: "开始试用",
    topUp: "Top Up",
    createAI: "创建 AI",
    bestValue: "最划算",
    creditWord: "credits",
    creditRules: [
      ["生成 Test AI 回复", "3 credits"],
      ["生成 Inbox AI 回复", "3 credits"],
      ["生成 Content Studio 内容", "5 credits"],
      ["Website Chat AI 回复", "从 3 credits 起"],
      ["WhatsApp AI 回复", "从 5 credits 起"],
      ["长内容 / campaign pack", "使用更多 credits"],
    ],
    faqs: [
      {
        q: "用户开始试用需要付款方式吗？",
        a: "需要。付款方式用于激活试用，但今天不会收费。7 天试用结束后将按月计费，除非用户在试用结束前取消。",
      },
      {
        q: "credits 如何使用？",
        a: "每当 Kolkap 生成或发送 AI 输出时都会使用 credits。Test AI 和 Inbox AI Reply 从 3 credits 开始，Content Studio 从 5 credits 开始，Website Chat 从 3 credits 开始，WhatsApp AI Reply 从 5 credits 开始。较长回复可能会使用更多 credits。",
      },
      {
        q: "用户可以 top up credits 吗？",
        a: "可以。当业务在下一个月度续费前需要更多 AI 回复或内容时，可以购买额外 credits。",
      },
      {
        q: "credits 用完后会怎样？",
        a: "AI generation 应该停止，或提示用户 top up 或 upgrade。这样可以避免不可控的 usage。",
      },
    ],
  },

  ms: {
    badge: "Harga Kolkap",
    title: "Harga AI staff untuk pemilik bisnes yang serius.",
    subtitle:
      "Mulakan dengan 7-day free trial. Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan caj hari ini.",
    month: "/bulan",
    startTrial: "Mulakan 7-Day Free Trial",
    contactUs: "Hubungi Kami",
    popular: "Disyorkan",
    included: "Termasuk",
    paymentNeeded:
      "Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan caj hari ini.",
    trialIncluded: "7-day free trial",
    noChargeToday: "Tiada caj hari ini",
    autoBilling: "Monthly billing bermula selepas trial kecuali dibatalkan.",
    plansTitle: "Pilih pakej AI staff anda",
    plansText:
      "Kolkap dibina sebagai 24/7 AI business assistant untuk replies, content, inbox support, soalan pelanggan, dan nanti WhatsApp atau website chat automation.",
    creditTitle: "Cara AI credits berfungsi",
    creditText:
      "Setiap successful AI generation atau AI reply menggunakan credits. Button akan menunjukkan cost dengan jelas sebelum user klik.",
    topupTitle: "Perlukan lebih banyak AI credits?",
    topupText:
      "Top up bila-bila masa apabila bisnes anda memerlukan lebih banyak AI replies, content generation, atau campaign support sebelum billing cycle seterusnya.",
    faqTitle: "FAQ Harga",
    finalTitle: "Mulakan dengan 7 hari percuma.",
    finalText:
      "Cipta AI staff, tambah business knowledge, test replies, dan lihat bagaimana Kolkap boleh menyokong bisnes anda.",
    finalButton: "Mulakan 7-Day Free Trial",
    trialTitle: "7-Day Free Trial",
    trialText:
      "Payment method diperlukan untuk mengaktifkan trial. Anda tidak akan dikenakan caj hari ini. Monthly billing bermula selepas 7-day trial kecuali dibatalkan sebelum trial tamat.",
    choosePlan: "Mulakan Trial",
    topUp: "Top Up",
    createAI: "Cipta AI",
    bestValue: "Best Value",
    creditWord: "credits",
    creditRules: [
      ["Generate Test AI Reply", "3 credits"],
      ["Generate Inbox AI Reply", "3 credits"],
      ["Generate Content Studio content", "5 credits"],
      ["Website Chat AI Reply", "bermula daripada 3 credits"],
      ["WhatsApp AI Reply", "bermula daripada 5 credits"],
      ["Long content / campaign pack", "lebih banyak credits"],
    ],
    faqs: [
      {
        q: "Adakah user perlukan payment method untuk mula trial?",
        a: "Ya. Payment method diperlukan untuk mengaktifkan trial, tetapi user tidak akan dikenakan caj hari ini. Monthly billing bermula selepas 7-day trial kecuali dibatalkan sebelum trial tamat.",
      },
      {
        q: "Bagaimana credits digunakan?",
        a: "Credits digunakan setiap kali Kolkap menjana atau menghantar output AI. Test AI dan Inbox AI Reply bermula daripada 3 credits, Content Studio bermula daripada 5 credits, Website Chat bermula daripada 3 credits, dan WhatsApp AI Reply bermula daripada 5 credits. Balasan yang lebih panjang mungkin menggunakan lebih banyak credits.",
      },
      {
        q: "Boleh user top up credits?",
        a: "Ya. User boleh membeli extra credits apabila bisnes memerlukan lebih banyak AI replies atau content sebelum monthly renewal seterusnya.",
      },
      {
        q: "Apa berlaku jika credits habis?",
        a: "AI generation perlu berhenti atau minta user top up atau upgrade. Ini melindungi bisnes daripada usage yang tidak terkawal.",
      },
    ],
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : "en";
}

function localizePlanLabel(label: string, language: SupportedLanguage) {
  if (language === "zh") {
    return label
      .replace("Custom credits", "定制 credits")
      .replace("trial credits", "试用 credits")
      .replace("credits/month", "credits/月")
      .replace("AI staff", "AI 员工")
      .replace("Custom team members", "定制团队成员")
      .replace("team members", "团队成员")
      .replace("team member", "团队成员")
      .replace("Custom", "定制");
  }

  if (language === "id") {
    return label
      .replace("Custom credits", "Custom credits")
      .replace("trial credits", "trial credits")
      .replace("credits/month", "credits/bulan")
      .replace("Custom AI staff", "Custom AI staff")
      .replace("Custom team members", "Custom team members");
  }

  if (language === "ms") {
    return label
      .replace("Custom credits", "Custom credits")
      .replace("trial credits", "trial credits")
      .replace("credits/month", "credits/bulan")
      .replace("Custom AI staff", "Custom AI staff")
      .replace("Custom team members", "Custom team members");
  }

  return label;
}

export default function PricingPage() {
  const { language } = useKolkapLanguage();
  const lang = getSupportedLanguage(language);
  const t = translations[lang];
  const copy = planCopy[lang];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
            {t.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.trialIncluded}
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.noChargeToday}
            </span>

            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.autoBilling}
            </span>
          </div>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href={getTrialHref("starter")}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              {t.startTrial}
              <ArrowRight className="h-6 w-6" />
            </Link>

            <Link
              href={getTrialHref("starter")}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Bot className="h-6 w-6" />
              {t.createAI}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-10 max-w-4xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.plansTitle}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.plansText}
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
          {publicPlanKeys.map((planKey) => {
            const plan = getKolkapPlan(planKey);
            const translatedPlan = copy[planKey] || planCopy.en[planKey];
            const highlighted = plan.key === "professional";

            return (
              <div
                key={plan.key}
                className={`relative rounded-[2rem] border p-6 shadow-sm transition hover:-translate-y-1 ${
                  highlighted
                    ? "border-[#07111F] bg-[#07111F] text-white shadow-2xl shadow-slate-900/20"
                    : "border-slate-200 bg-white text-[#07111F] shadow-slate-900/5"
                }`}
              >
                {highlighted ? (
                  <div className="absolute -top-4 left-6 inline-flex items-center gap-2 rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                    <Star className="h-4 w-4" />
                    {t.popular}
                  </div>
                ) : null}

                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    highlighted
                      ? "bg-white text-[#07111F]"
                      : "bg-[#07111F] text-[#7CFF3D]"
                  }`}
                >
                  {plan.key === "starter" ? (
                    <Sparkles className="h-7 w-7" />
                  ) : plan.key === "growth" ? (
                    <Rocket className="h-7 w-7" />
                  ) : plan.key === "professional" ? (
                    <Zap className="h-7 w-7" />
                  ) : (
                    <Users className="h-7 w-7" />
                  )}
                </div>

                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  {translatedPlan?.name || plan.name}
                </h3>

                <p className="mt-3 text-5xl font-black tracking-[-0.06em]">
                  {plan.priceLabel === "Custom"
                    ? t.contactUs
                    : `$${plan.monthlyPriceUsd}`}
                  {plan.monthlyPriceUsd ? (
                    <span
                      className={`text-xl ${
                        highlighted ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {t.month}
                    </span>
                  ) : null}
                </p>

                <p
                  className={`mt-5 text-base font-semibold leading-7 ${
                    highlighted ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {translatedPlan?.description || plan.description}
                </p>

                <div className="mt-7 space-y-3">
                  <p
                    className={`text-sm font-black uppercase tracking-[0.18em] ${
                      highlighted ? "text-[#7CFF3D]" : "text-blue-600"
                    }`}
                  >
                    {t.included}
                  </p>

                  <PlanFeature
                    text={localizePlanLabel(getPlanCreditLabel(plan), lang)}
                    highlighted={highlighted}
                  />
                  <PlanFeature
                    text={localizePlanLabel(getPlanAIStaffLabel(plan), lang)}
                    highlighted={highlighted}
                  />
                  <PlanFeature
                    text={localizePlanLabel(getPlanTeamMemberLabel(plan), lang)}
                    highlighted={highlighted}
                  />

                  {(translatedPlan?.features || []).map((feature) => (
                    <PlanFeature
                      key={feature}
                      text={feature}
                      highlighted={highlighted}
                    />
                  ))}
                </div>

                <Link
                  href={getTrialHref(plan.key)}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-lg font-black ${
                    highlighted
                      ? "bg-white text-[#07111F]"
                      : "bg-[#07111F] text-white"
                  }`}
                >
                  {plan.key === "enterprise" ? t.contactUs : t.choosePlan}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.trialTitle}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.trialText}
              </h2>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-14">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <CreditCard className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.creditTitle}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.creditText}
          </h2>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="grid gap-3">
            {t.creditRules.map(([action, credits]) => (
              <CreditRuleRow key={action} action={action} credits={credits} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="mb-8 max-w-4xl">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {t.topupTitle}
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              {t.topupText}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {kolkapTopUpPackages.map((pack) => {
              const bestValue = pack.id === "topup_250";

              return (
                <div
                  key={pack.id}
                  className={`rounded-[2rem] border p-6 ${
                    bestValue
                      ? "border-[#7CFF3D] bg-white text-[#07111F]"
                      : "border-white/10 bg-white/5 text-white"
                  }`}
                >
                  {bestValue ? (
                    <div className="mb-4 inline-flex rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                      {t.bestValue}
                    </div>
                  ) : null}

                  <p className="text-5xl font-black tracking-[-0.06em]">
                    ${pack.priceUsd}
                  </p>

                  <p
                    className={`mt-4 text-xl font-black ${
                      bestValue ? "text-[#07111F]" : "text-[#7CFF3D]"
                    }`}
                  >
                    {pack.credits.toLocaleString()} {t.creditWord}
                  </p>

                  <Link
                    href={`/signup?next=${encodeURIComponent(
                      "/dashboard/top-up"
                    )}`}
                    className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full px-5 py-4 text-base font-black ${
                      bestValue
                        ? "bg-[#07111F] text-white"
                        : "bg-white text-[#07111F]"
                    }`}
                  >
                    {t.topUp}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.faqTitle}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {t.faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <HelpCircle className="h-7 w-7" />
              </div>

              <h3 className="text-2xl font-black tracking-[-0.04em]">
                {faq.q}
              </h3>

              <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-center text-white shadow-2xl shadow-slate-900/20 sm:p-12">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#7CFF3D] text-[#07111F]">
            <ShieldCheck className="h-10 w-10" />
          </div>

          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.finalTitle}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
            {t.finalText}
          </p>

          <Link
            href={getTrialHref("starter")}
            className="mt-9 inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
          >
            {t.finalButton}
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function PlanFeature({
  text,
  highlighted,
}: {
  text: string;
  highlighted: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2
        className={`mt-1 h-6 w-6 shrink-0 ${
          highlighted ? "text-[#7CFF3D]" : "text-[#07111F]"
        }`}
      />

      <p
        className={`text-base font-black leading-7 ${
          highlighted ? "text-slate-200" : "text-slate-700"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function CreditRuleRow({
  action,
  credits,
}: {
  action: string;
  credits: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <MessageCircle className="h-6 w-6 text-slate-500" />
        <p className="text-lg font-black">{action}</p>
      </div>

      <span className="rounded-full bg-white px-5 py-3 text-base font-black text-[#07111F]">
        {credits}
      </span>
    </div>
  );
}