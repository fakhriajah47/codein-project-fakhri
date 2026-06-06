import { createClient } from "@/lib/supabase/server";
import { Task, ActivityLog, ProjectHealthStatus } from "@/types";
import { ActivityService } from "./activity-service";

export interface WorkspaceStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  atRiskProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface WorkspaceDashboardData {
  stats: WorkspaceStats;
  projectHealth: { status: ProjectHealthStatus; count: number }[];
  workload: {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    assignedTasks: number;
    completedTasks: number;
  }[];
  recentActivity: ActivityLog[];
}

export interface MyWorkData {
  todayFocus: Task[];
  overdueTasks: Task[];
  highPriorityTasks: Task[];
  inProgressTasks: Task[];
  doneThisWeek: Task[];
}

export class DashboardService {
  static async getWorkspaceDashboard(workspaceId: string): Promise<WorkspaceDashboardData> {
    try {
      const supabase = await createClient();
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Fetch projects
      const { data: projects, error: pError } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (pError) throw pError;

      // 2. Fetch tasks
      const { data: tasks, error: tError } = await supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (tError) throw tError;

      // 3. Fetch members
      const { data: members, error: mError } = await supabase
        .from("workspace_members")
        .select(`
          user_id,
          profiles(full_name, avatar_url)
        `)
        .eq("workspace_id", workspaceId)
        .eq("status", "active");

      if (mError) throw mError;

      // Calculate stats
      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === "active").length || 0;
      const completedProjects = projects?.filter(p => p.status === "completed").length || 0;
      const atRiskProjects = projects?.filter(p => p.health_status === "at_risk").length || 0;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === "done").length || 0;
      const overdueTasks = tasks?.filter(t => t.due_date && t.due_date < todayStr && t.status !== "done").length || 0;

      // Calculate project health distribution
      const healthCounts: Record<ProjectHealthStatus, number> = {
        healthy: 0,
        at_risk: 0,
        critical: 0,
        completed: 0,
      };
      projects?.forEach(p => {
        if (p.health_status in healthCounts) {
          healthCounts[p.health_status as ProjectHealthStatus]++;
        }
      });
      const projectHealth = Object.entries(healthCounts).map(([status, count]) => ({
        status: status as ProjectHealthStatus,
        count,
      }));

      // Calculate member workloads
      const workload = (members || []).map((m: any) => {
        const userId = m.user_id;
        const fullName = m.profiles?.full_name || "Unknown Member";
        const avatarUrl = m.profiles?.avatar_url || null;

        const memberTasks = tasks?.filter(t => t.assignee_id === userId) || [];
        const assignedCount = memberTasks.length;
        const completedCount = memberTasks.filter(t => t.status === "done").length;

        return {
          userId,
          fullName,
          avatarUrl,
          assignedTasks: assignedCount,
          completedTasks: completedCount,
        };
      });

      // Get workspace recent activity logs
      const recentActivity = await ActivityService.getWorkspaceActivities(workspaceId, 10);

      return {
        stats: {
          totalProjects,
          activeProjects,
          completedProjects,
          atRiskProjects,
          totalTasks,
          completedTasks,
          overdueTasks,
        },
        projectHealth,
        workload,
        recentActivity,
      };
    } catch (err) {
      console.error("Failed to get workspace dashboard data:", err);
      return {
        stats: {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          atRiskProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
        },
        projectHealth: [],
        workload: [],
        recentActivity: [],
      };
    }
  }

  static async getMyWorkDashboard(workspaceId: string): Promise<MyWorkData> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { todayFocus: [], overdueTasks: [], highPriorityTasks: [], inProgressTasks: [], doneThisWeek: [] };
      }

      const todayStr = new Date().toISOString().split("T")[0];

      // Fetch user's tasks
      const { data: rawTasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          project:projects(name, slug)
        `)
        .eq("workspace_id", workspaceId)
        .eq("assignee_id", user.id);

      if (error) {
        console.error("Error fetching my tasks:", error);
        return { todayFocus: [], overdueTasks: [], highPriorityTasks: [], inProgressTasks: [], doneThisWeek: [] };
      }

      const tasks = (rawTasks || []).map((t: any) => ({
        ...t,
        project: t.project ? {
          name: t.project.name,
          slug: t.project.slug,
        } : undefined,
      })) as Task[];

      // Filter tasks
      const overdueTasks = tasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== "done");
      const todayFocus = tasks.filter(t => t.due_date === todayStr && t.status !== "done");
      const highPriorityTasks = tasks.filter(t => ["high", "urgent"].includes(t.priority) && t.status !== "done");
      const inProgressTasks = tasks.filter(t => t.status === "in_progress");

      // Calculate done this week (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const doneThisWeek = tasks.filter(t => {
        if (t.status !== "done" || !t.completed_at) return false;
        const compDate = new Date(t.completed_at);
        return compDate >= oneWeekAgo;
      });

      return {
        todayFocus,
        overdueTasks,
        highPriorityTasks,
        inProgressTasks,
        doneThisWeek,
      };
    } catch (err) {
      console.error("Failed to get My Work dashboard data:", err);
      return { todayFocus: [], overdueTasks: [], highPriorityTasks: [], inProgressTasks: [], doneThisWeek: [] };
    }
  }
}
