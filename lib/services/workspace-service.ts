import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Workspace, WorkspaceMember, WorkspaceRole } from "@/types";
import { ActivityService } from "./activity-service";

export class WorkspaceService {
  static async getWorkspaces(): Promise<Workspace[]> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Query workspaces where the user is a member
      const { data, error } = await supabase
        .from("workspace_members")
        .select(`
          workspace:workspaces(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) {
        console.error("Error fetching workspaces:", error);
        return [];
      }

      return (data || [])
        .map((item: any) => item.workspace)
        .filter(Boolean) as Workspace[];
    } catch (err) {
      console.error("Failed to get workspaces:", err);
      return [];
    }
  }

  static async createWorkspace(name: string, description?: string): Promise<Workspace | null> {
    try {
      const supabase = await createClient();
      const adminSupabase = createAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      // Insert workspace
      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .insert({
          name,
          slug,
          description: description || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (wsError) {
        console.error("Error inserting workspace:", wsError);
        return null;
      }

      // Add creator as owner in workspace_members (needs admin/bypass client for first member creation)
      const { error: memberError } = await adminSupabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: "owner",
          status: "active",
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error("Error adding workspace owner member:", memberError);
        // Clean up workspace if member insert fails
        await adminSupabase.from("workspaces").delete().eq("id", workspace.id);
        return null;
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId: workspace.id,
        actorId: user.id,
        action: "workspace.created",
        entityType: "workspace",
        entityId: workspace.id,
        metadata: { workspaceName: name },
      });

      return workspace as Workspace;
    } catch (err) {
      console.error("Failed to create workspace:", err);
      return null;
    }
  }

  static async getWorkspaceDetail(workspaceId: string): Promise<{
    workspace: Workspace | null;
    role: WorkspaceRole | null;
  }> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { workspace: null, role: null };

      // Get workspace
      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single();

      if (wsError) {
        console.error("Error fetching workspace detail:", wsError);
        return { workspace: null, role: null };
      }

      // Get user's role in this workspace
      const { data: member, error: memberError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (memberError) {
        console.error("Error fetching workspace member role:", memberError);
        return { workspace: workspace as Workspace, role: null };
      }

      return {
        workspace: workspace as Workspace,
        role: member.role as WorkspaceRole,
      };
    } catch (err) {
      console.error("Failed to get workspace detail:", err);
      return { workspace: null, role: null };
    }
  }

  static async updateWorkspace(
    workspaceId: string,
    params: { name?: string; description?: string | null }
  ): Promise<Workspace | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const updatePayload: { name?: string; description?: string | null; slug?: string } = {};
      if (params.name !== undefined) {
        updatePayload.name = params.name;
        updatePayload.slug = params.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }
      if (params.description !== undefined) updatePayload.description = params.description || null;

      const { data, error } = await supabase
        .from("workspaces")
        .update(updatePayload)
        .eq("id", workspaceId)
        .select()
        .single();

      if (error) {
        console.error("Error updating workspace:", error);
        return null;
      }

      await ActivityService.logActivity({
        workspaceId,
        actorId: user.id,
        action: "workspace.updated",
        entityType: "workspace",
        entityId: workspaceId,
        metadata: { changedFields: Object.keys(updatePayload) },
      });

      return data as Workspace;
    } catch (err) {
      console.error("Failed to update workspace:", err);
      return null;
    }
  }

  static async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("workspace_members")
        .select(`
          *,
          profiles(full_name, avatar_url, job_title)
        `)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error("Error fetching workspace members:", error);
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
      })) as WorkspaceMember[];
    } catch (err) {
      console.error("Failed to get workspace members:", err);
      return [];
    }
  }

  static async inviteMember(
    workspaceId: string,
    email: string,
    role: WorkspaceRole
  ): Promise<{ success: boolean; message: string; member?: WorkspaceMember }> {
    try {
      const supabase = await createClient();
      const adminSupabase = createAdminClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, message: "Unauthorized" };

      // Check if logged-in user is owner or manager in this workspace
      const { data: curMember, error: curMemError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .single();

      if (curMemError || !["owner", "manager"].includes(curMember?.role)) {
        return { success: false, message: "Only owners and managers can invite members." };
      }

      // Check if target user exists in auth.users using admin client
      const { data: authData, error: listError } = await adminSupabase.auth.admin.listUsers();
      if (listError) {
        console.error("Error listing users for invite lookup:", listError);
        return { success: false, message: "Failed to look up users." };
      }

      const targetAuthUser = authData.users.find(u => u.email === email);
      if (!targetAuthUser) {
        return {
          success: false,
          message: `User with email ${email} is not registered in ProjectPilot AI. Please register first.`,
        };
      }

      // Check if already a member of this workspace
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", targetAuthUser.id)
        .maybeSingle();

      if (existingMember) {
        return { success: false, message: "User is already a member or has been invited." };
      }

      // Add user as workspace member using admin client
      const { data: newMember, error: inviteError } = await adminSupabase
        .from("workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: targetAuthUser.id,
          role,
          status: "active", // Autoconfirm active for demo
          invited_by: user.id,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (inviteError) {
        console.error("Error inserting member invite:", inviteError);
        return { success: false, message: "Failed to invite member." };
      }

      // Log activity
      await ActivityService.logActivity({
        workspaceId,
        actorId: user.id,
        action: "member.invited",
        entityType: "workspace_member",
        entityId: newMember.id,
        metadata: { invitedEmail: email, role },
      });

      return {
        success: true,
        message: "Member added successfully.",
        member: newMember as WorkspaceMember,
      };
    } catch (err) {
      console.error("Failed to invite member:", err);
      return { success: false, message: "Internal server error." };
    }
  }

  static async updateWorkspaceMemberRole(
    workspaceId: string,
    memberId: string,
    role: WorkspaceRole
  ): Promise<{ success: boolean; message: string; member?: WorkspaceMember }> {
    try {
      const supabase = await createClient();
      const adminSupabase = createAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, message: "Unauthorized" };

      const { data: currentMember } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (currentMember?.role !== "owner") {
        return { success: false, message: "Only workspace owners can update member roles." };
      }

      const { data: targetMember } = await adminSupabase
        .from("workspace_members")
        .select("*")
        .eq("id", memberId)
        .eq("workspace_id", workspaceId)
        .single();

      if (!targetMember) return { success: false, message: "Workspace member not found." };

      if (targetMember.role === "owner" && role !== "owner") {
        const { count } = await adminSupabase
          .from("workspace_members")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("role", "owner")
          .eq("status", "active");

        if ((count || 0) <= 1) {
          return { success: false, message: "Cannot demote the last workspace owner." };
        }
      }

      const { data: updated, error } = await adminSupabase
        .from("workspace_members")
        .update({ role })
        .eq("id", memberId)
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      if (error) {
        console.error("Error updating workspace member role:", error);
        return { success: false, message: "Failed to update member role." };
      }

      await ActivityService.logActivity({
        workspaceId,
        actorId: user.id,
        action: "member.role_updated",
        entityType: "workspace_member",
        entityId: memberId,
        metadata: { from: targetMember.role, to: role },
      });

      return {
        success: true,
        message: "Member role updated successfully.",
        member: updated as WorkspaceMember,
      };
    } catch (err) {
      console.error("Failed to update workspace member role:", err);
      return { success: false, message: "Internal server error." };
    }
  }

  static async removeWorkspaceMember(
    workspaceId: string,
    memberId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = await createClient();
      const adminSupabase = createAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, message: "Unauthorized" };

      const { data: currentMember } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (currentMember?.role !== "owner") {
        return { success: false, message: "Only workspace owners can remove members." };
      }

      const { data: targetMember } = await adminSupabase
        .from("workspace_members")
        .select("*")
        .eq("id", memberId)
        .eq("workspace_id", workspaceId)
        .single();

      if (!targetMember) return { success: false, message: "Workspace member not found." };

      if (targetMember.role === "owner") {
        const { count } = await adminSupabase
          .from("workspace_members")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("role", "owner")
          .eq("status", "active");

        if ((count || 0) <= 1) {
          return { success: false, message: "Cannot remove the last workspace owner." };
        }
      }

      const { error } = await adminSupabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error("Error removing workspace member:", error);
        return { success: false, message: "Failed to remove member." };
      }

      await ActivityService.logActivity({
        workspaceId,
        actorId: user.id,
        action: "member.removed",
        entityType: "workspace_member",
        entityId: memberId,
        metadata: { removedUserId: targetMember.user_id, role: targetMember.role },
      });

      return { success: true, message: "Member removed successfully." };
    } catch (err) {
      console.error("Failed to remove workspace member:", err);
      return { success: false, message: "Internal server error." };
    }
  }
}
