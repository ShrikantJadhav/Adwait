import type { Task } from "../../types";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { useAppStore } from "../../store/useAppStore";
import {
  taskFocusSessionCount,
  taskTimeTakenMs,
} from "../../store/selectors";
import { completedOnTime, dueLabel, formatDuration, formatShortDate } from "../../lib/time";
import { getTrackStatus, TRACK_META } from "../../lib/onTrack";
import { requestNotificationPermission, unlockAudio } from "../../lib/chime";
import { Button } from "../ui/Button";
import {
  CheckIcon,
  ClockIcon,
  GripIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
} from "../ui/Icons";

export interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
}

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  dragHandleProps?: DragHandleProps;
  showBucket?: boolean;
}

export function TaskRow({
  task,
  onEdit,
  dragHandleProps,
  showBucket = false,
}: TaskRowProps) {
  const sessions = useAppStore((state) => state.sessions);
  const buckets = useAppStore((state) => state.buckets);
  const activeTimer = useAppStore((state) => state.activeTimer);
  const toggleTaskDone = useAppStore((state) => state.toggleTaskDone);
  const cancelTimer = useAppStore((state) => state.cancelTimer);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const startTimer = useAppStore((state) => state.startTimer);
  const pushToast = useAppStore((state) => state.pushToast);

  const done = Boolean(task.completedAt);
  const status = getTrackStatus(task);
  const meta = TRACK_META[status];
  const timeTaken = taskTimeTakenMs(task.id, sessions);
  const completedSessions = taskFocusSessionCount(task.id, sessions);
  const estimate = task.estimatePomodoros ?? 0;
  const dots = Math.min(estimate, 8);
  const onTime = completedOnTime(task);
  const bucket = showBucket
    ? buckets.find((candidate) => candidate.id === task.bucketId)
    : undefined;

  const handleToggle = () => {
    if (!done && activeTimer?.taskId === task.id) {
      const stop = window.confirm(
        "This task has a session in progress. Stop and log it before completing the task?",
      );
      if (stop) cancelTimer();
    }
    toggleTaskDone(task.id);
  };

  const handleFocus = () => {
    if (activeTimer) {
      pushToast("A timer is already running. Finish or cancel it first.");
      return;
    }
    startTimer("focus", task.id);
    unlockAudio();
    void requestNotificationPermission();
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete “${task.title}”? Its focus sessions will be kept.`,
      )
    ) {
      deleteTask(task.id);
    }
  };

  const focusing = activeTimer?.taskId === task.id;

  return (
    <article className="group relative flex overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-colors hover:border-stone-300">
      <div className={`w-1.5 shrink-0 ${meta.stripe}`} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 gap-3 p-3">
        {dragHandleProps ? (
          <button
            type="button"
            {...dragHandleProps.attributes}
            {...(dragHandleProps.listeners ?? {})}
            aria-label={`Drag “${task.title}”`}
            className="-ml-1 mt-0.5 grid h-5 w-4 shrink-0 touch-none cursor-grab place-items-center rounded text-stone-300 transition-colors hover:text-stone-500 active:cursor-grabbing"
          >
            <GripIcon />
          </button>
        ) : null}
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? `Mark “${task.title}” as not done` : `Complete “${task.title}”`}
          onClick={handleToggle}
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-stone-300 bg-white text-transparent hover:border-emerald-500 hover:text-emerald-500"
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className={`text-left text-sm font-medium leading-snug ${
                done
                  ? "text-stone-400 line-through decoration-stone-300"
                  : "text-stone-900 hover:underline hover:decoration-stone-300 hover:underline-offset-2"
              }`}
            >
              {task.title}
            </button>
            {status === "overdue" || status === "at-risk" ? (
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${meta.badge}`}
              >
                {meta.label}
              </span>
            ) : null}
            {done && onTime !== null ? (
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                  onTime
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                }`}
              >
                {onTime ? "On time" : "Late"}
              </span>
            ) : null}
          </div>

          {task.description ? (
            <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-stone-500">
              {task.description}
            </p>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-400">
            {bucket && !bucket.isInbox ? (
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: bucket.color }}
                  aria-hidden="true"
                />
                {bucket.name}
              </span>
            ) : null}
            {task.dueDate ? (
              <span
                className={
                  status === "overdue"
                    ? "font-medium text-rose-600"
                    : status === "at-risk"
                      ? "font-medium text-amber-600"
                      : undefined
                }
              >
                {dueLabel(task.dueDate)}
              </span>
            ) : null}
            <span>Added {formatShortDate(task.createdAt)}</span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon />
              {formatDuration(timeTaken)}
            </span>
            {estimate > 0 ? (
              <span
                className="inline-flex items-center gap-1"
                title={`${completedSessions} of ${estimate} pomodoros`}
              >
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: dots }, (_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 w-1.5 rounded-full ${
                        index < completedSessions
                          ? "bg-amber-500"
                          : "bg-stone-200"
                      }`}
                    />
                  ))}
                </span>
                <span>
                  {completedSessions}/{estimate}
                </span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-1">
          {!done ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFocus}
              disabled={Boolean(activeTimer) && !focusing}
              title={
                focusing
                  ? "This task has the active session"
                  : activeTimer
                    ? "A timer is already running"
                    : "Start a focus session for this task"
              }
              className="px-2 sm:px-2.5"
            >
              <PlayIcon className="h-3 w-3" />
              <span className="hidden sm:inline">
                {focusing ? "Focusing" : "Focus"}
              </span>
            </Button>
          ) : null}
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label={`Edit “${task.title}”`}
              className="grid h-7 w-7 place-items-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              aria-label={`Delete “${task.title}”`}
              className="grid h-7 w-7 place-items-center rounded-md text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
