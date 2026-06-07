"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { CheckCircle2, XCircle, Loader2, MailCheck } from "lucide-react";

type Status = "loading" | "valid" | "accepted" | "expired" | "error";

interface InviteInfo {
  workspaceName: string;
  inviterName: string;
  role: string;
  invitedEmail: string;
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Token undangan tidak valid.");
      return;
    }
    // Verify token
    fetch(`/api/invite/verify?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setInfo(d.data);
          setStatus("valid");
        } else {
          setStatus(d.expired ? "expired" : "error");
          setErrorMsg(d.message || "Token tidak valid.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Gagal menghubungi server.");
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("accepted");
        setTimeout(() => router.push("/dashboard"), 2500);
      } else {
        setErrorMsg(data.message || "Gagal menerima undangan.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan. Coba lagi.");
      setStatus("error");
    } finally {
      setAccepting(false);
    }
  };

  const roleLabels: Record<string, string> = {
    owner: "Owner",
    manager: "Manager",
    member: "Member",
    viewer: "Viewer",
  };

  return (
    <div className="min-h-screen bg-brutal-soft-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-extrabold uppercase tracking-tight text-brutal-black">
            Project Management
          </h1>
          <p className="mt-2 text-sm font-bold text-gray-600">
            Undangan Bergabung Workspace
          </p>
        </div>

        <BrutalCard className="bg-white">
          {/* Loading */}
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={40} className="animate-spin text-brutal-blue" />
              <p className="font-bold text-gray-600">Memverifikasi undangan...</p>
            </div>
          )}

          {/* Valid — show invite details */}
          {status === "valid" && info && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b-4 border-brutal-black pb-4">
                <div className="bg-brutal-yellow border-2 border-brutal-black rounded-xl p-2">
                  <MailCheck size={28} className="text-brutal-black" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-brutal-black">
                    Undangan Diterima
                  </h2>
                  <p className="text-xs font-bold text-gray-500">Kamu diundang bergabung</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-brutal-soft-bg border-2 border-brutal-black rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-gray-500">Workspace</span>
                    <span className="font-black text-brutal-black">{info.workspaceName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-gray-500">Diundang oleh</span>
                    <span className="font-black text-brutal-black">{info.inviterName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-gray-500">Role kamu</span>
                    <span className="font-black text-brutal-blue">
                      {roleLabels[info.role] || info.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-gray-500">Email</span>
                    <span className="font-bold text-gray-700 text-sm">{info.invitedEmail}</span>
                  </div>
                </div>
              </div>

              <BrutalButton
                variant="primary"
                className="w-full uppercase tracking-wider"
                onClick={handleAccept}
                isLoading={accepting}
              >
                ✓ Terima & Bergabung
              </BrutalButton>

              <p className="text-center text-xs font-bold text-gray-400">
                Dengan bergabung, kamu setuju dengan syarat penggunaan platform ini.
              </p>
            </div>
          )}

          {/* Accepted */}
          {status === "accepted" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 size={56} className="text-green-500" />
              <h2 className="text-2xl font-black uppercase text-brutal-black">
                Berhasil Bergabung!
              </h2>
              <p className="font-bold text-gray-600">
                Kamu sudah menjadi anggota workspace. Mengarahkan ke dashboard...
              </p>
            </div>
          )}

          {/* Expired */}
          {status === "expired" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <XCircle size={56} className="text-brutal-yellow" />
              <h2 className="text-2xl font-black uppercase text-brutal-black">
                Link Kadaluarsa
              </h2>
              <p className="font-bold text-gray-600 mb-4">
                Link undangan ini sudah kadaluarsa (berlaku 48 jam). Minta admin untuk mengirim undangan baru.
              </p>
              <BrutalButton
                variant="secondary"
                onClick={() => router.push("/login")}
              >
                Ke Halaman Login
              </BrutalButton>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <XCircle size={56} className="text-red-500" />
              <h2 className="text-2xl font-black uppercase text-brutal-black">
                Undangan Tidak Valid
              </h2>
              <p className="font-bold text-gray-600 mb-4">{errorMsg}</p>
              <BrutalButton
                variant="secondary"
                onClick={() => router.push("/login")}
              >
                Ke Halaman Login
              </BrutalButton>
            </div>
          )}
        </BrutalCard>
      </div>
    </div>
  );
}
