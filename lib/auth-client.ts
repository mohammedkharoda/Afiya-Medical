import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
