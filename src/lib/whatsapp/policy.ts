export const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isWhatsAppWindowOpen(lastCustomerMessageAt: string | null | undefined, now = Date.now()) {
  const last = Date.parse(lastCustomerMessageAt || "");
  return Number.isFinite(last) && last <= now && now - last < WHATSAPP_WINDOW_MS;
}

export function metaTimestamp(value: unknown, now = Date.now()) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds * 1000 > now + 60_000) return null;
  return new Date(Math.min(seconds * 1000, now)).toISOString();
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function canManageInbox(member: { status?: string | null; permission_level?: string | null; role?: string | null }) {
  if (member.status !== "active") return false;
  const permission = (member.permission_level || member.role || "").trim().toLowerCase();
  return ["admin", "manager", "inbox", "inbox agent", "sales", "sales agent"].includes(permission);
}

export function asksForHuman(text: string) {
  // Explicit requests only. Product questions mentioning an agent/team do not trigger handover.
  const value = text.trim().toLowerCase();
  return /^(human|agent|live agent|talk to (a )?human|speak to (a )?human|admin|operator)[.!?]*$/.test(value)
    || /\b(?:can|could|may|please|want to|need to|let me)\b.{0,35}\b(?:speak|talk|connect|transfer)\b.{0,25}\b(?:human|person|live agent|your team|someone)\b/.test(value)
    || /\b(?:bicara|berbicara|ngobrol|bercakap|hubungkan|sambungkan)\b.{0,25}\b(?:admin|manusia|orang|staf|staff)\b/.test(value)
    || /\b(?:kausap|makausap)\b.{0,25}\b(?:tao|agent|admin)\b/.test(value);
}

export function deliveryLabel(status?: string | null) {
  const labels: Record<string, string> = {
    pending: "Pending", sending: "Sending", sent: "Sent", delivered: "Delivered", read: "Read",
    failed: "Not sent", unknown: "Delivery unconfirmed", skipped: "AI paused",
  };
  return status ? labels[status] || status : "";
}
