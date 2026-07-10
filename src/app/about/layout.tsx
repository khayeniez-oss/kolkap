import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About Kolkap | AI Staff for Business Customer Conversations",
  description:
    "Learn how Kolkap helps businesses create AI staff for customer replies, Website Chat, WhatsApp support, lead capture, and business knowledge.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Kolkap | AI Staff for Business Customer Conversations",
    description:
      "Learn how Kolkap helps businesses create AI staff for customer replies, Website Chat, WhatsApp support, lead capture, and business knowledge.",
    url: "/about",
    siteName: "Kolkap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Kolkap | AI Staff for Business Customer Conversations",
    description:
      "Learn how Kolkap helps businesses create AI staff for customer replies, Website Chat, WhatsApp support, lead capture, and business knowledge.",
  },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
