import type { NextRequest } from "next/server";

const FALLBACK_APP_URL = "http://localhost:3000";

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

export function getAppBaseUrl(request?: NextRequest) {
  const requestOrigin = request?.nextUrl?.origin;
  if (requestOrigin) {
    return trimTrailingSlash(requestOrigin);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL);
  }

  if (process.env.BETTER_AUTH_URL) {
    return trimTrailingSlash(process.env.BETTER_AUTH_URL);
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${trimTrailingSlash(process.env.VERCEL_PROJECT_PRODUCTION_URL)}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${trimTrailingSlash(process.env.VERCEL_URL)}`;
  }

  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${trimTrailingSlash(process.env.VERCEL_BRANCH_URL)}`;
  }

  return FALLBACK_APP_URL;
}
