import { format, addDays, subDays, isSameDay, parseISO, formatDistance } from "date-fns";
import { DAYS_OF_WEEK, SHORT_DAYS } from "./constants";

/**
 * Format a date as a readable string (e.g., "Monday, October 9, 2023")
 */
export function formatDate(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

/**
 * Format a time duration in minutes to a human-readable format (e.g., "60 minutes")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
}

/**
 * Get the next day from a given date
 */
export function getNextDay(date: Date): Date {
  return addDays(date, 1);
}

/**
 * Get the previous day from a given date
 */
export function getPreviousDay(date: Date): Date {
  return subDays(date, 1);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get day of week name from a date
 */
export function getDayName(date: Date): string {
  return DAYS_OF_WEEK[date.getDay()];
}

/**
 * Get short day name from a date
 */
export function getShortDayName(date: Date): string {
  return SHORT_DAYS[date.getDay()];
}

/**
 * Get a relative description of a date (e.g., "Today", "Tomorrow", "Friday")
 */
export function getRelativeDayDescription(dateInput: string | Date): string {
  // Handle both string and Date objects
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  const today = new Date();
  
  if (isSameDay(date, today)) {
    return "Today";
  }
  
  if (isSameDay(date, addDays(today, 1))) {
    return "Tomorrow";
  }
  
  if (date > today && date < addDays(today, 7)) {
    return format(date, "EEEE"); // Day name
  }
  
  return format(date, "MMM d"); // Month and day (e.g., "Oct 15")
}

/**
 * Get dates for the current week (Sunday to Saturday)
 */
export function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 for Sunday, 6 for Saturday
  
  const sunday = subDays(today, dayOfWeek);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(addDays(sunday, i));
  }
  
  return weekDates;
}
