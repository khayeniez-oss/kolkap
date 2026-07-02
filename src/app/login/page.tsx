"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Eye,
  EyeOff,
  Inbox,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ensureKolkapWorkspace } from "@/lib/kolkapWorkspace";

type SupabaseClientType = ReturnType<typeof createClient>;

type WorkspaceLoginRow = {
  id?: string | null;
  plan_key?: string | null;
  plan_status?: string | null;
  billing_status?: string | null;
  stripe_subscription_id?: string | null;
  trial_activated_at?: string | null;
  billing_started_at?: string | null;
  subscription_cancel_at?: string | null;
  subscription_cancelled_at?: string | null;
};

const BLOCKED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "inactive",
  "incomplete_expired",
  "expired",
]);

function normalizeStatus(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizePlanKey(value: unknown) {
  const plan = String(value || "starter").toLowerCase();

  if (
    plan === "starter" ||
    plan === "growth" ||
    plan === "professional" ||
    plan === "business"
  ) {
    return plan;
  }

  return "starter";
}

function hasActiveTrialOrPlan(workspace: WorkspaceLoginRow | null) {
  if (!workspace) return false;

  const planStatus = normalizeStatus(workspace.plan_status);
  const billingStatus = normalizeStatus(workspace.billing_status);

  if (BLOCKED_STATUSES.has(planStatus) || BLOCKED_STATUSES.has(billingStatus)) {
    return false;
  }

  const hasRealStripeSubscription = Boolean(
    workspace.stripe_subscription_id && !workspace.subscription_cancelled_at
  );

  const hasActivatedTrial = Boolean(
    workspace.trial_activated_at && !workspace.subscription_cancelled_at
  );

  const hasStartedBilling = Boolean(
    workspace.billing_started_at && !workspace.subscription_cancelled_at
  );

  return hasRealStripeSubscription || hasActivatedTrial || hasStartedBilling;
}

function isSafeNextPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

async function checkAdminAccess(accessToken?: string | null) {
  if (!accessToken) return false;

  try {
    const response = await fetch("/api/admin/access", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json().catch(() => ({}));

    return Boolean(response.ok && result.success && result.isAdmin);
  } catch (error) {
    console.error("Login admin access check failed:", error);
    return false;
  }
}

async function findActiveTeamWorkspace({
  supabase,
  userEmail,
}: {
  supabase: SupabaseClientType;
  userEmail?: string | null;
}) {
  if (!userEmail) return null;

  const selectFields =
    "id, plan_key, plan_status, billing_status, stripe_subscription_id, trial_activated_at, billing_started_at, subscription_cancel_at, subscription_cancelled_at";

  const { data: teamMember } = await supabase
    .from("workspace_team_members")
    .select("workspace_id")
    .eq("email", userEmail.toLowerCase())
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!teamMember?.workspace_id) {
    return null;
  }

  const { data: teamWorkspace } = await supabase
    .from("business_workspaces")
    .select(selectFields)
    .eq("id", teamMember.workspace_id)
    .maybeSingle();

  return (teamWorkspace ?? null) as WorkspaceLoginRow | null;
}

async function findWorkspaceAfterLogin({
  supabase,
  userId,
  userEmail,
}: {
  supabase: SupabaseClientType;
  userId: string;
  userEmail?: string | null;
}) {
  const selectFields =
    "id, plan_key, plan_status, billing_status, stripe_subscription_id, trial_activated_at, billing_started_at, subscription_cancel_at, subscription_cancelled_at";

  const { data: ownedWorkspaces } = await supabase
    .from("business_workspaces")
    .select(selectFields)
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });

  const ownedRows = (ownedWorkspaces ?? []) as WorkspaceLoginRow[];
  const activeOwnedWorkspace = ownedRows.find((workspace) =>
    hasActiveTrialOrPlan(workspace)
  );

  if (activeOwnedWorkspace?.id) {
    return activeOwnedWorkspace;
  }

  const teamWorkspace = await findActiveTeamWorkspace({
    supabase,
    userEmail,
  });

  if (teamWorkspace?.id && hasActiveTrialOrPlan(teamWorkspace)) {
    return teamWorkspace;
  }

  if (ownedRows[0]?.id) {
    return ownedRows[0];
  }

  return teamWorkspace;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawNextPath = searchParams.get("next") || "/dashboard";
  const nextPath = isSafeNextPath(rawNextPath) ? rawNextPath : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPlan, setIsCheckingPlan] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setIsCheckingPlan(false);

    try {
      const supabase = createClient();

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setIsSubmitting(false);
        return;
      }

      const user = data.user;
      const accessToken = data.session?.access_token || "";

      if (!user?.id || !accessToken) {
        setError("Login session could not be created. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setIsCheckingPlan(true);

      const isAdmin = await checkAdminAccess(accessToken);

      if (isAdmin) {
        const adminRedirectPath = nextPath.startsWith("/admin")
          ? nextPath
          : "/admin";

        setMessage("Admin login successful. Redirecting...");
        router.replace(adminRedirectPath);
        router.refresh();
        return;
      }

      let workspace = await findWorkspaceAfterLogin({
        supabase,
        userId: user.id,
        userEmail: user.email,
      });

      if (!workspace?.id) {
        await ensureKolkapWorkspace(supabase);

        workspace = await findWorkspaceAfterLogin({
          supabase,
          userId: user.id,
          userEmail: user.email,
        });
      }

      const planKey = normalizePlanKey(workspace?.plan_key);
      const hasAccess = hasActiveTrialOrPlan(workspace);

      const redirectPath = hasAccess
        ? nextPath
        : `/dashboard/activate-trial?plan=${planKey}`;

      setMessage("Login successful. Redirecting...");
      router.replace(redirectPath);
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
      setIsCheckingPlan(false);
    }
  }

  const buttonText = isCheckingPlan
    ? "Checking your access..."
    : isSubmitting
      ? "Logging in..."
      : "Log In";

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto grid min-h-[calc(100vh-160px)] max-w-7xl items-center gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-14">
        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Welcome Back
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Continue managing your AI staff.
          </h1>

          <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
            Log in to manage your AI staff, customer replies, credits, usage,
            inbox, leads, billing, and business settings.
          </p>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Bot className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">Your AI staff workspace</h2>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              Your dashboard helps you create AI staff, add business knowledge,
              test replies, track usage, monitor credits, manage inbox
              conversations, and go live when ready.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <FeaturePoint
                icon={<Bot className="h-5 w-5" />}
                text="Manage AI staff"
              />

              <FeaturePoint
                icon={<BarChart3 className="h-5 w-5" />}
                text="Track credits and usage"
              />

              <FeaturePoint
                icon={<Inbox className="h-5 w-5" />}
                text="Review inbox replies"
              />
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">
              Private business dashboard
            </h2>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              Only logged-in business owners and team members can access this
              workspace.
            </p>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <form onSubmit={handleLogin} className="grid gap-5">
            <div className="mb-2">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Welcome Back
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                Log In
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                Log in to manage your AI staff, customer replies, credits,
                usage, inbox, leads, billing, and business settings.
              </p>
            </div>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <Mail className="h-5 w-5 text-slate-400" />
                Email address
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@business.com"
                autoComplete="email"
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <LockKeyhole className="h-5 w-5 text-slate-400" />
                Password
              </span>

              <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 transition focus-within:border-blue-500 focus-within:bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
                <p className="text-base font-black">Login failed</p>
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
              {buttonText}
              <ArrowRight className="h-6 w-6" />
            </button>

            <div className="flex flex-col gap-3 text-center text-base font-black text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/forgot-password" className="text-blue-600">
                Forgot password?
              </Link>

              <p>
                Don’t have an account?{" "}
                <Link href="/signup?plan=starter" className="text-blue-600">
                  Start Free Trial
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function FeaturePoint({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#07111F]">
        {icon}
      </div>

      <p className="text-sm font-black leading-5 text-white">{text}</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
          <div className="mx-auto max-w-7xl rounded-[2.2rem] bg-white p-8 text-xl font-black">
            Loading login...
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}