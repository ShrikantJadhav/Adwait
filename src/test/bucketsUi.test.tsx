// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../App";
import {
  createInitialState,
  useAppStore,
} from "../store/useAppStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

function seed() {
  const now = new Date().toISOString();
  useAppStore.setState({
    ...createInitialState(),
    buckets: [
      { id: "inbox", name: "Inbox", color: "#78716c", order: 0, isInbox: true },
      { id: "work", name: "Work", color: "#3b82f6", order: 1 },
      { id: "personal", name: "Personal", color: "#10b981", order: 2 },
    ],
    tasks: [
      {
        id: "work-task",
        title: "Ship the bucket view",
        description: "",
        bucketId: "work",
        createdAt: now,
        dueDate: now.slice(0, 10),
        pinnedToday: true,
        order: 1,
      },
      {
        id: "personal-task",
        title: "Book the dentist",
        description: "",
        bucketId: "personal",
        createdAt: now,
        dueDate: now.slice(0, 10),
        pinnedToday: true,
        order: 2,
      },
    ],
    toasts: [],
    suggestion: undefined,
  });
}

function clickByText(text: string) {
  const button = Array.from(document.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.includes(text),
  );
  if (!button) throw new Error(`No button containing “${text}”`);
  button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = "";
  seed();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

describe("bucket UI", () => {
  it("shows bucket tabs and switches to a bucket view", async () => {
    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain("Work");
    expect(container.textContent).toContain("Personal");

    await act(async () => {
      clickByText("Work");
    });

    expect(container.textContent).toContain("Ship the bucket view");
    expect(container.textContent).toContain("1 open · 0m focused");

    await act(async () => {
      clickByText("Today");
    });

    expect(container.textContent).toContain("Ship the bucket view");
    expect(container.textContent).toContain("Book the dentist");

    await act(async () => {
      root.unmount();
    });
  });
});
