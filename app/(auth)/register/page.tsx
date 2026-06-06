"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalAlert } from "@/components/ui/brutal-alert";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, jobTitle, email, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Pendaftaran gagal. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      router.push(result.data?.redirectTo || "/onboarding");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan. Silakan coba kembali.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brutal-soft-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-extrabold uppercase tracking-tight text-brutal-black">
            ProjectPilot <span className="bg-brutal-yellow px-2 py-0.5 border-2 border-brutal-black inline-block -rotate-1 shadow-brutal-sm">AI</span>
          </h1>
          <p className="mt-3 text-sm font-bold text-gray-700">
            Buat akun dan mulai kelola proyek tim Anda
          </p>
        </div>

        <BrutalCard className="bg-white">
          <h2 className="text-2xl font-black mb-6 uppercase border-b-4 border-brutal-black pb-2">
            Buat Akun
          </h2>

          {error && (
            <BrutalAlert variant="danger" className="mb-5">
              {error}
            </BrutalAlert>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-black uppercase text-brutal-black mb-1">
                Nama Lengkap
              </label>
              <BrutalInput
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Fakhri Rimbawan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="jobTitle" className="block text-sm font-black uppercase text-brutal-black mb-1">
                Jabatan (Opsional)
              </label>
              <BrutalInput
                id="jobTitle"
                name="jobTitle"
                type="text"
                placeholder="CEO / Project Lead / Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-black uppercase text-brutal-black mb-1">
                Alamat Email
              </label>
              <BrutalInput
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-black uppercase text-brutal-black mb-1">
                Kata Sandi
              </label>
              <BrutalInput
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <BrutalButton
              type="submit"
              variant="success"
              className="w-full text-center uppercase tracking-wider"
              isLoading={loading}
            >
              Daftar & Mulai Setup
            </BrutalButton>
          </form>

          <div className="mt-6 text-center border-t-2 border-dashed border-gray-300 pt-4">
            <p className="text-sm font-bold text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-brutal-blue hover:underline font-black">
                Masuk di sini
              </Link>
            </p>
          </div>
        </BrutalCard>
      </div>
    </div>
  );
}
