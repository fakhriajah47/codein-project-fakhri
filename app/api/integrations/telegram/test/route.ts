import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";
import { createClient } from "@/lib/supabase/server";
import { MASK_PLACEHOLDER, saveTelegramIntegrationSchema } from "@/lib/validators/integration.schema";

async function resolveTelegramConfig(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  botToken: string,
  chatId: string
) {
  if (!botToken.includes(MASK_PLACEHOLDER)) {
    return { botToken, chatId };
  }

  const { data: existing } = await supabase
    .from("integration_settings")
    .select("config")
    .eq("workspace_id", workspaceId)
    .eq("provider", "telegram")
    .maybeSingle();

  const existingBotToken = existing?.config?.botToken;
  if (typeof existingBotToken === "string" && existingBotToken.length > 0) {
    return {
      botToken: existingBotToken,
      chatId: chatId || existing?.config?.chatId || "",
    };
  }

  throw new Error("Saved Telegram bot token is missing. Please enter the full bot token again.");
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

    const { workspaceId, botToken, chatId } = saveTelegramIntegrationSchema.parse(await request.json());
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Only workspace owners and managers can test Telegram settings.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const telegramConfig = await resolveTelegramConfig(supabase, workspaceId, botToken, chatId);
    const success = await NotificationService.testTelegramConnection(
      workspaceId,
      telegramConfig.botToken,
      telegramConfig.chatId
    );

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Telegram bot connection failed. Ensure bot token and chat ID are valid and the bot is added to the chat." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Telegram bot alert message sent successfully",
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid Telegram test payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to test Telegram settings", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
