import { NextRequest, NextResponse } from "next/server";
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

    const { data: settings, error: settingsError } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (settingsError) throw settingsError;

    const maskedSettings = (settings || []).map((setting) => {
      const config = { ...setting.config };
      if (config.webhookUrl) {
        config.webhookUrl = config.webhookUrl.substring(0, 25) + "****************";
      }
      if (config.botToken) {
        config.botToken = config.botToken.substring(0, 10) + "****************";
      }
      return {
        ...setting,
        config,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Workspace integrations retrieved successfully",
      data: maskedSettings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve integration configurations", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
