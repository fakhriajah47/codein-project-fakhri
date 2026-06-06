import { z } from "zod";

export const providerSchema = z.enum(["discord", "telegram", "gmail"]);

export const saveDiscordIntegrationSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  webhookUrl: z
    .string()
    .url("Please enter a valid Discord webhook URL.")
    .refine(
      (url) => url.includes("discord.com/api/webhooks") || url.includes("discordapp.com/api/webhooks"),
      "Please enter a valid Discord webhook URL."
    ),
  isEnabled: z.boolean().default(true)
});

export const saveTelegramIntegrationSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  botToken: z
    .string()
    .trim()
    .min(20, "Telegram bot token seems too short.")
    .max(200, "Telegram bot token is too long."),
  chatId: z
    .string()
    .trim()
    .min(1, "Telegram chat ID is required.")
    .max(100, "Telegram chat ID is too long."),
  isEnabled: z.boolean().default(true)
});

export const testIntegrationSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  provider: providerSchema
});

export const gmailAuthUrlSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID.")
});

export const gmailCallbackSchema = z.object({
  code: z.string().trim().min(1, "OAuth code is missing."),
  state: z.string().uuid("Invalid OAuth state.")
});

export const disconnectIntegrationSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID."),
  provider: providerSchema
});
