import type { TaskType, TaskStatus, Priority } from "@/lib/constants";

export type { TaskType, TaskStatus, Priority };

export interface Project {
  id: string;
  userId: string;
  name: string;
  clientName?: string;
  description?: string;
  status: "active" | "archived";
  hourlyRate?: number;
  currency?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Epic {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  status: "open" | "closed";
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  epicId?: string;
  userId: string;
  title: string;
  description?: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: Priority;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  description?: string;
  isManual: boolean;
  createdAt: number;
}

export interface RecurringTaskTemplate {
  id: string;
  userId: string;
  projectId: string;
  epicId?: string;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: Priority;
  recurrence: "daily" | "weekly" | "monthly";
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  nextDueDate: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DailyPlanItem {
  id: string;
  userId: string;
  date: string;
  taskId?: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Invoice {
  id: string;
  userId: string;
  projectId?: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate: number;
  dueDate?: number;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  notes?: string;
  currency: string;
  createdAt: number;
  updatedAt: number;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface UserSettings {
  id: string;
  userId: string;
  nextInvoiceNumber: number;
  defaultCurrency: string;
  businessName?: string;
  businessAddress?: string;
  vatId?: string;
  taxRate?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
  paymentTermDays?: number;
  invoicePrefix?: string;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  createdAt: number;
}

export type WikiPage = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  parentPageId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type TimeBlock = {
  id: string;
  userId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  projectId: string | null;
  taskId: string | null;
  color: string | null;
  googleEventId: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  // Enriched fields:
  projectName?: string | null;
  projectColor?: string | null;
};

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isGoogleEvent: true;
};

export interface BillingEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  taskType: string;
  projectId: string;
  projectName: string;
  clientName: string | null;
  currency: string | null;
  epicId: string | null;
  epicName: string | null;
  startTime: number;
  durationMs: number;
  description: string | null;
  hourlyRate: string | null;
}
