import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveTelegramIntegrationSchema } from "@/lib/validators/integration.schema";

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

    const { workspaceId, botToken, chatId, isEnabled } = saveTelegramIntegrationSchema.parse(await request.json());
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can save Telegram settings.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    let finalBotToken = botToken;
    let finalChatId = chatId;
    if (botToken.includes("****************")) {
      const { data: existing } = await supabase
        .from("integration_settings")
        .select("config")
        .eq("workspace_id", workspaceId)
        .eq("provider", "telegram")
        .maybeSingle();

      if (existing?.config?.botToken) {
        finalBotToken = existing.config.botToken;
        finalChatId = existing.config.chatId || finalChatId;
      }
    }

    const { data, error } = await supabase
      .from("integration_settings")
      .upsert({
        workspace_id: workspaceId,
        provider: "telegram",
        config: { botToken: finalBotToken, chatId: finalChatId },
        is_enabled: isEnabled,
        created_by: user.id,
      }, { onConflict: "workspace_id,provider" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Telegram integration settings saved successfully",
      data: {
        ...data,
        config: {
          botToken: finalBotToken.slice(0, 10) + "****************",
          chatId: finalChatId,
        },
      },
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid Telegram integration payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to save Telegram settings", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
