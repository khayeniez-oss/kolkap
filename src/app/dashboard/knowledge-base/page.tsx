"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  Link2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useKolkapLanguage } from "@/app/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const MAX_CONTENT_LENGTH = 4000;
const MAX_SOURCE_NOTE_LENGTH = 1000;

type KnowledgeRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  title: string;
  category: string;
  content: string;
  priority: number;
  ai_usage: string;
  language: string;
  tags: string[];
  status: string;
  source_type: string;
  source_url: string | null;
  source_note: string | null;
  last_checked_at: string | null;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type Option = {
  value: string;
  label: string;
};

type KnowledgeText = {
  badge: string;
  title: string;
  subtitle: string;
  loading: string;
  failed: string;
  back: string;
  refresh: string;
  currentPlan: string;
  totalKnowledge: string;
  aiReady: string;
  addKnowledge: string;
  editKnowledge: string;
  addKnowledgeText: string;
  sampleButton: string;
  sourceType: string;
  writeInformation: string;
  addUrl: string;
  titleLabel: string;
  titlePlaceholder: string;
  category: string;
  language: string;
  tags: string;
  tagsPlaceholder: string;
  sourceUrl: string;
  sourceUrlPlaceholder: string;
  sourceNote: string;
  sourceNotePlaceholder: string;
  content: string;
  contentPlaceholder: string;
  saveKnowledge: string;
  updateKnowledge: string;
  saving: string;
  cancelEdit: string;
  saved: string;
  updated: string;
  deleted: string;
  reviewed: string;
  saveFailed: string;
  updateFailed: string;
  deleteConfirm: string;
  requiredFields: string;
  urlRequired: string;
  invalidUrl: string;
  tooLong: string;
  noteTooLong: string;
  closeToLimit: string;
  listTitle: string;
  listText: string;
  search: string;
  searchPlaceholder: string;
  filterCategory: string;
  allCategories: string;
  noKnowledge: string;
  noKnowledgeText: string;
  reviewNow: string;
  edit: string;
  delete: string;
  characters: string;
  aiNote: string;
  aiNoteText: string;
  shown: string;
  aiReadyNote: string;
  lastReviewed: string;
  notReviewed: string;
  syncStatus: string;
  source: string;
  openUrl: string;
  manualNote: string;
  urlNote: string;
};

const categoryOptions: Option[] = [
  { value: "business_info", label: "Business Information" },
  { value: "faq", label: "FAQ" },
  { value: "product_service", label: "Product / Service" },
  { value: "pricing", label: "Pricing / Packages" },
  { value: "policy", label: "Policy" },
  { value: "sales_instruction", label: "Sales Instruction" },
  { value: "handover_rule", label: "Handover Rule" },
  { value: "do_not_say", label: "Do Not Say" },
  { value: "important_link", label: "Important Link" },
  { value: "custom_note", label: "Custom Note" },
];

const sourceTypeOptions: Option[] = [
  { value: "manual", label: "Write Information" },
  { value: "url", label: "Add Important URL" },
];

const languageOptions: Option[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "id", label: "Indonesian" },
  { value: "ms", label: "Malay" },
  { value: "auto", label: "Auto Detect" },
];

const syncStatusOptions: Record<string, string> = {
  not_synced: "Not Synced",
  pending: "Pending",
  synced: "Synced",
  failed: "Failed",
};

