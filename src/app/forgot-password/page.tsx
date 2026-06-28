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
import { createClient } from "@/lib/supabase/client";

const recoverySteps = [
  "Enter your registered email address",
  "Kolkap sends a secure reset link",
  "Create a new password",
  "Log back in to your workspace",
];

const safetyNotes = [
  "Reset links expire for security",
  "Your workspace data stays protected",
  "You can log in again after changing password",
];

export default function ForgotPasswordPage() {
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
      setError("Please enter your email address.");
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

      setMessage(
        "Password reset link sent. Please check your email and follow the secure link."
      );
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
                Secure account recovery
              </div>

              <h1 className="text-6xl font-black leading-[1.02] tracking-[-0.06em]">
                Get back into your Kolkap workspace.
              </h1>

              <p className="mt-7 text-2xl font-semibold leading-10 text-slate-300">
                Reset your password securely and return to managing your AI
                staff, conversations, leads, credits, usage, and content.
              </p>
            </div>

            <div className="grid gap-4">
              {recoverySteps.map((step, index) => (
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
                  <KeyRound className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Password Reset
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#07111F] sm:text-5xl">
                  Forgot your password?
                </h2>

                <p className="mt-4 text-xl font-semibold leading-8 text-slate-600">
                  Enter your email address and we’ll send you a secure link to
                  reset your password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    Email address
                  </span>

                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@business.com"
                      autoComplete="email"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] pl-14 pr-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </label>

                {error ? (
                  <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                    <p className="text-base font-black">
                      Reset link could not be sent
                    </p>
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
                  {isSending ? "Sending reset link..." : "Send reset link"}
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
                      The reset link only works for the email registered to your
                      Kolkap account. For security, reset links expire.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                {safetyNotes.map((item) => (
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
                Remember your password?{" "}
                <Link href="/login" className="font-black text-blue-600">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}