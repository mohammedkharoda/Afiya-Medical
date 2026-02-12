/**
 * Video Meeting Integration (Zoom/Google Meet)
 *
 * This module provides functions to create meeting links for video consultations.
 * Choose ONE of the following options based on your environment variables:
 * - Option A: Zoom Meeting Generator (recommended for clinics)
 * - Option B: Google Meet Link Generator
 */

// ============================================================================
// Option A: Zoom Meeting Generator
// ============================================================================

interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  password: string;
  start_time: string;
}

interface MeetingDetails {
  meetingUrl: string;
  meetingId: string;
  password?: string;
}

/**
 * Generate a Zoom access token using Server-to-Server OAuth
 * Docs: https://marketplace.zoom.us/docs/guides/build/server-to-server-oauth-app/
 */
async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom credentials not configured. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in .env");
  }

  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Zoom access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a Zoom meeting for a medical consultation
 * Docs: https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/meetingCreate
 */
export async function createZoomMeeting(
  appointmentId: string,
  appointmentDateTime: Date,
  doctorName: string,
  patientName: string
): Promise<MeetingDetails> {
  const accessToken = await getZoomAccessToken();

  const meetingData = {
    topic: `Medical Consultation - ${appointmentId}`,
    type: 2, // Scheduled meeting
    start_time: appointmentDateTime.toISOString(),
    duration: 60, // minutes
    timezone: "Asia/Kolkata",
    agenda: `Video consultation between Dr. ${doctorName} and ${patientName}`,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: true, // Allow participants to join before host
      waiting_room: false, // Disable waiting room - participants can join directly
      mute_upon_entry: false,
      auto_recording: "none", // No recording as per requirements
      approval_type: 2, // No registration required
      audio: "both", // Telephony and VoIP
      meeting_authentication: false, // Don't require Zoom account login
      use_pmi: false, // Use random meeting IDs (not personal meeting ID)
      encryption_type: "enhanced_encryption", // Enhanced encryption for medical data
    },
  };

  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(meetingData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to create Zoom meeting: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data: ZoomMeetingResponse = await response.json();

  return {
    meetingUrl: data.join_url,
    meetingId: data.id.toString(),
    password: data.password,
  };
}

// ============================================================================
// Option B: Google Meet Link Generator
// ============================================================================

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  conferenceData: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
  };
  attendees?: Array<{ email: string }>;
}

interface GoogleCalendarEventResponse {
  hangoutLink?: string;
  conferenceData?: {
    conferenceId?: string;
  };
}

/**
 * Get Google Meet access token using refresh token
 * Docs: https://developers.google.com/identity/protocols/oauth2/web-server#offline
 */
async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google credentials not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in .env");
  }

  const tokenUrl = "https://oauth2.googleapis.com/token";

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Google access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a Google Meet link via Google Calendar API
 * Docs: https://developers.google.com/calendar/api/v3/reference/events/insert
 */
export async function createGoogleMeetLink(
  appointmentId: string,
  appointmentDateTime: Date,
  doctorName: string,
  patientName: string,
  doctorEmail?: string,
  patientEmail?: string
): Promise<MeetingDetails> {
  const accessToken = await getGoogleAccessToken();

  const endDateTime = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000); // 1 hour later

  const event: GoogleCalendarEvent = {
    id: `appointment-${appointmentId}`.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().substring(0, 64),
    summary: `Medical Consultation - ${doctorName} & ${patientName}`,
    description: `Video consultation for appointment ${appointmentId}\n\nDoctor: ${doctorName}\nPatient: ${patientName}`,
    start: {
      dateTime: appointmentDateTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    conferenceData: {
      createRequest: {
        requestId: `appointment-${appointmentId}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    attendees: [
      ...(doctorEmail ? [{ email: doctorEmail }] : []),
      ...(patientEmail ? [{ email: patientEmail }] : []),
    ],
  };

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to create Google Meet link: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data: GoogleCalendarEventResponse = await response.json();

  if (!data.hangoutLink) {
    throw new Error("Failed to generate Google Meet link");
  }

  return {
    meetingUrl: data.hangoutLink,
    meetingId: data.conferenceData?.conferenceId || appointmentId,
  };
}

// ============================================================================
// Main Export - Choose which service to use based on environment
// ============================================================================

/**
 * Create a video meeting link for a consultation
 * Automatically chooses between Zoom and Google Meet based on available credentials
 */
export async function createVideoMeeting(
  appointmentId: string,
  appointmentDateTime: Date,
  doctorName: string,
  patientName: string,
  doctorEmail?: string,
  patientEmail?: string
): Promise<MeetingDetails> {
  // Check which service is configured
  const hasZoomCredentials = !!(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );

  const hasGoogleCredentials = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

  if (!hasZoomCredentials && !hasGoogleCredentials) {
    throw new Error(
      "No video meeting service configured. Please configure either Zoom or Google Meet credentials in .env"
    );
  }

  // Prefer Zoom if both are configured
  if (hasZoomCredentials) {
    return createZoomMeeting(appointmentId, appointmentDateTime, doctorName, patientName);
  } else {
    return createGoogleMeetLink(
      appointmentId,
      appointmentDateTime,
      doctorName,
      patientName,
      doctorEmail,
      patientEmail
    );
  }
}
