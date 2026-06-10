"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  CirclePause,
  Globe2,
  Inbox,
  Mail,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type SupportedLanguage = "en" | "id" | "zh" | "ms";
type ChannelStatus = "ready" | "later";

type ChannelCard = {
  name: string;
  status: ChannelStatus;
  statusLabel: string;
  description: string;
  icon: LucideIcon;
  action: string;
  href?: string;
  highlighted?: boolean;
};

type Translation = {
  nav: {
    dashboard: string;
    aiStaff: string;
    knowledge: string;
    inbox: string;
    leads: string;
    content: string;
    billing: string;
    settings: string;
  };
  loading: string;
  failed: string;
  back: string;
  badge: string;
  title: string;
  subtitle: string;
  workspace: string;
  workspaceFallback: string;
  startSetup: string;
  goLive: string;
  setupFlow: string;
  setupTitle: string;
  setupText: string;
  setupSteps: {
    title: string;
    text: string;
  }[];
  channels: string;
  channelsTitle: string;
  channelsText: string;
  ready: string;
  later: string;
  websiteChat: string;
  whatsapp: string;
  email: string;
  websiteDescription: string;
  whatsappDescription: string;
  emailDescription: string;
  manageWebsite: string;
  manageWhatsapp: string;
  comingLater: string;
  messageFlow: string;
  messageFlowTitle: string;
  messageFlowText: string;
  flowItems: {
    title: string;
    text: string;
  }[];
  userControls: string;
  userControlsTitle: string;
  userControlsText: string;
  userControlsList: string[];
  kolkapHandles: string;
  kolkapHandlesTitle: string;
  kolkapHandlesText: string;
  kolkapHandlesList: string[];
  finalNote: string;
  finalNoteTitle: string;
  finalNoteText: string;
};

