import { getAppBaseUrl } from "@/lib/app-url";

export const APP_LOGO_PATH = "/logos.png";
export const APP_LOGO_URL = `${getAppBaseUrl()}${APP_LOGO_PATH}`;

export const EMAIL_LOGO_PATH = "/email-logo.png";

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");
const isLocalAssetBase = (value: string) =>
  /localhost|127\.0\.0\.1/i.test(value);

function getEmailAssetBaseUrl() {
  const explicitBases = [
    process.env.EMAIL_ASSET_BASE_URL,
    process.env.EMAIL_LOGO_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
  ].filter((value): value is string => Boolean(value));

  const firstRemoteBase = explicitBases.find((value) => !isLocalAssetBase(value));
  if (firstRemoteBase) {
    return trimTrailingSlash(firstRemoteBase);
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${trimTrailingSlash(process.env.VERCEL_PROJECT_PRODUCTION_URL)}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${trimTrailingSlash(process.env.VERCEL_URL)}`;
  }

  return "https://afiya.co.in";
}

export const EMAIL_LOGO_URL = `${getEmailAssetBaseUrl()}${EMAIL_LOGO_PATH}`;
