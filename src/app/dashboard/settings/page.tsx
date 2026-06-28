"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe2,
  Headphones,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type CreditBalanceRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  plan_name: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  billing_period_start: string | null;
  billing_period_end: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type WorkspaceSettingsRow = {
  id: string;
  owner_user_id?: string | null;
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
  whatsapp_status?: string | null;
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

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Not connected";
  if (value === "not_connected") return "Not connected";
  if (value === "connected") return "Connected";
  if (value === "pending") return "Pending";
  if (value === "draft") return "Draft";
  if (value === "testing") return "Testing";
  if (value === "live") return "Live";
  if (value === "trial") return "Trial";
  if (value === "active") return "Active";
  if (value === "past_due") return "Past Due";
  if (value === "cancelled") return "Cancelled";

  return value.replace(/_/g, " ");
}

export default function SettingsPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace as WorkspaceSettingsRow | null;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Real Estate");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("Asia/Makassar");

  const [aiReplyLanguage, setAiReplyLanguage] = useState("Auto-detect");
  const [aiReplyTone, setAiReplyTone] = useState("Friendly Professional");
  const [handoverRule, setHandoverRule] = useState(
    "When customer asks for a human"
  );
  const [aiInstruction, setAiInstruction] = useState("");

  const [notifyNewLead, setNotifyNewLead] = useState(true);
  const [notifyHandover, setNotifyHandover] = useState(true);
  const [notifyLowCredits, setNotifyLowCredits] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const creditsLeft = getCreditsLeft(creditBalance);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);
  const usedCredits = Number(creditBalance?.used_credits || 0);

  async function loadCreditBalance() {
    if (!workspace?.id) return;

    setIsLoadingCredits(true);
    setCreditError("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("workspace_credit_balances")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (error) {
      setCreditError(error.message);
      setIsLoadingCredits(false);
      return;
    }

    setCreditBalance((data ?? null) as CreditBalanceRow | null);
    setIsLoadingCredits(false);
  }

  useEffect(() => {
    if (!workspace) return;

    setBusinessName(workspace.business_name ?? "");
    setBusinessType(workspace.business_type ?? "Real Estate");
    setBusinessEmail(workspace.business_email ?? "");
    setBusinessPhone(workspace.business_phone ?? "");
    setWhatsappNumber(workspace.whatsapp_number ?? "");
    setBusinessAddress(workspace.business_address ?? "");
    setCountry(workspace.country ?? "");
    setTimezone(workspace.timezone ?? "Asia/Makassar");

    setAiReplyLanguage(workspace.ai_reply_language ?? "Auto-detect");
    setAiReplyTone(workspace.ai_reply_tone ?? "Friendly Professional");
    setHandoverRule(
      workspace.handover_rule ?? "When customer asks for a human"
    );
    setAiInstruction(workspace.ai_instruction ?? "");

    setNotifyNewLead(workspace.notify_new_lead ?? true);
    setNotifyHandover(workspace.notify_handover ?? true);
    setNotifyLowCredits(workspace.notify_low_credits ?? true);
    setNotifyDailySummary(workspace.notify_daily_summary ?? false);
  }, [workspace]);

  useEffect(() => {
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace?.id) return;

    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");

    const supabase = createClient();

    const { error } = await supabase
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
      .eq("id", workspace.id);

    setIsSaving(false);

    if (error) {
      setSaveError(error.message || "Settings could not be saved.");
      return;
    }

    setSaveMessage("Settings saved successfully.");
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your settings...
          </div>
        </section>
      </main>
    );
  }

  if (workspaceState.error) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] border border-red-200 bg-red-50 p-8 text-red-700">
            <p className="text-xl font-black">Settings could not load.</p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const summaryCards = [
    {
      label: "Current Plan",
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: <WalletCards className="h-7 w-7" />,
    },
    {
      label: "Credits Left",
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `${usedCredits.toLocaleString()} used`
        : "Credit balance not found yet.",
      icon: <CreditCard className="h-7 w-7" />,
      dark: true,
    },
    {
      label: "AI Staff Limit",
      value: getPlanAIStaffLabel(currentPlan),
      note: currentPlan.name,
      icon: <Bot className="h-7 w-7" />,
    },
    {
      label: "WhatsApp Status",
      value: statusLabel(workspaceState.whatsappStatus),
      note: "Managed in WhatsApp integration.",
      icon: <MessageCircle className="h-7 w-7" />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <form onSubmit={handleSave}>
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
            <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Link
                href="/dashboard"
                className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Dashboard
              </Link>

              <button
                type="button"
                onClick={loadCreditBalance}
                disabled={isLoadingCredits}
                className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <Zap className="h-5 w-5" />
                {isLoadingCredits ? "Loading..." : "Refresh Credits"}
              </button>
            </div>

            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              Settings
            </div>

            <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Manage your business workspace settings.
            </h1>

            <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
              Update your business profile, default AI preferences,
              notification preferences, account details, and workspace safety
              settings.
            </p>
          </div>

          {creditError ? (
            <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="text-base font-black">{creditError}</p>
            </div>
          ) : null}

          <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                note={card.note}
                dark={card.dark}
              />
            ))}
          </div>

          <div className="grid gap-8">
            <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Building2 className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Business Profile
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    This information helps Kolkap understand your business.
                  </h2>

                  <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                    Keep your business name, contact details, address, country,
                    and timezone accurate so your AI workspace can use the right
                    business context.
                  </p>
                </div>

                <div className="grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      Business name
                    </span>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      Business type
                    </span>
                    <select
                      value={businessType}
                      onChange={(event) => setBusinessType(event.target.value)}
                      className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
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
                      icon="mail"
                    />

                    <TextInput
                      label="Business phone"
                      value={businessPhone}
                      onChange={setBusinessPhone}
                      icon="phone"
                    />
                  </div>

                  <TextInput
                    label="Business WhatsApp number"
                    value={whatsappNumber}
                    onChange={setWhatsappNumber}
                    icon="message"
                  />

                  <label className="grid gap-2">
                    <span className="flex items-center gap-2 text-base font-black text-slate-700">
                      <MapPin className="h-5 w-5 text-slate-400" />
                      Business address
                    </span>

                    <textarea
                      rows={4}
                      value={businessAddress}
                      onChange={(event) =>
                        setBusinessAddress(event.target.value)
                      }
                      className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextInput
                      label="Country"
                      value={country}
                      onChange={setCountry}
                      icon="globe"
                    />

                    <label className="grid gap-2">
                      <span className="flex items-center gap-2 text-base font-black text-slate-700">
                        <Clock3 className="h-5 w-5 text-slate-400" />
                        Timezone
                      </span>

                      <select
                        value={timezone}
                        onChange={(event) => setTimezone(event.target.value)}
                        className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                      >
                        {timezones.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Bot className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Default AI Preferences
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    Set your workspace default AI style.
                  </h2>

                  <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                    These are general workspace defaults. Website Chat and
                    WhatsApp automation controls are managed on their own
                    integration pages.
                  </p>
                </div>

                <div className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <SelectInput
                      label="Default reply language"
                      value={aiReplyLanguage}
                      onChange={setAiReplyLanguage}
                      options={replyLanguages}
                    />

                    <SelectInput
                      label="Default reply tone"
                      value={aiReplyTone}
                      onChange={setAiReplyTone}
                      options={replyTones}
                    />
                  </div>

                  <SelectInput
                    label="Default handover guidance"
                    value={handoverRule}
                    onChange={setHandoverRule}
                    options={handoverRules}
                  />

                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      Default AI instruction
                    </span>

                    <textarea
                      rows={6}
                      value={aiInstruction}
                      onChange={(event) => setAiInstruction(event.target.value)}
                      placeholder="Example: Always be helpful, ask for the customer's name and contact details, and offer human support when the customer is ready to book."
                      className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>
                </div>
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Headphones className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Channel Controls
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                  Manage automation from each channel page.
                </h2>

                <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                  Website Chat and WhatsApp each have their own active,
                  auto-reply, AI staff, and handover controls.
                </p>

                <div className="mt-7 grid gap-3">
                  <ChannelLink
                    href="/dashboard/integrations/website-chat"
                    icon={<Globe2 className="h-5 w-5" />}
                    title="Website Chat Settings"
                    text="Manage widget status, selected AI staff, auto-reply, and handover."
                  />

                  <ChannelLink
                    href="/dashboard/integrations/whatsapp"
                    icon={<MessageCircle className="h-5 w-5" />}
                    title="WhatsApp Settings"
                    text="Manage WhatsApp numbers, AI support, auto-reply, and handover."
                  />

                  <ChannelLink
                    href="/dashboard/inbox"
                    icon={<Headphones className="h-5 w-5" />}
                    title="Inbox Control Room"
                    text="Review conversations, handover, leads, and team replies."
                  />
                </div>
              </section>

              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Bell className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  Notifications
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                  Choose when you want to be notified.
                </h2>

                <div className="mt-7 grid gap-3">
                  <ToggleInput
                    label="Notify me for new leads"
                    checked={notifyNewLead}
                    setChecked={setNotifyNewLead}
                  />

                  <ToggleInput
                    label="Notify me when handover is needed"
                    checked={notifyHandover}
                    setChecked={setNotifyHandover}
                  />

                  <ToggleInput
                    label="Notify me when credits are low"
                    checked={notifyLowCredits}
                    setChecked={setNotifyLowCredits}
                  />

                  <ToggleInput
                    label="Send daily inbox summary"
                    checked={notifyDailySummary}
                    setChecked={setNotifyDailySummary}
                  />
                </div>
              </section>
            </div>

            <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <LockKeyhole className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    Account & Security
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    Basic owner account details.
                  </h2>
                </div>

                <div className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextInput
                      label="Owner name"
                      value={businessName || "Business Owner"}
                      onChange={() => {}}
                      icon="user"
                      disabled
                    />

                    <TextInput
                      label="Owner email"
                      value={businessEmail}
                      onChange={() => {}}
                      icon="mail"
                      disabled
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                      Password
                    </p>

                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xl font-black">••••••••••••</p>

                      <Link
                        href="/reset-password"
                        className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white"
                      >
                        <ShieldCheck className="h-5 w-5" />
                        Change Password
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                    Save Settings
                  </p>

                  <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                    Save your workspace settings.
                  </h2>

                  {saveMessage ? (
                    <p className="mt-4 text-lg font-black text-[#7CFF3D]">
                      {saveMessage}
                    </p>
                  ) : null}

                  {saveError ? (
                    <p className="mt-4 text-lg font-black text-red-300">
                      {saveError}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-6 w-6" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </section>

            <section className="rounded-[2.2rem] border border-red-200 bg-red-50 p-6 shadow-sm shadow-red-900/5 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white">
                    <AlertTriangle className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-red-700">
                    Delete Account
                  </p>

                  <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] text-red-950">
                    Permanently delete your account and workspace data.
                  </h2>

                  <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-red-800">
                    This is separate from subscription cancellation. Use Billing
                    if you only want to cancel your plan.
                  </p>
                </div>

                <Link
                  href="/dashboard/settings/delete-account"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-red-600 px-8 py-5 text-xl font-black text-white shadow-xl shadow-red-900/10 transition hover:-translate-y-0.5"
                >
                  <Trash2 className="h-6 w-6" />
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

function SummaryCard({
  icon,
  label,
  value,
  note,
  dark = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
        dark
          ? "border-[#7CFF3D] bg-[#07111F] text-white"
          : "border-slate-200 bg-white text-[#07111F]"
      }`}
    >
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
          dark ? "bg-[#7CFF3D] text-[#07111F]" : "bg-[#07111F] text-[#7CFF3D]"
        }`}
      >
        {icon}
      </div>

      <p
        className={`text-lg font-black ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{value}</p>

      <p
        className={`mt-2 text-base font-semibold leading-7 ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {note}
      </p>
    </div>
  );
}

function ChannelLink({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 transition hover:bg-white"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
          {icon}
        </div>

        <div>
          <p className="text-lg font-black text-[#07111F]">{title}</p>

          <p className="mt-1 text-base font-semibold leading-7 text-slate-600">
            {text}
          </p>

          <p className="mt-3 inline-flex items-center gap-2 text-sm font-black text-blue-600">
            Open
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </p>
        </div>
      </div>
    </Link>
  );
}

function TextInput({
  label,
  value,
  onChange,
  icon,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: "mail" | "phone" | "message" | "globe" | "user";
  disabled?: boolean;
}) {
  const Icon =
    icon === "mail"
      ? Mail
      : icon === "phone"
        ? Phone
        : icon === "message"
          ? MessageCircle
          : icon === "globe"
            ? Globe2
            : UserRound;

  return (
    <label className="grid gap-2">
      <span className="flex items-center gap-2 text-base font-black text-slate-700">
        <Icon className="h-5 w-5 text-slate-400" />
        {label}
      </span>

      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
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
      <span className="text-base font-black text-slate-700">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
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
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
      <span className="text-lg font-black">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        className="h-6 w-6"
      />
    </label>
  );
}