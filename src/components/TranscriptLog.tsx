"use client";

import { useEffect, useRef } from "react";
import { TranscriptEntry } from "@/types/call";

interface TranscriptLogProps {
  entries: TranscriptEntry[];
  isEmpty: boolean;
}

function formatClock(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TranscriptLog({ entries, isEmpty }: TranscriptLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="rounded-2xl bg-paperCard border border-line flex flex-col h-full min-h-[420px]">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-lg text-ink900 tracking-tight">
          Journal de l&rsquo;appel
        </h2>
        <span className="font-mono text-[10px] tracking-[0.14em] text-ink400">
          {entries.length.toString().padStart(2, "0")} ENTRÉES
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <p className="text-sm text-ink400 max-w-[26ch]">
              La transcription apparaîtra ici pendant l&rsquo;appel avec Alex.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="flex gap-3 animate-rise">
                <span className="font-mono text-[11px] text-ink400 pt-0.5 shrink-0 w-16">
                  {formatClock(entry.timestamp)}
                </span>
                <div>
                  <span
                    className={`font-mono text-[10px] tracking-[0.1em] font-semibold ${
                      entry.speaker === "assistant"
                        ? "text-beaconDim"
                        : "text-ink600"
                    }`}
                  >
                    {entry.speaker === "assistant" ? "ALEX" : "CLIENT"}
                  </span>
                  <p className="text-sm text-ink900 leading-relaxed mt-0.5">
                    {entry.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
