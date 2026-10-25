import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

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
      <body className="min-h-screen bg-navy-950 text-slate-100 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
