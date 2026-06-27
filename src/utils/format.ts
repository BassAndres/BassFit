/** Small, dependency-free formatters used across the UI. */

/** "1h 12m" / "12m 30s" / "45s" from a duration in seconds. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** "2:05" mm:ss for timers. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** "12,540 kg" with thousands separators. */
export function formatVolume(kg: number): string {
  return `${Math.round(kg).toLocaleString('es-ES')} kg`;
}

/** "23 jun" / "23 jun 2025" relative-aware short date from epoch millis. */
export function formatDate(epochMillis: number): string {
  const d = new Date(epochMillis);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const day = d.getDate();
  const month = months[d.getMonth()] ?? '';
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear ? `${day} ${month}` : `${day} ${month} ${d.getFullYear()}`;
}
