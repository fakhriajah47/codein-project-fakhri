import { createClient } from "@/lib/supabase/server";
import { ActivityLog } from "@/types";

export class ActivityService {
  private static async hydrateActors(items: any[]): Promise<ActivityLog[]> {
    if (items.length === 0) return [];

    const actorIds = Array.from(
      new Set(items.map((item) => item.actor_id).filter((actorId): actorId is string => typeof actorId === "string"))
    );
    if (actorIds.length === 0) return items as ActivityLog[];

    const supabase = await createClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, avatar_url, job_title")
      .in("user_id", actorIds);

    if (error) {
      console.error("Error hydrating activity actors:", error);
      return items as ActivityLog[];
    }

    const profileByUserId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
    return items.map((item) => ({
      ...item,
      actor: item.actor_id ? profileByUserId.get(item.actor_id) : undefined,
    })) as ActivityLog[];
  }

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
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching project activities:", error);
        return [];
      }

      return await this.hydrateActors(data || []);
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
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching task activities:", error);
        return [];
      }

      return await this.hydrateActors(data || []);
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
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching workspace activities:", error);
        return [];
      }

      return await this.hydrateActors(data || []);
    } catch (err) {
      console.error("Failed to get workspace activities:", err);
      return [];
    }
  }
}
