"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ToastContainer } from "@/components/ui/Toast";
import { ShortcutsDialog } from "@/components/ui/ShortcutsDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcuts({
    "?": () => setShortcutsOpen(true),
  });

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <ToastContainer />
      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
