// Shared by the settings API and the public widget endpoint.
export function websiteHost(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const input = value.trim();
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return "";
    const host = url.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
    if (!host || host.includes("*") || (!host.includes(".") && host !== "localhost" && host !== "[::1]")) return "";
    return host;
  } catch { return ""; }
}

export function allowedWebsiteRequest(request: Request, pageUrl: string, domains: string[]) {
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const host = websiteHost(origin);
  if (!host || !/^https?:\/\//i.test(origin)) return false;
  if (pageUrl && websiteHost(pageUrl) !== host) return false;
  return domains.some(domain => {
    const allowed = websiteHost(domain);
    return Boolean(allowed && (host === allowed || host.endsWith(`.${allowed}`)));
  });
}

export function websitePageUrl(value: unknown) {
  try {
    const url = new URL(String(value || ""));
    if (!/^https?:$/.test(url.protocol)) return "";
    // Search parameters and fragments can contain a site's private tokens.
    return (url.origin + url.pathname).slice(0, 1000);
  } catch { return ""; }
}
