"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  MessageCircle,
  PlayCircle,
  Save,
  Send,
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

type AiTestRunRow = {
  id: string;
  workspace_id: string;
  ai_staff_id: string;
  owner_user_id: string;
  customer_message: string;
  ai_response: string;
  status: string;
  created_at: string;
};

const translations = {
  en: {
    badge: "Test AI",
    title: "Test your AI staff before going live.",
    subtitle:
      "Send a sample customer message, review the AI response, and make sure the reply style fits your business.",
    loading: "Loading your AI test area...",
    failed: "Test AI page could not load.",
    back: "Back to Dashboard",
    currentPlan: "Current Plan",
    aiStaff: "AI Staff",
    credits: "Credits",
    goLiveStatus: "Go Live Status",
    chooseAI: "Choose AI Staff",
    chooseAIText:
      "Select which AI staff you want to test before connecting it to real customers.",
    testMessage: "Test Message",
    testMessageText:
      "Type a sample customer question and preview how your AI may respond.",
    selectAI: "Select AI staff",
    customerMessage: "Customer message",
    customerMessagePlaceholder:
      "Example: Hi, can I know your price, location, and available schedule?",
    generatePreview: "Generate Test Reply",
    generating: "Generating preview...",
    saveTest: "Save Test",
    saving: "Saving...",
    saved: "Test saved successfully.",
    saveFailed: "Test could not be saved.",
    emptyError: "Please choose an AI staff and enter a customer message.",
    noAI: "No AI staff found yet.",
    createAI: "Create AI Staff",
    preview: "AI Response Preview",
    previewText:
      "This preview helps you check tone, clarity, and lead capture before going live.",
    noPreview:
      "Generate a test reply first. The response will appear here before you save it.",
    recentTests: "Recent Tests",
    recentTestsText:
      "Saved tests help you review how your AI staff replies to different customer questions.",
    noTests: "No saved tests yet.",
    completed: "Completed",
    nextGoLive: "Continue to Go Live",
    testOnly:
      "This is a test preview. Real AI response generation will be connected later.",
    sampleMessages: [
      "Hi, can I know your price and available schedule?",
      "Where is your business located?",
      "Can I speak with someone from your team?",
      "Do you have any promo or package available?",
    ],
  },

  id: {
    badge: "Test AI",
    title: "Tes AI staff sebelum go live.",
    subtitle:
      "Kirim contoh pesan pelanggan, review balasan AI, dan pastikan gaya jawabannya cocok untuk bisnis Anda.",
    loading: "Memuat area test AI Anda...",
    failed: "Halaman Test AI gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Paket Saat Ini",
    aiStaff: "AI Staff",
    credits: "Credits",
    goLiveStatus: "Status Go Live",
    chooseAI: "Pilih AI Staff",
    chooseAIText:
      "Pilih AI staff yang ingin dites sebelum digunakan untuk pelanggan asli.",
    testMessage: "Pesan Test",
    testMessageText:
      "Tulis contoh pertanyaan pelanggan dan lihat bagaimana AI akan membalas.",
    selectAI: "Pilih AI staff",
    customerMessage: "Pesan pelanggan",
    customerMessagePlaceholder:
      "Contoh: Hi, boleh tahu harga, lokasi, dan jadwal yang tersedia?",
    generatePreview: "Generate Balasan Test",
    generating: "Membuat preview...",
    saveTest: "Simpan Test",
    saving: "Menyimpan...",
    saved: "Test berhasil disimpan.",
    saveFailed: "Test gagal disimpan.",
    emptyError: "Pilih AI staff dan isi pesan pelanggan.",
    noAI: "Belum ada AI staff.",
    createAI: "Buat AI Staff",
    preview: "Preview Balasan AI",
    previewText:
      "Preview ini membantu Anda mengecek tone, kejelasan, dan lead capture sebelum go live.",
    noPreview:
      "Generate balasan test terlebih dahulu. Balasan akan muncul di sini sebelum disimpan.",
    recentTests: "Test Terbaru",
    recentTestsText:
      "Test yang tersimpan membantu Anda meninjau bagaimana AI staff membalas berbagai pertanyaan pelanggan.",
    noTests: "Belum ada test tersimpan.",
    completed: "Selesai",
    nextGoLive: "Lanjut ke Go Live",
    testOnly:
      "Ini adalah preview test. Real AI response generation akan dihubungkan nanti.",
    sampleMessages: [
      "Hi, boleh tahu harga dan jadwal yang tersedia?",
      "Lokasi bisnisnya di mana?",
      "Bisa bicara dengan team Anda?",
      "Ada promo atau paket yang tersedia?",
    ],
  },

  zh: {
    badge: "测试 AI",
    title: "上线前测试您的 AI 员工。",
    subtitle:
      "发送客户示例消息，检查 AI 回复，并确认回复风格适合您的企业。",
    loading: "正在加载 AI 测试区域...",
    failed: "Test AI 页面加载失败。",
    back: "返回仪表板",
    currentPlan: "当前方案",
    aiStaff: "AI 员工",
    credits: "Credits",
    goLiveStatus: "上线状态",
    chooseAI: "选择 AI 员工",
    chooseAIText: "选择要测试的 AI 员工，然后再连接真实客户。",
    testMessage: "测试消息",
    testMessageText: "输入客户问题示例，预览 AI 可能如何回复。",
    selectAI: "选择 AI 员工",
    customerMessage: "客户消息",
    customerMessagePlaceholder: "例如：您好，请问价格、位置和可预约时间？",
    generatePreview: "生成测试回复",
    generating: "正在生成预览...",
    saveTest: "保存测试",
    saving: "正在保存...",
    saved: "测试已成功保存。",
    saveFailed: "测试保存失败。",
    emptyError: "请选择 AI 员工并输入客户消息。",
    noAI: "尚未创建 AI 员工。",
    createAI: "创建 AI 员工",
    preview: "AI 回复预览",
    previewText: "此预览帮助您在上线前检查语气、清晰度和线索收集。",
    noPreview: "请先生成测试回复。回复会在保存前显示在这里。",
    recentTests: "最近测试",
    recentTestsText: "已保存的测试可帮助您检查 AI 员工如何回复不同客户问题。",
    noTests: "尚未保存测试。",
    completed: "已完成",
    nextGoLive: "继续上线",
    testOnly: "这是测试预览。真实 AI 回复生成稍后会连接。",
    sampleMessages: [
      "您好，请问价格和可预约时间？",
      "您的企业位置在哪里？",
      "可以和您的团队沟通吗？",
      "现在有优惠或套餐吗？",
    ],
  },

  ms: {
    badge: "Test AI",
    title: "Test AI staff sebelum go live.",
    subtitle:
      "Hantar contoh mesej pelanggan, review balasan AI, dan pastikan gaya balasan sesuai untuk bisnes anda.",
    loading: "Memuat area test AI anda...",
    failed: "Halaman Test AI gagal dimuat.",
    back: "Kembali ke Dashboard",
    currentPlan: "Pakej Semasa",
    aiStaff: "AI Staff",
    credits: "Credits",
    goLiveStatus: "Status Go Live",
    chooseAI: "Pilih AI Staff",
    chooseAIText:
      "Pilih AI staff yang mahu diuji sebelum digunakan untuk pelanggan sebenar.",
    testMessage: "Mesej Test",
    testMessageText:
      "Tulis contoh soalan pelanggan dan lihat bagaimana AI akan membalas.",
    selectAI: "Pilih AI staff",
    customerMessage: "Mesej pelanggan",
    customerMessagePlaceholder:
      "Contoh: Hi, boleh tahu harga, lokasi, dan jadual yang tersedia?",
    generatePreview: "Generate Balasan Test",
    generating: "Menjana preview...",
    saveTest: "Simpan Test",
    saving: "Menyimpan...",
    saved: "Test berjaya disimpan.",
    saveFailed: "Test gagal disimpan.",
    emptyError: "Pilih AI staff dan isi mesej pelanggan.",
    noAI: "Belum ada AI staff.",
    createAI: "Cipta AI Staff",
    preview: "Preview Balasan AI",
    previewText:
      "Preview ini membantu anda menyemak tone, kejelasan, dan lead capture sebelum go live.",
    noPreview:
      "Generate balasan test dahulu. Balasan akan muncul di sini sebelum disimpan.",
    recentTests: "Test Terbaru",
    recentTestsText:
      "Test yang disimpan membantu anda meninjau bagaimana AI staff membalas pelbagai soalan pelanggan.",
    noTests: "Belum ada test disimpan.",
    completed: "Selesai",
    nextGoLive: "Terus ke Go Live",
    testOnly:
      "Ini ialah preview test. Real AI response generation akan disambungkan nanti.",
    sampleMessages: [
      "Hi, boleh tahu harga dan jadual yang tersedia?",
      "Lokasi bisnes di mana?",
      "Boleh bercakap dengan team anda?",
      "Ada promo atau pakej yang tersedia?",
    ],
  },
};

