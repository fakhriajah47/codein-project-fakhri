"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalBadge, BrutalBadgeVariant } from "@/components/ui/brutal-badge";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Task, TaskStatus } from "@/types";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  ArrowRight,
  TrendingUp,
  Folder,
} from "lucide-react";

interface MyWorkData {
  todayFocus: Task[];
  overdueTasks: Task[];
  highPriorityTasks: Task[];
  inProgressTasks: Task[];
  doneThisWeek: Task[];
}

export default function MyWorkFocusPage() {
  const { activeWorkspace } = useWorkspace();
  const [data, setData] = useState<MyWorkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const fetchMyWork = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/my-work`);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setError(resData.message || "Gagal memuat statistik Pekerjaan Saya.");
        setLoading(false);
        return;
      }

      setData(resData.data);
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWork();
  }, [activeWorkspace]);

  const handleStatusTransition = async (taskId: string, nextStatus: TaskStatus) => {
    setTransitioningId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        alert(resData.message || "Gagal memperbarui status tugas.");
      } else {
        // Refresh workload
        await fetchMyWork();
      }
    } catch (err: any) {
      console.error("Status transition failed:", err);
      alert("Gagal terhubung ke server.");
    } finally {
      setTransitioningId(null);
    }
  };

  if (!activeWorkspace) {
    return (
      <EmptyState
        title="Tidak Ada Ruang Kerja yang Terpilih"
        description="Silakan pilih atau ganti ke ruang kerja aktif pada bar navigasi atas untuk mengakses dasbor pekerjaan pribadi Anda."
      />
    );
  }

  if (loading && !data) {
    return <LoadingState message="Menghubungkan ke sistem..." />;
  }

  if (error) {
    return <ErrorState title="Kesalahan Memuat Halaman Pekerjaan" description={error} />;
  }

  const renderTaskCard = (task: Task) => {
    const isTransitioning = transitioningId === task.id;

    // Map priority
    let priorityVariant: BrutalBadgeVariant = "gray";
    let priorityLabel = "Rendah";
    if (task.priority === "medium") { priorityVariant = "yellow"; priorityLabel = "Sedang"; }
    if (task.priority === "high") { priorityVariant = "orange"; priorityLabel = "Tinggi"; }
    if (task.priority === "urgent") { priorityVariant = "red"; priorityLabel = "Mendesak"; }

    // Map status badge
    let statusVariant: BrutalBadgeVariant = "default";
    let statusLabel: string = task.status;
    if (task.status === "backlog") statusLabel = "Backlog";
    if (task.status === "todo") statusLabel = "Rencana";
    if (task.status === "in_progress") { statusVariant = "blue"; statusLabel = "Dikerjakan"; }
    if (task.status === "in_review") { statusVariant = "purple"; statusLabel = "Ditinjau"; }
    if (task.status === "done") { statusVariant = "green"; statusLabel = "Selesai"; }
    if (task.status === "blocked") { statusVariant = "red"; statusLabel = "Terhambat"; }

    // Status transition helper
    let actionButton = null;
    if (task.status === "todo" || task.status === "backlog") {
      actionButton = (
        <BrutalButton
          size="sm"
          variant="primary"
          onClick={() => handleStatusTransition(task.id, "in_progress")}
          isLoading={isTransitioning}
          leftIcon={<Play size={12} />}
          className="uppercase text-[10px] tracking-wider py-1 px-2.5 shrink-0 font-black"
        >
          Mulai
        </BrutalButton>
      );
    } else if (task.status === "in_progress") {
      actionButton = (
        <BrutalButton
          size="sm"
          variant="warning"
          onClick={() => handleStatusTransition(task.id, "in_review")}
          isLoading={isTransitioning}
          leftIcon={<ArrowRight size={12} />}
          className="uppercase text-[10px] tracking-wider py-1 px-2.5 shrink-0 font-black"
        >
          Tinjau
        </BrutalButton>
      );
    } else if (task.status === "in_review") {
      actionButton = (
        <BrutalButton
          size="sm"
          variant="success"
          onClick={() => handleStatusTransition(task.id, "done")}
          isLoading={isTransitioning}
          leftIcon={<CheckCircle2 size={12} />}
          className="uppercase text-[10px] tracking-wider py-1 px-2.5 shrink-0 font-black"
        >
          Selesai
        </BrutalButton>
      );
    }

    return (
      <div
        key={task.id}
        className="p-4 border-2 border-brutal-black rounded-xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all"
      >
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
              <Folder size={11} />
              {task.project?.name || "Umum"}
            </span>
            <BrutalBadge variant={statusVariant} className="text-[9px] py-0 px-1.5 font-bold uppercase">
              {statusLabel}
            </BrutalBadge>
            <BrutalBadge variant={priorityVariant} className="text-[9px] py-0 px-1.5 font-bold uppercase">
              {priorityLabel}
            </BrutalBadge>
          </div>
          <h4 className="font-black text-sm text-brutal-black line-clamp-1">{task.title}</h4>
          {task.description && (
            <p className="text-xs font-bold text-gray-500 line-clamp-1">{task.description}</p>
          )}
          {task.due_date && (
            <div className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
              <Clock size={11} />
              Tenggat: {new Date(task.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {actionButton}
        </div>
      </div>
    );
  };

  const totalAssigned =
    (data?.todayFocus.length || 0) +
    (data?.overdueTasks.length || 0) +
    (data?.highPriorityTasks.length || 0) +
    (data?.inProgressTasks.length || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-brutal-black">
          Pekerjaan Saya
        </h1>
        <p className="text-gray-600 font-bold">
          Halaman pribadi untuk mengelola dan memantau tugas-tugas Anda
        </p>
      </div>

      {totalAssigned === 0 && (data?.doneThisWeek.length || 0) === 0 ? (
        <EmptyState
          title="Semua Pekerjaan Selesai"
          description="Anda tidak memiliki tugas yang ditugaskan saat ini. Silakan bersantai atau hubungi manajer proyek Anda untuk tugas baru."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Worklist Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Overdue Alerts */}
            {data && data.overdueTasks.length > 0 && (
              <BrutalCard className="bg-white border-2 border-red-500 shadow-brutal-md">
                <h2 className="text-base font-black uppercase text-brutal-coral mb-4 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Tugas Terlambat ({data.overdueTasks.length})
                </h2>
                <div className="space-y-3">
                  {data.overdueTasks.map(renderTaskCard)}
                </div>
              </BrutalCard>
            )}

            {/* 2. Today's Focus */}
            <BrutalCard className="bg-white">
              <h2 className="text-base font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-brutal-blue" />
                Fokus Utama Hari Ini ({data?.todayFocus.length || 0})
              </h2>
              {data && data.todayFocus.length === 0 ? (
                <p className="text-xs font-bold text-gray-400 py-3 text-center">Tidak ada tugas yang dijadwalkan untuk hari ini.</p>
              ) : (
                <div className="space-y-3">
                  {data?.todayFocus.map(renderTaskCard)}
                </div>
              )}
            </BrutalCard>

            {/* 3. In Progress Deck */}
            <BrutalCard className="bg-white">
              <h2 className="text-base font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4 flex items-center gap-2">
                <Play size={20} className="text-brutal-purple" />
                Sedang Dikerjakan ({data?.inProgressTasks.length || 0})
              </h2>
              {data && data.inProgressTasks.length === 0 ? (
                <p className="text-xs font-bold text-gray-400 py-3 text-center">Tidak ada tugas yang sedang dikerjakan saat ini.</p>
              ) : (
                <div className="space-y-3">
                  {data?.inProgressTasks.map(renderTaskCard)}
                </div>
              )}
            </BrutalCard>

            {/* 4. High Priority Backlog */}
            <BrutalCard className="bg-white">
              <h2 className="text-base font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-brutal-orange" />
                Prioritas Tinggi & Mendesak ({data?.highPriorityTasks.length || 0})
              </h2>
              {data && data.highPriorityTasks.length === 0 ? (
                <p className="text-xs font-bold text-gray-400 py-3 text-center">Tidak ada tugas prioritas tinggi yang tersisa.</p>
              ) : (
                <div className="space-y-3">
                  {data?.highPriorityTasks.map(renderTaskCard)}
                </div>
              )}
            </BrutalCard>
          </div>

          {/* Sidebar Metrics Column */}
          <div className="lg:col-span-1 space-y-6">
            <BrutalCard variant="success" className="text-brutal-black">
              <h3 className="text-lg font-black uppercase flex items-center gap-2 mb-3">
                <TrendingUp size={20} />
                Performa Kerja
              </h3>
              <p className="text-xs font-bold text-gray-700 leading-relaxed">
                Anda telah menyelesaikan <span className="font-black text-brutal-black">{data?.doneThisWeek.length || 0} tugas</span> dalam 7 hari terakhir. Pekerjaan luar biasa! Teruskan kerja bagus Anda.
              </p>
            </BrutalCard>

            <BrutalCard className="bg-white h-fit">
              <h3 className="text-sm font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4">
                Selesai Minggu Ini
              </h3>
              {data && data.doneThisWeek.length === 0 ? (
                <p className="text-xs font-bold text-gray-400 py-4 text-center">Belum ada tugas yang diselesaikan dalam 7 hari terakhir.</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {data?.doneThisWeek.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 border border-brutal-black rounded-lg bg-gray-50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="text-[9px] font-black uppercase text-gray-400 truncate">
                          {task.project?.name || "Umum"}
                        </div>
                        <h4 className="font-bold text-gray-600 line-clamp-1 line-through">
                          {task.title}
                        </h4>
                      </div>
                      <CheckCircle2 size={16} className="text-brutal-mint shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </BrutalCard>
          </div>
        </div>
      )}
    </div>
  );
}
