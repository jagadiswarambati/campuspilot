"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
} from "lucide-react";
import { AttendanceRecord } from "@/types";
import { useToast } from "@/components/Toast";

interface EnrichedAttendance extends AttendanceRecord {
  currentPercentage: number;
  isTargetMet: boolean;
  classesNeeded: number;
  classesCanMiss: number;
}

export default function AttendancePage() {
  const { success, error } = useToast();
  const [records, setRecords] = useState<EnrichedAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetConfig, setTargetConfig] = useState(75);

  const loadAttendance = async () => {
    try {
      const res = await fetch("/api/attendance");
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err: any) {
      error("Load Error", err.message);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleUpdate = async (
    record: EnrichedAttendance,
    attendedDelta: number,
    totalDelta: number
  ) => {
    const nextAttended = record.attendedClasses + attendedDelta;
    const nextTotal = record.totalClasses + totalDelta;

    if (nextAttended < 0 || nextTotal < 0 || nextAttended > nextTotal) {
      return;
    }

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          attendedClasses: nextAttended,
          totalClasses: nextTotal,
          targetPercentage: targetConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update attendance");

      success("Attendance Logged", `${record.subjectCode}: ${nextAttended}/${nextTotal}`);
      loadAttendance();
    } catch (err: any) {
      error("Update Error", err.message);
    }
  };

  // Overall average
  const totalAttended = records.reduce((s, r) => s + r.attendedClasses, 0);
  const totalClasses = records.reduce((s, r) => s + r.totalClasses, 0);
  const overallPercentage =
    totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 1000) / 10 : 100;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-violet-400" />
            Attendance Tracker & Target Calculator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Student-managed local attendance planner. Not an official college registrar portal.
          </p>
        </div>

        {/* Global Target selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Target Threshold:</span>
          {[75, 80, 85].map((target) => (
            <button
              key={target}
              onClick={() => setTargetConfig(target)}
              className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
                targetConfig === target
                  ? "bg-violet-600 text-white shadow-glow"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {target}%
            </button>
          ))}
        </div>
      </div>

      {/* Overall Scorecard */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-850 to-slate-900 border border-slate-700/60 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-violet-400 font-semibold">
            Overall College Attendance
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white font-mono">
              {overallPercentage}%
            </span>
            <span className="text-xs text-slate-400">
              ({totalAttended} attended of {totalClasses} conducted)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              overallPercentage >= targetConfig
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                : "bg-rose-950/60 text-rose-300 border-rose-500/40"
            }`}
          >
            {overallPercentage >= targetConfig ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Target Met ({targetConfig}%)
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Below Target ({targetConfig}%)
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map((rec) => {
          const isSafe = rec.currentPercentage >= targetConfig;
          return (
            <div
              key={rec.id}
              className="p-5 rounded-2xl bg-navy-900 border border-slate-800 hover:border-slate-700 shadow-glass space-y-4 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-violet-300">
                    {rec.subjectCode}
                  </span>
                  <h3 className="font-semibold text-white text-sm">
                    {rec.subjectName}
                  </h3>
                </div>
                <div className="text-right">
                  <div
                    className={`font-mono font-bold text-lg ${
                      isSafe ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {rec.currentPercentage}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {rec.attendedClasses} / {rec.totalClasses}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isSafe ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, rec.currentPercentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0%</span>
                  <span className="text-violet-400">Target: {targetConfig}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Mathematical Recommendation */}
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  isSafe
                    ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                    : "bg-rose-950/20 border-rose-500/20 text-rose-300"
                }`}
              >
                {isSafe ? (
                  rec.classesCanMiss > 0 ? (
                    <span>
                      🎉 Safe margin: You can miss up to <strong>{rec.classesCanMiss}</strong> upcoming class{rec.classesCanMiss > 1 ? "es" : ""} and still stay above {targetConfig}%.
                    </span>
                  ) : (
                    <span>
                      ⚠️ Borderline: You are currently on track at {rec.currentPercentage}%, but cannot afford to miss the next lecture.
                    </span>
                  )
                ) : (
                  <span>
                    🚨 Deficit: You must attend the next <strong>{rec.classesNeeded}</strong> consecutive class{rec.classesNeeded > 1 ? "es" : ""} without absence to reach {targetConfig}%.
                  </span>
                )}
              </div>

              {/* Interactive Quick Logger Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Log today&apos;s lecture:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(rec, 1, 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-colors"
                    title="Mark class attended"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attended</span>
                  </button>
                  <button
                    onClick={() => handleUpdate(rec, 0, 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 transition-colors"
                    title="Mark class missed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Missed</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
