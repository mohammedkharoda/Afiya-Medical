import { redirect } from "next/navigation";

export default function Home() {
  // This page redirects to /dashboard
  // The middleware handles authentication check:
  // - If authenticated: goes to /dashboard
  // - If not authenticated: goes to /login
  redirect("/dashboard");
}
