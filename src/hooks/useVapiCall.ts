"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAssistantId, getVapiClient } from "@/lib/vapi-client";
import {
  CallStatus,
  TranscriptEntry,
  isVapiTranscriptMessage,
} from "@/types/call";

interface UseVapiCallResult {
  status: CallStatus;
  transcript: TranscriptEntry[];
  volumeLevel: number; // 0–1, assistant speech amplitude, drives the beacon
  isAssistantSpeaking: boolean;
  errorMessage: string | null;
  durationSeconds: number;
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

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const entryCounter = useRef(0);

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
      durationInterval.current = setInterval(() => {
        setDurationSeconds((d) => d + 1);
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
    };

    const handleSpeechStart = () => setIsAssistantSpeaking(true);
    const handleSpeechEnd = () => setIsAssistantSpeaking(false);
    const handleVolumeLevel = (level: number) => setVolumeLevel(level);

    const handleMessage = (message: unknown) => {
      if (!isVapiTranscriptMessage(message)) return;
      // Only append final transcripts to the manifest log — partials would
      // otherwise flicker the log as words are still being recognized.
      if (message.transcriptType !== "final") return;

      setTranscript((prev) => [
        ...prev,
        {
          id: nextId(),
          speaker: message.role,
          text: message.transcript,
          timestamp: Date.now(),
          isFinal: true,
        },
      ]);
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
    startCall,
    endCall,
  };
}
