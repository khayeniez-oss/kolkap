"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Globe2,
  Inbox,
  Rocket,
  ShieldCheck,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type Translation = {
  loading: string;
  failed: string;
  back: string;
  badge: string;
  title: string;
  subtitle: string;
  workspace: string;
  workspaceFallback: string;
  statusTitle: string;
  statusReady: string;
  statusText: string;
  copySetup: string;
  copySetupTitle: string;
  copySetupText: string;
  widgetCode: string;
  copyCode: string;
  copied: string;
  nextStepNotice: string;
  installTitle: string;
  installText: string;
  installSteps: string[];
  testTitle: string;
  testText: string;
  openTestAI: string;
  openInbox: string;
  goLiveTitle: string;
  goLiveText: string;
  continueGoLive: string;
};

const translations: Record<SupportedLanguage, Translation> = {
  en: {
    loading: "Loading website chat setup...",
    failed: "Website Chat page could not load.",
    back: "Back to Customer Channels",
    badge: "Website Chat",
    title: "Add Kolkap website chat to your website.",
    subtitle:
      "Let website visitors message your business, receive AI-assisted replies, and have conversations saved inside Kolkap Inbox and Leads.",
    workspace: "Workspace",
    workspaceFallback: "Your business",
    statusTitle: "Connection Status",
    statusReady: "Website chat backend is ready",
    statusText:
      "Kolkap can receive website chat messages, match them to this workspace, generate AI replies, save conversations, and record credit usage.",
    copySetup: "Widget Setup",
    copySetupTitle: "Copy your website chat code.",
    copySetupText:
      "Paste this code into your website before the closing body tag. Once the public widget script is live, this will show the Kolkap chat bubble on your website.",
    widgetCode: "Widget Code",
    copyCode: "Copy Code",
    copied: "Copied",
    nextStepNotice:
      "Next development step: publish the public widget script so this code can show the chat bubble on any website.",
    installTitle: "Simple Setup",
    installText: "Add Kolkap chat to your website in five simple steps.",
    installSteps: [
      "Copy the website chat code.",
      "Paste it before the closing body tag on your website.",
      "Open your website and check the chat bubble.",
      "Send a test message.",
      "Review the conversation in Kolkap Inbox.",
    ],
    testTitle: "Test before going live",
    testText:
      "Before showing the widget to real visitors, test your AI staff and make sure your business knowledge gives the right answers.",
    openTestAI: "Open Test AI",
    openInbox: "Open Inbox",
    goLiveTitle: "Ready to activate?",
    goLiveText:
      "Make sure your AI staff, Knowledge Base, active trial or plan, and credits are ready before using website chat with real visitors.",
    continueGoLive: "Continue to Go Live",
  },

  id: {
    loading: "Memuat setup website chat...",
    failed: "Halaman Website Chat tidak dapat dimuat.",
    back: "Kembali ke Customer Channels",
    badge: "Website Chat",
    title: "Tambahkan Kolkap website chat ke website Anda.",
    subtitle:
      "Biarkan visitor website mengirim pesan ke bisnis Anda, menerima balasan dengan bantuan AI, dan percakapan tersimpan di Kolkap Inbox dan Leads.",
    workspace: "Workspace",
    workspaceFallback: "Bisnis Anda",
    statusTitle: "Status Koneksi",
    statusReady: "Backend website chat sudah siap",
    statusText:
      "Kolkap dapat menerima pesan website chat, mencocokkannya ke workspace ini, membuat balasan AI, menyimpan percakapan, dan mencatat penggunaan credits.",
    copySetup: "Setup Widget",
    copySetupTitle: "Copy kode website chat Anda.",
    copySetupText:
      "Paste kode ini ke website Anda sebelum closing body tag. Setelah public widget script live, kode ini akan menampilkan Kolkap chat bubble di website Anda.",
    widgetCode: "Kode Widget",
    copyCode: "Copy Kode",
    copied: "Copied",
    nextStepNotice:
      "Langkah development berikutnya: publish public widget script agar kode ini bisa menampilkan chat bubble di website mana pun.",
    installTitle: "Setup Sederhana",
    installText: "Tambahkan Kolkap chat ke website Anda dalam lima langkah mudah.",
    installSteps: [
      "Copy kode website chat.",
      "Paste sebelum closing body tag di website Anda.",
      "Buka website dan cek chat bubble.",
      "Kirim pesan test.",
      "Review percakapan di Kolkap Inbox.",
    ],
    testTitle: "Test sebelum go live",
    testText:
      "Sebelum widget ditampilkan ke visitor asli, test AI staff Anda dan pastikan business knowledge memberi jawaban yang benar.",
    openTestAI: "Buka Test AI",
    openInbox: "Buka Inbox",
    goLiveTitle: "Siap diaktifkan?",
    goLiveText:
      "Pastikan AI staff, Knowledge Base, trial atau plan aktif, dan credits sudah siap sebelum website chat digunakan dengan visitor asli.",
    continueGoLive: "Lanjut ke Go Live",
  },

  zh: {
    loading: "正在加载 website chat 设置...",
    failed: "Website Chat 页面无法加载。",
    back: "返回 Customer Channels",
    badge: "Website Chat",
    title: "将 Kolkap website chat 添加到您的网站。",
    subtitle:
      "让 website 访客向您的企业发送消息、收到 AI-assisted replies，并将对话保存到 Kolkap Inbox 和 Leads。",
    workspace: "Workspace",
    workspaceFallback: "您的业务",
    statusTitle: "连接状态",
    statusReady: "Website chat backend 已准备好",
    statusText:
      "Kolkap 可以接收 website chat 消息、匹配到此 workspace、生成 AI 回复、保存对话并记录 credits 使用。",
    copySetup: "Widget 设置",
    copySetupTitle: "复制您的 website chat code。",
    copySetupText:
      "将此代码粘贴到 website 的 closing body tag 前。Public widget script 上线后，此代码会在您的 website 显示 Kolkap chat bubble。",
    widgetCode: "Widget Code",
    copyCode: "复制代码",
    copied: "已复制",
    nextStepNotice:
      "下一步开发：发布 public widget script，让此代码可以在任何 website 显示 chat bubble。",
    installTitle: "简单设置",
    installText: "用五个简单步骤将 Kolkap chat 添加到您的 website。",
    installSteps: [
      "复制 website chat code。",
      "粘贴到 website 的 closing body tag 前。",
      "打开 website 并检查 chat bubble。",
      "发送测试消息。",
      "在 Kolkap Inbox 查看对话。",
    ],
    testTitle: "Go live 前先测试",
    testText:
      "在向真实访客显示 widget 前，请测试您的 AI staff，并确认 business knowledge 能给出正确答案。",
    openTestAI: "打开 Test AI",
    openInbox: "打开 Inbox",
    goLiveTitle: "准备启用了吗？",
    goLiveText:
      "使用 website chat 面向真实访客前，请确认 AI staff、Knowledge Base、有效 trial 或 plan，以及 credits 都已准备好。",
    continueGoLive: "继续到 Go Live",
  },

  ms: {
    loading: "Memuat setup website chat...",
    failed: "Halaman Website Chat tidak dapat dimuatkan.",
    back: "Kembali ke Customer Channels",
    badge: "Website Chat",
    title: "Tambah Kolkap website chat ke website anda.",
    subtitle:
      "Biarkan visitor website mesej bisnes anda, menerima AI-assisted replies, dan perbualan disimpan dalam Kolkap Inbox dan Leads.",
    workspace: "Workspace",
    workspaceFallback: "Bisnes anda",
    statusTitle: "Status Sambungan",
    statusReady: "Backend website chat sudah siap",
    statusText:
      "Kolkap boleh menerima mesej website chat, padankan dengan workspace ini, jana balasan AI, simpan perbualan, dan rekod penggunaan credits.",
    copySetup: "Setup Widget",
    copySetupTitle: "Copy kod website chat anda.",
    copySetupText:
      "Paste kod ini ke website anda sebelum closing body tag. Selepas public widget script live, kod ini akan memaparkan Kolkap chat bubble di website anda.",
    widgetCode: "Kod Widget",
    copyCode: "Copy Kod",
    copied: "Copied",
    nextStepNotice:
      "Langkah development seterusnya: publish public widget script supaya kod ini boleh memaparkan chat bubble di mana-mana website.",
    installTitle: "Setup Mudah",
    installText: "Tambah Kolkap chat ke website anda dalam lima langkah mudah.",
    installSteps: [
      "Copy kod website chat.",
      "Paste sebelum closing body tag di website anda.",
      "Buka website dan semak chat bubble.",
      "Hantar mesej test.",
      "Review perbualan di Kolkap Inbox.",
    ],
    testTitle: "Test sebelum go live",
    testText:
      "Sebelum widget ditunjukkan kepada visitor sebenar, test AI staff anda dan pastikan business knowledge memberi jawapan yang betul.",
    openTestAI: "Buka Test AI",
    openInbox: "Buka Inbox",
    goLiveTitle: "Sedia untuk aktifkan?",
    goLiveText:
      "Pastikan AI staff, Knowledge Base, trial atau plan aktif, dan credits sudah siap sebelum website chat digunakan dengan visitor sebenar.",
    continueGoLive: "Terus ke Go Live",
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
}

export default function WebsiteChatIntegrationPage() {
  const { language } = useKolkapLanguage();
  const t = translations[getSupportedLanguage(language)];

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;

  const [copied, setCopied] = useState(false);

  const workspaceId = workspace?.id || "YOUR_WORKSPACE_ID";

  const widgetCode = useMemo(() => {
    return `<script
  src="https://www.kolkap.com/widget.js"
  data-workspace-id="${workspaceId}">
</script>`;
  }, [workspaceId]);

  async function copyWidgetCode() {
    try {
      await navigator.clipboard.writeText(widgetCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
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
    <main className="min-h-screen bg-[#F7F9FA] text-[#07111F]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <Link
              href="/dashboard/integrations"
              className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
              {t.back}
            </Link>

            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <span className="h-3 w-3 rounded-full bg-[#7CFF3D] shadow-[0_0_14px_rgba(124,255,61,0.7)]" />
              {t.badge}
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 max-w-3xl text-xl font-semibold leading-9 text-slate-300">
              {t.subtitle}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/dashboard/test-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
              >
                <TestTube2 className="h-6 w-6" />
                {t.openTestAI}
              </Link>

              <Link
                href="/dashboard/inbox"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Inbox className="h-6 w-6" />
                {t.openInbox}
              </Link>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.statusTitle}
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {t.statusReady}
            </h2>

            <p className="mt-5 text-xl font-semibold leading-9 text-slate-600">
              {t.statusText}
            </p>

            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-base font-black uppercase tracking-[0.14em] text-blue-700">
                {t.workspace}
              </p>
              <p className="mt-2 break-all text-2xl font-black text-blue-950">
                {workspace?.business_name || t.workspaceFallback}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <Globe2 className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.copySetup}
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
              {t.copySetupTitle}
            </h2>

            <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
              {t.copySetupText}
            </p>

            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-base font-black leading-7 text-amber-800">
                {t.nextStepNotice}
              </p>
            </div>
          </div>

          <div className="rounded-[2.2rem] bg-[#07111F] p-6 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.widgetCode}
              </p>

              <button
                type="button"
                onClick={copyWidgetCode}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7CFF3D] px-5 py-3 text-sm font-black text-[#07111F]"
              >
                {copied ? (
                  <ClipboardCheck className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
                {copied ? t.copied : t.copyCode}
              </button>
            </div>

            <pre className="overflow-x-auto rounded-3xl bg-black/35 p-5 text-base font-semibold leading-8 text-slate-200">
              {widgetCode}
            </pre>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <div className="mb-7">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.installTitle}
            </p>

            <h2 className="mt-2 max-w-4xl text-4xl font-black tracking-[-0.05em]">
              {t.installText}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {t.installSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-[1.7rem] border border-slate-200 bg-[#F7F9FA] p-5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07111F] text-lg font-black text-[#7CFF3D]">
                  {index + 1}
                </div>

                <p className="text-lg font-black leading-7">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-blue-100 bg-blue-50 p-7 shadow-sm shadow-blue-900/5 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-700">
                {t.testTitle}
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] text-blue-950 sm:text-5xl">
                {t.testText}
              </h2>
            </div>

            <div className="grid gap-4">
              <Link
                href="/dashboard/test-ai"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5"
              >
                {t.openTestAI}
                <ArrowRight className="h-6 w-6" />
              </Link>

              <Link
                href="/dashboard/inbox"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-xl font-black text-[#07111F] shadow-sm transition hover:-translate-y-0.5"
              >
                {t.openInbox}
                <Inbox className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.goLiveTitle}
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                {t.goLiveText}
              </h2>
            </div>

            <Link
              href="/dashboard/go-live"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5"
            >
              {t.continueGoLive}
              <Rocket className="h-6 w-6" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}