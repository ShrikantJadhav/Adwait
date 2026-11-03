import { useState, type FormEvent } from "react";
import type { Bucket } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

const BUCKET_COLORS = [
  "#78716c",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
];

interface BucketEditorProps {
  bucket: Bucket | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function BucketEditor({ bucket, onClose, onDeleted }: BucketEditorProps) {
  const addBucket = useAppStore((state) => state.addBucket);
  const updateBucket = useAppStore((state) => state.updateBucket);
  const deleteBucket = useAppStore((state) => state.deleteBucket);
  const tasks = useAppStore((state) => state.tasks);

  const [name, setName] = useState(bucket?.name ?? "");
  const [color, setColor] = useState(bucket?.color ?? BUCKET_COLORS[2]);
  const [error, setError] = useState("");

  const taskCount = bucket
    ? tasks.filter((task) => task.bucketId === bucket.id).length
    : 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the bucket a name.");
      return;
    }

    if (bucket) {
      updateBucket(bucket.id, { name: trimmed, color });
    } else {
      addBucket(trimmed, color);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!bucket || bucket.isInbox) return;
    const detail =
      taskCount > 0
        ? `Its ${taskCount} ${taskCount === 1 ? "task" : "tasks"} will move to Inbox.`
        : "It is empty.";
    if (window.confirm(`Delete “${bucket.name}”? ${detail}`)) {
      deleteBucket(bucket.id);
      onDeleted?.();
      onClose();
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={bucket ? "Edit bucket" : "New bucket"}
      description={
        bucket
          ? "Rename it, change its color, or remove it."
          : "Buckets are project lists: Work, Personal, Finance…"
      }
      footer={
        <>
          <div>
            {bucket && !bucket.isInbox ? (
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" form="bucket-form" variant="primary">
              {bucket ? "Save changes" : "Create bucket"}
            </Button>
          </div>
        </>
      }
    >
      <form id="bucket-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="bucket-name"
            className="block text-xs font-medium text-stone-600"
          >
            Name
          </label>
          <input
            id="bucket-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. Client work"
            autoFocus
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition-colors placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
          />
          {error ? (
            <p className="mt-1 text-xs text-rose-600">{error}</p>
          ) : null}
        </div>

        <div>
          <span className="block text-xs font-medium text-stone-600">
            Color
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {BUCKET_COLORS.map((swatch) => {
              const selected = swatch === color;
              return (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  aria-label={`Use color ${swatch}`}
                  aria-pressed={selected}
                  className={`grid h-7 w-7 place-items-center rounded-full transition-transform ${
                    selected
                      ? "scale-110 ring-2 ring-stone-900 ring-offset-2"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: swatch }}
                >
                  {selected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {bucket && !bucket.isInbox ? (
          <p className="rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2 text-[11px] leading-relaxed text-stone-500">
            Deleting this bucket keeps its tasks — they move to Inbox.
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
