# Adwait — Product & Build Plan

> **Adwait** — *your day, undivided.*
>
> From Sanskrit *advaita* (अद्वैत), “not two” — non-dual. The tasks and the time spent on them are one.
>
> Status: Phase 2 implemented · Last updated: 3 Nov 2026

---

## 1. Vision

A single-page web app where the whole workday lives in one view:

- **Left:** today's tasks, grouped into project buckets, color-coded by whether they're on track.
- **Right:** a pomodoro timer with start / pause / cancel, plus a log of every focus session completed today.

No navigation, no dashboards to hunt through. Open the app, see what matters, start focusing.

### Principles

1. **One pane, one loop.** Open → see today → pick a task → focus → ring → log → complete.
2. **Time taken is earned, not typed.** It is derived from linked focus sessions, never manually entered.
3. **Color is computed, not decorative.** On-track status comes from due dates (with estimates in phase 2), so color always means something.
4. **Local-first.** Data lives in the browser. JSON export/import is the escape hatch. No account required.
5. **The timer must never lie.** It is timestamp-based and survives refreshes, background tabs, and sleep.

### Non-goals (MVP)

- Accounts, cloud sync, sharing, collaboration.
- Native mobile apps.
- Calendar / GitHub / email integrations.
- AI features.

---

## 2. Locked decisions

| Decision | Choice |
|---|---|
| On-track color | Auto-computed from due date (gray = no due date) |
| Buckets | Project / category lists; tasks move between them |
| Timer ↔ task link | Optional — attach before or after a session |
| Storage | Browser-local + JSON export/import |
| Framework | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Drag & drop | dnd-kit |
| Dates | date-fns |
| Sound | Web Audio API |
| Tests | Vitest |
| Deploy | Vercel / Netlify (static) |

---

## 3. Screens & layout

### App shell

```
┌──────────────────────────────────────────────────┬──────────────────────┐
│  Adwait          Tue 3 Nov        + New task  │        🍅            │
│                                                  │      24:13           │
│  [Today] [Work] [Personal] [Finance]  🔍  Filter │    ◜◝◜◝◜◝◜◝          │
│  ─────────────────────────────────────────────── │   Focus · 25 min     │
│  ▎ Write proposal          5:00 PM   🍅🍅○○     │   Task: Write... ▾   │
│  ▎ Pay electricity bill    Overdue   🍅○○○     │  [ Pause ] [Cancel]  │
│  ▎ Review PR               Done      🍅●○○     │                      │
│                                                  │  Today's sessions    │
│                                                  │  ● 25:00  Write...   │
│                                                  │  ● 25:00  Unlinked   │
└──────────────────────────────────────────────────┴──────────────────────┘
```

Two columns on desktop (task list ~60%, timer ~40%). On narrow screens they stack: timer collapses to a sticky bar at the top, tasks below.

### 3.1 Left pane — tasks

**Header**
- Current date and weekday.
- Open-task count and total focus time today.
- `+ New task` button.
- Search input.
- Filters: All / Open / Done; bucket tabs.

**Task row**
- Color stripe (on-track status).
- Checkbox to complete.
- Title (inline-editable later; modal in MVP).
- Description (one line, expandable).
- Meta chips: due date, created date, time taken, estimate progress (`🍅🍅○○`), linked session count.
- `Focus` button — starts the timer linked to this task.
- Drag handle (phase 2): reorder within bucket, drag onto another bucket tab to move.

**Sections in Today**
1. **Overdue** — open tasks with a due date before today.
2. **Today** — open tasks due today.
3. **Pinned** — tasks manually pulled into today, regardless of due date.
4. **Done today** — collapsible, muted.

**Empty state:** a short line of guidance plus the new-task button, not a blank pane.

### 3.2 Right pane — timer

**Timer card**
- Large circular progress ring with remaining time.
- Mode tabs: Focus (25), Short break (5), Long break (15). Durations configurable in settings.
- Optional task selector: “Link to task…” with search.
- Controls:
  - Idle → `Start`
  - Running → `Pause`, `Cancel`
  - Paused → `Resume`, `Cancel`
- Mode hint after completion: “Nice work. Start a 5-minute break?”
- Keyboard: `Space` start/pause, `Esc` cancel (with confirm).

**Session log (today)**
- One row per session: start time, duration, task name or “Unlinked”, outcome, note.
- `Attach to task…` action on unlinked sessions.
- Ongoing session shown live at the top with elapsed time.
- Totals: sessions count, focus minutes, completed tasks.

