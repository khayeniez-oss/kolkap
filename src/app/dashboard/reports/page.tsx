"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  Headphones,
  Inbox,
  MessageCircle,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  demoWorkspacePlanStatus,
  getCreditUsagePercent,
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
} from "@/lib/kolkapPlan";

const translations = {
  en: {
    badge: "Reports",
    title: "Track AI replies, leads, credits, and business performance.",
    subtitle:
      "See how Kolkap is helping your business respond faster, capture leads, manage handovers, and use credits.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    credits: "Credits",
    aiStaffLimit: "AI Staff Limit",
    planAllowance: "Plan Allowance",
    filterReports: "Filter Reports",
    dateRange: "Date Range",
    aiStaff: "AI Staff",
    channel: "Channel",
    exportReport: "Export Report",
    overview: "Performance Overview",
    overviewText:
      "A simple summary of customer conversations, AI replies, leads, and handovers.",
    creditUsage: "Credit Usage",
    creditUsageText:
      "Monitor how many credits your AI staff are using across replies and content generation.",
    aiPerformance: "AI Staff Performance",
    aiPerformanceText:
      "See which AI staff are handling conversations and generating leads.",
    channelBreakdown: "Channel Breakdown",
    channelBreakdownText:
      "Understand where your conversations are coming from.",
    recentActivity: "Recent Activity",
    recentActivityText:
      "Latest customer conversation and AI activity from your workspace.",
    recommendations: "Recommendations",
    recommendationsText:
      "Suggested actions to improve reply quality, lead capture, and conversion.",
    used: "Used",
    remaining: "Remaining",
    reportsCards: [
      {
        label: "AI replies",
        value: "428",
        note: "+18% this week",
      },
      {
        label: "Leads captured",
        value: "96",
        note: "+12% this week",
      },
      {
        label: "Human handovers",
        value: "21",
        note: "Needs review",
      },
      {
        label: "Avg response time",
        value: "8 sec",
        note: "Fast",
      },
    ],
    ranges: ["Today", "7 days", "30 days", "90 days"],
    aiStaffOptions: [
      "All AI Staff",
      "AI Receptionist",
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
    ],
    channels: ["All Channels", "WhatsApp", "Website Chat", "Email"],
    aiRows: [
      {
        name: "AI WhatsApp Responder",
        replies: "248 replies",
        leads: "61 leads",
        handovers: "14 handovers",
        rating: "Strong",
      },
      {
        name: "AI Customer Support",
        replies: "112 replies",
        leads: "18 leads",
        handovers: "3 handovers",
        rating: "Good",
      },
      {
        name: "AI Sales Follow-up Assistant",
        replies: "68 replies",
        leads: "17 leads",
        handovers: "4 handovers",
        rating: "Review",
      },
    ],
    channelRows: [
      {
        name: "WhatsApp",
        conversations: "312 conversations",
        leads: "72 leads",
        percent: "73%",
      },
      {
        name: "Website Chat",
        conversations: "94 conversations",
        leads: "19 leads",
        percent: "22%",
      },
      {
        name: "Email",
        conversations: "22 conversations",
        leads: "5 leads",
        percent: "5%",
      },
    ],
    activityRows: [
      {
        title: "New WhatsApp lead captured",
        description: "Sarah Lim asked for appointment availability.",
        time: "2 min ago",
      },
      {
        title: "Human handover requested",
        description: "Ayu Pratama asked for a phone call.",
        time: "28 min ago",
      },
      {
        title: "AI reply generated",
        description: "AI Customer Support answered package pricing question.",
        time: "42 min ago",
      },
      {
        title: "Credits used",
        description: "5 credits used for campaign content generation.",
        time: "1 hour ago",
      },
    ],
    recommendationsList: [
      "Add more FAQs to improve AI confidence.",
      "Review handover conversations daily.",
      "Top up credits before running large campaigns.",
      "Use Salesy tone for follow-up AI when leads are warm.",
    ],
  },

  id: {
    badge: "Reports",
    title: "Pantau balasan AI, leads, credits, dan performa bisnis.",
    subtitle:
      "Lihat bagaimana Kolkap membantu bisnis Anda membalas lebih cepat, menangkap leads, mengelola handover, dan memakai credits.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    credits: "Credits",
    aiStaffLimit: "Limit AI Staff",
    planAllowance: "Allowance Paket",
    filterReports: "Filter Reports",
    dateRange: "Rentang Waktu",
    aiStaff: "AI Staff",
    channel: "Channel",
    exportReport: "Export Report",
    overview: "Ringkasan Performa",
    overviewText:
      "Ringkasan sederhana untuk percakapan pelanggan, balasan AI, leads, dan handover.",
    creditUsage: "Pemakaian Credits",
    creditUsageText:
      "Pantau berapa banyak credits yang digunakan AI staff untuk balasan dan pembuatan konten.",
    aiPerformance: "Performa AI Staff",
    aiPerformanceText:
      "Lihat AI staff mana yang menangani percakapan dan menghasilkan leads.",
    channelBreakdown: "Breakdown Channel",
    channelBreakdownText:
      "Pahami dari mana percakapan pelanggan berasal.",
    recentActivity: "Aktivitas Terbaru",
    recentActivityText:
      "Aktivitas terbaru dari percakapan pelanggan dan AI di workspace Anda.",
    recommendations: "Rekomendasi",
    recommendationsText:
      "Saran untuk meningkatkan kualitas balasan, lead capture, dan konversi.",
    used: "Terpakai",
    remaining: "Tersisa",
    reportsCards: [
      {
        label: "Balasan AI",
        value: "428",
        note: "+18% minggu ini",
      },
      {
        label: "Leads terkumpul",
        value: "96",
        note: "+12% minggu ini",
      },
      {
        label: "Human handover",
        value: "21",
        note: "Perlu review",
      },
      {
        label: "Rata-rata respon",
        value: "8 detik",
        note: "Cepat",
      },
    ],
    ranges: ["Hari ini", "7 hari", "30 hari", "90 hari"],
    aiStaffOptions: [
      "Semua AI Staff",
      "AI Receptionist",
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
    ],
    channels: ["Semua Channel", "WhatsApp", "Website Chat", "Email"],
    aiRows: [
      {
        name: "AI WhatsApp Responder",
        replies: "248 balasan",
        leads: "61 leads",
        handovers: "14 handover",
        rating: "Kuat",
      },
      {
        name: "AI Customer Support",
        replies: "112 balasan",
        leads: "18 leads",
        handovers: "3 handover",
        rating: "Bagus",
      },
      {
        name: "AI Sales Follow-up Assistant",
        replies: "68 balasan",
        leads: "17 leads",
        handovers: "4 handover",
        rating: "Review",
      },
    ],
    channelRows: [
      {
        name: "WhatsApp",
        conversations: "312 percakapan",
        leads: "72 leads",
        percent: "73%",
      },
      {
        name: "Website Chat",
        conversations: "94 percakapan",
        leads: "19 leads",
        percent: "22%",
      },
      {
        name: "Email",
        conversations: "22 percakapan",
        leads: "5 leads",
        percent: "5%",
      },
    ],
    activityRows: [
      {
        title: "Lead WhatsApp baru tertangkap",
        description: "Sarah Lim bertanya tentang ketersediaan appointment.",
        time: "2 menit lalu",
      },
      {
        title: "Human handover diminta",
        description: "Ayu Pratama meminta telepon.",
        time: "28 menit lalu",
      },
      {
        title: "Balasan AI dibuat",
        description: "AI Customer Support menjawab pertanyaan harga paket.",
        time: "42 menit lalu",
      },
      {
        title: "Credits digunakan",
        description: "5 credits digunakan untuk campaign content generation.",
        time: "1 jam lalu",
      },
    ],
    recommendationsList: [
      "Tambah lebih banyak FAQ agar AI lebih percaya diri.",
      "Review percakapan handover setiap hari.",
      "Top up credits sebelum menjalankan campaign besar.",
      "Gunakan tone Salesy untuk follow-up AI saat leads sudah warm.",
    ],
  },

  zh: {
    badge: "报告",
    title: "追踪 AI 回复、线索、credits 和业务表现。",
    subtitle:
      "查看 Kolkap 如何帮助企业更快回复、捕获线索、管理人工接手并使用 credits。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    credits: "Credits",
    aiStaffLimit: "AI 员工限制",
    planAllowance: "方案额度",
    filterReports: "筛选报告",
    dateRange: "日期范围",
    aiStaff: "AI 员工",
    channel: "渠道",
    exportReport: "导出报告",
    overview: "表现概览",
    overviewText:
      "客户对话、AI 回复、线索和人工接手的简单摘要。",
    creditUsage: "Credits 使用情况",
    creditUsageText:
      "监控 AI 员工在回复和内容生成中使用的 credits。",
    aiPerformance: "AI 员工表现",
    aiPerformanceText:
      "查看哪些 AI 员工正在处理对话并生成线索。",
    channelBreakdown: "渠道分析",
    channelBreakdownText:
      "了解客户对话来自哪里。",
    recentActivity: "最近活动",
    recentActivityText:
      "工作区中的最新客户对话和 AI 活动。",
    recommendations: "建议",
    recommendationsText:
      "提高回复质量、线索捕获和转化率的建议。",
    used: "已用",
    remaining: "剩余",
    reportsCards: [
      {
        label: "AI 回复",
        value: "428",
        note: "本周 +18%",
      },
      {
        label: "捕获线索",
        value: "96",
        note: "本周 +12%",
      },
      {
        label: "人工接手",
        value: "21",
        note: "需要检查",
      },
      {
        label: "平均响应时间",
        value: "8 秒",
        note: "快速",
      },
    ],
    ranges: ["今天", "7 天", "30 天", "90 天"],
    aiStaffOptions: [
      "所有 AI 员工",
      "AI 接待员",
      "AI WhatsApp 回复员",
      "AI 客户支持",
      "AI 销售跟进助手",
    ],
    channels: ["所有渠道", "WhatsApp", "Website Chat", "Email"],
    aiRows: [
      {
        name: "AI WhatsApp 回复员",
        replies: "248 回复",
        leads: "61 线索",
        handovers: "14 接手",
        rating: "强",
      },
      {
        name: "AI 客户支持",
        replies: "112 回复",
        leads: "18 线索",
        handovers: "3 接手",
        rating: "良好",
      },
      {
        name: "AI 销售跟进助手",
        replies: "68 回复",
        leads: "17 线索",
        handovers: "4 接手",
        rating: "检查",
      },
    ],
    channelRows: [
      {
        name: "WhatsApp",
        conversations: "312 对话",
        leads: "72 线索",
        percent: "73%",
      },
      {
        name: "Website Chat",
        conversations: "94 对话",
        leads: "19 线索",
        percent: "22%",
      },
      {
        name: "Email",
        conversations: "22 对话",
        leads: "5 线索",
        percent: "5%",
      },
    ],
    activityRows: [
      {
        title: "新的 WhatsApp 线索",
        description: "Sarah Lim 询问预约时间。",
        time: "2 分钟前",
      },
      {
        title: "请求人工接手",
        description: "Ayu Pratama 要求电话联系。",
        time: "28 分钟前",
      },
      {
        title: "AI 回复已生成",
        description: "AI 客户支持回答套餐价格问题。",
        time: "42 分钟前",
      },
      {
        title: "Credits 已使用",
        description: "5 credits 用于生成活动内容。",
        time: "1 小时前",
      },
    ],
    recommendationsList: [
      "添加更多 FAQ 以提高 AI 信心。",
      "每天检查人工接手对话。",
      "大型活动前先充值 credits。",
      "对于 warm leads，使用 Salesy 语气进行跟进。",
    ],
  },

  ms: {
    badge: "Reports",
    title: "Pantau balasan AI, leads, credits, dan prestasi bisnes.",
    subtitle:
      "Lihat bagaimana Kolkap membantu bisnes anda membalas lebih cepat, menangkap leads, mengurus handover, dan menggunakan credits.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    credits: "Credits",
    aiStaffLimit: "Limit AI Staff",
    planAllowance: "Allowance Pakej",
    filterReports: "Filter Reports",
    dateRange: "Julat Masa",
    aiStaff: "AI Staff",
    channel: "Channel",
    exportReport: "Export Report",
    overview: "Ringkasan Prestasi",
    overviewText:
      "Ringkasan mudah untuk perbualan pelanggan, balasan AI, leads, dan handover.",
    creditUsage: "Penggunaan Credits",
    creditUsageText:
      "Pantau berapa banyak credits digunakan AI staff untuk balasan dan penjanaan kandungan.",
    aiPerformance: "Prestasi AI Staff",
    aiPerformanceText:
      "Lihat AI staff mana yang mengendalikan perbualan dan menghasilkan leads.",
    channelBreakdown: "Breakdown Channel",
    channelBreakdownText:
      "Fahami dari mana perbualan pelanggan datang.",
    recentActivity: "Aktiviti Terbaru",
    recentActivityText:
      "Aktiviti terbaru daripada perbualan pelanggan dan AI di workspace anda.",
    recommendations: "Cadangan",
    recommendationsText:
      "Cadangan untuk meningkatkan kualiti balasan, lead capture, dan conversion.",
    used: "Digunakan",
    remaining: "Baki",
    reportsCards: [
      {
        label: "Balasan AI",
        value: "428",
        note: "+18% minggu ini",
      },
      {
        label: "Leads terkumpul",
        value: "96",
        note: "+12% minggu ini",
      },
      {
        label: "Human handover",
        value: "21",
        note: "Perlu review",
      },
      {
        label: "Purata respon",
        value: "8 saat",
        note: "Cepat",
      },
    ],
    ranges: ["Hari ini", "7 hari", "30 hari", "90 hari"],
    aiStaffOptions: [
      "Semua AI Staff",
      "AI Receptionist",
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
    ],
    channels: ["Semua Channel", "WhatsApp", "Website Chat", "Email"],
    aiRows: [
      {
        name: "AI WhatsApp Responder",
        replies: "248 balasan",
        leads: "61 leads",
        handovers: "14 handover",
        rating: "Kuat",
      },
      {
        name: "AI Customer Support",
        replies: "112 balasan",
        leads: "18 leads",
        handovers: "3 handover",
        rating: "Bagus",
      },
      {
        name: "AI Sales Follow-up Assistant",
        replies: "68 balasan",
        leads: "17 leads",
        handovers: "4 handover",
        rating: "Review",
      },
    ],
    channelRows: [
      {
        name: "WhatsApp",
        conversations: "312 perbualan",
        leads: "72 leads",
        percent: "73%",
      },
      {
        name: "Website Chat",
        conversations: "94 perbualan",
        leads: "19 leads",
        percent: "22%",
      },
      {
        name: "Email",
        conversations: "22 perbualan",
        leads: "5 leads",
        percent: "5%",
      },
    ],
    activityRows: [
      {
        title: "Lead WhatsApp baru ditangkap",
        description: "Sarah Lim bertanya tentang ketersediaan appointment.",
        time: "2 minit lalu",
      },
      {
        title: "Human handover diminta",
        description: "Ayu Pratama meminta panggilan telefon.",
        time: "28 minit lalu",
      },
      {
        title: "Balasan AI dibuat",
        description: "AI Customer Support menjawab soalan harga pakej.",
        time: "42 minit lalu",
      },
      {
        title: "Credits digunakan",
        description: "5 credits digunakan untuk campaign content generation.",
        time: "1 jam lalu",
      },
    ],
    recommendationsList: [
      "Tambah lebih banyak FAQ supaya AI lebih yakin.",
      "Review perbualan handover setiap hari.",
      "Top up credits sebelum menjalankan campaign besar.",
      "Gunakan tone Salesy untuk follow-up AI apabila leads sudah warm.",
    ],
  },
};

