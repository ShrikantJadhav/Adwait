import type { ActiveTimer, Session, Task } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import { todayFocusSessions, todayFocusMinutesMs } from "../../store/selectors";
import {
  elapsedFocusMs,
  remainingMs,
} from "../../lib/pomodoro";
import {
  formatDuration,
  formatTimeOfDay,
} from "../../lib/time";
import { LinkIcon } from "../ui/Icons";

interface SessionListProps {
  tasks: Task[];
  sessions: Session[];
  activeTimer?: ActiveTimer;
  now: number;
}

function sessionTaskTitle(
  session: Session,
  taskById: Map<string, Task>,
): string | null {
  if (!session.taskId) return null;
  return taskById.get(session.taskId)?.title ?? "Deleted task";
}

export function SessionList({
  tasks,
  sessions,
  activeTimer,
  now,
}: SessionListProps) {
  const attachSession = useAppStore((state) => state.attachSession);

  const today = todayFocusSessions(sessions);
  const completed = today.filter((session) => session.outcome === "completed");
  const focusMs = todayFocusMinutesMs(sessions);
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const openTasks = tasks.filter((task) => !task.completedAt);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            Today’s sessions
          </h3>
          <p className="text-[11px] text-stone-500">
            {completed.length} {completed.length === 1 ? "session" : "sessions"} ·{" "}
            {formatDuration(focusMs)} focused
          </p>
        </div>
        <span className="text-[11px] text-stone-400">Focus only</span>
      </div>

      {activeTimer?.kind === "focus" ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <span className="text-xs font-medium text-amber-800">
            {activeTimer.state === "paused" ? "Paused" : "In progress"}
          </span>
          <span className="tabular ml-auto text-xs text-amber-700">
            {formatDuration(elapsedFocusMs(activeTimer, now))} /{" "}
            {formatDuration(remainingMs(activeTimer, now) + elapsedFocusMs(activeTimer, now))}
          </span>
        </div>
      ) : null}

      {today.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-stone-200 px-3 py-4 text-center text-xs leading-relaxed text-stone-400">
          No focus sessions yet. Start the timer and your first pomodoro will
          appear here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {today.map((session) => {
            const title = sessionTaskTitle(session, taskById);
            return (
              <li
                key={session.id}
                className="rounded-lg border border-stone-100 bg-stone-50/50 px-3 py-2"
              >
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      session.outcome === "completed"
                        ? "bg-emerald-500"
                        : "bg-stone-300"
                    }`}
                  />
                  <span className="tabular font-medium text-stone-600">
                    {formatTimeOfDay(session.startedAt)}
                  </span>
                  <span className="text-stone-300">→</span>
                  <span className="tabular text-stone-500">
                    {formatTimeOfDay(session.endedAt)}
                  </span>
                  <span className="tabular ml-auto font-medium text-stone-600">
                    {formatDuration(session.focusMs)}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <p
                    className={`min-w-0 flex-1 truncate text-xs ${
                      title ? "text-stone-600" : "italic text-stone-400"
                    }`}
                  >
                    {title ?? "Unlinked session"}
                  </p>
                  {session.outcome === "cancelled" ? (
                    <span className="shrink-0 rounded-full bg-stone-200/70 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                      Cancelled
                    </span>
                  ) : null}
                </div>

                {!session.taskId && openTasks.length > 0 ? (
                  <label className="mt-1.5 flex items-center gap-1.5 text-[10px] text-stone-400">
                    <LinkIcon className="h-3 w-3" />
                    <span className="sr-only">
                      Attach this session to a task
                    </span>
                    <select
                      value=""
                      onChange={(event) =>
                        attachSession(session.id, event.target.value || undefined)
                      }
                      className="min-w-0 flex-1 rounded border border-stone-200 bg-white px-1.5 py-1 text-[10px] text-stone-600 focus:border-stone-300 focus:outline-none"
                    >
                      <option value="">Attach to task…</option>
                      {openTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
