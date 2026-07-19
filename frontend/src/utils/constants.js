/**
 * Application Constants.
 *
 * Centralized constants to avoid magic strings scattered across components.
 */

/** Backend API base URL (proxied through Vite in development). */
export const API_BASE_URL = "/api/v1";

/** LocalStorage keys */
export const STORAGE_KEYS = {
  TOKEN: "hr_assistant_token",
  USER: "hr_assistant_user",
  THEME: "hr_assistant_theme",
};

/** User roles */
export const ROLES = {
  EMPLOYEE: "employee",
  ADMIN: "admin",
};

/** Leave request statuses */
export const LEAVE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

/** Leave types */
export const LEAVE_TYPES = {
  CASUAL: "Casual Leave",
  SICK: "Sick Leave",
  EARNED: "Earned Leave",
};

/** Status badge color mapping */
export const STATUS_COLORS = {
  PENDING: {
    bg: "bg-warning-500/15",
    text: "text-warning-500",
    dot: "bg-warning-500",
  },
  APPROVED: {
    bg: "bg-success-500/15",
    text: "text-success-500",
    dot: "bg-success-500",
  },
  REJECTED: {
    bg: "bg-error-500/15",
    text: "text-error-500",
    dot: "bg-error-500",
  },
};

/** Suggested questions for employee chatbot */
export const EMPLOYEE_SUGGESTIONS = [
  "How many leave days do I have left?",
  "What is the casual leave policy?",
  "How do I apply for leave?",
  "When is salary credited?",
  "What are the working hours?",
  "Who approves my leave?",
  "Show my leave history",
  "What is the work from home policy?",
];

/** Suggested questions for admin chatbot */
export const ADMIN_SUGGESTIONS = [
  "Show pending leave requests",
  "How many employees are on leave today?",
  "Show employees with low attendance",
  "Department-wise leave report",
  "How many leave requests are pending?",
  "Show today's approved leaves",
];
