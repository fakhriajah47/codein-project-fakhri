import { z } from "zod";

// --- AI Task Generation Schemas ---
export const aiTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  suggestedRole: z.string().default("Developer"),
  estimatedHours: z.number().nullable().default(null),
  acceptanceCriteria: z.array(z.string()).default([]),
});

export const aiMilestoneSchema = z.object({
  title: z.string().min(1, "Milestone title is required"),
  description: z.string().default(""),
  tasks: z.array(aiTaskSchema).default([]),
});

export const aiTaskGenerationResponseSchema = z.object({
  milestones: z.array(aiMilestoneSchema),
});

export type AITask = z.infer<typeof aiTaskSchema>;
export type AIMilestone = z.infer<typeof aiMilestoneSchema>;
export type AITaskGenerationResponse = z.infer<typeof aiTaskGenerationResponseSchema>;

// --- AI Risk Analysis Schemas ---
export const aiRiskAnalysisResponseSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  riskScore: z.number().min(0).max(100),
  summary: z.string(),
  reasons: z.array(z.string()),
  recommendations: z.array(z.string()),
  escalationMessage: z.string(),
});

export type AIRiskAnalysisResponse = z.infer<typeof aiRiskAnalysisResponseSchema>;

// --- AI Executive Summary Schemas ---
export const aiExecutiveSummaryResponseSchema = z.object({
  title: z.string(),
  status: z.enum(["Healthy", "At Risk", "Critical", "Completed"]),
  progress: z.number().min(0).max(100),
  summary: z.string(),
  completedWork: z.array(z.string()),
  pendingWork: z.array(z.string()),
  risks: z.array(z.string()),
  nextActions: z.array(z.string()),
});

export type AIExecutiveSummaryResponse = z.infer<typeof aiExecutiveSummaryResponseSchema>;

// --- AI Daily Focus Schemas ---
export const generateDailyFocusInputSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export const aiDailyFocusResponseSchema = z.object({
  focusDate: z.string(),
  aiNote: z.string(),
  priorities: z.array(z.string()).default([]),
  focusTasks: z.array(z.object({
    taskId: z.string(),
    title: z.string(),
    reason: z.string(),
    suggestedAction: z.string(),
    priority: z.enum(["low", "medium", "high", "urgent"]),
  })).default([]),
});

export type AIDailyFocusResponse = z.infer<typeof aiDailyFocusResponseSchema>;
