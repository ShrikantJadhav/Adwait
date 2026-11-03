import { beforeEach, describe, expect, it } from "vitest";
import {
  INBOX_ID,
  createInitialState,
  useAppStore,
} from "../store/useAppStore";

function resetStore() {
  useAppStore.setState({
    ...createInitialState(),
    toasts: [],
    suggestion: undefined,
  });
}

beforeEach(resetStore);

describe("buckets", () => {
  it("creates buckets in insertion order and trims the name", () => {
    const work = useAppStore.getState().addBucket("  Work  ", "#3b82f6");
    const personal = useAppStore.getState().addBucket("Personal", "#10b981");

    expect(work?.name).toBe("Work");
    expect(personal?.order).toBeGreaterThan(work?.order ?? 0);

    const names = useAppStore.getState().buckets.map((bucket) => bucket.name);
    expect(names).toEqual(["Inbox", "Work", "Personal"]);
  });

  it("moves a task to another bucket at the end of its order", () => {
    const work = useAppStore.getState().addBucket("Work", "#3b82f6");
    if (!work) throw new Error("bucket was not created");

    const first = useAppStore.getState().addTask({ title: "First" });
    useAppStore.getState().addTask({ title: "Second", bucketId: work.id });
    if (!first) throw new Error("task was not created");

    useAppStore.getState().moveTaskToBucket(first.id, work.id);

    const moved = useAppStore
      .getState()
      .tasks.find((task) => task.id === first.id);
    expect(moved?.bucketId).toBe(work.id);

    const workOrders = useAppStore
      .getState()
      .tasks.filter((task) => task.bucketId === work.id)
      .map((task) => task.order)
      .sort((left, right) => left - right);
    expect(workOrders).toEqual([2, 3]);
    expect(moved?.order).toBe(3);
  });

  it("reorders tasks within a bucket", () => {
    const work = useAppStore.getState().addBucket("Work", "#3b82f6");
    if (!work) throw new Error("bucket was not created");

    const a = useAppStore.getState().addTask({ title: "A", bucketId: work.id });
    const b = useAppStore.getState().addTask({ title: "B", bucketId: work.id });
    if (!a || !b) throw new Error("tasks were not created");

    useAppStore.getState().reorderTasks(work.id, [b.id, a.id]);

    const ordered = useAppStore
      .getState()
      .tasks.filter((task) => task.bucketId === work.id)
      .sort((left, right) => left.order - right.order)
      .map((task) => task.title);
    expect(ordered).toEqual(["B", "A"]);
  });

  it("moves tasks to Inbox when their bucket is deleted", () => {
    const work = useAppStore.getState().addBucket("Work", "#3b82f6");
    if (!work) throw new Error("bucket was not created");

    const task = useAppStore
      .getState()
      .addTask({ title: "Keep me", bucketId: work.id });
    if (!task) throw new Error("task was not created");

    useAppStore.getState().deleteBucket(work.id);

    expect(
      useAppStore.getState().buckets.some((bucket) => bucket.id === work.id),
    ).toBe(false);
    expect(
      useAppStore.getState().tasks.find((candidate) => candidate.id === task.id)
        ?.bucketId,
    ).toBe(INBOX_ID);
  });

  it("never deletes the Inbox", () => {
    useAppStore.getState().deleteBucket(INBOX_ID);
    expect(
      useAppStore.getState().buckets.some((bucket) => bucket.id === INBOX_ID),
    ).toBe(true);
  });

  it("appends a task to the end when its bucket changes via updateTask", () => {
    const work = useAppStore.getState().addBucket("Work", "#3b82f6");
    if (!work) throw new Error("bucket was not created");

    useAppStore.getState().addTask({ title: "Existing", bucketId: work.id });
    const task = useAppStore.getState().addTask({ title: "Move me" });
    if (!task) throw new Error("task was not created");

    useAppStore.getState().updateTask(task.id, { bucketId: work.id });

    const moved = useAppStore
      .getState()
      .tasks.find((candidate) => candidate.id === task.id);
    expect(moved?.bucketId).toBe(work.id);
    expect(moved?.order).toBe(2);
  });
});
