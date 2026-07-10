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

// ---------------------------------------------------------------------------
// Route extraction
// ---------------------------------------------------------------------------
//
// ROOT CAUSES FIXED:
//
// 1. CITY_RE was unbounded: `(?:[\s\-][a-z]{2,})*` with no limit swallowed
//    entire sentence tails — "paris pour travailler demain" became the city.
//    Fix: CITY_RE now only matches a single word or a hyphenated compound.
//    CITY2_RE allows one optional space-separated second word and is only used
//    in patterns that already have a strong keyword anchor.
//
// 2. extractRouteFromTranscript iterated oldest-first and broke on first match,
//    so user corrections ("non je pars de lille") were silently ignored.
//    Fix: iterate NEWEST-first — last thing the user said always wins.
//
// 3. setRouteInfo was called inside the setTranscript updater (impure updater).
//    Fix: extract the route from the ref after the state update, call
//    setRouteInfo outside the updater.
//
// 4. "pour aller à lyon" captured "aller" as the city because the `aller`
//    group was optional, making `pour\s+CITY` match `pour aller`.
//    Fix: split into two patterns — one requires `aller + à`, the other
//    uses a negative lookahead to reject known French infinitives after "pour".
//
// 5. "départ est paris" and "arrivée est lyon" were not matched at all.
//    Fix: added explicit `départ est/c'est CITY` and `arrivée est/c'est CITY`
//    patterns — these are the most natural answers to Alex's direct questions.
//
// 6. Stop-word check tested the full multi-word capture string, not each word.
//    Fix: check both the full string and the first word independently.
// ---------------------------------------------------------------------------

// Single word or hyphenated compound: "paris", "lyon", "saint-étienne"
const CITY_RE = "([a-z\u00e0-\u00ff]{3,}(?:-[a-z\u00e0-\u00ff]{2,})*)";

// One or two space-separated words, or hyphenated: "le havre", "la rochelle"
// Only used where a strong keyword anchor precedes the city slot.
const CITY2_RE = "([a-z\u00e0-\u00ff]{2,}(?:\\s[a-z\u00e0-\u00ff]{2,})?(?:-[a-z\u00e0-\u00ff]{2,})*)";

const DEPARTURE_PATTERNS: RegExp[] = [
  // "je pars de paris", "on part de lyon", "partir depuis bordeaux"
  new RegExp(`partir?\\s+(?:de|depuis)\\s+${CITY2_RE}`, "i"),
  // "départ est paris", "départ c'est paris", "mon départ est paris"
  new RegExp(`d[ée]part\\s+(?:est|c'est|sera|de|depuis)\\s+${CITY2_RE}`, "i"),
  // "je déménage de paris", "on déménage depuis lyon"
  new RegExp(`d[ée]m[eé]nage(?:r|ons|z)?\\s+(?:de|depuis)\\s+${CITY2_RE}`, "i"),
  // "j'habite à paris", "j'habite paris", "je vis à paris"
  new RegExp(`(?:j'?habite|je\\s+vis)\\s+(?:à\\s+|a\\s+)?${CITY2_RE}`, "i"),
  // "mon adresse est à paris", "adresse actuelle paris"
  new RegExp(`adresse\\s+(?:actuelle\\s+)?(?:est\\s+)?(?:à\\s+|a\\s+)?${CITY2_RE}`, "i"),
  // "depuis paris" — only when followed by a sentence boundary or "pour/vers"
  new RegExp(`depuis\\s+${CITY2_RE}(?=\\s+(?:pour|vers|jusqu|et|je|on)|$)`, "i"),
  // "je quitte paris", "on quitte lyon"
  new RegExp(`quitter?\\s+${CITY2_RE}`, "i"),
  // "ville de départ est paris", "ville de départ : paris"
  new RegExp(`ville\\s+de\\s+d[ée]part\\s*(?:est|:)?\\s*${CITY2_RE}`, "i"),
];

