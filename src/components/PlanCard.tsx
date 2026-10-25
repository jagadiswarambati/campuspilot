"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coins,
  MapPin,
  Printer,
  Utensils,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
} from "lucide-react";
import { CoordinatedPlan } from "@/types";
import { useToast } from "./Toast";

interface PlanCardProps {
  plan: CoordinatedPlan;
  onPlanConfirmed?: (updatedPlan: CoordinatedPlan) => void;
  onPlanCancelled?: (updatedPlan: CoordinatedPlan) => void;
}

export function PlanCard({
  plan,
  onPlanConfirmed,
  onPlanCancelled,
}: PlanCardProps) {
  const { success, error } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<CoordinatedPlan>(plan);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch("/api/assistant/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: currentPlan.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm plan");
      }
      setCurrentPlan(data.plan);
      success("Plan Confirmed!", "Simulated orders placed at Print Shop and Canteen.");
      if (onPlanConfirmed) onPlanConfirmed(data.plan);
    } catch (err: any) {
      error("Confirmation Failed", err.message);
    } finally {
      setConfirming(false);
    }
  };

  const isDraft = currentPlan.status === "DRAFT";
  const isConfirmed = currentPlan.status === "CONFIRMED";
  const isCancelled = currentPlan.status === "CANCELLED";

  return (
    <div className="w-full bg-navy-900/90 border border-slate-700/70 rounded-2xl p-5 md:p-6 shadow-glass backdrop-blur-md space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                currentPlan.isFeasible
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                  : "bg-rose-950/60 text-rose-300 border border-rose-500/40"
              }`}
            >
              {currentPlan.isFeasible ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Feasible Schedule
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Schedule Conflict Detected
                </>
              )}
            </span>

            {isConfirmed && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-950/60 text-violet-300 border border-violet-500/40">
                ✓ Order Confirmed
              </span>
            )}
            {isCancelled && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                Cancelled
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-400 italic">
            &quot;{currentPlan.userPrompt}&quot;
          </p>
        </div>

        {/* Key metrics pill */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-slate-400">Window:</span>
            <span className="text-white font-semibold">{currentPlan.availableMinutes}m</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-slate-400">Total:</span>
            <span className="text-white font-semibold">₹{currentPlan.totalCost}</span>
          </div>
        </div>
      </div>

      {/* Conflicts & Warnings if Infeasible */}
      {!currentPlan.isFeasible && currentPlan.conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Constraint Conflicts Detected
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-200/90 leading-relaxed">
            {currentPlan.conflicts.map((conf, idx) => (
              <li key={idx}>{conf}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Specialist Agent Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Print Proposal */}
        {currentPlan.printProposal && (
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-300 font-semibold text-sm">
                <Printer className="w-4 h-4 text-violet-400" />
                <span>Print Agent Plan</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                ₹{currentPlan.printProposal.totalCost}
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Shop:</span>
                <span className="text-slate-200">{currentPlan.printProposal.shopName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pages:</span>
                <span className="text-slate-200">
                  {currentPlan.printProposal.pageCount} pages ({currentPlan.printProposal.isDoubleSided ? "Double-sided" : "Single-sided"}, {currentPlan.printProposal.isColor ? "Color" : "B&W"})
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Time:</span>
                <span className="text-violet-300">
                  {currentPlan.printProposal.totalDurationMinutes} min ({currentPlan.printProposal.queueMinutes}m queue + {currentPlan.printProposal.printMinutes}m print)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Canteen Proposal */}
        {currentPlan.foodProposal && (
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-pink-300 font-semibold text-sm">
                <Utensils className="w-4 h-4 text-pink-400" />
                <span>Canteen Agent Plan</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                ₹{currentPlan.foodProposal.totalCost}
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Canteen:</span>
                <span className="text-slate-200">{currentPlan.foodProposal.canteenName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Items:</span>
                <span className="text-slate-200">
                  {currentPlan.foodProposal.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Dietary & Prep:</span>
                <span className="text-emerald-300">
                  {currentPlan.foodProposal.isVegetarianOnly ? "🌱 100% Vegetarian" : "Regular"} | {currentPlan.foodProposal.preparationMinutes} min prep
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Coordinated Sequence Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            Optimized Execution Sequence ({currentPlan.totalDurationMinutes} min + {currentPlan.safetyBufferMinutes}m Safety Buffer)
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            {currentPlan.slackMinutes >= 0
              ? `Slack margin: +${currentPlan.slackMinutes} min`
              : `Deficit: ${currentPlan.slackMinutes} min`}
          </span>
        </div>

        <div className="relative pl-6 space-y-3 border-l-2 border-slate-700/80 my-2">
          {currentPlan.sequence.map((step) => (
            <div key={step.stepNumber} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-navy-950 bg-violet-500 group-hover:scale-125 transition-transform" />

              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-violet-500/40 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-200">
                    <span className="text-violet-400 font-mono">
                      Step {step.stepNumber}:
                    </span>
                    <span>{step.title}</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    {step.startMinute}m – {step.endMinute}m ({step.durationMinutes}m)
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3 h-3 text-pink-400" />
                    <span>{step.location}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{step.details}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Safety Buffer step */}
          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-navy-950 bg-emerald-500" />
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
              <span>Class Safety Buffer (Prevents any class delay)</span>
              <span className="font-mono">+{currentPlan.safetyBufferMinutes} min buffer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Alternatives if Infeasible or Tight */}
      {currentPlan.alternatives && currentPlan.alternatives.length > 0 && (
        <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-800/40 space-y-3">
          <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Recommended Feasible Alternatives
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentPlan.alternatives.map((alt) => (
              <div
                key={alt.id}
                className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs space-y-1.5"
              >
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>{alt.title}</span>
                  <span className="font-mono text-emerald-400">₹{alt.estimatedCost}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">{alt.description}</p>
                <div className="flex justify-between items-center pt-1 text-[11px] text-violet-300">
                  <span>{alt.changes}</span>
                  <span className="font-mono">~{alt.estimatedMinutes}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation & Order creation actions */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {isDraft
              ? "Explicit student confirmation required before simulated order placement."
              : isConfirmed
              ? `Simulated Orders Created: ${currentPlan.simulatedOrderIds?.printOrderId || "PO"} & ${currentPlan.simulatedOrderIds?.foodOrderId || "FO"}`
              : "This plan has been cancelled."}
          </span>
        </div>

        {isDraft && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-glow transition-all ${
                currentPlan.isFeasible
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {confirming ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <span>Confirm Plan & Place Simulated Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {isConfirmed && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Orders Active in System</span>
          </div>
        )}
      </div>
    </div>
  );
}
