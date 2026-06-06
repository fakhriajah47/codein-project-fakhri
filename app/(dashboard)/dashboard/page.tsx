"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalBadge, BrutalBadgeVariant } from "@/components/ui/brutal-badge";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkspaceDashboardData } from "@/lib/services/dashboard-service";
import {
  Folder,
  CheckSquare,
  AlertTriangle,
  Users,
  Activity,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function WorkspaceDashboardPage() {
  const { activeWorkspace } = useWorkspace();
  const [data, setData] = useState<WorkspaceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!activeWorkspace) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/workspaces/${activeWorkspace.id}/dashboard`);
        const resData = await response.json();

        if (!response.ok || !resData.success) {
          setError(resData.message || "Failed to load dashboard statistics.");
          setLoading(false);
          return;
        }

        setData(resData.data);
      } catch (err: any) {
        setError(err?.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [activeWorkspace]);

  if (!activeWorkspace) {
    return <EmptyState title="Tidak Ada Ruang Kerja yang Terpilih" description="Silakan pilih atau buat ruang kerja baru untuk melihat statistik dasbor." />;
  }

  if (loading) {
    return <LoadingState message="Menghubungkan ke database pusat kendali..." />;
  }

  if (error) {
    return <ErrorState title="Kesalahan Memuat Data" description={error} />;
  }

  const stats = data?.stats;
  const projectHealth = data?.projectHealth || [];
  const workload = data?.workload || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-brutal-black">
          Dasbor Utama
        </h1>
        <p className="text-gray-600 font-bold">
          Ikhtisar Ruang Kerja: <span className="text-brutal-blue uppercase">{activeWorkspace.name}</span>
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <BrutalCard variant="default" className="flex items-center gap-4">
          <div className="p-3 rounded-xl border-2 border-brutal-black bg-brutal-blue text-white shadow-brutal-xs">
            <Folder size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-brutal-black">{stats?.activeProjects} / {stats?.totalProjects}</div>
            <div className="text-xs uppercase font-black text-gray-500">Proyek Aktif</div>
          </div>
        </BrutalCard>

        <BrutalCard variant="success" className="flex items-center gap-4">
          <div className="p-3 rounded-xl border-2 border-brutal-black bg-white text-brutal-black shadow-brutal-xs">
            <CheckSquare size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-brutal-black">{stats?.completedTasks} / {stats?.totalTasks}</div>
            <div className="text-xs uppercase font-black text-gray-700">Tugas Selesai</div>
          </div>
        </BrutalCard>

        <BrutalCard
          variant={stats && stats.overdueTasks > 0 ? "danger" : "default"}
          className="flex items-center gap-4"
        >
          <div className="p-3 rounded-xl border-2 border-brutal-black bg-white text-brutal-black shadow-brutal-xs">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-brutal-black">{stats?.overdueTasks}</div>
            <div className="text-xs uppercase font-black text-gray-600">Tugas Terlambat</div>
          </div>
        </BrutalCard>

        <BrutalCard
          variant={stats && stats.atRiskProjects > 0 ? "warning" : "default"}
          className="flex items-center gap-4"
        >
          <div className="p-3 rounded-xl border-2 border-brutal-black bg-white text-brutal-black shadow-brutal-xs">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-brutal-black">{stats?.atRiskProjects}</div>
            <div className="text-xs uppercase font-black text-gray-600">Proyek Berisiko</div>
          </div>
        </BrutalCard>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Workload & Project Health */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workspace Member Workload Card */}
          <BrutalCard className="bg-white">
            <h2 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4 flex items-center gap-2">
              <Users size={20} className="text-brutal-blue" />
              Beban Kerja Tim
            </h2>

            {workload.length === 0 ? (
              <p className="text-sm font-bold text-gray-500 py-4 text-center">Belum ada anggota tim aktif di ruang kerja ini.</p>
            ) : (
              <div className="space-y-4">
                {workload.map((member) => {
                  const completionRate =
                    member.assignedTasks > 0
                      ? Math.round((member.completedTasks / member.assignedTasks) * 100)
                      : 0;

                  return (
                    <div
                      key={member.userId}
                      className="p-4 border-2 border-brutal-black rounded-xl bg-brutal-soft-bg flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-brutal-black bg-brutal-yellow flex items-center justify-center font-black text-sm">
                          {member.fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-sm text-brutal-black">{member.fullName}</div>
                          <div className="text-xs font-bold text-gray-500">
                            {member.completedTasks} dari {member.assignedTasks} Tugas Selesai
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Progress Bar representation */}
                        <div className="w-32 bg-white border-2 border-brutal-black rounded-full h-4 overflow-hidden p-0.5">
                          <div
                            className="bg-brutal-mint border-r-2 border-brutal-black h-full rounded-full transition-all"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <BrutalBadge variant="default" className="text-xs font-black">
                          {completionRate}%
                        </BrutalBadge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </BrutalCard>

          {/* Project Health Radar */}
          <BrutalCard className="bg-white">
            <h2 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-brutal-purple" />
              Status Kesehatan Proyek
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {projectHealth.map((health) => {
                let badgeVariant: BrutalBadgeVariant = "default";
                let label: string = health.status;
                if (health.status === "healthy") {
                  badgeVariant = "green";
                  label = "Aman";
                }
                if (health.status === "at_risk") {
                  badgeVariant = "yellow";
                  label = "Berisiko";
                }
                if (health.status === "critical") {
                  badgeVariant = "red";
                  label = "Kritis";
                }
                if (health.status === "completed") {
                  badgeVariant = "blue";
                  label = "Selesai";
                }

                return (
                  <div
                    key={health.status}
                    className="border-2 border-brutal-black p-4 rounded-xl text-center bg-brutal-soft-bg"
                  >
                    <div className="text-3xl font-black text-brutal-black mb-1">
                      {health.count}
                    </div>
                    <BrutalBadge variant={badgeVariant} className="text-xs font-black uppercase">
                      {label}
                    </BrutalBadge>
                  </div>
                );
              })}
            </div>
          </BrutalCard>
        </div>

        {/* Right Column: Recent Activity Logs */}
        <div className="lg:col-span-1">
          <BrutalCard className="bg-white h-full flex flex-col">
            <h2 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-brutal-coral" />
              Log Aktivitas
            </h2>

            {recentActivity.length === 0 ? (
              <p className="text-sm font-bold text-gray-500 py-8 text-center flex-1">
                Belum ada catatan aktivitas.
              </p>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[400px] lg:max-h-none">
                {recentActivity.map((activity) => {
                  const dateStr = new Date(activity.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  // Simple translator for activities
                  let actionLabel = activity.action.replace(".", " ");
                  if (activity.action === "project.create") actionLabel = "BUAT PROYEK";
                  if (activity.action === "project.update") actionLabel = "UPDATE PROYEK";
                  if (activity.action === "task.create") actionLabel = "BUAT TUGAS";
                  if (activity.action === "task.update") actionLabel = "UPDATE TUGAS";
                  if (activity.action === "task.status") actionLabel = "STATUS TUGAS";
                  if (activity.action === "comment.create") actionLabel = "BUAT KOMENTAR";

                  let entityLabel = activity.entity_type;
                  if (activity.entity_type === "project") entityLabel = "proyek";
                  if (activity.entity_type === "task") entityLabel = "tugas";
                  if (activity.entity_type === "comment") entityLabel = "komentar";

                  return (
                    <div
                      key={activity.id}
                      className="p-3 border-2 border-brutal-black rounded-xl bg-brutal-soft-bg text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-1 mb-1">
                        <span className="font-black text-brutal-black uppercase text-[10px]">
                          {actionLabel}
                        </span>
                        <span className="text-gray-400 font-bold text-[9px] flex items-center gap-1">
                          <Calendar size={10} />
                          {dateStr}
                        </span>
                      </div>
                      <p className="font-bold text-gray-700">
                        <span className="font-black text-brutal-black">
                          {activity.actor?.full_name || "Sistem"}
                        </span>{" "}
                        melakukan pembaruan pada {entityLabel}.
                      </p>
                      {activity.metadata && (activity.metadata as any).title && (
                        <div className="text-[10px] text-gray-500 font-black truncate">
                          Nama: {String((activity.metadata as any).title || (activity.metadata as any).name || "")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </BrutalCard>
        </div>
      </div>
    </div>
  );
}