function buildPreviewResponse({
  message,
  aiStaff,
  language,
}: {
  message: string;
  aiStaff: AiStaffRow;
  language: string;
}) {
  const role = aiStaff.role || "AI Staff";
  const tone = aiStaff.reply_tone || "Friendly Professional";

  if (language === "zh" || aiStaff.reply_language === "中文") {
    return `您好，谢谢您的咨询。我是 ${aiStaff.name}，可以帮您了解详情。\n\n关于您的问题：“${message}”\n\n我会先确认您的需求、预算或时间安排，然后为您提供清楚的下一步。如果您愿意，请留下您的姓名和联系方式，我们的团队可以继续协助您。\n\n回复风格：${tone}\nAI 角色：${role}`;
  }

  if (language === "id" || aiStaff.reply_language === "Bahasa Indonesia") {
    return `Halo, terima kasih sudah menghubungi kami. Saya ${aiStaff.name}, siap membantu Anda.\n\nTerkait pertanyaan Anda: “${message}”\n\nSaya akan membantu cek kebutuhan Anda, menjelaskan informasi penting, dan mengarahkan ke langkah berikutnya. Boleh saya tahu nama Anda dan detail kebutuhan Anda agar team kami bisa follow up dengan lebih tepat?\n\nTone: ${tone}\nRole AI: ${role}`;
  }

  if (language === "ms" || aiStaff.reply_language === "Malay") {
    return `Hi, terima kasih kerana menghubungi kami. Saya ${aiStaff.name}, sedia membantu anda.\n\nBerkenaan soalan anda: “${message}”\n\nSaya akan bantu semak keperluan anda, beri maklumat penting, dan cadangkan langkah seterusnya. Boleh saya tahu nama anda dan apa yang anda perlukan supaya team kami boleh follow up dengan lebih tepat?\n\nTone: ${tone}\nRole AI: ${role}`;
  }

  return `Hi, thank you for reaching out. I’m ${aiStaff.name}, and I’ll be happy to help.\n\nRegarding your question: “${message}”\n\nI can help check your needs, explain the key details, and guide you to the next step. May I have your name and a little more detail about what you need so our team can follow up properly?\n\nTone: ${tone}\nAI role: ${role}`;
}

