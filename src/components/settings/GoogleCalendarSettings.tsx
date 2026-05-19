"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle2, AlertCircle, Calendar, Loader2 } from "lucide-react";

export function GoogleCalendarSettings() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["google-calendar", "status"],
    queryFn: () => api.googleCalendar.status(),
  });

  // Handle callback query params
  useEffect(() => {
    const gcParam = searchParams.get("google_calendar");
    if (gcParam === "connected") {
      setToast({ type: "success", message: "Google Calendar erfolgreich verbunden." });
      qc.invalidateQueries({ queryKey: ["google-calendar", "status"] });
    } else if (gcParam === "error") {
      setToast({ type: "error", message: "Google Calendar Verbindung fehlgeschlagen." });
    }
  }, [searchParams, qc]);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await api.googleCalendar.disconnect();
      await qc.invalidateQueries({ queryKey: ["google-calendar", "status"] });
      setToast({ type: "success", message: "Google Calendar getrennt." });
    } catch {
      setToast({ type: "error", message: "Fehler beim Trennen der Verbindung." });
    } finally {
      setDisconnecting(false);
    }
  }

  const connected = data?.connected ?? false;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Google Calendar</h2>
          <p className="text-xs text-slate-500">Zeitblöcke mit Google Calendar synchronisieren</p>
        </div>
      </div>

      {toast && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-4 ${
            toast.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Verbindungsstatus wird geprüft...
        </div>
      ) : connected ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verbunden mit Google Calendar
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-50 transition-all border border-red-500/20"
          >
            {disconnecting ? "Trennen..." : "Verbindung trennen"}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Noch nicht verbunden</p>
          <button
            onClick={() => api.googleCalendar.connect()}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
          >
            Google Calendar verbinden
          </button>
        </div>
      )}
    </div>
  );
}
