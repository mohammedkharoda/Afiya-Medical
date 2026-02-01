// Pusher Beams server-side push notification sender

const BEAMS_INSTANCE_ID = process.env.PUSHER_BEAMS_INSTANCE_ID || "";
const BEAMS_SECRET_KEY = process.env.PUSHER_BEAMS_SECRET_KEY || "";

interface WebNotification {
  title: string;
  body: string;
  icon?: string;
  deep_link?: string;
  hide_notification_if_site_has_focus?: boolean;
}

interface BeamsPublishRequest {
  interests: string[];
  web: {
    notification: WebNotification;
    data?: Record<string, unknown>;
  };
}

export async function publishToInterests(
  interests: string[],
  notification: WebNotification,
  data?: Record<string, unknown>,
): Promise<boolean> {
  if (!BEAMS_INSTANCE_ID || !BEAMS_SECRET_KEY) {
    console.warn("Pusher Beams credentials not configured");
    return false;
  }

  const url = `https://${BEAMS_INSTANCE_ID}.pushnotifications.pusher.com/publish_api/v1/instances/${BEAMS_INSTANCE_ID}/publishes`;

  const payload: BeamsPublishRequest = {
    interests,
    web: {
      notification,
      ...(data && { data }),
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BEAMS_SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pusher Beams publish error:", errorText);
      return false;
    }

    console.log(`Push notification sent to interests: ${interests.join(", ")}`);
    return true;
  } catch (error) {
    console.error("Failed to publish Pusher Beams notification:", error);
    return false;
  }
}

// Send push notification to a specific user
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  deepLink?: string,
  data?: Record<string, unknown>,
): Promise<boolean> {
  return publishToInterests(
    [`user-${userId}`],
    {
      title,
      body,
      icon: "https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png",
      deep_link: deepLink,
      hide_notification_if_site_has_focus: true,
    },
    data,
  );
}

// Send appointment confirmation push notification
export async function sendAppointmentConfirmationPush(
  userId: string,
  appointmentDate: string,
  appointmentTime: string,
): Promise<boolean> {
  return sendPushToUser(
    userId,
    "Appointment Confirmed! ✅",
    `Your appointment is scheduled for ${appointmentDate} at ${appointmentTime}`,
    "/appointments",
    { type: "APPOINTMENT_CONFIRMATION" },
  );
}

// Send appointment status change push notification
export async function sendAppointmentStatusPush(
  userId: string,
  status: "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "DECLINED",
  appointmentDate: string,
): Promise<boolean> {
  let title = "";
  let body = "";

  switch (status) {
    case "COMPLETED":
      title = "Appointment Completed ✅";
      body = `Your appointment on ${appointmentDate} has been marked as completed.`;
      break;
    case "CANCELLED":
      title = "Appointment Cancelled ❌";
      body = `Your appointment on ${appointmentDate} has been cancelled.`;
      break;
    case "RESCHEDULED":
      title = "Appointment Rescheduled 📅";
      body = `Your appointment has been rescheduled to ${appointmentDate}. Please check your dashboard for details.`;
      break;
    case "DECLINED":
      title = "Appointment Declined ❌";
      body = `Your appointment request for ${appointmentDate} has been declined by the doctor.`;
      break;
  }

  return sendPushToUser(userId, title, body, "/appointments", {
    type: "APPOINTMENT_STATUS_CHANGE",
    status,
  });
}

// Send new appointment alert to doctor
export async function sendNewAppointmentAlertPush(
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
): Promise<boolean> {
  return publishToInterests(
    ["doctor-alerts"],
    {
      title: "New Appointment Booked 📅",
      body: `${patientName} booked an appointment for ${appointmentDate} at ${appointmentTime}`,
      icon: "https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png",
      deep_link: "/appointments",
    },
    { type: "NEW_APPOINTMENT" },
  );
}

// Send general notification push
export async function sendGeneralPush(
  interests: string[],
  title: string,
  body: string,
  deepLink?: string,
): Promise<boolean> {
  return publishToInterests(interests, {
    title,
    body,
    icon: "https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png",
    deep_link: deepLink,
  });
}
