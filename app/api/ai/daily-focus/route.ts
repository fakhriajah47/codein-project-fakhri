import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai-service";
import { createClient } from "@/lib/supabase/server";
import { generateDailyFocusInputSchema } from "@/lib/validators/ai.schema";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const payload = generateDailyFocusInputSchema.parse(await request.json());
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", payload.workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const focus = await AIService.generateDailyFocus(payload.workspaceId, payload.limit);
    if (!focus) {
      return NextResponse.json(
        { success: false, message: "Failed to generate daily focus", error: { code: "AI_GENERATION_FAILED" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Daily focus generated successfully",
      data: focus,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { success: false, message: "Invalid daily focus payload", error: { code: "VALIDATION_ERROR", details: err.flatten?.().fieldErrors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to generate daily focus", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
