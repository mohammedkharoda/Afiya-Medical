import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

async function isValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("better-auth.session_token")?.value;
  if (!token) return false;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return !!session;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect only real app routes so unknown URLs can fall through to Next's
  // not-found page instead of being redirected to login.
  const protectedExactRoutes = new Set([
    "/dashboard",
    "/medical-history",
    "/notification-settings",
    "/payments",
    "/prescriptions",
    "/profile",
    "/schedule",
    "/video-consultations",
    "/admin/invitations",
    "/doctor/appointments-summary",
    "/doctor/revenue",
    "/doctor/schedule",
  ]);
  const protectedRoutePrefixes = [
    "/appointments/",
    "/patients/",
  ];
  const isProtectedRoute =
    protectedExactRoutes.has(pathname) ||
    protectedRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

  // Allow API routes and any static asset request from /public.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Helper function to create non-cached redirect
  const createRedirect = (url: string, clearCookie = false) => {
    const response = NextResponse.redirect(new URL(url, request.url));
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    if (clearCookie) {
      response.cookies.set("better-auth.session_token", "", {
        maxAge: 0,
        path: "/",
      });
    }
    return response;
  };

  // Fast cookie presence check — skip DB hit for routes that don't need it
  const hasCookie = !!request.cookies.get("better-auth.session_token")?.value;

  // Root path "/" - validate session properly so stale cookies don't block marketing page
  if (pathname === "/") {
    if (hasCookie) {
      const valid = await isValidSession(request);
      if (valid) return createRedirect("/dashboard");
      // Stale/expired cookie — clear it and serve marketing page directly
      const response = NextResponse.next();
      response.cookies.set("better-auth.session_token", "", {
        maxAge: 0,
        path: "/",
      });
      return response;
    }
    return NextResponse.next();
  }

  // If not authenticated and trying to access protected route
  if (!hasCookie && isProtectedRoute) {
    return createRedirect("/login");
  }

  // For protected routes with a cookie, validate the session
  if (hasCookie && isProtectedRoute) {
    const valid = await isValidSession(request);
    if (!valid) return createRedirect("/login", true);
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  const isInviteRegistrationPage = pathname === "/register/doctor";

  if (
    hasCookie &&
    (pathname.startsWith("/login") ||
      (pathname.startsWith("/register") && !isInviteRegistrationPage))
  ) {
    const valid = await isValidSession(request);
    if (valid) return createRedirect("/dashboard");
    // Stale cookie on auth page — clear it and let them through
    const response = NextResponse.next();
    response.cookies.set("better-auth.session_token", "", {
      maxAge: 0,
      path: "/",
    });
    return response;
  }

  // Add no-cache headers to protected pages
  const response = NextResponse.next();
  if (isProtectedRoute) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
