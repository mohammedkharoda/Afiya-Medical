"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ClipboardList,
  User,
  Users,
  LogOut,
  Menu,
  X,
  CreditCard,
  ChevronDown,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import Image from "next/image";
import { PusherBeamsProvider } from "@/components/pusher-beams-provider";
import { useLoadingStore } from "@/stores/loading-store";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useSessionValidator } from "@/hooks/use-session-validator";

type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
    roles: ["PATIENT", "DOCTOR"],
  },
  {
    label: "Appointments",
    href: "/appointments",
    icon: <Calendar size={20} />,
    roles: ["PATIENT", "DOCTOR", "ADMIN"],
  },
  {
    label: "My Patients",
    href: "/patients",
    icon: <Users size={20} />,
    roles: ["DOCTOR", "ADMIN"],
  },
  {
    label: "Schedule Management",
    href: "/doctor/schedule",
    icon: <Clock size={20} />,
    roles: ["DOCTOR", "ADMIN"],
  },
  {
    label: "Revenue Dashboard",
    href: "/doctor/revenue",
    icon: <TrendingUp size={20} />,
    roles: ["DOCTOR", "ADMIN"],
  },
  {
    label: "Prescriptions",
    href: "/prescriptions",
    icon: <FileText size={20} />,
    roles: ["PATIENT"],
  },
  {
    label: "Medical History",
    href: "/medical-history",
    icon: <ClipboardList size={20} />,
    roles: ["PATIENT"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: <CreditCard size={20} />,
    roles: ["PATIENT", "DOCTOR", "ADMIN"],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use Zustand store for loading state
  const { userData, setUserData, setMinimumTimeElapsed, isFullyLoaded } =
    useLoadingStore();

  // Ensure consistent hydration by only rendering dropdowns after mount
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Set minimum time elapsed (300ms to prevent flash on fast connections)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [setMinimumTimeElapsed]);

  // Fetch user data with role from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });
        console.log("API response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched user data:", data);
          setUserData(data.user);
        } else if (response.status === 401) {
          // Session expired - sign out and redirect to login
          console.log("Session expired, signing out and redirecting to login");
          try {
            await signOut();
          } catch (e) {
            console.log("SignOut error (ignored):", e);
          }
          window.location.href = "/login?expired=true";
          return;
        } else {
          console.log("API error:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    // Fetch immediately on mount, don't wait for session
    fetchUserData();
  }, [setUserData]);

  const userRole = userData?.role;
  const rawName = userData?.name || session?.user?.name || "";
  const userEmail = userData?.email || session?.user?.email || "";
  const userImage = userData?.image || session?.user?.image;
  const displayName =
    rawName || (userEmail ? userEmail.split("@")[0] : "Patient");

  // Session validation with role-based intervals
  // Patients: check every 30 seconds (30 min session)
  // Doctors/Admins: check every 2 minutes
  const sessionCheckInterval = userRole === "PATIENT" ? 30000 : 120000;
  useSessionValidator({
    intervalMs: sessionCheckInterval,
    validateOnFocus: true,
  });

  // Filter nav items based on role - only filter once role is loaded
  const isRoleLoaded = !!userRole;
  const filteredNavItems = isRoleLoaded
    ? navItems.filter((item) => !item.roles || item.roles.includes(userRole))
    : [];

  const handleSignOut = async () => {
    // Helper to clear all auth cookies on client side
    const clearAuthCookies = () => {
      const isProduction = window.location.hostname !== "localhost";
      const domain = isProduction ? window.location.hostname : "";

      // Cookie clearing options for different scenarios
      const cookieOptions = [
        // Basic clear
        `better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
        // With domain
        `better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`,
        // With secure and sameSite for production
        `better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax;`,
        // Full production clear
        `better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}; secure; samesite=lax;`,
      ];

      cookieOptions.forEach((cookie) => {
        document.cookie = cookie;
      });
    };

    try {
      // Use our custom logout API that properly clears server-side cookies
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Also try better-auth signOut
      try {
        await signOut();
      } catch {
        // Ignore better-auth signOut errors
      }

      // Clear client-side cookies as fallback
      clearAuthCookies();

      // Hard redirect to login page
      window.location.href = "/login";
    } catch {
      // Clear cookies and redirect anyway on error
      clearAuthCookies();
      window.location.href = "/login";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isLoading = !isFullyLoaded();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-border transition-transform duration-200 ease-in-out lg:relative lg:transform-none lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isLoading ? "pointer-events-none" : ""}`}
      >
        <div className="flex h-full flex-col bg-white">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center border-b border-border px-4 relative">
            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <Image
                src="https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png"
                alt="Afiya Logo"
                width={44}
                height={44}
                className="rounded-lg"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {!isRoleLoaded ? (
              // Skeleton loading for nav items
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  >
                    <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                    <div
                      className="h-4 rounded bg-muted animate-pulse"
                      style={{ width: `${60 + ((i * 10) % 40)}%` }}
                    />
                  </div>
                ))}
              </>
            ) : (
              // Actual nav items
              filteredNavItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? "bg-gray-800 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                    )}
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })
            )}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-4 lg:px-6 shrink-0 ${isLoading ? "pointer-events-none" : ""}`}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <h1 className="font-heading text-lg font-semibold text-foreground lg:text-xl">
              {filteredNavItems.find((item) => item.href === pathname)?.label ||
                "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* User dropdown - only render after mount to avoid hydration mismatch */}
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userImage || undefined} />
                      <AvatarFallback className="bg-white text-primary border border-border text-xs">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium md:inline-block">
                      {displayName}
                    </span>
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User size={16} />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white text-primary border border-border text-xs">
                    ...
                  </AvatarFallback>
                </Avatar>
                <ChevronDown size={16} className="text-muted-foreground" />
              </Button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          <PusherBeamsProvider userId={userData?.id} userRole={userData?.role}>
            {isLoading ? <LoadingOverlay isLoading={true} /> : children}
          </PusherBeamsProvider>
        </main>
      </div>
    </div>
  );
}
