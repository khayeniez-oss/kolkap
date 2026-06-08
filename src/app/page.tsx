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

const translations = {
  en: {
    badge: "AI staff for replies, leads, support, and content",
    heroTitle: "Your AI business team, always on.",
    heroText:
      "Kolkap helps businesses create AI staff to reply to customers, capture leads, support daily operations, and generate content across WhatsApp, website chat, and more.",
    start: "Start with Kolkap",
    login: "Log in",
    heroCustomer: "Hi, can your AI reply to my customers on WhatsApp?",
    heroAI:
      "Yes. Create your AI, add your business knowledge, connect WhatsApp, test it, then go live.",
    setup: "Setup",
    simple: "Simple",
    channel: "Channel",
    handover: "Handover",
    ready: "Ready",
    whatLabel: "What is Kolkap?",
    whatTitle:
      "Kolkap is an AI staff platform for customer replies, leads, and business support.",
    whatText:
      "Kolkap is built for business owners who want AI help without technical confusion. You create the AI, teach it your business knowledge, test it, and activate it when ready.",
    whatCards: [
      {
        title: "Reply faster",
        text: "Let AI answer common customer questions instantly.",
      },
      {
        title: "Capture leads",
        text: "Collect names, contact details, needs, budget, and timeline.",
      },
      {
        title: "Support your team",
        text: "Let humans take over when the customer needs real help.",
      },
    ],
    setupLabel: "Simple setup",
    setupTitle: "Create AI → Add knowledge → Test → Go live.",
    setupText:
      "No webhook. No API token. No confusing provider setup. Kolkap keeps the customer flow simple and handles the technical side behind the scenes.",
    steps: [
      {
        title: "Create your AI",
        text: "Choose what your AI should do for your business.",
      },
      {
        title: "Add knowledge",
        text: "Teach Kolkap your FAQs, services, pricing, policies, and approved answers.",
      },
      {
        title: "Connect WhatsApp",
        text: "Connect your business WhatsApp using a simple guided flow.",
      },
      {
        title: "Test AI",
        text: "Send sample questions and review the replies before customers see it.",
      },
      {
        title: "Go live",
        text: "Activate AI when your setup is ready.",
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
        text: "Replies to WhatsApp inquiries and qualifies leads.",
      },
      {
        title: "AI Customer Support",
        text: "Answers FAQs, pricing, services, policies, and support questions.",
      },
      {
        title: "AI Copywriter",
        text: "Creates captions, scripts, ad copy, and customer messages.",
      },
    ],
    privateLabel: "Private workspace",
    privateTitle: "One Kolkap platform. Private AI for every business.",
    privateText:
      "Each business has its own AI staff, knowledge base, inbox, leads, settings, and rules. Kolkap replies using the correct business context only.",
    privateRules: [
      "Each business keeps its own private knowledge.",
      "Customer messages go to the correct inbox.",
      "Leads are saved under the correct business.",
      "Human handover happens when needed.",
    ],
    finalTitle: "Create your AI business team without the technical headache.",
    finalText:
      "Start simple: create your AI, add knowledge, test replies, and go live when ready.",
    finalButton: "Create AI",
  },
  zh: {
    badge: "用于回复、线索、客服和内容的 AI 员工",
    heroTitle: "您的 AI 商业团队，随时在线。",
    heroText:
      "Kolkap 帮助企业创建 AI 员工，用于回复客户、捕获线索、支持日常运营，并在 WhatsApp、网站聊天等渠道生成内容。",
    start: "开始使用 Kolkap",
    login: "登录",
    heroCustomer: "你好，你们的 AI 可以在 WhatsApp 回复我的客户吗？",
    heroAI:
      "可以。创建 AI，添加企业知识，连接 WhatsApp，测试后即可上线。",
    setup: "设置",
    simple: "简单",
    channel: "渠道",
    handover: "人工接手",
    ready: "已准备",
    whatLabel: "什么是 Kolkap？",
    whatTitle: "Kolkap 是用于客户回复、线索和商业支持的 AI 员工平台。",
    whatText:
      "Kolkap 专为不想处理技术复杂度的企业主打造。您只需创建 AI、教它企业知识、测试回复，并在准备好后上线。",
    whatCards: [
      {
        title: "更快回复",
        text: "让 AI 立即回答常见客户问题。",
      },
      {
        title: "捕获线索",
        text: "收集姓名、联系方式、需求、预算和时间线。",
      },
      {
        title: "支持团队",
        text: "当客户需要真人帮助时，让团队接手。",
      },
    ],
    setupLabel: "简单设置",
    setupTitle: "创建 AI → 添加知识 → 测试 → 上线。",
    setupText:
      "无需 webhook。无需 API token。无需复杂的供应商设置。Kolkap 让用户流程保持简单，并在后台处理技术部分。",
    steps: [
      {
        title: "创建 AI",
        text: "选择 AI 应该为您的业务做什么。",
      },
      {
        title: "添加知识",
        text: "教 Kolkap 您的 FAQ、服务、价格、政策和批准答案。",
      },
      {
        title: "连接 WhatsApp",
        text: "通过简单的引导流程连接您的企业 WhatsApp。",
      },
      {
        title: "测试 AI",
        text: "发送示例问题，并在客户看到前检查回复。",
      },
      {
        title: "上线",
        text: "当设置完成后启用 AI。",
      },
    ],
    rolesLabel: "AI 员工角色",
    rolesTitle: "选择您的业务需要的 AI 角色。",
    roles: [
      {
        title: "AI 接待员",
        text: "欢迎客户，询问需求，并收集基本信息。",
      },
      {
        title: "AI WhatsApp 回复员",
        text: "回复 WhatsApp 咨询并筛选线索。",
      },
      {
        title: "AI 客户支持",
        text: "回答 FAQ、价格、服务、政策和支持问题。",
      },
      {
        title: "AI 文案助手",
        text: "创建标题、脚本、广告文案和客户消息。",
      },
    ],
    privateLabel: "私有工作区",
    privateTitle: "一个 Kolkap 平台。每个企业都有私有 AI。",
    privateText:
      "每个企业都有自己的 AI 员工、知识库、收件箱、线索、设置和规则。Kolkap 只使用正确的企业上下文回复。",
    privateRules: [
      "每个企业保留自己的私有知识。",
      "客户消息进入正确的收件箱。",
      "线索保存在正确的企业下。",
      "需要时可由人工接手。",
    ],
    finalTitle: "无需技术压力，创建您的 AI 商业团队。",
    finalText: "从简单开始：创建 AI、添加知识、测试回复，并在准备好后上线。",
    finalButton: "创建 AI",
  },
  id: {
    badge: "AI staff untuk balasan, leads, support, dan konten",
    heroTitle: "Tim bisnis AI Anda, selalu aktif.",
    heroText:
      "Kolkap membantu bisnis membuat AI staff untuk membalas pelanggan, menangkap leads, mendukung operasional harian, dan membuat konten melalui WhatsApp, website chat, dan lainnya.",
    start: "Mulai dengan Kolkap",
    login: "Masuk",
    heroCustomer: "Hai, apakah AI Anda bisa membalas pelanggan saya di WhatsApp?",
    heroAI:
      "Bisa. Buat AI Anda, tambahkan pengetahuan bisnis, hubungkan WhatsApp, tes, lalu aktifkan.",
    setup: "Setup",
    simple: "Mudah",
    channel: "Channel",
    handover: "Handover",
    ready: "Siap",
    whatLabel: "Apa itu Kolkap?",
    whatTitle:
      "Kolkap adalah platform AI staff untuk balasan pelanggan, leads, dan dukungan bisnis.",
    whatText:
      "Kolkap dibuat untuk pemilik bisnis yang ingin bantuan AI tanpa kebingungan teknis. Anda membuat AI, mengajarkan pengetahuan bisnis, mengetesnya, lalu mengaktifkannya saat siap.",
    whatCards: [
      {
        title: "Balas lebih cepat",
        text: "Biarkan AI menjawab pertanyaan umum pelanggan secara instan.",
      },
      {
        title: "Tangkap leads",
        text: "Kumpulkan nama, kontak, kebutuhan, budget, dan timeline.",
      },
      {
        title: "Dukung tim",
        text: "Biarkan manusia mengambil alih saat pelanggan perlu bantuan nyata.",
      },
    ],
    setupLabel: "Setup mudah",
    setupTitle: "Buat AI → Tambah pengetahuan → Tes → Aktifkan.",
    setupText:
      "Tidak perlu webhook. Tidak perlu API token. Tidak perlu setup provider yang membingungkan. Kolkap menjaga alur pengguna tetap mudah dan menangani teknis di belakang layar.",
    steps: [
      {
        title: "Buat AI Anda",
        text: "Pilih apa yang AI harus lakukan untuk bisnis Anda.",
      },
      {
        title: "Tambah pengetahuan",
        text: "Ajarkan FAQ, layanan, harga, kebijakan, dan jawaban yang sudah disetujui.",
      },
      {
        title: "Hubungkan WhatsApp",
        text: "Hubungkan WhatsApp bisnis Anda dengan alur yang mudah.",
      },
      {
        title: "Tes AI",
        text: "Kirim pertanyaan contoh dan cek balasan sebelum pelanggan melihatnya.",
      },
      {
        title: "Aktifkan",
        text: "Aktifkan AI saat setup sudah siap.",
      },
    ],
    rolesLabel: "Peran AI staff",
    rolesTitle: "Pilih peran AI yang dibutuhkan bisnis Anda.",
    roles: [
      {
        title: "AI Receptionist",
        text: "Menyambut pelanggan, menanyakan kebutuhan, dan mengumpulkan detail dasar.",
      },
      {
        title: "AI WhatsApp Responder",
        text: "Membalas pertanyaan WhatsApp dan menyaring leads.",
      },
      {
        title: "AI Customer Support",
        text: "Menjawab FAQ, harga, layanan, kebijakan, dan pertanyaan support.",
      },
      {
        title: "AI Copywriter",
        text: "Membuat caption, script, iklan, dan pesan pelanggan.",
      },
    ],
    privateLabel: "Workspace pribadi",
    privateTitle: "Satu platform Kolkap. AI pribadi untuk setiap bisnis.",
    privateText:
      "Setiap bisnis punya AI staff, knowledge base, inbox, leads, settings, dan rules sendiri. Kolkap hanya membalas memakai konteks bisnis yang benar.",
    privateRules: [
      "Setiap bisnis menyimpan pengetahuan pribadinya sendiri.",
      "Pesan pelanggan masuk ke inbox yang benar.",
      "Leads disimpan di bisnis yang benar.",
      "Human handover aktif saat dibutuhkan.",
    ],
    finalTitle: "Buat tim bisnis AI tanpa pusing teknis.",
    finalText:
      "Mulai sederhana: buat AI, tambah pengetahuan, tes balasan, lalu aktifkan saat siap.",
    finalButton: "Buat AI",
  },
  ms: {
    badge: "AI staff untuk balasan, prospek, sokongan, dan kandungan",
    heroTitle: "Pasukan bisnes AI anda, sentiasa aktif.",
    heroText:
      "Kolkap membantu bisnes mencipta AI staff untuk membalas pelanggan, menangkap prospek, menyokong operasi harian, dan menjana kandungan melalui WhatsApp, website chat, dan banyak lagi.",
    start: "Mula dengan Kolkap",
    login: "Log masuk",
    heroCustomer: "Hai, bolehkah AI anda membalas pelanggan saya di WhatsApp?",
    heroAI:
      "Boleh. Cipta AI anda, tambah pengetahuan bisnes, sambungkan WhatsApp, uji, kemudian aktifkan.",
    setup: "Setup",
    simple: "Mudah",
    channel: "Saluran",
    handover: "Serahan manusia",
    ready: "Sedia",
    whatLabel: "Apa itu Kolkap?",
    whatTitle:
      "Kolkap ialah platform AI staff untuk balasan pelanggan, prospek, dan sokongan bisnes.",
    whatText:
      "Kolkap dibina untuk pemilik bisnes yang mahukan bantuan AI tanpa kekeliruan teknikal. Anda cipta AI, ajar pengetahuan bisnes, uji, dan aktifkan apabila sedia.",
    whatCards: [
      {
        title: "Balas lebih cepat",
        text: "Biarkan AI menjawab soalan biasa pelanggan dengan segera.",
      },
      {
        title: "Tangkap prospek",
        text: "Kumpulkan nama, butiran kontak, keperluan, bajet, dan tempoh masa.",
      },
      {
        title: "Sokong pasukan",
        text: "Benarkan manusia mengambil alih apabila pelanggan perlukan bantuan sebenar.",
      },
    ],
    setupLabel: "Setup mudah",
    setupTitle: "Cipta AI → Tambah pengetahuan → Uji → Aktifkan.",
    setupText:
      "Tiada webhook. Tiada API token. Tiada setup provider yang mengelirukan. Kolkap mengekalkan aliran pengguna mudah dan mengurus teknikal di belakang tabir.",
    steps: [
      {
        title: "Cipta AI anda",
        text: "Pilih apa yang AI perlu lakukan untuk bisnes anda.",
      },
      {
        title: "Tambah pengetahuan",
        text: "Ajar Kolkap FAQ, servis, harga, polisi, dan jawapan yang diluluskan.",
      },
      {
        title: "Sambungkan WhatsApp",
        text: "Sambungkan WhatsApp bisnes anda melalui aliran mudah.",
      },
      {
        title: "Uji AI",
        text: "Hantar soalan contoh dan semak balasan sebelum pelanggan melihatnya.",
      },
      {
        title: "Aktifkan",
        text: "Aktifkan AI apabila setup sudah sedia.",
      },
    ],
    rolesLabel: "Peranan AI staff",
    rolesTitle: "Pilih peranan AI yang bisnes anda perlukan.",
    roles: [
      {
        title: "AI Receptionist",
        text: "Menyambut pelanggan, bertanya keperluan, dan mengumpul butiran asas.",
      },
      {
        title: "AI WhatsApp Responder",
        text: "Membalas pertanyaan WhatsApp dan menapis prospek.",
      },
      {
        title: "AI Customer Support",
        text: "Menjawab FAQ, harga, servis, polisi, dan soalan sokongan.",
      },
      {
        title: "AI Copywriter",
        text: "Mencipta caption, skrip, iklan, dan mesej pelanggan.",
      },
    ],
    privateLabel: "Workspace peribadi",
    privateTitle: "Satu platform Kolkap. AI peribadi untuk setiap bisnes.",
    privateText:
      "Setiap bisnes mempunyai AI staff, knowledge base, inbox, leads, settings, dan rules sendiri. Kolkap hanya membalas menggunakan konteks bisnes yang betul.",
    privateRules: [
      "Setiap bisnes menyimpan pengetahuan peribadi sendiri.",
      "Mesej pelanggan masuk ke inbox yang betul.",
      "Prospek disimpan di bisnes yang betul.",
      "Human handover berlaku apabila diperlukan.",
    ],
    finalTitle: "Cipta pasukan bisnes AI tanpa pening teknikal.",
    finalText:
      "Mula mudah: cipta AI, tambah pengetahuan, uji balasan, dan aktifkan apabila sedia.",
    finalButton: "Cipta AI",
  },
};

const roleIcons = [Bot, MessageCircle, Headphones, PenLine];
const featureIcons = [MessageCircle, Users, Headphones];
const stepIcons = [Bot, BookOpen, MessageCircle, WandSparkles, Rocket];

export default function Home() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;

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

      {/* The rest of the page stays exactly the same, except final CTA links below. */}

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