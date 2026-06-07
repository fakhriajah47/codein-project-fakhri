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
      You MUST output valid JSON matching the following TypeScript interface definition exactly:
      interface Response {
        milestones: Array<{
          title: string; // Milestone title (required, minimum 1 character)
          description: string; // Milestone description (default is "")
          tasks: Array<{
            title: string; // Task title (required, minimum 1 character)
            description: string; // Task description (default is "")
            priority: "low" | "medium" | "high" | "urgent"; // Task priority
            suggestedRole: string; // Suggest a role for assignee, e.g., "Developer", "Designer" (default is "Developer")
            estimatedHours: number | null; // Hours estimate (integer or null)
            acceptanceCriteria: string[]; // List of acceptance criteria (default is empty array)
          }>;
        }>;
      }
      Do not include any text before or after the JSON. Do not use markdown backticks like \`\`\`json. Output raw JSON only.
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
        You MUST output valid JSON matching the following TypeScript interface definition exactly:
        interface Response {
          riskLevel: "low" | "medium" | "high" | "critical";
          riskScore: number; // integer score from 0 to 100
          summary: string; // descriptive risk summary
          reasons: string[]; // array of reasons for this assessment
          recommendations: string[]; // array of recommended mitigation actions
          escalationMessage: string; // brief message suitable for escalation/alerts
        }
        Analyze the provided project status and output structured JSON risk telemetry. Do not explain, output only valid JSON. Do not include any text before or after the JSON.
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
        You MUST output valid JSON matching the following TypeScript interface definition exactly:
        interface Response {
          title: string; // A descriptive title for the executive report
          status: "Healthy" | "At Risk" | "Critical" | "Completed"; // Overall project status
          progress: number; // integer progress percentage from 0 to 100
          summary: string; // High-level executive summary text (in Indonesian/Bahasa Indonesia, professional and clear)
          completedWork: string[]; // Key highlights of what has been completed
          pendingWork: string[]; // Key critical tasks or milestones pending
          risks: string[]; // Identified risks or bottlenecks
          nextActions: string[]; // Recommended immediate next steps
        }
        Output ONLY structured JSON. Do not include any text before or after the JSON.
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

  private static buildDeterministicDailyFocus(tasks: any[], limit: number): AIDailyFocusResponse {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Sort tasks: overdue first, then urgent -> high -> medium -> low priority, then by due date
    const sortedTasks = [...tasks].sort((a, b) => {
      // Overdue check
      const aOverdue = a.due_date && a.due_date < todayStr && a.status !== "done";
      const bOverdue = b.due_date && b.due_date < todayStr && b.status !== "done";
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Priority rank
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aWeight = priorityWeight[a.priority as keyof typeof priorityWeight] || 2;
      const bWeight = priorityWeight[b.priority as keyof typeof priorityWeight] || 2;
      if (aWeight !== bWeight) return bWeight - aWeight;

      // Due date
      if (a.due_date && b.due_date) {
        return a.due_date.localeCompare(b.due_date);
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;

      return 0;
    });

    const selectedTasks = sortedTasks.slice(0, limit);

    const focusTasks = selectedTasks.map(t => {
      const isOverdue = t.due_date && t.due_date < todayStr;
      let reason = `Tugas ini merupakan prioritas ${t.priority} di ruang kerja Anda.`;
      if (isOverdue) {
        reason = `TUGAS TERLAMBAT (Tenggat: ${t.due_date}). Harus diselesaikan segera untuk menghindari penundaan proyek lebih lanjut.`;
      } else if (t.priority === "urgent") {
        reason = "Tugas mendesak yang membutuhkan perhatian utama Anda hari ini.";
      } else if (t.priority === "high") {
        reason = "Tugas prioritas tinggi penting untuk kemajuan milestone minggu ini.";
      } else if (t.status === "blocked") {
        reason = "Tugas ini terhambat. Selesaikan blocker agar alur kerja tim lancar.";
      }

      let suggestedAction = "Mulai kerjakan dan update status ke In Progress.";
      if (t.status === "in_progress") {
        suggestedAction = "Selesaikan pengerjaan dan kirim untuk direview.";
      } else if (t.status === "in_review") {
        suggestedAction = "Hubungi manager atau reviewer untuk mendapatkan persetujuan.";
      } else if (isOverdue) {
        suggestedAction = "Fokus 100% untuk menuntaskan backlog terlambat ini sekarang.";
      }

      return {
        taskId: t.id,
        title: t.title,
        reason,
        suggestedAction,
        priority: t.priority as "low" | "medium" | "high" | "urgent",
      };
    });

    const overdueCount = selectedTasks.filter(t => t.due_date && t.due_date < todayStr).length;
    const urgentCount = selectedTasks.filter(t => t.priority === "urgent" || t.priority === "high").length;

    let aiNote = "Beban kerja Anda hari ini terlihat stabil. Fokus selesaikan tugas-tugas prioritas secara bertahap.";
    if (overdueCount > 0) {
      aiNote = `Perhatian: Anda memiliki ${overdueCount} tugas terlambat. Utamakan pengerjaan backlog ini sebelum memulai tugas baru.`;
    } else if (urgentCount > 0) {
      aiNote = `Hari produktif! Fokus Anda hari ini tertuju pada ${urgentCount} tugas prioritas tinggi. Tetap semangat!`;
    }

    const priorities = ["Penyelesaian Task"];
    if (overdueCount > 0) priorities.push("Pembersihan Backlog Terlambat");
    if (urgentCount > 0) priorities.push("Fokus Prioritas Tinggi");

    return {
      focusDate: todayStr,
      aiNote,
      priorities,
      focusTasks,
    };
  }

  static async generateDailyFocus(
    workspaceId: string,
    limit = 5,
    forceRegenerate = false
  ): Promise<AIDailyFocusResponse | null> {
    let tasks: any[] | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Caching layer: Check for existing daily_focus for this user and workspace created today
      if (!forceRegenerate) {
        const { data: cachedLogs, error: cacheError } = await supabase
          .from("ai_generations")
          .select("response, created_at")
          .eq("workspace_id", workspaceId)
          .eq("user_id", user.id)
          .eq("type", "daily_focus")
          .eq("status", "success")
          .order("created_at", { ascending: false })
          .limit(1);

        if (!cacheError && cachedLogs && cachedLogs.length > 0) {
          const lastLog = cachedLogs[0];
          const lastLogDate = new Date(lastLog.created_at).toISOString().split("T")[0];
          if (lastLogDate === todayStr && lastLog.response) {
            console.log(`Serving cached AI Daily Focus for user ${user.id} in workspace ${workspaceId}`);
            return lastLog.response as unknown as AIDailyFocusResponse;
          }
        }
      }

      const { data: fetchedTasks, error } = await supabase
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

      tasks = fetchedTasks;

      if (!tasks || tasks.length === 0) {
        return {
          focusDate: todayStr,
          aiNote: "Anda tidak memiliki tugas aktif yang ditugaskan saat ini. Silakan bersantai atau hubungi manajer proyek Anda untuk tugas baru.",
          priorities: ["Tidak ada tugas aktif"],
          focusTasks: [],
        };
      }

      const taskContext = tasks.map((task) => ({
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
        You are an executive project focus assistant.
        You MUST output valid JSON matching the following TypeScript interface definition exactly:
        interface Response {
          focusDate: string; // current date in YYYY-MM-DD format
          aiNote: string; // daily executive summary note in Indonesian/Bahasa Indonesia
          priorities: string[]; // top 2-3 overall focus priority themes/areas for the day in Indonesian
          focusTasks: Array<{
            taskId: string; // The ID of the task
            title: string; // The title of the task
            reason: string; // Explanation of why this task is selected for today's focus (in Indonesian)
            suggestedAction: string; // Concrete next step action for this task (in Indonesian)
            priority: "low" | "medium" | "high" | "urgent"; // The task priority
          }>;
        }
        Choose the smallest high-impact focus set and explain why each task matters today. Produce strict JSON only. Do not include any text before or after the JSON.
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
      console.error("AI Daily Focus failed, using local deterministic fallback:", err);
      
      try {
        const fallbackResult = this.buildDeterministicDailyFocus(tasks || [], limit);
        
        // Cache the fallback so we don't query Gemini again on next load
        await this.logGeneration({
          workspaceId,
          type: "daily_focus",
          prompt: "daily_focus_fallback_after_error",
          response: fallbackResult as any,
          status: "success",
        });

        return fallbackResult;
      } catch (fallbackErr) {
        console.error("Local daily focus fallback generation failed:", fallbackErr);
      }

      await this.logGeneration({
        workspaceId,
        type: "daily_focus",
        prompt: "daily_focus_error",
        status: "failed",
        errorMessage: err?.message || String(err),
      });
      return null;
    }
  }
}
