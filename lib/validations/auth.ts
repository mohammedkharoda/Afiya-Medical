import { z } from "zod";
import PasswordValidator from "password-validator";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// List of disposable/temporary email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "guerrillamail.org",
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "throwaway.email",
  "throwawaymail.com",
  "fakeinbox.com",
  "trashmail.com",
  "trashmail.net",
  "mailnesia.com",
  "maildrop.cc",
  "getnada.com",
  "yopmail.com",
  "yopmail.fr",
  "dispostable.com",
  "mintemail.com",
  "tempail.com",
  "sharklasers.com",
  "spam4.me",
  "grr.la",
  "discard.email",
  "discardmail.com",
  "spamgourmet.com",
  "mytrashmail.com",
  "mailexpire.com",
  "getairmail.com",
  "mohmal.com",
  "tempr.email",
  "temp.email",
  "tempmailo.com",
  "tempmailaddress.com",
  "emailondeck.com",
  "anonymmail.net",
  "crazymailing.com",
  "fakemailgenerator.com",
  "inboxbear.com",
  "jetable.org",
  "mailcatch.com",
  "mailforspam.com",
  "mailnator.com",
  "spambox.us",
  "spamfree24.org",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "mailsac.com",
  "burnermail.io",
  "33mail.com",
  "guerrillamail.net",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillmail.info",
  "tempinbox.com",
  "fakeinbox.info",
  "spamherelots.com",
  "spamobox.com",
  "tempemail.net",
];

/**
 * Validates email to ensure:
 * 1. No "+" sign (blocks email aliasing like user+tag@gmail.com)
 * 2. Not a disposable/temporary email domain
 * 3. Valid email format
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  // Check for + sign in email (before @)
  const localPart = email.split("@")[0];
  if (localPart?.includes("+")) {
    return {
      valid: false,
      error: "Email addresses with '+' are not allowed",
    };
  }

  // Extract domain and check against disposable domains
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain && DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return {
      valid: false,
      error: "Temporary or disposable email addresses are not allowed",
    };
  }

  return { valid: true };
}

/**
 * Zod refinement for email validation
 * Use this in schemas to validate email
 * Note: Email is trimmed but original case is preserved for delivery
 * Storage and lookups should use case-insensitive comparison
 */
export const safeEmailSchema = z
  .string()
  .email("Invalid email address")
  .transform((email) => email.trim())
  .refine((email) => !email.split("@")[0]?.includes("+"), {
    message: "Email addresses with '+' are not allowed",
  })
  .refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();
      return !domain || !DISPOSABLE_EMAIL_DOMAINS.includes(domain);
    },
    { message: "Temporary or disposable email addresses are not allowed" },
  );

// Password-validator schema
const pwdSchema = new PasswordValidator();
pwdSchema
  .is()
  .min(8) // Minimum length 8
  .has()
  .uppercase() // Must have uppercase letters
  .has()
  .lowercase() // Must have lowercase letters
  .has()
  .digits() // Must have digits
  .has()
  .symbols() // Must have symbols
  .has()
  .not()
  .spaces();

export const loginSchema = z.object({
  email: safeEmailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: safeEmailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (val) => {
        try {
          return pwdSchema.validate(val);
        } catch {
          return false;
        }
      },
      {
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and a symbol",
      },
    ),
  phone: z.string().refine(
    (val) => {
      // Must start with +91
      if (!val.startsWith("+91")) {
        return false;
      }
      const phone = parsePhoneNumberFromString(val, "IN");
      return phone ? phone.isValid() : false;
    },
    {
      message: "Phone number must start with +91 and be a valid Indian number",
    },
  ),
  dob: z.string().refine(
    (val) => {
      const date = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age >= 0 && age <= 120;
    },
    { message: "Invalid date of birth" },
  ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Please select a gender",
  }),
  address: z.string().min(5, "Address must be at least 5 characters"),
  emergencyContact: z.string().refine(
    (val) => {
      // Must start with +91
      if (!val.startsWith("+91")) {
        return false;
      }
      const phone = parsePhoneNumberFromString(val, "IN");
      return phone ? phone.isValid() : false;
    },
    {
      message:
        "Emergency contact must start with +91 and be a valid Indian number",
    },
  ),
  bloodGroup: z.string().optional(),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]),
  preferredDoctorId: z.string().optional(),
});

// Doctor invitation schema (admin sends)
export const doctorInvitationSchema = z.object({
  email: safeEmailSchema,
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  isTestAccount: z.boolean().optional(),
});

// Doctor registration schema (simpler than patient - no medical info)
export const doctorRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: safeEmailSchema,
  phone: z.string().refine(
    (val) => {
      // Must start with +91
      if (!val.startsWith("+91")) {
        return false;
      }
      const phone = parsePhoneNumberFromString(val, "IN");
      return phone ? phone.isValid() : false;
    },
    {
      message: "Phone number must start with +91 and be a valid Indian number",
    },
  ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (val) => {
        try {
          return pwdSchema.validate(val);
        } catch {
          return false;
        }
      },
      {
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and a symbol",
      },
    ),
  token: z.string().min(1, "Invitation token is required"),
  // Doctor profile fields
  speciality: z.string().min(2, "Speciality is required"),
  degrees: z.array(z.string()).min(1, "At least one degree is required"),
  experience: z.number().min(0).optional(),
  upiId: z.string().min(1, "UPI ID is required for receiving payments"),
  clinicAddress: z.string().min(5, "Clinic address is required").optional(),
});

// Admin login schema (OTP-based)
export const adminLoginSchema = z.object({
  email: safeEmailSchema,
});

export const adminOtpSchema = z.object({
  email: safeEmailSchema,
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Forgot password - request OTP
export const forgotPasswordSchema = z.object({
  email: safeEmailSchema,
});

// Forgot password - verify OTP
export const forgotPasswordVerifySchema = z.object({
  email: safeEmailSchema,
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Reset password - set new password
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (val) => {
          try {
            return pwdSchema.validate(val);
          } catch {
            return false;
          }
        },
        {
          message:
            "Password must be at least 8 characters and include uppercase, lowercase, number, and a symbol",
        },
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type DoctorInvitationInput = z.infer<typeof doctorInvitationSchema>;
export type DoctorRegisterInput = z.infer<typeof doctorRegisterSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminOtpInput = z.infer<typeof adminOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ForgotPasswordVerifyInput = z.infer<
  typeof forgotPasswordVerifySchema
>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
