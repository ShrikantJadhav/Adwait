import { differenceInCalendarDays, format, parseISO } from "date-fns";

/** Local calendar date, e.g. "2026-11-03". Never use toISOString() for this. */
export function todayKey(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function formatLongDate(date = new Date()): string {
  return format(date, "EEEE, d MMMM");
}

/** mm:ss under an hour, h:mm:ss above. Rounds up so a fresh 25:00 shows 25:00. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "0m", "45m", "1h 05m". */
export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${minutes}m`;
}

/** "25 min" — used for planned session lengths. */
export function formatMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  return `${minutes} min`;
}

export function formatTimeOfDay(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

export function formatShortDate(iso: string): string {
  return format(new Date(iso), "d MMM");
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMM, HH:mm");
}

export function isTodayISO(iso: string): boolean {
  return todayKey(new Date(iso)) === todayKey();
}

export function dueLabel(dueDate: string, today = todayKey()): string {
  if (dueDate === today) return "Due today";
  const diff = differenceInCalendarDays(parseISO(dueDate), parseISO(today));
  if (diff === -1) return "Due yesterday";
  if (diff < 0) return `Overdue · ${format(parseISO(dueDate), "d MMM")}`;
  if (diff === 1) return "Due tomorrow";
  return `Due ${format(parseISO(dueDate), "d MMM")}`;
}

/** A completed task was on time if it was finished on or before its due date. */
export function completedOnTime(task: {
  completedAt?: string;
  dueDate?: string;
}): boolean | null {
  if (!task.completedAt || !task.dueDate) return null;
  return todayKey(new Date(task.completedAt)) <= task.dueDate;
}