**Ring behavior**
- At zero: play chime, show an in-app toast, flash the tab title, and send a desktop notification if permitted.
- Log the session exactly once (idempotent finalization).
- Focus sessions advance the pomodoro cycle; after 4 focus sessions, suggest a long break.
- Auto-start breaks/focus are settings, **off by default**.

### 3.3 Task editor

Modal with: title (required), description, bucket, due date, estimate in pomodoros. Save / Cancel / Delete. Validation prevents empty titles.

---

## 4. Data model

```ts
type ID = string;
type ISODateTime = string; // e.g. "2026-11-03T14:05:00.000Z"
type ISODate = string;     // local calendar date, "2026-11-03"

interface Task {
  id: ID;
  title: string;
  description: string;
  bucketId: ID;
  createdAt: ISODateTime;
  dueDate?: ISODate;          // local date; "due by end of day"
  completedAt?: ISODateTime;
  estimatePomodoros?: number; // optional
  pinnedToday?: boolean;      // manually pulled into Today
  order: number;              // manual sort within bucket
}

interface Bucket {
  id: ID;
  name: string;
  color: string;              // accent for the tab
  order: number;
  isInbox?: boolean;          // undeletable default bucket
}

interface Session {
  id: ID;
  taskId?: ID;                // optional link
  kind: 'focus' | 'shortBreak' | 'longBreak';
  startedAt: ISODateTime;
  endedAt: ISODateTime;
  plannedMs: number;
  focusMs: number;            // excludes paused time
  pausedMs: number;
  outcome: 'completed' | 'cancelled';
  day: ISODate;               // local date of startedAt, for "today" queries
  note?: string;
}

interface ActiveTimer {
  id: ID;                     // becomes the session id on finalize
  kind: Session['kind'];
  taskId?: ID;
  plannedMs: number;
  startedAt: ISODateTime;
  endsAt?: ISODateTime;       // set while running
  remainingMs?: number;       // set while paused
  totalPausedMs: number;
  state: 'running' | 'paused';
}

interface Settings {
  focusMinutes: number;       // default 25
  shortBreakMinutes: number;  // default 5
  longBreakMinutes: number;   // default 15
  longBreakEvery: number;     // default 4 focus sessions
  autoStartBreaks: boolean;   // default false
  autoStartFocus: boolean;    // default false
  soundEnabled: boolean;      // default true
  volume: number;             // 0–1, default 0.7
  notificationsEnabled: boolean;
  dailyGoalPomodoros?: number;
}

interface AppState {
  schemaVersion: 1;
  buckets: Bucket[];
  tasks: Task[];
  sessions: Session[];
  settings: Settings;
  activeTimer?: ActiveTimer;
}
```

### Derived values (never stored)

| Value | Formula |
|---|---|
| `timeTaken(task)` | Sum of `focusMs` of **focus** sessions with `taskId === task.id` and `outcome === 'completed'` (cancelled sessions shown separately in details) |
| `estimateProgress(task)` | Completed focus sessions for the task ÷ `estimatePomodoros` |
| `isOverdue(task)` | Open, has `dueDate`, and `today > dueDate` |
| `isDueToday(task)` | Open and `dueDate === today` |
| `onTrack(task)` | See §5 |
| `sessionsToday` | Sessions where `day === today` |
| `focusMinutesToday` | Sum of `focusMs` for today's completed focus sessions ÷ 60_000 |

### Persistence

- Single key in `localStorage`: `adwait:v1`.
- Writes are debounced (~200 ms). Synchronous flush on `beforeunload`.
- On load: parse, validate `schemaVersion`, and migrate if needed. If parsing fails, keep the corrupt payload under `adwait:corrupt:<timestamp>` and start fresh rather than crash.
- Every state change that matters also updates the open tab's document title (e.g. `24:13 · Adwait`) when a timer is running.

---

## 5. On-track rules

MVP rule (due-date only):

| Status | Rule | Stripe |
|---|---|---|
| Off track | Open and `today > dueDate` (overdue) | Red |
| At risk | Open and `dueDate === today`, or due within the next 24 hours | Amber |
| On track | Open and due more than 24 hours away | Green |
| No signal | Open and no due date | Gray |
| Done | `completedAt` is set | Muted; badge shows “on time” / “late” |

Phase 2 enhancement (estimate-aware): if `estimatePomodoros` is set and the remaining pomodoros cannot fit before the due date within configured working hours, escalate on-track → at-risk. This stays opt-in until the basic rule feels right.

Completed tasks show a badge rather than a loud stripe, so finished work doesn't dominate the list.

---

## 6. Timer specification

### State machine

