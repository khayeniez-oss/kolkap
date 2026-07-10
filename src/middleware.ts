import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const NOINDEX_PATHS = [
  "/admin",
  "/dashboard",
  "/api",
  "/login",
  "/logout",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/team/accept",
];

function shouldNoIndex(pathname: string) {
  return NOINDEX_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  if (shouldNoIndex(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
