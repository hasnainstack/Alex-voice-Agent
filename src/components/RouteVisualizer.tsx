"use client";

import { CallStatus, RouteInfo } from "@/types/call";

interface RouteVisualizerProps {
  status: CallStatus;
  isAssistantSpeaking: boolean;
  volumeLevel: number;
  routeInfo: RouteInfo;
}

const STATUS_LABEL: Record<CallStatus, string> = {
  idle:       "PRÊT",
  connecting: "CONNEXION",
  active:     "EN COURS",
  ended:      "TERMINÉ",
  error:      "ERREUR",
};

const STATUS_COLOR: Record<CallStatus, string> = {
  idle:       "text-ink400",
  connecting: "text-beacon",
  active:     "text-beacon",
  ended:      "text-confirmed",
  error:      "text-red-400",
};

export function RouteVisualizer({ status, isAssistantSpeaking, volumeLevel, routeInfo }: RouteVisualizerProps) {
  const isLive = status === "active";
  const glowScale = 1 + Math.min(volumeLevel, 1) * 0.6;

  const hasDep = Boolean(routeInfo.departure);
  const hasArr = Boolean(routeInfo.arrival);
  const hasBoth = hasDep && hasArr;

  // Track fill: 0% idle, 50% one city, 100% both
  const trackFill = hasBoth ? "100%" : hasDep || hasArr ? "50%" : "0%";

  return (
    <div className="rounded-2xl bg-surface p-6 sm:p-7">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.16em] text-ink400">
            WAYBILL N° NC-2026-0710
          </span>
          <span className="font-mono text-[9px] tracking-[0.12em] text-ink/60 bg-ink400/20 px-1.5 py-0.5 rounded">
            DÉMO
          </span>
        </div>
        <span className={`font-mono text-[10px] tracking-[0.16em] font-semibold ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Cities */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="font-mono text-[9px] tracking-[0.14em] text-ink400 mb-1">DÉPART</div>
          <div className="font-display text-2xl text-paper tracking-tight min-h-[2rem]">
            {routeInfo.departure ?? (
              <span className={`text-lg italic font-body font-normal ${isLive ? "text-beacon/40 animate-pulse" : "text-ink400/50"}`}>
                —
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] tracking-[0.14em] text-ink400 mb-1">ARRIVÉE</div>
          <div className="font-display text-2xl text-paper tracking-tight min-h-[2rem]">
            {routeInfo.arrival ?? (
              <span className={`text-lg italic font-body font-normal ${isLive ? "text-beacon/40 animate-pulse" : "text-ink400/50"}`}>
                —
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress track */}
      <div className="relative h-8 flex items-center mb-4">
        {/* End dots */}
        <div className={`absolute left-0 h-2.5 w-2.5 rounded-full z-10 transition-colors duration-500 ${hasDep ? "bg-beacon" : "bg-paper/20"}`} />
        <div className={`absolute right-0 h-2.5 w-2.5 rounded-full z-10 transition-colors duration-500 ${hasArr ? "bg-confirmed" : "bg-paper/20"}`} />

        {/* Track background */}
        <div className="absolute left-3 right-3 h-px bg-paper/10" />

        {/* Track fill */}
        <div
          className="absolute left-3 h-px bg-gradient-to-r from-beacon to-confirmed transition-all duration-700 ease-out"
          style={{ width: `calc((100% - 1.5rem) * ${hasBoth ? 1 : hasDep || hasArr ? 0.5 : 0})` }}
        />

        {/* Traveling beacon — only when live */}
        {isLive && (
          <div
            className="absolute h-3.5 w-3.5 rounded-full bg-beacon animate-travel animate-beaconPulse z-20"
            style={{
              transform: `translateX(-50%) scale(${isAssistantSpeaking ? glowScale : 1})`,
              transition: "transform 120ms ease-out",
              left: "3px",
            }}
            aria-hidden
          />
        )}
      </div>

      {/* Status text */}
      <p className="text-xs leading-relaxed">
        {hasBoth ? (
          <span className="text-confirmed font-semibold">
            {routeInfo.departure} → {routeInfo.arrival}
          </span>
        ) : hasDep || hasArr ? (
          <span className="text-beacon text-[11px]">
            {hasDep ? `Départ : ${routeInfo.departure}` : `Arrivée : ${routeInfo.arrival}`}
            {" — en attente de l'autre ville…"}
          </span>
        ) : (
          <span className="text-ink400/60 text-[11px] italic">
            {isLive
              ? "Mentionnez vos villes de départ et d'arrivée…"
              : "Les villes apparaîtront ici pendant l'appel."}
          </span>
        )}
      </p>
    </div>
  );
}
