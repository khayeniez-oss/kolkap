"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  Crown,
  Eye,
  Inbox,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import {
  demoWorkspacePlanStatus,
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
} from "@/lib/kolkapPlan";

const teamLimits = {
  free_trial: 1,
  growth: 3,
  pro: 8,
  business: "Custom",
} as const;

const translations = {
  en: {
    badge: "Team",
    title: "Manage who can access your Kolkap business account.",
    subtitle:
      "Invite your team, choose their roles, and control who can help with inbox, leads, billing, reports, settings, and AI staff.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    teamLimit: "Team Limit",
    aiStaffLimit: "AI Staff Limit",
    credits: "Plan Credits",
    teamMembers: "Team Members",
    activeMembers: "Active members",
    pendingInvites: "Pending invites",
    inviteTeam: "Invite Team Member",
    inviteText:
      "Add people who help manage customer conversations, leads, reports, billing, or settings.",
    fullName: "Full name",
    email: "Email address",
    role: "Role",
    sendInvite: "Send Invite",
    teamRoles: "Team Roles",
    teamRolesText:
      "Each role controls what a team member can view or manage inside Kolkap.",
    currentTeam: "Current Team",
    currentTeamText:
      "These are the people who can help manage your Kolkap account, inbox, leads, and business settings.",
    permissions: "Permissions",
    status: "Status",
    active: "Active",
    invited: "Invited",
    owner: "Owner",
    admin: "Admin",
    inboxAgent: "Inbox Agent",
    billingManager: "Billing Manager",
    viewer: "Viewer",
    manage: "Manage",
    remove: "Remove",
    upgrade: "Upgrade Plan",
    upgradeText:
      "Need more team members? Upgrade your plan to add more people to your Kolkap account.",
    permissionLabels: {
      inbox: "Inbox & handover",
      leads: "Lead management",
      ai: "AI staff setup",
      billing: "Billing & top-up",
      reports: "Reports",
      settings: "Business settings",
      view: "View only",
    },
    roleDescriptions: {
      owner: "Full access to the account, billing, settings, team, and security.",
      admin: "Can manage AI staff, inbox, leads, reports, and business settings.",
      inboxAgent: "Can handle conversations, leads, and human handover.",
      billingManager: "Can manage billing, invoices, and top-up credits.",
      viewer: "Can view dashboard, inbox, and reports without changing settings.",
    },
  },

  id: {
    badge: "Team",
    title: "Kelola siapa yang bisa mengakses akun bisnis Kolkap Anda.",
    subtitle:
      "Undang tim Anda, pilih role mereka, dan kontrol siapa yang bisa membantu mengelola inbox, leads, billing, reports, settings, dan AI staff.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    teamLimit: "Limit Team",
    aiStaffLimit: "Limit AI Staff",
    credits: "Credits Paket",
    teamMembers: "Anggota Team",
    activeMembers: "Anggota aktif",
    pendingInvites: "Invite menunggu",
    inviteTeam: "Undang Anggota Team",
    inviteText:
      "Tambahkan orang yang membantu mengelola percakapan pelanggan, leads, reports, billing, atau settings.",
    fullName: "Nama lengkap",
    email: "Alamat email",
    role: "Role",
    sendInvite: "Kirim Invite",
    teamRoles: "Role Team",
    teamRolesText:
      "Setiap role mengatur apa yang bisa dilihat atau dikelola anggota team di Kolkap.",
    currentTeam: "Team Saat Ini",
    currentTeamText:
      "Ini adalah orang-orang yang dapat membantu mengelola akun Kolkap, inbox, leads, dan pengaturan bisnis Anda.",
    permissions: "Permissions",
    status: "Status",
    active: "Aktif",
    invited: "Diundang",
    owner: "Owner",
    admin: "Admin",
    inboxAgent: "Inbox Agent",
    billingManager: "Billing Manager",
    viewer: "Viewer",
    manage: "Kelola",
    remove: "Hapus",
    upgrade: "Upgrade Paket",
    upgradeText:
      "Butuh lebih banyak anggota team? Upgrade paket untuk menambah orang di akun Kolkap Anda.",
    permissionLabels: {
      inbox: "Inbox & handover",
      leads: "Manajemen leads",
      ai: "Setup AI staff",
      billing: "Billing & top-up",
      reports: "Reports",
      settings: "Pengaturan bisnis",
      view: "View only",
    },
    roleDescriptions: {
      owner: "Akses penuh ke akun, billing, settings, team, dan security.",
      admin: "Bisa mengelola AI staff, inbox, leads, reports, dan pengaturan bisnis.",
      inboxAgent: "Bisa menangani percakapan, leads, dan human handover.",
      billingManager: "Bisa mengelola billing, invoice, dan top-up credits.",
      viewer: "Bisa melihat dashboard, inbox, dan reports tanpa mengubah settings.",
    },
  },

  zh: {
    badge: "团队",
    title: "管理谁可以访问您的 Kolkap 企业账户。",
    subtitle:
      "邀请团队成员，选择他们的角色，并控制谁可以协助管理收件箱、线索、账单、报告、设置和 AI 员工。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    teamLimit: "团队限制",
    aiStaffLimit: "AI 员工限制",
    credits: "方案 Credits",
    teamMembers: "团队成员",
    activeMembers: "活跃成员",
    pendingInvites: "待接受邀请",
    inviteTeam: "邀请团队成员",
    inviteText:
      "添加帮助管理客户对话、线索、报告、账单或设置的人员。",
    fullName: "全名",
    email: "电子邮件地址",
    role: "角色",
    sendInvite: "发送邀请",
    teamRoles: "团队角色",
    teamRolesText:
      "每个角色控制团队成员在 Kolkap 中可以查看或管理的内容。",
    currentTeam: "当前团队",
    currentTeamText:
      "这些成员可以帮助管理您的 Kolkap 账户、收件箱、线索和企业设置。",
    permissions: "权限",
    status: "状态",
    active: "有效",
    invited: "已邀请",
    owner: "Owner",
    admin: "Admin",
    inboxAgent: "Inbox Agent",
    billingManager: "Billing Manager",
    viewer: "Viewer",
    manage: "管理",
    remove: "移除",
    upgrade: "升级方案",
    upgradeText:
      "需要更多团队成员？升级方案以添加更多人员到您的 Kolkap 账户。",
    permissionLabels: {
      inbox: "收件箱与人工接手",
      leads: "线索管理",
      ai: "AI 员工设置",
      billing: "账单与充值",
      reports: "报告",
      settings: "企业设置",
      view: "仅查看",
    },
    roleDescriptions: {
      owner: "完整账户访问，包括账单、设置、团队和安全。",
      admin: "可以管理 AI 员工、收件箱、线索、报告和企业设置。",
      inboxAgent: "可以处理对话、线索和人工接手。",
      billingManager: "可以管理账单、发票和充值 credits。",
      viewer: "可以查看仪表板、收件箱和报告，但不能更改设置。",
    },
  },

  ms: {
    badge: "Team",
    title: "Urus siapa yang boleh mengakses akaun bisnes Kolkap anda.",
    subtitle:
      "Jemput team anda, pilih role mereka, dan kawal siapa yang boleh membantu mengurus inbox, leads, billing, reports, settings, dan AI staff.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    teamLimit: "Limit Team",
    aiStaffLimit: "Limit AI Staff",
    credits: "Credits Pakej",
    teamMembers: "Ahli Team",
    activeMembers: "Ahli aktif",
    pendingInvites: "Invite menunggu",
    inviteTeam: "Jemput Ahli Team",
    inviteText:
      "Tambah orang yang membantu mengurus perbualan pelanggan, leads, reports, billing, atau settings.",
    fullName: "Nama penuh",
    email: "Alamat email",
    role: "Role",
    sendInvite: "Hantar Invite",
    teamRoles: "Role Team",
    teamRolesText:
      "Setiap role mengawal apa yang boleh dilihat atau diurus oleh ahli team di Kolkap.",
    currentTeam: "Team Semasa",
    currentTeamText:
      "Ini ialah orang-orang yang boleh membantu mengurus akaun Kolkap, inbox, leads, dan tetapan bisnes anda.",
    permissions: "Permissions",
    status: "Status",
    active: "Aktif",
    invited: "Dijemput",
    owner: "Owner",
    admin: "Admin",
    inboxAgent: "Inbox Agent",
    billingManager: "Billing Manager",
    viewer: "Viewer",
    manage: "Urus",
    remove: "Buang",
    upgrade: "Upgrade Pakej",
    upgradeText:
      "Perlukan lebih banyak ahli team? Upgrade pakej untuk menambah orang dalam akaun Kolkap anda.",
    permissionLabels: {
      inbox: "Inbox & handover",
      leads: "Pengurusan leads",
      ai: "Setup AI staff",
      billing: "Billing & top-up",
      reports: "Reports",
      settings: "Tetapan bisnes",
      view: "View only",
    },
    roleDescriptions: {
      owner: "Akses penuh ke akaun, billing, settings, team, dan security.",
      admin: "Boleh mengurus AI staff, inbox, leads, reports, dan tetapan bisnes.",
      inboxAgent: "Boleh mengendalikan perbualan, leads, dan human handover.",
      billingManager: "Boleh mengurus billing, invoice, dan top-up credits.",
      viewer: "Boleh melihat dashboard, inbox, dan reports tanpa mengubah settings.",
    },
  },
};

