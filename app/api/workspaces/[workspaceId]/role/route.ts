import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: member, error } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (error || !member) {
      return NextResponse.json(
        { success: false, message: "Forbidden workspace membership", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        role: member.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to verify role", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
