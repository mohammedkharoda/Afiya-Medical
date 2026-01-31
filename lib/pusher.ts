import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Public channel names
export const CHANNELS = {
  NOTIFICATIONS: "notifications",
  APPOINTMENTS: "appointments",
};

// Event names
export const EVENTS = {
  NEW_NOTIFICATION: "new-notification",
  APPOINTMENT_CREATED: "appointment-created",
  APPOINTMENT_UPDATED: "appointment-updated",
};

// Helper function to trigger notification event
export async function triggerNotification(
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: Date;
  },
) {
  try {
    await pusher.trigger(CHANNELS.NOTIFICATIONS, EVENTS.NEW_NOTIFICATION, {
      userId,
      notification,
    });
    console.log(`Pusher notification sent to user ${userId}`);
  } catch (error) {
    console.error("Error triggering Pusher notification:", error);
  }
}

// Helper function to trigger appointment update event
export async function triggerAppointmentUpdate(appointment: {
  id: string;
  status: string;
  patientId: string;
}) {
  try {
    await pusher.trigger(CHANNELS.APPOINTMENTS, EVENTS.APPOINTMENT_UPDATED, {
      appointment,
    });
    console.log(`Pusher appointment update sent for ${appointment.id}`);
  } catch (error) {
    console.error("Error triggering Pusher appointment update:", error);
  }
}

// Helper function to trigger new appointment event (for doctor notification)
export async function triggerNewAppointment(appointment: {
  id: string;
  status: string;
  patientId: string;
}) {
  try {
    await pusher.trigger(CHANNELS.APPOINTMENTS, EVENTS.APPOINTMENT_CREATED, {
      appointment,
    });
    console.log(
      `Pusher new appointment notification sent for ${appointment.id}`,
    );
  } catch (error) {
    console.error("Error triggering Pusher new appointment:", error);
  }
}
