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
  // French
  new RegExp(`\\b(?:pars|part|partir)\\s+(?:de|depuis)\\s+${CITY2_RE}`, "i"),
  new RegExp(`d[\u00e9e]part\\s+(?:est|c[\u2018\u2019']est|sera|de|depuis)\\s+${CITY2_RE}`, "i"),
  new RegExp(`d[\u00e9e]m[e\u00e9]nage(?:r|ons|z)?\\s+(?:de|depuis)\\s+${CITY2_RE}`, "i"),
  new RegExp(`(?:j[\u2018\u2019']?habite|je\\s+vis)\\s+(?:\u00e0\\s+|a\\s+)?${CITY2_RE}`, "i"),
  new RegExp(`adresse\\s+(?:actuelle\\s+)?(?:est\\s+)?(?:\u00e0\\s+|a\\s+)?(?!email|mail|courriel|postale)${CITY2_RE}`, "i"),
  new RegExp(`depuis\\s+${CITY2_RE}(?=\\s+(?:pour|vers|jusqu|et|je|on)|$)`, "i"),
  new RegExp(`quitter?\\s+${CITY2_RE}`, "i"),
  new RegExp(`ville\\s+de\\s+d[\u00e9e]part\\s*(?:est|:)?\\s*${CITY2_RE}`, "i"),
  // English
  new RegExp(`(?:moving|move|relocating|relocate)\\s+from\\s+${CITY2_RE}`, "i"),
  new RegExp(`(?:i[\u2018\u2019']?m|i\\s+am|we[\u2018\u2019']?re|we\\s+are)\\s+(?:currently\\s+)?(?:in|living\\s+in|based\\s+in)\\s+${CITY2_RE}`, "i"),
  new RegExp(`(?:i|we)\\s+live\\s+in\\s+${CITY2_RE}`, "i"),
  new RegExp(`(?:leaving|departing|coming)\\s+from\\s+${CITY2_RE}`, "i"),
  new RegExp(`from\\s+${CITY2_RE}\\s+to\\b`, "i"),
];

const ARRIVAL_HIGH_PATTERNS: RegExp[] = [
  // French
  new RegExp(`(?:je\\s+vais|on\\s+va|je\\s+veux\\s+aller|je\\s+souhaite\\s+aller|je\\s+compte\\s+aller)\\s+(?:\u00e0\\s+|a\\s+|en\\s+)?${CITY2_RE}`, "i"),
  new RegExp(`arriv[\u00e9e]e?\\s+(?:est|c[\u2018\u2019']est|sera|\u00e0|a)\\s+${CITY2_RE}`, "i"),
  new RegExp(`destination\\s*(?:est|c[\u2018\u2019']est|:)?\\s*${CITY2_RE}`, "i"),
  new RegExp(`pour\\s+aller\\s+(?:\u00e0\\s+|a\\s+|en\\s+)${CITY2_RE}`, "i"),
  new RegExp(`(?:m[\u2018\u2019']?installer|s[\u2018\u2019']?installer|emm[e\u00e9]nager)\\s+(?:\u00e0\\s+|a\\s+|en\\s+)?${CITY2_RE}`, "i"),
  new RegExp(`arriv(?:er?|ez|ons|e)\\s+(?:\u00e0\\s+|a\\s+|en\\s+)${CITY2_RE}`, "i"),
  new RegExp(`ville\\s+d[\u2018\u2019']arriv[\u00e9e]e\\s*(?:est|:)?\\s*${CITY2_RE}`, "i"),
  // English
  new RegExp(`from\\s+[a-z\u00e0-\u00ff]+(?:-[a-z\u00e0-\u00ff]+)*\\s+to\\s+${CITY2_RE}`, "i"),
  new RegExp(`(?:moving|move|relocating|relocate)\\s+to\\s+${CITY2_RE}`, "i"),
  new RegExp(`(?:going|heading)\\s+to\\s+${CITY2_RE}`, "i"),
  new RegExp(`(?:settle|settling)\\s+in\\s+${CITY2_RE}`, "i"),
  new RegExp(`arrive\\s+(?:in|at)\\s+${CITY2_RE}`, "i"),
];

// Demoted to low-confidence: these two are broad prepositional catch-alls
// that misfire on ordinary speech ("pour information" -> "Information",
// "vers midi" -> "Midi"). They only fill a slot that's still empty after
// every high-confidence pattern has been tried against the whole transcript
// — they can never overwrite a real match found elsewhere. See
// extractRouteFromTranscript below.
const ARRIVAL_LOW_PATTERNS: RegExp[] = [
  new RegExp(`pour\\s+(?!(?:aller|faire|voir|trouver|travailler|vivre|habiter|rejoindre|rentrer|rester|chercher|prendre)\\s)${CITY_RE}`, "i"),
  new RegExp(`vers\\s+${CITY_RE}`, "i"),
];

