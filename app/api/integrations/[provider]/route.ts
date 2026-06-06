import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    
    // Parse workspaceId from search params
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "Missing required parameter workspaceId" },
        { status: 400 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can disconnect integrations.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    // Delete row
    const { error } = await supabase
      .from("integration_settings")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("provider", provider);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${provider} integration disconnected successfully`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Failed to disconnect ${provider}`, error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
