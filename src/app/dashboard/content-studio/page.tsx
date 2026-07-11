"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { getKolkapPlan } from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const MAX_GENERATED_LENGTH = 8000;
const MAX_DETAILS_LENGTH = 420;
const MAX_PROMPT_LENGTH = 2000;
const CONTENT_GENERATION_CREDIT_COST = 10;

type WorkspaceRow = {
  id: string;
  owner_user_id: string;
};

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

const contentTypeOptions: Option[] = [
  { value: "social_caption", label: "Social Media Caption" },
  { value: "instagram_caption", label: "Instagram Caption" },
  { value: "facebook_post", label: "Facebook Post" },
  { value: "whatsapp_broadcast", label: "WhatsApp Broadcast" },
  { value: "promo_announcement", label: "Promo Announcement" },
  { value: "product_description", label: "Product Description" },
  { value: "service_description", label: "Service Description" },
  { value: "customer_reply", label: "Customer Reply" },
  { value: "faq_answer", label: "FAQ Answer" },
  { value: "ad_copy", label: "Ad Copy" },
  { value: "blog_idea", label: "Blog Idea" },
  { value: "reel_script", label: "Reel Script" },
  { value: "video_script", label: "Video Script" },
  { value: "custom", label: "Custom Content" },
];

const purposeOptions: Option[] = [
  { value: "promotion", label: "Promotion" },
  { value: "introduction", label: "Introduction" },
  { value: "sales", label: "Sales" },
  { value: "announcement", label: "Announcement" },
  { value: "education", label: "Education" },
  { value: "follow_up", label: "Follow-up" },
  { value: "reminder", label: "Reminder" },
  { value: "launch", label: "Launch" },
  { value: "event", label: "Event" },
  { value: "custom", label: "Custom" },
];

const platformOptions: Option[] = [
  { value: "general", label: "General" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website" },
  { value: "blog", label: "Blog" },
  { value: "ads", label: "Ads" },
];

const languageOptions: Option[] = [
  { value: "auto", label: "Auto Detect" },
  { value: "en", label: "English" },
  { value: "id", label: "Indonesian" },
  { value: "ms", label: "Malay" },
  { value: "zh", label: "Chinese" },
];

const toneOptions: Option[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "sales", label: "Sales" },
  { value: "simple", label: "Simple" },
  { value: "luxury", label: "Luxury" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "urgent", label: "Urgent" },
  { value: "educational", label: "Educational" },
];

