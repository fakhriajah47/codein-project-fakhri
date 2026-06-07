import { createClient } from "@/lib/supabase/server";
import { DiscordIntegration } from "@/lib/integrations/discord";
import { TelegramIntegration } from "@/lib/integrations/telegram";
import { GmailIntegration } from "@/lib/integrations/gmail";
import { IntegrationProvider, JsonRecord, NotificationLog } from "@/types";
import { ActivityService } from "./activity-service";

const MASKED_SECRET = "[securely-masked]";
const SECRET_KEYS = new Set([
  "webhookUrl",
  "botToken",
  "token",
  "password",
  "apiKey",
  "authorization",
  "secret",
]);

function sanitizeErrorMessage(message?: string | null): string | null {
  if (!message) return null;
  const secretValues = [
    process.env.DISCORD_WEBHOOK_URL_DEFAULT,
    process.env.DISCORD_WEBHOOK_URL,
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.TELEGRAM_DEFAULT_CHAT_ID,
    process.env.TELEGRAM_CHAT_ID,
    process.env.SMTP_PASSWORD,
    process.env.GEMINI_API_KEY,
  ].filter(Boolean) as string[];

  return secretValues.reduce(
    (current, value) => current.replaceAll(value, MASKED_SECRET),
    message
  );
}

function sanitizePayload(payload: JsonRecord): JsonRecord {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (SECRET_KEYS.has(key)) {
        return [key, MASKED_SECRET];
      }
      if (typeof value === "string") {
        return [key, sanitizeErrorMessage(value) || value];
      }
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return [key, sanitizePayload(value as JsonRecord)];
      }
      return [key, value];
    })
  );
}

