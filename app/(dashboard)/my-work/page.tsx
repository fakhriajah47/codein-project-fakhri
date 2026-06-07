"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalBadge, BrutalBadgeVariant } from "@/components/ui/brutal-badge";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalTextarea } from "@/components/ui/brutal-textarea";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Task, TaskStatus, TaskComment, TaskPriority } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  ArrowRight,
  TrendingUp,
  Folder,
  Sparkles,
  X,
  MessageSquare,
  Settings,
  Trash2,
  Edit3,
  Plus,
} from "lucide-react";

interface MyWorkData {
  todayFocus: Task[];
  overdueTasks: Task[];
  highPriorityTasks: Task[];
  inProgressTasks: Task[];
  doneThisWeek: Task[];
}

export default function MyWorkFocusPage() {
  const { activeWorkspace, workspaceRole } = useWorkspace();
  const [data, setData] = useState<MyWorkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  // Task Detail Modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Edit Task states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskMilestone, setTaskMilestone] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskEstHours, setTaskEstHours] = useState("");
  const [taskCriteria, setTaskCriteria] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);

  // Edit dependencies
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);

  // AI daily focus recommendations state
  const [aiFocus, setAiFocus] = useState<{
    focusDate: string;
    aiNote: string;
    priorities: string[];
    focusTasks: Array<{
      taskId: string;
      title: string;
      reason: string;
      suggestedAction: string;
      priority: "low" | "medium" | "high" | "urgent";
    }>;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchAiFocus = async (force = false) => {
    if (!activeWorkspace) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai/daily-focus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          limit: 3,
          forceRegenerate: force,
        }),
      });
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setAiError(resData.message || "Gagal memuat rekomendasi AI.");
      } else {
        setAiFocus(resData.data);
      }
    } catch (err: any) {
      setAiError(err?.message || "Terjadi kesalahan koneksi AI.");
    } finally {
      setAiLoading(false);
    }
  };

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
      // Panggil rekomendasi AI secara sekuensial setelah data statistik berhasil dimuat
      // untuk mencegah tabrakan/race condition refresh token Supabase SSR di sisi server
      fetchAiFocus(false);
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWork();

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [activeWorkspace]);

  const fetchEditDependencies = async (workspaceId: string, projectId: string) => {
    try {
      const membersRes = await fetch(`/api/workspaces/${workspaceId}/members`);
      const membersData = await membersRes.json();
      if (membersRes.ok && membersData.success) {
        setWorkspaceMembers(membersData.data || []);
      }
      
      const milestonesRes = await fetch(`/api/projects/${projectId}/milestones`);
      const milestonesData = await milestonesRes.json();
      if (milestonesRes.ok && milestonesData.success) {
        setMilestones(milestonesData.data || []);
      }
    } catch (err) {
      console.error("Failed to load edit dependencies:", err);
    }
  };

  const handleOpenTaskDetails = async (task: Task) => {
    setSelectedTask(task);
    setComments([]);
    try {
      const response = await fetch(`/api/tasks/${task.id}`);
      const resData = await response.json();
      if (response.ok && resData.success) {
        setSelectedTask(resData.data);
        setComments(resData.data.comments || []);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    setCommentLoading(true);

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || "Gagal mengirim komentar.");
      }

      setComments((prev) => [...prev, resData.data]);
      setNewComment("");
    } catch {
      alert("Gagal mengirim komentar.");
    } finally {
      setCommentLoading(false);
    }
  };

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
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask((prev) => prev ? { ...prev, status: nextStatus } : prev);
        }
      }
    } catch (err: any) {
      console.error("Status transition failed:", err);
      alert("Gagal terhubung ke server.");
    } finally {
      setTransitioningId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      const resData = await response.json();
      if (!response.ok || !resData.success) {
        alert(resData.message || "Gagal menghapus tugas.");
      } else {
        setSelectedTask(null);
        await fetchMyWork();
      }
    } catch {
      alert("Koneksi gagal.");
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId || !selectedTask) return;
    setTaskLoading(true);
    setTaskError(null);

    try {
      const criteriaList = taskCriteria
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await fetch(`/api/tasks/${editingTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace!.id,
          projectId: selectedTask.project_id,
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          assigneeId: taskAssignee || null,
          milestoneId: taskMilestone || null,
          dueDate: taskDueDate || null,
          estimatedHours: taskEstHours ? parseFloat(taskEstHours) : null,
          acceptanceCriteria: criteriaList,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setTaskError(resData.message || "Gagal memperbarui tugas.");
      } else {
        setIsTaskModalOpen(false);
        setEditingTaskId(null);
        await fetchMyWork();
        handleOpenTaskDetails(resData.data);
      }
    } catch (err: any) {
      setTaskError(err?.message || "Terjadi kesalahan.");
    } finally {
      setTaskLoading(false);
    }
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTaskId(null);
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
        onClick={() => handleOpenTaskDetails(task)}
        className="p-4 border-2 border-brutal-black rounded-xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-brutal-xs hover:shadow-brutal-sm hover:border-brutal-blue transition-all cursor-pointer"
      >
        <div className="space-y-1.5 min-w-0 flex-1">
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

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
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
            {/* AI Recommended Focus */}
            <BrutalCard className="bg-brutal-soft-bg border-2 border-brutal-black shadow-brutal-md">
              <div className="flex items-center justify-between border-b-2 border-dashed border-brutal-black pb-3 mb-4">
                <h2 className="text-base font-black uppercase text-brutal-black flex items-center gap-2">
                  <Sparkles size={20} className="text-brutal-blue animate-pulse" />
                  Rekomendasi Fokus AI (Gemini)
                </h2>
                <BrutalButton
                  size="sm"
                  variant="primary"
                  onClick={() => fetchAiFocus(true)}
                  isLoading={aiLoading}
                  className="text-[10px] tracking-wider uppercase py-1 px-2 shrink-0 font-black"
                >
                  Analisis Ulang
                </BrutalButton>
              </div>

              {aiLoading ? (
                <div className="py-6 text-center space-y-2">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brutal-black" />
                  <p className="text-xs font-bold text-gray-600">Gemini sedang menganalisis beban kerja dan risiko deadline Anda...</p>
                </div>
              ) : aiError ? (
                <div className="p-3 border-2 border-red-500 rounded-lg bg-red-50 text-red-700 text-xs font-bold">
                  {aiError}. Pastikan GEMINI_API_KEY valid.
                </div>
              ) : aiFocus ? (
                <div className="space-y-4">
                  <div className="p-3 border-2 border-dashed border-gray-300 bg-white rounded-xl text-xs space-y-1.5">
                    <p className="font-bold text-gray-700 leading-relaxed italic">
                      &ldquo;{aiFocus.aiNote}&rdquo;
                    </p>
                    {aiFocus.priorities && aiFocus.priorities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-dashed border-gray-200">
                        {aiFocus.priorities.map((p: string, idx: number) => (
                          <BrutalBadge key={idx} variant="default" className="text-[9px] font-black uppercase py-0 px-1.5">
                            {p}
                          </BrutalBadge>
                        ))}
                      </div>
                    )}
                  </div>

                  {aiFocus.focusTasks.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 py-2 text-center">AI melihat tidak ada tugas mendesak hari ini. Kerja bagus!</p>
                  ) : (
                    <div className="space-y-3">
                      {aiFocus.focusTasks.map((ft, idx) => {
                        let priorityVariant: BrutalBadgeVariant = "gray";
                        let priorityLabel = "Rendah";
                        if (ft.priority === "medium") { priorityVariant = "yellow"; priorityLabel = "Sedang"; }
                        if (ft.priority === "high") { priorityVariant = "orange"; priorityLabel = "Tinggi"; }
                        if (ft.priority === "urgent") { priorityVariant = "red"; priorityLabel = "Mendesak"; }

                        return (
                          <div
                            key={ft.taskId || idx}
                            className="p-3.5 border-2 border-brutal-black rounded-xl bg-white shadow-brutal-xs flex flex-col gap-2 relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-2 h-full bg-brutal-blue" />
                            <div className="pl-2.5">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-black uppercase bg-brutal-blue text-white py-0.5 px-2 rounded border border-brutal-black">
                                  Prioritas Ke-{idx + 1}
                                </span>
                                <BrutalBadge variant={priorityVariant} className="text-[9px] py-0 px-1.5 font-bold uppercase">
                                  {priorityLabel}
                                </BrutalBadge>
                              </div>
                              <h4 className="font-black text-sm text-brutal-black mb-1">{ft.title}</h4>
                              <p className="text-xs font-bold text-gray-500 leading-relaxed bg-gray-50 p-2 rounded border border-gray-200">
                                <span className="font-extrabold text-brutal-black">Alasan AI:</span> {ft.reason}
                              </p>
                              {ft.suggestedAction && (
                                <div className="text-[11px] font-black uppercase text-brutal-mint flex items-center gap-1 mt-1.5">
                                  ⚡ Tindakan: {ft.suggestedAction}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs font-bold text-gray-400 py-3 text-center">Belum ada analisis fokus harian AI.</p>
              )}
            </BrutalCard>

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
                      onClick={() => handleOpenTaskDetails(task)}
                      className="p-3 border border-brutal-black rounded-lg bg-gray-50 flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-gray-100 transition-colors"
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

      {/* --- TASK DETAIL MODAL --- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="flex flex-col w-[85vw] max-w-[85vw] h-[85vh] max-h-[85vh] bg-brutal-soft-bg border-4 border-brutal-black rounded-2xl shadow-brutal-xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-4 border-brutal-black p-5 md:p-6 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-xl md:text-2xl font-black text-brutal-black line-clamp-1">{selectedTask.title}</h3>
                <span className="text-[10px] font-black uppercase bg-brutal-yellow border border-brutal-black px-2 py-0.5 rounded shadow-brutal-xs">
                  {selectedTask.priority}
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="border-2 border-brutal-black p-1.5 bg-white hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8 overflow-y-auto">
              
              {/* Left Column: Details, Acceptance Criteria, comments */}
              <div className="md:col-span-2 space-y-5">
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Deskripsi Tugas</h4>
                  <p className="text-xs font-bold text-gray-600 leading-relaxed p-4 bg-white border-2 border-brutal-black rounded-xl shadow-brutal-xs">
                    {selectedTask.description || "Tidak ada deskripsi yang disediakan."}
                  </p>
                </div>

                {/* Acceptance Criteria */}
                {selectedTask.acceptance_criteria && selectedTask.acceptance_criteria.length > 0 && (
                  <BrutalCard className="bg-white p-4">
                    <h4 className="text-xs font-black uppercase text-brutal-black mb-3 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-brutal-mint" />
                      Checklist Kriteria Penyelesaian
                    </h4>
                    <ul className="space-y-2 text-xs text-gray-600 font-bold">
                      {selectedTask.acceptance_criteria.map((c, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brutal-black shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </BrutalCard>
                )}

                {/* Komentar Tugas timeline */}
                <BrutalCard className="bg-white p-4 space-y-4">
                  <h4 className="text-xs font-black uppercase text-brutal-black flex items-center gap-1.5">
                    <MessageSquare size={16} className="text-brutal-blue" />
                    Komentar Tugas ({comments.length})
                  </h4>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-[10px] text-gray-400 py-2 text-center">Belum ada komentar.</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="p-2.5 border border-brutal-black rounded bg-gray-50 text-xs">
                          <div className="flex justify-between items-center gap-2 mb-1 text-[9px] text-gray-400 font-bold uppercase">
                            <span className="text-brutal-black font-black">{c.profiles?.full_name || "Anggota Tim"}</span>
                            <span>{new Date(c.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="font-bold text-gray-600">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                    <BrutalInput
                      type="text"
                      required
                      placeholder="Tulis pertanyaan atau pembaruan tugas..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 p-2 text-xs"
                    />
                    <BrutalButton type="submit" variant="primary" size="sm" className="uppercase font-black text-xs shrink-0 py-1" isLoading={commentLoading}>
                      Kirim
                    </BrutalButton>
                  </form>
                </BrutalCard>
              </div>

              {/* Right Column: Status info & Transitions */}
              <div className="md:col-span-1 space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Detail Status</h4>
                  <BrutalCard className="bg-white p-4 space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-500">STATUS:</span>
                      <span className="font-black text-brutal-black uppercase bg-gray-100 border border-brutal-black px-2 py-0.5 rounded shadow-brutal-xs">{selectedTask.status.replace("_", " ")}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-500">PRIORITAS:</span>
                      <span className="font-black text-brutal-black uppercase bg-brutal-yellow/20 border border-brutal-black px-2 py-0.5 rounded shadow-brutal-xs">{selectedTask.priority}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-500">ESTIMASI WAKTU:</span>
                      <span className="font-black text-brutal-black bg-brutal-blue/10 border border-brutal-black px-2 py-0.5 rounded shadow-brutal-xs">{selectedTask.estimated_hours || 0} Jam</span>
                    </div>
                    {selectedTask.due_date && (
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500">TENGGAT WAKTU:</span>
                        <span className="font-black text-brutal-black bg-brutal-coral/10 border border-brutal-black px-2 py-0.5 rounded shadow-brutal-xs">{new Date(selectedTask.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                      </div>
                    )}
                  </BrutalCard>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase text-gray-400 mb-2">Tindakan Cepat</h4>
                  <BrutalCard className="bg-white p-4 space-y-2.5">
                    {selectedTask.status !== "in_progress" && selectedTask.status !== "done" && (
                      <BrutalButton
                        onClick={() => handleStatusTransition(selectedTask.id, "in_progress")}
                        variant="primary"
                        className="w-full text-xs font-black uppercase py-1.5 flex justify-center items-center gap-1"
                        isLoading={transitioningId === selectedTask.id}
                        leftIcon={<Play size={12} />}
                      >
                        Mulai Kerja
                      </BrutalButton>
                    )}
                    {selectedTask.status === "in_progress" && (
                      <BrutalButton
                        onClick={() => handleStatusTransition(selectedTask.id, "in_review")}
                        variant="warning"
                        className="w-full text-xs font-black uppercase py-1.5 flex justify-center items-center gap-1"
                        isLoading={transitioningId === selectedTask.id}
                        leftIcon={<ArrowRight size={12} />}
                      >
                        Kirim untuk Ditinjau
                      </BrutalButton>
                    )}
                    {selectedTask.status === "in_review" && (
                      <BrutalButton
                        onClick={() => handleStatusTransition(selectedTask.id, "done")}
                        variant="success"
                        className="w-full text-xs font-black uppercase py-1.5 flex justify-center items-center gap-1 text-brutal-black"
                        isLoading={transitioningId === selectedTask.id}
                        leftIcon={<CheckCircle2 size={12} />}
                      >
                        Setujui & Selesaikan
                      </BrutalButton>
                    )}
                    {selectedTask.status !== "blocked" && selectedTask.status !== "done" && (
                      <BrutalButton
                        onClick={() => handleStatusTransition(selectedTask.id, "blocked")}
                        variant="danger"
                        className="w-full text-xs font-black uppercase py-1.5 bg-brutal-coral text-white"
                        isLoading={transitioningId === selectedTask.id}
                      >
                        Tandai Terhambat
                      </BrutalButton>
                    )}
                  </BrutalCard>
                </div>
              </div>

            </div>

            {/* Footer Action Controls */}
            <div className="border-t-4 border-brutal-black p-5 md:p-6 bg-white flex flex-wrap justify-between items-center gap-2 shrink-0">
              <div>
                {(workspaceRole === "owner" || workspaceRole === "manager") && (
                  <BrutalButton
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    variant="danger"
                    className="uppercase font-black text-xs flex items-center gap-1.5"
                    leftIcon={<Trash2 size={14} />}
                  >
                    Hapus Tugas
                  </BrutalButton>
                )}
              </div>
              <div className="flex gap-2.5">
                {(workspaceRole === "owner" || workspaceRole === "manager" || selectedTask.assignee_id === currentUserId) && (
                  <BrutalButton
                    onClick={async () => {
                      setEditingTaskId(selectedTask.id);
                      setTaskTitle(selectedTask.title || "");
                      setTaskDescription(selectedTask.description || "");
                      setTaskPriority(selectedTask.priority || "medium");
                      setTaskAssignee(selectedTask.assignee_id || "");
                      setTaskMilestone(selectedTask.milestone_id || "");
                      setTaskDueDate(selectedTask.due_date ? selectedTask.due_date.split("T")[0] : "");
                      setTaskEstHours(selectedTask.estimated_hours ? selectedTask.estimated_hours.toString() : "");
                      setTaskCriteria(selectedTask.acceptance_criteria ? selectedTask.acceptance_criteria.join("\n") : "");
                      
                      await fetchEditDependencies(selectedTask.workspace_id, selectedTask.project_id);
                      
                      setSelectedTask(null);
                      setIsTaskModalOpen(true);
                    }}
                    variant="primary"
                    className="uppercase font-black text-xs flex items-center gap-1.5"
                    leftIcon={<Edit3 size={14} />}
                  >
                    Edit Tugas
                  </BrutalButton>
                )}
                <BrutalButton onClick={() => setSelectedTask(null)} variant="secondary" className="uppercase font-black text-xs">
                  Tutup Detail
                </BrutalButton>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- EDIT TASK MODAL --- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <BrutalCard className="bg-white w-full max-w-lg shadow-brutal-xl">
            <div className="flex items-center justify-between border-b-4 border-brutal-black pb-2 mb-6">
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                <Edit3 className="text-brutal-blue" />
                Edit Rincian Tugas
              </h2>
              <button
                onClick={handleCloseTaskModal}
                className="border-2 border-brutal-black p-1 bg-white hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {taskError && (
              <div className="p-3 border-2 border-red-500 rounded-lg bg-red-50 text-red-700 text-xs font-bold mb-4">
                {taskError}
              </div>
            )}

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Judul Tugas *</label>
                <BrutalInput
                  type="text"
                  required
                  placeholder="Contoh: Mendesain antarmuka halaman utama"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi</label>
                <BrutalTextarea
                  rows={3}
                  placeholder="Detail tugas dan cakupannya..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Ditugaskan Ke</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none text-xs"
                  >
                    <option value="">Belum Ditugaskan</option>
                    {workspaceMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Tahapan Milestone</label>
                  <select
                    value={taskMilestone}
                    onChange={(e) => setTaskMilestone(e.target.value)}
                    className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none text-xs"
                  >
                    <option value="">Tidak Ada</option>
                    {milestones.map((ms) => (
                      <option key={ms.id} value={ms.id}>
                        {ms.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Estimasi Waktu (Jam)</label>
                  <BrutalInput
                    type="number"
                    min="0"
                    placeholder="8"
                    value={taskEstHours}
                    onChange={(e) => setTaskEstHours(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Tenggat Waktu</label>
                  <BrutalInput
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Prioritas Tugas</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Kriteria Penyelesaian (Satu per baris)</label>
                <textarea
                  rows={3}
                  placeholder="- Headline must match Figma design&#10;- Subheading must be responsive"
                  value={taskCriteria}
                  onChange={(e) => setTaskCriteria(e.target.value)}
                  className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <BrutalButton type="button" variant="secondary" onClick={handleCloseTaskModal} className="flex-1 uppercase font-black">
                  Cancel
                </BrutalButton>
                <BrutalButton type="submit" variant="primary" className="flex-1 uppercase font-black" isLoading={taskLoading}>
                  Simpan Perubahan
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
}
