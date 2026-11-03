#!/usr/bin/env node
/**
 * Generates a demo backup for screenshots and reviews.
 *
 * Run with:
 *   node scripts/generate-demo.mjs
 *
 * Then in Adwait: Import → choose demo/adwait-demo.json.
 * Importing replaces the current data, so export a backup first.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pad = (value) => String(value).padStart(2, "0");

function localDay(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDay(date);
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const today = localDay(new Date());
const MINUTE = 60_000;

const buckets = [
  { id: "inbox", name: "Inbox", color: "#78716c", order: 0, isInbox: true },
  { id: "quic", name: "QUIC", color: "#3b82f6", order: 1 },
  { id: "reading", name: "Reading", color: "#8b5cf6", order: 2 },
  { id: "admin", name: "Admin", color: "#f59e0b", order: 3 },
  { id: "personal", name: "Personal", color: "#10b981", order: 4 },
];

const tasks = [
  {
    id: "t-read-rfc9000",
    title: "Read QUIC RFC 9000 — transport fundamentals",
    description:
      "Sections 1–5: packets, frames, connection IDs. Take notes on TODO interactions.",
    bucketId: "reading",
    dueDate: dayOffset(-2),
    estimatePomodoros: 3,
    pinnedToday: true,
    order: 1,
  },
  {
    id: "t-todo-frame",
    title: "Add TODO frame handling to the QUIC stack",
    description:
      "Parse, validate, and acknowledge TODO frames in the send and receive paths.",
    bucketId: "quic",
    dueDate: dayOffset(-1),
    estimatePomodoros: 5,
    pinnedToday: true,
    order: 2,
  },
  {
    id: "t-implement-tod",
    title: "Implement TOD in QUIC",
    description:
      "Finish the TOD state machine and wire it into the connection loop. Keep the API transport-agnostic.",
    bucketId: "quic",
    dueDate: today,
    estimatePomodoros: 4,
    pinnedToday: true,
    order: 3,
  },
  {
    id: "t-rfc9002",
    title: "Read RFC 9002 — loss detection and congestion control",
    description: "Focus on the pseudocode for loss timers and persistent congestion.",
    bucketId: "reading",
    dueDate: today,
    estimatePomodoros: 3,
    pinnedToday: true,
    order: 4,
  },
  {
    id: "t-review-0rtt",
    title: "Review the 0-RTT integration test PR",
    description: "Check replay handling and the new test fixtures.",
    bucketId: "quic",
    dueDate: today,
    estimatePomodoros: 1,
    pinnedToday: true,
    order: 5,
  },
  {
    id: "t-priority-tests",
    title: "Write stream prioritization tests",
    description: "Cover equal priority, starvation, and dynamic reprioritization.",
    bucketId: "quic",
    dueDate: dayOffset(1),
    estimatePomodoros: 2,
    pinnedToday: false,
    order: 6,
  },
  {
    id: "t-rfc9114",
    title: "Read RFC 9114 — HTTP/3",
    description: "Skim the framing changes, then go deep on server push removal.",
    bucketId: "reading",
    dueDate: dayOffset(2),
    estimatePomodoros: 3,
    pinnedToday: false,
    order: 7,
  },
  {
    id: "t-tod-design",
    title: "Draft the TOD design note",
    description: "One page: problem, wire format, failure modes, migration story.",
    bucketId: "quic",
    dueDate: dayOffset(3),
    estimatePomodoros: 2,
    pinnedToday: false,
    order: 8,
  },
  {
    id: "t-transport-docs",
    title: "Update transport parameter docs",
    description: "New TOD parameter plus a small table of defaults.",
    bucketId: "admin",
    dueDate: dayOffset(5),
    estimatePomodoros: 1,
    pinnedToday: false,
    order: 9,
  },
  {
    id: "t-profile-hotpath",
    title: "Profile the packet processing hot path",
    description: "Find where the extra TODO check costs us. Target < 2%.",
    bucketId: "quic",
    dueDate: dayOffset(7),
    estimatePomodoros: 3,
    pinnedToday: false,
    order: 10,
  },
  {
    id: "t-blog-post",
    title: "Sketch a blog post: what TOD actually buys you",
    description: "Start with the user-visible win, not the frame layout.",
    bucketId: "quic",
    estimatePomodoros: 2,
    pinnedToday: true,
    order: 11,
  },
  {
    id: "t-branch-stack",
    title: "Clean up the local branch stack",
    description: "Rebase, squash, and drop the experiments that went nowhere.",
    bucketId: "admin",
    estimatePomodoros: 1,
    pinnedToday: true,
    order: 12,
  },
  {
    id: "t-coffee",
    title: "Buy coffee beans",
    description: "The good ones, not the supermarket bag.",
    bucketId: "personal",
    estimatePomodoros: 1,
    pinnedToday: true,
    order: 13,
  },
  {
    id: "t-conference-cfp",
    title: "Reply to the conference CFP email",
    description: "Propose the TOD talk. Two sentences is enough.",
    bucketId: "admin",
    estimatePomodoros: 1,
    pinnedToday: true,
    order: 14,
  },
  {
    id: "t-test-harness",
    title: "Set up the QUIC test harness",
    description: "Deterministic time, packet capture, and a fake lossy network.",
    bucketId: "quic",
    estimatePomodoros: 2,
    pinnedToday: true,
    completedAt: minutesAgo(150),
    order: 15,
  },
  {
    id: "t-read-rfc9001",
    title: "Read RFC 9001 — TLS for QUIC",
    description: "Certificate verification and the handshake state machine.",
    bucketId: "reading",
    estimatePomodoros: 2,
    pinnedToday: true,
    completedAt: minutesAgo(60),
    order: 16,
  },
  {
    id: "t-stateless-reset",
    title: "Fix the stateless reset edge case",
    description: "Reset tokens were compared before the connection ID length check.",
    bucketId: "quic",
    estimatePomodoros: 2,
    pinnedToday: true,
    completedAt: minutesAgo(5),
    order: 17,
  },
].map((task) => ({
  ...task,
  createdAt: minutesAgo(60 * 24 * 3),
}));

function focusSession({ id, taskId, startedMinutesAgo, outcome = "completed", focusMinutes = 25 }) {
  const start = new Date(Date.now() - startedMinutesAgo * MINUTE);
  const focusMs = outcome === "completed" ? 25 * MINUTE : focusMinutes * MINUTE;
  const end = new Date(start.getTime() + focusMs);
  return {
    id,
    taskId,
    kind: "focus",
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    plannedMs: 25 * MINUTE,
    focusMs,
    pausedMs: 0,
    outcome,
    day: localDay(start),
  };
}

const sessions = [
  focusSession({
    id: "s-tod-progress",
    taskId: "t-implement-tod",
    startedMinutesAgo: 125,
  }),
  focusSession({
    id: "s-read-rfc9001",
    taskId: "t-read-rfc9001",
    startedMinutesAgo: 88,
  }),
  focusSession({
    id: "s-stateless-reset",
    taskId: "t-stateless-reset",
    startedMinutesAgo: 33,
  }),
  focusSession({
    id: "s-tod-cancelled",
    taskId: "t-implement-tod",
    startedMinutesAgo: 58,
    outcome: "cancelled",
    focusMinutes: 12,
  }),
  focusSession({
    id: "s-test-harness",
    taskId: "t-test-harness",
    startedMinutesAgo: 178,
  }),
];

const state = {
  schemaVersion: 1,
  buckets,
  tasks,
  sessions: sessions.filter((session) => session.day === today),
  settings: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakEvery: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
    volume: 0.7,
    notificationsEnabled: false,
  },
};

const backup = {
  schemaVersion: 1,
  exportedAt: new Date().toISOString(),
  data: state,
};

const outDir = join(root, "demo");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "adwait-demo.json");
writeFileSync(outFile, `${JSON.stringify(backup, null, 2)}\n`);

const open = tasks.filter((task) => !task.completedAt).length;
console.log(`Wrote ${outFile}`);
console.log(
  `${tasks.length} tasks (${open} open), ${state.sessions.length} focus sessions, ${buckets.length} buckets.`,
);
