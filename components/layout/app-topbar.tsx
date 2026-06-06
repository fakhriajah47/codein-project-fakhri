"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Workspace } from "@/types";
import { ChevronDown, Plus, LogOut } from "lucide-react";
import Link from "next/link";

interface AppTopbarProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onWorkspaceChange: (workspaceId: string) => void;
}

export const AppTopbar: React.FC<AppTopbarProps> = ({
  workspaces,
  activeWorkspace,
  onWorkspaceChange,
}) => {
  const router = useRouter();
  const supabase = createClient();

  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ fullName: string; email: string; jobTitle: string } | null>(null);

  const wsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wsRef.current && !wsRef.current.contains(event.target as Node)) {
        setWsDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch current profile details
  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        setUserProfile({
          fullName: profile?.full_name || user.email?.split("@")[0] || "Pengguna",
          email: user.email || "",
          jobTitle: profile?.job_title || "Anggota Tim",
        });
      }
    }
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("active_workspace_id");
    router.push("/login");
    router.refresh();
  };

  const initials = userProfile?.fullName
    ? userProfile.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "P";

  return (
    <header className="h-16 bg-white border-b-4 border-brutal-black flex items-center justify-between px-6 z-10">
      {/* Workspace Switcher */}
      <div className="relative" ref={wsRef}>
        <button
          onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
          className="flex items-center gap-2 border-2 border-brutal-black px-4 py-1.5 bg-white rounded-xl shadow-brutal-xs hover:shadow-brutal-sm cursor-pointer font-black text-sm uppercase transition-all"
        >
          <span>{activeWorkspace?.name || "Pilih Ruang Kerja"}</span>
          <ChevronDown size={16} />
        </button>

        {wsDropdownOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-white border-2 border-brutal-black rounded-xl shadow-brutal-md py-2 z-30">
            <div className="px-3 py-1 text-xs font-black uppercase text-gray-400 border-b border-gray-100 pb-1 mb-1">
              Ganti Ruang Kerja
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  onWorkspaceChange(ws.id);
                  setWsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm font-bold block hover:bg-brutal-soft-bg ${
                  ws.id === activeWorkspace?.id ? "text-brutal-blue font-black" : "text-brutal-black"
                }`}
              >
                {ws.name}
              </button>
            ))}
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-4 py-2 mt-1 border-t-2 border-dashed border-gray-100 text-xs font-black uppercase text-brutal-blue hover:bg-brutal-soft-bg"
            >
              <Plus size={14} />
              Ruang Kerja Baru
            </Link>
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* User Account Popover */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 border-2 border-brutal-black p-0.5 bg-white rounded-full shadow-brutal-xs hover:shadow-brutal-sm cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-brutal-mint border-2 border-brutal-black flex items-center justify-center font-black text-sm text-brutal-black">
              {initials}
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-brutal-black rounded-xl shadow-brutal-md py-2 z-30">
              <div className="px-4 py-2 border-b-2 border-dashed border-gray-200">
                <div className="font-black text-sm text-brutal-black truncate">
                  {userProfile?.fullName}
                </div>
                <div className="text-xs font-bold text-gray-500 truncate">
                  {userProfile?.email}
                </div>
                <div className="text-xs font-bold bg-brutal-purple/30 text-brutal-black px-1.5 py-0.5 rounded border border-brutal-black inline-block mt-1 uppercase">
                  {userProfile?.jobTitle}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm font-bold text-brutal-coral hover:bg-brutal-soft-bg flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
