/**
 * Call lifecycle states, mapped from Vapi's event stream
 * (call-start / call-end / error) into a single UI-friendly enum.
 */
export type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

export type ServiceOption = "economy" | "standard" | "comfort" | "storage" | null;
export type LeadStatus = "qualified" | "needs_followup" | "not_interested" | null;

export interface RouteInfo {
  departure: string | null;
  arrival: string | null;
  date: string | null;
  service: ServiceOption;
  // enriched fields extracted from transcript
  clientName: string | null;
  email: string | null;
  phone: string | null;
  housingType: string | null;
  requestedServices: string[];
  leadStatus: LeadStatus;
}

export interface CallSummary {
  duration: number; // seconds
  departure: string | null;
  arrival: string | null;
  date: string | null;
  service: ServiceOption;
  clientName: string | null;
  email: string | null;
  phone: string | null;
  housingType: string | null;
  requestedServices: string[];
  leadStatus: LeadStatus;
  transcript: TranscriptEntry[];
}

export type Speaker = "user" | "assistant";

export interface TranscriptEntry {
  id: string;
  speaker: Speaker;
  text: string;
  timestamp: number; // ms since epoch, used for the manifest-log time column
  isFinal: boolean;
}

/**
 * Shape of Vapi's "message" event payloads we care about.
 * Vapi sends several message types over the same channel (transcript,
 * function-call, hang, etc.) — this narrows to what the UI consumes.
 * See: https://docs.vapi.ai
 */
export interface VapiTranscriptMessage {
  type: "transcript";
  role: Speaker;
  transcript: string;
  transcriptType: "partial" | "final";
}

/**
 * Payload pushed over the SSE stream by /api/route-updates.
 * callId lets the client drop updates not for its own call.
 */
export interface RouteUpdateEvent extends Partial<RouteInfo> {
  callId?: string;
}

export function isVapiTranscriptMessage(
  message: unknown
): message is VapiTranscriptMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as Record<string, unknown>).type === "transcript"
  );
}
