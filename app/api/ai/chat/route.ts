import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { GeminiClient } from "@/lib/ai/gemini-client";
import { TaskService } from "@/lib/services/task-service";
import { MilestoneService } from "@/lib/services/milestone-service";
import { ActivityService } from "@/lib/services/activity-service";

const chatActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_task"),
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "blocked"]).optional(),
    due_date: z.string().optional(),
    assignee_name: z.string().optional(),
    milestone_title: z.string().optional(),
  }),
  z.object({
    type: z.literal("create_milestone"),
    title: z.string(),
    description: z.string().optional(),
    due_date: z.string().optional(),
  }),
  z.object({
    type: z.literal("update_task_status"),
    task_title: z.string(),
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "blocked"]),
  }),
]);

const chatResponseSchema = z.object({
  reply: z.string(),
  actions: z.array(chatActionSchema).default([]),
});

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

    const { projectId, message, history = [] } = await request.json();
    if (!projectId || !message) {
      return NextResponse.json(
        { success: false, message: "Project ID and message are required" },
        { status: 400 }
      );
    }

    // Get project details
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    // Verify workspace role
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", project.workspace_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: "Access forbidden", error: { code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    // Fetch tasks & milestones for context
    const { data: tasks } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        assignee_id
      `)
      .eq("project_id", projectId);

    const { data: milestones } = await supabase
      .from("milestones")
      .select("id, title, status, due_date, progress")
      .eq("project_id", projectId);

    // Fetch workspace members to resolve assignees
    const { data: crew } = await supabase
      .from("workspace_members")
      .select(`
        user_id,
        role,
        profiles(full_name)
      `)
      .eq("workspace_id", project.workspace_id)
      .eq("status", "active");

    const crewContext = (crew || []).map((c: any) => ({
      userId: c.user_id,
      fullName: c.profiles?.full_name || "Unknown",
      role: c.role,
    }));

    const tasksContext = (tasks || []).map((t) => {
      const assignee = crewContext.find((c) => c.userId === t.assignee_id);
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        assigneeName: assignee ? assignee.fullName : "Belum Ditugaskan",
      };
    });

    const milestonesContext = (milestones || []).map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      dueDate: m.due_date,
      progress: m.progress,
    }));

    const todayStr = new Date().toISOString().split("T")[0];

    const context = {
      project: {
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
      },
      todayDate: todayStr,
      crew: crewContext,
      tasks: tasksContext,
      milestones: milestonesContext,
    };

    const prompt = `
      Konteks Proyek:
      ${JSON.stringify(context, null, 2)}

      Pesan dari Pengguna:
      "${message}"

      Riwayat Percakapan Sebelumnya:
      ${JSON.stringify(history, null, 2)}

      Analisis pesan pengguna di atas.
      1. Jika pengguna bertanya tentang data proyek (misal: "tugas apa saja yang in progress?", "siapa PIC tugas X?"), jawab dengan akurat berdasarkan data konteks dalam bahasa Indonesia yang ramah, sopan, dan jelas.
      2. Jika pengguna memerintahkan suatu aksi penulisan data (membuat tugas baru, membuat milestone baru, atau mengubah status tugas), tentukan jenis aksi yang diminta dan hasilkan detail parameter aksi tersebut pada field "actions".
      
      Aturan untuk aksi "create_task":
      - Tentukan "title", "description" (opsional), "priority" (low/medium/high/urgent), "status" (default "todo"), "due_date" (YYYY-MM-DD, opsional).
      - Untuk "assignee_name", cari nama yang paling cocok dari daftar crew.
      - Untuk "milestone_title", cari judul milestone yang paling cocok dari daftar milestone jika pengguna mengaitkannya.

      Aturan untuk aksi "create_milestone":
      - Tentukan "title", "description" (opsional), "due_date" (YYYY-MM-DD, opsional).

      Aturan untuk aksi "update_task_status":
      - Tentukan "task_title" (judul tugas yang ingin diubah) dan "status" target (backlog/todo/in_progress/in_review/done/blocked).

      Kembalikan respon dalam format JSON yang valid.
    `;

    const systemInstruction = `
      Anda adalah Asisten Proyek AI Gemini. Anda membantu pengguna mengelola proyek mereka melalui percakapan bahasa Indonesia yang profesional dan produktif.
      Anda memiliki kemampuan untuk mengeksekusi tindakan database secara langsung di latar belakang.
      Jika pengguna memerintahkan aksi, Anda wajib mendeteksi dan menuliskan daftar aksi tersebut pada field "actions".
      Format keluaran Anda HARUS berupa JSON valid yang cocok dengan definisi TypeScript berikut secara presisi:
      interface ActionCreateTask {
        type: "create_task";
        title: string;
        description?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        status?: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked";
        due_date?: string; // format YYYY-MM-DD
        assignee_name?: string;
        milestone_title?: string;
      }
      interface ActionCreateMilestone {
        type: "create_milestone";
        title: string;
        description?: string;
        due_date?: string; // format YYYY-MM-DD
      }
      interface ActionUpdateTaskStatus {
        type: "update_task_status";
        task_title: string;
        status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked";
      }
      type Action = ActionCreateTask | ActionCreateMilestone | ActionUpdateTaskStatus;

      interface Response {
        reply: string; // Respons percakapan Anda dalam bahasa Indonesia yang ringkas, sopan, ramah, dan profesional
        actions: Action[]; // Daftar aksi yang dideteksi (default adalah array kosong)
      }
      Jangan gunakan markdown seperti \`\`\`json. Output harus JSON murni.
    `;

    const aiRes = await GeminiClient.generateStructuredJSON({
      prompt,
      systemInstruction,
      schema: chatResponseSchema,
    });

    const executedActions: string[] = [];

    // Execute actions in the database
    if (aiRes.actions && aiRes.actions.length > 0) {
      for (const act of aiRes.actions) {
        if (act.type === "create_task") {
          // Resolve assignee
          let assigneeId: string | undefined = undefined;
          if (act.assignee_name) {
            const matchedCrew = crewContext.find((c) =>
              c.fullName.toLowerCase().includes(act.assignee_name!.toLowerCase())
            );
            if (matchedCrew) assigneeId = matchedCrew.userId;
          }

          // Resolve milestone
          let milestoneId: string | undefined = undefined;
          if (act.milestone_title) {
            const matchedMilestone = milestonesContext.find((m) =>
              m.title.toLowerCase().includes(act.milestone_title!.toLowerCase())
            );
            if (matchedMilestone) milestoneId = matchedMilestone.id;
          }

          const created = await TaskService.createTask(project.workspace_id, projectId, {
            title: act.title,
            description: act.description,
            status: act.status || "todo",
            priority: act.priority || "medium",
            assigneeId,
            milestoneId,
            dueDate: act.due_date,
            aiGenerated: true,
          });

          if (created) {
            executedActions.push(`Membuat tugas baru: "${act.title}"` + (act.assignee_name ? ` ditugaskan ke ${act.assignee_name}` : ""));
          }
        } else if (act.type === "create_milestone") {
          const created = await MilestoneService.createMilestone(projectId, {
            title: act.title,
            description: act.description,
            dueDate: act.due_date,
          });
          if (created) {
            executedActions.push(`Membuat milestone baru: "${act.title}"`);
          }
        } else if (act.type === "update_task_status") {
          // Find task
          const matchedTask = tasksContext.find((t) =>
            t.title.toLowerCase().includes(act.task_title.toLowerCase())
          );
          if (matchedTask) {
            const updated = await TaskService.updateTaskStatus(matchedTask.id, act.status);
            if (updated) {
              executedActions.push(`Mengubah status tugas "${matchedTask.title}" menjadi "${act.status}"`);
            }
          } else {
            executedActions.push(`Gagal mengubah status: Tugas "${act.task_title}" tidak ditemukan.`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reply: aiRes.reply,
        actions: executedActions,
      },
    });
  } catch (err: any) {
    console.error("AI Chat route failed:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memproses obrolan AI", error: err?.message },
      { status: 500 }
    );
  }
}
