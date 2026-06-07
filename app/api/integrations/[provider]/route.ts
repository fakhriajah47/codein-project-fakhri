import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ActivityService } from "@/lib/services/activity-service";
import { disconnectIntegrationSchema } from "@/lib/validators/integration.schema";

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

    
    const { workspaceId, provider: validatedProvider } = disconnectIntegrationSchema.parse({
      workspaceId: request.nextUrl.searchParams.get("workspaceId"),
      provider,
    });

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
      .eq("provider", validatedProvider);

    if (error) throw error;

    await ActivityService.logActivity({
      workspaceId,
      actorId: user.id,
      action: "integration.disconnected",
      entityType: "integration",
      entityId: workspaceId,
      metadata: { provider: validatedProvider },
    });

    return NextResponse.json({
      success: true,
      message: `${validatedProvider} integration disconnected successfully`,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid integration disconnect payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: `Failed to disconnect ${provider}`, error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
