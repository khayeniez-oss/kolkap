import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CreditCard,
  Home,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Settings,
  UsersRound,
} from "lucide-react";
import KolkapLogo from "@/components/brand/KolkapLogo";

export const metadata: Metadata = {
  title: "Kolkap Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

const adminNavItems = [
  {
    label: "Admin Home",
    href: "/admin",
    icon: Home,
  },
  {
    label: "WhatsApp AI Inbox",
    href: "/admin/whatsapp",
    icon: MessageCircle,
  },
  {
    label: "WhatsApp Campaigns",
    href: "/admin/whatsapp/campaigns",
    icon: Megaphone,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    label: "Workspaces",
    href: "/admin/workspaces",
    icon: LayoutDashboard,
  },
  {
    label: "AI Usage",
    href: "/admin/usage",
    icon: BarChart3,
  },
  {
    label: "Billing",
    href: "/admin/billing",
    icon: CreditCard,
  },
  {
    label: "Needs Attention",
    href: "/admin/needs-attention",
    icon: AlertTriangle,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/admin" className="flex items-center gap-4">
            <KolkapLogo size="sm" showText={false} />

            <div>
              <p className="text-2xl font-black leading-none tracking-[-0.055em]">
                Kolkap Admin
              </p>

              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Internal control center
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
            >
              Customer Dashboard
            </Link>

            <Link
              href="/logout"
              className="rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              Logout
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 lg:sticky lg:top-28 lg:h-fit">
          <p className="mb-3 px-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Admin Menu
          </p>

          <nav className="grid gap-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-400 hover:bg-white hover:text-[#07111F]"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Bot className="mt-1 h-5 w-5 shrink-0 text-blue-700" />

              <p className="text-xs font-bold leading-5 text-blue-900">
                This admin area is for Kolkap internal monitoring only. Customer
                users should use the normal dashboard.
              </p>
            </div>
          </div>
        </aside>

        <section>{children}</section>
      </div>
    </div>
  );
}