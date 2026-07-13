"use client";

import { CallStatus } from "@/types/call";

interface AudioVisualizerProps {
  status: CallStatus;
  volumeLevel: number;
  isAssistantSpeaking: boolean;
}

const BARS = [
  { animation: "animate-bar1", delay: "0ms",   idleH: 5  },
  { animation: "animate-bar2", delay: "80ms",  idleH: 11 },
  { animation: "animate-bar3", delay: "160ms", idleH: 18 },
  { animation: "animate-bar4", delay: "40ms",  idleH: 9  },
  { animation: "animate-bar5", delay: "120ms", idleH: 14 },
  { animation: "animate-bar1", delay: "200ms", idleH: 7  },
  { animation: "animate-bar3", delay: "60ms",  idleH: 16 },
];

const STATUS_META: Record<CallStatus, { dot: string; label: string; sub: string }> = {
  idle:       { dot: "bg-ink400",   label: "PRÊT",        sub: "En attente de connexion…"              },
  connecting: { dot: "bg-beacon animate-pulse", label: "CONNEXION", sub: "Établissement de la liaison…" },
  active:     { dot: "bg-beacon animate-pulse", label: "EN COURS",  sub: ""                             },
  ended:      { dot: "bg-confirmed",label: "TERMINÉ",     sub: "Appel terminé avec succès"              },
  error:      { dot: "bg-red-400",  label: "ERREUR",      sub: "Erreur de connexion"                    },
};

export function AudioVisualizer({ status, volumeLevel, isAssistantSpeaking }: AudioVisualizerProps) {
  const isLive   = status === "active";
  const isActive = isLive && isAssistantSpeaking;
  const scale    = 1 + Math.min(volumeLevel, 1) * 0.06;
  const meta     = STATUS_META[status];

  const barColor = isActive ? "bg-beacon" : isLive ? "bg-paper/50" : "bg-paper/20";

  return (
    <div className="rounded-2xl bg-surface flex flex-col items-center justify-between min-h-[420px] relative overflow-hidden py-7 px-6">

      {/* Radial fade over grid — darkens toward edges, clears center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(237,239,242,0.03) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(237,239,242,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 30%, black 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 30%, black 100%)",
        }}
      />

      {/* ── Top bar ── */}
      <div className="relative w-full flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.18em] text-ink400">
          ALEX · NEXTCITYS
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          <span className={`font-mono text-[10px] tracking-[0.18em] font-semibold ${
            status === "active"    ? "text-beacon"    :
            status === "ended"     ? "text-confirmed" :
            status === "error"     ? "text-red-400"   :
            status === "connecting"? "text-beacon"    :
            "text-ink400"
          }`}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* ── Orb ── */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>

        {/* Pulse rings — always visible when live, idle rings are static */}
        <span
          className={`absolute rounded-full border border-beacon/25 ${isLive ? "animate-ringPulse" : "opacity-20"}`}
          style={{ width: 196, height: 196, animationDelay: "0ms" }}
        />
        <span
          className={`absolute rounded-full border border-beacon/15 ${isLive ? "animate-ringPulse" : "opacity-10"}`}
          style={{ width: 196, height: 196, animationDelay: "900ms" }}
        />

        {/* Main orb */}
        <div
          className="relative rounded-full flex flex-col items-center justify-center gap-2"
          style={{
            width: 172,
            height: 172,
            background: isLive
              ? "radial-gradient(circle at 38% 32%, #263344 0%, #1B2430 55%, #131B26 100%)"
              : "radial-gradient(circle at 38% 32%, #222D3C 0%, #1B2430 100%)",
            boxShadow: isLive
              ? "0 0 0 1px rgba(255,255,255,0.07), 0 0 48px rgba(232,163,61,0.18), 0 4px 24px rgba(0,0,0,0.5)"
              : "0 0 0 1px rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)",
            transform: `scale(${scale})`,
            transition: "transform 120ms ease-out, box-shadow 400ms ease",
          }}
        >
          {/* Mic icon — idle / ended */}
          {!isLive && (
            <svg className="w-9 h-9 text-ink400" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          )}

          {/* Audio bars — live */}
          {isLive && (
            <div className="flex items-end gap-[4px]" style={{ height: 46 }}>
              {BARS.map((bar, i) => (
                <div
                  key={i}
                  className={`w-[4px] rounded-full ${barColor} ${isActive ? bar.animation : ""}`}
                  style={{
                    height: isActive ? undefined : bar.idleH,
                    minHeight: 4,
                    animationDelay: bar.delay,
                    transition: "height 250ms ease, background-color 400ms ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Inner micro-label */}
          {isLive && (
            <span className={`font-mono text-[9px] tracking-[0.22em] transition-colors duration-300 ${
              isActive ? "text-beacon" : "text-paper/30"
            }`}>
              {isActive ? "PARLE" : "ÉCOUTE"}
            </span>
          )}
        </div>
      </div>

      {/* ── Bottom status ── */}
      <div className="relative w-full flex flex-col items-center gap-2">
        {/* Sub-label */}
        <p className="font-mono text-[10px] tracking-[0.16em] text-ink400 text-center">
          {status === "active"
            ? (isAssistantSpeaking ? "ALEX S'EXPRIME — VEUILLEZ ÉCOUTER" : "EN ATTENTE DE VOTRE RÉPONSE")
            : meta.sub.toUpperCase()}
        </p>

        {/* Connecting progress dots */}
        {status === "connecting" && (
          <div className="flex gap-1.5 mt-1">
            {[0, 150, 300].map((d) => (
              <div
                key={d}
                className="h-1 w-1 rounded-full bg-beacon animate-pulse"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
