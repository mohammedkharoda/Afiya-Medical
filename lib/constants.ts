// Clinic Constants
export const CLINIC_NAME = "Afiya Medical Clinic";

// Appointment Settings
export const APPOINTMENT_DURATION_MINUTES = 30;
export const WORKING_HOURS = {
  start: "09:00",
  end: "17:00",
};

// Notification Messages
export const NOTIFICATION_MESSAGES = {
  APPOINTMENT_BOOKED_PATIENT: (date: string, time: string) =>
    `Your appointment has been scheduled for ${date} at ${time}. We'll send you a reminder before your visit.`,

  APPOINTMENT_BOOKED_DOCTOR: (
    patientName: string,
    date: string,
    time: string,
  ) => `New appointment booked by ${patientName} for ${date} at ${time}.`,

  APPOINTMENT_CONFIRMED: (date: string, time: string, doctorName: string) =>
    `Your appointment on ${date} at ${time} has been confirmed by ${doctorName}.`,

  APPOINTMENT_COMPLETED: (date: string) =>
    `Your appointment on ${date} has been marked as completed. Thank you for visiting ${CLINIC_NAME}.`,

  APPOINTMENT_CANCELLED: (date: string, time: string) =>
    `Your appointment on ${date} at ${time} has been cancelled. Please book a new appointment if needed.`,

  APPOINTMENT_REMINDER: (date: string, time: string, doctorName: string) =>
    `Reminder: You have an appointment tomorrow at ${time} with ${doctorName}.`,

  PRESCRIPTION_READY: () =>
    `Your prescription is ready. You can view it in your dashboard.`,

  PAYMENT_RECEIVED: (amount: string) =>
    `Payment of ${amount} received. Thank you!`,

  // Approval workflow messages
  APPOINTMENT_PENDING_PATIENT: (date: string, time: string) =>
    `Your appointment request for ${date} at ${time} is pending doctor approval. You will be notified once approved.`,

  APPOINTMENT_APPROVAL_NEEDED: (
    patientName: string,
    date: string,
    time: string,
  ) =>
    `New appointment request from ${patientName} for ${date} at ${time}. Please approve or decline.`,

  APPOINTMENT_APPROVED: (date: string, time: string) =>
    `Great news! Your appointment for ${date} at ${time} has been confirmed by the doctor.`,

  APPOINTMENT_DECLINED: (date: string, time: string) =>
    `Your appointment request for ${date} at ${time} was declined. Please book a different time.`,

  APPOINTMENT_CANCELLED_BY_PATIENT: (
    patientName: string,
    date: string,
    time: string,
  ) => `${patientName} has cancelled their appointment on ${date} at ${time}.`,
};

// Email Subjects
export const EMAIL_SUBJECTS = {
  APPOINTMENT_CONFIRMATION: `Appointment Confirmed - ${CLINIC_NAME}`,
  APPOINTMENT_CANCELLED: `Appointment Cancelled - ${CLINIC_NAME}`,
  APPOINTMENT_REMINDER: `Appointment Reminder - ${CLINIC_NAME}`,
  APPOINTMENT_COMPLETED: `Visit Summary - ${CLINIC_NAME}`,
  NEW_APPOINTMENT_ALERT: `New Appointment Booking - ${CLINIC_NAME}`,
  PRESCRIPTION_READY: `Your Prescription is Ready - ${CLINIC_NAME}`,
  PAYMENT_RECEIVED: `Payment Confirmation - ${CLINIC_NAME}`,
};
