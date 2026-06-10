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
  Inbox,
  Languages,
  MessageCircle,
  ShieldCheck,
  Sparkles,
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
  whatBadge: string;
  whatTitle: string;
  whatText: string;
  whatCards: Card[];
  missionBadge: string;
  missionTitle: string;
  missionText: string[];
  whyBadge: string;
  whyTitle: string;
  whyText: string;
  whyPoints: string[];
  flowBadge: string;
  flowTitle: string;
  flowSteps: string[];
  businessBadge: string;
  businessTitle: string;
  businessText: string;
  businessTypes: string[];
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
    badge: "About Kolkap",
    title: "AI staff for businesses, not generic AI tools.",
    subtitle:
      "Kolkap helps businesses create AI staff that understand business knowledge, support customer replies, manage inbox work, capture leads, and work with connected channels like WhatsApp and website chat.",
    primaryCta: "Start Free Trial",
    secondaryCta: "View Pricing",
    trustPills: [
      "AI staff platform",
      "Business knowledge powered",
      "WhatsApp connected",
      "EN / ID / ZH / MS",
    ],
    whatBadge: "What We Do",
    whatTitle: "Kolkap gives businesses simple AI staff.",
    whatText:
      "Kolkap is built for normal business users. The goal is simple: help businesses reply faster, organize customer conversations, use their own business knowledge, and reduce repetitive admin work without needing technical setup.",
    whatCards: [
      {
        title: "AI replies",
        text: "Generate customer replies for inbox, WhatsApp, website chat, and support conversations.",
      },
      {
        title: "Business knowledge",
        text: "Let your AI staff read your business details, FAQs, services, pricing, tone, and instructions.",
      },
      {
        title: "Leads and inbox",
        text: "Keep conversations, handover, customer status, and leads organized in one workspace.",
      },
      {
        title: "Usage and credits",
        text: "Every AI action is tracked clearly so businesses understand how credits are used.",
      },
    ],
    missionBadge: "Our Mission",
    missionTitle: "Make AI useful for real businesses.",
    missionText: [
      "Many businesses do not need complicated AI tools. They need AI staff that can help with real daily work: replying, answering questions, handling leads, and supporting customers.",
      "Kolkap is designed to make AI feel simple, clear, and practical for business owners and teams.",
    ],
    whyBadge: "Why Kolkap",
    whyTitle: "Built around business workflow.",
    whyText:
      "Kolkap is not designed as a playground. It is designed as a business system where AI staff, knowledge, conversations, leads, credits, channels, and billing work together.",
    whyPoints: [
      "Simple setup for business users",
      "AI staff connected to business knowledge",
      "Clear credit usage",
      "Human handover support",
      "WhatsApp and website chat support",
      "Workspace-based team access",
    ],
    flowBadge: "How It Works",
    flowTitle: "From sign up to go live.",
    flowSteps: [
      "Sign up and activate your trial",
      "Create your AI staff",
      "Add business knowledge",
      "Test replies",
      "Connect WhatsApp or website chat",
      "Go live and manage inbox, leads, usage, and billing",
    ],
    businessBadge: "Who It Is For",
    businessTitle: "For service businesses, teams, and growing companies.",
    businessText:
      "Kolkap is useful for businesses that receive customer questions, leads, appointments, inquiries, or repetitive messages.",
    businessTypes: [
      "Real estate",
      "Hotels, villas, and accommodation",
      "Travel and tourism",
      "Restaurants and cafes",
      "Clinics and wellness",
      "Retail and online shops",
      "Agencies and service businesses",
      "Local businesses with WhatsApp leads",
    ],
    languageBadge: "Languages",
    languageTitle: "Built for multilingual business support.",
    languageText:
      "Kolkap supports English, Indonesian, Chinese, and Malay so businesses can serve customers across different markets.",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],
    finalTitle: "Kolkap helps your business work faster.",
    finalText:
      "Create AI staff, add business knowledge, test replies, and prepare your business for customer conversations across connected channels.",
    finalCta: "Start Free Trial",
  },

  id: {
    badge: "Tentang Kolkap",
    title: "AI staff untuk bisnis, bukan generic AI tools.",
    subtitle:
      "Kolkap membantu bisnis membuat AI staff yang memahami business knowledge, membantu customer replies, mengelola inbox work, menangkap leads, dan bekerja dengan connected channels seperti WhatsApp dan website chat.",
    primaryCta: "Mulai Free Trial",
    secondaryCta: "Lihat Pricing",
    trustPills: [
      "Platform AI staff",
      "Didukung business knowledge",
      "WhatsApp terhubung",
      "EN / ID / ZH / MS",
    ],
    whatBadge: "Apa yang Kami Lakukan",
    whatTitle: "Kolkap memberi bisnis AI staff yang simple.",
    whatText:
      "Kolkap dibuat untuk pengguna bisnis biasa. Tujuannya simple: membantu bisnis membalas lebih cepat, mengatur customer conversations, memakai business knowledge sendiri, dan mengurangi pekerjaan admin berulang tanpa technical setup.",
    whatCards: [
      {
        title: "AI replies",
        text: "Generate customer replies untuk inbox, WhatsApp, website chat, dan support conversations.",
      },
      {
        title: "Business knowledge",
        text: "Biarkan AI staff membaca detail bisnis, FAQ, services, pricing, tone, dan instruksi Anda.",
      },
      {
        title: "Leads dan inbox",
        text: "Simpan conversations, handover, customer status, dan leads dalam satu workspace.",
      },
      {
        title: "Usage dan credits",
        text: "Setiap AI action dilacak dengan jelas agar bisnis memahami penggunaan credits.",
      },
    ],
    missionBadge: "Misi Kami",
    missionTitle: "Membuat AI berguna untuk bisnis nyata.",
    missionText: [
      "Banyak bisnis tidak membutuhkan AI tools yang rumit. Mereka membutuhkan AI staff yang membantu pekerjaan harian: membalas, menjawab pertanyaan, menangani leads, dan mendukung customer.",
      "Kolkap dirancang agar AI terasa simple, jelas, dan praktis untuk business owners dan team.",
    ],
    whyBadge: "Kenapa Kolkap",
    whyTitle: "Dibangun mengikuti workflow bisnis.",
    whyText:
      "Kolkap bukan dibuat sebagai playground. Kolkap dibuat sebagai business system tempat AI staff, knowledge, conversations, leads, credits, channels, dan billing bekerja bersama.",
    whyPoints: [
      "Setup simple untuk pengguna bisnis",
      "AI staff terhubung dengan business knowledge",
      "Credit usage jelas",
      "Human handover support",
      "WhatsApp dan website chat support",
      "Team access berbasis workspace",
    ],
    flowBadge: "Cara Kerja",
    flowTitle: "Dari sign up sampai go live.",
    flowSteps: [
      "Sign up dan aktifkan trial",
      "Buat AI staff",
      "Tambahkan business knowledge",
      "Test replies",
      "Connect WhatsApp atau website chat",
      "Go live dan kelola inbox, leads, usage, dan billing",
    ],
    businessBadge: "Untuk Siapa",
    businessTitle: "Untuk service businesses, teams, dan growing companies.",
    businessText:
      "Kolkap berguna untuk bisnis yang menerima pertanyaan customer, leads, appointments, inquiries, atau pesan berulang.",
    businessTypes: [
      "Real estate",
      "Hotel, villa, dan akomodasi",
      "Travel dan tourism",
      "Restoran dan cafe",
      "Klinik dan wellness",
      "Retail dan online shop",
      "Agency dan service businesses",
      "Local business dengan WhatsApp leads",
    ],
    languageBadge: "Bahasa",
    languageTitle: "Dibangun untuk multilingual business support.",
    languageText:
      "Kolkap mendukung English, Indonesian, Chinese, dan Malay agar bisnis dapat melayani customer di berbagai market.",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],
    finalTitle: "Kolkap membantu bisnis Anda bekerja lebih cepat.",
    finalText:
      "Buat AI staff, tambahkan business knowledge, test replies, dan siapkan bisnis Anda untuk customer conversations melalui connected channels.",
    finalCta: "Mulai Free Trial",
  },

  zh: {
    badge: "关于 Kolkap",
    title: "面向企业的 AI 员工，不是普通 AI 工具。",
    subtitle:
      "Kolkap 帮助企业创建 AI 员工，让 AI 理解 business knowledge、支持 customer replies、管理 inbox work、捕捉 leads，并与 WhatsApp 和 website chat 等 connected channels 一起工作。",
    primaryCta: "开始免费试用",
    secondaryCta: "查看价格",
    trustPills: [
      "AI 员工平台",
      "由 business knowledge 支持",
      "WhatsApp 已连接",
      "EN / ID / ZH / MS",
    ],
    whatBadge: "我们做什么",
    whatTitle: "Kolkap 为企业提供简单的 AI 员工。",
    whatText:
      "Kolkap 为普通企业用户而设计。目标很简单：帮助企业更快回复、整理 customer conversations、使用自己的 business knowledge，并减少重复性 admin work，而不需要 technical setup。",
    whatCards: [
      {
        title: "AI 回复",
        text: "为 inbox、WhatsApp、website chat 和 support conversations 生成 customer replies。",
      },
      {
        title: "Business knowledge",
        text: "让 AI 员工读取您的企业详情、FAQ、services、pricing、tone 和 instructions。",
      },
      {
        title: "Leads 和 inbox",
        text: "在一个 workspace 中整理 conversations、handover、customer status 和 leads。",
      },
      {
        title: "Usage 和 credits",
        text: "每个 AI action 都会清楚记录，让企业了解 credits 如何被使用。",
      },
    ],
    missionBadge: "我们的使命",
    missionTitle: "让 AI 真正帮助现实中的企业。",
    missionText: [
      "许多企业不需要复杂的 AI tools。他们需要能帮助日常工作的 AI 员工：回复、回答问题、处理 leads 和支持客户。",
      "Kolkap 的设计目标是让 AI 对 business owners 和 teams 来说简单、清楚、实用。",
    ],
    whyBadge: "为什么选择 Kolkap",
    whyTitle: "围绕 business workflow 构建。",
    whyText:
      "Kolkap 不是 playground。Kolkap 是一个 business system，让 AI staff、knowledge、conversations、leads、credits、channels 和 billing 一起工作。",
    whyPoints: [
      "适合企业用户的简单 setup",
      "AI staff 连接 business knowledge",
      "清晰的 credit usage",
      "Human handover support",
      "WhatsApp 和 website chat support",
      "基于 workspace 的 team access",
    ],
    flowBadge: "如何运作",
    flowTitle: "从 sign up 到 go live。",
    flowSteps: [
      "Sign up 并激活 trial",
      "创建 AI staff",
      "添加 business knowledge",
      "测试 replies",
      "连接 WhatsApp 或 website chat",
      "Go live 并管理 inbox、leads、usage 和 billing",
    ],
    businessBadge: "适合谁",
    businessTitle: "适合服务型企业、团队和成长型公司。",
    businessText:
      "Kolkap 适合经常收到 customer questions、leads、appointments、inquiries 或重复消息的企业。",
    businessTypes: [
      "房地产",
      "酒店、别墅和住宿",
      "旅游和旅行",
      "餐厅和咖啡馆",
      "诊所和 wellness",
      "零售和网店",
      "Agency 和 service businesses",
      "使用 WhatsApp leads 的 local businesses",
    ],
    languageBadge: "语言",
    languageTitle: "为 multilingual business support 而设计。",
    languageText:
      "Kolkap 支持 English、Indonesian、Chinese 和 Malay，帮助企业服务不同市场的客户。",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],
    finalTitle: "Kolkap 帮助您的企业更快工作。",
    finalText:
      "创建 AI staff、添加 business knowledge、测试 replies，并让您的企业准备好通过 connected channels 处理 customer conversations。",
    finalCta: "开始免费试用",
  },

  ms: {
    badge: "Tentang Kolkap",
    title: "AI staff untuk bisnes, bukan generic AI tools.",
    subtitle:
      "Kolkap membantu bisnes mencipta AI staff yang memahami business knowledge, menyokong customer replies, mengurus inbox work, menangkap leads, dan bekerja dengan connected channels seperti WhatsApp dan website chat.",
    primaryCta: "Mulakan Free Trial",
    secondaryCta: "Lihat Pricing",
    trustPills: [
      "Platform AI staff",
      "Disokong business knowledge",
      "WhatsApp bersambung",
      "EN / ID / ZH / MS",
    ],
    whatBadge: "Apa Kami Buat",
    whatTitle: "Kolkap memberi bisnes AI staff yang simple.",
    whatText:
      "Kolkap dibina untuk pengguna bisnes biasa. Tujuannya simple: bantu bisnes membalas lebih cepat, mengatur customer conversations, menggunakan business knowledge sendiri, dan mengurangkan admin work berulang tanpa technical setup.",
    whatCards: [
      {
        title: "AI replies",
        text: "Generate customer replies untuk inbox, WhatsApp, website chat, dan support conversations.",
      },
      {
        title: "Business knowledge",
        text: "Biarkan AI staff membaca detail bisnes, FAQ, services, pricing, tone, dan instructions anda.",
      },
      {
        title: "Leads dan inbox",
        text: "Simpan conversations, handover, customer status, dan leads dalam satu workspace.",
      },
      {
        title: "Usage dan credits",
        text: "Setiap AI action dijejak dengan jelas supaya bisnes faham bagaimana credits digunakan.",
      },
    ],
    missionBadge: "Misi Kami",
    missionTitle: "Menjadikan AI berguna untuk bisnes sebenar.",
    missionText: [
      "Banyak bisnes tidak perlukan AI tools yang rumit. Mereka perlukan AI staff yang boleh membantu kerja harian: membalas, menjawab soalan, mengurus leads, dan menyokong customers.",
      "Kolkap direka supaya AI terasa simple, jelas, dan praktikal untuk business owners dan teams.",
    ],
    whyBadge: "Kenapa Kolkap",
    whyTitle: "Dibina mengikut business workflow.",
    whyText:
      "Kolkap bukan playground. Kolkap ialah business system di mana AI staff, knowledge, conversations, leads, credits, channels, dan billing bekerja bersama.",
    whyPoints: [
      "Setup simple untuk pengguna bisnes",
      "AI staff connected kepada business knowledge",
      "Credit usage jelas",
      "Human handover support",
      "WhatsApp dan website chat support",
      "Workspace-based team access",
    ],
    flowBadge: "Cara Ia Berfungsi",
    flowTitle: "Dari sign up sampai go live.",
    flowSteps: [
      "Sign up dan aktifkan trial",
      "Cipta AI staff",
      "Tambah business knowledge",
      "Test replies",
      "Connect WhatsApp atau website chat",
      "Go live dan urus inbox, leads, usage, dan billing",
    ],
    businessBadge: "Untuk Siapa",
    businessTitle: "Untuk service businesses, teams, dan growing companies.",
    businessText:
      "Kolkap berguna untuk bisnes yang menerima customer questions, leads, appointments, inquiries, atau mesej berulang.",
    businessTypes: [
      "Real estate",
      "Hotel, villa, dan accommodation",
      "Travel dan tourism",
      "Restoran dan cafe",
      "Clinics dan wellness",
      "Retail dan online shops",
      "Agencies dan service businesses",
      "Local businesses dengan WhatsApp leads",
    ],
    languageBadge: "Bahasa",
    languageTitle: "Dibina untuk multilingual business support.",
    languageText:
      "Kolkap menyokong English, Indonesian, Chinese, dan Malay supaya bisnes boleh melayani customers di pelbagai market.",
    languageList: ["English", "Bahasa Indonesia", "中文", "Malay"],
    finalTitle: "Kolkap membantu bisnes anda bekerja lebih cepat.",
    finalText:
      "Cipta AI staff, tambah business knowledge, test replies, dan sediakan bisnes anda untuk customer conversations melalui connected channels.",
    finalCta: "Mulakan Free Trial",
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : "en";
}

const whatIcons: LucideIcon[] = [MessageCircle, Brain, Inbox, WalletCards];

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

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
            <Zap className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
            {t.missionBadge}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            {t.missionTitle}
          </h2>

          <div className="mt-6 grid gap-4">
            {t.missionText.map((text) => (
              <p
                key={text}
                className="text-lg font-semibold leading-8 text-slate-300"
              >
                {text}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.whyBadge}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            {t.whyTitle}
          </h2>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            {t.whyText}
          </p>

          <div className="mt-7 grid gap-3">
            {t.whyPoints.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-4"
              >
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#07111F]" />
                <p className="text-base font-black leading-7 text-slate-700">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.flowBadge}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            {t.flowTitle}
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {t.flowSteps.map((step, index) => (
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

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <Building2 className="h-8 w-8" />
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.businessBadge}
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
            {t.businessTitle}
          </h2>

          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            {t.businessText}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {t.businessTypes.map((item) => (
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
            <UsersRound className="h-8 w-8" />
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