"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Globe2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";

const translations = {
  en: {
    sideBadge: "AI staff setup starts here",
    sideTitle: "Create your AI business team in minutes.",
    sideText:
      "Set up your business profile, choose your AI staff, add your business knowledge, and prepare Kolkap to reply to customers.",
    highlights: [
      "AI Receptionist",
      "WhatsApp Responder",
      "Lead Capture",
      "Human Handover",
    ],
    label: "Start Kolkap",
    title: "Create your account",
    subtitle:
      "We’ll set up your first business workspace and prepare your AI setup flow.",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    phone: "Phone number",
    phonePlaceholder: "+62...",
    email: "Email address",
    emailPlaceholder: "you@business.com",
    password: "Password",
    passwordPlaceholder: "Create a secure password",
    businessName: "Business name",
    businessNamePlaceholder: "Example: Bali Villa Co., FitHouse Studio",
    businessType: "Business type",
    businessTypePlaceholder: "Select your business type",
    mainGoal: "Main goal",
    button: "Continue to Create AI",
    already: "Already have an account?",
    login: "Log in",
    simpleNoteTitle: "Simple setup",
    simpleNote: "Kolkap keeps the flow easy for business owners.",
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
    goals: [
      "Reply to customers faster",
      "Capture more leads",
      "Book appointments",
      "Support my team",
      "Create marketing content",
      "Hand over to a human when needed",
    ],
  },
  zh: {
    sideBadge: "AI 员工设置从这里开始",
    sideTitle: "几分钟内创建您的 AI 商业团队。",
    sideText:
      "设置企业资料，选择 AI 员工，添加企业知识，并准备让 Kolkap 回复客户。",
    highlights: ["AI 接待员", "WhatsApp 回复员", "线索捕获", "人工接手"],
    label: "开始使用 Kolkap",
    title: "创建您的账户",
    subtitle: "我们将创建您的第一个企业工作区，并准备 AI 设置流程。",
    fullName: "全名",
    fullNamePlaceholder: "您的姓名",
    phone: "电话号码",
    phonePlaceholder: "+62...",
    email: "电子邮件地址",
    emailPlaceholder: "you@business.com",
    password: "密码",
    passwordPlaceholder: "创建安全密码",
    businessName: "企业名称",
    businessNamePlaceholder: "例如：Bali Villa Co., FitHouse Studio",
    businessType: "企业类型",
    businessTypePlaceholder: "选择您的企业类型",
    mainGoal: "主要目标",
    button: "继续创建 AI",
    already: "已经有账户？",
    login: "登录",
    simpleNoteTitle: "简单设置",
    simpleNote: "Kolkap 让企业主的流程保持简单。",
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
    goals: [
      "更快回复客户",
      "捕获更多线索",
      "预约安排",
      "支持我的团队",
      "创建营销内容",
      "需要时转交人工",
    ],
  },
  id: {
    sideBadge: "Setup AI staff dimulai di sini",
    sideTitle: "Buat tim bisnis AI Anda dalam hitungan menit.",
    sideText:
      "Atur profil bisnis, pilih AI staff, tambahkan pengetahuan bisnis, dan siapkan Kolkap untuk membalas pelanggan.",
    highlights: [
      "AI Receptionist",
      "WhatsApp Responder",
      "Lead Capture",
      "Human Handover",
    ],
    label: "Mulai Kolkap",
    title: "Buat akun Anda",
    subtitle:
      "Kami akan menyiapkan workspace bisnis pertama Anda dan alur setup AI.",
    fullName: "Nama lengkap",
    fullNamePlaceholder: "Nama Anda",
    phone: "Nomor telepon",
    phonePlaceholder: "+62...",
    email: "Alamat email",
    emailPlaceholder: "you@business.com",
    password: "Password",
    passwordPlaceholder: "Buat password yang aman",
    businessName: "Nama bisnis",
    businessNamePlaceholder: "Contoh: Bali Villa Co., FitHouse Studio",
    businessType: "Jenis bisnis",
    businessTypePlaceholder: "Pilih jenis bisnis Anda",
    mainGoal: "Tujuan utama",
    button: "Lanjut ke Create AI",
    already: "Sudah punya akun?",
    login: "Masuk",
    simpleNoteTitle: "Setup mudah",
    simpleNote: "Kolkap membuat alur tetap mudah untuk pemilik bisnis",
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
    goals: [
      "Membalas pelanggan lebih cepat",
      "Mendapatkan lebih banyak leads",
      "Membuat booking / appointment",
      "Mendukung tim saya",
      "Membuat konten marketing",
      "Handover ke manusia saat dibutuhkan",
    ],
  },
  ms: {
    sideBadge: "Setup AI staff bermula di sini",
    sideTitle: "Cipta pasukan bisnes AI anda dalam beberapa minit.",
    sideText:
      "Sediakan profil bisnes, pilih AI staff, tambah pengetahuan bisnes, dan sediakan Kolkap untuk membalas pelanggan.",
    highlights: [
      "AI Receptionist",
      "WhatsApp Responder",
      "Lead Capture",
      "Human Handover",
    ],
    label: "Mula Kolkap",
    title: "Cipta akaun anda",
    subtitle:
      "Kami akan menyediakan workspace bisnes pertama anda dan aliran setup AI.",
    fullName: "Nama penuh",
    fullNamePlaceholder: "Nama anda",
    phone: "Nombor telefon",
    phonePlaceholder: "+62...",
    email: "Alamat email",
    emailPlaceholder: "you@business.com",
    password: "Kata laluan",
    passwordPlaceholder: "Cipta kata laluan selamat",
    businessName: "Nama bisnes",
    businessNamePlaceholder: "Contoh: Bali Villa Co., FitHouse Studio",
    businessType: "Jenis bisnes",
    businessTypePlaceholder: "Pilih jenis bisnes anda",
    mainGoal: "Matlamat utama",
    button: "Teruskan ke Create AI",
    already: "Sudah ada akaun?",
    login: "Log masuk",
    simpleNoteTitle: "Setup mudah",
    simpleNote: "Kolkap menjadikan aliran mudah untuk pemilik bisnes.",
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
    goals: [
      "Balas pelanggan lebih cepat",
      "Dapatkan lebih banyak prospek",
      "Urus booking / appointment",
      "Sokong pasukan saya",
      "Cipta kandungan marketing",
      "Serah kepada manusia bila perlu",
    ],
  },
};

