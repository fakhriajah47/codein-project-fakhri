import { NextRequest, NextResponse } from "next/server";
import { WorkspaceService } from "@/lib/services/workspace-service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const workspaces = await WorkspaceService.getWorkspaces();
    return NextResponse.json({
      success: true,
      message: "Workspaces retrieved successfully",
      data: workspaces,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve workspaces", error: { code: "DATABASE_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

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
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Invalid request body", error: { code: "VALIDATION_ERROR", details: { name: "Workspace name is required" } } },
        { status: 400 }
      );
    }

    const workspace = await WorkspaceService.createWorkspace(name.trim(), description?.trim());

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "Failed to create workspace", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Workspace created successfully",
      data: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to create workspace", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
