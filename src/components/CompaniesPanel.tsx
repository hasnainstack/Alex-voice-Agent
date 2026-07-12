//CompaniesPanel.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { CallStatus, RouteInfo, ServiceOption } from "@/types/call";

interface Company {
  id: string;
  name: string;
  cities: string;
  rating: number;
  reviews: number;
  priceRange: string;
  startingPrice: string;
  availability: string;
  badge?: string;
  badgeColor?: string;
  initials: string;
  avatarColor: string;
  specialties: string[];
  international: boolean;
}

const COMPANIES: Company[] = [
  { id: "1", name: "TransEurope Déménagement", cities: "Paris · Lyon · Bruxelles", rating: 4.9, reviews: 2847, priceRange: "€€€", startingPrice: "À partir de 690 €", availability: "Disponible aujourd'hui", badge: "PREMIUM", badgeColor: "bg-amber-100 text-amber-700", initials: "TE", avatarColor: "bg-blue-600", specialties: ["International", "Piano", "Œuvres d'art"], international: true },
  { id: "2", name: "MoveFast Express", cities: "Paris · Marseille · Lyon", rating: 4.8, reviews: 1934, priceRange: "€€", startingPrice: "À partir de 420 €", availability: "Disponible aujourd'hui", badge: "24/7", badgeColor: "bg-green-100 text-green-700", initials: "MF", avatarColor: "bg-orange-500", specialties: ["Urgence", "Express", "Appartement"], international: false },
  { id: "3", name: "Alliance Déménageurs", cities: "Île-de-France · Orléans", rating: 4.6, reviews: 1240, priceRange: "€€", startingPrice: "À partir de 390 €", availability: "Disponible le 14 juillet", badge: "FAMILLE", badgeColor: "bg-sky-100 text-sky-700", initials: "AD", avatarColor: "bg-violet-600", specialties: ["Maison", "Appartement", "Famille"], international: false },
  { id: "4", name: "EuroReloc Pro", cities: "Paris · Amsterdam · Berlin", rating: 4.8, reviews: 1612, priceRange: "€€€", startingPrice: "À partir de 780 €", availability: "Disponible le 15 juillet", badge: "EUROPE", badgeColor: "bg-indigo-100 text-indigo-700", initials: "ER", avatarColor: "bg-sky-600", specialties: ["International", "Entreprise", "Longue distance"], international: true },
  { id: "5", name: "Déménagement Solidaire", cities: "France entière", rating: 4.5, reviews: 876, priceRange: "€", startingPrice: "À partir de 310 €", availability: "Créneaux limités", badge: "ÉCO", badgeColor: "bg-green-100 text-green-700", initials: "DS", avatarColor: "bg-emerald-600", specialties: ["Petit budget", "Étudiants", "Écologique"], international: false },
  { id: "6", name: "Prestige Moving Group", cities: "Paris · Nice · Monaco", rating: 5.0, reviews: 932, priceRange: "€€€€", startingPrice: "À partir de 1 150 €", availability: "Disponible le 18 juillet", badge: "LUXE", badgeColor: "bg-yellow-100 text-yellow-700", initials: "PM", avatarColor: "bg-yellow-600", specialties: ["Villa", "Luxe", "Objets précieux"], international: true },
  { id: "7", name: "CityMove Paris", cities: "Paris · Banlieue", rating: 4.4, reviews: 1410, priceRange: "€€", startingPrice: "À partir de 350 €", availability: "Disponible le 13 juillet", badge: "PARIS", badgeColor: "bg-rose-100 text-rose-700", initials: "CM", avatarColor: "bg-rose-500", specialties: ["Local", "Appartement", "Ascenseur"], international: false },
  { id: "8", name: "Iberia Transports", cities: "Paris · Barcelone · Lisbonne", rating: 4.7, reviews: 1086, priceRange: "€€€", startingPrice: "À partir de 720 €", availability: "Disponible le 17 juillet", badge: "ESPAGNE", badgeColor: "bg-red-100 text-red-700", initials: "IT", avatarColor: "bg-indigo-500", specialties: ["Espagne", "Portugal", "International"], international: true },
  { id: "9", name: "Atlas Logistique", cities: "Lyon · Grenoble · Dijon", rating: 4.8, reviews: 1507, priceRange: "€€€", startingPrice: "À partir de 640 €", availability: "Très demandé", badge: "PIANO", badgeColor: "bg-purple-100 text-purple-700", initials: "AL", avatarColor: "bg-purple-600", specialties: ["Piano", "Coffre-fort", "Objets lourds"], international: false },
  { id: "10", name: "GreenMove France", cities: "Paris · Lille · Nantes", rating: 4.7, reviews: 985, priceRange: "€€", startingPrice: "À partir de 450 €", availability: "Disponible le 16 juillet", badge: "100% ÉLECTRIQUE", badgeColor: "bg-lime-100 text-lime-700", initials: "GM", avatarColor: "bg-lime-600", specialties: ["Écologique", "Camions électriques", "Recyclage"], international: false },
  { id: "11", name: "NordSud Relocation", cities: "Lille · Paris · Marseille", rating: 4.6, reviews: 1378, priceRange: "€€", startingPrice: "À partir de 560 €", availability: "Disponible le 19 juillet", badge: "NATIONAL", badgeColor: "bg-cyan-100 text-cyan-700", initials: "NS", avatarColor: "bg-cyan-600", specialties: ["France entière", "Longue distance", "Famille"], international: false },
  { id: "12", name: "Elite Business Movers", cities: "Paris · Lyon · Toulouse", rating: 4.9, reviews: 2146, priceRange: "€€€€", startingPrice: "À partir de 980 €", availability: "Disponible le 21 juillet", badge: "BUSINESS", badgeColor: "bg-slate-100 text-slate-700", initials: "EB", avatarColor: "bg-slate-700", specialties: ["Bureaux", "Serveurs", "Entreprises"], international: true },
];

