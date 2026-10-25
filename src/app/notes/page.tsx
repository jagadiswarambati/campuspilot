"use client";

import React, { useState, useEffect } from "react";
import {
  StickyNote,
  Plus,
  Pin,
  Trash2,
  Search,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { StudentNote } from "@/types";
import { useToast } from "@/components/Toast";

export default function NotesPage() {
  const { success, error } = useToast();
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<StudentNote["category"]>("academic");
  const [isPinned, setIsPinned] = useState(false);

  const loadNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err: any) {
      error("Load Error", err.message);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, isPinned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create note");

      success("Note Saved", title);
      setShowAddModal(false);
      setTitle("");
      setContent("");
      loadNotes();
    } catch (err: any) {
      error("Error", err.message);
    }
  };

  const handleDelete = async (id: string, noteTitle: string) => {
    if (!confirm(`Delete "${noteTitle}"?`)) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      success("Note Deleted", noteTitle);
      loadNotes();
    } catch (err: any) {
      error("Error", err.message);
    }
  };

  const handleTogglePin = async (note: StudentNote) => {
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          category: note.category,
          isPinned: !note.isPinned,
        }),
      });
      if (!res.ok) throw new Error("Failed to update pin");
      loadNotes();
    } catch (err: any) {
      error("Error", err.message);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (selectedCategory !== "all" && n.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  const categories = ["all", "academic", "tasks", "print", "food", "general"];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-violet-400" />
            Memory, Tasks & Quick Notes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explicitly student-saved lab instructions, reminders, and printout checklists.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved notes and tasks..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                selectedCategory === cat
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`p-5 rounded-2xl border shadow-glass flex flex-col justify-between transition-all ${
              note.isPinned
                ? "bg-navy-900 border-violet-500/50"
                : "bg-navy-900/80 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-white text-sm">{note.title}</h3>
                <button
                  onClick={() => handleTogglePin(note)}
                  className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                    note.isPinned ? "text-violet-400" : "text-slate-600 hover:text-slate-300"
                  }`}
                  title={note.isPinned ? "Unpin Note" : "Pin Note to Top"}
                >
                  <Pin className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-slate-800 text-slate-400 border border-slate-700">
                {note.category}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(note.id, note.title)}
                  className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-navy-900 border border-slate-700 rounded-2xl shadow-glass text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-white">Create New Note</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNote} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Operating Systems Lab Manual Printout"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white capitalize"
                >
                  {["academic", "tasks", "print", "food", "general"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Content</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write task details or reminders..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-violet-600 focus:ring-0"
                />
                <label htmlFor="pinCheck" className="text-slate-300">
                  Pin to top of notes
                </label>
              </div>

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
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-glow"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
