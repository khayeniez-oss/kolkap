"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Headphones,
  Megaphone,
  MessageCircle,
  PenLine,
  PlayCircle,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";

const translations = {
  en: {
    badge: "Create AI",
    title: "Create your AI business team.",
    subtitle:
      "Follow a simple flow: choose your AI role, add business knowledge, connect WhatsApp, test the AI, then go live.",
    saveDraft: "Save Draft",
    create: "Create AI Staff",
    flowTitle: "Setup flow",
    flowText: "Complete each step before going live.",
    current: "Current",
    next: "Next",
    pending: "Pending",
    steps: [
      "Choose AI",
      "Add Knowledge",
      "Connect WhatsApp",
      "Test AI",
      "Go Live",
    ],
    chooseLabel: "Step 1",
    chooseTitle: "Choose what your AI should do",
    chooseText:
      "Start with one AI role. You can add more AI staff later as your business grows.",
    roles: [
      {
        title: "AI Receptionist",
        text: "Welcomes customers, asks what they need, and collects basic details.",
      },
      {
        title: "AI WhatsApp Responder",
        text: "Replies to WhatsApp inquiries and qualifies leads.",
      },
      {
        title: "AI Customer Support",
        text: "Answers FAQs, pricing, services, policies, and support questions.",
      },
      {
        title: "AI Sales Follow-up Assistant",
        text: "Follows up warm and hot leads with clear sales-focused messages.",
      },
      {
        title: "AI Social Media Caption Generator",
        text: "Creates captions for Instagram, Facebook, TikTok, LinkedIn, and more.",
      },
      {
        title: "AI Content Creator",
        text: "Creates content ideas, video scripts, ad copy, and campaign messages.",
      },
    ],
    aiName: "AI staff name",
    aiNamePlaceholder: "Example: Maya, Alex, Kolkap Assistant",
    language: "Reply language",
    tone: "Reply tone",
    toneOptions: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    instruction: "Main instruction",
    instructionPlaceholder:
      "Example: Welcome customers, ask what they need, collect contact details, and hand over to a human when needed.",
    knowledgeLabel: "Step 2",
    knowledgeTitle: "Add business knowledge",
    knowledgeText:
      "Teach Kolkap what your business offers so your AI can answer clearly.",
    knowledgeItems: [
      "Business description",
      "Services or products",
      "Pricing or packages",
      "Frequently asked questions",
      "Opening hours",
      "Policies and rules",
    ],
    knowledgePlaceholder:
      "Write important business information here. Example: services, prices, FAQs, opening hours, location, booking rules...",
    whatsappLabel: "Step 3",
    whatsappTitle: "Connect WhatsApp",
    whatsappText:
      "Connect your business WhatsApp so customers can message your AI. Kolkap keeps the flow easy for business owners.",
    whatsappNumber: "Business WhatsApp number",
    whatsappPlaceholder: "Country code + WhatsApp number",
    assignAI: "Assigned AI staff",
    testLabel: "Step 4",
    testTitle: "Test before going live",
    testText:
      "Send a sample customer message and check how your AI replies before real customers see it.",
    testPlaceholder: "Example: Hi, what services do you offer?",
    testButton: "Send Test Message",
    customer: "Customer",
    ai: "Kolkap AI",
    sampleCustomer:
      "Hi, can you tell me what your business offers and how I can book?",
    sampleAI:
      "Hi! I can help. May I know what service you are interested in so I can guide you with the next step?",
    liveLabel: "Step 5",
    liveTitle: "Go live when ready",
    liveText:
      "Activate your AI only after your role, knowledge, WhatsApp connection, and test replies are ready.",
    liveChecks: [
      "AI role selected",
      "Business knowledge added",
      "WhatsApp number prepared",
      "Test message reviewed",
      "Human handover enabled",
    ],
    goLive: "Go Live",
    noteTitle: "Built for business owners",
    noteText:
      "Kolkap simplifies the hard work behind customer replies, lead capture, and follow-up — so business owners can focus on growth.",
  },
  zh: {
    badge: "创建 AI",
    title: "创建您的 AI 商业团队。",
    subtitle:
      "按照简单流程：选择 AI 角色、添加企业知识、连接 WhatsApp、测试 AI，然后上线。",
    saveDraft: "保存草稿",
    create: "创建 AI 员工",
    flowTitle: "设置流程",
    flowText: "上线前请完成每个步骤。",
    current: "当前",
    next: "下一步",
    pending: "待完成",
    steps: ["选择 AI", "添加知识", "连接 WhatsApp", "测试 AI", "上线"],
    chooseLabel: "步骤 1",
    chooseTitle: "选择您的 AI 要做什么",
    chooseText: "先从一个 AI 角色开始。之后可以随着业务增长添加更多 AI 员工。",
    roles: [
      {
        title: "AI 接待员",
        text: "欢迎客户，询问需求，并收集基本信息。",
      },
      {
        title: "AI WhatsApp 回复员",
        text: "回复 WhatsApp 咨询并筛选线索。",
      },
      {
        title: "AI 客户支持",
        text: "回答常见问题、价格、服务、政策和支持问题。",
      },
      {
        title: "AI 销售跟进助手",
        text: "为潜在客户发送清晰、有销售方向的跟进消息。",
      },
      {
        title: "AI 社交媒体标题生成器",
        text: "为 Instagram、Facebook、TikTok、LinkedIn 等平台生成文案。",
      },
      {
        title: "AI 内容创作助手",
        text: "生成内容创意、视频脚本、广告文案和活动消息。",
      },
    ],
    aiName: "AI 员工名称",
    aiNamePlaceholder: "例如：Maya, Alex, Kolkap Assistant",
    language: "回复语言",
    tone: "回复语气",
    toneOptions: [
      "友好专业",
      "温暖亲切",
      "正式",
      "直接",
      "销售型",
      "高端奢华",
      "支持型",
      "轻松自然",
    ],
    instruction: "主要指令",
    instructionPlaceholder:
      "例如：欢迎客户，询问需求，收集联系方式，并在需要时转交人工。",
    knowledgeLabel: "步骤 2",
    knowledgeTitle: "添加企业知识",
    knowledgeText: "教 Kolkap 您的企业信息，让 AI 能清楚回答客户。",
    knowledgeItems: [
      "企业介绍",
      "服务或产品",
      "价格或套餐",
      "常见问题",
      "营业时间",
      "政策和规则",
    ],
    knowledgePlaceholder:
      "在这里填写重要企业信息。例如：服务、价格、常见问题、营业时间、地点、预约规则...",
    whatsappLabel: "步骤 3",
    whatsappTitle: "连接 WhatsApp",
    whatsappText:
      "连接您的企业 WhatsApp，让客户可以给 AI 发消息。Kolkap 让企业主的流程保持简单。",
    whatsappNumber: "企业 WhatsApp 号码",
    whatsappPlaceholder: "国家代码 + WhatsApp 号码",
    assignAI: "指定 AI 员工",
    testLabel: "步骤 4",
    testTitle: "上线前测试",
    testText: "发送示例客户消息，并在真实客户看到前检查 AI 回复。",
    testPlaceholder: "例如：你好，你们提供什么服务？",
    testButton: "发送测试消息",
    customer: "客户",
    ai: "Kolkap AI",
    sampleCustomer: "你好，可以告诉我你们提供什么服务以及如何预约吗？",
    sampleAI:
      "您好！我可以帮您。请问您对哪项服务感兴趣？我可以为您说明下一步。",
    liveLabel: "步骤 5",
    liveTitle: "准备好后上线",
    liveText:
      "只有在 AI 角色、企业知识、WhatsApp 连接和测试回复都准备好后才启用 AI。",
    liveChecks: [
      "已选择 AI 角色",
      "已添加企业知识",
      "已准备 WhatsApp 号码",
      "已检查测试消息",
      "已启用人工接手",
    ],
    goLive: "上线",
    noteTitle: "专为企业主打造",
    noteText:
      "Kolkap 简化客户回复、线索捕获和跟进中的繁重工作，让企业主可以专注于业务增长。",
  },
  id: {
    badge: "Create AI",
    title: "Buat tim bisnis AI Anda.",
    subtitle:
      "Ikuti alur sederhana: pilih peran AI, tambah pengetahuan bisnis, hubungkan WhatsApp, tes AI, lalu aktifkan.",
    saveDraft: "Simpan Draft",
    create: "Buat AI Staff",
    flowTitle: "Alur setup",
    flowText: "Selesaikan setiap langkah sebelum aktif.",
    current: "Saat ini",
    next: "Berikutnya",
    pending: "Menunggu",
    steps: [
      "Pilih AI",
      "Tambah Knowledge",
      "Hubungkan WhatsApp",
      "Tes AI",
      "Aktifkan",
    ],
    chooseLabel: "Langkah 1",
    chooseTitle: "Pilih apa yang AI harus lakukan",
    chooseText:
      "Mulai dengan satu peran AI. Anda bisa menambah AI staff lain saat bisnis berkembang.",
    roles: [
      {
        title: "AI Receptionist",
        text: "Menyambut pelanggan, menanyakan kebutuhan, dan mengumpulkan detail dasar.",
      },
      {
        title: "AI WhatsApp Responder",
        text: "Membalas pertanyaan WhatsApp dan menyaring leads.",
      },
      {
        title: "AI Customer Support",
        text: "Menjawab FAQ, harga, layanan, kebijakan, dan pertanyaan support.",
      },
      {
        title: "AI Sales Follow-up Assistant",
        text: "Follow up leads hangat dan hot leads dengan pesan yang jelas dan fokus penjualan.",
      },
      {
        title: "AI Social Media Caption Generator",
        text: "Membuat caption untuk Instagram, Facebook, TikTok, LinkedIn, dan lainnya.",
      },
      {
        title: "AI Content Creator",
        text: "Membuat ide konten, script video, iklan, dan pesan campaign.",
      },
    ],
    aiName: "Nama AI staff",
    aiNamePlaceholder: "Contoh: Maya, Alex, Kolkap Assistant",
    language: "Bahasa balasan",
    tone: "Gaya balasan",
    toneOptions: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    instruction: "Instruksi utama",
    instructionPlaceholder:
      "Contoh: Sambut pelanggan, tanyakan kebutuhan, kumpulkan kontak, dan handover ke manusia saat dibutuhkan.",
    knowledgeLabel: "Langkah 2",
    knowledgeTitle: "Tambah pengetahuan bisnis",
    knowledgeText:
      "Ajarkan Kolkap tentang bisnis Anda agar AI bisa menjawab dengan jelas.",
    knowledgeItems: [
      "Deskripsi bisnis",
      "Layanan atau produk",
      "Harga atau paket",
      "Pertanyaan umum",
      "Jam buka",
      "Kebijakan dan aturan",
    ],
    knowledgePlaceholder:
      "Tulis informasi penting bisnis di sini. Contoh: layanan, harga, FAQ, jam buka, lokasi, aturan booking...",
    whatsappLabel: "Langkah 3",
    whatsappTitle: "Hubungkan WhatsApp",
    whatsappText:
      "Hubungkan WhatsApp bisnis agar pelanggan bisa mengirim pesan ke AI Anda. Kolkap membuat alur tetap mudah untuk pemilik bisnis.",
    whatsappNumber: "Nomor WhatsApp bisnis",
    whatsappPlaceholder: "Kode negara + nomor WhatsApp",
    assignAI: "AI staff yang ditugaskan",
    testLabel: "Langkah 4",
    testTitle: "Tes sebelum aktif",
    testText:
      "Kirim pesan contoh dan cek bagaimana AI membalas sebelum pelanggan asli melihatnya.",
    testPlaceholder: "Contoh: Hai, layanan apa yang tersedia?",
    testButton: "Kirim Pesan Tes",
    customer: "Pelanggan",
    ai: "Kolkap AI",
    sampleCustomer:
      "Hai, bisa jelaskan layanan bisnis Anda dan bagaimana cara booking?",
    sampleAI:
      "Hai! Saya bisa membantu. Boleh tahu layanan apa yang Anda minati agar saya bisa membantu langkah berikutnya?",
    liveLabel: "Langkah 5",
    liveTitle: "Aktifkan saat siap",
    liveText:
      "Aktifkan AI hanya setelah peran, knowledge, koneksi WhatsApp, dan hasil tes sudah siap.",
    liveChecks: [
      "Peran AI dipilih",
      "Knowledge bisnis ditambahkan",
      "Nomor WhatsApp disiapkan",
      "Pesan tes sudah dicek",
      "Human handover aktif",
    ],
    goLive: "Aktifkan",
    noteTitle: "Dibuat untuk pemilik bisnis",
    noteText:
      "Kolkap mempermudah pekerjaan berat di balik balasan pelanggan, lead capture, dan follow-up — agar pemilik bisnis bisa fokus pada pertumbuhan.",
  },
  ms: {
    badge: "Create AI",
    title: "Cipta pasukan bisnes AI anda.",
    subtitle:
      "Ikuti aliran mudah: pilih peranan AI, tambah pengetahuan bisnes, sambungkan WhatsApp, uji AI, kemudian aktifkan.",
    saveDraft: "Simpan Draft",
    create: "Cipta AI Staff",
    flowTitle: "Aliran setup",
    flowText: "Lengkapkan setiap langkah sebelum aktif.",
    current: "Sekarang",
    next: "Seterusnya",
    pending: "Menunggu",
    steps: [
      "Pilih AI",
      "Tambah Knowledge",
      "Sambung WhatsApp",
      "Uji AI",
      "Aktifkan",
    ],
    chooseLabel: "Langkah 1",
    chooseTitle: "Pilih apa yang AI perlu lakukan",
    chooseText:
      "Mulakan dengan satu peranan AI. Anda boleh tambah AI staff lain apabila bisnes berkembang.",
    roles: [
      {
        title: "AI Receptionist",
        text: "Menyambut pelanggan, bertanya keperluan, dan mengumpul butiran asas.",
      },
      {
        title: "AI WhatsApp Responder",
        text: "Membalas pertanyaan WhatsApp dan menapis prospek.",
      },
      {
        title: "AI Customer Support",
        text: "Menjawab FAQ, harga, servis, polisi, dan soalan sokongan.",
      },
      {
        title: "AI Sales Follow-up Assistant",
        text: "Follow up prospek hangat dengan mesej jelas dan berfokus jualan.",
      },
      {
        title: "AI Social Media Caption Generator",
        text: "Mencipta caption untuk Instagram, Facebook, TikTok, LinkedIn, dan lain-lain.",
      },
      {
        title: "AI Content Creator",
        text: "Mencipta idea kandungan, skrip video, iklan, dan mesej campaign.",
      },
    ],
    aiName: "Nama AI staff",
    aiNamePlaceholder: "Contoh: Maya, Alex, Kolkap Assistant",
    language: "Bahasa balasan",
    tone: "Gaya balasan",
    toneOptions: [
      "Friendly Professional",
      "Warm",
      "Formal",
      "Direct",
      "Salesy",
      "Luxury",
      "Supportive",
      "Casual",
    ],
    instruction: "Arahan utama",
    instructionPlaceholder:
      "Contoh: Sambut pelanggan, tanya keperluan, kumpul kontak, dan serah kepada manusia bila perlu.",
    knowledgeLabel: "Langkah 2",
    knowledgeTitle: "Tambah pengetahuan bisnes",
    knowledgeText:
      "Ajar Kolkap tentang bisnes anda supaya AI boleh menjawab dengan jelas.",
    knowledgeItems: [
      "Penerangan bisnes",
      "Servis atau produk",
      "Harga atau pakej",
      "Soalan lazim",
      "Waktu operasi",
      "Polisi dan peraturan",
    ],
    knowledgePlaceholder:
      "Tulis maklumat penting bisnes di sini. Contoh: servis, harga, FAQ, waktu operasi, lokasi, aturan booking...",
    whatsappLabel: "Langkah 3",
    whatsappTitle: "Sambungkan WhatsApp",
    whatsappText:
      "Sambungkan WhatsApp bisnes supaya pelanggan boleh menghantar mesej kepada AI anda. Kolkap menjadikan aliran mudah untuk pemilik bisnes.",
    whatsappNumber: "Nombor WhatsApp bisnes",
    whatsappPlaceholder: "Kod negara + nombor WhatsApp",
    assignAI: "AI staff ditugaskan",
    testLabel: "Langkah 4",
    testTitle: "Uji sebelum aktif",
    testText:
      "Hantar mesej contoh dan semak bagaimana AI membalas sebelum pelanggan sebenar melihatnya.",
    testPlaceholder: "Contoh: Hai, servis apa yang tersedia?",
    testButton: "Hantar Mesej Ujian",
    customer: "Pelanggan",
    ai: "Kolkap AI",
    sampleCustomer:
      "Hai, boleh jelaskan servis bisnes anda dan bagaimana cara booking?",
    sampleAI:
      "Hai! Saya boleh bantu. Boleh tahu servis apa yang anda minati supaya saya boleh bantu langkah seterusnya?",
    liveLabel: "Langkah 5",
    liveTitle: "Aktifkan apabila sedia",
    liveText:
      "Aktifkan AI hanya selepas peranan, knowledge, sambungan WhatsApp, dan ujian sudah sedia.",
    liveChecks: [
      "Peranan AI dipilih",
      "Knowledge bisnes ditambah",
      "Nombor WhatsApp disediakan",
      "Mesej ujian sudah disemak",
      "Human handover aktif",
    ],
    goLive: "Aktifkan",
    noteTitle: "Dibina untuk pemilik bisnes",
    noteText:
      "Kolkap memudahkan kerja berat di sebalik balasan pelanggan, lead capture, dan follow-up — supaya pemilik bisnes boleh fokus kepada pertumbuhan.",
  },
};

