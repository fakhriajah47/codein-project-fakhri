import { NextRequest, NextResponse } from "next/server";
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

    return NextResponse.json({
      success: true,
      message: "Project details retrieved successfully",
      data: project,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve project details", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Verify workspace role: only owners and managers can edit project details
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", project.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can update projects.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, clientName, projectType, status, priority, startDate, dueDate } = body;

    const updated = await ProjectService.updateProject(projectId, {
      name,
      description,
      client_name: clientName,
      project_type: projectType,
      status,
      priority,
      start_date: startDate,
      due_date: dueDate,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Failed to update project", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    const notificationMessage = `ℹ️ **Detail Proyek Diperbarui!**
    
**Proyek:** ${updated.name}
**Status:** ${updated.status.toUpperCase()}
**Prioritas:** ${updated.priority.toUpperCase()}`;

    Promise.all([
      NotificationService.sendDiscordUpdate(project.workspace_id, projectId, "project.updated", notificationMessage),
      NotificationService.sendTelegramAlert(project.workspace_id, projectId, "project.updated", notificationMessage),
    ]).catch((err) => console.error("Notification dispatch failed:", err));

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to update project details", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify workspace role: only owners can delete/archive projects
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", project.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || member.role !== "owner") {
      return NextResponse.json(
        { success: false, message: "Only the workspace owner can delete projects.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const success = await ProjectService.deleteProject(projectId);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to delete project from database", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    const notificationMessage = `🗑️ **Proyek Dihapus!**
    
**Proyek:** ${project.name}`;

    Promise.all([
      NotificationService.sendDiscordUpdate(project.workspace_id, projectId, "project.deleted", notificationMessage),
      NotificationService.sendTelegramAlert(project.workspace_id, projectId, "project.deleted", notificationMessage),
    ]).catch((err) => console.error("Notification dispatch failed:", err));

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to delete project", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
