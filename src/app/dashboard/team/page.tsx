"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
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
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan, getPlanAIStaffLabel } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type TeamMemberRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  full_name: string;
  email: string;
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

type TeamTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  back: string;
  refresh: string;
  currentPlan: string;
  teamMembers: string;
  activeMembers: string;
  pendingMembers: string;
  owner: string;
  ownerText: string;
  workspaceOwner: string;
  ownerAccess: string;
  addTeam: string;
  addTeamText: string;
  fullName: string;
  email: string;
  role: string;
  permission: string;
  status: string;
  saveMember: string;
  savingMember: string;
  memberSaved: string;
  memberSaveFailed: string;
  requiredFields: string;
  teamList: string;
  teamListText: string;
  noMembers: string;
  noMembersText: string;
  updateSaved: string;
  updateFailed: string;
  deleteMember: string;
  deleteConfirm: string;
  teamRoles: string;
  teamRolesText: string;
  saving: string;
  roles: Option[];
  permissions: Option[];
  statuses: Option[];
  statusLabels: Record<string, string>;
  permissionLabels: Record<string, string>;
};

const translations: Record<string, TeamTranslation> = {
  en: {
    badge: "Team",
    title: "Manage your workspace team.",
    subtitle:
      "Add team members, organize roles, and manage who helps with inbox, leads, content, and workspace operations.",
    loading: "Loading your team...",
    failed: "Team page could not load.",
    back: "Back to Dashboard",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    teamMembers: "Team Members",
    activeMembers: "Active Members",
    pendingMembers: "Pending Members",
    owner: "Workspace Owner",
    ownerText:
      "The owner has full control of the business workspace, billing, AI setup, inbox, leads, reports, and settings.",
    workspaceOwner: "Workspace Owner",
    ownerAccess: "Full Access",
    addTeam: "Add Team Member",
    addTeamText:
      "Add people who help manage customer conversations, leads, content, or workspace operations.",
    fullName: "Full name",
    email: "Email address",
    role: "Role",
    permission: "Permission level",
    status: "Status",
    saveMember: "Save Team Member",
    savingMember: "Saving team member...",
    memberSaved: "Team member saved successfully.",
    memberSaveFailed: "Team member could not be saved.",
    requiredFields: "Please add full name and email address.",
    teamList: "Team Members",
    teamListText:
      "Manage the people connected to this business workspace.",
    noMembers: "No team members yet.",
    noMembersText:
      "Add your first team member when you are ready to let someone help with inbox, leads, content, or workspace operations.",
    updateSaved: "Team member updated.",
    updateFailed: "Team member could not be updated.",
    deleteMember: "Delete",
    deleteConfirm: "Delete this team member?",
    teamRoles: "Team Roles",
    teamRolesText:
      "Use team roles to organize who helps manage inbox, leads, content, and workspace operations. You can update roles, permissions, and member status anytime as your business grows.",
    saving: "Saving...",
    roles: [
      { value: "Admin", label: "Admin" },
      { value: "Manager", label: "Manager" },
      { value: "Inbox Agent", label: "Inbox Agent" },
      { value: "Sales Agent", label: "Sales Agent" },
      { value: "Content Assistant", label: "Content Assistant" },
      { value: "Viewer", label: "Viewer" },
    ],
    permissions: [
      { value: "admin", label: "Admin" },
      { value: "manager", label: "Manager" },
      { value: "inbox", label: "Inbox" },
      { value: "sales", label: "Sales" },
      { value: "content", label: "Content" },
      { value: "viewer", label: "Viewer" },
    ],
    statuses: [
      { value: "invited", label: "Pending" },
      { value: "active", label: "Active" },
      { value: "disabled", label: "Disabled" },
    ],
    statusLabels: {
      invited: "Pending",
      active: "Active",
      disabled: "Disabled",
    },
    permissionLabels: {
      admin: "Admin",
      manager: "Manager",
      inbox: "Inbox",
      sales: "Sales",
      content: "Content",
      viewer: "Viewer",
    },
  },

  id: {
    badge: "Team",
    title: "Kelola team workspace Anda.",
    subtitle:
      "Tambah team member, atur role, dan kelola siapa yang membantu inbox, leads, content, dan operasional workspace.",
    loading: "Memuat team Anda...",
    failed: "Halaman Team gagal dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Refresh",
    currentPlan: "Paket Saat Ini",
    teamMembers: "Team Members",
    activeMembers: "Member Aktif",
    pendingMembers: "Member Pending",
    owner: "Workspace Owner",
    ownerText:
      "Owner memiliki kontrol penuh atas business workspace, billing, AI setup, inbox, leads, reports, dan settings.",
    workspaceOwner: "Workspace Owner",
    ownerAccess: "Full Access",
    addTeam: "Add Team Member",
    addTeamText:
      "Tambah orang yang membantu mengelola percakapan customer, leads, content, atau operasional workspace.",
    fullName: "Nama lengkap",
    email: "Alamat email",
    role: "Role",
    permission: "Permission level",
    status: "Status",
    saveMember: "Save Team Member",
    savingMember: "Menyimpan team member...",
    memberSaved: "Team member berhasil disimpan.",
    memberSaveFailed: "Team member gagal disimpan.",
    requiredFields: "Mohon isi nama lengkap dan alamat email.",
    teamList: "Team Members",
    teamListText:
      "Kelola orang yang terhubung dengan business workspace ini.",
    noMembers: "Belum ada team member.",
    noMembersText:
      "Tambah team member pertama saat Anda siap meminta bantuan untuk inbox, leads, content, atau operasional workspace.",
    updateSaved: "Team member berhasil diperbarui.",
    updateFailed: "Team member gagal diperbarui.",
    deleteMember: "Delete",
    deleteConfirm: "Hapus team member ini?",
    teamRoles: "Team Roles",
    teamRolesText:
      "Gunakan team roles untuk mengatur siapa yang membantu mengelola inbox, leads, content, dan operasional workspace. Anda dapat memperbarui role, permission, dan status member kapan saja seiring bisnis berkembang.",
    saving: "Menyimpan...",
    roles: [
      { value: "Admin", label: "Admin" },
      { value: "Manager", label: "Manager" },
      { value: "Inbox Agent", label: "Inbox Agent" },
      { value: "Sales Agent", label: "Sales Agent" },
      { value: "Content Assistant", label: "Content Assistant" },
      { value: "Viewer", label: "Viewer" },
    ],
    permissions: [
      { value: "admin", label: "Admin" },
      { value: "manager", label: "Manager" },
      { value: "inbox", label: "Inbox" },
      { value: "sales", label: "Sales" },
      { value: "content", label: "Content" },
      { value: "viewer", label: "Viewer" },
    ],
    statuses: [
      { value: "invited", label: "Pending" },
      { value: "active", label: "Active" },
      { value: "disabled", label: "Disabled" },
    ],
    statusLabels: {
      invited: "Pending",
      active: "Active",
      disabled: "Disabled",
    },
    permissionLabels: {
      admin: "Admin",
      manager: "Manager",
      inbox: "Inbox",
      sales: "Sales",
      content: "Content",
      viewer: "Viewer",
    },
  },

  zh: {
    badge: "团队",
    title: "管理您的工作区团队。",
    subtitle:
      "添加团队成员、设置角色，并管理谁可以协助 inbox、leads、content 和工作区运营。",
    loading: "正在加载团队...",
    failed: "Team 页面加载失败。",
    back: "返回仪表板",
    refresh: "刷新",
    currentPlan: "当前方案",
    teamMembers: "团队成员",
    activeMembers: "活跃成员",
    pendingMembers: "待处理成员",
    owner: "工作区 Owner",
    ownerText:
      "Owner 拥有业务工作区、账单、AI 设置、inbox、leads、reports 和 settings 的完整控制权。",
    workspaceOwner: "Workspace Owner",
    ownerAccess: "完整权限",
    addTeam: "添加团队成员",
    addTeamText:
      "添加可协助管理客户对话、线索、内容或工作区运营的人员。",
    fullName: "全名",
    email: "邮箱地址",
    role: "角色",
    permission: "权限等级",
    status: "状态",
    saveMember: "保存团队成员",
    savingMember: "正在保存团队成员...",
    memberSaved: "团队成员已成功保存。",
    memberSaveFailed: "团队成员保存失败。",
    requiredFields: "请填写全名和邮箱地址。",
    teamList: "团队成员",
    teamListText:
      "管理连接到此业务工作区的人员。",
    noMembers: "尚无团队成员。",
    noMembersText:
      "当您准备让他人协助 inbox、leads、content 或工作区运营时，可以添加第一位团队成员。",
    updateSaved: "团队成员已更新。",
    updateFailed: "团队成员更新失败。",
    deleteMember: "删除",
    deleteConfirm: "删除此团队成员？",
    teamRoles: "团队角色",
    teamRolesText:
      "使用团队角色来组织谁协助管理 inbox、leads、content 和工作区运营。随着业务成长，您可以随时更新角色、权限和成员状态。",
    saving: "正在保存...",
    roles: [
      { value: "Admin", label: "Admin" },
      { value: "Manager", label: "Manager" },
      { value: "Inbox Agent", label: "Inbox Agent" },
      { value: "Sales Agent", label: "Sales Agent" },
      { value: "Content Assistant", label: "Content Assistant" },
      { value: "Viewer", label: "Viewer" },
    ],
    permissions: [
      { value: "admin", label: "Admin" },
      { value: "manager", label: "Manager" },
      { value: "inbox", label: "Inbox" },
      { value: "sales", label: "Sales" },
      { value: "content", label: "Content" },
      { value: "viewer", label: "Viewer" },
    ],
    statuses: [
      { value: "invited", label: "Pending" },
      { value: "active", label: "Active" },
      { value: "disabled", label: "Disabled" },
    ],
    statusLabels: {
      invited: "Pending",
      active: "Active",
      disabled: "Disabled",
    },
    permissionLabels: {
      admin: "Admin",
      manager: "Manager",
      inbox: "Inbox",
      sales: "Sales",
      content: "Content",
      viewer: "Viewer",
    },
  },

  ms: {
    badge: "Team",
    title: "Urus team workspace anda.",
    subtitle:
      "Tambah team member, tetapkan role, dan urus siapa yang membantu inbox, leads, content, dan operasi workspace.",
    loading: "Memuat team anda...",
    failed: "Halaman Team gagal dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Refresh",
    currentPlan: "Pakej Semasa",
    teamMembers: "Team Members",
    activeMembers: "Member Aktif",
    pendingMembers: "Member Pending",
    owner: "Workspace Owner",
    ownerText:
      "Owner mempunyai kawalan penuh atas business workspace, billing, AI setup, inbox, leads, reports, dan settings.",
    workspaceOwner: "Workspace Owner",
    ownerAccess: "Full Access",
    addTeam: "Add Team Member",
    addTeamText:
      "Tambah orang yang membantu mengurus perbualan customer, leads, content, atau operasi workspace.",
    fullName: "Nama penuh",
    email: "Alamat email",
    role: "Role",
    permission: "Permission level",
    status: "Status",
    saveMember: "Save Team Member",
    savingMember: "Menyimpan team member...",
    memberSaved: "Team member berjaya disimpan.",
    memberSaveFailed: "Team member gagal disimpan.",
    requiredFields: "Sila isi nama penuh dan alamat email.",
    teamList: "Team Members",
    teamListText:
      "Urus orang yang disambungkan dengan business workspace ini.",
    noMembers: "Belum ada team member.",
    noMembersText:
      "Tambah team member pertama apabila anda bersedia meminta bantuan untuk inbox, leads, content, atau operasi workspace.",
    updateSaved: "Team member berjaya dikemas kini.",
    updateFailed: "Team member gagal dikemas kini.",
    deleteMember: "Delete",
    deleteConfirm: "Padam team member ini?",
    teamRoles: "Team Roles",
    teamRolesText:
      "Gunakan team roles untuk mengatur siapa yang membantu mengurus inbox, leads, content, dan operasi workspace. Anda boleh mengemas kini role, permission, dan status member bila-bila masa apabila bisnes berkembang.",
    saving: "Menyimpan...",
    roles: [
      { value: "Admin", label: "Admin" },
      { value: "Manager", label: "Manager" },
      { value: "Inbox Agent", label: "Inbox Agent" },
      { value: "Sales Agent", label: "Sales Agent" },
      { value: "Content Assistant", label: "Content Assistant" },
      { value: "Viewer", label: "Viewer" },
    ],
    permissions: [
      { value: "admin", label: "Admin" },
      { value: "manager", label: "Manager" },
      { value: "inbox", label: "Inbox" },
      { value: "sales", label: "Sales" },
      { value: "content", label: "Content" },
      { value: "viewer", label: "Viewer" },
    ],
    statuses: [
      { value: "invited", label: "Pending" },
      { value: "active", label: "Active" },
      { value: "disabled", label: "Disabled" },
    ],
    statusLabels: {
      invited: "Pending",
      active: "Active",
      disabled: "Disabled",
    },
    permissionLabels: {
      admin: "Admin",
      manager: "Manager",
      inbox: "Inbox",
      sales: "Sales",
      content: "Content",
      viewer: "Viewer",
    },
  },
};

