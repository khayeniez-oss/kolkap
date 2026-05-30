"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { ensureKolkapWorkspace } from "@/lib/kolkapWorkspace";

const translations = {
  en: {
    badge: "Sign Up",
    title: "Create your Kolkap business account.",
    subtitle:
      "Start your AI staff setup, manage customer messages, and prepare your business inbox in one simple workspace.",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    email: "Email address",
    emailPlaceholder: "you@business.com",
    businessType: "Business type",
    password: "Password",
    passwordPlaceholder: "Create a password",
    createAccount: "Create Account",
    creating: "Creating account...",
    alreadyHaveAccount: "Already have an account?",
    login: "Log in",
    errorTitle: "Signup failed",
    emptyError: "Please complete all required fields.",
    passwordError: "Password must be at least 6 characters.",
    success: "Account created successfully. Redirecting to your dashboard...",
    confirmEmail:
      "Account created. Please check your email to confirm your account before logging in.",
    noteTitle: "Your private business workspace",
    noteText:
      "After signup, your dashboard will help you create AI staff, manage inbox, track credits, and prepare your WhatsApp setup.",
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
  },

  id: {
    badge: "Daftar",
    title: "Buat akun bisnis Kolkap Anda.",
    subtitle:
      "Mulai setup AI staff, kelola pesan pelanggan, dan siapkan inbox bisnis Anda dalam satu workspace sederhana.",
    fullName: "Nama lengkap",
    fullNamePlaceholder: "Nama Anda",
    email: "Alamat email",
    emailPlaceholder: "anda@bisnis.com",
    businessType: "Jenis bisnis",
    password: "Password",
    passwordPlaceholder: "Buat password",
    createAccount: "Buat Akun",
    creating: "Sedang membuat akun...",
    alreadyHaveAccount: "Sudah punya akun?",
    login: "Login",
    errorTitle: "Signup gagal",
    emptyError: "Mohon lengkapi semua field yang dibutuhkan.",
    passwordError: "Password minimal 6 karakter.",
    success: "Akun berhasil dibuat. Mengarahkan ke dashboard Anda...",
    confirmEmail:
      "Akun berhasil dibuat. Silakan cek email Anda untuk konfirmasi sebelum login.",
    noteTitle: "Workspace bisnis pribadi Anda",
    noteText:
      "Setelah daftar, dashboard Anda akan membantu membuat AI staff, mengelola inbox, memantau credits, dan menyiapkan WhatsApp.",
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
  },

  zh: {
    badge: "注册",
    title: "创建您的 Kolkap 企业账户。",
    subtitle:
      "开始设置 AI 员工，管理客户消息，并在一个简单的工作区中准备企业收件箱。",
    fullName: "全名",
    fullNamePlaceholder: "您的姓名",
    email: "邮箱地址",
    emailPlaceholder: "you@business.com",
    businessType: "企业类型",
    password: "密码",
    passwordPlaceholder: "创建密码",
    createAccount: "创建账户",
    creating: "正在创建账户...",
    alreadyHaveAccount: "已经有账户？",
    login: "登录",
    errorTitle: "注册失败",
    emptyError: "请填写所有必填字段。",
    passwordError: "密码至少需要 6 个字符。",
    success: "账户创建成功，正在跳转到仪表板...",
    confirmEmail: "账户已创建。请检查邮箱并确认账户，然后再登录。",
    noteTitle: "您的私人企业工作区",
    noteText:
      "注册后，仪表板将帮助您创建 AI 员工、管理收件箱、追踪 credits，并准备 WhatsApp 设置。",
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
  },

  ms: {
    badge: "Daftar",
    title: "Cipta akaun bisnes Kolkap anda.",
    subtitle:
      "Mulakan setup AI staff, urus mesej pelanggan, dan sediakan inbox bisnes anda dalam satu workspace mudah.",
    fullName: "Nama penuh",
    fullNamePlaceholder: "Nama anda",
    email: "Alamat email",
    emailPlaceholder: "anda@bisnes.com",
    businessType: "Jenis bisnes",
    password: "Kata laluan",
    passwordPlaceholder: "Cipta kata laluan",
    createAccount: "Cipta Akaun",
    creating: "Sedang mencipta akaun...",
    alreadyHaveAccount: "Sudah ada akaun?",
    login: "Login",
    errorTitle: "Signup gagal",
    emptyError: "Sila lengkapkan semua field yang diperlukan.",
    passwordError: "Kata laluan mesti sekurang-kurangnya 6 karakter.",
    success: "Akaun berjaya dicipta. Mengarahkan ke dashboard anda...",
    confirmEmail:
      "Akaun berjaya dicipta. Sila semak email anda untuk pengesahan sebelum login.",
    noteTitle: "Workspace bisnes peribadi anda",
    noteText:
      "Selepas daftar, dashboard anda akan membantu mencipta AI staff, mengurus inbox, memantau credits, dan menyediakan WhatsApp.",
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
  },
};

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const rawNextPath = searchParams.get("next") || "/dashboard";
  const nextPath =
    rawNextPath.startsWith("/") && !rawNextPath.startsWith("//")
      ? rawNextPath
      : "/dashboard";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState(t.businessTypes[0]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !businessType || !password.trim()) {
      setError(t.emptyError);
      return;
    }

    if (password.length < 6) {
      setError(t.passwordError);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { data, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            business_type: businessType,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        setIsSubmitting(false);
        return;
      }

      if (data.session) {
        await ensureKolkapWorkspace(supabase);
        
        setMessage(t.success);
        router.replace(nextPath);
        router.refresh();
        return;
      }

      setMessage(t.confirmEmail);
      setIsSubmitting(false);
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto grid min-h-[calc(100vh-160px)] max-w-7xl items-center gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-14">
        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
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

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">{t.noteTitle}</h2>
            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              {t.noteText}
            </p>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <form onSubmit={handleSignup} className="grid gap-5">
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <UserRound className="h-5 w-5 text-slate-400" />
                {t.fullName}
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={t.fullNamePlaceholder}
                autoComplete="name"
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <Mail className="h-5 w-5 text-slate-400" />
                {t.email}
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.emailPlaceholder}
                autoComplete="email"
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <BriefcaseBusiness className="h-5 w-5 text-slate-400" />
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

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <LockKeyhole className="h-5 w-5 text-slate-400" />
                {t.password}
              </span>

              <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 transition focus-within:border-blue-500 focus-within:bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="new-password"
                  className="w-full bg-transparent text-lg font-semibold outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="ml-3 text-slate-500"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                <p className="text-base font-black">{t.errorTitle}</p>
                <p className="mt-1 text-base font-semibold leading-7">
                  {error}
                </p>
              </div>
            ) : null}

            {message ? (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                <p className="text-base font-black">{message}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t.creating : t.createAccount}
              <ArrowRight className="h-6 w-6" />
            </button>

            <p className="text-center text-base font-black text-slate-600">
              {t.alreadyHaveAccount}{" "}
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="text-blue-600"
              >
                {t.login}
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
          <div className="mx-auto max-w-7xl rounded-[2.2rem] bg-white p-8 text-xl font-black">
            Loading signup...
          </div>
        </main>
      }
    >
      <SignupContent />
    </Suspense>
  );
}