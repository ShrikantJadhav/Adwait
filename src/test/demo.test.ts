import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBackup } from "../lib/exportImport";

const demoPath = join(process.cwd(), "demo", "adwait-demo.json");

describe("demo backup", () => {
  it("is a valid Adwait backup that can be imported", () => {
    const text = readFileSync(demoPath, "utf8");
    const result = parseBackup(text);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.buckets.length).toBeGreaterThan(1);
    expect(result.state.tasks.length).toBeGreaterThan(10);
    expect(result.state.tasks.some((task) => task.completedAt)).toBe(true);
    expect(result.state.sessions.length).toBeGreaterThan(0);
    expect(
      result.state.tasks.every((task) =>
        result.state.buckets.some((bucket) => bucket.id === task.bucketId),
      ),
    ).toBe(true);
  });
});
