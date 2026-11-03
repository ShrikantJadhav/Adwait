// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../App";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = "";
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

describe("app smoke test", () => {
  it("renders the task pane and the timer pane together", async () => {
    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain("Adwait");
    expect(container.textContent).toContain("Your day, undivided.");
    expect(container.textContent).toContain("New task");
    expect(container.textContent).toContain("Focus timer");
    expect(container.textContent).toContain("Today’s sessions");
    expect(container.textContent).toContain("Your day is clear");

    await act(async () => {
      root.unmount();
    });
  });
});
