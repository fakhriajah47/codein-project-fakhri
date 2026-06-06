import { NextRequest, NextResponse } from "next/server";
import { WorkspaceService } from "@/lib/services/workspace-service";
import { inviteMemberSchema } from "@/lib/validators/workspace.schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const payload = inviteMemberSchema.parse({
      ...(await request.json()),
      workspaceId,
    });

    const result = await WorkspaceService.inviteMember(
      workspaceId,
      payload.email,
      payload.role
    );

    if (!result.success) {
      const status =
        result.message === "Unauthorized"
          ? 401
          : result.message.includes("Only owners and managers")
            ? 403
            : 400;

      return NextResponse.json(
        { success: false, message: result.message, error: { code: status === 403 ? "FORBIDDEN" : "INVITE_FAILED" } },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.member,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid member invite payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to invite workspace member", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
