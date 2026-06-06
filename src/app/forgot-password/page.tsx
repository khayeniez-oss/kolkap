"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Mail,
  Send,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";

const translations = {
  en: {
    badge: "Secure account recovery",
    heroTitle: "Get back into your Kolkap workspace.",
    heroText:
      "Reset your password securely and return to managing your AI staff, conversations, leads, credits, usage, and content.",
    login: "Login",
    backToLogin: "Back to login",
    pageBadge: "Password Reset",
    title: "Forgot your password?",
    subtitle:
      "Enter your email address and we’ll send you a secure link to reset your password.",
    email: "Email address",
    emailPlaceholder: "you@business.com",
    send: "Send reset link",
    sending: "Sending reset link...",
    success:
      "Password reset link sent. Please check your email and follow the secure link.",
    errorTitle: "Reset link could not be sent",
    emptyError: "Please enter your email address.",
    securityTitle: "Security note",
    securityText:
      "The reset link only works for the email registered to your Kolkap account. For security, reset links expire.",
    rememberPassword: "Remember your password?",
    recoverySteps: [
      "Enter your registered email address",
      "Kolkap sends a secure reset link",
      "Create a new password",
      "Log back in to your workspace",
    ],
    safetyNotes: [
      "Reset links expire for security",
      "Your workspace data stays protected",
      "You can log in again after changing password",
    ],
  },

  id: {
    badge: "Secure account recovery",
    heroTitle: "Get back into your Kolkap workspace.",
    heroText:
      "Reset password Anda dengan aman dan kembali mengelola AI staff, conversations, leads, credits, usage, dan content.",
    login: "Login",
    backToLogin: "Kembali ke login",
    pageBadge: "Password Reset",
    title: "Forgot your password?",
    subtitle:
      "Masukkan alamat email Anda dan kami akan mengirim secure link untuk reset password.",
    email: "Alamat email",
    emailPlaceholder: "anda@bisnis.com",
    send: "Kirim reset link",
    sending: "Mengirim reset link...",
    success:
      "Password reset link berhasil dikirim. Silakan cek email Anda dan ikuti secure link.",
    errorTitle: "Reset link gagal dikirim",
    emptyError: "Mohon masukkan alamat email Anda.",
    securityTitle: "Security note",
    securityText:
      "Reset link hanya bekerja untuk email yang terdaftar di akun Kolkap Anda. Demi keamanan, reset link memiliki masa berlaku.",
    rememberPassword: "Ingat password Anda?",
    recoverySteps: [
      "Masukkan alamat email yang terdaftar",
      "Kolkap mengirim secure reset link",
      "Buat password baru",
      "Login kembali ke workspace Anda",
    ],
    safetyNotes: [
      "Reset link memiliki masa berlaku demi keamanan",
      "Data workspace Anda tetap terlindungi",
      "Anda bisa login kembali setelah mengganti password",
    ],
  },

  zh: {
    badge: "Secure account recovery",
    heroTitle: "Get back into your Kolkap workspace.",
    heroText:
      "安全重置密码，然后返回管理您的 AI staff、conversations、leads、credits、usage 和 content。",
    login: "登录",
    backToLogin: "返回登录",
    pageBadge: "Password Reset",
    title: "Forgot your password?",
    subtitle: "请输入邮箱地址，我们会发送安全链接来重置您的密码。",
    email: "邮箱地址",
    emailPlaceholder: "you@business.com",
    send: "发送重置链接",
    sending: "正在发送重置链接...",
    success: "密码重置链接已发送。请检查邮箱并按照安全链接操作。",
    errorTitle: "无法发送重置链接",
    emptyError: "请输入您的邮箱地址。",
    securityTitle: "Security note",
    securityText:
      "重置链接仅适用于注册 Kolkap 账户的邮箱。为了安全，重置链接会过期。",
    rememberPassword: "记得密码？",
    recoverySteps: [
      "输入已注册的邮箱地址",
      "Kolkap 发送安全重置链接",
      "创建新密码",
      "重新登录 workspace",
    ],
    safetyNotes: [
      "重置链接会因安全原因过期",
      "您的 workspace 数据保持安全",
      "修改密码后可以重新登录",
    ],
  },

  ms: {
    badge: "Secure account recovery",
    heroTitle: "Get back into your Kolkap workspace.",
    heroText:
      "Reset password anda dengan selamat dan kembali mengurus AI staff, conversations, leads, credits, usage, dan content.",
    login: "Login",
    backToLogin: "Kembali ke login",
    pageBadge: "Password Reset",
    title: "Forgot your password?",
    subtitle:
      "Masukkan alamat email anda dan kami akan menghantar secure link untuk reset password.",
    email: "Alamat email",
    emailPlaceholder: "anda@bisnes.com",
    send: "Hantar reset link",
    sending: "Menghantar reset link...",
    success:
      "Password reset link berjaya dihantar. Sila semak email anda dan ikut secure link.",
    errorTitle: "Reset link gagal dihantar",
    emptyError: "Sila masukkan alamat email anda.",
    securityTitle: "Security note",
    securityText:
      "Reset link hanya berfungsi untuk email yang berdaftar dengan akaun Kolkap anda. Untuk keselamatan, reset link akan tamat tempoh.",
    rememberPassword: "Ingat password anda?",
    recoverySteps: [
      "Masukkan alamat email yang berdaftar",
      "Kolkap menghantar secure reset link",
      "Cipta password baru",
      "Login semula ke workspace anda",
    ],
    safetyNotes: [
      "Reset link tamat tempoh untuk keselamatan",
      "Data workspace anda kekal dilindungi",
      "Anda boleh login semula selepas menukar password",
    ],
  },
};