const roleIcons = [Bot, MessageCircle, Headphones, Send, Megaphone, PenLine];
const stepIcons = [Bot, BookOpen, MessageCircle, WandSparkles, Rocket];

export default function CreateAIPage() {
  const { language } = useKolkapLanguage();
  const t = translations[language] || translations.en;
  const [selectedRole, setSelectedRole] = useState(0);

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9 lg:p-10">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
              <Sparkles className="h-5 w-5" />
              {t.badge}
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-slate-300">
              {t.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-7 py-4 text-lg font-black text-[#07111F]">
                <Bot className="h-6 w-6" />
                {t.create}
              </button>

              <button className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-lg font-black text-white">
                <ShieldCheck className="h-6 w-6" />
                {t.saveDraft}
              </button>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-7">
            <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
              {t.flowTitle}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {t.flowText}
            </h2>

            <div className="mt-6 grid gap-3">
              {t.steps.map((step, index) => {
                const Icon = stepIcons[index];
                const active = index === 0;

                return (
                  <div
                    key={step}
                    className={`flex items-center gap-4 rounded-3xl border p-4 ${
                      active
                        ? "border-[#07111F] bg-[#07111F] text-white"
                        : "border-slate-200 bg-[#F7F9FA] text-[#07111F]"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        active
                          ? "bg-white text-[#07111F]"
                          : "bg-[#07111F] text-[#7CFF3D]"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-400">
                        Step {index + 1}
                      </p>
                      <p className="text-xl font-black">{step}</p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        active
                          ? "bg-[#7CFF3D] text-[#07111F]"
                          : index === 1
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {active ? t.current : index === 1 ? t.next : t.pending}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.chooseLabel}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.chooseTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-xl font-semibold leading-9 text-slate-600">
                {t.chooseText}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {t.roles.map((role, index) => {
                const Icon = roleIcons[index];
                const active = selectedRole === index;

                return (
                  <button
                    key={role.title}
                    type="button"
                    onClick={() => setSelectedRole(index)}
                    className={`rounded-[2rem] border p-6 text-left transition hover:-translate-y-1 ${
                      active
                        ? "border-[#07111F] bg-[#07111F] text-white shadow-xl shadow-slate-900/15"
                        : "border-slate-200 bg-[#F7F9FA] text-[#07111F] hover:border-blue-400 hover:bg-white"
                    }`}
                  >
                    <div
                      className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                        active
                          ? "bg-white text-[#07111F]"
                          : "bg-[#07111F] text-[#7CFF3D]"
                      }`}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-black tracking-[-0.04em]">
                      {role.title}
                    </h3>
                    <p
                      className={`mt-4 text-lg font-semibold leading-8 ${
                        active ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {role.text}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.aiName}
                </span>
                <input
                  type="text"
                  placeholder={t.aiNamePlaceholder}
                  className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.language}
                </span>
                <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                  <option>Auto-detect</option>
                  <option>English</option>
                  <option>中文</option>
                  <option>Bahasa Indonesia</option>
                  <option>Malay</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.tone}
                </span>
                <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                  {t.toneOptions.map((tone) => (
                    <option key={tone}>{tone}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-base font-black text-slate-700">
                  {t.instruction}
                </span>
                <textarea
                  rows={5}
                  placeholder={t.instructionPlaceholder}
                  className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.knowledgeLabel}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.knowledgeTitle}
              </h2>
              <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
                {t.knowledgeText}
              </p>

              <div className="mt-6 grid gap-3">
                {t.knowledgeItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] p-4"
                  >
                    <CheckCircle2 className="h-6 w-6 text-[#07111F]" />
                    <p className="text-lg font-black">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.knowledgeTitle}
                </span>
                <textarea
                  rows={13}
                  placeholder={t.knowledgePlaceholder}
                  className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.whatsappLabel}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.whatsappTitle}
              </h2>
              <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
                {t.whatsappText}
              </p>

              <div className="mt-7 grid gap-5">
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.whatsappNumber}
                  </span>
                  <input
                    type="tel"
                    placeholder={t.whatsappPlaceholder}
                    className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.assignAI}
                  </span>
                  <select className="h-14 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white">
                    {t.roles.map((role) => (
                      <option key={role.title}>{role.title}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-blue-100 bg-blue-50 p-6 shadow-sm shadow-blue-900/5 sm:p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-black tracking-[-0.04em] text-blue-950">
                {t.noteTitle}
              </h3>
              <p className="mt-4 text-xl font-semibold leading-9 text-blue-800">
                {t.noteText}
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.testLabel}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {t.testTitle}
              </h2>
              <p className="mt-4 text-xl font-semibold leading-9 text-slate-600">
                {t.testText}
              </p>

              <div className="mt-7 grid gap-4">
                <textarea
                  rows={5}
                  placeholder={t.testPlaceholder}
                  className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                />

                <button className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5">
                  <Send className="h-6 w-6" />
                  {t.testButton}
                </button>
              </div>
            </div>

            <div className="rounded-[2.2rem] bg-[#07111F] p-6 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
              <div className="space-y-4">
                <div className="max-w-[90%] rounded-2xl bg-white/10 p-5">
                  <p className="text-base font-black text-white">
                    {t.customer}
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-8 text-slate-300">
                    {t.sampleCustomer}
                  </p>
                </div>

                <div className="ml-auto max-w-[94%] rounded-2xl border border-blue-400/40 bg-blue-500/15 p-5">
                  <p className="text-base font-black text-blue-100">{t.ai}</p>
                  <p className="mt-2 text-lg font-semibold leading-8 text-slate-200">
                    {t.sampleAI}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                  {t.liveLabel}
                </p>

                <h2 className="mt-3 text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
                  {t.liveTitle}
                </h2>

                <p className="mt-5 text-xl font-semibold leading-9 text-slate-300">
                  {t.liveText}
                </p>
              </div>

              <div className="grid gap-4">
                {t.liveChecks.map((check) => (
                  <div
                    key={check}
                    className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5"
                  >
                    <CheckCircle2 className="h-7 w-7 text-[#7CFF3D]" />
                    <p className="text-xl font-black">{check}</p>
                  </div>
                ))}

                <button className="mt-3 inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-xl font-black text-[#07111F] shadow-xl shadow-lime-400/10 transition hover:-translate-y-0.5">
                  <PlayCircle className="h-6 w-6" />
                  {t.goLive}
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}