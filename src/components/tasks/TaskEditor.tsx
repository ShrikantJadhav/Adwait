import { useState, type FormEvent } from "react";
import type { Task } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface TaskEditorProps {
  task: Task | null;
  defaultBucketId?: string;
  onClose: () => void;
}

const fieldClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition-colors placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10";

const labelClass = "block text-xs font-medium text-stone-600";

/**
 * Mounted fresh for each edit (the parent keys it), so state initializers are
 * enough — no syncing effects, no stale drafts.
 */
export function TaskEditor({ task, defaultBucketId, onClose }: TaskEditorProps) {
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const buckets = useAppStore((state) => state.buckets);

  const sortedBuckets = [...buckets].sort((a, b) => a.order - b.order);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [bucketId, setBucketId] = useState(
    task?.bucketId ?? defaultBucketId ?? sortedBuckets[0]?.id ?? "",
  );
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [estimate, setEstimate] = useState(
    task?.estimatePomodoros ? String(task.estimatePomodoros) : "",
  );
  const [pinnedToday, setPinnedToday] = useState(task?.pinnedToday ?? true);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Give the task a name so you know what to focus on.");
      return;
    }

    const parsedEstimate = estimate.trim() === "" ? undefined : Number(estimate);
    const estimatePomodoros =
      parsedEstimate === undefined || Number.isNaN(parsedEstimate)
        ? undefined
        : Math.min(16, Math.max(1, Math.round(parsedEstimate)));

    if (task) {
      updateTask(task.id, {
        title: trimmed,
        description: description.trim(),
        bucketId: bucketId || undefined,
        dueDate: dueDate || undefined,
        estimatePomodoros,
        pinnedToday,
      });
    } else {
      addTask({
        title: trimmed,
        description: description.trim(),
        bucketId: bucketId || undefined,
        dueDate: dueDate || undefined,
        estimatePomodoros,
        pinnedToday,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    if (
      window.confirm(
        `Delete “${task.title}”? Its focus sessions will be kept.`,
      )
    ) {
      deleteTask(task.id);
      onClose();
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={task ? "Edit task" : "New task"}
      description={
        task
          ? "Update the details, or mark it done from the list."
          : "Keep it small enough to finish in a few focus sessions."
      }
      footer={
        <>
          <div>
            {task ? (
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" form="task-form" variant="primary">
              {task ? "Save changes" : "Add task"}
            </Button>
          </div>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className={labelClass}>
            Task name
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError("");
            }}
            placeholder="What needs your attention?"
            className={`${fieldClass} mt-1`}
            autoFocus
          />
          {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
        </div>

        <div>
          <label htmlFor="task-description" className={labelClass}>
            Description <span className="text-stone-400">(optional)</span>
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Add context, links, or a definition of done."
            className={`${fieldClass} mt-1 resize-none`}
          />
        </div>

        <div>
          <label htmlFor="task-bucket" className={labelClass}>
            Bucket
          </label>
          <select
            id="task-bucket"
            value={bucketId}
            onChange={(event) => setBucketId(event.target.value)}
            className={`${fieldClass} mt-1`}
          >
            {sortedBuckets.map((bucket) => (
              <option key={bucket.id} value={bucket.id}>
                {bucket.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] leading-snug text-stone-400">
            Move it later by dragging it onto another bucket.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-due" className={labelClass}>
              Due date <span className="text-stone-400">(optional)</span>
            </label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={`${fieldClass} mt-1`}
            />
            <p className="mt-1 text-[11px] leading-snug text-stone-400">
              Due dates drive the on-track color.
            </p>
          </div>

          <div>
            <label htmlFor="task-estimate" className={labelClass}>
              Estimate <span className="text-stone-400">(pomodoros)</span>
            </label>
            <input
              id="task-estimate"
              type="number"
              min={1}
              max={16}
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              placeholder="e.g. 3"
              className={`${fieldClass} mt-1`}
            />
            <p className="mt-1 text-[11px] leading-snug text-stone-400">
              Progress fills as you complete linked sessions.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-2.5 rounded-lg border border-stone-200 bg-stone-50/60 p-3">
          <input
            type="checkbox"
            checked={pinnedToday}
            onChange={(event) => setPinnedToday(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
          />
          <span>
            <span className="block text-sm font-medium text-stone-700">
              Show in Today
            </span>
            <span className="block text-[11px] leading-snug text-stone-500">
              Pull a future-dated task into Today. Undated tasks always appear
              here.
            </span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
