import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../types";
import { TaskRow } from "./TaskRow";

interface SortableTaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  showBucket?: boolean;
}

/** Wraps TaskRow with drag-to-reorder behaviour inside a bucket. */
export function SortableTaskRow({
  task,
  onEdit,
  showBucket,
}: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "relative z-10 opacity-40" : undefined}
    >
      <TaskRow
        task={task}
        onEdit={onEdit}
        showBucket={showBucket}
        dragHandleProps={{ attributes, listeners }}
      />
    </div>
  );
}
