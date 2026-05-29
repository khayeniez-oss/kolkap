"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";

const translations = {
  en: {
    sideBadge: "Welcome back",
    sideTitle: "Log in and manage your AI business team.",
    sideText:
      "Access your AI staff, inbox, leads, handover, knowledge, reports, and business workspace.",
    highlights: [
      "Manage AI staff",
      "Review customer messages",
      "Capture and follow up leads",
      "Keep business replies organized",
    ],
    label: "Login",
    title: "Welcome back",
    subtitle: "Log in to continue setting up and managing your Kolkap workspace.",
    email: "Email address",
    emailPlaceholder: "you@business.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember me",
    forgot: "Forgot password?",
    button: "Log in to Kolkap",
    noAccount: "Don’t have an account?",
    signup: "Create account",
    simpleTitle: "Simple workspace access",
    simpleText:
      "Kolkap keeps everything organized for business owners: AI setup, inbox, leads, team, and reports.",
  },
  zh: {
    sideBadge: "欢迎回来",
    sideTitle: "登录并管理您的 AI 商业团队。",
    sideText:
      "访问您的 AI 员工、收件箱、线索、人工接手、知识、报告和企业工作区。",
    highlights: [
      "管理 AI 员工",
      "查看客户消息",
      "捕获并跟进线索",
      "保持企业回复有条理",
    ],
    label: "登录",
    title: "欢迎回来",
    subtitle: "登录以继续设置和管理您的 Kolkap 工作区。",
    email: "电子邮件地址",
    emailPlaceholder: "you@business.com",
    password: "密码",
    passwordPlaceholder: "输入您的密码",
    remember: "记住我",
    forgot: "忘记密码？",
    button: "登录 Kolkap",
    noAccount: "还没有账户？",
    signup: "创建账户",
    simpleTitle: "简单的工作区访问",
    simpleText:
      "Kolkap 为企业主整理 AI 设置、收件箱、线索、团队和报告。",
  },
  id: {
    sideBadge: "Selamat datang kembali",
    sideTitle: "Masuk dan kelola tim bisnis AI Anda.",
    sideText:
      "Akses AI staff, inbox, leads, handover, knowledge, reports, dan workspace bisnis Anda.",
    highlights: [
      "Kelola AI staff",
      "Cek pesan pelanggan",
      "Tangkap dan follow up leads",
      "Atur balasan bisnis dengan rapi",
    ],
    label: "Masuk",
    title: "Selamat datang kembali",
    subtitle:
      "Masuk untuk melanjutkan setup dan mengelola workspace Kolkap Anda.",
    email: "Alamat email",
    emailPlaceholder: "you@business.com",
    password: "Password",
    passwordPlaceholder: "Masukkan password Anda",
    remember: "Ingat saya",
    forgot: "Lupa password?",
    button: "Masuk ke Kolkap",
    noAccount: "Belum punya akun?",
    signup: "Buat akun",
    simpleTitle: "Akses workspace mudah",
    simpleText:
      "Kolkap menjaga semuanya tetap rapi untuk pemilik bisnis: setup AI, inbox, leads, team, dan reports.",
  },
  ms: {
    sideBadge: "Selamat kembali",
    sideTitle: "Log masuk dan urus pasukan bisnes AI anda.",
    sideText:
      "Akses AI staff, inbox, leads, handover, knowledge, reports, dan workspace bisnes anda.",
    highlights: [
      "Urus AI staff",
      "Semak mesej pelanggan",
      "Tangkap dan follow up prospek",
      "Susun balasan bisnes dengan kemas",
    ],
    label: "Log masuk",
    title: "Selamat kembali",
    subtitle:
      "Log masuk untuk meneruskan setup dan mengurus workspace Kolkap anda.",
    email: "Alamat email",
    emailPlaceholder: "you@business.com",
    password: "Kata laluan",
    passwordPlaceholder: "Masukkan kata laluan anda",
    remember: "Ingat saya",
    forgot: "Lupa kata laluan?",
    button: "Log masuk ke Kolkap",
    noAccount: "Belum ada akaun?",
    signup: "Cipta akaun",
    simpleTitle: "Akses workspace mudah",
    simpleText:
      "Kolkap memastikan semuanya tersusun untuk pemilik bisnes: setup AI, inbox, leads, team, dan reports.",
  },
};

export default function LoginPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;
  const [showPassword, setShowPassword] = useState(false);

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
                  <LockKeyhole className="h-5 w-5 text-slate-400" />
                  {t.password}
                </span>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t.passwordPlaceholder}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 pr-14 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-[#07111F]"
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

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-center gap-3 text-base font-black text-slate-700">
                  <input type="checkbox" />
                  {t.remember}
                </label>

                <Link
                  href="/forgot-password"
                  className="text-base font-black text-blue-600 transition hover:text-blue-800"
                >
                  {t.forgot}
                </Link>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-blue-700" />
                  <div>
                    <p className="text-xl font-black text-blue-950">
                      {t.simpleTitle}
                    </p>
                    <p className="mt-2 text-lg font-semibold leading-8 text-blue-800">
                      {t.simpleText}
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
              {t.noAccount}{" "}
              <Link href="/signup" className="font-black text-blue-600">
                {t.signup}
              </Link>
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Bot, label: "AI" },
                { icon: MessageCircle, label: "Inbox" },
                { icon: Users, label: "Leads" },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-center"
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-base font-black text-slate-700">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}