import type { Task } from "../types";
import { todayKey } from "./time";

export type TrackStatus =
  | "done"
  | "overdue"
  | "at-risk"
  | "on-track"
  | "no-date";

export interface TrackMeta {
  label: string;
  stripe: string;
  badge: string;
  dot: string;
}

export const TRACK_META: Record<TrackStatus, TrackMeta> = {
  done: {
    label: "Done",
    stripe: "bg-stone-300",
    badge: "bg-stone-100 text-stone-500 ring-stone-200",
    dot: "bg-stone-300",
  },
  overdue: {
    label: "Overdue",
    stripe: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
  "at-risk": {
    label: "Due today",
    stripe: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  "on-track": {
    label: "On track",
    stripe: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  "no-date": {
    label: "No date",
    stripe: "bg-stone-300",
    badge: "bg-stone-100 text-stone-500 ring-stone-200",
    dot: "bg-stone-300",
  },
};

/**
 * MVP rule: color comes from the due date.
 * - done: completed
 * - no-date: nothing to judge, stay neutral
 * - overdue: due before today
 * - at-risk: due today
 * - on-track: due after today
 */
export function getTrackStatus(
  task: Pick<Task, "completedAt" | "dueDate">,
  today = todayKey(),
): TrackStatus {
  if (task.completedAt) return "done";
  if (!task.dueDate) return "no-date";
  if (task.dueDate < today) return "overdue";
  if (task.dueDate === today) return "at-risk";
  return "on-track";
}
