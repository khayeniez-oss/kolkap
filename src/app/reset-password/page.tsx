"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";

const translations = {
  en: {
    badge: "Create a new password",
    heroTitle: "Secure your Kolkap workspace.",
    heroText:
      "Choose a strong new password before returning to your AI staff, inbox, leads, and business dashboard.",
    login: "Login",
    backToLogin: "Back to login",
    pageBadge: "Reset Password",
    title: "Set a new password",
    subtitle:
      "Create a new password for your Kolkap account. After saving, you can log back in to your workspace.",
    newPassword: "New password",
    newPasswordPlaceholder: "Enter new password",
    confirmPassword: "Confirm new password",
    confirmPasswordPlaceholder: "Confirm new password",
    save: "Save new password",
    saving: "Saving password...",
    success:
      "Password updated successfully. You can now log in with your new password.",
    errorTitle: "Password reset failed",
    emptyError: "Please enter and confirm your new password.",
    matchError: "Passwords do not match.",
    passwordError: "Password must be at least 8 characters.",
    loginQuestion: "Already updated your password?",
    securityTitle: "Security note",
    securityText:
      "This page only works when opened from a valid password reset email link.",
    passwordRules: [
      "Use at least 8 characters",
      "Include uppercase and lowercase letters",
      "Include a number or symbol",
      "Avoid using old or common passwords",
    ],
  },

  id: {
    badge: "Create a new password",
    heroTitle: "Secure your Kolkap workspace.",
    heroText:
      "Buat password baru yang kuat sebelum kembali ke AI staff, inbox, leads, dan business dashboard Anda.",
    login: "Login",
    backToLogin: "Kembali ke login",
    pageBadge: "Reset Password",
    title: "Set a new password",
    subtitle:
      "Buat password baru untuk akun Kolkap Anda. Setelah disimpan, Anda bisa login kembali ke workspace.",
    newPassword: "Password baru",
    newPasswordPlaceholder: "Masukkan password baru",
    confirmPassword: "Konfirmasi password baru",
    confirmPasswordPlaceholder: "Konfirmasi password baru",
    save: "Simpan password baru",
    saving: "Menyimpan password...",
    success:
      "Password berhasil diperbarui. Anda sekarang bisa login dengan password baru.",
    errorTitle: "Reset password gagal",
    emptyError: "Mohon isi dan konfirmasi password baru Anda.",
    matchError: "Password tidak sama.",
    passwordError: "Password minimal 8 karakter.",
    loginQuestion: "Password sudah diperbarui?",
    securityTitle: "Security note",
    securityText:
      "Halaman ini hanya bekerja jika dibuka dari link reset password yang valid dari email.",
    passwordRules: [
      "Gunakan minimal 8 karakter",
      "Gunakan huruf besar dan huruf kecil",
      "Gunakan angka atau simbol",
      "Hindari password lama atau password umum",
    ],
  },

  zh: {
    badge: "Create a new password",
    heroTitle: "Secure your Kolkap workspace.",
    heroText: "请创建一个强密码，然后返回您的 AI staff、inbox、leads 和 business dashboard。",
    login: "登录",
    backToLogin: "返回登录",
    pageBadge: "Reset Password",
    title: "Set a new password",
    subtitle: "为您的 Kolkap 账户创建新密码。保存后，您可以用新密码登录 workspace。",
    newPassword: "新密码",
    newPasswordPlaceholder: "输入新密码",
    confirmPassword: "确认新密码",
    confirmPasswordPlaceholder: "确认新密码",
    save: "保存新密码",
    saving: "正在保存密码...",
    success: "密码已成功更新。您现在可以使用新密码登录。",
    errorTitle: "密码重置失败",
    emptyError: "请输入并确认您的新密码。",
    matchError: "两次输入的密码不一致。",
    passwordError: "密码至少需要 8 个字符。",
    loginQuestion: "已经更新密码？",
    securityTitle: "Security note",
    securityText: "此页面仅在通过有效的密码重置邮件链接打开时可用。",
    passwordRules: [
      "至少使用 8 个字符",
      "包含大写和小写字母",
      "包含数字或符号",
      "避免使用旧密码或常见密码",
    ],
  },

  ms: {
    badge: "Create a new password",
    heroTitle: "Secure your Kolkap workspace.",
    heroText:
      "Cipta password baru yang kuat sebelum kembali ke AI staff, inbox, leads, dan business dashboard anda.",
    login: "Login",
    backToLogin: "Kembali ke login",
    pageBadge: "Reset Password",
    title: "Set a new password",
    subtitle:
      "Cipta password baru untuk akaun Kolkap anda. Selepas disimpan, anda boleh login semula ke workspace.",
    newPassword: "Password baru",
    newPasswordPlaceholder: "Masukkan password baru",
    confirmPassword: "Sahkan password baru",
    confirmPasswordPlaceholder: "Sahkan password baru",
    save: "Simpan password baru",
    saving: "Menyimpan password...",
    success:
      "Password berjaya dikemaskini. Anda kini boleh login dengan password baru.",
    errorTitle: "Reset password gagal",
    emptyError: "Sila isi dan sahkan password baru anda.",
    matchError: "Password tidak sama.",
    passwordError: "Password mesti sekurang-kurangnya 8 karakter.",
    loginQuestion: "Password sudah dikemaskini?",
    securityTitle: "Security note",
    securityText:
      "Halaman ini hanya berfungsi jika dibuka dari link reset password yang sah dari email.",
    passwordRules: [
      "Gunakan sekurang-kurangnya 8 karakter",
      "Gunakan huruf besar dan huruf kecil",
      "Gunakan nombor atau simbol",
      "Elakkan password lama atau password umum",
    ],
  },
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!password.trim() || !confirmPassword.trim()) {
      setError(t.emptyError);
      return;
    }

    if (password.length < 8) {
      setError(t.passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.matchError);
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsSaving(false);
        return;
      }

      setMessage(t.success);
      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Something went wrong. Please try again."
      );
      setIsSaving(false);
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
              {t.passwordRules.map((rule) => (
                <div
                  key={rule}
                  className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-[#7CFF3D]" />
                  <p className="text-xl font-black">{rule}</p>
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
                  <LockKeyhole className="h-8 w-8" />
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

              <form onSubmit={handleResetPassword} className="space-y-6">
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.newPassword}
                  </span>

                  <div className="relative">
                    <KeyRound className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={t.newPasswordPlaceholder}
                      autoComplete="new-password"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] pl-14 pr-14 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-6 w-6" />
                      ) : (
                        <Eye className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.confirmPassword}
                  </span>

                  <div className="relative">
                    <KeyRound className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder={t.confirmPasswordPlaceholder}
                      autoComplete="new-password"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] pl-14 pr-14 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-6 w-6" />
                      ) : (
                        <Eye className="h-6 w-6" />
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
                  disabled={isSaving}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShieldCheck className="h-6 w-6" />
                  {isSaving ? t.saving : t.save}
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
                {t.passwordRules.map((rule) => (
                  <div
                    key={rule}
                    className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#07111F]" />

                    <p className="text-lg font-black leading-8">{rule}</p>
                  </div>
                ))}
              </div>

              <p className="mt-7 text-center text-lg font-semibold text-slate-600">
                {t.loginQuestion}{" "}
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