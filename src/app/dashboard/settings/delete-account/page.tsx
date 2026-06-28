"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";

const deletionItems = [
  "Your Kolkap account access",
  "Your business workspace",
  "Your AI staff setup",
  "Your saved business knowledge",
  "Your Website Chat and WhatsApp settings",
  "Your conversations and customer messages",
  "Your leads and handover records",
  "Your usage records and credit history",
];

export default function DeleteAccountPage() {
  const router = useRouter();

  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canDelete = confirmation.trim().toUpperCase() === "DELETE";

  async function handleDeleteAccount() {
    if (!canDelete || isDeleting || success) return;

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
        throw new Error(
          result.error ||
            "We could not delete your account right now. Please try again or contact Kolkap support."
        );
      }

      setSuccess(true);

      window.setTimeout(() => {
        router.push("/logout");
      }, 1200);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "We could not delete your account right now. Please try again or contact Kolkap support."
      );
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] px-5 py-10 text-[#07111F] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-black text-[#07111F] shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Settings
        </Link>

        <div className="mt-8 rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-red-300/20 bg-red-500/10 px-5 py-3 text-lg font-black text-red-200">
            <ShieldAlert className="h-5 w-5" />
            Account Deletion
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Delete your Kolkap account.
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            You can permanently delete your Kolkap account and workspace data
            here. This action cannot be undone.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm shadow-red-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h2 className="text-3xl font-black tracking-[-0.04em] text-red-950">
              This is permanent.
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-red-900">
              After deletion, you will lose access to your Kolkap workspace, AI
              staff, business knowledge, conversations, leads, usage records,
              credit history, and account access.
            </p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <h2 className="text-3xl font-black tracking-[-0.04em]">
              What will be deleted
            </h2>

            <div className="mt-6 grid gap-3">
              {deletionItems.map((item) => (
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

        <section className="mt-8 rounded-[2.2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm shadow-amber-900/5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white">
                <CreditCard className="h-8 w-8" />
              </div>

              <h2 className="text-3xl font-black tracking-[-0.04em] text-amber-950">
                Need to cancel billing only?
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-amber-900">
                Delete Account is different from cancelling your subscription.
                If you only want to stop future billing, go to Billing and
                schedule cancellation instead.
              </p>
            </div>

            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-base font-black text-white"
            >
              Open Billing
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-red-300">
            <Trash2 className="h-8 w-8" />
          </div>

          <h2 className="text-3xl font-black tracking-[-0.04em]">
            Confirm account deletion
          </h2>

          <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
            To continue, type DELETE below. This helps prevent accidental
            account deletion.
          </p>

          <div className="mt-7">
            <label className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Type DELETE to confirm
            </label>

            <input
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setError("");
              }}
              placeholder="DELETE"
              className="mt-3 w-full rounded-3xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-black text-[#07111F] outline-none transition focus:border-[#07111F] focus:bg-white"
            />
          </div>

          {error ? (
            <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-900">
              <p className="text-base font-black">Account deletion failed</p>
              <p className="mt-2 text-sm font-bold leading-6">{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-900">
              <p className="text-base font-black">Account deletion started</p>
              <p className="mt-2 text-sm font-bold leading-6">
                Your account deletion request has been received. You will be
                signed out.
              </p>
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

            {isDeleting ? "Deleting account..." : "Delete my account"}
          </button>
        </section>
      </section>
    </main>
  );
}