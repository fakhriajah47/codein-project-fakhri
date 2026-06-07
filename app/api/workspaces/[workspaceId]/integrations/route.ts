import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MASK_PLACEHOLDER } from "@/lib/validators/integration.schema";

function maskSecret(value: unknown, visible = 8) {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return `${value.slice(0, Math.min(visible, value.length))}${MASK_PLACEHOLDER}`;
}

function safeIntegrationConfig(provider: string, config: Record<string, unknown> | null) {
  if (!config) return {};

  if (provider === "discord") {
    return {
      webhookUrl: maskSecret(config.webhookUrl, 25),
    };
  }

  if (provider === "telegram") {
    return {
      botToken: maskSecret(config.botToken, 10),
      chatId: typeof config.chatId === "string" ? config.chatId : undefined,
    };
  }

  if (provider === "gmail") {
    return {
      connectedEmail: typeof config.connectedEmail === "string" ? config.connectedEmail : undefined,
    };
  }

  return {};
}

function hasUsableConfig(provider: string, config: Record<string, unknown> | null) {
  if (!config) return false;
  if (provider === "discord") return typeof config.webhookUrl === "string" && config.webhookUrl.length > 0;
  if (provider === "telegram") {
    return (
      typeof config.botToken === "string" &&
      config.botToken.length > 0 &&
      typeof config.chatId === "string" &&
      config.chatId.length > 0
    );
  }
  if (provider === "gmail") return typeof config.connectedEmail === "string" && config.connectedEmail.length > 0;
  return false;
}

function envConfig(provider: string) {
  if (provider === "discord") {
    return {
      config: {
        webhookUrl: process.env.DISCORD_WEBHOOK_URL_DEFAULT || process.env.DISCORD_WEBHOOK_URL,
      },
      isEnabled: Boolean(process.env.DISCORD_WEBHOOK_URL_DEFAULT || process.env.DISCORD_WEBHOOK_URL),
    };
  }

  if (provider === "telegram") {
    return {
      config: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_DEFAULT_CHAT_ID || process.env.TELEGRAM_CHAT_ID,
      },
      isEnabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && (process.env.TELEGRAM_DEFAULT_CHAT_ID || process.env.TELEGRAM_CHAT_ID)),
    };
  }

  return {
    config: {
      connectedEmail: process.env.SMTP_USER || process.env.GMAIL_CONNECTED_EMAIL,
    },
    isEnabled: Boolean(process.env.SMTP_USER || process.env.GMAIL_CONNECTED_EMAIL),
  };
}

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

    const providers = ["discord", "telegram", "gmail"];
    const mergedSettings = [];

    for (const provider of providers) {
      const dbSetting = settings?.find((s) => s.provider === provider);
      const fallback = envConfig(provider);
      if (dbSetting && hasUsableConfig(provider, dbSetting.config)) {
        mergedSettings.push({
          ...dbSetting,
          config: safeIntegrationConfig(provider, dbSetting.config),
        });
      } else {
        mergedSettings.push({
          id: dbSetting?.id || `env-default-${provider}`,
          workspace_id: workspaceId,
          provider,
          config: safeIntegrationConfig(provider, fallback.config),
          is_enabled: Boolean(dbSetting?.is_enabled || fallback.isEnabled),
          created_at: dbSetting?.created_at || new Date().toISOString(),
          updated_at: dbSetting?.updated_at || new Date().toISOString(),
          source: hasUsableConfig(provider, fallback.config) ? "env" : "workspace",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Workspace integrations retrieved successfully",
      data: mergedSettings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve workspace integrations", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
