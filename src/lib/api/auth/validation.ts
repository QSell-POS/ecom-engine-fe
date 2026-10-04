import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

// No phone field: /tenant/register takes name, email and password only, and
// validation runs with forbidNonWhitelisted, so an extra field is a 400.
export const RegisterSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});
