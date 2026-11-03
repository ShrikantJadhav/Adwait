import type { TimerKind } from "../../types";
import { formatClock } from "../../lib/time";

interface TimerRingProps {
  remainingMs: number;
  totalMs: number;
  kind: TimerKind;
  paused: boolean;
  running: boolean;
}

const radius = 88;
const circumference = 2 * Math.PI * radius;

export function TimerRing({
  remainingMs,
  totalMs,
  kind,
  paused,
  running,
}: TimerRingProps) {
  const fraction = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const dash = circumference * fraction;
  const accent = kind === "focus" ? "text-amber-500" : "text-emerald-500";
  const modeLabel =
    kind === "focus"
      ? "Focus"
      : kind === "shortBreak"
        ? "Short break"
        : "Long break";
  const stateLabel = paused
    ? "Paused"
    : running
      ? kind === "focus"
        ? "Focusing"
        : "On a break"
      : "Ready when you are";

  return (
    <div className="relative mx-auto h-52 w-52">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          className="text-stone-200"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className={`${accent} transition-[stroke-dasharray] duration-300 ease-linear`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
          {modeLabel}
        </span>
        <span className="tabular mt-1 text-5xl font-semibold tracking-tight text-stone-900">
          {formatClock(remainingMs)}
        </span>
        <span
          className={`mt-1 text-[11px] ${
            paused ? "font-medium text-amber-600" : "text-stone-500"
          }`}
        >
          {stateLabel}
        </span>
      </div>
    </div>
  );
}
