import { initBotId } from "botid/client/core";

// Define the paths that need bot protection for the medical clinic app
// Protecting sensitive endpoints from automated attacks, spam, and abuse
initBotId({
  protect: [
    // Authentication - prevent brute force and credential stuffing
    {
      path: "/api/auth/*",
      method: "POST",
    },
    {
      path: "/api/login",
      method: "POST",
    },
    {
      path: "/api/register",
      method: "POST",
    },
    {
      path: "/api/forgot-password",
      method: "POST",
    },
    {
      path: "/api/reset-password",
      method: "POST",
    },
    {
      path: "/api/verify-otp",
      method: "POST",
    },

    // Appointments - prevent bots from booking all slots
    {
      path: "/api/appointments",
      method: "POST",
    },
    {
      path: "/api/appointments/*",
      method: "POST",
    },
    {
      path: "/api/appointments/*",
      method: "PATCH",
    },

    // Payments - financial security
    {
      path: "/api/payments",
      method: "POST",
    },
    {
      path: "/api/payments",
      method: "PATCH",
    },

    // Prescriptions - medical data protection
    {
      path: "/api/prescriptions",
      method: "POST",
    },

    // User profile updates
    {
      path: "/api/user/*",
      method: "PATCH",
    },
    {
      path: "/api/user/*",
      method: "POST",
    },
  ],
});
