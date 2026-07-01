import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const adminCards = [
  {
    title: "WhatsApp AI Inbox",
    description:
      "Monitor customers asking about Kolkap through WhatsApp. Pause AI, resume AI, mark handled, and reply manually.",
    href: "/admin/whatsapp",
    icon: MessageCircle,
    status: "Ready",
  },
  {
    title: "Users",
    description:
      "Review Kolkap users, admin access, account status, and customer signups.",
    href: "/admin/users",
    icon: UsersRound,
    status: "Ready",
  },
  {
    title: "Workspaces",
    description:
      "Monitor business workspaces, trial status, plan status, and setup progress.",
    href: "/admin/workspaces",
    icon: LayoutDashboard,
    status: "Ready",
  },
  {
    title: "AI Usage",
    description:
      "Track credits, AI replies, content generation, WhatsApp replies, and usage events.",
    href: "/admin/usage",
    icon: BarChart3,
    status: "Coming next",
  },
  {
    title: "Billing",
    description:
      "Review subscriptions, top-ups, failed payments, trial activations, and cancellations.",
    href: "/admin/billing",
    icon: CreditCard,
    status: "Coming next",
  },
  {
    title: "Support Inbox",
    description:
      "Handle Kolkap support requests, account issues, and customer follow-ups.",
    href: "/admin/support",
    icon: Inbox,
    status: "Coming next",
  },
];

export default function KolkapAdminHomePage() {
  return (
    <main className="grid gap-6">
      <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
        <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-[#7CFF3D]">
          <ShieldCheck className="h-5 w-5" />
          Internal Admin Dashboard
        </div>

        <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
          Manage Kolkap operations from one admin area.
        </h1>

        <p className="mt-5 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
          This area is separate from the customer dashboard. Use it to monitor
          WhatsApp AI, users, workspaces, billing, usage, and support.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((card) => {
          const Icon = card.icon;
          const isReady = card.status === "Ready";

          return (
            <Link
              key={card.href}
              href={isReady ? card.href : "/admin"}
              className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    isReady
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {card.status}
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">
                {card.title}
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                {card.description}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">
                Open
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}