"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  preloadVapi,
  prewarmAll,
  getVapiClient,
  getAssistantId,
  T,
  logTimings,
} from "@/lib/vapi-client";
import {
  CallStatus,
  RouteInfo,
  CallSummary,
  TranscriptEntry,
  isVapiTranscriptMessage,
} from "@/types/call";

// ---------------------------------------------------------------------------
// Route extraction
// ---------------------------------------------------------------------------

const CITY_RE  = "([a-z\u00e0-\u00ff]{3,}(?:-[a-z\u00e0-\u00ff]{2,})*)";
const CITY2_RE = "([a-z\u00e0-\u00ff]{2,}(?:\\s[a-z\u00e0-\u00ff]{2,})?(?:-[a-z\u00e0-\u00ff]{2,})*)";

const DEPARTURE_PATTERNS: RegExp[] = [
  new RegExp(`partir?\\s+(?:de|depuis)\\s+${CITY2_RE}`, "i"),
  new RegExp(`d[ée]part\\s+(?:est|c'est|sera|de|depuis)\\s+${CITY2_RE}`, "i"),
  new RegExp(`d[ée]m[eé]nage(?:r|ons|z)?\\s+(?:de|depuis)\\s+${CITY2_RE}`, "i"),
  new RegExp(`(?:j'?habite|je\\s+vis)\\s+(?:à\\s+|a\\s+)?${CITY2_RE}`, "i"),
  new RegExp(`adresse\\s+(?:actuelle\\s+)?(?:est\\s+)?(?:à\\s+|a\\s+)?${CITY2_RE}`, "i"),
  new RegExp(`depuis\\s+${CITY2_RE}(?=\\s+(?:pour|vers|jusqu|et|je|on)|$)`, "i"),
  new RegExp(`quitter?\\s+${CITY2_RE}`, "i"),
  new RegExp(`ville\\s+de\\s+d[ée]part\\s*(?:est|:)?\\s*${CITY2_RE}`, "i"),
];

const ARRIVAL_PATTERNS: RegExp[] = [
  new RegExp(`(?:je\\s+vais|on\\s+va|je\\s+veux\\s+aller|je\\s+souhaite\\s+aller|je\\s+compte\\s+aller)\\s+(?:à\\s+|a\\s+|en\\s+)?${CITY2_RE}`, "i"),
  new RegExp(`arriv[ée]e?\\s+(?:est|c'est|sera|à|a)\\s+${CITY2_RE}`, "i"),
  new RegExp(`destination\\s*(?:est|c'est|:)?\\s*${CITY2_RE}`, "i"),
  new RegExp(`pour\\s+aller\\s+(?:à\\s+|a\\s+|en\\s+)${CITY2_RE}`, "i"),
  new RegExp(`pour\\s+(?!(?:aller|faire|voir|trouver|travailler|vivre|habiter|rejoindre|rentrer|rester|chercher|prendre)\\s)${CITY_RE}`, "i"),
  new RegExp(`(?:m'?installer|s'?installer|emm[eé]nager)\\s+(?:à\\s+|a\\s+|en\\s+)?${CITY2_RE}`, "i"),
  new RegExp(`arriv(?:er?|ez|ons|e)\\s+(?:à\\s+|a\\s+|en\\s+)${CITY2_RE}`, "i"),
  new RegExp(`vers\\s+${CITY_RE}`, "i"),
  new RegExp(`ville\\s+d'arriv[ée]e\\s*(?:est|:)?\\s*${CITY2_RE}`, "i"),
];

const STOP_WORDS = new Set([
  "une","des","les","mes","ses","nos","vos","leur","leurs","mon","ton","son","notre","votre","cet","cette","ces",
  "que","qui","quoi","dont","où","ou","et","mais","donc","car","par","sur","sous","dans","avec","sans","entre","vers","pour","depuis","jusqu",
  "aller","faire","voir","trouver","travailler","vivre","habiter","rejoindre","rentrer","partir","rester","chercher","prendre",
  "ville","maison","appartement","logement","travail","bureau","france","europe","pays","region","région",
  "demain","aujourd","semaine","mois","prochain","prochaine","lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche",
]);

