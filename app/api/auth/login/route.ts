import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators/auth.schema";
import { errorResponse } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());

    // Build response first so we can attach cookies to it
    let response = NextResponse.json({ success: false }, { status: 500 });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Write cookies onto the request (for supabase-ssr internals)
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            // Rebuild response so cookies propagate to the browser
            response = NextResponse.json({ success: false }, { status: 500 });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Email atau kata sandi tidak valid.",
          error: { code: "UNAUTHORIZED" },
        },
        { status: 401 }
      );
    }

    // Determine where to redirect after login
    const { data: workspaceMembers } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .limit(1);

    const redirectTo =
      workspaceMembers && workspaceMembers.length > 0
        ? "/dashboard"
        : "/onboarding";

    // Overwrite the response body with success — cookies are already attached
    const successBody = NextResponse.json(
      { success: true, message: "Login successful", data: { redirectTo } },
      { status: 200 }
    );

    // Copy cookies from the supabase-mutated response to the final response
    response.cookies.getAll().forEach(({ name, value, ...rest }) => {
      successBody.cookies.set(name, value, rest as any);
    });

    return successBody;
  } catch (error) {
    return errorResponse(error, "Failed to login");
  }
}
