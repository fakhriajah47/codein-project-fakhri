import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai-service";
import { createClient } from "@/lib/supabase/server";

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

    const body = await request.json();
    const { workspaceId, projectId, projectName, projectDescription, deadline, teamRoles, complexity } = body;

    if (!workspaceId || !projectId || !projectName || !projectDescription) {
      return NextResponse.json(
        { success: false, message: "Missing required parameter fields", error: { code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    // Verify workspace membership
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || member.role === "viewer") {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const aiPlan = await AIService.generateTasksWithAI(
      workspaceId,
      projectId,
      projectName,
      projectDescription,
      deadline,
      teamRoles || ["Developer", "Designer"],
      complexity || "medium"
    );

    if (!aiPlan) {
      return NextResponse.json(
        { success: false, message: "Failed to generate plan with AI. Ensure GEMINI_API_KEY is valid.", error: { code: "AI_GENERATION_FAILED" } },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI tasks generated successfully",
      data: aiPlan,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to run task generation", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
