/**
 * @file web/src/shared/lib/date.ts
 * @description Date formatting utilities without external libraries.
 */

/**
 * Returns a human-readable relative time string in Ukrainian.
 * Example: "2 год. тому", "щойно", "5 хв. тому"
 */
export function formatDistanceToNow(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (seconds < 60)  return 'щойно';
  if (minutes < 60)  return `${minutes} хв. тому`;
  if (hours < 24)    return `${hours} год. тому`;
  if (days < 7)      return `${days} дн. тому`;

  return new Date(dateStr).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: days > 365 ? 'numeric' : undefined,
  });
}

/**
 * Short date formatter: "11 квіт. 2026"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
