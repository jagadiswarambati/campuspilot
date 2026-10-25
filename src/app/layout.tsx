import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "CampusPilot AI — Your college day, intelligently coordinated",
  description:
    "Intelligently coordinate printing, canteen pickup, and lecture timetables during short campus breaks without wasting time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-950 text-slate-100 antialiased selection:bg-violet-500/30 selection:text-violet-200">
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer className="border-t border-slate-800/60 py-6 bg-navy-950/80 text-xs text-slate-500 text-center">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-400">CampusPilot AI</span> — College Day Coordination Multi-Agent Platform
                </div>
                <div className="text-[11px] text-slate-500">
                  Google Gemma 4 AI Studio Integration • Deterministic Scheduling Engine • Demo Mode Active
                </div>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
