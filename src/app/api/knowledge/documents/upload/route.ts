import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

import {
  cleanText,
  getAdminSupabase,
  getWorkspace,
  userCanAccessWorkspace,
  verifyRequestUser,
} from "@/lib/kolkap-ai-staff/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_BUCKET = "kolkap-knowledge-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 120_000;

const SUPPORTED_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "txt",
  "csv",
  "xls",
  "xlsx",
]);

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
}

function sanitizeFileName(fileName: string) {
  const extension = getFileExtension(fileName);

  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);

  const safeBaseName = baseName || "knowledge-document";

  return extension
    ? `${safeBaseName}.${extension}`
    : safeBaseName;
}

function normalizeExtractedText(value: unknown) {
  return cleanText(value)
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .slice(0, MAX_EXTRACTED_TEXT_LENGTH)
    .trim();
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
  });

  try {
    const result = await parser.getText();
    return normalizeExtractedText(result.text);
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return normalizeExtractedText(result.value);
}

function extractSpreadsheetText(buffer: Buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });

  const sections = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    const csv = XLSX.utils.sheet_to_csv(worksheet, {
      blankrows: false,
    });

    return csv.trim()
      ? `Sheet: ${sheetName}\n${csv.trim()}`
      : "";
  }).filter(Boolean);

  return normalizeExtractedText(sections.join("\n\n"));
}

function extractPlainText(buffer: Buffer) {
  return normalizeExtractedText(buffer.toString("utf8"));
}

async function extractDocumentText({
  buffer,
  extension,
  mimeType,
}: {
  buffer: Buffer;
  extension: string;
  mimeType: string;
}) {
  if (extension === "pdf" || mimeType === "application/pdf") {
    return extractPdfText(buffer);
  }

  if (
    extension === "docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxText(buffer);
  }

  if (
    extension === "xls" ||
    extension === "xlsx" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return extractSpreadsheetText(buffer);
  }

  if (
    extension === "txt" ||
    extension === "csv" ||
    mimeType === "text/plain" ||
    mimeType === "text/csv" ||
    mimeType === "application/csv"
  ) {
    return extractPlainText(buffer);
  }

  throw new Error("This document type is not supported.");
}

export async function POST(req: Request) {
  const auth = await verifyRequestUser(req);

  if (!auth.authorized) {
    return auth.response!;
  }

  const supabaseAdmin = getAdminSupabase();

  let uploadedStoragePath = "";
  let createdDocumentId = "";

  try {
    const formData = await req.formData();

    const workspaceId = cleanText(formData.get("workspace_id"));
    const uploadedFile = formData.get("file");

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Workspace is required.",
        },
        { status: 400 }
      );
    }

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please choose a document to upload.",
        },
        { status: 400 }
      );
    }

    if (!uploadedFile.name) {
      return NextResponse.json(
        {
          success: false,
          error: "The uploaded document needs a filename.",
        },
        { status: 400 }
      );
    }

    if (uploadedFile.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "The uploaded document is empty.",
        },
        { status: 400 }
      );
    }

    if (uploadedFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "Documents must be 10 MB or smaller.",
        },
        { status: 413 }
      );
    }

    const extension = getFileExtension(uploadedFile.name);
    const mimeType =
      cleanText(uploadedFile.type).toLowerCase() ||
      "application/octet-stream";

    const supportedByExtension = SUPPORTED_EXTENSIONS.has(extension);
    const supportedByMime = SUPPORTED_MIME_TYPES.has(mimeType);

    if (!supportedByExtension && !supportedByMime) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported document. Upload a PDF, DOCX, TXT, CSV, XLS or XLSX file.",
        },
        { status: 415 }
      );
    }

    if (extension === "doc") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Older DOC files are not supported. Please save the document as DOCX or PDF.",
        },
        { status: 415 }
      );
    }

    const workspace = await getWorkspace(workspaceId);

    if (!workspace?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Workspace not found.",
        },
        { status: 404 }
      );
    }

    const canAccess = await userCanAccessWorkspace({
      userId: auth.userId!,
      userEmail: auth.userEmail,
      workspace,
    });

    if (!canAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to this workspace.",
        },
        { status: 403 }
      );
    }

    const ownerUserId = cleanText(workspace.owner_user_id);

    if (!ownerUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Workspace owner could not be found.",
        },
        { status: 400 }
      );
    }

    const documentId = randomUUID();
    const safeFileName = sanitizeFileName(uploadedFile.name);

    const storagePath = [
      ownerUserId,
      workspaceId,
      documentId,
      safeFileName,
    ].join("/");

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Document upload failed: ${uploadError.message}`);
    }

    uploadedStoragePath = storagePath;

    const { data: documentRow, error: documentError } = await supabaseAdmin
      .from("workspace_knowledge_documents")
      .insert({
        id: documentId,
        workspace_id: workspaceId,
        owner_user_id: ownerUserId,
        file_name: uploadedFile.name,
        storage_path: storagePath,
        mime_type: mimeType,
        file_size: uploadedFile.size,
        status: "processing",
        extracted_text: null,
        processing_error: null,
        processed_at: null,
        updated_at: new Date().toISOString(),
      })
      .select(
        "id,workspace_id,owner_user_id,file_name,storage_path,mime_type,file_size,status,created_at,updated_at"
      )
      .single();

    if (documentError || !documentRow?.id) {
      await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      uploadedStoragePath = "";

      throw new Error(
        documentError?.message || "Document record could not be created."
      );
    }

    createdDocumentId = documentRow.id;

    try {
      const extractedText = await extractDocumentText({
        buffer,
        extension,
        mimeType,
      });

      if (!extractedText) {
        throw new Error(
          "No readable text was found in this document. Scanned image-only documents are not supported yet."
        );
      }

      const processedAt = new Date().toISOString();

      const { data: readyDocument, error: updateError } =
        await supabaseAdmin
          .from("workspace_knowledge_documents")
          .update({
            status: "ready",
            extracted_text: extractedText,
            processing_error: null,
            processed_at: processedAt,
            updated_at: processedAt,
          })
          .eq("id", documentRow.id)
          .select(
            "id,workspace_id,file_name,mime_type,file_size,status,processed_at,created_at,updated_at"
          )
          .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      return NextResponse.json(
        {
          success: true,
          document: {
            ...readyDocument,
            extracted_characters: extractedText.length,
          },
        },
        { status: 201 }
      );
    } catch (processingError) {
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : "Document text could not be extracted.";

      await supabaseAdmin
        .from("workspace_knowledge_documents")
        .update({
          status: "failed",
          extracted_text: null,
          processing_error: errorMessage.slice(0, 1000),
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentRow.id);

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          document: {
            id: documentRow.id,
            file_name: documentRow.file_name,
            status: "failed",
          },
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Knowledge document upload error:", error);

    if (uploadedStoragePath && !createdDocumentId) {
      await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([uploadedStoragePath]);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document could not be uploaded.",
      },
      { status: 500 }
    );
  }
}
