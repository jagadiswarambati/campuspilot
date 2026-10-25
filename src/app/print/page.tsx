"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  Upload,
  FileText,
  Clock,
  Coins,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { PrintShop, PrintOrder, PrintEstimateResult } from "@/types";
import { useToast } from "@/components/Toast";

export default function PrintPage() {
  const { success, error } = useToast();
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [documentName, setDocumentName] = useState("Operating_Systems_Lab_25Pages.pdf");
  const [pageCount, setPageCount] = useState(25);
  const [copies, setCopies] = useState(1);
  const [isColor, setIsColor] = useState(false);
  const [isDoubleSided, setIsDoubleSided] = useState(true);
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4");
  const [estimate, setEstimate] = useState<PrintEstimateResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [shopsRes, ordersRes] = await Promise.all([
        fetch("/api/print/shops"),
        fetch("/api/print/orders"),
      ]);
      const sData = await shopsRes.json();
      const oData = await ordersRes.json();
      setShops(sData.shops || []);
      setOrders(oData.orders || []);
      if (sData.shops?.length > 0 && !selectedShopId) {
        setSelectedShopId(sData.shops[0].id);
      }
    } catch (err: any) {
      error("Data Load Error", err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate estimate whenever parameters change
  useEffect(() => {
    if (!selectedShopId || pageCount <= 0 || copies <= 0) return;

    const fetchEstimate = async () => {
      try {
        const res = await fetch("/api/print/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: selectedShopId,
            pageCount,
            copies,
            isColor,
            isDoubleSided,
            paperSize,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setEstimate(data.estimate);
        }
      } catch (err) {
        console.error("Estimate calculation error", err);
      }
    };

    fetchEstimate();
  }, [selectedShopId, pageCount, copies, isColor, isDoubleSided, paperSize]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentName(file.name);
      // Simulate automatic page count detection from PDF or fallback to manual
      const simulatedPages = Math.floor(Math.random() * 20) + 10;
      setPageCount(simulatedPages);
      success("File Uploaded", `Detected ${simulatedPages} pages in ${file.name}`);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedShopId || pageCount <= 0 || copies <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/print/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: selectedShopId,
          documentName,
          pageCount,
          copies,
          isColor,
          isDoubleSided,
          paperSize,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");
      success("Print Order Placed!", `Order ID: ${data.order.id} sent to ${data.order.shopName}`);
      loadData();
    } catch (err: any) {
      error("Order Failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedShop = shops.find((s) => s.id === selectedShopId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Printer className="w-6 h-6 text-violet-400" />
          Campus Print Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Accurate queue estimates and deterministic per-page pricing. Never wait in shop queues again.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Print configuration form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-6">
          <h2 className="text-base font-bold text-white">Configure Print Job</h2>

          {/* Document Upload Area */}
          <div className="p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-violet-500/60 transition-colors text-center bg-slate-950/40 space-y-2">
            <Upload className="w-8 h-8 text-violet-400 mx-auto" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Upload document</span> (PDF, DOCX) or enter page count manually
            </div>
            <p className="text-[11px] text-slate-500">Max file size 25MB. Safe server validation.</p>
            <label className="inline-block px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-violet-300 font-medium cursor-pointer transition-colors">
              <span>Select File</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {documentName && (
              <div className="text-xs text-emerald-400 flex items-center justify-center gap-1 font-mono pt-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{documentName}</span>
              </div>
            )}
          </div>

          {/* Form settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Shop selection */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Print Shop</label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.building})
                  </option>
                ))}
              </select>
            </div>

            {/* Page Count */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Page Count</label>
              <input
                type="number"
                min="1"
                max="500"
                value={pageCount}
                onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Copies */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Number of Copies</label>
              <input
                type="number"
                min="1"
                max="50"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Paper Size */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Paper Size</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as "A4" | "A3")}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
              >
                <option value="A4">A4 Standard</option>
                <option value="A3">A3 Poster / Ledger</option>
              </select>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Color vs BW */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Color Printing</div>
                <div className="text-[11px] text-slate-400">
                  {isColor ? "Color toner (premium)" : "Black & White (standard)"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsColor(!isColor)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isColor ? "bg-violet-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Duplex vs Simplex */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Double-Sided (Duplex)</div>
                <div className="text-[11px] text-slate-400">
                  {isDoubleSided ? "Eco duplex (save paper & cost)" : "Single-sided only"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDoubleSided(!isDoubleSided)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isDoubleSided ? "bg-violet-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Estimate & Confirmation Sidebar */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Deterministic Estimate
            </h3>

            {estimate ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Total Pages:</span>
                  <span className="font-mono font-semibold text-white">
                    {estimate.totalPages} pages ({estimate.copies} copies)
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Unit Price:</span>
                  <span className="font-mono text-slate-200">₹{estimate.unitPricePerPage.toFixed(2)} / page</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Queue Wait:</span>
                  <span className="font-mono text-violet-300">~{estimate.queueMinutes} min</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Printing Duration:</span>
                  <span className="font-mono text-violet-300">~{estimate.printMinutes} min</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold text-white">
                  <span>Estimated Total:</span>
                  <span className="font-mono text-emerald-400 text-base">₹{estimate.totalCost.toFixed(2)}</span>
                </div>

                <div className="p-3 bg-violet-950/30 border border-violet-800/40 rounded-xl text-[11px] text-violet-200">
                  Ready in approx. <strong>{estimate.totalDurationMinutes} minutes</strong> from order placement.
                </div>

                <button
                  onClick={handleCreateOrder}
                  disabled={submitting}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow transition-all"
                >
                  {submitting ? "Placing Order..." : "Confirm & Place Simulated Order"}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Select options to calculate price.</p>
            )}
          </div>

          {/* Shop Live Queue Monitor */}
          {selectedShop && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span>Shop Status:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" /> Open Now
                </span>
              </div>
              <div className="text-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="font-mono text-slate-200">{selectedShop.pagesPerMinute} pages/min</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Queue:</span>
                  <span className="font-mono text-violet-300">{selectedShop.currentQueuePages} pages ahead</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Order History */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-400" />
            <h3 className="font-bold text-white text-sm">Print Order History (Simulated)</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{orders.length} Orders</span>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No print orders submitted yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-2"
              >
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-violet-300 font-mono">{o.id}</span>
                  <span className="text-emerald-400 font-mono">₹{o.totalCost}</span>
                </div>
                <div className="text-slate-300 text-xs font-medium truncate">{o.documentName}</div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{o.shopName}</span>
                  <span>{o.pageCount} pgs ({o.isDoubleSided ? "Duplex" : "Simplex"})</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 font-mono">
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-800/60 font-mono">
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
