"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ToastContainer } from "@/components/ui/Toast";
import { ShortcutsDialog } from "@/components/ui/ShortcutsDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CreateTaskProvider } from "@/contexts/CreateTaskContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useKeyboardShortcuts({
    "?": () => setShortcutsOpen(true),
  });

  return (
    <CreateTaskProvider>
      <div className="flex h-full">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto overflow-x-hidden p-4 sm:p-6">{children}</main>
        </div>
        <ToastContainer />
        <ShortcutsDialog
          open={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />
      </div>
    </CreateTaskProvider>
  );
}
