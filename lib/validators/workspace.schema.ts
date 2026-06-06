import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name is required.")
    .max(80, "Workspace name is too long."),
  description: z
    .string()
    .trim()
    .max(500, "Description is too long.")
    .optional()
    .or(z.literal(""))
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const workspaceRoleSchema = z.enum(["owner", "manager", "member", "viewer"]);

export const inviteMemberSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  email: z.string().email("Please enter a valid email address."),
  role: workspaceRoleSchema.default("member")
});

export const updateMemberRoleSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  memberId: z.string().uuid("Invalid member ID."),
  role: workspaceRoleSchema
});
