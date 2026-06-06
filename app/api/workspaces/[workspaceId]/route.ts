import { NextRequest, NextResponse } from "next/server";
import { WorkspaceService } from "@/lib/services/workspace-service";
import { createClient } from "@/lib/supabase/server";
import { updateWorkspaceSchema } from "@/lib/validators/workspace.schema";

export async function GET(
  _request: NextRequest,
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
    const detail = await WorkspaceService.getWorkspaceDetail(workspaceId);

    if (!detail.workspace || !detail.role) {
      return NextResponse.json(
        { success: false, message: "Workspace not found or access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const [
      { count: projectCount },
      { count: activeProjectCount },
      { count: memberCount },
      { count: taskCount },
    ] = await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "active"),
      supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "active"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    ]);

    return NextResponse.json({
      success: true,
      message: "Workspace detail retrieved successfully",
      data: {
        ...detail.workspace,
        role: detail.role,
        stats: {
          totalProjects: projectCount || 0,
          activeProjects: activeProjectCount || 0,
          totalMembers: memberCount || 0,
          totalTasks: taskCount || 0,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve workspace detail", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || member?.role !== "owner") {
      return NextResponse.json(
        { success: false, message: "Only workspace owners can update workspace settings.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const payload = updateWorkspaceSchema.parse(await request.json());
    const updated = await WorkspaceService.updateWorkspace(workspaceId, {
      name: payload.name,
      description: payload.description,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Failed to update workspace", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Workspace updated successfully",
      data: updated,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid workspace payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update workspace", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
