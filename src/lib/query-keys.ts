export const queryKeys = {
  user: {
    me: () => ["user", "me"] as const,
  },
  projects: {
    all: () => ["projects"] as const,
    active: () => ["projects", "active"] as const,
    archived: () => ["projects", "archived"] as const,
    detail: (id: string) => ["projects", id] as const,
  },
  epics: {
    byProject: (projectId: string) => ["epics", "by-project", projectId] as const,
    detail: (id: string) => ["epics", id] as const,
  },
  tasks: {
    byProject: (projectId: string) => ["tasks", "by-project", projectId] as const,
    byEpic: (epicId: string) => ["tasks", "by-epic", epicId] as const,
    detail: (id: string) => ["tasks", id] as const,
  },
  timeEntries: {
    active: () => ["time-entries", "active"] as const,
    byTask: (taskId: string) => ["time-entries", "by-task", taskId] as const,
    range: (start: number, end: number) => ["time-entries", "range", start, end] as const,
  },
  recurringTasks: {
    all: () => ["recurring-tasks"] as const,
    detail: (id: string) => ["recurring-tasks", id] as const,
  },
  dailyPlan: {
    byDate: (date: string) => ["daily-plan", date] as const,
    searchTasks: (query: string) => ["daily-plan", "search", query] as const,
  },
  invoices: {
    all: (status?: string) => (status ? ["invoices", { status }] : ["invoices"]) as readonly unknown[],
    detail: (id: string) => ["invoices", id] as const,
  },
  billing: {
    entries: (params?: { startDate?: number; endDate?: number; projectId?: string }) =>
      ["billing", "entries", params] as const,
    summary: (params?: { startDate?: number; endDate?: number; projectId?: string }) =>
      ["billing", "summary", params] as const,
  },
  userSettings: {
    all: () => ["user-settings"] as const,
  },
  dashboard: {
    stats: () => ["dashboard", "stats"] as const,
    recentTasks: () => ["dashboard", "recent-tasks"] as const,
  },
  coda: {
    config: (projectId: string) => ["coda", "config", projectId] as const,
    history: (projectId: string) => ["coda", "config", projectId, "history"] as const,
  },
} as const;
