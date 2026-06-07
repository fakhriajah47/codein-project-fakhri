import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { DashboardService } from "@/lib/services/dashboard-service";
import { GeminiClient } from "@/lib/ai/gemini-client";

const workspaceAdvisorSchema = z.object({
  workspaceHealth: z.enum(["Excellent", "Good", "Needs Attention", "Critical"]),
  healthScore: z.number().min(0).max(100),
  advisoryNote: z.string(),
  keyAlerts: z.array(z.string()).default([]),
  recommendations: z.array(
    z.object({
      action: z.string(),
      target: z.string(),
      urgency: z.enum(["low", "medium", "high", "urgent"]),
    })
  ).default([]),
});

type WorkspaceAdvisorResponse = z.infer<typeof workspaceAdvisorSchema>;

function buildFallbackAdvice(dashboardData: Awaited<ReturnType<typeof DashboardService.getWorkspaceDashboard>>): WorkspaceAdvisorResponse {
  const stats = dashboardData.stats;
  const criticalProjects = dashboardData.projectHealth.find((item) => item.status === "critical")?.count || 0;
  const atRiskProjects = dashboardData.projectHealth.find((item) => item.status === "at_risk")?.count || 0;
  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const overdueRate = stats.totalTasks > 0 ? Math.round((stats.overdueTasks / stats.totalTasks) * 100) : 0;

  let workspaceHealth: WorkspaceAdvisorResponse["workspaceHealth"] = "Excellent";
  if (criticalProjects > 0 || overdueRate >= 25) {
    workspaceHealth = "Critical";
  } else if (atRiskProjects > 0 || stats.overdueTasks > 0 || completionRate < 50) {
    workspaceHealth = "Needs Attention";
  } else if (completionRate < 80) {
    workspaceHealth = "Good";
  }

  const healthScore = Math.max(
    0,
    Math.min(100, 100 - criticalProjects * 25 - atRiskProjects * 15 - stats.overdueTasks * 8 + Math.round(completionRate / 5))
  );

  const keyAlerts: string[] = [];
  if (criticalProjects > 0) keyAlerts.push(`${criticalProjects} proyek berada dalam status kritis dan perlu intervensi segera.`);
  if (atRiskProjects > 0) keyAlerts.push(`${atRiskProjects} proyek berada dalam status at risk.`);
  if (stats.overdueTasks > 0) keyAlerts.push(`${stats.overdueTasks} task overdue perlu ditangani sebelum mengganggu timeline.`);
  if (keyAlerts.length === 0) keyAlerts.push("Tidak ada alert kritis. Pertahankan ritme update dan review progress mingguan.");

  const overloaded = dashboardData.workload
    .filter((member) => member.assignedTasks >= 4)
    .map((member) => member.fullName);
  const idle = dashboardData.workload
    .filter((member) => member.assignedTasks === 0)
    .map((member) => member.fullName);

  return {
    workspaceHealth,
    healthScore,
    advisoryNote:
      `Completion rate ${completionRate}% dengan ${stats.activeProjects} proyek aktif. ` +
      "Fokus utama adalah menjaga project berisiko tetap terlihat, menyelesaikan overdue task, dan menyeimbangkan workload tim.",
    keyAlerts,
    recommendations: [
      {
        action: stats.overdueTasks > 0 ? "Prioritaskan penyelesaian task overdue hari ini." : "Lanjutkan review task harian agar tidak ada pekerjaan tertahan.",
        target: "Task Delivery",
        urgency: stats.overdueTasks > 0 ? "high" : "medium",
      },
      {
        action: overloaded.length > 0 && idle.length > 0
          ? `Redistribusi task dari ${overloaded.join(", ")} ke anggota yang masih kosong: ${idle.join(", ")}.`
          : "Review kapasitas tim dan pastikan setiap task high priority punya owner yang jelas.",
        target: "Team Workload",
        urgency: overloaded.length > 0 ? "high" : "medium",
      },
      {
        action: criticalProjects > 0 || atRiskProjects > 0
          ? "Jalankan risk review untuk proyek kritis/at-risk dan kirim escalation update ke stakeholder."
          : "Pertahankan cadence reporting mingguan untuk stakeholder.",
        target: "Project Risk",
        urgency: criticalProjects > 0 ? "urgent" : atRiskProjects > 0 ? "high" : "low",
      },
    ],
  };
}

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
    const workspaceId = body.workspaceId;
    const forceRegenerate = body.forceRegenerate || false;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Check workspace membership
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Caching layer: Check for existing risk_analysis for this workspace generated today
    if (!forceRegenerate) {
      const { data: cachedLogs, error: cacheError } = await supabase
        .from("ai_generations")
        .select("response, created_at")
        .eq("workspace_id", workspaceId)
        .eq("type", "risk_analysis")
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!cacheError && cachedLogs && cachedLogs.length > 0) {
        const lastLog = cachedLogs[0];
        const lastLogDate = new Date(lastLog.created_at).toISOString().split("T")[0];
        if (lastLogDate === todayStr && lastLog.response) {
          console.log(`Serving cached AI Workspace Advisor for workspace ${workspaceId}`);
          const responseData = lastLog.response as any;
          const finalAdvice = responseData.fallback ? responseData.fallback : responseData;
          return NextResponse.json({
            success: true,
            message: (responseData.fallback || responseData.isFallback)
              ? "Workspace advisory retrieved from cached fallback"
              : "Workspace advisory retrieved from cache",
            data: finalAdvice,
          });
        }
      }
    }

    // Fetch workspace stats & metrics using DashboardService
    const dashboardData = await DashboardService.getWorkspaceDashboard(workspaceId);

    // Fetch projects detail
    const { data: rawProjects } = await supabase
      .from("projects")
      .select("name, status, health_status, progress, risk_score")
      .eq("workspace_id", workspaceId);

    const projectContext = (rawProjects || []).map(p => ({
      name: p.name,
      status: p.status,
      healthStatus: p.health_status,
      progress: p.progress,
      riskScore: p.risk_score
    }));

    const context = {
      workspaceName: "Project Workspace",
      stats: dashboardData.stats,
      projectHealth: dashboardData.projectHealth,
      workload: dashboardData.workload.map(w => ({
        name: w.fullName,
        assigned: w.assignedTasks,
        completed: w.completedTasks
      })),
      projectsDetail: projectContext,
      recentActivities: dashboardData.recentActivity.slice(0, 5).map(a => ({
        actor: a.actor?.full_name || "Sistem",
        action: a.action,
        entity: a.entity_type
      }))
    };

    const prompt = `
      Today is ${todayStr}.
      Analyze the overall health and status of this workspace based on the following metrics and activities:
      ${JSON.stringify(context, null, 2)}

      Provide a structured evaluation, general executive advice (in Indonesian/Bahasa Indonesia, keeping it professional), list of key warning alerts, and concrete actionable recommendations.
    `;

    const systemInstruction = `
      You are an elite Workspace Performance Consultant. You analyze operational project management metrics across multiple projects and teams.
      You MUST return ONLY valid JSON matching the following TypeScript interface definition exactly:
      interface Response {
        workspaceHealth: "Excellent" | "Good" | "Needs Attention" | "Critical";
        healthScore: number; // integer score from 0 to 100
        advisoryNote: string; // Indonesian professional summary/advisory note
        keyAlerts: string[]; // array of warnings/alerts in Indonesian
        recommendations: Array<{
          action: string; // recommended action in Indonesian
          target: string; // area/target of action, e.g., "Team Workload", "Project Risk"
          urgency: "low" | "medium" | "high" | "urgent";
        }>;
      }
      Each recommendation.urgency must be exactly one of "low", "medium", "high", "urgent".
      Do not translate enum values. Do not include markdown. Output raw JSON only.
    `;

    let advice: WorkspaceAdvisorResponse;
    let usedFallback = false;

    try {
      advice = await GeminiClient.generateStructuredJSON({
        prompt,
        systemInstruction,
        schema: workspaceAdvisorSchema,
      });

      await supabase.from("ai_generations").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        type: "risk_analysis" as any,
        prompt,
        response: advice as any,
        status: "success",
      });
    } catch (geminiError: any) {
      usedFallback = true;
      advice = buildFallbackAdvice(dashboardData);

      await supabase.from("ai_generations").insert({
        workspace_id: workspaceId,
        user_id: user.id,
        type: "risk_analysis" as any,
        prompt,
        response: { ...advice, isFallback: true } as any,
        status: "success",
      });
    }

    return NextResponse.json({
      success: true,
      message: usedFallback
        ? "Workspace advisory generated with deterministic fallback"
        : "Workspace advisory generated successfully",
      data: advice,
    });
  } catch (err: any) {
    console.error("Workspace Advisor failed:", err);
    return NextResponse.json(
      { success: false, message: "Failed to generate workspace advice", error: { code: "INTERNAL_ERROR", details: err?.message } },
      { status: 500 }
    );
  }
}
