"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CodaSyncConfig {
  _id: Id<"codaSyncConfigs">;
  projectId: Id<"projects">;
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
  taskMappings: { codaValue: string; taskId: Id<"tasks"> }[];
  lastSyncAt?: number;
  lastSyncCount?: number;
}

interface MappingEntry {
  codaValue: string;
  taskId: Id<"tasks"> | "";
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const selectClasses = cn(
  "h-8 w-full rounded-lg border border-border/60 bg-white px-2.5 text-xs text-text-primary",
  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
  "hover:border-slate-300 transition-all duration-150"
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CodaSyncMappings({ config }: { config: CodaSyncConfig }) {
  const toast = useToast();
  const tasks = useQuery(api.tasks.listByProject, {
    projectId: config.projectId,
  });
  const saveConfigMutation = useMutation(api.codaSync.saveConfig);
  const fetchValuesAction = useAction(api.codaSync.fetchUniqueCodaValues);

  const [codaValues, setCodaValues] = useState<string[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [mappings, setMappings] = useState<MappingEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [valuesLoaded, setValuesLoaded] = useState(false);

  // Initialize mappings from config when Coda values are loaded
  useEffect(() => {
    if (codaValues.length > 0 && !valuesLoaded) {
      const initialMappings: MappingEntry[] = codaValues.map((codaValue) => {
        const existingTask = config.taskMappings.find(
          (m) => m.codaValue === codaValue
        );
        return {
          codaValue,
          taskId: existingTask?.taskId ?? "",
        };
      });
      setMappings(initialMappings);
      setValuesLoaded(true);
    }
  }, [codaValues, config.taskMappings, valuesLoaded]);

  async function handleLoadValues() {
    setLoadingValues(true);
    try {
      const result = await fetchValuesAction({
        codaApiToken: config.codaApiToken,
        codaDocId: config.codaDocId,
        codaTableId: config.codaTableId,
        columnName: config.columnMapping.task,
      });
      if (result.success) {
        setCodaValues(result.values);
        setValuesLoaded(false); // trigger re-init of mappings
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Fehler beim Laden der Coda-Werte.");
    } finally {
      setLoadingValues(false);
    }
  }

  async function handleSaveMappings() {
    setSaving(true);
    try {
      const taskMappings = mappings
        .filter((m) => m.taskId)
        .map((m) => ({
          codaValue: m.codaValue,
          taskId: m.taskId as Id<"tasks">,
        }));

      await saveConfigMutation({
        projectId: config.projectId,
        codaApiToken: config.codaApiToken,
        codaDocId: config.codaDocId,
        codaTableId: config.codaTableId,
        columnMapping: config.columnMapping,
        taskMappings,
      });
      toast.success("Mappings gespeichert.");
    } catch {
      toast.error("Fehler beim Speichern der Mappings.");
    } finally {
      setSaving(false);
    }
  }

  function updateMapping(index: number, taskId: Id<"tasks"> | "") {
    setMappings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], taskId };
      return next;
    });
  }

  return (
    <div className="relative bg-white rounded-xl border border-border/60 overflow-hidden shadow-card">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-orange-500" />
      <div className="px-6 pt-6 pb-5">
        <h2 className="text-sm font-semibold text-text-primary mb-2">
          Task-Zuordnung
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Ordne jeden Coda-Eintrag einem Task in diesem Projekt zu. Nicht
          zugeordnete Einträge werden beim Sync übersprungen.
        </p>

        {/* Load values button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLoadValues}
          loading={loadingValues}
          className="mb-4"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Coda-Werte laden
        </Button>

        {/* Mapping table */}
        {mappings.length > 0 && tasks && (
          <>
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface/50 border-b border-border/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">
                      Coda-Wert
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">
                      Task
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {mappings.map((entry, i) => (
                    <tr
                      key={entry.codaValue}
                      className={cn(!entry.taskId && "bg-amber-50/60")}
                    >
                      <td className="px-3 py-2 text-xs text-text-primary font-medium">
                        {entry.codaValue}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={entry.taskId}
                          onChange={(e) =>
                            updateMapping(
                              i,
                              e.target.value as Id<"tasks"> | ""
                            )
                          }
                          className={selectClasses}
                        >
                          <option value="">— Task wählen —</option>
                          {tasks.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Button
                onClick={handleSaveMappings}
                loading={saving}
                className="w-full sm:w-auto"
              >
                Mappings speichern
              </Button>
            </div>
          </>
        )}

        {/* Empty state after loading */}
        {valuesLoaded && codaValues.length === 0 && (
          <p className="text-xs text-text-muted">
            Keine Werte in der Task-Spalte gefunden.
          </p>
        )}
      </div>
    </div>
  );
}
