import type { AppState } from "../types";
import { isAppState, SCHEMA_VERSION } from "./storage";
import { todayKey } from "./time";

interface BackupFile {
  schemaVersion: number;
  exportedAt: string;
  data: AppState;
}

export type ParseResult =
  | { ok: true; state: AppState }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildBackup(state: AppState): BackupFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      schemaVersion: 1,
      buckets: state.buckets,
      tasks: state.tasks,
      sessions: state.sessions,
      settings: state.settings,
      activeTimer: state.activeTimer,
    },
  };
}

export function downloadBackup(state: AppState): void {
  const blob = new Blob([JSON.stringify(buildBackup(state), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `adwait-backup-${todayKey()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** Accepts either an exported backup file or a raw AppState object. */
export function parseBackup(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: "That file does not look like an Adwait backup." };
  }

  const candidate = "data" in parsed ? parsed.data : parsed;
  if (!isAppState(candidate)) {
    return {
      ok: false,
      error: "That backup is missing fields or uses an unsupported version.",
    };
  }

  return { ok: true, state: candidate };
}