const translations: Record<string, KnowledgeText> = {
  en: {
    badge: "Knowledge Base",
    title: "Add business information your AI can trust.",
    subtitle:
      "Knowledge Base is where you add important facts and important URLs about your company, services, pricing, policies, location, and customer rules so your AI can answer correctly.",
    loading: "Loading your knowledge base...",
    failed: "Knowledge Base could not load.",
    back: "Back to Dashboard",
    refresh: "Refresh",
    currentPlan: "Current Plan",
    totalKnowledge: "Knowledge Items",
    aiReady: "AI Ready",
    addKnowledge: "Add Knowledge",
    editKnowledge: "Edit Knowledge",
    addKnowledgeText:
      "Choose whether to write business information directly or add an important company URL. Each written entry can have up to 4,000 characters.",
    sampleButton: "See Sample Knowledge",
    sourceType: "Knowledge Source",
    writeInformation: "Write Information",
    addUrl: "Add Important URL",
    titleLabel: "Title",
    titlePlaceholder: "Example: Delivery Policy, Pricing Page, Common Questions",
    category: "Category",
    language: "Language",
    tags: "Tags",
    tagsPlaceholder: "Example: pricing, delivery, support",
    sourceUrl: "Important URL",
    sourceUrlPlaceholder: "https://yourcompany.com/pricing",
    sourceNote: "What should the AI use this URL for?",
    sourceNotePlaceholder:
      "Example: AI should use this page when customers ask about prices, packages, subscription rules, or payment terms.",
    content: "Knowledge Content",
    contentPlaceholder:
      "Write factual information about your business, properties, services, location, pricing, policies, customer rules, and other details your AI should use to answer customers correctly.",
    saveKnowledge: "Save Knowledge",
    updateKnowledge: "Update Knowledge",
    saving: "Saving...",
    cancelEdit: "Cancel Edit",
    saved: "Knowledge saved successfully.",
    updated: "Knowledge updated successfully.",
    deleted: "Knowledge deleted.",
    reviewed: "Knowledge marked as reviewed.",
    saveFailed: "Knowledge could not be saved.",
    updateFailed: "Knowledge could not be updated.",
    deleteConfirm: "Delete this knowledge item?",
    requiredFields: "Please add a title and knowledge content.",
    urlRequired: "Please add a title and important URL.",
    invalidUrl: "Please add a valid URL starting with http:// or https://.",
    tooLong: "Knowledge content must be 4,000 characters or less.",
    noteTooLong: "URL note must be 1,000 characters or less.",
    closeToLimit: "You are close to the 4,000 character limit.",
    listTitle: "Saved Knowledge",
    listText:
      "Manage the business information and important URLs your AI can use to answer customers correctly.",
    search: "Search",
    searchPlaceholder: "Search knowledge...",
    filterCategory: "Filter Category",
    allCategories: "All Categories",
    noKnowledge: "No knowledge yet.",
    noKnowledgeText:
      "Add your first knowledge item so your AI can start learning about your business.",
    reviewNow: "Mark Reviewed",
    edit: "Edit",
    delete: "Delete",
    characters: "characters",
    aiNote: "AI Brain Note",
    aiNoteText:
      "Keep each knowledge item specific. For example: one item for pricing, one item for refund policy, one item for handover rules, and one item for important company URLs.",
    shown: "shown",
    aiReadyNote: "Ready for AI",
    lastReviewed: "Last reviewed",
    notReviewed: "Not reviewed yet",
    syncStatus: "Sync Status",
    source: "Source",
    openUrl: "Open URL",
    manualNote:
      "Use this when you want to write the business information directly.",
    urlNote:
      "Use this when the business already has an official page, such as pricing, FAQ, terms, policy, or service page.",
  },

  id: {
    badge: "Knowledge Base",
    title: "Tambahkan informasi bisnis yang bisa dipercaya AI.",
    subtitle:
      "Knowledge Base adalah tempat Anda menambahkan fakta penting dan URL penting tentang perusahaan, layanan, pricing, policy, lokasi, dan aturan customer agar AI bisa menjawab dengan benar.",
    loading: "Memuat knowledge base Anda...",
    failed: "Knowledge Base gagal dimuat.",
    back: "Kembali ke Dashboard",
    refresh: "Refresh",
    currentPlan: "Paket Saat Ini",
    totalKnowledge: "Knowledge Items",
    aiReady: "AI Ready",
    addKnowledge: "Add Knowledge",
    editKnowledge: "Edit Knowledge",
    addKnowledgeText:
      "Pilih apakah ingin menulis informasi bisnis langsung atau menambahkan URL penting perusahaan. Setiap written entry maksimal 4.000 karakter.",
    sampleButton: "See Sample Knowledge",
    sourceType: "Knowledge Source",
    writeInformation: "Write Information",
    addUrl: "Add Important URL",
    titleLabel: "Judul",
    titlePlaceholder: "Contoh: Delivery Policy, Pricing Page, Common Questions",
    category: "Category",
    language: "Language",
    tags: "Tags",
    tagsPlaceholder: "Contoh: pricing, delivery, support",
    sourceUrl: "Important URL",
    sourceUrlPlaceholder: "https://yourcompany.com/pricing",
    sourceNote: "AI harus menggunakan URL ini untuk apa?",
    sourceNotePlaceholder:
      "Contoh: AI harus menggunakan halaman ini saat customer bertanya tentang harga, paket, subscription rules, atau payment terms.",
    content: "Knowledge Content",
    contentPlaceholder:
      "Tulis informasi faktual tentang bisnis, properti, layanan, lokasi, pricing, policy, aturan customer, dan detail penting lain yang harus digunakan AI untuk menjawab customer dengan benar.",
    saveKnowledge: "Save Knowledge",
    updateKnowledge: "Update Knowledge",
    saving: "Menyimpan...",
    cancelEdit: "Cancel Edit",
    saved: "Knowledge berhasil disimpan.",
    updated: "Knowledge berhasil diperbarui.",
    deleted: "Knowledge berhasil dihapus.",
    reviewed: "Knowledge sudah ditandai reviewed.",
    saveFailed: "Knowledge gagal disimpan.",
    updateFailed: "Knowledge gagal diperbarui.",
    deleteConfirm: "Hapus knowledge item ini?",
    requiredFields: "Mohon isi judul dan knowledge content.",
    urlRequired: "Mohon isi judul dan important URL.",
    invalidUrl: "Mohon masukkan URL valid yang dimulai dengan http:// atau https://.",
    tooLong: "Knowledge content maksimal 4.000 karakter.",
    noteTooLong: "URL note maksimal 1.000 karakter.",
    closeToLimit: "Anda hampir mencapai limit 4.000 karakter.",
    listTitle: "Saved Knowledge",
    listText:
      "Kelola informasi bisnis dan URL penting yang bisa digunakan AI untuk menjawab customer dengan benar.",
    search: "Search",
    searchPlaceholder: "Cari knowledge...",
    filterCategory: "Filter Category",
    allCategories: "Semua Category",
    noKnowledge: "Belum ada knowledge.",
    noKnowledgeText:
      "Tambahkan knowledge pertama agar AI mulai memahami bisnis Anda.",
    reviewNow: "Mark Reviewed",
    edit: "Edit",
    delete: "Delete",
    characters: "characters",
    aiNote: "AI Brain Note",
    aiNoteText:
      "Buat setiap knowledge item secara spesifik. Contoh: satu item untuk pricing, satu item untuk refund policy, satu item untuk handover rules, dan satu item untuk URL penting perusahaan.",
    shown: "ditampilkan",
    aiReadyNote: "Ready for AI",
    lastReviewed: "Last reviewed",
    notReviewed: "Belum direview",
    syncStatus: "Sync Status",
    source: "Source",
    openUrl: "Open URL",
    manualNote:
      "Gunakan ini jika Anda ingin menulis informasi bisnis secara langsung.",
    urlNote:
      "Gunakan ini jika bisnis sudah memiliki halaman resmi seperti pricing, FAQ, terms, policy, atau service page.",
  },
};

