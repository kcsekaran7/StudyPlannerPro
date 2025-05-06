import { z } from "zod";

// Task status type
export type TaskStatus = 'completed' | 'partial' | 'not_started' | 'not_needed';

// Task type (matches Google Sheet CSV structure)
export interface Task {
  id: number;
  title: string;
  description?: string;
  subject: string;
  duration: number; // in minutes
  resources?: string | undefined;
  cloudId: string;
  status: TaskStatus;
  scheduledDate: string; // ISO date string
}

// Composite type with task and status
export type TaskWithStatus = Task;

// Zod schema for external task data (e.g., from Google Sheets)
export const externalTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  subject: z.string(),
  duration: z.number(),
  resources: z.string().optional(),
  scheduledDate: z.string(), // ISO date string
});

// Zod schema for status updates (e.g., for Apps Script)
export const statusUpdateSchema = z.object({
  taskId: z.number(),
  status: z.enum(['completed', 'partial', 'not_started', 'not_needed']),
});

// Types for API interactions
export type ExternalTask = z.infer<typeof externalTaskSchema>;
export type StatusUpdate = z.infer<typeof statusUpdateSchema>;