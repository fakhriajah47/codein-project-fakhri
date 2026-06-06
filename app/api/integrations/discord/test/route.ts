import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";
import { createClient } from "@/lib/supabase/server";
import { saveDiscordIntegrationSchema } from "@/lib/validators/integration.schema";

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

    const { workspaceId, webhookUrl } = saveDiscordIntegrationSchema.parse(await request.json());
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can test Discord settings.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const success = await NotificationService.testDiscordConnection(workspaceId, webhookUrl);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Discord webhook test failed. Ensure URL is correct and channel is active." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Discord webhook message sent successfully",
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid Discord test payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to test Discord settings", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
