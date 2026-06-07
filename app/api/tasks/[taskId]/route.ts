import { NextRequest, NextResponse } from "next/server";
import { ActivityService } from "@/lib/services/activity-service";
import { TaskService } from "@/lib/services/task-service";
import { createClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/services/notification-service";

export async function GET(
  _request: NextRequest,
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

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const [comments, attachments, activity] = await Promise.all([
      TaskService.getTaskComments(taskId),
      TaskService.getTaskAttachments(taskId),
      ActivityService.getTaskActivities(taskId),
    ]);

    return NextResponse.json({
      success: true,
      message: "Task detail retrieved successfully",
      data: {
        ...task,
        comments,
        attachments,
        activity,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve task detail", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

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

    // Fetch task to verify workspace membership
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("workspace_id, assignee_id, project_id, title")
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json(
        { success: false, message: "Task not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Verify workspace role
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

    // Role check:
    // Viewers cannot update.
    // Members can only update tasks assigned to them, or general status updates if allowed.
    // Owners/Managers can update anything.
    if (member.role === "viewer") {
      return NextResponse.json(
        { success: false, message: "Read-only workspace viewers cannot mutate tasks.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    if (member.role === "member" && task.assignee_id !== user.id) {
      // Allow members to update only their own tasks
      return NextResponse.json(
        { success: false, message: "Workspace members can only update tasks assigned to them.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, assigneeId, dueDate, estimatedHours, acceptanceCriteria } = body;

    let updatedTask = null;

    if (status && !title && !description && !priority && !assigneeId && !dueDate) {
      // Quick status transition update
      updatedTask = await TaskService.updateTaskStatus(taskId, status);
    } else {
      // General task update
      updatedTask = await TaskService.updateTask(taskId, {
        title,
        description,
        status,
        priority,
        assignee_id: assigneeId,
        due_date: dueDate,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        acceptance_criteria: acceptanceCriteria,
      });
    }

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: "Failed to update task record", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    const notificationMessage = `✏️ **Tugas Diperbarui!**
    
**Tugas:** ${updatedTask.title}
**Prioritas:** ${updatedTask.priority.toUpperCase()}
**Status:** ${updatedTask.status.replace("_", " ").toUpperCase()}`;

    Promise.all([
      NotificationService.sendDiscordUpdate(task.workspace_id, task.project_id, "task.updated", notificationMessage),
      NotificationService.sendTelegramAlert(task.workspace_id, task.project_id, "task.updated", notificationMessage),
    ]).catch((err) => console.error("Notification dispatch failed:", err));

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to update task", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Fetch task
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("workspace_id, project_id, title")
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json(
        { success: false, message: "Task not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Verify workspace role: only owners and managers can delete tasks
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", task.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can delete tasks.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const success = await TaskService.deleteTask(taskId);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to delete task", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    const notificationMessage = `🗑️ **Tugas Dihapus!**
    
**Tugas:** ${task.title}`;

    Promise.all([
      NotificationService.sendDiscordUpdate(task.workspace_id, task.project_id, "task.deleted", notificationMessage),
      NotificationService.sendTelegramAlert(task.workspace_id, task.project_id, "task.deleted", notificationMessage),
    ]).catch((err) => console.error("Notification dispatch failed:", err));

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to delete task", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
