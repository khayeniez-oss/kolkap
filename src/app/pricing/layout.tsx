import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kolkap Pricing | AI Staff Plans for Customer Replies",
  description:
    "Choose a Kolkap plan for AI staff, Website Chat, WhatsApp support, lead capture, business knowledge, and daily customer conversations.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Kolkap Pricing | AI Staff Plans for Customer Replies",
    description:
      "Choose a Kolkap plan for AI staff, Website Chat, WhatsApp support, lead capture, business knowledge, and daily customer conversations.",
    url: "/pricing",
    siteName: "Kolkap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kolkap Pricing | AI Staff Plans for Customer Replies",
    description:
      "Choose a Kolkap plan for AI staff, Website Chat, WhatsApp support, lead capture, business knowledge, and daily customer conversations.",
  },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
