import Link from "next/link";
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

const passwordRules = [
  "Use at least 8 characters",
  "Include uppercase and lowercase letters",
  "Include a number or symbol",
  "Avoid using old or common passwords",
];

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[#05070A] p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(37,99,255,0.35),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(124,255,61,0.16),transparent_30%),linear-gradient(135deg,#05070A_0%,#07111F_100%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <KolkapLogo size="md" lightText />

            <div className="max-w-xl">
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
                Create a new password
              </div>

              <h1 className="text-6xl font-black leading-[1.02] tracking-[-0.06em]">
                Secure your Kolkap workspace.
              </h1>

              <p className="mt-7 text-2xl font-semibold leading-10 text-slate-300">
                Choose a strong new password before returning to your AI staff,
                inbox, leads, and business dashboard.
              </p>
            </div>

            <div className="grid gap-4">
              {passwordRules.map((rule) => (
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
                Login
              </Link>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 lg:p-10">
              <Link
                href="/login"
                className="mb-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to login
              </Link>

              <div className="mb-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <LockKeyhole className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Reset Password
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#07111F] sm:text-5xl">
                  Set a new password
                </h2>

                <p className="mt-4 text-xl font-semibold leading-8 text-slate-600">
                  Create a new password for your Kolkap account. After saving,
                  you can log back in to your workspace.
                </p>
              </div>

              <form className="space-y-6">
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    New password
                  </span>

                  <div className="relative">
                    <KeyRound className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] pl-14 pr-14 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                    <EyeOff className="absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    Confirm new password
                  </span>

                  <div className="relative">
                    <KeyRound className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] pl-14 pr-14 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                    <Eye className="absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
                >
                  <ShieldCheck className="h-6 w-6" />
                  Save new password
                </button>
              </form>

              <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-blue-700" />
                  <div>
                    <p className="text-xl font-black text-blue-950">
                      Security note
                    </p>
                    <p className="mt-2 text-lg font-semibold leading-8 text-blue-800">
                      Later this page will connect to Supabase Auth and only
                      work when the reset link is valid.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                {passwordRules.map((rule) => (
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
                Already updated your password?{" "}
                <Link href="/login" className="font-black text-blue-600">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}