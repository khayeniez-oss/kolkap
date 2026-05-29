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

const translations = {
  en: {
    badge: "Kolkap Pricing",
    title: "Simple AI staff pricing for business owners.",
    subtitle:
      "Start with a 14-day free trial, then choose the plan that fits your business. Use AI credits for replies, captions, descriptions, and content generation.",
    trial: "Free Trial",
    trialPrice: "Free",
    trialText: "Test Kolkap before choosing a paid plan.",
    growth: "Growth",
    growthText: "For small businesses ready to use AI for replies and leads.",
    pro: "Pro",
    proText: "For growing businesses that need more AI staff and more credits.",
    business: "Business",
    businessPrice: "Contact Us",
    businessText:
      "For agencies, hotels, clinics, real estate groups, and high-volume teams.",
    month: "/month",
    startTrial: "Start Free Trial",
    chooseGrowth: "Choose Growth",
    choosePro: "Choose Pro",
    contactUs: "Contact Us",
    popular: "Most Popular",
    included: "Included",
    plansTitle: "Choose your plan",
    plansText:
      "Every plan keeps the setup simple: create AI, add knowledge, test, and go live.",
    creditTitle: "How AI credits work",
    creditText:
      "AI credits are used when Kolkap generates replies, captions, descriptions, or content.",
    topupTitle: "Need more AI credits?",
    topupText:
      "Top up anytime when your business needs more AI replies or content generation.",
    faqTitle: "Pricing FAQ",
    finalTitle: "Start with 14 days free.",
    finalText:
      "Create your AI staff, test the replies, and see how Kolkap can support your business.",
    finalButton: "Start Free Trial",
    plans: [
      {
        name: "Free Trial",
        price: "Free",
        description: "Test Kolkap before choosing a paid plan.",
        features: [
          "14 days free",
          "100 AI credits",
          "1 AI staff",
          "Create AI flow",
          "Add business knowledge",
          "Test AI replies",
        ],
      },
      {
        name: "Growth",
        price: "$49.99",
        description: "For small businesses ready to use AI for replies and leads.",
        features: [
          "2 AI staff",
          "1,500 AI credits/month",
          "WhatsApp setup flow",
          "Inbox and leads",
          "Human handover",
          "Social media caption generator",
        ],
      },
      {
        name: "Pro",
        price: "$99.00",
        description:
          "For growing businesses that need more AI staff and more credits.",
        features: [
          "5 AI staff",
          "4,000 AI credits/month",
          "WhatsApp setup flow",
          "Inbox and leads",
          "Reports",
          "Priority support",
        ],
      },
      {
        name: "Business",
        price: "Contact Us",
        description:
          "For agencies, hotels, clinics, real estate groups, and high-volume teams.",
        features: [
          "10–20 AI staff",
          "Custom AI credits",
          "Multiple business locations",
          "Team access",
          "Custom onboarding",
          "Priority support",
        ],
      },
    ],
    creditRules: [
      ["AI customer reply", "1 credit"],
      ["AI test message", "1 credit"],
      ["Social media caption", "1 credit"],
      ["Sales follow-up message", "1 credit"],
      ["Property / service description", "3 credits"],
      ["Long content / campaign pack", "5 credits"],
    ],
    topups: [
      ["$10", "150 AI credits"],
      ["$25", "400 AI credits"],
      ["$50", "900 AI credits"],
      ["$100", "2,000 AI credits"],
    ],
    faqs: [
      {
        q: "Do I need to pay before testing Kolkap?",
        a: "No. You can start with a 14-day free trial and 100 AI credits.",
      },
      {
        q: "What is 1 AI credit?",
        a: "One simple AI reply, test message, social caption, or short follow-up usually uses 1 credit.",
      },
      {
        q: "Why do longer contents use more credits?",
        a: "Longer generations such as property descriptions, service descriptions, blogs, and campaign packs use more AI work.",
      },
      {
        q: "Can I top up credits?",
        a: "Yes. You can buy extra AI credits anytime when your monthly credits are low.",
      },
    ],
  },

  zh: {
    badge: "Kolkap 价格",
    title: "为企业主提供简单的 AI 员工价格。",
    subtitle:
      "先免费试用 14 天，然后选择适合您企业的方案。AI credits 可用于回复、标题、描述和内容生成。",
    month: "/月",
    startTrial: "开始免费试用",
    chooseGrowth: "选择 Growth",
    choosePro: "选择 Pro",
    contactUs: "联系我们",
    popular: "最受欢迎",
    included: "包含",
    plansTitle: "选择您的方案",
    plansText: "每个方案都保持简单流程：创建 AI、添加知识、测试、上线。",
    creditTitle: "AI credits 如何使用",
    creditText:
      "当 Kolkap 生成回复、标题、描述或内容时，会使用 AI credits。",
    topupTitle: "需要更多 AI credits？",
    topupText: "当企业需要更多 AI 回复或内容生成时，可以随时充值。",
    faqTitle: "价格常见问题",
    finalTitle: "先免费试用 14 天。",
    finalText: "创建 AI 员工，测试回复，并了解 Kolkap 如何支持您的企业。",
    finalButton: "开始免费试用",
    plans: [
      {
        name: "免费试用",
        price: "免费",
        description: "在选择付费方案前测试 Kolkap。",
        features: [
          "14 天免费",
          "100 AI credits",
          "1 个 AI 员工",
          "创建 AI 流程",
          "添加企业知识",
          "测试 AI 回复",
        ],
      },
      {
        name: "Growth",
        price: "$49.99",
        description: "适合想用 AI 回复客户和获取线索的小型企业。",
        features: [
          "2 个 AI 员工",
          "每月 1,500 AI credits",
          "WhatsApp 设置流程",
          "收件箱和线索",
          "人工接手",
          "社交媒体标题生成器",
        ],
      },
      {
        name: "Pro",
        price: "$99.00",
        description: "适合需要更多 AI 员工和更多 credits 的成长型企业。",
        features: [
          "5 个 AI 员工",
          "每月 4,000 AI credits",
          "WhatsApp 设置流程",
          "收件箱和线索",
          "报告",
          "优先支持",
        ],
      },
      {
        name: "Business",
        price: "联系我们",
        description: "适合代理、酒店、诊所、房地产团队和高使用量企业。",
        features: [
          "10–20 个 AI 员工",
          "自定义 AI credits",
          "多个业务地点",
          "团队权限",
          "定制 onboarding",
          "优先支持",
        ],
      },
    ],
    creditRules: [
      ["AI 客户回复", "1 credit"],
      ["AI 测试消息", "1 credit"],
      ["社交媒体标题", "1 credit"],
      ["销售跟进消息", "1 credit"],
      ["房产 / 服务描述", "3 credits"],
      ["长内容 / 活动方案", "5 credits"],
    ],
    topups: [
      ["$10", "150 AI credits"],
      ["$25", "400 AI credits"],
      ["$50", "900 AI credits"],
      ["$100", "2,000 AI credits"],
    ],
    faqs: [
      {
        q: "测试 Kolkap 前需要付款吗？",
        a: "不需要。您可以先免费试用 14 天，并获得 100 AI credits。",
      },
      {
        q: "什么是 1 AI credit？",
        a: "一个简单的 AI 回复、测试消息、社交媒体标题或短跟进通常使用 1 credit。",
      },
      {
        q: "为什么较长内容需要更多 credits？",
        a: "房产描述、服务描述、博客和活动方案需要更多 AI 生成工作。",
      },
      {
        q: "可以充值 credits 吗？",
        a: "可以。当每月 credits 不够时，您可以随时购买额外 AI credits。",
      },
    ],
  },

  id: {
    badge: "Harga Kolkap",
    title: "Harga AI staff yang sederhana untuk pemilik bisnis.",
    subtitle:
      "Mulai dengan trial gratis 14 hari, lalu pilih paket yang sesuai dengan bisnis Anda. AI credits digunakan untuk balasan, caption, deskripsi, dan konten.",
    month: "/bulan",
    startTrial: "Mulai Trial Gratis",
    chooseGrowth: "Pilih Growth",
    choosePro: "Pilih Pro",
    contactUs: "Hubungi Kami",
    popular: "Paling Populer",
    included: "Termasuk",
    plansTitle: "Pilih paket Anda",
    plansText:
      "Setiap paket menjaga alur tetap mudah: buat AI, tambah knowledge, tes, dan aktifkan.",
    creditTitle: "Cara kerja AI credits",
    creditText:
      "AI credits digunakan saat Kolkap membuat balasan, caption, deskripsi, atau konten.",
    topupTitle: "Butuh lebih banyak AI credits?",
    topupText:
      "Top up kapan saja saat bisnis Anda butuh lebih banyak balasan AI atau konten.",
    faqTitle: "FAQ Harga",
    finalTitle: "Mulai dengan 14 hari gratis.",
    finalText:
      "Buat AI staff, tes balasannya, dan lihat bagaimana Kolkap bisa mendukung bisnis Anda.",
    finalButton: "Mulai Trial Gratis",
    plans: [
      {
        name: "Free Trial",
        price: "Gratis",
        description: "Tes Kolkap sebelum memilih paket berbayar.",
        features: [
          "14 hari gratis",
          "100 AI credits",
          "1 AI staff",
          "Alur Create AI",
          "Tambah business knowledge",
          "Tes balasan AI",
        ],
      },
      {
        name: "Growth",
        price: "$49.99",
        description:
          "Untuk bisnis kecil yang siap memakai AI untuk balasan dan leads.",
        features: [
          "2 AI staff",
          "1,500 AI credits/bulan",
          "Alur setup WhatsApp",
          "Inbox dan leads",
          "Human handover",
          "Social media caption generator",
        ],
      },
      {
        name: "Pro",
        price: "$99.00",
        description:
          "Untuk bisnis berkembang yang butuh lebih banyak AI staff dan credits.",
        features: [
          "5 AI staff",
          "4,000 AI credits/bulan",
          "Alur setup WhatsApp",
          "Inbox dan leads",
          "Reports",
          "Priority support",
        ],
      },
      {
        name: "Business",
        price: "Hubungi Kami",
        description:
          "Untuk agency, hotel, klinik, grup real estate, dan tim high-volume.",
        features: [
          "10–20 AI staff",
          "Custom AI credits",
          "Multiple business locations",
          "Team access",
          "Custom onboarding",
          "Priority support",
        ],
      },
    ],
    creditRules: [
      ["Balasan AI pelanggan", "1 credit"],
      ["Pesan tes AI", "1 credit"],
      ["Caption social media", "1 credit"],
      ["Pesan sales follow-up", "1 credit"],
      ["Deskripsi properti / layanan", "3 credits"],
      ["Konten panjang / campaign pack", "5 credits"],
    ],
    topups: [
      ["$10", "150 AI credits"],
      ["$25", "400 AI credits"],
      ["$50", "900 AI credits"],
      ["$100", "2,000 AI credits"],
    ],
    faqs: [
      {
        q: "Apakah harus bayar sebelum mencoba Kolkap?",
        a: "Tidak. Anda bisa mulai dengan trial gratis 14 hari dan 100 AI credits.",
      },
      {
        q: "Apa itu 1 AI credit?",
        a: "Satu balasan AI sederhana, pesan tes, caption social media, atau follow-up pendek biasanya memakai 1 credit.",
      },
      {
        q: "Kenapa konten panjang memakai lebih banyak credits?",
        a: "Deskripsi properti, deskripsi layanan, blog, dan campaign pack membutuhkan kerja AI yang lebih banyak.",
      },
      {
        q: "Bisa top up credits?",
        a: "Bisa. Anda dapat membeli AI credits tambahan kapan saja saat credits bulanan hampir habis.",
      },
    ],
  },

  ms: {
    badge: "Harga Kolkap",
    title: "Harga AI staff yang mudah untuk pemilik bisnes.",
    subtitle:
      "Mulakan dengan trial percuma 14 hari, kemudian pilih pakej yang sesuai dengan bisnes anda. AI credits digunakan untuk balasan, caption, deskripsi, dan kandungan.",
    month: "/bulan",
    startTrial: "Mula Trial Percuma",
    chooseGrowth: "Pilih Growth",
    choosePro: "Pilih Pro",
    contactUs: "Hubungi Kami",
    popular: "Paling Popular",
    included: "Termasuk",
    plansTitle: "Pilih pakej anda",
    plansText:
      "Setiap pakej mengekalkan aliran mudah: cipta AI, tambah knowledge, uji, dan aktifkan.",
    creditTitle: "Cara AI credits digunakan",
    creditText:
      "AI credits digunakan apabila Kolkap menjana balasan, caption, deskripsi, atau kandungan.",
    topupTitle: "Perlukan lebih banyak AI credits?",
    topupText:
      "Top up bila-bila masa apabila bisnes anda perlukan lebih banyak balasan AI atau kandungan.",
    faqTitle: "FAQ Harga",
    finalTitle: "Mulakan dengan 14 hari percuma.",
    finalText:
      "Cipta AI staff, uji balasan, dan lihat bagaimana Kolkap boleh menyokong bisnes anda.",
    finalButton: "Mula Trial Percuma",
    plans: [
      {
        name: "Free Trial",
        price: "Percuma",
        description: "Uji Kolkap sebelum memilih pakej berbayar.",
        features: [
          "14 hari percuma",
          "100 AI credits",
          "1 AI staff",
          "Aliran Create AI",
          "Tambah business knowledge",
          "Uji balasan AI",
        ],
      },
      {
        name: "Growth",
        price: "$49.99",
        description:
          "Untuk bisnes kecil yang bersedia menggunakan AI untuk balasan dan prospek.",
        features: [
          "2 AI staff",
          "1,500 AI credits/bulan",
          "Aliran setup WhatsApp",
          "Inbox dan leads",
          "Human handover",
          "Social media caption generator",
        ],
      },
      {
        name: "Pro",
        price: "$99.00",
        description:
          "Untuk bisnes berkembang yang perlukan lebih banyak AI staff dan credits.",
        features: [
          "5 AI staff",
          "4,000 AI credits/bulan",
          "Aliran setup WhatsApp",
          "Inbox dan leads",
          "Reports",
          "Priority support",
        ],
      },
      {
        name: "Business",
        price: "Hubungi Kami",
        description:
          "Untuk agency, hotel, klinik, kumpulan real estate, dan team high-volume.",
        features: [
          "10–20 AI staff",
          "Custom AI credits",
          "Multiple business locations",
          "Team access",
          "Custom onboarding",
          "Priority support",
        ],
      },
    ],
    creditRules: [
      ["Balasan AI pelanggan", "1 credit"],
      ["Mesej ujian AI", "1 credit"],
      ["Caption social media", "1 credit"],
      ["Mesej sales follow-up", "1 credit"],
      ["Deskripsi properti / servis", "3 credits"],
      ["Kandungan panjang / campaign pack", "5 credits"],
    ],
    topups: [
      ["$10", "150 AI credits"],
      ["$25", "400 AI credits"],
      ["$50", "900 AI credits"],
      ["$100", "2,000 AI credits"],
    ],
    faqs: [
      {
        q: "Perlu bayar sebelum mencuba Kolkap?",
        a: "Tidak. Anda boleh mula dengan trial percuma 14 hari dan 100 AI credits.",
      },
      {
        q: "Apa itu 1 AI credit?",
        a: "Satu balasan AI mudah, mesej ujian, caption social media, atau follow-up pendek biasanya menggunakan 1 credit.",
      },
      {
        q: "Kenapa kandungan panjang guna lebih banyak credits?",
        a: "Deskripsi properti, deskripsi servis, blog, dan campaign pack memerlukan kerja AI yang lebih banyak.",
      },
      {
        q: "Boleh top up credits?",
        a: "Boleh. Anda boleh membeli AI credits tambahan bila-bila masa apabila credits bulanan hampir habis.",
      },
    ],
  },
};