export default function TeamPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Inbox Agent");
  const [permissionLevel, setPermissionLevel] = useState("inbox");

  const [isSavingMember, setIsSavingMember] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingMemberId, setSavingMemberId] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTeam() {
      if (!workspace) return;

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
  }, [workspace, reloadKey]);

  const activeCount = teamMembers.filter(
    (member) => member.status === "active"
  ).length;

  const pendingCount = teamMembers.filter(
    (member) => member.status === "invited"
  ).length;

  const adminCount = teamMembers.filter(
    (member) => member.permission_level === "admin"
  ).length;

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.teamMembers,
      value: `${teamMembers.length}`,
      note: getPlanAIStaffLabel(currentPlan),
      icon: UsersRound,
    },
    {
      label: t.activeMembers,
      value: `${activeCount}`,
      note: `${pendingCount} ${t.pendingMembers}`,
      icon: CheckCircle2,
    },
    {
      label: t.owner,
      value: "1",
      note: `${adminCount} Admin`,
      icon: Crown,
    },
  ];

  async function handleSaveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!workspace) {
      setActionError(t.memberSaveFailed);
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      setActionError(t.requiredFields);
      return;
    }

    setIsSavingMember(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("workspace_team_members")
      .insert({
        workspace_id: workspace.id,
        owner_user_id: workspace.owner_user_id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        permission_level: permissionLevel,
        status: "invited",
      })
      .select("*")
      .single();

    if (error) {
      setActionError(error.message || t.memberSaveFailed);
      setIsSavingMember(false);
      return;
    }

    setTeamMembers((current) => [data as TeamMemberRow, ...current]);
    setFullName("");
    setEmail("");
    setRole("Inbox Agent");
    setPermissionLevel("inbox");
    setActionMessage(t.memberSaved);
    setIsSavingMember(false);
  }

  async function updateMember(
    memberId: string,
    updates: Partial<
      Pick<TeamMemberRow, "role" | "permission_level" | "status">
    >
  ) {
    setActionMessage("");
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
      .eq("id", memberId);

    if (error) {
      setActionError(error.message || t.updateFailed);
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

    setActionMessage(t.updateSaved);
    setSavingMemberId("");
  }

  async function deleteMember(memberId: string) {
    setActionMessage("");
    setActionError("");

    const shouldDelete = window.confirm(t.deleteConfirm);

    if (!shouldDelete) return;

    setSavingMemberId(memberId);

    const supabase = createClient();

    const { error } = await supabase
      .from("workspace_team_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      setActionError(error.message || t.updateFailed);
      setSavingMemberId("");
      return;
    }

    setTeamMembers((current) =>
      current.filter((member) => member.id !== memberId)
    );
    setSavingMemberId("");
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            {t.loading}
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
            <p className="text-xl font-black">{t.failed}</p>
            <p className="mt-2 text-base font-semibold">
              {workspaceState.error}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>

            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
              {t.refresh}
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <UsersRound className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-lg font-black text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mb-8 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Crown className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
              {t.owner}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.ownerText}
            </h2>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                  <UserRound className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <p className="text-2xl font-black">
                    {workspace?.business_name || t.workspaceOwner}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-base font-semibold leading-7 text-slate-300">
                    <Mail className="h-4 w-4" />
                    {workspace?.business_email || "Owner"}
                  </p>
                  <p className="mt-4 inline-flex rounded-full bg-[#7CFF3D] px-5 py-3 text-sm font-black text-[#07111F]">
                    {t.ownerAccess}
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
              {t.addTeam}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.addTeamText}
            </h2>

            <form onSubmit={handleSaveMember} className="mt-8 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput
                  label={t.fullName}
                  value={fullName}
                  onChange={setFullName}
                />

                <TextInput
                  label={t.email}
                  value={email}
                  onChange={setEmail}
                  type="email"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <SelectInput
                  label={t.role}
                  value={role}
                  onChange={setRole}
                  options={t.roles}
                />

                <SelectInput
                  label={t.permission}
                  value={permissionLevel}
                  onChange={setPermissionLevel}
                  options={t.permissions}
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

              {actionError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                  <p className="text-base font-black">{actionError}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSavingMember}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-6 w-6" />
                {isSavingMember ? t.savingMember : t.saveMember}
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
                {t.teamRoles}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                {t.teamRolesText}
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
              {t.teamList}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.teamListText}
            </h2>
          </div>

          {teamError ? (
            <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="text-base font-black">{teamError}</p>
            </div>
          ) : null}

          {isLoadingTeam ? (
            <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6 text-lg font-black">
              {t.loading}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                <UsersRound className="h-8 w-8" />
              </div>

              <h3 className="text-4xl font-black tracking-[-0.05em]">
                {t.noMembers}
              </h3>

              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
                {t.noMembersText}
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
                            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
                              {member.role}
                            </span>
                            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
                              {t.permissionLabels[member.permission_level] ||
                                member.permission_level}
                            </span>
                            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#07111F]">
                              {t.statusLabels[member.status] || member.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3 xl:w-[560px]">
                        <SelectInput
                          label={t.role}
                          value={member.role}
                          onChange={(value) =>
                            updateMember(member.id, { role: value })
                          }
                          options={t.roles}
                          small
                        />

                        <SelectInput
                          label={t.permission}
                          value={member.permission_level}
                          onChange={(value) =>
                            updateMember(member.id, {
                              permission_level: value,
                            })
                          }
                          options={t.permissions}
                          small
                        />

                        <SelectInput
                          label={t.status}
                          value={member.status}
                          onChange={(value) =>
                            updateMember(member.id, { status: value })
                          }
                          options={t.statuses}
                          small
                        />

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => deleteMember(member.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3"
                        >
                          <Trash2 className="h-4 w-4" />
                          {isSaving ? t.saving : t.deleteMember}
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