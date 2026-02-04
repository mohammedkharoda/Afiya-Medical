import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Enums
export const roleEnum = pgEnum("Role", ["PATIENT", "DOCTOR", "ADMIN"]);
export const genderEnum = pgEnum("Gender", ["MALE", "FEMALE", "OTHER"]);
export const documentTypeEnum = pgEnum("DocumentType", [
  "REPORT",
  "XRAY",
  "SCAN",
  "PRESCRIPTION",
  "OTHER",
]);
export const appointmentStatusEnum = pgEnum("AppointmentStatus", [
  "PENDING", // Initial state when patient books, awaiting doctor approval
  "SCHEDULED", // Approved by doctor
  "COMPLETED",
  "CANCELLED",
  "DECLINED", // Doctor declined the appointment request
  "RESCHEDULED",
]);
export const paymentStatusEnum = pgEnum("PaymentStatus", ["PENDING", "PAID"]);
export const paymentMethodEnum = pgEnum("PaymentMethod", [
  "CASH",
  "CARD",
  "UPI_MANUAL",
  "UPI_QR",
  "ONLINE",
]);
export const invitationStatusEnum = pgEnum("InvitationStatus", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);

// Tables
export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified").default(false).notNull(),
    password: text("password"),
    role: roleEnum("role").default("PATIENT").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    image: text("image"),
    isVerified: boolean("isVerified").default(false).notNull(),
    verificationToken: text("verificationToken"),
    createdAt: timestamp("createdAt")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

// Better Auth required tables
export const sessions = pgTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: timestamp("createdAt")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Doctor profile for specializations, payment info
export const doctorProfiles = pgTable(
  "doctor_profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    speciality: text("speciality").notNull(), // e.g., "General Physician", "Cardiologist"
    degrees: text("degrees").array().default([]).notNull(), // e.g., ["MBBS", "MD"]
    experience: integer("experience"), // years of experience
    upiId: text("upiId").notNull(), // Required for receiving payments, e.g., "doctor@upi"
    upiQrCode: text("upiQrCode"), // Cloudinary URL for QR code image
    clinicAddress: text("clinicAddress"), // Clinic address for patient emails
    bio: text("bio"),
    isTestAccount: boolean("isTestAccount").default(false).notNull(),
    createdAt: timestamp("createdAt")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("doctor_profiles_user_id_idx").on(table.userId)],
);

export const patientProfiles = pgTable(
  "patient_profiles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    preferredDoctorId: text("preferredDoctorId").references(() => users.id, {
      onDelete: "set null",
    }), // Preferred doctor selected during registration
    dob: timestamp("dob").notNull(),
    gender: genderEnum("gender").notNull(),
    bloodGroup: text("bloodGroup"),
    address: text("address").notNull(),
    emergencyContact: text("emergencyContact").notNull(),
    hasCompletedMedicalHistory: boolean("hasCompletedMedicalHistory")
      .default(false)
      .notNull(),
    createdAt: timestamp("createdAt")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("patient_profiles_user_id_idx").on(table.userId)],
);

export const medicalHistory = pgTable(
  "medical_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    patientId: text("patientId")
      .notNull()
      .references(() => patientProfiles.id, { onDelete: "cascade" }),
    conditions: text("conditions").array().default([]).notNull(),
    allergies: text("allergies").array().default([]).notNull(),
    currentMedications: text("currentMedications")
      .array()
      .default([])
      .notNull(),
    surgeries: text("surgeries").array().default([]).notNull(),
    familyHistory: text("familyHistory"),
    createdAt: timestamp("createdAt")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("medical_history_patient_id_idx").on(table.patientId),
  ],
);

export const medicalDocuments = pgTable("medical_documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  patientId: text("patientId")
    .notNull()
    .references(() => patientProfiles.id, { onDelete: "cascade" }),
  documentType: documentTypeEnum("documentType").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileName: text("fileName").notNull(),
  description: text("description"),
  uploadedAt: timestamp("uploadedAt")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const appointments = pgTable("appointments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  patientId: text("patientId")
    .notNull()
    .references(() => patientProfiles.id, { onDelete: "cascade" }),
  doctorId: text("doctorId").references(() => users.id, {
    onDelete: "set null",
  }), // Which doctor this appointment is for
  appointmentDate: timestamp("appointmentDate").notNull(),
  appointmentTime: text("appointmentTime").notNull(),
  status: appointmentStatusEnum("status").default("PENDING").notNull(),
  symptoms: text("symptoms").notNull(),
  notes: text("notes"),
  paymentStatus: paymentStatusEnum("paymentStatus")
    .default("PENDING")
    .notNull(),
  // Bill sent tracking
  billSent: boolean("billSent").default(false).notNull(),
  billSentAt: timestamp("billSentAt"),
  // Prescription sent tracking
  prescriptionSent: boolean("prescriptionSent").default(false).notNull(),
  prescriptionSentAt: timestamp("prescriptionSentAt"),
  // Approval tracking
  approvedAt: timestamp("approvedAt"),
  approvedBy: text("approvedBy"), // userId who approved
  // Decline tracking
  declinedAt: timestamp("declinedAt"),
  declinedBy: text("declinedBy"), // userId who declined
  declineReason: text("declineReason"),
  // Cancellation tracking
  cancellationReason: text("cancellationReason"),
  cancelledAt: timestamp("cancelledAt"),
  cancelledBy: text("cancelledBy"), // userId who cancelled
  // Rescheduling tracking
  originalAppointmentDate: timestamp("originalAppointmentDate"),
  originalAppointmentTime: text("originalAppointmentTime"),
  rescheduledBy: text("rescheduledBy"), // userId who rescheduled
  rescheduledAt: timestamp("rescheduledAt"),
  // Reminder tracking
  reminderSent: boolean("reminderSent").default(false).notNull(),
  createdAt: timestamp("createdAt")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    appointmentId: text("appointmentId")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    diagnosis: text("diagnosis").notNull(),
    notes: text("notes"),
    followUpDate: timestamp("followUpDate"),
    attachmentUrl: text("attachmentUrl"), // Cloudinary URL
    attachmentPublicId: text("attachmentPublicId"), // Cloudinary public ID for deletion
    createdAt: timestamp("createdAt")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("prescriptions_appointment_id_idx").on(table.appointmentId),
  ],
);

