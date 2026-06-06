import { NextRequest, NextResponse } from "next/server";
import { MilestoneService } from "@/lib/services/milestone-service";
import { ProjectService } from "@/lib/services/project-service";
import { createClient } from "@/lib/supabase/server";

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

    const milestones = await MilestoneService.getMilestones(projectId);

    return NextResponse.json({
      success: true,
      message: "Milestones retrieved successfully",
      data: milestones,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve project milestones", error: { code: "INTERNAL_ERROR", details: err?.message } },
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

    // Verify user role: only owner or manager can create milestones
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", project.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can create milestones.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, dueDate } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Milestone title is required", error: { code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const milestone = await MilestoneService.createMilestone(projectId, {
      title: title.trim(),
      description: description?.trim(),
      dueDate: dueDate || undefined,
    });

    if (!milestone) {
      return NextResponse.json(
        { success: false, message: "Failed to create milestone", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Milestone created successfully",
      data: milestone,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to create milestone", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
