"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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
import {
  getKolkapPlan,
  KOLKAP_PRICE_NOTE,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";
import { createClient } from "@/lib/supabase/client";
import { ensureKolkapWorkspace } from "@/lib/kolkapWorkspace";

type BillablePlanKey = "starter" | "growth" | "professional" | "business";

const BUSINESS_TYPES = [
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
  "Education / Training Centre",
  "Agency / Marketing",
  "Legal / Accounting",
  "Construction / Interior Design",
  "Automotive",
  "Cleaning / Maintenance",
  "Events / Wedding",
  "Retail Store",
  "Professional Services",
  "Other",
];

function normalizePlanKey(value: string | null): BillablePlanKey {
  if (
    value === "starter" ||
    value === "growth" ||
    value === "professional" ||
    value === "business"
  ) {
    return value;
  }

  return "starter";
}

function getPlanKeyFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams>
): BillablePlanKey {
  const directPlanKey = normalizePlanKey(searchParams.get("plan"));

  if (searchParams.get("plan")) {
    return directPlanKey;
  }

  const nextPath = searchParams.get("next");

  if (nextPath) {
    try {
      const fakeUrl = new URL(nextPath, "https://kolkap.local");
      return normalizePlanKey(fakeUrl.searchParams.get("plan"));
    } catch {
      return "starter";
    }
  }

  return "starter";
}

