import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Flame,
  Mail,
  MessageCircle,
  Phone,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["AI Staff", "/dashboard/agents"],
  ["Knowledge", "/dashboard/knowledge-base"],
  ["Inbox", "/dashboard/inbox"],
  ["Leads", "/dashboard/leads"],
  ["Billing", "/dashboard/billing"],
];

const leadStats = [
  {
    label: "Total Leads",
    value: "86",
    note: "Captured by AI staff",
    icon: Users,
  },
  {
    label: "Hot Leads",
    value: "18",
    note: "Ready for follow-up",
    icon: Flame,
  },
  {
    label: "Follow-ups",
    value: "12",
    note: "Need human action",
    icon: CalendarClock,
  },
];

const leads = [
  {
    name: "Budi Santoso",
    score: "Hot",
    source: "WhatsApp",
    interest: "Villa in Bali",
    budget: "Rp 3B",
    timeline: "This week",
    status: "New",
    phone: "+62 812 0000 1122",
    email: "budi@example.com",
    summary:
      "Looking for a 3-bedroom villa in Canggu or Berawa and wants to view this week.",
  },
  {
    name: "Sarah Lim",
    score: "Warm",
    source: "Website Chat",
    interest: "AI support package",
    budget: "$300/month",
    timeline: "This month",
    status: "Follow Up",
    phone: "+65 9123 4567",
    email: "sarah@example.com",
    summary:
      "Interested in using Kolkap for customer support and monthly service inquiries.",
  },
  {
    name: "Michael Tan",
    score: "Warm",
    source: "WhatsApp",
    interest: "Social media content",
    budget: "$500/month",
    timeline: "Next month",
    status: "Contacted",
    phone: "+60 12 333 4455",
    email: "michael@example.com",
    summary:
      "Agency owner asking about AI-generated captions, video scripts, and weekly content plans.",
  },
  {
    name: "Nadia Putri",
    score: "Cold",
    source: "Website Chat",
    interest: "Clinic chatbot",
    budget: "Not provided",
    timeline: "Still researching",
    status: "New",
    phone: "+62 813 8888 9090",
    email: "nadia@example.com",
    summary:
      "Asked how Kolkap can reply to clinic patients and collect appointment inquiries.",
  },
];

const filters = ["All", "Hot", "Warm", "Cold", "New", "Follow Up", "Converted"];

export default function LeadsPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 lg:flex-row lg:items-center lg:justify-between">
          <KolkapLogo size="sm" />

          <nav className="flex flex-wrap gap-3">
            {navItems.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className={`rounded-full border px-5 py-3 text-base font-black transition ${
                  label === "Leads"
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              Lead Management
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Turn conversations into real customers.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Kolkap captures customer details, scores leads, summarizes
              conversations, and helps your team follow up faster.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {leadStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="text-lg font-black text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.05em]">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                    {stat.note}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Lead Pipeline
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                Captured leads
              </h2>
              <p className="mt-3 max-w-2xl text-xl font-semibold leading-9 text-slate-600">
                These are sample leads for the UI first. Later they will come
                from the leads table in Supabase.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="h-14 w-full rounded-full border border-slate-200 bg-[#F7F9FA] pl-14 pr-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`rounded-full border px-5 py-3 text-base font-black transition ${
                  filter === "All"
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid gap-5">
            {leads.map((lead) => (
              <div
                key={lead.name}
                className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5 transition hover:border-blue-400 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10 sm:p-6"
              >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                  <div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                          <UserRound className="h-8 w-8" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-3xl font-black tracking-[-0.04em]">
                              {lead.name}
                            </h3>

                            <span
                              className={`rounded-full px-4 py-2 text-sm font-black ${
                                lead.score === "Hot"
                                  ? "bg-[#7CFF3D] text-[#07111F]"
                                  : lead.score === "Warm"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {lead.score} Lead
                            </span>
                          </div>

                          <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">
                            {lead.summary}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="text-base font-black uppercase tracking-[0.14em] text-slate-500">
                          Interest
                        </p>
                        <p className="mt-2 text-2xl font-black">
                          {lead.interest}
                        </p>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="text-base font-black uppercase tracking-[0.14em] text-slate-500">
                          Budget
                        </p>
                        <p className="mt-2 text-2xl font-black">{lead.budget}</p>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="text-base font-black uppercase tracking-[0.14em] text-slate-500">
                          Timeline
                        </p>
                        <p className="mt-2 text-2xl font-black">
                          {lead.timeline}
                        </p>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="text-base font-black uppercase tracking-[0.14em] text-slate-500">
                          Source
                        </p>
                        <p className="mt-2 text-2xl font-black">{lead.source}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-black uppercase tracking-[0.14em] text-slate-500">
                          Status
                        </p>
                        <p className="mt-2 text-3xl font-black">
                          {lead.status}
                        </p>
                      </div>

                      <CheckCircle2 className="h-10 w-10 text-[#07111F]" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-2xl bg-[#F7F9FA] p-4">
                        <Phone className="h-6 w-6 text-slate-500" />
                        <p className="text-lg font-black">{lead.phone}</p>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-[#F7F9FA] p-4">
                        <Mail className="h-6 w-6 text-slate-500" />
                        <p className="break-all text-lg font-black">
                          {lead.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-[#F7F9FA] p-4">
                        <MessageCircle className="h-6 w-6 text-slate-500" />
                        <p className="text-lg font-black">{lead.source}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-lg font-black text-[#07111F]">
                        <Phone className="h-5 w-5" />
                        Contact Lead
                      </button>

                      <Link
                        href="/dashboard/inbox"
                        className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-lg font-black text-white"
                      >
                        View Conversation
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                Next Step
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                Create content for your leads.
              </h2>
              <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                After leads are captured, Kolkap can help generate WhatsApp
                follow-up messages, captions, scripts, and content ideas.
              </p>
            </div>

            <Link
              href="/dashboard/content-studio"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              Go to Content Studio
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}