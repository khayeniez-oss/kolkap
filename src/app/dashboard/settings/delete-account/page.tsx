"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type DeleteAccountTranslation = {
  back: string;
  badge: string;
  title: string;
  subtitle: string;
  warningTitle: string;
  warningText: string;
  whatDeletesTitle: string;
  whatDeletes: string[];
  confirmationTitle: string;
  confirmationText: string;
  inputLabel: string;
  inputPlaceholder: string;
  button: string;
  deleting: string;
  errorTitle: string;
  errorFallback: string;
  successTitle: string;
  successText: string;
};

const supportedLanguages: SupportedLanguage[] = ["en", "id", "zh", "ms"];

const translations: Record<SupportedLanguage, DeleteAccountTranslation> = {
  en: {
    back: "Back to Settings",
    badge: "Account Deletion",
    title: "Delete your Kolkap account",
    subtitle:
      "You can permanently delete your Kolkap account and workspace data from here. This action cannot be undone.",
    warningTitle: "This is permanent",
    warningText:
      "After deletion, you will lose access to your Kolkap workspace, AI staff, business knowledge, conversations, leads, usage records, and billing access.",
    whatDeletesTitle: "What will be deleted",
    whatDeletes: [
      "Your Kolkap account access",
      "Your business workspace",
      "Your AI staff setup",
      "Your saved business knowledge",
      "Your conversations and leads",
      "Your usage and credit records",
    ],
    confirmationTitle: "Confirm account deletion",
    confirmationText:
      "To continue, type DELETE below. This helps prevent accidental account deletion.",
    inputLabel: "Type DELETE to confirm",
    inputPlaceholder: "DELETE",
    button: "Delete my account",
    deleting: "Deleting account...",
    errorTitle: "Account deletion failed",
    errorFallback:
      "We could not delete your account right now. Please try again or contact Kolkap support.",
    successTitle: "Account deletion started",
    successText:
      "Your account deletion request has been received. You will be signed out.",
  },

  id: {
    back: "Kembali ke Settings",
    badge: "Account Deletion",
    title: "Hapus akun Kolkap Anda",
    subtitle:
      "Anda dapat menghapus akun Kolkap dan workspace data secara permanen dari sini. Aksi ini tidak bisa dibatalkan.",
    warningTitle: "Ini permanen",
    warningText:
      "Setelah dihapus, Anda akan kehilangan akses ke Kolkap workspace, AI staff, business knowledge, conversations, leads, usage records, dan billing access.",
    whatDeletesTitle: "Yang akan dihapus",
    whatDeletes: [
      "Akses akun Kolkap Anda",
      "Business workspace Anda",
      "Setup AI staff Anda",
      "Business knowledge yang tersimpan",
      "Conversations dan leads Anda",
      "Usage dan credit records Anda",
    ],
    confirmationTitle: "Konfirmasi penghapusan akun",
    confirmationText:
      "Untuk melanjutkan, ketik DELETE di bawah. Ini membantu mencegah penghapusan akun secara tidak sengaja.",
    inputLabel: "Ketik DELETE untuk konfirmasi",
    inputPlaceholder: "DELETE",
    button: "Hapus akun saya",
    deleting: "Menghapus akun...",
    errorTitle: "Penghapusan akun gagal",
    errorFallback:
      "Kami belum bisa menghapus akun Anda sekarang. Silakan coba lagi atau hubungi Kolkap support.",
    successTitle: "Penghapusan akun dimulai",
    successText:
      "Permintaan penghapusan akun Anda telah diterima. Anda akan keluar dari akun.",
  },

  zh: {
    back: "返回设置",
    badge: "账户删除",
    title: "删除您的 Kolkap 账户",
    subtitle:
      "您可以在这里永久删除 Kolkap 账户和 workspace 数据。此操作无法撤销。",
    warningTitle: "此操作是永久性的",
    warningText:
      "删除后，您将无法访问 Kolkap workspace、AI 员工、业务知识、对话、leads、usage records 和 billing access。",
    whatDeletesTitle: "将被删除的内容",
    whatDeletes: [
      "您的 Kolkap 账户访问权限",
      "您的 business workspace",
      "您的 AI 员工设置",
      "已保存的业务知识",
      "您的 conversations 和 leads",
      "您的 usage 和 credit records",
    ],
    confirmationTitle: "确认删除账户",
    confirmationText:
      "如需继续，请在下方输入 DELETE。这可以避免误删账户。",
    inputLabel: "输入 DELETE 以确认",
    inputPlaceholder: "DELETE",
    button: "删除我的账户",
    deleting: "正在删除账户...",
    errorTitle: "账户删除失败",
    errorFallback:
      "目前无法删除您的账户。请重试或联系 Kolkap support。",
    successTitle: "账户删除已开始",
    successText:
      "我们已收到您的账户删除请求。您将被退出登录。",
  },

  ms: {
    back: "Kembali ke Settings",
    badge: "Account Deletion",
    title: "Padam akaun Kolkap anda",
    subtitle:
      "Anda boleh memadam akaun Kolkap dan workspace data secara kekal dari sini. Tindakan ini tidak boleh dibatalkan.",
    warningTitle: "Ini kekal",
    warningText:
      "Selepas dipadam, anda akan kehilangan akses kepada Kolkap workspace, AI staff, business knowledge, conversations, leads, usage records, dan billing access.",
    whatDeletesTitle: "Apa yang akan dipadam",
    whatDeletes: [
      "Akses akaun Kolkap anda",
      "Business workspace anda",
      "Setup AI staff anda",
      "Business knowledge yang disimpan",
      "Conversations dan leads anda",
      "Usage dan credit records anda",
    ],
    confirmationTitle: "Sahkan pemadaman akaun",
    confirmationText:
      "Untuk teruskan, taip DELETE di bawah. Ini membantu mengelakkan pemadaman akaun secara tidak sengaja.",
    inputLabel: "Taip DELETE untuk sahkan",
    inputPlaceholder: "DELETE",
    button: "Padam akaun saya",
    deleting: "Memadam akaun...",
    errorTitle: "Pemadaman akaun gagal",
    errorFallback:
      "Kami tidak dapat memadam akaun anda sekarang. Sila cuba lagi atau hubungi Kolkap support.",
    successTitle: "Pemadaman akaun dimulakan",
    successText:
      "Permintaan pemadaman akaun anda telah diterima. Anda akan dilog keluar.",
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : "en";
}

export default function DeleteAccountPage() {
  const router = useRouter();
  const { language } = useKolkapLanguage();
  const lang = getSupportedLanguage(language);
  const t = translations[lang];

  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canDelete = confirmation.trim().toUpperCase() === "DELETE";

  async function handleDeleteAccount() {
    if (!canDelete || isDeleting) return;

    setError("");
    setSuccess(false);
    setIsDeleting(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation: "DELETE",
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || t.errorFallback);
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/logout");
      }, 1200);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t.errorFallback);
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-black text-[#07111F] shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-5 w-5" />
          {t.back}
        </Link>

        <div className="mt-8 rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-red-300/20 bg-red-500/10 px-5 py-3 text-lg font-black text-red-200">
            <ShieldAlert className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm shadow-red-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h2 className="text-3xl font-black tracking-[-0.04em] text-red-950">
              {t.warningTitle}
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-red-900">
              {t.warningText}
            </p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <h2 className="text-3xl font-black tracking-[-0.04em]">
              {t.whatDeletesTitle}
            </h2>

            <div className="mt-6 grid gap-3">
              {t.whatDeletes.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-4"
                >
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#07111F]" />
                  <p className="text-base font-black leading-7 text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-red-300">
            <Trash2 className="h-8 w-8" />
          </div>

          <h2 className="text-3xl font-black tracking-[-0.04em]">
            {t.confirmationTitle}
          </h2>

          <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
            {t.confirmationText}
          </p>

          <div className="mt-7">
            <label className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              {t.inputLabel}
            </label>

            <input
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setError("");
              }}
              placeholder={t.inputPlaceholder}
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-black text-[#07111F] outline-none transition focus:border-[#07111F] focus:bg-white"
            />
          </div>

          {error ? (
            <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-900">
              <p className="text-base font-black">{t.errorTitle}</p>
              <p className="mt-2 text-sm font-bold leading-6">{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-900">
              <p className="text-base font-black">{t.successTitle}</p>
              <p className="mt-2 text-sm font-bold leading-6">{t.successText}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={!canDelete || isDeleting || success}
            className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-red-600 px-8 py-5 text-xl font-black text-white shadow-xl shadow-red-900/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isDeleting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Trash2 className="h-6 w-6" />
            )}
            {isDeleting ? t.deleting : t.button}
          </button>
        </section>
      </section>
    </main>
  );
}