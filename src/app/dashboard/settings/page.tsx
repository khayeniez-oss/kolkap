"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  Clock3,
  Globe2,
  Headphones,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  demoWorkspacePlanStatus,
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
} from "@/lib/kolkapPlan";

const translations = {
  en: {
    badge: "Settings",
    title: "Manage your business workspace settings.",
    subtitle:
      "Keep your business profile, AI preferences, WhatsApp setup, handover rules, and notifications organized in one place.",
    back: "Back to Dashboard",
    saveChanges: "Save Changes",
    currentPlan: "Current Plan",
    credits: "Credits",
    aiStaffLimit: "AI Staff Limit",
    whatsappStatus: "WhatsApp Status",
    businessProfile: "Business Profile",
    businessProfileText:
      "This information helps Kolkap understand your business and reply correctly.",
    businessName: "Business name",
    businessNamePlaceholder: "Example: Bali Wellness Spa",
    businessType: "Business type",
    businessEmail: "Business email",
    businessPhone: "Business phone",
    whatsappNumber: "Business WhatsApp number",
    address: "Business address",
    country: "Country",
    timezone: "Timezone",
    aiPreferences: "AI Preferences",
    aiPreferencesText:
      "Set the default language, tone, and behavior for your AI staff.",
    replyLanguage: "Default reply language",
    replyTone: "Default reply tone",
    handoverRule: "Human handover rule",
    aiInstruction: "Default AI instruction",
    aiInstructionPlaceholder:
      "Example: Reply clearly, collect customer details, and ask the team to take over when the customer requests human support.",
    whatsappHandover: "WhatsApp & Handover",
    whatsappHandoverText:
      "Control how customer messages are handled before and after AI goes live.",
    handoverStatus: "Handover Status",
    autoReply: "AI auto-reply",
    humanHandover: "Human handover",
    leadCapture: "Lead capture",
    notifications: "Notifications",
    notificationsText:
      "Choose when the business owner or team should be notified.",
    notifyNewLead: "Notify me for new leads",
    notifyHandover: "Notify me when handover is needed",
    notifyLowCredits: "Notify me when credits are low",
    notifyDailySummary: "Send daily inbox summary",
    accountSecurity: "Account & Security",
    accountSecurityText:
      "Manage profile details and account access for the workspace owner.",
    ownerName: "Owner name",
    ownerEmail: "Owner email",
    password: "Password",
    changePassword: "Change Password",
    statusLabels: {
      not_connected: "Not connected",
      connected: "Connected",
      pending: "Pending",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      trial: "Trial",
      active: "Active",
      past_due: "Past Due",
      cancelled: "Cancelled",
    },
    businessTypes: [
      "Real Estate",
      "Hotel / Villa / Accommodation",
      "Travel / Tourism",
      "Restaurant / Cafe",
      "Online Shop / E-commerce",
      "Clinic / Medical",
      "Dental Clinic",
      "Beauty / Aesthetic Clinic",
      "Fitness / Gym",
      "Wellness / Spa",
      "Salon / Barber",
      "Education / Training Center",
      "Agency / Marketing",
      "Legal / Accounting",
      "Construction / Interior Design",
      "Automotive",
      "Cleaning / Maintenance",
      "Events / Wedding",
      "Retail Store",
      "Professional Services",
      "Other",
    ],
    tones: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    handoverRules: [
      "When customer asks for a human",
      "When AI is not confident",
      "When customer is ready to buy",
      "When customer asks for price negotiation",
      "Always offer human support",
    ],
  },

  id: {
    badge: "Settings",
    title: "Kelola pengaturan workspace bisnis Anda.",
    subtitle:
      "Atur profil bisnis, preferensi AI, setup WhatsApp, aturan handover, dan notifikasi dalam satu tempat.",
    back: "Kembali ke Dashboard",
    saveChanges: "Simpan Perubahan",
    currentPlan: "Paket Saat Ini",
    credits: "Credits",
    aiStaffLimit: "Limit AI Staff",
    whatsappStatus: "Status WhatsApp",
    businessProfile: "Profil Bisnis",
    businessProfileText:
      "Informasi ini membantu Kolkap memahami bisnis Anda dan membalas dengan benar.",
    businessName: "Nama bisnis",
    businessNamePlaceholder: "Contoh: Bali Wellness Spa",
    businessType: "Jenis bisnis",
    businessEmail: "Email bisnis",
    businessPhone: "Telepon bisnis",
    whatsappNumber: "Nomor WhatsApp bisnis",
    address: "Alamat bisnis",
    country: "Negara",
    timezone: "Zona waktu",
    aiPreferences: "Preferensi AI",
    aiPreferencesText:
      "Atur bahasa, gaya balasan, dan perilaku default untuk AI staff Anda.",
    replyLanguage: "Bahasa balasan default",
    replyTone: "Gaya balasan default",
    handoverRule: "Aturan human handover",
    aiInstruction: "Instruksi AI default",
    aiInstructionPlaceholder:
      "Contoh: Balas dengan jelas, kumpulkan detail pelanggan, dan minta tim mengambil alih saat pelanggan meminta bantuan manusia.",
    whatsappHandover: "WhatsApp & Handover",
    whatsappHandoverText:
      "Atur bagaimana pesan pelanggan ditangani sebelum dan setelah AI aktif.",
    handoverStatus: "Status Handover",
    autoReply: "AI auto-reply",
    humanHandover: "Human handover",
    leadCapture: "Lead capture",
    notifications: "Notifikasi",
    notificationsText:
      "Pilih kapan pemilik bisnis atau tim harus menerima notifikasi.",
    notifyNewLead: "Notifikasi untuk leads baru",
    notifyHandover: "Notifikasi saat handover dibutuhkan",
    notifyLowCredits: "Notifikasi saat credits rendah",
    notifyDailySummary: "Kirim ringkasan inbox harian",
    accountSecurity: "Akun & Keamanan",
    accountSecurityText:
      "Kelola detail profil dan akses akun untuk pemilik workspace.",
    ownerName: "Nama owner",
    ownerEmail: "Email owner",
    password: "Password",
    changePassword: "Ubah Password",
    statusLabels: {
      not_connected: "Belum terhubung",
      connected: "Terhubung",
      pending: "Menunggu",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
    businessTypes: [
      "Real Estate",
      "Hotel / Villa / Akomodasi",
      "Travel / Pariwisata",
      "Restoran / Cafe",
      "Online Shop / E-commerce",
      "Klinik / Medis",
      "Klinik Gigi",
      "Beauty / Klinik Estetika",
      "Fitness / Gym",
      "Wellness / Spa",
      "Salon / Barber",
      "Pendidikan / Training Center",
      "Agency / Marketing",
      "Legal / Accounting",
      "Konstruksi / Interior Design",
      "Otomotif",
      "Cleaning / Maintenance",
      "Event / Wedding",
      "Retail Store",
      "Jasa Profesional",
      "Lainnya",
    ],
    tones: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    handoverRules: [
      "Saat pelanggan meminta manusia",
      "Saat AI tidak yakin",
      "Saat pelanggan siap membeli",
      "Saat pelanggan meminta negosiasi harga",
      "Selalu tawarkan bantuan manusia",
    ],
  },

  zh: {
    badge: "设置",
    title: "管理您的企业工作区设置。",
    subtitle:
      "在一个地方管理企业资料、AI 偏好、WhatsApp 设置、人工接手规则和通知。",
    back: "返回仪表板",
    saveChanges: "保存更改",
    currentPlan: "当前方案",
    credits: "Credits",
    aiStaffLimit: "AI 员工限制",
    whatsappStatus: "WhatsApp 状态",
    businessProfile: "企业资料",
    businessProfileText:
      "这些信息帮助 Kolkap 理解您的企业，并更准确地回复客户。",
    businessName: "企业名称",
    businessNamePlaceholder: "例如：Bali Wellness Spa",
    businessType: "企业类型",
    businessEmail: "企业邮箱",
    businessPhone: "企业电话",
    whatsappNumber: "企业 WhatsApp 号码",
    address: "企业地址",
    country: "国家",
    timezone: "时区",
    aiPreferences: "AI 偏好",
    aiPreferencesText: "设置 AI 员工的默认回复语言、语气和行为。",
    replyLanguage: "默认回复语言",
    replyTone: "默认回复语气",
    handoverRule: "人工接手规则",
    aiInstruction: "默认 AI 指令",
    aiInstructionPlaceholder:
      "例如：清楚回复，收集客户资料，当客户需要人工支持时请团队接手。",
    whatsappHandover: "WhatsApp 与人工接手",
    whatsappHandoverText:
      "控制 AI 上线前后客户消息的处理方式。",
    handoverStatus: "接手状态",
    autoReply: "AI 自动回复",
    humanHandover: "人工接手",
    leadCapture: "线索捕获",
    notifications: "通知",
    notificationsText: "选择企业主或团队应在什么时候收到通知。",
    notifyNewLead: "新线索通知",
    notifyHandover: "需要人工接手时通知",
    notifyLowCredits: "credits 较低时通知",
    notifyDailySummary: "发送每日收件箱摘要",
    accountSecurity: "账户与安全",
    accountSecurityText: "管理工作区拥有者的资料和账户访问。",
    ownerName: "Owner 名称",
    ownerEmail: "Owner 邮箱",
    password: "密码",
    changePassword: "更改密码",
    statusLabels: {
      not_connected: "未连接",
      connected: "已连接",
      pending: "待处理",
      draft: "草稿",
      testing: "测试中",
      live: "已上线",
      trial: "试用中",
      active: "有效",
      past_due: "逾期",
      cancelled: "已取消",
    },
    businessTypes: [
      "房地产",
      "酒店 / 别墅 / 住宿",
      "旅游 / 旅行",
      "餐厅 / 咖啡馆",
      "网店 / 电商",
      "诊所 / 医疗",
      "牙科诊所",
      "美容 / 医美诊所",
      "健身房",
      "养生 / 水疗",
      "美发 / 理发店",
      "教育 / 培训中心",
      "代理 / 营销",
      "法律 / 会计",
      "建筑 / 室内设计",
      "汽车服务",
      "清洁 / 维护",
      "活动 / 婚礼",
      "零售店",
      "专业服务",
      "其他",
    ],
    tones: [
      "友好专业",
      "温暖亲切",
      "正式",
      "直接",
      "销售型",
      "高端奢华",
      "支持型",
      "轻松自然",
    ],
    handoverRules: [
      "当客户要求人工支持",
      "当 AI 不确定时",
      "当客户准备购买时",
      "当客户要求价格协商时",
      "始终提供人工支持选项",
    ],
  },

  ms: {
    badge: "Settings",
    title: "Urus tetapan workspace bisnes anda.",
    subtitle:
      "Urus profil bisnes, pilihan AI, setup WhatsApp, aturan handover, dan notifikasi dalam satu tempat.",
    back: "Kembali ke Dashboard",
    saveChanges: "Simpan Perubahan",
    currentPlan: "Pakej Semasa",
    credits: "Credits",
    aiStaffLimit: "Limit AI Staff",
    whatsappStatus: "Status WhatsApp",
    businessProfile: "Profil Bisnes",
    businessProfileText:
      "Maklumat ini membantu Kolkap memahami bisnes anda dan membalas dengan betul.",
    businessName: "Nama bisnes",
    businessNamePlaceholder: "Contoh: Bali Wellness Spa",
    businessType: "Jenis bisnes",
    businessEmail: "Email bisnes",
    businessPhone: "Telefon bisnes",
    whatsappNumber: "Nombor WhatsApp bisnes",
    address: "Alamat bisnes",
    country: "Negara",
    timezone: "Zon masa",
    aiPreferences: "Pilihan AI",
    aiPreferencesText:
      "Tetapkan bahasa, gaya balasan, dan tingkah laku default untuk AI staff anda.",
    replyLanguage: "Bahasa balasan default",
    replyTone: "Gaya balasan default",
    handoverRule: "Aturan human handover",
    aiInstruction: "Arahan AI default",
    aiInstructionPlaceholder:
      "Contoh: Balas dengan jelas, kumpul detail pelanggan, dan minta team mengambil alih apabila pelanggan meminta bantuan manusia.",
    whatsappHandover: "WhatsApp & Handover",
    whatsappHandoverText:
      "Kawal bagaimana mesej pelanggan dikendalikan sebelum dan selepas AI aktif.",
    handoverStatus: "Status Handover",
    autoReply: "AI auto-reply",
    humanHandover: "Human handover",
    leadCapture: "Lead capture",
    notifications: "Notifikasi",
    notificationsText:
      "Pilih bila pemilik bisnes atau team perlu menerima notifikasi.",
    notifyNewLead: "Notifikasi untuk leads baru",
    notifyHandover: "Notifikasi apabila handover diperlukan",
    notifyLowCredits: "Notifikasi apabila credits rendah",
    notifyDailySummary: "Hantar ringkasan inbox harian",
    accountSecurity: "Akaun & Keselamatan",
    accountSecurityText:
      "Urus detail profil dan akses akaun untuk pemilik workspace.",
    ownerName: "Nama owner",
    ownerEmail: "Email owner",
    password: "Kata laluan",
    changePassword: "Tukar Kata Laluan",
    statusLabels: {
      not_connected: "Belum bersambung",
      connected: "Bersambung",
      pending: "Menunggu",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
      trial: "Trial",
      active: "Aktif",
      past_due: "Tertunda",
      cancelled: "Dibatalkan",
    },
    businessTypes: [
      "Real Estate",
      "Hotel / Villa / Penginapan",
      "Travel / Pelancongan",
      "Restoran / Cafe",
      "Online Shop / E-commerce",
      "Klinik / Perubatan",
      "Klinik Gigi",
      "Beauty / Klinik Estetik",
      "Fitness / Gym",
      "Wellness / Spa",
      "Salon / Barber",
      "Pendidikan / Pusat Latihan",
      "Agency / Marketing",
      "Legal / Accounting",
      "Pembinaan / Interior Design",
      "Automotif",
      "Cleaning / Maintenance",
      "Event / Wedding",
      "Kedai Runcit / Retail",
      "Servis Profesional",
      "Lain-lain",
    ],
    tones: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    handoverRules: [
      "Apabila pelanggan meminta manusia",
      "Apabila AI tidak yakin",
      "Apabila pelanggan sedia membeli",
      "Apabila pelanggan meminta rundingan harga",
      "Sentiasa tawarkan sokongan manusia",
    ],
  },
};

const languageOptions = [
  "Auto-detect",
  "English",
  "中文",
  "Bahasa Indonesia",
  "Malay",
];

export default function SettingsPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspace = demoWorkspacePlanStatus;
  const currentPlan = getKolkapPlan(workspace.planKey);

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      icon: WalletCards,
    },
    {
      label: t.credits,
      value: `${workspace.creditsRemaining}/${workspace.creditsTotal}`,
      icon: Bot,
    },
    {
      label: t.aiStaffLimit,
      value: getPlanAIStaffLabel(currentPlan),
      icon: UserRound,
    },
    {
      label: t.whatsappStatus,
      value: t.statusLabels[workspace.whatsappStatus],
      icon: MessageCircle,
    },
  ];

  const toggles = [
    t.autoReply,
    t.humanHandover,
    t.leadCapture,
    t.notifyNewLead,
    t.notifyHandover,
    t.notifyLowCredits,
    t.notifyDailySummary,
  ];

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

        <div className="grid gap-8">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Building2 className="h-8 w-8" />
                </div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.businessProfile}
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  {t.businessProfileText}
                </h2>
              </div>

              <div className="grid gap-5">
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.businessName}
                  </span>
                  <input
                    type="text"
                    defaultValue="Demo Business"
                    placeholder={t.businessNamePlaceholder}
                    className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.businessType}
                  </span>
                  <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                    {t.businessTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="flex items-center gap-2 text-base font-black text-slate-700">
                      <Mail className="h-5 w-5 text-slate-400" />
                      {t.businessEmail}
                    </span>
                    <input
                      type="email"
                      defaultValue="hello@business.com"
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="flex items-center gap-2 text-base font-black text-slate-700">
                      <Phone className="h-5 w-5 text-slate-400" />
                      {t.businessPhone}
                    </span>
                    <input
                      type="tel"
                      placeholder="Country code + phone number"
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-base font-black text-slate-700">
                    <MessageCircle className="h-5 w-5 text-slate-400" />
                    {t.whatsappNumber}
                  </span>
                  <input
                    type="tel"
                    placeholder="Country code + WhatsApp number"
                    className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-base font-black text-slate-700">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    {t.address}
                  </span>
                  <textarea
                    rows={4}
                    placeholder="Street, city, state, country"
                    className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="flex items-center gap-2 text-base font-black text-slate-700">
                      <Globe2 className="h-5 w-5 text-slate-400" />
                      {t.country}
                    </span>
                    <input
                      type="text"
                      placeholder="Country"
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="flex items-center gap-2 text-base font-black text-slate-700">
                      <Clock3 className="h-5 w-5 text-slate-400" />
                      {t.timezone}
                    </span>
                    <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                      <option>Asia/Makassar</option>
                      <option>Asia/Jakarta</option>
                      <option>Australia/Sydney</option>
                      <option>Asia/Kuala_Lumpur</option>
                      <option>Asia/Singapore</option>
                      <option>UTC</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Bot className="h-8 w-8" />
                </div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.aiPreferences}
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  {t.aiPreferencesText}
                </h2>
              </div>

              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.replyLanguage}
                    </span>
                    <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                      {languageOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.replyTone}
                    </span>
                    <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                      {t.tones.map((tone) => (
                        <option key={tone}>{tone}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.handoverRule}
                  </span>
                  <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                    {t.handoverRules.map((rule) => (
                      <option key={rule}>{rule}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.aiInstruction}
                  </span>
                  <textarea
                    rows={6}
                    placeholder={t.aiInstructionPlaceholder}
                    className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Headphones className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.whatsappHandover}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                {t.whatsappHandoverText}
              </h2>

              <div className="mt-7 grid gap-4">
                <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    {t.whatsappStatus}
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {t.statusLabels[workspace.whatsappStatus]}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    {t.handoverStatus}
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {t.statusLabels[workspace.goLiveStatus]}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Bell className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.notifications}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                {t.notificationsText}
              </h2>

              <div className="mt-7 grid gap-3">
                {toggles.map((label, index) => (
                  <label
                    key={`${label}-${index}`}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <span className="text-lg font-black">{label}</span>
                    <input
                      type="checkbox"
                      defaultChecked={index < 5}
                      className="h-6 w-6"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <LockKeyhole className="h-8 w-8" />
                </div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.accountSecurity}
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  {t.accountSecurityText}
                </h2>
              </div>

              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.ownerName}
                    </span>
                    <input
                      type="text"
                      defaultValue="Business Owner"
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.ownerEmail}
                    </span>
                    <input
                      type="email"
                      defaultValue="owner@business.com"
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    {t.password}
                  </p>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xl font-black">••••••••••••</p>
                    <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white">
                      <ShieldCheck className="h-5 w-5" />
                      {t.changePassword}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                  {t.badge}
                </p>

                <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                  {t.title}
                </h2>
              </div>

              <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5">
                <Save className="h-6 w-6" />
                {t.saveChanges}
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}