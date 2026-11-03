import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Bucket, Task } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import {
  getTodayGroups,
  openTaskCount,
  taskTimeTakenMs,
  todayFocusMinutesMs,
} from "../../store/selectors";
import { formatDuration, formatLongDate } from "../../lib/time";
import { bucketHash, readBucketFromHash } from "../../lib/hash";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { PencilIcon, PlusIcon, SearchIcon, XIcon } from "../ui/Icons";
import {
  BUCKET_DROPPABLE_PREFIX,
  BucketBar,
} from "../buckets/BucketBar";
import { BucketEditor } from "../buckets/BucketEditor";
import { SortableTaskRow } from "./SortableTaskRow";
import { TaskEditor } from "./TaskEditor";
import { TaskRow } from "./TaskRow";

type Filter = "all" | "open" | "done";
type EditorState = { task: Task | null } | null;
type BucketEditorState = { bucket: Bucket | null } | null;

const filterLabels: Record<Filter, string> = {
  all: "All",
  open: "Open",
  done: "Done",
};

function byOrder(a: Task, b: Task): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.createdAt.localeCompare(b.createdAt);
}

/** Prefer whatever the pointer is physically over, so bucket tabs are easy to hit. */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (hits.length > 0) {
    const bucketHit = hits.find((hit) =>
      String(hit.id).startsWith(BUCKET_DROPPABLE_PREFIX),
    );
    return bucketHit ? [bucketHit] : hits;
  }
  return closestCenter(args);
};

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          {title}
        </h3>
        <span className="rounded-full bg-stone-200/70 px-1.5 text-[10px] font-medium text-stone-500">
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function TaskPanel() {
  const tasks = useAppStore((state) => state.tasks);
  const sessions = useAppStore((state) => state.sessions);
  const buckets = useAppStore((state) => state.buckets);
  const moveTaskToBucket = useAppStore((state) => state.moveTaskToBucket);
  const reorderTasks = useAppStore((state) => state.reorderTasks);
  const pushToast = useAppStore((state) => state.pushToast);

  const [view, setView] = useState<string>(
    () => readBucketFromHash(window.location.hash) ?? "today",
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [showDone, setShowDone] = useState(true);
  const [showLater, setShowLater] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);
  const [bucketEditor, setBucketEditor] = useState<BucketEditorState>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sortedBuckets = useMemo(
    () => [...buckets].sort((a, b) => a.order - b.order),
    [buckets],
  );

  const activeBucket =
    view === "today"
      ? undefined
      : sortedBuckets.find((bucket) => bucket.id === view);

  // Keep a shareable/bookmarkable deep link to the open bucket.
  useEffect(() => {
    if (view !== "today" && !activeBucket) {
      setView("today");
      return;
    }
    const hash = bucketHash(view === "today" ? null : view);
    if (window.location.hash === hash) return;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${hash}`,
    );
  }, [activeBucket, view]);

  // Follow browser back/forward and manually pasted links.
  useEffect(() => {
    const onHashChange = () => {
      setView(readBucketFromHash(window.location.hash) ?? "today");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const groups = useMemo(() => getTodayGroups(tasks), [tasks]);
  const focusMs = todayFocusMinutesMs(sessions);
  const openCount = openTaskCount(tasks);

  const bucketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const bucket of sortedBuckets) counts[bucket.id] = 0;
    for (const task of tasks) {
      if (task.completedAt) continue;
      if (counts[task.bucketId] !== undefined) counts[task.bucketId] += 1;
    }
    return counts;
  }, [sortedBuckets, tasks]);

  const bucketTasks = useMemo(() => {
    if (!activeBucket) return [];
    return tasks
      .filter((task) => task.bucketId === activeBucket.id)
      .sort(byOrder);
  }, [activeBucket, tasks]);

  const bucketFocusMs = useMemo(
    () =>
      bucketTasks.reduce(
        (total, task) => total + taskTimeTakenMs(task.id, sessions),
        0,
      ),
    [bucketTasks, sessions],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const matches = (task: Task) =>
    normalizedQuery === "" ||
    `${task.title} ${task.description}`.toLowerCase().includes(normalizedQuery);

  const visible = {
    overdue: groups.overdue.filter(matches),
    today: groups.today.filter(matches),
    pinned: groups.pinned.filter(matches),
    later: groups.later.filter(matches),
    done: groups.done.filter(matches),
  };

  const visibleBucketTasks = useMemo(() => {
    if (!activeBucket) return [];
    return bucketTasks.filter((task) => {
      if (filter === "open" && task.completedAt) return false;
      if (filter === "done" && !task.completedAt) return false;
      return matches(task);
    });
  }, [activeBucket, bucketTasks, filter, normalizedQuery]);

  const sortableEnabled =
    filter === "all" &&
    normalizedQuery === "" &&
    visibleBucketTasks.length === bucketTasks.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(
      tasks.find((task) => task.id === String(event.active.id)) ?? null,
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task) return;

    if (overId.startsWith(BUCKET_DROPPABLE_PREFIX)) {
      const bucketId = overId.slice(BUCKET_DROPPABLE_PREFIX.length);
      if (bucketId === task.bucketId) return;
      const destination = sortedBuckets.find((bucket) => bucket.id === bucketId);
      if (!destination) return;
      moveTaskToBucket(taskId, bucketId);
      pushToast(`Moved “${task.title}” to ${destination.name}.`, "success");
      return;
    }

    if (!activeBucket || overId === taskId) return;

    const ids = bucketTasks.map((candidate) => candidate.id);
    const oldIndex = ids.indexOf(taskId);
    const newIndex = ids.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;
    reorderTasks(activeBucket.id, arrayMove(ids, oldIndex, newIndex));
  };

  const openTaskEditor = (task: Task | null) => setEditor({ task });
  const closeTaskEditor = () => setEditor(null);

  const showOpenSections = !activeBucket && filter !== "done";
  const showDoneSection = !activeBucket && filter !== "open";
  const hasVisibleTasks = activeBucket
    ? visibleBucketTasks.length > 0
    : (showOpenSections &&
        visible.overdue.length +
          visible.today.length +
          visible.pinned.length +
          visible.later.length >
          0) ||
      (showDoneSection && visible.done.length > 0);

  const headerBucket = activeBucket;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="space-y-4">
        <header className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {headerBucket ? (
                <>
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: headerBucket.color }}
                      aria-hidden="true"
                    />
                    Bucket
                  </p>
                  <h2 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-stone-900">
                    {headerBucket.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {bucketCounts[headerBucket.id] ?? 0} open ·{" "}
                    {formatDuration(bucketFocusMs)} focused
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Today
                  </p>
                  <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-stone-900">
                    {formatLongDate()}
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {openCount} open {openCount === 1 ? "task" : "tasks"} ·{" "}
                    {formatDuration(focusMs)} focused
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {headerBucket ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBucketEditor({ bucket: headerBucket })}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : null}
              <Button variant="primary" onClick={() => openTaskEditor(null)}>
                <PlusIcon />
                New task
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks…"
                aria-label="Search tasks"
                className="h-9 w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-8 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-stone-400 hover:bg-stone-200 hover:text-stone-700"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex shrink-0 rounded-lg bg-stone-100 p-0.5">
              {(Object.keys(filterLabels) as Filter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    filter === value
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {filterLabels[value]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 border-t border-stone-100 pt-3">
            <BucketBar
              buckets={sortedBuckets}
              view={activeBucket?.id ?? "today"}
              todayCount={openCount}
              counts={bucketCounts}
              onSelect={setView}
              onCreate={() => setBucketEditor({ bucket: null })}
              showDragHint={Boolean(activeBucket) && sortableEnabled}
            />
          </div>
        </header>

        {hasVisibleTasks ? (
          activeBucket ? (
            <div className="space-y-2">
              {sortableEnabled ? (
                <SortableContext
                  items={bucketTasks.map((task) => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {visibleBucketTasks.map((task) => (
                    <SortableTaskRow
                      key={task.id}
                      task={task}
                      onEdit={openTaskEditor}
                    />
                  ))}
                </SortableContext>
              ) : (
                visibleBucketTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={openTaskEditor}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {showOpenSections && visible.overdue.length > 0 ? (
                <Section title="Overdue" count={visible.overdue.length}>
                  {visible.overdue.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onEdit={openTaskEditor}
                      showBucket
                    />
                  ))}
                </Section>
              ) : null}

              {showOpenSections && visible.today.length > 0 ? (
                <Section title="Due today" count={visible.today.length}>
                  {visible.today.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onEdit={openTaskEditor}
                      showBucket
                    />
                  ))}
                </Section>
              ) : null}

              {showOpenSections && visible.pinned.length > 0 ? (
                <Section title="In focus" count={visible.pinned.length}>
                  {visible.pinned.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onEdit={openTaskEditor}
                      showBucket
                    />
                  ))}
                </Section>
              ) : null}

              {showOpenSections && visible.later.length > 0 ? (
                <section className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowLater((value) => !value)}
                    className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left"
                    aria-expanded={showLater || normalizedQuery !== ""}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                      Later
                    </span>
                    <span className="rounded-full bg-stone-200/70 px-1.5 text-[10px] font-medium text-stone-500">
                      {visible.later.length}
                    </span>
                    <span className="ml-auto text-[11px] text-stone-400">
                      {showLater || normalizedQuery !== "" ? "Hide" : "Show"}
                    </span>
                  </button>
                  {showLater || normalizedQuery !== "" ? (
                    <div className="space-y-2">
                      {visible.later.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onEdit={openTaskEditor}
                          showBucket
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {showDoneSection && visible.done.length > 0 ? (
                <section className="space-y-2">
                  {filter === "all" ? (
                    <button
                      type="button"
                      onClick={() => setShowDone((value) => !value)}
                      className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left"
                      aria-expanded={showDone}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                        Done today
                      </span>
                      <span className="rounded-full bg-stone-200/70 px-1.5 text-[10px] font-medium text-stone-500">
                        {visible.done.length}
                      </span>
                      <span className="ml-auto text-[11px] text-stone-400">
                        {showDone ? "Hide" : "Show"}
                      </span>
                    </button>
                  ) : null}

                  {filter === "done" || showDone ? (
                    <div className="space-y-2">
                      {visible.done.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onEdit={openTaskEditor}
                          showBucket
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          )
        ) : (
          <EmptyState
            title={
              query
                ? "No tasks match that search"
                : filter === "done"
                  ? activeBucket
                    ? "Nothing done in this bucket yet"
                    : "Nothing completed today"
                  : activeBucket
                    ? "This bucket is empty"
                    : "Your day is clear"
            }
            description={
              query
                ? "Try a different word, or clear the search."
                : filter === "done"
                  ? "Finish a task and it will show up here."
                  : activeBucket
                    ? "Add a task here, or drag one onto this bucket from another list."
                    : "Add a task, pick it up when you're ready, and let the timer do the rest."
            }
            action={
              !query && filter !== "done" ? (
                <Button
                  variant="primary"
                  onClick={() => openTaskEditor(null)}
                >
                  <PlusIcon />
                  {activeBucket ? "Add a task to this bucket" : "Add your first task"}
                </Button>
              ) : null
            }
          />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="flex max-w-sm gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 shadow-xl">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-900">
                {activeTask.title}
              </p>
              {activeTask.description ? (
                <p className="truncate text-[11px] text-stone-500">
                  {activeTask.description}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {editor ? (
        <TaskEditor
          key={editor.task?.id ?? "new"}
          task={editor.task}
          defaultBucketId={activeBucket?.id}
          onClose={closeTaskEditor}
        />
      ) : null}

      {bucketEditor ? (
        <BucketEditor
          key={bucketEditor.bucket?.id ?? "new"}
          bucket={bucketEditor.bucket}
          onClose={() => setBucketEditor(null)}
          onDeleted={() => setView("today")}
        />
      ) : null}
    </DndContext>
  );
}
