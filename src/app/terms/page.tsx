"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  CreditCard,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type TermsSection = {
  title: string;
  text: string[];
};

type HighlightItem = {
  title: string;
  text: string;
};

type TermsTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  effectiveDate: string;
  aiPlatform: string;
  whatsappConnected: string;
  nonRefundable: string;
  summaryTitle: string;
  summaryItems: string[];
  backToKolkap: string;
  questionsTitle: string;
  questionsText: string;
  supportEmail: string;
  highlights: HighlightItem[];
  sections: TermsSection[];
};

const supportedLanguages: SupportedLanguage[] = ["en", "id", "zh", "ms"];

const translations: Record<SupportedLanguage, TermsTranslation> = {
  en: {
    badge: "Terms & Conditions",
    title: "Kolkap Terms & Conditions",
    subtitle:
      "These Terms explain the rules for using Kolkap, including AI staff, WhatsApp messaging, subscriptions, credits, billing, cancellations, and account deletion.",
    effectiveDate: "Effective date: June 2026",
    aiPlatform: "AI staff platform",
    whatsappConnected: "WhatsApp connected",
    nonRefundable: "Non-refundable payments",
    summaryTitle: "Plain-language terms summary",
    summaryItems: [
      "Kolkap provides AI staff tools for business replies, content, inbox, leads, WhatsApp, and supported channels.",
      "AI outputs may be inaccurate. Users must review AI replies before relying on them.",
      "Subscriptions renew monthly after the trial unless cancelled before renewal.",
      "Payments, subscriptions, unused time, setup work, and credits are non-refundable except where required by law.",
      "Users can delete their account from Settings > Delete Account.",
    ],
    backToKolkap: "Back to Kolkap",
    questionsTitle: "Questions about these Terms?",
    questionsText:
      "Contact Kolkap for terms, billing, subscription, or account support.",
    supportEmail: "support@kolkap.com",
    highlights: [
      {
        title: "AI staff",
        text: "Kolkap helps businesses create AI staff for replies, content, inbox support, leads, and automation.",
      },
      {
        title: "WhatsApp messaging",
        text: "Kolkap supports business messaging through WhatsApp and other connected channels.",
      },
      {
        title: "Subscriptions",
        text: "Monthly subscriptions begin after the trial unless cancelled before the trial ends.",
      },
      {
        title: "No refunds",
        text: "Payments are non-refundable except where required by law.",
      },
    ],
    sections: [
      {
        title: "1. Introduction",
        text: [
          "These Terms & Conditions apply when you access or use Kolkap, including our website, dashboard, AI staff tools, WhatsApp messaging features, inbox, leads, content tools, billing, credits, subscriptions, and related services.",
          "By creating an account, starting a trial, connecting a business workspace, using AI staff, connecting WhatsApp, or paying for Kolkap, you agree to these Terms.",
        ],
      },
      {
        title: "2. About Kolkap",
        text: [
          "Kolkap is an AI staff platform for businesses. It helps businesses create AI assistants for customer replies, content generation, inbox support, lead handling, business knowledge support, usage tracking, credits, billing, and supported messaging channels.",
          "Kolkap is designed to support business operations, but it does not replace professional judgment, legal advice, financial advice, medical advice, tax advice, or human responsibility.",
        ],
      },
      {
        title: "3. Accounts and Workspace Responsibility",
        text: [
          "You are responsible for your account, login details, business workspace, team access, business information, AI staff settings, and activity under your account.",
          "You must provide accurate business information and keep your account secure. You should only invite trusted team members to your workspace.",
          "You are responsible for making sure you have the right to upload, connect, or process any business information, customer information, messages, leads, or knowledge base content inside Kolkap.",
        ],
      },
      {
        title: "4. AI Staff and AI Outputs",
        text: [
          "Kolkap uses AI models to generate replies, content, drafts, summaries, suggestions, and business assistance based on the information provided in your workspace.",
          "AI outputs may be inaccurate, incomplete, outdated, or unsuitable for a particular situation. You are responsible for reviewing AI outputs before using, sending, publishing, or relying on them.",
          "You must not rely on Kolkap AI outputs as professional legal, financial, medical, tax, safety, or high-risk advice.",
          "You are responsible for how your business uses AI-generated replies and content, including replies sent through WhatsApp or other customer channels.",
        ],
      },
      {
        title: "5. WhatsApp and Messaging Channels",
        text: [
          "Kolkap supports AI replies and business messaging through connected channels, including WhatsApp, inbox, website chat, and other supported communication channels.",
          "When using WhatsApp through Kolkap, you are responsible for your WhatsApp Business account, phone number, business details, templates, customer communication, message content, consent, and compliance with WhatsApp, Meta, and applicable messaging rules.",
          "Kolkap is not responsible if WhatsApp, Meta, or another provider restricts, rejects, delays, suspends, disables, reviews, or changes access to your messaging account, phone number, templates, quality rating, or channel.",
          "AI replies sent through WhatsApp or other channels may use credits. You are responsible for reviewing your AI staff setup, auto-reply settings, handover rules, and message content before going live.",
        ],
      },
      {
        title: "6. Plans, Subscriptions, and Billing",
        text: [
          "Kolkap offers paid subscription plans such as Starter AI, Growth AI, Professional AI, Business AI, and custom Enterprise arrangements.",
          "Plans may include different AI staff limits, team member limits, monthly credits, usage limits, features, support levels, and channel access.",
          "Subscription fees are billed monthly unless otherwise stated. Pricing, features, limits, and credit rules may change from time to time.",
          "Payments are processed by Stripe or another payment provider. Kolkap does not store full card numbers.",
        ],
      },
      {
        title: "7. Free Trial",
        text: [
          "Kolkap may offer a 7-day free trial. A payment method may be required to activate the trial.",
          "You will not be charged today when activating the free trial. Monthly billing starts after the 7-day trial unless you cancel before the trial ends.",
          "If you do not cancel before the trial ends, your selected plan may automatically convert to a paid monthly subscription.",
          "Trial availability, duration, and eligibility may be changed or removed by Kolkap at any time.",
        ],
      },
      {
        title: "8. Non-Refundable Payments",
        text: [
          "All payments to Kolkap are non-refundable except where required by applicable law.",
          "This includes subscription fees, unused subscription time, setup work, unused credits, top-up credits, add-ons, and any paid services already purchased or activated.",
          "Cancelling a subscription stops future renewal but does not create a refund for the current billing period unless required by law.",
          "Nothing in these Terms limits any rights you may have under applicable consumer law.",
        ],
      },
      {
        title: "9. Cancellation",
        text: [
          "You may cancel your subscription before the next billing cycle. Cancellation stops future renewal.",
          "After cancellation, you may continue to have access until the end of the current paid billing period unless otherwise stated.",
          "Kolkap does not provide prorated refunds for partial months or unused access unless required by law.",
          "If a payment fails, your access may be limited, paused, or cancelled.",
        ],
      },
      {
        title: "10. Credits and Top-Ups",
        text: [
          "Kolkap uses AI credits to measure AI usage. AI replies, test replies, content generation, WhatsApp AI replies, website chat AI replies, and other AI actions may consume credits.",
          "A normal AI reply or generation usually uses 1 credit. Longer content, campaign packs, or heavier AI actions may use more credits.",
          "Monthly plan credits may refresh according to your plan and billing cycle. Top-up credits may be purchased for additional usage.",
          "Top-up purchases and unused credits are non-refundable except where required by law.",
        ],
      },
      {
        title: "11. Third-Party Services",
        text: [
          "Kolkap may rely on third-party services including Supabase, Stripe, AI providers, hosting providers, WhatsApp, Meta, and other communication or infrastructure providers.",
          "Third-party services may have their own terms, policies, fees, approvals, restrictions, limits, outages, and compliance requirements.",
          "Kolkap is not responsible for third-party provider outages, restrictions, account reviews, pricing changes, policy changes, or service interruptions.",
        ],
      },
      {
        title: "12. Acceptable Use",
        text: [
          "You must not use Kolkap for illegal activity, spam, scams, fraud, harassment, abusive content, impersonation, hate, malware, deceptive activity, unauthorized messaging, or violation of third-party platform rules.",
          "You must not use Kolkap to send messages to people who have not consented where consent is required.",
          "You must not misuse AI staff to mislead customers, hide the nature of automated replies where disclosure is required, or violate customer rights.",
        ],
      },
      {
        title: "13. Service Availability",
        text: [
          "Kolkap aims to provide reliable service, but we do not guarantee uninterrupted, error-free, or always-available access.",
          "Availability may be affected by maintenance, updates, internet issues, payment providers, AI providers, Supabase, hosting providers, WhatsApp, Meta, or other third parties.",
          "Kolkap may update, change, suspend, or discontinue features where needed for security, reliability, legal, business, or technical reasons.",
        ],
      },
      {
        title: "14. Account Suspension or Termination",
        text: [
          "Kolkap may suspend, restrict, or terminate access if you fail to pay, misuse the platform, violate these Terms, create risk for Kolkap or other users, abuse AI/channel systems, or use the service unlawfully.",
          "Kolkap may also suspend access if required by law, security concerns, fraud prevention, provider restrictions, or platform integrity reasons.",
        ],
      },
      {
        title: "15. Account Deletion",
        text: [
          "Users can delete their Kolkap account from Settings > Delete Account.",
          "Deleting an account may remove account access, business workspace data, AI staff setup, business knowledge, conversations, leads, usage records, and related workspace data.",
          "Some records may be retained where required for legal, tax, billing, security, fraud-prevention, dispute-handling, or compliance reasons.",
        ],
      },
      {
        title: "16. Intellectual Property",
        text: [
          "Kolkap owns or licenses the platform, software, systems, user interface, branding, design, workflows, and related intellectual property.",
          "You remain responsible for the business content, knowledge base materials, messages, and customer information you upload or connect to Kolkap.",
          "Subject to these Terms, you may use AI outputs generated in your workspace for your business purposes, but you are responsible for reviewing and using those outputs lawfully.",
        ],
      },
      {
        title: "17. Limitation of Liability",
        text: [
          "To the maximum extent allowed by law, Kolkap is not responsible for lost profits, lost sales, missed leads, business interruption, customer disputes, wrong AI replies, message delays, third-party restrictions, platform downtime, or indirect losses.",
          "Kolkap does not guarantee that AI staff will produce perfect replies, increase revenue, close sales, avoid all errors, or replace human review.",
        ],
      },
      {
        title: "18. Changes to Terms",
        text: [
          "Kolkap may update these Terms, pricing, plans, features, credit rules, billing rules, or channel rules from time to time.",
          "When required, we will provide notice of material changes. Continued use of Kolkap after changes means you accept the updated Terms.",
        ],
      },
      {
        title: "19. Contact",
        text: [
          "For questions about these Terms, billing, subscriptions, cancellation, or account support, contact Kolkap at support@kolkap.com.",
        ],
      },
    ],
  },

  id: {
    badge: "Syarat & Ketentuan",
    title: "Syarat & Ketentuan Kolkap",
    subtitle:
      "Syarat ini menjelaskan aturan penggunaan Kolkap, termasuk AI staff, WhatsApp messaging, subscription, credits, billing, cancellation, dan penghapusan akun.",
    effectiveDate: "Tanggal berlaku: Juni 2026",
    aiPlatform: "Platform AI staff",
    whatsappConnected: "WhatsApp terhubung",
    nonRefundable: "Pembayaran non-refundable",
    summaryTitle: "Ringkasan syarat sederhana",
    summaryItems: [
      "Kolkap menyediakan AI staff untuk business replies, content, inbox, leads, WhatsApp, dan channel yang didukung.",
      "AI output bisa tidak akurat. User harus review AI replies sebelum mengandalkannya.",
      "Subscription berjalan bulanan setelah trial kecuali dibatalkan sebelum renewal.",
      "Pembayaran, subscription, waktu yang tidak terpakai, setup work, dan credits bersifat non-refundable kecuali diwajibkan hukum.",
      "User dapat menghapus akun dari Settings > Delete Account.",
    ],
    backToKolkap: "Kembali ke Kolkap",
    questionsTitle: "Pertanyaan tentang Terms ini?",
    questionsText:
      "Hubungi Kolkap untuk bantuan terms, billing, subscription, atau akun.",
    supportEmail: "support@kolkap.com",
    highlights: [
      {
        title: "AI staff",
        text: "Kolkap membantu bisnis membuat AI staff untuk replies, content, inbox support, leads, dan automation.",
      },
      {
        title: "WhatsApp messaging",
        text: "Kolkap mendukung business messaging melalui WhatsApp dan channel terhubung lainnya.",
      },
      {
        title: "Subscription",
        text: "Monthly subscription berjalan setelah trial kecuali dibatalkan sebelum trial selesai.",
      },
      {
        title: "Tidak ada refund",
        text: "Pembayaran bersifat non-refundable kecuali diwajibkan oleh hukum.",
      },
    ],
    sections: [
      {
        title: "1. Pendahuluan",
        text: [
          "Syarat & Ketentuan ini berlaku saat Anda mengakses atau menggunakan Kolkap, termasuk website, dashboard, AI staff tools, WhatsApp messaging features, inbox, leads, content tools, billing, credits, subscription, dan layanan terkait.",
          "Dengan membuat akun, memulai trial, menghubungkan business workspace, menggunakan AI staff, menghubungkan WhatsApp, atau membayar Kolkap, Anda menyetujui Syarat ini.",
        ],
      },
      {
        title: "2. Tentang Kolkap",
        text: [
          "Kolkap adalah platform AI staff untuk bisnis. Kolkap membantu bisnis membuat AI assistant untuk customer replies, content generation, inbox support, lead handling, business knowledge support, usage tracking, credits, billing, dan messaging channels yang didukung.",
          "Kolkap dibuat untuk mendukung operasional bisnis, tetapi tidak menggantikan professional judgment, legal advice, financial advice, medical advice, tax advice, atau tanggung jawab manusia.",
        ],
      },
      {
        title: "3. Tanggung Jawab Akun dan Workspace",
        text: [
          "Anda bertanggung jawab atas akun, login details, business workspace, team access, business information, AI staff settings, dan aktivitas di bawah akun Anda.",
          "Anda harus memberikan informasi bisnis yang akurat dan menjaga keamanan akun. Anda hanya boleh mengundang team member yang terpercaya.",
          "Anda bertanggung jawab memastikan bahwa Anda memiliki hak untuk mengunggah, menghubungkan, atau memproses business information, customer information, messages, leads, atau knowledge base content di Kolkap.",
        ],
      },
      {
        title: "4. AI Staff dan AI Outputs",
        text: [
          "Kolkap menggunakan AI models untuk menghasilkan replies, content, drafts, summaries, suggestions, dan business assistance berdasarkan informasi yang diberikan di workspace Anda.",
          "AI outputs dapat tidak akurat, tidak lengkap, outdated, atau tidak sesuai untuk situasi tertentu. Anda bertanggung jawab untuk review AI outputs sebelum menggunakan, mengirim, mempublikasikan, atau mengandalkannya.",
          "Anda tidak boleh mengandalkan Kolkap AI outputs sebagai nasihat profesional legal, financial, medical, tax, safety, atau high-risk.",
          "Anda bertanggung jawab atas bagaimana bisnis Anda menggunakan AI-generated replies dan content, termasuk replies yang dikirim melalui WhatsApp atau customer channels lainnya.",
        ],
      },
      {
        title: "5. WhatsApp dan Messaging Channels",
        text: [
          "Kolkap mendukung AI replies dan business messaging melalui connected channels, termasuk WhatsApp, inbox, website chat, dan communication channels lain yang didukung.",
          "Saat menggunakan WhatsApp melalui Kolkap, Anda bertanggung jawab atas WhatsApp Business account, phone number, business details, templates, customer communication, message content, consent, dan kepatuhan terhadap aturan WhatsApp, Meta, dan messaging laws yang berlaku.",
          "Kolkap tidak bertanggung jawab jika WhatsApp, Meta, atau provider lain membatasi, menolak, menunda, suspend, disable, review, atau mengubah akses ke messaging account, phone number, templates, quality rating, atau channel Anda.",
          "AI replies yang dikirim melalui WhatsApp atau channel lain dapat menggunakan credits. Anda bertanggung jawab untuk review AI staff setup, auto-reply settings, handover rules, dan message content sebelum go live.",
        ],
      },
      {
        title: "6. Plans, Subscriptions, dan Billing",
        text: [
          "Kolkap menawarkan paid subscription plans seperti Starter AI, Growth AI, Professional AI, Business AI, dan custom Enterprise arrangements.",
          "Plans dapat memiliki AI staff limits, team member limits, monthly credits, usage limits, features, support levels, dan channel access yang berbeda.",
          "Subscription fees ditagih bulanan kecuali dinyatakan lain. Pricing, features, limits, dan credit rules dapat berubah dari waktu ke waktu.",
          "Payments diproses oleh Stripe atau payment provider lain. Kolkap tidak menyimpan nomor kartu penuh.",
        ],
      },
      {
        title: "7. Free Trial",
        text: [
          "Kolkap dapat menawarkan 7-day free trial. Payment method dapat diperlukan untuk mengaktifkan trial.",
          "Anda tidak akan dikenakan biaya hari ini saat mengaktifkan free trial. Monthly billing berjalan setelah 7-day trial kecuali Anda cancel sebelum trial selesai.",
          "Jika Anda tidak cancel sebelum trial selesai, selected plan dapat otomatis berubah menjadi paid monthly subscription.",
          "Ketersediaan, durasi, dan eligibility trial dapat diubah atau dihentikan oleh Kolkap kapan saja.",
        ],
      },
      {
        title: "8. Pembayaran Non-Refundable",
        text: [
          "Semua pembayaran kepada Kolkap bersifat non-refundable kecuali diwajibkan oleh hukum yang berlaku.",
          "Ini termasuk subscription fees, unused subscription time, setup work, unused credits, top-up credits, add-ons, dan layanan berbayar yang sudah dibeli atau diaktifkan.",
          "Membatalkan subscription menghentikan future renewal tetapi tidak memberikan refund untuk current billing period kecuali diwajibkan hukum.",
          "Tidak ada bagian dari Syarat ini yang membatasi hak Anda berdasarkan consumer law yang berlaku.",
        ],
      },
      {
        title: "9. Cancellation",
        text: [
          "Anda dapat cancel subscription sebelum billing cycle berikutnya. Cancellation menghentikan future renewal.",
          "Setelah cancellation, Anda mungkin tetap memiliki akses sampai akhir current paid billing period kecuali dinyatakan lain.",
          "Kolkap tidak memberikan prorated refund untuk partial months atau unused access kecuali diwajibkan hukum.",
          "Jika payment gagal, access Anda dapat dibatasi, dipause, atau dibatalkan.",
        ],
      },
      {
        title: "10. Credits dan Top-Ups",
        text: [
          "Kolkap menggunakan AI credits untuk mengukur AI usage. AI replies, test replies, content generation, WhatsApp AI replies, website chat AI replies, dan AI actions lainnya dapat menggunakan credits.",
          "Normal AI reply atau generation biasanya menggunakan 1 credit. Long content, campaign packs, atau AI actions yang lebih berat dapat menggunakan lebih banyak credits.",
          "Monthly plan credits dapat refresh sesuai plan dan billing cycle. Top-up credits dapat dibeli untuk additional usage.",
          "Top-up purchases dan unused credits bersifat non-refundable kecuali diwajibkan hukum.",
        ],
      },
      {
        title: "11. Third-Party Services",
        text: [
          "Kolkap dapat bergantung pada third-party services termasuk Supabase, Stripe, AI providers, hosting providers, WhatsApp, Meta, dan communication atau infrastructure providers lainnya.",
          "Third-party services dapat memiliki terms, policies, fees, approvals, restrictions, limits, outages, dan compliance requirements masing-masing.",
          "Kolkap tidak bertanggung jawab atas third-party provider outages, restrictions, account reviews, pricing changes, policy changes, atau service interruptions.",
        ],
      },
      {
        title: "12. Acceptable Use",
        text: [
          "Anda tidak boleh menggunakan Kolkap untuk illegal activity, spam, scams, fraud, harassment, abusive content, impersonation, hate, malware, deceptive activity, unauthorized messaging, atau pelanggaran aturan platform pihak ketiga.",
          "Anda tidak boleh menggunakan Kolkap untuk mengirim pesan kepada orang yang belum memberi consent jika consent diperlukan.",
          "Anda tidak boleh menyalahgunakan AI staff untuk menyesatkan customer, menyembunyikan automated replies jika disclosure diperlukan, atau melanggar hak customer.",
        ],
      },
      {
        title: "13. Service Availability",
        text: [
          "Kolkap berusaha menyediakan layanan yang reliable, tetapi kami tidak menjamin akses tanpa gangguan, bebas error, atau selalu tersedia.",
          "Availability dapat dipengaruhi maintenance, updates, internet issues, payment providers, AI providers, Supabase, hosting providers, WhatsApp, Meta, atau third parties lainnya.",
          "Kolkap dapat update, mengubah, suspend, atau menghentikan fitur jika diperlukan untuk alasan security, reliability, legal, business, atau technical.",
        ],
      },
      {
        title: "14. Account Suspension atau Termination",
        text: [
          "Kolkap dapat suspend, restrict, atau terminate access jika Anda gagal bayar, menyalahgunakan platform, melanggar Syarat ini, menimbulkan risiko untuk Kolkap atau user lain, menyalahgunakan AI/channel systems, atau menggunakan layanan secara ilegal.",
          "Kolkap juga dapat suspend access jika diwajibkan hukum, security concerns, fraud prevention, provider restrictions, atau alasan platform integrity.",
        ],
      },
      {
        title: "15. Account Deletion",
        text: [
          "User dapat menghapus akun Kolkap dari Settings > Delete Account.",
          "Menghapus akun dapat menghapus account access, business workspace data, AI staff setup, business knowledge, conversations, leads, usage records, dan workspace data terkait.",
          "Beberapa records dapat disimpan jika diwajibkan untuk legal, tax, billing, security, fraud-prevention, dispute-handling, atau compliance reasons.",
        ],
      },
      {
        title: "16. Intellectual Property",
        text: [
          "Kolkap memiliki atau melisensikan platform, software, systems, user interface, branding, design, workflows, dan intellectual property terkait.",
          "Anda tetap bertanggung jawab atas business content, knowledge base materials, messages, dan customer information yang Anda upload atau connect ke Kolkap.",
          "Sesuai Syarat ini, Anda dapat menggunakan AI outputs yang dihasilkan di workspace Anda untuk tujuan bisnis Anda, tetapi Anda bertanggung jawab untuk review dan menggunakan output tersebut secara lawful.",
        ],
      },
      {
        title: "17. Limitation of Liability",
        text: [
          "Sejauh diizinkan hukum, Kolkap tidak bertanggung jawab atas lost profits, lost sales, missed leads, business interruption, customer disputes, wrong AI replies, message delays, third-party restrictions, platform downtime, atau indirect losses.",
          "Kolkap tidak menjamin bahwa AI staff akan menghasilkan replies sempurna, meningkatkan revenue, menutup sales, menghindari semua errors, atau menggantikan human review.",
        ],
      },
      {
        title: "18. Changes to Terms",
        text: [
          "Kolkap dapat update Syarat ini, pricing, plans, features, credit rules, billing rules, atau channel rules dari waktu ke waktu.",
          "Jika diwajibkan, kami akan memberi notice untuk material changes. Penggunaan Kolkap setelah perubahan berarti Anda menerima Terms yang diperbarui.",
        ],
      },
      {
        title: "19. Contact",
        text: [
          "Untuk pertanyaan tentang Terms ini, billing, subscriptions, cancellation, atau account support, hubungi Kolkap di support@kolkap.com.",
        ],
      },
    ],
  },

  zh: {
    badge: "条款与条件",
    title: "Kolkap 条款与条件",
    subtitle:
      "本条款说明使用 Kolkap 的规则，包括 AI 员工、WhatsApp messaging、subscription、credits、billing、cancellation 和账户删除。",
    effectiveDate: "生效日期：2026 年 6 月",
    aiPlatform: "AI 员工平台",
    whatsappConnected: "WhatsApp 已连接",
    nonRefundable: "付款不可退款",
    summaryTitle: "简明条款摘要",
    summaryItems: [
      "Kolkap 为 business replies、content、inbox、leads、WhatsApp 和支持的 channels 提供 AI 员工工具。",
      "AI output 可能不准确。用户在依赖 AI replies 前必须自行审查。",
      "试用结束后 subscription 会按月续订，除非在 renewal 前取消。",
      "付款、subscription、未使用时间、setup work 和 credits 不可退款，除非法律要求。",
      "用户可以在 Settings > Delete Account 删除账户。",
    ],
    backToKolkap: "返回 Kolkap",
    questionsTitle: "对本条款有疑问？",
    questionsText: "请联系 Kolkap 获取条款、billing、subscription 或账户支持。",
    supportEmail: "support@kolkap.com",
    highlights: [
      {
        title: "AI 员工",
        text: "Kolkap 帮助企业创建 AI 员工，用于 replies、content、inbox support、leads 和 automation。",
      },
      {
        title: "WhatsApp messaging",
        text: "Kolkap 支持通过 WhatsApp 和其他 connected channels 进行 business messaging。",
      },
      {
        title: "Subscriptions",
        text: "试用结束后 monthly subscription 会开始，除非在试用结束前取消。",
      },
      {
        title: "不退款",
        text: "付款不可退款，除非适用法律要求。",
      },
    ],
    sections: [
      {
        title: "1. 简介",
        text: [
          "本条款与条件适用于您访问或使用 Kolkap，包括 website、dashboard、AI staff tools、WhatsApp messaging features、inbox、leads、content tools、billing、credits、subscriptions 和相关服务。",
          "当您创建账户、开始 trial、连接 business workspace、使用 AI staff、连接 WhatsApp 或向 Kolkap 付款时，即表示您同意本条款。",
        ],
      },
      {
        title: "2. 关于 Kolkap",
        text: [
          "Kolkap 是面向企业的 AI 员工平台。Kolkap 帮助企业创建 AI assistants，用于 customer replies、content generation、inbox support、lead handling、business knowledge support、usage tracking、credits、billing 和支持的 messaging channels。",
          "Kolkap 旨在支持 business operations，但不能替代 professional judgment、legal advice、financial advice、medical advice、tax advice 或 human responsibility。",
        ],
      },
      {
        title: "3. 账户和 Workspace 责任",
        text: [
          "您对账户、login details、business workspace、team access、business information、AI staff settings 和账户下的活动负责。",
          "您必须提供准确的企业信息并保护账户安全。您只应邀请可信 team members 加入 workspace。",
          "您负责确保您有权在 Kolkap 中上传、连接或处理任何 business information、customer information、messages、leads 或 knowledge base content。",
        ],
      },
      {
        title: "4. AI Staff 和 AI Outputs",
        text: [
          "Kolkap 使用 AI models，根据您 workspace 中提供的信息生成 replies、content、drafts、summaries、suggestions 和 business assistance。",
          "AI outputs 可能不准确、不完整、过时或不适合特定情况。您在使用、发送、发布或依赖前负责审查 AI outputs。",
          "您不得将 Kolkap AI outputs 作为 legal、financial、medical、tax、safety 或 high-risk professional advice。",
          "您对企业如何使用 AI-generated replies 和 content 负责，包括通过 WhatsApp 或其他 customer channels 发送的 replies。",
        ],
      },
      {
        title: "5. WhatsApp 和 Messaging Channels",
        text: [
          "Kolkap 通过 connected channels 支持 AI replies 和 business messaging，包括 WhatsApp、inbox、website chat 和其他支持的 communication channels。",
          "使用 Kolkap 的 WhatsApp 功能时，您负责 WhatsApp Business account、phone number、business details、templates、customer communication、message content、consent，以及遵守 WhatsApp、Meta 和适用 messaging rules。",
          "如果 WhatsApp、Meta 或其他 provider 限制、拒绝、延迟、暂停、禁用、审核或更改您的 messaging account、phone number、templates、quality rating 或 channel access，Kolkap 不承担责任。",
          "通过 WhatsApp 或其他 channels 发送 AI replies 可能会使用 credits。上线前，您负责审查 AI staff setup、auto-reply settings、handover rules 和 message content。",
        ],
      },
      {
        title: "6. Plans、Subscriptions 和 Billing",
        text: [
          "Kolkap 提供 paid subscription plans，例如 Starter AI、Growth AI、Professional AI、Business AI 和 custom Enterprise arrangements。",
          "Plans 可能包含不同的 AI staff limits、team member limits、monthly credits、usage limits、features、support levels 和 channel access。",
          "除非另有说明，subscription fees 按月计费。Pricing、features、limits 和 credit rules 可能不时变更。",
          "Payments 由 Stripe 或其他 payment provider 处理。Kolkap 不存储完整银行卡号。",
        ],
      },
      {
        title: "7. Free Trial",
        text: [
          "Kolkap 可能提供 7-day free trial。激活 trial 可能需要 payment method。",
          "激活 free trial 当天不会收费。除非您在 trial 结束前取消，否则 monthly billing 会在 7-day trial 后开始。",
          "如果您未在 trial 结束前取消，selected plan 可能会自动转换为 paid monthly subscription。",
          "Kolkap 可随时更改或取消 trial availability、duration 和 eligibility。",
        ],
      },
      {
        title: "8. Non-Refundable Payments",
        text: [
          "所有向 Kolkap 支付的款项均不可退款，除非适用法律要求。",
          "这包括 subscription fees、unused subscription time、setup work、unused credits、top-up credits、add-ons 以及已购买或激活的 paid services。",
          "取消 subscription 会停止 future renewal，但不会对 current billing period 产生退款，除非法律要求。",
          "本条款不限制您在适用 consumer law 下拥有的任何权利。",
        ],
      },
      {
        title: "9. Cancellation",
        text: [
          "您可以在下一 billing cycle 前取消 subscription。Cancellation 会停止 future renewal。",
          "取消后，除非另有说明，您可能仍可访问到 current paid billing period 结束。",
          "Kolkap 不为 partial months 或 unused access 提供 prorated refunds，除非法律要求。",
          "如果 payment failed，您的 access 可能被限制、暂停或取消。",
        ],
      },
      {
        title: "10. Credits 和 Top-Ups",
        text: [
          "Kolkap 使用 AI credits 衡量 AI usage。AI replies、test replies、content generation、WhatsApp AI replies、website chat AI replies 和其他 AI actions 可能消耗 credits。",
          "普通 AI reply 或 generation 通常使用 1 credit。Long content、campaign packs 或更重的 AI actions 可能使用更多 credits。",
          "Monthly plan credits 可能根据 plan 和 billing cycle refresh。Top-up credits 可用于额外 usage。",
          "Top-up purchases 和 unused credits 不可退款，除非法律要求。",
        ],
      },
      {
        title: "11. Third-Party Services",
        text: [
          "Kolkap 可能依赖 third-party services，包括 Supabase、Stripe、AI providers、hosting providers、WhatsApp、Meta 以及其他 communication 或 infrastructure providers。",
          "Third-party services 可能有自己的 terms、policies、fees、approvals、restrictions、limits、outages 和 compliance requirements。",
          "Kolkap 不对 third-party provider outages、restrictions、account reviews、pricing changes、policy changes 或 service interruptions 负责。",
        ],
      },
      {
        title: "12. Acceptable Use",
        text: [
          "您不得将 Kolkap 用于 illegal activity、spam、scams、fraud、harassment、abusive content、impersonation、hate、malware、deceptive activity、unauthorized messaging 或违反 third-party platform rules 的行为。",
          "在需要 consent 的情况下，您不得使用 Kolkap 向未同意的人发送 messages。",
          "您不得滥用 AI staff 误导 customers、在需要披露时隐藏 automated replies 的性质，或侵犯 customer rights。",
        ],
      },
      {
        title: "13. Service Availability",
        text: [
          "Kolkap 尽力提供 reliable service，但不保证 uninterrupted、error-free 或 always-available access。",
          "Availability 可能受 maintenance、updates、internet issues、payment providers、AI providers、Supabase、hosting providers、WhatsApp、Meta 或其他 third parties 影响。",
          "Kolkap 可因 security、reliability、legal、business 或 technical reasons 更新、更改、暂停或停止 features。",
        ],
      },
      {
        title: "14. Account Suspension or Termination",
        text: [
          "如果您未付款、滥用平台、违反本条款、给 Kolkap 或其他用户造成风险、滥用 AI/channel systems，或非法使用服务，Kolkap 可 suspend、restrict 或 terminate access。",
          "如法律要求、security concerns、fraud prevention、provider restrictions 或 platform integrity reasons，Kolkap 也可 suspend access。",
        ],
      },
      {
        title: "15. Account Deletion",
        text: [
          "用户可以在 Settings > Delete Account 删除 Kolkap 账户。",
          "删除账户可能移除 account access、business workspace data、AI staff setup、business knowledge、conversations、leads、usage records 和相关 workspace data。",
          "部分 records 可能因 legal、tax、billing、security、fraud-prevention、dispute-handling 或 compliance reasons 被保留。",
        ],
      },
      {
        title: "16. Intellectual Property",
        text: [
          "Kolkap 拥有或授权使用 platform、software、systems、user interface、branding、design、workflows 和相关 intellectual property。",
          "您仍然对上传或连接到 Kolkap 的 business content、knowledge base materials、messages 和 customer information 负责。",
          "在本条款约束下，您可以将 workspace 中生成的 AI outputs 用于您的 business purposes，但您负责审查并合法使用这些 outputs。",
        ],
      },
      {
        title: "17. Limitation of Liability",
        text: [
          "在法律允许的最大范围内，Kolkap 不对 lost profits、lost sales、missed leads、business interruption、customer disputes、wrong AI replies、message delays、third-party restrictions、platform downtime 或 indirect losses 负责。",
          "Kolkap 不保证 AI staff 会生成 perfect replies、increase revenue、close sales、avoid all errors 或 replace human review。",
        ],
      },
      {
        title: "18. Changes to Terms",
        text: [
          "Kolkap 可不时更新本条款、pricing、plans、features、credit rules、billing rules 或 channel rules。",
          "必要时，我们会提供 material changes notice。更改后继续使用 Kolkap 表示您接受更新后的 Terms。",
        ],
      },
      {
        title: "19. Contact",
        text: [
          "如对本 Terms、billing、subscriptions、cancellation 或 account support 有疑问，请通过 support@kolkap.com 联系 Kolkap。",
        ],
      },
    ],
  },

  ms: {
    badge: "Terma & Syarat",
    title: "Terma & Syarat Kolkap",
    subtitle:
      "Terma ini menerangkan peraturan penggunaan Kolkap, termasuk AI staff, WhatsApp messaging, subscription, credits, billing, cancellation, dan pemadaman akaun.",
    effectiveDate: "Tarikh berkuat kuasa: Jun 2026",
    aiPlatform: "Platform AI staff",
    whatsappConnected: "WhatsApp bersambung",
    nonRefundable: "Bayaran non-refundable",
    summaryTitle: "Ringkasan terma mudah",
    summaryItems: [
      "Kolkap menyediakan AI staff tools untuk business replies, content, inbox, leads, WhatsApp, dan supported channels.",
      "AI outputs mungkin tidak tepat. Users mesti review AI replies sebelum bergantung padanya.",
      "Subscriptions renew bulanan selepas trial kecuali dibatalkan sebelum renewal.",
      "Payments, subscriptions, unused time, setup work, dan credits adalah non-refundable kecuali diwajibkan undang-undang.",
      "Users boleh memadam akaun dari Settings > Delete Account.",
    ],
    backToKolkap: "Kembali ke Kolkap",
    questionsTitle: "Soalan tentang Terma ini?",
    questionsText:
      "Hubungi Kolkap untuk sokongan terms, billing, subscription, atau akaun.",
    supportEmail: "support@kolkap.com",
    highlights: [
      {
        title: "AI staff",
        text: "Kolkap membantu bisnes mencipta AI staff untuk replies, content, inbox support, leads, dan automation.",
      },
      {
        title: "WhatsApp messaging",
        text: "Kolkap menyokong business messaging melalui WhatsApp dan connected channels lain.",
      },
      {
        title: "Subscriptions",
        text: "Monthly subscriptions bermula selepas trial kecuali dibatalkan sebelum trial tamat.",
      },
      {
        title: "Tiada refund",
        text: "Payments adalah non-refundable kecuali diwajibkan oleh undang-undang.",
      },
    ],
    sections: [
      {
        title: "1. Pengenalan",
        text: [
          "Terma & Syarat ini terpakai apabila anda mengakses atau menggunakan Kolkap, termasuk website, dashboard, AI staff tools, WhatsApp messaging features, inbox, leads, content tools, billing, credits, subscriptions, dan related services.",
          "Dengan mencipta akaun, memulakan trial, menghubungkan business workspace, menggunakan AI staff, menghubungkan WhatsApp, atau membayar Kolkap, anda bersetuju dengan Terma ini.",
        ],
      },
      {
        title: "2. Tentang Kolkap",
        text: [
          "Kolkap ialah platform AI staff untuk bisnes. Kolkap membantu bisnes mencipta AI assistants untuk customer replies, content generation, inbox support, lead handling, business knowledge support, usage tracking, credits, billing, dan supported messaging channels.",
          "Kolkap direka untuk menyokong business operations, tetapi ia tidak menggantikan professional judgment, legal advice, financial advice, medical advice, tax advice, atau human responsibility.",
        ],
      },
      {
        title: "3. Tanggungjawab Akaun dan Workspace",
        text: [
          "Anda bertanggungjawab ke atas akaun, login details, business workspace, team access, business information, AI staff settings, dan activity di bawah akaun anda.",
          "Anda mesti memberikan maklumat bisnes yang tepat dan menjaga keselamatan akaun. Anda hanya patut menjemput team members yang dipercayai.",
          "Anda bertanggungjawab memastikan anda mempunyai hak untuk memuat naik, menghubungkan, atau memproses business information, customer information, messages, leads, atau knowledge base content dalam Kolkap.",
        ],
      },
      {
        title: "4. AI Staff dan AI Outputs",
        text: [
          "Kolkap menggunakan AI models untuk menjana replies, content, drafts, summaries, suggestions, dan business assistance berdasarkan maklumat dalam workspace anda.",
          "AI outputs mungkin tidak tepat, tidak lengkap, outdated, atau tidak sesuai untuk situasi tertentu. Anda bertanggungjawab untuk review AI outputs sebelum menggunakan, menghantar, menerbitkan, atau bergantung padanya.",
          "Anda tidak boleh bergantung kepada Kolkap AI outputs sebagai professional legal, financial, medical, tax, safety, atau high-risk advice.",
          "Anda bertanggungjawab ke atas bagaimana bisnes anda menggunakan AI-generated replies dan content, termasuk replies yang dihantar melalui WhatsApp atau customer channels lain.",
        ],
      },
      {
        title: "5. WhatsApp dan Messaging Channels",
        text: [
          "Kolkap menyokong AI replies dan business messaging melalui connected channels, termasuk WhatsApp, inbox, website chat, dan supported communication channels lain.",
          "Apabila menggunakan WhatsApp melalui Kolkap, anda bertanggungjawab ke atas WhatsApp Business account, phone number, business details, templates, customer communication, message content, consent, dan pematuhan kepada WhatsApp, Meta, dan applicable messaging rules.",
          "Kolkap tidak bertanggungjawab jika WhatsApp, Meta, atau provider lain restrict, reject, delay, suspend, disable, review, atau mengubah access kepada messaging account, phone number, templates, quality rating, atau channel anda.",
          "AI replies yang dihantar melalui WhatsApp atau channels lain mungkin menggunakan credits. Anda bertanggungjawab untuk review AI staff setup, auto-reply settings, handover rules, dan message content sebelum go live.",
        ],
      },
      {
        title: "6. Plans, Subscriptions, dan Billing",
        text: [
          "Kolkap menawarkan paid subscription plans seperti Starter AI, Growth AI, Professional AI, Business AI, dan custom Enterprise arrangements.",
          "Plans mungkin termasuk AI staff limits, team member limits, monthly credits, usage limits, features, support levels, dan channel access yang berbeza.",
          "Subscription fees dibilkan bulanan kecuali dinyatakan sebaliknya. Pricing, features, limits, dan credit rules mungkin berubah dari semasa ke semasa.",
          "Payments diproses oleh Stripe atau payment provider lain. Kolkap tidak menyimpan nombor kad penuh.",
        ],
      },
      {
        title: "7. Free Trial",
        text: [
          "Kolkap mungkin menawarkan 7-day free trial. Payment method mungkin diperlukan untuk mengaktifkan trial.",
          "Anda tidak akan dikenakan caj hari ini apabila mengaktifkan free trial. Monthly billing bermula selepas 7-day trial kecuali anda cancel sebelum trial tamat.",
          "Jika anda tidak cancel sebelum trial tamat, selected plan mungkin automatik bertukar kepada paid monthly subscription.",
          "Trial availability, duration, dan eligibility mungkin diubah atau dibuang oleh Kolkap pada bila-bila masa.",
        ],
      },
      {
        title: "8. Non-Refundable Payments",
        text: [
          "Semua payments kepada Kolkap adalah non-refundable kecuali diwajibkan oleh applicable law.",
          "Ini termasuk subscription fees, unused subscription time, setup work, unused credits, top-up credits, add-ons, dan paid services yang telah dibeli atau diaktifkan.",
          "Cancelling subscription menghentikan future renewal tetapi tidak memberikan refund untuk current billing period kecuali diwajibkan oleh undang-undang.",
          "Tiada apa-apa dalam Terma ini mengehadkan hak anda di bawah applicable consumer law.",
        ],
      },
      {
        title: "9. Cancellation",
        text: [
          "Anda boleh cancel subscription sebelum billing cycle seterusnya. Cancellation menghentikan future renewal.",
          "Selepas cancellation, anda mungkin masih mempunyai access sehingga akhir current paid billing period kecuali dinyatakan sebaliknya.",
          "Kolkap tidak memberikan prorated refunds untuk partial months atau unused access kecuali diwajibkan oleh undang-undang.",
          "Jika payment gagal, access anda mungkin dihadkan, dipause, atau dibatalkan.",
        ],
      },
      {
        title: "10. Credits dan Top-Ups",
        text: [
          "Kolkap menggunakan AI credits untuk mengukur AI usage. AI replies, test replies, content generation, WhatsApp AI replies, website chat AI replies, dan AI actions lain mungkin menggunakan credits.",
          "Normal AI reply atau generation biasanya menggunakan 1 credit. Long content, campaign packs, atau AI actions yang lebih berat mungkin menggunakan lebih banyak credits.",
          "Monthly plan credits mungkin refresh mengikut plan dan billing cycle. Top-up credits boleh dibeli untuk additional usage.",
          "Top-up purchases dan unused credits adalah non-refundable kecuali diwajibkan undang-undang.",
        ],
      },
      {
        title: "11. Third-Party Services",
        text: [
          "Kolkap mungkin bergantung pada third-party services termasuk Supabase, Stripe, AI providers, hosting providers, WhatsApp, Meta, dan communication atau infrastructure providers lain.",
          "Third-party services mungkin mempunyai terms, policies, fees, approvals, restrictions, limits, outages, dan compliance requirements sendiri.",
          "Kolkap tidak bertanggungjawab atas third-party provider outages, restrictions, account reviews, pricing changes, policy changes, atau service interruptions.",
        ],
      },
      {
        title: "12. Acceptable Use",
        text: [
          "Anda tidak boleh menggunakan Kolkap untuk illegal activity, spam, scams, fraud, harassment, abusive content, impersonation, hate, malware, deceptive activity, unauthorized messaging, atau pelanggaran third-party platform rules.",
          "Anda tidak boleh menggunakan Kolkap untuk menghantar messages kepada orang yang belum memberi consent jika consent diperlukan.",
          "Anda tidak boleh menyalahgunakan AI staff untuk mengelirukan customers, menyembunyikan nature of automated replies apabila disclosure diperlukan, atau melanggar customer rights.",
        ],
      },
      {
        title: "13. Service Availability",
        text: [
          "Kolkap berusaha menyediakan reliable service, tetapi kami tidak menjamin uninterrupted, error-free, atau always-available access.",
          "Availability mungkin dipengaruhi oleh maintenance, updates, internet issues, payment providers, AI providers, Supabase, hosting providers, WhatsApp, Meta, atau third parties lain.",
          "Kolkap mungkin update, mengubah, suspend, atau discontinue features apabila diperlukan untuk security, reliability, legal, business, atau technical reasons.",
        ],
      },
      {
        title: "14. Account Suspension or Termination",
        text: [
          "Kolkap boleh suspend, restrict, atau terminate access jika anda gagal membayar, menyalahgunakan platform, melanggar Terma ini, mencipta risiko kepada Kolkap atau users lain, abuse AI/channel systems, atau menggunakan service secara unlawful.",
          "Kolkap juga boleh suspend access jika diwajibkan oleh law, security concerns, fraud prevention, provider restrictions, atau platform integrity reasons.",
        ],
      },
      {
        title: "15. Account Deletion",
        text: [
          "Users boleh memadam akaun Kolkap dari Settings > Delete Account.",
          "Memadam akaun mungkin membuang account access, business workspace data, AI staff setup, business knowledge, conversations, leads, usage records, dan related workspace data.",
          "Sesetengah records mungkin disimpan jika diperlukan untuk legal, tax, billing, security, fraud-prevention, dispute-handling, atau compliance reasons.",
        ],
      },
      {
        title: "16. Intellectual Property",
        text: [
          "Kolkap owns atau licenses platform, software, systems, user interface, branding, design, workflows, dan related intellectual property.",
          "Anda kekal bertanggungjawab ke atas business content, knowledge base materials, messages, dan customer information yang anda upload atau connect kepada Kolkap.",
          "Subject to these Terms, anda boleh menggunakan AI outputs yang dijana dalam workspace anda untuk business purposes, tetapi anda bertanggungjawab untuk review dan menggunakan outputs tersebut secara lawful.",
        ],
      },
      {
        title: "17. Limitation of Liability",
        text: [
          "To the maximum extent allowed by law, Kolkap tidak bertanggungjawab untuk lost profits, lost sales, missed leads, business interruption, customer disputes, wrong AI replies, message delays, third-party restrictions, platform downtime, atau indirect losses.",
          "Kolkap tidak menjamin AI staff akan menghasilkan perfect replies, increase revenue, close sales, avoid all errors, atau replace human review.",
        ],
      },
      {
        title: "18. Changes to Terms",
        text: [
          "Kolkap boleh update Terma ini, pricing, plans, features, credit rules, billing rules, atau channel rules dari semasa ke semasa.",
          "Apabila diperlukan, kami akan memberi notice tentang material changes. Continued use of Kolkap selepas perubahan bermaksud anda menerima updated Terms.",
        ],
      },
      {
        title: "19. Contact",
        text: [
          "Untuk soalan tentang Terma ini, billing, subscriptions, cancellation, atau account support, hubungi Kolkap di support@kolkap.com.",
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

export default function TermsPage() {
  const { language } = useKolkapLanguage();
  const lang = getSupportedLanguage(language);
  const t = translations[lang];

  const highlightIcons = [Bot, MessageCircle, WalletCards, RefreshCcw];

  return (
    <main className="bg-[#F7F9FA] text-[#07111F]">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[2.4rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-10 lg:p-12">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <FileText className="h-5 w-5" />
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
              {t.whatsappConnected}
            </span>
            <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white">
              {t.nonRefundable}
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
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h2 className="text-3xl font-black tracking-[-0.04em]">
            {t.summaryTitle}
          </h2>

          <div className="mt-6 grid gap-4">
            <SummaryItem
              icon={<Bot className="h-5 w-5" />}
              text={t.summaryItems[0]}
            />
            <SummaryItem
              icon={<AlertTriangle className="h-5 w-5" />}
              text={t.summaryItems[1]}
            />
            <SummaryItem
              icon={<CreditCard className="h-5 w-5" />}
              text={t.summaryItems[2]}
            />
            <SummaryItem
              icon={<RefreshCcw className="h-5 w-5" />}
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