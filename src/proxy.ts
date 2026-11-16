import { getSessionCookie } from "better-auth/cookies";

import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/", "/performance"];
const PUBLIC_PREFIX = ["/auth"];
const MAINTENANCE_PATH = "/maintenance";

function isMaintenanceMode() {
  const value = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return value === "true" || value === "1";
}

function matchPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPublicAsset(pathname: string) {
  return /\.[a-z0-9]+$/i.test(pathname);
}

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;

  if (isMaintenanceMode()) {
    if (
      nextUrl.pathname === MAINTENANCE_PATH ||
      isPublicAsset(nextUrl.pathname)
    ) {
      return nextWithPath(req);
    }

    if (nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json(
        { message: "ระบบอยู่ระหว่างการปรับปรุง" },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": "3600",
          },
        },
      );
    }

    const url = nextUrl.clone();
    url.pathname = MAINTENANCE_PATH;
    url.search = "";
    const response = NextResponse.rewrite(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const sessionCookie = getSessionCookie(req);

  const isSignnedIn = !!sessionCookie;
  const isProtectedRoute = matchPrefix(nextUrl.pathname, PROTECTED_ROUTES);
  const isAuthRoute = matchPrefix(nextUrl.pathname, PUBLIC_PREFIX);

  if (!isAuthRoute && !isProtectedRoute) {
    return nextWithPath(req);
  }

  if (isProtectedRoute && !isSignnedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(
      new URL(`/auth/sign-in?callbackUrl=${callbackUrl}`, req.url),
    );
  }

  if (isAuthRoute && isSignnedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return nextWithPath(req);
}

function nextWithPath(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.tsx).*)",
  ],
};
