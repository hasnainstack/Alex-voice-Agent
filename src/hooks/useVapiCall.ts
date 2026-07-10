"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAssistantId, getVapiClient } from "@/lib/vapi-client";
import {
  CallStatus,
  RouteInfo,
  CallSummary,
  TranscriptEntry,
  isVapiTranscriptMessage,
} from "@/types/call";

// Vapi STT delivers lowercase, unpunctuated text — all matching must be case-insensitive
// and city names must be captured then title-cased for display.

// Matches a city: 3+ letter word, optionally followed by a hyphenated/spaced second word
// e.g. "paris", "saint-étienne", "le havre"
const CITY_RE = "([a-z\u00e0-\u00ff]{3,}(?:[\\s\\-][a-z\u00e0-\u00ff]{2,})*)";

const DEPARTURE_PATTERNS: RegExp[] = [
  // "je pars de paris", "on part de lyon", "partir de bordeaux"
  new RegExp(`partir?\\s+de\\s+${CITY_RE}`, "i"),
  // "je suis à paris", "j'habite à paris", "j'habite paris"
  new RegExp(`(?:j'?habite|je\\s+vis|je\\s+suis|on\\s+est|on\\s+habite)\\s+(?:à\\s+|a\\s+)?${CITY_RE}`, "i"),
  // "mon adresse est à paris", "adresse actuelle paris"
  new RegExp(`adresse\\s+(?:actuelle\\s+)?(?:est\\s+)?(?:à\\s+|a\\s+)?${CITY_RE}`, "i"),
  // "départ de paris", "départ depuis paris"
  new RegExp(`d[ée]part\\s+(?:de|depuis)\\s+${CITY_RE}`, "i"),
  // "depuis paris", "de paris pour"
  new RegExp(`(?:depuis|de)\\s+${CITY_RE}\\s+(?:pour|vers|jusqu|à|a)`, "i"),
  // "je quitte paris", "je quitte la ville de paris"
  new RegExp(`quitter?\\s+(?:la\\s+ville\\s+de\\s+)?${CITY_RE}`, "i"),
];

const ARRIVAL_PATTERNS: RegExp[] = [
  // "pour aller à lyon", "pour lyon"
  new RegExp(`pour\\s+(?:aller\\s+)?(?:à\\s+|a\\s+)?${CITY_RE}`, "i"),
  // "je vais à lyon", "on va à lyon"
  new RegExp(`(?:je\\s+vais|on\\s+va|je\\s+veux\\s+aller|je\\s+souhaite\\s+aller)\\s+(?:à\\s+|a\\s+)?${CITY_RE}`, "i"),
  // "m'installer à lyon", "emménager à lyon", "s'installer à lyon"
  new RegExp(`(?:m'?installer|s'?installer|emm[eé]nager|m'?installer)\\s+(?:à\\s+|a\\s+|en\\s+)?${CITY_RE}`, "i"),
  // "destination lyon", "destination : lyon"
  new RegExp(`destination\\s*:?\\s*${CITY_RE}`, "i"),
  // "arriver à lyon", "j'arrive à lyon"
  new RegExp(`arriv(?:er?|ez|ons)\\s+(?:à\\s+|a\\s+|en\\s+)?${CITY_RE}`, "i"),
  // "vers lyon"
  new RegExp(`vers\\s+${CITY_RE}`, "i"),
];

// Stop-words that should never be treated as city names
const STOP_WORDS = new Set([
  "une", "des", "les", "mes", "ses", "nos", "vos", "leur", "leurs",
  "mon", "ton", "son", "notre", "votre",
  "que", "qui", "quoi", "dont", "où", "ou", "et", "mais", "donc",
  "car", "par", "sur", "sous", "dans", "avec", "sans", "entre",
  "ville", "maison", "appartement", "logement", "travail", "bureau",
  "france", "europe", "pays",
]);

function titleCase(str: string): string {
  return str
    .split(/[\s\-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(str.includes("-") ? "-" : " ");
}

function extractCity(text: string, patterns: RegExp[]): string | null {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match?.[1]) {
      const city = match[1].trim();
      if (city.length >= 3 && !STOP_WORDS.has(city.toLowerCase())) {
        return titleCase(city);
      }
    }
  }
  return null;
}

