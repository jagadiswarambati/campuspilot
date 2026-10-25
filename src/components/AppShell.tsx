"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { ToastProvider } from "./Toast";
import { ProfileProvider } from "./ProfileContext";
import { RoleOnboardingModal } from "./RoleOnboardingModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("cp_sidebar_collapsed");
      setCollapsed(saved === "true");
    };

    handleStorage();
    window.addEventListener("storage", handleStorage);

    // Watch for click events on collapse toggle
    const interval = setInterval(handleStorage, 400);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <ProfileProvider>
      <ToastProvider>
        <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-violet-500/30 selection:text-violet-200">
          {/* Role selection onboarding modal for new users */}
          <RoleOnboardingModal />

          {/* Left fixed / collapsible sidebar */}
          <Sidebar />

          {/* Main content area automatically adjusted to sidebar width */}
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
              collapsed ? "lg:pl-20" : "lg:pl-64"
            }`}
          >
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </main>

            <footer className="border-t border-slate-800/60 py-6 px-4 sm:px-8 bg-navy-950/80 text-xs text-slate-500">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-400">CampusPilot AI</span>
                  <span>—</span>
                  <span>Intelligently coordinated college days</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Google Gemma 4 • Pure Deterministic Scheduling • Multi-Agent Architecture
                </div>
              </div>
            </footer>
          </div>
        </div>
      </ToastProvider>
    </ProfileProvider>
  );
}
