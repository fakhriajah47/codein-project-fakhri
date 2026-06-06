import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid ID format.");

export const requiredString = (fieldName: string, min = 1, max = 255) =>
  z
    .string()
    .trim()
    .min(min, `${fieldName} is required.`)
    .max(max, `${fieldName} is too long.`);

export const optionalString = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max, `Text is too long.`)
    .optional()
    .or(z.literal(""));

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.");

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address.");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});
