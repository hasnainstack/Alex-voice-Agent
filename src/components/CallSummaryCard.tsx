"use client";

import { useState } from "react";
import { CallSummary } from "@/types/call";

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

const SERVICE_LABELS: Record<string, string> = {
  economy: "Économique",
  standard: "Standard",
  comfort: "Confort",
  storage: "Garde-meubles",
};

const LEAD_LABELS: Record<string, { label: string; color: string }> = {
  qualified:      { label: "Qualifié ✓",        color: "text-confirmed" },
  needs_followup: { label: "Suivi nécessaire",   color: "text-beacon" },
  not_interested: { label: "Non intéressé",      color: "text-ink400" },
};

const BLANK = "—";

interface RowProps { label: string; value: string | null | undefined; highlight?: boolean }
function Row({ label, value, highlight }: RowProps) {
  const display = value?.trim() || BLANK;
  const isEmpty = display === BLANK;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-line last:border-0">
      <span className="font-mono text-[10px] tracking-[0.14em] text-ink400 shrink-0">{label}</span>
      <span className={`text-sm text-right leading-snug ${isEmpty ? "text-ink400 italic" : highlight ? "font-semibold text-ink900" : "text-ink700"}`}>
        {display}
      </span>
    </div>
  );
}

export function CallSummaryCard({ summary }: { summary: CallSummary }) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const leadMeta = summary.leadStatus ? LEAD_LABELS[summary.leadStatus] : null;
  const serviceLabel = summary.service ? SERVICE_LABELS[summary.service] : null;
  const servicesDisplay = summary.requestedServices.length
    ? summary.requestedServices.join(", ")
    : null;

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

      {/* ── Lead status badge ── */}
      {leadMeta && (
        <div className="px-5 pt-4 pb-0">
          <span className={`font-mono text-[10px] tracking-[0.14em] font-semibold ${leadMeta.color}`}>
            STATUT — {leadMeta.label}
          </span>
        </div>
      )}

      {/* ── Structured data grid ── */}
      <div className="px-5 py-4">
        <Row label="NOM"              value={summary.clientName} highlight />
        <Row label="EMAIL"            value={summary.email} />
        <Row label="TÉLÉPHONE"        value={summary.phone} />
        <Row label="DÉPART"           value={summary.departure} highlight />
        <Row label="ARRIVÉE"          value={summary.arrival} highlight />
        <Row label="DATE SOUHAITÉE"   value={summary.date} />
        <Row label="SERVICE"          value={serviceLabel} />
        <Row label="LOGEMENT"         value={summary.housingType} />
        <Row label="SERVICES DEMANDÉS" value={servicesDisplay} />
      </div>

      {/* ── Transcript toggle ── */}
      <div className="border-t border-line">
        <button
          onClick={() => setTranscriptOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-paper/60 transition-colors"
        >
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink400">
            VOIR LA TRANSCRIPTION COMPLÈTE
          </span>
          <svg
            className={`w-3.5 h-3.5 text-ink400 transition-transform ${transcriptOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {transcriptOpen && summary.transcript.length > 0 && (
          <ul className="px-5 pb-4 space-y-3 max-h-64 overflow-y-auto pr-1 border-t border-line pt-3">
            {summary.transcript.map((entry) => (
              <li key={entry.id} className="flex gap-3">
                <span className="font-mono text-[10px] text-ink400 pt-0.5 shrink-0 w-16 tabular-nums">
                  {formatClock(entry.timestamp)}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`font-mono text-[9px] tracking-[0.12em] font-bold ${entry.speaker === "assistant" ? "text-beacon" : "text-ink600"}`}>
                    {entry.speaker === "assistant" ? "ALEX" : "CLIENT"}
                  </span>
                  <p className="text-sm text-ink900 leading-relaxed mt-0.5">{entry.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Footer note ── */}
      <div className="px-5 py-3 bg-paper border-t border-line">
        <p className="text-[11px] text-ink400 leading-relaxed">
          Un conseiller NEXTCITYS vous contactera sous 48h avec jusqu&apos;à 6 devis comparatifs.
        </p>
      </div>
    </div>
  );
}
