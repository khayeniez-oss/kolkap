"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  CreditCard,
  Edit3,
  FileText,
  Filter,
  Lightbulb,
  Megaphone,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  WalletCards,
  Zap,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const MAX_GENERATED_LENGTH = 8000;
const MAX_DETAILS_LENGTH = 420;
const MAX_PROMPT_LENGTH = 2000;
const CONTENT_GENERATION_CREDIT_COST = 1;

type SupportedLanguage = "en" | "id" | "zh" | "ms";

type ContentRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  created_by_user_id: string | null;
  title: string;
  content_type: string;
  topic: string;
  prompt: string | null;
  generated_content: string;
  language: string;
  tone: string;
  platform: string;
  source_knowledge_ids: string[];
  status: string;
  created_at: string;
  updated_at: string;
};

type CreditBalanceRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  plan_name: string;
  plan_credits: number;
  purchased_credits: number;
  used_credits: number;
  billing_period_start: string | null;
  billing_period_end: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type Option = {
  value: string;
  label: string;
};

type ContentStudioTranslation = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  back: string;
  refresh: string;
  currentPlan: string;
  creditsLeft: string;
  creditsUsed: string;
  creditCost: string;
  creditUnit: string;
  noCreditBalance: string;
  oneCreditNote: string;
  includedPlanCredits: string;
  topUpCredits: string;
  refreshCredits: string;
  totalSaved: string;
  contentTypes: string;
  createTitle: string;
  editGeneratedTitle: string;
  createText: string;
  titleLabel: string;
  titlePlaceholder: string;
  contentType: string;
  purpose: string;
  platform: string;
  language: string;
  tone: string;
  details: string;
  detailsPlaceholder: string;
  prompt: string;
  promptPlaceholder: string;
  generatedContent: string;
  generatedPlaceholder: string;
  generate: string;
  generateForCredit: string;
  regenererateForCredit: string;
  generating: string;
  copyGenerated: string;
  saveContent: string;
  updateContent: string;
  saving: string;
  cancelEdit: string;
  generated: string;
  generatedForBusiness: string;
  knowledgeItemsUsed: string;
  reviewBeforeSaving: string;
  copied: string;
  saved: string;
  updated: string;
  deleted: string;
  archived: string;
  saveFailed: string;
  updateFailed: string;
  generateFailed: string;
  deleteConfirm: string;
  archiveConfirm: string;
  requiredFields: string;
  detailsRequired: string;
  contentTooLong: string;
  detailsTooLong: string;
  promptTooLong: string;
  characters: string;
  savedTitle: string;
  savedText: string;
  search: string;
  searchPlaceholder: string;
  filterType: string;
  allTypes: string;
  noSaved: string;
  noSavedText: string;
  edit: string;
  copy: string;
  archive: string;
  delete: string;
  noteTitle: string;
  noteText: string;
  shown: string;
  differentFormats: string;
  updatedLabel: string;
  planNames: Record<string, string>;
  contentTypeLabels: Record<string, string>;
  purposeLabels: Record<string, string>;
  platformLabels: Record<string, string>;
  languageLabels: Record<string, string>;
  toneLabels: Record<string, string>;
};

const contentTypeValues = [
  "social_caption",
  "instagram_caption",
  "facebook_post",
  "whatsapp_broadcast",
  "promo_announcement",
  "product_description",
  "service_description",
  "customer_reply",
  "faq_answer",
  "ad_copy",
  "blog_idea",
  "reel_script",
  "video_script",
  "custom",
];

const purposeValues = [
  "promotion",
  "introduction",
  "sales",
  "announcement",
  "education",
  "follow_up",
  "reminder",
  "launch",
  "event",
  "custom",
];

const platformValues = [
  "general",
  "instagram",
  "facebook",
  "whatsapp",
  "tiktok",
  "linkedin",
  "website",
  "blog",
  "ads",
];

const languageValues = ["auto", "en", "id", "ms", "zh"];

const toneValues = [
  "professional",
  "friendly",
  "sales",
  "simple",
  "luxury",
  "casual",
  "formal",
  "urgent",
  "educational",
];

