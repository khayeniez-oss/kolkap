import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kolkap Terms of Service | AI Staff and Workspace Terms",
  description:
    "Read the Kolkap Terms of Service for using AI staff, Website Chat, WhatsApp support, customer inbox, leads, and workspace tools.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Kolkap Terms of Service | AI Staff and Workspace Terms",
    description:
      "Read the Kolkap Terms of Service for using AI staff, Website Chat, WhatsApp support, customer inbox, leads, and workspace tools.",
    url: "/terms",
    siteName: "Kolkap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kolkap Terms of Service | AI Staff and Workspace Terms",
    description:
      "Read the Kolkap Terms of Service for using AI staff, Website Chat, WhatsApp support, customer inbox, leads, and workspace tools.",
  },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
