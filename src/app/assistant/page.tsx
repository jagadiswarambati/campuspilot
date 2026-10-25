"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  User,
  Bot,
  RefreshCw,
  Clock,
  Coins,
  Compass,
} from "lucide-react";
import { PlanCard } from "@/components/PlanCard";
import { CoordinatedPlan } from "@/types";
import { useToast } from "@/components/Toast";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  plan?: CoordinatedPlan;
}

export default function AssistantPage() {
  const { error } = useToast();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "assistant",
      text: "Hello Alex! I am your CampusPilot Orchestrator. Tell me what you need to get done before your next lecture, and I will evaluate your timetable, print shop queues, and canteen menus into a guaranteed schedule.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process request");

      const plan: CoordinatedPlan = data.plan;

      let replyText = "";
      if (plan.isFeasible) {
        replyText = `I have coordinated your request! Both your printing (${plan.printProposal?.pageCount || 0} pages) and meal order can be comfortably completed in ${plan.totalDurationMinutes} minutes, leaving a safe ${plan.slackMinutes} min margin plus a 5 min safety buffer before your next class. Please review the plan below and click "Confirm Plan" when you're ready to place simulated orders.`;
      } else {
        replyText = `Warning: The requested activities cannot fit safely into the available break time without making you late for class. Here is the conflict breakdown and the best feasible alternatives:`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        plan,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      error("Assistant Error", err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "assistant",
          text: `I encountered an error coordinating your request: ${err.message}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const examplePrompts = [
    "I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed. Find the fastest plan that fits my budget and won't make me late.",
    "I have only 12 minutes before class. Need 50 pages printed in color and a lunch thali.",
    "Can I print 10 pages double-sided and get a cold coffee in 20 minutes?",
    "Find vegetarian lunch under ₹100 near Block A.",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            AI Campus Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gemma 4 orchestrator with pure deterministic schedule & pricing validation.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50">
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          <span>Next Break: 35 min</span>
          <span className="text-slate-600">•</span>
          <Coins className="w-3.5 h-3.5 text-pink-400" />
          <span>Budget: ₹250</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-6 min-h-[420px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-violet-300" />
              </div>
            )}

            <div
              className={`space-y-3 max-w-2xl ${
                msg.sender === "user"
                  ? "bg-violet-600/20 border border-violet-500/30 rounded-2xl p-4 text-slate-100 text-sm"
                  : "w-full"
              }`}
            >
              {msg.sender === "assistant" && (
                <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 text-slate-200 text-sm leading-relaxed shadow-glass">
                  <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
                    <span className="font-semibold text-violet-300">CampusPilot Orchestrator</span>
                    <span className="font-mono text-[11px]">{msg.timestamp}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              )}

              {/* Render Plan Card if attached */}
              {msg.plan && (
                <PlanCard
                  plan={msg.plan}
                  onPlanConfirmed={(updated) => {
                    msg.plan = updated;
                  }}
                />
              )}
            </div>

            {msg.sender === "user" && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-violet-400 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Consulting Print Agent, Canteen Agent, and Deterministic Scheduler...</span>
          </div>
        )}
      </div>

      {/* Suggested prompts */}
      <div className="space-y-2 pt-2">
        <span className="text-xs text-slate-400 font-medium">Quick Prompts:</span>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleSend(ex)}
              disabled={loading}
              className="text-left text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-violet-900/40 text-slate-300 hover:text-violet-200 border border-slate-700/60 hover:border-violet-500/40 transition-all font-mono"
            >
              &quot;{ex.length > 60 ? ex.slice(0, 58) + "..." : ex}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="sticky bottom-4 pt-2">
        <div className="flex gap-2 p-2 rounded-2xl bg-navy-900/90 border border-slate-700 shadow-glass backdrop-blur-md">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tell CampusPilot what you need before class..."
            className="flex-1 px-4 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !prompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