const STOP_WORDS = new Set([
  // French
  "une","des","les","mes","ses","nos","vos","leur","leurs","mon","ton","son","notre","votre","cet","cette","ces",
  "que","qui","quoi","dont","où","ou","et","mais","donc","car","par","sur","sous","dans","avec","sans","entre","vers","pour","depuis","jusqu",
  "aller","faire","voir","trouver","travailler","vivre","habiter","rejoindre","rentrer","partir","rester","chercher","prendre",
  "ville","maison","appartement","logement","travail","bureau","france","europe","pays","region","région",
  "demain","aujourd","semaine","mois","prochain","prochaine","lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche",
  "quel","quelle","quels","quelles","comment","combien","pourquoi","vous","nous","cela","ça","ceci",
  "moi","toi","lui","information","informations","instant","cas","sûr",
  "email","mail","courriel","postale","electronique","électronique",
  "midi","minuit","matin","soir","fin","début","merci","bonjour","oui","non",
  "peut","peux","veux","veut","voudrais","aimerais","besoin",
  "de","du","à","a","en","le","la","un",
  // English
  "the","and","but","for","from","with","into","onto","over","about","after","before",
  "my","your","his","her","our","their","its","this","that","these","those",
  "have","has","had","will","would","could","should",
  "city","town","house","home","work","office","currently","actually","basically",
  "monday","tuesday","wednesday","thursday","friday","saturday","sunday",
  "january","february","march","april","june","july","august","september","october","november","december",
  "what","which","how","phone","case","sure","noon","evening","morning","tonight","today","tomorrow",
  "of","to","in","is",
]);

function titleCase(str: string): string {
  return str.split(/[\s\-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(str.includes("-") ? "-" : " ");
}

/**
 * Strips stopwords from the EDGES of a multi-word capture (both leading and
 * trailing), not just the first word. CITY2_RE's optional second-word grab
 * can otherwise pick up an adjacent stopword — e.g. "Paris pour" or
 * "de Lille" — and previously only the first word was checked, so a
 * trailing "pour" or leading "de" would slip through uncleaned.
 */
function cleanCapture(raw: string): string {
  const words = raw.trim().split(/\s+/);
  while (words.length && STOP_WORDS.has(words[0]!)) words.shift();
  while (words.length && STOP_WORDS.has(words[words.length - 1]!)) words.pop();
  return words.join(" ");
}

function extractCity(text: string, patterns: RegExp[]): string | null {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match?.[1]) {
      const city = cleanCapture(match[1]);
      if (city.length >= 3 && !STOP_WORDS.has(city)) {
        return titleCase(city);
      }
    }
  }
  return null;
}

