import { NextRequest, NextResponse } from "next/server";
import { ProjectService } from "@/lib/services/project-service";
import { TaskService } from "@/lib/services/task-service";
import { createClient } from "@/lib/supabase/server";
import { updateTaskStatusSchema } from "@/lib/validators/task.schema";
import { NotificationService } from "@/lib/services/notification-service";

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

    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("workspace_id, project_id, assignee_id, title")
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
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

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    if (member.role === "viewer") {
      return NextResponse.json(
        { success: false, message: "Read-only workspace viewers cannot mutate tasks.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    if (member.role === "member" && task.assignee_id !== user.id) {
      return NextResponse.json(
        { success: false, message: "Workspace members can only update tasks assigned to them.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const updatedTask = await TaskService.updateTaskStatus(taskId, status);
    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: "Failed to update task status", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    const projectProgress = await ProjectService.recalculateProjectProgress(task.project_id);

    const notificationMessage = `🔄 **Status Tugas Diperbarui!**
    
**Tugas:** ${task.title}
**Status Baru:** ${updatedTask.status.replace("_", " ").toUpperCase()}`;

    Promise.all([
      NotificationService.sendDiscordUpdate(task.workspace_id, task.project_id, "task.status_updated", notificationMessage),
      NotificationService.sendTelegramAlert(task.workspace_id, task.project_id, "task.status_updated", notificationMessage),
    ]).catch((err) => console.error("Notification dispatch failed:", err));

    return NextResponse.json({
      success: true,
      message: "Task status updated successfully",
      data: {
        taskId: updatedTask.id,
        status: updatedTask.status,
        projectProgress,
      },
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid task status payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update task status", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