const ARRIVAL_PATTERNS: RegExp[] = [
  // "je vais à lyon", "on va à marseille", "je veux aller à bordeaux"
  new RegExp(`(?:je\\s+vais|on\\s+va|je\\s+veux\\s+aller|je\\s+souhaite\\s+aller|je\\s+compte\\s+aller)\\s+(?:à\\s+|a\\s+|en\\s+)?${CITY2_RE}`, "i"),
  // "arrivée est lyon", "arrivée c'est lyon", "mon arrivée est lyon"
  new RegExp(`arriv[ée]e?\\s+(?:est|c'est|sera|à|a)\\s+${CITY2_RE}`, "i"),
  // "destination bordeaux", "destination : bordeaux", "destination est bordeaux"
  new RegExp(`destination\\s*(?:est|c'est|:)?\\s*${CITY2_RE}`, "i"),
  // "pour aller à lyon" — require "à/a/en" after "aller" to avoid capturing "aller"
  new RegExp(`pour\\s+aller\\s+(?:à\\s+|a\\s+|en\\s+)${CITY2_RE}`, "i"),
  // "pour lyon" — negative lookahead rejects known infinitives after "pour"
  new RegExp(`pour\\s+(?!(?:aller|faire|voir|trouver|travailler|vivre|habiter|rejoindre|rentrer|rester|chercher|prendre)\\s)${CITY_RE}`, "i"),
  // "m'installer à lyon", "s'installer à lyon", "emménager à lyon"
  new RegExp(`(?:m'?installer|s'?installer|emm[eé]nager)\\s+(?:à\\s+|a\\s+|en\\s+)?${CITY2_RE}`, "i"),
  // "j'arrive à lyon", "arriver à lyon" — require preposition to avoid "arrivée" false match
  new RegExp(`arriv(?:er?|ez|ons|e)\\s+(?:à\\s+|a\\s+|en\\s+)${CITY2_RE}`, "i"),
  // "vers lyon"
  new RegExp(`vers\\s+${CITY_RE}`, "i"),
  // "ville d'arrivée est lyon", "ville d'arrivée : lyon"
  new RegExp(`ville\\s+d'arriv[ée]e\\s*(?:est|:)?\\s*${CITY2_RE}`, "i"),
];

// Words that must never be returned as a city name.
const STOP_WORDS = new Set([
  // articles / determiners
  "une", "des", "les", "mes", "ses", "nos", "vos", "leur", "leurs",
  "mon", "ton", "son", "notre", "votre", "cet", "cette", "ces",
  // conjunctions / prepositions
  "que", "qui", "quoi", "dont", "où", "ou", "et", "mais", "donc",
  "car", "par", "sur", "sous", "dans", "avec", "sans", "entre", "vers",
  "pour", "depuis", "jusqu",
  // infinitives that appear right after "pour" / "vers"
  "aller", "faire", "voir", "trouver", "travailler", "vivre", "habiter",
  "rejoindre", "rentrer", "partir", "rester", "chercher", "prendre",
  // generic nouns
  "ville", "maison", "appartement", "logement", "travail", "bureau",
  "france", "europe", "pays", "region", "région",
  // time words that leak into city slot
  "demain", "aujourd", "semaine", "mois", "prochain", "prochaine",
  "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche",
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
      const firstWord = city.split(/[\s-]/)[0] ?? "";
      if (
        city.length >= 3 &&
        !STOP_WORDS.has(city) &&
        !STOP_WORDS.has(firstWord)
      ) {
        return titleCase(city);
      }
    }
  }
  return null;
}

// Scan ALL entries NEWEST-FIRST so the user's latest correction always wins.
// Both user and assistant lines are scanned — Alex often confirms the city
// ("Vous partez donc de Paris") which is the most reliable signal.
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
    const handleSpeechEnd   = () => setIsAssistantSpeaking(false);
    const handleVolumeLevel = (level: number) => setVolumeLevel(level);

    const handleMessage = (message: unknown) => {
      if (!isVapiTranscriptMessage(message)) return;
      if (message.transcriptType !== "final") return;

      console.log(`[vapi] ${message.role}: "${message.transcript}"`);

      const entry: TranscriptEntry = {
        id: nextId(),
        speaker: message.role,
        text: message.transcript,
        timestamp: Date.now(),
        isFinal: true,
      };

      // 1. Append entry to the ref synchronously so extraction sees it immediately.
      const next = [...transcriptRef.current, entry];
      transcriptRef.current = next;

      // 2. Extract route from the updated ref — outside the state updater (pure).
      const route = extractRouteFromTranscript(next);
      console.log(`[vapi] route →`, route);
      routeRef.current = route;

      // 3. Flush both state updates together — React 18 batches these.
      setTranscript(next);
      setRouteInfo(route);
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

    vapi.on("call-start",   handleCallStart);
    vapi.on("call-end",     handleCallEnd);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end",   handleSpeechEnd);
    vapi.on("volume-level", handleVolumeLevel);
    vapi.on("message",      handleMessage);
    vapi.on("error",        handleError);

    return () => {
      vapi.off("call-start",   handleCallStart);
      vapi.off("call-end",     handleCallEnd);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end",   handleSpeechEnd);
      vapi.off("volume-level", handleVolumeLevel);
      vapi.off("message",      handleMessage);
      vapi.off("error",        handleError);
      if (durationInterval.current) clearInterval(durationInterval.current);
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
