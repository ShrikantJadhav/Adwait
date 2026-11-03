export type ID = string;
export type ISODateTime = string;
export type ISODate = string;

export type TimerKind = "focus" | "shortBreak" | "longBreak";
export type SessionOutcome = "completed" | "cancelled";
export type TimerState = "running" | "paused";

export interface Task {
  id: ID;
  title: string;
  description: string;
  bucketId: ID;
  createdAt: ISODateTime;
  dueDate?: ISODate;
  completedAt?: ISODateTime;
  estimatePomodoros?: number;
  pinnedToday?: boolean;
  order: number;
}

export interface Bucket {
  id: ID;
  name: string;
  color: string;
  order: number;
  isInbox?: boolean;
}

export interface Session {
  id: ID;
  taskId?: ID;
  kind: TimerKind;
  startedAt: ISODateTime;
  endedAt: ISODateTime;
  plannedMs: number;
  focusMs: number;
  pausedMs: number;
  outcome: SessionOutcome;
  day: ISODate;
  note?: string;
}

export interface ActiveTimer {
  id: ID;
  kind: TimerKind;
  taskId?: ID;
  plannedMs: number;
  startedAt: ISODateTime;
  endsAt?: ISODateTime;
  remainingMs?: number;
  pausedAt?: ISODateTime;
  totalPausedMs: number;
  state: TimerState;
}

export interface Settings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  volume: number;
  notificationsEnabled: boolean;
  dailyGoalPomodoros?: number;
}

export interface AppState {
  schemaVersion: 1;
  buckets: Bucket[];
  tasks: Task[];
  sessions: Session[];
  settings: Settings;
  activeTimer?: ActiveTimer;
}

export type ToastKind = "info" | "success" | "error";

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  createdAt: number;
}
