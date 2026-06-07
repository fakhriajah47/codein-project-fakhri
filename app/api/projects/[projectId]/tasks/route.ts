import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/lib/services/task-service";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/services/notification-service";

export async function GET(
  request: NextRequest,
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

    // Verify workspace membership
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

    // Parse filters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const assigneeId = searchParams.get("assigneeId") || undefined;

    const tasks = await TaskService.getTasksByProject(projectId, {
      status,
      priority,
      assigneeId,
    });

    return NextResponse.json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve project tasks", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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

    // Verify user role: owners, managers, and members can create tasks. Viewers cannot.
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", project.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || member.role === "viewer") {
      return NextResponse.json(
        { success: false, message: "You do not have permission to create tasks in this workspace.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, assigneeId, milestoneId, dueDate, estimatedHours, acceptanceCriteria } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Task title is required", error: { code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const task = await TaskService.createTask(project.workspace_id, projectId, {
      title: title.trim(),
      description: description?.trim(),
      status: status || "todo",
      priority: priority || "medium",
      assigneeId: assigneeId || undefined,
      milestoneId: milestoneId || undefined,
      dueDate,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      acceptanceCriteria: acceptanceCriteria || [],
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Failed to create task", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    const notificationMessage = `📝 **Tugas Baru Dibuat!**
    
**Proyek:** ${project.name}
**Tugas:** ${task.title}
**Prioritas:** ${task.priority.toUpperCase()}
**Status:** ${task.status.replace("_", " ").toUpperCase()}`;

    Promise.all([
      NotificationService.sendDiscordUpdate(project.workspace_id, projectId, "task.created", notificationMessage),
      NotificationService.sendTelegramAlert(project.workspace_id, projectId, "task.created", notificationMessage),
    ]).catch((err) => console.error("Notification dispatch failed:", err));

    return NextResponse.json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to create task", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
