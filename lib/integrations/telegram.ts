export class TelegramIntegration {
  static async sendMessage(
    botToken: string,
    chatId: string,
    message: string
  ): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });

      const resJson = await response.json();
      
      if (!response.ok || !resJson.ok) {
        return {
          success: false,
          errorMessage: `Telegram error: ${response.status} - ${resJson.description || "Unknown error"}`,
        };
      }

      return { success: true };
    } catch (err: any) {
      console.error("Failed to dispatch Telegram message:", err);
      return { success: false, errorMessage: err?.message || String(err) };
    }
  }

  static formatCriticalProjectAlert(projectName: string, riskScore: number, reasons: string[], recommendation: string): string {
    return `🚨 *Critical Project Alert*

*Project:* ${projectName}
*Risk Score:* ${riskScore}/100
*Status:* Critical

*Reason:*
${reasons.map(r => `- ${r}`).join("\n")}

*Recommended Action:*
${recommendation}`;
  }

  static formatDailyFounderAlert(workspaceName: string, priorities: string[], aiNote: string): string {
    return `📌 *Daily Project Focus*

*Workspace:* ${workspaceName}

*Today's priorities:*
${priorities.map((p, idx) => `${idx + 1}. ${p}`).join("\n")}

*AI Note:*
${aiNote}`;
  }

  static formatEscalationMessage(projectName: string, message: string): string {
    return `⚠️ *Escalation Needed*

*Project:* ${projectName}
*Message:*
${message}

Please review immediately.`;
  }
}
