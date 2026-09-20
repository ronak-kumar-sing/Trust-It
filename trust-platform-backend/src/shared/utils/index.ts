import { nanoid } from 'nanoid';

/**
 * Generates a unique request ID for tracing.
 * Uses nanoid for URL-safe, compact IDs.
 *
 * @param size - Length of the generated ID (default: 21)
 * @returns A unique request identifier
 */
export function generateRequestId(size: number = 21): string {
  return nanoid(size);
}

/**
 * Formats a monetary amount from paise to a display string.
 * All internal monetary values are stored as integers in paise.
 *
 * @param amountInPaise - Amount in paise (integer)
 * @param currency - Currency symbol (default: ₹)
 * @returns Formatted string like "₹1,234.56"
 */
export function formatMoney(amountInPaise: number, currency: string = '₹'): string {
  const rupees = amountInPaise / 100;
  return `${currency}${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculates a deadline timestamp from now.
 *
 * @param hoursFromNow - Number of hours from the current time
 * @returns ISO timestamp string for the deadline
 */
export function calculateDeadline(hoursFromNow: number): string {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hoursFromNow);
  return deadline.toISOString();
}

/**
 * Calculates delay in milliseconds from hours.
 *
 * @param hours - Number of hours
 * @returns Equivalent milliseconds
 */
export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/**
 * Calculates delay in milliseconds from minutes.
 *
 * @param minutes - Number of minutes
 * @returns Equivalent milliseconds
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}
