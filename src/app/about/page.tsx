"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  Globe2,
  HeartHandshake,
  Inbox,
  Languages,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type Card = {
  title: string;
  text: string;
};

type AboutTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  trustPills: string[];

  storyBadge: string;
  storyTitle: string;
  storyText: string[];

  missionBadge: string;
  missionTitle: string;
  missionText: string;

  visionBadge: string;
  visionTitle: string;
  visionText: string;

  beliefsBadge: string;
  beliefsTitle: string;
  beliefsText: string;
  beliefs: Card[];

  whatBadge: string;
  whatTitle: string;
  whatText: string;
  whatCards: Card[];

  serveBadge: string;
  serveTitle: string;
  serveText: string;
  serveList: string[];

  directionBadge: string;
  directionTitle: string;
  directionText: string;
  directionSteps: string[];

  languageBadge: string;
  languageTitle: string;
  languageText: string;
  languageList: string[];

  finalTitle: string;
  finalText: string;
  finalCta: string;
};

const supportedLanguages: SupportedLanguage[] = ["en", "id", "zh", "ms"];

const translations: Record<SupportedLanguage, AboutTranslation> = {
  en: {
    badge: "About Us",
    title: "We are building AI staff for modern businesses.",
    subtitle:
      "Kolkap exists to make AI practical for real businesses — not as another generic AI tool, but as AI staff that can understand business knowledge, support customer conversations, manage leads, and help teams work faster.",
    primaryCta: "Start Free Trial",
    secondaryCta: "View Pricing",
    trustPills: [
      "AI staff for businesses",
      "Built from Australia",
      "WhatsApp connected",
      "EN / ID / ZH / MS",
    ],

    storyBadge: "Our Story",
    storyTitle: "Kolkap was created for businesses that need help every day.",
    storyText: [
      "Many businesses receive the same questions again and again. Customers ask about pricing, availability, services, bookings, products, policies, and next steps. Business owners and teams often spend hours repeating the same replies.",
      "Generic AI tools can be powerful, but they are not always easy for normal business users. They often require prompts, technical setup, or manual copy-paste work.",
      "Kolkap was created to solve that gap. We believe businesses need AI staff — not just AI tools. AI staff should understand the business, reply clearly, support the inbox, help capture leads, and work inside one simple workspace.",
    ],

    missionBadge: "Our Mission",
    missionTitle: "Make AI staff simple, useful, and accessible for real businesses.",
    missionText:
      "Our mission is to help businesses use AI in a practical way: faster replies, better customer support, clearer lead handling, and less repetitive admin work.",

    visionBadge: "Our Vision",
    visionTitle: "A trusted AI staff platform for businesses across multilingual markets.",
    visionText:
      "Our vision is for Kolkap to become a trusted AI staff platform for businesses, starting from Australia and expanding across markets where businesses need multilingual support, messaging automation, and simple AI-powered operations.",

    beliefsBadge: "What We Believe",
    beliefsTitle: "AI should support business, not make it complicated.",
    beliefsText:
      "Kolkap is built around simple principles that guide the product, the customer experience, and the way AI should work for businesses.",
    beliefs: [
      {
        title: "AI should be simple",
        text: "Business users should not need to understand webhooks, API keys, workspace routing, or technical setup.",
      },
      {
        title: "Business knowledge matters",
        text: "AI staff should answer based on the business’s own knowledge, tone, services, FAQs, and instructions.",
      },
      {
        title: "Humans stay in control",
        text: "AI should support teams, not replace responsible human judgment or customer care.",
      },
      {
        title: "Messaging should be easier",
        text: "WhatsApp, website chat, inbox, leads, and handover should feel organized in one workspace.",
      },
      {
        title: "Usage should be clear",
        text: "Businesses should understand when credits are used and what each AI action costs.",
      },
      {
        title: "Trust comes first",
        text: "Privacy, account deletion, billing clarity, and honest AI limitations should be clear to users.",
      },
    ],

    whatBadge: "What Kolkap Does",
    whatTitle: "Kolkap turns business knowledge into AI staff.",
    whatText:
      "Kolkap helps businesses create AI staff that can support real customer conversations and daily business tasks.",
    whatCards: [
      {
        title: "AI replies",
        text: "Generate replies for inbox, WhatsApp, website chat, and customer support conversations.",
      },
      {
        title: "Knowledge base",
        text: "Add business information, services, pricing, FAQs, instructions, and tone for your AI staff.",
      },
      {
        title: "Inbox and leads",
        text: "Manage conversations, handover, customer status, leads, and follow-up in one place.",
      },
      {
        title: "Usage and billing",
        text: "Track credits, usage, plan status, trial, billing, and top-up needs clearly.",
      },
    ],

    serveBadge: "Who We Serve",
    serveTitle: "Built for service businesses, local businesses, teams, and growing companies.",
    serveText:
      "Kolkap is useful for businesses that receive customer questions, leads, bookings, inquiries, support requests, or repetitive messages.",
    serveList: [
      "Real estate businesses",
      "Hotels, villas, and accommodation",
      "Travel and tourism businesses",
      "Restaurants and cafes",
      "Clinics, beauty, and wellness businesses",
      "Retail and online shops",
      "Agencies and professional services",
      "Local businesses using WhatsApp for leads",
    ],

    directionBadge: "Our Direction",
    directionTitle: "One simple workspace for AI staff and business conversations.",
    directionText:
      "Kolkap is moving toward a complete AI staff workspace where businesses can create staff, add knowledge, test replies, connect channels, manage conversations, track leads, and control usage.",
    directionSteps: [
      "Create AI staff",
      "Add business knowledge",
      "Test replies",
      "Connect WhatsApp and website chat",
      "Manage inbox, leads, and handover",
      "Track usage, credits, billing, and top-ups",
    ],

    languageBadge: "Languages",
    languageTitle: "Built for multilingual business support.",
    languageText:
      "Kolkap supports English, Indonesian, Chinese, and Malay so businesses can serve customers across different markets.",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],

    finalTitle: "Kolkap is building the future of AI staff for business.",
    finalText:
      "Create AI staff, add business knowledge, connect customer channels, and help your team reply faster with a simple business-ready AI workspace.",
    finalCta: "Start Free Trial",
  },

  id: {
    badge: "Tentang Kami",
    title: "Kami membangun AI staff untuk bisnis modern.",
    subtitle:
      "Kolkap hadir untuk membuat AI praktis bagi bisnis nyata — bukan sebagai generic AI tool, tetapi sebagai AI staff yang memahami business knowledge, membantu customer conversations, mengelola leads, dan membantu team bekerja lebih cepat.",
    primaryCta: "Mulai Free Trial",
    secondaryCta: "Lihat Pricing",
    trustPills: [
      "AI staff untuk bisnis",
      "Dibangun dari Australia",
      "WhatsApp terhubung",
      "EN / ID / ZH / MS",
    ],

    storyBadge: "Cerita Kami",
    storyTitle: "Kolkap dibuat untuk bisnis yang butuh bantuan setiap hari.",
    storyText: [
      "Banyak bisnis menerima pertanyaan yang sama berulang kali. Customer bertanya tentang harga, availability, layanan, booking, produk, policy, dan langkah berikutnya. Business owner dan team sering menghabiskan waktu untuk membalas hal yang sama.",
      "Generic AI tools memang kuat, tetapi tidak selalu mudah untuk pengguna bisnis biasa. Sering kali butuh prompt, technical setup, atau copy-paste manual.",
      "Kolkap dibuat untuk menyelesaikan gap itu. Kami percaya bisnis membutuhkan AI staff — bukan hanya AI tools. AI staff harus memahami bisnis, membalas dengan jelas, mendukung inbox, membantu menangkap leads, dan bekerja dalam satu workspace yang simple.",
    ],

    missionBadge: "Misi Kami",
    missionTitle: "Membuat AI staff simple, berguna, dan mudah digunakan untuk bisnis nyata.",
    missionText:
      "Misi kami adalah membantu bisnis menggunakan AI secara praktis: balasan lebih cepat, customer support lebih baik, lead handling lebih jelas, dan pekerjaan admin berulang yang lebih sedikit.",

    visionBadge: "Visi Kami",
    visionTitle: "Menjadi platform AI staff terpercaya untuk bisnis di multilingual markets.",
    visionText:
      "Visi kami adalah menjadikan Kolkap platform AI staff terpercaya untuk bisnis, dimulai dari Australia dan berkembang ke market yang membutuhkan multilingual support, messaging automation, dan operasional bisnis berbasis AI yang simple.",

    beliefsBadge: "Yang Kami Percaya",
    beliefsTitle: "AI harus mendukung bisnis, bukan membuatnya rumit.",
    beliefsText:
      "Kolkap dibangun berdasarkan prinsip sederhana yang memandu product, customer experience, dan cara AI seharusnya bekerja untuk bisnis.",
    beliefs: [
      {
        title: "AI harus simple",
        text: "Pengguna bisnis tidak perlu memahami webhooks, API keys, workspace routing, atau technical setup.",
      },
      {
        title: "Business knowledge penting",
        text: "AI staff harus menjawab berdasarkan knowledge, tone, services, FAQ, dan instruksi dari bisnis itu sendiri.",
      },
      {
        title: "Manusia tetap memegang kontrol",
        text: "AI harus mendukung team, bukan menggantikan judgment manusia atau customer care yang bertanggung jawab.",
      },
      {
        title: "Messaging harus lebih mudah",
        text: "WhatsApp, website chat, inbox, leads, dan handover harus terasa rapi dalam satu workspace.",
      },
      {
        title: "Usage harus jelas",
        text: "Bisnis harus memahami kapan credits digunakan dan berapa biaya setiap AI action.",
      },
      {
        title: "Trust adalah prioritas",
        text: "Privacy, account deletion, billing clarity, dan batasan AI harus jelas untuk user.",
      },
    ],

    whatBadge: "Apa yang Kolkap Lakukan",
    whatTitle: "Kolkap mengubah business knowledge menjadi AI staff.",
    whatText:
      "Kolkap membantu bisnis membuat AI staff yang dapat mendukung customer conversations dan pekerjaan harian bisnis.",
    whatCards: [
      {
        title: "AI replies",
        text: "Generate replies untuk inbox, WhatsApp, website chat, dan customer support conversations.",
      },
      {
        title: "Knowledge base",
        text: "Tambahkan informasi bisnis, services, pricing, FAQ, instructions, dan tone untuk AI staff Anda.",
      },
      {
        title: "Inbox dan leads",
        text: "Kelola conversations, handover, customer status, leads, dan follow-up dalam satu tempat.",
      },
      {
        title: "Usage dan billing",
        text: "Lacak credits, usage, plan status, trial, billing, dan kebutuhan top-up dengan jelas.",
      },
    ],

    serveBadge: "Siapa yang Kami Layani",
    serveTitle: "Dibangun untuk service businesses, local businesses, teams, dan growing companies.",
    serveText:
      "Kolkap berguna untuk bisnis yang menerima customer questions, leads, bookings, inquiries, support requests, atau pesan berulang.",
    serveList: [
      "Bisnis real estate",
      "Hotel, villa, dan akomodasi",
      "Travel dan tourism businesses",
      "Restoran dan cafe",
      "Klinik, beauty, dan wellness businesses",
      "Retail dan online shops",
      "Agencies dan professional services",
      "Local businesses yang menggunakan WhatsApp untuk leads",
    ],

    directionBadge: "Arah Kami",
    directionTitle: "Satu workspace simple untuk AI staff dan business conversations.",
    directionText:
      "Kolkap bergerak menuju workspace AI staff yang lengkap, tempat bisnis dapat membuat staff, menambah knowledge, test replies, connect channels, mengelola conversations, track leads, dan mengontrol usage.",
    directionSteps: [
      "Buat AI staff",
      "Tambahkan business knowledge",
      "Test replies",
      "Connect WhatsApp dan website chat",
      "Kelola inbox, leads, dan handover",
      "Track usage, credits, billing, dan top-ups",
    ],

    languageBadge: "Bahasa",
    languageTitle: "Dibangun untuk multilingual business support.",
    languageText:
      "Kolkap mendukung English, Indonesian, Chinese, dan Malay agar bisnis dapat melayani customer di berbagai market.",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],

    finalTitle: "Kolkap sedang membangun masa depan AI staff untuk bisnis.",
    finalText:
      "Buat AI staff, tambahkan business knowledge, connect customer channels, dan bantu team Anda membalas lebih cepat dengan AI workspace yang siap untuk bisnis.",
    finalCta: "Mulai Free Trial",
  },

  zh: {
    badge: "关于我们",
    title: "我们正在为现代企业打造 AI 员工。",
    subtitle:
      "Kolkap 的存在，是为了让 AI 真正服务现实中的企业 — 不是又一个普通 AI 工具，而是能理解 business knowledge、支持 customer conversations、管理 leads、并帮助团队更快工作的 AI staff。",
    primaryCta: "开始免费试用",
    secondaryCta: "查看价格",
    trustPills: [
      "面向企业的 AI 员工",
      "从澳大利亚出发",
      "WhatsApp 已连接",
      "EN / ID / ZH / MS",
    ],

    storyBadge: "我们的故事",
    storyTitle: "Kolkap 为每天需要帮助的企业而创建。",
    storyText: [
      "许多企业每天都会收到重复的问题。客户会询问价格、availability、服务、booking、产品、policy 和下一步。Business owners 和 teams 经常花大量时间重复回复同样的问题。",
      "Generic AI tools 很强大，但对普通企业用户来说不一定简单。它们经常需要 prompts、technical setup 或手动 copy-paste。",
      "Kolkap 正是为了解决这个 gap 而创建。我们相信企业需要 AI staff，而不只是 AI tools。AI staff 应该理解企业、清晰回复、支持 inbox、帮助捕捉 leads，并在一个简单 workspace 中工作。",
    ],

    missionBadge: "我们的使命",
    missionTitle: "让 AI staff 对真实企业变得简单、有用、容易使用。",
    missionText:
      "我们的使命是帮助企业以实际方式使用 AI：更快回复、更好的客户支持、更清晰的 lead handling，以及更少重复 admin work。",

    visionBadge: "我们的愿景",
    visionTitle: "成为跨多语言市场的可信企业 AI staff 平台。",
    visionText:
      "我们的愿景是让 Kolkap 成为企业信任的 AI staff 平台，从澳大利亚开始，并扩展到需要 multilingual support、messaging automation 和简单 AI-powered operations 的市场。",

    beliefsBadge: "我们的信念",
    beliefsTitle: "AI 应该支持企业，而不是让企业更复杂。",
    beliefsText:
      "Kolkap 围绕简单原则构建，这些原则指导我们的 product、customer experience，以及 AI 应该如何服务企业。",
    beliefs: [
      {
        title: "AI 应该简单",
        text: "企业用户不应该需要理解 webhooks、API keys、workspace routing 或 technical setup。",
      },
      {
        title: "Business knowledge 很重要",
        text: "AI staff 应根据企业自己的 knowledge、tone、services、FAQs 和 instructions 作答。",
      },
      {
        title: "人类保持控制",
        text: "AI 应该支持 teams，而不是取代负责任的人类判断或 customer care。",
      },
      {
        title: "Messaging 应该更容易",
        text: "WhatsApp、website chat、inbox、leads 和 handover 应在一个 workspace 中保持有序。",
      },
      {
        title: "Usage 应该清楚",
        text: "企业应该了解 credits 何时被使用，以及每个 AI action 的成本。",
      },
      {
        title: "信任优先",
        text: "Privacy、account deletion、billing clarity 和 AI limitations 都应清楚告知 users。",
      },
    ],

    whatBadge: "Kolkap 做什么",
    whatTitle: "Kolkap 将 business knowledge 转化为 AI staff。",
    whatText:
      "Kolkap 帮助企业创建 AI staff，用于支持真实 customer conversations 和日常业务任务。",
    whatCards: [
      {
        title: "AI replies",
        text: "为 inbox、WhatsApp、website chat 和 customer support conversations 生成 replies。",
      },
      {
        title: "Knowledge base",
        text: "添加 business information、services、pricing、FAQs、instructions 和 tone 给您的 AI staff。",
      },
      {
        title: "Inbox 和 leads",
        text: "在一个地方管理 conversations、handover、customer status、leads 和 follow-up。",
      },
      {
        title: "Usage 和 billing",
        text: "清楚追踪 credits、usage、plan status、trial、billing 和 top-up needs。",
      },
    ],

    serveBadge: "我们服务谁",
    serveTitle: "为 service businesses、local businesses、teams 和 growing companies 而建。",
    serveText:
      "Kolkap 适合经常收到 customer questions、leads、bookings、inquiries、support requests 或重复消息的企业。",
    serveList: [
      "房地产企业",
      "酒店、别墅和住宿",
      "旅游和旅行企业",
      "餐厅和咖啡馆",
      "诊所、美容和 wellness businesses",
      "零售和 online shops",
      "Agencies 和 professional services",
      "使用 WhatsApp 获取 leads 的 local businesses",
    ],

    directionBadge: "我们的方向",
    directionTitle: "一个简单 workspace，管理 AI staff 和 business conversations。",
    directionText:
      "Kolkap 正朝着完整 AI staff workspace 发展，让企业能够创建 staff、添加 knowledge、test replies、connect channels、管理 conversations、track leads，并控制 usage。",
    directionSteps: [
      "创建 AI staff",
      "添加 business knowledge",
      "测试 replies",
      "连接 WhatsApp 和 website chat",
      "管理 inbox、leads 和 handover",
      "追踪 usage、credits、billing 和 top-ups",
    ],

    languageBadge: "语言",
    languageTitle: "为 multilingual business support 而设计。",
    languageText:
      "Kolkap 支持 English、Indonesian、Chinese 和 Malay，帮助企业服务不同市场的客户。",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],

    finalTitle: "Kolkap 正在构建企业 AI staff 的未来。",
    finalText:
      "创建 AI staff、添加 business knowledge、connect customer channels，并用 business-ready AI workspace 帮助您的团队更快回复。",
    finalCta: "开始免费试用",
  },

  ms: {
    badge: "Tentang Kami",
    title: "Kami membina AI staff untuk bisnes moden.",
    subtitle:
      "Kolkap wujud untuk menjadikan AI praktikal untuk bisnes sebenar — bukan sebagai generic AI tool, tetapi sebagai AI staff yang memahami business knowledge, menyokong customer conversations, mengurus leads, dan membantu teams bekerja lebih cepat.",
    primaryCta: "Mulakan Free Trial",
    secondaryCta: "Lihat Pricing",
    trustPills: [
      "AI staff untuk bisnes",
      "Dibina dari Australia",
      "WhatsApp bersambung",
      "EN / ID / ZH / MS",
    ],

    storyBadge: "Cerita Kami",
    storyTitle: "Kolkap dicipta untuk bisnes yang perlukan bantuan setiap hari.",
    storyText: [
      "Banyak bisnes menerima soalan yang sama berulang kali. Customers bertanya tentang pricing, availability, services, bookings, products, policies, dan next steps. Business owners dan teams sering menghabiskan masa membalas perkara yang sama.",
      "Generic AI tools boleh jadi powerful, tetapi tidak selalu mudah untuk pengguna bisnes biasa. Ia sering memerlukan prompts, technical setup, atau manual copy-paste work.",
      "Kolkap dicipta untuk menyelesaikan gap itu. Kami percaya bisnes memerlukan AI staff — bukan sekadar AI tools. AI staff perlu memahami bisnes, membalas dengan jelas, menyokong inbox, membantu capture leads, dan bekerja dalam satu workspace yang simple.",
    ],

    missionBadge: "Misi Kami",
    missionTitle: "Menjadikan AI staff simple, berguna, dan mudah digunakan untuk bisnes sebenar.",
    missionText:
      "Misi kami adalah membantu bisnes menggunakan AI secara praktikal: replies lebih cepat, customer support lebih baik, lead handling lebih jelas, dan kurang repetitive admin work.",

    visionBadge: "Visi Kami",
    visionTitle: "Menjadi platform AI staff yang dipercayai untuk bisnes dalam multilingual markets.",
    visionText:
      "Visi kami adalah menjadikan Kolkap platform AI staff yang dipercayai untuk bisnes, bermula dari Australia dan berkembang ke markets yang memerlukan multilingual support, messaging automation, dan AI-powered operations yang simple.",

    beliefsBadge: "Apa Kami Percaya",
    beliefsTitle: "AI patut menyokong bisnes, bukan menyusahkan.",
    beliefsText:
      "Kolkap dibina berdasarkan prinsip simple yang memandu product, customer experience, dan cara AI patut bekerja untuk bisnes.",
    beliefs: [
      {
        title: "AI perlu simple",
        text: "Pengguna bisnes tidak perlu memahami webhooks, API keys, workspace routing, atau technical setup.",
      },
      {
        title: "Business knowledge penting",
        text: "AI staff patut menjawab berdasarkan knowledge, tone, services, FAQs, dan instructions bisnes sendiri.",
      },
      {
        title: "Manusia kekal mengawal",
        text: "AI patut menyokong teams, bukan menggantikan human judgment atau customer care yang bertanggungjawab.",
      },
      {
        title: "Messaging perlu lebih mudah",
        text: "WhatsApp, website chat, inbox, leads, dan handover patut tersusun dalam satu workspace.",
      },
      {
        title: "Usage perlu jelas",
        text: "Bisnes perlu faham bila credits digunakan dan kos setiap AI action.",
      },
      {
        title: "Trust didahulukan",
        text: "Privacy, account deletion, billing clarity, dan AI limitations perlu jelas kepada users.",
      },
    ],

    whatBadge: "Apa Kolkap Buat",
    whatTitle: "Kolkap menukar business knowledge menjadi AI staff.",
    whatText:
      "Kolkap membantu bisnes mencipta AI staff yang boleh menyokong customer conversations sebenar dan tugas harian bisnes.",
    whatCards: [
      {
        title: "AI replies",
        text: "Generate replies untuk inbox, WhatsApp, website chat, dan customer support conversations.",
      },
      {
        title: "Knowledge base",
        text: "Tambah business information, services, pricing, FAQs, instructions, dan tone untuk AI staff anda.",
      },
      {
        title: "Inbox dan leads",
        text: "Urus conversations, handover, customer status, leads, dan follow-up dalam satu tempat.",
      },
      {
        title: "Usage dan billing",
        text: "Track credits, usage, plan status, trial, billing, dan top-up needs dengan jelas.",
      },
    ],

    serveBadge: "Siapa Kami Serve",
    serveTitle: "Dibina untuk service businesses, local businesses, teams, dan growing companies.",
    serveText:
      "Kolkap berguna untuk bisnes yang menerima customer questions, leads, bookings, inquiries, support requests, atau mesej berulang.",
    serveList: [
      "Real estate businesses",
      "Hotels, villas, dan accommodation",
      "Travel dan tourism businesses",
      "Restaurants dan cafes",
      "Clinics, beauty, dan wellness businesses",
      "Retail dan online shops",
      "Agencies dan professional services",
      "Local businesses menggunakan WhatsApp untuk leads",
    ],

    directionBadge: "Arah Kami",
    directionTitle: "Satu workspace simple untuk AI staff dan business conversations.",
    directionText:
      "Kolkap bergerak ke arah complete AI staff workspace di mana bisnes boleh create staff, add knowledge, test replies, connect channels, manage conversations, track leads, dan control usage.",
    directionSteps: [
      "Cipta AI staff",
      "Tambah business knowledge",
      "Test replies",
      "Connect WhatsApp dan website chat",
      "Urus inbox, leads, dan handover",
      "Track usage, credits, billing, dan top-ups",
    ],

    languageBadge: "Bahasa",
    languageTitle: "Dibina untuk multilingual business support.",
    languageText:
      "Kolkap menyokong English, Indonesian, Chinese, dan Malay supaya bisnes boleh melayani customers di pelbagai markets.",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],

    finalTitle: "Kolkap sedang membina masa depan AI staff untuk bisnes.",
    finalText:
      "Cipta AI staff, tambah business knowledge, connect customer channels, dan bantu team anda membalas lebih cepat dengan business-ready AI workspace.",
    finalCta: "Mulakan Free Trial",
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : "en";
}

