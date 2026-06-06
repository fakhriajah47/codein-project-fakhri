import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";
import { sendRiskAlertSchema } from "@/lib/validators/notification.schema";

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

    const payload = sendRiskAlertSchema.parse(await request.json());
    const project = await ProjectService.getProjectDetail(payload.projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", project.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can send risk alerts.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const result = await NotificationService.sendRiskAlert(
      project.workspace_id,
      payload.projectId,
      payload.providers,
      {
        severity: payload.severity,
        message: payload.message,
        source: payload.source,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Risk alert sent successfully",
      data: result,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid risk alert payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to send risk alert", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
