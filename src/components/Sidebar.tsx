"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  Bot,
  Printer,
  Utensils,
  Calendar,
  CheckCheck,
  StickyNote,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { AiStatusBadge } from "./AiStatusBadge";
import { useProfile } from "./ProfileContext";
import { useToast } from "./Toast";

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/print", label: "Print Shop", icon: Printer },
  { href: "/canteen", label: "Canteen", icon: Utensils },
  { href: "/timetable", label: "Timetable", icon: Calendar },
  { href: "/attendance", label: "Attendance", icon: CheckCheck },
  { href: "/notes", label: "Notes & Tasks", icon: StickyNote },
  { href: "/profile", label: "Profile & Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, profile, resetOnboarding } = useProfile();
  const { success, error } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Restore collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cp_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("cp_sidebar_collapsed", String(next));
  };

  const handleResetData = async () => {
    if (!confirm("Reset all campus demo data back to default factory state?")) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset database");
      success("Demo Data Reset", "Restored default student, timetable, menu, and print shops.");
      window.location.reload();
    } catch (err: any) {
      error("Reset Failed", err.message);
    } finally {
      setResetting(false);
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case "Faculty":
        return BookOpen;
      case "Administrator":
        return ShieldCheck;
      case "Other College Staff":
        return Briefcase;
      case "Other":
        return Compass;
      case "Student":
      default:
        return GraduationCap;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 w-full h-14 bg-navy-950/90 border-b border-slate-800/80 backdrop-blur-md px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5 shadow-glow">
            <div className="w-full h-full bg-navy-950 rounded-[6px] flex items-center justify-center">
              <Compass className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
            CampusPilot <span className="text-violet-400 font-mono text-[10px] px-1 py-0.2 rounded bg-violet-950 border border-violet-800/60">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <AiStatusBadge />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg focus:outline-none"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in"
        />
      )}

      {/* Sidebar Container (Desktop fixed + Mobile slide-out drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-navy-950 border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
          collapsed ? "lg:w-20" : "lg:w-64"
        } ${
          mobileOpen
            ? "translate-x-0 w-72 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 flex-shrink-0">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 p-0.5 shadow-glow flex-shrink-0">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="truncate">
                <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  CampusPilot
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/50">
                    AI
                  </span>
                </span>
                <span className="block text-[10px] text-slate-400 tracking-tight truncate">
                  College Day Coordinated
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Badge (if expanded) */}
        {(!collapsed || mobileOpen) && (
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 text-violet-400">
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">
                    {profile?.name || "Alex Chen"}
                  </div>
                  <div className="text-[10px] font-mono text-violet-300 flex items-center gap-1">
                    <span>{role} Mode</span>
                  </div>
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="text-[10px] text-slate-500 hover:text-violet-400 underline font-mono"
              >
                Change
              </Link>
            </div>
          </div>
        )}

        {/* Navigation Links (Independently scrollable) */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-violet-600/20 text-violet-200 border border-violet-500/40 font-semibold shadow-glow"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                } ${collapsed && !mobileOpen ? "justify-center px-2" : ""}`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-violet-400" : "text-slate-400"
                  }`}
                />
                {(!collapsed || mobileOpen) && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Compact Footer Status & Reset */}
        <div className="p-3 border-t border-slate-800/80 bg-navy-950/90 flex-shrink-0 space-y-2">
          {/* AI Status Badge */}
          <div className={collapsed && !mobileOpen ? "flex justify-center" : ""}>
            <AiStatusBadge />
          </div>

          {/* Reset Demo and Role Switch Shortcuts */}
          {(!collapsed || mobileOpen) ? (
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
                title="Reset Demo Data"
              >
                <RotateCcw className={`w-3 h-3 ${resetting ? "animate-spin" : ""}`} />
                <span>Reset Sandbox</span>
              </button>

              <button
                onClick={() => resetOnboarding()}
                className="hover:text-violet-400 transition-colors"
                title="Switch Campus Role"
              >
                Switch Role
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg"
                title="Reset Sandbox"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
