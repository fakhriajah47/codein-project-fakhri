import { z } from "zod";

export const taskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked"
]);

export const taskPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent"
]);

export const acceptanceCriteriaSchema = z.array(
  z.string().trim().min(1, "Acceptance criteria cannot be empty.")
);

export const createTaskSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  projectId: z.string().uuid("Invalid project ID."),
  milestoneId: z.string().uuid("Invalid milestone ID.").optional().nullable(),
  title: z
    .string()
    .trim()
    .min(3, "Task title is required.")
    .max(160, "Task title is too long."),
  description: z
    .string()
    .trim()
    .max(3000, "Task description is too long.")
    .optional()
    .or(z.literal("")),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  assigneeId: z.string().uuid("Invalid assignee ID.").optional().nullable(),
  dueDate: z.string().optional().or(z.literal("")),
  estimatedHours: z.coerce.number().min(0).max(999).optional(),
  acceptanceCriteria: acceptanceCriteriaSchema.default([])
});

export const updateTaskSchema = z.object({
  milestoneId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().or(z.literal("")),
  estimatedHours: z.coerce.number().min(0).max(999).optional(),
  actualHours: z.coerce.number().min(0).max(999).optional(),
  acceptanceCriteria: acceptanceCriteriaSchema.optional()
});

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema
});

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().uuid().optional(),
  due: z.enum(["today", "overdue", "upcoming"]).optional()
});

export const addTaskCommentSchema = z.object({
  taskId: z.string().uuid("Invalid task ID."),
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(2000, "Comment is too long.")
});

export const addTaskAttachmentSchema = z.object({
  taskId: z.string().uuid("Invalid task ID."),
  fileName: z.string().trim().min(1).max(255),
  fileUrl: z.string().url("Invalid file URL."),
  fileType: z.string().trim().max(100).optional(),
  fileSize: z.number().int().min(0).max(10 * 1024 * 1024)
});
