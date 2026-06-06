"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Loader2,
  LockKeyhole,
  Phone,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AcceptState =
  | "checking"
  | "setup"
  | "activating"
  | "success"
  | "error";

export default function TeamAcceptPage() {
  const router = useRouter();

  const [state, setState] = useState<AcceptState>("checking");
  const [message, setMessage] = useState("Checking your team invitation...");
  const [error, setError] = useState("");

  const [invitedEmail, setInvitedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function prepareInvite() {
      setState("checking");
      setMessage("Checking your team invitation...");
      setError("");

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
          setState("error");
          setError(exchangeError.message);
          return;
        }

        window.history.replaceState({}, document.title, "/team/accept");
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          if (!isMounted) return;
          setState("error");
          setError(sessionError.message);
          return;
        }

        window.history.replaceState({}, document.title, "/team/accept");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (userError || !user) {
        setState("error");
        setError(
          "This invitation link could not create a session. Please ask the workspace owner to send a new invitation and open the newest invite email."
        );
        return;
      }

      setInvitedEmail(user.email || "");
      setState("setup");
      setMessage(
        `Invitation verified for ${user.email}. Set your password and phone number to finish joining the workspace.`
      );
    }

    prepareInvite();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleJoinWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Please add your phone number.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();

    const { error: passwordError } = await supabase.auth.updateUser({
      password,
      data: {
        phone_number: phoneNumber.trim(),
      },
    });

    if (passwordError) {
      setError(passwordError.message);
      setIsSubmitting(false);
      return;
    }

    setState("activating");
    setMessage("Activating your workspace access...");

    const response = await fetch("/api/team/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: phoneNumber.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setState("error");
      setError(result.error || "Team invitation could not be accepted.");
      setIsSubmitting(false);
      return;
    }

    setState("success");
    setMessage("Your team invitation has been accepted.");
    setIsSubmitting(false);

    window.setTimeout(() => {
      router.push("/dashboard");
    }, 1400);
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            {state === "checking" || state === "activating" ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : state === "success" ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : state === "error" ? (
              <CircleAlert className="h-8 w-8" />
            ) : (
              <UsersRound className="h-8 w-8" />
            )}
          </div>

          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Team Invitation
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            {state === "checking"
              ? "Checking your invitation..."
              : state === "setup"
                ? "Finish setting up your access."
                : state === "activating"
                  ? "Activating your access..."
                  : state === "success"
                    ? "Welcome to the workspace."
                    : "Invitation could not be accepted."}
          </h1>

          <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
            {state === "error" ? error : message}
          </p>

          {state === "setup" ? (
            <form onSubmit={handleJoinWorkspace} className="mt-8 grid gap-5">
              <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                  Invited Email
                </p>
                <p className="mt-2 text-xl font-black">{invitedEmail}</p>
              </div>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Password
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5">
                  <LockKeyhole className="h-5 w-5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create your password"
                    className="h-14 w-full bg-transparent text-lg font-semibold outline-none"
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Phone Number
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5">
                  <Phone className="h-5 w-5 text-slate-500" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="+62..."
                    className="h-14 w-full bg-transparent text-lg font-semibold outline-none"
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-base font-black text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-base font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <KeyRound className="h-5 w-5" />
                {isSubmitting
                  ? "Joining workspace..."
                  : "Set Password & Join Workspace"}
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          ) : null}

          {state === "checking" || state === "activating" ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-base font-black text-slate-600">
              Please keep this page open.
            </div>
          ) : null}

          {state === "success" ? (
            <div className="mt-8 rounded-3xl border border-green-200 bg-green-50 p-5 text-base font-black text-green-800">
              Redirecting you to the dashboard...
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}