type PanelState = "idle" | "searching" | "results";

interface PanelProps {
  status: CallStatus;
  routeInfo: RouteInfo;
}

function usePanelState(status: CallStatus, routeInfo: RouteInfo): PanelState {
  if (status === "idle" || status === "connecting") return "idle";
  const hasAnyCity = Boolean(routeInfo.departure || routeInfo.arrival);
  const hasBothCities = Boolean(routeInfo.departure && routeInfo.arrival);
  if (status === "active") {
    if (hasBothCities) return "results";
    if (hasAnyCity) return "searching";
    return "idle";
  }
  return hasAnyCity ? "results" : "idle";
}

// ── Relevance matching ──────────────────────────────────────────────────────
// Ranks companies by whether their coverage actually includes the cities
// Alex has learned, instead of showing a static list in a fixed order. This
// is what makes "we compared several movers for YOUR route" true rather than
// decorative — the same principle behind not announcing a count upfront.

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (é -> e, etc.)
    .toLowerCase()
    .trim();
}

function matchesCity(companyCities: string, city: string | null): boolean {
  if (!city) return false;
  const normCities = normalize(companyCities);
  const normCity = normalize(city);
  return normCities.includes(normCity) || normCities.includes("france entiere");
}

const FRENCH_CITIES = new Set([
  "paris", "lyon", "marseille", "toulouse", "nice", "nantes", "bordeaux",
  "lille", "strasbourg", "rennes", "grenoble", "dijon", "orleans", "monaco",
  "banlieue", "ile-de-france", "rhone-alpes", "france",
]);

function isInternationalRoute(routeInfo: RouteInfo): boolean {
  const dep = normalize(routeInfo.departure ?? "");
  const arr = normalize(routeInfo.arrival ?? "");
  // If either city is unknown or not in the French list, treat as international
  const depFrench = !dep || FRENCH_CITIES.has(dep) || dep.includes("france");
  const arrFrench = !arr || FRENCH_CITIES.has(arr) || arr.includes("france");
  return !depFrench || !arrFrench;
}

const SERVICE_SPECIALTY_MAP: Record<NonNullable<ServiceOption>, string[]> = {
  economy:  ["Petit budget", "Étudiants", "Écologique", "Economy", "Express"],
  standard: ["Appartement", "Famille", "Maison", "Local", "Standard"],
  comfort:  ["Luxe", "Villa", "Objets précieux", "Piano", "Coffre-fort", "Objets lourds", "Premium"],
  storage:  ["Garde-meubles", "Storage", "Stockage"],
};

function rankCompanies(companies: Company[], routeInfo: RouteInfo): Array<Company & { isMatch: boolean; serviceMatch: boolean }> {
  const intl = isInternationalRoute(routeInfo);
  const serviceSpecialties = routeInfo.service ? SERVICE_SPECIALTY_MAP[routeInfo.service] : null;

  const scored = companies.map((c) => {
    let score = 0;
    if (intl) {
      if (c.international) score += 4;
    } else {
      if (matchesCity(c.cities, routeInfo.departure)) score += 2;
      if (matchesCity(c.cities, routeInfo.arrival)) score += 2;
    }
    const serviceMatch = serviceSpecialties
      ? c.specialties.some((s) => serviceSpecialties.some((ss) => normalize(s).includes(normalize(ss))))
      : false;
    if (serviceMatch) score += 3;
    score += c.rating / 10;
    return { ...c, isMatch: score >= 2, serviceMatch, _score: score };
  });

  return scored
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...rest }) => rest);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
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
      <span className="text-[10px] text-ink400">({reviews.toLocaleString("fr-FR")})</span>
    </div>
  );
}

