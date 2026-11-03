import type { AppState } from "../types";

export const SCHEMA_VERSION = 1 as const;
const KEY = "adwait:v1";
const CORRUPT_PREFIX = "adwait:corrupt:";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Shallow structural check — enough to prevent a bad file from crashing the app. */
export function isAppState(value: unknown): value is AppState {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== SCHEMA_VERSION) return false;
  if (
    !Array.isArray(value.buckets) ||
    !Array.isArray(value.tasks) ||
    !Array.isArray(value.sessions)
  ) {
    return false;
  }
  if (!isRecord(value.settings)) return false;
  if (
    value.activeTimer !== undefined &&
    value.activeTimer !== null &&
    !isRecord(value.activeTimer)
  ) {
    return false;
  }
  return true;
}

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAppState(parsed)) throw new Error("Saved data failed validation");
    return parsed;
  } catch (error) {
    console.error("[adwait] Could not load saved data", error);
    if (raw) {
      try {
        window.localStorage.setItem(
          `${CORRUPT_PREFIX}${Date.now()}`,
          raw,
        );
      } catch {
        // If we cannot even preserve the corrupt payload, there is nothing left to do.
      }
    }
    return null;
  }
}

export function saveState(state: AppState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("[adwait] Could not save data", error);
    return false;
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | undefined;
let pendingState: AppState | null = null;

/** Coalesce rapid store updates into one localStorage write. */
export function scheduleSave(state: AppState): void {
  pendingState = state;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(flushSave, 200);
}

export function flushSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = undefined;
  }
  if (pendingState) {
    saveState(pendingState);
    pendingState = null;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushSave);
}
