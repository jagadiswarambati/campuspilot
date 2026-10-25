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
} from "lucide-react";
import { StudentProfile } from "@/types";
import { useToast } from "@/components/Toast";

export default function ProfilePage() {
  const { success, error } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
          dietaryPreferences,
          defaultBudget,
          preferredCampusLocation,
          safetyBufferMinutes,
          theme: "dark",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      success("Profile Updated", "Your preferences will guide future AI coordinated plans.");
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-violet-400" />
          Student Profile & AI Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure default safety margins, dietary needs, budget constraints, and Gemma 4 model settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form settings */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            Personal & Scheduling Preferences
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-slate-400 mb-1 font-medium">Student Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Default Campus Starting Location
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
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
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
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The Deterministic Scheduling Engine reserves this buffer before every class to guarantee you arrive before the lecturer closes the door.
              </p>
            </div>

            {/* Dietary preferences */}
            <div className="space-y-2 pt-2">
              <label className="block text-slate-400 font-medium">Dietary Filters</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVegetarian}
                    onChange={(e) => setIsVegetarian(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-violet-600 focus:ring-0"
                  />
                  <span className="text-slate-200">🌱 Vegetarian Preferred</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVegan}
                    onChange={(e) => setIsVegan(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-violet-600 focus:ring-0"
                  />
                  <span className="text-slate-200">🍃 Vegan Only</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-glow transition-all"
              >
                {loading ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        </div>

        {/* AI & System Settings Sidebar */}
        <div className="space-y-4">
          {/* Gemma 4 Instructions Box */}
          <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Gemma 4 Configuration
            </h3>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                To enable live Gemma 4 model inference instead of Demo Mode:
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-violet-300 space-y-1">
                <div>File: <span className="text-white">.env.local</span></div>
                <div>GEMINI_API_KEY=your_key_here</div>
                <div>DEMO_MODE=false</div>
              </div>
              <p className="text-[11px] text-slate-400">
                The key is strictly read server-side and never exposed to the client browser.
              </p>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Reset Demo Sandbox
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Restores seed timetable, 35-minute break scenario, print shop queues, and canteen menus to their pristine demonstration state.
            </p>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 text-xs font-semibold transition-all"
            >
              {resetting ? "Resetting Database..." : "Reset All Demo Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
