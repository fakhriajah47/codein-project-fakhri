"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalBadge, BrutalBadgeVariant } from "@/components/ui/brutal-badge";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalAlert } from "@/components/ui/brutal-alert";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import {
  FileText,
  Calendar,
  Mail,
  Send,
  X,
  Eye,
} from "lucide-react";

export default function ReportsCatalogPage() {
  const { activeWorkspace, workspaceRole } = useWorkspace();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview Modal state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailIntro, setEmailIntro] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const isEditable = workspaceRole && ["owner", "manager"].includes(workspaceRole);

  const fetchReports = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${activeWorkspace.id}/reports`);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setError(resData.message || "Gagal memuat katalog laporan.");
        setLoading(false);
        return;
      }

      setReports(resData.data);
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeWorkspace]);

  const handleOpenPreview = (report: any) => {
    setSelectedReport(report);
    setEmailTo("");
    setEmailSubject(`[Laporan Eksekutif] ${report.title}`);
    setEmailIntro("Yth. Pemangku Kepentingan,\n\nBerikut terlampir laporan ringkasan perkembangan proyek terbaru.");
    setSendError(null);
    setSendSuccess(null);
  };

  const handleClosePreview = () => {
    setSelectedReport(null);
  };

  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setSendLoading(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const response = await fetch(`/api/reports/${selectedReport.id}/send-gmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          introMessage: emailIntro,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setSendError(resData.message || "Gagal mengirimkan laporan Gmail.");
      } else {
        setSendSuccess("Laporan berhasil dikirim melalui Gmail!");
        // Refresh catalog to update status to sent
        await fetchReports();
      }
    } catch (err: any) {
      setSendError(err?.message || "Pengiriman Gmail gagal.");
    } finally {
      setSendLoading(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <EmptyState
        title="Tidak Ada Ruang Kerja yang Terpilih"
        description="Silakan pilih atau ganti ke ruang kerja aktif pada bar navigasi atas untuk melihat daftar laporan."
      />
    );
  }

  if (loading && reports.length === 0) {
    return <LoadingState message="Mengambil arsip laporan ruang kerja..." />;
  }

  if (error) {
    return <ErrorState title="Gagal Memuat Katalog Laporan" description={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-brutal-black flex items-center gap-2">
          <FileText size={28} className="text-brutal-blue" />
          Laporan Eksekutif
        </h1>
        <p className="text-gray-600 font-bold">
          Tinjau, lihat pratinjau, dan kirimkan laporan ringkasan proyek langsung ke klien atau pimpinan perusahaan.
        </p>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="Belum Ada Laporan"
          description="Katalog laporan Anda kosong. Anda dapat membuat laporan eksekutif menggunakan AI dari panel asisten detail proyek."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            let statusVariant: BrutalBadgeVariant = "yellow";
            let statusLabel = "Draf";
            if (report.status === "sent") { statusVariant = "green"; statusLabel = "Terkirim"; }
            if (report.status === "archived") { statusVariant = "gray"; statusLabel = "Arsip"; }

            let typeVariant: BrutalBadgeVariant = "blue";
            let typeLabel = report.type;
            if (report.type === "risk") { typeVariant = "red"; typeLabel = "Risiko"; }
            if (report.type === "weekly") { typeVariant = "purple"; typeLabel = "Mingguan"; }
            if (report.type === "summary") { typeVariant = "blue"; typeLabel = "Ringkasan"; }

            return (
              <BrutalCard key={report.id} className="bg-white flex flex-col justify-between" interactive>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-gray-500">
                      Proyek: {report.projectName}
                    </span>
                    <div className="flex gap-1.5">
                      <BrutalBadge variant={typeVariant} className="text-[9px] py-0 px-1.5 font-bold uppercase">
                        {typeLabel}
                      </BrutalBadge>
                      <BrutalBadge variant={statusVariant} className="text-[9px] py-0 px-1.5 font-bold uppercase">
                        {statusLabel}
                      </BrutalBadge>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-brutal-black line-clamp-1">{report.title}</h3>
                  <p className="text-xs font-bold text-gray-500 line-clamp-2">
                    {report.content?.summary || "Tidak ada teks ringkasan untuk laporan ini."}
                  </p>
                </div>

                <div className="mt-6 border-t-2 border-dashed border-gray-200 pt-4 flex items-center justify-between text-xs text-gray-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {new Date(report.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>

                  <BrutalButton
                    onClick={() => handleOpenPreview(report)}
                    variant="primary"
                    size="sm"
                    className="uppercase font-black text-[10px] tracking-wider py-1 px-3 shadow-brutal-xs"
                    leftIcon={<Eye size={12} />}
                  >
                    Pratinjau
                  </BrutalButton>
                </div>
              </BrutalCard>
            );
          })}
        </div>
      )}

      {/* Preview & Send Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl bg-brutal-soft-bg border-4 border-brutal-black p-6 md:p-8 rounded-2xl shadow-brutal-lg max-h-[90vh] overflow-y-auto">
            
            {/* Left: Report Content Preview */}
            <BrutalCard className="bg-white max-h-[70vh] overflow-y-auto shadow-brutal-md">
              <div className="flex items-center justify-between border-b-4 border-brutal-black pb-2 mb-4">
                <h3 className="text-xl font-black uppercase flex items-center gap-2">
                  <FileText className="text-brutal-blue" />
                  Isi Laporan
                </h3>
                <span className="text-[10px] font-black uppercase bg-brutal-yellow border border-brutal-black px-2 py-0.5 rounded">
                  {selectedReport.type === "risk" ? "Risiko" : selectedReport.type === "weekly" ? "Mingguan" : "Ringkasan"}
                </span>
              </div>

              <div className="space-y-4 text-xs font-bold text-gray-700">
                <div>
                  <h4 className="text-sm font-black text-brutal-black uppercase">Judul</h4>
                  <p className="p-2 border border-brutal-black rounded bg-gray-50">{selectedReport.title}</p>
                </div>

                <div>
                  <h4 className="text-sm font-black text-brutal-black uppercase">Ringkasan Eksekutif</h4>
                  <p className="p-3 border border-brutal-black rounded bg-gray-50 leading-relaxed font-medium">
                    {selectedReport.content?.summary}
                  </p>
                </div>

                {selectedReport.content?.completedWork && selectedReport.content.completedWork.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-brutal-mint uppercase">Pekerjaan Selesai</h4>
                    <ul className="list-disc pl-5 space-y-1 mt-1 font-medium text-gray-600">
                      {selectedReport.content.completedWork.map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.content?.pendingWork && selectedReport.content.pendingWork.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-brutal-orange uppercase">Tugas Tertunda Penting</h4>
                    <ul className="list-disc pl-5 space-y-1 mt-1 font-medium text-gray-600">
                      {selectedReport.content.pendingWork.map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.content?.risks && selectedReport.content.risks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-brutal-coral uppercase">Risiko yang Diidentifikasi</h4>
                    <ul className="list-disc pl-5 space-y-1 mt-1 font-medium text-gray-600">
                      {selectedReport.content.risks.map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.content?.nextActions && selectedReport.content.nextActions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-brutal-blue uppercase">Rekomendasi Tindakan</h4>
                    <ul className="list-disc pl-5 space-y-1 mt-1 font-medium text-gray-600">
                      {selectedReport.content.nextActions.map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </BrutalCard>

            {/* Right: Gmail Dispatch Form */}
            <div className="flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-4 border-brutal-black pb-2 mb-2">
                  <h3 className="text-xl font-black uppercase flex items-center gap-2">
                    <Mail className="text-brutal-purple" />
                    Kirim Laporan
                  </h3>
                  <button
                    onClick={handleClosePreview}
                    className="border-2 border-brutal-black p-1 bg-white hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {sendSuccess && (
                  <BrutalAlert variant="success" className="mb-4">
                    {sendSuccess}
                  </BrutalAlert>
                )}
                {sendError && (
                  <BrutalAlert variant="danger" className="mb-4">
                    {sendError}
                  </BrutalAlert>
                )}

                <form onSubmit={handleSendGmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase mb-1">Alamat Penerima *</label>
                    <BrutalInput
                      type="email"
                      required
                      placeholder="client@majudigital.com"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase mb-1">Subjek Email *</label>
                    <BrutalInput
                      type="text"
                      required
                      placeholder="Laporan Progress Proyek"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase mb-1">Pesan Pengantar</label>
                    <textarea
                      rows={5}
                      placeholder="Tulis pesan salam atau pengantar..."
                      value={emailIntro}
                      onChange={(e) => setEmailIntro(e.target.value)}
                      className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none text-xs"
                    />
                  </div>

                  {isEditable ? (
                    <BrutalButton
                      type="submit"
                      variant="success"
                      className="w-full font-black uppercase tracking-wide flex justify-center items-center gap-2"
                      isLoading={sendLoading}
                      rightIcon={<Send size={14} />}
                    >
                      Kirim Laporan
                    </BrutalButton>
                  ) : (
                    <div className="p-3 bg-gray-100 border-2 border-brutal-black rounded-xl text-xs font-bold text-center text-gray-500">
                      Viewer ruang kerja tidak dapat mengirim laporan Gmail.
                    </div>
                  )}
                </form>
              </div>

              <div className="mt-6 border-t border-gray-300 pt-4 flex justify-end">
                <BrutalButton onClick={handleClosePreview} variant="secondary" className="uppercase font-black">
                  Tutup Pratinjau
                </BrutalButton>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
