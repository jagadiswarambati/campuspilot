"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Shield,
  Coins,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bot,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Briefcase,
  Compass,
  Info,
} from "lucide-react";
import { StudentProfile, CampusRole } from "@/types";
import { useProfile } from "@/components/ProfileContext";
import { useToast } from "@/components/Toast";

export default function ProfilePage() {
  const { role, updateRole, resetOnboarding } = useProfile();
  const { success, error } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<CampusRole>("Student");
  const [defaultBudget, setDefaultBudget] = useState(250);
  const [preferredCampusLocation, setPreferredCampusLocation] = useState("loc-block-a");
  const [safetyBufferMinutes, setSafetyBufferMinutes] = useState(5);
  const [isVegetarian, setIsVegetarian] = useState(true);
  const [isVegan, setIsVegan] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setName(data.profile.name);
        setEmail(data.profile.email);
        setSelectedRole(data.profile.role || "Student");
        setDefaultBudget(data.profile.defaultBudget);
        setPreferredCampusLocation(data.profile.preferredCampusLocation);
        setSafetyBufferMinutes(data.profile.safetyBufferMinutes);
        setIsVegetarian(data.profile.dietaryPreferences.includes("Vegetarian"));
        setIsVegan(data.profile.dietaryPreferences.includes("Vegan"));
      }
    } catch (err: any) {
      error("Profile Load Error", err.message);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dietaryPreferences: string[] = [];
      if (isVegetarian) dietaryPreferences.push("Vegetarian");
      if (isVegan) dietaryPreferences.push("Vegan");

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role: selectedRole,
          dietaryPreferences,
          defaultBudget,
          preferredCampusLocation,
          safetyBufferMinutes,
          theme: "dark",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      await updateRole(selectedRole, true);
      success("Profile Updated", "Preferences saved.");
      loadProfile();
    } catch (err: any) {
      error("Save Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all campus demo data back to factory defaults?")) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset database");
      success("Demo Data Reset", "Restored default student, timetable, menu, and print shops.");
      window.location.reload();
    } catch (err: any) {
      error("Reset Error", err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-400" />
          Settings & Role Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your campus role, scheduling safety margins, dietary preferences, and system defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            Profile Configuration
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Campus Role Selection */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-slate-300 font-semibold">Campus Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as CampusRole)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-violet-500"
              >
                <option value="Student">Student (Classes, Attendance, Printing & Break Coordination)</option>
                <option value="Faculty">Faculty (Teaching Schedule, Classroom Locations & Print Orders)</option>
                <option value="Administrator">Administrator (Facility Status, Print Queues & Operations)</option>
                <option value="Other College Staff">Other College Staff (Daily Routine, Staff Dining & Printing)</option>
                <option value="Other">Other (General Campus Experience)</option>
              </select>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Role selection personalizes your dashboard view and priority widgets. It does not grant security privileges.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Campus Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Default Break Budget (₹)
                </label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  required
                  value={defaultBudget}
                  onChange={(e) => setDefaultBudget(parseInt(e.target.value) || 200)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Default Starting Location
                </label>
                <select
                  value={preferredCampusLocation}
                  onChange={(e) => setPreferredCampusLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="loc-block-a">Academic Block A</option>
                  <option value="loc-block-b">Engineering Block B</option>
                  <option value="loc-library">Central Library</option>
                  <option value="loc-canteen">Student Activity Center</option>
                </select>
              </div>
            </div>

            {/* Safety buffer slider */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  Pre-Class Safety Buffer
                </span>
                <span className="font-mono text-violet-300 font-bold">
                  {safetyBufferMinutes} Minutes Reserved
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="1"
                value={safetyBufferMinutes}
                onChange={(e) => setSafetyBufferMinutes(parseInt(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                The scheduling algorithm reserves this buffer before classes to prevent late arrivals.
              </p>
            </div>

            {/* Dietary preferences */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-slate-400 font-medium">Dietary Filters</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVegetarian}
                    onChange={(e) => setIsVegetarian(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-violet-600 focus:ring-0"
                  />
                  <span className="text-slate-300">🌱 Vegetarian Preferred</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVegan}
                    onChange={(e) => setIsVegan(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-violet-600 focus:ring-0"
                  />
                  <span className="text-slate-300">🍃 Vegan Only</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-glow transition-all"
              >
                {loading ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Diagnostics & Reset Controls */}
        <div className="space-y-4">
          {/* Onboarding Reset Box */}
          <div className="p-5 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              Role Onboarding
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Want to see the initial welcome screen again or pick a different role?
            </p>
            <button
              onClick={() => resetOnboarding()}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Re-open Onboarding Modal
            </button>
          </div>

          {/* AI Status Card */}
          <div className="p-5 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Gemma 4 Integration
            </h3>
            <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <p>Model configured: <code className="text-violet-300 font-mono">gemma-4-26b-a4b-it</code></p>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                <div>Provider: Google AI Studio</div>
                <div>Server-Side Only: Protected</div>
              </div>
            </div>
          </div>

          {/* Reset Sandbox */}
          <div className="p-5 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Factory Reset
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reset timetable, orders, notes, and menus back to pristine demo state.
            </p>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition-colors"
            >
              {resetting ? "Resetting..." : "Reset All Demo Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
