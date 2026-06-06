"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { ensureKolkapWorkspace } from "@/lib/kolkapWorkspace";

const translations = {
  en: {
    badge: "Start Now",
    title: "Create your AI staff. Start now.",
    subtitle:
      "Set up your AI staff for 24/7 automated responses. Set up your AI, test replies, and deploy when ready.",
    trialTitle: "7-day free trial",
    trialText:
      "Payment method needed to activate your trial. You won’t be charged today.",
    billingNote:
      "Monthly billing starts after your 7-day trial unless cancelled before the trial ends.",
    noChargeToday: "No charge today",
    creditsIncluded: "Trial credits included",
    aiSetup: "AI staff setup included",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    email: "Email address",
    emailPlaceholder: "you@business.com",
    businessType: "Business type",
    password: "Password",
    passwordPlaceholder: "Create a password",
    createAccount: "Start Free Trial",
    creating: "Creating account...",
    alreadyHaveAccount: "Already have an account?",
    login: "Log in",
    errorTitle: "Signup failed",
    emptyError: "Please complete all required fields.",
    passwordError: "Password must be at least 6 characters.",
    success: "Account created successfully. Redirecting to your dashboard...",
    confirmEmail:
      "Account created. Please check your email to confirm your account before logging in.",
    noteTitle: "What happens after signup?",
    noteText:
      "You will be directed to your dashboard to create your AI staff, add your business knowledge, test replies, go live, and so much more.",
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
    badge: "Start Now",
    title: "Create your AI staff. Start now.",
    subtitle:
      "Set up your AI staff for 24/7 automated responses. Set up your AI, test replies, and deploy when ready.",
    trialTitle: "7-day free trial",
    trialText:
      "Payment method needed to activate your trial. You won’t be charged today.",
    billingNote:
      "Monthly billing akan berjalan setelah 7-day trial kecuali dibatalkan sebelum trial selesai.",
    noChargeToday: "No charge today",
    creditsIncluded: "Trial credits included",
    aiSetup: "AI staff setup included",
    fullName: "Nama lengkap",
    fullNamePlaceholder: "Nama Anda",
    email: "Alamat email",
    emailPlaceholder: "anda@bisnis.com",
    businessType: "Jenis bisnis",
    password: "Password",
    passwordPlaceholder: "Buat password",
    createAccount: "Start Free Trial",
    creating: "Sedang membuat akun...",
    alreadyHaveAccount: "Sudah punya akun?",
    login: "Login",
    errorTitle: "Signup gagal",
    emptyError: "Mohon lengkapi semua field yang dibutuhkan.",
    passwordError: "Password minimal 6 karakter.",
    success: "Akun berhasil dibuat. Mengarahkan ke dashboard Anda...",
    confirmEmail:
      "Akun berhasil dibuat. Silakan cek email Anda untuk konfirmasi sebelum login.",
    noteTitle: "What happens after signup?",
    noteText:
      "You will be directed to your dashboard to create your AI staff, add your business knowledge, test replies, go live, and so much more.",
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
};

function SignupContent() {
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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState(t.businessTypes[0]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
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
            trial_intent: true,
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
              <CreditCard className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">{t.trialTitle}</h2>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              {t.trialText}
            </p>

            <p className="mt-3 text-base font-bold leading-7 text-slate-400">
              {t.billingNote}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <TrialPoint
                icon={<ShieldCheck className="h-5 w-5" />}
                text={t.noChargeToday}
              />

              <TrialPoint
                icon={<Zap className="h-5 w-5" />}
                text={t.creditsIncluded}
              />

              <TrialPoint
                icon={<Sparkles className="h-5 w-5" />}
                text={t.aiSetup}
              />
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">{t.noteTitle}</h2>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              {t.noteText}
            </p>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <form onSubmit={handleSignup} className="grid gap-5">
            <div className="mb-2">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.badge}
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.createAccount}
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                {t.trialText}
              </p>
            </div>

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

            <p className="text-center text-sm font-bold leading-6 text-slate-500">
              {t.billingNote}
            </p>

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

function TrialPoint({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#07111F]">
        {icon}
      </div>

      <p className="text-sm font-black leading-5 text-white">{text}</p>
    </div>
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