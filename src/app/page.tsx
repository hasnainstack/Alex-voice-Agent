"use client";

import { DispatchHeader } from "@/components/DispatchHeader";
import { RouteVisualizer } from "@/components/RouteVisualizer";
import { CallControls } from "@/components/CallControls";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { ConnectingOverlay } from "@/components/ConnectingOverlay";
import { CompaniesSidebar, CompaniesBottomSheet } from "@/components/CompaniesPanel";
import { CallSummaryCard } from "@/components/CallSummaryCard";
import { useVapiCall } from "@/hooks/useVapiCall";

export default function HomePage() {
  const {
    status,
    micStatus,
    connectingStage,
    transcript,
    volumeLevel,
    isAssistantSpeaking,
    errorMessage,
    durationSeconds,
    routeInfo,
    callSummary,
    startCall,
    endCall,
  } = useVapiCall();

  return (
    <div className="min-h-screen flex flex-col">
      {status === "connecting" && <ConnectingOverlay stage={connectingStage} />}

      <DispatchHeader errorMessage={errorMessage} />

      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">
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

        {/* Mobile companies sheet — hidden */}
        {/* <div className="mb-4">
          <CompaniesBottomSheet status={status} routeInfo={routeInfo} />
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: route + controls */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <RouteVisualizer
              status={status}
              isAssistantSpeaking={isAssistantSpeaking}
              volumeLevel={volumeLevel}
              routeInfo={routeInfo}
            />
            {/* Connector arrow — desktop only */}
            <div className="hidden lg:flex items-center gap-2 px-1">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
              <svg className="w-3 h-3 text-ink400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
            </div>
            <CallControls
              status={status}
              micStatus={micStatus}
              durationSeconds={durationSeconds}
              onStart={startCall}
              onEnd={endCall}
            />
          </div>

          {/* Right: audio visualizer + post-call summary */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <AudioVisualizer
              status={status}
              volumeLevel={volumeLevel}
              isAssistantSpeaking={isAssistantSpeaking}
            />
            {callSummary && <CallSummaryCard summary={callSummary} />}
          </div>

          {/* Right: companies sidebar — hidden */}
          {/* <div className="lg:col-span-3">
            <CompaniesSidebar status={status} routeInfo={routeInfo} />
          </div> */}
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <p className="font-mono text-[10px] tracking-[0.14em] text-ink400">
            NEXTCITYS DÉMÉNAGEMENT — SERVICE GRATUIT · SANS ENGAGEMENT · JUSQU&rsquo;À 6 DEVIS EN 48H
          </p>
        </div>
      </footer>
    </div>
  );
}
