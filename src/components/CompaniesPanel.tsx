"use client";

import { useState, useEffect } from "react";
import { CallStatus } from "@/types/call";

interface Company {
  id: string;
  name: string;
  cities: string;
  rating: number;
  priceRange: string;
  badge?: string;
  badgeColor?: string;
  initials: string;
  avatarColor: string;
}

const COMPANIES: Company[] = [
  { id: "1", name: "TransEurope Déménagement", cities: "Paris · Lyon · Bruxelles", rating: 4.8, priceRange: "€€€", badge: "TOP", badgeColor: "bg-amber-100 text-amber-700", initials: "TE", avatarColor: "bg-blue-600" },
  { id: "2", name: "MoveFast Express", cities: "Paris · Marseille · Madrid", rating: 4.6, priceRange: "€€", badge: "RAPIDE", badgeColor: "bg-orange-100 text-orange-700", initials: "MF", avatarColor: "bg-orange-500" },
  { id: "3", name: "Alliance Déménageurs", cities: "Île-de-France · Rhône-Alpes", rating: 4.5, priceRange: "€€", initials: "AD", avatarColor: "bg-violet-600" },
  { id: "4", name: "EuroReloc Pro", cities: "Paris · Amsterdam · Berlin", rating: 4.7, priceRange: "€€€", initials: "ER", avatarColor: "bg-sky-600" },
  { id: "5", name: "Déménagement Solidaire", cities: "France entière", rating: 4.4, priceRange: "€", badge: "ÉCO", badgeColor: "bg-green-100 text-green-700", initials: "DS", avatarColor: "bg-emerald-600" },
  { id: "6", name: "Prestige Moving Group", cities: "Paris · Nice · Monaco", rating: 4.9, priceRange: "€€€€", badge: "PREMIUM", badgeColor: "bg-yellow-100 text-yellow-700", initials: "PM", avatarColor: "bg-yellow-600" },
  { id: "7", name: "CityMove Paris", cities: "Grand Paris · Banlieue", rating: 4.3, priceRange: "€€", initials: "CM", avatarColor: "bg-rose-500" },
  { id: "8", name: "Iberia Transports", cities: "Paris · Barcelone · Lisbonne", rating: 4.5, priceRange: "€€", initials: "IT", avatarColor: "bg-indigo-500" },
];

type PanelState = "idle" | "searching" | "results";

interface PanelProps {
  status: CallStatus;
  routeInfo: { departure: string | null; arrival: string | null };
}

function usePanelState(status: CallStatus): PanelState {
  if (status === "idle" || status === "connecting") return "idle";
  return "results";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`w-3 h-3 ${i < full ? "text-amber-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-ink600 font-mono">{rating}</span>
    </div>
  );
}

function CompanyCard({ c }: { c: Company }) {
  return (
    <li
      className="group flex items-center gap-3 rounded-xl border border-line bg-white p-3 hover:border-beacon/50 hover:shadow-sm transition-all duration-150 cursor-pointer"
    >
      <div className={`${c.avatarColor} h-10 w-10 rounded-xl flex items-center justify-center shrink-0`}>
        <span className="text-white text-xs font-bold tracking-wide">{c.initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-ink900 truncate leading-tight">{c.name}</span>
          {c.badge && (
            <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${c.badgeColor}`}>
              {c.badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-ink400 truncate mt-0.5">{c.cities}</p>
        <StarRating rating={c.rating} />
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm font-semibold text-ink600">{c.priceRange}</span>
      </div>
    </li>
  );
}

/** Skeleton card shown while searching */
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <li
      className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-10 w-10 rounded-xl bg-line shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-line rounded w-3/4" />
        <div className="h-2.5 bg-line rounded w-1/2" />
        <div className="h-2.5 bg-line rounded w-1/3" />
      </div>
      <div className="h-3 w-6 bg-line rounded shrink-0" />
    </li>
  );
}

/** Searching state — animated status bar + skeletons */
function SearchingState({ routeInfo }: { routeInfo: { departure: string | null; arrival: string | null } }) {
  const steps = [
    "Analyse du projet en cours…",
    "Recherche de transporteurs…",
    "Comparaison des tarifs…",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % steps.length), 1800);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 rounded-xl border border-beacon/30 bg-beacon/5 px-3 py-2.5">
        <div className="shrink-0 h-6 w-6 rounded-full border-2 border-beacon/30 border-t-beacon animate-spin" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-beacon leading-tight truncate">{steps[step]}</p>
          <p className="text-[10px] text-ink400 mt-0.5">Alex interroge le réseau NEXTCITYS</p>
        </div>
      </div>

      {/* Show detected cities as they come in */}
      {(routeInfo.departure || routeInfo.arrival) && (
        <div className="flex items-center gap-2 rounded-xl border border-confirmed/30 bg-confirmed/5 px-3 py-2">
          <svg className="w-3.5 h-3.5 text-confirmed shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-[11px] text-confirmed font-semibold truncate">
            {routeInfo.departure && routeInfo.arrival
              ? `${routeInfo.departure} → ${routeInfo.arrival}`
              : routeInfo.departure
              ? `Départ : ${routeInfo.departure}`
              : `Arrivée : ${routeInfo.arrival}`}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {[0, 120, 240, 360, 480].map((delay) => (
          <SkeletonCard key={delay} delay={delay} />
        ))}
      </ul>
    </div>
  );
}

