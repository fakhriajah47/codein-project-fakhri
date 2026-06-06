import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai-service";
import { ReportService } from "@/lib/services/report-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, targetAudience } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Missing required parameter fields", error: { code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    // Fetch workspace ID
    const { data: project } = await supabase
      .from("projects")
      .select("workspace_id, name")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Verify workspace role: owners and managers only can trigger executive summaries
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", project.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const audience = targetAudience || "ceo";

    const summaryData = await AIService.generateExecutiveSummary(
      project.workspace_id,
      projectId,
      audience
    );

    if (!summaryData) {
      return NextResponse.json(
        { success: false, message: "Failed to generate executive summary. Ensure GEMINI_API_KEY is valid.", error: { code: "AI_GENERATION_FAILED" } },
        { status: 502 }
      );
    }

    // Save report as a draft in reports table
    const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const reportTitle = `${summaryData.title || "Executive Summary"} (${dateStr})`;

    const report = await ReportService.createReport(projectId, {
      title: reportTitle,
      type: "executive",
      targetAudience: audience,
      content: {
        summary: summaryData.summary,
        completedWork: summaryData.completedWork,
        pendingWork: summaryData.pendingWork,
        risks: summaryData.risks,
        nextActions: summaryData.nextActions,
      },
      status: "draft",
    });

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Failed to save report draft in database", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Executive summary draft report generated successfully",
      data: {
        reportId: report.id,
        content: report.content,
        title: report.title,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to run executive summary", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
