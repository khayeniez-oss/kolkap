import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kolkap Data Deletion | Delete Account and Workspace Data",
  description:
    "Learn how to request deletion of your Kolkap account, workspace, AI staff, knowledge base, conversations, leads, and connected channel data.",
  alternates: {
    canonical: "/data-deletion",
  },
  openGraph: {
    title: "Kolkap Data Deletion | Delete Account and Workspace Data",
    description:
      "Learn how to request deletion of your Kolkap account, workspace, AI staff, knowledge base, conversations, leads, and connected channel data.",
    url: "/data-deletion",
    siteName: "Kolkap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kolkap Data Deletion | Delete Account and Workspace Data",
    description:
      "Learn how to request deletion of your Kolkap account, workspace, AI staff, knowledge base, conversations, leads, and connected channel data.",
  },
};

export default function PageLayout({ children }: { children: ReactNode }) {
  return children;
}
