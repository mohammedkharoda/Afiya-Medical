import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (no session required) - "/" is NOT public, it redirects based on auth
  const publicRoutes = ["/login", "/register", "/register/doctor", "/verify-email", "/verify-otp", "/admin/login", "/forgot-password", "/reset-password"];
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

  // Root path "/" - redirect to dashboard if authenticated, otherwise to login
  if (pathname === "/") {
    if (sessionToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If not authenticated and trying to access protected route
  if (!sessionToken && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  // Role-based redirect will be handled by the auth pages themselves
  if (
    sessionToken &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