export const medications = pgTable("medications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  prescriptionId: text("prescriptionId")
    .notNull()
    .references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineName: text("medicineName").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  duration: text("duration").notNull(),
  instructions: text("instructions"),
});

export const doctorSchedule = pgTable(
  "doctor_schedule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    doctorId: text("doctorId").references(() => users.id, {
      onDelete: "set null",
    }), // Which doctor this schedule belongs to
    scheduleDate: timestamp("scheduleDate").notNull(), // Specific date for the schedule
    startTime: text("startTime").notNull(), // HH:mm format
    endTime: text("endTime").notNull(), // HH:mm format
    breakStartTime: text("breakStartTime"), // HH:mm format (optional)
    breakEndTime: text("breakEndTime"), // HH:mm format (optional)
    slotDuration: integer("slotDuration").notNull(), // in minutes
    maxPatientsPerSlot: integer("maxPatientsPerSlot").default(1).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("doctor_schedule_doctor_date_idx").on(
      table.doctorId,
      table.scheduleDate,
    ),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    appointmentId: text("appointmentId")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    amount: doublePrecision("amount").notNull(),
    paymentMethod: paymentMethodEnum("paymentMethod").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    paidAt: timestamp("paidAt"),
    notes: text("notes"),
    paymentScreenshot: text("paymentScreenshot"),
    createdAt: timestamp("createdAt")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("payments_appointment_id_idx").on(table.appointmentId),
  ],
);

export const doctorInvitations = pgTable(
  "doctor_invitations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    name: text("name"),
    token: text("token").notNull().unique(),
    status: invitationStatusEnum("status").default("PENDING").notNull(),
    invitedBy: text("invitedBy")
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp("expiresAt").notNull(),
    acceptedAt: timestamp("acceptedAt"),
    isTestAccount: boolean("isTestAccount").default(false).notNull(),
    createdAt: timestamp("createdAt")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("doctor_invitations_token_idx").on(table.token)],
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  patientProfile: one(patientProfiles, {
    fields: [users.id],
    references: [patientProfiles.userId],
  }),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const doctorProfilesRelations = relations(doctorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [doctorProfiles.userId],
    references: [users.id],
  }),
}));

export const patientProfilesRelations = relations(
  patientProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [patientProfiles.userId],
      references: [users.id],
    }),
    medicalHistory: one(medicalHistory, {
      fields: [patientProfiles.id],
      references: [medicalHistory.patientId],
    }),
    medicalDocuments: many(medicalDocuments),
    appointments: many(appointments),
  }),
);

export const medicalHistoryRelations = relations(medicalHistory, ({ one }) => ({
  patient: one(patientProfiles, {
    fields: [medicalHistory.patientId],
    references: [patientProfiles.id],
  }),
}));

export const medicalDocumentsRelations = relations(
  medicalDocuments,
  ({ one }) => ({
    patient: one(patientProfiles, {
      fields: [medicalDocuments.patientId],
      references: [patientProfiles.id],
    }),
  }),
);

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patientProfiles, {
    fields: [appointments.patientId],
    references: [patientProfiles.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
  prescription: one(prescriptions, {
    fields: [appointments.id],
    references: [prescriptions.appointmentId],
  }),
  payment: one(payments, {
    fields: [appointments.id],
    references: [payments.appointmentId],
  }),
}));

export const prescriptionsRelations = relations(
  prescriptions,
  ({ one, many }) => ({
    appointment: one(appointments, {
      fields: [prescriptions.appointmentId],
      references: [appointments.id],
    }),
    medications: many(medications),
  }),
);

export const medicationsRelations = relations(medications, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [medications.prescriptionId],
    references: [prescriptions.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  appointment: one(appointments, {
    fields: [payments.appointmentId],
    references: [appointments.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type NewDoctorProfile = typeof doctorProfiles.$inferInsert;
export type PatientProfile = typeof patientProfiles.$inferSelect;
export type NewPatientProfile = typeof patientProfiles.$inferInsert;
export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type NewMedicalHistory = typeof medicalHistory.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;
export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;
export type DoctorSchedule = typeof doctorSchedule.$inferSelect;
export type NewDoctorSchedule = typeof doctorSchedule.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type DoctorInvitation = typeof doctorInvitations.$inferSelect;
export type NewDoctorInvitation = typeof doctorInvitations.$inferInsert;
