"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalAlert } from "@/components/ui/brutal-alert";
import { createClient } from "@/lib/supabase/client";
import { LoadingState } from "@/components/shared/loading-state";
import { Settings, User, Building, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const { activeWorkspace, workspaceRole } = useWorkspace();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Workspace Info Form state
  const [wsName, setWsName] = useState("");
  const [wsDescription, setWsDescription] = useState("");
  const [wsError, setWsError] = useState<string | null>(null);
  const [wsSuccess, setWsSuccess] = useState<string | null>(null);
  const [wsLoading, setWsLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error: pError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (pError) {
          console.error("Error loading profile:", pError);
          // Insert a fallback row if profile doesn't exist
          if (pError.code === "PGRST116") {
            const { data: newProfile } = await supabase
              .from("profiles")
              .insert({ user_id: user.id, full_name: user.email?.split("@")[0] || "Pengguna" })
              .select()
              .single();
            if (newProfile) {
              setFullName(newProfile.full_name || "");
              setJobTitle(newProfile.job_title || "");
              setTimezone(newProfile.timezone || "Asia/Jakarta");
              setAvatarUrl(newProfile.avatar_url || "");
            }
          }
        } else if (profile) {
          setFullName(profile.full_name || "");
          setJobTitle(profile.job_title || "");
          setTimezone(profile.timezone || "Asia/Jakarta");
          setAvatarUrl(profile.avatar_url || "");
        }

        if (activeWorkspace) {
          setWsName(activeWorkspace.name);
          setWsDescription(activeWorkspace.description || "");
        }
      } catch (err: any) {
        setError(err?.message || "Gagal memuat data pengaturan.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [activeWorkspace]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Belum masuk log");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          job_title: jobTitle,
          timezone,
          avatar_url: avatarUrl || null,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setSuccess("Pengaturan profil berhasil disimpan!");
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan perubahan profil.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setWsLoading(true);
    setWsError(null);
    setWsSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from("workspaces")
        .update({
          name: wsName,
          description: wsDescription || null,
        })
        .eq("id", activeWorkspace.id);

      if (updateError) throw updateError;

      setWsSuccess("Pengaturan ruang kerja berhasil diperbarui!");
      
      // Force reload workspace switcher parameters
      window.location.reload();
    } catch (err: any) {
      setWsError(err?.message || "Gagal memperbarui data ruang kerja.");
    } finally {
      setWsLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Menghubungkan ke pengaturan pusat kendali..." />;
  }

  const isOwner = workspaceRole === "owner";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-brutal-black flex items-center gap-2">
          <Settings size={28} className="text-brutal-blue" />
          Pengaturan Akun & Ruang Kerja
        </h1>
        <p className="text-gray-600 font-bold">
          Konfigurasikan profil pengguna dan parameter ruang kerja Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <BrutalCard className="bg-white">
          <h2 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-6 flex items-center gap-2">
            <User size={20} className="text-brutal-blue" />
            Profil Pribadi
          </h2>

          {success && (
            <BrutalAlert variant="success" className="mb-4">
              {success}
            </BrutalAlert>
          )}
          {error && (
            <BrutalAlert variant="danger" className="mb-4">
              {error}
            </BrutalAlert>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">Nama Lengkap</label>
              <BrutalInput
                type="text"
                required
                placeholder="Fakhri Rimbawan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Jabatan / Pekerjaan</label>
              <BrutalInput
                type="text"
                placeholder="Contoh: Lead Engineer / Designer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">URL Avatar</label>
              <BrutalInput
                type="text"
                placeholder="https://example.com/avatar.png"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Zona Waktu</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none"
              >
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="UTC">UTC / Coordinated Universal Time</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            <BrutalButton type="submit" variant="primary" className="w-full uppercase font-black" isLoading={saveLoading}>
              Simpan Perubahan Profil
            </BrutalButton>
          </form>
        </BrutalCard>

        {/* Workspace Card */}
        {activeWorkspace && (
          <BrutalCard className="bg-white">
            <h2 className="text-lg font-black uppercase border-b-2 border-dashed border-gray-200 pb-2 mb-6 flex items-center gap-2">
              <Building size={20} className="text-brutal-purple" />
              Konfigurasi Ruang Kerja Aktif
            </h2>

            <div className="p-3 bg-brutal-soft-bg border-2 border-brutal-black rounded-xl text-xs font-bold text-gray-700 mb-6 flex items-center gap-3">
              <ShieldCheck size={24} className="text-brutal-mint shrink-0" />
              <div>
                Peran Anda di Ruang Kerja ini: <span className="font-black uppercase text-brutal-blue">{workspaceRole === "owner" ? "Pemilik (Owner)" : workspaceRole === "manager" ? "Manajer" : workspaceRole === "member" ? "Anggota" : "Viewer"}</span>
                {!isOwner && <p className="text-[10px] text-gray-500 font-medium">Perubahan pengaturan ruang kerja dikunci untuk jenis peran Anda.</p>}
              </div>
            </div>

            {wsSuccess && (
              <BrutalAlert variant="success" className="mb-4">
                {wsSuccess}
              </BrutalAlert>
            )}
            {wsError && (
              <BrutalAlert variant="danger" className="mb-4">
                {wsError}
              </BrutalAlert>
            )}

            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Ruang Kerja</label>
                <BrutalInput
                  type="text"
                  required
                  disabled={!isOwner}
                  placeholder="Contoh: PT Maju Digital"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi Ruang Kerja</label>
                <textarea
                  rows={3}
                  disabled={!isOwner}
                  placeholder="Masukkan deskripsi atau cakupan kerja..."
                  value={wsDescription}
                  onChange={(e) => setWsDescription(e.target.value)}
                  className="w-full bg-white border-2 border-brutal-black rounded-xl p-2.5 font-bold focus:outline-none disabled:bg-gray-100"
                />
              </div>

              {isOwner && (
                <BrutalButton type="submit" variant="warning" className="w-full uppercase font-black" isLoading={wsLoading}>
                  Simpan Pengaturan Ruang Kerja
                </BrutalButton>
              )}
            </form>
          </BrutalCard>
        )}
      </div>
    </div>
  );
}
