import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kolkap.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/about",
        "/contact",
        "/pricing",
        "/support",
        "/privacy",
        "/terms",
        "/data-deletion",
        "/education/knowledge-base-guide",
      ],
      disallow: [
        "/admin",
        "/admin/",
        "/dashboard",
        "/dashboard/",
        "/api",
        "/api/",
        "/login",
        "/logout",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/team/accept",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
