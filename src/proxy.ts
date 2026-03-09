import { getSessionCookie } from "better-auth/cookies";

import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/", "/performance"]
const PUBLIC_PREFIX = ["/auth"];

function matchPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;

  const sessionCookie = getSessionCookie(req);

  const isSignnedIn = !!sessionCookie;
  const isProtectedRoute = matchPrefix(nextUrl.pathname, PROTECTED_ROUTES);
  const isAuthRoute = matchPrefix(nextUrl.pathname, PUBLIC_PREFIX);

  if (!isAuthRoute && !isProtectedRoute) {
    return NextResponse.next();
  }

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