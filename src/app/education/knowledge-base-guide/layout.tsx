import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kolkap Knowledge Base Guide | Train AI Staff with Business Knowledge",
  description:
    "Learn how to add business knowledge, FAQs, services, pricing, policies, and approved answers so Kolkap AI staff can reply more accurately.",
  alternates: {
    canonical: "/education/knowledge-base-guide",
  },
  openGraph: {
    title: "Kolkap Knowledge Base Guide | Train AI Staff with Business Knowledge",
    description:
      "Learn how to add business knowledge, FAQs, services, pricing, policies, and approved answers so Kolkap AI staff can reply more accurately.",
    url: "/education/knowledge-base-guide",
    siteName: "Kolkap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kolkap Knowledge Base Guide | Train AI Staff with Business Knowledge",
    description:
      "Learn how to add business knowledge, FAQs, services, pricing, policies, and approved answers so Kolkap AI staff can reply more accurately.",
  },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
