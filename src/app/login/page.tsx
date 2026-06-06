"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Eye,
  EyeOff,
  Inbox,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { ensureKolkapWorkspace } from "@/lib/kolkapWorkspace";

const translations = {
  en: {
    badge: "Welcome Back",
    title: "Continue managing your AI staff.",
    subtitle:
      "Log in to manage your AI staff, customer replies, credits, usage, inbox, leads, billing, and business settings.",
    email: "Email address",
    emailPlaceholder: "you@business.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    login: "Log In",
    loggingIn: "Logging in...",
    forgotPassword: "Forgot password?",
    noAccount: "Don’t have an account?",
    signUp: "Start Free Trial",
    errorTitle: "Login failed",
    emptyError: "Please enter your email and password.",
    success: "Login successful. Redirecting...",
    noteTitle: "Your AI staff workspace",
    noteText:
      "Your dashboard helps you create AI staff, add business knowledge, test replies, track usage, monitor credits, manage inbox conversations, and go live when ready.",
    point1: "Manage AI staff",
    point2: "Track credits and usage",
    point3: "Review inbox replies",
    secureTitle: "Private business dashboard",
    secureText:
      "Only logged-in business owners and team members can access this workspace.",
    loading: "Loading login...",
    togglePassword: "Toggle password visibility",
  },

  id: {
    badge: "Selamat Datang Kembali",
    title: "Lanjutkan mengelola AI staff Anda.",
    subtitle:
      "Login untuk mengelola AI staff, balasan pelanggan, credits, usage, inbox, leads, billing, dan pengaturan bisnis.",
    email: "Alamat email",
    emailPlaceholder: "anda@bisnis.com",
    password: "Password",
    passwordPlaceholder: "Masukkan password Anda",
    login: "Login",
    loggingIn: "Sedang login...",
    forgotPassword: "Lupa password?",
    noAccount: "Belum punya akun?",
    signUp: "Mulai Free Trial",
    errorTitle: "Login gagal",
    emptyError: "Masukkan email dan password Anda.",
    success: "Login berhasil. Mengarahkan...",
    noteTitle: "Workspace AI staff Anda",
    noteText:
      "Dashboard Anda membantu membuat AI staff, menambahkan business knowledge, test replies, track usage, monitor credits, mengelola inbox conversations, dan go live saat sudah siap.",
    point1: "Kelola AI staff",
    point2: "Pantau credits dan usage",
    point3: "Review balasan inbox",
    secureTitle: "Dashboard bisnis pribadi",
    secureText:
      "Hanya business owner dan team member yang sudah login yang bisa mengakses workspace ini.",
    loading: "Memuat login...",
    togglePassword: "Tampilkan atau sembunyikan password",
  },

  zh: {
    badge: "欢迎回来",
    title: "继续管理您的 AI 员工。",
    subtitle:
      "登录以管理 AI 员工、客户回复、credits、usage、inbox、leads、账单和业务设置。",
    email: "邮箱地址",
    emailPlaceholder: "you@business.com",
    password: "密码",
    passwordPlaceholder: "请输入您的密码",
    login: "登录",
    loggingIn: "正在登录...",
    forgotPassword: "忘记密码？",
    noAccount: "还没有账户？",
    signUp: "开始免费试用",
    errorTitle: "登录失败",
    emptyError: "请输入邮箱和密码。",
    success: "登录成功。正在跳转...",
    noteTitle: "您的 AI 员工工作区",
    noteText:
      "您的 dashboard 可帮助您创建 AI 员工、添加业务知识、测试回复、追踪 usage、管理 credits、查看 inbox conversations，并在准备好后 go live。",
    point1: "管理 AI 员工",
    point2: "追踪 credits 和 usage",
    point3: "查看 inbox 回复",
    secureTitle: "私人业务 dashboard",
    secureText:
      "只有已登录的 business owner 和 team member 可以访问此 workspace。",
    loading: "正在加载登录页面...",
    togglePassword: "显示或隐藏密码",
  },

  ms: {
    badge: "Selamat Kembali",
    title: "Teruskan mengurus AI staff anda.",
    subtitle:
      "Login untuk mengurus AI staff, balasan pelanggan, credits, usage, inbox, leads, billing, dan tetapan bisnes.",
    email: "Alamat email",
    emailPlaceholder: "anda@bisnes.com",
    password: "Kata laluan",
    passwordPlaceholder: "Masukkan kata laluan anda",
    login: "Login",
    loggingIn: "Sedang login...",
    forgotPassword: "Lupa kata laluan?",
    noAccount: "Belum ada akaun?",
    signUp: "Mulakan Free Trial",
    errorTitle: "Login gagal",
    emptyError: "Masukkan email dan kata laluan anda.",
    success: "Login berjaya. Mengarahkan...",
    noteTitle: "Workspace AI staff anda",
    noteText:
      "Dashboard anda membantu mencipta AI staff, tambah business knowledge, test replies, track usage, monitor credits, urus inbox conversations, dan go live apabila sudah bersedia.",
    point1: "Urus AI staff",
    point2: "Pantau credits dan usage",
    point3: "Review balasan inbox",
    secureTitle: "Dashboard bisnes peribadi",
    secureText:
      "Hanya business owner dan team member yang sudah login boleh mengakses workspace ini.",
    loading: "Memuat login...",
    togglePassword: "Tunjuk atau sembunyikan kata laluan",
  },
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const rawNextPath = searchParams.get("next") || "/dashboard";
  const nextPath =
    rawNextPath.startsWith("/") && !rawNextPath.startsWith("//")
      ? rawNextPath
      : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim() || !password.trim()) {
      setError(t.emptyError);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsSubmitting(false);
        return;
      }

      await ensureKolkapWorkspace(supabase);

      setMessage(t.success);
      router.replace(nextPath);
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
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
              <Bot className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">{t.noteTitle}</h2>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              {t.noteText}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <FeaturePoint
                icon={<Bot className="h-5 w-5" />}
                text={t.point1}
              />

              <FeaturePoint
                icon={<BarChart3 className="h-5 w-5" />}
                text={t.point2}
              />

              <FeaturePoint
                icon={<Inbox className="h-5 w-5" />}
                text={t.point3}
              />
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">{t.secureTitle}</h2>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              {t.secureText}
            </p>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <form onSubmit={handleLogin} className="grid gap-5">
            <div className="mb-2">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.badge}
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.login}
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                {t.subtitle}
              </p>
            </div>

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
                <LockKeyhole className="h-5 w-5 text-slate-400" />
                {t.password}
              </span>

              <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 transition focus-within:border-blue-500 focus-within:bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="current-password"
                  className="w-full bg-transparent text-lg font-semibold outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="ml-3 text-slate-500"
                  aria-label={t.togglePassword}
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
              {isSubmitting ? t.loggingIn : t.login}
              <ArrowRight className="h-6 w-6" />
            </button>

            <div className="flex flex-col gap-3 text-center text-base font-black text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/forgot-password" className="text-blue-600">
                {t.forgotPassword}
              </Link>

              <p>
                {t.noAccount}{" "}
                <Link
                  href={`/signup?next=${encodeURIComponent(nextPath)}`}
                  className="text-blue-600"
                >
                  {t.signUp}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function FeaturePoint({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#07111F]">
        {icon}
      </div>

      <p className="text-sm font-black leading-5 text-white">{text}</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
          <div className="mx-auto max-w-7xl rounded-[2.2rem] bg-white p-8 text-xl font-black">
            Loading login...
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}