"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalBadge, BrutalBadgeVariant } from "@/components/ui/brutal-badge";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalTextarea } from "@/components/ui/brutal-textarea";
import { BrutalAlert } from "@/components/ui/brutal-alert";
import { formatActivityDescription } from "@/lib/utils/activity-formatter";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Project, Task, Milestone, TaskStatus, TaskPriority, ProjectPriority, ProjectStatus, ActivityLog, TaskComment } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  Folder,
  Calendar,
  Sparkles,
  ListTodo,
  TrendingUp,
  Settings,
  Plus,
  Play,
  ArrowRight,
  CheckCircle2,
  History,
  MessageSquare,
  Send,
  Clock,
  X,
  Trash2,
  Edit3,
} from "lucide-react";

type TabType = "overview" | "board" | "milestones" | "ai" | "reports" | "activity" | "settings";

interface WorkspaceCrewMember {
  userId: string;
  role: string;
  fullName: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const { activeWorkspace, workspaceRole } = useWorkspace();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceCrewMember[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Quick Action transition helper
  const [transitioningTaskId, setTransitioningTaskId] = useState<string | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New Task form state
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

  // New Milestone form state
  const [msTitle, setMsTitle] = useState("");
  const [msDeskripsi, setMsDeskripsi] = useState("");
  const [msDueDate, setMsDueDate] = useState("");
  const [msError, setMsError] = useState<string | null>(null);
  const [msLoading, setMsLoading] = useState(false);

  // Comment form state
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // AI Generator Panel states
  const [aiBrief, setAiBrief] = useState("");
  const [aiTeamRoles, setAiTeamRoles] = useState("Developer, Designer");
  const [aiComplexity, setAiComplexity] = useState<"low" | "medium" | "high">("medium");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedAiMilestones, setSelectedAiMilestones] = useState<Record<number, boolean>>({});

  // Radar Risiko Proyek states
  const [aiRiskResult, setAiRiskResult] = useState<any | null>(null);
  const [aiRiskLoading, setAiRiskLoading] = useState(false);
  const [aiRiskError, setAiRiskError] = useState<string | null>(null);
  const [teleKirimLoading, setTeleKirimLoading] = useState(false);

  // Ringkasan Eksekutif Pintar states
  const [aiSummaryResult, setAiSummaryResult] = useState<any | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [summaryRecipient, setSummaryRecipient] = useState("");
  const [gmailKirimLoading, setGmailKirimLoading] = useState(false);

