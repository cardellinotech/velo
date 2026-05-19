import {
  pgTable,
  text,
  integer,
  doublePrecision,
  boolean,
  bigint,
  jsonb,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
  numeric,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Auth.js required tables (@auth/drizzle-adapter compatible)
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"), // extra field for credentials auth
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ---------------------------------------------------------------------------
// Application tables
// ---------------------------------------------------------------------------

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    clientName: text("client_name"),
    description: text("description"),
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 4 }).$type<string>(),
    currency: text("currency"),
    status: text("status", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("projects_user_id_idx").on(t.userId),
    index("projects_user_id_status_idx").on(t.userId, t.status),
  ]
);

export const epics = pgTable(
  "epics",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", { enum: ["open", "closed"] })
      .notNull()
      .default("open"),
    color: text("color"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("epics_project_id_idx").on(t.projectId),
  ]
);

export const recurringTaskTemplates = pgTable(
  "recurring_task_templates",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    epicId: text("epic_id").references(() => epics.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    taskType: text("task_type", {
      enum: ["story", "task", "bug", "incident"],
    }).notNull(),
    priority: text("priority", {
      enum: ["low", "medium", "high", "urgent"],
    }).notNull(),
    recurrence: text("recurrence", {
      enum: ["daily", "weekly", "monthly"],
    }).notNull(),
    dayOfWeek: integer("day_of_week"),
    dayOfMonth: integer("day_of_month"),
    nextDueDate: bigint("next_due_date", { mode: "number" }).notNull(),
    lastCreatedAt: bigint("last_created_at", { mode: "number" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("rtt_user_id_idx").on(t.userId),
    index("rtt_project_id_idx").on(t.projectId),
    index("rtt_next_due_date_idx").on(t.nextDueDate),
  ]
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    epicId: text("epic_id").references(() => epics.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    taskType: text("task_type", {
      enum: ["story", "task", "bug", "incident"],
    }).notNull(),
    status: text("status", {
      enum: ["todo", "in_progress", "in_review", "done"],
    })
      .notNull()
      .default("todo"),
    priority: text("priority", {
      enum: ["low", "medium", "high", "urgent"],
    })
      .notNull()
      .default("medium"),
    order: doublePrecision("order").notNull().default(0),
    recurringTemplateId: text("recurring_template_id").references(
      () => recurringTaskTemplates.id,
      { onDelete: "set null" }
    ),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("tasks_project_id_idx").on(t.projectId),
    index("tasks_epic_id_idx").on(t.epicId),
    index("tasks_user_id_idx").on(t.userId),
  ]
);

export const timeEntries = pgTable(
  "time_entries",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startTime: bigint("start_time", { mode: "number" }).notNull(),
    endTime: bigint("end_time", { mode: "number" }),
    duration: bigint("duration", { mode: "number" }),
    description: text("description"),
    isManual: boolean("is_manual").notNull().default(false),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("time_entries_task_id_idx").on(t.taskId),
    index("time_entries_project_id_idx").on(t.projectId),
    index("time_entries_user_id_idx").on(t.userId),
    index("time_entries_user_start_idx").on(t.userId, t.startTime),
  ]
);

export const userSettings = pgTable("user_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  defaultCurrency: text("default_currency").notNull().default("EUR"),
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  vatId: text("vat_id"),
  taxRate: numeric("tax_rate", { precision: 12, scale: 4 }).$type<string>(),
  bankName: text("bank_name"),
  iban: text("iban"),
  bic: text("bic"),
  paymentTermDays: integer("payment_term_days"),
  invoicePrefix: text("invoice_prefix"),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
});

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type LineItem = {
  date?: number;
  description: string;
  hours: number;
  rate: number;
  amount: number;
};

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number").notNull(),
    status: text("status", { enum: ["draft", "sent", "paid", "overdue"] })
      .notNull()
      .default("draft"),
    currency: text("currency").notNull(),
    issueDate: bigint("issue_date", { mode: "number" }).notNull(),
    dueDate: bigint("due_date", { mode: "number" }).notNull(),
    clientName: text("client_name").notNull(),
    clientAddress: text("client_address"),
    senderName: text("sender_name").notNull(),
    senderAddress: text("sender_address"),
    vatId: text("vat_id"),
    taxRate: numeric("tax_rate", { precision: 12, scale: 4 }).$type<string>(),
    bankName: text("bank_name"),
    iban: text("iban"),
    bic: text("bic"),
    paymentTermDays: integer("payment_term_days"),
    lineItems: jsonb("line_items").notNull().default([]).$type<LineItem[]>(),
    subtotal: numeric("subtotal", { precision: 12, scale: 4 }).notNull().default("0").$type<string>(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 4 }).$type<string>(),
    total: numeric("total", { precision: 12, scale: 4 }).notNull().default("0").$type<string>(),
    notes: text("notes"),
    periodStart: bigint("period_start", { mode: "number" }).notNull(),
    periodEnd: bigint("period_end", { mode: "number" }).notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("invoices_user_id_idx").on(t.userId),
    index("invoices_project_id_idx").on(t.projectId),
  ]
);

