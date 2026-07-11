"use client";

// Human-readable labels for Vapi's internal stage identifiers
const STAGE_LABELS: Record<string, string> = {
  "microphone":        "Accès au microphone…",
  "ice":               "Établissement de la connexion…",
  "signaling":         "Connexion au serveur…",
  "assistant":         "Chargement de l'assistant…",
  "tts":               "Initialisation de la voix…",
  "stt":               "Initialisation de la transcription…",
};

function stageLabel(stage: string | null): string {
  if (!stage) return "Connexion en cours…";
  return STAGE_LABELS[stage] ?? `${stage}…`;
}

interface ConnectingOverlayProps {
  stage: string | null;
}

export function ConnectingOverlay({ stage }: ConnectingOverlayProps) {
  const label = stageLabel(stage);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-surface px-10 py-10 shadow-xl min-w-[260px]">
        {/* Spinner */}
        <div className="h-12 w-12 rounded-full border-4 border-line border-t-beacon animate-spin" />

        <div className="text-center">
          <p className="font-display text-xl text-paper tracking-tight">
            {label}
          </p>
          <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-ink400">
            ÉTABLISSEMENT DE LA LIAISON VOCALE
          </p>
        </div>

        {/* Stage progress dots */}
        <div className="flex items-center gap-1.5">
          {["microphone", "ice", "signaling", "assistant"].map((s) => {
            const stages = ["microphone", "ice", "signaling", "assistant"];
            const currentIdx = stage ? stages.indexOf(stage) : -1;
            const thisIdx = stages.indexOf(s);
            const done = currentIdx > thisIdx;
            const active = currentIdx === thisIdx;
            return (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  done    ? "w-4 bg-confirmed" :
                  active  ? "w-4 bg-beacon animate-pulse" :
                            "w-1.5 bg-line"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
