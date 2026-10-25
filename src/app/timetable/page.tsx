"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { TimetableClass, DayOfWeek } from "@/types";
import { useToast } from "@/components/Toast";

const DAYS: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TimetablePage() {
  const { success, error, warning } = useToast();
  const [classes, setClasses] = useState<TimetableClass[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("Monday");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [room, setRoom] = useState("");
  const [building, setBuilding] = useState("Block A - Science & Computing");
  const [formDay, setFormDay] = useState<DayOfWeek>("Monday");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("15:15");
  const [color, setColor] = useState("#8b5cf6");

  const loadTimetable = async () => {
    try {
      const res = await fetch("/api/timetable");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (err: any) {
      error("Load Error", err.message);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectCode,
          subjectName,
          instructor,
          room,
          building,
          dayOfWeek: formDay,
          startTime,
          endTime,
          color,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          warning("Overlap Detected", data.error);
        } else {
          error("Error", data.error || "Failed to add class");
        }
        return;
      }

      success("Class Added", `${subjectCode} scheduled on ${formDay}`);
      setShowAddModal(false);
      // Reset form
      setSubjectCode("");
      setSubjectName("");
      setInstructor("");
      setRoom("");
      loadTimetable();
    } catch (err: any) {
      error("Submission Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your timetable?`)) return;
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete class");
      success("Class Removed", `${name} has been deleted.`);
      loadTimetable();
    } catch (err: any) {
      error("Delete Error", err.message);
    }
  };

  // Group classes by day
  const dayClasses = classes
    .filter((c) => c.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-violet-400" />
            Class Timetable & Break Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic timetable management with automatic conflict and overlap validation.
          </p>
        </div>
        <button
          onClick={() => {
            setFormDay(selectedDay);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {DAYS.map((day) => {
          const count = classes.filter((c) => c.dayOfWeek === day).length;
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/40 font-semibold"
                  : "bg-navy-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <span>{day}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Classes List */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {selectedDay}&apos;s Schedule ({dayClasses.length} Classes)
          </h2>
          <span className="text-xs text-slate-400">
            Click class delete button to remove or test overlap rejection
          </span>
        </div>

        {dayClasses.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto" />
            <p className="font-semibold text-slate-300">No classes scheduled on {selectedDay}.</p>
            <p className="text-slate-500">Enjoy your free campus study day!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayClasses.map((cls, idx) => {
              // Calculate break to next class if applicable
              const nextCls = dayClasses[idx + 1];
              let breakMinutes = 0;
              if (nextCls) {
                const [endH, endM] = cls.endTime.split(":").map(Number);
                const [nextH, nextM] = nextCls.startTime.split(":").map(Number);
                breakMinutes = nextH * 60 + nextM - (endH * 60 + endM);
              }

              return (
                <div key={cls.id} className="space-y-2">
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-violet-500/40 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-12 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cls.color || "#8b5cf6" }}
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-violet-300">
                            {cls.subjectCode}
                          </span>
                          <span className="text-white font-semibold text-sm">
                            {cls.subjectName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span>{cls.instructor}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3 h-3 text-pink-400" />
                            {cls.room} ({cls.building})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono text-xs">
                        <div className="font-bold text-violet-300">
                          {cls.startTime} – {cls.endTime}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteClass(cls.id, cls.subjectCode)}
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Remove Class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Render Campus Break Chip between classes if > 0 min */}
                  {nextCls && breakMinutes > 0 && (
                    <div className="mx-6 p-2 rounded-lg bg-violet-950/30 border border-violet-800/30 text-xs text-violet-300 flex items-center justify-between font-mono">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-violet-400" />
                        Campus Break: {breakMinutes} minutes available
                      </span>
                      <span className="text-[11px] text-slate-400 font-sans">
                        Ideal for 25p printout + lunch
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-navy-900 border border-slate-700 rounded-2xl shadow-glass text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-white">Add Class to Timetable</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClass} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="e.g. CS305"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Instructor</label>
                  <input
                    type="text"
                    required
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="e.g. Dr. Adams"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Room</label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Room A-204"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Day</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Start (HH:mm)</label>
                  <input
                    type="text"
                    required
                    pattern="\d{2}:\d{2}"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="14:00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End (HH:mm)</label>
                  <input
                    type="text"
                    required
                    pattern="\d{2}:\d{2}"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="15:15"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 pt-1">
                Overlapping classes on the same day will be rejected automatically.
              </p>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-glow"
                >
                  {loading ? "Checking & Saving..." : "Add to Timetable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
