import { createAuthClient } from "better-auth/react";

// Use empty baseURL to make requests relative to current origin
// This avoids CORS issues when using custom domains (afiya.co.in vs vercel.app)
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Extended user type with role
export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export interface ExtendedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