function titleCase(str: string): string {
  return str.split(/[\s\-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(str.includes("-") ? "-" : " ");
}

function extractCity(text: string, patterns: RegExp[]): string | null {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match?.[1]) {
      const city = match[1].trim();
      const firstWord = city.split(/[\s-]/)[0] ?? "";
      if (city.length >= 3 && !STOP_WORDS.has(city) && !STOP_WORDS.has(firstWord)) {
        return titleCase(city);
      }
    }
  }
  return null;
}

function extractRouteFromTranscript(entries: TranscriptEntry[]): RouteInfo {
  let departure: string | null = null;
  let arrival: string | null = null;
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (!entry) continue;
    if (!departure) departure = extractCity(entry.text, DEPARTURE_PATTERNS);
    if (!arrival)   arrival   = extractCity(entry.text, ARRIVAL_PATTERNS);
    if (departure && arrival) break;
  }
  return { departure, arrival };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export type MicStatus = "idle" | "granted" | "denied" | "unavailable";

interface UseVapiCallResult {
  status: CallStatus;
  micStatus: MicStatus;
  connectingStage: string | null;
  transcript: TranscriptEntry[];
  volumeLevel: number;
  isAssistantSpeaking: boolean;
  errorMessage: string | null;
  durationSeconds: number;
  routeInfo: RouteInfo;
  callSummary: CallSummary | null;
  startCall: () => Promise<void>;
  endCall: () => void;
}

