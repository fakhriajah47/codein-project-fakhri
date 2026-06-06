import { z } from "zod";

const notificationProviderSchema = z.enum(["discord", "telegram"]);

export const sendManualProjectUpdateSchema = z.object({
  projectId: z.string().uuid("Invalid project ID."),
  providers: z
    .array(notificationProviderSchema)
    .min(1, "Select at least one notification provider."),
  message: z.string().trim().min(3).max(3000),
});

export const sendRiskAlertSchema = z.object({
  projectId: z.string().uuid("Invalid project ID."),
  providers: z
    .array(notificationProviderSchema)
    .min(1, "Select at least one notification provider.")
    .default(["telegram"]),
  severity: z.enum(["medium", "high", "critical"]).default("high"),
  message: z.string().trim().min(3).max(3000),
  source: z.enum(["manual.escalation", "ai.risk_generated"]).default("manual.escalation"),
});
