"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
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
import { createClient } from "@/lib/supabase/client";

const passwordRules = [
  "Use at least 8 characters",
  "Include uppercase and lowercase letters",
  "Include a number or symbol",
  "Avoid using old or common passwords",
];

export default function ResetPasswordPage() {
  const router = useRouter();

  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [linkError, setLinkError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function prepareResetSession() {
      setIsCheckingLink(true);
      setLinkError("");

      const supabase = createClient();

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      const hashParams = new URLSearchParams(
        window.location.hash.replace("#", "")
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          if (!isMounted) return;

          setLinkError(exchangeError.message);
          setIsCheckingLink(false);
          return;
        }

        window.history.replaceState({}, document.title, "/reset-password");
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          if (!isMounted) return;

          setLinkError(sessionError.message);
          setIsCheckingLink(false);
          return;
        }

        window.history.replaceState({}, document.title, "/reset-password");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (userError || !user) {
        setLinkError(
          "This reset link is not active. Please request a new password reset email and open the newest link."
        );
      }

      setIsCheckingLink(false);
    }

    prepareResetSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (linkError) {
      setError(linkError);
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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

      setMessage(
        "Password updated successfully. You can now log in with your new password."
      );
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

              {isCheckingLink ? (
                <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
                  <p className="text-base font-black">
                    Checking your reset link...
                  </p>
                  <p className="mt-1 text-base font-semibold leading-7">
                    Please keep this page open while Kolkap verifies your secure
                    reset session.
                  </p>
                </div>
              ) : null}

              {linkError ? (
                <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                  <p className="text-base font-black">
                    Reset link is not active
                  </p>
                  <p className="mt-1 text-base font-semibold leading-7">
                    {linkError}
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    New password
                  </span>

                  <div className="relative">
                    <KeyRound className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      disabled={isCheckingLink || Boolean(linkError)}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] pl-14 pr-14 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
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
                    Confirm new password
                  </span>

                  <div className="relative">
                    <KeyRound className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      disabled={isCheckingLink || Boolean(linkError)}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] pl-14 pr-14 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
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
                    <p className="text-base font-black">Password reset failed</p>
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
                  disabled={isSaving || isCheckingLink || Boolean(linkError)}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShieldCheck className="h-6 w-6" />
                  {isSaving ? "Saving password..." : "Save new password"}
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
                      This page only works when opened from a valid password
                      reset email link.
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