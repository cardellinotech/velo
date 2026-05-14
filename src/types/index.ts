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

export interface BillingEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  epicId: string | null;
  epicName: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  description: string | null;
  isManual: boolean;
  hourlyRate: number | null;
}
