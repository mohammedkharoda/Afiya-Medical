// Pusher Beams client for browser push notifications

let beamsClient: any = null;
let initializationFailed = false;

export const BEAMS_INSTANCE_ID =
  process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID || "";

export async function initializePusherBeams(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Don't retry if initialization already failed
  if (initializationFailed) return false;

  // Check if instance ID is configured
  if (!BEAMS_INSTANCE_ID) {
    console.warn(
      "Pusher Beams instance ID not configured. Push notifications disabled.",
    );
    initializationFailed = true;
    return false;
  }

  // Check if push notifications are supported
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn(
      "Push notifications not supported in this browser. Push notifications disabled.",
    );
    initializationFailed = true;
    return false;
  }

  // Check if PusherPushNotifications is available
  if (!(window as any).PusherPushNotifications) {
    console.warn("Pusher Beams SDK not loaded");
    return false;
  }

  // Check if already initialized
  if (beamsClient) return true;

  try {
    beamsClient = new (window as any).PusherPushNotifications.Client({
      instanceId: BEAMS_INSTANCE_ID,
    });

    await beamsClient.start();
    console.log("Pusher Beams initialized successfully");
    return true;
  } catch (error: any) {
    // Handle specific error types gracefully
    if (error?.name === "AbortError") {
      console.warn(
        "Push notification registration was aborted. This may happen if the browser doesn't support it or permissions were denied.",
      );
    } else if (
      error?.message?.includes("permission") ||
      error?.name === "NotAllowedError"
    ) {
      console.warn(
        "Push notification permission denied. Push notifications disabled.",
      );
    } else {
      console.error("Failed to initialize Pusher Beams:", error);
    }
    initializationFailed = true;
    beamsClient = null;
    return false;
  }
}

export async function subscribeToInterest(interest: string): Promise<boolean> {
  if (initializationFailed) return false;

  if (!beamsClient) {
    const initialized = await initializePusherBeams();
    if (!initialized) return false;
  }

  try {
    await beamsClient.addDeviceInterest(interest);
    console.log(`Subscribed to interest: ${interest}`);
    return true;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.warn(`Subscription to interest ${interest} was aborted`);
    } else {
      console.error(`Failed to subscribe to interest ${interest}:`, error);
    }
    return false;
  }
}

export async function unsubscribeFromInterest(
  interest: string,
): Promise<boolean> {
  if (!beamsClient) return false;

  try {
    await beamsClient.removeDeviceInterest(interest);
    console.log(`Unsubscribed from interest: ${interest}`);
    return true;
  } catch (error) {
    console.error(`Failed to unsubscribe from interest ${interest}:`, error);
    return false;
  }
}

export async function subscribeToUserNotifications(
  userId: string,
): Promise<boolean> {
  if (initializationFailed) return false;

  if (!beamsClient) {
    const initialized = await initializePusherBeams();
    if (!initialized) return false;
  }

  try {
    // Subscribe to user-specific interest
    await beamsClient.addDeviceInterest(`user-${userId}`);
    console.log(`Subscribed to notifications for user: ${userId}`);
    return true;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.warn(`User notification subscription for ${userId} was aborted`);
    } else {
      console.error(`Failed to subscribe to user notifications:`, error);
    }
    return false;
  }
}

export async function getDeviceInterests(): Promise<string[]> {
  if (!beamsClient) return [];

  try {
    return await beamsClient.getDeviceInterests();
  } catch (error) {
    console.error("Failed to get device interests:", error);
    return [];
  }
}

export async function clearAllInterests(): Promise<boolean> {
  if (!beamsClient) return false;

  try {
    await beamsClient.clearDeviceInterests();
    console.log("Cleared all device interests");
    return true;
  } catch (error) {
    console.error("Failed to clear device interests:", error);
    return false;
  }
}

export async function stopBeams(): Promise<void> {
  if (!beamsClient) return;

  try {
    await beamsClient.stop();
    beamsClient = null;
    console.log("Pusher Beams stopped");
  } catch (error) {
    console.error("Failed to stop Pusher Beams:", error);
  }
}
