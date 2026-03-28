"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface CreateTaskContextValue {
  /** Current project ID (set when on a project board page) */
  projectId: Id<"projects"> | null;
  /** Register the active project — called by the project board page */
  registerProject: (projectId: Id<"projects">, openForm: () => void) => void;
  /** Unregister when leaving a project page */
  unregisterProject: () => void;
  /** Open the create task form from anywhere (e.g. Header) */
  openCreateTask: () => void;
}

const CreateTaskContext = createContext<CreateTaskContextValue | null>(null);

export function CreateTaskProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
  const [openFormFn, setOpenFormFn] = useState<(() => void) | null>(null);

  const registerProject = useCallback(
    (id: Id<"projects">, openForm: () => void) => {
      setProjectId(id);
      // Store fn in a wrapper to avoid React setState(fn) interpretation
      setOpenFormFn(() => openForm);
    },
    []
  );

  const unregisterProject = useCallback(() => {
    setProjectId(null);
    setOpenFormFn(null);
  }, []);

  const openCreateTask = useCallback(() => {
    openFormFn?.();
  }, [openFormFn]);

  return (
    <CreateTaskContext.Provider
      value={{ projectId, registerProject, unregisterProject, openCreateTask }}
    >
      {children}
    </CreateTaskContext.Provider>
  );
}

export function useCreateTask() {
  const ctx = useContext(CreateTaskContext);
  if (!ctx) {
    throw new Error("useCreateTask must be used within a CreateTaskProvider");
  }
  return ctx;
}
