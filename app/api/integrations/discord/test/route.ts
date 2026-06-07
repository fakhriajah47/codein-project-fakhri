import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";
import { createClient } from "@/lib/supabase/server";
import { MASK_PLACEHOLDER, saveDiscordIntegrationSchema } from "@/lib/validators/integration.schema";

async function resolveDiscordWebhookUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  webhookUrl: string
) {
  if (!webhookUrl.includes(MASK_PLACEHOLDER)) return webhookUrl;

  const { data: existing } = await supabase
    .from("integration_settings")
    .select("config")
    .eq("workspace_id", workspaceId)
    .eq("provider", "discord")
    .maybeSingle();

  const existingWebhookUrl = existing?.config?.webhookUrl;
  if (typeof existingWebhookUrl === "string" && existingWebhookUrl.length > 0) {
    return existingWebhookUrl;
  }

  throw new Error("Saved Discord webhook is missing. Please enter the full webhook URL again.");
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

    const finalWebhookUrl = await resolveDiscordWebhookUrl(supabase, workspaceId, webhookUrl);
    const success = await NotificationService.testDiscordConnection(workspaceId, finalWebhookUrl);

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