const translations: Record<SupportedLanguage, ContentStudioTranslation> = {
  en: {
    badge: "Content Studio",
    title: "Generate ready-to-use content for your business.",
    subtitle:
      "Create captions, WhatsApp messages, announcements, customer replies, product descriptions, ad copy, and short scripts using your business profile and Knowledge Base.",
    loading: "Loading your content studio...",
    failed: "Content Studio could not load.",
    back: "Back to Dashboard",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    creditsLeft: "Credits Left",
    creditsUsed: "Credits Used",
    creditCost: "Credit Cost",
    creditUnit: "Credit",
    noCreditBalance: "Credit balance not found yet.",
    oneCreditNote: "Every successful content generation uses 1 credit.",
    includedPlanCredits: "Included plan credits",
    topUpCredits: "Top-Up credits",
    refreshCredits: "Refresh credits",
    totalSaved: "Saved Content",
    contentTypes: "Content Types",
    createTitle: "Content Generator",
    editGeneratedTitle: "Edit Generated Content",
    createText:
      "Choose the format, purpose, and details. Kolkap will generate content based on your logged-in business and Knowledge Base.",
    titleLabel: "Content Title",
    titlePlaceholder: "Example: June Promotion WhatsApp Message",
    contentType: "Content Format",
    purpose: "Content Purpose",
    platform: "Where will you use it?",
    language: "Language",
    tone: "Tone",
    details: "Main Details",
    detailsPlaceholder:
      "Write what this content should include. Example: promotion details, product benefits, business introduction, sales offer, announcement, event details, reminder, or customer follow-up.",
    prompt: "Extra Instructions",
    promptPlaceholder:
      "Optional: Add target audience, price, location, deadline, CTA, must-include words, or any special instruction.",
    generatedContent: "Generated Content",
    generatedPlaceholder:
      "Click Generate Content. The result will appear here. You can edit it before saving.",
    generate: "Generate Content",
    generateForCredit: "Generate Content for 1 Credit",
    regenererateForCredit: "Regenerate Content for 1 Credit",
    generating: "Generating...",
    copyGenerated: "Copy Generated",
    saveContent: "Save Content",
    updateContent: "Update Content",
    saving: "Saving...",
    cancelEdit: "Cancel Edit",
    generated:
      "Content generated using your business context. 1 credit has been used. Please review and edit before saving.",
    generatedForBusiness: "Content generated for",
    knowledgeItemsUsed: "knowledge item(s) used.",
    reviewBeforeSaving:
      "1 credit has been used. Please review and edit before saving.",
    copied: "Copied",
    saved: "Content saved successfully.",
    updated: "Content updated successfully.",
    deleted: "Content deleted.",
    archived: "Content archived.",
    saveFailed: "Content could not be saved.",
    updateFailed: "Content could not be updated.",
    generateFailed: "Content could not be generated.",
    deleteConfirm: "Delete this content?",
    archiveConfirm: "Archive this content?",
    requiredFields: "Please add a title, main details, and generated content.",
    detailsRequired: "Please write the main details first.",
    contentTooLong: "Generated content must be 8,000 characters or less.",
    detailsTooLong: "Main details must be 420 characters or less.",
    promptTooLong: "Extra instructions must be 2,000 characters or less.",
    characters: "characters",
    savedTitle: "Saved Content",
    savedText: "Manage content your team can copy, edit, reuse, or archive.",
    search: "Search",
    searchPlaceholder: "Search saved content...",
    filterType: "Filter Content Type",
    allTypes: "All Content Types",
    noSaved: "No saved content yet.",
    noSavedText: "Generate your first content, review it, then save it here.",
    edit: "Edit",
    copy: "Copy",
    archive: "Archive",
    delete: "Delete",
    noteTitle: "How this works",
    noteText:
      "Content Studio uses your logged-in business profile, saved Knowledge Base, and your instructions to create business-specific content. Each successful generation uses 1 credit.",
    shown: "shown",
    differentFormats: "Different formats",
    updatedLabel: "Updated",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    contentTypeLabels: {
      social_caption: "Social Media Caption",
      instagram_caption: "Instagram Caption",
      facebook_post: "Facebook Post",
      whatsapp_broadcast: "WhatsApp Broadcast",
      promo_announcement: "Promo Announcement",
      product_description: "Product Description",
      service_description: "Service Description",
      customer_reply: "Customer Reply",
      faq_answer: "FAQ Answer",
      ad_copy: "Ad Copy",
      blog_idea: "Blog Idea",
      reel_script: "Reel Script",
      video_script: "Video Script",
      custom: "Custom Content",
    },
    purposeLabels: {
      promotion: "Promotion",
      introduction: "Introduction",
      sales: "Sales",
      announcement: "Announcement",
      education: "Education",
      follow_up: "Follow-up",
      reminder: "Reminder",
      launch: "Launch",
      event: "Event",
      custom: "Custom",
    },
    platformLabels: {
      general: "General",
      instagram: "Instagram",
      facebook: "Facebook",
      whatsapp: "WhatsApp",
      tiktok: "TikTok",
      linkedin: "LinkedIn",
      website: "Website",
      blog: "Blog",
      ads: "Ads",
    },
    languageLabels: {
      auto: "Auto Detect",
      en: "English",
      id: "Indonesian",
      ms: "Malay",
      zh: "Chinese",
    },
    toneLabels: {
      professional: "Professional",
      friendly: "Friendly",
      sales: "Sales",
      simple: "Simple",
      luxury: "Luxury",
      casual: "Casual",
      formal: "Formal",
      urgent: "Urgent",
      educational: "Educational",
    },
  },

  id: {
    badge: "Content Studio",
    title: "Buat konten siap pakai untuk bisnis Anda.",
    subtitle:
      "Buat caption, pesan WhatsApp, announcement, balasan pelanggan, deskripsi produk, ad copy, dan script singkat menggunakan business profile dan Knowledge Base Anda.",
    loading: "Memuat Content Studio Anda...",
    failed: "Content Studio tidak dapat dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Muat Ulang",
    currentPlan: "Paket Saat Ini",
    creditsLeft: "Sisa Kredit",
    creditsUsed: "Kredit Terpakai",
    creditCost: "Biaya Kredit",
    creditUnit: "Kredit",
    noCreditBalance: "Saldo kredit belum ditemukan.",
    oneCreditNote: "Setiap konten yang berhasil dibuat menggunakan 1 kredit.",
    includedPlanCredits: "Kredit termasuk paket",
    topUpCredits: "Kredit Top-Up",
    refreshCredits: "Muat ulang kredit",
    totalSaved: "Konten Tersimpan",
    contentTypes: "Jenis Konten",
    createTitle: "Generator Konten",
    editGeneratedTitle: "Edit Konten",
    createText:
      "Pilih format, tujuan, dan detail utama. Kolkap akan membuat konten berdasarkan bisnis yang sedang login dan Knowledge Base Anda.",
    titleLabel: "Judul Konten",
    titlePlaceholder: "Contoh: Pesan WhatsApp Promo Juni",
    contentType: "Format Konten",
    purpose: "Tujuan Konten",
    platform: "Dipakai di mana?",
    language: "Bahasa",
    tone: "Tone",
    details: "Detail Utama",
    detailsPlaceholder:
      "Tulis hal yang harus dimasukkan ke konten. Contoh: detail promo, manfaat produk, perkenalan bisnis, penawaran, announcement, detail event, reminder, atau follow-up pelanggan.",
    prompt: "Instruksi Tambahan",
    promptPlaceholder:
      "Opsional: Tambahkan target audience, harga, lokasi, deadline, CTA, kata wajib, atau instruksi khusus.",
    generatedContent: "Konten yang Dibuat",
    generatedPlaceholder:
      "Klik Buat Konten. Hasilnya akan muncul di sini. Anda bisa edit sebelum disimpan.",
    generate: "Buat Konten",
    generateForCredit: "Buat Konten untuk 1 Kredit",
    regenererateForCredit: "Buat Ulang Konten untuk 1 Kredit",
    generating: "Membuat...",
    copyGenerated: "Copy Konten",
    saveContent: "Simpan Konten",
    updateContent: "Update Konten",
    saving: "Menyimpan...",
    cancelEdit: "Batalkan Edit",
    generated:
      "Konten berhasil dibuat menggunakan konteks bisnis Anda. 1 kredit sudah digunakan. Silakan review dan edit sebelum disimpan.",
    generatedForBusiness: "Konten dibuat untuk",
    knowledgeItemsUsed: "knowledge item digunakan.",
    reviewBeforeSaving:
      "1 kredit sudah digunakan. Silakan review dan edit sebelum disimpan.",
    copied: "Copied",
    saved: "Konten berhasil disimpan.",
    updated: "Konten berhasil diperbarui.",
    deleted: "Konten berhasil dihapus.",
    archived: "Konten berhasil diarsipkan.",
    saveFailed: "Konten tidak dapat disimpan.",
    updateFailed: "Konten tidak dapat diperbarui.",
    generateFailed: "Konten tidak dapat dibuat.",
    deleteConfirm: "Hapus konten ini?",
    archiveConfirm: "Arsipkan konten ini?",
    requiredFields: "Mohon isi judul, detail utama, dan konten yang dibuat.",
    detailsRequired: "Mohon tulis detail utama terlebih dahulu.",
    contentTooLong: "Konten maksimal 8.000 karakter.",
    detailsTooLong: "Detail utama maksimal 420 karakter.",
    promptTooLong: "Instruksi tambahan maksimal 2.000 karakter.",
    characters: "karakter",
    savedTitle: "Konten Tersimpan",
    savedText:
      "Kelola konten yang bisa di-copy, diedit, digunakan ulang, atau diarsipkan oleh tim Anda.",
    search: "Cari",
    searchPlaceholder: "Cari konten tersimpan...",
    filterType: "Filter Jenis Konten",
    allTypes: "Semua Jenis Konten",
    noSaved: "Belum ada konten tersimpan.",
    noSavedText: "Buat konten pertama Anda, review, lalu simpan di sini.",
    edit: "Edit",
    copy: "Copy",
    archive: "Arsipkan",
    delete: "Hapus",
    noteTitle: "Cara kerja halaman ini",
    noteText:
      "Content Studio menggunakan business profile yang sedang login, Knowledge Base yang tersimpan, dan instruksi Anda untuk membuat konten yang spesifik untuk bisnis. Setiap hasil yang berhasil dibuat menggunakan 1 kredit.",
    shown: "ditampilkan",
    differentFormats: "Format berbeda",
    updatedLabel: "Diupdate",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    contentTypeLabels: {
      social_caption: "Caption Social Media",
      instagram_caption: "Caption Instagram",
      facebook_post: "Post Facebook",
      whatsapp_broadcast: "Broadcast WhatsApp",
      promo_announcement: "Announcement Promo",
      product_description: "Deskripsi Produk",
      service_description: "Deskripsi Service",
      customer_reply: "Balasan Pelanggan",
      faq_answer: "Jawaban FAQ",
      ad_copy: "Ad Copy",
      blog_idea: "Ide Blog",
      reel_script: "Script Reel",
      video_script: "Script Video",
      custom: "Konten Custom",
    },
    purposeLabels: {
      promotion: "Promosi",
      introduction: "Perkenalan",
      sales: "Sales",
      announcement: "Announcement",
      education: "Edukasi",
      follow_up: "Follow-up",
      reminder: "Reminder",
      launch: "Launch",
      event: "Event",
      custom: "Custom",
    },
    platformLabels: {
      general: "General",
      instagram: "Instagram",
      facebook: "Facebook",
      whatsapp: "WhatsApp",
      tiktok: "TikTok",
      linkedin: "LinkedIn",
      website: "Website",
      blog: "Blog",
      ads: "Ads",
    },
    languageLabels: {
      auto: "Auto Detect",
      en: "English",
      id: "Indonesian",
      ms: "Malay",
      zh: "Chinese",
    },
    toneLabels: {
      professional: "Professional",
      friendly: "Friendly",
      sales: "Sales",
      simple: "Simple",
      luxury: "Luxury",
      casual: "Casual",
      formal: "Formal",
      urgent: "Urgent",
      educational: "Educational",
    },
  },

  zh: {
    badge: "Content Studio",
    title: "为您的业务生成可直接使用的内容。",
    subtitle:
      "使用您的 business profile 和 Knowledge Base，生成 caption、WhatsApp 消息、公告、客户回复、产品描述、广告文案和短视频脚本。",
    loading: "正在加载 Content Studio...",
    failed: "Content Studio 无法加载。",
    back: "返回 Dashboard",
    refresh: "刷新",
    currentPlan: "当前套餐",
    creditsLeft: "剩余积分",
    creditsUsed: "已用积分",
    creditCost: "积分费用",
    creditUnit: "积分",
    noCreditBalance: "尚未找到积分余额。",
    oneCreditNote: "每次成功生成内容会使用 1 积分。",
    includedPlanCredits: "套餐包含积分",
    topUpCredits: "充值积分",
    refreshCredits: "刷新积分",
    totalSaved: "已保存内容",
    contentTypes: "内容类型",
    createTitle: "内容生成器",
    editGeneratedTitle: "编辑已生成内容",
    createText:
      "选择格式、目的和主要细节。Kolkap 会根据已登录的业务资料和 Knowledge Base 生成内容。",
    titleLabel: "内容标题",
    titlePlaceholder: "例：六月促销 WhatsApp 消息",
    contentType: "内容格式",
    purpose: "内容目的",
    platform: "使用平台",
    language: "语言",
    tone: "语气",
    details: "主要细节",
    detailsPlaceholder:
      "写下内容必须包含的信息。例如：促销详情、产品优势、业务介绍、销售优惠、公告、活动细节、提醒或客户跟进。",
    prompt: "额外指令",
    promptPlaceholder:
      "可选：添加目标受众、价格、地点、截止日期、CTA、必须包含的词语或特别指令。",
    generatedContent: "生成内容",
    generatedPlaceholder:
      "点击生成内容。结果会显示在这里，您可以在保存前编辑。",
    generate: "生成内容",
    generateForCredit: "用 1 积分生成内容",
    regenererateForCredit: "用 1 积分重新生成内容",
    generating: "正在生成...",
    copyGenerated: "复制生成内容",
    saveContent: "保存内容",
    updateContent: "更新内容",
    saving: "正在保存...",
    cancelEdit: "取消编辑",
    generated:
      "内容已根据您的业务资料生成。已使用 1 积分。保存前请先检查和编辑。",
    generatedForBusiness: "内容已生成给",
    knowledgeItemsUsed: "个 knowledge item 已使用。",
    reviewBeforeSaving: "已使用 1 积分。保存前请先检查和编辑。",
    copied: "已复制",
    saved: "内容已成功保存。",
    updated: "内容已成功更新。",
    deleted: "内容已删除。",
    archived: "内容已归档。",
    saveFailed: "内容无法保存。",
    updateFailed: "内容无法更新。",
    generateFailed: "内容无法生成。",
    deleteConfirm: "删除此内容？",
    archiveConfirm: "归档此内容？",
    requiredFields: "请添加标题、主要细节和生成内容。",
    detailsRequired: "请先填写主要细节。",
    contentTooLong: "生成内容不能超过 8,000 字符。",
    detailsTooLong: "主要细节不能超过 420 字符。",
    promptTooLong: "额外指令不能超过 2,000 字符。",
    characters: "字符",
    savedTitle: "已保存内容",
    savedText: "管理团队可以复制、编辑、重复使用或归档的内容。",
    search: "搜索",
    searchPlaceholder: "搜索已保存内容...",
    filterType: "筛选内容类型",
    allTypes: "所有内容类型",
    noSaved: "尚未保存内容。",
    noSavedText: "先生成第一条内容，检查后保存到这里。",
    edit: "编辑",
    copy: "复制",
    archive: "归档",
    delete: "删除",
    noteTitle: "页面如何运作",
    noteText:
      "Content Studio 会使用已登录的 business profile、已保存的 Knowledge Base 和您的指令，生成适合业务的内容。每次成功生成会使用 1 积分。",
    shown: "已显示",
    differentFormats: "不同格式",
    updatedLabel: "已更新",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    contentTypeLabels: {
      social_caption: "社交媒体 Caption",
      instagram_caption: "Instagram Caption",
      facebook_post: "Facebook Post",
      whatsapp_broadcast: "WhatsApp Broadcast",
      promo_announcement: "促销公告",
      product_description: "产品描述",
      service_description: "服务描述",
      customer_reply: "客户回复",
      faq_answer: "FAQ 回答",
      ad_copy: "广告文案",
      blog_idea: "博客想法",
      reel_script: "Reel 脚本",
      video_script: "视频脚本",
      custom: "自定义内容",
    },
    purposeLabels: {
      promotion: "促销",
      introduction: "介绍",
      sales: "销售",
      announcement: "公告",
      education: "教育",
      follow_up: "跟进",
      reminder: "提醒",
      launch: "发布",
      event: "活动",
      custom: "自定义",
    },
    platformLabels: {
      general: "通用",
      instagram: "Instagram",
      facebook: "Facebook",
      whatsapp: "WhatsApp",
      tiktok: "TikTok",
      linkedin: "LinkedIn",
      website: "Website",
      blog: "Blog",
      ads: "Ads",
    },
    languageLabels: {
      auto: "自动识别",
      en: "英语",
      id: "印尼语",
      ms: "马来语",
      zh: "中文",
    },
    toneLabels: {
      professional: "专业",
      friendly: "友好",
      sales: "销售",
      simple: "简单",
      luxury: "高级",
      casual: "轻松",
      formal: "正式",
      urgent: "紧急",
      educational: "教育",
    },
  },

  ms: {
    badge: "Content Studio",
    title: "Jana kandungan siap guna untuk bisnes anda.",
    subtitle:
      "Cipta caption, mesej WhatsApp, announcement, balasan pelanggan, penerangan produk, ad copy, dan short script menggunakan business profile dan Knowledge Base anda.",
    loading: "Memuatkan Content Studio anda...",
    failed: "Content Studio tidak dapat dimuatkan.",
    back: "Kembali ke Dashboard",
    refresh: "Segar Semula",
    currentPlan: "Pelan Semasa",
    creditsLeft: "Baki Kredit",
    creditsUsed: "Kredit Digunakan",
    creditCost: "Kos Kredit",
    creditUnit: "Kredit",
    noCreditBalance: "Baki kredit belum dijumpai.",
    oneCreditNote: "Setiap kandungan yang berjaya dijana menggunakan 1 kredit.",
    includedPlanCredits: "Kredit termasuk pelan",
    topUpCredits: "Kredit Top-Up",
    refreshCredits: "Segar semula kredit",
    totalSaved: "Kandungan Disimpan",
    contentTypes: "Jenis Kandungan",
    createTitle: "Generator Kandungan",
    editGeneratedTitle: "Edit Kandungan Dijana",
    createText:
      "Pilih format, tujuan, dan detail utama. Kolkap akan jana kandungan berdasarkan bisnes yang sedang login dan Knowledge Base anda.",
    titleLabel: "Tajuk Kandungan",
    titlePlaceholder: "Contoh: Mesej WhatsApp Promosi Jun",
    contentType: "Format Kandungan",
    purpose: "Tujuan Kandungan",
    platform: "Di mana akan digunakan?",
    language: "Bahasa",
    tone: "Tone",
    details: "Detail Utama",
    detailsPlaceholder:
      "Tulis perkara yang perlu dimasukkan dalam kandungan. Contoh: detail promo, manfaat produk, pengenalan bisnes, tawaran jualan, announcement, detail event, reminder, atau follow-up pelanggan.",
    prompt: "Arahan Tambahan",
    promptPlaceholder:
      "Opsional: Tambah target audience, harga, lokasi, deadline, CTA, perkataan wajib, atau arahan khas.",
    generatedContent: "Kandungan Dijana",
    generatedPlaceholder:
      "Klik Jana Kandungan. Hasilnya akan muncul di sini. Anda boleh edit sebelum disimpan.",
    generate: "Jana Kandungan",
    generateForCredit: "Jana Kandungan untuk 1 Kredit",
    regenererateForCredit: "Jana Semula Kandungan untuk 1 Kredit",
    generating: "Menjana...",
    copyGenerated: "Copy Kandungan",
    saveContent: "Simpan Kandungan",
    updateContent: "Update Kandungan",
    saving: "Menyimpan...",
    cancelEdit: "Batal Edit",
    generated:
      "Kandungan berjaya dijana menggunakan konteks bisnes anda. 1 kredit sudah digunakan. Sila review dan edit sebelum disimpan.",
    generatedForBusiness: "Kandungan dijana untuk",
    knowledgeItemsUsed: "knowledge item digunakan.",
    reviewBeforeSaving:
      "1 kredit sudah digunakan. Sila review dan edit sebelum disimpan.",
    copied: "Copied",
    saved: "Kandungan berjaya disimpan.",
    updated: "Kandungan berjaya dikemaskini.",
    deleted: "Kandungan dipadam.",
    archived: "Kandungan diarkibkan.",
    saveFailed: "Kandungan tidak dapat disimpan.",
    updateFailed: "Kandungan tidak dapat dikemaskini.",
    generateFailed: "Kandungan tidak dapat dijana.",
    deleteConfirm: "Padam kandungan ini?",
    archiveConfirm: "Arkibkan kandungan ini?",
    requiredFields: "Sila isi tajuk, detail utama, dan kandungan yang dijana.",
    detailsRequired: "Sila tulis detail utama dahulu.",
    contentTooLong: "Kandungan yang dijana mesti 8,000 aksara atau kurang.",
    detailsTooLong: "Detail utama mesti 420 aksara atau kurang.",
    promptTooLong: "Arahan tambahan mesti 2,000 aksara atau kurang.",
    characters: "aksara",
    savedTitle: "Kandungan Disimpan",
    savedText:
      "Urus kandungan yang boleh di-copy, diedit, digunakan semula, atau diarkibkan oleh team anda.",
    search: "Cari",
    searchPlaceholder: "Cari kandungan disimpan...",
    filterType: "Filter Jenis Kandungan",
    allTypes: "Semua Jenis Kandungan",
    noSaved: "Belum ada kandungan disimpan.",
    noSavedText: "Jana kandungan pertama anda, review, lalu simpan di sini.",
    edit: "Edit",
    copy: "Copy",
    archive: "Arkib",
    delete: "Padam",
    noteTitle: "Cara halaman ini berfungsi",
    noteText:
      "Content Studio menggunakan business profile yang sedang login, Knowledge Base yang disimpan, dan arahan anda untuk mencipta kandungan khusus untuk bisnes. Setiap hasil yang berjaya dijana menggunakan 1 kredit.",
    shown: "dipaparkan",
    differentFormats: "Format berbeza",
    updatedLabel: "Dikemaskini",
    planNames: {
      starter: "Starter",
      growth: "Growth",
      professional: "Professional",
      business: "Business",
    },
    contentTypeLabels: {
      social_caption: "Caption Social Media",
      instagram_caption: "Caption Instagram",
      facebook_post: "Post Facebook",
      whatsapp_broadcast: "Broadcast WhatsApp",
      promo_announcement: "Announcement Promo",
      product_description: "Penerangan Produk",
      service_description: "Penerangan Service",
      customer_reply: "Balasan Pelanggan",
      faq_answer: "Jawapan FAQ",
      ad_copy: "Ad Copy",
      blog_idea: "Idea Blog",
      reel_script: "Script Reel",
      video_script: "Script Video",
      custom: "Kandungan Custom",
    },
    purposeLabels: {
      promotion: "Promosi",
      introduction: "Pengenalan",
      sales: "Jualan",
      announcement: "Announcement",
      education: "Edukasi",
      follow_up: "Follow-up",
      reminder: "Reminder",
      launch: "Launch",
      event: "Event",
      custom: "Custom",
    },
    platformLabels: {
      general: "General",
      instagram: "Instagram",
      facebook: "Facebook",
      whatsapp: "WhatsApp",
      tiktok: "TikTok",
      linkedin: "LinkedIn",
      website: "Website",
      blog: "Blog",
      ads: "Ads",
    },
    languageLabels: {
      auto: "Auto Detect",
      en: "English",
      id: "Indonesian",
      ms: "Malay",
      zh: "Chinese",
    },
    toneLabels: {
      professional: "Professional",
      friendly: "Friendly",
      sales: "Sales",
      simple: "Simple",
      luxury: "Luxury",
      casual: "Casual",
      formal: "Formal",
      urgent: "Urgent",
      educational: "Educational",
    },
  },
};

