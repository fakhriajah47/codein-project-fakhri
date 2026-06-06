import { createClient } from "@/lib/supabase/server";
import { Report, ReportType, ReportStatus } from "@/types";
import { ActivityService } from "./activity-service";

export class ReportService {
  static async getProjectReports(projectId: string): Promise<Report[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        return [];
      }

      return data as Report[];
    } catch (err) {
      console.error("Failed to get project reports:", err);
      return [];
    }
  }

  static async getReportById(reportId: string): Promise<Report | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error) {
        console.error("Error fetching report by id:", error);
        return null;
      }

      return data as Report;
    } catch (err) {
      console.error("Failed to get report by id:", err);
      return null;
    }
  }

  static async createReport(
    projectId: string,
    params: {
      title: string;
      type: ReportType;
      targetAudience: "internal" | "ceo" | "client";
      content: Report["content"];
      status?: ReportStatus;
    }
  ): Promise<Report | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: project } = await supabase.from("projects").select("workspace_id").eq("id", projectId).single();
      if (!project) return null;

      const { data, error } = await supabase
        .from("reports")
        .insert({
          workspace_id: project.workspace_id,
          project_id: projectId,
          created_by: user.id,
          title: params.title,
          type: params.type,
          target_audience: params.targetAudience,
          content: params.content,
          status: params.status || "draft",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating report:", error);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: project.workspace_id,
        projectId,
        action: "report.created",
        entityType: "report",
        entityId: data.id,
        metadata: { reportTitle: params.title, type: params.type },
      });

      return data as Report;
    } catch (err) {
      console.error("Failed to create report:", err);
      return null;
    }
  }

  static async updateReport(
    reportId: string,
    params: {
      title?: string;
      targetAudience?: "internal" | "ceo" | "client";
      content?: Report["content"];
      status?: ReportStatus;
    }
  ): Promise<Report | null> {
    try {
      const supabase = await createClient();
      const { data: reportBefore } = await supabase
        .from("reports")
        .select("workspace_id, project_id, title")
        .eq("id", reportId)
        .single();

      if (!reportBefore) return null;

      const updatePayload: Partial<Report> & { target_audience?: Report["target_audience"] } = {};
      if (params.title !== undefined) updatePayload.title = params.title;
      if (params.targetAudience !== undefined) updatePayload.target_audience = params.targetAudience;
      if (params.content !== undefined) updatePayload.content = params.content;
      if (params.status !== undefined) updatePayload.status = params.status;

      const { data, error } = await supabase
        .from("reports")
        .update(updatePayload)
        .eq("id", reportId)
        .select()
        .single();

      if (error) {
        console.error("Error updating report:", error);
        return null;
      }

      await ActivityService.logActivity({
        workspaceId: reportBefore.workspace_id,
        projectId: reportBefore.project_id,
        action: "report.updated",
        entityType: "report",
        entityId: reportId,
        metadata: { changedFields: Object.keys(updatePayload), previousTitle: reportBefore.title },
      });

      return data as Report;
    } catch (err) {
      console.error("Failed to update report:", err);
      return null;
    }
  }

  static async deleteReport(reportId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { data: report } = await supabase.from("reports").select("workspace_id, project_id, title").eq("id", reportId).single();
      if (!report) return false;

      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);

      if (error) {
        console.error("Error deleting report:", error);
        return false;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: report.workspace_id,
        projectId: report.project_id,
        action: "report.deleted",
        entityType: "report",
        entityId: reportId,
        metadata: { reportTitle: report.title },
      });

      return true;
    } catch (err) {
      console.error("Failed to delete report:", err);
      return false;
    }
  }
}
