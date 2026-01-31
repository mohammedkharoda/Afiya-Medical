// IST (Indian Standard Time) utility functions
// IST is UTC+5:30

const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes in minutes

/**
 * Get current date/time in IST
 */
export function getCurrentIST(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MINUTES * 60000);
}

/**
 * Convert a UTC date to IST
 */
export function toIST(date: Date): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MINUTES * 60000);
}

/**
 * Convert an IST date to UTC
 */
export function toUTC(istDate: Date): Date {
  const utc = istDate.getTime() - IST_OFFSET_MINUTES * 60000;
  return new Date(utc - istDate.getTimezoneOffset() * 60000);
}

/**
 * Format a date as IST string (e.g., "January 24, 2026")
 */
export function formatDateIST(date: Date): string {
  const istDate = toIST(date);
  return istDate.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Format a time as IST string (e.g., "10:30 AM")
 */
export function formatTimeIST(date: Date): string {
  const istDate = toIST(date);
  return istDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Format date and time together in IST
 */
export function formatDateTimeIST(date: Date): string {
  return `${formatDateIST(date)} at ${formatTimeIST(date)}`;
}

/**
 * Parse a time string (HH:MM or HH:MM AM/PM) and combine with a date in IST
 * Returns a UTC Date object
 */
export function parseTimeWithDateIST(dateStr: string, timeStr: string): Date {
  // Parse the date
  const [year, month, day] = dateStr.split("-").map(Number);

  // Parse time - handle both "HH:MM" and "HH:MM AM/PM" formats
  let hours: number;
  let minutes: number;

  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!timeMatch) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  hours = parseInt(timeMatch[1], 10);
  minutes = parseInt(timeMatch[2], 10);

  if (timeMatch[3]) {
    const period = timeMatch[3].toUpperCase();
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }
  }

  // Create IST date
  const istDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // Convert to UTC by subtracting IST offset
  const utcTime = istDate.getTime() - IST_OFFSET_MINUTES * 60000;
  return new Date(utcTime);
}

/**
 * Get the start of day in IST as UTC
 */
export function getStartOfDayIST(date: Date): Date {
  const istDate = toIST(date);
  istDate.setHours(0, 0, 0, 0);
  return toUTC(istDate);
}

/**
 * Get the end of day in IST as UTC
 */
export function getEndOfDayIST(date: Date): Date {
  const istDate = toIST(date);
  istDate.setHours(23, 59, 59, 999);
  return toUTC(istDate);
}

/**
 * Check if two dates are the same day in IST
 */
export function isSameDayIST(date1: Date, date2: Date): boolean {
  const ist1 = toIST(date1);
  const ist2 = toIST(date2);
  return (
    ist1.getFullYear() === ist2.getFullYear() &&
    ist1.getMonth() === ist2.getMonth() &&
    ist1.getDate() === ist2.getDate()
  );
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Subtract minutes from a date
 */
export function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60000);
}

/**
 * Format time string for display (e.g., "09:00" -> "9:00 AM")
 */
export function formatTimeString(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}
