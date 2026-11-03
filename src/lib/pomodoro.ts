import { format } from "date-fns";
import type { ActiveTimer, Session, Settings, TimerKind } from "../types";

export function plannedMsForKind(
  kind: TimerKind,
  settings: Pick<
    Settings,
    "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes"
  >,
): number {
  const minutes =
    kind === "focus"
      ? settings.focusMinutes
      : kind === "shortBreak"
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;
  return Math.max(1, Math.round(minutes)) * 60_000;
}

export function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTimer(
  kind: TimerKind,
  plannedMs: number,
  taskId?: string,
  now = Date.now(),
): ActiveTimer {
  return {
    id: newId(),
    kind,
    taskId,
    plannedMs,
    startedAt: new Date(now).toISOString(),
    endsAt: new Date(now + plannedMs).toISOString(),
    totalPausedMs: 0,
    state: "running",
  };
}

export function remainingMs(timer: ActiveTimer, now = Date.now()): number {
  if (timer.state === "paused") {
    return Math.max(0, timer.remainingMs ?? 0);
  }
  if (!timer.endsAt) return 0;
  return Math.max(0, Date.parse(timer.endsAt) - now);
}

/** Time actually spent focusing: wall time minus every pause. Capped at planned. */
export function elapsedFocusMs(timer: ActiveTimer, now = Date.now()): number {
  const started = Date.parse(timer.startedAt);
  const ended =
    timer.state === "paused"
      ? Date.parse(timer.pausedAt ?? timer.startedAt)
      : now;
  const focus = ended - started - timer.totalPausedMs;
  return Math.min(timer.plannedMs, Math.max(0, focus));
}

export function isExpired(timer: ActiveTimer, now = Date.now()): boolean {
  return (
    timer.state === "running" &&
    typeof timer.endsAt === "string" &&
    Date.parse(timer.endsAt) <= now
  );
}

export function pauseTimer(timer: ActiveTimer, now = Date.now()): ActiveTimer {
  if (timer.state !== "running" || !timer.endsAt) return timer;
  return {
    ...timer,
    state: "paused",
    remainingMs: Math.max(0, Date.parse(timer.endsAt) - now),
    pausedAt: new Date(now).toISOString(),
    endsAt: undefined,
  };
}

export function resumeTimer(timer: ActiveTimer, now = Date.now()): ActiveTimer {
  if (timer.state !== "paused") return timer;
  const pausedFor = timer.pausedAt
    ? Math.max(0, now - Date.parse(timer.pausedAt))
    : 0;
  const remaining = Math.max(0, timer.remainingMs ?? 0);
  return {
    ...timer,
    state: "running",
    totalPausedMs: timer.totalPausedMs + pausedFor,
    pausedAt: undefined,
    remainingMs: undefined,
    endsAt: new Date(now + remaining).toISOString(),
  };
}

export function finalizeSession(
  timer: ActiveTimer,
  now: number,
  outcome: Session["outcome"],
): Session {
  const startMs = Date.parse(timer.startedAt);
  const completedEndMs = timer.endsAt
    ? Date.parse(timer.endsAt)
    : Math.min(now, startMs + timer.plannedMs);
  const pausedEndMs = timer.pausedAt
    ? Date.parse(timer.pausedAt)
    : now;
  const endMs = outcome === "completed" ? completedEndMs : pausedEndMs;

  return {
    id: timer.id,
    taskId: timer.taskId,
    kind: timer.kind,
    startedAt: timer.startedAt,
    endedAt: new Date(endMs).toISOString(),
    plannedMs: timer.plannedMs,
    focusMs:
      outcome === "completed"
        ? timer.plannedMs
        : elapsedFocusMs(timer, now),
    pausedMs: timer.totalPausedMs,
    outcome,
    day: format(new Date(startMs), "yyyy-MM-dd"),
  };
}
