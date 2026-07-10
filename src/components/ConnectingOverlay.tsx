"use client";

export function ConnectingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-surface px-10 py-10 shadow-xl">
        {/* Spinner */}
        <div className="h-12 w-12 rounded-full border-4 border-line border-t-beacon animate-spin" />
        <div className="text-center">
          <p className="font-display text-xl text-paper tracking-tight">
            Connexion en cours…
          </p>
          <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-ink400">
            ÉTABLISSEMENT DE LA LIAISON VOCALE
          </p>
        </div>
      </div>
    </div>
  );
}