  // AI Conversational Chat states
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; actions?: string[] }>>([
    {
      sender: "ai",
      text: "Halo! Saya adalah Asisten AI Proyek Anda. Anda bisa menanyakan data proyek ini (seperti progress, tugas yang sedang dikerjakan) atau langsung memerintahkan saya untuk membuat tugas baru, membuat milestone baru, atau memperbarui status tugas.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Task Editing & Current User state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Project Settings form state
  const [pName, setPName] = useState("");
  const [pDeskripsi, setPDeskripsi] = useState("");
  const [pClient, setPClient] = useState("");
  const [pType, setPType] = useState("");
  const [pPriority, setPPriority] = useState<ProjectPriority>("medium");
  const [pStatus, setPStatus] = useState<ProjectStatus>("planning");
  const [pStartDate, setPStartDate] = useState("");
  const [pDueDate, setPDueDate] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  const isEditable = workspaceRole && ["owner", "manager"].includes(workspaceRole);

  const fetchProjectData = async () => {
    if (!activeWorkspace || !projectId) return;
    try {
      // Fetch details
      const pRes = await fetch(`/api/projects/${projectId}`);
      const pData = await pRes.json();
      if (!pRes.ok || !pData.success) {
        setError(pData.message || "Gagal memuat detail proyek.");
        setLoading(false);
        return;
      }
      setProject(pData.data);
      setPName(pData.data.name);
      setPDeskripsi(pData.data.description || "");
      setPClient(pData.data.client_name || "");
      setPType(pData.data.project_type || "");
      setPPriority(pData.data.priority);
      setPStatus(pData.data.status);
      setPStartDate(pData.data.start_date || "");
      setPDueDate(pData.data.due_date || "");

      // Fetch tasks
      const tRes = await fetch(`/api/projects/${projectId}/tasks`);
      const tData = await tRes.json();
      if (tRes.ok && tData.success) setTasks(tData.data);

      // Fetch milestones
      const msRes = await fetch(`/api/projects/${projectId}/milestones`);
      const msData = await msRes.json();
      if (msRes.ok && msData.success) setMilestones(msData.data);

      const memRes = await fetch(`/api/workspaces/${activeWorkspace.id}/members`);
      const memData = await memRes.json();
      if (memRes.ok && memData.success) {
        setWorkspaceMembers(memData.data.map((m: { user_id: string; role: string; profiles?: { full_name?: string | null } }) => ({
          userId: m.user_id,
          role: m.role,
          fullName: m.profiles?.full_name || "Member",
        })));
      }

      const actRes = await fetch(`/api/projects/${projectId}/activity`);
      const actData = await actRes.json();
      if (actRes.ok && actData.success) {
        setActivities(actData.data);
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan jaringan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [projectId, activeWorkspace]);

  // Load selected task details (comments, etc.)
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
    setTransitioningTaskId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        alert(resData.message || "Gagal memperbarui status tugas.");
      } else {
        // Refresh project data
        await fetchProjectData();
        // If modal is open, update its local copy
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask((prev) => prev ? { ...prev, status: nextStatus } : prev);
        }
      }
    } catch {
      alert("Koneksi gagal.");
    } finally {
      setTransitioningTaskId(null);
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
        await fetchProjectData();
      }
    } catch {
      alert("Koneksi gagal.");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true);
    setTaskError(null);

    try {
      const criteriaList = taskCriteria
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const isEditing = !!editingTaskId;
      const url = isEditing ? `/api/tasks/${editingTaskId}` : `/api/projects/${projectId}/tasks`;
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace!.id,
          projectId,
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
        setTaskError(resData.message || `Gagal ${isEditing ? "memperbarui" : "membuat"} tugas.`);
      } else {
        setTaskTitle("");
        setTaskDescription("");
        setTaskPriority("medium");
        setTaskAssignee("");
        setTaskMilestone("");
        setTaskDueDate("");
        setTaskEstHours("");
        setTaskCriteria("");
        setIsTaskModalOpen(false);
        setEditingTaskId(null);
        await fetchProjectData();
      }
    } catch (err: any) {
      setTaskError(err?.message || "An unexpected error occurred.");
    } finally {
      setTaskLoading(false);
    }
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskAssignee("");
    setTaskMilestone("");
    setTaskDueDate("");
    setTaskEstHours("");
    setTaskCriteria("");
    setTaskError(null);
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsLoading(true);
    setMsError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: msTitle,
          description: msDeskripsi,
          dueDate: msDueDate || undefined,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setMsError(resData.message || "Gagal membuat milestone.");
      } else {
        setMsTitle("");
        setMsDeskripsi("");
        setMsDueDate("");
        setIsMilestoneModalOpen(false);
        await fetchProjectData();
      }
    } catch (err: any) {
      setMsError(err?.message || "An unexpected error occurred.");
    } finally {
      setMsLoading(false);
    }
  };

  // AI Task Generation API
  const handleAITaskGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const response = await fetch(`/api/ai/generate-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace!.id,
          projectId,
          projectName: project!.name,
          projectDescription: aiBrief,
          teamRoles: aiTeamRoles.split(",").map((s) => s.trim()),
          complexity: aiComplexity,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setAiError(resData.message || "Gagal membuat daftar tugas secara otomatis.");
      } else {
        setAiResult(resData.data.data); // aiTaskGenerationResponse object
        // Preselect all generated milestones
        const preselects: Record<number, boolean> = {};
        resData.data.data.milestones.forEach((_: any, idx: number) => {
          preselects[idx] = true;
        });
        setSelectedAiMilestones(preselects);
      }
    } catch (err: any) {
      setAiError(err?.message || "AI generator failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAITasks = async () => {
    if (!aiResult) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const filteredMilestones = aiResult.milestones.filter((_: any, idx: number) => selectedAiMilestones[idx]);

      const response = await fetch(`/api/ai/generated-tasks/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace!.id,
          projectId,
          selectedMilestones: filteredMilestones,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setAiError(resData.message || "Gagal menyimpan daftar tugas otomatis.");
      } else {
        alert(`Berhasil mengimpor ${resData.data?.createdMilestonesCount || 0} milestone dan ${resData.data?.createdTasksCount || 0} tugas ke papan proyek!`);
        setAiBrief("");
        setAiResult(null);
        setActiveTab("board");
        await fetchProjectData();
      }
    } catch (err: any) {
      setAiError(err?.message || "Gagal menyimpan rencana.");
    } finally {
      setAiLoading(false);
    }
  };

  // Radar Risiko Proyek API
  const handleAIRiskAnalyze = async () => {
    setAiRiskLoading(true);
    setAiRiskError(null);
    setAiRiskResult(null);
    setAiBrief("");
    setShowChat(false);

    try {
      const response = await fetch(`/api/ai/risk-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setAiRiskError(resData.message || "Gagal menjalankan analisis risiko.");
      } else {
        setAiRiskResult(resData.data);
        await fetchProjectData(); // Refresh health/risk scores
      }
    } catch (err: any) {
      setAiRiskError(err?.message || "Risk analysis failed.");
    } finally {
      setAiRiskLoading(false);
    }
  };

  const handleDispatchTelegramAlert = async () => {
    if (!aiRiskResult) return;
    setTeleKirimLoading(true);

    try {
      const response = await fetch(`/api/notifications/risk-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          providers: ["telegram"],
          severity: aiRiskResult.riskLevel === "critical" ? "critical" : "high",
          source: "ai.risk_generated",
          message: `Critical timeline alert
Project: *${project!.name}*
Risk Score: *${aiRiskResult.riskScore}/100* (${aiRiskResult.riskLevel.toUpperCase()})

Escalation reason:
${aiRiskResult.escalationMessage}`,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        alert(resData.message || "Gagal mengirim notifikasi. Pastikan token bot Telegram sudah terhubung di menu Integrasi.");
      } else {
        alert("Notifikasi berhasil dikirim ke chat bot Telegram!");
      }
    } catch {
      alert("Uji coba notifikasi gagal.");
    } finally {
      setTeleKirimLoading(false);
    }
  };

  // Ringkasan Eksekutif Pintar API
  const handleAIExecutiveSummary = async () => {
    setAiSummaryLoading(true);
    setAiSummaryError(null);
    setAiSummaryResult(null);
    setAiBrief("");
    setShowChat(false);

    try {
      const response = await fetch(`/api/ai/executive-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, saveAsReport: true }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setAiSummaryError(resData.message || "Gagal membuat ringkasan eksekutif.");
      } else {
        setAiSummaryResult(resData.data);
      }
    } catch (err: any) {
      setAiSummaryError(err?.message || "Pembuatan ringkasan eksekutif gagal.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleDispatchGmailReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSummaryResult) return;
    setGmailKirimLoading(true);

    try {
      const reportsResponse = await fetch(`/api/projects/${projectId}/reports`);
      const reportsData = await reportsResponse.json();
      const latestReport = reportsResponse.ok && reportsData.success ? reportsData.data?.[0] : null;

      if (!latestReport) {
        alert("Tidak ada draf laporan yang dapat dikirim.");
        setGmailKirimLoading(false);
        return;
      }

      const response = await fetch(`/api/reports/${latestReport.id}/send-gmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: summaryRecipient,
          subject: `[Executive Report] Status update for ${project!.name}`,
          introMessage: "Please find the AI executive overview for the PT Maju Digital project operations attached below.",
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        alert(resData.message || "Gagal mengirim email. Pastikan akun Gmail Anda sudah terhubung di menu Integrasi.");
      } else {
        alert("Laporan Eksekutif berhasil dikirim melalui Gmail!");
        setAiSummaryResult(null);
        setSummaryRecipient("");
      }
    } catch {
      alert("Gagal mengirim laporan.");
    } finally {
      setGmailKirimLoading(false);
    }
  };

  // Project Settings Update
  const handleUpdateProjectSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pName,
          description: pDeskripsi,
          clientName: pClient,
          projectType: pType,
          priority: pPriority,
          status: pStatus,
          startDate: pStartDate || undefined,
          dueDate: pDueDate || undefined,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setSettingsError(resData.message || "Gagal memperbarui pengaturan proyek.");
      } else {
        setSettingsSuccess("Detail proyek berhasil diperbarui!");
        await fetchProjectData();
      }
    } catch (err: any) {
      setSettingsError(err?.message || "Connection failed.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("PERINGATAN: Apakah Anda yakin ingin menghapus proyek ini secara permanen? Tindakan ini akan menghapus semua milestone, tugas, dan log aktivitas, serta tidak dapat dibatalkan.")) return;
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        alert(resData.message || "Gagal menghapus proyek.");
      } else {
        alert("Proyek berhasil dihapus.");
        router.push("/projects");
      }
    } catch {
      alert("Gagal memproses penghapusan proyek.");
    }
  };

  if (loading) {
    return <LoadingState message="Menghubungkan ke pusat data proyek..." />;
  }

  if (error || !project) {
    return <ErrorState title="Gagal Memuat Proyek" description={error || "Proyek yang Anda cari tidak ditemukan."} />;
  }

  // Map Project health badge variant
  let healthVariant: BrutalBadgeVariant = "green";
  if (project.health_status === "at_risk") healthVariant = "yellow";
  if (project.health_status === "critical") healthVariant = "red";
  if (project.health_status === "completed") healthVariant = "blue";

  // Map Prioritas Proyek badge variant
  let priorityVariant: BrutalBadgeVariant = "yellow";
  if (project.priority === "high") priorityVariant = "orange";
  if (project.priority === "urgent") priorityVariant = "red";
  if (project.priority === "low") priorityVariant = "gray";

  const canEditTask = !!selectedTask && (workspaceRole === "owner" || workspaceRole === "manager" || selectedTask.assignee_id === currentUserId);
  const canDeleteTask = !!selectedTask && (workspaceRole === "owner" || workspaceRole === "manager");

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <BrutalCard className="bg-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-gray-100 border border-brutal-black px-2 py-0.5 rounded">
                {project.project_type || "Proyek Umum"}
              </span>
              <BrutalBadge variant={healthVariant} className="text-[10px] font-black uppercase">
                Kesehatan: {project.health_status === "healthy" ? "Lancar" : project.health_status === "at_risk" ? "Berisiko" : project.health_status === "critical" ? "Kritis" : "Selesai"}
              </BrutalBadge>
              <BrutalBadge variant={priorityVariant} className="text-[10px] font-black uppercase">
                Prioritas: {project.priority === "low" ? "Rendah" : project.priority === "medium" ? "Sedang" : project.priority === "high" ? "Tinggi" : "Mendesak"}
              </BrutalBadge>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-brutal-black">
              {project.name}
            </h1>
            <p className="text-sm font-bold text-gray-500">
              Client Stakeholder: <span className="text-brutal-blue font-black underline">{project.client_name || "Internal"}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex justify-between w-full text-xs font-black text-brutal-black">
              <span>PROGRES PENYELESAIAN</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-48 bg-gray-100 border-2 border-brutal-black rounded-full h-4 overflow-hidden p-0.5 shadow-brutal-xs">
              <div
                className="bg-brutal-mint border-r border-brutal-black h-full rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">
              Skor risiko: <span className="bg-brutal-yellow px-1 py-0.5 border border-brutal-black font-black text-brutal-black shadow-brutal-xs">{project.risk_score}</span>
            </span>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="mt-8 border-t-2 border-dashed border-gray-200 pt-4 flex flex-row overflow-x-auto flex-nowrap pb-2 gap-2 max-w-full scrollbar-none">
          {(
            [
              { id: "overview", name: "Ikhtisar", icon: Folder },
              { id: "board", name: "Papan Kanban", icon: ListTodo },
              { id: "milestones", name: "Milestone", icon: TrendingUp },
              { id: "ai", name: "Asisten Pintar", icon: Sparkles },
              { id: "activity", name: "Log Aktivitas", icon: History },
              { id: "settings", name: "Pengaturan Proyek", icon: Settings },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 py-2 px-3 text-xs font-black uppercase border-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-brutal-blue text-white border-brutal-black shadow-brutal-xs translate-x-0.5 translate-y-0.5"
                    : "bg-white text-brutal-black border-transparent hover:border-brutal-black hover:bg-brutal-soft-bg"
                }`}
              >
                <Icon size={14} />
                {t.name}
              </button>
            );
          })}
        </div>
      </BrutalCard>

      {/* Main Tab content */}
      <div className="space-y-6">
        {/* --- OVERVIEW TAB --- */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <BrutalCard className="bg-white">
                <h3 className="text-base font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4">
                  Ringkasan Proyek
                </h3>
                <p className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {project.description || "Belum ada ringkasan proyek yang dimasukkan. Buka tab Asisten Pintar untuk membagi tugas secara otomatis atau buat tugas secara manual."}
                </p>
              </BrutalCard>

              {/* Milestones preview */}
              <BrutalCard className="bg-white">
                <h3 className="text-base font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4">
                  Fase Aktif / Milestone
                </h3>
                {milestones.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400 py-4 text-center">Belum ada milestone yang dibuat.</p>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((ms) => {
                      let msVariant: BrutalBadgeVariant = "gray";
                      if (ms.status === "in_progress") msVariant = "blue";
                      if (ms.status === "completed") msVariant = "green";
                      if (ms.status === "blocked") msVariant = "red";

                      return (
                        <div key={ms.id} className="p-4 border-2 border-brutal-black rounded-xl bg-brutal-soft-bg flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-black text-sm text-brutal-black">{ms.title}</h4>
                            {ms.description && <p className="text-xs text-gray-500 font-bold">{ms.description}</p>}
                          </div>

                          <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                            <div className="w-24 bg-white border border-brutal-black rounded-full h-3 overflow-hidden p-0.5">
                              <div
                                className="bg-brutal-blue h-full rounded-full transition-all"
                                style={{ width: `${ms.progress}%` }}
                              />
                            </div>
                            <BrutalBadge variant={msVariant} className="text-[9px] font-bold">
                              {ms.status.replace("_", " ")}
                            </BrutalBadge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </BrutalCard>
            </div>

            {/* Right sidebar details */}
            <div className="lg:col-span-1 space-y-6">
              {/* Target Dates card */}
              <BrutalCard className="bg-white">
                <h3 className="text-sm font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-3">
                  Parameter Proyek
                </h3>
                <div className="space-y-3 text-xs font-bold text-gray-600">
                  <div className="flex justify-between">
                    <span>TANGGAL MULAI:</span>
                    <span className="text-brutal-black font-black">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Belum ditentukan"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TENGGAT WAKTU:</span>
                    <span className="text-brutal-black font-black">
                      {project.due_date ? new Date(project.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Belum ditentukan"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-gray-100 pt-2">
                    <span>TOTAL TUGAS:</span>
                    <span className="text-brutal-black font-black">{tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TUGAS SELESAI:</span>
                    <span className="text-brutal-black font-black">{tasks.filter(t => t.status === "done").length}</span>
                  </div>
                </div>
              </BrutalCard>

              {/* Members card */}
              <BrutalCard className="bg-white">
                <h3 className="text-sm font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-3">
                  Anggota Tim
                </h3>
                {workspaceMembers.length === 0 ? (
                  <p className="text-[10px] text-gray-400 py-3 text-center">Tidak ada anggota tim.</p>
                ) : (
                  <div className="space-y-2">
                    {workspaceMembers.map((m) => (
                      <div key={m.userId} className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full border border-brutal-black bg-brutal-yellow flex items-center justify-center font-black text-[10px]">
                          {m.fullName[0].toUpperCase()}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-brutal-black">{m.fullName}</span>
                          <span className="text-[9px] text-gray-400 uppercase font-bold ml-1">({m.role})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BrutalCard>
            </div>
          </div>
        )}

        {/* --- KANBAN BOARD TAB --- */}
        {activeTab === "board" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight text-brutal-black">
                Papan Interaktif
              </h2>
              {isEditable && (
                <BrutalButton
                  onClick={() => setIsTaskModalOpen(true)}
                  variant="primary"
                  size="sm"
                  className="font-black uppercase tracking-wide flex items-center gap-1.5"
                  leftIcon={<Plus size={14} />}
                >
                  Tambah Tugas
                </BrutalButton>
              )}
            </div>

            {/* Kanban Columns */}
            <div className="flex md:grid flex-nowrap md:flex-wrap md:grid-cols-3 lg:grid-cols-6 gap-4 items-start overflow-x-auto pb-4 max-w-full">
              {(
                [
                  { id: "backlog", name: "Belum Dimulai", bg: "bg-gray-100" },
                  { id: "todo", name: "Rencana", bg: "bg-white" },
                  { id: "in_progress", name: "Dikerjakan", bg: "bg-brutal-soft-bg" },
                  { id: "in_review", name: "Ditinjau", bg: "bg-amber-50" },
                  { id: "done", name: "Selesai", bg: "bg-emerald-50" },
                  { id: "blocked", name: "Terhambat", bg: "bg-red-50" },
                ] as const
              ).map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.id);

                return (
                  <div
                    key={col.id}
                    className={`w-[280px] shrink-0 md:w-auto border-2 border-brutal-black rounded-xl p-3 shadow-brutal-xs min-h-[350px] flex flex-col gap-3 ${col.bg}`}
                  >
                    <div className="flex items-center justify-between border-b-2 border-dashed border-gray-300 pb-1">
                      <span className="font-black text-xs uppercase text-brutal-black">
                        {col.name}
                      </span>
                      <BrutalBadge variant="default" className="text-[10px] py-0 px-1.5 font-bold">
                        {colTasks.length}
                      </BrutalBadge>
                    </div>

                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[500px]">
                      {colTasks.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg py-8 text-[10px] text-gray-400 font-bold uppercase">
                          Kosong
                        </div>
                      ) : (
                        colTasks.map((t) => {
                          let priorityColor = "bg-gray-100";
                          if (t.priority === "high") priorityColor = "bg-brutal-orange";
                          if (t.priority === "urgent") priorityColor = "bg-brutal-coral text-white";

                          return (
                            <div
                              key={t.id}
                              onClick={() => handleOpenTaskDetails(t)}
                              className="p-3 border-2 border-brutal-black rounded-lg bg-white shadow-brutal-xs hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer space-y-2 text-xs"
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-[8px] font-black uppercase border border-brutal-black px-1.5 py-0.5 rounded ${priorityColor}`}>
                                  {t.priority}
                                </span>
                                {t.assignee_id && (
                                  <div
                                    className="w-5 h-5 rounded-full border border-brutal-black bg-brutal-yellow flex items-center justify-center font-black text-[8px]"
                                    title={`Assigned to crew ID`}
                                  >
                                    A
                                  </div>
                                )}
                              </div>

                              <h4 className="font-black text-brutal-black line-clamp-2 leading-tight">
                                {t.title}
                              </h4>

                              {t.due_date && (
                                <div className="text-[9px] text-gray-400 font-bold flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date(t.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- MILESTONES TAB --- */}
        {activeTab === "milestones" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight text-brutal-black">
                Milestone Proyek
              </h2>
              {isEditable && (
                <BrutalButton
                  onClick={() => setIsMilestoneModalOpen(true)}
                  variant="primary"
                  size="sm"
                  className="font-black uppercase tracking-wide flex items-center gap-1.5"
                  leftIcon={<Plus size={14} />}
                >
                  Tambah Milestone
                </BrutalButton>
              )}
            </div>

            {milestones.length === 0 ? (
              <EmptyState
                title="Belum Ada Milestone"
                description="Milestones represent major launch markers. Click 'Tambah Milestone' or use the AI Assistant tab to autogenerate timeline benchmarks."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {milestones.map((ms) => {
                  let msVariant: BrutalBadgeVariant = "gray";
                  if (ms.status === "in_progress") msVariant = "blue";
                  if (ms.status === "completed") msVariant = "green";
                  if (ms.status === "blocked") msVariant = "red";

                  const msTasks = tasks.filter(t => t.milestone_id === ms.id);
                  const msCompleted = msTasks.filter(t => t.status === "done").length;

                  return (
                    <BrutalCard key={ms.id} className="bg-white flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2 mb-1">
                          <BrutalBadge variant={msVariant} className="text-[9px] font-bold uppercase">
                            {ms.status.replace("_", " ")}
                          </BrutalBadge>
                          {ms.due_date && (
                            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                              <Calendar size={11} />
                              Due: {new Date(ms.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black text-brutal-black line-clamp-1">{ms.title}</h3>
                        <p className="text-xs font-bold text-gray-500 line-clamp-2">
                          {ms.description || "Tidak ada deskripsi singkat."}
                        </p>
                      </div>

                      <div className="mt-6 border-t-2 border-dashed border-gray-200 pt-4 flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                          <span>PROGRES TUGAS ({msCompleted} / {msTasks.length})</span>
                          <span>{ms.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 border border-brutal-black rounded-full h-3 overflow-hidden p-0.5">
                          <div
                            className="bg-brutal-blue h-full rounded-full transition-all"
                            style={{ width: `${ms.progress}%` }}
                          />
                        </div>
                      </div>
                    </BrutalCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- AI ASSISTANT TAB --- */}
        {activeTab === "ai" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Operations Menu */}
            <div className="lg:col-span-1 space-y-6">
              <BrutalCard className="bg-brutal-purple text-brutal-black shadow-brutal-md">
                <h3 className="text-lg font-black uppercase flex items-center gap-2 mb-3">
                  <Sparkles size={22} className="text-brutal-black fill-current animate-pulse" />
                  Analisis Proyek Pintar
                </h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed mb-6">
                  Gunakan model Gemini langsung dalam proyek Anda untuk membuat daftar tugas secara otomatis, memantau risiko tenggat waktu, atau menyusun laporan eksekutif.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setAiBrief("");
                      setAiResult(null);
                      setAiRiskResult(null);
                      setAiSummaryResult(null);
                      setAiError(null);
                      setShowChat(true);
                    }}
                    className={`w-full text-left py-2 px-3 border-2 border-brutal-black rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-brutal-xs flex items-center justify-between ${
                      showChat ? "bg-brutal-yellow text-brutal-black" : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    Asisten Percakapan AI
                    <ArrowRight size={14} />
                  </button>

                  <button
                    onClick={() => {
                      setAiResult(null);
                      setAiRiskResult(null);
                      setAiSummaryResult(null);
                      setAiBrief("Buat website company profile untuk agency digital dengan halaman home, service, portfolio, about, contact.");
                      setAiError(null);
                      setShowChat(false);
                    }}
                    className={`w-full text-left py-2 px-3 border-2 border-brutal-black rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-brutal-xs flex items-center justify-between ${
                      aiBrief && !aiRiskResult && !aiSummaryResult ? "bg-brutal-yellow text-brutal-black" : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    Pembuat Tugas Otomatis
                    <ArrowRight size={14} />
                  </button>

                  <button
                    onClick={handleAIRiskAnalyze}
                    className={`w-full text-left py-2 px-3 border-2 border-brutal-black rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-brutal-xs flex items-center justify-between ${
                      aiRiskResult ? "bg-brutal-yellow text-brutal-black" : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    Radar Risiko Proyek
                    {aiRiskLoading ? "Analyzing..." : <ArrowRight size={14} />}
                  </button>

                  <button
                    onClick={handleAIExecutiveSummary}
                    className={`w-full text-left py-2 px-3 border-2 border-brutal-black rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-brutal-xs flex items-center justify-between ${
                      aiSummaryResult ? "bg-brutal-yellow text-brutal-black" : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    Ringkasan Eksekutif Pintar
                    {aiSummaryLoading ? "Generating..." : <ArrowRight size={14} />}
                  </button>
                </div>
              </BrutalCard>
            </div>

            {/* Right Result Panel */}
            <div className="lg:col-span-2">
              <BrutalCard className="bg-white min-h-[400px]">
                {/* 0. Conversational Chat View */}
                {showChat && !aiBrief && !aiRiskResult && !aiSummaryResult && (
                  <div className="flex flex-col h-[500px]">
                    <h3 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4 shrink-0">
                      Asisten Percakapan AI
                    </h3>
                    
                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 flex flex-col min-h-0">
                      {chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`max-w-[85%] p-3.5 rounded-xl border-2 border-brutal-black shadow-brutal-xs flex flex-col gap-1.5 ${
                            msg.sender === "user"
                              ? "bg-brutal-blue text-white self-end animate-fade-in"
                              : "bg-brutal-soft-bg text-brutal-black self-start animate-fade-in"
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-wider opacity-60">
                            {msg.sender === "user" ? "Anda" : "Gemini AI"}
                          </div>
                          <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-dashed border-gray-300 space-y-1">
                              <div className="text-[9px] font-black uppercase text-brutal-mint">⚡ Tindakan Berhasil Dijalankan:</div>
                              {msg.actions.map((act, aIdx) => (
                                <div key={aIdx} className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                                  <span>✅</span>
                                  <span>{act}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="bg-brutal-soft-bg text-brutal-black self-start max-w-[85%] p-3.5 rounded-xl border-2 border-brutal-black shadow-brutal-xs flex items-center gap-2">
                          <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-brutal-black" />
                          <span className="text-xs font-bold">Gemini sedang memproses aksi Anda...</span>
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!chatInput.trim() || chatLoading) return;

                        const userMsg = chatInput.trim();
                        setChatInput("");
                        setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
                        setChatLoading(true);

                        try {
                          const response = await fetch("/api/ai/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              projectId,
                              message: userMsg,
                              history: chatMessages.slice(-10).map((m) => ({
                                role: m.sender === "user" ? "user" : "model",
                                parts: [{ text: m.text }],
                              })),
                            }),
                          });
                          
                          const result = await response.json();
                          if (response.ok && result.success) {
                            setChatMessages((prev) => [
                              ...prev,
                              { sender: "ai", text: result.data.reply, actions: result.data.actions },
                            ]);
                            await fetchProjectData(); // Refresh page data
                          } else {
                            setChatMessages((prev) => [
                              ...prev,
                              { sender: "ai", text: `Gagal memproses aksi AI: ${result.message || "Unknown error"}` },
                            ]);
                          }
                        } catch (err: any) {
                          setChatMessages((prev) => [
                            ...prev,
                            { sender: "ai", text: `Error Jaringan: ${err.message || String(err)}` },
                          ]);
                        } finally {
                          setChatLoading(false);
                        }
                      }}
                      className="flex gap-2 shrink-0 pt-2 border-t-2 border-dashed border-gray-200"
                    >
                      <BrutalInput
                        type="text"
                        placeholder="Ketik pertanyaan atau perintah (misal: 'buat tugas QA UI besok')"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={chatLoading}
                        required
                        className="flex-1"
                      />
                      <BrutalButton type="submit" variant="primary" disabled={chatLoading} leftIcon={<Send size={14} />}>
                        Kirim
                      </BrutalButton>
                    </form>
                  </div>
                )}

                {/* 1. Task Generator View */}
                {aiBrief && !aiRiskResult && !aiSummaryResult && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4">
                      Pembuat Tugas Otomatis
                    </h3>

                    {aiError && (
                      <BrutalAlert variant="danger" className="mb-4">
                        {aiError}
                      </BrutalAlert>
                    )}

                    {!aiResult ? (
                      <form onSubmit={handleAITaskGenerate} className="space-y-4">
                        <div>
                          <label className="block text-xs font-black uppercase mb-1">Ringkasan Proyek / Prompt Deskripsi *</label>
                          <BrutalTextarea
                            rows={4}
                            required
                            placeholder="Jelaskan apa yang ingin dibangun, kebutuhan fitur, halaman, atau kriteria lainnya..."
                            value={aiBrief}
                            onChange={(e) => setAiBrief(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black uppercase mb-1">Peran Anggota Tim (Pisahkan dengan Koma)</label>
                            <BrutalInput
                              type="text"
                              value={aiTeamRoles}
                              onChange={(e) => setAiTeamRoles(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase mb-1">Tingkat Kesulitan</label>
                            <select
                              value={aiComplexity}
                              onChange={(e) => setAiComplexity(e.target.value as any)}
                              className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>

                        <BrutalButton type="submit" variant="primary" className="w-full uppercase font-black" isLoading={aiLoading}>
                          Buat Rencana Tugas
                        </BrutalButton>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <BrutalAlert variant="ai" title="Rencana Tugas Berhasil Dibuat" description={aiResult.summary || "Tinjau struktur milestone dan tugas yang dihasilkan di bawah ini, lalu pilih yang ingin disimpan."} />
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                          {aiResult.milestones.map((ms: any, msIdx: number) => {
                            const isChecked = selectedAiMilestones[msIdx] || false;

                            return (
                              <div key={msIdx} className="p-4 border-2 border-brutal-black rounded-xl bg-gray-50 space-y-3">
                                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => setSelectedAiMilestones(prev => ({ ...prev, [msIdx]: e.target.checked }))}
                                    className="w-4 h-4 border-2 border-brutal-black accent-brutal-purple cursor-pointer"
                                  />
                                  <h4 className="font-black text-sm text-brutal-black">{ms.title}</h4>
                                </div>
                                <p className="text-xs text-gray-500 font-bold">{ms.description}</p>
                                
                                <div className="space-y-2 pl-4 border-l border-gray-300">
                                  {ms.tasks.map((task: any, tIdx: number) => (
                                    <div key={tIdx} className="text-xs text-gray-600 font-bold">
                                      • <span className="font-black text-brutal-black">{task.title}</span> - {task.description} <span className="text-[10px] bg-gray-200 px-1 py-0.2 border border-brutal-black rounded uppercase ml-1">{task.priority}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex gap-3 pt-2">
                          <BrutalButton
                            type="button"
                            variant="secondary"
                            onClick={() => setAiResult(null)}
                            className="flex-1 uppercase font-black"
                          >
                            Kembali
                          </BrutalButton>
                          <BrutalButton
                            type="button"
                            variant="success"
                            onClick={handleSaveAITasks}
                            className="flex-1 uppercase font-black"
                            isLoading={aiLoading}
                          >
                            Simpan Rencana Tugas
                          </BrutalButton>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Risk Radar View */}
                {aiRiskResult && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4">
                      Radar Risiko Proyek Analysis
                    </h3>

                    {aiRiskError && (
                      <BrutalAlert variant="danger" className="mb-4">
                        {aiRiskError}
                      </BrutalAlert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border-2 border-brutal-black rounded-xl bg-brutal-soft-bg text-center">
                        <div className="text-xs font-black uppercase text-gray-500 mb-1">Skor risiko</div>
                        <div className="text-4xl font-black text-brutal-black">{aiRiskResult.riskScore}/100</div>
                      </div>
                      <div className={`p-4 border-2 border-brutal-black rounded-xl text-center flex flex-col justify-center items-center font-black uppercase ${
                        aiRiskResult.riskLevel === "critical" || aiRiskResult.riskLevel === "high" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        <div className="text-[10px] text-gray-500 font-bold mb-1">Tingkat Risiko</div>
                        <div className="text-lg">{aiRiskResult.riskLevel}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-black uppercase text-brutal-black">Penilaian Aktivitas</h4>
                        <p className="text-xs font-bold text-gray-600 mt-1 leading-relaxed">{aiRiskResult.summary}</p>
                      </div>

                      {aiRiskResult.reasons && aiRiskResult.reasons.length > 0 && (
                        <div>
                          <h4 className="text-xs font-black uppercase text-brutal-coral">Faktor Pemicu</h4>
                          <ul className="list-disc pl-5 text-xs font-bold text-gray-600 space-y-1 mt-1">
                            {aiRiskResult.reasons.map((r: string, idx: number) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiRiskResult.recommendations && aiRiskResult.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-xs font-black uppercase text-brutal-blue">Rekomendasi Tindakan Korektif</h4>
                          <ul className="list-disc pl-5 text-xs font-bold text-gray-600 space-y-1 mt-1">
                            {aiRiskResult.recommendations.map((rec: any, idx: number) => (
                              <li key={idx}>
                                <span className="font-black text-brutal-black">[{rec.priority.toUpperCase()}]</span> {rec.title} - {rec.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                      <BrutalButton
                        onClick={() => setAiRiskResult(null)}
                        variant="secondary"
                        className="uppercase font-black text-xs"
                      >
                        Ulangi Analisis
                      </BrutalButton>
                      <BrutalButton
                        onClick={handleDispatchTelegramAlert}
                        variant="primary"
                        className="flex-1 uppercase font-black text-xs flex justify-center items-center gap-2"
                        isLoading={teleKirimLoading}
                        rightIcon={<Send size={12} />}
                      >
                        Kirim Notifikasi via Telegram
                      </BrutalButton>
                    </div>
                  </div>
                )}

                {/* 3. Executive Summary View */}
                {aiSummaryResult && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4">
                      Ringkasan Eksekutif Pintar
                    </h3>

                    {aiSummaryError && (
                      <BrutalAlert variant="danger" className="mb-4">
                        {aiSummaryError}
                      </BrutalAlert>
                    )}

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 text-xs">
                      <div>
                        <h4 className="text-xs font-black uppercase text-brutal-black">Draf Judul</h4>
                        <p className="p-2 border border-brutal-black bg-gray-50 rounded mt-1 font-bold text-gray-700">{aiSummaryResult.title}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-brutal-black font-space">Ikhtisar Laporan</h4>
                        <p className="p-3 border border-brutal-black bg-gray-50 rounded mt-1 font-medium text-gray-600 leading-relaxed">
                          {aiSummaryResult.summary}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleDispatchGmailReport} className="pt-4 border-t border-gray-200 space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Kirim Laporan ke Email Klien *</label>
                        <BrutalInput
                          type="email"
                          required
                          placeholder="ceo@majudigital.com"
                          value={summaryRecipient}
                          onChange={(e) => setSummaryRecipient(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-3">
                        <BrutalButton
                          type="button"
                          variant="secondary"
                          onClick={() => setAiSummaryResult(null)}
                          className="uppercase font-black text-xs"
                        >
                          Hapus
                        </BrutalButton>
                        <BrutalButton
                          type="submit"
                          variant="success"
                          className="flex-1 uppercase font-black text-xs flex justify-center items-center gap-2"
                          isLoading={gmailKirimLoading}
                          rightIcon={<Send size={12} />}
                        >
                          Kirim via Gmail
                        </BrutalButton>
                      </div>
                    </form>
                  </div>
                )}

                {/* Placeholder empty state */}
                {!aiBrief && !aiRiskResult && !aiSummaryResult && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Sparkles size={40} className="text-brutal-purple mb-4" />
                    <h4 className="font-black text-sm text-brutal-black uppercase mb-1">Menu Asisten Pintar</h4>
                    <p className="text-xs font-bold text-gray-400 max-w-xs leading-normal">
                      Pilih opsi menu di sebelah kiri untuk menggunakan fitur asisten proyek.
                    </p>
                  </div>
                )}
              </BrutalCard>
            </div>
          </div>
        )}

        {/* --- ACTIVITY TAB --- */}
        {activeTab === "activity" && (
          <BrutalCard className="bg-white">
            <h2 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4">
              Log Aktivitas Proyek
            </h2>

            {activities.length === 0 ? (
              <p className="text-xs font-bold text-gray-500 py-6 text-center">Belum ada log aktivitas untuk proyek ini.</p>
            ) : (
              <div className="relative border-l-2 border-brutal-black ml-4 space-y-6 py-2">
                {activities.map((a) => (
                  <div key={a.id} className="relative pl-6 text-xs font-bold text-gray-700">
                    <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border border-brutal-black bg-brutal-yellow" />
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <BrutalBadge variant="default" className="text-[8px] py-0 px-1 font-black uppercase">
                        {a.action}
                      </BrutalBadge>
                      <span className="text-[10px] text-gray-400">
                        {new Date(a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p>
                      <span className="font-black text-brutal-black">{a.actor?.full_name || "Sistem"}</span>{" "}
                      {formatActivityDescription(a)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </BrutalCard>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === "settings" && (
          <BrutalCard className="bg-white max-w-2xl">
            <h2 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-6 flex items-center gap-2">
              <Settings size={20} className="text-brutal-blue" />
              Project Parameter Proyek
            </h2>

            {settingsSuccess && (
              <BrutalAlert variant="success" className="mb-4">
                {settingsSuccess}
              </BrutalAlert>
            )}
            {settingsError && (
              <BrutalAlert variant="danger" className="mb-4">
                {settingsError}
              </BrutalAlert>
            )}

            <form onSubmit={handleUpdateProjectSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Proyek *</label>
                <BrutalInput
                  type="text"
                  required
                  disabled={!isEditable}
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi Singkat</label>
                <BrutalTextarea
                  rows={4}
                  disabled={!isEditable}
                  value={pDeskripsi}
                  onChange={(e) => setPDeskripsi(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Nama Klien</label>
                  <BrutalInput
                    type="text"
                    disabled={!isEditable}
                    value={pClient}
                    onChange={(e) => setPClient(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Tipe Proyek</label>
                  <BrutalInput
                    type="text"
                    disabled={!isEditable}
                    value={pType}
                    onChange={(e) => setPType(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Tanggal Mulai</label>
                  <BrutalInput
                    type="date"
                    disabled={!isEditable}
                    value={pStartDate}
                    onChange={(e) => setPStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Tenggat Waktu</label>
                  <BrutalInput
                    type="date"
                    disabled={!isEditable}
                    value={pDueDate}
                    onChange={(e) => setPDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Prioritas Proyek</label>
                  <select
                    value={pPriority}
                    disabled={!isEditable}
                    onChange={(e) => setPPriority(e.target.value as any)}
                    className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Status Proyek</label>
                  <select
                    value={pStatus}
                    disabled={!isEditable}
                    onChange={(e) => setPStatus(e.target.value as any)}
                    className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none text-xs"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {isEditable && (
                <div className="pt-4 flex gap-3">
                  {workspaceRole === "owner" && (
                    <BrutalButton
                      type="button"
                      variant="danger"
                      onClick={handleDeleteProject}
                      className="bg-brutal-coral text-white py-2"
                    >
                      Hapus Proyek
                    </BrutalButton>
                  )}
                  <BrutalButton
                    type="submit"
                    variant="primary"
                    className="flex-1 py-2 font-black uppercase"
                    isLoading={settingsLoading}
                  >
                    Simpan Pengaturan
                  </BrutalButton>
                </div>
              )}
            </form>
          </BrutalCard>
        )}
      </div>

      {/* --- CREATE TASK MODAL --- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <BrutalCard className="bg-white w-full max-w-lg shadow-brutal-xl">
            <div className="flex items-center justify-between border-b-4 border-brutal-black pb-2 mb-6">
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                <ListTodo className="text-brutal-blue" />
                {editingTaskId ? "Edit Rincian Tugas" : "Tambah Tugas Baru"}
              </h2>
              <button
                onClick={handleCloseTaskModal}
                className="border-2 border-brutal-black p-1 bg-white hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {taskError && (
              <BrutalAlert variant="danger" className="mb-4">
                {taskError}
              </BrutalAlert>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
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
                  {editingTaskId ? "Simpan Perubahan" : "Simpan Tugas"}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}

      {/* --- CREATE MILESTONE MODAL --- */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <BrutalCard className="bg-white w-full max-w-lg shadow-brutal-xl">
            <div className="flex items-center justify-between border-b-4 border-brutal-black pb-2 mb-6">
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                <TrendingUp className="text-brutal-purple" />
                Declare Tahapan Milestone
              </h2>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="border-2 border-brutal-black p-1 bg-white hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {msError && (
              <BrutalAlert variant="danger" className="mb-4">
                {msError}
              </BrutalAlert>
            )}

            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Judul Milestone *</label>
                <BrutalInput
                  type="text"
                  required
                  placeholder="Contoh: Tahap 1 Desain & Antarmuka"
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi</label>
                <BrutalTextarea
                  rows={3}
                  placeholder="Deskripsi singkat tahapan ini..."
                  value={msDeskripsi}
                  onChange={(e) => setMsDeskripsi(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Tenggat Waktu</label>
                <BrutalInput
                  type="date"
                  value={msDueDate}
                  onChange={(e) => setMsDueDate(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <BrutalButton type="button" variant="secondary" onClick={() => setIsMilestoneModalOpen(false)} className="flex-1 uppercase font-black">
                  Cancel
                </BrutalButton>
                <BrutalButton type="submit" variant="primary" className="flex-1 uppercase font-black" isLoading={msLoading}>
                  Simpan Milestone
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
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
                        isLoading={transitioningTaskId === selectedTask.id}
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
                        isLoading={transitioningTaskId === selectedTask.id}
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
                        isLoading={transitioningTaskId === selectedTask.id}
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
                        isLoading={transitioningTaskId === selectedTask.id}
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
                {canDeleteTask && (
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
                {canEditTask && (
                  <BrutalButton
                    onClick={() => {
                      setEditingTaskId(selectedTask.id);
                      setTaskTitle(selectedTask.title || "");
                      setTaskDescription(selectedTask.description || "");
                      setTaskPriority(selectedTask.priority || "medium");
                      setTaskAssignee(selectedTask.assignee_id || "");
                      setTaskMilestone(selectedTask.milestone_id || "");
                      setTaskDueDate(selectedTask.due_date ? selectedTask.due_date.split("T")[0] : "");
                      setTaskEstHours(selectedTask.estimated_hours ? selectedTask.estimated_hours.toString() : "");
                      setTaskCriteria(selectedTask.acceptance_criteria ? selectedTask.acceptance_criteria.join("\n") : "");
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
    </div>
  );
}
