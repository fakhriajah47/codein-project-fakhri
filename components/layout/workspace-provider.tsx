"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Workspace, WorkspaceRole } from "@/types";
import { LoadingState } from "@/components/shared/loading-state";

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  workspaceRole: WorkspaceRole | null;
  loading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async (shouldSelectDefault = true) => {
    try {
      const response = await fetch("/api/workspaces");
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setLoading(false);
        return;
      }

      const list: Workspace[] = resData.data;
      setWorkspaces(list);

      if (list.length === 0) {
        // Redirect to onboarding if no workspaces exist
        if (pathname !== "/onboarding") {
          router.push("/onboarding");
        }
        setLoading(false);
        return;
      }

      if (shouldSelectDefault) {
        // Select active workspace
        const storedId = localStorage.getItem("active_workspace_id");
        const matched = list.find((w) => w.id === storedId);
        const active = matched || list[0];
        
        setActiveWorkspace(active);
        localStorage.setItem("active_workspace_id", active.id);
        
        // Fetch role for active workspace
        await fetchRole(active.id);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRole = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/role`);
      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setWorkspaceRole(resData.data.role);
          return;
        }
      }
      setWorkspaceRole("viewer"); // Fallback safety role
    } catch (err) {
      console.error("Failed to fetch member role:", err);
      setWorkspaceRole("viewer");
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const matched = workspaces.find((w) => w.id === workspaceId);
    if (matched) {
      setLoading(true);
      setActiveWorkspace(matched);
      localStorage.setItem("active_workspace_id", matched.id);
      fetchRole(matched.id).then(() => {
        setLoading(false);
        router.refresh();
      });
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchWorkspaces();
  }, [pathname]);

  const refreshWorkspaces = async () => {
    await fetchWorkspaces(false);
  };

  if (loading) {
    return <LoadingState message="Configuring control deck..." />;
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        workspaceRole,
        loading,
        switchWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
