import { useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { Toast, ToastKind } from "../../types";
import { CheckIcon, XIcon } from "./Icons";

const styles: Record<ToastKind, string> = {
  info: "border-stone-200 bg-white text-stone-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useAppStore((state) => state.dismissToast);

  useEffect(() => {
    const timeout = window.setTimeout(() => dismissToast(toast.id), 5_000);
    return () => window.clearTimeout(timeout);
  }, [toast.id, dismissToast]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg ${styles[toast.kind]}`}
    >
      {toast.kind === "success" ? (
        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
      ) : null}
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 grid h-5 w-5 shrink-0 place-items-center rounded text-current/60 transition-colors hover:bg-black/5"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useAppStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
