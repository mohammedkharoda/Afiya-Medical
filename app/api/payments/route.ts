import { NextRequest, NextResponse } from "next/server";
import {
  db,
  patientProfiles,
  payments,
  appointments,
  prescriptions,
  medications,
  users,
  doctorProfiles,
} from "@/lib/db";
import { eq, desc, or, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { sendPrescriptionEmail, sendBillingEmail } from "@/lib/email";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const normalizedRole = role?.toUpperCase();

    let paymentsList;

    if (normalizedRole === "PATIENT") {
      const patientProfile = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.userId, userId),
      });

      if (!patientProfile) {
        return NextResponse.json({ payments: [] });
      }

      paymentsList = await db.query.payments.findMany({
        with: {
          appointment: true,
        },
        orderBy: [desc(payments.createdAt)],
      });

      // Filter payments for patient's appointments
      paymentsList = paymentsList.filter(
        (p) => p.appointment.patientId === patientProfile.id,
      );
    } else if (normalizedRole === "DOCTOR" || normalizedRole === "ADMIN") {
      paymentsList = await db.query.payments.findMany({
        with: {
          appointment: {
            with: {
              patient: {
                with: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: [desc(payments.createdAt)],
      });
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    return NextResponse.json({ payments: paymentsList });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedRole = session.user.role?.toUpperCase();

    // Only doctors and admins can record payments
    if (normalizedRole !== "DOCTOR" && normalizedRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { appointmentId, amount, paymentMethod, notes, isPaid } = body;

    const [payment] = await db
      .insert(payments)
      .values({
        appointmentId,
        amount,
        paymentMethod: paymentMethod || "CASH",
        notes,
        status: isPaid !== false ? "PAID" : "PENDING",
        paidAt: isPaid !== false ? new Date() : null,
      })
      .returning();

    // Update appointment payment status
    if (isPaid !== false) {
      await db
        .update(appointments)
        .set({ paymentStatus: "PAID" })
        .where(eq(appointments.id, appointmentId));
    } else {
      // Mark bill as sent and send billing email to patient
      await db
        .update(appointments)
        .set({ billSent: true, billSentAt: new Date() })
        .where(eq(appointments.id, appointmentId));

      // Get appointment with patient and doctor details for billing email
      const appointment = await db.query.appointments.findFirst({
        where: eq(appointments.id, appointmentId),
        with: {
          patient: {
            with: {
              user: true,
            },
          },
        },
      });

      if (appointment?.patient?.user?.email) {
        const doctorId = appointment.doctorId || session.user.id;
        const doctor = await db.query.users.findFirst({
          where: eq(users.id, doctorId),
        });
        const docProfile = await db.query.doctorProfiles.findFirst({
          where: eq(doctorProfiles.userId, doctorId),
        });

        sendBillingEmail({
          patientEmail: appointment.patient.user.email,
          patientName: appointment.patient.user.name,
          doctorName: doctor?.name || "Doctor",
          doctorSpeciality: docProfile?.speciality || "General Physician",
          appointmentDate: format(
            new Date(appointment.appointmentDate),
            "dd MMM yyyy",
          ),
          appointmentTime: appointment.appointmentTime,
          consultationFee: amount,
          upiId: docProfile?.upiId || undefined,
          upiQrCode: docProfile?.upiQrCode || undefined,
          symptoms: appointment.symptoms,
          clinicAddress: docProfile?.clinicAddress || undefined,
        }).catch((err) => console.error("Error sending billing email:", err));
      }
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);

    const normalizedRole = session?.user?.role?.toUpperCase();

    if (
      !session ||
      (normalizedRole !== "DOCTOR" && normalizedRole !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, status } = body;

    const [payment] = await db
      .update(payments)
      .set({
        status,
        paidAt: status === "PAID" ? new Date() : null,
      })
      .where(eq(payments.id, paymentId))
      .returning();

    // Update appointment payment status
    await db
      .update(appointments)
      .set({ paymentStatus: status })
      .where(eq(appointments.id, payment.appointmentId));

    // If payment is marked as PAID, send prescription email
    if (status === "PAID") {
      // Get appointment with prescription and patient details
      const appointment = await db.query.appointments.findFirst({
        where: eq(appointments.id, payment.appointmentId),
        with: {
          patient: {
            with: {
              user: true,
            },
          },
          prescription: {
            with: {
              medications: true,
            },
          },
        },
      });

      if (appointment?.prescription && appointment.patient?.user?.email) {
        // Get doctor details
        const doctorId = appointment.doctorId || appointment.approvedBy;
        const doctor = doctorId
          ? await db.query.users.findFirst({
              where: eq(users.id, doctorId),
            })
          : null;
        const doctorProfile = doctorId
          ? await db.query.doctorProfiles.findFirst({
              where: eq(doctorProfiles.userId, doctorId),
              columns: {
                clinicAddress: true,
              },
            })
          : null;

        // Mark prescription as sent
        await db
          .update(appointments)
          .set({
            prescriptionSent: true,
            prescriptionSentAt: new Date(),
          })
          .where(eq(appointments.id, appointment.id));

        // Send prescription email (don't await to avoid blocking response)
        sendPrescriptionEmail({
          patientEmail: appointment.patient.user.email,
          patientName: appointment.patient.user.name,
          doctorName: doctor?.name || "Doctor",
          diagnosis: appointment.prescription.diagnosis,
          medications: appointment.prescription.medications.map((med) => ({
            medicineName: med.medicineName,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
          })),
          notes: appointment.prescription.notes || undefined,
          followUpDate: appointment.prescription.followUpDate
            ? format(
                new Date(appointment.prescription.followUpDate),
                "dd MMM yyyy",
              )
            : undefined,
          prescriptionDate: format(
            new Date(appointment.prescription.createdAt),
            "dd MMM yyyy",
          ),
          attachmentUrl: appointment.prescription.attachmentUrl || undefined,
          clinicAddress: doctorProfile?.clinicAddress || undefined,
        }).catch((err) =>
          console.error("Error sending prescription email:", err),
        );
      }
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
