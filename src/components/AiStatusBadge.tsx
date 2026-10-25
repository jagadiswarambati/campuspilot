"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Bot, AlertCircle, RefreshCw } from "lucide-react";
import { AiConnectionStatus } from "@/types";

export function AiStatusBadge() {
  const [status, setStatus] = useState<AiConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        connected: false,
        provider: "demo",
        model: "gemma-4-26b-a4b-it",
        demoMode: true,
        message: "Status check failed. Demo mode running locally.",
        lastChecked: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isLive = status?.connected && !status?.demoMode;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          isLive
            ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:border-emerald-400"
            : "bg-violet-950/40 text-violet-300 border-violet-500/30 hover:border-violet-400"
        }`}
        title="Click for Gemma 4 AI & Demo Configuration details"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isLive ? "bg-emerald-400" : "bg-violet-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isLive ? "bg-emerald-500" : "bg-violet-500"
            }`}
          />
        </span>
        <span className="flex items-center gap-1 font-mono tracking-tight">
          {isLive ? (
            <>
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Gemma 4 Live
            </>
          ) : (
            <>
              <Bot className="w-3 h-3 text-violet-400" />
              Gemma 4 Demo Mode
            </>
          )}
        </span>
      </button>

      {/* Details modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-6 bg-navy-900 border border-slate-700 rounded-2xl shadow-glass text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold text-white">AI Engine & Model Status</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 px-3 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400">Target Model:</span>
                <span className="font-mono text-violet-300 font-semibold">
                  {status?.model || "gemma-4-26b-a4b-it"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400">Active Mode:</span>
                <span
                  className={`font-semibold ${
                    isLive ? "text-emerald-400" : "text-amber-300"
                  }`}
                >
                  {isLive ? "Live AI Connected" : "Deterministic Demo Mode"}
                </span>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-lg">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-violet-400" />
                  Status Message:
                </div>
                <p className="text-slate-400 leading-relaxed font-mono">
                  {status?.message}
                </p>
              </div>

              <div className="p-3 bg-violet-950/30 border border-violet-800/40 rounded-lg text-slate-300">
                <div className="font-semibold text-violet-300 mb-1">
                  How to enable live Gemma 4:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Open <code className="text-violet-200">.env.local</code></li>
                  <li>Replace <code className="text-violet-200">PASTE_YOUR_API_KEY_HERE</code> with your Google AI Studio API key</li>
                  <li>Set <code className="text-violet-200">DEMO_MODE=false</code></li>
                  <li>Restart the server and click &quot;Check Again&quot;</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Check Again
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
