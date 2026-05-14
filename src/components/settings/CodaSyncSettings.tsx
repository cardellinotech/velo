"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import {
  Link2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CodaSyncMappings } from "./CodaSyncMappings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CodaSyncConfig {
  id?: string;
  projectId: string;
  codaApiToken: string;
  codaDocId: string;
  codaTableId: string;
  columnMapping: {
    task: string;
    notes: string;
    duration: string;
    logDate: string;
    user: string;
  };
  taskMappings: { codaValue: string; taskId: string }[];
  codaUserValue?: string;
  lastSyncAt?: number;
  lastSyncCount?: number;
  isSyncing?: boolean;
}

interface SyncHistoryEntry {
  id: string;
  syncedAt: number;
  entriesImported: number;
  entriesSkipped: number;
  errors?: { row: number; message: string }[];
  status: "success" | "partial" | "failed";
}

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  icon,
  gradient,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white rounded-xl border border-border/60 overflow-hidden shadow-card">
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r",
          gradient
        )}
      />
      <div className="px-6 pt-6 pb-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-text-primary">{children}</label>
  );
}

const selectClasses = cn(
  "h-9 w-full rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary",
  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
  "hover:border-slate-300 transition-all duration-150"
);

const inputClasses = cn(
  "h-10 w-full rounded-lg border border-border/60 bg-white px-3.5 text-sm text-text-primary",
  "placeholder:text-text-muted",
  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "transition-all duration-150",
  "hover:border-slate-300"
);

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

