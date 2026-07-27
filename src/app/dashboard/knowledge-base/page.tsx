"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  Contact,
  Truck,
  Edit3,
  ExternalLink,
  File,
  FileCheck2,
  FileText,
  Filter,
  HelpCircle,
  Link2,
  Loader2,
  Package,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  KOLKAP_GENERATE_KNOWLEDGE_CREDITS,
  KOLKAP_WEBSITE_IMPORT_CREDITS,
  getKolkapPlan,
} from "@/lib/kolkapPlan";
import { useKolkapWorkspace } from "@/lib/useKolkapWorkspace";

const MAX_CONTENT_LENGTH = 4000;
const MAX_SOURCE_NOTE_LENGTH = 1000;
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

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
  source_document_id?: string | null;
  last_checked_at: string | null;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type KnowledgeDocument = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  status: "uploaded" | "processing" | "ready" | "failed" | "archived";
  extracted_text: string | null;
  processing_error: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

type Option = {
  value: string;
  label: string;
};

type WizardStep = 1 | 2 | 3 | 4;

type GeneratedKnowledge = {
  title: string;
  category: string;
  language: string;
  tags: string[];
  content: string;
  source_type?: string;
  source_url?: string | null;
  source_note?: string | null;
  source_document_ids?: string[];
};

type WebsiteImportSummary = {
  confidence: "high" | "medium" | "low";
  missing_information: string[];
  recommendation: string;
};

const categoryOptions = [
  {
    value: "business_info",
    label: "Business Information",
    description: "Business name, background, location and what you do.",
    icon: BriefcaseBusiness,
  },
  {
    value: "product_service",
    label: "Products & Services",
    description: "What you sell, provide or help customers with.",
    icon: Package,
  },
  {
    value: "pricing",
    label: "Pricing",
    description: "Prices, packages, fees, inclusions and payment details.",
    icon: CircleDollarSign,
  },
  {
    value: "opening_hours",
    label: "Opening Hours",
    description: "Operating hours, appointment times and availability.",
    icon: Clock3,
  },
  {
    value: "faq",
    label: "FAQs",
    description: "Common customer questions and the correct answers.",
    icon: HelpCircle,
  },
  {
    value: "policy",
    label: "Policies",
    description: "Refunds, cancellations, privacy and business rules.",
    icon: ShieldCheck,
  },
  {
    value: "delivery",
    label: "Delivery",
    description: "Delivery areas, timing, fees and fulfilment rules.",
    icon: Truck,
  },
  {
    value: "contact_details",
    label: "Contact Details",
    description: "Phone, email, address, website and social channels.",
    icon: Contact,
  },
  {
    value: "custom_note",
    label: "Custom",
    description: "Anything else your AI should know.",
    icon: Sparkles,
  },
];

const libraryCategoryOptions: Option[] = [
  { value: "business_info", label: "Business Information" },
  { value: "product_service", label: "Products & Services" },
  { value: "pricing", label: "Pricing" },
  { value: "opening_hours", label: "Opening Hours" },
  { value: "faq", label: "FAQs" },
  { value: "policy", label: "Policies" },
  { value: "delivery", label: "Delivery" },
  { value: "contact_details", label: "Contact Details" },
  { value: "sales_instruction", label: "Sales Instruction" },
  { value: "handover_rule", label: "Handover Rule" },
  { value: "do_not_say", label: "Do Not Say" },
  { value: "important_link", label: "Important Link" },
  { value: "custom_note", label: "Custom" },
];

const languageOptions: Option[] = [
  { value: "en", label: "English" },
];

const wizardSteps = [
  {
    step: 1,
    title: "Choose topics",
    description: "Select what your AI should learn.",
  },
  {
    step: 2,
    title: "Add information",
    description: "Write details, upload files or add a website.",
  },
  {
    step: 3,
    title: "Build with AI",
    description: "Kolkap organises the information.",
  },
  {
    step: 4,
    title: "Review & save",
    description: "Check everything before teaching your AI.",
  },
];

