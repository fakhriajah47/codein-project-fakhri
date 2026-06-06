import { createClient } from "@/lib/supabase/server";
import { Milestone, MilestoneStatus } from "@/types";
import { ActivityService } from "./activity-service";

export class MilestoneService {
  static async getMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching milestones:", error);
        return [];
      }

      return data as Milestone[];
    } catch (err) {
      console.error("Failed to get milestones:", err);
      return [];
    }
  }

  static async createMilestone(
    projectId: string,
    params: {
      title: string;
      description?: string;
      dueDate?: string;
    }
  ): Promise<Milestone | null> {
    try {
      const supabase = await createClient();
      
      const { data: project } = await supabase.from("projects").select("workspace_id").eq("id", projectId).single();
      if (!project) return null;

      const { data, error } = await supabase
        .from("milestones")
        .insert({
          project_id: projectId,
          title: params.title,
          description: params.description || null,
          status: "not_started" as MilestoneStatus,
          due_date: params.dueDate || null,
          progress: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating milestone:", error);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: project.workspace_id,
        projectId,
        action: "milestone.created",
        entityType: "milestone",
        entityId: data.id,
        metadata: { milestoneTitle: params.title },
      });

      return data as Milestone;
    } catch (err) {
      console.error("Failed to create milestone:", err);
      return null;
    }
  }

  static async updateMilestone(
    milestoneId: string,
    params: Partial<Omit<Milestone, "id" | "project_id" | "created_at" | "updated_at">>
  ): Promise<Milestone | null> {
    try {
      const supabase = await createClient();
      
      const { data: milestoneBefore } = await supabase.from("milestones").select("project_id, title").eq("id", milestoneId).single();
      if (!milestoneBefore) return null;

      const { data: project } = await supabase.from("projects").select("workspace_id").eq("id", milestoneBefore.project_id).single();
      if (!project) return null;

      const { data, error } = await supabase
        .from("milestones")
        .update(params)
        .eq("id", milestoneId)
        .select()
        .single();

      if (error) {
        console.error("Error updating milestone:", error);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: project.workspace_id,
        projectId: milestoneBefore.project_id,
        action: "milestone.updated",
        entityType: "milestone",
        entityId: milestoneId,
        metadata: { changedFields: Object.keys(params) },
      });

      return data as Milestone;
    } catch (err) {
      console.error("Failed to update milestone:", err);
      return null;
    }
  }

  static async deleteMilestone(milestoneId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { data: milestone } = await supabase.from("milestones").select("project_id, title").eq("id", milestoneId).single();
      if (!milestone) return false;

      const { data: project } = await supabase.from("projects").select("workspace_id").eq("id", milestone.project_id).single();
      if (!project) return false;

      const { error } = await supabase
        .from("milestones")
        .delete()
        .eq("id", milestoneId);

      if (error) {
        console.error("Error deleting milestone:", error);
        return false;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: project.workspace_id,
        projectId: milestone.project_id,
        action: "milestone.deleted",
        entityType: "milestone",
        entityId: milestoneId,
        metadata: { milestoneTitle: milestone.title },
      });

      return true;
    } catch (err) {
      console.error("Failed to delete milestone:", err);
      return false;
    }
  }

  static async recalculateMilestoneProgress(milestoneId: string): Promise<number> {
    try {
      const supabase = await createClient();

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("status")
        .eq("milestone_id", milestoneId);

      if (error) {
        console.error("Error fetching tasks for milestone progress:", error);
        return 0;
      }

      const totalTasks = tasks?.length || 0;
      if (totalTasks === 0) {
        await supabase
          .from("milestones")
          .update({ progress: 0, status: "not_started" as MilestoneStatus })
          .eq("id", milestoneId);
        return 0;
      }

      const doneTasks = tasks.filter(t => t.status === "done").length;
      const progress = Math.round((doneTasks / totalTasks) * 100);

      let status: MilestoneStatus = "in_progress";
      if (progress === 100) {
        status = "completed";
      } else if (progress === 0) {
        status = "not_started";
      }

      await supabase
        .from("milestones")
        .update({ progress, status })
        .eq("id", milestoneId);

      return progress;
    } catch (err) {
      console.error("Failed to recalculate milestone progress:", err);
      return 0;
    }
  }
}
