import { NextResponse } from "next/server";
import { ProjectService } from "@/lib/services/project-service";
import { TaskService } from "@/lib/services/task-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
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

    const { projectId } = await params;
    const project = await ProjectService.getProjectDetail(projectId);
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

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const board = await TaskService.getKanbanBoard(projectId);

    return NextResponse.json({
      success: true,
      message: "Kanban board retrieved successfully",
      data: board,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve kanban board", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
