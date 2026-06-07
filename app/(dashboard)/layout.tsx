"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { WorkspaceProvider, useWorkspace } from "@/components/layout/workspace-provider";

import { X } from "lucide-react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-brutal-soft-bg font-sans">
      {/* Sidebar Navigation - Desktop only */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        className="hidden md:flex shrink-0"
      />

      {/* Sidebar Navigation - Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-white border-r-4 border-brutal-black z-10 animate-in slide-in-from-left duration-200">
            <AppSidebar
              collapsed={false}
              setCollapsed={() => {}}
              className="w-full h-full border-r-0"
            />
            {/* Close button in drawer */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 border-2 border-brutal-black p-1.5 bg-white hover:bg-gray-100 rounded-xl shadow-brutal-xs z-50 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Command Window */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Workspace Selector & Account */}
        <AppTopbar
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={switchWorkspace}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        {/* Dashboard Pages Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </WorkspaceProvider>
  );
}
