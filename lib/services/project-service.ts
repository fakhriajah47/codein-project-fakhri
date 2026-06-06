import { createClient } from "@/lib/supabase/server";
import { Project, ProjectMember, ProjectStatus, ProjectPriority, ProjectHealthStatus } from "@/types";
import { ActivityService } from "./activity-service";

export interface ProjectFilters {
  status?: string;
  priority?: string;
  healthStatus?: string;
  search?: string;
}

export class ProjectService {
  static async getProjects(workspaceId: string, filters: ProjectFilters = {}): Promise<Project[]> {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.priority) {
        query = query.eq("priority", filters.priority);
      }
      if (filters.healthStatus) {
        query = query.eq("health_status", filters.healthStatus);
      }
      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        return [];
      }

      return data as Project[];
    } catch (err) {
      console.error("Failed to get projects:", err);
      return [];
    }
  }

  static async createProject(
    workspaceId: string,
    params: {
      name: string;
      description?: string;
      clientName?: string;
      projectType?: string;
      priority: ProjectPriority;
      startDate?: string;
      dueDate?: string;
    }
  ): Promise<Project | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      // Generate slug from name
      const baseSlug = params.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

      // Insert project
      const { data: project, error: insertError } = await supabase
        .from("projects")
        .insert({
          workspace_id: workspaceId,
          name: params.name,
          slug,
          description: params.description || null,
          client_name: params.clientName || null,
          project_type: params.projectType || null,
          status: "planning" as ProjectStatus,
          priority: params.priority,
          start_date: params.startDate || null,
          due_date: params.dueDate || null,
          progress: 0,
          health_status: "healthy" as ProjectHealthStatus,
          risk_score: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting project:", insertError);
        return null;
      }

      // Add creator as project member
      const { error: memberError } = await supabase
        .from("project_members")
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) {
        console.error("Error adding project member creator:", memberError);
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId,
        projectId: project.id,
        actorId: user.id,
        action: "project.created",
        entityType: "project",
        entityId: project.id,
        metadata: { projectName: params.name },
      });

      return project as Project;
    } catch (err) {
      console.error("Failed to create project:", err);
      return null;
    }
  }

  static async getProjectDetail(projectId: string): Promise<Project | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("Error fetching project detail:", error);
        return null;
      }

      return data as Project;
    } catch (err) {
      console.error("Failed to get project detail:", err);
      return null;
    }
  }

  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          *,
          profiles(full_name, avatar_url, job_title)
        `)
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching project members:", error);
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
      })) as ProjectMember[];
    } catch (err) {
      console.error("Failed to get project members:", err);
      return [];
    }
  }

  static async addProjectMember(projectId: string, userId: string, role = "contributor"): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { data: project } = await supabase.from("projects").select("workspace_id").eq("id", projectId).single();
      if (!project) return false;

      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: userId,
          role,
        });

      if (error) {
        console.error("Error adding project member:", error);
        return false;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: project.workspace_id,
        projectId,
        action: "project.member_added",
        entityType: "project_member",
        entityId: userId,
      });

      return true;
    } catch (err) {
      console.error("Failed to add project member:", err);
      return false;
    }
  }

  static async updateProject(
    projectId: string,
    params: Partial<Omit<Project, "id" | "workspace_id" | "slug" | "created_at" | "updated_at">>
  ): Promise<Project | null> {
    try {
      const supabase = await createClient();
      const { data: projectBefore } = await supabase.from("projects").select("workspace_id, name").eq("id", projectId).single();
      if (!projectBefore) return null;

      const { data, error } = await supabase
        .from("projects")
        .update(params)
        .eq("id", projectId)
        .select()
        .single();

      if (error) {
        console.error("Error updating project:", error);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: projectBefore.workspace_id,
        projectId,
        action: "project.updated",
        entityType: "project",
        entityId: projectId,
        metadata: { changedFields: Object.keys(params) },
      });

      return data as Project;
    } catch (err) {
      console.error("Failed to update project:", err);
      return null;
    }
  }

  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { data: project } = await supabase.from("projects").select("workspace_id, name").eq("id", projectId).single();
      if (!project) return false;

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        console.error("Error deleting project:", error);
        return false;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: project.workspace_id,
        action: "project.deleted",
        entityType: "project",
        entityId: projectId,
        metadata: { projectName: project.name },
      });

      return true;
    } catch (err) {
      console.error("Failed to delete project:", err);
      return false;
    }
  }

  static async recalculateProjectProgress(projectId: string): Promise<number> {
    try {
      const supabase = await createClient();
      
      // Get all tasks count and done tasks count
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("status")
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching tasks for progress calc:", error);
        return 0;
      }

      const totalTasks = tasks?.length || 0;
      if (totalTasks === 0) {
        await supabase.from("projects").update({ progress: 0 }).eq("id", projectId);
        await this.updateProjectHealth(projectId);
        return 0;
      }

      const doneTasks = tasks.filter(t => t.status === "done").length;
      const progress = Math.round((doneTasks / totalTasks) * 100);

      // Update progress in database
      await supabase.from("projects").update({ progress }).eq("id", projectId);
      
      // Recalculate health and risk score
      await this.updateProjectHealth(projectId);

      return progress;
    } catch (err) {
      console.error("Failed to recalculate project progress:", err);
      return 0;
    }
  }

  static async updateProjectHealth(projectId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { data: project, error: pError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (pError || !project) return;

      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId);

      const totalTasks = tasks?.length || 0;
      const progress = project.progress;
      const dueDate = project.due_date ? new Date(project.due_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let healthStatus: ProjectHealthStatus = "healthy";

      if (progress === 100) {
        healthStatus = "completed";
      } else if (dueDate && dueDate < today) {
        healthStatus = "critical";
      } else if (dueDate) {
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysDiff <= 3 && progress < 80) {
          healthStatus = "at_risk";
        }
      }

      // Calculate risk score based on task details
      // Overdue tasks, blocked tasks, urgent priority tasks unfinished
      let riskScore = 0;
      if (totalTasks > 0 && healthStatus !== "completed") {
        const overdueTasks = tasks?.filter(t => t.due_date && new Date(t.due_date) < today && t.status !== "done").length || 0;
        const blockedTasks = tasks?.filter(t => t.status === "blocked").length || 0;
        const highPriorityUnfinished = tasks?.filter(t => ["high", "urgent"].includes(t.priority) && t.status !== "done").length || 0;

        // Formula for risk: 40% overdue ratio, 35% blocked ratio, 25% priority ratio, adjusted by time left
        const overdueWeight = totalTasks > 0 ? (overdueTasks / totalTasks) * 40 : 0;
        const blockedWeight = totalTasks > 0 ? (blockedTasks / totalTasks) * 35 : 0;
        const priorityWeight = totalTasks > 0 ? (highPriorityUnfinished / totalTasks) * 25 : 0;
        
        let calculatedRisk = Math.round(overdueWeight + blockedWeight + priorityWeight);
        
        // If critical health, minimum risk score is 80
        if (healthStatus === "critical") {
          calculatedRisk = Math.max(calculatedRisk, 85);
        } else if (healthStatus === "at_risk") {
          calculatedRisk = Math.max(calculatedRisk, 50);
        }

        riskScore = Math.min(Math.max(calculatedRisk, 0), 100);
      } else if (healthStatus === "completed") {
        riskScore = 0;
      }

      await supabase
        .from("projects")
        .update({
          health_status: healthStatus,
          risk_score: riskScore,
        })
        .eq("id", projectId);
    } catch (err) {
      console.error("Failed to update project health:", err);
    }
  }
}
