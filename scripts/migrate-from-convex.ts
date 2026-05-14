import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

// Convex ID → new UUID
const idMap = new Map<string, string>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readJsonl(filename: string): Promise<any[]> {
  const filepath = path.join("./convex-export", filename);
  if (!fs.existsSync(filepath)) {
    console.log(`  Skipping ${filename} (not found)`);
    return [];
  }
  const rl = readline.createInterface({
    input: fs.createReadStream(filepath),
    crlfDelay: Infinity,
  });
  const records: any[] = [];
  for await (const line of rl) {
    if (line.trim()) records.push(JSON.parse(line));
  }
  return records;
}

function mapId(convexId: string): string {
  const uuid = idMap.get(convexId);
  if (!uuid) throw new Error(`No UUID mapping for Convex ID: ${convexId}`);
  return uuid;
}

function maybeMapId(convexId: string | null | undefined): string | null {
  if (!convexId) return null;
  return idMap.get(convexId) ?? null;
}

function numToStr(val: number | string | null | undefined): string | null {
  if (val === null || val === undefined) return null;
  return String(val);
}

// ---------------------------------------------------------------------------
// Migration functions
// ---------------------------------------------------------------------------

async function migrateUsers() {
  console.log("Migrating users...");
  const records = await readJsonl("users.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.users).values({
      id: newId,
      name: r.name ?? null,
      email: r.email,
      emailVerified: null,
      image: r.image ?? null,
      passwordHash: null, // set via set-password.ts after migration
    });
    count++;
  }
  console.log(`  Migrated ${count} users`);
}

async function migrateProjects() {
  console.log("Migrating projects...");
  const records = await readJsonl("projects.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.projects).values({
      id: newId,
      userId: mapId(r.userId),
      name: r.name,
      clientName: r.clientName ?? null,
      description: r.description ?? null,
      hourlyRate: numToStr(r.hourlyRate),
      currency: r.currency ?? null,
      status: r.status ?? "active",
      createdAt: r._creationTime,
      updatedAt: r._creationTime,
    });
    count++;
  }
  console.log(`  Migrated ${count} projects`);
}

async function migrateEpics() {
  console.log("Migrating epics...");
  const records = await readJsonl("epics.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.epics).values({
      id: newId,
      projectId: mapId(r.projectId),
      userId: mapId(r.userId),
      name: r.name,
      description: r.description ?? null,
      status: r.status ?? "open",
      color: r.color ?? null,
      createdAt: r._creationTime,
      updatedAt: r._creationTime,
    });
    count++;
  }
  console.log(`  Migrated ${count} epics`);
}

async function migrateRecurringTaskTemplates() {
  console.log("Migrating recurring task templates...");
  const records = await readJsonl("recurringTaskTemplates.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.recurringTaskTemplates).values({
      id: newId,
      projectId: mapId(r.projectId),
      epicId: maybeMapId(r.epicId),
      userId: mapId(r.userId),
      title: r.title,
      description: r.description ?? null,
      taskType: r.taskType,
      priority: r.priority,
      // Convex field: recurrenceType → schema field: recurrence
      recurrence: r.recurrenceType ?? r.recurrence,
      dayOfWeek: r.dayOfWeek ?? null,
      dayOfMonth: r.dayOfMonth ?? null,
      nextDueDate: typeof r.nextDueDate === "number" ? r.nextDueDate : r._creationTime,
      lastCreatedAt: r.lastCreatedAt ?? null,
      isActive: r.isActive ?? true,
      createdAt: r._creationTime,
      updatedAt: r._creationTime,
    });
    count++;
  }
  console.log(`  Migrated ${count} recurring task templates`);
}

async function migrateTasks() {
  console.log("Migrating tasks...");
  const records = await readJsonl("tasks.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.tasks).values({
      id: newId,
      projectId: mapId(r.projectId),
      epicId: maybeMapId(r.epicId),
      userId: mapId(r.userId),
      title: r.title,
      description: r.description ?? null,
      taskType: r.taskType,
      status: r.status ?? "todo",
      priority: r.priority ?? "medium",
      order: r.order ?? 0,
      recurringTemplateId: maybeMapId(r.recurringTemplateId),
      createdAt: r._creationTime,
      updatedAt: r._creationTime,
    });
    count++;
  }
  console.log(`  Migrated ${count} tasks`);
}

async function migrateTimeEntries() {
  console.log("Migrating time entries...");
  const records = await readJsonl("timeEntries.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.timeEntries).values({
      id: newId,
      taskId: mapId(r.taskId),
      projectId: mapId(r.projectId),
      userId: mapId(r.userId),
      startTime: r.startTime,
      endTime: r.endTime ?? null, // null = running timer
      duration: r.duration ?? null,
      description: r.description ?? null,
      isManual: r.isManual ?? false,
      createdAt: r._creationTime,
    });
    count++;
  }
  console.log(`  Migrated ${count} time entries`);
}

