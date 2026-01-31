"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  IndianRupee,
} from "lucide-react";
import { format } from "date-fns";

interface RevenueData {
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  todayRevenue: number;
  thisMonthRevenue: number;
  dailyBreakdown: Array<{ date: string; amount: number }>;
  monthlyBreakdown: Array<{ month: string; amount: number }>;
  paymentMethodBreakdown: Array<{ method: string; amount: number }>;
  topEarningDays: Array<{ date: string; amount: number }>;
  totalPayments: number;
  pendingPayments: number;
}

export default function RevenuePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userData, setUserData] = useState<{ role?: string } | null>(null);

  // Fetch user data to check role
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Revenue page - User data:", data.user);
          setUserData(data.user);

          // Check if user is doctor (case-insensitive)
          const userRole = data.user?.role?.toUpperCase();
          if (userRole !== "DOCTOR" && userRole !== "ADMIN") {
            console.log("User is not a doctor, redirecting. Role:", userRole);
            router.push("/dashboard");
            return;
          }

          // Set default date range (last 30 days)
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 30);

          setStartDate(format(start, "yyyy-MM-dd"));
          setEndDate(format(end, "yyyy-MM-dd"));

          fetchRevenue(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to fetch user data:",
            response.status,
            errorText,
          );
          // Only redirect if unauthorized
          if (response.status === 401) {
            router.push("/login");
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fetchRevenue = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.append("startDate", start);
      if (end) params.append("endDate", end);

      const response = await fetch(`/api/revenue?${params.toString()}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setRevenueData(data);
      } else {
        toast.error("Failed to load revenue data");
      }
    } catch (error) {
      console.error("Error fetching revenue:", error);
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      fetchRevenue(startDate, endDate);
    }
  };

  const exportToCSV = () => {
    if (!revenueData) return;

    const csvContent = [
      ["Date", "Amount"],
      ...revenueData.dailyBreakdown.map((item) => [item.date, item.amount]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Revenue data exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Create default empty data if no revenue data
  const displayData: RevenueData = revenueData || {
    totalRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0,
    todayRevenue: 0,
    thisMonthRevenue: 0,
    dailyBreakdown: [],
    monthlyBreakdown: [],
    paymentMethodBreakdown: [],
    topEarningDays: [],
    totalPayments: 0,
    pendingPayments: 0,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track your earnings and payment analytics
          </p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleDateRangeChange}>Apply Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-green-700">
                  ₹{displayData.totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">This Month</p>
                <p className="text-2xl font-bold text-blue-700">
                  ₹{displayData.thisMonthRevenue.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Today</p>
                <p className="text-2xl font-bold text-purple-700">
                  ₹{displayData.todayRevenue.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-600">Pending</p>
                <p className="text-2xl font-bold text-amber-700">
                  ₹{displayData.pendingAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Breakdown</CardTitle>
          <CardDescription>
            Revenue distribution by payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayData.paymentMethodBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No payment data yet
            </p>
          ) : (
            <div className="space-y-3">
              {displayData.paymentMethodBreakdown.map((item) => {
                const percentage =
                  displayData.totalRevenue > 0
                    ? (item.amount / displayData.totalRevenue) * 100
                    : 0;
                return (
                  <div key={item.method} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.method}</span>
                      <span className="text-muted-foreground">
                        ₹{item.amount.toLocaleString("en-IN")} (
                        {percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Earning Days */}
      <Card>
        <CardHeader>
          <CardTitle>Top Earning Days</CardTitle>
          <CardDescription>Your highest revenue days</CardDescription>
        </CardHeader>
        <CardContent>
          {displayData.topEarningDays.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No earnings data yet
            </p>
          ) : (
            <div className="space-y-2">
              {displayData.topEarningDays.slice(0, 10).map((item, index) => (
                <div
                  key={item.date}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium">
                      {format(new Date(item.date), "MMMM d, yyyy")}
                    </span>
                  </div>
                  <span className="font-semibold text-green-600">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Revenue by month</CardDescription>
        </CardHeader>
        <CardContent>
          {displayData.monthlyBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No monthly data yet
            </p>
          ) : (
            <div className="space-y-3">
              {displayData.monthlyBreakdown.map((item) => {
                const maxAmount = Math.max(
                  ...displayData.monthlyBreakdown.map((m) => m.amount),
                );
                const percentage =
                  maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                return (
                  <div key={item.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {format(new Date(item.month + "-01"), "MMMM yyyy")}
                      </span>
                      <span className="text-muted-foreground">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Payments:</span>
              <span className="font-semibold">{displayData.totalPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Payments:</span>
              <span className="font-semibold text-amber-600">
                {displayData.pendingPayments}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Average per Payment:
              </span>
              <span className="font-semibold">
                ₹
                {displayData.totalPayments > 0
                  ? (
                      displayData.totalRevenue / displayData.totalPayments
                    ).toFixed(2)
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