const acceptedFileTypes =
  ".pdf,.docx,.txt,.csv,.xls,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

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

  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${
    units[unitIndex]
  }`;
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
  if (category === "delivery") return 3;
  if (category === "opening_hours") return 3;
  if (category === "contact_details") return 3;
  if (category === "business_info") return 4;

  return 4;
}

function buildGuidedPrompt({
  selectedCategories,
  businessOverview,
  productsServices,
  pricingDetails,
  openingHours,
  faqDetails,
  policyDetails,
  deliveryDetails,
  contactDetails,
  customDetails,
  websiteUrl,
}: {
  selectedCategories: string[];
  businessOverview: string;
  productsServices: string;
  pricingDetails: string;
  openingHours: string;
  faqDetails: string;
  policyDetails: string;
  deliveryDetails: string;
  contactDetails: string;
  customDetails: string;
  websiteUrl: string;
}) {
  const sections = [
    ["Selected topics", selectedCategories.map((value) =>
      getOptionLabel(libraryCategoryOptions, value)
    ).join(", ")],
    ["Business information", businessOverview],
    ["Products and services", productsServices],
    ["Pricing", pricingDetails],
    ["Opening hours", openingHours],
    ["Frequently asked questions", faqDetails],
    ["Policies", policyDetails],
    ["Delivery", deliveryDetails],
    ["Contact details", contactDetails],
    ["Other important information", customDetails],
    ["Official website or reference URL", websiteUrl],
  ].filter(([, value]) => value.trim());

  return sections
    .map(([heading, value]) => `${heading}:\n${value.trim()}`)
    .join("\n\n");
}

function getDocumentStatusStyle(status: KnowledgeDocument["status"]) {
  if (status === "ready") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "archived") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function KnowledgeBasePage() {
  const workspaceState = useKolkapWorkspace();
  const workspace = workspaceState.workspace;
  const currentPlan = getKolkapPlan(workspaceState.planKey);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeRow[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [pageError, setPageError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [businessOverview, setBusinessOverview] = useState("");
  const [productsServices, setProductsServices] = useState("");
  const [pricingDetails, setPricingDetails] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [faqDetails, setFaqDetails] = useState("");
  const [policyDetails, setPolicyDetails] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [generatedKnowledge, setGeneratedKnowledge] =
    useState<GeneratedKnowledge | null>(null);
  const [generatedWebsiteItems, setGeneratedWebsiteItems] = useState<
    GeneratedKnowledge[]
  >([]);
  const [selectedWebsiteItemIndexes, setSelectedWebsiteItemIndexes] = useState<
    number[]
  >([]);
  const [websiteImportSummary, setWebsiteImportSummary] =
    useState<WebsiteImportSummary | null>(null);
  const [websitePagesAnalysed, setWebsitePagesAnalysed] = useState(0);
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = useState(false);
  const [isSavingGenerated, setIsSavingGenerated] = useState(false);

  const [editingId, setEditingId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("business_info");
  const [editTagsText, setEditTagsText] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editSourceNote, setEditSourceNote] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [savingItemId, setSavingItemId] = useState("");
  const [managingDocumentId, setManagingDocumentId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadKnowledge() {
      if (!workspace?.id) {
        if (isMounted) setIsLoading(false);
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
  }, [workspace?.id, reloadKey]);

  useEffect(() => {
    let isMounted = true;

    async function loadDocuments() {
      if (!workspace?.id) {
        if (isMounted) setIsLoadingDocuments(false);
        return;
      }

      setIsLoadingDocuments(true);
      setDocumentError("");

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: Record<string, string> = {};

        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const response = await fetch(
          `/api/knowledge/documents?workspace_id=${encodeURIComponent(
            workspace.id
          )}`,
          {
            method: "GET",
            headers,
            cache: "no-store",
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Uploaded documents could not be loaded."
          );
        }

        if (!isMounted) return;

        setDocuments((result.documents ?? []) as KnowledgeDocument[]);
      } catch (error) {
        if (!isMounted) return;

        setDocumentError(
          error instanceof Error
            ? error.message
            : "Uploaded documents could not be loaded."
        );
      } finally {
        if (isMounted) setIsLoadingDocuments(false);
      }
    }

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, [workspace?.id, reloadKey]);

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

  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === "ready"),
    [documents]
  );

  const aiReadyCount = knowledgeItems.filter(
    (item) => item.status === "active"
  ).length;

  const guidedPrompt = useMemo(
    () =>
      buildGuidedPrompt({
        selectedCategories,
        businessOverview,
        productsServices,
        pricingDetails,
        openingHours,
        faqDetails,
        policyDetails,
        deliveryDetails,
        contactDetails,
        customDetails,
        websiteUrl,
      }),
    [
      selectedCategories,
      businessOverview,
      productsServices,
      pricingDetails,
      openingHours,
      faqDetails,
      policyDetails,
      deliveryDetails,
      contactDetails,
      customDetails,
      websiteUrl,
    ]
  );

  const manualInformation = [
    businessOverview,
    productsServices,
    pricingDetails,
    openingHours,
    faqDetails,
    policyDetails,
    deliveryDetails,
    contactDetails,
    customDetails,
  ]
    .join("\n")
    .trim();

  const hasWrittenInformation = manualInformation.length >= 10;
  const hasWebsiteImport = websiteUrl.trim().length > 0;
  const canGenerate =
    hasWebsiteImport ||
    (selectedCategories.length > 0 &&
      (hasWrittenInformation || selectedDocumentIds.length > 0));


  function toggleCategory(categoryValue: string) {
    setSelectedCategories((current) =>
      current.includes(categoryValue)
        ? current.filter((value) => value !== categoryValue)
        : [...current, categoryValue]
    );
  }

  function toggleDocument(documentId: string) {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((value) => value !== documentId)
        : [...current, documentId]
    );
  }

  function clearWizard() {
    setWizardStep(1);
    setSelectedCategories([]);
    setBusinessOverview("");
    setProductsServices("");
    setPricingDetails("");
    setOpeningHours("");
    setFaqDetails("");
    setPolicyDetails("");
    setDeliveryDetails("");
    setContactDetails("");
    setCustomDetails("");
    setWebsiteUrl("");
    setSelectedDocumentIds([]);
    setGeneratedKnowledge(null);
    setGeneratedWebsiteItems([]);
    setSelectedWebsiteItemIndexes([]);
    setWebsiteImportSummary(null);
    setWebsitePagesAnalysed(0);
    setUploadMessage("");
    setActionError("");
  }

  function moveToNextStep() {
    setActionError("");

    if (wizardStep === 1) {
      if (selectedCategories.length === 0) {
        setActionError("Choose at least one topic for your AI to learn.");
        return;
      }

      setWizardStep(2);
      return;
    }

    if (wizardStep === 2) {
      if (
        !hasWebsiteImport &&
        !hasWrittenInformation &&
        selectedDocumentIds.length === 0
      ) {
        setActionError(
          "Add business information, select an uploaded document, or enter a website."
        );
        return;
      }

      if (hasWebsiteImport && !/^https:\/\/.+/i.test(websiteUrl.trim())) {
        setActionError(
          "Website imports require a valid URL starting with https://."
        );
        return;
      }

      setWizardStep(3);
      return;
    }

    if (
      wizardStep === 3 &&
      (generatedKnowledge || generatedWebsiteItems.length > 0)
    ) {
      setWizardStep(4);
    }
  }

  function moveToPreviousStep() {
    setActionError("");

    if (wizardStep > 1) {
      setWizardStep((wizardStep - 1) as WizardStep);
    }
  }

  async function getAuthHeaders(includeContentType = false) {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {};

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  async function handleDocumentUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !workspace?.id) return;

    setUploadMessage("");
    setDocumentError("");
    setActionError("");

    if (file.size > MAX_UPLOAD_SIZE) {
      setDocumentError("Documents must be 10 MB or smaller.");
      return;
    }

    setIsUploadingDocument(true);

    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();

      formData.append("workspace_id", workspace.id);
      formData.append("file", file);

      const response = await fetch(
        "/api/knowledge/documents/upload",
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        if (result.document?.id) {
          setReloadKey((value) => value + 1);
        }

        throw new Error(
          result.error || "The document could not be uploaded."
        );
      }

      const uploadedDocument =
        result.document as KnowledgeDocument;

      setDocuments((current) => [
        uploadedDocument,
        ...current.filter(
          (document) => document.id !== uploadedDocument.id
        ),
      ]);

      if (uploadedDocument.status === "ready") {
        setSelectedDocumentIds((current) =>
          current.includes(uploadedDocument.id)
            ? current
            : [...current, uploadedDocument.id]
        );
      }

      setUploadMessage(
        `${uploadedDocument.file_name} is ready for Kolkap AI.`
      );
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "The document could not be uploaded."
      );
    } finally {
      setIsUploadingDocument(false);
    }
  }

  async function updateDocumentStatus(
    document: KnowledgeDocument,
    status: "ready" | "archived"
  ) {
    setManagingDocumentId(document.id);
    setDocumentError("");
    setUploadMessage("");

    try {
      const headers = await getAuthHeaders(true);

      const response = await fetch(
        `/api/knowledge/documents/${encodeURIComponent(
          document.id
        )}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "The document could not be updated."
        );
      }

      const updatedDocument =
        result.document as KnowledgeDocument;

      setDocuments((current) =>
        status === "archived"
          ? current.filter((item) => item.id !== document.id)
          : current.map((item) =>
              item.id === document.id
                ? { ...item, ...updatedDocument }
                : item
            )
      );

      if (status === "archived") {
        setSelectedDocumentIds((current) =>
          current.filter((value) => value !== document.id)
        );

        setUploadMessage(`${document.file_name} was archived.`);
      } else {
        setUploadMessage(`${document.file_name} was restored.`);
      }
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "The document could not be updated."
      );
    } finally {
      setManagingDocumentId("");
    }
  }

  async function deleteDocument(document: KnowledgeDocument) {
    const shouldDelete = window.confirm(
      `Delete ${document.file_name}? This removes the uploaded file permanently.`
    );

    if (!shouldDelete) return;

    setManagingDocumentId(document.id);
    setDocumentError("");
    setUploadMessage("");

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `/api/knowledge/documents/${encodeURIComponent(
          document.id
        )}`,
        {
          method: "DELETE",
          headers,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "The document could not be deleted."
        );
      }

      setDocuments((current) =>
        current.filter((item) => item.id !== document.id)
      );

      setSelectedDocumentIds((current) =>
        current.filter((value) => value !== document.id)
      );

      setUploadMessage(`${document.file_name} was deleted.`);
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "The document could not be deleted."
      );
    } finally {
      setManagingDocumentId("");
    }
  }

  async function handleGenerateKnowledge() {
    setActionMessage("");
    setActionError("");

    if (!workspace?.id) {
      setActionError("Business knowledge could not be generated.");
      return;
    }

    if (!hasWebsiteImport && selectedCategories.length === 0) {
      setActionError("Choose at least one topic for your AI to learn.");
      setWizardStep(1);
      return;
    }

    if (
      !hasWebsiteImport &&
      !hasWrittenInformation &&
      selectedDocumentIds.length === 0
    ) {
      setActionError(
        "Add some business information or select an uploaded document."
      );
      setWizardStep(2);
      return;
    }

    if (hasWebsiteImport && !/^https:\/\/.+/i.test(websiteUrl.trim())) {
      setActionError(
        "Website imports require a valid URL starting with https://."
      );
      setWizardStep(2);
      return;
    }

    setIsGeneratingKnowledge(true);

    try {
      const headers = await getAuthHeaders(true);

      if (hasWebsiteImport) {
        const response = await fetch("/api/knowledge/import", {
          method: "POST",
          headers,
          body: JSON.stringify({
            workspace_id: workspace.id,
            source: "website",
            url: websiteUrl.trim(),
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Website knowledge could not be imported."
          );
        }

        const importedItems = Array.isArray(result.generated_items)
          ? result.generated_items.map((item: Record<string, unknown>) => ({
              title: String(item.title || "Imported Website Knowledge"),
              category: String(item.category || "custom_note"),
              language: "en",
              tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
              content: String(item.content || ""),
              source_type: "url",
              source_url:
                item.source_url == null
                  ? String(result.website_url || websiteUrl.trim())
                  : String(item.source_url),
              source_note:
                item.source_note == null ? null : String(item.source_note),
              source_document_ids: [],
            }))
          : [];

        if (!importedItems.length) {
          throw new Error(
            "The website did not produce any usable knowledge drafts."
          );
        }

        setGeneratedKnowledge(null);
        setGeneratedWebsiteItems(importedItems);
        setSelectedWebsiteItemIndexes(
          importedItems.map((_: GeneratedKnowledge, index: number) => index)
        );
        setWebsitePagesAnalysed(Number(result.pages_analysed || 0));
        setWebsiteImportSummary({
          confidence:
            result.summary?.confidence === "high" ||
            result.summary?.confidence === "medium" ||
            result.summary?.confidence === "low"
              ? result.summary.confidence
              : "medium",
          missing_information: Array.isArray(
            result.summary?.missing_information
          )
            ? result.summary.missing_information.map(String)
            : [],
          recommendation: String(
            result.summary?.recommendation ||
              "Review the imported drafts before saving them."
          ),
        });
        setWizardStep(4);
        setActionMessage(
          `Kolkap analysed ${Number(
            result.pages_analysed || 0
          )} website pages and prepared ${importedItems.length} knowledge drafts. ${
            result.credits_used || KOLKAP_WEBSITE_IMPORT_CREDITS
          } credits were used.`
        );
        return;
      }

      const primaryCategory =
        selectedCategories.length === 1
          ? selectedCategories[0]
          : "custom_note";

      const response = await fetch("/api/knowledge/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          workspace_id: workspace.id,
          title:
            selectedCategories.length === 1
              ? getOptionLabel(
                  libraryCategoryOptions,
                  primaryCategory
                )
              : "Business Knowledge",
          category: primaryCategory,
          language: "en",
          tags: selectedCategories,
          details: guidedPrompt,
          document_ids: selectedDocumentIds,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Business knowledge could not be generated."
        );
      }

      const generated = result.generated || {};

      setGeneratedWebsiteItems([]);
      setSelectedWebsiteItemIndexes([]);
      setWebsiteImportSummary(null);
      setWebsitePagesAnalysed(0);

      setGeneratedKnowledge({
        title: String(
          generated.title || "Generated Business Knowledge"
        ),
        category: String(
          generated.category || primaryCategory || "custom_note"
        ),
        language: "en",
        tags: Array.isArray(generated.tags)
          ? generated.tags.map(String)
          : selectedCategories,
        content: String(generated.content || ""),
        source_type: String(
          generated.source_type ||
            (selectedDocumentIds.length ? "document" : "manual")
        ),
        source_note:
          generated.source_note == null
            ? null
            : String(generated.source_note),
        source_document_ids: Array.isArray(
          generated.source_document_ids
        )
          ? generated.source_document_ids.map(String)
          : selectedDocumentIds,
      });

      setWizardStep(4);

      setActionMessage(
        `Kolkap AI built your draft successfully. ${
          result.credits_used ||
          KOLKAP_GENERATE_KNOWLEDGE_CREDITS
        } credits were used. Review it before saving.`
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Business knowledge could not be generated."
      );
    } finally {
      setIsGeneratingKnowledge(false);
    }
  }

  function toggleWebsiteItem(index: number) {
    setSelectedWebsiteItemIndexes((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index]
    );
  }

  function updateWebsiteItem(
    index: number,
    updates: Partial<GeneratedKnowledge>
  ) {
    setGeneratedWebsiteItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item
      )
    );
  }

  async function handleSaveWebsiteKnowledge() {
    if (!workspace || generatedWebsiteItems.length === 0) return;

    setActionMessage("");
    setActionError("");

    const selectedItems = generatedWebsiteItems.filter((_, index) =>
      selectedWebsiteItemIndexes.includes(index)
    );

    if (!selectedItems.length) {
      setActionError("Select at least one website knowledge item to save.");
      return;
    }

    const invalidItem = selectedItems.find(
      (item) =>
        !item.title.trim() ||
        !item.content.trim() ||
        item.content.length > MAX_CONTENT_LENGTH
    );

    if (invalidItem) {
      setActionError(
        "Every selected item needs a title and content of 4,000 characters or less."
      );
      return;
    }

    setIsSavingGenerated(true);

    const supabase = createClient();
    const now = new Date().toISOString();

    const payloads = selectedItems.map((item) => ({
      workspace_id: workspace.id,
      owner_user_id: workspace.owner_user_id,
      title: item.title.trim(),
      category: item.category,
      content: item.content.trim(),
      priority: getCategoryPriority(item.category),
      ai_usage: "customer_answer",
      language: "en",
      tags: item.tags.slice(0, 12),
      status: "active",
      source_type: "url",
      source_url: item.source_url || websiteUrl.trim() || null,
      source_note: item.source_note || null,
      source_document_id: null,
      sync_status: "not_synced",
      updated_at: now,
    }));

    const { data, error } = await supabase
      .from("workspace_knowledge_base")
      .insert(payloads)
      .select("*");

    if (error) {
      setActionError(
        error.message || "Website knowledge could not be saved."
      );
      setIsSavingGenerated(false);
      return;
    }

    setKnowledgeItems((current) => [
      ...((data ?? []) as KnowledgeRow[]),
      ...current,
    ]);

    const savedCount = data?.length || selectedItems.length;

    clearWizard();
    setWizardStep(1);
    setActionMessage(
      `${savedCount} website knowledge item${
        savedCount === 1 ? "" : "s"
      } saved. Your AI can now use this information.`
    );
    setIsSavingGenerated(false);
  }

  async function handleSaveGeneratedKnowledge() {
    if (!workspace || !generatedKnowledge) return;

    setActionMessage("");
    setActionError("");

    if (!generatedKnowledge.title.trim()) {
      setActionError("Please add a title before saving.");
      return;
    }

    if (!generatedKnowledge.content.trim()) {
      setActionError(
        "Generated knowledge content cannot be empty."
      );
      return;
    }

    if (
      generatedKnowledge.content.length >
      MAX_CONTENT_LENGTH
    ) {
      setActionError(
        "Business knowledge content must be 4,000 characters or less."
      );
      return;
    }

    setIsSavingGenerated(true);

    const supabase = createClient();
    const now = new Date().toISOString();
    const sourceDocumentIds =
      generatedKnowledge.source_document_ids || [];

    const payload = {
      workspace_id: workspace.id,
      owner_user_id: workspace.owner_user_id,
      title: generatedKnowledge.title.trim(),
      category: generatedKnowledge.category,
      content: generatedKnowledge.content.trim(),
      priority: getCategoryPriority(
        generatedKnowledge.category
      ),
      ai_usage: "customer_answer",
      language: "en",
      tags: generatedKnowledge.tags.slice(0, 12),
      status: "active",
      source_type:
        sourceDocumentIds.length > 0
          ? "document"
          : websiteUrl.trim()
            ? "url"
            : "manual",
      source_url: websiteUrl.trim() || null,
      source_note:
        generatedKnowledge.source_note ||
        (sourceDocumentIds.length > 0
          ? readyDocuments
              .filter((document) =>
                sourceDocumentIds.includes(document.id)
              )
              .map((document) => document.file_name)
              .join(", ") || null
          : null),
      source_document_id:
        sourceDocumentIds.length === 1
          ? sourceDocumentIds[0]
          : null,
      sync_status: "not_synced",
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("workspace_knowledge_base")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      setActionError(
        error.message ||
          "Business knowledge could not be saved."
      );
      setIsSavingGenerated(false);
      return;
    }

    setKnowledgeItems((current) => [
      data as KnowledgeRow,
      ...current,
    ]);

    setActionMessage(
      "Your AI has learned this business knowledge."
    );

    clearWizard();
    setWizardStep(1);
    setIsSavingGenerated(false);
  }

  function startEdit(item: KnowledgeRow) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditTagsText((item.tags || []).join(", "));
    setEditContent(item.content);
    setEditSourceUrl(item.source_url || "");
    setEditSourceNote(item.source_note || "");
    setActionMessage("");
    setActionError("");

    window.setTimeout(() => {
      document
        .getElementById("knowledge-library")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function cancelEdit() {
    setEditingId("");
    setEditTitle("");
    setEditCategory("business_info");
    setEditTagsText("");
    setEditContent("");
    setEditSourceUrl("");
    setEditSourceNote("");
    setActionError("");
  }

  async function handleSaveEdit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!workspace?.id || !editingId) return;

    setActionMessage("");
    setActionError("");

    if (!editTitle.trim() || !editContent.trim()) {
      setActionError(
        "Please add a title and business knowledge content."
      );
      return;
    }

    if (editContent.length > MAX_CONTENT_LENGTH) {
      setActionError(
        "Business knowledge content must be 4,000 characters or less."
      );
      return;
    }

    if (
      editSourceUrl.trim() &&
      !isValidUrl(editSourceUrl)
    ) {
      setActionError(
        "Please add a valid URL starting with http:// or https://."
      );
      return;
    }

    if (
      editSourceNote.length >
      MAX_SOURCE_NOTE_LENGTH
    ) {
      setActionError(
        "Source note must be 1,000 characters or less."
      );
      return;
    }

    setIsSavingEdit(true);

    const supabase = createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("workspace_knowledge_base")
      .update({
        title: editTitle.trim(),
        category: editCategory,
        content: editContent.trim(),
        priority: getCategoryPriority(editCategory),
        tags: normalizeTags(editTagsText),
        source_url: editSourceUrl.trim() || null,
        source_note: editSourceNote.trim() || null,
        updated_at: now,
      })
      .eq("id", editingId)
      .eq("workspace_id", workspace.id)
      .select("*")
      .single();

    if (error) {
      setActionError(
        error.message ||
          "Business knowledge could not be updated."
      );
      setIsSavingEdit(false);
      return;
    }

    setKnowledgeItems((current) =>
      current.map((item) =>
        item.id === editingId
          ? (data as KnowledgeRow)
          : item
      )
    );

    cancelEdit();
    setActionMessage(
      "Business knowledge updated successfully."
    );
    setIsSavingEdit(false);
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
      setActionError(
        error.message ||
          "Business knowledge could not be updated."
      );
      setSavingItemId("");
      return;
    }

    setKnowledgeItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? (data as KnowledgeRow)
          : item
      )
    );

    setActionMessage(
      "Business knowledge marked as reviewed."
    );
    setSavingItemId("");
  }

  async function deleteKnowledge(itemId: string) {
    if (!workspace) return;

    const shouldDelete = window.confirm(
      "Delete this business knowledge item?"
    );

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
      setActionError(
        error.message ||
          "Business knowledge could not be deleted."
      );
      setSavingItemId("");
      return;
    }

    setKnowledgeItems((current) =>
      current.filter((item) => item.id !== itemId)
    );

    if (editingId === itemId) {
      cancelEdit();
    }

    setActionMessage("Business knowledge deleted.");
    setSavingItemId("");
  }

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
      note: `${filteredKnowledge.length} currently shown`,
      icon: BookOpen,
    },
    {
      label: "Active Knowledge",
      value: `${aiReadyCount}`,
      note: "Knowledge items available to your AI",
      icon: Brain,
    },
    {
      label: "Documents",
      value: `${readyDocuments.length}`,
      note: "Uploaded files ready to use",
      icon: FileCheck2,
    },
  ];

  if (workspaceState.isLoading) {
    return (
      <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-10 text-[#07111F]">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2.2rem] bg-white p-8 text-xl font-black shadow-sm shadow-slate-900/5">
            Loading Teach Your AI...
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
              Teach Your AI could not load.
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
    <main className="min-h-[calc(100vh-160px)] bg-[#F7F9FA] px-5 py-8 text-[#07111F] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleDocumentUpload}
          className="hidden"
        />
        <div className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          <div className="bg-[linear-gradient(135deg,#07111F_0%,#12263F_52%,#1E3A5F_100%)] px-6 py-8 text-white sm:px-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white/85">
                  <Brain className="h-4 w-4" />
                  Teach Your AI
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Give your AI the right business knowledge.
                </h1>

                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/75 sm:text-lg">
                  Add your business information, upload documents, or use your
                  website. Kolkap AI will organise it into clear knowledge your
                  AI staff can use when speaking with customers.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/agents"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Your AI
                </Link>

                <button
                  type="button"
                  onClick={clearWizard}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#07111F] transition hover:bg-slate-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Start Again
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6 lg:p-8">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-[1.6rem] border border-slate-200 bg-[#FBFCFD] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="rounded-2xl bg-[#07111F] p-3 text-white">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="text-2xl font-black text-[#07111F]">
                      {card.value}
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-black text-[#07111F]">
                    {card.label}
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {card.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {(actionMessage || actionError) && (
          <div
            className={`rounded-[1.4rem] border px-5 py-4 text-sm font-bold ${
              actionError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            <div className="flex items-start gap-3">
              {actionError ? (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              )}

              <p>{actionError || actionMessage}</p>
            </div>
          </div>
        )}

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6 lg:p-8">
          <div className="border-b border-slate-200 pb-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#4DBD16]">
                  Guided training centre
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  Build knowledge with Kolkap AI
                </h2>

                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Complete the steps below. Nothing is saved to your AI until
                  you review and approve the final draft.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#FBFCFD] px-4 py-3">
                <p className="text-xs font-bold text-slate-500">
                  Knowledge generation
                </p>
                <p className="mt-1 text-sm font-black text-[#07111F]">
                  {hasWebsiteImport
                    ? `${KOLKAP_WEBSITE_IMPORT_CREDITS} credits per website import`
                    : `${KOLKAP_GENERATE_KNOWLEDGE_CREDITS} credits per generation`}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-4">
              {wizardSteps.map((item) => {
                const isCurrent = wizardStep === item.step;
                const isComplete = wizardStep > item.step;

                return (
                  <div
                    key={item.step}
                    className={`rounded-[1.4rem] border p-4 transition ${
                      isCurrent
                        ? "border-[#7CFF3D] bg-[#F2FFE9]"
                        : isComplete
                          ? "border-green-200 bg-green-50"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                          isCurrent
                            ? "bg-[#7CFF3D] text-[#07111F]"
                            : isComplete
                              ? "bg-green-600 text-white"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isComplete ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          item.step
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-black text-[#07111F]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {wizardStep === 1 && (
            <div className="pt-7">
              <div className="max-w-2xl">
                <h3 className="text-xl font-black">
                  What should your AI learn?
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Select one or more topics. You can teach several areas in one
                  session.
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {categoryOptions.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(
                    category.value
                  );

                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => toggleCategory(category.value)}
                      className={`relative rounded-[1.6rem] border p-5 text-left transition ${
                        isSelected
                          ? "border-[#7CFF3D] bg-[#F2FFE9] shadow-sm"
                          : "border-slate-200 bg-[#FBFCFD] hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`rounded-2xl p-3 ${
                            isSelected
                              ? "bg-[#7CFF3D] text-[#07111F]"
                              : "bg-[#07111F] text-white"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-black text-[#07111F]">
                            {category.label}
                          </p>

                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                            {category.description}
                          </p>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-[#7CFF3D] bg-[#7CFF3D] text-[#07111F]"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-8 pt-7">
              <div>
                <h3 className="text-xl font-black">
                  Add the information your AI should know
                </h3>

                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Use any combination of written answers, uploaded documents,
                  and a website reference.
                </p>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <div className="rounded-[1.6rem] border border-slate-200 bg-[#FBFCFD] p-5">
                  <div className="flex items-center gap-3">
                    <Edit3 className="h-5 w-5 text-[#4DBD16]" />
                    <div>
                      <p className="font-black">Write it yourself</p>
                      <p className="text-xs font-semibold text-slate-500">
                        Answer the guided questions below.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-slate-200 bg-[#FBFCFD] p-5">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-[#4DBD16]" />
                    <div>
                      <p className="font-black">Upload documents</p>
                      <p className="text-xs font-semibold text-slate-500">
                        PDF, DOCX, TXT, CSV, XLS or XLSX.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-slate-200 bg-[#FBFCFD] p-5">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-[#4DBD16]" />
                    <div>
                      <p className="font-black">Use a website</p>
                      <p className="text-xs font-semibold text-slate-500">
                        Import and organise your public website.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5 rounded-[1.8rem] border border-slate-200 p-5 sm:p-6">
                  <div>
                    <h4 className="text-lg font-black">
                      Guided business questions
                    </h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Only complete the sections relevant to the topics you
                      selected.
                    </p>
                  </div>

                  {selectedCategories.includes("business_info") && (
                    <GuidedTextarea
                      label="Tell us about your business"
                      description="Business name, what you do, where you operate, who you help, and what makes the business different."
                      value={businessOverview}
                      onChange={setBusinessOverview}
                      placeholder="Example: Kolkap is an Australian AI staff platform helping small businesses manage customer conversations..."
                    />
                  )}

                  {selectedCategories.includes("product_service") && (
                    <GuidedTextarea
                      label="What products or services do you offer?"
                      description="Include names, descriptions, variations, inclusions, and who each option is suitable for."
                      value={productsServices}
                      onChange={setProductsServices}
                      placeholder="List each product or service clearly..."
                    />
                  )}

                  {selectedCategories.includes("pricing") && (
                    <GuidedTextarea
                      label="What should your AI know about pricing?"
                      description="Include prices, packages, fees, deposits, taxes, discounts, payment methods, and what is included."
                      value={pricingDetails}
                      onChange={setPricingDetails}
                      placeholder="Example: Starter is $79 per month and includes..."
                    />
                  )}

                  {selectedCategories.includes("opening_hours") && (
                    <GuidedTextarea
                      label="What are your opening hours?"
                      description="Include normal hours, public holiday hours, appointment rules, and response times."
                      value={openingHours}
                      onChange={setOpeningHours}
                      placeholder="Example: Monday to Friday, 9:00 am to 5:00 pm..."
                    />
                  )}

                  {selectedCategories.includes("faq") && (
                    <GuidedTextarea
                      label="What questions do customers ask most often?"
                      description="Write each question with the correct approved answer."
                      value={faqDetails}
                      onChange={setFaqDetails}
                      placeholder="Q: Do you offer a free trial?&#10;A: Yes, every plan includes..."
                    />
                  )}

                  {selectedCategories.includes("policy") && (
                    <GuidedTextarea
                      label="What policies should your AI follow?"
                      description="Refunds, cancellation, privacy, rescheduling, returns, warranties, and other rules."
                      value={policyDetails}
                      onChange={setPolicyDetails}
                      placeholder="Example: Cancellations require 24 hours notice..."
                    />
                  )}

                  {selectedCategories.includes("delivery") && (
                    <GuidedTextarea
                      label="How does delivery or fulfilment work?"
                      description="Include service areas, delivery times, fees, collection, shipping, and exceptions."
                      value={deliveryDetails}
                      onChange={setDeliveryDetails}
                      placeholder="Example: We deliver across Sydney within..."
                    />
                  )}

                  {selectedCategories.includes("contact_details") && (
                    <GuidedTextarea
                      label="How can customers contact your business?"
                      description="Add official phone numbers, email addresses, location, website, WhatsApp, and social channels."
                      value={contactDetails}
                      onChange={setContactDetails}
                      placeholder="Phone:&#10;Email:&#10;Address:&#10;Website:"
                    />
                  )}

                  {selectedCategories.includes("custom_note") && (
                    <GuidedTextarea
                      label="What else should your AI know?"
                      description="Add any special instructions, exceptions, important context, or business-specific details."
                      value={customDetails}
                      onChange={setCustomDetails}
                      placeholder="Add any other important information..."
                    />
                  )}

                  <div>
                    <label className="text-sm font-black text-[#07111F]">
                      Official website or source URL
                    </label>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      Kolkap will securely analyse up to 20 public pages and build
                      separate knowledge drafts for you to review.
                    </p>

                    <div className="relative mt-3">
                      <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(event) =>
                          setWebsiteUrl(event.target.value)
                        }
                        placeholder="https://yourbusiness.com"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-[#7CFF3D]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[1.8rem] border border-slate-200 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-lg font-black">
                          Upload business documents
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Maximum file size: 10 MB.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isUploadingDocument}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-4 py-3 text-sm font-black text-white transition hover:bg-[#13243A] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUploadingDocument ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}

                        {isUploadingDocument
                          ? "Processing..."
                          : "Upload Document"}
                      </button>
                    </div>

                    {uploadMessage && (
                      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                        {uploadMessage}
                      </div>
                    )}

                    {documentError && (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {documentError}
                      </div>
                    )}

                    <div className="mt-5 space-y-3">
                      {isLoadingDocuments ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm font-bold text-slate-500">
                          Loading documents...
                        </div>
                      ) : readyDocuments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                          <FileText className="mx-auto h-8 w-8 text-slate-400" />
                          <p className="mt-3 text-sm font-black">
                            No documents uploaded yet
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Upload a file and Kolkap will extract the readable
                            text.
                          </p>
                        </div>
                      ) : (
                        readyDocuments.map((document) => {
                          const isSelected =
                            selectedDocumentIds.includes(document.id);

                          return (
                            <button
                              key={document.id}
                              type="button"
                              onClick={() => toggleDocument(document.id)}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                isSelected
                                  ? "border-[#7CFF3D] bg-[#F2FFE9]"
                                  : "border-slate-200 bg-[#FBFCFD] hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-white p-2 text-[#07111F] shadow-sm">
                                  <File className="h-4 w-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-black">
                                    {document.file_name}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {formatFileSize(document.file_size)} ·{" "}
                                    {formatDate(
                                      document.processed_at,
                                      "Ready"
                                    )}
                                  </p>
                                </div>

                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                    isSelected
                                      ? "border-[#7CFF3D] bg-[#7CFF3D] text-[#07111F]"
                                      : "border-slate-300 bg-white text-transparent"
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-200 bg-[#07111F] p-5 text-white sm:p-6">
                    <Sparkles className="h-7 w-7 text-[#7CFF3D]" />

                    <h4 className="mt-4 text-lg font-black">
                      What Kolkap AI will do
                    </h4>

                    <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-white/75">
                      <p>Organise your information into a clean knowledge draft.</p>
                      <p>Remove unnecessary repetition and improve clarity.</p>
                      <p>Keep uploaded documents as reference material only.</p>
                      <p>Let you review and edit everything before saving.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="pt-7">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-[1.8rem] border border-slate-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-[#07111F] p-3 text-white">
                      <Sparkles className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black">
                        Ready to build your knowledge draft
                      </h3>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Kolkap AI will use the information and documents you
                        selected. The draft will not be saved automatically.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <ReviewBlock
                      label="Topics selected"
                      value={`${selectedCategories.length}`}
                      detail={selectedCategories
                        .map((value) =>
                          getOptionLabel(
                            libraryCategoryOptions,
                            value
                          )
                        )
                        .join(", ")}
                    />

                    <ReviewBlock
                      label="Documents selected"
                      value={`${selectedDocumentIds.length}`}
                      detail={
                        selectedDocumentIds.length
                          ? readyDocuments
                              .filter((document) =>
                                selectedDocumentIds.includes(
                                  document.id
                                )
                              )
                              .map((document) => document.file_name)
                              .join(", ")
                          : "No uploaded document selected"
                      }
                    />

                    <ReviewBlock
                      label="Written information"
                      value={`${guidedPrompt.length}`}
                      detail="characters prepared for generation"
                    />

                    <ReviewBlock
                      label="Credits"
                      value={`${
                        hasWebsiteImport
                          ? KOLKAP_WEBSITE_IMPORT_CREDITS
                          : KOLKAP_GENERATE_KNOWLEDGE_CREDITS
                      }`}
                      detail={
                        hasWebsiteImport
                          ? "used after a successful website import"
                          : "used after a successful generation"
                      }
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!canGenerate || isGeneratingKnowledge}
                    onClick={handleGenerateKnowledge}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7CFF3D] px-5 py-4 text-sm font-black text-[#07111F] transition hover:bg-[#68E82F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGeneratingKnowledge ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}

                    {isGeneratingKnowledge
                      ? hasWebsiteImport
                        ? "Kolkap is analysing your website..."
                        : "Kolkap AI is building..."
                      : hasWebsiteImport
                        ? "Import Website with Kolkap AI"
                        : "Build Knowledge with Kolkap AI"}
                  </button>
                </div>

                <div className="rounded-[1.8rem] border border-slate-200 bg-[#FBFCFD] p-6">
                  <h4 className="font-black">Information summary</h4>

                  <div className="mt-4 max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-600">
                    {hasWebsiteImport
                      ? `Website import: ${websiteUrl.trim()}\n\nKolkap will analyse up to 20 public pages and create separate drafts. Written answers and documents are not combined with a website import.`
                      : guidedPrompt ||
                        "No written information was added. Kolkap AI will use the selected documents."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 4 &&
            (generatedKnowledge || generatedWebsiteItems.length > 0) && (
              <div className="space-y-6 pt-7">
                {generatedWebsiteItems.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-xl font-black">
                          Review website knowledge
                        </h3>

                        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                          Kolkap analysed {websitePagesAnalysed} public website
                          page{websitePagesAnalysed === 1 ? "" : "s"} and
                          prepared {generatedWebsiteItems.length} focused
                          knowledge drafts. Select only the items you approve.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#7CFF3D] bg-[#F2FFE9] px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#318A0B]">
                          Selected to save
                        </p>
                        <p className="mt-1 text-2xl font-black">
                          {selectedWebsiteItemIndexes.length}/
                          {generatedWebsiteItems.length}
                        </p>
                      </div>
                    </div>

                    {websiteImportSummary && (
                      <div className="grid gap-4 lg:grid-cols-3">
                        <ReviewBlock
                          label="Confidence"
                          value={
                            websiteImportSummary.confidence
                              .charAt(0)
                              .toUpperCase() +
                            websiteImportSummary.confidence.slice(1)
                          }
                          detail="Based on the public information found"
                        />

                        <ReviewBlock
                          label="Missing information"
                          value={`${websiteImportSummary.missing_information.length}`}
                          detail={
                            websiteImportSummary.missing_information.length
                              ? websiteImportSummary.missing_information.join(
                                  ", "
                                )
                              : "No important gaps were identified"
                          }
                        />

                        <ReviewBlock
                          label="Recommendation"
                          value="Review"
                          detail={websiteImportSummary.recommendation}
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      {generatedWebsiteItems.map((item, index) => {
                        const isSelected =
                          selectedWebsiteItemIndexes.includes(index);

                        return (
                          <article
                            key={`${item.title}-${index}`}
                            className={`rounded-[1.8rem] border p-5 transition sm:p-6 ${
                              isSelected
                                ? "border-[#7CFF3D] bg-[#F8FFF3]"
                                : "border-slate-200 bg-[#FBFCFD] opacity-75"
                            }`}
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">
                                    {getOptionLabel(
                                      libraryCategoryOptions,
                                      item.category
                                    )}
                                  </span>

                                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                                    Website import
                                  </span>
                                </div>

                                <p className="mt-3 text-xs font-semibold text-slate-500">
                                  Draft {index + 1} of{" "}
                                  {generatedWebsiteItems.length}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleWebsiteItem(index)}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${
                                  isSelected
                                    ? "border-[#7CFF3D] bg-[#7CFF3D] text-[#07111F]"
                                    : "border-slate-200 bg-white text-slate-600"
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5" />
                                )}
                                {isSelected ? "Selected" : "Select"}
                              </button>
                            </div>

                            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                              <div>
                                <label className="text-sm font-black">
                                  Knowledge title
                                </label>

                                <input
                                  value={item.title}
                                  onChange={(event) =>
                                    updateWebsiteItem(index, {
                                      title: event.target.value,
                                    })
                                  }
                                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#7CFF3D]"
                                />
                              </div>

                              <div>
                                <label className="text-sm font-black">
                                  Category
                                </label>

                                <select
                                  value={item.category}
                                  onChange={(event) =>
                                    updateWebsiteItem(index, {
                                      category: event.target.value,
                                    })
                                  }
                                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#7CFF3D]"
                                >
                                  {libraryCategoryOptions.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="mt-5">
                              <label className="text-sm font-black">Tags</label>

                              <input
                                value={item.tags.join(", ")}
                                onChange={(event) =>
                                  updateWebsiteItem(index, {
                                    tags: normalizeTags(event.target.value),
                                  })
                                }
                                placeholder="services, pricing, support"
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#7CFF3D]"
                              />
                            </div>

                            <div className="mt-5">
                              <div className="flex items-center justify-between gap-4">
                                <label className="text-sm font-black">
                                  Business knowledge
                                </label>

                                <span
                                  className={`text-xs font-bold ${
                                    item.content.length > MAX_CONTENT_LENGTH
                                      ? "text-red-600"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {item.content.length}/{MAX_CONTENT_LENGTH}
                                </span>
                              </div>

                              <textarea
                                value={item.content}
                                onChange={(event) =>
                                  updateWebsiteItem(index, {
                                    content: event.target.value,
                                  })
                                }
                                rows={10}
                                className="mt-2 w-full rounded-[1.6rem] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold leading-7 outline-none transition focus:border-[#7CFF3D]"
                              />
                            </div>

                            {item.source_note && (
                              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                                <span className="font-black">
                                  Source note:
                                </span>{" "}
                                {item.source_note}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-[#07111F] transition hover:bg-slate-50"
                      >
                        <Edit3 className="h-4 w-4" />
                        Change Website
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateKnowledge}
                        disabled={isGeneratingKnowledge}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-[#07111F] transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {isGeneratingKnowledge ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4" />
                        )}
                        Import Again
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveWebsiteKnowledge}
                        disabled={
                          isSavingGenerated ||
                          selectedWebsiteItemIndexes.length === 0
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#13243A] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingGenerated ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save Selected and Teach My AI
                      </button>
                    </div>
                  </>
                ) : generatedKnowledge ? (
                  <>
                    <div>
                      <h3 className="text-xl font-black">
                        Review the generated knowledge
                      </h3>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Edit anything that needs correcting. Save only when the
                        information is accurate and approved.
                      </p>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <label className="text-sm font-black">
                          Knowledge title
                        </label>

                        <input
                          value={generatedKnowledge.title}
                          onChange={(event) =>
                            setGeneratedKnowledge((current) =>
                              current
                                ? {
                                    ...current,
                                    title: event.target.value,
                                  }
                                : current
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#7CFF3D]"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-black">Category</label>

                        <select
                          value={generatedKnowledge.category}
                          onChange={(event) =>
                            setGeneratedKnowledge((current) =>
                              current
                                ? {
                                    ...current,
                                    category: event.target.value,
                                  }
                                : current
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#7CFF3D]"
                        >
                          {libraryCategoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-black">Tags</label>

                      <input
                        value={generatedKnowledge.tags.join(", ")}
                        onChange={(event) =>
                          setGeneratedKnowledge((current) =>
                            current
                              ? {
                                  ...current,
                                  tags: normalizeTags(event.target.value),
                                }
                              : current
                          )
                        }
                        placeholder="pricing, services, support"
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-[#7CFF3D]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-black">
                          Business knowledge
                        </label>

                        <span
                          className={`text-xs font-bold ${
                            generatedKnowledge.content.length >
                            MAX_CONTENT_LENGTH
                              ? "text-red-600"
                              : "text-slate-400"
                          }`}
                        >
                          {generatedKnowledge.content.length}/
                          {MAX_CONTENT_LENGTH}
                        </span>
                      </div>

                      <textarea
                        value={generatedKnowledge.content}
                        onChange={(event) =>
                          setGeneratedKnowledge((current) =>
                            current
                              ? {
                                  ...current,
                                  content: event.target.value,
                                }
                              : current
                          )
                        }
                        rows={18}
                        className="mt-2 w-full rounded-[1.6rem] border border-slate-200 px-4 py-4 text-sm font-semibold leading-7 outline-none transition focus:border-[#7CFF3D]"
                      />
                    </div>

                    {generatedKnowledge.source_note && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                        <span className="font-black">Source note:</span>{" "}
                        {generatedKnowledge.source_note}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-[#07111F] transition hover:bg-slate-50"
                      >
                        <Edit3 className="h-4 w-4" />
                        Change Sources
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateKnowledge}
                        disabled={isGeneratingKnowledge}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-[#07111F] transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {isGeneratingKnowledge ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4" />
                        )}
                        Generate Again
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveGeneratedKnowledge}
                        disabled={isSavingGenerated}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#13243A] disabled:opacity-60"
                      >
                        {isSavingGenerated ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save and Teach My AI
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={moveToPreviousStep}
              disabled={wizardStep === 1}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {wizardStep < 3 && (
              <button
                type="button"
                onClick={moveToNextStep}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:bg-[#13243A]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        <section
          id="knowledge-library"
          className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6 lg:p-8"
        >
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#4DBD16]">
                Knowledge library
              </p>

              <h2 className="mt-2 text-2xl font-black">
                What your AI already knows
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Search, review, edit, or delete saved business knowledge.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search knowledge"
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#7CFF3D] sm:w-64"
                />
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={filterCategory}
                  onChange={(event) =>
                    setFilterCategory(event.target.value)
                  }
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm font-semibold outline-none transition focus:border-[#7CFF3D] sm:w-56"
                >
                  <option value="all">All categories</option>

                  {libraryCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {editingId && (
            <form
              onSubmit={handleSaveEdit}
              className="mt-6 rounded-[1.8rem] border border-[#7CFF3D] bg-[#F2FFE9] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[#318A0B]">
                    Editing knowledge
                  </p>
                  <h3 className="mt-1 text-xl font-black">
                    Update this information
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-xl border border-green-200 bg-white p-2 text-slate-600 transition hover:bg-green-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <FormField label="Title">
                  <input
                    value={editTitle}
                    onChange={(event) =>
                      setEditTitle(event.target.value)
                    }
                    className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#7CFF3D]"
                  />
                </FormField>

                <FormField label="Category">
                  <select
                    value={editCategory}
                    onChange={(event) =>
                      setEditCategory(event.target.value)
                    }
                    className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#7CFF3D]"
                  >
                    {libraryCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Tags">
                  <input
                    value={editTagsText}
                    onChange={(event) =>
                      setEditTagsText(event.target.value)
                    }
                    placeholder="pricing, delivery, FAQ"
                    className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#7CFF3D]"
                  />
                </FormField>

                <FormField label="Source URL">
                  <input
                    value={editSourceUrl}
                    onChange={(event) =>
                      setEditSourceUrl(event.target.value)
                    }
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#7CFF3D]"
                  />
                </FormField>
              </div>

              <div className="mt-5">
                <FormField label="Source note">
                  <textarea
                    value={editSourceNote}
                    onChange={(event) =>
                      setEditSourceNote(event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#7CFF3D]"
                  />
                </FormField>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-black">
                    Business knowledge
                  </label>

                  <span
                    className={`text-xs font-bold ${
                      editContent.length > MAX_CONTENT_LENGTH
                        ? "text-red-600"
                        : "text-slate-500"
                    }`}
                  >
                    {editContent.length}/{MAX_CONTENT_LENGTH}
                  </span>
                </div>

                <textarea
                  value={editContent}
                  onChange={(event) =>
                    setEditContent(event.target.value)
                  }
                  rows={12}
                  className="mt-2 w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold leading-7 outline-none focus:border-[#7CFF3D]"
                />
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  {isSavingEdit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            {isLoading ? (
              <div className="rounded-[1.6rem] border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
                Loading business knowledge...
              </div>
            ) : pageError ? (
              <div className="rounded-[1.6rem] border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
                {pageError}
              </div>
            ) : filteredKnowledge.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-slate-300 p-10 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-4 text-lg font-black">
                  No knowledge found
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Teach your AI above or adjust your search and filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {filteredKnowledge.map((item) => (
                  <KnowledgeCard
                    key={item.id}
                    item={item}
                    isBusy={savingItemId === item.id}
                    onEdit={() => startEdit(item)}
                    onReview={() => markReviewed(item.id)}
                    onDelete={() => deleteKnowledge(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#4DBD16]">
                Document manager
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Uploaded business files
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Manage source files used to build knowledge.
              </p>
            </div>

            <button
              type="button"
              disabled={isUploadingDocument}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#07111F] px-5 py-3 text-sm font-black text-white transition hover:bg-[#13243A] disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Add Document
            </button>
          </div>

          <div className="mt-6">
            {isLoadingDocuments ? (
              <div className="rounded-[1.6rem] border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-slate-300 p-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-4 text-lg font-black">
                  No uploaded documents
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Upload a business file to begin.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-[#FBFCFD] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="rounded-2xl bg-[#07111F] p-3 text-white">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-black">
                          {document.file_name}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span>{formatFileSize(document.file_size)}</span>
                          <span>•</span>
                          <span>
                            {formatDate(
                              document.created_at,
                              "Upload date unavailable"
                            )}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-black capitalize ${getDocumentStatusStyle(
                              document.status
                            )}`}
                          >
                            {document.status}
                          </span>
                        </div>

                        {document.processing_error && (
                          <p className="mt-2 text-xs font-bold text-red-600">
                            {document.processing_error}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {document.status === "archived" ? (
                        <button
                          type="button"
                          disabled={managingDocumentId === document.id}
                          onClick={() =>
                            updateDocumentStatus(document, "ready")
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={managingDocumentId === document.id}
                          onClick={() =>
                            updateDocumentStatus(document, "archived")
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Archive
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={managingDocumentId === document.id}
                        onClick={() => deleteDocument(document)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700"
                      >
                        {managingDocumentId === document.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function GuidedTextarea({
  label,
  description,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm font-black text-[#07111F]">
        {label}
      </label>

      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
        {description}
      </p>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder={placeholder}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none transition placeholder:text-slate-400 focus:border-[#7CFF3D]"
      />
    </div>
  );
}

function ReviewBlock({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#FBFCFD] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">{value}</p>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black">
        {label}
      </label>
      {children}
    </div>
  );
}

function KnowledgeCard({
  item,
  isBusy,
  onEdit,
  onReview,
  onDelete,
}: {
  item: KnowledgeRow;
  isBusy: boolean;
  onEdit: () => void;
  onReview: () => void;
  onDelete: () => void;
}) {
  const tags = Array.isArray(item.tags) ? item.tags : [];

  return (
    <article className="rounded-[1.7rem] border border-slate-200 bg-[#FBFCFD] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">
              {getOptionLabel(
                libraryCategoryOptions,
                item.category
              )}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${
                item.status === "active"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
              }`}
            >
              {item.status}
            </span>
          </div>

          <h3 className="mt-4 text-lg font-black leading-6">
            {item.title}
          </h3>
        </div>

        <div className="rounded-2xl bg-[#07111F] p-3 text-white">
          <BookOpen className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 line-clamp-6 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-600">
        {item.content}
      </p>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600"
            >
              <Tags className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500">
        <p>
          Updated:{" "}
          <span className="font-black text-slate-700">
            {formatDate(item.updated_at, "Unknown")}
          </span>
        </p>

        <p>
          Last reviewed:{" "}
          <span className="font-black text-slate-700">
            {formatDate(item.last_reviewed_at, "Not reviewed yet")}
          </span>
        </p>

        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-black text-blue-700 hover:underline"
          >
            Open source
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={onReview}
          className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-black text-green-700"
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Mark Reviewed
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </article>
  );
}