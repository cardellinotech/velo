import type {
  User,
  Project,
  Epic,
  Task,
  TimeEntry,
  RecurringTaskTemplate,
  DailyPlanItem,
  Invoice,
  UserSettings,
  BillingEntry,
  WikiPage,
  TimeBlock,
  GoogleCalendarEvent,
  WeeklyGoalsRecord,
  MonthlyGoal,
  MonthlyGoalsRecord,
  MonthStats,
  Habit,
  HabitLog,
} from "@/types";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (res.status === 404) throw new Error("NOT_FOUND");
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  user: {
    me: () => fetchJson<User>("/api/users/me"),
  },
  projects: {
    list: () => fetchJson<Project[]>("/api/projects"),
    listActive: () => fetchJson<Project[]>("/api/projects/active"),
    listArchived: () => fetchJson<Project[]>("/api/projects/archived"),
    get: (id: string) => fetchJson<Project>(`/api/projects/${id}`),
    create: (data: {
      name: string;
      description?: string;
      status?: string;
      hourlyRate?: number;
      currency?: string;
    }) =>
      fetchJson<Project>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Project>) =>
      fetchJson<Project>(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    archive: (id: string) =>
      fetchJson<void>(`/api/projects/${id}/archive`, { method: "POST" }),
    unarchive: (id: string) =>
      fetchJson<void>(`/api/projects/${id}/unarchive`, { method: "POST" }),
  },
  epics: {
    listByProject: (projectId: string) =>
      fetchJson<Epic[]>(`/api/epics/by-project/${projectId}`),
    get: (id: string) => fetchJson<Epic>(`/api/epics/${id}`),
    create: (data: { projectId: string; name: string; description?: string }) =>
      fetchJson<Epic>("/api/epics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Epic>) =>
      fetchJson<Epic>(`/api/epics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    close: (id: string) =>
      fetchJson<void>(`/api/epics/${id}/close`, { method: "POST" }),
    reopen: (id: string) =>
      fetchJson<void>(`/api/epics/${id}/reopen`, { method: "POST" }),
  },
  tasks: {
    listByProject: (projectId: string) =>
      fetchJson<Task[]>(`/api/tasks/by-project/${projectId}`),
    listByEpic: (epicId: string) =>
      fetchJson<Task[]>(`/api/tasks/by-epic/${epicId}`),
    get: (id: string) => fetchJson<Task>(`/api/tasks/${id}`),
    create: (data: {
      projectId: string;
      epicId?: string;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
    }) =>
      fetchJson<Task>("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Task>) =>
      fetchJson<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<void>(`/api/tasks/${id}`, { method: "DELETE" }),
    moveToColumn: (id: string, data: { status: string; order?: number }) =>
      fetchJson<void>(`/api/tasks/${id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    reorder: (id: string, data: { order: number }) =>
      fetchJson<void>(`/api/tasks/${id}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  },
  timeEntries: {
    getActive: () => fetchJson<TimeEntry | null>("/api/time-entries/active"),
    listByDateRange: (start: number, end: number) =>
      fetchJson<TimeEntry[]>(`/api/time-entries/range?start=${start}&end=${end}`),
    listByTask: (taskId: string) =>
      fetchJson<TimeEntry[]>(`/api/time-entries/by-task/${taskId}`),
    start: (data: { taskId: string }) =>
      fetchJson<TimeEntry>("/api/time-entries/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    stop: () =>
      fetchJson<TimeEntry>("/api/time-entries/stop", { method: "POST" }),
    stopForTask: (taskId: string) =>
      fetchJson<void>("/api/time-entries/stop-for-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      }),
    create: (data: {
      taskId: string;
      projectId: string;
      startTime: number;
      endTime: number;
      description?: string;
    }) =>
      fetchJson<TimeEntry>("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<TimeEntry>) =>
      fetchJson<TimeEntry>(`/api/time-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<void>(`/api/time-entries/${id}`, { method: "DELETE" }),
  },
  recurringTasks: {
    list: () => fetchJson<RecurringTaskTemplate[]>("/api/recurring-tasks"),
    get: (id: string) =>
      fetchJson<RecurringTaskTemplate>(`/api/recurring-tasks/${id}`),
    create: (data: unknown) =>
      fetchJson<RecurringTaskTemplate>("/api/recurring-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      fetchJson<RecurringTaskTemplate>(`/api/recurring-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<void>(`/api/recurring-tasks/${id}`, { method: "DELETE" }),
    toggle: (id: string) =>
      fetchJson<void>(`/api/recurring-tasks/${id}/toggle`, { method: "POST" }),
  },
  dailyPlan: {
    get: (date: string) =>
      fetchJson<DailyPlanItem[]>(`/api/daily-plan?date=${date}`),
    create: (data: unknown) =>
      fetchJson<DailyPlanItem>("/api/daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    searchTasks: (query: string, date: string, projectId?: string) =>
      fetchJson<Task[]>(
        `/api/daily-plan/search-tasks?search=${encodeURIComponent(query)}&date=${date}${projectId ? `&projectId=${projectId}` : ""}`
      ),
    toggle: (id: string) =>
      fetchJson<void>(`/api/daily-plan/${id}/toggle`, { method: "POST" }),
    delete: (id: string) =>
      fetchJson<void>(`/api/daily-plan/${id}`, { method: "DELETE" }),
    reorder: (data: unknown) =>
      fetchJson<void>("/api/daily-plan/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    copyToDate: (data: unknown) =>
      fetchJson<void>("/api/daily-plan/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  },
  invoices: {
    list: (params?: { status?: string }) => {
      const qs = params?.status ? `?status=${params.status}` : "";
      return fetchJson<Invoice[]>(`/api/invoices${qs}`);
    },
    get: (id: string) => fetchJson<Invoice>(`/api/invoices/${id}`),
    create: (data: unknown) =>
      fetchJson<Invoice>("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      fetchJson<Invoice>(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<void>(`/api/invoices/${id}`, { method: "DELETE" }),
    updateStatus: (id: string, status: string) =>
      fetchJson<void>(`/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
  },
  billing: {
    entries: (params?: { startDate?: number; endDate?: number; projectId?: string }) => {
      const qs = new URLSearchParams();
      if (params?.startDate !== undefined) qs.set("startDate", String(params.startDate));
      if (params?.endDate !== undefined) qs.set("endDate", String(params.endDate));
      if (params?.projectId) qs.set("projectId", params.projectId);
      const q = qs.toString();
      return fetchJson<BillingEntry[]>(`/api/billing/entries${q ? `?${q}` : ""}`);
    },
    summary: (params?: { startDate?: number; endDate?: number; projectId?: string }) => {
      const qs = new URLSearchParams();
      if (params?.startDate !== undefined) qs.set("startDate", String(params.startDate));
      if (params?.endDate !== undefined) qs.set("endDate", String(params.endDate));
      if (params?.projectId) qs.set("projectId", params.projectId);
      const q = qs.toString();
      return fetchJson<unknown>(`/api/billing/summary${q ? `?${q}` : ""}`);
    },
  },
  userSettings: {
    get: () => fetchJson<UserSettings>("/api/user-settings"),
    update: (data: Partial<UserSettings>) =>
      fetchJson<UserSettings>("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  },
  dashboard: {
    stats: () => fetchJson<unknown>("/api/dashboard/stats"),
    recentTasks: () => fetchJson<Task[]>("/api/dashboard/recent-tasks"),
  },
  wiki: {
    list: (params?: { tag?: string; search?: string }) => {
      const qs = new URLSearchParams();
      if (params?.tag) qs.set("tag", params.tag);
      if (params?.search) qs.set("search", params.search);
      const q = qs.toString();
      return fetchJson<WikiPage[]>(`/api/wiki${q ? `?${q}` : ""}`);
    },
    get: (slug: string) => fetchJson<WikiPage>(`/api/wiki/${slug}`),
    create: (data: { title: string; content?: string; tags?: string[]; parentPageId?: string }) =>
      fetchJson<WikiPage>("/api/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    update: (slug: string, data: { title?: string; content?: string; tags?: string[]; parentPageId?: string }) =>
      fetchJson<WikiPage>(`/api/wiki/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    delete: (slug: string) =>
      fetchJson<void>(`/api/wiki/${slug}`, { method: "DELETE" }),
  },
  timeBlocks: {
    listByWeek: (weekStart: string) =>
      fetchJson<TimeBlock[]>(`/api/time-blocks?weekStart=${weekStart}`),
    create: (data: {
      title: string; date: string; startTime: string; endTime: string;
      projectId?: string; taskId?: string; color?: string; notes?: string;
      syncToCalendar?: boolean;
    }) =>
      fetchJson<TimeBlock>("/api/time-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<TimeBlock>) =>
      fetchJson<TimeBlock>(`/api/time-blocks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<void>(`/api/time-blocks/${id}`, { method: "DELETE" }),
  },
  googleCalendar: {
    events: (weekStart: string) =>
      fetchJson<GoogleCalendarEvent[]>(`/api/google-calendar/events?weekStart=${weekStart}`),
    connect: () => {
      window.location.href = "/api/auth/google-calendar";
    },
    disconnect: () =>
      fetchJson<void>("/api/auth/google-calendar/disconnect", { method: "DELETE" }),
    status: () =>
      fetchJson<{ connected: boolean }>("/api/google-calendar/status"),
  },
  weeklyGoals: {
    get: (weekStart: string) =>
      fetchJson<WeeklyGoalsRecord | null>(`/api/weekly-goals?weekStart=${weekStart}`),
    upsert: (data: { weekStart: string; goals?: WeeklyGoalsRecord["goals"]; weekReview?: string }) =>
      fetchJson<WeeklyGoalsRecord>("/api/weekly-goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  },
  monthlyGoals: {
    get: (month: string) =>
      fetchJson<MonthlyGoalsRecord | null>(`/api/monthly-goals?month=${month}`),
    upsert: (data: { month: string; goals?: MonthlyGoal[]; monthReview?: string }) =>
      fetchJson<MonthlyGoalsRecord>("/api/monthly-goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  },
  monthStats: {
    get: (month: string) =>
      fetchJson<MonthStats>(`/api/month-stats?month=${month}`),
  },
  habits: {
    list: (date: string) => fetchJson<Habit[]>(`/api/habits?date=${date}`),
    create: (data: { name: string; description?: string; color?: string; targetFrequency?: string; customDays?: number[] }) =>
      fetchJson<Habit>("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Habit>) =>
      fetchJson<Habit>(`/api/habits/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/api/habits/${id}`, { method: "DELETE" }),
    toggle: (data: { habitId: string; date: string; isCompleted: boolean }) =>
      fetchJson<HabitLog>("/api/habit-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    logsRange: (startDate: string, endDate: string) =>
      fetchJson<HabitLog[]>(`/api/habit-logs/range?startDate=${startDate}&endDate=${endDate}`),
  },
  coda: {
    getConfig: (projectId: string) =>
      fetchJson<unknown>(`/api/coda/config/${projectId}`),
    saveConfig: (projectId: string, data: unknown) =>
      fetchJson<unknown>(`/api/coda/config/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    deleteConfig: (projectId: string) =>
      fetchJson<void>(`/api/coda/config/${projectId}`, { method: "DELETE" }),
    getHistory: (projectId: string) =>
      fetchJson<unknown[]>(`/api/coda/config/${projectId}/history`),
    testConnection: (data: unknown) =>
      fetchJson<unknown>("/api/coda/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    fetchValues: (data: unknown) =>
      fetchJson<unknown>("/api/coda/fetch-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    sync: (projectId: string) =>
      fetchJson<unknown>(`/api/coda/sync/${projectId}`, { method: "POST" }),
  },
};