async function migrateInvoices() {
  console.log("Migrating invoices...");
  const records = await readJsonl("invoices.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.invoices).values({
      id: newId,
      userId: mapId(r.userId),
      projectId: mapId(r.projectId),
      invoiceNumber: r.invoiceNumber,
      status: r.status ?? "draft",
      currency: r.currency,
      issueDate: r.issueDate,
      dueDate: r.dueDate,
      clientName: r.clientName,
      clientAddress: r.clientAddress ?? null,
      senderName: r.senderName,
      senderAddress: r.senderAddress ?? null,
      vatId: r.vatId ?? null,
      // numeric fields: Drizzle expects string for numeric columns
      taxRate: numToStr(r.taxRate),
      bankName: r.bankName ?? null,
      iban: r.iban ?? null,
      bic: r.bic ?? null,
      paymentTermDays: r.paymentTermDays ?? null,
      lineItems: r.lineItems ?? [],
      subtotal: numToStr(r.subtotal) ?? "0",
      taxAmount: numToStr(r.taxAmount),
      total: numToStr(r.total) ?? "0",
      notes: r.notes ?? null,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      createdAt: r._creationTime,
      updatedAt: r._creationTime,
    });
    count++;
  }
  console.log(`  Migrated ${count} invoices`);
}

async function migrateDailyPlanItems() {
  console.log("Migrating daily plan items...");
  const records = await readJsonl("dailyPlanItems.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.dailyPlanItems).values({
      id: newId,
      userId: mapId(r.userId),
      date: r.date,
      taskId: maybeMapId(r.taskId),
      title: r.title,
      projectName: r.projectName ?? null,
      isCompleted: r.isCompleted ?? false,
      order: r.order ?? 0,
      createdAt: r._creationTime,
    });
    count++;
  }
  console.log(`  Migrated ${count} daily plan items`);
}

async function migrateCodaSyncConfigs() {
  console.log("Migrating Coda sync configs...");
  const records = await readJsonl("codaSyncConfigs.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.codaSyncConfigs).values({
      id: newId,
      userId: mapId(r.userId),
      projectId: maybeMapId(r.projectId),
      codaApiToken: r.codaApiToken,
      codaDocId: r.codaDocId,
      codaTableId: r.codaTableId,
      columnMapping: r.columnMapping,
      projectMappings: r.projectMappings ?? [],
      taskMappings: r.taskMappings ?? [],
      codaUserValue: r.codaUserValue ?? null,
      lastSyncAt: r.lastSyncAt ?? null,
      lastSyncCount: r.lastSyncCount ?? null,
      isSyncing: r.isSyncing ?? false,
      createdAt: r._creationTime,
      updatedAt: r._creationTime,
    });
    count++;
  }
  console.log(`  Migrated ${count} Coda sync configs`);
}

async function migrateCodaSyncLog() {
  console.log("Migrating Coda sync log...");
  const records = await readJsonl("codaSyncLog.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.codaSyncLog).values({
      id: newId,
      userId: mapId(r.userId),
      // Convex field: configId maps to codaSyncConfigs
      configId: mapId(r.configId),
      syncedAt: r.syncedAt,
      entriesImported: r.entriesImported ?? 0,
      entriesSkipped: r.entriesSkipped ?? 0,
      errors: r.errors ?? null,
      status: r.status,
    });
    count++;
  }
  console.log(`  Migrated ${count} Coda sync log entries`);
}

async function migrateUserSettings() {
  console.log("Migrating user settings...");
  const records = await readJsonl("userSettings.jsonl");
  let count = 0;
  for (const r of records) {
    const newId = randomUUID();
    idMap.set(r._id, newId);

    await db.insert(schema.userSettings).values({
      id: newId,
      userId: mapId(r.userId),
      defaultCurrency: r.defaultCurrency ?? "EUR",
      businessName: r.businessName ?? null,
      businessAddress: r.businessAddress ?? null,
      vatId: r.vatId ?? null,
      taxRate: numToStr(r.taxRate),
      bankName: r.bankName ?? null,
      iban: r.iban ?? null,
      bic: r.bic ?? null,
      paymentTermDays: r.paymentTermDays ?? null,
      invoicePrefix: r.invoicePrefix ?? null,
      nextInvoiceNumber: r.nextInvoiceNumber ?? 1,
    });
    count++;
  }
  console.log(`  Migrated ${count} user settings`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Starting Convex → PostgreSQL migration...\n");

  // FK dependency order: parents before children
  await migrateUsers();
  await migrateProjects();
  await migrateEpics();
  await migrateRecurringTaskTemplates();
  await migrateTasks();
  await migrateTimeEntries();
  await migrateInvoices();
  await migrateDailyPlanItems();
  await migrateCodaSyncConfigs();
  await migrateCodaSyncLog();
  await migrateUserSettings();

  console.log("\nMigration complete!");
  console.log(
    "Next: Run `npx tsx scripts/set-password.ts <email> <password>` to set user passwords."
  );
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
