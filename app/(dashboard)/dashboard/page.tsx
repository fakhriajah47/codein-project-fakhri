"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalBadge, BrutalBadgeVariant } from "@/components/ui/brutal-badge";
import { BrutalTextarea } from "@/components/ui/brutal-textarea";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkspaceDashboardData } from "@/lib/services/dashboard-service";
import { formatActivityActionLabel, formatActivityDescription, formatActivityMetadata } from "@/lib/utils/activity-formatter";
import {
  Folder,
  CheckSquare,
  AlertTriangle,
  Users,
  Activity,
  Calendar,
  Sparkles,
  SendHorizontal,
  Bot,
} from "lucide-react";

export default function WorkspaceDashboardPage() {
  const { activeWorkspace } = useWorkspace();
  const [data, setData] = useState<WorkspaceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI advisor state
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Conversational Workspace Query state
  const [aiCommand, setAiCommand] = useState("");
  const [aiCommandLoading, setAiCommandLoading] = useState(false);
  const [aiCommandError, setAiCommandError] = useState<string | null>(null);
  const [aiCommandResult, setAiCommandResult] = useState<any | null>(null);

  const fetchWorkspaceAdvice = async (force = false) => {
    if (!activeWorkspace) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai/workspace-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          forceRegenerate: force,
        }),
      });
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setAiError(resData.message || "Gagal melakukan audit kesehatan AI.");
      } else {
        setAiAdvice(resData.data);
      }
    } catch (err: any) {
      setAiError(err?.message || "Kesalahan koneksi audit AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const runProjectQuery = async () => {
    if (!activeWorkspace || !aiCommand.trim()) return;
    setAiCommandLoading(true);
    setAiCommandError(null);
    try {
      const response = await fetch("/api/ai/project-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          message: aiCommand.trim(),
        }),
      });
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setAiCommandError(resData.message || "AI gagal memproses instruksi workspace.");
      } else {
        setAiCommandResult(resData.data);
        if (resData.data?.created) {
          setAiCommand("");
          // Refresh dashboard data to show the newly created item
          const statsResponse = await fetch(`/api/workspaces/${activeWorkspace.id}/dashboard`);
          const statsData = await statsResponse.json();
          if (statsResponse.ok && statsData.success) {
            setData(statsData.data);
          }
        }
      }
    } catch (err: any) {
      setAiCommandError(err?.message || "Kesalahan koneksi AI workspace.");
    } finally {
      setAiCommandLoading(false);
    }
  };

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
        
        // Panggil audit kesehatan AI secara sekuensial setelah data statistik dimuat
        // untuk menghindari tabrakan token refresh Supabase SSR
        fetchWorkspaceAdvice(false);
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
        {/* Left Column: AI Advisor & Tim Load */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workspace Advisor AI (Gemini) */}
          <BrutalCard className="bg-brutal-soft-bg border-2 border-brutal-black shadow-brutal-md">
            <div className="flex items-center justify-between border-b-2 border-dashed border-brutal-black pb-3 mb-4">
              <h2 className="text-lg font-black uppercase text-brutal-black flex items-center gap-2">
                <Sparkles size={20} className="text-brutal-purple animate-pulse" />
                Workspace Advisor AI (Gemini)
              </h2>
              <BrutalButton
                size="sm"
                variant="primary"
                onClick={() => fetchWorkspaceAdvice(true)}
                isLoading={aiLoading}
                className="text-xs uppercase tracking-wider py-1 px-3 shrink-0 font-black"
              >
                Audit Ulang
              </BrutalButton>
            </div>

            {aiLoading ? (
              <div className="py-8 text-center space-y-2">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brutal-black" />
                <p className="text-sm font-bold text-gray-600">Gemini sedang mengaudit seluruh proyek dan beban kerja tim...</p>
              </div>
            ) : aiError ? (
              <div className="p-3.5 border-2 border-red-500 rounded-xl bg-red-50 text-red-700 text-xs font-bold">
                {aiError}. Pastikan GEMINI_API_KEY valid.
              </div>
            ) : aiAdvice ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 p-3 border-2 border-brutal-black rounded-xl bg-white">
                  <div>
                    <div className="text-xs uppercase font-black text-gray-500">Skor Kesehatan</div>
                    <div className="text-3xl font-black text-brutal-black">{aiAdvice.healthScore} / 100</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase font-black text-gray-500">Kondisi</div>
                    <BrutalBadge
                      variant={
                        aiAdvice.workspaceHealth === "Excellent" || aiAdvice.workspaceHealth === "Good"
                          ? "green"
                          : aiAdvice.workspaceHealth === "Needs Attention"
                          ? "yellow"
                          : "red"
                      }
                      className="text-sm py-0.5 px-2 font-black uppercase"
                    >
                      {aiAdvice.workspaceHealth === "Excellent" && "Sangat Baik"}
                      {aiAdvice.workspaceHealth === "Good" && "Baik"}
                      {aiAdvice.workspaceHealth === "Needs Attention" && "Perlu Perhatian"}
                      {aiAdvice.workspaceHealth === "Critical" && "Kritis"}
                    </BrutalBadge>
                  </div>
                </div>

                <div className="p-4 border-2 border-dashed border-gray-300 bg-white rounded-xl text-xs leading-relaxed font-bold text-gray-700 italic">
                  &ldquo;{aiAdvice.advisoryNote}&rdquo;
                </div>

                {aiAdvice.keyAlerts && aiAdvice.keyAlerts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-red-600 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Peringatan Utama
                    </h3>
                    <ul className="list-disc list-inside text-xs font-bold text-gray-600 space-y-1 pl-1">
                      {aiAdvice.keyAlerts.map((alert: string, idx: number) => (
                        <li key={idx} className="text-red-700 bg-red-50 p-2 rounded border border-red-100 flex items-start gap-2 text-left">
                          <span className="shrink-0 mt-0.5">⚠️</span>
                          <span>{alert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAdvice.recommendations && aiAdvice.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-brutal-black">Rekomendasi Tindakan</h3>
                    <div className="space-y-2">
                      {aiAdvice.recommendations.map((rec: any, idx: number) => {
                        let urgencyVariant: BrutalBadgeVariant = "gray";
                        if (rec.urgency === "medium") urgencyVariant = "yellow";
                        if (rec.urgency === "high") urgencyVariant = "orange";
                        if (rec.urgency === "urgent") urgencyVariant = "red";
                        return (
                          <div key={idx} className="p-3 border-2 border-brutal-black rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-left">
                            <div className="space-y-1">
                              <div className="font-extrabold text-brutal-black">{rec.action}</div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase">Target: {rec.target}</div>
                            </div>
                            <BrutalBadge variant={urgencyVariant} className="text-[9px] font-black uppercase py-0 px-2 self-start sm:self-center">
                              {rec.urgency === "urgent" ? "Mendesak" : rec.urgency === "high" ? "Tinggi" : rec.urgency === "medium" ? "Sedang" : "Rendah"}
                            </BrutalBadge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-500 text-center py-4">Belum ada audit kesehatan workspace.</p>
            )}
          </BrutalCard>

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

        {/* Right Column: Conversational AI & Logs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tanya & Kelola via AI */}
          <BrutalCard className="bg-white border-2 border-brutal-black shadow-brutal-md">
            <h2 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-4 flex items-center gap-2">
              <Bot size={20} className="text-brutal-blue" />
              Tanya & Kelola via AI
            </h2>
            <div className="space-y-4">
              <BrutalTextarea
                value={aiCommand}
                onChange={(e) => setAiCommand(e.target.value)}
                rows={4}
                placeholder='Tanya data project, atau buat perintah langsung: "buat task QA mobile urgent di project Website Company Profile assign ke saya"'
                disabled={aiCommandLoading}
                className="text-sm"
              />
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold text-gray-500">
                  Gemini membaca data workspace secara real-time dan dapat mengeksekusi aksi pembuatan project/task secara otomatis.
                </p>
                <BrutalButton
                  type="button"
                  variant="primary"
                  onClick={runProjectQuery}
                  isLoading={aiCommandLoading}
                  disabled={!aiCommand.trim() || aiCommandLoading}
                  className="text-xs uppercase tracking-wider py-2 px-4 shrink-0 font-black flex items-center justify-center gap-2 w-full"
                  leftIcon={<SendHorizontal size={14} />}
                >
                  Jalankan AI
                </BrutalButton>
              </div>

              {aiCommandError && (
                <div className="p-3 border-2 border-red-500 rounded-xl bg-red-50 text-red-700 text-xs font-bold">
                  {aiCommandError}
                </div>
              )}

              {aiCommandResult && (
                <div className="p-4 border-2 border-brutal-black rounded-xl bg-brutal-soft-bg space-y-2 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <BrutalBadge variant={aiCommandResult.created ? "green" : "blue"} className="text-[10px] font-black uppercase">
                      {aiCommandResult.created ? "Aksi Berhasil" : "Jawaban AI"}
                    </BrutalBadge>
                    <span className="text-[10px] font-black uppercase text-gray-500">
                      Tipe: {aiCommandResult.intent}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">
                    {aiCommandResult.answer}
                  </p>
                  {aiCommandResult.created && (
                    <div className="text-xs font-black text-brutal-black border-t border-dashed border-gray-300 pt-2 mt-2">
                      {aiCommandResult.created.type === "project"
                        ? `Proyek Baru: ${aiCommandResult.created.name}`
                        : `Tugas Baru: ${aiCommandResult.created.title} (${aiCommandResult.created.projectName})`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </BrutalCard>

          {/* Activity Logs */}
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
                  const actionLabel = formatActivityActionLabel(activity.action);
                  const metadataLabel = formatActivityMetadata(activity);

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
                        {formatActivityDescription(activity)}
                      </p>
                      {metadataLabel && (
                        <div className="text-[10px] text-gray-500 font-black truncate">
                          {metadataLabel}
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
