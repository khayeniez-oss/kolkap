"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Tags,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import KolkapLogo from "@/components/brand/KolkapLogo";
import { createClient } from "@/lib/supabase/client";

const STARTER_SIGNUP_URL = "/signup?plan=starter";

type NavItem = {
  label: string;
  href: string;
  publicHref?: string;
  icon: typeof Home;
};

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Create AI",
    href: "/dashboard/agents/new",
    publicHref: STARTER_SIGNUP_URL,
    icon: Bot,
  },
  {
    label: "Pricing",
    href: "/pricing",
    icon: Tags,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function KolkapUserHeader() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isInsideDashboard = pathname.startsWith("/dashboard");
  const isPublicVisitor = isCheckingAuth ? true : !isLoggedIn;

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoggedIn(Boolean(session));
      setIsCheckingAuth(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
      setIsCheckingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-4">
          <KolkapLogo size="sm" showText={false} />

          <div className="min-w-0">
            <p className="text-2xl font-black leading-none tracking-[-0.055em] text-[#07111F]">
              kolkap
            </p>

            <p className="mt-2 text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-600">
              24/7 AI Staff Responses
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const href =
              isPublicVisitor && item.publicHref ? item.publicHref : item.href;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-base font-black transition ${
                  active
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-[#F7F9FA] text-[#07111F] transition hover:border-blue-400 hover:bg-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#7CFF3D]" />
          </button>

          {!isCheckingAuth && isLoggedIn && !isInsideDashboard ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
          ) : null}

          {!isCheckingAuth && isLoggedIn ? (
            <Link
              href="/logout"
              className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Link>
          ) : null}

          {!isCheckingAuth && !isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
              >
                Login
              </Link>

              <Link
                href={STARTER_SIGNUP_URL}
                className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <Sparkles className="h-5 w-5" />
                Start
              </Link>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-[#F7F9FA] text-[#07111F] lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const href =
                isPublicVisitor && item.publicHref ? item.publicHref : item.href;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-lg font-black transition ${
                    active
                      ? "border-[#07111F] bg-[#07111F] text-white"
                      : "border-slate-200 bg-[#F7F9FA] text-slate-700"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-black text-slate-700"
            >
              <span className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                Notifications
              </span>

              <span className="h-3 w-3 rounded-full bg-[#7CFF3D]" />
            </button>

            {!isCheckingAuth && isLoggedIn ? (
              <div
                className={`grid gap-3 pt-2 ${
                  isInsideDashboard ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                {!isInsideDashboard ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-center text-lg font-black text-slate-700"
                  >
                    Dashboard
                  </Link>
                ) : null}

                <Link
                  href="/logout"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#07111F] px-5 py-4 text-center text-lg font-black text-white"
                >
                  Logout
                </Link>
              </div>
            ) : null}

            {!isCheckingAuth && !isLoggedIn ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-center text-lg font-black text-slate-700"
                >
                  Login
                </Link>

                <Link
                  href={STARTER_SIGNUP_URL}
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#07111F] px-5 py-4 text-center text-lg font-black text-white"
                >
                  Start
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}