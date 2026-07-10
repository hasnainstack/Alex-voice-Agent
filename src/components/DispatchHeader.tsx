interface DispatchHeaderProps {
  errorMessage: string | null;
}

export function DispatchHeader({ errorMessage }: DispatchHeaderProps) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-confirmed" />
          <span className="font-display text-lg tracking-tight text-ink900">
            NEXTCITYS
          </span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink400 hidden sm:inline">
            DÉMÉNAGEMENT — DÉMO VOCALE
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.14em] text-ink400">
          COURTIER · SANS ENGAGEMENT
        </span>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border-t border-red-100">
          <div className="mx-auto max-w-5xl px-6 py-2.5">
            <p className="text-xs text-red-700">
              <span className="font-semibold">Erreur —</span> {errorMessage}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
