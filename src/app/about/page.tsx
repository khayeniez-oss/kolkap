"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  HeartHandshake,
  Languages,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
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

  valuesBadge: string;
  valuesTitle: string;
  valuesText: string;
  values: Card[];

  serveBadge: string;
  serveTitle: string;
  serveText: string;
  serveList: string[];

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
      "Kolkap exists to make AI practical for real businesses. Our focus is simple: help businesses serve customers faster, stay organized, and use AI in a way that feels clear, useful, and business-ready.",
    primaryCta: "Start Free Trial",
    secondaryCta: "View Pricing",
    trustPills: [
      "AI staff for businesses",
      "Built from Australia",
      "WhatsApp connected",
      "EN / ID / ZH / MS",
    ],

    storyBadge: "Our Story",
    storyTitle: "Kolkap was created for businesses that need daily support.",
    storyText: [
      "Many businesses receive the same questions every day. Customers ask about pricing, availability, services, bookings, products, policies, and next steps. Business owners and teams often lose hours repeating the same replies.",
      "Kolkap was created because we believe businesses need AI that feels like helpful staff, not another complicated tool. AI should understand the business, support customer conversations, and make daily work easier.",
      "Our goal is to give businesses a simple way to use AI with confidence, while keeping humans in control of the customer experience.",
    ],

    missionBadge: "Our Mission",
    missionTitle:
      "Make AI staff simple, useful, and accessible for real businesses.",
    missionText:
      "Our mission is to help businesses save time, reply faster, support customers better, and reduce repetitive work with AI staff that is easy to set up and easy to use.",

    visionBadge: "Our Vision",
    visionTitle:
      "A trusted AI staff platform for businesses across multilingual markets.",
    visionText:
      "Our vision is for Kolkap to become a trusted AI staff platform for businesses, starting from Australia and growing into markets where businesses need multilingual customer support, messaging support, and practical AI-powered operations.",

    valuesBadge: "What We Believe",
    valuesTitle: "AI should support business, not make it complicated.",
    valuesText:
      "Kolkap is built around simple values that guide our product, customer experience, and long-term direction.",
    values: [
      {
        title: "Simple for business users",
        text: "AI should feel easy for owners and teams to use, even if they are not technical.",
      },
      {
        title: "Business knowledge matters",
        text: "Good AI staff should understand the business, its tone, its services, and its customer needs.",
      },
      {
        title: "Humans stay in control",
        text: "AI should support teams and improve speed, while businesses remain responsible for their customer experience.",
      },
      {
        title: "Customer trust comes first",
        text: "Clear communication, responsible AI use, privacy, and honest billing matter.",
      },
      {
        title: "Messaging should be organized",
        text: "Customer conversations should be easier to manage across WhatsApp, inbox, and supported channels.",
      },
      {
        title: "Growth should feel manageable",
        text: "As a business grows, AI should help the team handle more conversations without losing quality.",
      },
    ],

    serveBadge: "Who We Serve",
    serveTitle:
      "Built for service businesses, local businesses, teams, and growing companies.",
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

    languageBadge: "Languages",
    languageTitle: "Built for multilingual business support.",
    languageText:
      "Kolkap supports English, Indonesian, Chinese, and Malay so businesses can serve customers across different markets.",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],

    finalTitle: "Kolkap is building the future of AI staff for business.",
    finalText:
      "Create AI staff, support customer conversations, and help your team work faster with a simple business-ready AI workspace.",
    finalCta: "Start Free Trial",
  },

  id: {
    badge: "Tentang Kami",
    title: "Kami membangun AI staff untuk bisnis modern.",
    subtitle:
      "Kolkap hadir untuk membuat AI praktis bagi bisnis nyata. Fokus kami sederhana: membantu bisnis melayani customer lebih cepat, tetap teratur, dan menggunakan AI dengan cara yang jelas, berguna, dan siap untuk bisnis.",
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
      "Banyak bisnis menerima pertanyaan yang sama setiap hari. Customer bertanya tentang harga, availability, layanan, booking, produk, policy, dan langkah berikutnya. Business owner dan team sering kehilangan banyak waktu untuk membalas hal yang sama.",
      "Kolkap dibuat karena kami percaya bisnis membutuhkan AI yang terasa seperti staff yang membantu, bukan tool rumit lainnya. AI harus memahami bisnis, mendukung customer conversations, dan membuat pekerjaan harian lebih mudah.",
      "Tujuan kami adalah memberi bisnis cara yang simple untuk menggunakan AI dengan percaya diri, sambil tetap membuat manusia memegang kontrol atas customer experience.",
    ],

    missionBadge: "Misi Kami",
    missionTitle:
      "Membuat AI staff simple, berguna, dan mudah digunakan untuk bisnis nyata.",
    missionText:
      "Misi kami adalah membantu bisnis menghemat waktu, membalas lebih cepat, mendukung customer dengan lebih baik, dan mengurangi pekerjaan berulang dengan AI staff yang mudah disiapkan dan mudah digunakan.",

    visionBadge: "Visi Kami",
    visionTitle:
      "Menjadi platform AI staff terpercaya untuk bisnis di multilingual markets.",
    visionText:
      "Visi kami adalah menjadikan Kolkap platform AI staff terpercaya untuk bisnis, dimulai dari Australia dan berkembang ke market yang membutuhkan multilingual customer support, messaging support, dan operasional bisnis berbasis AI yang praktis.",

    valuesBadge: "Yang Kami Percaya",
    valuesTitle: "AI harus mendukung bisnis, bukan membuatnya rumit.",
    valuesText:
      "Kolkap dibangun berdasarkan nilai sederhana yang memandu product, customer experience, dan arah jangka panjang kami.",
    values: [
      {
        title: "Simple untuk pengguna bisnis",
        text: "AI harus terasa mudah digunakan oleh owner dan team, walaupun mereka tidak technical.",
      },
      {
        title: "Business knowledge penting",
        text: "AI staff yang baik harus memahami bisnis, tone, layanan, dan kebutuhan customer.",
      },
      {
        title: "Manusia tetap memegang kontrol",
        text: "AI harus mendukung team dan meningkatkan kecepatan, sementara bisnis tetap bertanggung jawab atas customer experience.",
      },
      {
        title: "Kepercayaan customer adalah prioritas",
        text: "Komunikasi jelas, penggunaan AI yang bertanggung jawab, privacy, dan billing yang jujur itu penting.",
      },
      {
        title: "Messaging harus teratur",
        text: "Customer conversations harus lebih mudah dikelola melalui WhatsApp, inbox, dan channel yang didukung.",
      },
      {
        title: "Growth harus terasa manageable",
        text: "Saat bisnis berkembang, AI harus membantu team menangani lebih banyak conversations tanpa kehilangan kualitas.",
      },
    ],

    serveBadge: "Siapa yang Kami Layani",
    serveTitle:
      "Dibangun untuk service businesses, local businesses, teams, dan growing companies.",
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

    languageBadge: "Bahasa",
    languageTitle: "Dibangun untuk multilingual business support.",
    languageText:
      "Kolkap mendukung English, Indonesian, Chinese, dan Malay agar bisnis dapat melayani customer di berbagai market.",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],

    finalTitle: "Kolkap sedang membangun masa depan AI staff untuk bisnis.",
    finalText:
      "Buat AI staff, dukung customer conversations, dan bantu team Anda bekerja lebih cepat dengan AI workspace yang simple dan siap untuk bisnis.",
    finalCta: "Mulai Free Trial",
  },

  zh: {
    badge: "关于我们",
    title: "我们正在为现代企业打造 AI 员工。",
    subtitle:
      "Kolkap 的存在，是为了让 AI 真正服务现实中的企业。我们的重点很简单：帮助企业更快服务客户、保持有序，并以清晰、实用、适合企业的方式使用 AI。",
    primaryCta: "开始免费试用",
    secondaryCta: "查看价格",
    trustPills: [
      "面向企业的 AI 员工",
      "从澳大利亚出发",
      "WhatsApp 已连接",
      "EN / ID / ZH / MS",
    ],

    storyBadge: "我们的故事",
    storyTitle: "Kolkap 为每天需要支持的企业而创建。",
    storyText: [
      "许多企业每天都会收到重复的问题。客户会询问价格、availability、服务、booking、产品、policy 和下一步。Business owners 和 teams 经常花大量时间重复回复同样的问题。",
      "Kolkap 的创建，是因为我们相信企业需要像员工一样有帮助的 AI，而不是另一个复杂工具。AI 应该理解企业、支持 customer conversations，并让日常工作更简单。",
      "我们的目标是让企业能够以简单的方式放心使用 AI，同时让人类继续掌控 customer experience。",
    ],

    missionBadge: "我们的使命",
    missionTitle: "让 AI staff 对真实企业变得简单、有用、容易使用。",
    missionText:
      "我们的使命是帮助企业节省时间、更快回复、更好支持客户，并通过容易设置、容易使用的 AI staff 减少重复工作。",

    visionBadge: "我们的愿景",
    visionTitle: "成为跨多语言市场的可信企业 AI staff 平台。",
    visionText:
      "我们的愿景是让 Kolkap 成为企业信任的 AI staff 平台，从澳大利亚开始，并扩展到需要 multilingual customer support、messaging support 和 practical AI-powered operations 的市场。",

    valuesBadge: "我们的信念",
    valuesTitle: "AI 应该支持企业，而不是让企业更复杂。",
    valuesText:
      "Kolkap 围绕简单价值构建，这些价值指导我们的 product、customer experience 和长期方向。",
    values: [
      {
        title: "对企业用户简单",
        text: "AI 应该让 owners 和 teams 容易使用，即使他们不是 technical users。",
      },
      {
        title: "Business knowledge 很重要",
        text: "好的 AI staff 应该理解企业、tone、services 和客户需求。",
      },
      {
        title: "人类保持控制",
        text: "AI 应该支持 teams 并提高速度，而企业仍然负责 customer experience。",
      },
      {
        title: "客户信任优先",
        text: "清晰沟通、负责任使用 AI、privacy 和诚实 billing 都很重要。",
      },
      {
        title: "Messaging 应该有序",
        text: "Customer conversations 应该更容易通过 WhatsApp、inbox 和 supported channels 管理。",
      },
      {
        title: "增长应该可管理",
        text: "当企业成长时，AI 应帮助 teams 处理更多 conversations，同时保持质量。",
      },
    ],

    serveBadge: "我们服务谁",
    serveTitle:
      "为 service businesses、local businesses、teams 和 growing companies 而建。",
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

    languageBadge: "语言",
    languageTitle: "为 multilingual business support 而设计。",
    languageText:
      "Kolkap 支持 English、Indonesian、Chinese 和 Malay，帮助企业服务不同市场的客户。",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],

    finalTitle: "Kolkap 正在构建企业 AI staff 的未来。",
    finalText:
      "创建 AI staff、支持 customer conversations，并用简单、business-ready 的 AI workspace 帮助您的团队更快工作。",
    finalCta: "开始免费试用",
  },

  ms: {
    badge: "Tentang Kami",
    title: "Kami membina AI staff untuk bisnes moden.",
    subtitle:
      "Kolkap wujud untuk menjadikan AI praktikal untuk bisnes sebenar. Fokus kami simple: membantu bisnes melayani customers lebih cepat, kekal teratur, dan menggunakan AI dengan cara yang jelas, berguna, dan business-ready.",
    primaryCta: "Mulakan Free Trial",
    secondaryCta: "Lihat Pricing",
    trustPills: [
      "AI staff untuk bisnes",
      "Dibina dari Australia",
      "WhatsApp bersambung",
      "EN / ID / ZH / MS",
    ],

    storyBadge: "Cerita Kami",
    storyTitle: "Kolkap dicipta untuk bisnes yang perlukan sokongan harian.",
    storyText: [
      "Banyak bisnes menerima soalan yang sama setiap hari. Customers bertanya tentang pricing, availability, services, bookings, products, policies, dan next steps. Business owners dan teams sering kehilangan banyak masa membalas perkara yang sama.",
      "Kolkap dicipta kerana kami percaya bisnes memerlukan AI yang terasa seperti staff yang membantu, bukan tool rumit yang lain. AI patut memahami bisnes, menyokong customer conversations, dan memudahkan kerja harian.",
      "Matlamat kami ialah memberi bisnes cara yang simple untuk menggunakan AI dengan yakin, sambil memastikan manusia kekal mengawal customer experience.",
    ],

    missionBadge: "Misi Kami",
    missionTitle:
      "Menjadikan AI staff simple, berguna, dan mudah digunakan untuk bisnes sebenar.",
    missionText:
      "Misi kami adalah membantu bisnes menjimatkan masa, membalas lebih cepat, menyokong customers dengan lebih baik, dan mengurangkan repetitive work dengan AI staff yang mudah disediakan dan mudah digunakan.",

    visionBadge: "Visi Kami",
    visionTitle:
      "Menjadi platform AI staff yang dipercayai untuk bisnes dalam multilingual markets.",
    visionText:
      "Visi kami adalah menjadikan Kolkap platform AI staff yang dipercayai untuk bisnes, bermula dari Australia dan berkembang ke markets yang memerlukan multilingual customer support, messaging support, dan practical AI-powered operations.",

    valuesBadge: "Apa Kami Percaya",
    valuesTitle: "AI patut menyokong bisnes, bukan menyusahkan.",
    valuesText:
      "Kolkap dibina berdasarkan nilai simple yang memandu product, customer experience, dan arah jangka panjang kami.",
    values: [
      {
        title: "Simple untuk pengguna bisnes",
        text: "AI patut mudah digunakan oleh owners dan teams, walaupun mereka bukan technical users.",
      },
      {
        title: "Business knowledge penting",
        text: "AI staff yang baik patut memahami bisnes, tone, services, dan customer needs.",
      },
      {
        title: "Manusia kekal mengawal",
        text: "AI patut menyokong teams dan meningkatkan speed, sementara bisnes kekal bertanggungjawab atas customer experience.",
      },
      {
        title: "Customer trust didahulukan",
        text: "Clear communication, responsible AI use, privacy, dan honest billing adalah penting.",
      },
      {
        title: "Messaging patut teratur",
        text: "Customer conversations patut lebih mudah diurus melalui WhatsApp, inbox, dan supported channels.",
      },
      {
        title: "Growth patut manageable",
        text: "Apabila bisnes berkembang, AI patut membantu team mengurus lebih banyak conversations tanpa kehilangan quality.",
      },
    ],

    serveBadge: "Siapa Kami Serve",
    serveTitle:
      "Dibina untuk service businesses, local businesses, teams, dan growing companies.",
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

    languageBadge: "Bahasa",
    languageTitle: "Dibina untuk multilingual business support.",
    languageText:
      "Kolkap menyokong English, Indonesian, Chinese, dan Malay supaya bisnes boleh melayani customers di pelbagai markets.",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],

    finalTitle: "Kolkap sedang membina masa depan AI staff untuk bisnes.",
    finalText:
      "Cipta AI staff, sokong customer conversations, dan bantu team anda bekerja lebih cepat dengan AI workspace yang simple dan business-ready.",
    finalCta: "Mulakan Free Trial",
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : "en";
}

const valueIcons: LucideIcon[] = [
  Lightbulb,
  Building2,
  HeartHandshake,
  ShieldCheck,
  MessageCircle,
  UsersRound,
];

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
            {t.valuesBadge}
          </p>

          <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.valuesTitle}
          </h2>

          <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
            {t.valuesText}
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {t.values.map((value, index) => {
              const Icon = valueIcons[index] || CheckCircle2;

              return (
                <div
                  key={value.title}
                  className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-2xl font-black tracking-[-0.04em]">
                    {value.title}
                  </h3>

                  <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                    {value.text}
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