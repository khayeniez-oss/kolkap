"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import {
  getKolkapPlan,
  getPlanAIStaffLabel,
  getPlanCreditLabel,
  type KolkapPlanKey,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type AiStaffRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  name: string;
  role: string;
  channel: string;
  reply_language: string | null;
  reply_tone: string | null;
  business_knowledge: string | null;
  ai_instruction: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function getAIStaffLimit(planKey: KolkapPlanKey) {
  if (planKey === "free_trial") return 1;
  if (planKey === "growth") return 2;
  if (planKey === "pro") return 5;
  return 20;
}

const translations = {
  en: {
    badge: "Create AI",
    title: "Create your AI staff for your business team.",
    subtitle:
      "Set the AI role, channel, tone, language, business knowledge, and instruction. After saving, you can test the AI right away.",
    loading: "Loading your AI setup...",
    failed: "Create AI page could not load.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    aiStaffUsage: "AI Staff Usage",
    credits: "Credits",
    goLiveStatus: "Go Live Status",
    saveAndTest: "Save & Test AI",
    saving: "Saving AI...",
    saved: "AI staff saved successfully.",
    saveFailed: "AI staff could not be saved.",
    limitReached: "Your current plan has reached the AI staff limit.",
    existingAI: "Your AI Staff",
    existingAIText:
      "These are the AI staff already connected to your Kolkap workspace.",
    aiSetup: "AI Staff Setup",
    aiSetupText:
      "Choose what this AI should do for your business and how it should reply.",
    name: "AI staff name",
    namePlaceholder: "Example: AI WhatsApp Responder",
    role: "AI role",
    channel: "Main channel",
    language: "Reply language",
    tone: "Reply tone",
    knowledge: "Business knowledge",
    knowledgePlaceholder:
      "Add your services, pricing, FAQs, opening hours, location, policies, and important customer information.",
    instruction: "AI instruction",
    instructionPlaceholder:
      "Tell this AI how to reply, what to ask, what to avoid, and when to ask a human to take over.",
    emptyError: "Please add AI name, role, and instruction.",
    noAIYet: "No AI staff created yet.",
    testAI: "Test AI",
    draft: "Draft",
    channels: ["WhatsApp", "Website Chat", "Email", "Social Media"],
    languages: ["Auto-detect", "English", "中文", "Bahasa Indonesia", "Malay"],
    tones: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    roles: [
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
      "AI Receptionist",
      "AI Social Media Caption Generator",
      "AI Content Assistant",
      "AI Booking Assistant",
      "AI Lead Qualifier",
    ],
  },

  id: {
    badge: "Create AI",
    title: "Buat AI staff untuk team bisnis Anda.",
    subtitle:
      "Atur role AI, channel, tone, bahasa, business knowledge, dan instruksi. Setelah disimpan, Anda bisa langsung test AI.",
    loading: "Memuat setup AI Anda...",
    failed: "Halaman Create AI gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    aiStaffUsage: "Pemakaian AI Staff",
    credits: "Credits",
    goLiveStatus: "Status Go Live",
    saveAndTest: "Simpan & Test AI",
    saving: "Menyimpan AI...",
    saved: "AI staff berhasil disimpan.",
    saveFailed: "AI staff gagal disimpan.",
    limitReached: "Paket Anda saat ini sudah mencapai limit AI staff.",
    existingAI: "AI Staff Anda",
    existingAIText:
      "Ini adalah AI staff yang sudah terhubung dengan workspace Kolkap Anda.",
    aiSetup: "Setup AI Staff",
    aiSetupText:
      "Pilih tugas AI untuk bisnis Anda dan bagaimana AI harus membalas pelanggan.",
    name: "Nama AI staff",
    namePlaceholder: "Contoh: AI WhatsApp Responder",
    role: "Role AI",
    channel: "Channel utama",
    language: "Bahasa balasan",
    tone: "Tone balasan",
    knowledge: "Business knowledge",
    knowledgePlaceholder:
      "Tambahkan layanan, harga, FAQ, jam operasional, lokasi, policy, dan informasi penting pelanggan.",
    instruction: "Instruksi AI",
    instructionPlaceholder:
      "Beritahu AI bagaimana harus membalas, apa yang harus ditanyakan, apa yang harus dihindari, dan kapan harus meminta human takeover.",
    emptyError: "Mohon isi nama AI, role, dan instruksi.",
    noAIYet: "Belum ada AI staff dibuat.",
    testAI: "Test AI",
    draft: "Draft",
    channels: ["WhatsApp", "Website Chat", "Email", "Social Media"],
    languages: ["Auto-detect", "English", "中文", "Bahasa Indonesia", "Malay"],
    tones: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    roles: [
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
      "AI Receptionist",
      "AI Social Media Caption Generator",
      "AI Content Assistant",
      "AI Booking Assistant",
      "AI Lead Qualifier",
    ],
  },

  zh: {
    badge: "创建 AI",
    title: "为您的企业团队创建 AI 员工。",
    subtitle:
      "设置 AI 角色、渠道、语气、语言、企业知识和指令。保存后可以马上测试 AI。",
    loading: "正在加载 AI 设置...",
    failed: "创建 AI 页面加载失败。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    aiStaffUsage: "AI 员工使用情况",
    credits: "Credits",
    goLiveStatus: "上线状态",
    saveAndTest: "保存并测试 AI",
    saving: "正在保存 AI...",
    saved: "AI 员工已成功保存。",
    saveFailed: "AI 员工保存失败。",
    limitReached: "您的当前方案已达到 AI 员工数量限制。",
    existingAI: "您的 AI 员工",
    existingAIText: "这些是已经连接到您的 Kolkap 工作区的 AI 员工。",
    aiSetup: "AI 员工设置",
    aiSetupText: "选择这个 AI 要为企业做什么，以及它应该如何回复客户。",
    name: "AI 员工名称",
    namePlaceholder: "示例：AI WhatsApp 回复员",
    role: "AI 角色",
    channel: "主要渠道",
    language: "回复语言",
    tone: "回复语气",
    knowledge: "企业知识",
    knowledgePlaceholder:
      "添加服务、价格、FAQ、营业时间、地点、政策和重要客户信息。",
    instruction: "AI 指令",
    instructionPlaceholder:
      "告诉 AI 如何回复、需要询问什么、避免什么，以及何时请求人工接手。",
    emptyError: "请填写 AI 名称、角色和指令。",
    noAIYet: "尚未创建 AI 员工。",
    testAI: "测试 AI",
    draft: "草稿",
    channels: ["WhatsApp", "Website Chat", "Email", "Social Media"],
    languages: ["Auto-detect", "English", "中文", "Bahasa Indonesia", "Malay"],
    tones: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    roles: [
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
      "AI Receptionist",
      "AI Social Media Caption Generator",
      "AI Content Assistant",
      "AI Booking Assistant",
      "AI Lead Qualifier",
    ],
  },

  ms: {
    badge: "Create AI",
    title: "Cipta AI staff untuk team bisnes anda.",
    subtitle:
      "Tetapkan role AI, channel, tone, bahasa, business knowledge, dan arahan. Selepas disimpan, anda boleh terus test AI.",
    loading: "Memuat setup AI anda...",
    failed: "Halaman Create AI gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    aiStaffUsage: "Penggunaan AI Staff",
    credits: "Credits",
    goLiveStatus: "Status Go Live",
    saveAndTest: "Simpan & Test AI",
    saving: "Menyimpan AI...",
    saved: "AI staff berjaya disimpan.",
    saveFailed: "AI staff gagal disimpan.",
    limitReached: "Pakej anda sekarang sudah mencapai limit AI staff.",
    existingAI: "AI Staff Anda",
    existingAIText:
      "Ini ialah AI staff yang sudah disambungkan dengan workspace Kolkap anda.",
    aiSetup: "Setup AI Staff",
    aiSetupText:
      "Pilih tugas AI untuk bisnes anda dan bagaimana AI perlu membalas pelanggan.",
    name: "Nama AI staff",
    namePlaceholder: "Contoh: AI WhatsApp Responder",
    role: "Role AI",
    channel: "Channel utama",
    language: "Bahasa balasan",
    tone: "Tone balasan",
    knowledge: "Business knowledge",
    knowledgePlaceholder:
      "Tambah servis, harga, FAQ, waktu operasi, lokasi, polisi, dan maklumat penting pelanggan.",
    instruction: "Arahan AI",
    instructionPlaceholder:
      "Beritahu AI bagaimana perlu membalas, apa yang perlu ditanya, apa yang perlu dielak, dan bila perlu minta human takeover.",
    emptyError: "Sila isi nama AI, role, dan arahan.",
    noAIYet: "Belum ada AI staff dicipta.",
    testAI: "Test AI",
    draft: "Draft",
    channels: ["WhatsApp", "Website Chat", "Email", "Social Media"],
    languages: ["Auto-detect", "English", "中文", "Bahasa Indonesia", "Malay"],
    tones: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    roles: [
      "AI WhatsApp Responder",
      "AI Customer Support",
      "AI Sales Follow-up Assistant",
      "AI Receptionist",
      "AI Social Media Caption Generator",
      "AI Content Assistant",
      "AI Booking Assistant",
      "AI Lead Qualifier",
    ],
  },
};

