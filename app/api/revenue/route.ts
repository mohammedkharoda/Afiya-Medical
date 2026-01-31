import { NextRequest, NextResponse } from "next/server";
import { db, payments } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user data to get role
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const normalizedRole = user.role?.toUpperCase();

    // Only doctors can view revenue
    if (normalizedRole !== "DOCTOR" && normalizedRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only doctors can view revenue" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "monthly";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate: Date = new Date();

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      // Default to last 30 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch all paid payments
    const allPayments = await db.query.payments.findMany({
      where: eq(payments.status, "PAID"),
      orderBy: [desc(payments.createdAt)],
    });

    // Calculate total revenue
    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // Get pending payments (completed appointments but not paid)
    const pendingPayments = await db.query.payments.findMany({
      where: eq(payments.status, "PENDING"),
    });
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // Daily breakdown
    const dailyBreakdown = new Map<string, number>();
    allPayments.forEach((payment) => {
      if (payment.paidAt) {
        const dateKey = payment.paidAt.toISOString().split("T")[0];
        const current = dailyBreakdown.get(dateKey) || 0;
        dailyBreakdown.set(dateKey, current + payment.amount);
      }
    });

    const dailyBreakdownArray = Array.from(dailyBreakdown.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Monthly breakdown
    const monthlyBreakdown = new Map<string, number>();
    allPayments.forEach((payment) => {
      if (payment.paidAt) {
        const monthKey = payment.paidAt.toISOString().substring(0, 7); // YYYY-MM
        const current = monthlyBreakdown.get(monthKey) || 0;
        monthlyBreakdown.set(monthKey, current + payment.amount);
      }
    });

    const monthlyBreakdownArray = Array.from(monthlyBreakdown.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Payment method breakdown
    const paymentMethodBreakdown = new Map<string, number>();
    allPayments.forEach((payment) => {
      const method = payment.paymentMethod;
      const current = paymentMethodBreakdown.get(method) || 0;
      paymentMethodBreakdown.set(method, current + payment.amount);
    });

    const paymentMethodBreakdownArray = Array.from(
      paymentMethodBreakdown.entries(),
    ).map(([method, amount]) => ({ method, amount }));

    // Top earning days (top 10)
    const topEarningDays = dailyBreakdownArray
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Today's revenue
    const today = new Date().toISOString().split("T")[0];
    const todayRevenue = dailyBreakdown.get(today) || 0;

    // This month's revenue
    const thisMonth = new Date().toISOString().substring(0, 7);
    const thisMonthRevenue = monthlyBreakdown.get(thisMonth) || 0;

    return NextResponse.json({
      totalRevenue,
      paidAmount: totalRevenue,
      pendingAmount,
      todayRevenue,
      thisMonthRevenue,
      dailyBreakdown: dailyBreakdownArray,
      monthlyBreakdown: monthlyBreakdownArray,
      paymentMethodBreakdown: paymentMethodBreakdownArray,
      topEarningDays,
      totalPayments: allPayments.length,
      pendingPayments: pendingPayments.length,
    });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