function getOptionLabel(options: Option[], value: string) {
  return options.find((option) => option.value === value)?.label || value;
}

function normalizeTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function formatDate(value: string | null, fallback: string) {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString();
}

function isValidUrl(value: string) {
  return /^https?:\/\/.+/i.test(value.trim());
}

function getCategoryPriority(category: string) {
  if (category === "do_not_say") return 1;
  if (category === "handover_rule") return 1;
  if (category === "policy") return 2;
  if (category === "pricing") return 2;
  if (category === "product_service") return 3;
  if (category === "faq") return 3;
  if (category === "sales_instruction") return 3;
  if (category === "important_link") return 3;
  if (category === "business_info") return 4;
  return 4;
}

export default function KnowledgeBasePage() {
  const { language } = useKolkapLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [editingId, setEditingId] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("business_info");
  const [entryLanguage, setEntryLanguage] = useState("auto");
  const [tagsText, setTagsText] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceNote, setSourceNote] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [isSaving, setIsSaving] = useState(false);
  const [savingItemId, setSavingItemId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const characterCount = content.length;
  const noteCount = sourceNote.length;

  const isOverLimit = characterCount > MAX_CONTENT_LENGTH;
  const isCloseToLimit =
    characterCount >= 3700 && characterCount <= MAX_CONTENT_LENGTH;
  const isNoteOverLimit = noteCount > MAX_SOURCE_NOTE_LENGTH;

  useEffect(() => {
    let isMounted = true;

    async function loadKnowledge() {
      if (!workspace) return;

      setIsLoading(true);
      setPageError("");

      const supabase = createClient();

      const { data, error } = await supabase
        .from("workspace_knowledge_base")
        .select("*")
        .eq("workspace_id", workspace.id)
        .neq("status", "archived")
        .order("priority", { ascending: true })
        .order("updated_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setPageError(error.message);
        setIsLoading(false);
        return;
      }

      setKnowledgeItems((data ?? []) as KnowledgeRow[]);
      setIsLoading(false);
    }

    loadKnowledge();

    return () => {
      isMounted = false;
    };
  }, [workspace, reloadKey]);

  const filteredKnowledge = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return knowledgeItems.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.content.toLowerCase().includes(search) ||
        String(item.source_url || "").toLowerCase().includes(search) ||
        String(item.source_note || "").toLowerCase().includes(search) ||
        item.tags.some((tag) => tag.toLowerCase().includes(search));

      const matchesCategory =
        filterCategory === "all" || item.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [knowledgeItems, searchTerm, filterCategory]);

  const aiReadyCount = knowledgeItems.filter(
    (item) => item.status === "active"
  ).length;

  const summaryCards = [
    {
      label: t.currentPlan,
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: t.totalKnowledge,
      value: `${knowledgeItems.length}`,
      note: `${filteredKnowledge.length} ${t.shown}`,
      icon: BookOpen,
    },
    {
      label: t.aiReady,
      value: `${aiReadyCount}`,
      note: t.aiReadyNote,
      icon: Brain,
    },
  ];

  function resetForm() {
    setEditingId("");
    setSourceType("manual");
    setTitle("");
    setCategory("business_info");
    setEntryLanguage("auto");
    setTagsText("");
    setContent("");
    setSourceUrl("");
    setSourceNote("");
    setActionError("");
  }

  function startEdit(item: KnowledgeRow) {
    setEditingId(item.id);
    setSourceType(item.source_type || "manual");
    setTitle(item.title);
    setCategory(item.category);
    setEntryLanguage(item.language || "auto");
    setTagsText((item.tags || []).join(", "));
    setContent(item.source_type === "url" ? "" : item.content);
    setSourceUrl(item.source_url || "");
    setSourceNote(item.source_note || "");
    setActionMessage("");
    setActionError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSaveKnowledge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!workspace) {
      setActionError(t.saveFailed);
      return;
    }

    if (!title.trim()) {
      setActionError(
        sourceType === "url" ? t.urlRequired : t.requiredFields
      );
      return;
    }

    if (sourceType === "manual" && !content.trim()) {
      setActionError(t.requiredFields);
      return;
    }

    if (sourceType === "manual" && content.length > MAX_CONTENT_LENGTH) {
      setActionError(t.tooLong);
      return;
    }

    if (sourceType === "url" && !sourceUrl.trim()) {
      setActionError(t.urlRequired);
      return;
    }

    if (sourceType === "url" && !isValidUrl(sourceUrl)) {
      setActionError(t.invalidUrl);
      return;
    }

    if (sourceType === "url" && sourceNote.length > MAX_SOURCE_NOTE_LENGTH) {
      setActionError(t.noteTooLong);
      return;
    }

    setIsSaving(true);

    const supabase = createClient();
    const now = new Date().toISOString();

    const cleanUrl = sourceUrl.trim();
    const cleanNote = sourceNote.trim();

    const finalContent =
      sourceType === "url"
        ? cleanNote ||
          `Important company URL: ${cleanUrl}. AI should use this official page when answering related customer questions.`
        : content.trim();

    const payload = {
      workspace_id: workspace.id,
      owner_user_id: workspace.owner_user_id,
      title: title.trim(),
      category,
      content: finalContent,
      priority: getCategoryPriority(category),
      ai_usage: "customer_answer",
      language: entryLanguage,
      tags: normalizeTags(tagsText),
      status: "active",
      source_type: sourceType,
      source_url: sourceType === "url" ? cleanUrl : null,
      source_note: sourceType === "url" ? cleanNote || null : null,
      sync_status: "not_synced",
      updated_at: now,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("workspace_knowledge_base")
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

      setKnowledgeItems((current) =>
        current.map((item) =>
          item.id === editingId ? (data as KnowledgeRow) : item
        )
      );

      setActionMessage(t.updated);
      resetForm();
      setIsSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("workspace_knowledge_base")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      setActionError(error.message || t.saveFailed);
      setIsSaving(false);
      return;
    }

    setKnowledgeItems((current) => [data as KnowledgeRow, ...current]);
    setActionMessage(t.saved);
    resetForm();
    setIsSaving(false);
  }

  async function markReviewed(itemId: string) {
    if (!workspace) return;

    setActionMessage("");
    setActionError("");
    setSavingItemId(itemId);

    const supabase = createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("workspace_knowledge_base")
      .update({
        last_reviewed_at: now,
        updated_at: now,
      })
      .eq("id", itemId)
      .eq("workspace_id", workspace.id)
      .select("*")
      .single();

    if (error) {
      setActionError(error.message || t.updateFailed);
      setSavingItemId("");
      return;
    }

    setKnowledgeItems((current) =>
      current.map((item) => (item.id === itemId ? (data as KnowledgeRow) : item))
    );

    setActionMessage(t.reviewed);
    setSavingItemId("");
  }

  async function deleteKnowledge(itemId: string) {
    if (!workspace) return;

    const shouldDelete = window.confirm(t.deleteConfirm);

    if (!shouldDelete) return;

    setActionMessage("");
    setActionError("");
    setSavingItemId(itemId);

    const supabase = createClient();

    const { error } = await supabase
      .from("workspace_knowledge_base")
      .delete()
      .eq("id", itemId)
      .eq("workspace_id", workspace.id);

    if (error) {
      setActionError(error.message || t.updateFailed);
      setSavingItemId("");
      return;
    }

    setKnowledgeItems((current) =>
      current.filter((item) => item.id !== itemId)
    );

    setActionMessage(t.deleted);
    setSavingItemId("");
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
            <Brain className="h-5 w-5" />
            {t.badge}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Sparkles className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                {t.aiNote}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                {t.aiNoteText}
              </h2>
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07111F] text-[#7CFF3D]">
                <Plus className="h-8 w-8" />
              </div>

              <p className="text-lg font-black uppercase tracking-[0.18em] text-blue-600">
                {editingId ? t.editKnowledge : t.addKnowledge}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.addKnowledgeText}
              </h2>
            </div>

            <form onSubmit={handleSaveKnowledge} className="grid gap-5">
              <SelectInput
                label={t.sourceType}
                value={sourceType}
                onChange={setSourceType}
                options={sourceTypeOptions}
              />

              <div
                className={`rounded-3xl border p-5 ${
                  sourceType === "url"
                    ? "border-blue-100 bg-blue-50 text-blue-950"
                    : "border-slate-200 bg-[#F7F9FA] text-slate-700"
                }`}
              >
                <p className="text-base font-black">
                  {sourceType === "url" ? t.addUrl : t.writeInformation}
                </p>
                <p className="mt-2 text-sm font-bold leading-6">
                  {sourceType === "url" ? t.urlNote : t.manualNote}
                </p>
              </div>

              <TextInput
                label={t.titleLabel}
                value={title}
                onChange={setTitle}
                placeholder={t.titlePlaceholder}
              />

              <SelectInput
                label={t.category}
                value={category}
                onChange={setCategory}
                options={categoryOptions}
              />

              <SelectInput
                label={t.language}
                value={entryLanguage}
                onChange={setEntryLanguage}
                options={languageOptions}
              />

              <TextInput
                label={t.tags}
                value={tagsText}
                onChange={setTagsText}
                placeholder={t.tagsPlaceholder}
              />

              {sourceType === "url" ? (
                <>
                  <TextInput
                    label={t.sourceUrl}
                    value={sourceUrl}
                    onChange={setSourceUrl}
                    placeholder={t.sourceUrlPlaceholder}
                  />

                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      {t.sourceNote}
                    </span>

                    <textarea
                      rows={5}
                      value={sourceNote}
                      maxLength={MAX_SOURCE_NOTE_LENGTH + 100}
                      onChange={(event) => setSourceNote(event.target.value)}
                      placeholder={t.sourceNotePlaceholder}
                      className={`w-full rounded-2xl border px-5 py-4 text-lg font-semibold leading-8 outline-none transition ${
                        isNoteOverLimit
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-[#F7F9FA] focus:border-blue-500 focus:bg-white"
                      }`}
                    />

                    <span
                      className={`text-sm font-black ${
                        isNoteOverLimit ? "text-red-600" : "text-slate-500"
                      }`}
                    >
                      {noteCount} / {MAX_SOURCE_NOTE_LENGTH} {t.characters}
                    </span>
                  </label>
                </>
              ) : (
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    {t.content}
                  </span>

                  <textarea
                    rows={10}
                    value={content}
                    maxLength={MAX_CONTENT_LENGTH + 200}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder={t.contentPlaceholder}
                    className={`w-full rounded-2xl border px-5 py-4 text-lg font-semibold leading-8 outline-none transition ${
                      isOverLimit
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-[#F7F9FA] focus:border-blue-500 focus:bg-white"
                    }`}
                  />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span
                      className={`text-sm font-black ${
                        isOverLimit
                          ? "text-red-600"
                          : isCloseToLimit
                            ? "text-amber-600"
                            : "text-slate-500"
                      }`}
                    >
                      {characterCount} / {MAX_CONTENT_LENGTH} {t.characters}
                    </span>

                    {isCloseToLimit ? (
                      <span className="text-sm font-black text-amber-600">
                        {t.closeToLimit}
                      </span>
                    ) : null}

                    {isOverLimit ? (
                      <span className="text-sm font-black text-red-600">
                        {t.tooLong}
                      </span>
                    ) : null}
                  </div>
                </label>
              )}

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
                  disabled={isSaving || isOverLimit || isNoteOverLimit}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-6 w-6" />
                  {isSaving
                    ? t.saving
                    : editingId
                      ? t.updateKnowledge
                      : t.saveKnowledge}
                </button>

                <Link
                  href="/education/knowledge-base-guide"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-8 py-5 text-xl font-black text-[#07111F] transition hover:-translate-y-0.5"
                >
                  <Sparkles className="h-6 w-6" />
                  {t.sampleButton}
                </Link>

                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-8 py-5 text-xl font-black text-[#07111F] sm:col-span-2"
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
                {t.listTitle}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {t.listText}
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
                label={t.filterCategory}
                value={filterCategory}
                onChange={setFilterCategory}
                options={[
                  { value: "all", label: t.allCategories },
                  ...categoryOptions,
                ]}
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
            ) : filteredKnowledge.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                  <FileText className="h-8 w-8" />
                </div>

                <h3 className="text-4xl font-black tracking-[-0.05em]">
                  {t.noKnowledge}
                </h3>

                <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                  {t.noKnowledgeText}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5">
                {filteredKnowledge.map((item) => {
                  const isSavingItem = savingItemId === item.id;

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
                                text={
                                  item.source_type === "url"
                                    ? t.addUrl
                                    : t.writeInformation
                                }
                              />
                              <Badge
                                text={getOptionLabel(
                                  categoryOptions,
                                  item.category
                                )}
                              />
                              <Badge
                                text={getOptionLabel(
                                  languageOptions,
                                  item.language
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
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
                              onClick={() => markReviewed(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-60"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              {t.reviewNow}
                            </button>

                            <button
                              type="button"
                              disabled={isSavingItem}
                              onClick={() => deleteKnowledge(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t.delete}
                            </button>
                          </div>
                        </div>

                        {item.source_type === "url" && item.source_url ? (
                          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                            <p className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-blue-700">
                              <Link2 className="h-4 w-4" />
                              {t.source}
                            </p>

                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex break-all text-lg font-black text-blue-700 hover:underline"
                            >
                              {item.source_url}
                            </a>

                            {item.source_note ? (
                              <p className="mt-4 whitespace-pre-wrap text-base font-semibold leading-8 text-slate-700">
                                {item.source_note}
                              </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-blue-700">
                                {t.syncStatus}:{" "}
                                {syncStatusOptions[item.sync_status] ||
                                  item.sync_status}
                              </span>

                              <a
                                href={item.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-blue-700"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {t.openUrl}
                              </a>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-base font-semibold leading-8 text-slate-700">
                            {item.content}
                          </p>
                        )}

                        {item.tags?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600"
                              >
                                <Tags className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
                          {t.lastReviewed}:{" "}
                          {formatDate(item.last_reviewed_at, t.notReviewed)}
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