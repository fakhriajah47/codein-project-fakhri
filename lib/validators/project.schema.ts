import { z } from "zod";

export const projectStatusSchema = z.enum([
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled"
]);

export const prioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent"
]);

export const projectHealthSchema = z.enum([
  "healthy",
  "at_risk",
  "critical",
  "completed"
]);

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  name: z
    .string()
    .trim()
    .min(3, "Project name is required.")
    .max(120, "Project name is too long."),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long.")
    .optional()
    .or(z.literal("")),
  clientName: z
    .string()
    .trim()
    .max(120, "Client name is too long.")
    .optional()
    .or(z.literal("")),
  projectType: z
    .string()
    .trim()
    .max(80, "Project type is too long.")
    .optional()
    .or(z.literal("")),
  priority: prioritySchema.default("medium"),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal(""))
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  clientName: z.string().trim().max(120).optional().or(z.literal("")),
  projectType: z.string().trim().max(80).optional().or(z.literal("")),
  status: projectStatusSchema.optional(),
  priority: prioritySchema.optional(),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal(""))
});

export const getProjectsQuerySchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  status: projectStatusSchema.optional(),
  priority: prioritySchema.optional(),
  healthStatus: projectHealthSchema.optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
