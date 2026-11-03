import type { Bucket } from "../../types";
import { useDroppable } from "@dnd-kit/core";
import { PlusIcon } from "../ui/Icons";

export const BUCKET_DROPPABLE_PREFIX = "bucket:";

interface BucketTabProps {
  bucket: Bucket;
  active: boolean;
  count: number;
  onSelect: () => void;
}

function BucketTab({ bucket, active, count, onSelect }: BucketTabProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${BUCKET_DROPPABLE_PREFIX}${bucket.id}`,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      title={
        isOver
          ? `Drop to move into ${bucket.name}`
          : `${bucket.name} · ${count} open`
      }
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        isOver
          ? "scale-105 border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-300"
          : active
            ? "border-stone-900 bg-stone-900 text-white"
            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isOver ? "bg-amber-500" : ""
        }`}
        style={isOver ? undefined : { backgroundColor: bucket.color }}
        aria-hidden="true"
      />
      <span className="max-w-28 truncate">{bucket.name}</span>
      <span
        className={`rounded-full px-1.5 text-[10px] tabular ${
          active && !isOver ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

interface BucketBarProps {
  buckets: Bucket[];
  view: string;
  todayCount: number;
  counts: Record<string, number>;
  onSelect: (view: string) => void;
  onCreate: () => void;
  showDragHint?: boolean;
}

export function BucketBar({
  buckets,
  view,
  todayCount,
  counts,
  onSelect,
  onCreate,
  showDragHint = false,
}: BucketBarProps) {
  return (
    <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible">
      <button
        type="button"
        onClick={() => onSelect("today")}
        aria-pressed={view === "today"}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
          view === "today"
            ? "border-stone-900 bg-stone-900 text-white"
            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
        }`}
      >
        Today
        <span
          className={`rounded-full px-1.5 text-[10px] tabular ${
            view === "today" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
          }`}
        >
          {todayCount}
        </span>
      </button>

      <span className="mx-0.5 h-4 w-px shrink-0 bg-stone-200" aria-hidden="true" />

      {buckets.map((bucket) => (
        <BucketTab
          key={bucket.id}
          bucket={bucket}
          active={view === bucket.id}
          count={counts[bucket.id] ?? 0}
          onSelect={() => onSelect(bucket.id)}
        />
      ))}

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-700"
      >
        <PlusIcon className="h-3 w-3" />
        Bucket
      </button>

      {showDragHint ? (
        <span className="ml-auto hidden shrink-0 text-[10px] text-stone-400 lg:block">
          Drag a task onto a bucket to move it
        </span>
      ) : null}
    </div>
  );
}
