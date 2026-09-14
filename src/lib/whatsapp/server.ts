import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { canManageInbox, isUuid } from "./policy";

export class ChannelError extends Error {
  constructor(message: string, public status = 400, public code = "channel_error") { super(message); }
}

export function channelDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ChannelError("Channel service is not configured.", 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function channelUser(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const db = channelDatabase();
  let auth;
  if (token) auth = await db.auth.getUser(token);
  else {
    const cookieStore = await cookies();
    const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    });
    auth = await client.auth.getUser();
  }
  if (auth.error || !auth.data.user) throw new ChannelError("Please log in again.", 401);
  return { db, user: auth.data.user };
}

export async function channelAccess(request: Request, workspaceId: string, mode: "inbox" | "settings" = "inbox") {
  if (!isUuid(workspaceId)) throw new ChannelError("A valid workspace is required.");
  const { db, user } = await channelUser(request);
  const { data: workspace, error } = await db.from("business_workspaces")
    .select("id,owner_user_id,plan_key").eq("id", workspaceId).maybeSingle();
  if (error) throw new ChannelError("Workspace access could not be checked.", 503);
  if (!workspace) throw new ChannelError("Workspace access denied.", 403);
  if (workspace.owner_user_id === user.id) return { db, user, workspace };
  const { data: member, error: memberError } = await db.from("workspace_team_members")
    .select("status,role,permission_level").eq("workspace_id", workspaceId)
    .eq("email", (user.email || "").toLowerCase()).eq("status", "active").maybeSingle();
  if (memberError) throw new ChannelError("Team access could not be checked.", 503);
  const permission = String(member?.permission_level || member?.role || "").toLowerCase();
  if (!member || !canManageInbox(member) || (mode === "settings" && permission !== "admin")) {
    throw new ChannelError("Your role does not allow this action.", 403);
  }
  return { db, user, workspace };
}

export function channelErrorResponse(error: unknown) {
  if (error instanceof ChannelError) return Response.json({ success: false, error: error.message, error_code: error.code }, { status: error.status });
  console.error("Channel operation failed.");
  return Response.json({ success: false, error: "The operation could not be completed. Please refresh and try again." }, { status: 503 });
}

export async function channelRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await channelDatabase().rpc(name, args);
  if (error) throw new ChannelError("Message processing is temporarily unavailable. Please try again.", 503, "processing_unavailable");
  return data as T;
}
