"use client";

import React, { useState, useEffect } from "react";
import {
  Utensils,
  Search,
  Plus,
  Minus,
  Clock,
  Coins,
  CheckCircle2,
  Package,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { MenuItem, Canteen, FoodOrder } from "@/types";
import { useToast } from "@/components/Toast";

export default function CanteenPage() {
  const { success, error } = useToast();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [vegetarianOnly, setVegetarianOnly] = useState(true);
  const [cart, setCart] = useState<{ [itemId: string]: number }>({
    "item-veg-thali": 1, // Seed with standard lunch item
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [menuRes, ordersRes] = await Promise.all([
        fetch("/api/canteen/menu"),
        fetch("/api/canteen/orders"),
      ]);
      const mData = await menuRes.json();
      const oData = await ordersRes.json();
      setCanteens(mData.canteens || []);
      setMenuItems(mData.menuItems || []);
      setFoodOrders(oData.orders || []);
      if (mData.canteens?.length > 0 && !selectedCanteenId) {
        setSelectedCanteenId(mData.canteens[0].id);
      }
    } catch (err: any) {
      error("Data Load Error", err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (selectedCanteenId && item.canteenId !== selectedCanteenId) return false;
    if (vegetarianOnly && !item.isVegetarian) return false;
    if (activeCategory !== "All" && item.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate cart totals
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const item = menuItems.find((m) => m.id === id);
      return item ? { item, quantity: qty } : null;
    })
    .filter(Boolean) as { item: MenuItem; quantity: number }[];

  const cartTotalCost = cartItems.reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );

  const maxPrepTime = cartItems.reduce(
    (max, { item }) => Math.max(max, item.preparationMinutes),
    0
  );
  const totalPrepTime = cartItems.length > 0 ? maxPrepTime + 3 : 0; // max prep + 3 min queue/handoff

  const handleCreateOrder = async () => {
    if (cartItems.length === 0 || !selectedCanteenId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/canteen/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canteenId: selectedCanteenId,
          items: cartItems.map(({ item, quantity }) => ({
            itemId: item.id,
            quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit food order");
      success("Order Placed!", `Order ID: ${data.order.id} sent to ${data.order.canteenName}`);
      setCart({});
      loadData();
    } catch (err: any) {
      error("Order Failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ["All", "Meal", "Snack", "Beverage", "Dessert"];

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Utensils className="w-6 h-6 text-pink-400" />
          Campus Canteen & Express Pickup
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore campus menus, filter dietary requirements, and simulate instant kitchen ordering.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls bar */}
          <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search meals, wraps, snacks, drinks..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Vegetarian toggle */}
              <button
                onClick={() => setVegetarianOnly(!vegetarianOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  vegetarianOnly
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                <span>🌱 Vegetarian Only</span>
              </button>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-pink-600/30 text-pink-300 border border-pink-500/40 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const qtyInCart = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    !item.isAvailable
                      ? "bg-slate-900/40 border-slate-800 opacity-60"
                      : "bg-navy-900 border-slate-800 hover:border-pink-500/30 shadow-glass"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.isVegetarian ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                          title={item.isVegetarian ? "Vegetarian" : "Non-Vegetarian"}
                        />
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {item.name}
                        </h4>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-xs">
                        ₹{item.price}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 font-mono">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-pink-400" />
                        {item.preparationMinutes}m prep
                      </span>
                      {item.calories && (
                        <span>{item.calories} kcal</span>
                      )}
                      {!item.isAvailable && (
                        <span className="text-rose-400 font-semibold">Out of Stock</span>
                      )}
                    </div>
                  </div>

                  {/* Add / Quantity buttons */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono text-slate-500">
                      {item.category}
                    </span>

                    {item.isAvailable ? (
                      qtyInCart > 0 ? (
                        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-semibold text-white px-1">
                            {qtyInCart}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-3 py-1 rounded-lg bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 border border-pink-500/30 text-xs font-semibold transition-colors"
                        >
                          + Add
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] text-slate-500">Unavailable</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Food Cart & Order Sidebar */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShoppingBag className="w-4 h-4 text-pink-400" />
              Express Food Cart
            </h3>

            {cartItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Your food cart is empty. Add items from the menu.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cartItems.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-1 border-b border-slate-800/60"
                    >
                      <div className="flex-1 mr-2 truncate">
                        <span className="text-slate-200">{item.name}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {quantity} × ₹{item.price}
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 font-semibold">
                        ₹{item.price * quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
                  <div className="flex justify-between text-slate-400">
                    <span>Preparation Time:</span>
                    <span className="font-mono text-pink-300">~{totalPrepTime} min</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-1">
                    <span>Total Amount:</span>
                    <span className="font-mono text-emerald-400 text-base">₹{cartTotalCost}</span>
                  </div>
                </div>

                <button
                  onClick={handleCreateOrder}
                  disabled={submitting}
                  className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-semibold text-xs shadow-glow-pink transition-all"
                >
                  {submitting ? "Placing Order..." : "Confirm & Place Simulated Order"}
                </button>
              </div>
            )}
          </div>

          {/* Canteen Information */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span>Main Student Food Court</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Open
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Student Activity Center (SAC) Ground Floor. Express pickup counter handles app orders with minimal queue time.
            </p>
          </div>
        </div>
      </div>

      {/* Food Order History */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 shadow-glass space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-pink-400" />
            <h3 className="font-bold text-white text-sm">Canteen Order History (Simulated)</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{orders.length} Orders</span>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No food orders placed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-2"
              >
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-pink-300 font-mono">{o.id}</span>
                  <span className="text-emerald-400 font-mono">₹{o.totalCost}</span>
                </div>
                <div className="text-slate-300 text-xs font-medium">
                  {o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 font-mono">
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-950/80 text-pink-300 border border-pink-800/60 font-mono">
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
