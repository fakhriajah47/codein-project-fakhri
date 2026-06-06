import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/utils/response";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return Response.json(
        {
          success: false,
          message: "Logout failed.",
          error: { code: "AUTH_LOGOUT_FAILED" },
        },
        { status: 400 }
      );
    }

    return successResponse("Logout successful");
  } catch (error) {
    return errorResponse(error, "Failed to logout");
  }
}