function getSupportedLanguage(language: string): SupportedLanguage {
  if (language === "id" || language === "zh" || language === "ms") {
    return language;
  }

  return "en";
}

function getOptions(values: string[], labels: Record<string, string>): Option[] {
  return values.map((value) => ({
    value,
    label: labels[value] || formatValue(value),
  }));
}

function getOptionLabel(labels: Record<string, string>, value: string) {
  return labels[value] || formatValue(value);
}

function formatValue(value: unknown) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString();
}

function makeSavedTopic(contentPurpose: string, details: string) {
  return `${contentPurpose}: ${details.trim()}`;
}

function extractPurposeAndDetails(savedTopic: string) {
  const matchedValue = purposeValues.find((purpose) =>
    savedTopic.startsWith(`${purpose}:`)
  );

  if (matchedValue) {
    return {
      purpose: matchedValue,
      details: savedTopic.replace(`${matchedValue}:`, "").trim(),
    };
  }

  const allPurposeLabels = Object.values(translations).flatMap((translation) =>
    Object.entries(translation.purposeLabels).map(([value, label]) => ({
      value,
      label,
    }))
  );

  const matchedLabel = allPurposeLabels.find((purpose) =>
    savedTopic.startsWith(`${purpose.label}:`)
  );

  if (matchedLabel) {
    return {
      purpose: matchedLabel.value,
      details: savedTopic.replace(`${matchedLabel.label}:`, "").trim(),
    };
  }

  return {
    purpose: "promotion",
    details: savedTopic,
  };
}

