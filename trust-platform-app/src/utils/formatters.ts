/**
 * Utility functions for formatting currencies, dates, strings, and escrow timers.
 */

/**
 * Formats a numeric amount as Indian Rupee (INR) currency string.
 *
 * @param amount - The numeric amount in INR
 * @returns Formatted currency string, e.g. "₹12,500"
 */
export function formatINR(amount: number): string {
  return `₹${Math.floor(amount).toLocaleString('en-IN')}`;
}

/**
 * Formats an ISO date string into a user-friendly readable format.
 *
 * @param isoString - The ISO date string
 * @returns Formatted date string, e.g. "20 Sep 2026, 01:30 PM"
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString;
    }
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Truncates a long address, hash, or public key for mobile UI display.
 *
 * @param value - The full string (wallet hash, transaction id, etc.)
 * @param start - Number of leading characters to keep (default 6)
 * @param end - Number of trailing characters to keep (default 4)
 * @returns Truncated string, e.g. "0x7a3...c91a"
 */
export function truncateHash(value: string, start = 6, end = 4): string {
  if (!value) return '';
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

/**
 * Formats seconds into HH:MM:SS or MM:SS format.
 *
 * @param totalSeconds - Remaining seconds
 * @returns Formatted duration string
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
