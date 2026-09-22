"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Globe2,
  Mail,
  MessageCircle,
  Smartphone,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";
import { createClient } from "@/lib/supabase/client";
import { getWhatsAppChannelStatus } from "@/lib/whatsapp/connectionStatus";

type ChannelStatus =
  | "checking"
  | "setup"
  | "ready"
  | "live"
  | "paused"
  | "inbox"
  | "attention"
  | "later";

type ChannelCard = {
  name: string;
  status: ChannelStatus;
  statusLabel: string;
  description: string;
  icon: LucideIcon;
  action: string;
  href?: string;
  highlighted?: boolean;
};

function StatusPill({
  status,
  label,
}: {
  status: ChannelStatus;
  label: string;
}) {
  const className = {
    checking: "bg-slate-200 text-slate-700",
    setup: "bg-amber-100 text-amber-800",
    ready: "bg-blue-100 text-blue-800",
    live: "bg-[#7CFF3D] text-[#07111F]",
    paused: "bg-slate-200 text-slate-700",
    inbox: "bg-violet-100 text-violet-800",
    attention: "bg-red-100 text-red-700",
    later: "bg-slate-200 text-slate-700",
  }[status];

  return (
    <span className={`rounded-full px-4 py-2 text-xs font-black ${className}`}>
      {label}
    </span>
  );
}

