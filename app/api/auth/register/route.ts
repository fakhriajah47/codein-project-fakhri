import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema } from "@/lib/validators/auth.schema";
import { errorResponse } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const input = registerSchema.parse(await request.json());

    // Use admin client to create user — this bypasses email confirmation requirement
    const admin = createAdminClient();

    const { data: signUpData, error: signUpError } =
      await admin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true, // Auto-confirm so user can login immediately
        user_metadata: {
          full_name: input.fullName,
        },
      });

    if (signUpError || !signUpData.user) {
      // Handle duplicate email gracefully
      const isDuplicate =
        signUpError?.message?.toLowerCase().includes("already") ||
        signUpError?.message?.toLowerCase().includes("duplicate") ||
        signUpError?.code === "email_exists";

      return NextResponse.json(
        {
          success: false,
          message: isDuplicate
            ? "Email sudah terdaftar. Silakan login."
            : signUpError?.message || "Gagal membuat akun.",
          error: { code: "AUTH_REGISTER_FAILED" },
        },
        { status: 400 }
      );
    }

    // Insert profile using admin client (bypasses RLS)
    await admin.from("profiles").upsert(
      {
        user_id: signUpData.user.id,
        full_name: input.fullName,
        job_title: input.jobTitle || null,
        timezone: "Asia/Jakarta",
      },
      { onConflict: "user_id" }
    );

    // Now sign in the user so they get a session cookie
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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.json({ success: false }, { status: 500 });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    const successBody = NextResponse.json(
      {
        success: true,
        message: "Akun berhasil dibuat",
        data: { userId: signUpData.user.id, redirectTo: "/onboarding" },
      },
      { status: 201 }
    );

    // Attach session cookies to response
    response.cookies.getAll().forEach(({ name, value, ...rest }) => {
      successBody.cookies.set(name, value, rest as any);
    });

    return successBody;
  } catch (error) {
    return errorResponse(error, "Failed to create account");
  }
}
