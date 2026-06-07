"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import { BrutalButton } from "@/components/ui/brutal-button";
import {
  Sparkles,
  Cpu,
  Activity,
  CheckCircle,
  Users,
  Bell,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Mail,
  Zap,
  Menu,
  X,
  KanbanSquare,
  Bot
} from "lucide-react";

const rolesData = {
  pm: {
    title: "Manajer Proyek (PM)",
    badge: "KENDALI & STRATEGI",
    badgeBg: "bg-brutal-yellow",
    desc: "Miliki visibilitas penuh terhadap kesehatan proyek, kelola beban kerja tim secara adil, dan hemat waktu puluhan jam menggunakan otomasi AI.",
    benefits: [
      {
        title: "Radar Risiko Otomatis",
        text: "Sistem memantau keterlambatan tugas dan langsung menghitung skor risiko proyek untuk mencegah kegagalan rilis."
      },
      {
        title: "Milestone Builder",
        text: "Gunakan AI Gemini untuk membuat milestone terperinci dari deskripsi proyek hanya dalam waktu kurang dari 5 detik."
      },
      {
        title: "Distribusi Beban Kerja Aktual",
        text: "Visualisasikan jumlah tugas per anggota tim secara riil untuk mencegah kelelahan (burnout) tim."
      }
    ],
    cta: "Masuk & Kelola Tim",
    cardColor: "highlight" as const
  },
  developer: {
    title: "Developer & Pelaksana",
    badge: "PRODUKTIVITAS & FOKUS",
    badgeBg: "bg-brutal-purple",
    desc: "Fokus pada apa yang paling penting hari ini. Dapatkan bantuan AI untuk memecahkan prioritas harian dan jalankan pekerjaan tanpa gangguan koordinasi.",
    benefits: [
      {
        title: "Rekomendasi Fokus Harian AI",
        text: "Asisten pintar Anda menganalisis daftar tugas dan merekomendasikan prioritas terbaik untuk dieksekusi hari ini secara instan."
      },
      {
        title: "Papan Kanban Bersih & Intuitif",
        text: "Geser tugas dari Todo ke In Progress hingga Done dengan drag-and-drop visual yang responsif di mobile maupun desktop."
      },
      {
        title: "Kriteria Penerimaan (Acceptance Criteria)",
        text: "Setiap tugas dilengkapi dengan checklist kriteria penyelesaian yang jelas agar target rilis Anda presisi."
      }
    ],
    cta: "Mulai Kerjakan Tugas",
    cardColor: "ai" as const
  },
  client: {
    title: "Stakeholder & Klien",
    badge: "TRANSPARANSI & HASIL",
    badgeBg: "bg-brutal-mint",
    desc: "Pantau kemajuan proyek secara transparan tanpa perlu mengirim chat manual berkali-kali. Terima notifikasi dan laporan instan ke kanal Anda.",
    benefits: [
      {
        title: "Notifikasi Instan 360°",
        text: "Terima pembaruan status tugas langsung di kanal Discord atau obrolan Telegram tim Anda secara real-time."
      },
      {
        title: "Log Aktivitas Aktual & Riil",
        text: "Log aktivitas mencatat aksi riil tim (misal: merubah status, menambah komentar) secara kronologis dan transparan."
      },
      {
        title: "Laporan Eksekutif Gmail",
        text: "Terima rangkuman performa dan pencapaian proyek langsung ke kotak masuk Gmail Anda setiap minggu secara otomatis."
      }
    ],
    cta: "Lihat Demo Dashboard",
    cardColor: "success" as const
  }
};

