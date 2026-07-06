import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Data Deletion Instructions | Kolkap",
  description:
    "Learn how to request deletion of your Kolkap account, workspace, AI staff, knowledge base, conversations, leads, usage records, and connected channel data.",
};

const deletionItems = [
  "Kolkap account access",
  "Business workspace information",
  "AI staff setup and saved configuration",
  "Business knowledge and uploaded content",
  "Website Chat settings and conversations",
  "WhatsApp integration settings and message records",
  "Customer conversations, leads, and handover records",
  "Usage records, credit history, and workspace activity",
];

const steps = [
  {
    title: "Log in to your Kolkap account",
    text: "Use the email address connected to your Kolkap workspace.",
  },
  {
    title: "Go to Dashboard Settings",
    text: "Open your Kolkap Dashboard, then go to Settings.",
  },
  {
    title: "Open Delete Account",
    text: "Choose Delete Account from the settings area.",
  },
  {
    title: "Confirm deletion",
    text: "Type DELETE and submit the deletion request. This action is permanent.",
  },
];

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FA] px-5 py-10 text-[#07111F] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-black text-[#07111F] shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </Link>

        <section className="mt-8 rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <ShieldCheck className="h-5 w-5" />
            Data Deletion Instructions
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Request deletion of your Kolkap data.
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
            Kolkap users can permanently delete their account and workspace data
            from inside the dashboard. This page explains how to request data
            deletion and what will be removed.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Trash2 className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              How to delete your account
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              Delete your Kolkap account from your dashboard.
            </h2>

            <div className="mt-7 grid gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#07111F] text-base font-black text-[#7CFF3D]">
                    {index + 1}
                  </div>

                  <h3 className="text-xl font-black tracking-[-0.03em]">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/settings/delete-account"
              className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-red-600 px-8 py-5 text-xl font-black text-white shadow-xl shadow-red-900/10 transition hover:-translate-y-0.5"
            >
              Open Delete Account
              <Trash2 className="h-6 w-6" />
            </Link>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <LockKeyhole className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              What will be deleted
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              Your Kolkap workspace data will be removed.
            </h2>

            <div className="mt-7 grid gap-3">
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
          </div>
        </section>

        <section className="mt-8 rounded-[2.2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm shadow-amber-900/5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <HelpCircle className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-amber-950">
                Cannot access your account?
              </h2>

              <p className="mt-4 text-lg font-semibold leading-8 text-amber-900">
                If you cannot log in to Kolkap but still want to request data
                deletion, contact Kolkap support and include the email address
                connected to your account. We may ask you to verify ownership
                before processing the request.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/support"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-7 py-4 text-base font-black text-white"
                >
                  Contact Support
                  <Mail className="h-5 w-5" />
                </Link>

                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-300 bg-white px-7 py-4 text-base font-black text-amber-950"
                >
                  View Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
            Important note
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            Account deletion is permanent.
          </h2>

          <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
            Deleting your Kolkap account is different from cancelling billing.
            If you only want to stop future subscription charges, use the
            Billing page inside your Kolkap dashboard instead of deleting your
            account.
          </p>
        </section>
      </section>
    </main>
  );
}