export default function ReportsPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspace = demoWorkspacePlanStatus;
  const currentPlan = getKolkapPlan(workspace.planKey);
  const creditUsagePercent = getCreditUsagePercent(workspace);

  const [dateRange, setDateRange] = useState(t.ranges[1] || t.ranges[0]);
  const [aiStaff, setAiStaff] = useState(t.aiStaffOptions[0]);
  const [channel, setChannel] = useState(t.channels[0]);

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      icon: WalletCards,
    },
    {
      label: t.credits,
      value: `${workspace.creditsRemaining}/${workspace.creditsTotal}`,
      icon: Zap,
    },
    {
      label: t.aiStaffLimit,
      value: getPlanAIStaffLabel(currentPlan),
      icon: Bot,
    },
    {
      label: t.planAllowance,
      value: getPlanCreditLabel(currentPlan),
      icon: ShieldCheck,
    },
  ];

  const overviewIcons = [MessageCircle, Users, Headphones, Clock3];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
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

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-lg font-black text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.filterReports}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.overviewText}
              </h2>
            </div>

            <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-lg font-black text-white">
              <Download className="h-5 w-5" />
              {t.exportReport}
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <Filter className="h-5 w-5 text-slate-400" />
                {t.dateRange}
              </span>
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              >
                {t.ranges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <Bot className="h-5 w-5 text-slate-400" />
                {t.aiStaff}
              </span>
              <select
                value={aiStaff}
                onChange={(event) => setAiStaff(event.target.value)}
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              >
                {t.aiStaffOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <Inbox className="h-5 w-5 text-slate-400" />
                {t.channel}
              </span>
              <select
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              >
                {t.channels.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="mb-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.overview}
            </p>
            <h2 className="mt-2 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.overviewText}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.reportsCards.map((card, index) => {
              const Icon = overviewIcons[index] || MessageCircle;

              return (
                <div
                  key={`${card.label}-${index}`}
                  className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="text-lg font-black text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.06em]">
                    {card.value}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-600">
                    {card.note}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <WalletCards className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.creditUsage}
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.creditUsageText}
            </h2>

            <div className="mt-7 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
              <div className="mb-3 flex items-center justify-between gap-4 text-base font-black text-slate-600">
                <span>{t.used}</span>
                <span>
                  {workspace.creditsUsed}/{workspace.creditsTotal}
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#7CFF3D]"
                  style={{ width: `${creditUsagePercent}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-sm font-black text-slate-500">
                <span>
                  {t.used}: {workspace.creditsUsed}
                </span>
                <span>
                  {t.remaining}: {workspace.creditsRemaining}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <BarChart3 className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.aiPerformance}
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.aiPerformanceText}
            </h2>

            <div className="mt-7 grid gap-3">
              {t.aiRows.map((row) => (
                <div
                  key={row.name}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xl font-black">{row.name}</p>
                      <p className="mt-1 text-base font-semibold text-slate-500">
                        {row.replies} • {row.leads} • {row.handovers}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]">
                      {row.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <PieChart className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.channelBreakdown}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              {t.channelBreakdownText}
            </h2>

            <div className="mt-7 grid gap-3">
              {t.channelRows.map((row) => (
                <div
                  key={row.name}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xl font-black">{row.name}</p>
                      <p className="mt-1 text-base font-semibold text-slate-500">
                        {row.conversations} • {row.leads}
                      </p>
                    </div>
                    <span className="text-2xl font-black">{row.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <TrendingUp className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.recommendations}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              {t.recommendationsText}
            </h2>

            <div className="mt-7 grid gap-3">
              {t.recommendationsList.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />
                  <p className="text-lg font-black leading-8">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.recentActivity}
            </p>
            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.recentActivityText}
            </h2>
          </div>

          <div className="grid gap-3">
            {t.activityRows.map((row) => (
              <div
                key={`${row.title}-${row.time}`}
                className="grid gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="text-xl font-black">{row.title}</p>
                  <p className="mt-1 text-base font-semibold leading-7 text-slate-600">
                    {row.description}
                  </p>
                </div>
                <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-600">
                  {row.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.badge}
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                {t.title}
              </h2>
            </div>

            <Link
              href="/dashboard/inbox"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              {t.recentActivity}
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}