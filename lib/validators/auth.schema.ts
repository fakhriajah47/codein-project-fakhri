import { z } from "zod";
import { emailSchema } from "./common.schema";

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required.")
    .max(100, "Full name is too long."),
  jobTitle: z.string().trim().max(100, "Job title is too long.").optional().or(z.literal("")),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password is too long.")
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.")
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  jobTitle: z.string().trim().max(100).optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  timezone: z.string().trim().default("Asia/Jakarta")
});
