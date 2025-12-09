import { getSessionCookie } from "better-auth/cookies";

import { NextRequest, NextResponse } from "next/server";
const protectedRoutes = [
  "/",
];

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;

  const sessionCookie = getSessionCookie(req);

  const isSignnedIn = !!sessionCookie;
  const isProtectedRoute = protectedRoutes.includes(nextUrl.pathname);
  const isAuthRoute = nextUrl.pathname.startsWith("/auth");

  if (isProtectedRoute && !isSignnedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/sign-in?callbackUrl=${callbackUrl}`, req.url));
  }

  if (isAuthRoute && isSignnedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.tsx).*)",
  ],  
}