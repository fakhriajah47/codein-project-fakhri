import React from "react";
import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import { Sparkles, Terminal, Cpu, Activity, Send } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brutal-soft-bg flex flex-col justify-between font-sans">
      
      {/* Top Navigation */}
      <header className="h-20 border-b-4 border-brutal-black bg-brutal-yellow flex items-center justify-between px-6 md:px-12">
        <span className="font-heading font-black text-2xl uppercase tracking-tight text-brutal-black">
          Project Management
        </span>
        
        <Link href="/dashboard">
          <BrutalButton variant="secondary" className="uppercase font-black text-xs px-4 py-1.5 shadow-brutal-sm">
            Masuk Dasbor
          </BrutalButton>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center gap-12 text-center">
        
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-brutal-purple border-2 border-brutal-black px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wide text-brutal-black shadow-brutal-sm -rotate-1">
            <Sparkles size={14} className="fill-current" />
            PROJECT MANAGEMENT v1.0
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase text-brutal-black tracking-tight leading-tight">
            Kelola Proyek dengan <span className="bg-brutal-yellow px-3 py-1 border-4 border-brutal-black inline-block rotate-1 shadow-brutal-md mt-1">Lebih Cerdas</span>
          </h1>

          <p className="text-sm md:text-base font-bold text-gray-700 max-w-xl mx-auto leading-relaxed pt-2">
            Pusat kendali proyek untuk agensi digital, founder, dan tim modern yang menginginkan pengelolaan tenggat waktu, pembagian tugas otomatis, serta pemantauan risiko proyek secara langsung.
          </p>

          <div className="pt-4 flex justify-center">
            <Link href="/dashboard">
              <BrutalButton variant="primary" size="lg" className="uppercase tracking-wider font-black px-8 py-3 shadow-brutal-md text-sm">
                Mulai Kelola Proyek
              </BrutalButton>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left pt-6">
          {/* Card 1 */}
          <BrutalCard className="bg-white" interactive>
            <div className="p-3 bg-brutal-blue text-white border-2 border-brutal-black rounded-xl shadow-brutal-sm w-fit mb-4">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-black uppercase text-brutal-black mb-2">Generator Tugas Pintar</h3>
            <p className="text-xs font-bold text-gray-600 leading-relaxed">
              Ubah ringkasan proyek atau kebutuhan mentah menjadi target pencapaian, daftar tugas, pembagian peran, dan kriteria penyelesaian secara instan.
            </p>
          </BrutalCard>

          {/* Card 2 */}
          <BrutalCard className="bg-white" interactive>
            <div className="p-3 bg-brutal-coral text-white border-2 border-brutal-black rounded-xl shadow-brutal-sm w-fit mb-4">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-black uppercase text-brutal-black mb-2">Radar Risiko Proyek</h3>
            <p className="text-xs font-bold text-gray-600 leading-relaxed">
              Menganalisis kemajuan tugas, indikasi keterlambatan, dan beban kerja tim untuk menghasilkan skor risiko proyek dengan rekomendasi tindakan korektif.
            </p>
          </BrutalCard>

          {/* Card 3 */}
          <BrutalCard className="bg-white" interactive>
            <div className="p-3 bg-brutal-yellow text-brutal-black border-2 border-brutal-black rounded-xl shadow-brutal-sm w-fit mb-4">
              <Send size={24} />
            </div>
            <h3 className="text-xl font-black uppercase text-brutal-black mb-2">Integrasi Otomatisasi</h3>
            <p className="text-xs font-bold text-gray-600 leading-relaxed">
              Konfigurasikan webhook Discord untuk log aktivitas tim, bot Telegram untuk notifikasi penting, dan hubungkan Gmail untuk mengirimkan laporan eksekutif.
            </p>
          </BrutalCard>
        </div>

      </main>

      {/* Footer */}
      <footer className="h-16 border-t-4 border-brutal-black bg-brutal-black text-white flex items-center justify-center font-bold text-xs uppercase tracking-wider">
        Project Management © {new Date().getFullYear()} - Sistem Aktif
      </footer>

    </div>
  );
}
