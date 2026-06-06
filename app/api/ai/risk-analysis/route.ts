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
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Missing required parameter fields", error: { code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    // Fetch workspace ID
    const { data: project } = await supabase
      .from("projects")
      .select("workspace_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found", error: { code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Verify workspace role: owners and managers only can trigger risk analysis
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", project.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member || !["owner", "manager"].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const riskAnalysis = await AIService.generateRiskAnalysis(
      project.workspace_id,
      projectId
    );

    if (!riskAnalysis) {
      return NextResponse.json(
        { success: false, message: "Failed to generate risk analysis. Ensure GEMINI_API_KEY is valid.", error: { code: "AI_GENERATION_FAILED" } },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI risk analysis generated successfully",
      data: riskAnalysis,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to run risk analysis", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
