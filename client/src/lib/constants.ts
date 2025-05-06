import { TaskStatus } from "@/types";

// Status configuration
export const STATUS_CONFIG: Record<TaskStatus, { 
  label: string, 
  color: string,
  bgColor: string,
  textColor: string,
  borderColor: string 
}> = {
  completed: {
    label: "Completed",
    color: "bg-green-500",
    bgColor: "bg-green-500",
    textColor: "text-white",
    borderColor: "border-green-500"
  },
  partial: {
    label: "Partial",
    color: "bg-orange-500",
    bgColor: "bg-orange-500",
    textColor: "text-white",
    borderColor: "border-orange-500"
  },
  not_started: {
    label: "Not Started",
    color: "bg-red-500",
    bgColor: "bg-red-500",
    textColor: "text-white",
    borderColor: "border-red-500"
  },
  not_needed: {
    label: "Not Needed",
    color: "bg-gray-500",
    bgColor: "bg-gray-500",
    textColor: "text-white",
    borderColor: "border-gray-500"
  }
};

// Default cloud data source URL
// In a real app, this should be configurable or in an environment variable
export const DEFAULT_DATA_SOURCE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnDDRuDkDEukqHvbrHQn9v5O6Vmc8uTw9kDiZe4c3SAzZXgAm1Bw_b-WD8fBSN9iBBUszkIgL_hZdy/pubhtml";

// Days of the week for labels
export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export const SHORT_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat"
];
