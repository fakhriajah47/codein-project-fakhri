import { NextRequest, NextResponse } from "next/server";
import { ProjectService } from "@/lib/services/project-service";
import { TaskService } from "@/lib/services/task-service";
import { createClient } from "@/lib/supabase/server";
import { updateTaskStatusSchema } from "@/lib/validators/task.schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
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

    const { taskId } = await params;
    const { status } = updateTaskStatusSchema.parse(await request.json());
    const task = await TaskService.getTaskById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", task.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || member.role === "viewer") {
      return NextResponse.json(
        { success: false, message: "Read-only workspace viewers cannot move tasks.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    if (member.role === "member" && task.assignee_id !== user.id) {
      return NextResponse.json(
        { success: false, message: "Workspace members can only move tasks assigned to them.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const updatedTask = await TaskService.updateTaskStatus(taskId, status);
    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: "Failed to move task", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    const projectProgress = await ProjectService.recalculateProjectProgress(task.project_id);

    return NextResponse.json({
      success: true,
      message: "Task moved successfully",
      data: {
        taskId: updatedTask.id,
        status: updatedTask.status,
        projectProgress,
      },
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid kanban move payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to move task", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
