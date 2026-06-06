import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/lib/services/report-service";
import { createClient } from "@/lib/supabase/server";
import { updateReportSchema } from "@/lib/validators/report.schema";
import { Report } from "@/types";

export async function GET(
  _request: NextRequest,
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
    const report = await ReportService.getReportById(reportId);
    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", report.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Report detail retrieved successfully",
      data: report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve report", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const report = await ReportService.getReportById(reportId);
    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", report.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can update reports.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const payload = updateReportSchema.parse(await request.json());
    const updated = await ReportService.updateReport(reportId, {
      title: payload.title,
      targetAudience: payload.targetAudience,
      content: payload.content as Report["content"] | undefined,
      status: payload.status,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Failed to update report", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Report updated successfully",
      data: updated,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid report payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update report", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
