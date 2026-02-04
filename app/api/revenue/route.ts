import { NextRequest, NextResponse } from "next/server";
import { db, payments, appointments } from "@/lib/db";
import { eq, desc, or } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user data to get role
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const normalizedRole = user.role?.toUpperCase();

    // Only doctors can view revenue
    if (normalizedRole !== "DOCTOR") {
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

    // First, get appointment IDs that this doctor has handled
    const doctorAppointments = await db.query.appointments.findMany({
      where: or(
        eq(appointments.approvedBy, userId),
        eq(appointments.rescheduledBy, userId)
      ),
      columns: { id: true },
    });

    const appointmentIds = doctorAppointments.map((a) => a.id);

    if (appointmentIds.length === 0) {
      // No appointments handled by this doctor yet
      return NextResponse.json({
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
      });
    }

    // Fetch payments only for appointments this doctor has handled
    const allPaymentsWithAppointment = await db.query.payments.findMany({
      where: eq(payments.status, "PAID"),
      with: {
        appointment: true,
      },
      orderBy: [desc(payments.createdAt)],
    });

    // Filter to only payments for this doctor's appointments
    const allPayments = allPaymentsWithAppointment.filter(
      (p) => appointmentIds.includes(p.appointmentId)
    );

    // Calculate total revenue
    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // Get pending payments for this doctor's appointments
    const pendingPaymentsWithAppointment = await db.query.payments.findMany({
      where: eq(payments.status, "PENDING"),
      with: {
        appointment: true,
      },
    });

    const pendingPayments = pendingPaymentsWithAppointment.filter(
      (p) => appointmentIds.includes(p.appointmentId)
    );
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
