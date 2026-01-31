"use client";

import { useEffect, useState, useCallback } from "react";
import { getPusherClient, CHANNELS, EVENTS } from "@/lib/pusher-client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface PusherNotificationData {
  userId: string;
  notification: Omit<Notification, "isRead">;
}

export function usePusherNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Mark notification as read (client-side only)
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read (client-side only)
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  // Set up Pusher subscription for real-time notifications
  useEffect(() => {
    if (!userId) return;

    // Subscribe to Pusher channel (if configured)
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(CHANNELS.NOTIFICATIONS);

    // Listen for new notifications
    channel.bind(EVENTS.NEW_NOTIFICATION, (data: PusherNotificationData) => {
      // Only add notification if it's for this user
      if (data.userId === userId) {
        const newNotification: Notification = {
          ...data.notification,
          isRead: false,
        };
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Cleanup on unmount
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(CHANNELS.NOTIFICATIONS);
    };
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}

// Hook for real-time appointment updates
export function usePusherAppointments(
  onAppointmentUpdate?: (appointment: {
    id: string;
    status: string;
    patientId: string;
    isNew?: boolean;
  }) => void,
) {
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(CHANNELS.APPOINTMENTS);

    // Listen for appointment updates (status changes, reschedule, cancel)
    channel.bind(
      EVENTS.APPOINTMENT_UPDATED,
      (data: {
        appointment: { id: string; status: string; patientId: string };
      }) => {
        if (onAppointmentUpdate) {
          onAppointmentUpdate({ ...data.appointment, isNew: false });
        }
      },
    );

    // Listen for new appointments (for doctor to see new bookings)
    channel.bind(
      EVENTS.APPOINTMENT_CREATED,
      (data: {
        appointment: { id: string; status: string; patientId: string };
      }) => {
        if (onAppointmentUpdate) {
          onAppointmentUpdate({ ...data.appointment, isNew: true });
        }
      },
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(CHANNELS.APPOINTMENTS);
    };
  }, [onAppointmentUpdate]);
}