export class NotificationService {
  private static async logNotification(params: {
    workspaceId: string;
    projectId?: string | null;
    provider: IntegrationProvider;
    eventType: string;
    payload: JsonRecord;
    status: "pending" | "sent" | "failed";
    errorMessage?: string | null;
  }): Promise<NotificationLog | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("notification_logs")
        .insert({
          workspace_id: params.workspaceId,
          project_id: params.projectId || null,
          provider: params.provider,
          event_type: params.eventType,
          payload: sanitizePayload(params.payload),
          status: params.status,
          error_message: sanitizeErrorMessage(params.errorMessage),
          sent_at: params.status === "sent" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating notification log:", error);
        return null;
      }
      return data as NotificationLog;
    } catch (err) {
      console.error("Failed to log notification:", err);
      return null;
    }
  }

  private static async updateNotificationStatus(
    logId: string,
    status: "sent" | "failed",
    errorMessage?: string | null
  ): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase
        .from("notification_logs")
        .update({
          status,
          error_message: sanitizeErrorMessage(errorMessage),
          sent_at: status === "sent" ? new Date().toISOString() : null,
        })
        .eq("id", logId);
    } catch (err) {
      console.error("Failed to update notification status:", err);
    }
  }

  // --- Discord Webhook Dispatch ---
  static async sendDiscordUpdate(
    workspaceId: string,
    projectId: string | null,
    eventType: string,
    message: string
  ): Promise<boolean> {
    const provider: IntegrationProvider = "discord";
    let log: NotificationLog | null = null;
    try {
      const supabase = await createClient();
      
      // Fetch settings
      const { data: setting } = await supabase
        .from("integration_settings")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("provider", provider)
        .eq("is_enabled", true)
        .maybeSingle();

      let webhookUrl = setting?.config?.webhookUrl;
      if (!webhookUrl) {
        webhookUrl = process.env.DISCORD_WEBHOOK_URL_DEFAULT || process.env.DISCORD_WEBHOOK_URL;
      }

      if (!webhookUrl) {
        console.log("Discord notification skipped: not configured or disabled.");
        return false;
      }
      
      // Create pending log
      log = await this.logNotification({
        workspaceId,
        projectId,
        provider,
        eventType,
        payload: { message },
        status: "pending",
      });

      const result = await DiscordIntegration.sendWebhookMessage(webhookUrl, message);

      if (log) {
        if (result.success) {
          await this.updateNotificationStatus(log.id, "sent");
        } else {
          await this.updateNotificationStatus(log.id, "failed", result.errorMessage);
        }
      }

      return result.success;
    } catch (err: any) {
      console.error("Failed to dispatch Discord update:", err);
      if (log) {
        await this.updateNotificationStatus(log.id, "failed", err?.message || String(err));
      }
      return false;
    }
  }

  // --- Telegram Bot Dispatch ---
  static async sendTelegramAlert(
    workspaceId: string,
    projectId: string | null,
    eventType: string,
    message: string
  ): Promise<boolean> {
    const provider: IntegrationProvider = "telegram";
    let log: NotificationLog | null = null;
    try {
      const supabase = await createClient();
      
      // Fetch settings
      const { data: setting } = await supabase
        .from("integration_settings")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("provider", provider)
        .eq("is_enabled", true)
        .maybeSingle();

      let botToken = setting?.config?.botToken;
      let chatId = setting?.config?.chatId;

      if (!botToken || !chatId) {
        botToken = process.env.TELEGRAM_BOT_TOKEN;
        chatId = process.env.TELEGRAM_DEFAULT_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
      }

      if (!botToken || !chatId) {
        console.log("Telegram notification skipped: not configured or disabled.");
        return false;
      }

      // Create pending log
      log = await this.logNotification({
        workspaceId,
        projectId,
        provider,
        eventType,
        payload: { message },
        status: "pending",
      });

      const result = await TelegramIntegration.sendMessage(botToken, chatId, message);

      if (log) {
        if (result.success) {
          await this.updateNotificationStatus(log.id, "sent");
        } else {
          await this.updateNotificationStatus(log.id, "failed", result.errorMessage);
        }
      }

      return result.success;
    } catch (err: any) {
      console.error("Failed to dispatch Telegram alert:", err);
      if (log) {
        await this.updateNotificationStatus(log.id, "failed", err?.message || String(err));
      }
      return false;
    }
  }

  static async sendProjectUpdate(
    workspaceId: string,
    projectId: string,
    providers: Array<"discord" | "telegram">,
    message: string
  ): Promise<{ sent: string[]; failed: string[] }> {
    const sent: string[] = [];
    const failed: string[] = [];

    for (const provider of providers) {
      const ok =
        provider === "discord"
          ? await this.sendDiscordUpdate(workspaceId, projectId, "manual.update", message)
          : await this.sendTelegramAlert(workspaceId, projectId, "manual.update", message);

      if (ok) sent.push(provider);
      else failed.push(provider);
    }

    await ActivityService.logActivity({
      workspaceId,
      projectId,
      action: "notification.manual_update_sent",
      entityType: "notification",
      entityId: projectId,
      metadata: { providers, sent, failed },
    });

    return { sent, failed };
  }

  static async sendRiskAlert(
    workspaceId: string,
    projectId: string,
    providers: Array<"discord" | "telegram">,
    params: {
      severity: "medium" | "high" | "critical";
      message: string;
      source: "manual.escalation" | "ai.risk_generated";
    }
  ): Promise<{ sent: string[]; failed: string[] }> {
    const alertMessage = [
      `Project risk alert (${params.severity.toUpperCase()})`,
      "",
      params.message,
    ].join("\n");
    const sent: string[] = [];
    const failed: string[] = [];

    for (const provider of providers) {
      const ok =
        provider === "discord"
          ? await this.sendDiscordUpdate(workspaceId, projectId, params.source, alertMessage)
          : await this.sendTelegramAlert(workspaceId, projectId, params.source, alertMessage);

      if (ok) sent.push(provider);
      else failed.push(provider);
    }

    await ActivityService.logActivity({
      workspaceId,
      projectId,
      action: "notification.risk_alert_sent",
      entityType: "notification",
      entityId: projectId,
      metadata: { severity: params.severity, source: params.source, providers, sent, failed },
    });

    return { sent, failed };
  }

  // --- Gmail SMTP Dispatch ---
  static async sendGmailReport(
    workspaceId: string,
    projectId: string,
    reportId: string,
    emailParams: {
      to: string;
      cc?: string;
      subject: string;
      bodyText: string;
      bodyHtml?: string;
    }
  ): Promise<boolean> {
    const provider: IntegrationProvider = "gmail";
    let log: NotificationLog | null = null;
    try {
      const supabase = await createClient();
      
      // Fetch integration setting to ensure Gmail SMTP connected/enabled for workspace
      const { data: setting } = await supabase
        .from("integration_settings")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("provider", provider)
        .eq("is_enabled", true)
        .maybeSingle();

      if (!setting) {
        // Fallback to env SMTP check
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
          console.log("Gmail notification skipped: integration is disabled or not configured.");
          return false;
        }
      }

      // Create pending log
      log = await this.logNotification({
        workspaceId,
        projectId,
        provider,
        eventType: "report.sent",
        payload: { reportId, to: emailParams.to, subject: emailParams.subject },
        status: "pending",
      });

      const result = await GmailIntegration.sendEmail({
        to: emailParams.to,
        cc: emailParams.cc,
        subject: emailParams.subject,
        bodyText: emailParams.bodyText,
        bodyHtml: emailParams.bodyHtml,
      });

      if (log) {
        if (result.success) {
          await this.updateNotificationStatus(log.id, "sent");
          
          // Update report record status to sent
          await supabase
            .from("reports")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", reportId);

          // Log activity
          await ActivityService.logActivity({
            workspaceId,
            projectId,
            action: "report.sent",
            entityType: "report",
            entityId: reportId,
            metadata: { recipientEmail: emailParams.to },
          });
        } else {
          await this.updateNotificationStatus(log.id, "failed", result.errorMessage);
        }
      }

      return result.success;
    } catch (err: any) {
      console.error("Failed to dispatch Gmail report:", err);
      if (log) {
        await this.updateNotificationStatus(log.id, "failed", err?.message || String(err));
      }
      return false;
    }
  }

  // --- Integration Test Utility Connectors ---
  static async testDiscordConnection(workspaceId: string, webhookUrl: string): Promise<boolean> {
    try {
      const { data: { user } } = await (await createClient()).auth.getUser();
      const testMsg = `Project Management connected successfully.
      
**Workspace:** Test Workspace Connection
**Status:** Ready to receive project notifications.`;

      const result = await DiscordIntegration.sendWebhookMessage(webhookUrl, testMsg);
      if (result.success) {
        await this.logNotification({
          workspaceId,
          provider: "discord",
          eventType: "integration.test_sent",
          payload: { webhookUrl },
          status: "sent",
        });

        // Save integration settings if successful
        const supabase = await createClient();
        await supabase.from("integration_settings").upsert(
          {
            workspace_id: workspaceId,
            provider: "discord",
            config: { webhookUrl },
            is_enabled: true,
            created_by: user?.id,
          },
          { onConflict: "workspace_id,provider" }
        );
      }
      return result.success;
    } catch (err) {
      console.error("Discord connection test failed:", err);
      return false;
    }
  }

  static async testTelegramConnection(workspaceId: string, botToken: string, chatId: string): Promise<boolean> {
    try {
      const { data: { user } } = await (await createClient()).auth.getUser();
      const testMsg = `Project Management Telegram connected.
      
Workspace status: Ready for critical project alerts.`;

      const result = await TelegramIntegration.sendMessage(botToken, chatId, testMsg);
      if (result.success) {
        await this.logNotification({
          workspaceId,
          provider: "telegram",
          eventType: "integration.test_sent",
          payload: { botToken, chatId },
          status: "sent",
        });

        // Save integration settings if successful
        const supabase = await createClient();
        await supabase.from("integration_settings").upsert(
          {
            workspace_id: workspaceId,
            provider: "telegram",
            config: { botToken, chatId },
            is_enabled: true,
            created_by: user?.id,
          },
          { onConflict: "workspace_id,provider" }
        );
      }
      return result.success;
    } catch (err) {
      console.error("Telegram connection test failed:", err);
      return false;
    }
  }

  static async testGmailConnection(workspaceId: string): Promise<boolean> {
    try {
      const { data: { user } } = await (await createClient()).auth.getUser();
      const userEmail = process.env.SMTP_USER;

      if (!userEmail) return false;

      // Save integration settings if SMTP user details exist in env
      const supabase = await createClient();
      await supabase.from("integration_settings").upsert(
        {
          workspace_id: workspaceId,
          provider: "gmail",
          config: { connectedEmail: userEmail },
          is_enabled: true,
          created_by: user?.id,
        },
        { onConflict: "workspace_id,provider" }
      );

      return true;
    } catch (err) {
      console.error("Gmail connection test failed:", err);
      return false;
    }
  }

  static async getNotificationLogs(workspaceId: string): Promise<NotificationLog[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notification logs:", error);
        return [];
      }

      return data as NotificationLog[];
    } catch (err) {
      console.error("Failed to get notification logs:", err);
      return [];
    }
  }
}
