import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { sendVerificationEmail } from "./email";

// Get trusted origins for CORS
const getTrustedOrigins = (): string[] => {
  const origins: string[] = ["http://localhost:3000"];

  // Add custom domain if configured
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  // Add Vercel production URL (yourapp.vercel.app)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  // Add Vercel preview/branch URLs
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  // Add Vercel branch URL
  if (process.env.VERCEL_BRANCH_URL) {
    origins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  }

  return origins;
};

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  trustedOrigins: getTrustedOrigins(),
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: isProduction,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  session: {
    expiresIn: 60 * 60, // 1 hour (patient default, role-based checks in session.ts)
    updateAge: 60 * 30, // 30 minutes
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "PATIENT",
        input: false,
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
});

export type Session = typeof auth.$Infer.Session;
