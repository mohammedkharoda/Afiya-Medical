// Email template configuration - Edit these values to customize your emails

export const EMAIL_CONFIG = {
  // Branding
  clinicName: "Afiya Medical Clinic",
  logoUrl:
    "https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png",
  address:
    "M/43 Joshi Gali, Near Diamond Medical Store, Khaiwala Tank Road, Indore - M.P. 452014",

  // Colors
  primaryColor: "#ccd5ae", // Warm Ivory - Main brand color
  secondaryColor: "#495057",
  successColor: "#84a98c", // Green - For completed status
  errorColor: "#f07167", // Red - For cancelled status
  warningColor: "#ffbf69", // Amber - For reminders/warnings
  infoColor: "#a9def9", // Blue - For information boxes

  // Text colors
  textPrimary: "#1f2937",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  textLight: "#9ca3af",

  // Background colors
  bgLight: "#f3f4f6",
  bgWarning: "#fef3c7",
  bgSuccess: "#d1fae5",
  bgInfo: "#dbeafe",

  // Border colors
  borderColor: "#e5e7eb",
};

export const EMAIL_SUBJECTS = {
  verification: (clinicName: string) => `Verify your email - ${clinicName}`,
  passwordReset: (clinicName: string) => `Reset your password - ${clinicName}`,
  welcome: (clinicName: string) =>
    `Welcome to ${clinicName} — verify your account`,
  otp: (clinicName: string) => `Your verification code - ${clinicName}`,
  appointmentConfirmed: (clinicName: string) =>
    `Appointment Confirmed - ${clinicName}`,
  newAppointment: (clinicName: string) =>
    `New Appointment Booking - ${clinicName}`,
  appointmentReminder: (clinicName: string) =>
    `Reminder: Your appointment is in 30 minutes - ${clinicName}`,
  appointmentCompleted: (clinicName: string) =>
    `Visit Completed - ${clinicName}`,
  appointmentCancelled: (clinicName: string) =>
    `Appointment Cancelled - ${clinicName}`,
  appointmentRescheduled: (clinicName: string) =>
    `Appointment Rescheduled - ${clinicName}`,
  appointmentUpdate: (clinicName: string) =>
    `Appointment Update - ${clinicName}`,
  prescription: (doctorName: string, clinicName: string) =>
    `New Prescription from Dr. ${doctorName} - ${clinicName}`,
};
