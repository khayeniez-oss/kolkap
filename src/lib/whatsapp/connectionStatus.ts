export type WhatsAppStatusInput = {
  status: string | null;
  meta_phone_number_id?: string | null;
  meta_waba_id?: string | null;
  last_error_code?: string | null;
  last_inbound_at?: string | null;
  ai_enabled?: boolean | null;
  auto_reply_enabled?: boolean | null;
  selected_ai_staff_id?: string | null;
};

export function getWhatsAppChannelStatus(connections: WhatsAppStatusInput[]) {
  if (connections.some((item) => item.status === "failed" || item.last_error_code)) {
    return { status: "attention" as const, label: "Needs Attention" };
  }
  const connected = connections.filter((item) =>
    item.status === "connected" && item.meta_phone_number_id && item.meta_waba_id
  );
  if (!connected.length) {
    if (connections.some((item) => item.status === "pending")) {
      return { status: "setup" as const, label: "Pending Setup / Test" };
    }
    if (connections.some((item) => item.status === "paused")) {
      return { status: "paused" as const, label: "Paused" };
    }
    return { status: "setup" as const, label: "Not Connected" };
  }
  if (!connected.some((item) => item.last_inbound_at)) {
    return { status: "ready" as const, label: "Send a Test Message" };
  }
  if (connected.some((item) => item.ai_enabled && item.auto_reply_enabled && !item.selected_ai_staff_id)) {
    return { status: "setup" as const, label: "Choose AI Staff" };
  }
  if (!connected.some((item) => item.ai_enabled && item.auto_reply_enabled)) {
    return { status: "inbox" as const, label: "Inbox Only" };
  }
  return { status: "live" as const, label: "Connected" };
}
