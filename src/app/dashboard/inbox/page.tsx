"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Headphones,
  Inbox,
  MessageCircle,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  demoWorkspacePlanStatus,
  getAIStaffLimitLabel,
  getKolkapPlan,
} from "@/lib/kolkapPlan";

const translations = {
  en: {
    badge: "Inbox",
    title: "Manage customer conversations, leads, and handover.",
    subtitle:
      "Filter conversations by AI staff, channel, and status. Use pagination for many customer conversations, and load earlier messages inside long chat threads.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    credits: "AI Credits",
    aiStaff: "AI Staff",
    conversations: "Conversations",
    search: "Search conversations...",
    statusLabel: "Status",
    aiLabel: "AI",
    channelLabel: "Channel",
    allStatus: "All Status",
    allAI: "All AI Staff",
    allChannels: "All Channels",
    showing: "Showing 1–20 of 128 conversations",
    previous: "Previous",
    next: "Next",
    loadEarlier: "Load Earlier Messages",
    handledBy: "Handled by",
    customerProfile: "Customer Profile",
    leadDetails: "Lead Details",
    aiSummary: "AI Summary",
    handoverStatus: "Handover Status",
    takeOver: "Take Over",
    keepAI: "Keep AI Active",
    sendReply: "Send Reply",
    typeReply: "Type a reply as business owner...",
    topUp: "Top Up",
    statuses: ["All Status", "New Lead", "AI Active", "Needs Handover", "Closed"],
    channels: ["All Channels", "WhatsApp", "Website Chat", "Email"],
    aiFilters: [
      "All AI Staff",
      "AI Receptionist",
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
    ],
    stats: [
      ["New conversations", "12"],
      ["Leads captured", "8"],
      ["Handover needed", "3"],
      ["AI replies today", "42"],
    ],
    conversationsList: [
      {
        name: "Sarah Lim",
        channel: "WhatsApp",
        status: "New Lead",
        aiStaff: "AI WhatsApp Responder",
        time: "2 min ago",
        preview: "Hi, can I book a spa appointment this weekend?",
        need: "Booking request",
        phone: "+ Country code and number",
        budget: "Not confirmed",
        timeline: "This weekend",
        summary:
          "Customer is asking about appointment availability and needs booking follow-up.",
      },
      {
        name: "Michael Tan",
        channel: "Website Chat",
        status: "AI Active",
        aiStaff: "AI Customer Support",
        time: "12 min ago",
        preview: "Do you have monthly fitness packages?",
        need: "Package inquiry",
        phone: "+ Country code and number",
        budget: "$50–$100/month",
        timeline: "This week",
        summary:
          "Customer is comparing packages and may convert if pricing is clear.",
      },
      {
        name: "Ayu Pratama",
        channel: "WhatsApp",
        status: "Needs Handover",
        aiStaff: "AI Sales Follow-up Assistant",
        time: "28 min ago",
        preview: "Can someone call me? I want to discuss details.",
        need: "Human follow-up",
        phone: "+ Country code and number",
        budget: "Ready to discuss",
        timeline: "Today",
        summary:
          "Customer asked for a human call. Team should take over this conversation.",
      },
    ],
    messages: [
      {
        sender: "customer",
        name: "Customer",
        text: "Hi, can I book a spa appointment this weekend?",
      },
      {
        sender: "ai",
        name: "Kolkap AI",
        text: "Hi! Yes, I can help. May I know your preferred day, time, and how many people will join?",
      },
      {
        sender: "customer",
        name: "Customer",
        text: "Saturday afternoon for 2 people.",
      },
      {
        sender: "ai",
        name: "Kolkap AI",
        text: "Thank you. I’ll note Saturday afternoon for 2 people. Would you like the team to confirm available slots with you?",
      },
    ],
  },

  zh: {
    badge: "收件箱",
    title: "管理客户对话、线索和人工接手。",
    subtitle:
      "按 AI 员工、渠道和状态筛选对话。客户对话很多时使用分页，单个聊天很长时加载更早消息。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    credits: "AI Credits",
    aiStaff: "AI 员工",
    conversations: "对话",
    search: "搜索对话...",
    statusLabel: "状态",
    aiLabel: "AI",
    channelLabel: "渠道",
    allStatus: "所有状态",
    allAI: "所有 AI 员工",
    allChannels: "所有渠道",
    showing: "显示第 1–20 个，共 128 个对话",
    previous: "上一页",
    next: "下一页",
    loadEarlier: "加载更早消息",
    handledBy: "处理 AI",
    customerProfile: "客户资料",
    leadDetails: "线索详情",
    aiSummary: "AI 摘要",
    handoverStatus: "接手状态",
    takeOver: "人工接手",
    keepAI: "保持 AI 运行",
    sendReply: "发送回复",
    typeReply: "以企业主身份输入回复...",
    topUp: "充值",
    statuses: ["所有状态", "新线索", "AI 运行中", "需要人工接手", "已关闭"],
    channels: ["所有渠道", "WhatsApp", "Website Chat", "Email"],
    aiFilters: [
      "所有 AI 员工",
      "AI 接待员",
      "AI WhatsApp 回复员",
      "AI 客户支持",
      "AI 销售跟进助手",
    ],
    stats: [
      ["新对话", "12"],
      ["已捕获线索", "8"],
      ["需要接手", "3"],
      ["今日 AI 回复", "42"],
    ],
    conversationsList: [
      {
        name: "Sarah Lim",
        channel: "WhatsApp",
        status: "新线索",
        aiStaff: "AI WhatsApp 回复员",
        time: "2 分钟前",
        preview: "你好，我可以预约这个周末的水疗吗？",
        need: "预约请求",
        phone: "+ 国家代码和号码",
        budget: "未确认",
        timeline: "这个周末",
        summary: "客户询问预约时间，需要团队跟进确认。",
      },
      {
        name: "Michael Tan",
        channel: "Website Chat",
        status: "AI 运行中",
        aiStaff: "AI 客户支持",
        time: "12 分钟前",
        preview: "你们有月度健身套餐吗？",
        need: "套餐咨询",
        phone: "+ 国家代码和号码",
        budget: "$50–$100/月",
        timeline: "本周",
        summary: "客户正在比较套餐，如果价格清楚可能会转化。",
      },
      {
        name: "Ayu Pratama",
        channel: "WhatsApp",
        status: "需要人工接手",
        aiStaff: "AI 销售跟进助手",
        time: "28 分钟前",
        preview: "可以请人打电话给我吗？我想讨论细节。",
        need: "人工跟进",
        phone: "+ 国家代码和号码",
        budget: "准备讨论",
        timeline: "今天",
        summary: "客户要求真人电话联系，团队应该接手此对话。",
      },
    ],
    messages: [
      {
        sender: "customer",
        name: "客户",
        text: "你好，我可以预约这个周末的水疗吗？",
      },
      {
        sender: "ai",
        name: "Kolkap AI",
        text: "您好！可以，我来帮您。请问您想预约哪一天、什么时间，以及几位客人？",
      },
      {
        sender: "customer",
        name: "客户",
        text: "星期六下午，2 个人。",
      },
      {
        sender: "ai",
        name: "Kolkap AI",
        text: "谢谢。我会记录星期六下午 2 位客人。您需要团队帮您确认可预约时间吗？",
      },
    ],
  },

  id: {
    badge: "Inbox",
    title: "Kelola percakapan pelanggan, leads, dan handover.",
    subtitle:
      "Filter percakapan berdasarkan AI staff, channel, dan status. Gunakan pagination untuk banyak percakapan pelanggan, dan load earlier messages untuk chat yang panjang.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    credits: "AI Credits",
    aiStaff: "AI Staff",
    conversations: "Percakapan",
    search: "Cari percakapan...",
    statusLabel: "Status",
    aiLabel: "AI",
    channelLabel: "Channel",
    allStatus: "Semua Status",
    allAI: "Semua AI Staff",
    allChannels: "Semua Channel",
    showing: "Menampilkan 1–20 dari 128 percakapan",
    previous: "Sebelumnya",
    next: "Berikutnya",
    loadEarlier: "Load Earlier Messages",
    handledBy: "Ditangani oleh",
    customerProfile: "Profil Pelanggan",
    leadDetails: "Detail Lead",
    aiSummary: "Ringkasan AI",
    handoverStatus: "Status Handover",
    takeOver: "Ambil Alih",
    keepAI: "Tetap AI Aktif",
    sendReply: "Kirim Balasan",
    typeReply: "Tulis balasan sebagai pemilik bisnis...",
    topUp: "Top Up",
    statuses: ["Semua Status", "Lead Baru", "AI Aktif", "Perlu Handover", "Closed"],
    channels: ["Semua Channel", "WhatsApp", "Website Chat", "Email"],
    aiFilters: [
      "Semua AI Staff",
      "AI Receptionist",
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
    ],
    stats: [
      ["Percakapan baru", "12"],
      ["Leads terkumpul", "8"],
      ["Perlu handover", "3"],
      ["Balasan AI hari ini", "42"],
    ],
    conversationsList: [
      {
        name: "Sarah Lim",
        channel: "WhatsApp",
        status: "Lead Baru",
        aiStaff: "AI WhatsApp Responder",
        time: "2 menit lalu",
        preview: "Hai, bisa booking spa untuk akhir pekan ini?",
        need: "Permintaan booking",
        phone: "+ Kode negara dan nomor",
        budget: "Belum dikonfirmasi",
        timeline: "Akhir pekan ini",
        summary:
          "Pelanggan bertanya tentang ketersediaan appointment dan perlu follow-up booking.",
      },
      {
        name: "Michael Tan",
        channel: "Website Chat",
        status: "AI Aktif",
        aiStaff: "AI Customer Support",
        time: "12 menit lalu",
        preview: "Apakah ada paket fitness bulanan?",
        need: "Pertanyaan paket",
        phone: "+ Kode negara dan nomor",
        budget: "$50–$100/bulan",
        timeline: "Minggu ini",
        summary:
          "Pelanggan sedang membandingkan paket dan bisa convert jika harga jelas.",
      },
      {
        name: "Ayu Pratama",
        channel: "WhatsApp",
        status: "Perlu Handover",
        aiStaff: "AI Sales Follow-up Assistant",
        time: "28 menit lalu",
        preview: "Bisa ada yang telepon saya? Saya ingin diskusi detail.",
        need: "Follow-up manusia",
        phone: "+ Kode negara dan nomor",
        budget: "Siap diskusi",
        timeline: "Hari ini",
        summary:
          "Pelanggan meminta telepon dari manusia. Tim sebaiknya mengambil alih percakapan ini.",
      },
    ],
    messages: [
      {
        sender: "customer",
        name: "Pelanggan",
        text: "Hai, bisa booking spa untuk akhir pekan ini?",
      },
      {
        sender: "ai",
        name: "Kolkap AI",
        text: "Hai! Bisa, saya bantu. Boleh tahu hari, jam, dan berapa orang yang ingin booking?",
      },
      {
        sender: "customer",
        name: "Pelanggan",
        text: "Sabtu sore untuk 2 orang.",
      },
      {
        sender: "ai",
        name: "Kolkap AI",
        text: "Terima kasih. Saya catat Sabtu sore untuk 2 orang. Apakah Anda ingin tim kami mengonfirmasi slot yang tersedia?",
      },
    ],
  },

  ms: {
    badge: "Inbox",
    title: "Urus perbualan pelanggan, leads, dan handover.",
    subtitle:
      "Filter perbualan berdasarkan AI staff, channel, dan status. Gunakan pagination untuk banyak perbualan pelanggan, dan load earlier messages untuk chat yang panjang.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    credits: "AI Credits",
    aiStaff: "AI Staff",
    conversations: "Perbualan",
    search: "Cari perbualan...",
    statusLabel: "Status",
    aiLabel: "AI",
    channelLabel: "Channel",
    allStatus: "Semua Status",
    allAI: "Semua AI Staff",
    allChannels: "Semua Channel",
    showing: "Memaparkan 1–20 daripada 128 perbualan",
    previous: "Sebelumnya",
    next: "Seterusnya",
    loadEarlier: "Load Earlier Messages",
    handledBy: "Dikendalikan oleh",
    customerProfile: "Profil Pelanggan",
    leadDetails: "Detail Lead",
    aiSummary: "Ringkasan AI",
    handoverStatus: "Status Handover",
    takeOver: "Ambil Alih",
    keepAI: "Kekalkan AI Aktif",
    sendReply: "Hantar Balasan",
    typeReply: "Tulis balasan sebagai pemilik bisnes...",
    topUp: "Top Up",
    statuses: ["Semua Status", "Lead Baru", "AI Aktif", "Perlu Handover", "Closed"],
    channels: ["Semua Channel", "WhatsApp", "Website Chat", "Email"],
    aiFilters: [
      "Semua AI Staff",
      "AI Receptionist",
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
    ],
    stats: [
      ["Perbualan baru", "12"],
      ["Leads terkumpul", "8"],
      ["Perlu handover", "3"],
      ["Balasan AI hari ini", "42"],
    ],
    conversationsList: [
      {
        name: "Sarah Lim",
        channel: "WhatsApp",
        status: "Lead Baru",
        aiStaff: "AI WhatsApp Responder",
        time: "2 minit lalu",
        preview: "Hai, boleh booking spa untuk hujung minggu ini?",
        need: "Permintaan booking",
        phone: "+ Kod negara dan nombor",
        budget: "Belum disahkan",
        timeline: "Hujung minggu ini",
        summary:
          "Pelanggan bertanya tentang ketersediaan appointment dan perlukan follow-up booking.",
      },
      {
        name: "Michael Tan",
        channel: "Website Chat",
        status: "AI Aktif",
        aiStaff: "AI Customer Support",
        time: "12 minit lalu",
        preview: "Ada pakej fitness bulanan?",
        need: "Pertanyaan pakej",
        phone: "+ Kod negara dan nombor",
        budget: "$50–$100/bulan",
        timeline: "Minggu ini",
        summary:
          "Pelanggan sedang membandingkan pakej dan boleh convert jika harga jelas.",
      },
      {
        name: "Ayu Pratama",
        channel: "WhatsApp",
        status: "Perlu Handover",
        aiStaff: "AI Sales Follow-up Assistant",
        time: "28 minit lalu",
        preview: "Boleh ada orang call saya? Saya nak bincang detail.",
        need: "Follow-up manusia",
        phone: "+ Kod negara dan nombor",
        budget: "Sedia berbincang",
        timeline: "Hari ini",
        summary:
          "Pelanggan meminta panggilan daripada manusia. Team patut mengambil alih perbualan ini.",
      },
    ],
    messages: [
      {
        sender: "customer",
        name: "Pelanggan",
        text: "Hai, boleh booking spa untuk hujung minggu ini?",
      },
      {
        sender: "ai",
        name: "Kolkap AI",
        text: "Hai! Boleh, saya bantu. Boleh tahu hari, masa, dan berapa orang yang ingin booking?",
      },
      {
        sender: "customer",
        name: "Pelanggan",
        text: "Sabtu petang untuk 2 orang.",
      },
      {
        sender: "ai",
        name: "Kolkap AI",
        text: "Terima kasih. Saya catat Sabtu petang untuk 2 orang. Adakah anda mahu team kami mengesahkan slot yang tersedia?",
      },
    ],
  },
};

