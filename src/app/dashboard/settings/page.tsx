"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
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
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan, getPlanAIStaffLabel } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const translations = {
  en: {
    badge: "Settings",
    title: "Manage your business workspace settings.",
    subtitle:
      "Update your business profile, AI preferences, WhatsApp handling, notifications, and account details.",
    back: "Back to Dashboard",
    saveChanges: "Save Changes",
    saving: "Saving...",
    saved: "Settings saved successfully.",
    failed: "Settings could not be saved.",
    loading: "Loading your settings...",
    currentPlan: "Current Plan",
    credits: "Credits",
    aiStaffLimit: "AI Staff Limit",
    whatsappStatus: "WhatsApp Status",
    businessProfile: "Business Profile",
    businessProfileText: "This information helps Kolkap understand your business.",
    businessName: "Business name",
    businessType: "Business type",
    businessEmail: "Business email",
    businessPhone: "Business phone",
    whatsappNumber: "Business WhatsApp number",
    address: "Business address",
    country: "Country",
    timezone: "Timezone",
    aiPreferences: "AI Preferences",
    aiPreferencesText: "Set how your AI staff should reply to customers.",
    replyLanguage: "Default reply language",
    replyTone: "Default reply tone",
    handoverRule: "Human handover rule",
    aiInstruction: "Default AI instruction",
    whatsappHandover: "WhatsApp & Handover",
    whatsappHandoverText: "Choose how customer messages should be handled.",
    notifications: "Notifications",
    notificationsText: "Choose when you want to be notified.",
    accountSecurity: "Account & Security",
    accountSecurityText: "Basic owner account details.",
    ownerName: "Owner name",
    ownerEmail: "Owner email",
    password: "Password",
    changePassword: "Change Password",
    autoReply: "AI auto-reply",
    humanHandover: "Human handover",
    leadCapture: "Lead capture",
    notifyNewLead: "Notify me for new leads",
    notifyHandover: "Notify me when handover is needed",
    notifyLowCredits: "Notify me when credits are low",
    notifyDailySummary: "Send daily inbox summary",
    deleteAccount: "Delete Account",
    deleteAccountText:
      "Need to leave Kolkap? You can permanently delete your account and workspace data.",
    deleteAccountButton: "Delete account",
    statuses: {
      not_connected: "Not connected",
      connected: "Connected",
      pending: "Pending",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
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
    languages: ["Auto-detect", "English", "中文", "Bahasa Indonesia", "Malay"],
  },

  id: {
    badge: "Settings",
    title: "Kelola pengaturan workspace bisnis Anda.",
    subtitle:
      "Update profil bisnis, preferensi AI, cara handling WhatsApp, notifikasi, dan detail akun.",
    back: "Kembali ke Dashboard",
    saveChanges: "Simpan Perubahan",
    saving: "Menyimpan...",
    saved: "Settings berhasil disimpan.",
    failed: "Settings gagal disimpan.",
    loading: "Memuat settings Anda...",
    currentPlan: "Paket Saat Ini",
    credits: "Credits",
    aiStaffLimit: "Limit AI Staff",
    whatsappStatus: "Status WhatsApp",
    businessProfile: "Profil Bisnis",
    businessProfileText: "Informasi ini membantu Kolkap memahami bisnis Anda.",
    businessName: "Nama bisnis",
    businessType: "Jenis bisnis",
    businessEmail: "Email bisnis",
    businessPhone: "Telepon bisnis",
    whatsappNumber: "Nomor WhatsApp bisnis",
    address: "Alamat bisnis",
    country: "Negara",
    timezone: "Zona waktu",
    aiPreferences: "Preferensi AI",
    aiPreferencesText: "Atur bagaimana AI staff membalas pelanggan.",
    replyLanguage: "Bahasa balasan default",
    replyTone: "Gaya balasan default",
    handoverRule: "Aturan human handover",
    aiInstruction: "Instruksi AI default",
    whatsappHandover: "WhatsApp & Handover",
    whatsappHandoverText: "Pilih bagaimana pesan pelanggan ditangani.",
    notifications: "Notifikasi",
    notificationsText: "Pilih kapan Anda ingin menerima notifikasi.",
    accountSecurity: "Akun & Keamanan",
    accountSecurityText: "Detail dasar akun owner.",
    ownerName: "Nama owner",
    ownerEmail: "Email owner",
    password: "Password",
    changePassword: "Ubah Password",
    autoReply: "AI auto-reply",
    humanHandover: "Human handover",
    leadCapture: "Lead capture",
    notifyNewLead: "Notifikasi untuk leads baru",
    notifyHandover: "Notifikasi saat handover dibutuhkan",
    notifyLowCredits: "Notifikasi saat credits rendah",
    notifyDailySummary: "Kirim ringkasan inbox harian",
    deleteAccount: "Hapus Akun",
    deleteAccountText:
      "Ingin keluar dari Kolkap? Anda dapat menghapus akun dan workspace data secara permanen.",
    deleteAccountButton: "Hapus akun",
    statuses: {
      not_connected: "Belum terhubung",
      connected: "Terhubung",
      pending: "Menunggu",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
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
    languages: ["Auto-detect", "English", "中文", "Bahasa Indonesia", "Malay"],
  },

  zh: {
    badge: "设置",
    title: "管理您的企业工作区设置。",
    subtitle: "更新企业资料、AI 偏好、WhatsApp 处理方式、通知和账户信息。",
    back: "返回仪表板",
    saveChanges: "保存更改",
    saving: "正在保存...",
    saved: "设置已成功保存。",
    failed: "设置保存失败。",
    loading: "正在加载设置...",
    currentPlan: "当前方案",
    credits: "Credits",
    aiStaffLimit: "AI 员工限制",
    whatsappStatus: "WhatsApp 状态",
    businessProfile: "企业资料",
    businessProfileText: "这些信息帮助 Kolkap 理解您的企业。",
    businessName: "企业名称",
    businessType: "企业类型",
    businessEmail: "企业邮箱",
    businessPhone: "企业电话",
    whatsappNumber: "企业 WhatsApp 号码",
    address: "企业地址",
    country: "国家",
    timezone: "时区",
    aiPreferences: "AI 偏好",
    aiPreferencesText: "设置 AI 员工如何回复客户。",
    replyLanguage: "默认回复语言",
    replyTone: "默认回复语气",
    handoverRule: "人工接手规则",
    aiInstruction: "默认 AI 指令",
    whatsappHandover: "WhatsApp 与人工接手",
    whatsappHandoverText: "选择客户消息的处理方式。",
    notifications: "通知",
    notificationsText: "选择您希望何时收到通知。",
    accountSecurity: "账户与安全",
    accountSecurityText: "Owner 账户基本信息。",
    ownerName: "Owner 名称",
    ownerEmail: "Owner 邮箱",
    password: "密码",
    changePassword: "更改密码",
    autoReply: "AI 自动回复",
    humanHandover: "人工接手",
    leadCapture: "线索捕获",
    notifyNewLead: "新线索通知",
    notifyHandover: "需要人工接手时通知",
    notifyLowCredits: "credits 较低时通知",
    notifyDailySummary: "发送每日收件箱摘要",
    deleteAccount: "删除账户",
    deleteAccountText:
      "如果您需要离开 Kolkap，可以永久删除您的账户和 workspace 数据。",
    deleteAccountButton: "删除账户",
    statuses: {
      not_connected: "未连接",
      connected: "已连接",
      pending: "待处理",
      draft: "草稿",
      testing: "测试中",
      live: "已上线",
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
    languages: ["Auto-detect", "English", "中文", "Bahasa Indonesia", "Malay"],
  },

  ms: {
    badge: "Settings",
    title: "Urus tetapan workspace bisnes anda.",
    subtitle:
      "Update profil bisnes, pilihan AI, cara handling WhatsApp, notifikasi, dan detail akaun.",
    back: "Kembali ke Dashboard",
    saveChanges: "Simpan Perubahan",
    saving: "Menyimpan...",
    saved: "Settings berjaya disimpan.",
    failed: "Settings gagal disimpan.",
    loading: "Memuat settings anda...",
    currentPlan: "Pakej Semasa",
    credits: "Credits",
    aiStaffLimit: "Limit AI Staff",
    whatsappStatus: "Status WhatsApp",
    businessProfile: "Profil Bisnes",
    businessProfileText: "Maklumat ini membantu Kolkap memahami bisnes anda.",
    businessName: "Nama bisnes",
    businessType: "Jenis bisnes",
    businessEmail: "Email bisnes",
    businessPhone: "Telefon bisnes",
    whatsappNumber: "Nombor WhatsApp bisnes",
    address: "Alamat bisnes",
    country: "Negara",
    timezone: "Zon masa",
    aiPreferences: "Pilihan AI",
    aiPreferencesText: "Tetapkan bagaimana AI staff membalas pelanggan.",
    replyLanguage: "Bahasa balasan default",
    replyTone: "Gaya balasan default",
    handoverRule: "Aturan human handover",
    aiInstruction: "Arahan AI default",
    whatsappHandover: "WhatsApp & Handover",
    whatsappHandoverText: "Pilih bagaimana mesej pelanggan dikendalikan.",
    notifications: "Notifikasi",
    notificationsText: "Pilih bila anda mahu menerima notifikasi.",
    accountSecurity: "Akaun & Keselamatan",
    accountSecurityText: "Detail asas akaun owner.",
    ownerName: "Nama owner",
    ownerEmail: "Email owner",
    password: "Kata laluan",
    changePassword: "Tukar Kata Laluan",
    autoReply: "AI auto-reply",
    humanHandover: "Human handover",
    leadCapture: "Lead capture",
    notifyNewLead: "Notifikasi untuk leads baru",
    notifyHandover: "Notifikasi apabila handover diperlukan",
    notifyLowCredits: "Notifikasi apabila credits rendah",
    notifyDailySummary: "Hantar ringkasan inbox harian",
    deleteAccount: "Padam Akaun",
    deleteAccountText:
      "Mahu keluar dari Kolkap? Anda boleh memadam akaun dan workspace data secara kekal.",
    deleteAccountButton: "Padam akaun",
    statuses: {
      not_connected: "Belum bersambung",
      connected: "Bersambung",
      pending: "Menunggu",
      draft: "Draft",
      testing: "Testing",
      live: "Live",
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
    languages: ["Auto-detect", "English", "中文", "Bahasa Indonesia", "Malay"],
  },
};

type LanguageKey = keyof typeof translations;

function getTranslation(language: string) {
  if (language === "id" || language === "zh" || language === "ms") {
    return translations[language as LanguageKey];
  }

  return translations.en;
}

export default function SettingsPage() {
  const { language } = useKolkapLanguage();
  const t = getTranslation(language);
  const workspaceState = useKolkapWorkspace();
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("Asia/Makassar");

  const [aiReplyLanguage, setAiReplyLanguage] = useState("Auto-detect");
  const [aiReplyTone, setAiReplyTone] = useState("Friendly Professional");
  const [handoverRule, setHandoverRule] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");

  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [humanHandoverEnabled, setHumanHandoverEnabled] = useState(true);
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(true);
  const [notifyNewLead, setNotifyNewLead] = useState(true);
  const [notifyHandover, setNotifyHandover] = useState(true);
  const [notifyLowCredits, setNotifyLowCredits] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const workspace = workspaceState.workspace;

    if (!workspace) {
      return;
    }

    const translated = getTranslation(language);
    const defaultBusinessType = translated.businessTypes[0] || "Other";
    const defaultHandoverRule =
      translated.handoverRules[0] || "When customer asks for a human";

    setBusinessName(workspace.business_name ?? "");
    setBusinessType(workspace.business_type ?? defaultBusinessType);
    setBusinessEmail(workspace.business_email ?? "");
    setBusinessPhone(workspace.business_phone ?? "");
    setWhatsappNumber(workspace.whatsapp_number ?? "");
    setBusinessAddress(workspace.business_address ?? "");
    setCountry(workspace.country ?? "");
    setTimezone(workspace.timezone ?? "Asia/Makassar");

    setAiReplyLanguage(workspace.ai_reply_language ?? "Auto-detect");
    setAiReplyTone(workspace.ai_reply_tone ?? "Friendly Professional");
    setHandoverRule(workspace.handover_rule ?? defaultHandoverRule);
    setAiInstruction(workspace.ai_instruction ?? "");

    setAutoReplyEnabled(workspace.auto_reply_enabled ?? true);
    setHumanHandoverEnabled(workspace.human_handover_enabled ?? true);
    setLeadCaptureEnabled(workspace.lead_capture_enabled ?? true);
    setNotifyNewLead(workspace.notify_new_lead ?? true);
    setNotifyHandover(workspace.notify_handover ?? true);
    setNotifyLowCredits(workspace.notify_low_credits ?? true);
    setNotifyDailySummary(workspace.notify_daily_summary ?? false);
  }, [workspaceState.workspace, language]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspaceState.workspace) {
      return;
    }

    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("business_workspaces")
      .update({
        business_name: businessName.trim() || null,
        business_type: businessType || null,
        business_email: businessEmail.trim() || null,
        business_phone: businessPhone.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
        business_address: businessAddress.trim() || null,
        country: country.trim() || null,
        timezone: timezone || "Asia/Makassar",
        ai_reply_language: aiReplyLanguage || "Auto-detect",
        ai_reply_tone: aiReplyTone || "Friendly Professional",
        handover_rule: handoverRule || "When customer asks for a human",
        ai_instruction: aiInstruction.trim() || null,
        auto_reply_enabled: autoReplyEnabled,
        human_handover_enabled: humanHandoverEnabled,
        lead_capture_enabled: leadCaptureEnabled,
        notify_new_lead: notifyNewLead,
        notify_handover: notifyHandover,
        notify_low_credits: notifyLowCredits,
        notify_daily_summary: notifyDailySummary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspaceState.workspace.id);

    setIsSaving(false);

    if (error) {
      setSaveError(error.message || t.failed);
      return;
    }

    setSaveMessage(t.saved);
  }

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
            <p className="mt-2 text-base font-semibold">{workspaceState.error}</p>
          </div>
        </section>
      </main>
    );
  }

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      icon: WalletCards,
    },
    {
      label: t.credits,
      value: `${workspaceState.creditsRemaining}/${workspaceState.creditsTotal}`,
      icon: Bot,
    },
    {
      label: t.aiStaffLimit,
      value: getPlanAIStaffLabel(currentPlan),
      icon: UserRound,
    },
    {
      label: t.whatsappStatus,
      value: t.statuses[workspaceState.whatsappStatus],
      icon: MessageCircle,
    },
  ];

  const toggles = [
    {
      label: t.autoReply,
      checked: autoReplyEnabled,
      setChecked: setAutoReplyEnabled,
    },
    {
      label: t.humanHandover,
      checked: humanHandoverEnabled,
      setChecked: setHumanHandoverEnabled,
    },
    {
      label: t.leadCapture,
      checked: leadCaptureEnabled,
      setChecked: setLeadCaptureEnabled,
    },
    {
      label: t.notifyNewLead,
      checked: notifyNewLead,
      setChecked: setNotifyNewLead,
    },
    {
      label: t.notifyHandover,
      checked: notifyHandover,
      setChecked: setNotifyHandover,
    },
    {
      label: t.notifyLowCredits,
      checked: notifyLowCredits,
      setChecked: setNotifyLowCredits,
    },
    {
      label: t.notifyDailySummary,
      checked: notifyDailySummary,
      setChecked: setNotifyDailySummary,
    },
  ];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <form onSubmit={handleSave}>
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
                  <p className="text-lg font-black text-slate-500">{card.label}</p>
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
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.businessType}
                    </span>
                    <select
                      value={businessType}
                      onChange={(event) => setBusinessType(event.target.value)}
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    >
                      {t.businessTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextInput
                      label={t.businessEmail}
                      value={businessEmail}
                      onChange={setBusinessEmail}
                      icon="mail"
                    />
                    <TextInput
                      label={t.businessPhone}
                      value={businessPhone}
                      onChange={setBusinessPhone}
                      icon="phone"
                    />
                  </div>

                  <TextInput
                    label={t.whatsappNumber}
                    value={whatsappNumber}
                    onChange={setWhatsappNumber}
                    icon="message"
                  />

                  <label className="grid gap-2">
                    <span className="flex items-center gap-2 text-base font-black text-slate-700">
                      <MapPin className="h-5 w-5 text-slate-400" />
                      {t.address}
                    </span>
                    <textarea
                      rows={4}
                      value={businessAddress}
                      onChange={(event) => setBusinessAddress(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextInput
                      label={t.country}
                      value={country}
                      onChange={setCountry}
                      icon="globe"
                    />

                    <label className="grid gap-2">
                      <span className="flex items-center gap-2 text-base font-black text-slate-700">
                        <Clock3 className="h-5 w-5 text-slate-400" />
                        {t.timezone}
                      </span>
                      <select
                        value={timezone}
                        onChange={(event) => setTimezone(event.target.value)}
                        className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                      >
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
                    <SelectInput
                      label={t.replyLanguage}
                      value={aiReplyLanguage}
                      onChange={setAiReplyLanguage}
                      options={t.languages}
                    />
                    <SelectInput
                      label={t.replyTone}
                      value={aiReplyTone}
                      onChange={setAiReplyTone}
                      options={t.tones}
                    />
                  </div>

                  <SelectInput
                    label={t.handoverRule}
                    value={handoverRule}
                    onChange={setHandoverRule}
                    options={t.handoverRules}
                  />

                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.aiInstruction}
                    </span>
                    <textarea
                      rows={6}
                      value={aiInstruction}
                      onChange={(event) => setAiInstruction(event.target.value)}
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

                <div className="mt-7 grid gap-3">
                  {toggles.slice(0, 3).map((item) => (
                    <ToggleInput key={item.label} {...item} />
                  ))}
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
                  {toggles.slice(3).map((item) => (
                    <ToggleInput key={item.label} {...item} />
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
                    <TextInput
                      label={t.ownerName}
                      value={businessName || "Business Owner"}
                      onChange={() => {}}
                      icon="user"
                      disabled
                    />
                    <TextInput
                      label={t.ownerEmail}
                      value={businessEmail}
                      onChange={() => {}}
                      icon="mail"
                      disabled
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                      {t.password}
                    </p>
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xl font-black">••••••••••••</p>
                      <Link
                        href="/reset-password"
                        className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                      >
                        <ShieldCheck className="h-5 w-5" />
                        {t.changePassword}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                    {t.badge}
                  </p>
                  <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                    {t.title}
                  </h2>
                  {saveMessage ? (
                    <p className="mt-4 text-lg font-black text-[#7CFF3D]">
                      {saveMessage}
                    </p>
                  ) : null}
                  {saveError ? (
                    <p className="mt-4 text-lg font-black text-red-300">
                      {saveError}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-6 w-6" />
                  {isSaving ? t.saving : t.saveChanges}
                </button>
              </div>
            </section>

            <section className="rounded-[2.2rem] border border-red-200 bg-red-50 p-6 shadow-sm shadow-red-900/5 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white">
                    <AlertTriangle className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-red-700">
                    {t.deleteAccount}
                  </p>

                  <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] text-red-950">
                    {t.deleteAccountText}
                  </h2>
                </div>

                <Link
                  href="/dashboard/settings/delete-account"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-red-600 px-8 py-5 text-xl font-black text-white shadow-xl shadow-red-900/10 transition hover:-translate-y-0.5"
                >
                  <Trash2 className="h-6 w-6" />
                  {t.deleteAccountButton}
                </Link>
              </div>
            </section>
          </div>
        </section>
      </form>
    </main>
  );
}

function TextInput({
  label,
  value,
  onChange,
  icon,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: "mail" | "phone" | "message" | "globe" | "user";
  disabled?: boolean;
}) {
  const Icon =
    icon === "mail"
      ? Mail
      : icon === "phone"
        ? Phone
        : icon === "message"
          ? MessageCircle
          : icon === "globe"
            ? Globe2
            : UserRound;

  return (
    <label className="grid gap-2">
      <span className="flex items-center gap-2 text-base font-black text-slate-700">
        <Icon className="h-5 w-5 text-slate-400" />
        {label}
      </span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-base font-black text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleInput({
  label,
  checked,
  setChecked,
}: {
  label: string;
  checked: boolean;
  setChecked: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
      <span className="text-lg font-black">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        className="h-6 w-6"
      />
    </label>
  );
}