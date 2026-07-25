import { NextResponse } from "next/server";

import {
  cleanText,
  getAdminSupabase,
  getWorkspace,
  userCanAccessWorkspace,
  verifyRequestUser,
} from "@/lib/kolkap-ai-staff/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

async function getAccessibleDocument({
  req,
  documentId,
}: {
  req: Request;
  documentId: string;
}) {
  const auth = await verifyRequestUser(req);

  if (!auth.authorized) {
    return {
      response: auth.response!,
      document: null,
      supabaseAdmin: null,
    };
  }

  const supabaseAdmin = getAdminSupabase();

  const { data: document, error } = await supabaseAdmin
    .from("workspace_knowledge_documents")
    .select(
      "id, workspace_id, owner_user_id, file_name, storage_path, mime_type, file_size, status, extracted_text, processing_error, processed_at, created_at, updated_at"
    )
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!document?.id) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Document not found.",
        },
        { status: 404 }
      ),
      document: null,
      supabaseAdmin,
    };
  }

  const workspace = await getWorkspace(cleanText(document.workspace_id));

  if (!workspace?.id) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Workspace not found.",
        },
        { status: 404 }
      ),
      document: null,
      supabaseAdmin,
    };
  }

  const canAccess = await userCanAccessWorkspace({
    userId: auth.userId!,
    userEmail: auth.userEmail,
    workspace,
  });

  if (!canAccess) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have access to this document.",
        },
        { status: 403 }
      ),
      document: null,
      supabaseAdmin,
    };
  }

  return {
    response: null,
    document,
    supabaseAdmin,
  };
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { documentId: rawDocumentId } = await context.params;
    const documentId = cleanText(rawDocumentId);

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Document ID is required.",
        },
        { status: 400 }
      );
    }

    const result = await getAccessibleDocument({
      req,
      documentId,
    });

    if (result.response || !result.document) {
      return result.response!;
    }

    return NextResponse.json({
      success: true,
      document: result.document,
    });
  } catch (error) {
    console.error("Knowledge document read error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { documentId: rawDocumentId } = await context.params;
    const documentId = cleanText(rawDocumentId);

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Document ID is required.",
        },
        { status: 400 }
      );
    }

    const result = await getAccessibleDocument({
      req,
      documentId,
    });

    if (result.response || !result.document || !result.supabaseAdmin) {
      return result.response!;
    }

    const body = (await req.json().catch(() => null)) as
      | {
          status?: unknown;
        }
      | null;

    const status = cleanText(body?.status).toLowerCase();

    if (!["ready", "archived"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Status must be ready or archived.",
        },
        { status: 400 }
      );
    }

    const updatedAt = new Date().toISOString();

    const { data: updatedDocument, error } = await result.supabaseAdmin
      .from("workspace_knowledge_documents")
      .update({
        status,
        updated_at: updatedAt,
      })
      .eq("id", documentId)
      .select(
        "id, workspace_id, file_name, mime_type, file_size, status, processing_error, processed_at, created_at, updated_at"
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Knowledge document update error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document could not be updated.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { documentId: rawDocumentId } = await context.params;
    const documentId = cleanText(rawDocumentId);

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Document ID is required.",
        },
        { status: 400 }
      );
    }

    const result = await getAccessibleDocument({
      req,
      documentId,
    });

    if (result.response || !result.document || !result.supabaseAdmin) {
      return result.response!;
    }

    const storagePath = cleanText(result.document.storage_path);

    if (storagePath) {
      const { error: storageError } = await result.supabaseAdmin.storage
        .from("kolkap-knowledge-documents")
        .remove([storagePath]);

      if (storageError) {
        throw new Error(
          `Document file could not be deleted: ${storageError.message}`
        );
      }
    }

    const { error: deleteError } = await result.supabaseAdmin
      .from("workspace_knowledge_documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      deleted_document_id: documentId,
    });
  } catch (error) {
    console.error("Knowledge document delete error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document could not be deleted.",
      },
      { status: 500 }
    );
  }
}
