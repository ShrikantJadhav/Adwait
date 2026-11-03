import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { isExpired, remainingMs } from "../lib/pomodoro";
import { formatClock } from "../lib/time";
import { notify, playChime } from "../lib/chime";

/**
 * Owns the 250ms heartbeat. Timestamps do the real work, so background tabs,
 * sleep, and refreshes all resolve to the correct remaining time.
 */
export function useTimerEngine(): number {
  const activeTimer = useAppStore((state) => state.activeTimer);
  const activeId = activeTimer?.id;
  const activeState = activeTimer?.state;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeId) return;

    const tick = () => {
      const current = Date.now();
      const timer = useAppStore.getState().activeTimer;
      if (!timer) return;

      setNow(current);

      if (isExpired(timer, current)) {
        const settings = useAppStore.getState().settings;
        useAppStore.getState().completeTimer();
        if (settings.soundEnabled) playChime(settings.volume);
        notify(
          "Time’s up",
          timer.kind === "focus"
            ? "Focus session complete. Take a break."
            : "Break over. Ready to focus?",
        );
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    const onVisibilityChange = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [activeId, activeState]);

  useEffect(() => {
    if (!activeTimer) {
      document.title = "Adwait";
      return;
    }
    const label = activeTimer.kind === "focus" ? "Focus" : "Break";
    const paused = activeTimer.state === "paused" ? "Paused · " : "";
    document.title = `${paused}${formatClock(remainingMs(activeTimer, now))} · ${label} · Adwait`;
  }, [activeTimer, now]);

  return now;
}
