import { z } from "zod";

// Task status type
export type TaskStatus = 'completed' | 'partial' | 'not_started' | 'not_needed';

// Task schema for frontend
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  subject: z.string(),
  duration: z.number(),
  resources: z.string().optional(),
  scheduledDate: z.string(), // ISO date string
  status: z.enum(['completed', 'partial', 'not_started', 'not_needed']),
  cloudId: z.string(),
});

export type Task = z.infer<typeof taskSchema>;

// Weekly progress data type
export type WeeklyProgress = {
  day: string;
  shortDay: string;
  percentage: number;
};

// Subject progress type
export type SubjectProgress = {
  subject: string;
  percentage: number;
};

// Upcoming task type (simplified version of Task)
export type UpcomingTask = {
  id: number;
  title: string;
  date: string;
  relativeDay: string;
  duration: number;
  status: TaskStatus;
};
