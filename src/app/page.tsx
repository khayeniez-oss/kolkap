"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Headphones,
  Inbox,
  MessageCircle,
  PenLine,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import KolkapLogo from "@/components/brand/KolkapLogo";

const STARTER_SIGNUP_URL = "/signup?plan=starter";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

const translations = {
  en: {
    badge: "AI staff for replies, leads, support, and content",
    heroTitle: "AI staff that helps your business reply faster.",
    heroText:
      "Kolkap helps businesses create AI staff for customer replies, WhatsApp conversations, website chat, lead capture, support, and content — all in one simple workspace.",
    start: "Start Free Trial",
    login: "Log in",
    heroCustomer: "Hi, can your AI help reply to my customers on WhatsApp?",
    heroAI:
      "Yes. Create your AI staff, add your business knowledge, test the replies, and go live when you are ready.",
    setup: "Setup",
    simple: "Simple",
    channel: "Channel",
    handover: "Handover",
    ready: "Ready",
    whatLabel: "What is Kolkap?",
    whatTitle:
      "Kolkap is an AI staff platform for businesses that receive customer messages.",
    whatText:
      "Kolkap is built for business owners and teams who want AI support without confusion. Your AI staff can learn your business knowledge, help reply to customers, support your inbox, capture leads, and assist your daily work.",
    whatCards: [
      {
        title: "Reply faster",
        text: "Answer common customer questions faster across WhatsApp, website chat, and inbox conversations.",
      },
      {
        title: "Capture better leads",
        text: "Collect important customer details like name, contact, needs, budget, timeline, and next steps.",
      },
      {
        title: "Support your team",
        text: "Let AI handle repetitive questions while your team takes over when a human is needed.",
      },
    ],
    setupLabel: "Simple setup",
    setupTitle: "Create your AI staff, teach it your business, then go live.",
    setupText:
      "Kolkap keeps the setup simple for business users. You create your AI staff, add your business information, test the replies, connect your customer channels, and activate it when ready.",
    steps: [
      {
        title: "Create your AI staff",
        text: "Choose the role your AI staff should play in your business.",
      },
      {
        title: "Add business knowledge",
        text: "Add your FAQs, services, pricing, policies, tone, and approved answers.",
      },
      {
        title: "Connect WhatsApp",
        text: "Connect your business WhatsApp through a guided customer-friendly flow.",
      },
      {
        title: "Test replies",
        text: "Ask sample questions and review the answers before customers see them.",
      },
      {
        title: "Go live",
        text: "Activate your AI staff when your business is ready.",
      },
    ],
    rolesLabel: "AI staff roles",
    rolesTitle: "Choose the AI role your business needs.",
    roles: [
      {
        title: "AI Receptionist",
        text: "Welcomes customers, asks what they need, and collects basic details.",
      },
      {
        title: "AI WhatsApp Responder",
        text: "Replies to WhatsApp inquiries and helps qualify customer leads.",
      },
      {
        title: "AI Customer Support",
        text: "Answers common questions about services, pricing, policies, and support.",
      },
      {
        title: "AI Copywriter",
        text: "Creates captions, scripts, ad copy, and customer messages.",
      },
    ],
    privateLabel: "Private business workspace",
    privateTitle: "Your AI staff works with your own business information.",
    privateText:
      "Each business has its own workspace, AI staff, business knowledge, inbox, leads, settings, and team access. Kolkap keeps every business experience separate and organized.",
    privateRules: [
      "Your business knowledge stays inside your own workspace.",
      "Customer conversations are organized under the correct business.",
      "Leads are saved clearly for follow-up.",
      "Human handover is available when your team needs to step in.",
    ],
    finalTitle: "Give your business AI staff without making things complicated.",
    finalText:
      "Start with a simple trial. Create your AI staff, add your business knowledge, test replies, and go live when you are ready.",
    finalButton: "Start Free Trial",
  },

  id: {
    badge: "AI staff untuk balasan, leads, support, dan konten",
    heroTitle: "AI staff yang membantu bisnis Anda membalas lebih cepat.",
    heroText:
      "Kolkap membantu bisnis membuat AI staff untuk customer replies, WhatsApp conversations, website chat, lead capture, support, dan content — semua dalam satu workspace yang simple.",
    start: "Mulai Free Trial",
    login: "Masuk",
    heroCustomer: "Hai, apakah AI bisa membantu membalas customer saya di WhatsApp?",
    heroAI:
      "Bisa. Buat AI staff Anda, tambahkan business knowledge, test balasannya, lalu aktifkan saat sudah siap.",
    setup: "Setup",
    simple: "Mudah",
    channel: "Channel",
    handover: "Handover",
    ready: "Siap",
    whatLabel: "Apa itu Kolkap?",
    whatTitle:
      "Kolkap adalah platform AI staff untuk bisnis yang menerima pesan dari customer.",
    whatText:
      "Kolkap dibuat untuk business owners dan team yang ingin bantuan AI tanpa kebingungan. AI staff Anda dapat belajar dari business knowledge, membantu membalas customer, mendukung inbox, menangkap leads, dan membantu pekerjaan harian.",
    whatCards: [
      {
        title: "Balas lebih cepat",
        text: "Jawab pertanyaan umum customer lebih cepat melalui WhatsApp, website chat, dan inbox conversations.",
      },
      {
        title: "Tangkap leads lebih baik",
        text: "Kumpulkan detail penting customer seperti nama, kontak, kebutuhan, budget, timeline, dan next step.",
      },
      {
        title: "Dukung team Anda",
        text: "Biarkan AI menangani pertanyaan berulang, sementara team Anda mengambil alih saat manusia dibutuhkan.",
      },
    ],
    setupLabel: "Setup mudah",
    setupTitle: "Buat AI staff, ajarkan bisnis Anda, lalu aktifkan.",
    setupText:
      "Kolkap menjaga proses setup tetap simple untuk pengguna bisnis. Anda membuat AI staff, menambahkan informasi bisnis, mengetes balasan, menghubungkan customer channels, lalu mengaktifkannya saat siap.",
    steps: [
      {
        title: "Buat AI staff Anda",
        text: "Pilih peran yang harus dilakukan AI staff untuk bisnis Anda.",
      },
      {
        title: "Tambahkan business knowledge",
        text: "Tambahkan FAQ, layanan, harga, policy, tone, dan jawaban yang sudah disetujui.",
      },
      {
        title: "Hubungkan WhatsApp",
        text: "Hubungkan WhatsApp bisnis Anda melalui alur yang mudah dipandu.",
      },
      {
        title: "Test balasan",
        text: "Kirim pertanyaan contoh dan review jawaban sebelum customer melihatnya.",
      },
      {
        title: "Aktifkan",
        text: "Aktifkan AI staff saat bisnis Anda sudah siap.",
      },
    ],
    rolesLabel: "Peran AI staff",
    rolesTitle: "Pilih peran AI yang dibutuhkan bisnis Anda.",
    roles: [
      {
        title: "AI Receptionist",
        text: "Menyambut customer, menanyakan kebutuhan, dan mengumpulkan detail dasar.",
      },
      {
        title: "AI WhatsApp Responder",
        text: "Membalas pertanyaan WhatsApp dan membantu menyaring customer leads.",
      },
      {
        title: "AI Customer Support",
        text: "Menjawab pertanyaan umum tentang layanan, harga, policy, dan support.",
      },
      {
        title: "AI Copywriter",
        text: "Membuat caption, script, ad copy, dan pesan customer.",
      },
    ],
    privateLabel: "Private business workspace",
    privateTitle: "AI staff Anda bekerja dengan informasi bisnis Anda sendiri.",
    privateText:
      "Setiap bisnis memiliki workspace, AI staff, business knowledge, inbox, leads, settings, dan team access sendiri. Kolkap menjaga setiap pengalaman bisnis tetap terpisah dan teratur.",
    privateRules: [
      "Business knowledge Anda tetap berada dalam workspace Anda sendiri.",
      "Customer conversations tertata di bisnis yang benar.",
      "Leads tersimpan jelas untuk follow-up.",
      "Human handover tersedia saat team perlu mengambil alih.",
    ],
    finalTitle: "Berikan bisnis Anda AI staff tanpa membuat semuanya rumit.",
    finalText:
      "Mulai dengan trial yang simple. Buat AI staff, tambahkan business knowledge, test balasan, lalu aktifkan saat siap.",
    finalButton: "Mulai Free Trial",
  },

  zh: {
    badge: "用于回复、线索、客服和内容的 AI 员工",
    heroTitle: "帮助企业更快回复客户的 AI 员工。",
    heroText:
      "Kolkap 帮助企业创建 AI 员工，用于 customer replies、WhatsApp conversations、website chat、lead capture、support 和 content，并集中在一个简单 workspace 中。",
    start: "开始免费试用",
    login: "登录",
    heroCustomer: "你好，AI 可以帮我在 WhatsApp 回复客户吗？",
    heroAI:
      "可以。创建您的 AI 员工，添加 business knowledge，测试回复，然后在准备好后上线。",
    setup: "设置",
    simple: "简单",
    channel: "渠道",
    handover: "人工接手",
    ready: "已准备",
    whatLabel: "什么是 Kolkap？",
    whatTitle:
      "Kolkap 是为经常收到客户消息的企业打造的 AI 员工平台。",
    whatText:
      "Kolkap 专为希望使用 AI 支持、但不想面对复杂流程的 business owners 和 teams 打造。您的 AI staff 可以学习 business knowledge、帮助回复客户、支持 inbox、捕捉 leads，并协助日常工作。",
    whatCards: [
      {
        title: "更快回复",
        text: "通过 WhatsApp、website chat 和 inbox conversations 更快回答常见客户问题。",
      },
      {
        title: "捕捉更好的 leads",
        text: "收集客户姓名、联系方式、需求、预算、时间线和下一步。",
      },
      {
        title: "支持团队",
        text: "让 AI 处理重复问题，当需要真人帮助时由团队接手。",
      },
    ],
    setupLabel: "简单设置",
    setupTitle: "创建 AI 员工，教它了解企业，然后上线。",
    setupText:
      "Kolkap 让企业用户的设置过程保持简单。您创建 AI staff、添加企业信息、测试回复、连接客户渠道，并在准备好后启用。",
    steps: [
      {
        title: "创建 AI 员工",
        text: "选择 AI staff 在您的企业中需要承担的角色。",
      },
      {
        title: "添加 business knowledge",
        text: "添加 FAQ、服务、价格、政策、tone 和已批准的答案。",
      },
      {
        title: "连接 WhatsApp",
        text: "通过简单的引导流程连接您的企业 WhatsApp。",
      },
      {
        title: "测试回复",
        text: "发送示例问题，并在客户看到前检查答案。",
      },
      {
        title: "上线",
        text: "当您的企业准备好后启用 AI staff。",
      },
    ],
    rolesLabel: "AI 员工角色",
    rolesTitle: "选择您的业务需要的 AI 角色。",
    roles: [
      {
        title: "AI Receptionist",
        text: "欢迎客户，询问需求，并收集基本信息。",
      },
      {
        title: "AI WhatsApp Responder",
        text: "回复 WhatsApp 咨询，并帮助筛选客户 leads。",
      },
      {
        title: "AI Customer Support",
        text: "回答有关服务、价格、政策和 support 的常见问题。",
      },
      {
        title: "AI Copywriter",
        text: "创建 captions、scripts、ad copy 和客户消息。",
      },
    ],
    privateLabel: "私有 business workspace",
    privateTitle: "您的 AI staff 使用您自己的企业信息工作。",
    privateText:
      "每个企业都有自己的 workspace、AI staff、business knowledge、inbox、leads、settings 和 team access。Kolkap 让每个企业体验保持独立、有序。",
    privateRules: [
      "您的 business knowledge 保留在您自己的 workspace 中。",
      "Customer conversations 会整理到正确的企业下。",
      "Leads 会清楚保存，方便 follow-up。",
      "当团队需要接手时，可以使用 human handover。",
    ],
    finalTitle: "为您的企业增加 AI staff，而不让事情变复杂。",
    finalText:
      "从简单 trial 开始。创建 AI staff、添加 business knowledge、测试回复，并在准备好后上线。",
    finalButton: "开始免费试用",
  },

  ms: {
    badge: "AI staff untuk balasan, prospek, sokongan, dan kandungan",
    heroTitle: "AI staff yang membantu bisnes anda membalas lebih cepat.",
    heroText:
      "Kolkap membantu bisnes mencipta AI staff untuk customer replies, WhatsApp conversations, website chat, lead capture, support, dan content — semuanya dalam satu workspace yang simple.",
    start: "Mulakan Free Trial",
    login: "Log masuk",
    heroCustomer: "Hai, bolehkah AI membantu membalas customer saya di WhatsApp?",
    heroAI:
      "Boleh. Cipta AI staff anda, tambah business knowledge, test replies, kemudian aktifkan apabila sudah sedia.",
    setup: "Setup",
    simple: "Mudah",
    channel: "Channel",
    handover: "Handover",
    ready: "Sedia",
    whatLabel: "Apa itu Kolkap?",
    whatTitle:
      "Kolkap ialah platform AI staff untuk bisnes yang menerima mesej customer.",
    whatText:
      "Kolkap dibina untuk business owners dan teams yang mahukan sokongan AI tanpa kekeliruan. AI staff anda boleh belajar business knowledge, membantu membalas customer, menyokong inbox, menangkap leads, dan membantu kerja harian.",
    whatCards: [
      {
        title: "Balas lebih cepat",
        text: "Jawab soalan biasa customer lebih cepat melalui WhatsApp, website chat, dan inbox conversations.",
      },
      {
        title: "Tangkap leads lebih baik",
        text: "Kumpulkan detail penting customer seperti nama, contact, needs, budget, timeline, dan next step.",
      },
      {
        title: "Sokong team anda",
        text: "Biarkan AI mengurus soalan berulang, sementara team anda mengambil alih apabila manusia diperlukan.",
      },
    ],
    setupLabel: "Setup mudah",
    setupTitle: "Cipta AI staff, ajar tentang bisnes anda, kemudian aktifkan.",
    setupText:
      "Kolkap memastikan setup kekal simple untuk pengguna bisnes. Anda mencipta AI staff, menambah business information, test replies, connect customer channels, dan aktifkan apabila sedia.",
    steps: [
      {
        title: "Cipta AI staff anda",
        text: "Pilih role yang AI staff perlu lakukan untuk bisnes anda.",
      },
      {
        title: "Tambah business knowledge",
        text: "Tambah FAQ, services, pricing, policies, tone, dan approved answers.",
      },
      {
        title: "Connect WhatsApp",
        text: "Connect WhatsApp bisnes anda melalui guided flow yang mudah.",
      },
      {
        title: "Test replies",
        text: "Hantar sample questions dan review answers sebelum customer melihatnya.",
      },
      {
        title: "Aktifkan",
        text: "Aktifkan AI staff apabila bisnes anda sudah sedia.",
      },
    ],
    rolesLabel: "Peranan AI staff",
    rolesTitle: "Pilih peranan AI yang bisnes anda perlukan.",
    roles: [
      {
        title: "AI Receptionist",
        text: "Menyambut customer, bertanya keperluan, dan mengumpul basic details.",
      },
      {
        title: "AI WhatsApp Responder",
        text: "Membalas WhatsApp inquiries dan membantu qualify customer leads.",
      },
      {
        title: "AI Customer Support",
        text: "Menjawab soalan biasa tentang services, pricing, policies, dan support.",
      },
      {
        title: "AI Copywriter",
        text: "Mencipta captions, scripts, ad copy, dan customer messages.",
      },
    ],
    privateLabel: "Private business workspace",
    privateTitle: "AI staff anda bekerja dengan business information anda sendiri.",
    privateText:
      "Setiap bisnes mempunyai workspace, AI staff, business knowledge, inbox, leads, settings, dan team access sendiri. Kolkap memastikan setiap business experience kekal terpisah dan teratur.",
    privateRules: [
      "Business knowledge anda kekal dalam workspace anda sendiri.",
      "Customer conversations disusun di bawah bisnes yang betul.",
      "Leads disimpan dengan jelas untuk follow-up.",
      "Human handover tersedia apabila team perlu mengambil alih.",
    ],
    finalTitle: "Berikan bisnes anda AI staff tanpa menjadikannya rumit.",
    finalText:
      "Mulakan dengan trial yang simple. Cipta AI staff, tambah business knowledge, test replies, dan aktifkan apabila sedia.",
    finalButton: "Mulakan Free Trial",
  },
};

