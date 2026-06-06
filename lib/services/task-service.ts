import { createClient } from "@/lib/supabase/server";
import { Task, TaskStatus, TaskPriority, TaskComment, TaskAttachment } from "@/types";
import { ProjectService } from "./project-service";
import { ActivityService } from "./activity-service";

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  due?: string; // 'overdue' | 'today' | 'upcoming'
}

export class TaskService {
  static async getTasksByProject(projectId: string, filters: TaskFilters = {}): Promise<Task[]> {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url, job_title),
          reporter:profiles!tasks_reporter_id_fkey(full_name, avatar_url, job_title)
        `)
        .eq("project_id", projectId);

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.priority) {
        query = query.eq("priority", filters.priority);
      }
      if (filters.assigneeId) {
        query = query.eq("assignee_id", filters.assigneeId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }

      // Map profiles join relations
      return (data || []).map((item: any) => ({
        ...item,
        assignee: item.assignee ? {
          id: item.assignee_id,
          user_id: item.assignee_id,
          full_name: item.assignee.full_name,
          avatar_url: item.assignee.avatar_url,
          job_title: item.assignee.job_title,
        } : null,
        reporter: item.reporter ? {
          id: item.reporter_id,
          user_id: item.reporter_id,
          full_name: item.reporter.full_name,
          avatar_url: item.reporter.avatar_url,
          job_title: item.reporter.job_title,
        } : null,
      })) as Task[];
    } catch (err) {
      console.error("Failed to get tasks by project:", err);
      return [];
    }
  }

  static async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url, job_title),
          reporter:profiles!tasks_reporter_id_fkey(full_name, avatar_url, job_title)
        `)
        .eq("id", taskId)
        .single();

      if (error || !data) {
        console.error("Error fetching task detail:", error);
        return null;
      }

      return {
        ...data,
        assignee: data.assignee ? {
          id: data.assignee_id,
          user_id: data.assignee_id,
          full_name: data.assignee.full_name,
          avatar_url: data.assignee.avatar_url,
          job_title: data.assignee.job_title,
        } : null,
        reporter: data.reporter ? {
          id: data.reporter_id,
          user_id: data.reporter_id,
          full_name: data.reporter.full_name,
          avatar_url: data.reporter.avatar_url,
          job_title: data.reporter.job_title,
        } : null,
      } as Task;
    } catch (err) {
      console.error("Failed to get task by id:", err);
      return null;
    }
  }

  static async getKanbanBoard(projectId: string): Promise<{
    columns: { id: TaskStatus; title: string; tasks: Task[] }[];
  }> {
    try {
      const tasks = await this.getTasksByProject(projectId);
      
      const columnsList: { id: TaskStatus; title: string }[] = [
        { id: "backlog", title: "Backlog" },
        { id: "todo", title: "To Do" },
        { id: "in_progress", title: "In Progress" },
        { id: "in_review", title: "In Review" },
        { id: "done", title: "Done" },
        { id: "blocked", title: "Blocked" },
      ];

      const columns = columnsList.map(col => ({
        id: col.id,
        title: col.title,
        tasks: tasks.filter(t => t.status === col.id),
      }));

      return { columns };
    } catch (err) {
      console.error("Failed to get Kanban board:", err);
      return { columns: [] };
    }
  }

  static async createTask(
    workspaceId: string,
    projectId: string,
    params: {
      title: string;
      description?: string;
      status: TaskStatus;
      priority: TaskPriority;
      assigneeId?: string;
      milestoneId?: string;
      dueDate?: string;
      estimatedHours?: number;
      acceptanceCriteria?: string[];
      aiGenerated?: boolean;
    }
  ): Promise<Task | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      // Insert task
      const { data: task, error: insertError } = await supabase
        .from("tasks")
        .insert({
          workspace_id: workspaceId,
          project_id: projectId,
          milestone_id: params.milestoneId || null,
          title: params.title,
          description: params.description || null,
          status: params.status || "todo",
          priority: params.priority || "medium",
          assignee_id: params.assigneeId || null,
          reporter_id: user.id,
          due_date: params.dueDate || null,
          estimated_hours: params.estimatedHours || null,
          acceptance_criteria: params.acceptanceCriteria || [],
          ai_generated: params.aiGenerated || false,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting task:", insertError);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId,
        projectId,
        taskId: task.id,
        actorId: user.id,
        action: "task.created",
        entityType: "task",
        entityId: task.id,
        metadata: { taskTitle: params.title },
      });

      // Recalculate progress
      await ProjectService.recalculateProjectProgress(projectId);

      return task as Task;
    } catch (err) {
      console.error("Failed to create task:", err);
      return null;
    }
  }

  static async updateTask(
    taskId: string,
    params: Partial<Omit<Task, "id" | "workspace_id" | "project_id" | "created_at" | "updated_at">>
  ): Promise<Task | null> {
    try {
      const supabase = await createClient();
      const { data: taskBefore } = await supabase
        .from("tasks")
        .select("workspace_id, project_id, title")
        .eq("id", taskId)
        .single();

      if (!taskBefore) return null;

      const { data, error } = await supabase
        .from("tasks")
        .update(params)
        .eq("id", taskId)
        .select()
        .single();

      if (error) {
        console.error("Error updating task:", error);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: taskBefore.workspace_id,
        projectId: taskBefore.project_id,
        taskId,
        action: "task.updated",
        entityType: "task",
        entityId: taskId,
        metadata: { changedFields: Object.keys(params) },
      });

      // Recalculate progress if status or milestone changes
      if (params.status) {
        await ProjectService.recalculateProjectProgress(taskBefore.project_id);
      }

      return data as Task;
    } catch (err) {
      console.error("Failed to update task:", err);
      return null;
    }
  }

  static async updateTaskStatus(taskId: string, toStatus: TaskStatus): Promise<Task | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: taskBefore } = await supabase
        .from("tasks")
        .select("workspace_id, project_id, status, title")
        .eq("id", taskId)
        .single();

      if (!taskBefore) return null;
      if (taskBefore.status === toStatus) return taskBefore as Task;

      const { data, error } = await supabase
        .from("tasks")
        .update({ status: toStatus })
        .eq("id", taskId)
        .select()
        .single();

      if (error) {
        console.error("Error updating task status:", error);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: taskBefore.workspace_id,
        projectId: taskBefore.project_id,
        taskId,
        actorId: user.id,
        action: "task.status_changed",
        entityType: "task",
        entityId: taskId,
        metadata: {
          taskTitle: taskBefore.title,
          fromStatus: taskBefore.status,
          toStatus: toStatus,
        },
      });

      // Recalculate progress
      await ProjectService.recalculateProjectProgress(taskBefore.project_id);

      return data as Task;
    } catch (err) {
      console.error("Failed to update task status:", err);
      return null;
    }
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { data: task } = await supabase
        .from("tasks")
        .select("workspace_id, project_id, title")
        .eq("id", taskId)
        .single();

      if (!task) return false;

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        console.error("Error deleting task:", error);
        return false;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: task.workspace_id,
        projectId: task.project_id,
        action: "task.deleted",
        entityType: "task",
        entityId: taskId,
        metadata: { taskTitle: task.title },
      });

      // Recalculate progress
      await ProjectService.recalculateProjectProgress(task.project_id);

      return true;
    } catch (err) {
      console.error("Failed to delete task:", err);
      return false;
    }
  }

  // --- Comments ---
  static async addTaskComment(taskId: string, content: string): Promise<TaskComment | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: task } = await supabase.from("tasks").select("workspace_id, project_id").eq("id", taskId).single();
      if (!task) return null;

      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding task comment:", error);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: task.workspace_id,
        projectId: task.project_id,
        taskId,
        actorId: user.id,
        action: "task.comment_added",
        entityType: "task_comment",
        entityId: data.id,
      });

      return data as TaskComment;
    } catch (err) {
      console.error("Failed to add task comment:", err);
      return null;
    }
  }

  static async getTaskComments(taskId: string): Promise<TaskComment[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("task_comments")
        .select(`
          *,
          profiles(full_name, avatar_url, job_title)
        `)
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching task comments:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        profiles: item.profiles ? {
          id: item.user_id,
          user_id: item.user_id,
          full_name: item.profiles.full_name,
          avatar_url: item.profiles.avatar_url,
          job_title: item.profiles.job_title,
        } : undefined,
      })) as TaskComment[];
    } catch (err) {
      console.error("Failed to get task comments:", err);
      return [];
    }
  }

  // --- Attachments ---
  static async addTaskAttachment(
    taskId: string,
    params: { fileName: string; fileUrl: string; fileType?: string; fileSize?: number }
  ): Promise<TaskAttachment | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: task } = await supabase.from("tasks").select("workspace_id, project_id").eq("id", taskId).single();
      if (!task) return null;

      const { data, error } = await supabase
        .from("task_attachments")
        .insert({
          task_id: taskId,
          uploaded_by: user.id,
          file_name: params.fileName,
          file_url: params.fileUrl,
          file_type: params.fileType || null,
          file_size: params.fileSize || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding task attachment:", error);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: task.workspace_id,
        projectId: task.project_id,
        taskId,
        actorId: user.id,
        action: "task.attachment_added",
        entityType: "task_attachment",
        entityId: data.id,
        metadata: { fileName: params.fileName },
      });

      return data as TaskAttachment;
    } catch (err) {
      console.error("Failed to add task attachment:", err);
      return null;
    }
  }

  static async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching task attachments:", error);
        return [];
      }

      return data as TaskAttachment[];
    } catch (err) {
      console.error("Failed to get task attachments:", err);
      return [];
    }
  }

  static async deleteTaskAttachment(attachmentId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { data: attachment } = await supabase
        .from("task_attachments")
        .select("task_id, file_name")
        .eq("id", attachmentId)
        .single();

      if (!attachment) return false;

      const { data: task } = await supabase
        .from("tasks")
        .select("workspace_id, project_id")
        .eq("id", attachment.task_id)
        .single();

      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachmentId);

      if (error) {
        console.error("Error deleting task attachment:", error);
        return false;
      }

      if (task) {
        await ActivityService.logActivity({
          workspaceId: task.workspace_id,
          projectId: task.project_id,
          taskId: attachment.task_id,
          action: "task.attachment_deleted",
          entityType: "task_attachment",
          entityId: attachmentId,
          metadata: { fileName: attachment.file_name },
        });
      }

      return true;
    } catch (err) {
      console.error("Failed to delete task attachment:", err);
      return false;
    }
  }
}
