"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  FileText,
  Settings2,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, setCollapsed, className }) => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard Utama", href: "/dashboard", icon: LayoutDashboard },
    { name: "Katalog Proyek", href: "/projects", icon: FolderKanban },
    { name: "Pekerjaan Saya", href: "/my-work", icon: CheckSquare },
    { name: "Laporan Eksekutif", href: "/reports", icon: FileText },
    { name: "Integrasi Sistem", href: "/integrations", icon: Settings2 },
    { name: "Log Aktivitas", href: "/activity", icon: History },
  ];

  return (
    <aside
      className={`bg-white border-r-4 border-brutal-black flex flex-col transition-all duration-300 z-20 ${
        collapsed ? "w-20" : "w-64"
      } ${className || ""}`}
    >
      {/* Logo Area */}
      <div className="h-16 border-b-4 border-brutal-black flex items-center justify-between px-4 bg-brutal-yellow">
        {!collapsed && (
          <span className="font-heading font-black text-xl uppercase tracking-tight text-brutal-black">
            Project Management
          </span>
        )}
        {collapsed && (
          <span className="font-heading font-black text-xl text-brutal-black mx-auto">
            PM
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="border-2 border-brutal-black p-1 bg-white hover:bg-gray-100 rounded-lg cursor-pointer"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all font-bold ${
                isActive
                  ? "bg-brutal-blue text-white border-brutal-black shadow-brutal-sm translate-x-0.5 translate-y-0.5"
                  : "bg-white text-brutal-black border-transparent hover:border-brutal-black hover:bg-brutal-soft-bg"
              }`}
              title={item.name}
            >
              <Icon size={22} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      {!collapsed && (
        <div className="p-4 border-t-4 border-brutal-black bg-brutal-soft-bg text-center font-bold text-xs uppercase text-gray-500">
          Project Management v1.0
        </div>
      )}
    </aside>
  );
};