const roleIcons = [Bot, MessageCircle, Headphones, PenLine];
const featureIcons = [MessageCircle, Users, Headphones];
const stepIcons = [Bot, BookOpen, MessageCircle, WandSparkles, Rocket];

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
}

export default function Home() {
  const { language } = useKolkapLanguage();
  const lang = getSupportedLanguage(language);
  const t = translations[lang];

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F9FA] text-[#07111F]">
      <section className="relative">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_12%_8%,rgba(37,99,255,0.15),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(124,255,61,0.1),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#F7F9FA_100%)]" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-700 shadow-sm sm:text-lg">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D]" />
              {t.badge}
            </div>

            <h1 className="max-w-2xl text-[2.8rem] font-black leading-[1.04] tracking-[-0.05em] text-[#07111F] sm:text-[3.7rem] lg:text-[4.25rem] xl:text-[4.65rem]">
              {t.heroTitle}
            </h1>

            <p className="mt-7 max-w-2xl text-xl font-semibold leading-9 text-slate-600 sm:text-2xl sm:leading-10">
              {t.heroText}
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href={STARTER_SIGNUP_URL}
                className="rounded-full bg-[#07111F] px-8 py-4 text-center text-lg font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
              >
                {t.start}
              </Link>

              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white px-8 py-4 text-center text-lg font-black text-[#07111F] shadow-sm transition hover:-translate-y-0.5"
              >
                {t.login}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-blue-500/16 via-transparent to-[#7CFF3D]/14 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[#05070A] p-4 shadow-2xl shadow-slate-900/20 sm:rounded-[2.4rem] sm:p-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,255,0.34),transparent_34%),radial-gradient(circle_at_95%_0%,rgba(124,255,61,0.16),transparent_30%),#07111F] p-5 text-white sm:p-7 lg:p-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <KolkapLogo size="sm" showText={false} />
                    <div>
                      <p className="text-2xl font-black">Kolkap Inbox</p>
                      <p className="text-base font-bold text-slate-300">
                        AI online now
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#7CFF3D] px-4 py-2 text-sm font-black text-[#07111F]">
                    LIVE
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="max-w-[90%] rounded-2xl bg-white/10 p-5 sm:max-w-[78%]">
                    <p className="text-base font-black text-white">Customer</p>
                    <p className="mt-2 text-lg leading-8 text-slate-300">
                      {t.heroCustomer}
                    </p>
                  </div>

                  <div className="ml-auto max-w-[94%] rounded-2xl border border-blue-400/40 bg-blue-500/15 p-5 sm:max-w-[86%]">
                    <p className="text-base font-black text-blue-100">
                      Kolkap AI
                    </p>
                    <p className="mt-2 text-lg leading-8 text-slate-200">
                      {t.heroAI}
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-3">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
                        {t.setup}
                      </p>
                      <p className="mt-2 text-xl font-black text-[#7CFF3D]">
                        {t.simple}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
                        {t.channel}
                      </p>
                      <p className="mt-2 text-xl font-black">WhatsApp</p>
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
                        {t.handover}
                      </p>
                      <p className="mt-2 text-xl font-black">{t.ready}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

            <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-lg font-black uppercase tracking-[0.22em] text-blue-600">
              {t.whatLabel}
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              {t.whatTitle}
            </h2>
            <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
              {t.whatText}
            </p>
          </div>

          <div className="grid gap-5">
            {t.whatCards.map((card, index) => {
              const Icon = featureIcons[index];

              return (
                <div
                  key={card.title}
                  className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-start"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-8 w-8" />
                  </div>

                  <div>
                    <h3 className="text-3xl font-black tracking-[-0.04em]">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                      {card.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-10 max-w-3xl">
            <p className="text-lg font-black uppercase tracking-[0.22em] text-[#7CFF3D]">
              {t.setupLabel}
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              {t.setupTitle}
            </h2>
            <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
              {t.setupText}
            </p>
          </div>

          <div className="grid gap-5">
            {t.steps.map((step, index) => {
              const Icon = stepIcons[index];

              return (
                <div
                  key={step.title}
                  className="grid gap-5 rounded-[1.8rem] border border-white/10 bg-white/5 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
                    <Icon className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="text-base font-black text-[#7CFF3D]">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
                      {step.text}
                    </p>
                  </div>

                  <ArrowRight className="hidden h-7 w-7 text-slate-500 sm:block" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="mb-10 max-w-3xl">
          <p className="text-lg font-black uppercase tracking-[0.22em] text-blue-600">
            {t.rolesLabel}
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.rolesTitle}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.roles.map((role, index) => {
            const Icon = roleIcons[index];

            return (
              <div
                key={role.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  {role.title}
                </h3>
                <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                  {role.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.22em] text-blue-600">
              {t.privateLabel}
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              {t.privateTitle}
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
              {t.privateText}
            </p>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
            <div className="space-y-4">
              {t.privateRules.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-6">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-center text-white shadow-2xl shadow-slate-900/20 sm:p-12">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#7CFF3D] text-[#07111F]">
            <Sparkles className="h-10 w-10" />
          </div>

          <h2 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.finalTitle}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
            {t.finalText}
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={STARTER_SIGNUP_URL}
              className="rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              {t.finalButton}
            </Link>

            <Link
              href={STARTER_SIGNUP_URL}
              className="rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              {t.start}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}