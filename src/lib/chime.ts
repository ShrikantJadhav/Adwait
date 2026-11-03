let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (
        window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

/** Call from a user gesture (Start button) so the browser lets us play later. */
export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
}

/** A short three-note chime, generated — no audio asset to ship. */
export function playChime(volume = 0.7): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const start = ctx.currentTime;
  const notes = [659.25, 783.99, 987.77]; // E5, G5, B5
  const level = Math.max(0, Math.min(1, volume)) * 0.22;

  notes.forEach((frequency, index) => {
    const noteStart = start + index * 0.18;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(level, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.7);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.75);
  });
}

export async function requestNotificationPermission(): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "default") return;
  try {
    await Notification.requestPermission();
  } catch {
    // Permission prompts can fail silently; the in-app toast still covers it.
  }
}

export function notify(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch {
    // Some browsers require a service worker; the toast is the fallback.
  }
}
