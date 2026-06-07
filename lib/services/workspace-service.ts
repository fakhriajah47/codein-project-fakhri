import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Workspace, WorkspaceMember, WorkspaceRole } from "@/types";
import { ActivityService } from "./activity-service";
import { sendInviteEmail } from "./email-service";
import crypto from "crypto";

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
      const { data: workspace, error: wsError } = await adminSupabase
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

      // Get workspace name and inviter profile
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("name")
        .eq("id", workspaceId)
        .single();

      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      // Check if already a member of this workspace (check by email via admin)
      const { data: authData } = await adminSupabase.auth.admin.listUsers();
      const targetAuthUser = authData?.users?.find(u => u.email === email);

      if (targetAuthUser) {
        // User already registered — check if already member
        const { data: existingMember } = await supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("user_id", targetAuthUser.id)
          .maybeSingle();

        if (existingMember) {
          return { success: false, message: "User sudah menjadi anggota workspace ini." };
        }
      }

      // Generate secure invite token (48h expiry)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      // Store invite in workspace_invites table
      const { data: invite, error: inviteInsertError } = await adminSupabase
        .from("workspace_invites")
        .insert({
          workspace_id: workspaceId,
          invited_email: email,
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt,
          status: "pending",
        })
        .select()
        .single();

      if (inviteInsertError) {
        console.error("Error creating invite:", inviteInsertError);
        // Fallback: if workspace_invites table doesn't exist, add directly as member
        if (targetAuthUser) {
          const { data: newMember, error: directError } = await adminSupabase
            .from("workspace_members")
            .insert({
              workspace_id: workspaceId,
              user_id: targetAuthUser.id,
              role,
              status: "active",
              invited_by: user.id,
              joined_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (directError) return { success: false, message: "Gagal menambahkan member." };

          await ActivityService.logActivity({
            workspaceId,
            actorId: user.id,
            action: "member.invited",
            entityType: "workspace_member",
            entityId: newMember.id,
            metadata: { invitedEmail: email, role },
          });

          return { success: true, message: "Member berhasil ditambahkan ke workspace.", member: newMember as WorkspaceMember };
        }
        return { success: false, message: "Gagal membuat undangan." };
      }

      // Send invitation email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
      const acceptUrl = `${appUrl}/invite/accept?token=${token}`;

      try {
        await sendInviteEmail({
          to: email,
          inviterName: inviterProfile?.full_name || "Tim Project Management",
          workspaceName: workspace?.name || "Workspace",
          role,
          acceptUrl,
        });
      } catch (emailErr) {
        console.error("Failed to send invite email (non-fatal):", emailErr);
        // Continue even if email fails — invite is still created
      }

      // If user already registered, also add directly as active member
      if (targetAuthUser) {
        const { data: newMember } = await adminSupabase
          .from("workspace_members")
          .insert({
            workspace_id: workspaceId,
            user_id: targetAuthUser.id,
            role,
            status: "active",
            invited_by: user.id,
            joined_at: new Date().toISOString(),
          })
          .select()
          .single();

        await ActivityService.logActivity({
          workspaceId,
          actorId: user.id,
          action: "member.invited",
          entityType: "workspace_member",
          entityId: newMember?.id || invite.id,
          metadata: { invitedEmail: email, role },
        });
      }

      return {
        success: true,
        message: targetAuthUser
          ? `Member berhasil ditambahkan dan email undangan dikirim ke ${email}.`
          : `Email undangan dikirim ke ${email}. Mereka perlu mendaftar terlebih dahulu.`,
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