export default function TestAIPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [aiStaffRows, setAiStaffRows] = useState<AiStaffRow[]>([]);
  const [testRuns, setTestRuns] = useState<AiTestRunRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");

  const [selectedAiStaffId, setSelectedAiStaffId] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [previewResponse, setPreviewResponse] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!workspace) return;

      setIsLoadingData(true);
      setDataError("");

      const supabase = createClient();

      const [aiStaffResult, testRunsResult] = await Promise.all([
        supabase
          .from("ai_staff")
          .select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("ai_test_runs")
          .select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (!isMounted) return;

      if (aiStaffResult.error) {
        setDataError(aiStaffResult.error.message);
        setIsLoadingData(false);
        return;
      }

      if (testRunsResult.error) {
        setDataError(testRunsResult.error.message);
        setIsLoadingData(false);
        return;
      }

      const aiRows = (aiStaffResult.data ?? []) as AiStaffRow[];
      const aiIdFromUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("ai")
          : "";

      const matchedAiId =
        aiIdFromUrl && aiRows.some((staff) => staff.id === aiIdFromUrl)
          ? aiIdFromUrl
          : "";

      setAiStaffRows(aiRows);
      setTestRuns((testRunsResult.data ?? []) as AiTestRunRow[]);

      if (aiRows.length > 0) {
        setSelectedAiStaffId((current) => matchedAiId || current || aiRows[0].id);
      }

      setIsLoadingData(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [workspace]);

  const selectedAiStaff = useMemo(
    () => aiStaffRows.find((staff) => staff.id === selectedAiStaffId) ?? null,
    [aiStaffRows, selectedAiStaffId]
  );

  const aiStaffNameMap = useMemo(() => {
    return aiStaffRows.reduce<Record<string, string>>((map, staff) => {
      map[staff.id] = staff.name;
      return map;
    }, {});
  }, [aiStaffRows]);

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.aiStaff,
      value: `${aiStaffRows.length}`,
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
  ];

  function handleGeneratePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaveMessage("");
    setSaveError("");

    if (!selectedAiStaff || !customerMessage.trim()) {
      setSaveError(t.emptyError);
      return;
    }

    setIsGenerating(true);

    const response = buildPreviewResponse({
      message: customerMessage.trim(),
      aiStaff: selectedAiStaff,
      language,
    });

    setPreviewResponse(response);
    setIsGenerating(false);
  }

  async function handleSaveTest() {
    setSaveMessage("");
    setSaveError("");

    if (!workspace || !selectedAiStaff || !customerMessage.trim() || !previewResponse.trim()) {
      setSaveError(t.emptyError);
      return;
    }

    setIsSaving(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("ai_test_runs")
      .insert({
        workspace_id: workspace.id,
        ai_staff_id: selectedAiStaff.id,
        owner_user_id: workspace.owner_user_id,
        customer_message: customerMessage.trim(),
        ai_response: previewResponse.trim(),
        status: "completed",
      })
      .select("*")
      .single();

    if (error) {
      setSaveError(error.message || t.saveFailed);
      setIsSaving(false);
      return;
    }

    await supabase
      .from("ai_staff")
      .update({
        status: "testing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedAiStaff.id);

    setTestRuns((current) => [data as AiTestRunRow, ...current].slice(0, 10));
    setSaveMessage(t.saved);
    setIsSaving(false);
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

        {isLoadingData ? (
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            {t.loading}
          </div>
        ) : dataError ? (
          <div className="rounded-[2.2rem] border border-red-200 bg-red-50 p-8 text-xl font-black text-red-700">
            {dataError}
          </div>
        ) : aiStaffRows.length === 0 ? (
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Bot className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-black tracking-[-0.05em]">
              {t.noAI}
            </h2>
            <Link
              href="/dashboard/create-ai"
              className="mt-7 inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white"
            >
              {t.createAI}
              <ArrowRight className="h-6 w-6" />
            </Link>
          </section>
        ) : (
          <>
            <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Bot className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.chooseAI}
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  {t.chooseAIText}
                </h2>

                <div className="mt-8 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.selectAI}
                    </span>
                    <select
                      value={selectedAiStaffId}
                      onChange={(event) => {
                        setSelectedAiStaffId(event.target.value);
                        setPreviewResponse("");
                        setSaveMessage("");
                        setSaveError("");
                      }}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    >
                      {aiStaffRows.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} — {staff.role}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedAiStaff ? (
                    <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                          <UserRound className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xl font-black">
                            {selectedAiStaff.name}
                          </p>
                          <p className="mt-1 text-base font-semibold leading-7 text-slate-600">
                            {selectedAiStaff.role} • {selectedAiStaff.channel} •{" "}
                            {selectedAiStaff.reply_tone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <MessageCircle className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.testMessage}
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  {t.testMessageText}
                </h2>

                <form onSubmit={handleGeneratePreview} className="mt-8 grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.customerMessage}
                    </span>
                    <textarea
                      rows={6}
                      value={customerMessage}
                      onChange={(event) => {
                        setCustomerMessage(event.target.value);
                        setPreviewResponse("");
                        setSaveMessage("");
                        setSaveError("");
                      }}
                      placeholder={t.customerMessagePlaceholder}
                      className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </label>

                  <div className="grid gap-3">
                    {t.sampleMessages.map((sample) => (
                      <button
                        type="button"
                        key={sample}
                        onClick={() => {
                          setCustomerMessage(sample);
                          setPreviewResponse("");
                        }}
                        className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-3 text-left text-base font-black text-slate-700 transition hover:bg-white"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>

                  {saveError ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                      <p className="text-base font-black">{saveError}</p>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlayCircle className="h-6 w-6" />
                    {isGenerating ? t.generating : t.generatePreview}
                  </button>
                </form>
              </section>
            </div>

            <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                    <Send className="h-8 w-8" />
                  </div>

                  <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                    {t.preview}
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    {t.previewText}
                  </h2>

                  <p className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-base font-black leading-7 text-amber-800">
                    {t.testOnly}
                  </p>
                </div>

                <div className="rounded-[2rem] bg-[#07111F] p-6 text-white">
                  {previewResponse ? (
                    <pre className="whitespace-pre-wrap text-lg font-semibold leading-8 text-slate-100">
                      {previewResponse}
                    </pre>
                  ) : (
                    <p className="text-xl font-black leading-9 text-slate-300">
                      {t.noPreview}
                    </p>
                  )}

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleSaveTest}
                      disabled={isSaving || !previewResponse}
                      className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-6 w-6" />
                      {isSaving ? t.saving : t.saveTest}
                    </button>

                    <Link
                      href="/dashboard/go-live"
                      className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-5 text-xl font-black text-white"
                    >
                      {t.nextGoLive}
                      <ArrowRight className="h-6 w-6" />
                    </Link>
                  </div>

                  {saveMessage ? (
                    <div className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5 text-green-800">
                      <p className="flex items-center gap-3 text-base font-black">
                        <CheckCircle2 className="h-5 w-5" />
                        {saveMessage}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <div className="mb-7">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Clock3 className="h-8 w-8" />
                </div>

                <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                  {t.recentTests}
                </p>

                <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em]">
                  {t.recentTestsText}
                </h2>
              </div>

              <div className="grid gap-4">
                {testRuns.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5 text-lg font-black text-slate-600">
                    {t.noTests}
                  </div>
                ) : (
                  testRuns.map((run) => (
                    <div
                      key={run.id}
                      className="rounded-3xl border border-slate-200 bg-[#F7F9FA] p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xl font-black">
                            {aiStaffNameMap[run.ai_staff_id] || t.aiStaff}
                          </p>
                          <p className="mt-2 text-base font-semibold leading-7 text-slate-600">
                            {run.customer_message}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-white px-5 py-3 text-sm font-black text-[#07111F]">
                          {run.status || t.completed}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}