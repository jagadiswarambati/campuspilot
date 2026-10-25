"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Briefcase,
  Compass,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { CampusRole } from "@/types";
import { useProfile } from "./ProfileContext";
import { useToast } from "./Toast";

interface RoleOption {
  id: CampusRole;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  focusHighlights: string[];
  gradient: string;
  borderAccent: string;
}

const ROLES: RoleOption[] = [
  {
    id: "Student",
    title: "Student",
    badge: "Classes & Break Planning",
    icon: GraduationCap,
    description: "Coordinate lecture breaks, print lab manuals, express canteen pickup, and attendance targets.",
    focusHighlights: ["Break time coordinator", "Print & meal bundling", "Attendance tracker"],
    gradient: "from-violet-600/20 via-slate-900 to-navy-950",
    borderAccent: "border-violet-500",
  },
  {
    id: "Faculty",
    title: "Faculty",
    badge: "Teaching & Academic",
    icon: BookOpen,
    description: "Manage teaching schedules, classroom locations, high-volume document printing, and faculty dining.",
    focusHighlights: ["Teaching timetable", "Classroom directions", "Exam print orders"],
    gradient: "from-indigo-600/20 via-slate-900 to-navy-950",
    borderAccent: "border-indigo-500",
  },
  {
    id: "Administrator",
    title: "Administrator",
    badge: "Operations & Facilities",
    icon: ShieldCheck,
    description: "Monitor campus service queues, print hub operations, food court availability, and general facility status.",
    focusHighlights: ["Print queue load", "Canteen service times", "Operational metrics"],
    gradient: "from-pink-600/20 via-slate-900 to-navy-950",
    borderAccent: "border-pink-500",
  },
  {
    id: "Other College Staff",
    title: "Other College Staff",
    badge: "Campus Services",
    icon: Briefcase,
    description: "Streamline daily campus routines, staff food pickup, administrative printouts, and location lookup.",
    focusHighlights: ["Staff meal prep", "Express printouts", "Campus errands"],
    gradient: "from-amber-600/20 via-slate-900 to-navy-950",
    borderAccent: "border-amber-500",
  },
  {
    id: "Other",
    title: "Other",
    badge: "General Campus",
    icon: Compass,
    description: "A flexible, all-in-one campus navigation, print shop access, dining discovery, and scheduling dashboard.",
    focusHighlights: ["General timetable", "Campus amenities", "Quick requests"],
    gradient: "from-emerald-600/20 via-slate-900 to-navy-950",
    borderAccent: "border-emerald-500",
  },
];

export function RoleOnboardingModal() {
  const { onboardingCompleted, updateRole } = useProfile();
  const { success, error } = useToast();
  const [selectedRole, setSelectedRole] = useState<CampusRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already completed onboarding, do not show
  if (onboardingCompleted) {
    return null;
  }

  const handleContinue = async () => {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      const ok = await updateRole(selectedRole, true);
      if (ok) {
        success("Role Configured", `Welcome! Your experience is tailored for ${selectedRole}.`);
      } else {
        throw new Error("Could not save selected role");
      }
    } catch (err: any) {
      error("Onboarding Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl my-auto p-6 sm:p-8 bg-navy-900 border border-slate-700/80 rounded-3xl shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/80 text-violet-300 border border-violet-800/60 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Welcome to CampusPilot AI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How do you use your campus?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Select your primary role so we can personalize your dashboard widgets, timetable priorities, and campus break recommendations.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between text-left group ${
                  isSelected
                    ? `bg-slate-800/90 ${role.borderAccent} shadow-glow ring-1 ring-violet-500/50 scale-[1.02]`
                    : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? "bg-violet-600 text-white"
                          : "bg-slate-800 text-slate-300 group-hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "border-violet-400 bg-violet-600 text-white"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      {role.title}
                    </h3>
                    <span className="text-[10px] font-mono text-violet-300 font-medium">
                      {role.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                {/* Highlights tags */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-wrap gap-1">
                  {role.focusHighlights.map((hl, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/70 text-slate-400"
                    >
                      {hl}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Notice */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Personalization Notice:</strong> Role selection customizes your view and recommended workflows. It does not act as an authorization gate or grant restricted administrative privileges. You can freely change this role anytime in Profile & Settings.
          </span>
        </div>

        {/* Continue Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-mono">
            {selectedRole ? `Selected: ${selectedRole}` : "Please select a role above to proceed"}
          </span>

          <button
            onClick={handleContinue}
            disabled={!selectedRole || submitting}
            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-glow transition-all"
          >
            {submitting ? (
              <span>Saving Role...</span>
            ) : (
              <>
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
