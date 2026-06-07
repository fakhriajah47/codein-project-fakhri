import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ success: false, message: "Token tidak ditemukan." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { data: invite, error } = await admin
      .from("workspace_invites")
      .select(`
        id,
        workspace_id,
        invited_email,
        role,
        status,
        expires_at,
        invited_by,
        workspaces ( name ),
        profiles:invited_by ( full_name )
      `)
      .eq("token", token)
      .maybeSingle();

    if (error || !invite) {
      return NextResponse.json({ success: false, message: "Token undangan tidak valid." }, { status: 404 });
    }

    if (invite.status === "accepted") {
      return NextResponse.json({ success: false, message: "Undangan ini sudah diterima sebelumnya." }, { status: 400 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ success: false, expired: true, message: "Token undangan sudah kadaluarsa." }, { status: 400 });
    }

    const workspace = invite.workspaces as any;
    const inviter = invite.profiles as any;

    return NextResponse.json({
      success: true,
      data: {
        workspaceName: workspace?.name || "Workspace",
        inviterName: inviter?.full_name || "Admin",
        role: invite.role,
        invitedEmail: invite.invited_email,
      },
    });
  } catch (err: any) {
    console.error("Verify invite error:", err);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server." }, { status: 500 });
  }
}
