"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Crown,
  Mail,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type WorkspaceRow = {
  id: string;
  owner_user_id: string;
  business_name?: string | null;
  business_email?: string | null;
};

type TeamMemberRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  role: string;
  permission_level: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

type Option = {
  value: string;
  label: string;
};

const roleOptions: Option[] = [
  { value: "Admin", label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "Inbox Agent", label: "Inbox Agent" },
  { value: "Sales Agent", label: "Sales Agent" },
  { value: "Content Assistant", label: "Content Assistant" },
  { value: "Viewer", label: "Viewer" },
];

const permissionOptions: Option[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "inbox", label: "Inbox" },
  { value: "sales", label: "Sales" },
  { value: "content", label: "Content" },
  { value: "viewer", label: "Viewer" },
];

const statusOptions: Option[] = [
  { value: "invited", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

function getOptionLabel(options: Option[], value: string) {
  return options.find((option) => option.value === value)?.label || value;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not accepted yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function TeamPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace as WorkspaceRow | null;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Inbox Agent");
  const [permissionLevel, setPermissionLevel] = useState("inbox");

  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionWarning, setActionWarning] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingMemberId, setSavingMemberId] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTeam() {
      if (!workspace?.id) return;

      setIsLoadingTeam(true);
      setTeamError("");

      const supabase = createClient();

      const { data, error } = await supabase
        .from("workspace_team_members")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setTeamError(error.message);
        setIsLoadingTeam(false);
        return;
      }

      setTeamMembers((data ?? []) as TeamMemberRow[]);
      setIsLoadingTeam(false);
    }

    loadTeam();

    return () => {
      isMounted = false;
    };
  }, [workspace?.id, reloadKey]);

  const activeCount = teamMembers.filter(
    (member) => member.status === "active"
  ).length;

  const pendingCount = teamMembers.filter(
    (member) => member.status === "invited"
  ).length;

  const adminCount = teamMembers.filter(
    (member) => member.permission_level === "admin"
  ).length;

  const disabledCount = teamMembers.filter(
    (member) => member.status === "disabled"
  ).length;

  const summaryCards = [
    {
      label: "Current Plan",
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: <WalletCards className="h-7 w-7" />,
    },
    {
      label: "Team Members",
      value: `${teamMembers.length}`,
      note: "People connected to this workspace",
      icon: <UsersRound className="h-7 w-7" />,
    },
    {
      label: "Active Members",
      value: `${activeCount}`,
      note: `${pendingCount} pending invitation(s)`,
      icon: <CheckCircle2 className="h-7 w-7" />,
    },
    {
      label: "Admin Access",
      value: `${adminCount}`,
      note: `${disabledCount} disabled member(s)`,
      icon: <Crown className="h-7 w-7" />,
    },
  ];

  async function handleSendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionWarning("");
    setActionError("");

    if (!workspace?.id) {
      setActionError("Workspace could not be found.");
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      setActionError("Please add full name and email address.");
      return;
    }

    const cleanedEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanedEmail)) {
      setActionError("Please enter a valid email address.");
      return;
    }

    setIsSendingInvite(true);

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspace_id: workspace.id,
          full_name: fullName.trim(),
          email: cleanedEmail,
          role,
          permission_level: permissionLevel,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        member?: TeamMemberRow;
        message?: string;
        invite_warning?: string | null;
        error?: string;
      };

      if (!response.ok) {
        setActionError(result.error || "Team invitation could not be sent.");
        setIsSendingInvite(false);
        return;
      }

      if (!result.member) {
        setActionError("Team member was not returned by the server.");
        setIsSendingInvite(false);
        return;
      }

      const savedMember = result.member;

      setTeamMembers((current) => {
        const alreadyExists = current.some(
          (member) => member.id === savedMember.id
        );

        if (alreadyExists) {
          return current.map((member) =>
            member.id === savedMember.id ? savedMember : member
          );
        }

        return [savedMember, ...current];
      });

      setFullName("");
      setEmail("");
      setRole("Inbox Agent");
      setPermissionLevel("inbox");

      setActionMessage(
        result.message || "Team member saved and invitation email sent."
      );

      if (result.invite_warning) {
        setActionWarning(result.invite_warning);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Team invitation could not be sent.";

      setActionError(message);
    }

    setIsSendingInvite(false);
  }

  async function updateMember(
    memberId: string,
    updates: Partial<Pick<TeamMemberRow, "role" | "permission_level" | "status">>
  ) {
    if (!workspace?.id) return;

    setActionMessage("");
    setActionWarning("");
    setActionError("");
    setSavingMemberId(memberId);

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("workspace_team_members")
      .update({
        ...updates,
        updated_at: now,
      })
      .eq("id", memberId)
      .eq("workspace_id", workspace.id);

    if (error) {
      setActionError(error.message || "Team member could not be updated.");
      setSavingMemberId("");
      return;
    }

    setTeamMembers((current) =>
      current.map((member) =>
        member.id === memberId
          ? {
              ...member,
              ...updates,
              updated_at: now,
            }
          : member
      )
    );

    setActionMessage("Team member updated.");
    setSavingMemberId("");
  }

  async function deleteMember(memberId: string) {
    if (!workspace?.id) return;

    setActionMessage("");
    setActionWarning("");
    setActionError("");

    const shouldDelete = window.confirm("Delete this team member?");

    if (!shouldDelete) return;

    setSavingMemberId(memberId);

    const supabase = createClient();

    const { error } = await supabase
      .from("workspace_team_members")
      .delete()
      .eq("id", memberId)
      .eq("workspace_id", workspace.id);

    if (error) {
      setActionError(error.message || "Team member could not be deleted.");
      setSavingMemberId("");
      return;
    }

    setTeamMembers((current) =>
      current.filter((member) => member.id !== memberId)
    );

    setActionMessage("Team member deleted.");
    setSavingMemberId("");
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your team...
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
            <p className="text-xl font-black">Team page could not load.</p>
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
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
              Refresh
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <UsersRound className="h-5 w-5" />
            Team
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Manage your workspace team.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Add team members, send email invitations, organize roles, and manage
            who helps with inbox, leads, content, and workspace operations.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              note={card.note}
            />
          ))}
        </div>

        <div className="mb-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Crown className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              Workspace Owner
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              The owner has full control of billing, AI setup, inbox, leads,
              reports, settings, and team access.
            </h2>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                  <UserRound className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <p className="text-2xl font-black">
                    {workspace?.business_name || "Workspace Owner"}
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-base font-semibold leading-7 text-slate-300">
                    <Mail className="h-4 w-4" />
                    {workspace?.business_email || "Owner"}
                  </p>

                  <p className="mt-4 inline-flex rounded-full bg-[#7CFF3D] px-5 py-3 text-sm font-black text-[#07111F]">
                    Full Access
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Plus className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Add Team Member
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              Add a team member and send an email invitation so they can join
              your workspace.
            </h2>

            <form onSubmit={handleSendInvite} className="mt-8 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                />

                <TextInput
                  label="Email address"
                  value={email}
                  onChange={setEmail}
                  type="email"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <SelectInput
                  label="Role"
                  value={role}
                  onChange={setRole}
                  options={roleOptions}
                />

                <SelectInput
                  label="Permission level"
                  value={permissionLevel}
                  onChange={setPermissionLevel}
                  options={permissionOptions}
                />
              </div>

              {actionMessage ? (
                <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                  <p className="flex items-center gap-3 text-base font-black">
                    <CheckCircle2 className="h-5 w-5" />
                    {actionMessage}
                  </p>
                </div>
              ) : null}

              {actionWarning ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                  <p className="text-base font-black">Invite warning</p>
                  <p className="mt-2 text-sm font-bold leading-6">
                    {actionWarning}
                  </p>
                </div>
              ) : null}

              {actionError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                  <p className="text-base font-black">{actionError}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSendingInvite}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-6 w-6" />
                {isSendingInvite ? "Sending invite..." : "Send Invite"}
              </button>
            </form>
          </section>
        </div>

        <section className="mb-8 rounded-[2.2rem] border border-blue-100 bg-blue-50 p-6 text-blue-950 shadow-sm shadow-blue-900/5 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700">
              <CircleAlert className="h-7 w-7" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
                Team Roles
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                Use team roles to organize who helps manage inbox, leads,
                content, and workspace operations. You can update roles,
                permissions, and member status anytime as your business grows.
              </h2>
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              Team Members
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              Manage people connected to this business workspace.
            </h2>
          </div>

          {teamError ? (
            <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="text-base font-black">{teamError}</p>
            </div>
          ) : null}

          {isLoadingTeam ? (
            <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6 text-lg font-black">
              Loading your team...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                <UsersRound className="h-8 w-8" />
              </div>

              <h3 className="text-4xl font-black tracking-[-0.05em]">
                No team members yet.
              </h3>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
                Send your first team invitation when you are ready to let someone
                help with inbox, leads, content, or workspace operations.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {teamMembers.map((member) => {
                const isSaving = savingMemberId === member.id;

                return (
                  <div
                    key={member.id}
                    className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                          <UserRound className="h-7 w-7" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-2xl font-black tracking-[-0.04em]">
                            {member.full_name}
                          </h3>

                          <p className="mt-2 flex items-center gap-2 text-base font-semibold leading-7 text-slate-600">
                            <Mail className="h-4 w-4" />
                            {member.email}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge
                              text={getOptionLabel(roleOptions, member.role)}
                            />
                            <Badge
                              text={getOptionLabel(
                                permissionOptions,
                                member.permission_level
                              )}
                            />
                            <Badge
                              text={getOptionLabel(
                                statusOptions,
                                member.status
                              )}
                            />
                          </div>

                          <p className="mt-4 text-sm font-bold leading-6 text-slate-500">
                            Invited: {formatDate(member.invited_at)} • Accepted:{" "}
                            {formatDate(member.accepted_at)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3 xl:w-[560px]">
                        <SelectInput
                          label="Role"
                          value={member.role}
                          onChange={(value) =>
                            updateMember(member.id, { role: value })
                          }
                          options={roleOptions}
                          small
                        />

                        <SelectInput
                          label="Permission"
                          value={member.permission_level}
                          onChange={(value) =>
                            updateMember(member.id, {
                              permission_level: value,
                            })
                          }
                          options={permissionOptions}
                          small
                        />

                        <SelectInput
                          label="Status"
                          value={member.status}
                          onChange={(value) =>
                            updateMember(member.id, { status: value })
                          }
                          options={statusOptions}
                          small
                        />

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => deleteMember(member.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3"
                        >
                          <Trash2 className="h-4 w-4" />
                          {isSaving ? "Saving..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
        {icon}
      </div>

      <p className="text-lg font-black text-slate-500">{label}</p>

      <p className="mt-2 text-3xl font-black tracking-[-0.04em]">{value}</p>

      <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
        {note}
      </p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
      {text}
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-base font-black text-slate-700">{label}</span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  small,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  small?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span
        className={`font-black text-slate-700 ${
          small ? "text-sm" : "text-base"
        }`}
      >
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 font-black outline-none transition focus:border-blue-500 ${
          small ? "h-12 text-sm" : "h-14 text-lg"
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}