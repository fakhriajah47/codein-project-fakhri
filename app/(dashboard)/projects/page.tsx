"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalBadge, BrutalBadgeVariant } from "@/components/ui/brutal-badge";
import { BrutalTextarea } from "@/components/ui/brutal-textarea";
import { BrutalAlert } from "@/components/ui/brutal-alert";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Project, ProjectPriority } from "@/types";
import { Folder, Calendar, Plus, X, Search } from "lucide-react";
import Link from "next/link";

export default function ProjectsCatalogPage() {
  const { activeWorkspace, workspaceRole } = useWorkspace();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [healthStatus, setHealthStatus] = useState("");

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [formPriority, setFormPriority] = useState<ProjectPriority>("medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchProjects = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams();
      if (search) qParams.set("search", search);
      if (status) qParams.set("status", status);
      if (priority) qParams.set("priority", priority);
      if (healthStatus) qParams.set("health_status", healthStatus);

      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/projects?${qParams.toString()}`);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setError(resData.message || "Gagal memuat daftar proyek.");
        setLoading(false);
        return;
      }

      setProjects(resData.data);
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeWorkspace, status, priority, healthStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setFormLoading(true);
    setFormError(null);

    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          clientName,
          projectType,
          priority: formPriority,
          startDate: startDate || undefined,
          dueDate: dueDate || undefined,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setFormError(resData.message || "Gagal membuat proyek baru.");
        setFormLoading(false);
        return;
      }

      // Reset form
      setName("");
      setDescription("");
      setClientName("");
      setProjectType("");
      setFormPriority("medium");
      setStartDate("");
      setDueDate("");
      setIsModalOpen(false);

      // Reload
      fetchProjects();
    } catch (err: any) {
      setFormError(err?.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setFormLoading(false);
    }
  };

  const canCreate = workspaceRole && ["owner", "manager"].includes(workspaceRole);

  if (loading && projects.length === 0) {
    return <LoadingState message="Memuat daftar proyek..." />;
  }

  if (error) {
    return <ErrorState title="Gagal Memuat Proyek" description={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Top bar header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-brutal-black">
            Katalog Proyek
          </h1>
          <p className="text-gray-600 font-bold">
            Kelola semua proyek aktif Anda
          </p>
        </div>
        {canCreate && (
          <BrutalButton
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            leftIcon={<Plus size={18} />}
            className="uppercase tracking-wider font-black shrink-0"
          >
            Buat Proyek Baru
          </BrutalButton>
        )}
      </div>

      {/* Filter and Search Section */}
      <BrutalCard className="bg-white">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-black uppercase mb-1">Cari proyek</label>
            <div className="relative">
              <BrutalInput
                type="text"
                placeholder="Cari berdasarkan nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
              <button
                type="submit"
                className="absolute right-3 top-3 text-gray-500 hover:text-brutal-black cursor-pointer"
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="planning">Perencanaan</option>
              <option value="active">Aktif</option>
              <option value="on_hold">Ditangguhkan</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Prioritas</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none"
            >
              <option value="">Semua Prioritas</option>
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
              <option value="urgent">Mendesak</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Kesehatan Proyek</label>
            <select
              value={healthStatus}
              onChange={(e) => setHealthStatus(e.target.value)}
              className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none"
            >
              <option value="">Semua Status Kesehatan</option>
              <option value="healthy">Lancar</option>
              <option value="at_risk">Berisiko</option>
              <option value="critical">Kritis</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
        </form>
      </BrutalCard>

      {/* Projects Grid Catalog */}
      {projects.length === 0 ? (
        <EmptyState
          title="Belum Ada Proyek"
          description="Tidak ada proyek yang sesuai dengan kriteria pencarian Anda. Buat proyek baru untuk memulai."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            let healthVariant: BrutalBadgeVariant = "default";
            let healthLabel: string = project.health_status;
            if (project.health_status === "healthy") {
              healthVariant = "green";
              healthLabel = "Lancar";
            }
            if (project.health_status === "at_risk") {
              healthVariant = "yellow";
              healthLabel = "Berisiko";
            }
            if (project.health_status === "critical") {
              healthVariant = "red";
              healthLabel = "Kritis";
            }
            if (project.health_status === "completed") {
              healthVariant = "blue";
              healthLabel = "Selesai";
            }

            let priorityVariant: BrutalBadgeVariant = "default";
            let priorityLabel: string = project.priority;
            if (project.priority === "high") {
              priorityVariant = "orange";
              priorityLabel = "Tinggi";
            }
            if (project.priority === "urgent") {
              priorityVariant = "red";
              priorityLabel = "Mendesak";
            }
            if (project.priority === "medium") {
              priorityVariant = "yellow";
              priorityLabel = "Sedang";
            }
            if (project.priority === "low") {
              priorityVariant = "gray";
              priorityLabel = "Rendah";
            }

            return (
              <BrutalCard
                key={project.id}
                interactive
                className="bg-white flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black uppercase bg-gray-100 border border-brutal-black px-1.5 py-0.5 rounded">
                      {project.project_type || "Proyek Umum"}
                    </span>
                    <div className="flex gap-1">
                      <BrutalBadge variant={healthVariant} className="text-[10px] font-black uppercase">
                        {healthLabel}
                      </BrutalBadge>
                      {project.priority !== "low" && (
                        <BrutalBadge variant={priorityVariant} className="text-[10px] font-black uppercase">
                          {priorityLabel}
                        </BrutalBadge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-brutal-black line-clamp-1">
                      <Link href={`/projects/${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    </h3>
                    <p className="text-xs font-bold text-gray-500">
                      Klien: {project.client_name || "Internal"}
                    </p>
                  </div>

                  <p className="text-xs font-bold text-gray-600 line-clamp-2 h-8">
                    {project.description || "Tidak ada deskripsi singkat untuk proyek ini."}
                  </p>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-black text-brutal-black">
                      <span>PROGRES</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 border-2 border-brutal-black rounded-full h-3 overflow-hidden p-0.5">
                      <div
                        className="bg-brutal-blue border-r border-brutal-black h-full rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t-2 border-dashed border-gray-200 pt-4 flex items-center justify-between text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {project.due_date ? new Date(project.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Tanpa tenggat waktu"}
                  </span>
                  
                  <span className="font-black text-brutal-black">
                    Skor risiko: <span className="bg-brutal-yellow px-1 py-0.5 border border-brutal-black shadow-brutal-xs">{project.risk_score}</span>
                  </span>
                </div>
              </BrutalCard>
            );
          })}
        </div>
      )}

      {/* Launch Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <BrutalCard className="bg-white w-full max-w-lg shadow-brutal-xl">
            <div className="flex items-center justify-between border-b-4 border-brutal-black pb-2 mb-6">
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                <Folder className="text-brutal-blue" />
                Buat Proyek Baru
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="border-2 border-brutal-black p-1 bg-white hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <BrutalAlert variant="danger" className="mb-4">
                {formError}
              </BrutalAlert>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-brutal-black mb-1">
                  Nama Proyek *
                </label>
                <BrutalInput
                  type="text"
                  required
                  placeholder="Website Company Profile PT Maju Digital"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-brutal-black mb-1">
                  Deskripsi / Ringkasan Proyek
                </label>
                <BrutalTextarea
                  rows={3}
                  placeholder="Masukkan detail cakupan proyek..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-brutal-black mb-1">
                    Nama Klien
                  </label>
                  <BrutalInput
                    type="text"
                    placeholder="Contoh: PT Maju Digital"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-brutal-black mb-1">
                    Tipe Proyek
                  </label>
                  <BrutalInput
                    type="text"
                    placeholder="Contoh: Website Development"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-brutal-black mb-1">
                    Tanggal Mulai
                  </label>
                  <BrutalInput
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-brutal-black mb-1">
                    Tenggat Waktu
                  </label>
                  <BrutalInput
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-brutal-black mb-1">
                  Prioritas Proyek
                </label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as ProjectPriority)}
                  className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none"
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                  <option value="urgent">Mendesak</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <BrutalButton
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 uppercase"
                >
                  Batal
                </BrutalButton>
                <BrutalButton
                  type="submit"
                  variant="primary"
                  className="flex-1 uppercase"
                  isLoading={formLoading}
                >
                  Simpan Proyek
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
}
