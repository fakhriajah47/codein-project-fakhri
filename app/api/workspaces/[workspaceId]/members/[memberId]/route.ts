import { NextRequest, NextResponse } from "next/server";
import { WorkspaceService } from "@/lib/services/workspace-service";
import { updateMemberRoleSchema } from "@/lib/validators/workspace.schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { workspaceId, memberId } = await params;
    const payload = updateMemberRoleSchema.parse({
      ...(await request.json()),
      workspaceId,
      memberId,
    });

    const result = await WorkspaceService.updateWorkspaceMemberRole(
      workspaceId,
      memberId,
      payload.role
    );

    if (!result.success) {
      const status =
        result.message === "Unauthorized"
          ? 401
          : result.message.includes("Only workspace owners")
            ? 403
            : 400;

      return NextResponse.json(
        { success: false, message: result.message, error: { code: status === 403 ? "FORBIDDEN" : "ROLE_UPDATE_FAILED" } },
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
        { success: false, message: "Invalid member role payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update workspace member role", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const { workspaceId, memberId } = await params;
    const result = await WorkspaceService.removeWorkspaceMember(workspaceId, memberId);

    if (!result.success) {
      const status =
        result.message === "Unauthorized"
          ? 401
          : result.message.includes("Only workspace owners")
            ? 403
            : 400;

      return NextResponse.json(
        { success: false, message: result.message, error: { code: status === 403 ? "FORBIDDEN" : "MEMBER_REMOVE_FAILED" } },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to remove workspace member", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
