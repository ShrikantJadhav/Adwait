import { useEffect, useState } from "react";
import type { TimerKind } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import {
  completedTasksToday,
  todayFocusMinutesMs,
  todayFocusSessions,
} from "../../store/selectors";
import {
  elapsedFocusMs,
  plannedMsForKind,
  remainingMs,
} from "../../lib/pomodoro";
import { formatDuration } from "../../lib/time";
import {
  requestNotificationPermission,
  unlockAudio,
} from "../../lib/chime";
import { useTimerEngine } from "../../hooks/useTimerEngine";
import { Button } from "../ui/Button";
import { PauseIcon, PlayIcon, XIcon } from "../ui/Icons";
import { SessionList } from "./SessionList";
import { TimerRing } from "./TimerRing";

const modes: TimerKind[] = ["focus", "shortBreak", "longBreak"];

const modeLabels: Record<TimerKind, string> = {
  focus: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

const startLabels: Record<TimerKind, string> = {
  focus: "Start focus",
  shortBreak: "Start short break",
  longBreak: "Start long break",
};

export function TimerPanel() {
  const now = useTimerEngine();

  const activeTimer = useAppStore((state) => state.activeTimer);
  const settings = useAppStore((state) => state.settings);
  const suggestion = useAppStore((state) => state.suggestion);
  const tasks = useAppStore((state) => state.tasks);
  const sessions = useAppStore((state) => state.sessions);

  const startTimer = useAppStore((state) => state.startTimer);
  const pauseTimer = useAppStore((state) => state.pauseTimer);
  const resumeTimer = useAppStore((state) => state.resumeTimer);
  const cancelTimer = useAppStore((state) => state.cancelTimer);
  const clearSuggestion = useAppStore((state) => state.clearSuggestion);

  const [mode, setMode] = useState<TimerKind>("focus");
  const [pendingTaskId, setPendingTaskId] = useState("");

  // After a session ends, point the timer at the recommended next mode.
  useEffect(() => {
    if (!activeTimer && suggestion) setMode(suggestion);
  }, [activeTimer, suggestion]);

  // Drop a pending link if that task gets completed or deleted.
  useEffect(() => {
    if (
      pendingTaskId &&
      !tasks.some((task) => task.id === pendingTaskId && !task.completedAt)
    ) {
      setPendingTaskId("");
    }
  }, [tasks, pendingTaskId]);

  const currentKind = activeTimer?.kind ?? mode;
  const totalMs =
    activeTimer?.plannedMs ?? plannedMsForKind(mode, settings);
  const remaining = activeTimer
    ? remainingMs(activeTimer, now)
    : totalMs;
  const paused = activeTimer?.state === "paused";
  const running = activeTimer?.state === "running";

  const linkedTask = activeTimer?.taskId
    ? tasks.find((task) => task.id === activeTimer.taskId)
    : undefined;

  const openTasks = tasks.filter((task) => !task.completedAt);
  const focusMs = todayFocusMinutesMs(sessions);
  const completedSessions = todayFocusSessions(sessions).filter(
    (session) => session.outcome === "completed",
  ).length;
  const doneToday = completedTasksToday({ tasks });

  const handleStart = () => {
    startTimer(mode, pendingTaskId || undefined);
    unlockAudio();
    void requestNotificationPermission();
  };

  const handleCancel = () => {
    if (!activeTimer) return;
    const elapsed = elapsedFocusMs(activeTimer, now);
    if (
      elapsed >= 60_000 &&
      !window.confirm(
        "Cancel this session? The time you have already focused will still be logged.",
      )
    ) {
      return;
    }
    cancelTimer();
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              Focus timer
            </h2>
            <p className="text-[11px] text-stone-500">
              One thing at a time. {settings.focusMinutes} minutes, then a break.
            </p>
          </div>
          <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-500">
            {settings.longBreakEvery} rounds → long break
          </span>
        </div>

        <div className="mt-4">
          <TimerRing
            remainingMs={remaining}
            totalMs={totalMs}
            kind={currentKind}
            paused={Boolean(paused)}
            running={Boolean(running)}
          />
        </div>

        <div
          role="tablist"
          aria-label="Timer mode"
          className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1"
        >
          {modes.map((kind) => {
            const selected = currentKind === kind;
            return (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={Boolean(activeTimer)}
                onClick={() => setMode(kind)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed ${
                  selected
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-800 disabled:opacity-60"
                }`}
              >
                {modeLabels[kind]}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          {activeTimer ? (
            <div className="rounded-lg border border-stone-200 bg-stone-50/70 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                {linkedTask ? "Linked task" : "Session"}
              </p>
              <p
                className={`truncate text-xs ${
                  linkedTask ? "font-medium text-stone-700" : "text-stone-500"
                }`}
              >
                {linkedTask?.title ?? "No task linked"}
              </p>
              {!activeTimer.taskId ? (
                <p className="mt-0.5 text-[10px] text-stone-400">
                  You can attach this session from the log below when it ends.
                </p>
              ) : null}
            </div>
          ) : (
            <div>
              <label
                htmlFor="timer-task"
                className="text-[10px] font-medium uppercase tracking-wider text-stone-400"
              >
                Link to a task <span className="normal-case">(optional)</span>
              </label>
              <select
                id="timer-task"
                value={pendingTaskId}
                onChange={(event) => setPendingTaskId(event.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-stone-200 bg-white px-2.5 text-xs text-stone-700 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              >
                <option value="">No task — just focus</option>
                {openTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {suggestion && !activeTimer ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="flex-1 text-[11px] leading-snug text-amber-800">
              {suggestion === "focus"
                ? "Break over. Ready for the next focus?"
                : "Session complete. Take a break."}
            </p>
            <button
              type="button"
              onClick={clearSuggestion}
              aria-label="Dismiss suggestion"
              className="grid h-5 w-5 shrink-0 place-items-center rounded text-amber-600 hover:bg-amber-100"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div className="mt-4">
          {!activeTimer ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStart}
            >
              <PlayIcon />
              {startLabels[mode]}
            </Button>
          ) : paused ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" size="lg" onClick={resumeTimer}>
                <PlayIcon />
                Resume
              </Button>
              <Button variant="ghost" size="lg" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" onClick={pauseTimer}>
                <PauseIcon />
                Pause
              </Button>
              <Button variant="ghost" size="lg" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-stone-100 pt-3 text-center">
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {formatDuration(focusMs)}
            </p>
            <p className="text-[10px] text-stone-400">Focused today</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {completedSessions}
            </p>
            <p className="text-[10px] text-stone-400">Sessions</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">{doneToday}</p>
            <p className="text-[10px] text-stone-400">Tasks done</p>
          </div>
        </div>
      </section>

      <SessionList
        tasks={tasks}
        sessions={sessions}
        activeTimer={activeTimer}
        now={now}
      />
    </div>
  );
}
