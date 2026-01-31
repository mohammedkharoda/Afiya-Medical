import PusherClient from "pusher-js";

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn(
      "Pusher credentials not configured. Real-time features disabled.",
    );
    return null;
  }

  if (!pusherClient) {
    pusherClient = new PusherClient(key, {
      cluster: cluster,
    });
  }
  return pusherClient;
}

// Channel names (must match server-side)
export const CHANNELS = {
  NOTIFICATIONS: "notifications",
  APPOINTMENTS: "appointments",
};

// Event names (must match server-side)
export const EVENTS = {
  NEW_NOTIFICATION: "new-notification",
  APPOINTMENT_CREATED: "appointment-created",
  APPOINTMENT_UPDATED: "appointment-updated",
};
