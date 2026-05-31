import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { runKolkapBrain } from "@/lib/kolkap-ai/brain";

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

    const customerMessage = String(body.customer_message || "").trim();

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
      customerMessage,
      language: body.language,
      tone: body.tone,
      extraInstructions: body.extra_instructions,
      uiLanguage: body.ui_language,
    });

    return NextResponse.json({
      reply: result.content,
      business_name: result.businessName,
      workspace_id: result.workspaceId,
      knowledge_count: result.knowledgeCount,
      model: result.model,
      fallback: result.fallback,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI reply could not be generated.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}