```
idle ──Start──▶ running ──Pause──▶ paused
                  │  ▲               │
                  │  └──Resume───────┘
                  │
                  ├──Cancel──▶ idle  (logs a cancelled session)
                  └──0:00────▶ idle  (logs a completed session)
```

### Rules

1. **Timestamps only.** While running, `remaining = endsAt - now`. Never decrement a counter; that breaks under background-tab throttling.
2. **Pause** stores `remainingMs` and clears `endsAt`. **Resume** sets `endsAt = now + remainingMs`.
3. **Focus time** = wall time from start to end minus all paused time. Computed at finalize.
4. **Finalize exactly once.** Use the timer `id`; if a session with that id already exists, do nothing. This makes refresh-at-zero safe.
5. **Refresh/close recovery.** Persist `activeTimer`. On load:
   - running and `now < endsAt` → continue;
   - running and `now >= endsAt` → finalize immediately (if it ended less than the grace window ago; otherwise still finalize with the planned duration);
   - paused → restore paused state.
6. **Cancel** logs an `outcome: 'cancelled'` session with the actual focus time, then returns to idle. Confirm only if more than 60 seconds have elapsed.
7. **Breaks** are sessions too, with `kind: 'shortBreak' | 'longBreak'`, and are shown separately from focus time in stats.
8. **Task link is optional and editable** before starting (via selector) or after ending (via “Attach to task…” on the log row).
9. **Multiple tabs:** read `activeTimer` on `storage` events. If another tab owns a running timer, show a read-only banner (“Timer running in another tab”) instead of allowing a second timer.
10. **Midnight:** a session belongs to the local date on which it **started** (`day` field).

### Ring

- AudioContext is created/unlocked on the first Start click.
- On completion: play a three-note chime via Web Audio oscillators (no audio asset), show a toast, flash the title, and send a notification if permission was granted.
- Notification permission is requested on first Start, never on page load.
- Respect `prefers-reduced-motion` for ring animation.
- Timer text uses `aria-live="polite"` updates at most once per 10 seconds, and a final announcement at zero.

---

## 7. Interaction details

### Adding and managing tasks
- `+ New task` opens the editor. `Enter` saves; `Escape` cancels.
- Quick-add (phase 2): type `Pay bill tomorrow #finance` and parse date + bucket.
- Complete: checkbox, or `D` on the selected row. Completing a task with an active linked timer asks: “Stop timer or keep it running?”
- Undo toast for completion and deletion (5 seconds), implemented as a soft delete + restore.
- Delete task: confirm; sessions linked to it keep their `taskId` but display as “Deleted task”.

### Buckets (phase 2)
- Create, rename, recolor, reorder, delete.
- Inbox is the default and cannot be deleted.
- Deleting a bucket moves its tasks to Inbox (never deletes tasks silently).
- Drag a task row onto a bucket tab, or use `Move to…` in the row menu.
- Dragging within a bucket updates `order`.

### Search & filters
- Search matches title and description, case-insensitive.
- Filters: All / Open / Done, plus “Overdue only”.
- Filters apply within the selected bucket, or globally when Today is selected.

### JSON export / import
- Export downloads `adwait-backup-YYYY-MM-DD.json`:
  ```json
  { "schemaVersion": 1, "exportedAt": "...", "data": { ...AppState } }
  ```
- Import validates the shape and `schemaVersion`, offers **Replace** (with a confirmation and an automatic pre-import backup) or **Merge** (dedupe by id, keep newest `updatedAt` where available).
- Import never silently deletes existing data.

---

## 8. Edge cases checklist

- [ ] Reload while running → timer continues with correct remaining time.
- [ ] Reload after `endsAt` passed → exactly one session logged.
- [ ] Sleep/wake → remaining time is correct because it's clock-based.
- [ ] Pause, wait an hour, resume → paused time excluded from `focusMs`.
- [ ] Cancel at 3 seconds → no confirm; cancel at 10 minutes → confirm.
- [ ] Complete a task whose timer is running → prompt, no orphaned timer.
- [ ] Delete a bucket → tasks land in Inbox.
- [ ] Delete a task with sessions → sessions remain, labeled.
- [ ] Import a corrupt file → clear error, existing data untouched.
- [ ] LocalStorage full → banner explaining export/cleanup, app stays usable.
- [ ] Two tabs open → one owner of the timer, other shows read-only state.
- [ ] Midnight while timer is running → session saved to the start date.
- [ ] Task with no due date → gray, not red.
- [ ] System clock changes backward → clamp remaining to planned duration.
- [ ] Empty states for Today, a bucket, and session log.

---

## 9. Tech setup

