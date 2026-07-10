import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kolkap.com";

const publicRoutes = [
  "",
  "/about",
  "/contact",
  "/pricing",
  "/support",
  "/privacy",
  "/terms",
  "/data-deletion",
  "/education/knowledge-base-guide",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/pricing" ? 0.8 : 0.6,
  }));
}
