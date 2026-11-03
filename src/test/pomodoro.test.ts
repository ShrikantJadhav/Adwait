import { describe, expect, it } from "vitest";
import {
  createTimer,
  elapsedFocusMs,
  finalizeSession,
  isExpired,
  pauseTimer,
  plannedMsForKind,
  remainingMs,
  resumeTimer,
} from "../lib/pomodoro";

const MINUTE = 60_000;
const BASE = new Date("2026-11-03T09:00:00").getTime();

describe("timer math", () => {
  it("starts with the planned duration remaining", () => {
    const timer = createTimer("focus", 25 * MINUTE, "task-1", BASE);
    expect(timer.state).toBe("running");
    expect(remainingMs(timer, BASE)).toBe(25 * MINUTE);
    expect(remainingMs(timer, BASE + 10 * MINUTE)).toBe(15 * MINUTE);
    expect(elapsedFocusMs(timer, BASE + 10 * MINUTE)).toBe(10 * MINUTE);
  });

  it("freezes the remaining time while paused", () => {
    const timer = createTimer("focus", 25 * MINUTE, undefined, BASE);
    const paused = pauseTimer(timer, BASE + 10 * MINUTE);

    expect(paused.state).toBe("paused");
    expect(remainingMs(paused, BASE + 15 * MINUTE)).toBe(15 * MINUTE);
    expect(remainingMs(paused, BASE + 40 * MINUTE)).toBe(15 * MINUTE);
    expect(elapsedFocusMs(paused, BASE + 40 * MINUTE)).toBe(10 * MINUTE);
  });

  it("extends the end time by the paused duration on resume", () => {
    const timer = createTimer("focus", 25 * MINUTE, undefined, BASE);
    const paused = pauseTimer(timer, BASE + 10 * MINUTE);
    const resumed = resumeTimer(paused, BASE + 20 * MINUTE);

    expect(resumed.state).toBe("running");
    expect(resumed.totalPausedMs).toBe(10 * MINUTE);
    expect(resumed.endsAt).toBe(new Date(BASE + 35 * MINUTE).toISOString());
    expect(remainingMs(resumed, BASE + 20 * MINUTE)).toBe(15 * MINUTE);
    expect(elapsedFocusMs(resumed, BASE + 25 * MINUTE)).toBe(15 * MINUTE);
  });

  it("expires exactly at the end timestamp", () => {
    const timer = createTimer("focus", 25 * MINUTE, undefined, BASE);
    expect(isExpired(timer, BASE + 25 * MINUTE - 1)).toBe(false);
    expect(isExpired(timer, BASE + 25 * MINUTE)).toBe(true);
  });

  it("logs a completed session with the full planned focus time", () => {
    const timer = createTimer("focus", 25 * MINUTE, "task-1", BASE);
    const session = finalizeSession(timer, BASE + 40 * MINUTE, "completed");

    expect(session.outcome).toBe("completed");
    expect(session.taskId).toBe("task-1");
    expect(session.focusMs).toBe(25 * MINUTE);
    expect(session.endedAt).toBe(new Date(BASE + 25 * MINUTE).toISOString());
    expect(session.day).toBe("2026-11-03");
  });

  it("logs a cancelled session with only the time actually focused", () => {
    const timer = createTimer("focus", 25 * MINUTE, undefined, BASE);
    const cancelled = finalizeSession(timer, BASE + 8 * MINUTE, "cancelled");

    expect(cancelled.outcome).toBe("cancelled");
    expect(cancelled.focusMs).toBe(8 * MINUTE);
    expect(cancelled.endedAt).toBe(new Date(BASE + 8 * MINUTE).toISOString());
  });

  it("does not count a pause after cancelling while paused", () => {
    const timer = createTimer("focus", 25 * MINUTE, undefined, BASE);
    const paused = pauseTimer(timer, BASE + 10 * MINUTE);
    const cancelled = finalizeSession(paused, BASE + 60 * MINUTE, "cancelled");

    expect(cancelled.focusMs).toBe(10 * MINUTE);
    expect(cancelled.endedAt).toBe(new Date(BASE + 10 * MINUTE).toISOString());
  });

  it("derives durations from settings", () => {
    const settings = {
      focusMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
    };
    expect(plannedMsForKind("focus", settings)).toBe(50 * MINUTE);
    expect(plannedMsForKind("shortBreak", settings)).toBe(10 * MINUTE);
    expect(plannedMsForKind("longBreak", settings)).toBe(20 * MINUTE);
  });
});
