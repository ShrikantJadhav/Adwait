import { create } from "zustand";
import type {
  AppState,
  Bucket,
  Settings,
  Task,
  TimerKind,
  Toast,
  ToastKind,
} from "../types";
import {
  createTimer,
  finalizeSession,
  isExpired,
  newId,
  pauseTimer as pause,
  plannedMsForKind,
  resumeTimer as resume,
} from "../lib/pomodoro";
import { loadState, scheduleSave } from "../lib/storage";

export const INBOX_ID = "inbox";

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  volume: 0.7,
  notificationsEnabled: false,
};

export function createInitialState(): AppState {
  return {
    schemaVersion: 1,
    buckets: [
      {
        id: INBOX_ID,
        name: "Inbox",
        color: "#78716c",
        order: 0,
        isInbox: true,
      },
    ],
    tasks: [],
    sessions: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export interface NewTaskInput {
  title: string;
  description?: string;
  bucketId?: string;
  dueDate?: string;
  estimatePomodoros?: number;
  pinnedToday?: boolean;
}

type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "bucketId"
    | "dueDate"
    | "estimatePomodoros"
    | "pinnedToday"
  >
>;

interface AppStore extends AppState {
  toasts: Toast[];
  /** Recommended next mode after a session completes. */
  suggestion?: TimerKind;

  addTask: (input: NewTaskInput) => Task | null;
  updateTask: (id: string, patch: TaskPatch) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
  togglePinnedToday: (id: string) => void;

  addBucket: (name: string, color: string) => Bucket | null;
  updateBucket: (
    id: string,
    patch: Partial<Pick<Bucket, "name" | "color">>,
  ) => void;
  deleteBucket: (id: string) => void;
  moveTaskToBucket: (taskId: string, bucketId: string) => void;
  reorderTasks: (bucketId: string, orderedTaskIds: string[]) => void;

  startTimer: (kind?: TimerKind, taskId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  cancelTimer: () => void;
  completeTimer: () => void;
  clearSuggestion: () => void;

  attachSession: (sessionId: string, taskId?: string) => void;
  importState: (next: AppState) => void;

  pushToast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;
}

function pickPersisted(state: AppStore): AppState {
  return {
    schemaVersion: 1,
    buckets: state.buckets,
    tasks: state.tasks,
    sessions: state.sessions,
    settings: state.settings,
    activeTimer: state.activeTimer,
  };
}

const persisted = loadState();

const hydrated: AppState = persisted
  ? {
      ...persisted,
      buckets:
        persisted.buckets.length > 0
          ? persisted.buckets
          : createInitialState().buckets,
      settings: { ...DEFAULT_SETTINGS, ...persisted.settings },
    }
  : createInitialState();

export const useAppStore = create<AppStore>()((set, get) => ({
  ...hydrated,
  toasts: [],

  addTask: (input) => {
    const title = input.title.trim();
    if (!title) return null;

    const tasks = get().tasks;
    const task: Task = {
      id: newId(),
      title,
      description: input.description?.trim() ?? "",
      bucketId: input.bucketId ?? INBOX_ID,
      createdAt: new Date().toISOString(),
      dueDate: input.dueDate || undefined,
      estimatePomodoros: input.estimatePomodoros,
      pinnedToday: input.pinnedToday ?? true,
      order:
        tasks.reduce((max, candidate) => Math.max(max, candidate.order), 0) + 1,
    };

    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: (id, patch) => {
    set((state) => {
      const existing = state.tasks.find((task) => task.id === id);
      if (!existing) return {};

      let next: Task = { ...existing, ...patch };
      if (patch.bucketId && patch.bucketId !== existing.bucketId) {
        const maxOrder = state.tasks
          .filter(
            (task) => task.bucketId === patch.bucketId && task.id !== id,
          )
          .reduce((max, task) => Math.max(max, task.order), 0);
        next = { ...next, order: maxOrder + 1 };
      }

      return {
        tasks: state.tasks.map((task) => (task.id === id ? next : task)),
      };
    });
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },

  toggleTaskDone: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== id) return task;
        return {
          ...task,
          completedAt: task.completedAt
            ? undefined
            : new Date().toISOString(),
        };
      }),
    }));
  },

  togglePinnedToday: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, pinnedToday: !task.pinnedToday }
          : task,
      ),
    }));
  },

  addBucket: (name, color) => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const buckets = get().buckets;
    const bucket: Bucket = {
      id: newId(),
      name: trimmed,
      color,
      order:
        buckets.reduce((max, candidate) => Math.max(max, candidate.order), 0) +
        1,
    };
    set((state) => ({ buckets: [...state.buckets, bucket] }));
    return bucket;
  },

  updateBucket: (id, patch) => {
    set((state) => ({
      buckets: state.buckets.map((bucket) =>
        bucket.id === id ? { ...bucket, ...patch } : bucket,
      ),
    }));
  },

  deleteBucket: (id) => {
    if (id === INBOX_ID) return;
    const state = get();
    if (!state.buckets.some((bucket) => bucket.id === id)) return;

    const inboxTasks = state.tasks.filter(
      (task) => task.bucketId === INBOX_ID,
    );
    let nextOrder = inboxTasks.reduce(
      (max, task) => Math.max(max, task.order),
      0,
    );

    set((current) => ({
      buckets: current.buckets.filter((bucket) => bucket.id !== id),
      tasks: current.tasks.map((task) => {
        if (task.bucketId !== id) return task;
        nextOrder += 1;
        return { ...task, bucketId: INBOX_ID, order: nextOrder };
      }),
    }));
  },

  moveTaskToBucket: (taskId, bucketId) => {
    set((state) => {
      const task = state.tasks.find((candidate) => candidate.id === taskId);
      if (!task) return {};
      if (!state.buckets.some((bucket) => bucket.id === bucketId)) return {};
      if (task.bucketId === bucketId) return {};

      const maxOrder = state.tasks
        .filter((candidate) => candidate.bucketId === bucketId)
        .reduce((max, candidate) => Math.max(max, candidate.order), 0);

      return {
        tasks: state.tasks.map((candidate) =>
          candidate.id === taskId
            ? { ...candidate, bucketId, order: maxOrder + 1 }
            : candidate,
        ),
      };
    });
  },

  reorderTasks: (bucketId, orderedTaskIds) => {
    if (orderedTaskIds.length === 0) return;
    const orderById = new Map(
      orderedTaskIds.map((taskId, index) => [taskId, index + 1]),
    );
    set((state) => ({
      tasks: state.tasks.map((task) => {
        const nextOrder = orderById.get(task.id);
        if (nextOrder === undefined) return task;
        return { ...task, bucketId, order: nextOrder };
      }),
    }));
  },

  startTimer: (kind = "focus", taskId) => {
    if (get().activeTimer) return;
    const settings = get().settings;
    const timer = createTimer(kind, plannedMsForKind(kind, settings), taskId);
    set({ activeTimer: timer, suggestion: undefined });
  },

  pauseTimer: () => {
    const timer = get().activeTimer;
    if (!timer) return;
    set({ activeTimer: pause(timer) });
  },

  resumeTimer: () => {
    const timer = get().activeTimer;
    if (!timer) return;
    set({ activeTimer: resume(timer) });
  },

  cancelTimer: () => {
    const timer = get().activeTimer;
    if (!timer) return;
    const session = finalizeSession(timer, Date.now(), "cancelled");
    set((state) => ({
      activeTimer: undefined,
      sessions: [...state.sessions, session],
    }));
    get().pushToast("Session cancelled. The time you focused was still logged.");
  },

  completeTimer: () => {
    const state = get();
    const timer = state.activeTimer;
    if (!timer || !isExpired(timer)) return;

    // Exactly-once guard: a refresh at zero must not duplicate the session.
    if (state.sessions.some((session) => session.id === timer.id)) {
      set({ activeTimer: undefined });
      return;
    }

    const session = finalizeSession(timer, Date.now(), "completed");
    const focusCompletedToday =
      state.sessions.filter(
        (candidate) =>
          candidate.day === session.day &&
          candidate.kind === "focus" &&
          candidate.outcome === "completed",
      ).length + (session.kind === "focus" ? 1 : 0);

    let nextKind: TimerKind;
    if (session.kind === "focus") {
      nextKind =
        focusCompletedToday % Math.max(1, state.settings.longBreakEvery) === 0
          ? "longBreak"
          : "shortBreak";
    } else {
      nextKind = "focus";
    }

    set({
      activeTimer: undefined,
      sessions: [...state.sessions, session],
      suggestion: nextKind,
    });

    const message =
      session.kind === "focus"
        ? nextKind === "longBreak"
          ? "Focus complete. You earned a long break."
          : "Focus complete. Time for a short break."
        : "Break over. Ready to focus?";
    get().pushToast(message, "success");

    const shouldAutoStart =
      session.kind === "focus"
        ? state.settings.autoStartBreaks
        : state.settings.autoStartFocus;
    if (shouldAutoStart) get().startTimer(nextKind);
  },

  clearSuggestion: () => set({ suggestion: undefined }),

  attachSession: (sessionId, taskId) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? { ...session, taskId: taskId || undefined }
          : session,
      ),
    }));
  },

  importState: (next) => {
    set({
      schemaVersion: 1,
      buckets:
        next.buckets.length > 0 ? next.buckets : createInitialState().buckets,
      tasks: next.tasks,
      sessions: next.sessions,
      settings: { ...DEFAULT_SETTINGS, ...next.settings },
      activeTimer: next.activeTimer,
      suggestion: undefined,
    });
  },

  pushToast: (message, kind = "info") => {
    const toast: Toast = {
      id: newId(),
      message,
      kind,
      createdAt: Date.now(),
    };
    set((state) => ({ toasts: [...state.toasts.slice(-2), toast] }));
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

useAppStore.subscribe((state) => {
  scheduleSave(pickPersisted(state));
});