function formatSavedTopic(savedTopic: string, t: ContentStudioTranslation) {
  const extracted = extractPurposeAndDetails(savedTopic);
  return `${getOptionLabel(t.purposeLabels, extracted.purpose)}: ${
    extracted.details
  }`;
}

function getCreditsLeft(balance: CreditBalanceRow | null) {
  if (!balance) return null;

  return Math.max(
    0,
    Number(balance.plan_credits || 0) +
      Number(balance.purchased_credits || 0) -
      Number(balance.used_credits || 0)
  );
}

function localizePlanName(
  planKey: string | null | undefined,
  fallback: string,
  t: ContentStudioTranslation
) {
  if (!planKey) return fallback;
  return t.planNames[planKey] || fallback;
}

export default function ContentStudioPage() {
  const { language } = useKolkapLanguage();
  const activeLanguage = getSupportedLanguage(language);
  const t = translations[activeLanguage];

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);
  const currentPlanName = localizePlanName(
    workspaceState.planKey,
    currentPlan.name,
    t
  );

  const contentTypeOptions = useMemo(
    () => getOptions(contentTypeValues, t.contentTypeLabels),
    [t.contentTypeLabels]
  );

  const purposeOptions = useMemo(
    () => getOptions(purposeValues, t.purposeLabels),
    [t.purposeLabels]
  );

  const platformOptions = useMemo(
    () => getOptions(platformValues, t.platformLabels),
    [t.platformLabels]
  );

  const languageOptions = useMemo(
    () => getOptions(languageValues, t.languageLabels),
    [t.languageLabels]
  );

  const toneOptions = useMemo(
    () => getOptions(toneValues, t.toneLabels),
    [t.toneLabels]
  );

  const [contentItems, setContentItems] = useState<ContentRow[]>([]);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceRow | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [pageError, setPageError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [editingId, setEditingId] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("social_caption");
  const [contentPurpose, setContentPurpose] = useState("promotion");
  const [platform, setPlatform] = useState("general");
  const [entryLanguage, setEntryLanguage] = useState("auto");
  const [tone, setTone] = useState("professional");
  const [details, setDetails] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingItemId, setSavingItemId] = useState("");
  const [copiedItemId, setCopiedItemId] = useState("");
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const contentCount = generatedContent.length;
  const detailsCount = details.length;
  const promptCount = prompt.length;

  const isContentTooLong = contentCount > MAX_GENERATED_LENGTH;
  const isDetailsTooLong = detailsCount > MAX_DETAILS_LENGTH;
  const isPromptTooLong = promptCount > MAX_PROMPT_LENGTH;

  const creditsLeft = getCreditsLeft(creditBalance);
  const usedCredits = Number(creditBalance?.used_credits || 0);
  const planCredits = Number(creditBalance?.plan_credits || 0);
  const purchasedCredits = Number(creditBalance?.purchased_credits || 0);

  async function loadCreditBalance() {
    if (!workspace?.id) return;

    setIsLoadingCredits(true);

    const supabase = createClient();

    const { data } = await supabase
      .from("workspace_credit_balances")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    setCreditBalance((data ?? null) as CreditBalanceRow | null);
    setIsLoadingCredits(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      if (!workspace) return;

      setIsLoading(true);
      setPageError("");

      const supabase = createClient();

      const { data, error } = await supabase
        .from("workspace_content_studio")
        .select("*")
        .eq("workspace_id", workspace.id)
        .neq("status", "archived")
        .order("updated_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setPageError(error.message);
        setIsLoading(false);
        return;
      }

      setContentItems((data ?? []) as ContentRow[]);
      setIsLoading(false);
    }

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [workspace, reloadKey]);

  useEffect(() => {
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const filteredContent = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return contentItems.filter((item) => {
      const contentTypeLabel = getOptionLabel(
        t.contentTypeLabels,
        item.content_type
      ).toLowerCase();

      const topicLabel = formatSavedTopic(item.topic, t).toLowerCase();

      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        topicLabel.includes(search) ||
        contentTypeLabel.includes(search) ||
        item.generated_content.toLowerCase().includes(search) ||
        String(item.prompt || "").toLowerCase().includes(search);

      const matchesType =
        filterType === "all" || item.content_type === filterType;

      return matchesSearch && matchesType;
    });
  }, [contentItems, searchTerm, filterType, t]);

  const uniqueTypes = new Set(
    contentItems.map((item) => item.content_type)
  ).size;

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlanName,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.creditsLeft,
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `${t.creditsUsed}: ${usedCredits.toLocaleString()}`
        : t.noCreditBalance,
      icon: CreditCard,
      dark: true,
    },
    {
      label: t.creditCost,
      value: `${CONTENT_GENERATION_CREDIT_COST} ${t.creditUnit}`,
      note: t.oneCreditNote,
      icon: Zap,
    },
    {
      label: t.totalSaved,
      value: `${contentItems.length}`,
      note: `${filteredContent.length} ${t.shown}`,
      icon: FileText,
    },
    {
      label: t.contentTypes,
      value: `${uniqueTypes}`,
      note: t.differentFormats,
      icon: Megaphone,
    },
  ];

  function resetForm() {
    setEditingId("");
    setTitle("");
    setContentType("social_caption");
    setContentPurpose("promotion");
    setPlatform("general");
    setEntryLanguage("auto");
    setTone("professional");
    setDetails("");
    setPrompt("");
    setGeneratedContent("");
    setActionError("");
  }

  function startEdit(item: ContentRow) {
    const extracted = extractPurposeAndDetails(item.topic);

    setEditingId(item.id);
    setTitle(item.title);
    setContentType(item.content_type);
    setContentPurpose(extracted.purpose);
    setPlatform(item.platform);
    setEntryLanguage(item.language);
    setTone(item.tone);
    setDetails(extracted.details);
    setPrompt(item.prompt || "");
    setGeneratedContent(item.generated_content);
    setActionMessage("");
    setActionError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleGenerateContent() {
    setActionMessage("");
    setActionError("");

    if (!details.trim()) {
      setActionError(t.detailsRequired);
      return;
    }

    if (details.length > MAX_DETAILS_LENGTH) {
      setActionError(t.detailsTooLong);
      return;
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      setActionError(t.promptTooLong);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/content-studio/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content_type: contentType,
          content_purpose: contentPurpose,
          platform,
          language: entryLanguage,
          tone,
          details,
          prompt,
          ui_language: activeLanguage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setActionError(result.error || t.generateFailed);
        setIsGenerating(false);
        return;
      }

      setGeneratedContent(result.content || "");

      if (!title.trim()) {
        setTitle(
          `${getOptionLabel(t.purposeLabels, contentPurpose)} - ${getOptionLabel(
            t.contentTypeLabels,
            contentType
          )}`
        );
      }

      if (result.business_name) {
        const knowledgeText =
          typeof result.knowledge_count === "number"
            ? ` ${result.knowledge_count} ${t.knowledgeItemsUsed}`
            : "";

        setActionMessage(
          `${t.generatedForBusiness} ${result.business_name}.${knowledgeText} ${t.reviewBeforeSaving}`
        );
      } else {
        setActionMessage(t.generated);
      }

      await loadCreditBalance();
    } catch (error) {
      const message = error instanceof Error ? error.message : t.generateFailed;

      setActionError(message);
    }

    setIsGenerating(false);
  }

  async function handleSaveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!workspace) {
      setActionError(t.saveFailed);
      return;
    }

    if (!title.trim() || !details.trim() || !generatedContent.trim()) {
      setActionError(t.requiredFields);
      return;
    }

    if (details.length > MAX_DETAILS_LENGTH) {
      setActionError(t.detailsTooLong);
      return;
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      setActionError(t.promptTooLong);
      return;
    }

    if (generatedContent.length > MAX_GENERATED_LENGTH) {
      setActionError(t.contentTooLong);
      return;
    }

    setIsSaving(true);

    const supabase = createClient();
    const now = new Date().toISOString();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      workspace_id: workspace.id,
      owner_user_id: workspace.owner_user_id,
      created_by_user_id: user?.id || null,
      title: title.trim(),
      content_type: contentType,
      topic: makeSavedTopic(contentPurpose, details),
      prompt: prompt.trim() || null,
      generated_content: generatedContent.trim(),
      language: entryLanguage,
      tone,
      platform,
      source_knowledge_ids: [],
      status: "saved",
      updated_at: now,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("workspace_content_studio")
        .update(payload)
        .eq("id", editingId)
        .eq("workspace_id", workspace.id)
        .select("*")
        .single();

      if (error) {
        setActionError(error.message || t.updateFailed);
        setIsSaving(false);
        return;
      }

      setContentItems((current) =>
        current.map((item) =>
          item.id === editingId ? (data as ContentRow) : item
        )
      );

      setActionMessage(t.updated);
      resetForm();
      setIsSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("workspace_content_studio")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      setActionError(error.message || t.saveFailed);
      setIsSaving(false);
      return;
    }

    setContentItems((current) => [data as ContentRow, ...current]);
    setActionMessage(t.saved);
    resetForm();
    setIsSaving(false);
  }

  async function archiveContent(itemId: string) {
    if (!workspace) return;

    const shouldArchive = window.confirm(t.archiveConfirm);

    if (!shouldArchive) return;

    setSavingItemId(itemId);
    setActionMessage("");
    setActionError("");

    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("workspace_content_studio")
      .update({
        status: "archived",
        updated_at: now,
      })
      .eq("id", itemId)
      .eq("workspace_id", workspace.id);

    if (error) {
      setActionError(error.message || t.updateFailed);
      setSavingItemId("");
      return;
    }

    setContentItems((current) => current.filter((item) => item.id !== itemId));
    setActionMessage(t.archived);
    setSavingItemId("");
  }

  async function deleteContent(itemId: string) {
    if (!workspace) return;

    const shouldDelete = window.confirm(t.deleteConfirm);

    if (!shouldDelete) return;

    setSavingItemId(itemId);
    setActionMessage("");
    setActionError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("workspace_content_studio")
      .delete()
      .eq("id", itemId)
      .eq("workspace_id", workspace.id);

    if (error) {
      setActionError(error.message || t.updateFailed);
      setSavingItemId("");
      return;
    }

    setContentItems((current) => current.filter((item) => item.id !== itemId));
    setActionMessage(t.deleted);
    setSavingItemId("");
  }

  async function copySavedContent(item: ContentRow) {
    try {
      await navigator.clipboard.writeText(item.generated_content);
      setCopiedItemId(item.id);

      window.setTimeout(() => {
        setCopiedItemId("");
      }, 1800);
    } catch {
      setCopiedItemId("");
    }
  }

  async function copyGeneratedContent() {
    if (!generatedContent.trim()) return;

    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopiedGenerated(true);

      window.setTimeout(() => {
        setCopiedGenerated(false);
      }, 1800);
    } catch {
      setCopiedGenerated(false);
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
              onClick={() => {
                setReloadKey((value) => value + 1);
                loadCreditBalance();
              }}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
              {t.refresh}
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
                  card.dark
                    ? "border-[#7CFF3D] bg-[#07111F] text-white"
                    : "border-slate-200 bg-white text-[#07111F]"
                }`}
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    card.dark
                      ? "bg-[#7CFF3D] text-[#07111F]"
                      : "bg-[#07111F] text-[#7CFF3D]"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <p
                  className={`text-lg font-black ${
                    card.dark ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  {card.value}
                </p>

                <p
                  className={`mt-2 text-base font-semibold leading-7 ${
                    card.dark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {card.note}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Lightbulb className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.noteTitle}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.noteText}
              </h2>

              {creditBalance ? (
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                  {t.includedPlanCredits}: {planCredits.toLocaleString()} •{" "}
                  {t.topUpCredits}: {purchasedCredits.toLocaleString()} •{" "}
                  {t.creditsUsed}: {usedCredits.toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Wand2 className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {editingId ? t.editGeneratedTitle : t.createTitle}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.createText}
              </h2>
            </div>

            <form onSubmit={handleSaveContent} className="grid gap-5">
              <TextInput
                label={t.titleLabel}
                value={title}
                onChange={setTitle}
                placeholder={t.titlePlaceholder}
              />

              <SelectInput
                label={t.contentType}
                value={contentType}
                onChange={setContentType}
                options={contentTypeOptions}
              />

              <SelectInput
                label={t.purpose}
                value={contentPurpose}
                onChange={setContentPurpose}
                options={purposeOptions}
              />

              <SelectInput
                label={t.platform}
                value={platform}
                onChange={setPlatform}
                options={platformOptions}
              />

              <SelectInput
                label={t.language}
                value={entryLanguage}
                onChange={setEntryLanguage}
                options={languageOptions}
              />

              <SelectInput
                label={t.tone}
                value={tone}
                onChange={setTone}
                options={toneOptions}
              />

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.details}
                </span>

                <textarea
                  rows={5}
                  value={details}
                  maxLength={MAX_DETAILS_LENGTH + 100}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder={t.detailsPlaceholder}
                  className={`w-full rounded-2xl border px-5 py-4 text-lg font-semibold leading-8 outline-none transition ${
                    isDetailsTooLong
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 bg-[#F7F9FA] focus:border-blue-500 focus:bg-white"
                  }`}
                />

                <span
                  className={`text-sm font-black ${
                    isDetailsTooLong ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {detailsCount} / {MAX_DETAILS_LENGTH} {t.characters}
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.prompt}
                </span>

                <textarea
                  rows={5}
                  value={prompt}
                  maxLength={MAX_PROMPT_LENGTH + 100}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={t.promptPlaceholder}
                  className={`w-full rounded-2xl border px-5 py-4 text-lg font-semibold leading-8 outline-none transition ${
                    isPromptTooLong
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 bg-[#F7F9FA] focus:border-blue-500 focus:bg-white"
                  }`}
                />

                <span
                  className={`text-sm font-black ${
                    isPromptTooLong ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {promptCount} / {MAX_PROMPT_LENGTH} {t.characters}
                </span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleGenerateContent}
                  disabled={isGenerating || isDetailsTooLong || isPromptTooLong}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-8 py-5 text-lg font-black text-[#07111F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xl"
                >
                  <Wand2 className="h-6 w-6" />
                  {isGenerating
                    ? t.generating
                    : generatedContent
                      ? t.regenererateForCredit
                      : t.generateForCredit}
                </button>

                <button
                  type="button"
                  onClick={copyGeneratedContent}
                  disabled={!generatedContent.trim()}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-8 py-5 text-xl font-black text-[#07111F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Clipboard className="h-6 w-6" />
                  {copiedGenerated ? t.copied : t.copyGenerated}
                </button>
              </div>

              <button
                type="button"
                onClick={loadCreditBalance}
                disabled={isLoadingCredits}
                className="text-left text-sm font-black text-blue-600 disabled:opacity-50"
              >
                {isLoadingCredits ? t.loading : t.refreshCredits}
              </button>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.generatedContent}
                </span>

                <textarea
                  rows={12}
                  value={generatedContent}
                  maxLength={MAX_GENERATED_LENGTH + 200}
                  onChange={(event) => setGeneratedContent(event.target.value)}
                  placeholder={t.generatedPlaceholder}
                  className={`w-full rounded-2xl border px-5 py-4 text-lg font-semibold leading-8 outline-none transition ${
                    isContentTooLong
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 bg-[#F7F9FA] focus:border-blue-500 focus:bg-white"
                  }`}
                />

                <span
                  className={`text-sm font-black ${
                    isContentTooLong ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {contentCount} / {MAX_GENERATED_LENGTH} {t.characters}
                </span>
              </label>

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

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    isContentTooLong ||
                    isDetailsTooLong ||
                    isPromptTooLong
                  }
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-6 w-6" />
                  {isSaving
                    ? t.saving
                    : editingId
                      ? t.updateContent
                      : t.saveContent}
                </button>

                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-8 py-5 text-xl font-black text-[#07111F]"
                  >
                    {t.cancelEdit}
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Filter className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {t.savedTitle}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.savedText}
              </h2>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  {t.search}
                </span>

                <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5">
                  <Search className="h-5 w-5 text-slate-500" />

                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="h-full w-full bg-transparent text-lg font-semibold outline-none"
                  />
                </div>
              </label>

              <SelectInput
                label={t.filterType}
                value={filterType}
                onChange={setFilterType}
                options={[{ value: "all", label: t.allTypes }, ...contentTypeOptions]}
              />
            </div>

            {pageError ? (
              <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                <p className="text-base font-black">{pageError}</p>
              </div>
            ) : null}

            {isLoading ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6 text-lg font-black">
                {t.loading}
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                  <FileText className="h-8 w-8" />
                </div>

                <h3 className="text-4xl font-black tracking-[-0.05em]">
                  {t.noSaved}
                </h3>

                <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                  {t.noSavedText}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5">
                {filteredContent.map((item) => {
                  const isSavingItem = savingItemId === item.id;
                  const isCopied = copiedItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-5"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-2xl font-black tracking-[-0.04em]">
                              {item.title}
                            </h3>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge
                                text={getOptionLabel(
                                  t.contentTypeLabels,
                                  item.content_type
                                )}
                              />
                              <Badge
                                text={getOptionLabel(
                                  t.platformLabels,
                                  item.platform
                                )}
                              />
                              <Badge
                                text={getOptionLabel(
                                  t.languageLabels,
                                  item.language
                                )}
                              />
                              <Badge
                                text={getOptionLabel(t.toneLabels, item.tone)}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => copySavedContent(item)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-[#07111F]"
                            >
                              <Clipboard className="h-4 w-4" />
                              {isCopied ? t.copied : t.copy}
                            </button>

                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-[#07111F]"
                            >
                              <Edit3 className="h-4 w-4" />
                              {t.edit}
                            </button>

                            <button
                              type="button"
                              disabled={isSavingItem}
                              onClick={() => archiveContent(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-60"
                            >
                              {t.archive}
                            </button>

                            <button
                              type="button"
                              disabled={isSavingItem}
                              onClick={() => deleteContent(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t.delete}
                            </button>
                          </div>
                        </div>

                        <div className="rounded-3xl bg-white p-5">
                          <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                            {formatSavedTopic(item.topic, t)}
                          </p>

                          <p className="whitespace-pre-wrap text-base font-semibold leading-8 text-slate-700">
                            {item.generated_content}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
                          {t.updatedLabel}: {formatDate(item.updated_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-base font-black text-slate-700">{label}</span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-base font-black text-slate-700">{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-4 text-lg font-black outline-none transition focus:border-blue-500 focus:bg-white"
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