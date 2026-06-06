import { NextRequest, NextResponse } from "next/server";
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

    const { workspaceId, webhookUrl, isEnabled } = saveDiscordIntegrationSchema.parse(await request.json());
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can save Discord settings.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    let finalWebhookUrl = webhookUrl;
    if (webhookUrl.includes("****************")) {
      const { data: existing } = await supabase
        .from("integration_settings")
        .select("config")
        .eq("workspace_id", workspaceId)
        .eq("provider", "discord")
        .maybeSingle();

      if (existing?.config?.webhookUrl) {
        finalWebhookUrl = existing.config.webhookUrl;
      }
    }

    const { data, error } = await supabase
      .from("integration_settings")
      .upsert({
        workspace_id: workspaceId,
        provider: "discord",
        config: { webhookUrl: finalWebhookUrl },
        is_enabled: isEnabled,
        created_by: user.id,
      }, { onConflict: "workspace_id,provider" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Discord integration settings saved successfully",
      data: {
        ...data,
        config: {
          webhookUrl: finalWebhookUrl.slice(0, 25) + "****************",
        },
      },
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid Discord integration payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to save Discord settings", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
