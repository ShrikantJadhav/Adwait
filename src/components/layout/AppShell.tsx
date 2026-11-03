import { useRef, type ReactNode } from "react";
import { useAppStore } from "../../store/useAppStore";
import { downloadBackup, parseBackup } from "../../lib/exportImport";
import { Button } from "../ui/Button";
import { DownloadIcon, UploadIcon } from "../ui/Icons";

function BackupControls() {
  const importState = useAppStore((state) => state.importState);
  const pushToast = useAppStore((state) => state.pushToast);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadBackup(useAppStore.getState());
    pushToast("Backup downloaded.", "success");
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const result = parseBackup(text);
    if (!result.ok) {
      pushToast(result.error, "error");
      return;
    }

    const taskCount = result.state.tasks.length;
    const sessionCount = result.state.sessions.length;
    const confirmed = window.confirm(
      `Replace everything with this backup?\n\n${taskCount} tasks · ${sessionCount} sessions\n\nYour current data will be replaced.`,
    );
    if (!confirmed) return;

    importState(result.state);
    pushToast("Backup restored.", "success");
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleImport(file);
        }}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => fileInput.current?.click()}
        title="Import a JSON backup"
      >
        <UploadIcon />
        <span className="hidden sm:inline">Import</span>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleExport}
        title="Download a JSON backup"
      >
        <DownloadIcon />
        <span className="hidden sm:inline">Export</span>
      </Button>
    </div>
  );
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-100/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-xl bg-stone-900 text-lg font-medium text-amber-300 shadow-sm"
            >
              अ
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight tracking-tight text-stone-900">
                Adwait
              </h1>
              <p className="text-[11px] leading-tight text-stone-500">
                Your day, undivided.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-stone-500 md:block">
              Local to this browser
            </span>
            <BackupControls />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-[11px] text-stone-400 sm:px-6 lg:px-8">
        No account, no server. Your data lives in this browser — export a
        backup now and then.
      </footer>
    </div>
  );
}
