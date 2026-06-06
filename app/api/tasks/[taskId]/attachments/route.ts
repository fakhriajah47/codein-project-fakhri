import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/lib/services/task-service";
import { createClient } from "@/lib/supabase/server";
import { addTaskAttachmentSchema } from "@/lib/validators/task.schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const { taskId } = await params;
    const task = await TaskService.getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", task.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || member.role === "viewer") {
      return NextResponse.json(
        { success: false, message: "You do not have permission to add task attachments.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const payload = addTaskAttachmentSchema.parse({
      ...(await request.json()),
      taskId,
    });

    const attachment = await TaskService.addTaskAttachment(taskId, {
      fileName: payload.fileName,
      fileUrl: payload.fileUrl,
      fileType: payload.fileType,
      fileSize: payload.fileSize,
    });

    if (!attachment) {
      return NextResponse.json(
        { success: false, message: "Failed to save task attachment metadata", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task attachment saved successfully",
      data: attachment,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid attachment payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to save task attachment", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