export default function PricingPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
            {t.subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup?next=/dashboard/create-ai"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              {t.startTrial}
              <ArrowRight className="h-6 w-6" />
            </Link>

            <Link
              href="/signup?next=/dashboard/create-ai"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Bot className="h-6 w-6" />
              Create AI
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            {t.plansTitle}
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {t.plansText}
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {t.plans.map((plan, index) => {
            const highlighted = index === 1;

            return (
              <div
                key={plan.name}
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
                  {index === 0 ? (
                    <Sparkles className="h-7 w-7" />
                  ) : index === 1 ? (
                    <Rocket className="h-7 w-7" />
                  ) : index === 2 ? (
                    <Zap className="h-7 w-7" />
                  ) : (
                    <Users className="h-7 w-7" />
                  )}
                </div>

                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  {plan.name}
                </h3>

                <p className="mt-3 text-5xl font-black tracking-[-0.06em]">
                  {plan.price}
                  {plan.price.includes("$") ? (
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
                  className={`mt-5 text-lg font-semibold leading-8 ${
                    highlighted ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {plan.description}
                </p>

                <div className="mt-7 space-y-3">
                  <p
                    className={`text-sm font-black uppercase tracking-[0.18em] ${
                      highlighted ? "text-[#7CFF3D]" : "text-blue-600"
                    }`}
                  >
                    {t.included}
                  </p>

                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
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
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/signup?next=/dashboard/create-ai"
                  className={`mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-lg font-black ${
                    highlighted
                      ? "bg-white text-[#07111F]"
                      : "bg-[#07111F] text-white"
                  }`}
                >
                  {index === 0
                    ? t.startTrial
                    : index === 1
                      ? t.chooseGrowth
                      : index === 2
                        ? t.choosePro
                        : t.contactUs}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            );
          })}
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
              <div
                key={action}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <MessageCircle className="h-6 w-6 text-slate-500" />
                  <p className="text-lg font-black">{action}</p>
                </div>

                <span className="rounded-full bg-white px-5 py-3 text-base font-black text-[#07111F]">
                  {credits}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="mb-8 max-w-3xl">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {t.topupTitle}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              {t.topupText}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.topups.map(([price, credits]) => (
              <div
                key={price}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
              >
                <p className="text-5xl font-black tracking-[-0.06em]">
                  {price}
                </p>
                <p className="mt-4 text-xl font-black text-[#7CFF3D]">
                  {credits}
                </p>
                <Link
                  href="/signup?next=/dashboard/create-ai"
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-base font-black text-[#07111F]"
                >
                  Top Up
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            ))}
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
            href="/signup?next=/dashboard/create-ai"
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