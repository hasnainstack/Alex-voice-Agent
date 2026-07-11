"use client";

import { CallStatus } from "@/types/call";
import { MicStatus } from "@/hooks/useVapiCall";

interface CallControlsProps {
  status: CallStatus;
  micStatus: MicStatus;
  durationSeconds: number;
  onStart: () => void;
  onEnd: () => void;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CallControls({
  status, micStatus, durationSeconds, onStart, onEnd,
}: CallControlsProps) {
  const isActive = status === "active" || status === "connecting";
  const denied   = micStatus === "denied" || micStatus === "unavailable";

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-paperCard border border-line p-4 sm:p-5">
      <div className="flex items-center gap-4">
        {!isActive ? (
          <button
            onClick={onStart}
            disabled={denied}
            className="flex-1 rounded-xl bg-ink px-5 py-3.5 font-body text-sm font-semibold text-paper transition hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
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

      {denied && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-red-700 leading-relaxed">
            Microphone refusé. Cliquez sur l&rsquo;icône 🔒 dans la barre d&rsquo;adresse Chrome, autorisez le microphone, puis rechargez la page.
          </p>
        </div>
      )}
    </div>
  );
}
