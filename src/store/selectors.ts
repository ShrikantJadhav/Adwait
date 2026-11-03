import type { AppState, Session, Task } from "../types";
import { todayKey } from "../lib/time";

export interface TodayGroups {
  overdue: Task[];
  today: Task[];
  pinned: Task[];
  later: Task[];
  done: Task[];
}

function byOrder(a: Task, b: Task): number {
  if (a.order !== b.order) return a.order - b.order;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  return a.createdAt.localeCompare(b.createdAt);
}

/**
 * Today = overdue + due today + everything pinned.
 * Undated tasks always appear in Today; future-dated unpinned tasks fall into
 * a collapsed “Later” section. Bucket views show a bucket's full task list.
 */
export function getTodayGroups(tasks: Task[], today = todayKey()): TodayGroups {
  const open = tasks.filter((task) => !task.completedAt);

  const overdue = open
    .filter((task) => Boolean(task.dueDate) && task.dueDate! < today)
    .sort(byOrder);

  const dueToday = open
    .filter((task) => task.dueDate === today)
    .sort(byOrder);

  const pinned = open
    .filter((task) =>
      task.pinnedToday
        ? !(task.dueDate && task.dueDate <= today)
        : !task.dueDate,
    )
    .sort(byOrder);

  // Future tasks the user has not pulled forward. Kept reachable until the
  // bucket view lands, but tucked away so Today stays focused.
  const later = open
    .filter(
      (task) =>
        Boolean(task.dueDate) && task.dueDate! > today && !task.pinnedToday,
    )
    .sort(byOrder);

  const done = tasks
    .filter(
      (task) =>
        Boolean(task.completedAt) &&
        todayKey(new Date(task.completedAt!)) === today,
    )
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  return { overdue, today: dueToday, pinned, later, done };
}

export function taskTimeTakenMs(taskId: string, sessions: Session[]): number {
  return sessions
    .filter(
      (session) =>
        session.taskId === taskId &&
        session.kind === "focus" &&
        session.outcome === "completed",
    )
    .reduce((total, session) => total + session.focusMs, 0);
}

export function taskCancelledTimeMs(
  taskId: string,
  sessions: Session[],
): number {
  return sessions
    .filter(
      (session) =>
        session.taskId === taskId &&
        session.kind === "focus" &&
        session.outcome === "cancelled",
    )
    .reduce((total, session) => total + session.focusMs, 0);
}

export function taskFocusSessionCount(
  taskId: string,
  sessions: Session[],
): number {
  return sessions.filter(
    (session) =>
      session.taskId === taskId &&
      session.kind === "focus" &&
      session.outcome === "completed",
  ).length;
}

export function todayFocusSessions(
  sessions: Session[],
  today = todayKey(),
): Session[] {
  return sessions
    .filter(
      (session) =>
        session.day === today &&
        session.kind === "focus",
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function todayFocusMinutesMs(
  sessions: Session[],
  today = todayKey(),
): number {
  return todayFocusSessions(sessions, today)
    .filter((session) => session.outcome === "completed")
    .reduce((total, session) => total + session.focusMs, 0);
}

export function completedTasksToday(
  state: Pick<AppState, "tasks">,
  today = todayKey(),
): number {
  return state.tasks.filter(
    (task) =>
      Boolean(task.completedAt) &&
      todayKey(new Date(task.completedAt!)) === today,
  ).length;
}

export function openTaskCount(tasks: Task[]): number {
  return tasks.filter((task) => !task.completedAt).length;
}
