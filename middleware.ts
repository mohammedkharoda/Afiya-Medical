import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (no session required) - "/" is NOT public, it redirects based on auth
  // Deploy version
  const publicRoutes = [
    "/login",
    "/register",
    "/register/doctor",
    "/verify-email",
    "/verify-otp",
    "/admin/login",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(route + "/") ||
      pathname.startsWith(route + "?"),
  );

  // Allow API routes and static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
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

  // Root path "/" - redirect to dashboard if authenticated, otherwise to login
  if (pathname === "/") {
    if (sessionToken) {
      return createRedirect("/dashboard");
    } else {
      return createRedirect("/login");
    }
  }

  // If not authenticated and trying to access protected route
  if (!sessionToken && !isPublicRoute) {
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
  if (!isPublicRoute) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
