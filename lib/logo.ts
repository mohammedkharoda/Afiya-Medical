export const APP_LOGO_PATH = "/logos.png";

const APP_BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const APP_LOGO_URL = `${APP_BASE_URL}${APP_LOGO_PATH}`;
