"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalAlert } from "@/components/ui/brutal-alert";
import { BrutalTextarea } from "@/components/ui/brutal-textarea";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // We call the service via a server action or route handler.
      // But since we want to be clean and modular, let's create a server route or action, or we can write the insert logic here using the admin client.
      // Wait, can we call the API `POST /api/workspaces`?
      // Yes! Let's write the Route Handler for `/api/workspaces` next, and we will call it from this client component.
      // That matches docs/04.md (POST /api/workspaces)!
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setError(resData.message || "Gagal membuat ruang kerja.");
        setLoading(false);
        return;
      }

      // Store active workspace ID in localStorage for easy lookup on client
      localStorage.setItem("active_workspace_id", resData.data.id);

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan yang tidak terduga.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brutal-soft-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-extrabold uppercase tracking-tight text-brutal-black">
            ProjectPilot <span className="bg-brutal-yellow px-2 py-0.5 border-2 border-brutal-black inline-block -rotate-1 shadow-brutal-sm">AI</span>
          </h1>
          <p className="mt-3 text-sm font-bold text-gray-700">
            Mari konfigurasikan ruang kerja Anda
          </p>
        </div>

        <BrutalCard className="bg-white">
          <div className="flex items-center justify-between border-b-4 border-brutal-black pb-2 mb-6">
            <h2 className="text-2xl font-black uppercase">
              Siapkan Ruang Kerja
            </h2>
            <button
              onClick={handleLogout}
              className="text-xs font-black uppercase text-brutal-coral hover:underline"
            >
              Keluar
            </button>
          </div>

          <p className="text-sm font-bold text-gray-600 mb-6">
            Setiap proyek, tugas, milestone, dan anggota tim berada dalam satu ruang kerja. Silakan tentukan nama ruang kerja Anda untuk memulai.
          </p>

          {error && (
            <BrutalAlert variant="danger" className="mb-5">
              {error}
            </BrutalAlert>
          )}

          <form onSubmit={handleCreateWorkspace} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-black uppercase text-brutal-black mb-1">
                Nama Ruang Kerja
              </label>
              <BrutalInput
                id="name"
                name="name"
                type="text"
                required
                placeholder="Contoh: Sohibdigi Studio, PT Maju Digital"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-black uppercase text-brutal-black mb-1">
                Deskripsi (Opsional)
              </label>
              <BrutalTextarea
                id="description"
                name="description"
                rows={3}
                placeholder="Contoh: Pusat kendali utama untuk agensi digital dan proyek klien."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <BrutalButton
              type="submit"
              variant="primary"
              className="w-full text-center uppercase tracking-wider"
              isLoading={loading}
            >
              Mulai Ruang Kerja
            </BrutalButton>
          </form>
        </BrutalCard>
      </div>
    </div>
  );
}
