import { NextRequest, NextResponse } from "next/server";
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

  const defaultBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (defaultBotToken) {
    return {
      botToken: defaultBotToken,
      chatId: chatId || process.env.TELEGRAM_CHAT_ID || "",
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

    const { botToken: finalBotToken, chatId: finalChatId } = await resolveTelegramConfig(
      supabase,
      workspaceId,
      botToken,
      chatId
    );

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
          botToken: finalBotToken.slice(0, 10) + MASK_PLACEHOLDER,
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
