import { NextRequest, NextResponse } from "next/server";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";
import { NotificationService } from "@/lib/services/notification-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
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

    const { workspaceId } = await params;

    // Check membership
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    // Parse filters from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const healthStatus = searchParams.get("health_status") || undefined;
    const search = searchParams.get("search") || undefined;

    const projects = await ProjectService.getProjects(workspaceId, {
      status,
      priority,
      healthStatus,
      search,
    });

    return NextResponse.json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to load projects", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
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

    const { workspaceId } = await params;

    // Verify user role: only owner or manager can create projects
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can create projects.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, clientName, projectType, priority, startDate, dueDate } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Project name is required", error: { code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const project = await ProjectService.createProject(workspaceId, {
      name: name.trim(),
      description: description?.trim(),
      clientName: clientName?.trim(),
      projectType: projectType?.trim(),
      priority: priority || "medium",
      startDate,
      dueDate,
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Failed to create project record", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    const notificationMessage = `🚀 **Proyek Baru Dibuat!**
    
**Proyek:** ${project.name}
**Prioritas:** ${project.priority.toUpperCase()}
**Status:** ${project.status.toUpperCase()}`;

    Promise.all([
      NotificationService.sendDiscordUpdate(workspaceId, project.id, "project.created", notificationMessage),
      NotificationService.sendTelegramAlert(workspaceId, project.id, "project.created", notificationMessage),
    ]).catch((err) => console.error("Notification dispatch failed:", err));

    return NextResponse.json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to create project", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
