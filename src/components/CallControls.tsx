"use client";

import { CallStatus } from "@/types/call";

interface CallControlsProps {
  status: CallStatus;
  durationSeconds: number;
  onStart: () => void;
  onEnd: () => void;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function CallControls({
  status,
  durationSeconds,
  onStart,
  onEnd,
}: CallControlsProps) {
  const isActive = status === "active" || status === "connecting";

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-paperCard border border-line p-4 sm:p-5">
      {!isActive ? (
        <button
          onClick={onStart}
          className="flex-1 rounded-xl bg-ink px-5 py-3.5 font-body text-sm font-semibold text-paper transition hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Démarrer l&rsquo;appel de démonstration
        </button>
      ) : (
        <button
          onClick={onEnd}
          className="flex-1 rounded-xl bg-red-50 px-5 py-3.5 font-body text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          Terminer l&rsquo;appel
        </button>
      )}

      <div className="font-mono text-sm text-ink600 tabular-nums w-14 text-right">
        {status === "active" || status === "ended"
          ? formatDuration(durationSeconds)
          : "00:00"}
      </div>
    </div>
  );
}
