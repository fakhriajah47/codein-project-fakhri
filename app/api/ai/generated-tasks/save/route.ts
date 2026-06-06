import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai-service";
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
    const { projectId, selectedMilestones } = body;

    if (!projectId || !selectedMilestones || !Array.isArray(selectedMilestones)) {
      return NextResponse.json(
        { success: false, message: "Missing required parameter fields", error: { code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    // Fetch workspace ID of this project to verify role
    const { data: project } = await supabase
      .from("projects")
      .select("workspace_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Verify workspace role: owners/managers only can mutate project structures
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

    const result = await AIService.saveGeneratedTasks(
      project.workspace_id,
      projectId,
      selectedMilestones
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to save selected tasks", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI generated tasks saved successfully",
      data: {
        createdMilestones: result.createdMilestonesCount,
        createdTasks: result.createdTasksCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to save generated tasks", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
