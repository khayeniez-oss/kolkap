"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  Clock3,
  Globe2,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type WorkspaceSettingsRow = {
  id: string;
  owner_user_id: string;
  business_name?: string | null;
  business_type?: string | null;
  business_email?: string | null;
  business_phone?: string | null;
  whatsapp_number?: string | null;
  business_address?: string | null;
  country?: string | null;
  timezone?: string | null;
  ai_reply_language?: string | null;
  ai_reply_tone?: string | null;
  handover_rule?: string | null;
  ai_instruction?: string | null;
  notify_new_lead?: boolean | null;
  notify_handover?: boolean | null;
  notify_low_credits?: boolean | null;
  notify_daily_summary?: boolean | null;
};

const businessTypes = [
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
];

const replyLanguages = [
  "Auto-detect",
  "English",
  "Bahasa Indonesia",
  "Malay",
  "Chinese",
];

const replyTones = [
  "Friendly Professional",
  "Warm",
  "Formal",
  "Direct",
  "Salesy",
  "Luxury",
  "Supportive",
  "Casual",
];

const handoverRules = [
  "When customer asks for a human",
  "When AI is not confident",
  "When customer is ready to buy",
  "When customer asks for price negotiation",
  "Always offer human support",
];

const timezones = [
  "Asia/Makassar",
  "Asia/Jakarta",
  "Australia/Sydney",
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "UTC",
];

export default function SettingsPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace as WorkspaceSettingsRow | null;

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your settings...
          </div>
        </section>
      </main>
    );
  }

  if (workspaceState.error || !workspace?.id) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700">
            <p className="text-xl font-black">Settings could not load.</p>
            <p className="mt-2 text-base font-semibold">
              Please refresh the page and try again.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return <SettingsForm key={workspace.id} workspace={workspace} />;
}

