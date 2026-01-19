/**
 * Formatting utilities for UI components
 */

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Darken a color by a given amount (0-1)
 */
export function darkenColor(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - Math.floor(255 * amount));
  const g = Math.max(0, ((color >> 8) & 0xff) - Math.floor(255 * amount));
  const b = Math.max(0, (color & 0xff) - Math.floor(255 * amount));
  return (r << 16) | (g << 8) | b;
}
