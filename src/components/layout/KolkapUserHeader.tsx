"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  HelpCircle,
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

function navClass(active: boolean) {
  return `inline-flex items-center gap-2 rounded-full border px-5 py-3 text-base font-black transition ${
    active
      ? "border-[#07111F] bg-[#07111F] text-white"
      : "border-slate-200 bg-[#F7F9FA] text-slate-700 hover:border-blue-400 hover:bg-white"
  }`;
}

function mobileNavClass(active: boolean) {
  return `flex items-center gap-3 rounded-2xl border px-5 py-4 text-lg font-black transition ${
    active
      ? "border-[#07111F] bg-[#07111F] text-white"
      : "border-slate-200 bg-[#F7F9FA] text-slate-700"
  }`;
}

function formatUnreadCount(count: number) {
  if (count > 99) return "99+";
  return String(count);
}

export default function KolkapUserHeader() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const isInsideDashboard = pathname.startsWith("/dashboard");
  const isPublicVisitor = isCheckingAuth ? true : !isLoggedIn;

  const helpActive = isActivePath(pathname, "/dashboard/help");
  const notificationsActive = isActivePath(pathname, "/dashboard/notifications");

  const hasUnreadNotifications = unreadCount > 0;
  const unreadLabel = formatUnreadCount(unreadCount);

  async function loadUnreadCount(accessToken?: string) {
    try {
      const supabase = createClient();
      let token = accessToken || "";

      if (!token) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        token = session?.access_token || "";
      }

      if (!token) {
        setUnreadCount(0);
        return;
      }

      const params = new URLSearchParams({
        status: "unread",
        page: "1",
        pageSize: "1",
      });

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        setUnreadCount(0);
        return;
      }

      setUnreadCount(Number(result.unreadCount || 0));
    } catch (error) {
      console.error("Failed to load notification count:", error);
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoggedIn(Boolean(session));
      setIsCheckingAuth(false);

      if (session?.access_token) {
        await loadUnreadCount(session.access_token);
      } else {
        setUnreadCount(0);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoggedIn(Boolean(session));
      setIsCheckingAuth(false);

      if (session?.access_token) {
        await loadUnreadCount(session.access_token);
      } else {
        setUnreadCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && isLoggedIn) {
      loadUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isCheckingAuth, isLoggedIn]);

  useEffect(() => {
    if (isCheckingAuth || !isLoggedIn) return;

    const supabase = createClient();
    let isActive = true;
    const channels: Array<ReturnType<typeof supabase.channel>> = [];

    async function subscribeToNotificationChanges() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;
      const accessToken = session?.access_token;

      if (!isActive || !userId || !accessToken) return;

      const refreshCount = () => {
        loadUnreadCount(accessToken);
      };

      const recipientChannel = supabase
        .channel(`web-header-notifications-recipient-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "kolkap_notifications",
            filter: `recipient_user_id=eq.${userId}`,
          },
          refreshCount
        )
        .subscribe();

      const ownerChannel = supabase
        .channel(`web-header-notifications-owner-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "kolkap_notifications",
            filter: `owner_user_id=eq.${userId}`,
          },
          refreshCount
        )
        .subscribe();

      channels.push(recipientChannel, ownerChannel);
    }

    subscribeToNotificationChanges();

    return () => {
      isActive = false;
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingAuth, isLoggedIn]);

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
              <Link key={item.label} href={href} className={navClass(active)}>
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {!isCheckingAuth && isLoggedIn ? (
            <>
              <Link
                href="/dashboard/help"
                className={navClass(helpActive)}
                aria-label="Help Centre"
              >
                <HelpCircle className="h-5 w-5" />
                Help Centre
              </Link>

              <Link
                href="/dashboard/notifications"
                className={`relative inline-flex h-12 w-12 items-center justify-center rounded-full border transition ${
                  notificationsActive
                    ? "border-[#07111F] bg-[#07111F] text-white"
                    : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:border-blue-400 hover:bg-white"
                }`}
                aria-label={
                  hasUnreadNotifications
                    ? `Notifications, ${unreadCount} unread`
                    : "Notifications"
                }
              >
                <Bell className="h-5 w-5" />

                {hasUnreadNotifications ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-6 items-center justify-center rounded-full bg-[#7CFF3D] px-1.5 py-1 text-[10px] font-black leading-none text-[#07111F] ring-2 ring-white">
                    {unreadLabel}
                  </span>
                ) : null}
              </Link>
            </>
          ) : null}

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
                  className={mobileNavClass(active)}
                >
                  <Icon className="h-6 w-6" />
                  {item.label}
                </Link>
              );
            })}

            {!isCheckingAuth && isLoggedIn ? (
              <>
                <Link
                  href="/dashboard/help"
                  onClick={() => setOpen(false)}
                  className={mobileNavClass(helpActive)}
                >
                  <HelpCircle className="h-6 w-6" />
                  Help Centre
                </Link>

                <Link
                  href="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className={mobileNavClass(notificationsActive)}
                >
                  <span className="flex flex-1 items-center gap-3">
                    <Bell className="h-6 w-6" />
                    Notifications
                  </span>

                  {hasUnreadNotifications ? (
                    <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-[#7CFF3D] px-2 py-1 text-xs font-black text-[#07111F]">
                      {unreadLabel}
                    </span>
                  ) : null}
                </Link>
              </>
            ) : null}

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