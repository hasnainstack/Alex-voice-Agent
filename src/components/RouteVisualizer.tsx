"use client";

import { CallStatus, RouteInfo } from "@/types/call";

interface RouteVisualizerProps {
  status: CallStatus;
  isAssistantSpeaking: boolean;
  volumeLevel: number;
  routeInfo: RouteInfo;
}

const STATUS_LABEL: Record<CallStatus, string> = {
  idle: "EN ATTENTE",
  connecting: "CONNEXION",
  active: "EN COURS",
  ended: "TERMINÉ",
  error: "ERREUR",
};

const STATUS_COLOR: Record<CallStatus, string> = {
  idle: "text-ink400",
  connecting: "text-beacon",
  active: "text-beacon",
  ended: "text-confirmed",
  error: "text-red-400",
};

/**
 * Renders a departure -> arrival route line, echoing a freight waybill's
 * shipment tracker rather than a generic voice-call orb. The beacon travels
 * the line while a call is active; speech amplitude subtly scales its glow.
 */
export function RouteVisualizer({
  status,
  isAssistantSpeaking,
  volumeLevel,
  routeInfo,
}: RouteVisualizerProps) {
  const isLive = status === "active";
  const glowScale = 1 + Math.min(volumeLevel, 1) * 0.6;

  return (
    <div className="rounded-2xl bg-surface p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <span className="font-mono text-[11px] tracking-[0.18em] text-ink400">
          WAYBILL N° NC-2026-0710
        </span>
        <span
          className={`font-mono text-[11px] tracking-[0.18em] font-semibold ${STATUS_COLOR[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.14em] text-ink400 mb-1">
            DÉPART
          </div>
          <div className="font-display text-2xl sm:text-3xl text-paper tracking-tight">
            {routeInfo.departure ?? <span className="text-ink400 text-xl">—</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] tracking-[0.14em] text-ink400 mb-1">
            ARRIVÉE
          </div>
          <div className="font-display text-2xl sm:text-3xl text-paper tracking-tight">
            {routeInfo.arrival ?? <span className="text-ink400 text-xl">—</span>}
          </div>
        </div>
      </div>

      {/* The route line itself */}
      <div className="relative h-10">
        <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-paper" />
        <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-paper" />
        <div
          className="absolute left-2 right-2 top-1/2 -translate-y-1/2 border-t-2 border-dashed"
          style={{ borderColor: "rgba(237, 239, 242, 0.25)" }}
        />
        {isLive && (
          <div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full bg-beacon animate-travel animate-beaconPulse"
            style={{
              transform: `translateY(-50%) scale(${isAssistantSpeaking ? glowScale : 1})`,
              transition: "transform 120ms ease-out",
            }}
            aria-hidden
          />
        )}
      </div>

      <p className="mt-6 text-sm text-ink400 leading-relaxed">
        {routeInfo.departure || routeInfo.arrival
          ? `Trajet détecté : ${routeInfo.departure ?? "?"} → ${routeInfo.arrival ?? "?"}`
          : "Les villes seront détectées automatiquement pendant la conversation."}
      </p>
    </div>
  );
}
