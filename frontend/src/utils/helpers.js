/**
 * Utility Helpers.
 *
 * Common functions used across the frontend:
 *   - Date formatting
 *   - Token management (localStorage)
 *   - Miscellaneous utilities
 *
 * Implemented in Phase 8.
 */

/**
 * Format a date string to a human-readable locale format.
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a timestamp to show time with date.
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date-time
 */
export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Truncate text to a maximum length with ellipsis.
 * @param {string} text - Input text
 * @param {number} maxLength - Maximum characters
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str - Input string
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
