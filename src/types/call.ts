/**
 * Call lifecycle states, mapped from Vapi's event stream
 * (call-start / call-end / error) into a single UI-friendly enum.
 */
export type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

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

export function isVapiTranscriptMessage(
  message: unknown
): message is VapiTranscriptMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as Record<string, unknown>).type === "transcript"
  );
}
