import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/lib/services/report-service";
import { NotificationService } from "@/lib/services/notification-service";
import { GmailIntegration } from "@/lib/integrations/gmail";
import { createClient } from "@/lib/supabase/server";
import { sendReportViaGmailSchema } from "@/lib/validators/report.schema";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asProgress(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, value));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.min(100, Math.max(0, parsed));
    }
  }

  return 0;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const { reportId } = await params;

    // Fetch report
    const report = await ReportService.getReportById(reportId);
    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Verify workspace role: owners and managers only can send reports
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", report.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can send project reports.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    // Fetch project details to include in email formatting
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", report.project_id)
      .single();

    const projectName = project?.name || "Project Management Project";

    const input = sendReportViaGmailSchema.parse({
      ...(await request.json()),
      reportId,
    });
    const { to, cc, subject, introMessage } = input;

    const emailSubject = subject || `Project Progress Report - ${projectName}`;

    // Format Email Body (Html & Text)
    const completedWork = asStringArray(report.content.completedWork);
    const pendingWork = asStringArray(report.content.pendingWork);
    const risks = asStringArray(report.content.risks);
    const nextActions = asStringArray(report.content.nextActions);
    const progress = asProgress(report.content.progress);
    const summary = asString(report.content.summary);

    const bodyText = GmailIntegration.formatExecutiveReportText({
      projectName,
      overallStatus: report.target_audience === "ceo" ? "At Risk" : "Active", // or map from project state
      progress,
      summary,
      completedWork,
      pendingWork,
      risks,
      nextActions,
      introMessage,
    });

    const bodyHtml = GmailIntegration.formatExecutiveReportHtml({
      projectName,
      overallStatus: report.target_audience === "ceo" ? "At Risk" : "Active",
      progress,
      summary,
      completedWork,
      pendingWork,
      risks,
      nextActions,
      introMessage,
    });

    // Send Gmail Report via NotificationService
    const success = await NotificationService.sendGmailReport(
      report.workspace_id,
      report.project_id,
      reportId,
      {
        to: to.trim(),
        cc: cc || undefined,
        subject: emailSubject,
        bodyText,
        bodyHtml,
      }
    );

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to send email report. Check SMTP environment variables.", error: { code: "NOTIFICATION_FAILED" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Report sent successfully via Gmail SMTP",
      data: {
        reportId,
        status: "sent",
        sentAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to send report", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
