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

export const metadata: Metadata = {
  title: "Kolkap | AI-Powered Responses",
  description:
    "Create AI staff for customer replies, lead capture, WhatsApp support, and business content.",
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