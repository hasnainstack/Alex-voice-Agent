"use client";

import { CallStatus } from "@/types/call";

interface AudioVisualizerProps {
  status: CallStatus;
  volumeLevel: number;
  isAssistantSpeaking: boolean;
}

const BARS = [
  { animation: "animate-bar1", delay: "0ms" },
  { animation: "animate-bar2", delay: "80ms" },
  { animation: "animate-bar3", delay: "160ms" },
  { animation: "animate-bar4", delay: "40ms" },
  { animation: "animate-bar5", delay: "120ms" },
];

export function AudioVisualizer({ status, volumeLevel, isAssistantSpeaking }: AudioVisualizerProps) {
  const isLive    = status === "active";
  const isActive  = isLive && isAssistantSpeaking;
  const scale     = 1 + Math.min(volumeLevel, 1) * 0.08;

  return (
    <div className="rounded-2xl bg-paperCard border border-line flex flex-col items-center justify-center min-h-[420px]">
      <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>

        {/* Outer pulse rings — only when live */}
        {isLive && (
          <>
            <span
              className="absolute rounded-full border-2 border-blue-400/30 animate-ringPulse"
              style={{ width: 200, height: 200, animationDelay: "0ms" }}
            />
            <span
              className="absolute rounded-full border-2 border-blue-400/20 animate-ringPulse"
              style={{ width: 200, height: 200, animationDelay: "700ms" }}
            />
          </>
        )}

        {/* Main circle button */}
        <div
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: 200,
            height: 200,
            background: "linear-gradient(135deg, #60a5fa 0%, #2563eb 60%, #1d4ed8 100%)",
            boxShadow: "0 8px 40px rgba(37,99,235,0.45), 0 2px 8px rgba(0,0,0,0.18)",
            transform: `scale(${scale})`,
            transition: "transform 120ms ease-out",
          }}
        >
          {/* Audio bars */}
          <div className="flex items-end gap-[5px]" style={{ height: 44 }}>
            {BARS.map((bar, i) => (
              <div
                key={i}
                className={`w-[5px] rounded-full bg-white/90 ${isActive ? bar.animation : ""}`}
                style={{
                  height: isActive ? undefined : isLive ? 10 : 6,
                  minHeight: 6,
                  animationDelay: bar.delay,
                  transition: "height 200ms ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Status label */}
      <p className="mt-6 font-mono text-[11px] tracking-[0.18em] text-ink400">
        {status === "idle"       && "EN ATTENTE"}
        {status === "connecting" && "CONNEXION…"}
        {status === "active"     && (isAssistantSpeaking ? "ALEX PARLE" : "EN ÉCOUTE")}
        {status === "ended"      && "APPEL TERMINÉ"}
        {status === "error"      && "ERREUR"}
      </p>
    </div>
  );
}
