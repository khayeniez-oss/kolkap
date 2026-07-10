import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kolkap Support | Help for AI Staff, Website Chat and WhatsApp",
  description:
    "Get support for Kolkap AI staff, Website Chat, WhatsApp connections, business knowledge, customer inbox, leads, and workspace settings.",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "Kolkap Support | Help for AI Staff, Website Chat and WhatsApp",
    description:
      "Get support for Kolkap AI staff, Website Chat, WhatsApp connections, business knowledge, customer inbox, leads, and workspace settings.",
    url: "/support",
    siteName: "Kolkap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kolkap Support | Help for AI Staff, Website Chat and WhatsApp",
    description:
      "Get support for Kolkap AI staff, Website Chat, WhatsApp connections, business knowledge, customer inbox, leads, and workspace settings.",
  },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
