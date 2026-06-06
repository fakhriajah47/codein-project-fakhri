import { createClient } from "@/lib/supabase/server";
import { ActivityLog } from "@/types";

export class ActivityService {
  static async logActivity(params: {
    workspaceId: string;
    projectId?: string | null;
    taskId?: string | null;
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, any>;
  }): Promise<ActivityLog | null> {
    try {
      const supabase = await createClient();
      
      let actorId = params.actorId;
      if (!actorId) {
        // Retrieve current logged in user if actorId is not explicitly passed
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          actorId = user.id;
        }
      }

      const { data, error } = await supabase
        .from("activity_logs")
        .insert({
          workspace_id: params.workspaceId,
          project_id: params.projectId || null,
          task_id: params.taskId || null,
          actor_id: actorId || null,
          action: params.action,
          entity_type: params.entityType,
          entity_id: params.entityId || null,
          metadata: params.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating activity log:", error);
        return null;
      }

      return data as ActivityLog;
    } catch (err) {
      console.error("Failed to log activity:", err);
      return null;
    }
  }

  static async getProjectActivities(projectId: string): Promise<ActivityLog[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          actor:profiles!activity_logs_actor_id_fkey(full_name, avatar_url, job_title)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching project activities:", error);
        return [];
      }

      // Map actor from profiles relation join
      return (data || []).map((item: any) => ({
        ...item,
        actor: item.actor ? {
          id: item.actor_id,
          user_id: item.actor_id,
          full_name: item.actor.full_name,
          avatar_url: item.actor.avatar_url,
          job_title: item.actor.job_title,
        } : undefined,
      })) as ActivityLog[];
    } catch (err) {
      console.error("Failed to get project activities:", err);
      return [];
    }
  }

  static async getTaskActivities(taskId: string): Promise<ActivityLog[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          actor:profiles!activity_logs_actor_id_fkey(full_name, avatar_url, job_title)
        `)
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching task activities:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        actor: item.actor ? {
          id: item.actor_id,
          user_id: item.actor_id,
          full_name: item.actor.full_name,
          avatar_url: item.actor.avatar_url,
          job_title: item.actor.job_title,
        } : undefined,
      })) as ActivityLog[];
    } catch (err) {
      console.error("Failed to get task activities:", err);
      return [];
    }
  }

  static async getWorkspaceActivities(workspaceId: string, limit = 10): Promise<ActivityLog[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          actor:profiles!activity_logs_actor_id_fkey(full_name, avatar_url, job_title)
        `)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching workspace activities:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        actor: item.actor ? {
          id: item.actor_id,
          user_id: item.actor_id,
          full_name: item.actor.full_name,
          avatar_url: item.actor.avatar_url,
          job_title: item.actor.job_title,
        } : undefined,
      })) as ActivityLog[];
    } catch (err) {
      console.error("Failed to get workspace activities:", err);
      return [];
    }
  }
}
