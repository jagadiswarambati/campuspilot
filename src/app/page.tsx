"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Printer,
  Utensils,
  ArrowRight,
  Send,
  Calendar,
  CheckCircle2,
  Package,
  CheckCheck,
  AlertCircle,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Briefcase,
  Compass,
  Layers,
  ChevronRight,
  Activity,
} from "lucide-react";
import { PlanCard } from "@/components/PlanCard";
import { CoordinatedPlan, TimetableClass, PrintOrder, FoodOrder, PrintShop, Canteen } from "@/types";
import { useProfile } from "@/components/ProfileContext";
import { useToast } from "@/components/Toast";

export default function TodayDashboard() {
  const { role, profile, resetOnboarding } = useProfile();
  const { success, error } = useToast();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<CoordinatedPlan | null>(null);

  // Dashboard data
  const [timetable, setTimetable] = useState<TimetableClass[]>([]);
  const [nextClassInfo, setNextClassInfo] = useState<any>(null);
  const [printOrders, setPrintOrders] = useState<PrintOrder[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [printShops, setPrintShops] = useState<PrintShop[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [currentTimeStr, setCurrentTimeStr] = useState("12:00 PM");

  const loadDashboardData = async () => {
    try {
      const [tRes, pRes, fRes, sRes, mRes] = await Promise.all([
        fetch("/api/timetable"),
        fetch("/api/print/orders"),
        fetch("/api/canteen/orders"),
        fetch("/api/print/shops"),
        fetch("/api/canteen/menu"),
      ]);

      const tData = await tRes.json();
      const pData = await pRes.json();
      const fData = await fRes.json();
      const sData = await sRes.json();
      const mData = await mRes.json();

      setTimetable(tData.classes || []);
      setNextClassInfo(tData.nextClassInfo);
      setPrintOrders(pData.orders || []);
      setFoodOrders(fData.orders || []);
      setPrintShops(sData.shops || []);
      setCanteens(mData.canteens || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const now = new Date();
    setCurrentTimeStr(
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }, []);

  const handleCoordinate = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || prompt;
    if (!textToSubmit.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSubmit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");

      setActivePlan(data.plan);
      if (data.plan.isFeasible) {
        success("Coordinated Plan Ready", "Review the timeline sequence and click confirm.");
      } else {
        error("Schedule Conflict", "The requested activities cannot fit safely into the break.");
      }
    } catch (err: any) {
      error("Planning Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const sampleScenarios = [
    {
      label: "35m Break: Lunch & 25p Print",
      text: "I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed. Find the fastest plan that fits my budget and won't make me late.",
    },
    {
      label: "Tight 12m: Infeasible Demo",
      text: "I have only 12 minutes before class. Need 50 pages printed in color and a lunch thali.",
    },
    {
      label: "Quick 20m: Coffee & Print",
      text: "I have 20 minutes before class. Print 10 pages double-sided and grab an iced cold coffee.",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {/* Top Banner / Role Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome, {profile?.name || "Alex Chen"}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-violet-950 text-violet-300 border border-violet-800/60 flex items-center gap-1">
              {role === "Faculty" && <BookOpen className="w-3 h-3 text-cyan-400" />}
              {role === "Administrator" && <ShieldCheck className="w-3 h-3 text-pink-400" />}
              {role === "Other College Staff" && <Briefcase className="w-3 h-3 text-amber-400" />}
              {role === "Other" && <Compass className="w-3 h-3 text-emerald-400" />}
              {role === "Student" && <GraduationCap className="w-3 h-3 text-violet-400" />}
              <span>{role}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {role === "Faculty" && "Faculty Academic Dashboard • Teaching Schedule & Services"}
            {role === "Administrator" && "Campus Operations Dashboard • Service Queue & Facility Status"}
            {role === "Other College Staff" && "Campus Staff Dashboard • Daily Tasks & Service Coordination"}
            {role === "Other" && "Campus Overview Dashboard • Flexible Navigation & Coordination"}
            {role === "Student" && "Student Dashboard • Timetable, Lecture Breaks & Activity Coordination"}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>{currentTimeStr}</span>
          </div>
          <button
            onClick={() => resetOnboarding()}
            className="text-[11px] font-mono text-violet-400 hover:text-violet-300 transition-colors"
          >
            Switch Role
          </button>
        </div>
      </div>

      {/* Priority Widget Grid (Role-Tailored) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Primary Schedule Focus */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-850 to-slate-900 border border-slate-800 shadow-glass flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-violet-400 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {role === "Faculty" ? "Next Lecture to Conduct" : "Upcoming Class & Break"}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                In 35 Minutes
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {nextClassInfo?.nextClass?.subjectName || "Operating Systems Lecture"}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="font-mono text-violet-300 font-semibold">
                  {nextClassInfo?.nextClass?.subjectCode || "CS302"}
                </span>
                <span>•</span>
                <span>{nextClassInfo?.nextClass?.room || "Auditorium A-01"}</span>
                <span>•</span>
                <span>{nextClassInfo?.nextClass?.building || "Block A - Science & Computing"}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>35m Break Window (12:00 – 12:35)</span>
            </span>
            <span className="text-slate-500">
              5m safety buffer reserved
            </span>
          </div>
        </div>

        {/* Card 2: Quick Service Status */}
        <div className="p-5 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Live Campus Services
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="flex items-center gap-2 text-slate-300">
                <Printer className="w-3.5 h-3.5 text-violet-400" />
                Library Print Center
              </span>
              <span className="font-mono text-slate-400 text-[11px]">~4m wait (40p)</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="flex items-center gap-2 text-slate-300">
                <Utensils className="w-3.5 h-3.5 text-pink-400" />
                SAC Food Court
              </span>
              <span className="font-mono text-slate-400 text-[11px]">~3m wait</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
            <Link href="/print" className="text-violet-400 hover:text-violet-300 font-medium">
              Open Print Hub →
            </Link>
            <Link href="/canteen" className="text-pink-400 hover:text-pink-300 font-medium">
              View Menu →
            </Link>
          </div>
        </div>
      </div>

      {/* Central Campus-Coordination Assistant (Primary Feature) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-navy-900/95 border border-violet-500/30 shadow-glow space-y-4">
        <div>
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CampusPilot Multi-Agent Orchestrator</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Coordinate your campus break without being late
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Tell the orchestrator what you need before class. Specialists in printing, canteen food, and campus walking times will assemble a single guaranteed schedule.
          </p>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCoordinate()}
            placeholder="e.g. I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            onClick={() => handleCoordinate()}
            disabled={loading || !prompt.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs shadow-glow transition-all whitespace-nowrap"
          >
            {loading ? (
              <span>Evaluating...</span>
            ) : (
              <>
                <span>Coordinate Plan</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Scenario Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 font-mono">Test scenarios:</span>
          {sampleScenarios.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(s.text);
                handleCoordinate(s.text);
              }}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 hover:bg-violet-900/40 text-slate-300 hover:text-violet-200 border border-slate-700/60 font-mono transition-all text-left"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Coordinated Plan Display */}
      {activePlan && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Consolidated Proposal
            </h3>
            <button
              onClick={() => setActivePlan(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <PlanCard
            plan={activePlan}
            onPlanConfirmed={() => {
              loadDashboardData();
            }}
          />
        </div>
      )}

      {/* Role-Specific Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1 & 2: Schedule / Operations */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-white text-sm">
                {role === "Faculty"
                  ? "Today's Teaching Schedule"
                  : role === "Administrator"
                  ? "Active Facility Schedule"
                  : "Today's Timetable"}
              </h3>
            </div>
            <Link
              href="/timetable"
              className="text-xs text-violet-400 hover:text-violet-300 font-medium"
            >
              Full Timetable →
            </Link>
          </div>

          <div className="space-y-2.5">
            {timetable.slice(0, 3).map((cls, idx) => (
              <div
                key={cls.id || idx}
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-8 rounded-full"
                    style={{ backgroundColor: cls.color || "#8b5cf6" }}
                  />
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs">
                      {cls.subjectCode} — {cls.subjectName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {cls.room} • {cls.instructor}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs text-violet-300 font-semibold">
                  {cls.startTime} – {cls.endTime}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Active Orders & Role Quick Links */}
        <div className="p-5 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-pink-400" />
              <h3 className="font-bold text-white text-sm">Active Simulated Orders</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {printOrders.length + foodOrders.length}
            </span>
          </div>

          {printOrders.length === 0 && foodOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-slate-600 mx-auto" />
              <p>No active orders</p>
              <p className="text-[10px]">Confirmed plans will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {printOrders.slice(0, 2).map((o) => (
                <div
                  key={o.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-violet-500/20 text-xs space-y-1"
                >
                  <div className="flex justify-between font-semibold">
                    <span className="text-violet-300 font-mono text-[11px]">{o.id}</span>
                    <span className="text-emerald-400 font-mono">₹{o.totalCost}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{o.documentName}</div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{o.shopName}</span>
                    <span className="font-mono text-violet-400">{o.status}</span>
                  </div>
                </div>
              ))}

              {foodOrders.slice(0, 2).map((o) => (
                <div
                  key={o.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-pink-500/20 text-xs space-y-1"
                >
                  <div className="flex justify-between font-semibold">
                    <span className="text-pink-300 font-mono text-[11px]">{o.id}</span>
                    <span className="text-emerald-400 font-mono">₹{o.totalCost}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{o.canteenName}</span>
                    <span className="font-mono text-pink-400">{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