/** Colors the availability line based on urgency — matches the tone of what it says. */
function AvailabilityTag({ availability }: { availability: string }) {
  const isToday = availability.includes("aujourd'hui");
  const isScarce = availability.includes("Créneaux limités") || availability.includes("demandé");

  const dotColor = isToday ? "bg-confirmed" : isScarce ? "bg-amber-500" : "bg-ink400";
  const textColor = isToday ? "text-confirmed" : isScarce ? "text-amber-600" : "text-ink400";

  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span className={`text-[10px] ${textColor}`}>{availability}</span>
    </div>
  );
}

function SpecialtyTags({ specialties }: { specialties: string[] }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {specialties.slice(0, 3).map((s) => (
        <span
          key={s}
          className="text-[9px] font-medium text-ink600 bg-paper border border-line rounded-full px-1.5 py-0.5"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function CompanyCard({ c }: { c: Company & { isMatch: boolean; serviceMatch: boolean } }) {
  return (
    <li
      className={`group flex flex-col gap-2 rounded-xl border p-3 hover:shadow-sm transition-all duration-150 cursor-pointer ${
        c.serviceMatch ? "border-confirmed/50 bg-confirmed/5" :
        c.isMatch      ? "border-beacon/40 bg-beacon/5" :
                         "border-line bg-white hover:border-beacon/50"
      }`}
    >
      <div className="flex items-start gap-3">
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
            {c.serviceMatch && (
              <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full shrink-0 bg-confirmed text-white">
                SERVICE CHOISI
              </span>
            )}
            {!c.serviceMatch && c.isMatch && (
              <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full shrink-0 bg-beacon text-white">
                SUR VOTRE TRAJET
              </span>
            )}
          </div>
          <p className="text-[11px] text-ink400 truncate mt-0.5">{c.cities}</p>
          <StarRating rating={c.rating} reviews={c.reviews} />
        </div>
        <div className="shrink-0 text-right">
          <span className="text-sm font-semibold text-ink600">{c.priceRange}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pl-[52px]">
        <span className="text-[11px] font-medium text-ink900">{c.startingPrice}</span>
        <AvailabilityTag availability={c.availability} />
      </div>

      <div className="pl-[52px]">
        <SpecialtyTags specialties={c.specialties} />
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
function SearchingState({ routeInfo }: { routeInfo: RouteInfo }) {
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

const SERVICE_LABELS: Record<NonNullable<ServiceOption>, string> = {
  economy:  "Formule Économique",
  standard: "Formule Standard",
  comfort:  "Formule Confort",
  storage:  "Option Garde-meubles",
};

/** Results state — ranks matches to the caller's actual route first */
function ResultsState({ routeInfo }: { routeInfo: RouteInfo }) {
  const ranked = useMemo(() => rankCompanies(COMPANIES, routeInfo), [routeInfo]);
  const matchCount = ranked.filter((c) => c.isMatch || c.serviceMatch).length;

  return (
    <>
      {/* Context chips — show what we know so far */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {routeInfo.date && (
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-ink/5 border border-line rounded-full px-2 py-1">
            <svg className="w-3 h-3 text-ink400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {routeInfo.date}
          </span>
        )}
        {routeInfo.service && (
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-confirmed/10 border border-confirmed/20 text-confirmed rounded-full px-2 py-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {SERVICE_LABELS[routeInfo.service]}
          </span>
        )}
      </div>

      {matchCount > 0 && (
        <p className="text-[11px] text-ink400 mb-3">
          <span className="font-semibold text-beacon">{matchCount}</span> transporteur
          {matchCount > 1 ? "s" : ""} correspond{matchCount > 1 ? "ent" : ""} à votre recherche.
        </p>
      )}
      <ul className="space-y-2">
        {ranked.map((c) => (
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
  const panelState = usePanelState(status, routeInfo);

  return (
    <aside className="hidden lg:flex flex-col rounded-2xl bg-paper border border-line overflow-hidden h-full">
      <PanelHeader panelState={panelState} count={COMPANIES.length} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {panelState === "idle" && <IdleState />}
        {panelState === "searching" && <SearchingState routeInfo={routeInfo} />}
        {panelState === "results" && <ResultsState routeInfo={routeInfo} />}
      </div>
    </aside>
  );
}

export function CompaniesBottomSheet({ status, routeInfo }: PanelProps) {
  const [open, setOpen] = useState(false);
  const panelState = usePanelState(status, routeInfo);
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
              {panelState === "results" && <ResultsState routeInfo={routeInfo} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
