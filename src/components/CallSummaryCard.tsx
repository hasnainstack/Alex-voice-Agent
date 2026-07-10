"use client";

import { CallSummary } from "@/types/call";

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function CallSummaryCard({ summary }: { summary: CallSummary }) {
  const hasRoute = summary.departure || summary.arrival;

  return (
    <div className="rounded-2xl border border-confirmed/30 bg-white shadow-sm overflow-hidden animate-rise">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 bg-confirmed/5 border-b border-confirmed/20">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-confirmed" />
          <span className="font-mono text-[11px] tracking-[0.18em] text-confirmed font-semibold">
            RÉSUMÉ DE L&apos;APPEL
          </span>
        </div>
        <span className="font-mono text-[11px] text-ink400 tabular-nums">
          {formatDuration(summary.duration)}
        </span>
      </div>

      {/* ── Route confirmed ── */}
      <div className="px-5 py-4 border-b border-line">
        <p className="font-mono text-[10px] tracking-[0.14em] text-ink400 mb-3">TRAJET DÉTECTÉ</p>
        {hasRoute ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl bg-paper px-3 py-2.5 text-center">
              <p className="font-mono text-[9px] tracking-wider text-ink400 mb-1">DÉPART</p>
              {summary.departure ? (
                <p className="font-display text-lg text-ink900 leading-tight">{summary.departure}</p>
              ) : (
                <p className="text-sm text-ink400 italic">Non précisé</p>
              )}
            </div>
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <svg className="w-5 h-5 text-beacon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="font-mono text-[8px] text-beacon tracking-wider">CONFIRMÉ</span>
            </div>
            <div className="flex-1 rounded-xl bg-paper px-3 py-2.5 text-center">
              <p className="font-mono text-[9px] tracking-wider text-ink400 mb-1">ARRIVÉE</p>
              {summary.arrival ? (
                <p className="font-display text-lg text-ink900 leading-tight">{summary.arrival}</p>
              ) : (
                <p className="text-sm text-ink400 italic">Non précisé</p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-paper px-4 py-3 text-center">
            <p className="text-sm text-ink400 italic">
              Les villes n&apos;ont pas été mentionnées explicitement pendant l&apos;appel.
            </p>
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
        <div className="px-5 py-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-ink400 mb-0.5">DURÉE</p>
          <p className="font-mono text-base font-semibold text-ink900 tabular-nums">
            {formatDuration(summary.duration)}
          </p>
        </div>
        <div className="px-5 py-3 text-center">
          <p className="font-mono text-[9px] tracking-wider text-ink400 mb-0.5">ÉCHANGES</p>
          <p className="font-mono text-base font-semibold text-ink900 tabular-nums">
            {summary.transcript.length.toString().padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* ── Transcript replay ── */}
      {summary.transcript.length > 0 && (
        <div className="px-5 py-4">
          <p className="font-mono text-[10px] tracking-[0.14em] text-ink400 mb-3">
            TRANSCRIPTION COMPLÈTE
          </p>
          <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {summary.transcript.map((entry) => (
              <li key={entry.id} className="flex gap-3">
                <span className="font-mono text-[10px] text-ink400 pt-0.5 shrink-0 w-16 tabular-nums">
                  {formatClock(entry.timestamp)}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-mono text-[9px] tracking-[0.12em] font-bold ${
                      entry.speaker === "assistant" ? "text-beacon" : "text-ink600"
                    }`}
                  >
                    {entry.speaker === "assistant" ? "ALEX" : "CLIENT"}
                  </span>
                  <p className="text-sm text-ink900 leading-relaxed mt-0.5">{entry.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Footer note ── */}
      <div className="px-5 py-3 bg-paper border-t border-line">
        <p className="text-[11px] text-ink400 leading-relaxed">
          Un conseiller NEXTCITYS vous contactera sous 48h avec jusqu&apos;à 6 devis comparatifs.
        </p>
      </div>
    </div>
  );
}
