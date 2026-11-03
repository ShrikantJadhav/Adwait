import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-6 py-10 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg shadow-sm ring-1 ring-stone-200">
        🍅
      </div>
      <p className="mt-3 text-sm font-medium text-stone-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-500">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