export default function TeamPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspace = demoWorkspacePlanStatus;
  const currentPlan = getKolkapPlan(workspace.planKey);
  const teamLimit = teamLimits[workspace.planKey];

  const roleCards = [
    {
      role: t.owner,
      description: t.roleDescriptions.owner,
      icon: Crown,
      permissions: [
        t.permissionLabels.inbox,
        t.permissionLabels.leads,
        t.permissionLabels.ai,
        t.permissionLabels.billing,
        t.permissionLabels.reports,
        t.permissionLabels.settings,
      ],
    },
    {
      role: t.admin,
      description: t.roleDescriptions.admin,
      icon: ShieldCheck,
      permissions: [
        t.permissionLabels.inbox,
        t.permissionLabels.leads,
        t.permissionLabels.ai,
        t.permissionLabels.reports,
        t.permissionLabels.settings,
      ],
    },
    {
      role: t.inboxAgent,
      description: t.roleDescriptions.inboxAgent,
      icon: Inbox,
      permissions: [t.permissionLabels.inbox, t.permissionLabels.leads],
    },
    {
      role: t.billingManager,
      description: t.roleDescriptions.billingManager,
      icon: CreditCard,
      permissions: [t.permissionLabels.billing, t.permissionLabels.reports],
    },
    {
      role: t.viewer,
      description: t.roleDescriptions.viewer,
      icon: Eye,
      permissions: [t.permissionLabels.view, t.permissionLabels.reports],
    },
  ];

  const members = [
    {
      name: "Business Owner",
      email: "owner@business.com",
      role: t.owner,
      status: t.active,
      icon: Crown,
    },
    {
      name: "Customer Support Team",
      email: "support@business.com",
      role: t.inboxAgent,
      status: t.invited,
      icon: Inbox,
    },
  ];

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      icon: WalletCards,
    },
    {
      label: t.teamLimit,
      value: String(teamLimit),
      icon: Users,
    },
    {
      label: t.aiStaffLimit,
      value: getPlanAIStaffLabel(currentPlan),
      icon: Bot,
    },
    {
      label: t.credits,
      value: getPlanCreditLabel(currentPlan),
      icon: Sparkles,
    },
  ];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
          <Link
            href="/dashboard"
            className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
            {t.back}
          </Link>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
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
                <p className="mt-2 text-2xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <UserPlus className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.inviteTeam}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.inviteText}
            </h2>

            <div className="mt-8 grid gap-5">
              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.fullName}
                </span>
                <input
                  type="text"
                  placeholder="Team member name"
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-base font-black text-slate-700">
                  <Mail className="h-5 w-5 text-slate-400" />
                  {t.email}
                </span>
                <input
                  type="email"
                  placeholder="team@business.com"
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.role}
                </span>
                <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                  <option>{t.admin}</option>
                  <option>{t.inboxAgent}</option>
                  <option>{t.billingManager}</option>
                  <option>{t.viewer}</option>
                </select>
              </label>

              <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white">
                <UserPlus className="h-6 w-6" />
                {t.sendInvite}
              </button>
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Users className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.currentTeam}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.currentTeamText}
            </h2>

            <div className="mt-8 grid gap-4">
              {members.map((member) => {
                const Icon = member.icon;

                return (
                  <div
                    key={`${member.email}-${member.role}`}
                    className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                          <Icon className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-xl font-black">{member.name}</p>
                          <p className="text-base font-semibold text-slate-500">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#07111F]">
                          {member.role}
                        </span>
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-black ${
                            member.status === t.active
                              ? "bg-[#7CFF3D] text-[#07111F]"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {member.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white">
                        <Settings className="h-4 w-4" />
                        {t.manage}
                      </button>

                      <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
                        <XCircle className="h-4 w-4" />
                        {t.remove}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.teamRoles}
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.teamRolesText}
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {roleCards.map((role) => {
              const Icon = role.icon;

              return (
                <div
                  key={role.role}
                  className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-6"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-3xl font-black tracking-[-0.04em]">
                    {role.role}
                  </h3>

                  <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                    {role.description}
                  </p>

                  <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                    {t.permissions}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {role.permissions.map((permission) => (
                      <span
                        key={`${role.role}-${permission}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#07111F]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.upgrade}
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                {t.upgradeText}
              </h2>
            </div>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              {t.upgrade}
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}