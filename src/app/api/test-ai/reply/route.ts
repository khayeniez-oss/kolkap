import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  runKolkapBrain,
  type KolkapBrainChannel,
} from "@/lib/kolkap-ai/brain";
import { logWorkspaceUsage } from "@/lib/kolkap-usage/logUsage";
import { KOLKAP_AI_GENERATION_MIN_CREDITS } from "@/lib/kolkapPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_AI_CREDIT_COST = KOLKAP_AI_GENERATION_MIN_CREDITS;

const ALLOWED_TEST_CHANNELS = [
  "test_ai",
  "website_chat",
  "whatsapp",
  "inbox",
] as const;

type TestAiChannel = (typeof ALLOWED_TEST_CHANNELS)[number];

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function normalizeTestChannel(value: unknown): TestAiChannel {
  const channel = cleanText(value, "test_ai").toLowerCase();

  if (ALLOWED_TEST_CHANNELS.includes(channel as TestAiChannel)) {
    return channel as TestAiChannel;
  }

  return "test_ai";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

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
        { error: "You must be logged in to test the AI." },
        { status: 401 }
      );
    }

    const customerMessage = cleanText(body.customer_message);
    const aiStaffId = cleanText(body.ai_staff_id) || null;
    const testChannel = normalizeTestChannel(body.test_channel);
    const brainChannel: KolkapBrainChannel = testChannel;
    const language = cleanText(body.language, "auto");
    const tone = cleanText(body.tone, "professional");
    const extraInstructions = cleanText(body.extra_instructions);
    const uiLanguage = cleanText(body.ui_language, "en");

    if (!aiStaffId) {
      return NextResponse.json(
        { error: "Please choose an AI staff member to test." },
        { status: 400 }
      );
    }

    if (!customerMessage) {
      return NextResponse.json(
        { error: "Please write a sample customer question first." },
        { status: 400 }
      );
    }

    const result = await runKolkapBrain({
      userId: user.id,
      userEmail: user.email,
      task: "test_ai",
      channel: brainChannel,
      aiStaffId,
      customerMessage,
      language,
      tone,
      extraInstructions,
      uiLanguage,
    });

    const resolvedAiStaffId = result.aiStaffId || aiStaffId;

    await supabase.from("ai_test_runs").insert({
      workspace_id: result.workspaceId,
      ai_staff_id: resolvedAiStaffId,
      owner_user_id: user.id,
      customer_message: customerMessage,
      ai_response: result.content,
      status: "completed",
    });

    await supabase
      .from("ai_staff")
      .update({
        status: "testing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", resolvedAiStaffId)
      .eq("workspace_id", result.workspaceId)
      .neq("status", "live");

    await logWorkspaceUsage({
      workspaceId: result.workspaceId,
      userId: user.id,
      eventType: "test_ai_generated",
      channel: "test_ai",
      sourcePage: "/dashboard/test-ai",
      creditsUsed: TEST_AI_CREDIT_COST,
      metadata: {
        test_mode: true,
        selected_test_channel: testChannel,
        model: result.model,
        knowledge_count: result.knowledgeCount,
        fallback: result.fallback,
        selected_ai_staff_id: aiStaffId,
        ai_staff_id: resolvedAiStaffId,
        brain_channel: result.channel,
        customer_message: customerMessage,
        credit_rule: "ai_generation_minimum",
        saved_to_ai_test_runs: true,
      },
    });

    return NextResponse.json({
      reply: result.content,
      business_name: result.businessName,
      workspace_id: result.workspaceId,
      knowledge_count: result.knowledgeCount,
      model: result.model,
      fallback: result.fallback,
      ai_staff_id: resolvedAiStaffId,
      test_channel: testChannel,
      credits_used: TEST_AI_CREDIT_COST,
      test_mode: true,
      saved_test: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "AI reply could not be generated.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}