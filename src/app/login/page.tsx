"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
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
    badge: "Login",
    title: "Welcome back to Kolkap.",
    subtitle:
      "Log in to manage your AI staff, inbox, leads, credits, billing, and business settings.",
    email: "Email address",
    emailPlaceholder: "you@business.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    login: "Log In",
    loggingIn: "Logging in...",
    forgotPassword: "Forgot password?",
    noAccount: "Don’t have an account?",
    signUp: "Sign up",
    errorTitle: "Login failed",
    emptyError: "Please enter your email and password.",
    success: "Login successful. Redirecting...",
    noteTitle: "Private business dashboard",
    noteText:
      "Your dashboard is protected. Only logged-in business owners can access it.",
  },

  id: {
    badge: "Login",
    title: "Selamat datang kembali di Kolkap.",
    subtitle:
      "Login untuk mengelola AI staff, inbox, leads, credits, billing, dan pengaturan bisnis.",
    email: "Alamat email",
    emailPlaceholder: "anda@bisnis.com",
    password: "Password",
    passwordPlaceholder: "Masukkan password Anda",
    login: "Login",
    loggingIn: "Sedang login...",
    forgotPassword: "Lupa password?",
    noAccount: "Belum punya akun?",
    signUp: "Daftar",
    errorTitle: "Login gagal",
    emptyError: "Masukkan email dan password Anda.",
    success: "Login berhasil. Mengarahkan...",
    noteTitle: "Dashboard bisnis pribadi",
    noteText:
      "Dashboard Anda terlindungi. Hanya pemilik bisnis yang sudah login yang dapat mengaksesnya.",
  },

  zh: {
    badge: "登录",
    title: "欢迎回到 Kolkap。",
    subtitle:
      "登录以管理您的 AI 员工、收件箱、线索、credits、账单和企业设置。",
    email: "邮箱地址",
    emailPlaceholder: "you@business.com",
    password: "密码",
    passwordPlaceholder: "输入您的密码",
    login: "登录",
    loggingIn: "正在登录...",
    forgotPassword: "忘记密码？",
    noAccount: "还没有账户？",
    signUp: "注册",
    errorTitle: "登录失败",
    emptyError: "请输入邮箱和密码。",
    success: "登录成功，正在跳转...",
    noteTitle: "私人企业仪表板",
    noteText: "您的仪表板受到保护。只有已登录的企业主可以访问。",
  },

  ms: {
    badge: "Login",
    title: "Selamat kembali ke Kolkap.",
    subtitle:
      "Login untuk mengurus AI staff, inbox, leads, credits, billing, dan tetapan bisnes.",
    email: "Alamat email",
    emailPlaceholder: "anda@bisnes.com",
    password: "Kata laluan",
    passwordPlaceholder: "Masukkan kata laluan anda",
    login: "Login",
    loggingIn: "Sedang login...",
    forgotPassword: "Lupa kata laluan?",
    noAccount: "Belum ada akaun?",
    signUp: "Daftar",
    errorTitle: "Login gagal",
    emptyError: "Masukkan email dan kata laluan anda.",
    success: "Login berjaya. Mengarahkan...",
    noteTitle: "Dashboard bisnes peribadi",
    noteText:
      "Dashboard anda dilindungi. Hanya pemilik bisnes yang sudah login boleh mengaksesnya.",
  },
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

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

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
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
        email: email.trim(),
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
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">{t.noteTitle}</h2>
            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              {t.noteText}
            </p>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <form onSubmit={handleLogin} className="grid gap-5">
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