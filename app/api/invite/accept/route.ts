import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ success: false, message: "Token tidak ditemukan." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // Fetch and validate invite
    const { data: invite, error } = await admin
      .from("workspace_invites")
      .select("id, workspace_id, invited_email, role, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (error || !invite) {
      return NextResponse.json({ success: false, message: "Token undangan tidak valid." }, { status: 404 });
    }
    if (invite.status === "accepted") {
      return NextResponse.json({ success: false, message: "Undangan ini sudah diterima sebelumnya." }, { status: 400 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ success: false, message: "Token undangan sudah kadaluarsa." }, { status: 400 });
    }

    // Get current logged-in user from session cookie
    let response = NextResponse.json({ success: false }, { status: 500 });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.json({ success: false }, { status: 500 });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    let userId: string;

    if (user) {
      // Logged in — verify email matches
      if (user.email !== invite.invited_email) {
        return NextResponse.json({
          success: false,
          message: `Undangan ini untuk ${invite.invited_email}. Kamu login sebagai ${user.email}.`,
        }, { status: 403 });
      }
      userId = user.id;
    } else {
      // Not logged in — check if user exists by email
      const { data: authData } = await admin.auth.admin.listUsers();
      const targetUser = authData?.users?.find(u => u.email === invite.invited_email);
      if (!targetUser) {
        return NextResponse.json({
          success: false,
          message: "Kamu perlu mendaftar terlebih dahulu dengan email yang diundang.",
        }, { status: 401 });
      }
      userId = targetUser.id;
    }

    // Check if already a member
    const { data: existing } = await admin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", invite.workspace_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      // Add as active member
      await admin.from("workspace_members").insert({
        workspace_id: invite.workspace_id,
        user_id: userId,
        role: invite.role,
        status: "active",
        joined_at: new Date().toISOString(),
      });
    }

    // Mark invite as accepted
    await admin
      .from("workspace_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    const successBody = NextResponse.json({
      success: true,
      message: "Berhasil bergabung ke workspace!",
    });

    // Pass along any cookies
    response.cookies.getAll().forEach(({ name, value, ...rest }) => {
      successBody.cookies.set(name, value, rest as any);
    });

    return successBody;
  } catch (err: any) {
    console.error("Accept invite error:", err);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server." }, { status: 500 });
  }
}
