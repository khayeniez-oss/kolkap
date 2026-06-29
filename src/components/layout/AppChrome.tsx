"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import KolkapUserHeader from "@/components/layout/KolkapUserHeader";
import KolkapFooter from "@/components/layout/KolkapFooter";
import KaiChatBubble from "@/components/kai/KaiChatBubble";

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <KolkapUserHeader />
      {children}
      <KolkapFooter />
      <KaiChatBubble />
    </>
  );
}