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
import { createClient } from "@/lib/supabase/client";
import { KOLKAP_GENERATE_KNOWLEDGE_CREDITS, getKolkapPlan } from "@/lib/kolkapPlan";
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
  { value: "manual", label: "Write business information" },
  { value: "generate_ai", label: "Generate with AI" },
  { value: "url", label: "Add important URL" },
];

const languageOptions: Option[] = [
  { value: "en", label: "English" },
];

const syncStatusOptions: Record<string, string> = {
  not_synced: "Not Synced",
  pending: "Pending",
  synced: "Synced",
  failed: "Failed",
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

  return date.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [entryLanguage, setEntryLanguage] = useState("en");
  const [tagsText, setTagsText] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [generationDetails, setGenerationDetails] = useState("");
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = useState(false);

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
      if (!workspace?.id) {
        setIsLoading(false);
        return;
      }

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
      const tags = Array.isArray(item.tags) ? item.tags : [];

      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.content.toLowerCase().includes(search) ||
        String(item.source_url || "").toLowerCase().includes(search) ||
        String(item.source_note || "").toLowerCase().includes(search) ||
        tags.some((tag) => tag.toLowerCase().includes(search));

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
      label: "Current Plan",
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: WalletCards,
    },
    {
      label: "Knowledge Items",
      value: `${knowledgeItems.length}`,
      note: `${filteredKnowledge.length} shown`,
      icon: BookOpen,
    },
    {
      label: "AI Ready",
      value: `${aiReadyCount}`,
      note: "Ready for AI",
      icon: Brain,
    },
  ];

  function resetForm() {
    setEditingId("");
    setSourceType("manual");
    setTitle("");
    setCategory("business_info");
    setEntryLanguage("en");
    setTagsText("");
    setContent("");
    setSourceUrl("");
    setSourceNote("");
    setGenerationDetails("");
    setActionError("");
  }

  function startEdit(item: KnowledgeRow) {
    setEditingId(item.id);
    setSourceType(item.source_type || "manual");
    setTitle(item.title);
    setCategory(item.category);
    setEntryLanguage("en");
    setTagsText((item.tags || []).join(", "));
    setContent(item.source_type === "url" ? "" : item.content);
    setSourceUrl(item.source_url || "");
    setSourceNote(item.source_note || "");
    setGenerationDetails("");
    setActionMessage("");
    setActionError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleGenerateKnowledge() {
    setActionMessage("");
    setActionError("");

    if (!workspace) {
      setActionError("Business knowledge could not be generated.");
      return;
    }

    if (!generationDetails.trim() || generationDetails.trim().length < 10) {
      setActionError("Please add details for the knowledge you want to generate.");
      return;
    }

    setIsGeneratingKnowledge(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/knowledge/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          workspace_id: workspace.id,
          title: title.trim(),
          category,
          language: "en",
          tags: tagsText,
          details: generationDetails.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        setActionError(
          result.error || "Business knowledge could not be generated."
        );
        setIsGeneratingKnowledge(false);
        return;
      }

      const generated = result.generated || {};

      setTitle(String(generated.title || title || "Generated Knowledge"));
      setCategory(String(generated.category || category || "custom_note"));
      setEntryLanguage("en");
      setTagsText(
        Array.isArray(generated.tags)
          ? generated.tags.join(", ")
          : String(generated.tags || tagsText || "")
      );
      setContent(String(generated.content || ""));
      setSourceUrl("");
      setSourceNote("");

      setActionMessage(
        `Generated knowledge is ready. ${result.credits_used || KOLKAP_GENERATE_KNOWLEDGE_CREDITS} credits have been used. Review it, edit if needed, then save.`
      );
    } catch (generateError) {
      setActionError(
        generateError instanceof Error
          ? generateError.message
          : "Business knowledge could not be generated."
      );
    } finally {
      setIsGeneratingKnowledge(false);
    }
  }

  async function handleSaveKnowledge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!workspace) {
      setActionError("Business knowledge could not be saved.");
      return;
    }

    if (!title.trim()) {
      setActionError(
        sourceType === "url"
          ? "Please add a title and important URL."
          : "Please add a title and business knowledge content."
      );
      return;
    }

    if (sourceType !== "url" && !content.trim()) {
      setActionError("Please add a title and business knowledge content.");
      return;
    }

    if (sourceType !== "url" && content.length > MAX_CONTENT_LENGTH) {
      setActionError("Business knowledge content must be 4,000 characters or less.");
      return;
    }

    if (sourceType === "url" && !sourceUrl.trim()) {
      setActionError("Please add a title and important URL.");
      return;
    }

    if (sourceType === "url" && !isValidUrl(sourceUrl)) {
      setActionError("Please add a valid URL starting with http:// or https://.");
      return;
    }

    if (sourceType === "url" && sourceNote.length > MAX_SOURCE_NOTE_LENGTH) {
      setActionError("URL note must be 1,000 characters or less.");
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

    const finalSourceType = sourceType === "url" ? "url" : "manual";

    const payload = {
      workspace_id: workspace.id,
      owner_user_id: workspace.owner_user_id,
      title: title.trim(),
      category,
      content: finalContent,
      priority: getCategoryPriority(category),
      ai_usage: "customer_answer",
      language: "en",
      tags: normalizeTags(tagsText),
      status: "active",
      source_type: finalSourceType,
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
        setActionError(error.message || "Business knowledge could not be updated.");
        setIsSaving(false);
        return;
      }

      setKnowledgeItems((current) =>
        current.map((item) =>
          item.id === editingId ? (data as KnowledgeRow) : item
        )
      );

      setActionMessage("Business knowledge updated successfully.");
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
      setActionError(error.message || "Business knowledge could not be saved.");
      setIsSaving(false);
      return;
    }

    setKnowledgeItems((current) => [data as KnowledgeRow, ...current]);
    setActionMessage("Business knowledge saved successfully.");
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
      setActionError(error.message || "Business knowledge could not be updated.");
      setSavingItemId("");
      return;
    }

    setKnowledgeItems((current) =>
      current.map((item) => (item.id === itemId ? (data as KnowledgeRow) : item))
    );

    setActionMessage("Business knowledge marked as reviewed.");
    setSavingItemId("");
  }

  async function deleteKnowledge(itemId: string) {
    if (!workspace) return;

    const shouldDelete = window.confirm("Delete this business knowledge item?");

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
      setActionError(error.message || "Business knowledge could not be deleted.");
      setSavingItemId("");
      return;
    }

    setKnowledgeItems((current) =>
      current.filter((item) => item.id !== itemId)
    );

    setActionMessage("Business knowledge deleted.");
    setSavingItemId("");
  }

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading your business knowledge...
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
            <p className="text-xl font-black">
              Business Knowledge could not load.
            </p>
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
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
              Refresh
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Brain className="h-5 w-5" />
            Business Knowledge
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Add the business knowledge your AI staff should use.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Save your services, prices, FAQs, policies, opening hours, handover
            rules, important links, and customer instructions so your AI staff
            can answer more accurately.
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
                Business Knowledge Tip
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                Keep each item specific. Add one item for pricing, one for
                refund policy, one for handover rules, one for services, and one
                for important company links.
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
                {editingId ? "Edit Business Knowledge" : "Add Business Knowledge"}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Write it manually, generate it with AI, or add an important company URL.
                Generated knowledge can be reviewed and edited before saving.
              </h2>
            </div>

            <form onSubmit={handleSaveKnowledge} className="grid gap-5">
              <SelectInput
                label="Information Type"
                value={sourceType}
                onChange={setSourceType}
                options={sourceTypeOptions}
              />

              <div
                className={`rounded-3xl border p-5 ${
                  sourceType === "generate_ai"
                    ? "border-purple-100 bg-purple-50 text-purple-950"
                    : sourceType === "url"
                      ? "border-blue-100 bg-blue-50 text-blue-950"
                      : "border-slate-200 bg-[#F7F9FA] text-slate-700"
                }`}
              >
                <p className="text-base font-black">
                  {sourceType === "generate_ai"
                    ? "Generate with AI"
                    : sourceType === "url"
                      ? "Add important URL"
                      : "Write business information"}
                </p>
                <p className="mt-2 text-sm font-bold leading-6">
                  {sourceType === "generate_ai"
                    ? `Use this when you want Kolkap to turn rough business notes into clean AI-ready knowledge. This uses ${KOLKAP_GENERATE_KNOWLEDGE_CREDITS} credits only after generation succeeds.`
                    : sourceType === "url"
                      ? "Use this when your business already has an official page, such as pricing, FAQ, terms, policy, or service page."
                      : "Use this when you want to write the business information directly."}
                </p>
              </div>

              {sourceType === "generate_ai" ? (
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    Tell Kolkap what knowledge to create
                  </span>

                  <textarea
                    rows={6}
                    value={generationDetails}
                    onChange={(event) => setGenerationDetails(event.target.value)}
                    placeholder="Example: We are a service business in Australia. We offer appointments, customer support, pricing information, and bookings. Customers can contact us by WhatsApp or Website Chat. Create knowledge for services, opening hours, booking rules, and handover rules."
                    className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-semibold leading-8 outline-none transition focus:border-blue-500 focus:bg-white"
                  />

                  <button
                    type="button"
                    onClick={handleGenerateKnowledge}
                    disabled={isGeneratingKnowledge || !generationDetails.trim()}
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-purple-600 px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className="h-6 w-6" />
                    {isGeneratingKnowledge
                      ? "Generating..."
                      : `Generate Knowledge with AI — ${KOLKAP_GENERATE_KNOWLEDGE_CREDITS} Credits`}
                  </button>

                  <p className="text-sm font-bold leading-6 text-slate-500">
                    Review the generated knowledge below before saving it.
                  </p>
                </label>
              ) : null}

              <TextInput
                label="Title"
                value={title}
                onChange={setTitle}
                placeholder="Example: Delivery Policy, Pricing Page, Common Questions"
              />

              <SelectInput
                label="Category"
                value={category}
                onChange={setCategory}
                options={categoryOptions}
              />

              <div className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Language
                </span>

                <div className="rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5 py-4 text-lg font-black text-[#07111F]">
                  English
                </div>
              </div>

              <TextInput
                label="Tags"
                value={tagsText}
                onChange={setTagsText}
                placeholder="Example: pricing, delivery, support"
              />

              {sourceType === "url" ? (
                <>
                  <TextInput
                    label="Important URL"
                    value={sourceUrl}
                    onChange={setSourceUrl}
                    placeholder="https://yourcompany.com/pricing"
                  />

                  <label className="grid gap-2">
                    <span className="text-base font-black text-slate-700">
                      How should the AI use this URL?
                    </span>

                    <textarea
                      rows={5}
                      value={sourceNote}
                      maxLength={MAX_SOURCE_NOTE_LENGTH + 100}
                      onChange={(event) => setSourceNote(event.target.value)}
                      placeholder="Example: AI should use this page when customers ask about prices, packages, subscription rules, or payment terms."
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
                      {noteCount} / {MAX_SOURCE_NOTE_LENGTH} characters
                    </span>
                  </label>
                </>
              ) : (
                <label className="grid gap-2">
                  <span className="text-base font-black text-slate-700">
                    Business Knowledge Content
                  </span>

                  <textarea
                    rows={10}
                    value={content}
                    maxLength={MAX_CONTENT_LENGTH + 200}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Write factual information about your business, services, location, pricing, policies, customer rules, opening hours, handover rules, and other details your AI staff should use when replying to customers."
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
                      {characterCount} / {MAX_CONTENT_LENGTH} characters
                    </span>

                    {isCloseToLimit ? (
                      <span className="text-sm font-black text-amber-600">
                        You are close to the 4,000 character limit.
                      </span>
                    ) : null}

                    {isOverLimit ? (
                      <span className="text-sm font-black text-red-600">
                        Business knowledge content must be 4,000 characters or
                        less.
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
                  disabled={isSaving || isGeneratingKnowledge || isOverLimit || isNoteOverLimit}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#07111F] px-8 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-6 w-6" />
                  {isSaving
                    ? "Saving..."
                    : editingId
                      ? "Update Business Knowledge"
                      : sourceType === "generate_ai"
                        ? "Save Generated Knowledge"
                        : "Save Business Knowledge"}
                </button>

                <Link
                  href="/education/knowledge-base-guide"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-8 py-5 text-xl font-black text-[#07111F] transition hover:-translate-y-0.5"
                >
                  <Sparkles className="h-6 w-6" />
                  See Sample Knowledge
                </Link>

                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-8 py-5 text-xl font-black text-[#07111F] sm:col-span-2"
                  >
                    Cancel Edit
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
                Saved Business Knowledge
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Manage the business information and important URLs your AI staff
                can use to answer customers correctly.
              </h2>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Search
                </span>

                <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#F7F9FA] px-5">
                  <Search className="h-5 w-5 text-slate-500" />

                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search business knowledge..."
                    className="h-full w-full bg-transparent text-lg font-semibold outline-none"
                  />
                </div>
              </label>

              <SelectInput
                label="Filter Category"
                value={filterCategory}
                onChange={setFilterCategory}
                options={[
                  { value: "all", label: "All Categories" },
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
                Loading business knowledge...
              </div>
            ) : filteredKnowledge.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                  <FileText className="h-8 w-8" />
                </div>

                <h3 className="text-4xl font-black tracking-[-0.05em]">
                  No business knowledge yet.
                </h3>

                <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                  Add your first item so your AI staff can start learning about
                  your business.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5">
                {filteredKnowledge.map((item) => {
                  const isSavingItem = savingItemId === item.id;
                  const tags = Array.isArray(item.tags) ? item.tags : [];

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
                                    ? "Add important URL"
                                    : "Write business information"
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
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={isSavingItem}
                              onClick={() => markReviewed(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-60"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Mark Reviewed
                            </button>

                            <button
                              type="button"
                              disabled={isSavingItem}
                              onClick={() => deleteKnowledge(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>

                        {item.source_type === "url" && item.source_url ? (
                          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                            <p className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-blue-700">
                              <Link2 className="h-4 w-4" />
                              Source
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
                                Sync Status:{" "}
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
                                Open URL
                              </a>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-base font-semibold leading-8 text-slate-700">
                            {item.content}
                          </p>
                        )}

                        {tags.length ? (
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
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
                          Last reviewed:{" "}
                          {formatDate(
                            item.last_reviewed_at,
                            "Not reviewed yet"
                          )}
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