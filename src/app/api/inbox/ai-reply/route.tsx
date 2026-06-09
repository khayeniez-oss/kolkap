import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { runKolkapBrain } from "@/lib/kolkap-ai/brain";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import { KOLKAP_AI_GENERATION_MIN_CREDITS } from "@/lib/kolkapPlan";

const INBOX_AI_REPLY_CREDIT_COST = KOLKAP_AI_GENERATION_MIN_CREDITS;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const customerMessage = String(body.customer_message || "").trim();
    const conversationId = String(body.conversation_id || "").trim();

    if (!customerMessage) {
      return NextResponse.json(
        { error: "Customer message is required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to generate an inbox reply." },
        { status: 401 }
      );
    }

    const result = await runKolkapBrain({
      userId: user.id,
      userEmail: user.email,
      task: "inbox_reply",
      channel: "inbox",
      conversationId: conversationId || null,
      customerMessage,
      language: body.language || "auto",
      tone: body.tone || "professional",
      extraInstructions:
        body.extra_instructions ||
        "Generate a helpful suggested reply for the business owner to review before sending.",
      uiLanguage: body.ui_language || "en",
    });

    await logWorkspaceUsage({
      workspaceId: result.workspaceId,
      userId: user.id,
      eventType: "ai_reply_generated",
      channel: "inbox",
      sourcePage: "/dashboard/inbox",
      creditsUsed: INBOX_AI_REPLY_CREDIT_COST,
      metadata: {
        conversation_id: conversationId || null,
        model: result.model,
        knowledge_count: result.knowledgeCount,
        fallback: result.fallback,
        ai_staff_id: result.aiStaffId || null,
        brain_channel: result.channel,
        credit_rule: "inbox_ai_reply_minimum",
      },
    });

    return NextResponse.json({
      reply: result.content,
      business_name: result.businessName,
      workspace_id: result.workspaceId,
      conversation_id: conversationId || null,
      knowledge_count: result.knowledgeCount,
      model: result.model,
      fallback: result.fallback,
      ai_staff_id: result.aiStaffId || null,
      credits_used: INBOX_AI_REPLY_CREDIT_COST,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Inbox AI reply could not be generated.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}