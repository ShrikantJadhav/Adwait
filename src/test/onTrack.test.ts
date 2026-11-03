import { describe, expect, it } from "vitest";
import { getTrackStatus } from "../lib/onTrack";

const TODAY = "2026-11-03";

describe("on-track status", () => {
  it("marks completed tasks as done even when overdue", () => {
    expect(
      getTrackStatus(
        { completedAt: "2026-11-04T10:00:00Z", dueDate: "2026-11-01" },
        TODAY,
      ),
    ).toBe("done");
  });

  it("stays neutral when there is no due date", () => {
    expect(getTrackStatus({}, TODAY)).toBe("no-date");
  });

  it("marks past due dates as overdue", () => {
    expect(getTrackStatus({ dueDate: "2026-11-02" }, TODAY)).toBe("overdue");
  });

  it("marks today as at risk", () => {
    expect(getTrackStatus({ dueDate: TODAY }, TODAY)).toBe("at-risk");
  });

  it("marks future due dates as on track", () => {
    expect(getTrackStatus({ dueDate: "2026-11-04" }, TODAY)).toBe("on-track");
  });
});
