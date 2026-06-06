import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gmailCallbackSchema } from "@/lib/validators/integration.schema";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfoResponse = {
  email?: string;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || requestUrl.origin;
  const redirectTarget = new URL("/integrations", appUrl);

  try {
    const input = gmailCallbackSchema.parse({
      code: requestUrl.searchParams.get("code"),
      state: requestUrl.searchParams.get("state"),
    });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirectTarget.searchParams.set("gmail", "unauthorized");
      return NextResponse.redirect(redirectTarget);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
      redirectTarget.searchParams.set("gmail", "not_configured");
      return NextResponse.redirect(redirectTarget);
    }

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", input.state)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!member || !["owner", "manager"].includes(member.role)) {
      redirectTarget.searchParams.set("gmail", "forbidden");
      return NextResponse.redirect(redirectTarget);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: input.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenData.access_token) {
      redirectTarget.searchParams.set("gmail", "token_failed");
      return NextResponse.redirect(redirectTarget);
    }

    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = userInfoResponse.ok
      ? ((await userInfoResponse.json()) as GoogleUserInfoResponse)
      : {};

    await supabase.from("integration_settings").upsert(
      {
        workspace_id: input.state,
        provider: "gmail",
        config: {
          connectedEmail: userInfo.email || user.email,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          tokenType: tokenData.token_type,
          scope: tokenData.scope,
        },
        is_enabled: true,
        created_by: user.id,
      },
      { onConflict: "workspace_id,provider" }
    );

    redirectTarget.searchParams.set("gmail", "connected");
    return NextResponse.redirect(redirectTarget);
  } catch {
    redirectTarget.searchParams.set("gmail", "failed");
    return NextResponse.redirect(redirectTarget);
  }
}