function extractRouteFromAssistantLine(text: string): Partial<RouteInfo> | null {
  const t = text.trim();
  const patch: Partial<RouteInfo> = {};

  // Trajet/Route confirmed — captures both cities in one shot
  let m = t.match(/Trajet confirm[e\u00e9]\s*[:,]\s*([^\u2192\n]+)\s*\u2192\s*([^\n.!?]+)/i);
  if (m?.[1] && m[2]) { patch.departure = titleCase(m[1].trim()); patch.arrival = titleCase(m[2].trim()); }

  m = t.match(/Route confirmed\s*[:,]\s*([^\u2192\n]+)\s*\u2192\s*([^\n.!?]+)/i);
  if (m?.[1] && m[2]) { patch.departure = titleCase(m[1].trim()); patch.arrival = titleCase(m[2].trim()); }

  // Departure
  if (!patch.departure) {
    m = t.match(/Ville de d[e\u00e9]part\s*[:,]\s*([^\n.!?]+)/i) ?? t.match(/Departure city\s*[:,]\s*([^\n.!?]+)/i);
    if (m?.[1]) patch.departure = titleCase(m[1].trim());
  }

  // Arrival
  if (!patch.arrival) {
    m = t.match(/Ville d['\u2019]arriv[e\u00e9]e\s*[:,]\s*([^\n.!?]+)/i) ?? t.match(/Arrival city\s*[:,]\s*([^\n.!?]+)/i);
    if (m?.[1]) patch.arrival = titleCase(m[1].trim());
  }

  // Date — scan the whole turn, not just a single label line
  m = t.match(/Date(?:\/p[e\u00e9]riode?)?\s*[:,]\s*([^\n.!?]+)/i)
    ?? t.match(/p[e\u00e9]riode?\s*[:,]\s*([^\n.!?]+)/i);
  if (m?.[1]) patch.date = m[1].trim();

  return Object.keys(patch).length ? patch : null;
}

function mergeRoute(prev: RouteInfo, patch: Partial<RouteInfo> | null): RouteInfo {
  if (!patch) return prev;
  return {
    departure:   patch.departure   ?? prev.departure,
    arrival:     patch.arrival     ?? prev.arrival,
    date:        patch.date        ?? prev.date,
    clientName:  patch.clientName  ?? prev.clientName,
    email:       patch.email       ?? prev.email,
    phone:       patch.phone       ?? prev.phone,
    housingType: patch.housingType ?? prev.housingType,
    leadStatus:  patch.leadStatus  ?? prev.leadStatus,
  };
}

// ---------------------------------------------------------------------------
// Enriched field extractors (transcript-based)
// ---------------------------------------------------------------------------

function extractClientName(entries: TranscriptEntry[]): string | null {
  // Alex confirms the name after asking — look for "[Name], je vais vous poser" or "Parfait [Name]" or "D'accord [Name]"
  for (const e of entries) {
    if (e.speaker !== "assistant") continue;
    const m = e.text.match(/(?:Parfait|D'accord|Très bien|Bonjour|Ok|Okay)[,.]?\s+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s[A-ZÀ-Ÿ][a-zà-ÿ]+)?)[,.]?\s+(?:je|on|nous|I'll|I will)/i);
    if (m?.[1]) return m[1].trim();
  }
  // Fallback: user introduces themselves
  for (const e of entries) {
    if (e.speaker !== "user") continue;
    const m = e.text.match(/(?:je m'appelle|mon nom est|c'est|my name is|i'm|i am)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s[A-ZÀ-Ÿ][a-zà-ÿ]+)?)/i);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function extractEmail(entries: TranscriptEntry[]): string | null {
  // Match a real @ address (typed/pasted into transcript)
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
  // Match spoken form: "john at gmail dot com" or "john arobase gmail point com"
  const spokenRe = /([a-z0-9][a-z0-9._+\-]*)\s+(?:at|@|arobase|chez)\s+([a-z0-9][a-z0-9.\-]*)\s+(?:dot|point|\.|\.\s*)\s*([a-z]{2,})/i;
  for (const e of entries) {
    const m1 = e.text.match(emailRe);
    if (m1) return m1[0].toLowerCase();
    const m2 = e.text.match(spokenRe);
    if (m2) return `${m2[1]}@${m2[2]}.${m2[3]}`.toLowerCase();
  }
  return null;
}

function extractPhone(entries: TranscriptEntry[]): string | null {
  // French mobile / landline patterns
  const phoneRe = /(?:\+33|0033|0)[\s.\-]?[1-9](?:[\s.\-]?\d{2}){4}/;
  for (const e of entries) {
    const m = e.text.replace(/\s+/g, " ").match(phoneRe);
    if (m) return m[0].replace(/[\s.\-]/g, "");
  }
  return null;
}

function extractHousingType(entries: TranscriptEntry[]): string | null {
  const patterns: [RegExp, string][] = [
    [/\bstudio\b/i, "Studio"],
    [/\b(?:t1|f1|1\s*pièce)\b/i, "T1"],
    [/\b(?:t2|f2|2\s*pièces?)\b/i, "T2"],
    [/\b(?:t3|f3|3\s*pièces?)\b/i, "T3"],
    [/\b(?:t4|f4|4\s*pièces?)\b/i, "T4"],
    [/\b(?:t5|f5|5\s*pièces?)\b/i, "T5+"],
    [/\bmaison\b/i, "Maison"],
    [/\bvilla\b/i, "Villa"],
    [/\bappartement\b/i, "Appartement"],
    [/\bloft\b/i, "Loft"],
  ];
  for (const e of entries) {
    for (const [re, label] of patterns) {
      if (re.test(e.text)) return label;
    }
  }
  return null;
}

function inferLeadStatus(entries: TranscriptEntry[], duration: number): import("@/types/call").LeadStatus {
  const fullText = entries.map((e) => e.text).join(" ").toLowerCase();
  if (/pas intéressé|plus tard|rappeler|no thanks|not interested|annuler|cancel/i.test(fullText)) return "not_interested";
  if (/[@]/.test(fullText)) return "qualified";
  if (duration < 60) return "needs_followup";
  return "needs_followup";
}

/**
 * NLP fallback — only used when the assistant hasn't yet said the exact
 * label for a piece of info. Only scans USER speech (assistant lines are
 * handled separately via extractRouteFromAssistantLine, since assistant
 * phrasing is far more prone to false positives when run through generic
 * NLP patterns).
 *
 * High-confidence patterns are tried first across the WHOLE transcript
 * before any low-confidence catch-all is allowed to fill a slot — so a
 * generic "pour X" / "vers X" false positive can never overwrite a real
 * match found elsewhere, it can only fill a slot nothing else has claimed.
 */
function extractRouteFromTranscript(entries: TranscriptEntry[]): RouteInfo {
  let departure: string | null = null;
  let arrival: string | null = null;
  let arrivalLow: string | null = null;

  const userEntries = entries.filter((e) => e.speaker === "user");

  for (const entry of userEntries) {
    if (!departure) departure = extractCity(entry.text, DEPARTURE_PATTERNS);
    if (!arrival)   arrival   = extractCity(entry.text, ARRIVAL_HIGH_PATTERNS);
    if (!arrival && !arrivalLow) arrivalLow = extractCity(entry.text, ARRIVAL_LOW_PATTERNS);
    if (departure && arrival) break;
  }

  return { departure, arrival: arrival ?? arrivalLow, date: null, clientName: null, email: null, phone: null, housingType: null, leadStatus: null };
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
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({ departure: null, arrival: null, date: null, clientName: null, email: null, phone: null, housingType: null, leadStatus: null });
  const [callSummary, setCallSummary]     = useState<CallSummary | null>(null);

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const entryCounter     = useRef(0);
  const transcriptRef    = useRef<TranscriptEntry[]>([]);
  const routeRef = useRef<RouteInfo>({ departure: null, arrival: null, date: null, clientName: null, email: null, phone: null, housingType: null, leadStatus: null });
  const durationRef      = useRef(0);

  const nextId = useCallback(() => {
    entryCounter.current += 1;
    return `entry-${entryCounter.current}`;
  }, []);

  // ── Poll: receive structured route from webhook (save_route tool call) ────
  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/route-updates");
        if (!res.ok) return;
        const patch = await res.json() as Partial<RouteInfo> | null;
        if (!patch || typeof patch !== "object") return;
        const vals = Object.values(patch);
        if (vals.every((v) => v === null || v === undefined || (Array.isArray(v) && v.length === 0))) return;
        setRouteInfo((prev) => {
          const next = mergeRoute(prev, patch);
          routeRef.current = next;
          return next;
        });
      } catch { /* network error */ }
    }, 2000);
    return () => clearInterval(id);
  }, [status]);

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
        setRouteInfo({ departure: null, arrival: null, date: null, clientName: null, email: null, phone: null, housingType: null, leadStatus: null });
        setCallSummary(null);
        transcriptRef.current = [];
        routeRef.current = { departure: null, arrival: null, date: null, clientName: null, email: null, phone: null, housingType: null, leadStatus: null };
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
        const merged = mergeRoute(routeRef.current, finalRoute);
        // Enrich with transcript-extracted fields
        const allEntries = transcriptRef.current;
        const enriched: RouteInfo = {
          ...merged,
          clientName:  merged.clientName  ?? extractClientName(allEntries),
          email:       merged.email       ?? extractEmail(allEntries),
          phone:       merged.phone       ?? extractPhone(allEntries),
          housingType: merged.housingType ?? extractHousingType(allEntries),
          leadStatus:  inferLeadStatus(allEntries, durationRef.current),
        };
        setRouteInfo(enriched);
        setCallSummary({
          duration:    durationRef.current,
          departure:   enriched.departure,
          arrival:     enriched.arrival,
          date:        enriched.date,
          clientName:  enriched.clientName,
          email:       enriched.email,
          phone:       enriched.phone,
          housingType: enriched.housingType,
          leadStatus:  enriched.leadStatus,
          transcript:  [...transcriptRef.current],
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
        setTranscript(next);

        // Structured lines from assistant are most reliable — apply first.
        // This now also catches the "Service choisi :" / "Service selected:"
        // label, the piece that was previously missing entirely.
        const assistantPatch =
          message.role === "assistant" ? extractRouteFromAssistantLine(entry.text) : null;

        // NLP fallback: fill any cities not yet known
        let merged = mergeRoute(routeRef.current, assistantPatch);
        if (!merged.departure || !merged.arrival) {
          const nlp = extractRouteFromTranscript(next);
          console.log("[route]", { role: message.role, text: entry.text, nlp, assistantPatch, merged });
          merged = mergeRoute(merged, { departure: nlp.departure ?? undefined, arrival: nlp.arrival ?? undefined });
        }

        routeRef.current = merged;
        setRouteInfo(merged);
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