import Link from "next/link";
import {
  BookOpen,
  FileText,
  DollarSign,
  Building2,
  ShieldCheck,
  Upload,
  Plus,
  Search,
  ArrowRight,
  MessageCircle,
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

const knowledgeStats = [
  {
    label: "Knowledge Items",
    value: "36",
    note: "FAQs, pricing, services, and policies",
    icon: BookOpen,
  },
  {
    label: "Connected AI Staff",
    value: "3",
    note: "AI roles using this knowledge",
    icon: ShieldCheck,
  },
  {
    label: "Files Uploaded",
    value: "8",
    note: "PDF, DOC, and text documents",
    icon: Upload,
  },
];

const categories = [
  {
    title: "Business Info",
    icon: Building2,
    count: "6 items",
    description: "Company details, contact info, opening hours, and service areas.",
  },
  {
    title: "FAQ",
    icon: MessageCircle,
    count: "12 items",
    description: "Common customer questions and approved answers.",
  },
  {
    title: "Pricing",
    icon: DollarSign,
    count: "5 items",
    description: "Plans, packages, setup fees, add-ons, and billing rules.",
  },
  {
    title: "Services",
    icon: FileText,
    count: "7 items",
    description: "What the business offers and how each service works.",
  },
  {
    title: "Policies",
    icon: ShieldCheck,
    count: "4 items",
    description: "Refunds, cancellation, support, privacy, and handover rules.",
  },
  {
    title: "Files",
    icon: Upload,
    count: "8 files",
    description: "Uploaded documents that Kolkap can search and understand.",
  },
];

const knowledgeItems = [
  {
    title: "What services do you offer?",
    category: "FAQ",
    updated: "Today",
    content:
      "We help businesses reply to customers, capture leads, manage support, and generate marketing content using AI staff.",
  },
  {
    title: "Starter package pricing",
    category: "Pricing",
    updated: "Today",
    content:
      "Starter is designed for small businesses that need basic AI replies, lead capture, and content generation.",
  },
  {
    title: "Human handover policy",
    category: "Policies",
    updated: "Yesterday",
    content:
      "AI must hand over to a human when the customer asks for a person, payment help, legal support, or urgent issues.",
  },
  {
    title: "Business contact information",
    category: "Business Info",
    updated: "2 days ago",
    content:
      "Business contact details, website link, WhatsApp number, support hours, and main service locations.",
  },
];

export default function KnowledgeBasePage() {
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
                  label === "Knowledge"
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              Train your AI
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Add the knowledge your AI should use.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              Kolkap should not guess. Add your FAQs, pricing, services,
              policies, files, and business details so your AI staff replies
              based on approved information.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5">
                <Plus className="h-6 w-6" />
                Add Knowledge
              </button>

              <button className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                <Upload className="h-6 w-6" />
                Upload File
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Why this matters
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              Better knowledge means better replies.
            </h2>

            <div className="mt-6 space-y-4">
              {[
                "AI answers from your approved business information.",
                "Customers get consistent answers every time.",
                "Human handover happens when the AI is not sure.",
                "You control what your AI can and cannot say.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                >
                  <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-[#7CFF3D]" />
                  <p className="text-xl font-black leading-8">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-3">
          {knowledgeStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-lg font-black text-slate-500">{stat.label}</p>
                <p className="mt-2 text-4xl font-black tracking-[-0.05em]">
                  {stat.value}
                </p>
                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  {stat.note}
                </p>
              </div>
            );
          })}
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Categories
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                Organize business knowledge
              </h2>
            </div>

            <p className="max-w-xl text-lg font-semibold leading-8 text-slate-600">
              Later these categories will connect to the database and vector
              search so AI can find the right answer quickly.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <div
                  key={category.title}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-8 w-8" />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-3xl font-black tracking-[-0.04em]">
                      {category.title}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
                      {category.count}
                    </span>
                  </div>

                  <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                    {category.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Knowledge Items
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                Approved answers and business facts
              </h2>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search knowledge..."
                className="h-14 w-full rounded-full border border-slate-200 bg-[#F7F9FA] pl-14 pr-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            {knowledgeItems.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 transition hover:border-blue-400 hover:bg-white"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-black tracking-[-0.03em]">
                        {item.title}
                      </h3>
                      <span className="rounded-full bg-[#07111F] px-4 py-2 text-sm font-black text-white">
                        {item.category}
                      </span>
                    </div>

                    <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                      {item.content}
                    </p>
                  </div>

                  <p className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-500">
                    Updated {item.updated}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-900/5 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                Next Step
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em]">
                Test your AI before going live.
              </h2>
              <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
                After adding business knowledge, test how your AI staff replies.
                The user should see which knowledge source was used for the
                answer.
              </p>
            </div>

            <Link
              href="/dashboard/inbox"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
            >
              Continue to Inbox Preview
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}