"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";

const translations = {
  en: {
    title: "Logging you out...",
    subtitle: "Please wait while Kolkap safely signs you out.",
    safety: "Your business workspace session is being closed securely.",
  },

  id: {
    title: "Sedang logout...",
    subtitle: "Mohon tunggu sebentar saat Kolkap mengeluarkan Anda dengan aman.",
    safety: "Session business workspace Anda sedang ditutup dengan aman.",
  },

  zh: {
    title: "正在登出...",
    subtitle: "请稍等，Kolkap 正在安全地退出您的账户。",
    safety: "您的 business workspace session 正在安全关闭。",
  },

  ms: {
    title: "Sedang logout...",
    subtitle: "Sila tunggu sebentar sementara Kolkap logout akaun anda dengan selamat.",
    safety: "Session business workspace anda sedang ditutup dengan selamat.",
  },
};

export default function LogoutPage() {
  const router = useRouter();
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    async function logout() {
      const supabase = createClient();

      await supabase.auth.signOut();

      router.replace("/login");
      router.refresh();
    }

    logout();
  }, [router]);

  return (
    <main className="flex min-h-[calc(100vh-160px)] items-center justify-center bg-[#F7F9FA] px-5 text-[#07111F]">
      <div className="w-full max-w-xl rounded-[2.2rem] border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-900/5 sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          <LogOut className="h-8 w-8" />
        </div>

        <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">
          {t.title}
        </h1>

        <p className="mt-4 text-xl font-semibold leading-8 text-slate-600">
          {t.subtitle}
        </p>

        <div className="mt-7 rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-4 text-left">
            <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-blue-700" />

            <p className="text-lg font-black leading-8 text-blue-950">
              {t.safety}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}