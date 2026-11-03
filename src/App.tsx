import { AppShell } from "./components/layout/AppShell";
import { TaskPanel } from "./components/tasks/TaskPanel";
import { TimerPanel } from "./components/timer/TimerPanel";
import { ToastHost } from "./components/ui/ToastHost";

export default function App() {
  return (
    <>
      <AppShell>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] lg:items-start">
          <TaskPanel />
          <div className="lg:sticky lg:top-24">
            <TimerPanel />
          </div>
        </div>
      </AppShell>
      <ToastHost />
    </>
  );
}