const beliefIcons: LucideIcon[] = [
  Zap,
  Brain,
  HeartHandshake,
  MessageCircle,
  WalletCards,
  ShieldCheck,
];

const whatIcons: LucideIcon[] = [Bot, Brain, Inbox, WalletCards];

export default function AboutPage() {
  const { language } = useKolkapLanguage();
  const lang = getSupportedLanguage(language);
  const t = translations[lang];

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

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              {t.primaryCta}
              <ArrowRight className="h-6 w-6" />
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              {t.secondaryCta}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {t.trustPills.map((pill) => (
              <span
                key={pill}
                className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <Building2 className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.storyBadge}
          </p>

          <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.storyTitle}
          </h2>

          <div className="mt-7 grid gap-5">
            {t.storyText.map((text) => (
              <p
                key={text}
                className="max-w-5xl text-lg font-semibold leading-8 text-slate-600"
              >
                {text}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <Target className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
            {t.missionBadge}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            {t.missionTitle}
          </h2>

          <p className="mt-6 text-lg font-semibold leading-8 text-slate-300">
            {t.missionText}
          </p>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <Globe2 className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.visionBadge}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            {t.visionTitle}
          </h2>

          <p className="mt-6 text-lg font-semibold leading-8 text-slate-600">
            {t.visionText}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.beliefsBadge}
          </p>

          <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.beliefsTitle}
          </h2>

          <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
            {t.beliefsText}
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {t.beliefs.map((belief, index) => {
              const Icon = beliefIcons[index] || CheckCircle2;

              return (
                <div
                  key={belief.title}
                  className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-2xl font-black tracking-[-0.04em]">
                    {belief.title}
                  </h3>

                  <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                    {belief.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Bot className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.whatBadge}
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
              {t.whatTitle}
            </h2>

            <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
              {t.whatText}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {t.whatCards.map((card, index) => {
              const Icon = whatIcons[index] || Bot;

              return (
                <div
                  key={card.title}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-2xl font-black tracking-[-0.04em]">
                    {card.title}
                  </h3>

                  <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                    {card.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <UsersRound className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.serveBadge}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            {t.serveTitle}
          </h2>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            {t.serveText}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {t.serveList.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-4 text-base font-black text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <Languages className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
            {t.languageBadge}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            {t.languageTitle}
          </h2>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-300">
            {t.languageText}
          </p>

          <div className="mt-8 grid gap-3">
            {t.languageList.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 text-base font-black text-white"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.directionBadge}
          </p>

          <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.directionTitle}
          </h2>

          <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
            {t.directionText}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {t.directionSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                  {index + 1}
                </span>

                <p className="mt-5 text-xl font-black leading-8">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <HeartHandshake className="h-8 w-8" />
          </div>

          <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.finalTitle}
          </h2>

          <p className="mt-5 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            {t.finalText}
          </p>

          <Link
            href="/signup"
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
          >
            {t.finalCta}
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </section>
    </main>
  );
}