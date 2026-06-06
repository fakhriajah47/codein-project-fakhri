import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";
import { createClient } from "@/lib/supabase/server";
import { gmailAuthUrlSchema } from "@/lib/validators/integration.schema";

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

    const { workspaceId } = gmailAuthUrlSchema.parse(await request.json());

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can test Gmail integration.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const success = await NotificationService.testGmailConnection(workspaceId);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Gmail SMTP is not configured or failed validation.", error: { code: "GMAIL_TEST_FAILED" } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gmail integration linked successfully",
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid Gmail test payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to connect Gmail integration", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
