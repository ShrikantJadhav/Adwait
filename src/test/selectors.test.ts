import { describe, expect, it } from "vitest";
import type { Task } from "../types";
import {
  getTodayGroups,
  taskFocusSessionCount,
  taskTimeTakenMs,
  todayFocusMinutesMs,
} from "../store/selectors";

const TODAY = "2026-11-03";

function makeTask(overrides: Partial<Task> & Pick<Task, "id">): Task {
  return {
    title: overrides.id,
    description: "",
    bucketId: "inbox",
    createdAt: "2026-11-01T09:00:00.000Z",
    order: 1,
    ...overrides,
  };
}

describe("today grouping", () => {
  it("splits overdue, due today, pinned, and done without duplicates", () => {
    const tasks = [
      makeTask({ id: "overdue", dueDate: "2026-11-01", pinnedToday: true }),
      makeTask({ id: "today", dueDate: TODAY, pinnedToday: true }),
      makeTask({ id: "pinned", pinnedToday: true }),
      makeTask({ id: "undated" }),
      makeTask({ id: "future", dueDate: "2026-11-10" }),
      makeTask({
        id: "done",
        dueDate: TODAY,
        completedAt: `${TODAY}T12:00:00.000Z`,
      }),
    ];

    const groups = getTodayGroups(tasks, TODAY);
    expect(groups.overdue.map((task) => task.id)).toEqual(["overdue"]);
    expect(groups.today.map((task) => task.id)).toEqual(["today"]);
    expect(groups.pinned.map((task) => task.id)).toEqual([
      "pinned",
      "undated",
    ]);
    expect(groups.later.map((task) => task.id)).toEqual(["future"]);
    expect(groups.done.map((task) => task.id)).toEqual(["done"]);
  });

  it("leaves future tasks out of Today", () => {
    const groups = getTodayGroups(
      [makeTask({ id: "future", dueDate: "2026-12-01" })],
      TODAY,
    );
    expect(groups.overdue).toHaveLength(0);
    expect(groups.today).toHaveLength(0);
    expect(groups.pinned).toHaveLength(0);
  });
});

describe("session roll-ups", () => {
  const sessions = [
    {
      id: "s1",
      taskId: "task-1",
      kind: "focus" as const,
      startedAt: `${TODAY}T09:00:00.000Z`,
      endedAt: `${TODAY}T09:25:00.000Z`,
      plannedMs: 25 * 60_000,
      focusMs: 25 * 60_000,
      pausedMs: 0,
      outcome: "completed" as const,
      day: TODAY,
    },
    {
      id: "s2",
      taskId: "task-1",
      kind: "focus" as const,
      startedAt: `${TODAY}T10:00:00.000Z`,
      endedAt: `${TODAY}T10:05:00.000Z`,
      plannedMs: 25 * 60_000,
      focusMs: 5 * 60_000,
      pausedMs: 0,
      outcome: "cancelled" as const,
      day: TODAY,
    },
  ];

  it("counts only completed focus sessions toward time taken", () => {
    expect(taskTimeTakenMs("task-1", sessions)).toBe(25 * 60_000);
    expect(taskFocusSessionCount("task-1", sessions)).toBe(1);
  });

  it("counts only completed sessions in today's focus total", () => {
    expect(todayFocusMinutesMs(sessions, TODAY)).toBe(25 * 60_000);
  });
});
