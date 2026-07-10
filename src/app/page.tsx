"use client";

import { DispatchHeader } from "@/components/DispatchHeader";
import { RouteVisualizer } from "@/components/RouteVisualizer";
import { CallControls } from "@/components/CallControls";
import { TranscriptLog } from "@/components/TranscriptLog";
import { useVapiCall } from "@/hooks/useVapiCall";

export default function HomePage() {
  const {
    status,
    transcript,
    volumeLevel,
    isAssistantSpeaking,
    errorMessage,
    durationSeconds,
    startCall,
    endCall,
  } = useVapiCall();

  return (
    <div className="min-h-screen flex flex-col">
      <DispatchHeader errorMessage={errorMessage} />

      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-10">
        <div className="mb-8">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink400 mb-2">
            DÉMONSTRATION CLIENT
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink900 tracking-tight max-w-2xl">
            Parlez avec Alex, l&rsquo;assistant vocal NEXTCITYS
          </h1>
          <p className="mt-3 text-sm text-ink600 max-w-xl leading-relaxed">
            Cliquez sur &laquo;&nbsp;Démarrer l&rsquo;appel&nbsp;&raquo; et
            autorisez le microphone. Alex qualifie votre projet de
            déménagement comme il le ferait avec un client réel.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <RouteVisualizer
              status={status}
              isAssistantSpeaking={isAssistantSpeaking}
              volumeLevel={volumeLevel}
            />
            <CallControls
              status={status}
              durationSeconds={durationSeconds}
              onStart={startCall}
              onEnd={endCall}
            />
          </div>

          <div className="lg:col-span-3">
            <TranscriptLog entries={transcript} isEmpty={transcript.length === 0} />
          </div>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <p className="font-mono text-[10px] tracking-[0.14em] text-ink400">
            NEXTCITYS DÉMÉNAGEMENT — SERVICE GRATUIT · SANS ENGAGEMENT · JUSQU&rsquo;À 6 DEVIS EN 48H
          </p>
        </div>
      </footer>
    </div>
  );
}
