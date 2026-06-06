import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators/auth.schema";
import { errorResponse, successResponse } from "@/lib/utils/response";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      return Response.json(
        {
          success: false,
          message: "Invalid email or password.",
          error: { code: "UNAUTHORIZED" },
        },
        { status: 401 }
      );
    }

    const { data: workspaceMembers } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .limit(1);

    return successResponse("Login successful", {
      redirectTo: workspaceMembers && workspaceMembers.length > 0 ? "/dashboard" : "/onboarding",
    });
  } catch (error) {
    return errorResponse(error, "Failed to login");
  }
}
