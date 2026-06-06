import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validators/auth.schema";
import { errorResponse, successResponse } from "@/lib/utils/response";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      return Response.json(
        {
          success: false,
          message: error?.message || "Account could not be created.",
          error: { code: "AUTH_REGISTER_FAILED" },
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    await admin.from("profiles").upsert(
      {
        user_id: data.user.id,
        full_name: input.fullName,
        job_title: input.jobTitle || null,
        timezone: "Asia/Jakarta",
      },
      { onConflict: "user_id" }
    );

    return successResponse(
      "Account created successfully",
      { userId: data.user.id, redirectTo: "/onboarding" },
      201
    );
  } catch (error) {
    return errorResponse(error, "Failed to create account");
  }
}
