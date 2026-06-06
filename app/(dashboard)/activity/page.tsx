"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalBadge, BrutalBadgeVariant } from "@/components/ui/brutal-badge";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ActivityLog } from "@/types";
import { History, Calendar, User, Zap, Terminal } from "lucide-react";

export default function ActivityLogsPage() {
  const { activeWorkspace } = useWorkspace();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/activity?limit=50`);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setError(resData.message || "Gagal memuat log aktivitas.");
        setLoading(false);
        return;
      }

      setActivities(resData.data);
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activeWorkspace]);

  if (!activeWorkspace) {
    return (
      <EmptyState
        title="Tidak Ada Ruang Kerja yang Terpilih"
        description="Silakan pilih atau ganti ke ruang kerja aktif pada bar navigasi atas untuk melihat log aktivitas."
      />
    );
  }

  if (loading) {
    return <LoadingState message="Memindai log audit ruang kerja..." />;
  }

  if (error) {
    return <ErrorState title="Kesalahan Log Aktivitas" description={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-brutal-black flex items-center gap-2">
          <History size={28} className="text-brutal-coral" />
          Log Aktivitas
        </h1>
        <p className="text-gray-600 font-bold">
          Riwayat Audit Ruang Kerja: Pantau perubahan dan operasi sistem
        </p>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          title="Log Aktivitas Kosong"
          description="Belum ada aktivitas terbaru yang tercatat di ruang kerja ini. Log aktivitas akan muncul ketika anggota tim membuat proyek, milestone, atau memperbarui status tugas."
        />
      ) : (
        <BrutalCard className="bg-white p-6 md:p-8">
          <div className="relative border-l-4 border-brutal-black ml-4 md:ml-6 space-y-8 py-2">
            {activities.map((activity) => {
              const dateObj = new Date(activity.created_at);
              const dateStr = dateObj.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              const timeStr = dateObj.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              // Action Badge styling
              let actionBadgeVariant: BrutalBadgeVariant = "gray";
              let actionLabel = activity.action.replace(".", " ");
              if (activity.action.includes("create")) {
                actionBadgeVariant = "blue";
                actionLabel = "BUAT";
              }
              if (activity.action.includes("update") || activity.action.includes("status")) {
                actionBadgeVariant = "yellow";
                actionLabel = "PADA STATUS / UPDATE";
              }
              if (activity.action.includes("delete")) {
                actionBadgeVariant = "red";
                actionLabel = "HAPUS";
              }
              if (activity.action.includes("ai")) {
                actionBadgeVariant = "purple";
                actionLabel = "AI";
              }

              let entityLabel = activity.entity_type;
              if (activity.entity_type === "project") entityLabel = "proyek";
              if (activity.entity_type === "task") entityLabel = "tugas";
              if (activity.entity_type === "comment") entityLabel = "komentar";

              return (
                <div key={activity.id} className="relative pl-8 md:pl-10">
                  {/* Timeline dot */}
                  <div className="absolute -left-[14px] top-1.5 w-6 h-6 rounded-full border-2 border-brutal-black bg-brutal-yellow flex items-center justify-center shadow-brutal-xs z-10">
                    <Zap size={10} className="text-brutal-black fill-current" />
                  </div>

                  <div className="space-y-2">
                    {/* Log details */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <BrutalBadge variant={actionBadgeVariant} className="text-[9px] py-0 px-2 font-bold tracking-wide">
                        {actionLabel}
                      </BrutalBadge>
                      <span className="text-gray-400 font-bold flex items-center gap-1">
                        <Calendar size={12} />
                        {dateStr} pukul {timeStr}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-gray-700 leading-normal">
                      {/* Actor */}
                      <span className="font-black text-brutal-black inline-flex items-center gap-1 mr-1 bg-brutal-soft-bg px-2 py-0.5 border border-brutal-black rounded text-xs">
                        <User size={10} />
                        {activity.actor?.full_name || "Sistem"}
                      </span>
                      {" "}
                      melakukan pembaruan pada {entityLabel}.
                    </div>

                    {/* Metadata JSON block */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="p-3 bg-gray-50 border border-brutal-black rounded-lg text-[11px] font-mono text-gray-500 overflow-x-auto max-w-full flex items-center gap-2 shadow-brutal-xs">
                        <Terminal size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">{JSON.stringify(activity.metadata)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </BrutalCard>
      )}
    </div>
  );
}
