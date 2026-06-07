import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GeminiClient } from "@/lib/ai/gemini-client";
import { ProjectService } from "@/lib/services/project-service";
import { TaskService } from "@/lib/services/task-service";
import { ActivityService } from "@/lib/services/activity-service";
import { ProjectPriority, TaskPriority, TaskStatus, WorkspaceRole } from "@/types";

const requestSchema = z.object({
  workspaceId: z.string().uuid(),
  message: z.string().trim().min(3).max(2000),
});

const aiProjectQuerySchema = z.object({
  intent: z.enum(["answer", "create_project", "create_task"]),
  answer: z.string().min(1),
  project: z.object({
    name: z.string().min(3).max(120),
    description: z.string().max(2000).optional().default(""),
    clientName: z.string().max(120).optional().default(""),
    projectType: z.string().max(80).optional().default(""),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    startDate: z.string().optional().default(""),
    dueDate: z.string().optional().default(""),
  }).optional(),
  task: z.object({
    projectId: z.string().uuid().optional(),
    projectName: z.string().optional().default(""),
    title: z.string().min(3).max(160),
    description: z.string().max(3000).optional().default(""),
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "blocked"]).default("todo"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    assignee: z.string().optional().default(""),
    dueDate: z.string().optional().default(""),
    estimatedHours: z.number().min(0).max(999).optional(),
    acceptanceCriteria: z.array(z.string()).default([]),
  }).optional(),
});

type AIProjectQuery = z.infer<typeof aiProjectQuerySchema>;

function normalize(value?: string | null) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildFallbackAnswer(context: {
  projects: any[];
  tasks: any[];
  members: any[];
}) {
  const activeProjects = context.projects.filter((project) => project.status === "active").length;
  const overdueTasks = context.tasks.filter((task) => {
    if (!task.due_date || task.status === "done") return false;
    return task.due_date < new Date().toISOString().slice(0, 10);
  }).length;
  const blockedTasks = context.tasks.filter((task) => task.status === "blocked").length;
  const urgentOpen = context.tasks.filter((task) => task.priority === "urgent" && task.status !== "done").length;

  return {
    intent: "answer",
    answer:
      `Workspace saat ini memiliki ${context.projects.length} project (${activeProjects} aktif), ` +
      `${context.tasks.length} task, ${overdueTasks} overdue, ${blockedTasks} blocked, dan ${urgentOpen} task urgent belum selesai. ` +
      `Anggota aktif: ${context.members.length}.`,
  } satisfies Pick<AIProjectQuery, "intent" | "answer">;
}

