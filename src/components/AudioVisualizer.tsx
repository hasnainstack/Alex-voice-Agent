"use client";

import { CallStatus } from "@/types/call";

interface AudioVisualizerProps {
  status: CallStatus;
  volumeLevel: number;
  isAssistantSpeaking: boolean;
}

const BARS = [
  { animation: "animate-bar1", delay: "0ms",   idleH: 6  },
  { animation: "animate-bar2", delay: "80ms",  idleH: 12 },
  { animation: "animate-bar3", delay: "160ms", idleH: 18 },
  { animation: "animate-bar4", delay: "40ms",  idleH: 10 },
  { animation: "animate-bar5", delay: "120ms", idleH: 14 },
  { animation: "animate-bar1", delay: "200ms", idleH: 8  },
  { animation: "animate-bar3", delay: "60ms",  idleH: 16 },
];

const STATUS_LABEL: Record<CallStatus, string> = {
  idle:       "EN ATTENTE",
  connecting: "CONNEXION…",
  active:     "EN COURS",
  ended:      "TERMINÉ",
  error:      "ERREUR",
};

export function AudioVisualizer({ status, volumeLevel, isAssistantSpeaking }: AudioVisualizerProps) {
  const isLive   = status === "active";
  const isActive = isLive && isAssistantSpeaking;
  const scale    = 1 + Math.min(volumeLevel, 1) * 0.06;

  const ringColor   = isLive ? "border-beacon/40"     : "border-lineDark";
  const ring2Color  = isLive ? "border-beacon/20"     : "border-lineDark";
  const glowColor   = isLive ? "rgba(232,163,61,0.25)" : "rgba(0,0,0,0)";
  const barColor    = isActive ? "bg-beacon" : isLive ? "bg-paper/60" : "bg-paper/20";

  return (
    <div className="rounded-2xl bg-surface flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">

      {/* Subtle grid texture — matches dispatch-board feel */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(237,239,242,1) 1px, transparent 1px), linear-gradient(90deg, rgba(237,239,242,1) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top-left waybill label */}
      <div className="absolute top-5 left-6">
        <span className="font-mono text-[10px] tracking-[0.18em] text-ink400">
          ALEX · NEXTCITYS
        </span>
      </div>

      {/* Top-right status pill */}
      <div className="absolute top-5 right-6">
        <span className={`font-mono text-[10px] tracking-[0.18em] font-semibold ${
          status === "active"  ? "text-beacon" :
          status === "ended"   ? "text-confirmed" :
          status === "error"   ? "text-red-400" :
          "text-ink400"
        }`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Orb container */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>

        {/* Pulse rings */}
        {isLive && (
          <>
            <span
              className={`absolute rounded-full border ${ringColor} animate-ringPulse`}
              style={{ width: 190, height: 190, animationDelay: "0ms" }}
            />
            <span
              className={`absolute rounded-full border ${ring2Color} animate-ringPulse`}
              style={{ width: 190, height: 190, animationDelay: "800ms" }}
            />
          </>
        )}

        {/* Static ring when idle */}
        {!isLive && (
          <span
            className="absolute rounded-full border border-lineDark"
            style={{ width: 190, height: 190 }}
          />
        )}

        {/* Main orb */}
        <div
          className="relative rounded-full flex flex-col items-center justify-center gap-3"
          style={{
            width: 170,
            height: 170,
            background: isLive
              ? "radial-gradient(circle at 40% 35%, #2A3A4E 0%, #1B2430 60%, #141C28 100%)"
              : "radial-gradient(circle at 40% 35%, #232E3D 0%, #1B2430 100%)",
            boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 8px 48px ${glowColor}, 0 2px 12px rgba(0,0,0,0.4)`,
            transform: `scale(${scale})`,
            transition: "transform 120ms ease-out, box-shadow 300ms ease",
          }}
        >
          {/* Mic icon — shown when idle/ended */}
          {!isLive && (
            <svg
              className="w-10 h-10 text-ink400"
              fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          )}

          {/* Audio bars — shown when live */}
          {isLive && (
            <div className="flex items-end gap-[4px]" style={{ height: 48 }}>
              {BARS.map((bar, i) => (
                <div
                  key={i}
                  className={`w-[4px] rounded-full ${barColor} ${isActive ? bar.animation : ""}`}
                  style={{
                    height: isActive ? undefined : bar.idleH,
                    minHeight: 4,
                    animationDelay: bar.delay,
                    transition: "height 250ms ease, background-color 300ms ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Inner label */}
          <span className={`font-mono text-[9px] tracking-[0.2em] ${
            isActive ? "text-beacon" : isLive ? "text-paper/40" : "text-ink400"
          }`}>
            {isActive ? "PARLE" : isLive ? "ÉCOUTE" : ""}
          </span>
        </div>
      </div>

      {/* Bottom status line */}
      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full ${
          status === "active"  ? "bg-beacon animate-pulse" :
          status === "ended"   ? "bg-confirmed" :
          status === "error"   ? "bg-red-400" :
          "bg-ink400"
        }`} />
        <span className="font-mono text-[10px] tracking-[0.16em] text-ink400">
          {status === "active" && isAssistantSpeaking && "ALEX S'EXPRIME"}
          {status === "active" && !isAssistantSpeaking && "EN ATTENTE DE VOTRE RÉPONSE"}
          {status === "connecting" && "ÉTABLISSEMENT DE LA CONNEXION…"}
          {status === "idle" && "CLIQUEZ SUR DÉMARRER POUR LANCER L'APPEL"}
          {status === "ended" && "APPEL TERMINÉ"}
          {status === "error" && "ERREUR DE CONNEXION"}
        </span>
      </div>
    </div>
  );
}
