"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalAlert } from "@/components/ui/brutal-alert";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalBadge } from "@/components/ui/brutal-badge";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalInput } from "@/components/ui/brutal-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { WorkspaceMember, WorkspaceRole } from "@/types";
import { MailPlus, Shield, Trash2, UsersRound } from "lucide-react";

const roleLabels: Record<WorkspaceRole, string> = {
  owner: "Owner",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
};

export default function TeamWorkspacePage() {
  const { activeWorkspace, workspaceRole } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "danger"; text: string } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");

  const canInvite = workspaceRole === "owner" || workspaceRole === "manager";
  const canManageRoles = workspaceRole === "owner";

  const fetchMembers = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/members`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || "Gagal memuat anggota workspace.");
        return;
      }
      setMembers(result.data || []);
    } catch (err: any) {
      setError(err?.message || "Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeWorkspace]);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeWorkspace || !inviteEmail.trim()) return;
    setSaving("invite");
    setMessage(null);
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setMessage({ type: "danger", text: result.message || "Gagal menambahkan member." });
        return;
      }
      setInviteEmail("");
      setInviteRole("member");
      setMessage({ type: "success", text: "Member berhasil ditambahkan ke workspace." });
      await fetchMembers();
    } catch (err: any) {
      setMessage({ type: "danger", text: err?.message || "Gagal menambahkan member." });
    } finally {
      setSaving(null);
    }
  };

  const updateRole = async (memberId: string, role: WorkspaceRole) => {
    if (!activeWorkspace) return;
    setSaving(memberId);
    setMessage(null);
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setMessage({ type: "danger", text: result.message || "Gagal mengubah role member." });
        return;
      }
      setMessage({ type: "success", text: "Role member berhasil diperbarui." });
      await fetchMembers();
    } catch (err: any) {
      setMessage({ type: "danger", text: err?.message || "Gagal mengubah role member." });
    } finally {
      setSaving(null);
    }
  };

  const removeMember = async (memberId: string, name: string) => {
    if (!activeWorkspace || !confirm(`Hapus ${name} dari workspace ini?`)) return;
    setSaving(memberId);
    setMessage(null);
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/members/${memberId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setMessage({ type: "danger", text: result.message || "Gagal menghapus member." });
        return;
      }
      setMessage({ type: "success", text: "Member berhasil dihapus dari workspace." });
      await fetchMembers();
    } catch (err: any) {
      setMessage({ type: "danger", text: err?.message || "Gagal menghapus member." });
    } finally {
      setSaving(null);
    }
  };

  if (!activeWorkspace) {
    return <EmptyState title="Tidak Ada Workspace Aktif" description="Pilih workspace aktif untuk mengelola team." />;
  }

  if (loading && members.length === 0) {
    return <LoadingState message="Memuat struktur team workspace..." />;
  }

  if (error) {
    return <ErrorState title="Gagal Memuat Team" description={error} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-brutal-black flex items-center gap-2">
          <UsersRound size={30} className="text-brutal-blue" />
          Team Workspace
        </h1>
        <p className="text-gray-600 font-bold">
          Kelola anggota, role, dan kapasitas tim untuk workspace {activeWorkspace.name}.
        </p>
      </div>

      {message && <BrutalAlert variant={message.type}>{message.text}</BrutalAlert>}

      {canInvite && (
        <BrutalCard className="bg-white">
          <form onSubmit={handleInvite} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
            <div>
              <label className="mb-1 block text-xs font-black uppercase">Email Member Terdaftar</label>
              <BrutalInput
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="developer@projectpilot.ai"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase">Role</label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as WorkspaceRole)}
                className="h-11 w-full rounded-lg border-2 border-brutal-black bg-white px-3 text-sm font-black shadow-brutal-xs"
              >
                <option value="manager">Manager</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
                {workspaceRole === "owner" && <option value="owner">Owner</option>}
              </select>
            </div>
            <BrutalButton type="submit" variant="primary" isLoading={saving === "invite"} leftIcon={<MailPlus size={16} />}>
              Tambah Member
            </BrutalButton>
          </form>
        </BrutalCard>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {members.map((member) => {
          const name = member.profiles?.full_name || "Unknown Member";
          const role = member.role;
          return (
            <BrutalCard key={member.id} className="bg-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-brutal-black bg-brutal-yellow text-sm font-black shadow-brutal-xs">
                    {name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-black text-brutal-black">{name}</div>
                    <div className="truncate text-xs font-bold text-gray-500">{member.profiles?.job_title || "Team Member"}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <BrutalBadge variant={role === "owner" ? "blue" : role === "manager" ? "purple" : role === "viewer" ? "gray" : "green"}>
                        {roleLabels[role]}
                      </BrutalBadge>
                      <span className="text-[10px] font-black uppercase text-gray-400">{member.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  {canManageRoles && (
                    <select
                      value={role}
                      onChange={(event) => updateRole(member.id, event.target.value as WorkspaceRole)}
                      disabled={saving === member.id}
                      className="h-10 rounded-lg border-2 border-brutal-black bg-white px-2 text-xs font-black shadow-brutal-xs"
                    >
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  )}
                  {canManageRoles && role !== "owner" && (
                    <BrutalButton
                      size="sm"
                      variant="danger"
                      onClick={() => removeMember(member.id, name)}
                      isLoading={saving === member.id}
                      leftIcon={<Trash2 size={14} />}
                    >
                      Hapus
                    </BrutalButton>
                  )}
                  {!canManageRoles && <Shield size={18} className="text-gray-400" />}
                </div>
              </div>
            </BrutalCard>
          );
        })}
      </div>
    </div>
  );
}
