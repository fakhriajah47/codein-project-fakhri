"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalAlert } from "@/components/ui/brutal-alert";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("el@mail.com");
  const [password, setPassword] = useState("11223344");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Email atau kata sandi tidak valid.");
        setLoading(false);
        return;
      }

      router.push(result.data?.redirectTo || "/dashboard");
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
            Pusat kendali manajemen proyek untuk tim modern
          </p>
        </div>

        <BrutalCard className="bg-white">
          <h2 className="text-2xl font-black mb-6 uppercase border-b-4 border-brutal-black pb-2">
            Masuk
          </h2>

          {error && (
            <BrutalAlert variant="danger" className="mb-5">
              {error}
            </BrutalAlert>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <BrutalButton
              type="submit"
              variant="primary"
              className="w-full text-center uppercase tracking-wider"
              isLoading={loading}
            >
              Masuk ke Dasbor
            </BrutalButton>
          </form>

          <div className="mt-6 text-center border-t-2 border-dashed border-gray-300 pt-4">
            <p className="text-sm font-bold text-gray-600">
              Belum punya akun?{" "}
              <Link href="/register" className="text-brutal-blue hover:underline font-black">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </BrutalCard>
      </div>
    </div>
  );
}
