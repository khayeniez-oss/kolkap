import "server-only";

type MetaPhone = {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  is_on_biz_app?: boolean;
  platform_type?: string;
  status?: string;
};

// Fixed Graph origin, bearer headers, bounded pagination and timeouts.
// Do not log provider bodies or URLs: OAuth responses contain credentials.
async function graphJson(url: URL, accessToken: string, method = "GET", body?: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Meta could not be reached. Please try connecting WhatsApp again.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object" || data.error) {
    throw new Error("Meta could not verify this WhatsApp account. Check its permissions and reconnect.");
  }
  return data;
}

export async function verifyMetaWhatsAppPhone(input: {
  graphVersion: string;
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
}): Promise<MetaPhone> {
  if (!/^v\d+\.\d+$/.test(input.graphVersion) ||
      !/^\d+$/.test(input.wabaId) || !/^\d+$/.test(input.phoneNumberId)) {
    throw new Error("The WhatsApp account details are incomplete. Please reconnect.");
  }
  const url = new URL(`https://graph.facebook.com/${input.graphVersion}/${input.wabaId}/phone_numbers`);
  url.searchParams.set("fields", "id,display_phone_number,verified_name");
  url.searchParams.set("limit", "100");
  const seen = new Set<string>();
  for (let page = 0; page < 20; page += 1) {
    const data = await graphJson(url, input.accessToken);
    if (!Array.isArray(data.data)) throw new Error("Meta returned incomplete WhatsApp account details.");
    const phone = data.data.find((item: MetaPhone) => item?.id === input.phoneNumberId);
    if (phone && typeof phone.display_phone_number === "string" && phone.display_phone_number.trim()) {
      const detailUrl = new URL(`https://graph.facebook.com/${input.graphVersion}/${input.phoneNumberId}`);
      detailUrl.searchParams.set("fields", "id,display_phone_number,verified_name,is_on_biz_app,platform_type,status");
      const details = await graphJson(detailUrl, input.accessToken);
      if (details.id !== input.phoneNumberId || typeof details.is_on_biz_app !== "boolean") {
        throw new Error("Meta has not confirmed how this number is registered. Please finish signup again.");
      }
      return { ...phone, ...details } as MetaPhone;
    }
    const cursor = data.paging?.cursors?.after;
    if (!data.paging?.next || typeof cursor !== "string" || !cursor || seen.has(cursor)) break;
    // Never follow an arbitrary next URL with the token attached.
    seen.add(cursor);
    url.searchParams.set("after", cursor);
  }
  throw new Error("The selected WhatsApp number does not belong to the authorized WhatsApp account.");
}

export async function registerNewMetaWhatsAppPhone(input: {
  graphVersion: string;
  phoneNumberId: string;
  accessToken: string;
  pin: string;
}) {
  if (!/^\d{6}$/.test(input.pin)) throw new Error("Number security setup is incomplete.");
  const url = new URL(`https://graph.facebook.com/${input.graphVersion}/${input.phoneNumberId}/register`);
  const result = await graphJson(url, input.accessToken, "POST", {
    messaging_product: "whatsapp", pin: input.pin,
  });
  if (result.success !== true) throw new Error("Meta has not activated the new number. Please try connecting again.");
}

export async function subscribeMetaWhatsAppAccount(input: {
  graphVersion: string;
  wabaId: string;
  accessToken: string;
}) {
  const url = new URL(`https://graph.facebook.com/${input.graphVersion}/${input.wabaId}/subscribed_apps`);
  const result = await graphJson(url, input.accessToken, "POST");
  if (result.success !== true) {
    throw new Error("Meta has not confirmed message delivery to Kolkap. Please reconnect WhatsApp.");
  }
}