/** Idle state — shown before call starts */
function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
      <div className="h-12 w-12 rounded-2xl bg-line flex items-center justify-center">
        <svg className="w-5 h-5 text-ink400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-ink600">Transporteurs disponibles</p>
      <p className="text-xs text-ink400 max-w-[22ch] leading-relaxed">
        Les résultats apparaîtront pendant l&apos;appel avec Alex.
      </p>
    </div>
  );
}

/** Results state — staggered card reveal */
function ResultsState() {
  return (
    <>
      <ul className="space-y-2">
        {COMPANIES.map((c) => (
          <CompanyCard key={c.id} c={c} />
        ))}
      </ul>
      <p className="mt-4 text-center text-[10px] font-mono tracking-wider text-ink400 uppercase">
        Données illustratives · Devis réels via Alex
      </p>
    </>
  );
}

// ── Panel header ──────────────────────────────────────────────────────────────

function PanelHeader({ panelState, count }: { panelState: PanelState; count: number }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-white shrink-0">
      <div className="flex items-center gap-2">
        {panelState === "searching" ? (
          <div className="h-2 w-2 rounded-full bg-beacon animate-pulse" />
        ) : panelState === "results" ? (
          <div className="h-2 w-2 rounded-full bg-confirmed" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-line" />
        )}
        <h2 className="font-display text-sm text-ink900 tracking-tight">
          Transporteurs disponibles
        </h2>
      </div>

      {panelState === "searching" && (
        <span className="text-[10px] font-mono text-beacon animate-pulse">RECHERCHE…</span>
      )}
      {panelState === "results" && (
        <span className="text-[10px] font-mono font-semibold bg-beacon/10 text-beacon px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

// ── Exports ───────────────────────────────────────────────────────────────────

export function CompaniesSidebar({ status, routeInfo }: PanelProps) {
  const panelState = usePanelState(status);

  return (
    <aside className="hidden lg:flex flex-col rounded-2xl bg-paper border border-line overflow-hidden h-full">
      <PanelHeader panelState={panelState} count={COMPANIES.length} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {panelState === "idle" && <IdleState />}
        {panelState === "searching" && <SearchingState routeInfo={routeInfo} />}
        {panelState === "results" && <ResultsState />}
      </div>
    </aside>
  );
}

export function CompaniesBottomSheet({ status, routeInfo }: PanelProps) {
  const [open, setOpen] = useState(false);
  const panelState = usePanelState(status);
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    if (panelState === "results" && !autoOpened) {
      setOpen(true);
      setAutoOpened(true);
    }
    if (status === "idle") setAutoOpened(false);
  }, [panelState, autoOpened, status]);

  const triggerLabel =
    panelState === "idle" ? "Transporteurs disponibles" :
    panelState === "searching" ? "Recherche en cours…" :
    `${COMPANIES.length} transporteurs trouvés`;

  const triggerSub =
    panelState === "idle" ? "Disponible pendant l'appel" :
    panelState === "searching" ? "Alex interroge le réseau" :
    "Voir les entreprises partenaires";

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 shadow-sm hover:border-beacon/40 hover:shadow-md transition-all duration-150 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${panelState === "searching" ? "bg-beacon/10" : panelState === "results" ? "bg-confirmed/10" : "bg-line"}`}>
            {panelState === "searching" ? (
              <div className="h-4 w-4 rounded-full border-2 border-beacon/30 border-t-beacon animate-spin" />
            ) : (
              <svg className={`w-4 h-4 ${panelState === "results" ? "text-confirmed" : "text-ink400"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 18L4 12l4-6M16 6l4 6-4 6M12 4v16" />
              </svg>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-ink900 leading-tight">{triggerLabel}</p>
            <p className="text-[11px] text-ink400 mt-0.5">{triggerSub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {panelState === "results" && (
            <span className="text-[10px] font-mono font-semibold bg-beacon/10 text-beacon px-2 py-0.5 rounded-full">
              {COMPANIES.length}
            </span>
          )}
          <svg className="w-4 h-4 text-ink400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-paper border-t border-line shadow-2xl max-h-[80vh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-line" />
            </div>
            <PanelHeader panelState={panelState} count={COMPANIES.length} />
            <div className="overflow-y-auto flex-1 px-4 py-4">
              {panelState === "idle" && <IdleState />}
              {panelState === "searching" && <SearchingState routeInfo={routeInfo} />}
              {panelState === "results" && <ResultsState />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
