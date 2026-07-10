import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kolkap Privacy Policy | Customer Data and Workspace Privacy",
  description:
    "Read the Kolkap Privacy Policy to understand how workspace data, customer conversations, business knowledge, and account information are handled.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Kolkap Privacy Policy | Customer Data and Workspace Privacy",
    description:
      "Read the Kolkap Privacy Policy to understand how workspace data, customer conversations, business knowledge, and account information are handled.",
    url: "/privacy",
    siteName: "Kolkap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kolkap Privacy Policy | Customer Data and Workspace Privacy",
    description:
      "Read the Kolkap Privacy Policy to understand how workspace data, customer conversations, business knowledge, and account information are handled.",
  },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
