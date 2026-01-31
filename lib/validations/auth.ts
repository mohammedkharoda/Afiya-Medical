import { z } from "zod";
import PasswordValidator from "password-validator";
import { parsePhoneNumberFromString } from "libphonenumber-js";

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
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
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
    { message: "Phone number must start with +91 and be a valid Indian number" },
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
    { message: "Emergency contact must start with +91 and be a valid Indian number" },
  ),
  bloodGroup: z.string().optional(),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
