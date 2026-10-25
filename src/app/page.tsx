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
} from "lucide-react";
import { PlanCard } from "@/components/PlanCard";
import { CoordinatedPlan, TimetableClass, PrintOrder, FoodOrder } from "@/types";
import { useToast } from "@/components/Toast";

export default function TodayDashboard() {
  const { success, error } = useToast();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<CoordinatedPlan | null>(null);

  // Dashboard data
  const [timetable, setTimetable] = useState<TimetableClass[]>([]);
  const [nextClassInfo, setNextClassInfo] = useState<any>(null);
  const [printOrders, setPrintOrders] = useState<PrintOrder[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [currentTimeStr, setCurrentTimeStr] = useState("12:00 PM");

  const loadDashboardData = async () => {
    try {
      const [tRes, pRes, fRes] = await Promise.all([
        fetch("/api/timetable"),
        fetch("/api/print/orders"),
        fetch("/api/canteen/orders"),
      ]);

      const tData = await tRes.json();
      const pData = await pRes.json();
      const fData = await fRes.json();

      setTimetable(tData.classes || []);
      setNextClassInfo(tData.nextClassInfo);
      setPrintOrders(pData.orders || []);
      setFoodOrders(fData.orders || []);
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
      title: "Core 35m Lunch & Print (Feasible)",
      text: "I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed. Find the fastest plan that fits my budget and won't make me late.",
    },
    {
      title: "Tight 12m Break (Infeasible Demo)",
      text: "I have only 12 minutes before class. Need 50 pages printed in color and a lunch thali.",
    },
    {
      title: "Quick 20m Grab & Print",
      text: "I have 20 minutes before class. Print 10 pages double-sided and grab an iced cold coffee.",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Next Class Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Welcome & Time Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-850 to-slate-900 border border-slate-700/60 shadow-glass flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-violet-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Campus Time: {currentTimeStr} • Academic Block A</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good day, Alex! 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              CampusPilot AI is actively coordinating your schedule, print shop queues, and canteen menus to protect your breaks.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <Link
              href="/print"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-violet-400" />
              <span>Print Queue: 40 pgs (~4m)</span>
            </Link>
            <Link
              href="/canteen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
            >
              <Utensils className="w-3.5 h-3.5 text-pink-400" />
              <span>Canteen Wait: ~3m</span>
            </Link>
            <Link
              href="/attendance"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attendance: 78.6%</span>
            </Link>
          </div>
        </div>

        {/* Next Class Widget */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-950/40 via-navy-900 to-navy-850 border border-violet-800/30 shadow-glass flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-violet-300 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Next Upcoming Class
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-violet-600/30 text-violet-200 border border-violet-500/30">
                In 35 Minutes
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {nextClassInfo?.nextClass?.subjectName || "Operating Systems Lecture"}
              </h3>
              <p className="text-xs text-slate-400">
                Code: {nextClassInfo?.nextClass?.subjectCode || "CS302"} • {nextClassInfo?.nextClass?.instructor || "Dr. Marcus Bell"}
              </p>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/40 text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Room / Hall:</span>
                <span className="font-semibold text-white">
                  {nextClassInfo?.nextClass?.room || "Auditorium A-01"}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Starts At:</span>
                <span className="font-semibold text-violet-300 font-mono">
                  {nextClassInfo?.nextClass?.startTime || "12:35"} (35m break)
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-emerald-400" />
            5-minute automatic safety buffer is reserved.
          </p>
        </div>
      </div>

      {/* CORE DIFFERENTIATOR: Prominent AI Assistant Request Bar */}
      <div className="p-6 rounded-2xl bg-navy-900/95 border border-violet-500/30 shadow-glow relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2 text-violet-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
          <span>Coordinate Your Campus Break</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          What do you need to accomplish before your next class?
        </h2>
        <p className="text-xs text-slate-400 mb-4 max-w-2xl leading-relaxed">
          Ask naturally. The orchestrator checks your timetable, print shop queues, and canteen menus to generate one coordinated, time-guaranteed plan.
        </p>

        {/* Input box */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCoordinate()}
              placeholder="e.g. I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed."
              className="w-full px-4 py-3 bg-navy-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <button
            onClick={() => handleCoordinate()}
            disabled={loading || !prompt.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span>Coordinating...</span>
            ) : (
              <>
                <span>Find Plan</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Scenario Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Try test scenarios:</span>
          {sampleScenarios.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(s.text);
                handleCoordinate(s.text);
              }}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-violet-900/40 text-slate-300 hover:text-violet-200 border border-slate-700/60 hover:border-violet-500/40 transition-all font-mono"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Plan Card Display */}
      {activePlan && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Generated Coordinated Plan
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

      {/* Active Orders & Day Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Timeline */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-glass space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-white text-sm">Today&apos;s Class Schedule</h3>
            </div>
            <Link
              href="/timetable"
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium"
            >
              <span>Full Week</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {timetable.slice(0, 4).map((cls, idx) => (
              <div
                key={cls.id || idx}
                className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-10 rounded-full"
                    style={{ backgroundColor: cls.color || "#8b5cf6" }}
                  />
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs sm:text-sm">
                      {cls.subjectCode} — {cls.subjectName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {cls.room} • {cls.instructor}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-violet-300 font-semibold">{cls.startTime} - {cls.endTime}</div>
                  <div className="text-[10px] text-slate-400">{cls.building}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Orders Widget */}
        <div className="p-6 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-glass space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-pink-400" />
              <h3 className="font-bold text-white text-sm">Simulated Orders</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {printOrders.length + foodOrders.length} Total
            </span>
          </div>

          <div className="space-y-3">
            {printOrders.length === 0 && foodOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No active orders yet.</p>
                <p className="text-[11px] text-slate-500">
                  Generate and confirm a plan above to see simulated orders here!
                </p>
              </div>
            ) : (
              <>
                {printOrders.slice(0, 2).map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-slate-800/50 border border-violet-500/30 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-violet-300 flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5" />
                        {order.id}
                      </span>
                      <span className="text-emerald-400 font-mono">₹{order.totalCost}</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">{order.shopName}</div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{order.pageCount} pgs ({order.isDoubleSided ? "Duplex" : "Simplex"})</span>
                      <span className="px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 font-mono">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}

                {foodOrders.slice(0, 2).map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-slate-800/50 border border-pink-500/30 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-pink-300 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5" />
                        {order.id}
                      </span>
                      <span className="text-emerald-400 font-mono">₹{order.totalCost}</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">{order.canteenName}</div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{order.items.length} items</span>
                      <span className="px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800 font-mono">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
