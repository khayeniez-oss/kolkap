import { channelAccess, channelErrorResponse, channelRpc, ChannelError } from "@/lib/whatsapp/server";
import { isUuid } from "@/lib/whatsapp/policy";
import { websiteHost } from "@/lib/website-chat/policy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user } = await channelAccess(request, body.workspace_id, "settings");
    const settings = body.settings;
    if (!settings || !Array.isArray(body.staff_ids) || body.staff_ids.length > 50 || !body.staff_ids.every(isUuid)) throw new ChannelError("Choose valid AI staff.");
    if (!["is_active", "ai_enabled", "auto_reply_enabled", "handover_enabled"].every(key => typeof settings[key] === "boolean")) throw new ChannelError("Invalid channel settings.");
    for (const [key, max] of [["widget_title", 100], ["widget_subtitle", 200], ["welcome_message", 1000]] as const) {
      if (typeof settings[key] !== "string" || !settings[key].trim() || settings[key].length > max) throw new ChannelError(`Please check the ${key.replaceAll("_", " ")}.`);
    }
    if (!Array.isArray(settings.allowed_domains) || settings.allowed_domains.length > 50) throw new ChannelError("Add up to 50 website domains.");
    const domains = settings.allowed_domains.map(websiteHost);
    if (domains.some((domain: string) => !domain) || (settings.is_active && !domains.length)) throw new ChannelError("Add a valid website domain before switching Website Chat on.");
    const first = settings.selected_ai_staff_id;
    if (first !== null && (!isUuid(first) || !body.staff_ids.includes(first))) throw new ChannelError("Choose a first responder from your AI team.");
    if (settings.auto_reply_enabled && settings.ai_enabled && !first) throw new ChannelError("Choose AI staff and enable AI support before switching on automatic replies.");
    const saved = await channelRpc("save_workspace_website_settings", {
      p_workspace_id: body.workspace_id, p_actor_id: user.id, p_staff_ids: [...new Set(body.staff_ids)],
      p_settings: { selected_ai_staff_id: first, widget_title: settings.widget_title.trim(), widget_subtitle: settings.widget_subtitle.trim(),
        welcome_message: settings.welcome_message.trim(), is_active: settings.is_active, ai_enabled: settings.ai_enabled,
        auto_reply_enabled: settings.auto_reply_enabled, handover_enabled: settings.handover_enabled, allowed_domains: [...new Set(domains)] },
    });
    return Response.json({ success: true, settings: saved });
  } catch (error) { return channelErrorResponse(error); }
}
