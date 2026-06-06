import { createClient } from "@/lib/supabase/server";
import { gmailAuthUrlSchema } from "@/lib/validators/integration.schema";
import { errorResponse, successResponse } from "@/lib/utils/response";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { success: false, message: "Unauthorized", error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const input = gmailAuthUrlSchema.parse({
      workspaceId: url.searchParams.get("workspaceId"),
    });

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", input.workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!member || !["owner", "manager"].includes(member.role)) {
      return Response.json(
        { success: false, message: "Only owners and managers can connect Gmail.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      return Response.json(
        { success: false, message: "Gmail OAuth is not configured.", error: { code: "GMAIL_AUTH_FAILED" } },
        { status: 500 }
      );
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email");
    authUrl.searchParams.set("state", input.workspaceId);

    return successResponse("Gmail auth URL generated successfully", {
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    return errorResponse(error, "Failed to generate Gmail auth URL");
  }
}