function getPlanPriceLine(planKey: KolkapPlanKey) {
  const plan = getKolkapPlan(planKey);

  if (plan.monthlyPriceAud === null) {
    return "Custom pricing";
  }

  return `A$${plan.monthlyPriceAud}/month incl. GST after trial`;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function SignupContent() {
  const searchParams = useSearchParams();

  const planKey = getPlanKeyFromSearchParams(searchParams);
  const selectedPlan = getKolkapPlan(planKey);
  const activateTrialPath = `/dashboard/activate-trial?plan=${planKey}`;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isExistingUser = Boolean(existingUserId);

  useEffect(() => {
    let isMounted = true;

    async function loadExistingAccount() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (userError || !user) {
          setIsCheckingSession(false);
          return;
        }

        const metadataName = cleanText(user.user_metadata?.full_name);
        const metadataBusinessType = cleanText(
          user.user_metadata?.business_type
        );

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        const { data: workspace } = await supabase
          .from("business_workspaces")
          .select("business_name, business_type")
          .eq("owner_user_id", user.id)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        const profileName = cleanText(profile?.full_name);
        const workspaceBusinessType = cleanText(workspace?.business_type);

        setExistingUserId(user.id);
        setEmail(user.email || "");
        setFullName(profileName || metadataName);
        setBusinessType(
          workspaceBusinessType ||
            metadataBusinessType ||
            BUSINESS_TYPES[0]
        );
      } catch (sessionError) {
        console.error("Unable to load existing signup session:", sessionError);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    void loadExistingAccount();

    return () => {
      isMounted = false;
    };
  }, []);

  async function openSecureCheckout(selectedPlanKey: BillablePlanKey) {
    const response = await fetch("/api/billing/start-trial", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planKey: selectedPlanKey,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result?.url) {
      throw new Error(
        result?.error || "Unable to open secure checkout. Please try again."
      );
    }

    window.location.assign(result.url);
  }

  async function continueExistingAccount() {
    const cleanName = fullName.trim();

    if (!cleanName || !businessType) {
      throw new Error("Please complete your name and business type.");
    }

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user?.id) {
      throw new Error(
        "Your login session has expired. Please log in again to continue."
      );
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        full_name: cleanName,
        business_type: businessType,
        trial_intent: true,
        selected_plan: planKey,
      },
    });

    if (metadataError) {
      throw metadataError;
    }

    const workspace = await ensureKolkapWorkspace(supabase);

    if (!workspace?.id) {
      throw new Error("Your Kolkap workspace could not be prepared.");
    }

    const { error: workspaceUpdateError } = await supabase
      .from("business_workspaces")
      .update({
        business_name: cleanName
          ? `${cleanName}'s Business`
          : workspace.business_name,
        business_type: businessType,
        business_email: user.email || workspace.business_email,
        plan_key: planKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspace.id)
      .eq("owner_user_id", user.id);

    if (workspaceUpdateError) {
      throw workspaceUpdateError;
    }

    setMessage("Account found. Opening secure checkout...");
    setIsOpeningCheckout(true);

    await openSecureCheckout(planKey);
  }

  async function createNewAccount() {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !businessType || !password.trim()) {
      throw new Error("Please complete all required fields.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const supabase = createClient();

    const { data, error: signupError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          business_type: businessType,
          trial_intent: true,
          selected_plan: planKey,
        },
      },
    });

    if (signupError) {
      const message = signupError.message.toLowerCase();

      if (
        message.includes("already registered") ||
        message.includes("already exists")
      ) {
        throw new Error(
          "An account already exists with this email. Log in to continue your free trial setup."
        );
      }

      throw signupError;
    }

    if (!data.session) {
      setMessage(
        "Account created. Please check your email to confirm your account, then log in to continue your free trial setup."
      );
      setIsSubmitting(false);
      return;
    }

    await ensureKolkapWorkspace(supabase);

    setMessage("Account created. Opening secure checkout...");
    setIsOpeningCheckout(true);

    await openSecureCheckout(planKey);
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      if (isExistingUser) {
        await continueExistingAccount();
      } else {
        await createNewAccount();
      }
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : "Something went wrong. Please try again."
      );
      setIsOpeningCheckout(false);
      setIsSubmitting(false);
    }
  }

  const buttonText = isCheckingSession
    ? "Checking your account..."
    : isOpeningCheckout
      ? "Opening secure checkout..."
      : isSubmitting
        ? isExistingUser
          ? "Preparing your trial..."
          : "Creating account..."
        : isExistingUser
          ? "Continue Free Trial"
          : "Start Free Trial";

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto grid min-h-[calc(100vh-160px)] max-w-7xl items-center gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-14">
        <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Start Now
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Create your AI staff. Start your 7-day trial.
          </h1>

          <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
            Create your account, add a payment method, and start setting up your
            AI staff for customer replies, content, leads, and support.
          </p>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <CreditCard className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">7-day free trial</h2>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              Payment method needed to activate your trial. You will not be
              charged today.
            </p>

            <p className="mt-3 text-base font-bold leading-7 text-slate-400">
              Monthly billing starts automatically after your trial unless
              cancelled before the trial ends.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <TrialPoint
                icon={<ShieldCheck className="h-5 w-5" />}
                text="No charge today"
              />

              <TrialPoint
                icon={<Zap className="h-5 w-5" />}
                text="Trial credits included"
              />

              <TrialPoint
                icon={<Sparkles className="h-5 w-5" />}
                text="AI staff setup included"
              />
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">Selected plan</h2>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              {selectedPlan.name} — {getPlanPriceLine(planKey)}
            </p>

            <p className="mt-3 text-base font-bold leading-7 text-slate-400">
              {KOLKAP_PRICE_NOTE}
            </p>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#07111F]">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-black">
              What happens after signup?
            </h2>

            <p className="mt-3 text-lg font-semibold leading-8 text-slate-300">
              After signup, you will activate your 7-day trial, create your AI
              staff, test the replies, and go live when you are ready. Kolkap
              helps your business reply to customers 24/7, capture leads, and
              support daily conversations.
            </p>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <form onSubmit={handleSignup} className="grid gap-5">
            <div className="mb-2">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {isExistingUser ? "Welcome Back" : "Start Now"}
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {isExistingUser ? "Continue Free Trial" : "Start Free Trial"}
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                {selectedPlan.name} — {getPlanPriceLine(planKey)}
              </p>

              <p className="mt-2 text-sm font-black leading-6 text-blue-600">
                Payment method needed. No charge today.
              </p>
            </div>

            {isExistingUser ? (
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
                <p className="text-base font-black">
                  Your existing Kolkap account was found.
                </p>
                <p className="mt-1 text-sm font-bold leading-6">
                  Continue your trial setup below. You do not need to create
                  another account or password.
                </p>
              </div>
            ) : null}

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <UserRound className="h-5 w-5 text-slate-400" />
                Full name
              </span>

              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                disabled={isCheckingSession}
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

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
                readOnly={isExistingUser}
                disabled={isCheckingSession}
                className={`h-14 rounded-2xl border border-slate-200 px-5 text-lg font-semibold outline-none transition ${
                  isExistingUser
                    ? "cursor-not-allowed bg-slate-100 text-slate-500"
                    : "bg-[#F7F9FA] focus:border-blue-500 focus:bg-white"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              />
            </label>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-base font-black text-slate-700">
                <BriefcaseBusiness className="h-5 w-5 text-slate-400" />
                Business type
              </span>

              <select
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                disabled={isCheckingSession}
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            {!isExistingUser ? (
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
                    placeholder="Create a password"
                    autoComplete="new-password"
                    disabled={isCheckingSession}
                    className="w-full bg-transparent text-lg font-semibold outline-none disabled:cursor-not-allowed"
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
            ) : null}

            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                <p className="text-base font-black">
                  {isExistingUser ? "Trial setup failed" : "Signup failed"}
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
              disabled={
                isCheckingSession || isSubmitting || isOpeningCheckout
              }
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {buttonText}
              <ArrowRight className="h-6 w-6" />
            </button>

            <p className="text-center text-sm font-bold leading-6 text-slate-500">
              Monthly billing starts automatically after your trial unless
              cancelled before the trial ends.
            </p>

            {!isExistingUser ? (
              <p className="text-center text-base font-black text-slate-600">
                Already have an account?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(activateTrialPath)}`}
                  className="text-blue-600"
                >
                  Log in
                </Link>
              </p>
            ) : (
              <p className="text-center text-base font-black text-slate-600">
                Signed in as{" "}
                <span className="text-blue-600">{email}</span>
              </p>
            )}
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