const translations: Record<SupportedLanguage, Translation> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      aiStaff: "AI Staff",
      knowledge: "Knowledge",
      inbox: "Inbox",
      leads: "Leads",
      content: "Content",
      billing: "Billing",
      settings: "Settings",
    },
    loading: "Loading customer channels...",
    failed: "Customer Channels page could not load.",
    back: "Back to Dashboard",
    badge: "Customer Channels",
    title: "Choose where your AI staff should answer customers.",
    subtitle:
      "Turn on Kolkap for website chat or WhatsApp. Kolkap receives customer messages, uses your AI staff and business knowledge, then helps reply and log the conversation.",
    workspace: "Workspace",
    workspaceFallback: "Your business",
    startSetup: "Choose Channel",
    goLive: "Go Live",
    setupFlow: "Simple Flow",
    setupTitle: "Create, test, then go live.",
    setupText:
      "Kolkap handles the technical connection in the background. You only choose where your AI staff should work.",
    setupSteps: [
      {
        title: "Create AI staff",
        text: "Set up the AI role, tone, language, and purpose.",
      },
      {
        title: "Add business knowledge",
        text: "Add FAQs, services, prices, policies, and approved answers.",
      },
      {
        title: "Test replies",
        text: "Send sample questions and improve the answer before customers see it.",
      },
      {
        title: "Choose channel",
        text: "Select website chat or WhatsApp as the customer channel.",
      },
      {
        title: "Go live or pause",
        text: "Turn AI replies on when ready. Pause anytime when needed.",
      },
    ],
    channels: "Channels",
    channelsTitle: "Available customer channels",
    channelsText: "Choose where Kolkap AI staff should reply.",
    ready: "Ready",
    later: "Later",
    websiteChat: "Website Chat",
    whatsapp: "WhatsApp",
    email: "Email",
    websiteDescription:
      "Let visitors message your business from your website and receive AI-assisted replies.",
    whatsappDescription:
      "Let customers message your business on WhatsApp and receive AI-assisted replies.",
    emailDescription:
      "Email support will be added later for summaries, reply drafts, and follow-ups.",
    manageWebsite: "Manage Website Chat",
    manageWhatsapp: "Manage WhatsApp",
    comingLater: "Coming Later",
    messageFlow: "How Kolkap Works",
    messageFlowTitle: "Kolkap is the bridge between your business and your customers.",
    messageFlowText:
      "When a customer sends a message, Kolkap receives it, matches it to your business, uses the assigned AI staff, replies, and records the activity.",
    flowItems: [
      {
        title: "Customer sends message",
        text: "From website chat, WhatsApp, or a future supported channel.",
      },
      {
        title: "Kolkap receives it",
        text: "Kolkap recognises the correct business workspace.",
      },
      {
        title: "AI staff replies",
        text: "The reply is based on your selected AI staff and Knowledge Base.",
      },
      {
        title: "Inbox and leads update",
        text: "The conversation, lead activity, and usage are recorded.",
      },
    ],
    userControls: "What You Control",
    userControlsTitle: "Simple business controls.",
    userControlsText:
      "The business owner should not manage webhooks or routing. The user only controls the business side.",
    userControlsList: [
      "Choose which AI staff replies",
      "Test messages before going live",
      "Turn a channel live",
      "Pause AI replies anytime",
      "Review conversations in Inbox",
    ],
    kolkapHandles: "What Kolkap Handles",
    kolkapHandlesTitle: "Kolkap handles the backend.",
    kolkapHandlesText:
      "The technical work stays inside Kolkap so the business owner can focus on customers.",
    kolkapHandlesList: [
      "Receiving customer messages",
      "Matching the message to the right business",
      "Using the assigned AI staff",
      "Reading the business Knowledge Base",
      "Logging conversations, leads, and credit usage",
    ],
    finalNote: "Ready to Go Live",
    finalNoteTitle: "Your AI staff should work only after setup and testing.",
    finalNoteText:
      "Before going live, make sure your AI staff is created, your business knowledge is added, test replies look good, your plan or trial is active, and credits are available.",
  },

  id: {
    nav: {
      dashboard: "Dashboard",
      aiStaff: "AI Staff",
      knowledge: "Knowledge",
      inbox: "Inbox",
      leads: "Leads",
      content: "Content",
      billing: "Billing",
      settings: "Settings",
    },
    loading: "Memuat customer channels...",
    failed: "Halaman Customer Channels tidak dapat dimuat.",
    back: "Kembali ke Dashboard",
    badge: "Customer Channels",
    title: "Pilih di mana AI staff Anda menjawab customer.",
    subtitle:
      "Aktifkan Kolkap untuk website chat atau WhatsApp. Kolkap menerima pesan customer, memakai AI staff dan knowledge bisnis Anda, lalu membantu membalas dan mencatat percakapan.",
    workspace: "Workspace",
    workspaceFallback: "Bisnis Anda",
    startSetup: "Pilih Channel",
    goLive: "Go Live",
    setupFlow: "Alur Sederhana",
    setupTitle: "Buat, test, lalu go live.",
    setupText:
      "Kolkap menangani koneksi teknis di background. Anda hanya memilih di mana AI staff bekerja.",
    setupSteps: [
      {
        title: "Buat AI staff",
        text: "Atur role, tone, bahasa, dan tujuan AI.",
      },
      {
        title: "Tambah business knowledge",
        text: "Tambah FAQ, layanan, harga, policy, dan jawaban yang disetujui.",
      },
      {
        title: "Test balasan",
        text: "Kirim contoh pertanyaan dan perbaiki jawaban sebelum dilihat customer.",
      },
      {
        title: "Pilih channel",
        text: "Pilih website chat atau WhatsApp sebagai channel customer.",
      },
      {
        title: "Go live atau pause",
        text: "Aktifkan AI reply saat siap. Pause kapan saja jika dibutuhkan.",
      },
    ],
    channels: "Channels",
    channelsTitle: "Customer channels tersedia",
    channelsText: "Pilih di mana Kolkap AI staff akan membalas.",
    ready: "Ready",
    later: "Later",
    websiteChat: "Website Chat",
    whatsapp: "WhatsApp",
    email: "Email",
    websiteDescription:
      "Biarkan visitor mengirim pesan dari website dan menerima balasan dengan bantuan AI.",
    whatsappDescription:
      "Biarkan customer mengirim pesan WhatsApp dan menerima balasan dengan bantuan AI.",
    emailDescription:
      "Email support akan ditambahkan nanti untuk summary, draft balasan, dan follow-up.",
    manageWebsite: "Kelola Website Chat",
    manageWhatsapp: "Kelola WhatsApp",
    comingLater: "Segera Hadir",
    messageFlow: "Cara Kerja Kolkap",
    messageFlowTitle: "Kolkap adalah bridge antara bisnis Anda dan customer.",
    messageFlowText:
      "Saat customer mengirim pesan, Kolkap menerima pesan, mencocokkan ke bisnis Anda, menggunakan AI staff yang ditugaskan, membalas, dan mencatat aktivitasnya.",
    flowItems: [
      {
        title: "Customer mengirim pesan",
        text: "Dari website chat, WhatsApp, atau channel lain nanti.",
      },
      {
        title: "Kolkap menerimanya",
        text: "Kolkap mengenali workspace bisnis yang benar.",
      },
      {
        title: "AI staff membalas",
        text: "Balasan dibuat berdasarkan AI staff dan Knowledge Base Anda.",
      },
      {
        title: "Inbox dan leads update",
        text: "Percakapan, lead activity, dan usage dicatat.",
      },
    ],
    userControls: "Yang Anda Kontrol",
    userControlsTitle: "Kontrol bisnis yang sederhana.",
    userControlsText:
      "Business owner tidak perlu mengurus webhook atau routing. User hanya mengontrol sisi bisnis.",
    userControlsList: [
      "Pilih AI staff yang membalas",
      "Test pesan sebelum go live",
      "Aktifkan channel",
      "Pause AI reply kapan saja",
      "Review percakapan di Inbox",
    ],
    kolkapHandles: "Yang Kolkap Tangani",
    kolkapHandlesTitle: "Kolkap menangani backend.",
    kolkapHandlesText:
      "Pekerjaan teknis tetap di dalam Kolkap agar business owner fokus ke customer.",
    kolkapHandlesList: [
      "Menerima pesan customer",
      "Mencocokkan pesan ke bisnis yang benar",
      "Menggunakan AI staff yang ditugaskan",
      "Membaca business Knowledge Base",
      "Mencatat percakapan, leads, dan penggunaan kredit",
    ],
    finalNote: "Siap Go Live",
    finalNoteTitle: "AI staff sebaiknya bekerja setelah setup dan testing.",
    finalNoteText:
      "Sebelum go live, pastikan AI staff sudah dibuat, business knowledge sudah ditambahkan, test reply sudah bagus, plan atau trial aktif, dan kredit tersedia.",
  },

  zh: {
    nav: {
      dashboard: "Dashboard",
      aiStaff: "AI Staff",
      knowledge: "Knowledge",
      inbox: "Inbox",
      leads: "Leads",
      content: "Content",
      billing: "Billing",
      settings: "Settings",
    },
    loading: "正在加载 customer channels...",
    failed: "Customer Channels 页面无法加载。",
    back: "返回 Dashboard",
    badge: "Customer Channels",
    title: "选择您的 AI staff 应该在哪些地方回复客户。",
    subtitle:
      "为 website chat 或 WhatsApp 启用 Kolkap。Kolkap 接收客户消息，使用您的 AI staff 和 business knowledge，然后协助回复并记录对话。",
    workspace: "Workspace",
    workspaceFallback: "您的业务",
    startSetup: "选择 Channel",
    goLive: "Go Live",
    setupFlow: "简单流程",
    setupTitle: "创建、测试，然后 go live。",
    setupText:
      "Kolkap 在后台处理技术连接。您只需要选择 AI staff 在哪里工作。",
    setupSteps: [
      {
        title: "创建 AI staff",
        text: "设置 AI 的角色、语气、语言和目的。",
      },
      {
        title: "添加 business knowledge",
        text: "添加 FAQ、服务、价格、policy 和 approved answers。",
      },
      {
        title: "测试回复",
        text: "发送示例问题，并在客户看到前优化答案。",
      },
      {
        title: "选择 channel",
        text: "选择 website chat 或 WhatsApp 作为客户 channel。",
      },
      {
        title: "Go live 或 pause",
        text: "准备好后启用 AI replies。需要时可随时 pause。",
      },
    ],
    channels: "Channels",
    channelsTitle: "可用 customer channels",
    channelsText: "选择 Kolkap AI staff 应该在哪里回复。",
    ready: "Ready",
    later: "Later",
    websiteChat: "Website Chat",
    whatsapp: "WhatsApp",
    email: "Email",
    websiteDescription:
      "让访客从 website 发送消息，并收到 AI-assisted replies。",
    whatsappDescription:
      "让客户通过 WhatsApp 联系业务，并收到 AI-assisted replies。",
    emailDescription:
      "Email support 稍后加入，用于 summaries、reply drafts 和 follow-ups。",
    manageWebsite: "管理 Website Chat",
    manageWhatsapp: "管理 WhatsApp",
    comingLater: "稍后推出",
    messageFlow: "Kolkap 如何运作",
    messageFlowTitle: "Kolkap 是您的业务和客户之间的桥梁。",
    messageFlowText:
      "客户发送消息后，Kolkap 接收消息、匹配业务、使用指定 AI staff、回复并记录活动。",
    flowItems: [
      {
        title: "客户发送消息",
        text: "来自 website chat、WhatsApp 或未来支持的 channel。",
      },
      {
        title: "Kolkap 接收消息",
        text: "Kolkap 识别正确的 business workspace。",
      },
      {
        title: "AI staff 回复",
        text: "回复基于您的 AI staff 和 Knowledge Base。",
      },
      {
        title: "Inbox 和 leads 更新",
        text: "对话、lead activity 和 usage 会被记录。",
      },
    ],
    userControls: "您控制的内容",
    userControlsTitle: "简单的业务控制。",
    userControlsText:
      "Business owner 不需要管理 webhook 或 routing。用户只控制业务侧。",
    userControlsList: [
      "选择负责回复的 AI staff",
      "Go live 前测试消息",
      "启用 channel",
      "随时 pause AI replies",
      "在 Inbox 查看对话",
    ],
    kolkapHandles: "Kolkap 处理的内容",
    kolkapHandlesTitle: "Kolkap 处理 backend。",
    kolkapHandlesText:
      "技术工作由 Kolkap 在后台处理，让 business owner 专注客户。",
    kolkapHandlesList: [
      "接收客户消息",
      "匹配到正确业务",
      "使用指定 AI staff",
      "读取 business Knowledge Base",
      "记录对话、leads 和 credit usage",
    ],
    finalNote: "Ready to Go Live",
    finalNoteTitle: "AI staff 应在 setup 和 testing 后才工作。",
    finalNoteText:
      "Go live 前，请确认 AI staff 已创建、business knowledge 已添加、test replies 良好、plan 或 trial 有效，并且 credits 可用。",
  },

  ms: {
    nav: {
      dashboard: "Dashboard",
      aiStaff: "AI Staff",
      knowledge: "Knowledge",
      inbox: "Inbox",
      leads: "Leads",
      content: "Content",
      billing: "Billing",
      settings: "Settings",
    },
    loading: "Memuatkan customer channels...",
    failed: "Halaman Customer Channels tidak dapat dimuatkan.",
    back: "Kembali ke Dashboard",
    badge: "Customer Channels",
    title: "Pilih di mana AI staff anda patut menjawab pelanggan.",
    subtitle:
      "Aktifkan Kolkap untuk website chat atau WhatsApp. Kolkap menerima mesej pelanggan, menggunakan AI staff dan business knowledge anda, lalu membantu membalas dan mencatat perbualan.",
    workspace: "Workspace",
    workspaceFallback: "Bisnes anda",
    startSetup: "Pilih Channel",
    goLive: "Go Live",
    setupFlow: "Alur Mudah",
    setupTitle: "Cipta, test, kemudian go live.",
    setupText:
      "Kolkap mengurus sambungan teknikal di background. Anda hanya pilih di mana AI staff perlu bekerja.",
    setupSteps: [
      {
        title: "Cipta AI staff",
        text: "Tetapkan role, tone, bahasa, dan tujuan AI.",
      },
      {
        title: "Tambah business knowledge",
        text: "Tambah FAQ, servis, harga, policy, dan jawapan yang diluluskan.",
      },
      {
        title: "Test balasan",
        text: "Hantar contoh soalan dan baiki jawapan sebelum pelanggan melihatnya.",
      },
      {
        title: "Pilih channel",
        text: "Pilih website chat atau WhatsApp sebagai customer channel.",
      },
      {
        title: "Go live atau pause",
        text: "Aktifkan AI replies apabila sudah siap. Pause bila-bila masa jika perlu.",
      },
    ],
    channels: "Channels",
    channelsTitle: "Customer channels tersedia",
    channelsText: "Pilih di mana Kolkap AI staff akan membalas.",
    ready: "Ready",
    later: "Later",
    websiteChat: "Website Chat",
    whatsapp: "WhatsApp",
    email: "Email",
    websiteDescription:
      "Biarkan visitor menghantar mesej dari website dan menerima AI-assisted replies.",
    whatsappDescription:
      "Biarkan pelanggan mesej bisnes anda di WhatsApp dan menerima AI-assisted replies.",
    emailDescription:
      "Email support akan ditambah kemudian untuk summaries, reply drafts, dan follow-ups.",
    manageWebsite: "Urus Website Chat",
    manageWhatsapp: "Urus WhatsApp",
    comingLater: "Akan Datang",
    messageFlow: "Cara Kolkap Berfungsi",
    messageFlowTitle: "Kolkap ialah bridge antara bisnes anda dan pelanggan.",
    messageFlowText:
      "Apabila pelanggan menghantar mesej, Kolkap menerima mesej, padankan dengan bisnes anda, gunakan AI staff yang ditugaskan, membalas, dan mencatat aktiviti.",
    flowItems: [
      {
        title: "Pelanggan hantar mesej",
        text: "Dari website chat, WhatsApp, atau channel lain nanti.",
      },
      {
        title: "Kolkap menerimanya",
        text: "Kolkap mengenali business workspace yang betul.",
      },
      {
        title: "AI staff membalas",
        text: "Balasan berdasarkan AI staff dan Knowledge Base anda.",
      },
      {
        title: "Inbox dan leads update",
        text: "Perbualan, lead activity, dan usage dicatat.",
      },
    ],
    userControls: "Apa Yang Anda Kawal",
    userControlsTitle: "Kawalan bisnes yang mudah.",
    userControlsText:
      "Business owner tidak perlu mengurus webhook atau routing. User hanya mengawal bahagian bisnes.",
    userControlsList: [
      "Pilih AI staff yang membalas",
      "Test mesej sebelum go live",
      "Aktifkan channel",
      "Pause AI replies bila-bila masa",
      "Review perbualan di Inbox",
    ],
    kolkapHandles: "Apa Yang Kolkap Urus",
    kolkapHandlesTitle: "Kolkap mengurus backend.",
    kolkapHandlesText:
      "Kerja teknikal kekal di dalam Kolkap supaya business owner fokus kepada pelanggan.",
    kolkapHandlesList: [
      "Menerima mesej pelanggan",
      "Memadankan mesej kepada bisnes yang betul",
      "Menggunakan AI staff yang ditugaskan",
      "Membaca business Knowledge Base",
      "Mencatat perbualan, leads, dan penggunaan kredit",
    ],
    finalNote: "Sedia untuk Go Live",
    finalNoteTitle: "AI staff patut bekerja hanya selepas setup dan testing.",
    finalNoteText:
      "Sebelum go live, pastikan AI staff sudah dibuat, business knowledge sudah ditambah, test replies sudah baik, plan atau trial aktif, dan kredit tersedia.",
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
}