export default function SignupPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-14">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(37,99,255,0.35),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(124,255,61,0.16),transparent_30%),linear-gradient(135deg,#05070A_0%,#07111F_100%)]" />

          <div className="relative z-10 flex h-full min-h-[520px] flex-col justify-between gap-10">
            <div>
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
                <Sparkles className="h-5 w-5" />
                {t.sideBadge}
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                {t.sideTitle}
              </h1>

              <p className="mt-7 max-w-xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
                {t.sideText}
              </p>
            </div>

            <div className="grid gap-4">
              {t.highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <span className="h-4 w-4 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
                  <p className="text-xl font-black">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 lg:p-10">
            <div className="mb-8">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.label}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#07111F] sm:text-5xl">
                {t.title}
              </h2>

              <p className="mt-4 text-xl font-semibold leading-8 text-slate-600">
                {t.subtitle}
              </p>
            </div>

            <form className="space-y-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-base font-black text-slate-700">
                    <UserRound className="h-5 w-5 text-slate-400" />
                    {t.fullName}
                  </span>
                  <input
                    type="text"
                    placeholder={t.fullNamePlaceholder}
                    className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="flex items-center gap-2 text-base font-black text-slate-700">
                    <Phone className="h-5 w-5 text-slate-400" />
                    {t.phone}
                  </span>
                  <input
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-base font-black text-slate-700">
                  <Mail className="h-5 w-5 text-slate-400" />
                  {t.email}
                </span>
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-base font-black text-slate-700">
                  <ShieldCheck className="h-5 w-5 text-slate-400" />
                  {t.password}
                </span>
                <input
                  type="password"
                  placeholder={t.passwordPlaceholder}
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-base font-black text-slate-700">
                  <Building2 className="h-5 w-5 text-slate-400" />
                  {t.businessName}
                </span>
                <input
                  type="text"
                  placeholder={t.businessNamePlaceholder}
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-base font-black text-slate-700">
                  <Globe2 className="h-5 w-5 text-slate-400" />
                  {t.businessType}
                </span>

                <select
                  defaultValue=""
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                >
                  <option value="" disabled>
                    {t.businessTypePlaceholder}
                  </option>
                  {t.businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="mb-3 flex items-center gap-2 text-base font-black text-slate-700">
                  <Bot className="h-5 w-5 text-slate-400" />
                  {t.mainGoal}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {t.goals.map((goal) => (
                    <label
                      key={goal}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4 transition hover:border-blue-400 hover:bg-white"
                    >
                      <input type="checkbox" />
                      <span className="text-lg font-black">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-blue-700" />
                  <div>
                    <p className="text-xl font-black text-blue-950">
                      {t.simpleNoteTitle}
                    </p>
                    <p className="mt-2 text-lg font-semibold leading-8 text-blue-800">
                      {t.simpleNote}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/create-ai"
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
              >
                {t.button}
                <ArrowRight className="h-6 w-6" />
              </Link>
            </form>

            <p className="mt-7 text-center text-lg font-semibold text-slate-600">
              {t.already}{" "}
              <Link href="/login" className="font-black text-blue-600">
                {t.login}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}