const faqs = [
  {
    question: "Bagaimana AI Gemini membantu dalam pengelolaan proyek?",
    answer: "Gemini AI diintegrasikan ke dalam beberapa bagian utama: (1) Generator Milestones, yang menguraikan deskripsi proyek menjadi target dan tugas spesifik; (2) Daily Focus, yang menganalisis tugas-tugas Anda untuk memberikan arahan taktis harian; dan (3) Project Chat Assistant, asisten obrolan yang dapat Anda perintahkan untuk menulis tugas, merubah status, atau menanyakan info proyek secara langsung."
  },
  {
    question: "Apakah integrasi Telegram dan Discord gratis dan mudah dikonfigurasi?",
    answer: "Ya! Melalui menu Integrasi, Anda dapat memasukkan Webhook URL Discord dan Bot Token Telegram. Sekali dikonfigurasi, setiap tindakan pembuatan tugas baru, pergantian status tugas (misal dari Todo ke Done), atau penghapusan tugas akan otomatis mengirimkan notifikasi interaktif ke grup obrolan Anda."
  },
  {
    question: "Apa itu Radar Risiko Proyek dan bagaimana cara kerjanya?",
    answer: "Radar Risiko menganalisis data tugas aktif Anda, membandingkan tenggat waktu (due date) dengan tanggal hari ini, mendeteksi tugas-tugas yang terhambat (blocked), dan menghitung skor risiko proyek (0-100%). AI kemudian mengategorikan status kesehatan proyek (Healthy, Medium Risk, At Risk) beserta rekomendasi perbaikannya secara instan."
  },
  {
    question: "Apakah aplikasi ini mendukung akses dari perangkat seluler (mobile)?",
    answer: "Sangat mendukung! Kami telah mengoptimalkan antarmuka seluler dengan navigasi sidebar laci (drawer) yang responsif, scroll horizontal untuk papan Kanban, serta penyesuaian teks agar nyaman digunakan pada layar smartphone."
  }
];

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<keyof typeof rolesData>("pm");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-brutal-soft-bg flex flex-col justify-between font-sans selection:bg-brutal-yellow selection:text-brutal-black">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 h-20 border-b-4 border-brutal-black bg-brutal-yellow flex items-center justify-between px-6 md:px-12 shadow-brutal-sm">
        <div className="flex items-center gap-4">
          <span className="font-heading font-black text-2xl uppercase tracking-tight text-brutal-black flex items-center gap-2">
            <span className="bg-brutal-black text-brutal-yellow p-1.5 border-2 border-brutal-black rounded-lg">CODE</span>
            IN
          </span>
          <span className="hidden sm:inline-block bg-brutal-black text-white text-[9px] font-black px-2 py-0.5 border border-brutal-black rounded-full -rotate-2">
            ENTERPRISE v1.0
          </span>
        </div>
        
        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 font-black uppercase text-xs tracking-wider">
          <a href="#fitur" className="text-brutal-black hover:text-brutal-blue transition-colors">Fitur Utama</a>
          <a href="#peran" className="text-brutal-black hover:text-brutal-purple transition-colors">Solusi Peran</a>
          <a href="#alur" className="text-brutal-black hover:text-brutal-coral transition-colors">Alur Kerja</a>
          <a href="#faq" className="text-brutal-black hover:text-brutal-mint transition-colors">Tanya Jawab</a>
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/presentation">
            <BrutalButton variant="primary" className="uppercase font-black text-xs px-5 py-2.5 shadow-brutal-sm">
              Mode Presentasi
            </BrutalButton>
          </Link>
          <Link href="/dashboard">
            <BrutalButton variant="secondary" className="uppercase font-black text-xs px-5 py-2.5 shadow-brutal-sm">
              Masuk Dasbor
            </BrutalButton>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="md:hidden p-2 border-2 border-brutal-black rounded-xl bg-white text-brutal-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden sticky top-20 z-40 border-b-4 border-brutal-black bg-brutal-yellow p-6 flex flex-col gap-4 shadow-brutal-md">
          <a 
            href="#fitur" 
            onClick={() => setMobileMenuOpen(false)}
            className="font-black uppercase text-sm border-b-2 border-brutal-black/10 pb-2 text-brutal-black"
          >
            Fitur Utama
          </a>
          <a 
            href="#peran" 
            onClick={() => setMobileMenuOpen(false)}
            className="font-black uppercase text-sm border-b-2 border-brutal-black/10 pb-2 text-brutal-black"
          >
            Solusi Peran
          </a>
          <a 
            href="#alur" 
            onClick={() => setMobileMenuOpen(false)}
            className="font-black uppercase text-sm border-b-2 border-brutal-black/10 pb-2 text-brutal-black"
          >
            Alur Kerja
          </a>
          <a 
            href="#faq" 
            onClick={() => setMobileMenuOpen(false)}
            className="font-black uppercase text-sm border-b-2 border-brutal-black/10 pb-2 text-brutal-black"
          >
            Tanya Jawab
          </a>
          <Link href="/presentation" onClick={() => setMobileMenuOpen(false)} className="w-full">
            <BrutalButton variant="primary" className="w-full uppercase font-black text-sm py-3 shadow-brutal-sm">
              Mode Presentasi
            </BrutalButton>
          </Link>
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full">
            <BrutalButton variant="secondary" className="w-full uppercase font-black text-sm py-3 shadow-brutal-sm">
              Masuk Dasbor
            </BrutalButton>
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center gap-12 text-center">
        
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-brutal-purple border-2 border-brutal-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide text-brutal-black shadow-brutal-sm rotate-1">
            <Sparkles size={14} className="fill-current text-brutal-yellow" />
            AI-Driven Project Operations Center
          </div>

          <h1 className="text-4xl md:text-7xl font-black uppercase text-brutal-black tracking-tight leading-none">
            Kelola Proyek & Intelijen Tim <br className="hidden md:inline" />
            <span className="bg-brutal-yellow px-4 py-1.5 border-4 border-brutal-black inline-block -rotate-1 shadow-brutal-md mt-2 md:mt-4">
              Dalam Satu Dasbor
            </span>
          </h1>

          <p className="text-sm md:text-lg font-bold text-gray-700 max-w-2xl mx-auto leading-relaxed pt-4">
            CodeIn menyatukan manajemen milestones tim, delegasi tugas bertenaga Gemini AI, pemantauan risiko real-time, dan integrasi notifikasi (Discord/Telegram Bot/Gmail) ke dalam satu platform premium Neobrutalisme.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/presentation" className="w-full sm:w-auto">
              <BrutalButton variant="primary" size="lg" className="w-full sm:w-auto uppercase tracking-wider font-black px-8 py-4 shadow-brutal-md text-sm">
                Buka Mode Presentasi <Sparkles size={16} className="ml-2 inline fill-current" />
              </BrutalButton>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <BrutalButton variant="primary" size="lg" className="w-full sm:w-auto uppercase tracking-wider font-black px-8 py-4 shadow-brutal-md text-sm">
                Mulai Kelola Proyek <ArrowRight size={16} className="ml-2 inline" />
              </BrutalButton>
            </Link>
            <a href="#fitur" className="w-full sm:w-auto">
              <BrutalButton variant="secondary" size="lg" className="w-full sm:w-auto uppercase tracking-wider font-black px-8 py-4 shadow-brutal-md text-sm">
                Pelajari Fitur
              </BrutalButton>
            </a>
          </div>
        </div>

        {/* Live Mockup Preview */}
        <div className="w-full max-w-5xl border-4 border-brutal-black bg-white shadow-brutal-xl rounded-2xl overflow-hidden p-0 mt-6 rotate-0 hover:-rotate-0.5 transition-transform duration-300">
          {/* Mockup Topbar */}
          <div className="bg-brutal-black px-4 py-3 flex items-center justify-between border-b-4 border-brutal-black">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-brutal-coral border border-brutal-black" />
              <div className="w-3 h-3 rounded-full bg-brutal-yellow border border-brutal-black" />
              <div className="w-3 h-3 rounded-full bg-brutal-mint border border-brutal-black" />
            </div>
            <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest font-space flex items-center gap-1.5">
              <Bot size={14} className="text-brutal-purple" /> CODEIN ENTERPRISE WORKSPACE
            </span>
            <div className="w-8 md:w-16 h-2 bg-gray-600 rounded-full" />
          </div>

          {/* Simulated Workspace Grid */}
          <div className="p-4 md:p-6 bg-brutal-soft-bg grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Health Column */}
            <div className="space-y-4">
              <div className="font-heading font-black text-xs uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Activity size={14} /> Kesehatan & Risiko Proyek
              </div>
              
              <div className="bg-white border-2 border-brutal-black p-4 rounded-xl shadow-brutal-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-xs uppercase">Company Web Revamp</h4>
                    <p className="text-[9px] font-bold text-gray-400">Workspace Studio</p>
                  </div>
                  <span className="bg-brutal-coral text-brutal-black px-2 py-0.5 text-[8px] font-black border border-brutal-black uppercase rotate-2">
                    At Risk
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-3 border border-brutal-black rounded-full overflow-hidden">
                  <div className="bg-brutal-coral h-full border-r border-brutal-black" style={{ width: "35%" }} />
                </div>
                <div className="text-[9px] font-bold text-gray-500 flex justify-between">
                  <span>Progres: 35%</span>
                  <span>Skor Risiko: 78/100</span>
                </div>
              </div>

              <div className="bg-white border-2 border-brutal-black p-4 rounded-xl shadow-brutal-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-xs uppercase">Booking Mobile App</h4>
                    <p className="text-[9px] font-bold text-gray-400">Workspace Studio</p>
                  </div>
                  <span className="bg-brutal-mint text-brutal-black px-2 py-0.5 text-[8px] font-black border border-brutal-black uppercase -rotate-2">
                    Healthy
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-3 border border-brutal-black rounded-full overflow-hidden">
                  <div className="bg-brutal-mint h-full border-r border-brutal-black" style={{ width: "85%" }} />
                </div>
                <div className="text-[9px] font-bold text-gray-500 flex justify-between">
                  <span>Progres: 85%</span>
                  <span>Skor Risiko: 12/100</span>
                </div>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="space-y-4">
              <div className="font-heading font-black text-xs uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <KanbanSquare size={14} /> Tugas Dalam Pengerjaan
              </div>
              
              <div className="space-y-3">
                <div className="bg-brutal-yellow text-brutal-black border-2 border-brutal-black p-3.5 rounded-xl shadow-brutal-sm">
                  <div className="flex justify-between text-[8px] font-black uppercase mb-1.5">
                    <span className="bg-white px-1 border border-brutal-black">TODO</span>
                    <span className="bg-brutal-coral text-white px-1 border border-brutal-black">Urgent</span>
                  </div>
                  <h5 className="font-black text-xs leading-tight">Konfigurasi SMTP Gmail Laporan</h5>
                  <p className="text-[9px] font-bold text-gray-700 mt-2">Tenggat: Hari Ini</p>
                </div>

                <div className="bg-brutal-purple text-brutal-black border-2 border-brutal-black p-3.5 rounded-xl shadow-brutal-sm">
                  <div className="flex justify-between text-[8px] font-black uppercase mb-1.5">
                    <span className="bg-white px-1 border border-brutal-black">IN PROGRESS</span>
                    <span className="bg-brutal-blue text-white px-1 border border-brutal-black">High</span>
                  </div>
                  <h5 className="font-black text-xs leading-tight">Integrasi Webhook Notifikasi Discord</h5>
                  <p className="text-[9px] font-bold text-gray-700 mt-2">Pelaksana: Fakhri</p>
                </div>
              </div>
            </div>

            {/* AI Advisor / Notification Log */}
            <div className="space-y-4">
              <div className="font-heading font-black text-xs uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Zap size={14} /> Intelijen AI & Otomasi
              </div>
              
              <BrutalCard variant="ai" className="p-4 border-2 border-brutal-black shadow-brutal-sm text-xs space-y-2">
                <div className="flex items-center gap-1.5">
                  <Bot size={16} className="text-brutal-black fill-current" />
                  <span className="font-black uppercase tracking-wider text-[9px] bg-white px-2 py-0.5 border border-brutal-black rounded">Gemini Advisor</span>
                </div>
                <p className="font-bold text-[10px] leading-relaxed text-gray-800">
                  &ldquo;Proyek Company Web terdeteksi memiliki risiko tinggi. Terdapat 3 tugas penting yang terblokir (blocked) dan estimasi rilis terancam mundur 4 hari.&rdquo;
                </p>
              </BrutalCard>

              <div className="bg-white border-2 border-brutal-black p-3.5 rounded-xl shadow-brutal-sm space-y-2.5 text-[9px]">
                <div className="flex items-center gap-2 text-gray-700 font-bold border-b border-gray-100 pb-2">
                  <span className="w-2.5 h-2.5 bg-brutal-blue border border-brutal-black rounded-full" />
                  <span>[DISCORD] Webhook disebarkan: Tugas Dibuat</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 font-bold">
                  <span className="w-2.5 h-2.5 bg-brutal-mint border border-brutal-black rounded-full" />
                  <span>[TELEGRAM] Bot mengirim: Status selesai</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Core Features / Bento Grid */}
        <section id="fitur" className="w-full pt-16 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-brutal-black">
              Segudang Fitur Untuk Skala Enterprise
            </h2>
            <p className="text-sm font-bold text-gray-600 max-w-xl mx-auto">
              Dibangun dari dasar untuk memberikan efisiensi operasional proyek tanpa tandingan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 w-full text-left">
            
            {/* Feature 1 */}
            <BrutalCard variant="ai" className="md:col-span-3 flex flex-col justify-between" interactive>
              <div>
                <div className="p-3 bg-white text-brutal-purple border-2 border-brutal-black rounded-xl shadow-brutal-sm w-fit mb-4">
                  <Cpu size={28} className="fill-current" />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase text-brutal-black mb-3">
                  🤖 Gemini AI Task Architect
                </h3>
                <p className="text-xs md:text-sm font-bold text-gray-700 leading-relaxed">
                  Tidak perlu merancang alur kerja secara manual. Cukup ketik deskripsi ringkas proyek Anda, dan sistem AI Gemini akan memproses analisis kebutuhan untuk menyusun milestones lengkap, daftar tugas terperinci, kriteria penyelesaian (Acceptance Criteria), serta saran pelaksana tugas secara instan.
                </p>
              </div>
              <div className="mt-6 font-black text-xs uppercase flex items-center gap-1.5 text-brutal-black">
                Didukung Gemini 2.5 Flash <Zap size={14} className="fill-current text-brutal-yellow" />
              </div>
            </BrutalCard>

            {/* Feature 2 */}
            <BrutalCard variant="danger" className="md:col-span-3 flex flex-col justify-between" interactive>
              <div>
                <div className="p-3 bg-white text-brutal-coral border-2 border-brutal-black rounded-xl shadow-brutal-sm w-fit mb-4">
                  <Activity size={28} />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase text-brutal-black mb-3">
                  🎯 Radar Risiko Proyek Real-Time
                </h3>
                <p className="text-xs md:text-sm font-bold text-white leading-relaxed opacity-95">
                  Hindari kejutan keterlambatan di akhir proyek. Radar risiko kami memantau pergerakan tugas aktif tim secara berkala, mendeteksi hambatan kerja (bottlenecks), membandingkan sisa waktu terhadap tenggat rilis, dan menyajikan skor risiko aktual beserta saran pencegahan yang presisi.
                </p>
              </div>
              <div className="mt-6 font-black text-xs uppercase flex items-center gap-1 text-white">
                Siap Mencegah Keterlambatan Rilis <CheckCircle size={14} />
              </div>
            </BrutalCard>

            {/* Feature 3 */}
            <BrutalCard className="md:col-span-2 bg-white flex flex-col justify-between" interactive>
              <div>
                <div className="p-3 bg-brutal-blue text-white border-2 border-brutal-black rounded-xl shadow-brutal-sm w-fit mb-4">
                  <Bell size={24} />
                </div>
                <h3 className="text-lg font-black uppercase text-brutal-black mb-2">
                  📢 Notifikasi Bot 360°
                </h3>
                <p className="text-xs font-bold text-gray-650 leading-relaxed">
                  Sambungkan Discord Webhook dan Telegram Bot dalam hitungan detik. Setiap pergantian status tugas atau komentar baru akan didistribusikan langsung ke grup tim secara akurat.
                </p>
              </div>
            </BrutalCard>

            {/* Feature 4 */}
            <BrutalCard className="md:col-span-2 bg-white flex flex-col justify-between" interactive>
              <div>
                <div className="p-3 bg-brutal-orange text-white border-2 border-brutal-black rounded-xl shadow-brutal-sm w-fit mb-4">
                  <Mail size={24} />
                </div>
                <h3 className="text-lg font-black uppercase text-brutal-black mb-2">
                  ✉️ Laporan Eksekutif Gmail
                </h3>
                <p className="text-xs font-bold text-gray-650 leading-relaxed">
                  Kirimkan pembaruan status resmi dan ringkasan eksekutif ke kotak masuk Gmail klien/stakeholder Anda secara terjadwal. Laporan rapi dan profesional yang dihasilkan otomatis oleh sistem.
                </p>
              </div>
            </BrutalCard>

            {/* Feature 5 */}
            <BrutalCard className="md:col-span-2 bg-white flex flex-col justify-between" interactive>
              <div>
                <div className="p-3 bg-brutal-mint text-brutal-black border-2 border-brutal-black rounded-xl shadow-brutal-sm w-fit mb-4">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-black uppercase text-brutal-black mb-2">
                  👥 Beban Kerja Tim Aktual
                </h3>
                <p className="text-xs font-bold text-gray-650 leading-relaxed">
                  Pantau kontribusi seluruh anggota tim dalam satu panel visual terintegrasi. Distribusikan tugas secara adil guna menjaga produktivitas dan kepuasan tim pengembang.
                </p>
              </div>
            </BrutalCard>

          </div>
        </section>

        {/* Dynamic Role Switcher */}
        <section id="peran" className="w-full pt-16 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-brutal-black">
              Dirancang Relevan untuk Setiap Peran
            </h2>
            <p className="text-sm font-bold text-gray-600 max-w-xl mx-auto">
              Sesuaikan antarmuka dan manfaat utama yang Anda butuhkan sesuai peran pekerjaan Anda.
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {(Object.keys(rolesData) as Array<keyof typeof rolesData>).map((key) => {
              const isActive = activeRole === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveRole(key)}
                  className={`px-5 py-3 border-2 border-brutal-black rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none
                    ${isActive ? "bg-brutal-black text-white" : "bg-white text-brutal-black hover:bg-brutal-soft-bg"}`}
                >
                  {rolesData[key].title}
                </button>
              );
            })}
          </div>

          {/* Role Benefit Card */}
          <div className="w-full max-w-4xl mx-auto">
            <BrutalCard variant={rolesData[activeRole].cardColor} className="text-left border-4 border-brutal-black p-6 md:p-10 shadow-brutal-lg transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                
                {/* Intro Left */}
                <div className="md:w-1/2 space-y-4">
                  <span className={`inline-block px-3 py-1 text-[9px] font-black border border-brutal-black rounded uppercase tracking-wider text-brutal-black ${rolesData[activeRole].badgeBg}`}>
                    {rolesData[activeRole].badge}
                  </span>
                  <h3 className="text-2xl md:text-4xl font-black uppercase leading-tight text-brutal-black">
                    {rolesData[activeRole].title}
                  </h3>
                  <p className="text-xs md:text-sm font-bold text-gray-800 leading-relaxed">
                    {rolesData[activeRole].desc}
                  </p>
                  
                  <div className="pt-4 hidden md:block">
                    <Link href="/dashboard">
                      <BrutalButton variant="secondary" className="uppercase font-black text-xs px-6 py-3 shadow-brutal-sm">
                        {rolesData[activeRole].cta}
                      </BrutalButton>
                    </Link>
                  </div>
                </div>

                {/* Benefits Right */}
                <div className="md:w-1/2 space-y-6 w-full">
                  <div className="font-heading font-black text-xs uppercase text-gray-500 tracking-wider">Manfaat Unggulan:</div>
                  
                  <div className="space-y-4">
                    {rolesData[activeRole].benefits.map((benefit, i) => (
                      <div key={i} className="bg-white border-2 border-brutal-black p-4 rounded-xl shadow-brutal-sm">
                        <h4 className="font-black text-sm uppercase text-brutal-black flex items-center gap-2">
                          <CheckCircle size={16} className="text-brutal-mint fill-current shrink-0" />
                          {benefit.title}
                        </h4>
                        <p className="text-xs font-bold text-gray-600 mt-1.5 leading-relaxed">
                          {benefit.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 md:hidden">
                    <Link href="/dashboard" className="w-full">
                      <BrutalButton variant="secondary" className="w-full uppercase font-black text-xs py-3.5 shadow-brutal-sm">
                        {rolesData[activeRole].cta}
                      </BrutalButton>
                    </Link>
                  </div>
                </div>

              </div>
            </BrutalCard>
          </div>
        </section>

        {/* Workflow Timeline */}
        <section id="alur" className="w-full pt-16 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-brutal-black">
              Alur Kerja Cepat & Mulus
            </h2>
            <p className="text-sm font-bold text-gray-600 max-w-xl mx-auto">
              Proses kolaborasi berkecepatan tinggi yang dirancang bebas hambatan komunikasi birokrasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full text-left">
            <BrutalCard variant="flat" className="border-2 border-brutal-black bg-white flex flex-col justify-between">
              <div>
                <span className="font-space font-black text-3xl text-brutal-blue">01</span>
                <h4 className="text-base font-black uppercase text-brutal-black mt-2 mb-1.5">Buat Workspace</h4>
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  Definisikan ruang kerja baru bagi agensi, perusahaan, atau proyek sampingan Anda dalam hitungan detik.
                </p>
              </div>
            </BrutalCard>

            <BrutalCard variant="flat" className="border-2 border-brutal-black bg-white flex flex-col justify-between">
              <div>
                <span className="font-space font-black text-3xl text-brutal-purple">02</span>
                <h4 className="text-base font-black uppercase text-brutal-black mt-2 mb-1.5">Otomatiskan AI</h4>
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  Masukkan deskripsi kasar proyek Anda, biarkan AI Gemini menyusun rencana taktis berupa milestones dan tugas terdistribusi.
                </p>
              </div>
            </BrutalCard>

            <BrutalCard variant="flat" className="border-2 border-brutal-black bg-white flex flex-col justify-between">
              <div>
                <span className="font-space font-black text-3xl text-brutal-coral">03</span>
                <h4 className="text-base font-black uppercase text-brutal-black mt-2 mb-1.5">Koneksi Kanal</h4>
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  Sambungkan webhook Discord atau bot Telegram tim Anda untuk mendistribusikan update status tugas secara real-time.
                </p>
              </div>
            </BrutalCard>

            <BrutalCard variant="flat" className="border-2 border-brutal-black bg-white flex flex-col justify-between">
              <div>
                <span className="font-space font-black text-3xl text-brutal-mint">04</span>
                <h4 className="text-base font-black uppercase text-brutal-black mt-2 mb-1.5">Pantau Risiko</h4>
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  Pantau dasbor eksekutif untuk melihat kesehatan operasional, status tugas, dan laporan risiko berkala langsung dari AI.
                </p>
              </div>
            </BrutalCard>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full pt-16 max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-brutal-black">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-sm font-bold text-gray-600">
              Berikut jawaban atas beberapa pertanyaan umum tentang CodeIn Project Management.
            </p>
          </div>

          <div className="space-y-4 text-left w-full">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-white border-2 border-brutal-black rounded-2xl shadow-brutal-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between font-black text-xs md:text-sm uppercase tracking-wide text-brutal-black bg-white hover:bg-brutal-soft-bg transition-colors"
                  >
                    <span className="text-left leading-relaxed">{faq.question}</span>
                    <span className="bg-brutal-black text-white p-1 border-2 border-brutal-black rounded-lg ml-3">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 py-4 bg-brutal-soft-bg/40 border-t-2 border-brutal-black text-xs md:text-sm font-bold text-gray-700 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner Bottom */}
        <section className="w-full pt-12">
          <BrutalCard variant="highlight" className="w-full border-4 border-brutal-black bg-brutal-yellow p-8 md:p-14 shadow-brutal-xl rounded-2xl text-center space-y-6">
            <h2 className="text-3xl md:text-6xl font-black uppercase leading-tight tracking-tight text-brutal-black">
              Siap Bekerja Lebih Cepat & Cerdas?
            </h2>
            <p className="text-xs md:text-base font-bold text-brutal-black max-w-xl mx-auto leading-relaxed">
              Mulai buat workspace Anda hari ini, undang anggota tim, dan serahkan tugas-tugas administratif yang melelahkan kepada asisten AI kami.
            </p>
            <div className="pt-4 flex justify-center">
              <Link href="/dashboard">
                <BrutalButton variant="primary" size="lg" className="uppercase tracking-wider font-black px-10 py-4 shadow-brutal-md text-sm bg-brutal-black text-white border-2 border-white hover:bg-brutal-charcoal">
                  Mulai Gunakan Sekarang
                </BrutalButton>
              </Link>
            </div>
          </BrutalCard>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t-4 border-brutal-black bg-brutal-black text-white flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-6 font-bold text-xs uppercase tracking-wider gap-4">
        <div>
          CODEIN © {new Date().getFullYear()} - OPERATING WITH FULL INTEGRITY
        </div>
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brutal-mint inline-block" />
            SISTEM AKTIF 100%
          </span>
          <span className="text-gray-400">NEXT.JS + GEMINI AI + SUPABASE</span>
        </div>
      </footer>

    </div>
  );
}