function buildWorkspaceSnapshotAnswer(context: {
  projects: any[];
  tasks: any[];
  members: any[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const activeProjects = context.projects.filter((project) => project.status === "active");
  const openTasks = context.tasks.filter((task) => task.status !== "done");
  const doneTasks = context.tasks.filter((task) => task.status === "done");
  const overdueTasks = openTasks.filter((task) => task.due_date && task.due_date < today);
  const blockedTasks = openTasks.filter((task) => task.status === "blocked");
  const urgentOpenTasks = openTasks.filter((task) => task.priority === "urgent");

  return [
    `Snapshot Supabase saat ini: ${context.projects.length} project total, ${activeProjects.length} project aktif, dan ${context.tasks.length} task total.`,
    `Task belum selesai: ${openTasks.length}; selesai: ${doneTasks.length}; overdue: ${overdueTasks.length}; blocked: ${blockedTasks.length}; urgent belum selesai: ${urgentOpenTasks.length}.`,
    `Anggota team aktif: ${context.members.length}.`,
    activeProjects.length > 0
      ? `Project aktif: ${activeProjects.map((project) => project.name).join(", ")}.`
      : "Tidak ada project berstatus aktif.",
  ].join("\n");
}

function asksForWorkspaceCounts(message: string) {
  const normalized = normalize(message);
  return (
    normalized.includes("berapa") ||
    normalized.includes("jumlah") ||
    normalized.includes("total") ||
    normalized.includes("count") ||
    normalized.includes("aktif sekarang") ||
    normalized.includes("task aktif") ||
    normalized.includes("project aktif") ||
    normalized.includes("proyek aktif")
  );
}

function detectPriority(message: string): "low" | "medium" | "high" | "urgent" {
  const normalized = normalize(message);
  if (normalized.includes("urgent") || normalized.includes("mendesak")) return "urgent";
  if (normalized.includes("high") || normalized.includes("tinggi")) return "high";
  if (normalized.includes("low") || normalized.includes("rendah")) return "low";
  return "medium";
}

function detectProjectName(message: string, projects: any[]) {
  const normalizedMessage = normalize(message);
  const project = [...projects]
    .sort((a, b) => normalize(b.name).length - normalize(a.name).length)
    .find((candidate) => normalizedMessage.includes(normalize(candidate.name)));
  return project?.name || "";
}

function detectAssignee(message: string, members: any[]) {
  const normalizedMessage = normalize(message);
  if (normalizedMessage.includes("assign ke saya") || normalizedMessage.includes("untuk saya")) {
    return "saya";
  }

  const member = members.find((candidate) => {
    const fullName = normalize(candidate.fullName);
    const email = normalize(candidate.email);
    return (fullName && normalizedMessage.includes(fullName)) || (email && normalizedMessage.includes(email));
  });

  return member?.fullName || "";
}

function extractCommandTitle(message: string, kind: "task" | "project") {
  const pattern =
    kind === "task"
      ? /(?:buatkan|buat|create|tambahkan|bikinkan)\s+(?:task|tugas|pekerjaan)\s+(.+?)(?:\s+(?:urgent|high|tinggi|medium|sedang|low|rendah)\b|\s+di\s+project|\s+assign|\s+untuk|\s+due\b|$)/i
      : /(?:buatkan|buat|create|siapkan|bikinkan)\s+(?:project|proyek)\s+(.+?)(?:\s+(?:urgent|high|tinggi|medium|sedang|low|rendah)\b|\s+untuk\s+client|\s+due\b|$)/i;

  const match = message.match(pattern);
  return (match?.[1] || "").trim().replace(/^["']|["']$/g, "");
}

function buildDeterministicResult(message: string, context: {
  projects: any[];
  tasks: any[];
  members: any[];
}): AIProjectQuery {
  const normalizedMessage = normalize(message);

  if (
    /\b(buatkan|buat|create|tambahkan|bikinkan)\b/i.test(message) &&
    (normalizedMessage.includes("task") || normalizedMessage.includes("tugas") || normalizedMessage.includes("pekerjaan"))
  ) {
    const title = extractCommandTitle(message, "task") || "Task baru dari instruksi AI";
    return {
      intent: "create_task",
      answer: `Menyiapkan task "${title}".`,
      task: {
        title,
        description: `Dibuat dari instruksi AI: ${message}`,
        status: "todo",
        priority: detectPriority(message),
        projectName: detectProjectName(message, context.projects),
        assignee: detectAssignee(message, context.members),
        dueDate: "",
        acceptanceCriteria: ["Scope sudah jelas", "Output sudah direview"],
      },
    };
  }

  if (
    /\b(buatkan|buat|create|siapkan|bikinkan)\b/i.test(message) &&
    (normalizedMessage.includes("project") || normalizedMessage.includes("proyek"))
  ) {
    const name = extractCommandTitle(message, "project") || "Project Baru dari Instruksi AI";
    return {
      intent: "create_project",
      answer: `Menyiapkan project "${name}".`,
      project: {
        name,
        description: `Dibuat dari instruksi AI: ${message}`,
        clientName: "",
        projectType: "General Project",
        priority: detectPriority(message),
        startDate: "",
        dueDate: "",
      },
    };
  }

  return buildFallbackAnswer(context) as AIProjectQuery;
}

function resolveProject(projects: any[], projectId?: string, projectName?: string) {
  if (projectId) {
    const byId = projects.find((project) => project.id === projectId);
    if (byId) return byId;
  }

  const target = normalize(projectName);
  if (target) {
    const exact = projects.find((project) => normalize(project.name) === target);
    if (exact) return exact;
    const partial = projects.find((project) => normalize(project.name).includes(target) || target.includes(normalize(project.name)));
    if (partial) return partial;
  }

  const activeProjects = projects.filter((project) => project.status === "active");
  return activeProjects.length === 1 ? activeProjects[0] : null;
}

function resolveAssignee(members: any[], assignee?: string, currentUserId?: string) {
  const target = normalize(assignee);
  if (!target || ["me", "saya", "aku", "current user"].includes(target)) {
    return currentUserId || null;
  }

  const exact = members.find((member) =>
    normalize(member.fullName) === target || normalize(member.email) === target
  );
  if (exact) return exact.userId;

  const partial = members.find((member) =>
    normalize(member.fullName).includes(target) ||
    normalize(member.email).includes(target) ||
    target.includes(normalize(member.fullName))
  );

  return partial?.userId || currentUserId || null;
}

async function getWorkspaceContext(workspaceId: string) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const [{ data: workspace }, { data: projects }, { data: tasks }, { data: rawMembers }] = await Promise.all([
    supabase.from("workspaces").select("id,name,description").eq("id", workspaceId).single(),
    supabase
      .from("projects")
      .select("id,name,description,client_name,project_type,status,priority,health_status,progress,risk_score,due_date")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("tasks")
      .select("id,title,description,status,priority,due_date,assignee_id,project_id,project:projects(name,status,health_status,progress,risk_score)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("workspace_members")
      .select("user_id,role,status,profiles(full_name,job_title)")
      .eq("workspace_id", workspaceId)
      .eq("status", "active"),
  ]);

  const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
  const emails = new Map((authUsers.users || []).map((user) => [user.id, user.email || ""]));
  const members = (rawMembers || []).map((member: any) => ({
    userId: member.user_id,
    role: member.role,
    fullName: member.profiles?.full_name || emails.get(member.user_id) || "Anggota Tim",
    jobTitle: member.profiles?.job_title || "",
    email: emails.get(member.user_id) || "",
  }));

  return {
    workspace,
    projects: projects || [],
    tasks: tasks || [],
    members,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", body.workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    const context = await getWorkspaceContext(body.workspaceId);
    const contextForAI = {
      workspace: context.workspace,
      projects: context.projects,
      tasks: context.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        assigneeId: task.assignee_id,
        projectId: task.project_id,
        projectName: task.project?.name,
      })),
      members: context.members,
    };

    const prompt = `
      User message:
      ${body.message}

      Workspace data:
      ${JSON.stringify(contextForAI, null, 2)}

      Decide whether the user is asking a question, asking to create a project, or asking to create a task.
      If the user asks to create something, extract the fields and make the action direct without asking for confirmation.
      Answer in Indonesian, concise and operational.
    `;

    const systemInstruction = `
      You are a project operations AI inside a Supabase-backed project management app.
      You MUST return ONLY valid JSON matching the following TypeScript interface definition exactly:
      interface Response {
        intent: "answer" | "create_project" | "create_task";
        answer: string; // Concise, operational answer/response in Indonesian (Bahasa Indonesia)
        project?: {
          name: string; // min 3, max 120 chars
          description?: string;
          clientName?: string;
          projectType?: string;
          priority: "low" | "medium" | "high" | "urgent"; // default is "medium"
          startDate?: string; // format YYYY-MM-DD
          dueDate?: string; // format YYYY-MM-DD
        };
        task?: {
          projectId?: string; // UUID of project if matched
          projectName?: string; // Name of project if matched
          title: string; // min 3, max 160 chars
          description?: string;
          status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked"; // default is "todo"
          priority: "low" | "medium" | "high" | "urgent"; // default is "medium"
          assignee?: string; // Name or email of the assignee
          dueDate?: string; // format YYYY-MM-DD
          estimatedHours?: number; // number between 0 and 999
          acceptanceCriteria: string[]; // default is empty array
        };
      }
      For questions, use intent "answer".
      For direct commands to create a project, use intent "create_project" and provide the "project" details.
      For direct commands to create a task, use intent "create_task" and provide the "task" details.
      Use existing project IDs/names when available in the context. Use member fullName/email for assignee.
      Do not invent IDs. Leave optional fields out or empty when unknown.
      Do not include markdown tags. Output pure valid JSON.
    `;

    let aiResult: AIProjectQuery;
    let usedFallback = false;

    try {
      aiResult = await GeminiClient.generateStructuredJSON({
        prompt,
        systemInstruction,
        schema: aiProjectQuerySchema,
      });
    } catch (error: any) {
      usedFallback = true;
      aiResult = buildDeterministicResult(body.message, context);
      await supabase.from("ai_generations").insert({
        workspace_id: body.workspaceId,
        user_id: user.id,
        type: "report_generation",
        prompt,
        response: { fallback: aiResult, reason: error?.message || String(error) },
        status: "failed",
        error_message: error?.message || String(error),
      });
    }

    let created: Record<string, unknown> | null = null;
    const role = member.role as WorkspaceRole;

    if (aiResult.intent === "create_project") {
      if (!["owner", "manager"].includes(role)) {
        return NextResponse.json(
          { success: false, message: "Hanya owner atau manager yang bisa membuat project via AI.", error: { code: "FORBIDDEN" } },
          { status: 403 }
        );
      }
      if (!aiResult.project) {
        return NextResponse.json(
          { success: false, message: "AI tidak menemukan detail project yang cukup untuk dibuat.", error: { code: "INVALID_AI_ACTION" } },
          { status: 422 }
        );
      }

      const project = await ProjectService.createProject(body.workspaceId, {
        name: aiResult.project.name,
        description: aiResult.project.description,
        clientName: aiResult.project.clientName,
        projectType: aiResult.project.projectType,
        priority: aiResult.project.priority as ProjectPriority,
        startDate: aiResult.project.startDate,
        dueDate: aiResult.project.dueDate,
      });

      if (!project) {
        return NextResponse.json(
          { success: false, message: "Gagal membuat project dari instruksi AI.", error: { code: "CREATE_PROJECT_FAILED" } },
          { status: 500 }
        );
      }

      created = { type: "project", id: project.id, name: project.name };
      aiResult.answer = `Project "${project.name}" sudah dibuat langsung di workspace.`;
    }

    if (aiResult.intent === "create_task") {
      if (role === "viewer") {
        return NextResponse.json(
          { success: false, message: "Viewer tidak bisa membuat task via AI.", error: { code: "FORBIDDEN" } },
          { status: 403 }
        );
      }
      if (!aiResult.task) {
        return NextResponse.json(
          { success: false, message: "AI tidak menemukan detail task yang cukup untuk dibuat.", error: { code: "INVALID_AI_ACTION" } },
          { status: 422 }
        );
      }

      const targetProject = resolveProject(context.projects, aiResult.task.projectId, aiResult.task.projectName);
      if (!targetProject) {
        return NextResponse.json(
          { success: false, message: "Project target belum jelas. Sebutkan nama project saat meminta AI membuat task.", error: { code: "PROJECT_NOT_RESOLVED" } },
          { status: 422 }
        );
      }

      const assigneeId = resolveAssignee(context.members, aiResult.task.assignee, user.id);
      const task = await TaskService.createTask(body.workspaceId, targetProject.id, {
        title: aiResult.task.title,
        description: aiResult.task.description,
        status: aiResult.task.status as TaskStatus,
        priority: aiResult.task.priority as TaskPriority,
        assigneeId,
        dueDate: aiResult.task.dueDate,
        estimatedHours: aiResult.task.estimatedHours,
        acceptanceCriteria: aiResult.task.acceptanceCriteria,
        aiGenerated: true,
      });

      if (!task) {
        return NextResponse.json(
          { success: false, message: "Gagal membuat task dari instruksi AI.", error: { code: "CREATE_TASK_FAILED" } },
          { status: 500 }
        );
      }

      created = { type: "task", id: task.id, title: task.title, projectId: targetProject.id, projectName: targetProject.name, assigneeId };
      aiResult.answer = `Task "${task.title}" sudah dibuat di project "${targetProject.name}".`;
    }

    if (!created && aiResult.intent === "answer" && asksForWorkspaceCounts(body.message)) {
      aiResult.answer = buildWorkspaceSnapshotAnswer(context);
    }

    await supabase.from("ai_generations").insert({
      workspace_id: body.workspaceId,
      user_id: user.id,
      type: "report_generation",
      prompt,
      response: { ...aiResult, created, usedFallback },
      status: "success",
    });

    await ActivityService.logActivity({
      workspaceId: body.workspaceId,
      actorId: user.id,
      action: created ? "ai.project_command_executed" : "ai.project_query_answered",
      entityType: created?.type === "project" ? "project" : created?.type === "task" ? "task" : "workspace",
      entityId: (created?.id as string | undefined) || body.workspaceId,
      metadata: { intent: aiResult.intent, message: body.message, created },
    });

    return NextResponse.json({
      success: true,
      message: created ? "AI command executed successfully" : "AI query answered successfully",
      data: {
        answer: aiResult.answer,
        intent: aiResult.intent,
        created,
        usedFallback,
      },
    });
  } catch (err: any) {
    const isValidation = err instanceof z.ZodError;
    return NextResponse.json(
      {
        success: false,
        message: isValidation ? "Invalid request payload" : "Failed to process project AI query",
        error: { code: isValidation ? "VALIDATION_ERROR" : "INTERNAL_ERROR", details: err?.message },
      },
      { status: isValidation ? 400 : 500 }
    );
  }
}