// Scan the full transcript array for the best departure/arrival values
function extractRouteFromTranscript(entries: TranscriptEntry[]): RouteInfo {
  let departure: string | null = null;
  let arrival: string | null = null;
  for (const entry of entries) {
    if (!departure) departure = extractCity(entry.text, DEPARTURE_PATTERNS);
    if (!arrival) arrival = extractCity(entry.text, ARRIVAL_PATTERNS);
    if (departure && arrival) break;
  }
  return { departure, arrival };
}

interface UseVapiCallResult {
  status: CallStatus;
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
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({ departure: null, arrival: null });
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null);

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const entryCounter = useRef(0);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const routeRef = useRef<RouteInfo>({ departure: null, arrival: null });
  const durationRef = useRef(0);

  const nextId = useCallback(() => {
    entryCounter.current += 1;
    return `entry-${entryCounter.current}`;
  }, []);

  useEffect(() => {
    // Guard: Vapi's SDK touches window/mic APIs, so it can only be
    // constructed client-side. This effect only runs in the browser anyway,
    // but getVapiClient() throws early and clearly if that assumption ever
    // breaks (e.g. this hook gets called during SSR by mistake).
    const vapi = getVapiClient();

    const handleCallStart = () => {
      setStatus("active");
      setErrorMessage(null);
      setTranscript([]);
      setDurationSeconds(0);
      setRouteInfo({ departure: null, arrival: null });
      setCallSummary(null);
      transcriptRef.current = [];
      routeRef.current = { departure: null, arrival: null };
      durationRef.current = 0;
      durationInterval.current = setInterval(() => {
        setDurationSeconds((d) => {
          const next = d + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);
    };

    const handleCallEnd = () => {
      setStatus("ended");
      setIsAssistantSpeaking(false);
      setVolumeLevel(0);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      // Final authoritative scan of the complete transcript
      const finalRoute = extractRouteFromTranscript(transcriptRef.current);
      setRouteInfo(finalRoute);
      setCallSummary({
        duration: durationRef.current,
        departure: finalRoute.departure,
        arrival: finalRoute.arrival,
        transcript: [...transcriptRef.current],
      });
    };

    const handleSpeechStart = () => setIsAssistantSpeaking(true);
    const handleSpeechEnd = () => setIsAssistantSpeaking(false);
    const handleVolumeLevel = (level: number) => setVolumeLevel(level);

    const handleMessage = (message: unknown) => {
      if (!isVapiTranscriptMessage(message)) return;
      if (message.transcriptType !== "final") return;

      // Debug: open DevTools console to verify what Vapi is sending
      console.log(`[route extract] ${message.role}: "${message.transcript}"`);

      const entry: TranscriptEntry = {
        id: nextId(),
        speaker: message.role,
        text: message.transcript,
        timestamp: Date.now(),
        isFinal: true,
      };

      setTranscript((prev) => {
        const next = [...prev, entry];
        transcriptRef.current = next;
        // Re-scan the full transcript so assistant confirmations also update route
        const route = extractRouteFromTranscript(next);
        console.log(`[route extract] result →`, route);
        routeRef.current = route;
        setRouteInfo(route);
        return next;
      });
    };

    const handleError = (error: unknown) => {
      console.error("[Vapi error]", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Une erreur est survenue pendant l'appel."
      );
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("volume-level", handleVolumeLevel);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("volume-level", handleVolumeLevel);
      vapi.off("message", handleMessage);
      vapi.off("error", handleError);
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [nextId]);

  const startCall = useCallback(async () => {
    setStatus("connecting");
    setErrorMessage(null);
    try {
      const vapi = getVapiClient();
      await vapi.start(getAssistantId());
    } catch (error) {
      console.error("[Vapi] Failed to start call", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de démarrer l'appel. Vérifiez l'accès au microphone."
      );
    }
  }, []);

  const endCall = useCallback(() => {
    const vapi = getVapiClient();
    vapi.stop();
  }, []);

  return {
    status,
    transcript,
    volumeLevel,
    isAssistantSpeaking,
    errorMessage,
    durationSeconds,
    routeInfo,
    callSummary,
    startCall,
    endCall,
  };
}
