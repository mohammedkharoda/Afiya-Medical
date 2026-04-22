import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // Get session from cookie
  const sessionToken = request.cookies.get("better-auth.session_token");

  // Helper function to create non-cached redirect
  const createRedirect = (url: string) => {
    const response = NextResponse.redirect(new URL(url, request.url));
    // Prevent caching of redirects
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  };

  // Root path "/" - show marketing for visitors and send authenticated users
  // straight into the product experience.
  if (pathname === "/") {
    if (sessionToken) {
      return createRedirect("/dashboard");
    }

    return NextResponse.next();
  }

  // If not authenticated and trying to access protected route
  if (!sessionToken && isProtectedRoute) {
    return createRedirect("/login");
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  // Role-based redirect will be handled by the auth pages themselves
  if (
    sessionToken &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return createRedirect("/dashboard");
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
