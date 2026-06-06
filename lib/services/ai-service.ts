import { createClient } from "@/lib/supabase/server";
import { GeminiClient } from "@/lib/ai/gemini-client";
import {
  aiTaskGenerationResponseSchema,
  aiRiskAnalysisResponseSchema,
  aiExecutiveSummaryResponseSchema,
  aiDailyFocusResponseSchema,
  AITaskGenerationResponse,
  AIRiskAnalysisResponse,
  AIExecutiveSummaryResponse,
  AIDailyFocusResponse,
} from "@/lib/validators/ai.schema";
import { ActivityService } from "./activity-service";
import { ProjectService } from "./project-service";
import { MilestoneService } from "./milestone-service";
import { TaskService } from "./task-service";
import { AIGenerationType, TaskPriority, TaskStatus } from "@/types";

export class AIService {
  private static async logGeneration(params: {
    workspaceId: string;
    projectId?: string | null;
    type: AIGenerationType;
    prompt: string;
    response?: Record<string, any> | null;
    status: "success" | "failed";
    errorMessage?: string | null;
  }) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("ai_generations").insert({
        workspace_id: params.workspaceId,
        project_id: params.projectId || null,
        user_id: user?.id || null,
        type: params.type,
        prompt: params.prompt,
        response: params.response || null,
        status: params.status,
        error_message: params.errorMessage || null,
      });
    } catch (err) {
      console.error("Failed to log AI generation:", err);
    }
  }

  static async generateTasksWithAI(
    workspaceId: string,
    projectId: string,
    projectName: string,
    projectDescription: string,
    dueDate?: string,
    teamRoles: string[] = ["Developer", "Designer"],
    complexity: "low" | "medium" | "high" = "medium"
  ): Promise<{ generationId: string; data: AITaskGenerationResponse } | null> {
    const prompt = `
      Project Name: "${projectName}"
      Description: "${projectDescription}"
      Target Completion Date: ${dueDate || "Not specified"}
      Team Roles available: ${teamRoles.join(", ")}
      Complexity: ${complexity}

      Please generate a structured milestone plan with detailed task items to build this project.
      Ensure the suggested assignees only use the specified team roles.
      Provide realistic task descriptions, estimated hours (between 1 and 24 hours), prioritizations, and clear acceptance criteria.
    `;

    const systemInstruction = `
      You are an elite Project Management AI. You translate high level project descriptions and briefs into structured, actionable milestones and tasks.
      Always respond in valid JSON matching the schema. Do not include any text before or after the JSON.
    `;

    try {
      const result = await GeminiClient.generateStructuredJSON<AITaskGenerationResponse>({
        prompt,
        systemInstruction,
        schema: aiTaskGenerationResponseSchema,
      });

      // We need a unique ID for this generation in the UI to match saving later.
      // We can generate a UUID.
      const generationId = crypto.randomUUID();

      // Log success
      await this.logGeneration({
        workspaceId,
        projectId,
        type: "task_generation",
        prompt,
        response: result as any,
        status: "success",
      });

      return { generationId, data: result };
    } catch (err: any) {
      console.error("AI Task Generation failed:", err);
      await this.logGeneration({
        workspaceId,
        projectId,
        type: "task_generation",
        prompt,
        status: "failed",
        errorMessage: err?.message || String(err),
      });
      return null;
    }
  }

  static async saveGeneratedTasks(
    workspaceId: string,
    projectId: string,
    selectedMilestones: AITaskGenerationResponse["milestones"]
  ): Promise<{ success: boolean; createdMilestonesCount: number; createdTasksCount: number }> {
    try {
      let createdMilestonesCount = 0;
      let createdTasksCount = 0;

      for (const ms of selectedMilestones) {
        // Create milestone
        const milestone = await MilestoneService.createMilestone(projectId, {
          title: ms.title,
          description: ms.description,
        });

        if (!milestone) continue;
        createdMilestonesCount++;

        // Create tasks linked to this milestone
        for (const t of ms.tasks) {
          await TaskService.createTask(workspaceId, projectId, {
            milestoneId: milestone.id,
            title: t.title,
            description: t.description,
            status: "todo" as TaskStatus,
            priority: t.priority as TaskPriority,
            estimatedHours: t.estimatedHours || undefined,
            acceptanceCriteria: t.acceptanceCriteria,
            aiGenerated: true,
          });
          createdTasksCount++;
        }

        // Recalculate milestone progress
        await MilestoneService.recalculateMilestoneProgress(milestone.id);
      }

      // Log save action
      await ActivityService.logActivity({
        workspaceId,
        projectId,
        action: "ai.tasks_saved",
        entityType: "project",
        entityId: projectId,
        metadata: { milestonesCreated: createdMilestonesCount, tasksCreated: createdTasksCount },
      });

      return { success: true, createdMilestonesCount, createdTasksCount };
    } catch (err) {
      console.error("Failed to save generated tasks:", err);
      return { success: false, createdMilestonesCount: 0, createdTasksCount: 0 };
    }
  }

  static async generateRiskAnalysis(workspaceId: string, projectId: string): Promise<AIRiskAnalysisResponse | null> {
    try {
      const supabase = await createClient();
      
      // Get project details
      const project = await ProjectService.getProjectDetail(projectId);
      if (!project) return null;

      // Get tasks
      const tasks = await TaskService.getTasksByProject(projectId);
      
      // Get milestones
      const milestones = await MilestoneService.getMilestones(projectId);

      // Get recent activity logs
      const activities = await ActivityService.getProjectActivities(projectId);

      const todayStr = new Date().toISOString().split("T")[0];

      // Prepare context summary
      const projectContext = {
        name: project.name,
        description: project.description,
        dueDate: project.due_date,
        progress: project.progress,
        priority: project.priority,
        currentHealthStatus: project.health_status,
        tasksSummary: {
          total: tasks.length,
          todo: tasks.filter(t => t.status === "todo").length,
          inProgress: tasks.filter(t => t.status === "in_progress").length,
          inReview: tasks.filter(t => t.status === "in_review").length,
          done: tasks.filter(t => t.status === "done").length,
          blocked: tasks.filter(t => t.status === "blocked").length,
          overdue: tasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== "done").length,
        },
        milestones: milestones.map(m => ({
          title: m.title,
          progress: m.progress,
          status: m.status,
          dueDate: m.due_date,
        })),
        recentActivityCount: activities.length,
      };

      const prompt = `
        Perform a thorough risk radar analysis for the following project:
        ${JSON.stringify(projectContext, null, 2)}

        Identify risk levels (low, medium, high, critical), specific reasons (e.g. overdue tasks, blocked tasks, high progress lag relative to deadline), and action recommendations.
      `;

      const systemInstruction = `
        You are an expert Project Intelligence AI that identifies bottlenecks and timeline risks.
        Analyze the provided project status and outputs structured JSON risk telemetry. Do not explain, output only JSON.
      `;

      const result = await GeminiClient.generateStructuredJSON<AIRiskAnalysisResponse>({
        prompt,
        systemInstruction,
        schema: aiRiskAnalysisResponseSchema,
      });

      // Update project table with the risk score and health status
      let healthStatus = project.health_status;
      if (result.riskLevel === "critical") {
        healthStatus = "critical";
      } else if (result.riskLevel === "high") {
        healthStatus = "at_risk";
      }

      await supabase
        .from("projects")
        .update({
          risk_score: result.riskScore,
          health_status: healthStatus,
        })
        .eq("id", projectId);

      // Log success
      await this.logGeneration({
        workspaceId,
        projectId,
        type: "risk_analysis",
        prompt,
        response: result as any,
        status: "success",
      });

      // Log activity
      await ActivityService.logActivity({
        workspaceId,
        projectId,
        action: "ai.risk_analyzed",
        entityType: "project",
        entityId: projectId,
        metadata: { riskScore: result.riskScore, riskLevel: result.riskLevel },
      });

      return result;
    } catch (err: any) {
      console.error("AI Risk analysis failed:", err);
      return null;
    }
  }

  static async generateExecutiveSummary(
    workspaceId: string,
    projectId: string,
    targetAudience: "ceo" | "client" | "internal" = "ceo"
  ): Promise<AIExecutiveSummaryResponse | null> {
    try {
      const project = await ProjectService.getProjectDetail(projectId);
      if (!project) return null;

      const tasks = await TaskService.getTasksByProject(projectId);
      const milestones = await MilestoneService.getMilestones(projectId);

      // Prepare project data context
      const projectContext = {
        name: project.name,
        description: project.description,
        clientName: project.client_name,
        dueDate: project.due_date,
        progress: project.progress,
        healthStatus: project.health_status,
        priority: project.priority,
        tasks: tasks.map(t => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.due_date,
        })),
        milestones: milestones.map(m => ({
          title: m.title,
          progress: m.progress,
          status: m.status,
        })),
      };

      const prompt = `
        Project Details:
        ${JSON.stringify(projectContext, null, 2)}

        Target Audience: ${targetAudience} (Write summary in Indonesian or English depending on context; Indonesia is preferred since the client name is PT Maju Digital and description is Indonesian, but keep it professional).

        Please generate an executive report summary for this project. State the overall progress, completed work highlights, pending critical tasks, risks, and next step actions.
      `;

      const systemInstruction = `
        You are a seasoned Executive Secretary AI. You distill complex engineering/product workloads into concise, board-room-ready summaries.
        Output ONLY structured JSON matching the schema.
      `;

      const result = await GeminiClient.generateStructuredJSON<AIExecutiveSummaryResponse>({
        prompt,
        systemInstruction,
        schema: aiExecutiveSummaryResponseSchema,
      });

      // Log success
      await this.logGeneration({
        workspaceId,
        projectId,
        type: "executive_summary",
        prompt,
        response: result as any,
        status: "success",
      });

      // Log activity
      await ActivityService.logActivity({
        workspaceId,
        projectId,
        action: "ai.executive_summary_generated",
        entityType: "project",
        entityId: projectId,
        metadata: { targetAudience },
      });

      return result;
    } catch (err: any) {
      console.error("AI Executive Summary failed:", err);
      return null;
    }
  }

  static async generateDailyFocus(
    workspaceId: string,
    limit = 5
  ): Promise<AIDailyFocusResponse | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const todayStr = new Date().toISOString().split("T")[0];
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          due_date,
          project:projects(name, health_status, risk_score)
        `)
        .eq("workspace_id", workspaceId)
        .eq("assignee_id", user.id)
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(25);

      if (error) {
        console.error("Error fetching assigned tasks for daily focus:", error);
        return null;
      }

      const taskContext = (tasks || []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        project: task.project,
      }));

      const prompt = `
        Today is ${todayStr}.
        Select up to ${limit} most important tasks for the current user from this assigned task list:
        ${JSON.stringify(taskContext, null, 2)}

        Prioritize overdue tasks, urgent/high priority tasks, blocked or at-risk project work, and tasks due today.
        Return concise execution guidance for the day.
      `;

      const systemInstruction = `
        You are an executive project focus assistant. Produce strict JSON only.
        Choose the smallest high-impact focus set and explain why each task matters today.
      `;

      const result = await GeminiClient.generateStructuredJSON<AIDailyFocusResponse>({
        prompt,
        systemInstruction,
        schema: aiDailyFocusResponseSchema,
      });

      await this.logGeneration({
        workspaceId,
        type: "daily_focus",
        prompt,
        response: result as any,
        status: "success",
      });

      await ActivityService.logActivity({
        workspaceId,
        actorId: user.id,
        action: "ai.daily_focus_generated",
        entityType: "workspace",
        entityId: workspaceId,
        metadata: { focusTaskCount: result.focusTasks.length },
      });

      return result;
    } catch (err: any) {
      console.error("AI Daily Focus failed:", err);
      await this.logGeneration({
        workspaceId,
        type: "daily_focus",
        prompt: "daily_focus",
        status: "failed",
        errorMessage: err?.message || String(err),
      });
      return null;
    }
  }
}