export default function IntegrationsPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const [websiteChatStatus, setWebsiteChatStatus] = useState<{
    status: ChannelStatus;
    label: string;
  }>({ status: "checking", label: "Checking..." });
  const [whatsAppStatus, setWhatsAppStatus] = useState<{
    status: ChannelStatus;
    label: string;
  }>({ status: "checking", label: "Checking..." });
  const [emailStatus, setEmailStatus] = useState<{
    status: ChannelStatus;
    label: string;
  }>({ status: "checking", label: "Checking..." });

  useEffect(() => {
    let isCurrent = true;

    async function loadEmailStatus() {
      if (!workspace?.id) return;
      setEmailStatus({ status: "checking", label: "Checking..." });

      try {
        const { data, error } = await createClient()
          .from("workspace_email_connections")
          .select(
            "status,ai_enabled,auto_reply_enabled,selected_ai_staff_id,is_primary"
          )
          .eq("workspace_id", workspace.id)
          .neq("status", "revoked")
          .order("is_primary", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!isCurrent) return;
        if (error) throw error;

        if (!data) {
          setEmailStatus({ status: "setup", label: "Not Connected" });
        } else if (
          ["failed", "reauthorization_required"].includes(data.status)
        ) {
          setEmailStatus({ status: "attention", label: "Needs Attention" });
        } else if (data.status !== "connected") {
          setEmailStatus({ status: "paused", label: "Paused" });
        } else if (
          data.ai_enabled &&
          data.auto_reply_enabled &&
          data.selected_ai_staff_id
        ) {
          setEmailStatus({ status: "live", label: "AI Replies On" });
        } else {
          setEmailStatus({ status: "inbox", label: "AI Replies Off" });
        }
      } catch {
        if (isCurrent) {
          setEmailStatus({ status: "attention", label: "Could Not Check" });
        }
      }
    }

    void loadEmailStatus();

    return () => {
      isCurrent = false;
    };
  }, [workspace?.id]);

  useEffect(() => {
    let isCurrent = true;

    async function loadWhatsAppStatus() {
      if (!workspace?.id) return;
      setWhatsAppStatus({ status: "checking", label: "Checking..." });

      try {
        const { data, error } = await createClient()
          .from("workspace_whatsapp_connections")
          .select(
            "status,meta_phone_number_id,meta_waba_id,last_error_code,last_inbound_at,ai_enabled,auto_reply_enabled,selected_ai_staff_id"
          )
          .eq("workspace_id", workspace.id);

        if (!isCurrent) return;
        if (error) throw error;
        setWhatsAppStatus(getWhatsAppChannelStatus(data || []));
      } catch {
        if (isCurrent) {
          setWhatsAppStatus({
            status: "attention",
            label: "Could Not Check",
          });
        }
      }
    }

    void loadWhatsAppStatus();

    return () => {
      isCurrent = false;
    };
  }, [workspace?.id]);

  useEffect(() => {
    let isCurrent = true;

    async function loadWebsiteChatStatus() {
      if (!workspace?.id) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("workspace_website_chat_settings")
        .select(
          "selected_ai_staff_id,is_active,ai_enabled,auto_reply_enabled,allowed_domains,last_seen_at"
        )
        .eq("workspace_id", workspace.id)
        .maybeSingle();

      if (!isCurrent) return;

      if (error) {
        setWebsiteChatStatus({
          status: "attention",
          label: "Needs Attention",
        });
        return;
      }

      if (!data) {
        setWebsiteChatStatus({ status: "setup", label: "Not Connected" });
        return;
      }

      if (!data.is_active) {
        setWebsiteChatStatus({ status: "paused", label: "Paused" });
        return;
      }

      if (!Array.isArray(data.allowed_domains) || !data.allowed_domains.length) {
        setWebsiteChatStatus({ status: "setup", label: "Add Website" });
        return;
      }

      if (
        data.ai_enabled &&
        data.auto_reply_enabled &&
        !data.selected_ai_staff_id
      ) {
        setWebsiteChatStatus({ status: "setup", label: "Choose AI Staff" });
        return;
      }

      if (!data.ai_enabled || !data.auto_reply_enabled) {
        setWebsiteChatStatus({ status: "inbox", label: "AI Replies Off" });
        return;
      }

      const lastSeenAt = data.last_seen_at
        ? new Date(data.last_seen_at).getTime()
        : 0;
      const recentlySeen =
        lastSeenAt > 0 && Date.now() - lastSeenAt < 15 * 60 * 1000;

      setWebsiteChatStatus(
        recentlySeen
          ? { status: "live", label: "AI Replies On" }
          : { status: "ready", label: "Ready to Install" }
      );
    }

    void loadWebsiteChatStatus();

    return () => {
      isCurrent = false;
    };
  }, [workspace?.id]);

  const channels: ChannelCard[] = [
    {
      name: "Website Chat",
      status: websiteChatStatus.status,
      statusLabel:
        websiteChatStatus.status === "setup"
          ? websiteChatStatus.label.replace("Setup Required", "Not Connected")
          : websiteChatStatus.label,
      description:
        "Add chat to your website so visitors can contact your business and keep every conversation in Kolkap.",
      icon: MessageCircle,
      action:
        websiteChatStatus.status === "setup"
          ? "Set Up Website Chat"
          : "Manage Website Chat",
      href: "/dashboard/integrations/website-chat",
      highlighted: true,
    },
    {
      name: "WhatsApp",
      status: whatsAppStatus.status,
      statusLabel:
        whatsAppStatus.status === "setup"
          ? whatsAppStatus.label.replace("Setup Required", "Not Connected")
          : whatsAppStatus.label,
      description:
        "Connect your business WhatsApp number and manage customer conversations in Kolkap.",
      icon: Smartphone,
      action:
        whatsAppStatus.status === "setup"
          ? "Connect WhatsApp"
          : "Manage WhatsApp",
      href: "/dashboard/integrations/whatsapp",
      highlighted: true,
    },
    {
      name: "Email",
      status: emailStatus.status,
      statusLabel:
        emailStatus.status === "setup" ? "Not Connected" : emailStatus.label,
      description:
        "Connect Gmail or Google Workspace. Emails stay in your business mailbox, and replies are sent from the same address.",
      icon: Mail,
      action: emailStatus.status === "setup" ? "Connect Email" : "Manage Email",
      href: "/dashboard/integrations/email",
      highlighted: true,
    },
    {
      name: "SMS",
      status: "later",
      statusLabel: "Coming Later",
      description: "Text messaging is coming soon.",
      icon: Smartphone,
      action: "Coming Later",
    },
  ];

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading customer channels...
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
            <p className="text-xl font-black">
              Customer Channels page could not load.
            </p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>

          <p className="mt-8 text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
            Customer Channels
          </p>

          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Connect your customer channels.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Manage Website Chat, WhatsApp, and Email in one place. Choose an AI
            staff member for each channel, then turn automatic replies on when
            you&apos;re ready.
          </p>

          <a
            href="#channels"
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
          >
            <Globe2 className="h-6 w-6" />
            Choose a Channel
          </a>
        </section>

        <section id="channels">
          <div className="mb-6">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Your Channels
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              Connect or manage a channel.
            </h2>
            <p className="mt-3 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              Select a channel below to connect it, check its status, or change
              how replies work.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {channels.map((channel) => {
              const Icon = channel.icon;

              const cardContent = (
                <>
                  <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                      channel.highlighted
                        ? "bg-white text-[#07111F]"
                        : "bg-[#07111F] text-[#7CFF3D]"
                    }`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-3xl font-black tracking-[-0.04em]">
                      {channel.name}
                    </h3>

                    <StatusPill
                      status={channel.status}
                      label={channel.statusLabel}
                    />
                  </div>

                  <p
                    className={`mt-4 text-lg font-semibold leading-8 ${
                      channel.highlighted ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {channel.description}
                  </p>

                  <div
                    className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-base font-black ${
                      channel.highlighted
                        ? "bg-white text-[#07111F]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {channel.action}
                    {channel.href ? <ArrowRight className="h-5 w-5" /> : null}
                  </div>
                </>
              );

              const className = `rounded-[2rem] border p-6 shadow-sm shadow-slate-900/5 transition ${
                channel.highlighted
                  ? "border-[#07111F] bg-[#07111F] text-white hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                  : "cursor-not-allowed border-slate-200 bg-white text-[#07111F] opacity-85"
              }`;

              if (!channel.href) {
                return (
                  <div key={channel.name} className={className}>
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link key={channel.name} href={channel.href} className={className}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-5 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <UsersRound className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em]">
              You stay in control.
            </h2>
            <p className="mt-2 text-lg font-semibold leading-8 text-slate-600">
              AI replies are optional. Your team can turn them on or off for
              each channel and take over any conversation at any time.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
