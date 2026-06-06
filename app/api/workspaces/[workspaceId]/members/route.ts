import { NextRequest, NextResponse } from "next/server";
import { WorkspaceService } from "@/lib/services/workspace-service";
import { createClient } from "@/lib/supabase/server";

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

    const members = await WorkspaceService.getWorkspaceMembers(workspaceId);

    return NextResponse.json({
      success: true,
      message: "Workspace members retrieved successfully",
      data: members,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve workspace members", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
