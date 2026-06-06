import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/lib/services/task-service";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string; attachmentId: string }> }
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

    const { taskId, attachmentId } = await params;
    const task = await TaskService.getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const { data: attachment, error: attachmentError } = await supabase
      .from("task_attachments")
      .select("id, uploaded_by")
      .eq("id", attachmentId)
      .eq("task_id", taskId)
      .single();

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { success: false, message: "Attachment not found", error: { code: "NOT_FOUND" } },
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

    const canDelete =
      !!member &&
      (["owner", "manager"].includes(member.role) || attachment.uploaded_by === user.id);

    if (memberError || !canDelete) {
      return NextResponse.json(
        { success: false, message: "Only attachment uploaders, workspace owners, and managers can delete attachments.", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const deleted = await TaskService.deleteTaskAttachment(attachmentId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Failed to delete task attachment", error: { code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task attachment deleted successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to delete task attachment", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