```bash
npm install react react-dom zustand date-fns @dnd-kit/core @dnd-kit/sortable
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom \
  tailwindcss @tailwindcss/vite vitest jsdom
```

- Tailwind v4 via the `@tailwindcss/vite` plugin and a single `@import "tailwindcss";` in `index.css`.
- Zustand store plus a debounced `localStorage` adapter in `lib/storage.ts`, with a `schemaVersion`, corruption quarantine, and a `beforeunload` flush.
- `crypto.randomUUID()` for ids.
- No router: “Today” and each bucket are local view state, not URLs. Add `react-router` only if deep links become useful.
- Unit tests use Vitest; the app smoke test runs in jsdom.

### Actual file structure

```
src/
  main.tsx
  App.tsx
  index.css
  types.ts
  vite-env.d.ts
  lib/
    storage.ts          # load/save, versioning, corruption handling
    exportImport.ts
    time.ts             # today, formatting, midnight helpers
    onTrack.ts
    chime.ts            # Web Audio + notifications
    pomodoro.ts         # pure timer math
  store/
    useAppStore.ts
    selectors.ts
  hooks/
    useTimerEngine.ts   # interval, visibility, title
  components/
    layout/AppShell.tsx
    buckets/{BucketBar,BucketEditor}.tsx
    tasks/{TaskPanel,TaskRow,SortableTaskRow,TaskEditor}.tsx
    timer/{TimerPanel,TimerRing,SessionList}.tsx
    ui/{Button,Modal,ToastHost,EmptyState,Icons}.tsx
  test/
    app.test.tsx
    buckets.test.ts
    bucketsUi.test.tsx
    onTrack.test.ts
    pomodoro.test.ts
    selectors.test.ts
```

Keep timer math and on-track logic pure and unit-tested; UI components stay thin.

---

## 10. Build phases & acceptance criteria

### Phase 1 — Core loop · implemented 3 Nov 2026
Task CRUD, Today list, timer (start/pause/resume/cancel), chime, session log, persistence, export/import.

**Done when:**
- A task can be created, edited, completed, and deleted; it survives reload. ✅
- A focus timer can be started, paused, resumed, cancelled, and completed. ✅
- Completion rings and logs exactly one session. ✅ (idempotent finalize by session id)
- Today's session list matches the log. ✅
- Export produces a file that re-imports to an identical state. ✅ (replace flow; auto-backup of the current state is not yet taken)
- Unit tests cover timer math and on-track rules. ✅ 18 tests passing

**Deliberately deferred:** multi-tab timer ownership, storage-full banner, settings UI. Undated tasks are always visible in Today; future-dated unpinned tasks sit in a collapsed “Later” section. Both are reachable from bucket views too.

### Phase 2 — Organization · implemented 3 Nov 2026
Buckets, drag-and-drop, estimates, focus button, attach session, search/filter, done section.

**Done when:**
- Tasks can be dragged within and across buckets, and order persists. ✅
- Deleting a bucket moves its tasks to Inbox. ✅
- Estimates show progress from linked sessions. ✅
- Unlinked sessions can be attached to a task after the fact. ✅
- Bucket tab bar with open counts; create, rename, recolor, and delete from a modal. ✅
- Focus button on each task starts a linked session. ✅

### Phase 3 — Insight & polish
Daily goal, streaks, weekly focus heatmap, stats per bucket, recurring tasks, daily rollover prompt, keyboard shortcuts, PWA/offline, settings screen, accessibility pass.

**Done when:**
- Stats reconcile with the session log.
- App installs as a PWA and works offline.
- Keyboard-only users can complete the core loop.
- Lighthouse accessibility ≥ 95.

### Phase 4 — Optional sync
Accounts and cloud persistence while keeping offline-first behavior.

---

## 11. Decisions log

Resolved:

1. **Name** — **Adwait**, from Sanskrit *advaita* (अद्वैत), “not two.”
2. **“Current date” field** — interpreted as the task's **due date**. Today's date lives in the header.
3. **Due times** — MVP uses end-of-day due dates only; optional times arrive in phase 2.
4. **Working hours** — configurable in phase 2, only used by the estimate-aware at-risk rule.
5. **Cancelled sessions** — focus time is shown separately and excluded from the main “time taken” number.
6. **Session notes** — skipped for v1; the `Session.note` field exists for a later pass.
7. **Break logging** — breaks are recorded but hidden from the focus-only session log for now; add a toggle in phase 3.
8. **Task order** — one global `order` integer per task; within a bucket, tasks sort by it. Moving a task appends it to the destination bucket. Drag-and-drop is enabled only in a bucket view with no active search/filter, so the reordered list always maps to the full bucket.
