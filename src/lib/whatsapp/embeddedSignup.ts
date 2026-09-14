// Browser-safe helpers. Never put app secrets or access tokens in this module.
export type WhatsAppNumberOption = "existing_business_app" | "new_number";

export function normalizeSignupPhone(value: unknown) {
  if (typeof value !== "string" || !/^\+[\d\s()-]+$/.test(value.trim())) return "";
  const digits = value.replace(/\D/g, "");
  return /^[1-9]\d{6,14}$/.test(digits) ? `+${digits}` : "";
}

export function getSignupFeatureType(option: WhatsAppNumberOption) {
  return option === "existing_business_app"
    ? "whatsapp_business_app_onboarding"
    : "whatsapp_embedded_signup";
}

export function isSignupCompletion(info: EmbeddedSignupInfo) {
  return info.event === "FINISH" || info.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING";
}

export type EmbeddedSignupInfo = {
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
  event: "FINISH" | "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" | "CANCEL" | "ERROR";
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseEmbeddedSignupEvent(
  origin: string,
  raw: unknown
): EmbeddedSignupInfo | null {
  // A substring check would also trust facebook.com.attacker.example.
  if (!["https://www.facebook.com", "https://web.facebook.com", "https://facebook.com"].includes(origin)) {
    return null;
  }
  let parsed = raw;
  if (typeof raw === "string") {
    try { parsed = JSON.parse(raw); } catch { return null; }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const payload = parsed as Record<string, unknown>;
  if (payload.type !== "WA_EMBEDDED_SIGNUP") return null;
  if (payload.event === "CANCEL" || payload.event === "ERROR") {
    return { event: payload.event };
  }
  if (payload.event !== "FINISH" && payload.event !== "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") return null;
  const data = payload.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const fields = data as Record<string, unknown>;
  const phoneNumberId = text(fields.phone_number_id);
  const wabaId = text(fields.waba_id);
  if (!/^\d+$/.test(phoneNumberId) || !/^\d+$/.test(wabaId)) return null;
  return {
    event: payload.event,
    phone_number_id: phoneNumberId,
    waba_id: wabaId,
    business_id: /^\d+$/.test(text(fields.business_id)) ? text(fields.business_id) : undefined,
  };
}

// Meta's session event and login callback may arrive in either order.
// Read this attempt's live state, not the render captured by FB.login.
export function createEmbeddedSignupAttempt(timeoutMs = 15000) {
  let result: EmbeddedSignupInfo | null = null;
  let failure: Error | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waiting: Promise<EmbeddedSignupInfo> | null = null;
  let resolve: ((info: EmbeddedSignupInfo) => void) | undefined;
  let reject: ((error: Error) => void) | undefined;
  let claimed = false;
  let closed = false;

  function cancel(message = "WhatsApp signup was cancelled. Please try again.") {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    failure = new Error(message);
    reject?.(failure);
  }

  return {
    claim() {
      if (claimed || closed) return false;
      claimed = true;
      return true;
    },
    accept(info: EmbeddedSignupInfo) {
      if (closed || result) return false;
      if (!isSignupCompletion(info)) {
        cancel(info.event === "CANCEL"
          ? "WhatsApp signup was cancelled. Please try again."
          : "Meta could not complete signup. Please try again.");
        return true;
      }
      result = info;
      clearTimeout(timer);
      resolve?.(info);
      return true;
    },
    waitForCompletion() {
      if (failure) return Promise.reject(failure);
      if (result) return Promise.resolve(result);
      if (!waiting) {
        waiting = new Promise<EmbeddedSignupInfo>((onResolve, onReject) => {
          resolve = onResolve;
          reject = onReject;
          timer = setTimeout(() => cancel(
            "Meta did not return the selected WhatsApp number. Please complete signup again."
          ), timeoutMs);
        });
      }
      return waiting;
    },
    cancel,
  };
}
