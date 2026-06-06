"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { WorkspaceProvider, useWorkspace } from "@/components/layout/workspace-provider";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-brutal-soft-bg font-sans">
      {/* Sidebar Navigation */}
      <AppSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Command Window */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Workspace Selector & Account */}
        <AppTopbar
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={switchWorkspace}
        />

        {/* Dashboard Pages Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
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
