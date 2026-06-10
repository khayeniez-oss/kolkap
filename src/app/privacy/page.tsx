"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bot,
  CreditCard,
  Database,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type PolicySection = {
  title: string;
  text: string[];
};

type HighlightItem = {
  title: string;
  text: string;
};

type PrivacyTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  effectiveDate: string;
  aiPlatform: string;
  workspaceData: string;
  deletionSupported: string;
  summaryTitle: string;
  summaryItems: string[];
  backToKolkap: string;
  questionsTitle: string;
  questionsText: string;
  supportEmail: string;
  highlights: HighlightItem[];
  sections: PolicySection[];
};

const supportedLanguages: SupportedLanguage[] = ["en", "id", "zh", "ms"];

const translations: Record<SupportedLanguage, PrivacyTranslation> = {
  en: {
    badge: "Privacy Policy",
    title: "Kolkap Privacy Policy",
    subtitle:
      "This Privacy Policy explains how Kolkap collects, uses, stores, shares, and protects information when businesses use Kolkap to create and manage AI staff.",
    effectiveDate: "Effective date: June 2026",
    aiPlatform: "AI staff platform",
    workspaceData: "Business workspace data",
    deletionSupported: "Account deletion supported",
    summaryTitle: "Plain-language privacy summary",
    summaryItems: [
      "We collect account, business, workspace, usage, and billing-related data.",
      "Your business workspace data is used to power your own AI staff.",
      "We do not sell your personal information.",
      "Third-party providers may process data to help operate Kolkap.",
      "You can delete your account from Settings.",
    ],
    backToKolkap: "Back to Kolkap",
    questionsTitle: "Privacy questions?",
    questionsText:
      "Contact Kolkap for privacy, data, or account deletion support.",
    supportEmail: "support@kolkap.com",
    highlights: [
      {
        title: "AI staff data",
        text: "Kolkap processes business knowledge, prompts, messages, and AI staff settings to generate useful business replies and content.",
      },
      {
        title: "Messages and leads",
        text: "Customer conversations and lead details may be processed when businesses use Kolkap for inbox, chat, WhatsApp, or future channels.",
      },
      {
        title: "Billing by Stripe",
        text: "Kolkap does not store full card numbers. Payment methods and billing are handled by Stripe.",
      },
      {
        title: "Account deletion",
        text: "Users can delete their account from Settings > Delete Account.",
      },
    ],
    sections: [
      {
        title: "1. Introduction",
        text: [
          "Kolkap is an AI staff platform for businesses. Kolkap helps business users create AI staff to support customer replies, inbox support, content generation, business knowledge handling, leads, usage tracking, billing, and future messaging channels.",
          "This Privacy Policy explains what information we collect, how we use it, how we protect it, and how users can request or complete account deletion.",
        ],
      },
      {
        title: "2. Information We Collect",
        text: [
          "We may collect account information such as your name, email address, login details, and account preferences.",
          "We may collect business information such as business name, business type, business email, business phone number, WhatsApp number, business address, country, timezone, and workspace settings.",
          "We may collect AI workspace information such as AI staff settings, business knowledge, AI instructions, reply language, reply tone, handover rules, and automation preferences.",
          "We may collect customer communication data such as messages, conversations, leads, customer names, contact details, inquiry details, handover status, and inbox activity when you use Kolkap for customer communication.",
          "We may collect usage and billing information such as AI credits, usage events, plan status, trial status, subscription status, invoices, and billing-related records.",
          "We may collect technical information such as browser type, device information, IP address, app activity, logs, cookies, session data, and security-related events.",
        ],
      },
      {
        title: "3. Business Workspace and AI Staff Data",
        text: [
          "Each Kolkap business workspace is intended to be private to that business account and its approved team members.",
          "Business knowledge, AI staff instructions, workspace settings, and uploaded business information are used to help your AI staff generate more relevant replies, content, and business support.",
          "Kolkap does not intentionally use one business customer’s private workspace data to serve another business customer.",
        ],
      },
      {
        title: "4. Customer Messages and Leads",
        text: [
          "If you use Kolkap to manage customer conversations, leads, inbox replies, website chat, WhatsApp, or future messaging channels, Kolkap may process customer messages and lead details on your behalf.",
          "You are responsible for ensuring that you have the right to upload, connect, or process customer information inside your Kolkap workspace.",
          "Kolkap uses this information to display conversations, help generate AI replies, support handover to humans, manage leads, and track usage.",
        ],
      },
      {
        title: "5. How We Use Information",
        text: [
          "We use information to create and manage user accounts, create business workspaces, provide AI staff functionality, generate AI replies and content, manage conversations and leads, process usage credits, provide billing and subscription access, improve platform reliability, prevent abuse, provide support, and comply with legal obligations.",
          "We may also use limited technical and usage information to monitor performance, fix errors, improve security, and understand how Kolkap is used.",
        ],
      },
      {
        title: "6. AI Processing",
        text: [
          "Kolkap uses AI models and AI service providers to generate replies, content, summaries, drafts, and business assistance based on the information provided by users.",
          "Business knowledge, prompts, messages, AI staff settings, and conversation context may be processed by AI providers to generate outputs.",
          "AI outputs may be inaccurate or incomplete. Users should review AI outputs before using them in sensitive, legal, financial, medical, safety, or high-risk situations.",
          "Users are responsible for the information they upload and for how they use AI-generated outputs.",
        ],
      },
      {
        title: "7. Payments and Billing",
        text: [
          "Kolkap may use Stripe or another payment provider to process payment methods, subscriptions, invoices, billing status, free trials, and related payment records.",
          "Kolkap does not store full card numbers. Payment method details are handled by the payment provider.",
          "We may store payment-related references such as customer ID, subscription ID, price ID, billing status, trial dates, invoice status, and transaction-related records so we can manage your subscription and account access.",
        ],
      },
      {
        title: "8. Third-Party Services",
        text: [
          "Kolkap may use third-party services to operate the platform, including Supabase for authentication, database, and storage; Stripe for payment processing and billing; AI providers for AI generation; hosting providers for app and website hosting; and communication providers for future messaging channels such as WhatsApp, website chat, or email.",
          "These third-party services may process information only as needed to provide their services to Kolkap and our users.",
        ],
      },
      {
        title: "9. Data Sharing",
        text: [
          "We do not sell your personal information.",
          "We may share information with service providers who help us operate Kolkap, process payments, provide AI functionality, host the platform, support security, or provide customer support.",
          "We may disclose information if required by law, legal process, fraud prevention, security protection, or to protect the rights and safety of Kolkap, our users, or others.",
        ],
      },
      {
        title: "10. Data Security",
        text: [
          "We use reasonable technical, administrative, and organizational measures to protect user data and workspace information.",
          "No online service can guarantee absolute security. Users should keep their login details safe and only add trusted team members to their workspace.",
        ],
      },
      {
        title: "11. Data Retention",
        text: [
          "We keep account, workspace, usage, and billing data for as long as needed to provide Kolkap, comply with legal obligations, resolve disputes, prevent abuse, and maintain business records.",
          "When an account is deleted, we delete or anonymize associated account and workspace data unless we are required to retain certain records for legal, tax, billing, security, fraud-prevention, or dispute-handling reasons.",
        ],
      },
      {
        title: "12. Account Deletion",
        text: [
          "Users can delete their Kolkap account from Settings > Delete Account.",
          "Deleting an account may remove account access, business workspace data, AI staff setup, business knowledge, conversations, leads, usage records, and related workspace data.",
          "Some records may be retained where required for legal, tax, billing, security, fraud-prevention, or dispute-handling purposes.",
        ],
      },
      {
        title: "13. User Rights and Choices",
        text: [
          "Depending on your location, you may have rights to access, correct, export, or delete your personal information.",
          "You may contact Kolkap to request help with account data, privacy questions, or deletion support.",
        ],
      },
      {
        title: "14. International Data Processing",
        text: [
          "Kolkap may process and store information using service providers located in different countries.",
          "By using Kolkap, you understand that your information may be processed outside your country of residence where our service providers operate.",
        ],
      },
      {
        title: "15. Children’s Privacy",
        text: [
          "Kolkap is intended for business users and is not designed for children.",
          "We do not knowingly collect personal information from children. If you believe a child has provided personal information to Kolkap, please contact us.",
        ],
      },
      {
        title: "16. Changes to This Policy",
        text: [
          "We may update this Privacy Policy from time to time. When we make changes, we will update the effective date on this page.",
          "Continued use of Kolkap after changes means you accept the updated Privacy Policy.",
        ],
      },
      {
        title: "17. Contact Us",
        text: [
          "For privacy questions, account deletion support, or data requests, contact Kolkap at support@kolkap.com.",
        ],
      },
    ],
  },

  id: {
    badge: "Kebijakan Privasi",
    title: "Kebijakan Privasi Kolkap",
    subtitle:
      "Kebijakan Privasi ini menjelaskan bagaimana Kolkap mengumpulkan, menggunakan, menyimpan, membagikan, dan melindungi informasi saat bisnis menggunakan Kolkap untuk membuat dan mengelola AI staff.",
    effectiveDate: "Tanggal berlaku: Juni 2026",
    aiPlatform: "Platform AI staff",
    workspaceData: "Data business workspace",
    deletionSupported: "Penghapusan akun tersedia",
    summaryTitle: "Ringkasan privasi sederhana",
    summaryItems: [
      "Kami mengumpulkan data akun, bisnis, workspace, penggunaan, dan billing.",
      "Data business workspace Anda digunakan untuk menjalankan AI staff milik bisnis Anda sendiri.",
      "Kami tidak menjual informasi pribadi Anda.",
      "Penyedia layanan pihak ketiga dapat memproses data untuk membantu menjalankan Kolkap.",
      "Anda dapat menghapus akun dari Settings.",
    ],
    backToKolkap: "Kembali ke Kolkap",
    questionsTitle: "Pertanyaan privasi?",
    questionsText:
      "Hubungi Kolkap untuk pertanyaan privasi, data, atau bantuan penghapusan akun.",
    supportEmail: "support@kolkap.com",
    highlights: [
      {
        title: "Data AI staff",
        text: "Kolkap memproses business knowledge, prompt, pesan, dan pengaturan AI staff untuk menghasilkan balasan dan content bisnis yang relevan.",
      },
      {
        title: "Pesan dan leads",
        text: "Percakapan pelanggan dan detail leads dapat diproses saat bisnis menggunakan Kolkap untuk inbox, chat, WhatsApp, atau channel lain di masa depan.",
      },
      {
        title: "Billing oleh Stripe",
        text: "Kolkap tidak menyimpan nomor kartu penuh. Payment method dan billing diproses oleh Stripe.",
      },
      {
        title: "Penghapusan akun",
        text: "User dapat menghapus akun dari Settings > Delete Account.",
      },
    ],
    sections: [
      {
        title: "1. Pendahuluan",
        text: [
          "Kolkap adalah platform AI staff untuk bisnis. Kolkap membantu pengguna bisnis membuat AI staff untuk mendukung balasan pelanggan, inbox support, content generation, pengelolaan business knowledge, leads, usage tracking, billing, dan channel messaging di masa depan.",
          "Kebijakan Privasi ini menjelaskan informasi apa yang kami kumpulkan, bagaimana kami menggunakannya, bagaimana kami melindunginya, dan bagaimana user dapat meminta atau melakukan penghapusan akun.",
        ],
      },
      {
        title: "2. Informasi yang Kami Kumpulkan",
        text: [
          "Kami dapat mengumpulkan informasi akun seperti nama, alamat email, detail login, dan preferensi akun.",
          "Kami dapat mengumpulkan informasi bisnis seperti nama bisnis, jenis bisnis, email bisnis, nomor telepon bisnis, nomor WhatsApp, alamat bisnis, negara, timezone, dan pengaturan workspace.",
          "Kami dapat mengumpulkan informasi AI workspace seperti pengaturan AI staff, business knowledge, instruksi AI, bahasa balasan, tone balasan, aturan handover, dan preferensi automation.",
          "Kami dapat mengumpulkan data komunikasi pelanggan seperti pesan, conversations, leads, nama pelanggan, detail kontak, detail inquiry, handover status, dan aktivitas inbox saat Anda menggunakan Kolkap untuk komunikasi pelanggan.",
          "Kami dapat mengumpulkan informasi penggunaan dan billing seperti AI credits, usage events, status paket, status trial, status subscription, invoice, dan catatan billing terkait.",
          "Kami dapat mengumpulkan informasi teknis seperti tipe browser, informasi perangkat, IP address, aktivitas app, log, cookies, session data, dan event terkait keamanan.",
        ],
      },
      {
        title: "3. Data Business Workspace dan AI Staff",
        text: [
          "Setiap Kolkap business workspace dimaksudkan untuk bersifat private bagi akun bisnis tersebut dan team member yang disetujui.",
          "Business knowledge, instruksi AI staff, pengaturan workspace, dan informasi bisnis yang diunggah digunakan untuk membantu AI staff menghasilkan balasan, content, dan bantuan bisnis yang lebih relevan.",
          "Kolkap tidak secara sengaja menggunakan data private workspace dari satu customer bisnis untuk melayani customer bisnis lain.",
        ],
      },
      {
        title: "4. Pesan Pelanggan dan Leads",
        text: [
          "Jika Anda menggunakan Kolkap untuk mengelola customer conversations, leads, inbox replies, website chat, WhatsApp, atau channel messaging lainnya di masa depan, Kolkap dapat memproses pesan pelanggan dan detail leads atas nama Anda.",
          "Anda bertanggung jawab memastikan bahwa Anda memiliki hak untuk mengunggah, menghubungkan, atau memproses informasi pelanggan di dalam Kolkap workspace Anda.",
          "Kolkap menggunakan informasi ini untuk menampilkan conversations, membantu menghasilkan AI replies, mendukung handover ke manusia, mengelola leads, dan melacak usage.",
        ],
      },
      {
        title: "5. Cara Kami Menggunakan Informasi",
        text: [
          "Kami menggunakan informasi untuk membuat dan mengelola akun user, membuat business workspace, menyediakan fungsi AI staff, menghasilkan AI replies dan content, mengelola conversations dan leads, memproses usage credits, menyediakan akses billing dan subscription, meningkatkan reliability platform, mencegah penyalahgunaan, memberikan support, dan mematuhi kewajiban hukum.",
          "Kami juga dapat menggunakan informasi teknis dan usage terbatas untuk memantau performa, memperbaiki error, meningkatkan keamanan, dan memahami bagaimana Kolkap digunakan.",
        ],
      },
      {
        title: "6. Pemrosesan AI",
        text: [
          "Kolkap menggunakan AI models dan AI service providers untuk menghasilkan replies, content, summaries, drafts, dan bantuan bisnis berdasarkan informasi yang diberikan oleh user.",
          "Business knowledge, prompts, messages, AI staff settings, dan conversation context dapat diproses oleh AI providers untuk menghasilkan output.",
          "Output AI dapat tidak akurat atau tidak lengkap. User harus meninjau output AI sebelum menggunakannya dalam situasi sensitif, legal, financial, medical, safety, atau high-risk.",
          "User bertanggung jawab atas informasi yang diunggah dan bagaimana mereka menggunakan output yang dihasilkan AI.",
        ],
      },
      {
        title: "7. Pembayaran dan Billing",
        text: [
          "Kolkap dapat menggunakan Stripe atau payment provider lain untuk memproses payment method, subscription, invoice, billing status, free trial, dan catatan pembayaran terkait.",
          "Kolkap tidak menyimpan nomor kartu penuh. Detail payment method diproses oleh payment provider.",
          "Kami dapat menyimpan referensi terkait pembayaran seperti customer ID, subscription ID, price ID, billing status, tanggal trial, invoice status, dan catatan transaksi agar kami dapat mengelola subscription dan akses akun Anda.",
        ],
      },
      {
        title: "8. Layanan Pihak Ketiga",
        text: [
          "Kolkap dapat menggunakan layanan pihak ketiga untuk menjalankan platform, termasuk Supabase untuk authentication, database, dan storage; Stripe untuk payment processing dan billing; AI providers untuk AI generation; hosting providers untuk hosting app dan website; serta communication providers untuk channel messaging di masa depan seperti WhatsApp, website chat, atau email.",
          "Layanan pihak ketiga ini dapat memproses informasi hanya sejauh diperlukan untuk menyediakan layanan mereka kepada Kolkap dan user kami.",
        ],
      },
      {
        title: "9. Pembagian Data",
        text: [
          "Kami tidak menjual informasi pribadi Anda.",
          "Kami dapat membagikan informasi dengan service providers yang membantu kami menjalankan Kolkap, memproses pembayaran, menyediakan fungsi AI, hosting platform, keamanan, atau customer support.",
          "Kami dapat mengungkapkan informasi jika diwajibkan oleh hukum, proses hukum, fraud prevention, security protection, atau untuk melindungi hak dan keamanan Kolkap, user kami, atau pihak lain.",
        ],
      },
      {
        title: "10. Keamanan Data",
        text: [
          "Kami menggunakan langkah teknis, administratif, dan organisasi yang wajar untuk melindungi data user dan informasi workspace.",
          "Tidak ada layanan online yang dapat menjamin keamanan absolut. User harus menjaga detail login mereka dan hanya menambahkan team member terpercaya ke workspace.",
        ],
      },
      {
        title: "11. Retensi Data",
        text: [
          "Kami menyimpan data akun, workspace, usage, dan billing selama diperlukan untuk menyediakan Kolkap, mematuhi kewajiban hukum, menyelesaikan sengketa, mencegah penyalahgunaan, dan menjaga catatan bisnis.",
          "Saat akun dihapus, kami menghapus atau menganonimkan data akun dan workspace terkait kecuali kami diwajibkan menyimpan catatan tertentu untuk alasan hukum, pajak, billing, keamanan, fraud prevention, atau penanganan sengketa.",
        ],
      },
      {
        title: "12. Penghapusan Akun",
        text: [
          "User dapat menghapus akun Kolkap dari Settings > Delete Account.",
          "Menghapus akun dapat menghapus akses akun, data business workspace, setup AI staff, business knowledge, conversations, leads, usage records, dan data workspace terkait.",
          "Beberapa catatan dapat disimpan jika diperlukan untuk tujuan hukum, pajak, billing, keamanan, fraud prevention, atau penanganan sengketa.",
        ],
      },
      {
        title: "13. Hak dan Pilihan User",
        text: [
          "Tergantung lokasi Anda, Anda dapat memiliki hak untuk mengakses, memperbaiki, mengekspor, atau menghapus informasi pribadi Anda.",
          "Anda dapat menghubungi Kolkap untuk meminta bantuan terkait data akun, pertanyaan privasi, atau deletion support.",
        ],
      },
      {
        title: "14. Pemrosesan Data Internasional",
        text: [
          "Kolkap dapat memproses dan menyimpan informasi menggunakan service providers yang berada di berbagai negara.",
          "Dengan menggunakan Kolkap, Anda memahami bahwa informasi Anda dapat diproses di luar negara tempat tinggal Anda di mana service providers kami beroperasi.",
        ],
      },
      {
        title: "15. Privasi Anak-Anak",
        text: [
          "Kolkap ditujukan untuk pengguna bisnis dan tidak dirancang untuk anak-anak.",
          "Kami tidak secara sadar mengumpulkan informasi pribadi dari anak-anak. Jika Anda percaya seorang anak telah memberikan informasi pribadi kepada Kolkap, silakan hubungi kami.",
        ],
      },
      {
        title: "16. Perubahan Kebijakan Ini",
        text: [
          "Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Saat kami melakukan perubahan, kami akan memperbarui tanggal berlaku pada halaman ini.",
          "Penggunaan Kolkap setelah perubahan berarti Anda menerima Kebijakan Privasi yang telah diperbarui.",
        ],
      },
      {
        title: "17. Hubungi Kami",
        text: [
          "Untuk pertanyaan privasi, bantuan penghapusan akun, atau permintaan data, hubungi Kolkap di support@kolkap.com.",
        ],
      },
    ],
  },

  zh: {
    badge: "隐私政策",
    title: "Kolkap 隐私政策",
    subtitle:
      "本隐私政策说明当企业使用 Kolkap 创建和管理 AI 员工时，Kolkap 如何收集、使用、存储、共享和保护信息。",
    effectiveDate: "生效日期：2026 年 6 月",
    aiPlatform: "AI 员工平台",
    workspaceData: "企业 workspace 数据",
    deletionSupported: "支持账户删除",
    summaryTitle: "简明隐私摘要",
    summaryItems: [
      "我们会收集账户、企业、workspace、使用情况和 billing 相关数据。",
      "您的企业 workspace 数据用于支持您自己的 AI 员工。",
      "我们不会出售您的个人信息。",
      "第三方服务提供商可能会处理数据，以帮助 Kolkap 正常运行。",
      "您可以在 Settings 中删除账户。",
    ],
    backToKolkap: "返回 Kolkap",
    questionsTitle: "有隐私问题？",
    questionsText: "请联系 Kolkap 获取隐私、数据或账户删除支持。",
    supportEmail: "support@kolkap.com",
    highlights: [
      {
        title: "AI 员工数据",
        text: "Kolkap 会处理业务知识、prompt、消息和 AI 员工设置，以生成有用的业务回复和内容。",
      },
      {
        title: "消息和 leads",
        text: "当企业使用 Kolkap 管理 inbox、chat、WhatsApp 或未来渠道时，客户对话和 lead 详情可能会被处理。",
      },
      {
        title: "Stripe 处理 billing",
        text: "Kolkap 不存储完整银行卡号。付款方式和 billing 由 Stripe 处理。",
      },
      {
        title: "账户删除",
        text: "用户可以在 Settings > Delete Account 删除账户。",
      },
    ],
    sections: [
      {
        title: "1. 简介",
        text: [
          "Kolkap 是面向企业的 AI 员工平台。Kolkap 帮助企业用户创建 AI 员工，用于客户回复、inbox support、内容生成、业务知识处理、leads、usage tracking、billing 以及未来 messaging channels。",
          "本隐私政策说明我们收集哪些信息、如何使用这些信息、如何保护信息，以及用户如何请求或完成账户删除。",
        ],
      },
      {
        title: "2. 我们收集的信息",
        text: [
          "我们可能收集账户信息，例如姓名、电子邮件地址、登录详情和账户偏好。",
          "我们可能收集企业信息，例如企业名称、企业类型、企业邮箱、企业电话、WhatsApp 号码、企业地址、国家、timezone 和 workspace 设置。",
          "我们可能收集 AI workspace 信息，例如 AI 员工设置、业务知识、AI 指令、回复语言、回复语气、handover rules 和 automation preferences。",
          "当您使用 Kolkap 进行客户沟通时，我们可能收集客户沟通数据，例如 messages、conversations、leads、客户姓名、联系方式、inquiry details、handover status 和 inbox activity。",
          "我们可能收集 usage 和 billing 信息，例如 AI credits、usage events、plan status、trial status、subscription status、invoices 和 billing 相关记录。",
          "我们可能收集技术信息，例如浏览器类型、设备信息、IP 地址、app activity、logs、cookies、session data 和安全相关事件。",
        ],
      },
      {
        title: "3. Business Workspace 和 AI 员工数据",
        text: [
          "每个 Kolkap business workspace 旨在仅对该企业账户及其授权 team members 保持私密。",
          "业务知识、AI 员工指令、workspace 设置和上传的企业信息用于帮助您的 AI 员工生成更相关的回复、内容和业务支持。",
          "Kolkap 不会故意使用一个企业客户的私有 workspace 数据来服务另一个企业客户。",
        ],
      },
      {
        title: "4. 客户消息和 Leads",
        text: [
          "如果您使用 Kolkap 管理 customer conversations、leads、inbox replies、website chat、WhatsApp 或未来 messaging channels，Kolkap 可能会代表您处理客户消息和 lead 详情。",
          "您有责任确保您有权在 Kolkap workspace 中上传、连接或处理客户信息。",
          "Kolkap 使用这些信息来显示 conversations、帮助生成 AI replies、支持 human handover、管理 leads 和追踪 usage。",
        ],
      },
      {
        title: "5. 我们如何使用信息",
        text: [
          "我们使用信息来创建和管理用户账户、创建 business workspaces、提供 AI staff 功能、生成 AI replies 和 content、管理 conversations 和 leads、处理 usage credits、提供 billing 和 subscription access、提升平台 reliability、防止滥用、提供 support，以及遵守法律义务。",
          "我们也可能使用有限的技术和 usage 信息来监控 performance、修复 errors、提升安全性，并了解 Kolkap 的使用方式。",
        ],
      },
      {
        title: "6. AI 处理",
        text: [
          "Kolkap 使用 AI models 和 AI service providers，根据用户提供的信息生成 replies、content、summaries、drafts 和 business assistance。",
          "Business knowledge、prompts、messages、AI staff settings 和 conversation context 可能会由 AI providers 处理以生成 outputs。",
          "AI outputs 可能不准确或不完整。用户在敏感、法律、金融、医疗、安全或高风险场景使用前，应自行审查 AI outputs。",
          "用户对其上传的信息以及如何使用 AI-generated outputs 负责。",
        ],
      },
      {
        title: "7. Payments 和 Billing",
        text: [
          "Kolkap 可能使用 Stripe 或其他 payment provider 来处理 payment methods、subscriptions、invoices、billing status、free trials 和相关 payment records。",
          "Kolkap 不存储完整银行卡号。Payment method details 由 payment provider 处理。",
          "我们可能存储 payment-related references，例如 customer ID、subscription ID、price ID、billing status、trial dates、invoice status 和 transaction-related records，以便管理您的 subscription 和 account access。",
        ],
      },
      {
        title: "8. 第三方服务",
        text: [
          "Kolkap 可能使用第三方服务来运营平台，包括 Supabase 用于 authentication、database 和 storage；Stripe 用于 payment processing 和 billing；AI providers 用于 AI generation；hosting providers 用于 app 和 website hosting；以及未来用于 WhatsApp、website chat 或 email 的 communication providers。",
          "这些第三方服务可能仅在为 Kolkap 和用户提供服务所需范围内处理信息。",
        ],
      },
      {
        title: "9. 数据共享",
        text: [
          "我们不会出售您的个人信息。",
          "我们可能与帮助我们运营 Kolkap、处理 payments、提供 AI functionality、hosting platform、security 或 customer support 的 service providers 共享信息。",
          "如果法律、法律程序、fraud prevention、security protection 要求，或为保护 Kolkap、用户或他人的权利和安全，我们可能披露信息。",
        ],
      },
      {
        title: "10. 数据安全",
        text: [
          "我们采取合理的技术、管理和组织措施来保护用户数据和 workspace 信息。",
          "任何在线服务都无法保证绝对安全。用户应保护登录信息，并只将可信 team members 添加到 workspace。",
        ],
      },
      {
        title: "11. 数据保留",
        text: [
          "只要为提供 Kolkap、遵守法律义务、解决争议、防止滥用和维护业务记录所需，我们会保留账户、workspace、usage 和 billing 数据。",
          "账户删除后，我们会删除或匿名化相关账户和 workspace 数据，除非我们因法律、税务、billing、安全、fraud prevention 或 dispute-handling 原因需要保留某些记录。",
        ],
      },
      {
        title: "12. 账户删除",
        text: [
          "用户可以在 Settings > Delete Account 删除 Kolkap 账户。",
          "删除账户可能会移除 account access、business workspace data、AI staff setup、business knowledge、conversations、leads、usage records 和相关 workspace data。",
          "部分记录可能因法律、税务、billing、安全、fraud prevention 或 dispute-handling 原因被保留。",
        ],
      },
      {
        title: "13. 用户权利和选择",
        text: [
          "根据您所在地区，您可能有权访问、更正、导出或删除您的个人信息。",
          "您可以联系 Kolkap 获取账户数据、隐私问题或 deletion support 的帮助。",
        ],
      },
      {
        title: "14. 国际数据处理",
        text: [
          "Kolkap 可能使用位于不同国家的 service providers 处理和存储信息。",
          "使用 Kolkap 即表示您理解您的信息可能会在您居住国以外、我们的 service providers 所在地被处理。",
        ],
      },
      {
        title: "15. 儿童隐私",
        text: [
          "Kolkap 面向企业用户，并非为儿童设计。",
          "我们不会故意收集儿童的个人信息。如果您认为儿童向 Kolkap 提供了个人信息，请联系我们。",
        ],
      },
      {
        title: "16. 本政策的更改",
        text: [
          "我们可能不时更新本隐私政策。作出更改时，我们会更新本页面的生效日期。",
          "更改后继续使用 Kolkap，即表示您接受更新后的隐私政策。",
        ],
      },
      {
        title: "17. 联系我们",
        text: [
          "如有隐私问题、账户删除支持或数据请求，请通过 support@kolkap.com 联系 Kolkap。",
        ],
      },
    ],
  },

  ms: {
    badge: "Dasar Privasi",
    title: "Dasar Privasi Kolkap",
    subtitle:
      "Dasar Privasi ini menerangkan bagaimana Kolkap mengumpul, menggunakan, menyimpan, berkongsi, dan melindungi maklumat apabila bisnes menggunakan Kolkap untuk mencipta dan mengurus AI staff.",
    effectiveDate: "Tarikh berkuat kuasa: Jun 2026",
    aiPlatform: "Platform AI staff",
    workspaceData: "Data business workspace",
    deletionSupported: "Pemadaman akaun disokong",
    summaryTitle: "Ringkasan privasi mudah",
    summaryItems: [
      "Kami mengumpul data akaun, bisnes, workspace, usage, dan billing.",
      "Data business workspace anda digunakan untuk menjalankan AI staff milik bisnes anda sendiri.",
      "Kami tidak menjual maklumat peribadi anda.",
      "Penyedia pihak ketiga mungkin memproses data untuk membantu menjalankan Kolkap.",
      "Anda boleh memadam akaun dari Settings.",
    ],
    backToKolkap: "Kembali ke Kolkap",
    questionsTitle: "Soalan privasi?",
    questionsText:
      "Hubungi Kolkap untuk sokongan privasi, data, atau pemadaman akaun.",
    supportEmail: "support@kolkap.com",
    highlights: [
      {
        title: "Data AI staff",
        text: "Kolkap memproses business knowledge, prompt, mesej, dan tetapan AI staff untuk menghasilkan replies dan content bisnes yang berguna.",
      },
      {
        title: "Mesej dan leads",
        text: "Customer conversations dan lead details mungkin diproses apabila bisnes menggunakan Kolkap untuk inbox, chat, WhatsApp, atau channel masa depan.",
      },
      {
        title: "Billing oleh Stripe",
        text: "Kolkap tidak menyimpan nombor kad penuh. Payment method dan billing dikendalikan oleh Stripe.",
      },
      {
        title: "Pemadaman akaun",
        text: "User boleh memadam akaun dari Settings > Delete Account.",
      },
    ],
    sections: [
      {
        title: "1. Pengenalan",
        text: [
          "Kolkap ialah platform AI staff untuk bisnes. Kolkap membantu pengguna bisnes mencipta AI staff untuk menyokong customer replies, inbox support, content generation, business knowledge handling, leads, usage tracking, billing, dan channel messaging masa depan.",
          "Dasar Privasi ini menerangkan maklumat yang kami kumpul, bagaimana kami menggunakannya, bagaimana kami melindunginya, dan bagaimana user boleh meminta atau melakukan pemadaman akaun.",
        ],
      },
      {
        title: "2. Maklumat yang Kami Kumpul",
        text: [
          "Kami mungkin mengumpul maklumat akaun seperti nama, alamat email, detail login, dan pilihan akaun.",
          "Kami mungkin mengumpul maklumat bisnes seperti nama bisnes, jenis bisnes, email bisnes, nombor telefon bisnes, nombor WhatsApp, alamat bisnes, negara, timezone, dan tetapan workspace.",
          "Kami mungkin mengumpul maklumat AI workspace seperti tetapan AI staff, business knowledge, AI instructions, reply language, reply tone, handover rules, dan automation preferences.",
          "Kami mungkin mengumpul data komunikasi pelanggan seperti messages, conversations, leads, nama pelanggan, contact details, inquiry details, handover status, dan inbox activity apabila anda menggunakan Kolkap untuk komunikasi pelanggan.",
          "Kami mungkin mengumpul maklumat usage dan billing seperti AI credits, usage events, plan status, trial status, subscription status, invoices, dan rekod billing berkaitan.",
          "Kami mungkin mengumpul maklumat teknikal seperti browser type, device information, IP address, app activity, logs, cookies, session data, dan security-related events.",
        ],
      },
      {
        title: "3. Data Business Workspace dan AI Staff",
        text: [
          "Setiap Kolkap business workspace bertujuan untuk menjadi private kepada akaun bisnes tersebut dan team members yang diluluskan.",
          "Business knowledge, AI staff instructions, workspace settings, dan maklumat bisnes yang dimuat naik digunakan untuk membantu AI staff menghasilkan replies, content, dan business support yang lebih relevan.",
          "Kolkap tidak sengaja menggunakan data private workspace seorang business customer untuk melayani business customer lain.",
        ],
      },
      {
        title: "4. Mesej Pelanggan dan Leads",
        text: [
          "Jika anda menggunakan Kolkap untuk mengurus customer conversations, leads, inbox replies, website chat, WhatsApp, atau future messaging channels, Kolkap mungkin memproses customer messages dan lead details bagi pihak anda.",
          "Anda bertanggungjawab memastikan anda mempunyai hak untuk memuat naik, menghubungkan, atau memproses maklumat pelanggan dalam Kolkap workspace anda.",
          "Kolkap menggunakan maklumat ini untuk memaparkan conversations, membantu menjana AI replies, menyokong human handover, mengurus leads, dan menjejak usage.",
        ],
      },
      {
        title: "5. Bagaimana Kami Menggunakan Maklumat",
        text: [
          "Kami menggunakan maklumat untuk mencipta dan mengurus user accounts, mencipta business workspaces, menyediakan AI staff functionality, menjana AI replies dan content, mengurus conversations dan leads, memproses usage credits, menyediakan billing dan subscription access, meningkatkan platform reliability, mencegah penyalahgunaan, menyediakan support, dan mematuhi kewajipan undang-undang.",
          "Kami juga mungkin menggunakan maklumat teknikal dan usage yang terhad untuk memantau performance, membaiki errors, meningkatkan security, dan memahami bagaimana Kolkap digunakan.",
        ],
      },
      {
        title: "6. Pemprosesan AI",
        text: [
          "Kolkap menggunakan AI models dan AI service providers untuk menjana replies, content, summaries, drafts, dan business assistance berdasarkan maklumat yang diberikan oleh user.",
          "Business knowledge, prompts, messages, AI staff settings, dan conversation context mungkin diproses oleh AI providers untuk menjana outputs.",
          "AI outputs mungkin tidak tepat atau tidak lengkap. Users perlu menyemak AI outputs sebelum menggunakannya dalam situasi sensitif, legal, financial, medical, safety, atau high-risk.",
          "Users bertanggungjawab ke atas maklumat yang dimuat naik dan bagaimana mereka menggunakan AI-generated outputs.",
        ],
      },
      {
        title: "7. Payments dan Billing",
        text: [
          "Kolkap mungkin menggunakan Stripe atau payment provider lain untuk memproses payment methods, subscriptions, invoices, billing status, free trials, dan rekod payment berkaitan.",
          "Kolkap tidak menyimpan nombor kad penuh. Payment method details dikendalikan oleh payment provider.",
          "Kami mungkin menyimpan payment-related references seperti customer ID, subscription ID, price ID, billing status, trial dates, invoice status, dan transaction-related records supaya kami boleh mengurus subscription dan account access anda.",
        ],
      },
      {
        title: "8. Perkhidmatan Pihak Ketiga",
        text: [
          "Kolkap mungkin menggunakan third-party services untuk menjalankan platform, termasuk Supabase untuk authentication, database, dan storage; Stripe untuk payment processing dan billing; AI providers untuk AI generation; hosting providers untuk app dan website hosting; dan communication providers untuk future messaging channels seperti WhatsApp, website chat, atau email.",
          "Third-party services ini mungkin memproses maklumat hanya setakat yang diperlukan untuk menyediakan perkhidmatan mereka kepada Kolkap dan users kami.",
        ],
      },
      {
        title: "9. Perkongsian Data",
        text: [
          "Kami tidak menjual maklumat peribadi anda.",
          "Kami mungkin berkongsi maklumat dengan service providers yang membantu kami menjalankan Kolkap, memproses payments, menyediakan AI functionality, hosting platform, security, atau customer support.",
          "Kami mungkin mendedahkan maklumat jika diperlukan oleh undang-undang, legal process, fraud prevention, security protection, atau untuk melindungi hak dan keselamatan Kolkap, users kami, atau pihak lain.",
        ],
      },
      {
        title: "10. Keselamatan Data",
        text: [
          "Kami menggunakan langkah teknikal, pentadbiran, dan organisasi yang munasabah untuk melindungi user data dan workspace information.",
          "Tiada online service boleh menjamin keselamatan mutlak. Users perlu menjaga login details mereka dan hanya menambah team members yang dipercayai ke workspace.",
        ],
      },
      {
        title: "11. Penyimpanan Data",
        text: [
          "Kami menyimpan account, workspace, usage, dan billing data selama diperlukan untuk menyediakan Kolkap, mematuhi kewajipan undang-undang, menyelesaikan pertikaian, mencegah penyalahgunaan, dan mengekalkan business records.",
          "Apabila akaun dipadam, kami akan memadam atau menganonimkan account dan workspace data berkaitan kecuali kami perlu menyimpan rekod tertentu untuk legal, tax, billing, security, fraud-prevention, atau dispute-handling reasons.",
        ],
      },
      {
        title: "12. Pemadaman Akaun",
        text: [
          "Users boleh memadam akaun Kolkap dari Settings > Delete Account.",
          "Memadam akaun mungkin membuang account access, business workspace data, AI staff setup, business knowledge, conversations, leads, usage records, dan workspace data berkaitan.",
          "Sesetengah rekod mungkin disimpan jika diperlukan untuk legal, tax, billing, security, fraud-prevention, atau dispute-handling purposes.",
        ],
      },
      {
        title: "13. Hak dan Pilihan User",
        text: [
          "Bergantung pada lokasi anda, anda mungkin mempunyai hak untuk mengakses, membetulkan, mengeksport, atau memadam maklumat peribadi anda.",
          "Anda boleh menghubungi Kolkap untuk meminta bantuan dengan account data, privacy questions, atau deletion support.",
        ],
      },
      {
        title: "14. Pemprosesan Data Antarabangsa",
        text: [
          "Kolkap mungkin memproses dan menyimpan maklumat menggunakan service providers yang berada di negara berbeza.",
          "Dengan menggunakan Kolkap, anda memahami bahawa maklumat anda mungkin diproses di luar negara tempat tinggal anda di mana service providers kami beroperasi.",
        ],
      },
      {
        title: "15. Privasi Kanak-Kanak",
        text: [
          "Kolkap ditujukan untuk business users dan tidak direka untuk kanak-kanak.",
          "Kami tidak sengaja mengumpul maklumat peribadi daripada kanak-kanak. Jika anda percaya seorang kanak-kanak telah memberikan maklumat peribadi kepada Kolkap, sila hubungi kami.",
        ],
      },
      {
        title: "16. Perubahan kepada Dasar Ini",
        text: [
          "Kami mungkin mengemas kini Dasar Privasi ini dari semasa ke semasa. Apabila kami membuat perubahan, kami akan mengemas kini tarikh berkuat kuasa pada halaman ini.",
          "Penggunaan Kolkap selepas perubahan bermaksud anda menerima Dasar Privasi yang dikemas kini.",
        ],
      },
      {
        title: "17. Hubungi Kami",
        text: [
          "Untuk privacy questions, account deletion support, atau data requests, hubungi Kolkap di support@kolkap.com.",
        ],
      },
    ],
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : "en";
}

export default function PrivacyPage() {
  const { language } = useKolkapLanguage();
  const lang = getSupportedLanguage(language);
  const t = translations[lang];

  const highlightIcons = [Bot, MessageCircle, CreditCard, Trash2];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <ShieldCheck className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300 sm:text-2xl sm:leading-10">
            {t.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.effectiveDate}
            </span>
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.aiPlatform}
            </span>
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.workspaceData}
            </span>
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.deletionSupported}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.highlights.map((item, index) => {
            const Icon = highlightIcons[index] || Bot;

            return (
              <div
                key={item.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                  <Icon className="h-7 w-7" />
                </div>

                <h2 className="text-2xl font-black tracking-[-0.04em]">
                  {item.title}
                </h2>

                <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-14">
        <aside className="h-fit rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8 lg:sticky lg:top-8">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
            <FileText className="h-8 w-8" />
          </div>

          <h2 className="text-3xl font-black tracking-[-0.04em]">
            {t.summaryTitle}
          </h2>

          <div className="mt-6 grid gap-4">
            <SummaryItem
              icon={<UserRound className="h-5 w-5" />}
              text={t.summaryItems[0]}
            />
            <SummaryItem
              icon={<Database className="h-5 w-5" />}
              text={t.summaryItems[1]}
            />
            <SummaryItem
              icon={<LockKeyhole className="h-5 w-5" />}
              text={t.summaryItems[2]}
            />
            <SummaryItem
              icon={<Globe2 className="h-5 w-5" />}
              text={t.summaryItems[3]}
            />
            <SummaryItem
              icon={<Trash2 className="h-5 w-5" />}
              text={t.summaryItems[4]}
            />
          </div>

          <Link
            href="/"
            className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#07111F] px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5"
          >
            {t.backToKolkap}
          </Link>
        </aside>

        <div className="grid gap-6">
          {t.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8"
            >
              <h2 className="text-3xl font-black tracking-[-0.04em]">
                {section.title}
              </h2>

              <div className="mt-5 grid gap-4">
                {section.text.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-lg font-semibold leading-8 text-slate-600"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-9">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Mail className="h-8 w-8" />
            </div>

            <h2 className="text-4xl font-black tracking-[-0.05em]">
              {t.questionsTitle}
            </h2>

            <p className="mt-4 text-xl font-semibold leading-9 text-slate-300">
              {t.questionsText}{" "}
              <a
                href={`mailto:${t.supportEmail}`}
                className="font-black text-[#7CFF3D] underline"
              >
                {t.supportEmail}
              </a>
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

function SummaryItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-4">
      <div className="mt-1 text-[#07111F]">{icon}</div>
      <p className="text-base font-black leading-7 text-slate-700">{text}</p>
    </div>
  );
}