function StatusPill({
  status,
  label,
}: {
  status: ChannelStatus;
  label: string;
}) {
  const className =
    status === "ready"
      ? "bg-[#7CFF3D] text-[#07111F]"
      : "bg-slate-200 text-slate-700";

  return (
    <span className={`rounded-full px-4 py-2 text-xs font-black ${className}`}>
      {label}
    </span>
  );
}

export default function IntegrationsPage() {
  const { language } = useKolkapLanguage();
  const t = translations[getSupportedLanguage(language)];

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;

  const navItems = [
    { label: t.nav.dashboard, href: "/dashboard" },
    { label: t.nav.aiStaff, href: "/dashboard/create-ai" },
    { label: t.nav.knowledge, href: "/dashboard/knowledge-base" },
    { label: t.nav.inbox, href: "/dashboard/inbox" },
    { label: t.nav.leads, href: "/dashboard/leads" },
    { label: t.nav.content, href: "/dashboard/content-studio" },
    { label: t.nav.billing, href: "/dashboard/billing" },
    { label: t.nav.settings, href: "/dashboard/settings" },
  ];

  const channels: ChannelCard[] = [
    {
      name: t.websiteChat,
      status: "ready",
      statusLabel: t.ready,
      description: t.websiteDescription,
      icon: MessageCircle,
      action: t.manageWebsite,
      href: "/dashboard/integrations/website-chat",
      highlighted: true,
    },
    {
      name: t.whatsapp,
      status: "ready",
      statusLabel: t.ready,
      description: t.whatsappDescription,
      icon: Smartphone,
      action: t.manageWhatsapp,
      href: "/dashboard/integrations/whatsapp",
      highlighted: true,
    },
    {
      name: t.email,
      status: "later",
      statusLabel: t.later,
      description: t.emailDescription,
      icon: Mail,
      action: t.comingLater,
    },
  ];

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
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <nav className="flex flex-wrap items-center justify-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <Link
              href="/dashboard"
              className="mb-7 inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>

            <div className="mb-7 flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              {t.badge}
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
              {t.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="#channels"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                <Globe2 className="h-6 w-6" />
                {t.startSetup}
              </a>

              <Link
                href="/dashboard/go-live"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Rocket className="h-6 w-6" />
                {t.goLive}
              </Link>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <WalletCards className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.workspace}
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {workspace?.business_name || t.workspaceFallback}
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
              {t.setupText}
            </p>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.setupFlow}
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              {t.setupTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              {t.setupText}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            {t.setupSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.7rem] border border-slate-200 bg-[#F7F9FA] p-5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                  {index + 1}
                </div>

                <h3 className="text-xl font-black tracking-[-0.03em]">
                  {step.title}
                </h3>

                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="channels">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.channels}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.channelsTitle}
              </h2>
            </div>

            <p className="max-w-lg text-lg font-semibold leading-8 text-slate-600">
              {t.channelsText}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {channels.map((channel) => {
              const Icon = channel.icon;

              const cardContent = (
                <>
                  <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                      channel.highlighted
                        ? "bg-white text-[#07111F]"
                        : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-3xl font-black tracking-[-0.04em]">
                      {channel.name}
                    </h3>

                    <StatusPill
                      status={channel.status}
                      label={channel.statusLabel}
                    />
                  </div>

                  <p
                    className={`mt-4 text-lg font-semibold leading-8 ${
                      channel.highlighted ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {channel.description}
                  </p>

                  <div
                    className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-base font-black ${
                      channel.highlighted
                        ? "bg-white text-[#07111F]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {channel.action}
                    {channel.href ? <ArrowRight className="h-5 w-5" /> : null}
                  </div>
                </>
              );

              const className = `rounded-[2rem] border p-6 shadow-sm shadow-slate-900/5 transition ${
                channel.highlighted
                  ? "border-[#07111F] bg-[#07111F] text-white hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                  : "cursor-not-allowed border-slate-200 bg-white text-[#07111F] opacity-85"
              }`;

              if (!channel.href) {
                return (
                  <div key={channel.name} className={className}>
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link key={channel.name} href={channel.href} className={className}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Sparkles className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {t.messageFlow}
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
              {t.messageFlowTitle}
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
              {t.messageFlowText}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {t.flowItems.map((item, index) => (
              <div
                key={item.title}
                className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                  {index + 1}
                </div>

                <h3 className="text-xl font-black tracking-[-0.03em]">
                  {item.title}
                </h3>

                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <UsersRound className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.userControls}
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {t.userControlsTitle}
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
              {t.userControlsText}
            </p>

            <div className="mt-6 space-y-4">
              {t.userControlsList.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Bot className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.kolkapHandles}
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {t.kolkapHandlesTitle}
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
              {t.kolkapHandlesText}
            </p>

            <div className="mt-6 space-y-4">
              {t.kolkapHandlesList.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.finalNote}
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                {t.finalNoteTitle}
              </h2>

              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                {t.finalNoteText}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/test-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
              >
                {t.nav.aiStaff}
                <Bot className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/go-live"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F]"
              >
                {t.goLive}
                <CirclePause className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}