const paginationPages: Array<number | "ellipsis"> = [1, 2, 3, "ellipsis", 7];

export default function InboxPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;
  const workspace = demoWorkspacePlanStatus;
  const currentPlan = getKolkapPlan(workspace.planKey);
  const aiStaffLimitLabel = getAIStaffLimitLabel(workspace);

  const [selectedConversation, setSelectedConversation] = useState(0);
  const [statusFilter, setStatusFilter] = useState(t.allStatus);
  const [aiFilter, setAiFilter] = useState(t.allAI);
  const [channelFilter, setChannelFilter] = useState(t.allChannels);
  const [currentPage, setCurrentPage] = useState(1);

  const activeConversation =
    t.conversationsList[selectedConversation] || t.conversationsList[0];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <Link
              href="/dashboard"
              className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>

            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              {t.badge}
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              {t.subtitle}
            </p>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.currentPlan}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {currentPlan.name}
              </h2>
              <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                {t.aiStaff}: {aiStaffLimitLabel} • {t.credits}:{" "}
                {workspace.creditsRemaining}
              </p>
            </div>

            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <WalletCards className="h-7 w-7" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.credits}
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                {workspace.creditsRemaining} / {workspace.creditsTotal}
              </h2>

              <Link
                href="/dashboard/top-up"
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-lg font-black text-white"
              >
                {t.topUp}
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.stats.map(([label, value]) => (
            <div
              key={label}
              className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
            >
              <p className="text-lg font-black text-slate-500">{label}</p>
              <p className="mt-2 text-4xl font-black tracking-[-0.06em]">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.15fr_0.85fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.conversations}
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
                  Inbox
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Inbox className="h-6 w-6" />
              </div>
            </div>

            <label className="mb-4 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                placeholder={t.search}
                className="w-full bg-transparent text-lg font-semibold outline-none"
              />
            </label>

            <div className="mb-5 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    <Filter className="h-4 w-4" />
                    {t.statusLabel}
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-base font-black outline-none"
                  >
                    {t.statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    <Bot className="h-4 w-4" />
                    {t.aiLabel}
                  </span>
                  <select
                    value={aiFilter}
                    onChange={(event) => setAiFilter(event.target.value)}
                    className="h-12 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-base font-black outline-none"
                  >
                    {t.aiFilters.map((ai) => (
                      <option key={ai}>{ai}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.channelLabel}
                </span>
                <select
                  value={channelFilter}
                  onChange={(event) => setChannelFilter(event.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-base font-black outline-none"
                >
                  {t.channels.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3">
              {t.conversationsList.map((conversation, index) => {
                const active = selectedConversation === index;

                return (
                  <button
                    key={`${conversation.name}-${conversation.time}`}
                    type="button"
                    onClick={() => setSelectedConversation(index)}
                    className={`rounded-3xl border p-5 text-left transition ${
                      active
                        ? "border-[#07111F] bg-[#07111F] text-white"
                        : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:border-blue-400 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xl font-black">
                          {conversation.name}
                        </p>
                        <p
                          className={`mt-1 text-sm font-black ${
                            active ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {conversation.channel} • {conversation.time}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-[#7CFF3D] px-3 py-1 text-xs font-black text-[#07111F]">
                        {conversation.status}
                      </span>
                    </div>

                    <p
                      className={`mt-3 text-sm font-black ${
                        active ? "text-[#7CFF3D]" : "text-blue-600"
                      }`}
                    >
                      {t.handledBy}: {conversation.aiStaff}
                    </p>

                    <p
                      className={`mt-4 line-clamp-2 text-base font-semibold leading-7 ${
                        active ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {conversation.preview}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-4">
              <p className="text-center text-base font-black text-slate-500">
                {t.showing}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:border-blue-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t.previous}
                </button>

               {paginationPages.map((page) => {
  if (page === "ellipsis") {
    return (
      <span
        key="ellipsis"
        className="rounded-full px-3 py-3 text-sm font-black text-slate-500"
      >
        ...
      </span>
    );
  }

  return (
    <button
      key={page}
      type="button"
      onClick={() => setCurrentPage(page)}
      className={`h-11 w-11 rounded-full text-sm font-black transition ${
        currentPage === page
          ? "bg-[#07111F] text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-400"
      }`}
    >
      {page}
    </button>
  );
})}

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(7, page + 1))}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:border-blue-400"
                >
                  {t.next}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <UserRound className="h-7 w-7" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-[-0.04em]">
                      {activeConversation.name}
                    </h2>
                    <p className="text-lg font-bold text-slate-500">
                      {activeConversation.channel} • {activeConversation.time}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full bg-[#7CFF3D] px-5 py-3 text-base font-black text-[#07111F]">
                  <CheckCircle2 className="h-5 w-5" />
                  {activeConversation.status}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.handledBy}
                </p>
                <p className="mt-1 text-lg font-black">
                  {activeConversation.aiStaff}
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <button className="mx-auto flex items-center justify-center rounded-full border border-slate-200 bg-[#F7F9FA] px-6 py-3 text-base font-black text-slate-600">
                <Clock3 className="mr-2 h-5 w-5" />
                {t.loadEarlier}
              </button>

              {t.messages.map((message, index) => {
                const isAI = message.sender === "ai";

                return (
                  <div
                    key={`${message.sender}-${index}`}
                    className={`flex ${isAI ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-3xl p-5 sm:max-w-[78%] ${
                        isAI
                          ? "border border-blue-400/30 bg-blue-50"
                          : "bg-[#F7F9FA]"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        {isAI ? (
                          <Bot className="h-5 w-5 text-blue-700" />
                        ) : (
                          <UserRound className="h-5 w-5 text-slate-500" />
                        )}
                        <p
                          className={`text-base font-black ${
                            isAI ? "text-blue-700" : "text-[#07111F]"
                          }`}
                        >
                          {message.name}
                        </p>
                      </div>

                      <p className="text-lg font-semibold leading-8 text-slate-700">
                        {message.text}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                <textarea
                  rows={4}
                  placeholder={t.typeReply}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500"
                />

                <button className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white">
                  <Send className="h-6 w-6" />
                  {t.sendReply}
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-6">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Users className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.customerProfile}
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                {activeConversation.name}
              </h2>

              <div className="mt-5 grid gap-3">
                {[
                  [t.leadDetails, activeConversation.need],
                  ["Phone", activeConversation.phone],
                  ["Budget", activeConversation.budget],
                  ["Timeline", activeConversation.timeline],
                  [t.handledBy, activeConversation.aiStaff],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4"
                  >
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.aiSummary}
              </p>

              <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
                {activeConversation.summary}
              </p>
            </div>

            <div className="rounded-[2.2rem] border border-orange-200 bg-orange-50 p-6 shadow-sm shadow-orange-900/5">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 text-white">
                <Headphones className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-orange-600">
                {t.handoverStatus}
              </p>

              <p className="mt-4 text-xl font-semibold leading-9 text-orange-800">
                {activeConversation.status}
              </p>

              <div className="mt-6 grid gap-3">
                <button className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-orange-600 px-7 py-4 text-lg font-black text-white">
                  <Phone className="h-5 w-5" />
                  {t.takeOver}
                </button>

                <button className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-lg font-black text-[#07111F]">
                  <Clock3 className="h-5 w-5" />
                  {t.keepAI}
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}