import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact Kolkap | AI Staff and Customer Reply Support",
  description:
    "Contact Kolkap for help with AI staff, Website Chat, WhatsApp support, lead capture, workspace setup, and customer reply automation.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Kolkap | AI Staff and Customer Reply Support",
    description:
      "Contact Kolkap for help with AI staff, Website Chat, WhatsApp support, lead capture, workspace setup, and customer reply automation.",
    url: "/contact",
    siteName: "Kolkap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Kolkap | AI Staff and Customer Reply Support",
    description:
      "Contact Kolkap for help with AI staff, Website Chat, WhatsApp support, lead capture, workspace setup, and customer reply automation.",
  },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
