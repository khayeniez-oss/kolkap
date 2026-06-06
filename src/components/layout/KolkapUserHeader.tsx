"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  ChevronDown,
  Home,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Tags,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  kolkapLanguageOptions,
  useKolkapLanguage,
} from "@/app/context/LanguageContext";
import KolkapLogo from "@/components/brand/KolkapLogo";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Create AI",
    href: "/dashboard/create-ai",
    icon: Bot,
  },
  {
    label: "Pricing",
    href: "/pricing",
    icon: Tags,
  },
];

const translations = {
  en: {
    login: "Login",
    start: "Start",
    dashboard: "Dashboard",
    logout: "Logout",
    language: "Language",
    notifications: "Notifications",
  },
  id: {
    login: "Login",
    start: "Start",
    dashboard: "Dashboard",
    logout: "Logout",
    language: "Language",
    notifications: "Notifications",
  },
  zh: {
    login: "登录",
    start: "开始",
    dashboard: "Dashboard",
    logout: "Logout",
    language: "语言",
    notifications: "通知",
  },
  ms: {
    login: "Login",
    start: "Start",
    dashboard: "Dashboard",
    logout: "Logout",
    language: "Language",
    notifications: "Notifications",
  },
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function KolkapUserHeader() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { language, setLanguage, languageLabel } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const isInsideDashboard = pathname.startsWith("/dashboard");

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
        <Link href="/" className="shrink-0">
          <KolkapLogo size="sm" />
        </Link>

        <nav className="hidden items-center gap-3 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setLanguageOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
            >
              <Languages className="h-5 w-5" />
              {languageLabel}
              <ChevronDown className="h-4 w-4" />
            </button>

            {languageOpen ? (
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                {kolkapLanguageOptions.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLanguage(item.code);
                      setLanguageOpen(false);
                    }}
                    className={`block w-full rounded-2xl px-5 py-3 text-left text-base font-black transition ${
                      language === item.code
                        ? "bg-[#07111F] text-white"
                        : "text-slate-700 hover:bg-[#F7F9FA]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-[#F7F9FA] text-[#07111F] transition hover:border-blue-400 hover:bg-white"
            aria-label={t.notifications}
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
              {t.dashboard}
            </Link>
          ) : null}

          {!isCheckingAuth && isLoggedIn ? (
            <Link
              href="/logout"
              className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5"
            >
              <LogOut className="h-5 w-5" />
              {t.logout}
            </Link>
          ) : null}

          {!isCheckingAuth && !isLoggedIn ? (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-base font-black text-slate-700 transition hover:border-blue-400 hover:bg-white"
              >
                {t.login}
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <Sparkles className="h-5 w-5" />
                {t.start}
              </Link>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-[#F7F9FA] text-[#07111F] lg:hidden"
          aria-label="Open menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
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

            <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] p-3">
              <div className="mb-2 flex items-center gap-2 px-2 text-base font-black text-slate-500">
                <Languages className="h-5 w-5" />
                {t.language}
              </div>

              <div className="grid gap-2">
                {kolkapLanguageOptions.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLanguage(item.code)}
                    className={`rounded-xl px-4 py-3 text-left text-base font-black ${
                      language === item.code
                        ? "bg-[#07111F] text-white"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-black text-slate-700"
            >
              <span className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                {t.notifications}
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
                    {t.dashboard}
                  </Link>
                ) : null}

                <Link
                  href="/logout"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#07111F] px-5 py-4 text-center text-lg font-black text-white"
                >
                  {t.logout}
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
                  {t.login}
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#07111F] px-5 py-4 text-center text-lg font-black text-white"
                >
                  {t.start}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}