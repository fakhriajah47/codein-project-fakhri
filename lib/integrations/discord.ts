export class DiscordIntegration {
  static async sendWebhookMessage(
    webhookUrl: string,
    message: string
  ): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, errorMessage: `Discord error: ${response.status} - ${errText}` };
      }

      return { success: true };
    } catch (err: any) {
      console.error("Failed to dispatch Discord message:", err);
      return { success: false, errorMessage: err?.message || String(err) };
    }
  }

  static formatTaskCompleted(projectName: string, taskTitle: string, actorName: string): string {
    return `✅ **Task Completed**
    
**Project:** ${projectName}
**Task:** ${taskTitle}
**Completed by:** ${actorName}
**Status:** Done

Open dashboard to review progress.`;
  }

  static formatTaskBlocked(projectName: string, taskTitle: string, blockedBy: string, ownerName: string): string {
    return `🚧 **Task Blocked**
    
**Project:** ${projectName}
**Task:** ${taskTitle}
**Blocked by:** ${blockedBy}
**Owner:** ${ownerName}

Action needed from Project Manager.`;
  }

  static formatProjectAtRisk(projectName: string, riskScore: number, reason: string, recommendation: string): string {
    return `⚠️ **Project At Risk**
    
**Project:** ${projectName}
**Risk Score:** ${riskScore}/100
**Reason:** ${reason}

**Recommended Action:**
${recommendation}`;
  }
}
