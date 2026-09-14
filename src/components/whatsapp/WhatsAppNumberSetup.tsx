"use client";

import { Phone, ArrowRight } from "lucide-react";
import { normalizeSignupPhone, type WhatsAppNumberOption } from "@/lib/whatsapp/embeddedSignup";

export function WhatsAppNumberSetup({ option, phone, confirmedNew, busy, metaReady, onOption,
  onPhone, onConfirmNew, onContinue, onCancel }: {
  option: WhatsAppNumberOption | null;
  phone: string;
  confirmedNew: boolean;
  busy: boolean;
  metaReady: boolean;
  onOption: (value: WhatsAppNumberOption) => void;
  onPhone: (value: string) => void;
  onConfirmNew: (value: boolean) => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onContinue(); }}
      className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <Phone className="h-6 w-6 text-blue-600" aria-hidden="true" />
        <h2 className="text-2xl font-black tracking-tight">Add phone number</h2>
      </div>
      <p className="mb-6 font-semibold leading-7 text-slate-600">
        Keep your WhatsApp Business number or connect a separate new number.
      </p>
      <fieldset disabled={busy} className="grid gap-4 disabled:opacity-60">
        <legend className="sr-only">Choose your number option</legend>
        {([
          ["existing_business_app", "Use my existing WhatsApp Business number",
            "Keep using the WhatsApp Business app while Kolkap helps with replies. Meta checks eligibility during setup."],
          ["new_number", "Use a new number",
            "Connect a separate number and keep your current WhatsApp as it is."],
        ] as const).map(([value, title, description]) => (
          <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${
            option === value ? "border-lime-500 bg-lime-50" : "border-slate-200 bg-[#F7F9FA]"
          }`}>
            <input type="radio" name="whatsapp-number-option" value={value} checked={option === value}
              onChange={() => onOption(value)} required className="mt-1 h-5 w-5 shrink-0 accent-lime-600" />
            <span>
              <span className="block font-black">{title}</span>
              <span className="mt-1 block text-sm font-semibold leading-6 text-slate-600">{description}</span>
            </span>
          </label>
        ))}
        {option ? (
          <>
            <label className="mt-2 grid gap-2">
              <span className="font-black text-slate-700">Phone number</span>
              <input type="tel" autoComplete="tel" inputMode="tel" required maxLength={24} value={phone}
                onChange={(event) => onPhone(event.target.value)} placeholder="+61 4XX XXX XXX"
                aria-describedby="whatsapp-number-help"
                className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-lg outline-none focus:border-blue-500" />
            </label>
            <p id="whatsapp-number-help" className="text-sm font-semibold leading-6 text-slate-600">
              {option === "existing_business_app"
                ? "Include the country code. This option is for the WhatsApp Business app. If Meta cannot connect it, you can use a new number instead."
                : "Get a number you control from your phone provider, then enter it here with the country code. It must receive Meta’s verification call or SMS."}
            </p>
            {option === "new_number" ? (
              <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
                <input type="checkbox" required checked={confirmedNew}
                  onChange={(event) => onConfirmNew(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
                This number is not currently used in WhatsApp or the WhatsApp Business app.
              </label>
            ) : null}
            <p className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-900">
              Continue to Facebook to select or create your business accounts and authorise the connection.
              After your number is linked, choose your AI staff and test replies.
            </p>
          </>
        ) : null}
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <button type="submit" disabled={!metaReady || !option || !normalizeSignupPhone(phone) || (option === "new_number" && !confirmedNew)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Connecting…" : "Continue with Meta"}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-5 py-4 font-black">Cancel</button>
        </div>
      </fieldset>
    </form>
  );
}