export default function ForgotPasswordPage() {
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(t.emptyError);
      return;
    }

    setIsSending(true);

    try {
      const supabase = createClient();

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "";

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${origin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        setIsSending(false);
        return;
      }

      setMessage(t.success);
      setEmail("");
      setIsSending(false);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Something went wrong. Please try again."
      );
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[#05070A] p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(37,99,255,0.35),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(124,255,61,0.16),transparent_30%),linear-gradient(135deg,#05070A_0%,#07111F_100%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <KolkapLogo size="md" lightText />

            <div className="max-w-xl">
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
                {t.badge}
              </div>

              <h1 className="text-6xl font-black leading-[1.02] tracking-[-0.06em]">
                {t.heroTitle}
              </h1>

              <p className="mt-7 text-2xl font-semibold leading-10 text-slate-300">
                {t.heroText}
              </p>
            </div>

            <div className="grid gap-4">
              {t.recoverySteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-lg font-black text-[#07111F]">
                    {index + 1}
                  </span>

                  <p className="text-xl font-black">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-10 flex items-center justify-between gap-4 lg:hidden">
              <KolkapLogo size="sm" />

              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-700 shadow-sm"
              >
                {t.login}
              </Link>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 lg:p-10">
              <Link
                href="/login"
                className="mb-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
              >
                <ArrowLeft className="h-5 w-5" />
                {t.backToLogin}
              </Link>

              <div className="mb-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <KeyRound className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.pageBadge}
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#07111F] sm:text-5xl">
                  {t.title}
                </h2>

                <p className="mt-4 text-xl font-semibold leading-8 text-slate-600">
                  {t.subtitle}
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.email}
                  </span>

                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t.emailPlaceholder}
                      autoComplete="email"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] pl-14 pr-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
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
                  disabled={isSending}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-6 w-6" />
                  {isSending ? t.sending : t.send}
                </button>
              </form>

              <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-blue-700" />

                  <div>
                    <p className="text-xl font-black text-blue-950">
                      {t.securityTitle}
                    </p>

                    <p className="mt-2 text-lg font-semibold leading-8 text-blue-800">
                      {t.securityText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                {t.safetyNotes.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />

                    <p className="text-lg font-black leading-8">{item}</p>
                  </div>
                ))}
              </div>

              <p className="mt-7 text-center text-lg font-semibold text-slate-600">
                {t.rememberPassword}{" "}
                <Link href="/login" className="font-black text-blue-600">
                  {t.login}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}