export function useVapiCall(): UseVapiCallResult {
  const [status, setStatus]               = useState<CallStatus>("idle");
  const [micStatus, setMicStatus]         = useState<MicStatus>("idle");
  const [connectingStage, setConnectingStage] = useState<string | null>(null);
  const [transcript, setTranscript]       = useState<TranscriptEntry[]>([]);
  const [volumeLevel, setVolumeLevel]     = useState(0);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [errorMessage, setErrorMessage]   = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [routeInfo, setRouteInfo]         = useState<RouteInfo>({ departure: null, arrival: null });
  const [callSummary, setCallSummary]     = useState<CallSummary | null>(null);

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const entryCounter     = useRef(0);
  const transcriptRef    = useRef<TranscriptEntry[]>([]);
  const routeRef         = useRef<RouteInfo>({ departure: null, arrival: null });
  const durationRef      = useRef(0);

  const nextId = useCallback(() => {
    entryCounter.current += 1;
    return `entry-${entryCounter.current}`;
  }, []);

  // Wire Vapi events once the SDK is loaded
  useEffect(() => {
    let cleanedUp = false;

    preloadVapi().then((vapi) => {
      if (cleanedUp) return;

      const handleCallStart = () => {
        T["callStart"] = performance.now();
        console.log(`[vapi] call-start — ${Math.round(T["callStart"]! - (T["vapiStart"] ?? T["callStart"]!))}ms after vapi.start()`);
        setStatus("active");
        setConnectingStage(null);
        setErrorMessage(null);
        setTranscript([]);
        setDurationSeconds(0);
        setRouteInfo({ departure: null, arrival: null });
        setCallSummary(null);
        transcriptRef.current = [];
        routeRef.current = { departure: null, arrival: null };
        durationRef.current = 0;
        durationInterval.current = setInterval(() => {
          setDurationSeconds((d) => { const n = d + 1; durationRef.current = n; return n; });
        }, 1000);
      };

      const handleCallEnd = () => {
        setStatus("ended");
        setIsAssistantSpeaking(false);
        setVolumeLevel(0);
        if (durationInterval.current) { clearInterval(durationInterval.current); durationInterval.current = null; }
        const finalRoute = extractRouteFromTranscript(transcriptRef.current);
        setRouteInfo(finalRoute);
        setCallSummary({
          duration: durationRef.current,
          departure: finalRoute.departure,
          arrival: finalRoute.arrival,
          transcript: [...transcriptRef.current],
        });
        logTimings();
      };

      const handleSpeechStart = () => {
        T["speechStart"] = performance.now();
        console.log(`[vapi] first audio — ${Math.round((T["speechStart"]!) - (T["click"] ?? T["speechStart"]!))}ms after click`);
        setIsAssistantSpeaking(true);
      };

      const handleSpeechEnd   = () => setIsAssistantSpeaking(false);
      const handleVolumeLevel = (level: number) => setVolumeLevel(level);

      const handleProgress = (event: { stage: string; status: string; duration?: number }) => {
        console.log(`[stage] ${event.stage} — ${event.status} (${event.duration}ms)`);
        setConnectingStage(event.stage);
      };
      const handleStartSuccess = (event: { totalDuration: number }) => {
        console.log(`[total] Vapi setup: ${event.totalDuration}ms`);
      };
      const handleStartFailed = (event: { stage: string; error: string }) => {
        console.error(`[failed] ${event.stage} — ${event.error}`);
      };

      const handleMessage = (message: unknown) => {
        if (!isVapiTranscriptMessage(message)) return;
        if (message.transcriptType !== "final") return;
        const entry: TranscriptEntry = {
          id: nextId(), speaker: message.role, text: message.transcript,
          timestamp: Date.now(), isFinal: true,
        };
        const next = [...transcriptRef.current, entry];
        transcriptRef.current = next;
        const route = extractRouteFromTranscript(next);
        routeRef.current = route;
        setTranscript(next);
        setRouteInfo(route);
      };

      const handleError = (error: unknown) => {
        console.error("[Vapi error]", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
        if (durationInterval.current) { clearInterval(durationInterval.current); durationInterval.current = null; }
      };

      vapi.on("call-start",          handleCallStart);
      vapi.on("call-end",            handleCallEnd);
      vapi.on("speech-start",        handleSpeechStart);
      vapi.on("speech-end",          handleSpeechEnd);
      vapi.on("volume-level",        handleVolumeLevel);
      vapi.on("message",             handleMessage);
      vapi.on("error",               handleError);
      vapi.on("call-start-progress", handleProgress);
      vapi.on("call-start-success",  handleStartSuccess);
      vapi.on("call-start-failed",   handleStartFailed);

      // Store cleanup
      (vapi as unknown as { _cleanup?: () => void })._cleanup = () => {
        vapi.off("call-start",          handleCallStart);
        vapi.off("call-end",            handleCallEnd);
        vapi.off("speech-start",        handleSpeechStart);
        vapi.off("speech-end",          handleSpeechEnd);
        vapi.off("volume-level",        handleVolumeLevel);
        vapi.off("message",             handleMessage);
        vapi.off("error",               handleError);
        vapi.off("call-start-progress", handleProgress);
        vapi.off("call-start-success",  handleStartSuccess);
        vapi.off("call-start-failed",   handleStartFailed);
        if (durationInterval.current) clearInterval(durationInterval.current);
      };
    });

    return () => {
      cleanedUp = true;
      try {
        const vapi = getVapiClient();
        (vapi as unknown as { _cleanup?: () => void })._cleanup?.();
      } catch { /* SDK not loaded yet */ }
    };
  }, [nextId]);

  // ── Start call ─────────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    T["click"] = performance.now();
    setStatus("connecting");
    setErrorMessage(null);

    try {
      await prewarmAll();

      const vapi = getVapiClient();
      T["vapiStart"] = performance.now();
      console.log(`[vapi] vapi.start() called — ${Math.round(T["vapiStart"]! - T["click"]!)}ms after click`);

      await vapi.start(getAssistantId());
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : "";
      const message = err instanceof Error ? err.message : "";
      console.error("[Vapi] startCall failed", err);
      setStatus("error");

      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicStatus("denied");
        setErrorMessage("Accès au microphone refusé. Autorisez-le dans les paramètres Chrome (icône 🔒 dans la barre d'adresse).");
      } else {
        setErrorMessage(message || "Impossible de démarrer l'appel.");
      }
    }
  }, []);

  const endCall = useCallback(() => {
    try { getVapiClient().stop(); } catch { /* not started */ }
  }, []);

  return {
    status, micStatus, connectingStage, transcript, volumeLevel,
    isAssistantSpeaking, errorMessage, durationSeconds,
    routeInfo, callSummary, startCall, endCall,
  };
}