function getOptionLabel(options: Option[], value: string) {
  return (
    options.find((option) => option.value === value)?.label ||
    String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function makeSavedTopic(contentPurpose: string, details: string) {
  return `${contentPurpose}: ${details.trim()}`;
}

function extractPurposeAndDetails(savedTopic: string) {
  const matchedValue = purposeOptions.find((purpose) =>
    savedTopic.startsWith(`${purpose.value}:`)
  );

  if (matchedValue) {
    return {
      purpose: matchedValue.value,
      details: savedTopic.replace(`${matchedValue.value}:`, "").trim(),
    };
  }

  const matchedLabel = purposeOptions.find((purpose) =>
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

function formatSavedTopic(savedTopic: string) {
  const extracted = extractPurposeAndDetails(savedTopic);

  return `${getOptionLabel(purposeOptions, extracted.purpose)}: ${
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

export default function ContentStudioPage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace as WorkspaceRow | null;
  const currentPlan = getKolkapPlan(workspaceState.planKey);

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
      if (!workspace?.id) return;

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
  }, [workspace?.id, reloadKey]);

  useEffect(() => {
    loadCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const filteredContent = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return contentItems.filter((item) => {
      const contentTypeLabel = getOptionLabel(
        contentTypeOptions,
        item.content_type
      ).toLowerCase();

      const topicLabel = formatSavedTopic(item.topic).toLowerCase();

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
  }, [contentItems, searchTerm, filterType]);

  const uniqueTypes = new Set(contentItems.map((item) => item.content_type)).size;

  const summaryCards = [
    {
      label: "Current Plan",
      value: currentPlan.name,
      note: currentPlan.priceLabel,
      icon: <WalletCards className="h-7 w-7" />,
    },
    {
      label: "Credits Left",
      value: creditsLeft === null ? "—" : creditsLeft.toLocaleString(),
      note: creditBalance
        ? `Credits used: ${usedCredits.toLocaleString()}`
        : "Credit balance not found yet.",
      icon: <CreditCard className="h-7 w-7" />,
      dark: true,
    },
    {
      label: "Credit Cost",
      value: `${CONTENT_GENERATION_CREDIT_COST} Credits`,
      note: "Every successful content generation uses 10 credits.",
      icon: <Zap className="h-7 w-7" />,
    },
    {
      label: "Saved Content",
      value: `${contentItems.length}`,
      note: `${filteredContent.length} shown`,
      icon: <FileText className="h-7 w-7" />,
    },
    {
      label: "Content Types",
      value: `${uniqueTypes}`,
      note: "Different formats",
      icon: <Megaphone className="h-7 w-7" />,
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
      setActionError("Please write the main details first.");
      return;
    }

    if (details.length > MAX_DETAILS_LENGTH) {
      setActionError("Main details must be 420 characters or less.");
      return;
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      setActionError("Extra instructions must be 2,000 characters or less.");
      return;
    }

    if (creditsLeft !== null && creditsLeft < CONTENT_GENERATION_CREDIT_COST) {
      setActionError(
        "Not enough credits. Please top up credits before generating more content."
      );
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
          ui_language: "en",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setActionError(result.error || "Content could not be generated.");
        setIsGenerating(false);
        return;
      }

      setGeneratedContent(result.content || "");

      if (!title.trim()) {
        setTitle(
          `${getOptionLabel(purposeOptions, contentPurpose)} - ${getOptionLabel(
            contentTypeOptions,
            contentType
          )}`
        );
      }

      if (result.business_name) {
        const knowledgeText =
          typeof result.knowledge_count === "number"
            ? ` ${result.knowledge_count} knowledge item(s) used.`
            : "";

        setActionMessage(
          `Content generated for ${result.business_name}.${knowledgeText} 10 credits have been used. Please review and edit before saving.`
        );
      } else {
        setActionMessage(
          "Content generated using your business context. 10 credits have been used. Please review and edit before saving."
        );
      }

      await loadCreditBalance();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Content could not be generated.";

      setActionError(message);
    }

    setIsGenerating(false);
  }

  async function handleSaveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionMessage("");
    setActionError("");

    if (!workspace?.id) {
      setActionError("Content could not be saved.");
      return;
    }

    if (!title.trim() || !details.trim() || !generatedContent.trim()) {
      setActionError("Please add a title, main details, and generated content.");
      return;
    }

    if (details.length > MAX_DETAILS_LENGTH) {
      setActionError("Main details must be 420 characters or less.");
      return;
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      setActionError("Extra instructions must be 2,000 characters or less.");
      return;
    }

    if (generatedContent.length > MAX_GENERATED_LENGTH) {
      setActionError("Generated content must be 8,000 characters or less.");
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
        setActionError(error.message || "Content could not be updated.");
        setIsSaving(false);
        return;
      }

      setContentItems((current) =>
        current.map((item) =>
          item.id === editingId ? (data as ContentRow) : item
        )
      );

      setActionMessage("Content updated successfully.");
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
      setActionError(error.message || "Content could not be saved.");
      setIsSaving(false);
      return;
    }

    setContentItems((current) => [data as ContentRow, ...current]);
    setActionMessage("Content saved successfully.");
    resetForm();
    setIsSaving(false);
  }

  async function archiveContent(itemId: string) {
    if (!workspace?.id) return;

    const shouldArchive = window.confirm("Archive this content?");

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
      setActionError(error.message || "Content could not be updated.");
      setSavingItemId("");
      return;
    }

    setContentItems((current) => current.filter((item) => item.id !== itemId));
    setActionMessage("Content archived.");
    setSavingItemId("");
  }

  async function deleteContent(itemId: string) {
    if (!workspace?.id) return;

    const shouldDelete = window.confirm("Delete this content?");

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
      setActionError(error.message || "Content could not be updated.");
      setSavingItemId("");
      return;
    }

    setContentItems((current) => current.filter((item) => item.id !== itemId));
    setActionMessage("Content deleted.");
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
            Loading your content studio...
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
            <p className="text-xl font-black">Content Studio could not load.</p>
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
              onClick={() => {
                setReloadKey((value) => value + 1);
                loadCreditBalance();
              }}
              className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-base font-black text-white transition hover:bg-white/10"
            >
              <RefreshCcw className="h-5 w-5" />
              Refresh
            </button>
          </div>

          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-lg font-black text-[#7CFF3D]">
            <Sparkles className="h-5 w-5" />
            Content Studio
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Generate ready-to-use content for your business.
          </h1>

          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-slate-300">
            Create captions, WhatsApp messages, announcements, customer replies,
            product descriptions, ad copy, blog ideas, and short scripts using
            your business profile and Knowledge Base.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              note={card.note}
              dark={card.dark}
            />
          ))}
        </div>

        <section className="mb-8 rounded-[2.2rem] bg-[#07111F] p-7 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7CFF3D] text-[#07111F]">
              <Lightbulb className="h-8 w-8" />
            </div>

            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-[#7CFF3D]">
                How this works
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                Content Studio uses your logged-in business profile, saved
                Knowledge Base, and your instructions to create business-specific
                content. Each successful generation uses 5 credits.
              </h2>

              {creditBalance ? (
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                  Included plan credits: {planCredits.toLocaleString()} • Top-Up
                  credits: {purchasedCredits.toLocaleString()} • Credits used:{" "}
                  {usedCredits.toLocaleString()}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard/top-up"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#7CFF3D] px-6 py-4 text-base font-black text-[#07111F]"
                >
                  Top Up Credits
                </Link>

                <Link
                  href="/dashboard/usage"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-base font-black text-white"
                >
                  View Usage
                </Link>
              </div>
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
                {editingId ? "Edit Generated Content" : "Content Generator"}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Choose the format, purpose, and details. Kolkap will generate
                content based on your logged-in business and Knowledge Base.
              </h2>
            </div>

            <form onSubmit={handleSaveContent} className="grid gap-5">
              <TextInput
                label="Content Title"
                value={title}
                onChange={setTitle}
                placeholder="Example: June Promotion WhatsApp Message"
              />

              <SelectInput
                label="Content Format"
                value={contentType}
                onChange={setContentType}
                options={contentTypeOptions}
              />

              <SelectInput
                label="Content Purpose"
                value={contentPurpose}
                onChange={setContentPurpose}
                options={purposeOptions}
              />

              <SelectInput
                label="Where will you use it?"
                value={platform}
                onChange={setPlatform}
                options={platformOptions}
              />

              <SelectInput
                label="Language"
                value={entryLanguage}
                onChange={setEntryLanguage}
                options={languageOptions}
              />

              <SelectInput
                label="Tone"
                value={tone}
                onChange={setTone}
                options={toneOptions}
              />

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Main Details
                </span>

                <textarea
                  rows={5}
                  value={details}
                  maxLength={MAX_DETAILS_LENGTH + 100}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Write what this content should include. Example: promotion details, product benefits, business introduction, sales offer, announcement, event details, reminder, or customer follow-up."
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
                  {detailsCount} / {MAX_DETAILS_LENGTH} characters
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Extra Instructions
                </span>

                <textarea
                  rows={5}
                  value={prompt}
                  maxLength={MAX_PROMPT_LENGTH + 100}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Optional: Add target audience, price, location, deadline, CTA, must-include words, or any special instruction."
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
                  {promptCount} / {MAX_PROMPT_LENGTH} characters
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
                    ? "Generating..."
                    : generatedContent
                      ? "Regenerate Content for 10 Credits"
                      : "Generate Content for 10 Credits"}
                </button>

                <button
                  type="button"
                  onClick={copyGeneratedContent}
                  disabled={!generatedContent.trim()}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-8 py-5 text-xl font-black text-[#07111F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Clipboard className="h-6 w-6" />
                  {copiedGenerated ? "Copied" : "Copy Generated"}
                </button>
              </div>

              <button
                type="button"
                onClick={loadCreditBalance}
                disabled={isLoadingCredits}
                className="text-left text-sm font-black text-blue-600 disabled:opacity-50"
              >
                {isLoadingCredits ? "Loading your content studio..." : "Refresh credits"}
              </button>

              <label className="grid gap-2">
                <span className="text-base font-black text-slate-700">
                  Generated Content
                </span>

                <textarea
                  rows={12}
                  value={generatedContent}
                  maxLength={MAX_GENERATED_LENGTH + 200}
                  onChange={(event) => setGeneratedContent(event.target.value)}
                  placeholder="Click Generate Content. The result will appear here. You can edit it before saving."
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
                  {contentCount} / {MAX_GENERATED_LENGTH} characters
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
                    ? "Saving..."
                    : editingId
                      ? "Update Content"
                      : "Save Content"}
                </button>

                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-[#F7F9FA] px-8 py-5 text-xl font-black text-[#07111F]"
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
                Saved Content
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Manage content your team can copy, edit, reuse, or archive.
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
                    placeholder="Search saved content..."
                    className="h-full w-full bg-transparent text-lg font-semibold outline-none"
                  />
                </div>
              </label>

              <SelectInput
                label="Filter Content Type"
                value={filterType}
                onChange={setFilterType}
                options={[{ value: "all", label: "All Content Types" }, ...contentTypeOptions]}
              />
            </div>

            {pageError ? (
              <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
                <p className="text-base font-black">{pageError}</p>
              </div>
            ) : null}

            {isLoading ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-[#F7F9FA] p-6 text-lg font-black">
                Loading your content studio...
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-slate-200 bg-[#F7F9FA] p-8">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#07111F]">
                  <FileText className="h-8 w-8" />
                </div>

                <h3 className="text-4xl font-black tracking-[-0.05em]">
                  No saved content yet.
                </h3>

                <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
                  Generate your first content, review it, then save it here.
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
                                  contentTypeOptions,
                                  item.content_type
                                )}
                              />
                              <Badge
                                text={getOptionLabel(platformOptions, item.platform)}
                              />
                              <Badge
                                text={getOptionLabel(languageOptions, item.language)}
                              />
                              <Badge text={getOptionLabel(toneOptions, item.tone)} />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => copySavedContent(item)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-[#07111F]"
                            >
                              <Clipboard className="h-4 w-4" />
                              {isCopied ? "Copied" : "Copy"}
                            </button>

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
                              onClick={() => archiveContent(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-60"
                            >
                              Archive
                            </button>

                            <button
                              type="button"
                              disabled={isSavingItem}
                              onClick={() => deleteContent(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="rounded-3xl bg-white p-5">
                          <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                            {formatSavedTopic(item.topic)}
                          </p>

                          <p className="whitespace-pre-wrap text-base font-semibold leading-8 text-slate-700">
                            {item.generated_content}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
                          Updated: {formatDate(item.updated_at)}
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

function SummaryCard({
  icon,
  label,
  value,
  note,
  dark = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.8rem] border p-6 shadow-sm shadow-slate-900/5 ${
        dark
          ? "border-[#7CFF3D] bg-[#07111F] text-white"
          : "border-slate-200 bg-white text-[#07111F]"
      }`}
    >
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
          dark ? "bg-[#7CFF3D] text-[#07111F]" : "bg-[#07111F] text-[#7CFF3D]"
        }`}
      >
        {icon}
      </div>

      <p
        className={`text-lg font-black ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 text-3xl font-black tracking-[-0.04em]">{value}</p>

      <p
        className={`mt-2 text-base font-semibold leading-7 ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {note}
      </p>
    </div>
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