export default function CreateAIPage() {
  const router = useRouter();
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);
  const aiLimit = getAIStaffLimit(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [aiListError, setAiListError] = useState("");

  const [name, setName] = useState("");
  const [role, setRole] = useState(t.roles[0]);
  const [channel, setChannel] = useState(t.channels[0]);
  const [replyLanguage, setReplyLanguage] = useState("Auto-detect");
  const [replyTone, setReplyTone] = useState("Friendly Professional");
  const [businessKnowledge, setBusinessKnowledge] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const aiStaffUsed = aiStaffRows.length;
  const hasReachedLimit = aiStaffUsed >= aiLimit;

  useEffect(() => {
    if (!workspace) return;

    setReplyLanguage(workspace.ai_reply_language ?? "Auto-detect");
    setReplyTone(workspace.ai_reply_tone ?? "Friendly Professional");

    setBusinessKnowledge(
      [
        workspace.business_name
          ? `Business name: ${workspace.business_name}`
          : "",
        workspace.business_type
          ? `Business type: ${workspace.business_type}`
          : "",
        workspace.business_email ? `Email: ${workspace.business_email}` : "",
        workspace.business_phone ? `Phone: ${workspace.business_phone}` : "",
        workspace.whatsapp_number ? `WhatsApp: ${workspace.whatsapp_number}` : "",
        workspace.business_address
          ? `Address: ${workspace.business_address}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );

    setAiInstruction(
      workspace.ai_instruction ??
        "Reply clearly, collect customer details, and ask the team to take over when the customer requests human support."
    );
  }, [workspace]);

  useEffect(() => {
    let isMounted = true;

    async function loadAIStaff() {
      if (!workspace) return;

      setIsLoadingAI(true);
      setAiListError("");

      const supabase = createClient();

      const { data, error } = await supabase
        .from("ai_staff")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setAiListError(error.message);
        setIsLoadingAI(false);
        return;
      }

      setAiStaffRows((data ?? []) as AiStaffRow[]);
      setIsLoadingAI(false);
    }

    loadAIStaff();

    return () => {
      isMounted = false;
    };
  }, [workspace]);

  async function handleSaveAndTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaveError("");

    if (!workspace) {
      setSaveError(t.saveFailed);
      return;
    }

    if (!name.trim() || !role.trim() || !aiInstruction.trim()) {
      setSaveError(t.emptyError);
      return;
    }

    if (hasReachedLimit) {
      setSaveError(t.limitReached);
      return;
    }

    setIsSaving(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("ai_staff")
      .insert({
        workspace_id: workspace.id,
        owner_user_id: workspace.owner_user_id,
        name: name.trim(),
        role,
        channel,
        reply_language: replyLanguage,
        reply_tone: replyTone,
        business_knowledge: businessKnowledge.trim() || null,
        ai_instruction: aiInstruction.trim(),
        status: "draft",
      })
      .select("*")
      .single();

    if (error) {
      setSaveError(error.message || t.saveFailed);
      setIsSaving(false);
      return;
    }

    const savedAiStaff = data as AiStaffRow;
    const nextCount = aiStaffRows.length + 1;

    await supabase
      .from("business_workspaces")
      .update({
        ai_staff_used: nextCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspace.id);

    router.push(`/dashboard/test-ai?ai=${savedAiStaff.id}`);
  }

  const summaryCards = useMemo(
    () => [
      {
        label: t.currentPlan,
        value: currentPlan.name,
        note: currentPlan.priceLabel,
        icon: WalletCards,
      },
      {
        label: t.aiStaffUsage,
        value: `${aiStaffUsed}/${aiLimit}`,
        note: getPlanAIStaffLabel(currentPlan),
        icon: Bot,
      },
      {
        label: t.credits,
        value: `${workspaceState.creditsRemaining}/${workspaceState.creditsTotal}`,
        note: getPlanCreditLabel(currentPlan),
        icon: Zap,
      },
      {
        label: t.goLiveStatus,
        value: workspaceState.goLiveStatus,
        note: workspaceState.whatsappStatus,
        icon: ShieldCheck,
      },
    ],
    [
      t,
      currentPlan,
      aiStaffUsed,
      aiLimit,
      workspaceState.creditsRemaining,
      workspaceState.creditsTotal,
      workspaceState.goLiveStatus,
      workspaceState.whatsappStatus,
    ]
  );

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

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Bot className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.existingAI}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.existingAIText}
            </h2>

            <div className="mt-8 grid gap-4">
              {isLoadingAI ? (
                <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black">
                  {t.loading}
                </div>
              ) : aiListError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-lg font-black text-red-700">
                  {aiListError}
                </div>
              ) : aiStaffRows.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black text-slate-600">
                  {t.noAIYet}
                </div>
              ) : (
                aiStaffRows.map((staff) => (
                  <div
                    key={staff.id}
                    className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                          <Bot className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xl font-black">{staff.name}</p>
                          <p className="mt-1 text-base font-semibold text-slate-500">
                            {staff.role} • {staff.channel}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:items-end">
                        <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]">
                          {staff.status || t.draft}
                        </span>

                        <Link
                          href={`/dashboard/test-ai?ai=${staff.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-sm font-black text-white"
                        >
                          {t.testAI}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <UserRound className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.aiSetup}
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {t.aiSetupText}
            </h2>

            <form onSubmit={handleSaveAndTest} className="mt-8 grid gap-5">
              {hasReachedLimit ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                  <p className="text-base font-black">{t.limitReached}</p>
                </div>
              ) : null}

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.name}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t.namePlaceholder}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <div className="grid gap-5 2xl:grid-cols-2">
                <SelectInput
                  label={t.role}
                  value={role}
                  onChange={setRole}
                  options={t.roles}
                />
                <SelectInput
                  label={t.channel}
                  value={channel}
                  onChange={setChannel}
                  options={t.channels}
                />
              </div>

              <div className="grid gap-5 2xl:grid-cols-2">
                <SelectInput
                  label={t.language}
                  value={replyLanguage}
                  onChange={setReplyLanguage}
                  options={t.languages}
                />
                <SelectInput
                  label={t.tone}
                  value={replyTone}
                  onChange={setReplyTone}
                  options={t.tones}
                />
              </div>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.knowledge}
                </span>
                <textarea
                  rows={6}
                  value={businessKnowledge}
                  onChange={(event) => setBusinessKnowledge(event.target.value)}
                  placeholder={t.knowledgePlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.instruction}
                </span>
                <textarea
                  rows={6}
                  value={aiInstruction}
                  onChange={(event) => setAiInstruction(event.target.value)}
                  placeholder={t.instructionPlaceholder}
                  className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              {saveError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                  <p className="text-base font-black">{saveError}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSaving || hasReachedLimit}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-6 w-6" />
                {isSaving ? t.saving : t.saveAndTest}
                <ArrowRight className="h-6 w-6" />
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="block truncate text-base font-black text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full min-w-0 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}