import { z } from "zod";

export const reportTypeSchema = z.enum([
  "daily",
  "weekly",
  "executive",
  "client",
  "risk"
]);

export const reportAudienceSchema = z.enum([
  "internal",
  "ceo",
  "client"
]);

export const reportStatusSchema = z.enum([
  "draft",
  "sent",
  "archived"
]);

export const createReportSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  projectId: z.string().uuid("Invalid project ID."),
  title: z.string().trim().min(3).max(160),
  type: reportTypeSchema,
  targetAudience: reportAudienceSchema.default("internal"),
  content: z.record(z.string(), z.unknown())
});

export const updateReportSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  targetAudience: reportAudienceSchema.optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  status: reportStatusSchema.optional()
});

export const sendReportViaGmailSchema = z.object({
  reportId: z.string().uuid("Invalid report ID."),
  to: z.string().email("Please enter a valid recipient email."),
  cc: z.string().email("Please enter a valid CC email.").optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Email subject is required.").max(180),
  introMessage: z.string().trim().max(1000).optional().or(z.literal(""))
});