function StatusBadge({
  status,
}: {
  status: "success" | "partial" | "failed";
}) {
  const styles = {
    success: "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
  };
  const labels = {
    success: "Erfolgreich",
    partial: "Teilweise",
    failed: "Fehlgeschlagen",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

function CountBadge({
  count,
  variant,
}: {
  count: number;
  variant: "green" | "amber" | "red";
}) {
  const styles = {
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums",
        styles[variant]
      )}
    >
      {count}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CodaSyncSettings({
  projectId,
}: {
  projectId: string;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.coda.config(projectId),
    queryFn: () => api.coda.getConfig(projectId),
    enabled: !!projectId,
  });

  const { data: syncHistoryRaw } = useQuery({
    queryKey: queryKeys.coda.history(projectId),
    queryFn: () => api.coda.getHistory(projectId),
    enabled: !!projectId,
  });

  const syncHistory = syncHistoryRaw as SyncHistoryEntry[] | undefined;

  const saveConfigMutation = useMutation({
    mutationFn: (data: unknown) => api.coda.saveConfig(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coda.config(projectId) });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: () => api.coda.deleteConfig(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coda.config(projectId) });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (data: unknown) => api.coda.testConnection(data),
  });

  const fetchValuesMutation = useMutation({
    mutationFn: (data: unknown) => api.coda.fetchValues(data),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.coda.sync(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coda.history(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.coda.config(projectId) });
    },
  });

  // Connection form
  const [apiToken, setApiToken] = useState("");
  const [docId, setDocId] = useState("");
  const [tableId, setTableId] = useState("");
  const [showToken, setShowToken] = useState(false);

  // Test connection
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    | { success: true; columns: string[] }
    | { success: false; error: string }
    | null
  >(null);

  // Column mapping (after successful test)
  const [taskColumn, setTaskColumn] = useState("");
  const [durationColumn, setDurationColumn] = useState("");
  const [dateColumn, setDateColumn] = useState("");
  const [notesColumn, setNotesColumn] = useState("");
  const [userColumn, setUserColumn] = useState("");

  // Save / delete
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync
  const [syncing, setSyncing] = useState(false);

  // History
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // User filter
  const [codaUsers, setCodaUsers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const typedConfig = config as CodaSyncConfig | null | undefined;

  // Initialize form from existing config
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (typedConfig && !initialized) {
      setApiToken(typedConfig.codaApiToken);
      setDocId(typedConfig.codaDocId);
      setTableId(typedConfig.codaTableId);
      setTaskColumn(typedConfig.columnMapping.task);
      setDurationColumn(typedConfig.columnMapping.duration);
      setDateColumn(typedConfig.columnMapping.logDate);
      setNotesColumn(typedConfig.columnMapping.notes);
      setUserColumn(typedConfig.columnMapping.user);
      setInitialized(true);
    }
  }, [typedConfig, initialized]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleLoadUsers() {
    if (!typedConfig) return;
    setLoadingUsers(true);
    try {
      const result = await fetchValuesMutation.mutateAsync({
        codaApiToken: typedConfig.codaApiToken,
        codaDocId: typedConfig.codaDocId,
        codaTableId: typedConfig.codaTableId,
        columnName: typedConfig.columnMapping.user,
      }) as { success: boolean; values?: string[]; error?: string };
      if (result.success && result.values) {
        setCodaUsers(result.values);
      } else {
        toast.error(result.error ?? "Fehler beim Laden der Coda-User.");
      }
    } catch {
      toast.error("Fehler beim Laden der Coda-User.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleSaveUserFilter(value: string) {
    if (!typedConfig) return;
    try {
      await saveConfigMutation.mutateAsync({
        projectId,
        codaApiToken: typedConfig.codaApiToken,
        codaDocId: typedConfig.codaDocId,
        codaTableId: typedConfig.codaTableId,
        columnMapping: typedConfig.columnMapping,
        taskMappings: typedConfig.taskMappings,
        codaUserValue: value || undefined,
      });
      toast.success(
        value
          ? `User-Filter gesetzt: "${value}"`
          : "User-Filter entfernt."
      );
    } catch {
      toast.error("Fehler beim Speichern.");
    }
  }

  async function handleTestConnection() {
    if (!apiToken.trim() || !docId.trim() || !tableId.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnectionMutation.mutateAsync({
        codaApiToken: apiToken.trim(),
        codaDocId: docId.trim(),
        codaTableId: tableId.trim(),
      }) as { success: true; columns: string[] } | { success: false; error: string };
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: "Verbindung fehlgeschlagen." });
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveConfig() {
    if (!taskColumn || !durationColumn || !dateColumn || !notesColumn || !userColumn) {
      toast.error("Bitte alle Spalten zuordnen.");
      return;
    }
    setSaving(true);
    try {
      await saveConfigMutation.mutateAsync({
        projectId,
        codaApiToken: apiToken.trim(),
        codaDocId: docId.trim(),
        codaTableId: tableId.trim(),
        columnMapping: {
          task: taskColumn,
          duration: durationColumn,
          logDate: dateColumn,
          notes: notesColumn,
          user: userColumn,
        },
        taskMappings: typedConfig?.taskMappings ?? [],
        codaUserValue: typedConfig?.codaUserValue ?? undefined,
      });
      toast.success("Konfiguration gespeichert.");
      setTestResult(null);
    } catch {
      toast.error("Fehler beim Speichern. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfig() {
    setDeleting(true);
    try {
      await deleteConfigMutation.mutateAsync();
      toast.success("Konfiguration gelöscht.");
      // Reset local state
      setApiToken("");
      setDocId("");
      setTableId("");
      setTaskColumn("");
      setDurationColumn("");
      setDateColumn("");
      setNotesColumn("");
      setUserColumn("");
      setTestResult(null);
      setInitialized(false);
      setShowDeleteDialog(false);
    } catch {
      toast.error("Fehler beim Löschen.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncMutation.mutateAsync() as {
        imported: number;
        skipped: number;
        errors: string[];
      };
      const parts: string[] = [];
      if (result.imported > 0) parts.push(`${result.imported} Einträge importiert`);
      if (result.skipped > 0) parts.push(`${result.skipped} übersprungen`);
      if (result.errors.length > 0) parts.push(`${result.errors.length} Fehler`);
      toast.success(parts.join(", ") || "Synchronisierung abgeschlossen.");
    } catch {
      toast.error("Synchronisierung fehlgeschlagen.");
    } finally {
      setSyncing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (configLoading) {
    return (
      <div className="flex flex-col gap-5 max-w-xl animate-pulse">
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <div className="h-[3px] bg-surface" />
          <div className="px-6 pt-6 pb-5 space-y-3">
            <div className="h-4 w-32 bg-surface rounded" />
            <div className="h-9 bg-surface rounded-lg" />
            <div className="h-9 bg-surface rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Connected state (config exists)
  // ---------------------------------------------------------------------------

  if (typedConfig) {
    const hasMappings = typedConfig.taskMappings.length > 0;

    return (
      <div className="flex flex-col gap-5 max-w-xl">
        <SectionCard
          title="Coda Zeiterfassung"
          icon={<Link2 className="h-4 w-4 text-text-secondary" />}
          gradient="from-blue-500 to-indigo-500"
        >
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Verbunden
              </span>
              <span className="text-xs text-text-secondary">
                Doc: {typedConfig.codaDocId}
              </span>
            </div>
          </div>

          {/* Last sync info */}
          {typedConfig.lastSyncAt && (
            <div className="text-xs text-text-secondary">
              Letzte Synchronisierung:{" "}
              {new Date(typedConfig.lastSyncAt).toLocaleString("de-DE")}
              {typedConfig.lastSyncCount !== undefined &&
                ` — ${typedConfig.lastSyncCount} Einträge`}
            </div>
          )}

          {/* User filter */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border/40">
            <FieldLabel>Coda-User filtern</FieldLabel>
            {codaUsers.length > 0 ? (
              <select
                value={typedConfig.codaUserValue ?? ""}
                onChange={(e) => handleSaveUserFilter(e.target.value)}
                className={selectClasses}
              >
                <option value="">— Alle User (kein Filter) —</option>
                {codaUsers.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            ) : typedConfig.codaUserValue ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-primary">
                  {typedConfig.codaUserValue}
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveUserFilter("")}
                  className="text-xs text-text-muted hover:text-text-secondary underline"
                >
                  Entfernen
                </button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadUsers}
                loading={loadingUsers}
                className="w-full sm:w-auto"
              >
                User-Werte laden
              </Button>
            )}
            <p className="text-xs text-text-muted">
              Nur Einträge dieses Users importieren.
            </p>
          </div>

          {/* Sync button */}
          {hasMappings && (
            <Button
              onClick={handleSync}
              loading={syncing}
              disabled={syncing || !!typedConfig.isSyncing}
              className="w-full sm:w-auto"
            >
              {typedConfig.isSyncing
                ? "Synchronisierung läuft..."
                : syncing
                  ? "Synchronisiere..."
                  : "Jetzt synchronisieren"}
            </Button>
          )}

          {/* Delete button */}
          <div className="pt-2 border-t border-border/40">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              Konfiguration löschen
            </Button>
          </div>
        </SectionCard>

        {/* Mappings section */}
        <CodaSyncMappings config={{ ...typedConfig, projectId }} />

        {/* Sync history */}
        <SyncHistory
          syncHistory={syncHistory}
          historyExpanded={historyExpanded}
          setHistoryExpanded={setHistoryExpanded}
          expandedLogId={expandedLogId}
          setExpandedLogId={setExpandedLogId}
        />

        {/* Delete confirmation dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title="Konfiguration löschen"
        >
          <p className="text-sm text-text-secondary mb-4">
            Möchtest du die Coda-Verbindung wirklich löschen? Alle
            Synchronisierungs-Logs werden ebenfalls entfernt. Bereits
            importierte Zeiteinträge bleiben erhalten.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteDialog(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={deleting}
              onClick={handleDeleteConfig}
            >
              Löschen
            </Button>
          </div>
        </Dialog>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state — connection form
  // ---------------------------------------------------------------------------

  const columns =
    testResult?.success === true ? testResult.columns : [];

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <SectionCard
        title="Coda Zeiterfassung"
        icon={<Link2 className="h-4 w-4 text-text-secondary" />}
        gradient="from-blue-500 to-indigo-500"
      >
        <p className="text-xs text-text-secondary -mt-2 mb-1">
          Verbinde deine Coda-Zeiterfassungstabelle, um Einträge in Velo zu
          importieren.
        </p>

        {/* API Token */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>API Token</FieldLabel>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Coda API Token"
              className={cn(inputClasses, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Document ID */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Document ID</FieldLabel>
          <input
            type="text"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            placeholder="z.B. dAbCdEfGhI"
            className={inputClasses}
          />
        </div>

        {/* Table ID */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Table ID</FieldLabel>
          <input
            type="text"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            placeholder="z.B. grid-abc123"
            className={inputClasses}
          />
        </div>

        {/* Test connection button */}
        <Button
          variant="secondary"
          onClick={handleTestConnection}
          loading={testing}
          disabled={!apiToken.trim() || !docId.trim() || !tableId.trim()}
          className="w-full sm:w-auto"
        >
          Verbindung testen
        </Button>

        {/* Test result feedback */}
        {testResult && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm",
              testResult.success
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            )}
          >
            {testResult.success ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Verbindung erfolgreich — {testResult.columns.length} Spalten
                gefunden.
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 shrink-0" />
                {testResult.error}
              </>
            )}
          </div>
        )}

        {/* Column mapping (after successful test) */}
        {columns.length > 0 && (
          <div className="flex flex-col gap-4 pt-2 border-t border-border/40">
            <h3 className="text-xs font-semibold text-text-primary">
              Spalten-Zuordnung
            </h3>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Task-Spalte</FieldLabel>
              <select
                value={taskColumn}
                onChange={(e) => setTaskColumn(e.target.value)}
                className={selectClasses}
              >
                <option value="">— Spalte wählen —</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Dauer-Spalte</FieldLabel>
              <select
                value={durationColumn}
                onChange={(e) => setDurationColumn(e.target.value)}
                className={selectClasses}
              >
                <option value="">— Spalte wählen —</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted">
                Unterstützte Formate: &quot;1:30&quot; (H:MM),
                &quot;1.5&quot; (Stunden), &quot;2h&quot;, &quot;30m&quot;
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Datum-Spalte</FieldLabel>
              <select
                value={dateColumn}
                onChange={(e) => setDateColumn(e.target.value)}
                className={selectClasses}
              >
                <option value="">— Spalte wählen —</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Notizen-Spalte</FieldLabel>
              <select
                value={notesColumn}
                onChange={(e) => setNotesColumn(e.target.value)}
                className={selectClasses}
              >
                <option value="">— Spalte wählen —</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>User-Spalte</FieldLabel>
              <select
                value={userColumn}
                onChange={(e) => setUserColumn(e.target.value)}
                className={selectClasses}
              >
                <option value="">— Spalte wählen —</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleSaveConfig}
              loading={saving}
              className="w-full sm:w-auto"
            >
              Konfiguration speichern
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sync History sub-component
// ---------------------------------------------------------------------------

function SyncHistory({
  syncHistory,
  historyExpanded,
  setHistoryExpanded,
  expandedLogId,
  setExpandedLogId,
}: {
  syncHistory: SyncHistoryEntry[] | undefined;
  historyExpanded: boolean;
  setHistoryExpanded: (v: boolean) => void;
  expandedLogId: string | null;
  setExpandedLogId: (v: string | null) => void;
}) {
  if (!syncHistory) return null;

  return (
    <SectionCard
      title="Synchronisierungs-Verlauf"
      gradient="from-slate-400 to-slate-500"
    >
      {syncHistory.length === 0 ? (
        <p className="text-xs text-text-muted">
          Noch keine Synchronisierungen durchgeführt.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            {historyExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {syncHistory.length} Synchronisierung
            {syncHistory.length !== 1 && "en"}
          </button>

          {historyExpanded && (
            <div className="flex flex-col gap-2">
              {syncHistory.map((entry) => {
                const isExpanded = expandedLogId === entry.id;
                const hasErrors =
                  entry.errors && entry.errors.length > 0;

                return (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-border/50 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLogId(isExpanded ? null : entry.id)
                      }
                      className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-surface/50 transition-colors"
                    >
                      <span className="text-xs text-text-secondary tabular-nums">
                        {new Date(entry.syncedAt).toLocaleString("de-DE")}
                      </span>
                      <div className="flex items-center gap-2">
                        <CountBadge
                          count={entry.entriesImported}
                          variant="green"
                        />
                        <CountBadge
                          count={entry.entriesSkipped}
                          variant="amber"
                        />
                        {hasErrors && (
                          <CountBadge
                            count={entry.errors!.length}
                            variant="red"
                          />
                        )}
                        <StatusBadge status={entry.status} />
                      </div>
                    </button>

                    {isExpanded && hasErrors && (
                      <div className="px-3.5 pb-3 border-t border-border/40">
                        <ul className="mt-2 flex flex-col gap-1">
                          {entry.errors!.map((err, i) => (
                            <li
                              key={i}
                              className="text-xs text-red-600 flex gap-1.5"
                            >
                              <span className="text-text-muted shrink-0">
                                Zeile {err.row}:
                              </span>
                              {err.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