export type ColumnMapping = {
  task: string;
  notes: string;
  duration: string;
  logDate: string;
  user: string;
};

export type ProjectMapping = { codaValue: string; projectId: string };
export type TaskMapping = { codaValue: string; taskId: string };
export type SyncError = { row: number; message: string };

export const dailyPlanItems = pgTable(
  "daily_plan_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    projectName: text("project_name"),
    isCompleted: boolean("is_completed").notNull().default(false),
    order: doublePrecision("order").notNull().default(0),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("daily_plan_user_date_idx").on(t.userId, t.date),
  ]
);

export const codaSyncConfigs = pgTable(
  "coda_sync_configs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    codaApiToken: text("coda_api_token").notNull(),
    codaDocId: text("coda_doc_id").notNull(),
    codaTableId: text("coda_table_id").notNull(),
    columnMapping: jsonb("column_mapping").notNull().$type<ColumnMapping>(),
    projectMappings: jsonb("project_mappings").default([]).$type<ProjectMapping[]>(),
    taskMappings: jsonb("task_mappings")
      .notNull()
      .default([])
      .$type<TaskMapping[]>(),
    codaUserValue: text("coda_user_value"),
    lastSyncAt: bigint("last_sync_at", { mode: "number" }),
    lastSyncCount: integer("last_sync_count"),
    isSyncing: boolean("is_syncing").default(false),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("coda_configs_user_id_idx").on(t.userId),
  ]
);

export const codaSyncLog = pgTable(
  "coda_sync_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    configId: text("config_id")
      .notNull()
      .references(() => codaSyncConfigs.id, { onDelete: "cascade" }),
    syncedAt: bigint("synced_at", { mode: "number" }).notNull(),
    entriesImported: integer("entries_imported").notNull().default(0),
    entriesSkipped: integer("entries_skipped").notNull().default(0),
    errors: jsonb("errors").$type<SyncError[]>(),
    status: text("status", {
      enum: ["success", "partial", "failed"],
    }).notNull(),
  },
  (t) => [
    index("coda_log_config_id_idx").on(t.configId),
  ]
);

export const wikiPages = pgTable(
  "wiki_pages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    parentPageId: text("parent_page_id"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("wiki_pages_user_id_idx").on(t.userId),
    uniqueIndex("wiki_pages_user_slug_unique").on(t.userId, t.slug),
  ]
);

export const timeBlocks = pgTable(
  "time_blocks",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    date: text("date").notNull(), // "YYYY-MM-DD"
    startTime: text("start_time").notNull(), // "HH:MM"
    endTime: text("end_time").notNull(), // "HH:MM"
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
    color: text("color"),
    googleEventId: text("google_event_id"), // reserved for Phase 14
    notes: text("notes"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("time_blocks_user_date_idx").on(t.userId, t.date),
  ]
);

export const googleCalendarTokens = pgTable(
  "google_calendar_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
    calendarId: text("calendar_id").notNull().default("primary"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [
    index("google_calendar_tokens_user_id_idx").on(t.userId),
  ]
);
