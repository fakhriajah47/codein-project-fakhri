import { z } from "zod";

export const milestoneStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "blocked"
]);

export const createMilestoneSchema = z.object({
  projectId: z.string().uuid("Invalid project ID."),
  title: z
    .string()
    .trim()
    .min(3, "Milestone title is required.")
    .max(120, "Milestone title is too long."),
  description: z
    .string()
    .trim()
    .max(1000, "Milestone description is too long.")
    .optional()
    .or(z.literal("")),
  dueDate: z.string().optional().or(z.literal(""))
});

export const updateMilestoneSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  status: milestoneStatusSchema.optional(),
  dueDate: z.string().optional().or(z.literal(""))
});