function SettingsForm({ workspace }: { workspace: WorkspaceSettingsRow }) {
  const [businessName, setBusinessName] = useState(workspace.business_name ?? "");
  const [businessType, setBusinessType] = useState(
    workspace.business_type ?? "Real Estate"
  );
  const [businessEmail, setBusinessEmail] = useState(
    workspace.business_email ?? ""
  );
  const [businessPhone, setBusinessPhone] = useState(
    workspace.business_phone ?? ""
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    workspace.whatsapp_number ?? ""
  );
  const [businessAddress, setBusinessAddress] = useState(
    workspace.business_address ?? ""
  );
  const [country, setCountry] = useState(workspace.country ?? "");
  const [timezone, setTimezone] = useState(
    workspace.timezone ?? "Asia/Makassar"
  );

  const [aiReplyLanguage, setAiReplyLanguage] = useState(
    workspace.ai_reply_language ?? "Auto-detect"
  );
  const [aiReplyTone, setAiReplyTone] = useState(
    workspace.ai_reply_tone ?? "Friendly Professional"
  );
  const [handoverRule, setHandoverRule] = useState(
    workspace.handover_rule ?? "When customer asks for a human"
  );
  const [aiInstruction, setAiInstruction] = useState(
    workspace.ai_instruction ?? ""
  );

  const [notifyNewLead, setNotifyNewLead] = useState(
    workspace.notify_new_lead ?? true
  );
  const [notifyHandover, setNotifyHandover] = useState(
    workspace.notify_handover ?? true
  );
  const [notifyLowCredits, setNotifyLowCredits] = useState(
    workspace.notify_low_credits ?? true
  );
  const [notifyDailySummary, setNotifyDailySummary] = useState(
    workspace.notify_daily_summary ?? false
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_workspaces")
        .update({
          business_name: businessName.trim() || null,
          business_type: businessType || null,
          business_email: businessEmail.trim() || null,
          business_phone: businessPhone.trim() || null,
          whatsapp_number: whatsappNumber.trim() || null,
          business_address: businessAddress.trim() || null,
          country: country.trim() || null,
          timezone: timezone || "Asia/Makassar",
          ai_reply_language: aiReplyLanguage || "Auto-detect",
          ai_reply_tone: aiReplyTone || "Friendly Professional",
          handover_rule: handoverRule || "When customer asks for a human",
          ai_instruction: aiInstruction.trim() || null,
          notify_new_lead: notifyNewLead,
          notify_handover: notifyHandover,
          notify_low_credits: notifyLowCredits,
          notify_daily_summary: notifyDailySummary,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspace.id)
        .eq("owner_user_id", workspace.owner_user_id)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!data?.id) {
        throw new Error("This workspace could not be updated.");
      }

      setSaveMessage("Settings saved successfully.");
    } catch {
      setSaveError("Settings could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <form onSubmit={handleSave}>
        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
          <header className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>

            <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              Settings
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
              Workspace settings.
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
              Manage your business details, AI defaults, notifications, and
              account security.
            </p>
          </header>

          <div className="grid gap-8">
            <SettingsSection
              icon={<Building2 className="h-7 w-7" />}
              label="Business Profile"
              title="Your business information"
              description="Keep these details accurate so Kolkap can use the right business context."
            >
              <div className="grid gap-5">
                <label className="grid gap-2">
                  <FieldLabel>Business name</FieldLabel>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    className={fieldClassName}
                  />
                </label>

                <label className="grid gap-2">
                  <FieldLabel>Business type</FieldLabel>
                  <select
                    value={businessType}
                    onChange={(event) => setBusinessType(event.target.value)}
                    className={fieldClassName}
                  >
                    {businessTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextInput
                    label="Business email"
                    value={businessEmail}
                    onChange={setBusinessEmail}
                    icon={<Mail className="h-5 w-5" />}
                    type="email"
                  />
                  <TextInput
                    label="Business phone"
                    value={businessPhone}
                    onChange={setBusinessPhone}
                    icon={<Phone className="h-5 w-5" />}
                    type="tel"
                  />
                </div>

                <TextInput
                  label="Business WhatsApp number"
                  value={whatsappNumber}
                  onChange={setWhatsappNumber}
                  icon={<MessageCircle className="h-5 w-5" />}
                  type="tel"
                />

                <label className="grid gap-2">
                  <FieldLabel icon={<MapPin className="h-5 w-5" />}>
                    Business address
                  </FieldLabel>
                  <textarea
                    rows={3}
                    value={businessAddress}
                    onChange={(event) => setBusinessAddress(event.target.value)}
                    className={`${fieldClassName} h-auto py-4`}
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextInput
                    label="Country"
                    value={country}
                    onChange={setCountry}
                    icon={<Globe2 className="h-5 w-5" />}
                  />
                  <label className="grid gap-2">
                    <FieldLabel icon={<Clock3 className="h-5 w-5" />}>
                      Timezone
                    </FieldLabel>
                    <select
                      value={timezone}
                      onChange={(event) => setTimezone(event.target.value)}
                      className={fieldClassName}
                    >
                      {timezones.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={<Bot className="h-7 w-7" />}
              label="AI Defaults"
              title="Default reply style"
              description="These defaults apply across your workspace. Each channel can still have its own controls."
            >
              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <SelectInput
                    label="Reply language"
                    value={aiReplyLanguage}
                    onChange={setAiReplyLanguage}
                    options={replyLanguages}
                  />
                  <SelectInput
                    label="Reply tone"
                    value={aiReplyTone}
                    onChange={setAiReplyTone}
                    options={replyTones}
                  />
                </div>

                <SelectInput
                  label="Handover guidance"
                  value={handoverRule}
                  onChange={setHandoverRule}
                  options={handoverRules}
                />

                <label className="grid gap-2">
                  <FieldLabel>AI instruction</FieldLabel>
                  <textarea
                    rows={5}
                    value={aiInstruction}
                    onChange={(event) => setAiInstruction(event.target.value)}
                    placeholder="Add general instructions for how your AI should reply."
                    className={`${fieldClassName} h-auto py-4`}
                  />
                </label>
              </div>
            </SettingsSection>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <SectionHeading
                  icon={<Bell className="h-7 w-7" />}
                  label="Notifications"
                  title="Choose your alerts"
                />
                <div className="mt-6 grid gap-3">
                  <ToggleInput
                    label="New leads"
                    checked={notifyNewLead}
                    setChecked={setNotifyNewLead}
                  />
                  <ToggleInput
                    label="Human handover needed"
                    checked={notifyHandover}
                    setChecked={setNotifyHandover}
                  />
                  <ToggleInput
                    label="Low credit balance"
                    checked={notifyLowCredits}
                    setChecked={setNotifyLowCredits}
                  />
                  <ToggleInput
                    label="Daily inbox summary"
                    checked={notifyDailySummary}
                    setChecked={setNotifyDailySummary}
                  />
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <SectionHeading
                  icon={<LockKeyhole className="h-7 w-7" />}
                  label="Account & Security"
                  title="Password security"
                />
                <p className="mt-5 text-base font-semibold leading-7 text-slate-600">
                  Change the password for your signed-in Kolkap account.
                </p>
                <Link
                  href="/reset-password"
                  className="mt-6 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Change Password
                </Link>
              </section>
            </div>

            <section className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  Save your changes
                </h2>
                {saveMessage ? (
                  <p className="mt-2 font-black text-green-700">{saveMessage}</p>
                ) : null}
                {saveError ? (
                  <p className="mt-2 font-black text-red-700">{saveError}</p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-4 text-lg font-black text-[#07111F] shadow-lg shadow-lime-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-5 w-5" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </section>

            <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm shadow-red-900/5 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-red-700">
                      Danger Zone
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-red-950">
                      Delete account and workspace
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-red-800">
                      Account deletion is permanent. To stop future billing
                      without deleting your data, use the Billing page instead.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/settings/delete-account"
                  className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-red-600 px-6 py-4 text-base font-black text-white"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete Account
                </Link>
              </div>
            </section>
          </div>
        </section>
      </form>
    </main>
  );
}

const fieldClassName =
  "h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-base font-semibold outline-none transition focus:border-blue-500 focus:bg-white";

function SettingsSection({
  icon,
  label,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <SectionHeading icon={icon} label={label} title={title} />
          <p className="mt-4 max-w-md text-base font-semibold leading-7 text-slate-600">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}

function SectionHeading({
  icon,
  label,
  title,
}: {
  icon: ReactNode;
  label: string;
  title: string;
}) {
  return (
    <div>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        {icon}
      </div>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
        {label}
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">{title}</h2>
    </div>
  );
}

function FieldLabel({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="flex items-center gap-2 text-sm font-black text-slate-700">
      {icon ? <span className="text-slate-400">{icon}</span> : null}
      {children}
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  type?: "text" | "email" | "tel";
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel icon={icon}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleInput({
  label,
  checked,
  setChecked,
}: {
  label: string;
  checked: boolean;
  setChecked: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4">
      <span className="text-base font-black">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}
