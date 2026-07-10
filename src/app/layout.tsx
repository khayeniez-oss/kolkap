import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { KolkapLanguageProvider } from "@/app/context/LanguageContext";
import AppChrome from "@/components/layout/AppChrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kolkap.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kolkap | AI Staff for WhatsApp, Website Chat, Leads & Customer Replies",
    template: "%s | Kolkap",
  },
  description:
    "Kolkap helps businesses create AI staff for customer replies, Website Chat, WhatsApp support, lead capture, business knowledge, and daily customer conversations.",
  applicationName: "Kolkap",
  keywords: [
    "Kolkap",
    "AI staff",
    "AI customer support",
    "WhatsApp AI",
    "Website Chat AI",
    "AI receptionist",
    "AI lead capture",
    "business automation",
    "customer reply automation",
  ],
  creator: "Kolkap",
  publisher: "Kolkap",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Kolkap",
    title: "Kolkap | AI Staff for WhatsApp, Website Chat, Leads & Customer Replies",
    description:
      "Create AI staff for customer replies, Website Chat, WhatsApp support, lead capture, business knowledge, and daily customer conversations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kolkap | AI Staff for Customer Replies",
    description:
      "Create AI staff for WhatsApp, Website Chat, lead capture, and customer conversations.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <KolkapLanguageProvider>
          <AppChrome>{children}</AppChrome>
        </KolkapLanguageProvider>
      </body>
    </html>
  );
}