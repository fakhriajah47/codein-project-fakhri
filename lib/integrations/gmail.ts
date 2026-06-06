import nodemailer from "nodemailer";

export class GmailIntegration {
  private static getTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);

    if (!user || !pass) {
      throw new Error("SMTP credentials are not fully configured in environment variables.");
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports like 587
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  static async sendEmail(params: {
    to: string;
    cc?: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
  }): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      const transporter = this.getTransporter();
      
      const info = await transporter.sendMail({
        from: `"Project Management" <${process.env.SMTP_USER}>`,
        to: params.to,
        cc: params.cc || undefined,
        subject: params.subject,
        text: params.bodyText,
        html: params.bodyHtml,
      });

      console.log("Email sent successfully, messageId:", info.messageId);
      return { success: true };
    } catch (err: any) {
      console.error("Failed to send email via SMTP:", err);
      return { success: false, errorMessage: err?.message || String(err) };
    }
  }

  static formatExecutiveReportText(params: {
    projectName: string;
    overallStatus: string;
    progress: number;
    summary: string;
    completedWork: string[];
    pendingWork: string[];
    risks: string[];
    nextActions: string[];
    introMessage?: string;
  }): string {
    const intro = params.introMessage ? `${params.introMessage}\n\n` : "";
    return `Hi,

${intro}Here is the latest project update for "${params.projectName}".

Overall Status: ${params.overallStatus}
Progress: ${params.progress}%

Summary:
${params.summary}

Completed Work:
${params.completedWork.map(w => `- ${w}`).join("\n")}

Pending Work:
${params.pendingWork.map(w => `- ${w}`).join("\n")}

Risks:
${params.risks.map(r => `- ${r}`).join("\n")}

Next Actions:
${params.nextActions.map(a => `- ${a}`).join("\n")}

Best regards,
Project Management Command Center`;
  }

  static formatExecutiveReportHtml(params: {
    projectName: string;
    overallStatus: string;
    progress: number;
    summary: string;
    completedWork: string[];
    pendingWork: string[];
    risks: string[];
    nextActions: string[];
    introMessage?: string;
  }): string {
    const introHtml = params.introMessage ? `<p style="font-size: 16px; color: #333;">${params.introMessage}</p><hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;" />` : "";
    
    let statusColor = "#10B981"; // healthy emerald
    if (params.overallStatus.toLowerCase().includes("risk")) statusColor = "#F59E0B"; // amber
    if (params.overallStatus.toLowerCase().includes("critical")) statusColor = "#EF4444"; // rose
    if (params.overallStatus.toLowerCase().includes("completed")) statusColor = "#3B82F6"; // blue

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid #000; box-shadow: 6px 6px 0px #000; background-color: #fff;">
        <div style="background-color: #A5B4FC; padding: 15px; border-bottom: 3px solid #000; text-align: center;">
          <h2 style="margin: 0; font-family: 'Space Grotesk', Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">Project Management Report</h2>
        </div>
        
        <div style="padding: 20px;">
          ${introHtml}
          
          <h3 style="font-size: 20px; margin-top: 0;">Project: ${params.projectName}</h3>
          
          <div style="display: flex; margin-bottom: 20px; gap: 10px;">
            <div style="flex: 1; border: 2px solid #000; padding: 10px; background-color: #F3F4F6;">
              <strong>Status:</strong> 
              <span style="color: ${statusColor}; font-weight: bold;">${params.overallStatus}</span>
            </div>
            <div style="flex: 1; border: 2px solid #000; padding: 10px; background-color: #F3F4F6;">
              <strong>Progress:</strong> <span style="font-weight: bold;">${params.progress}%</span>
            </div>
          </div>

          <p><strong>Summary:</strong></p>
          <p style="background-color: #FEF3C7; padding: 10px; border: 2px solid #000;">${params.summary}</p>

          <h4 style="border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px;">Completed Work Highlights</h4>
          <ul>
            ${params.completedWork.map(w => `<li>${w}</li>`).join("")}
          </ul>

          <h4 style="border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px;">Pending Critical Tasks</h4>
          <ul>
            ${params.pendingWork.map(w => `<li>${w}</li>`).join("")}
          </ul>

          <h4 style="border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; color: #EF4444;">Project Risks</h4>
          <ul>
            ${params.risks.map(r => `<li>${r}</li>`).join("")}
          </ul>

          <h4 style="border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 20px; color: #3B82F6;">Next Recommended Actions</h4>
          <ul>
            ${params.nextActions.map(a => `<li>${a}</li>`).join("")}
          </ul>
        </div>
        
        <div style="border-top: 3px solid #000; padding: 15px; background-color: #F9FAFB; text-align: center; font-size: 12px; color: #666;">
          Sent automatically via Project Management Command Center.
        </div>
      </div>
    `;
  }
}
