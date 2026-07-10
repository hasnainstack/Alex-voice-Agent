"use client";

import { useState } from "react";

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
  {
    id: "1", name: "TransEurope Déménagement", cities: "Paris · Lyon · Bruxelles",
    rating: 4.8, priceRange: "€€€", badge: "TOP", badgeColor: "bg-amber-100 text-amber-700",
    initials: "TE", avatarColor: "bg-blue-600",
  },
  {
    id: "2", name: "MoveFast Express", cities: "Paris · Marseille · Madrid",
    rating: 4.6, priceRange: "€€", badge: "RAPIDE", badgeColor: "bg-orange-100 text-orange-700",
    initials: "MF", avatarColor: "bg-orange-500",
  },
  {
    id: "3", name: "Alliance Déménageurs", cities: "Île-de-France · Rhône-Alpes",
    rating: 4.5, priceRange: "€€",
    initials: "AD", avatarColor: "bg-violet-600",
  },
  {
    id: "4", name: "EuroReloc Pro", cities: "Paris · Amsterdam · Berlin",
    rating: 4.7, priceRange: "€€€",
    initials: "ER", avatarColor: "bg-sky-600",
  },
  {
    id: "5", name: "Déménagement Solidaire", cities: "France entière",
    rating: 4.4, priceRange: "€", badge: "ÉCO", badgeColor: "bg-green-100 text-green-700",
    initials: "DS", avatarColor: "bg-emerald-600",
  },
  {
    id: "6", name: "Prestige Moving Group", cities: "Paris · Nice · Monaco",
    rating: 4.9, priceRange: "€€€€", badge: "PREMIUM", badgeColor: "bg-yellow-100 text-yellow-700",
    initials: "PM", avatarColor: "bg-yellow-600",
  },
  {
    id: "7", name: "CityMove Paris", cities: "Grand Paris · Banlieue",
    rating: 4.3, priceRange: "€€",
    initials: "CM", avatarColor: "bg-rose-500",
  },
  {
    id: "8", name: "Iberia Transports", cities: "Paris · Barcelone · Lisbonne",
    rating: 4.5, priceRange: "€€",
    initials: "IT", avatarColor: "bg-indigo-500",
  },
];

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${i < full ? "text-amber-400" : "text-gray-300"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
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
    <li className="group flex items-center gap-3 rounded-xl border border-line bg-white p-3 hover:border-beacon/50 hover:shadow-sm transition-all duration-150 cursor-pointer">
      {/* Avatar */}
      <div className={`${c.avatarColor} h-10 w-10 rounded-xl flex items-center justify-center shrink-0`}>
        <span className="text-white text-xs font-bold tracking-wide">{c.initials}</span>
      </div>

      {/* Info */}
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

      {/* Price */}
      <div className="shrink-0 text-right">
        <span className="text-sm font-semibold text-ink600">{c.priceRange}</span>
      </div>
    </li>
  );
}

function PanelContent() {
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

// ── Desktop sidebar ──────────────────────────────────────────────────────────
export function CompaniesSidebar() {
  return (
    <aside className="hidden lg:flex flex-col rounded-2xl bg-paper border border-line overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-white">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-confirmed" />
          <h2 className="font-display text-sm text-ink900 tracking-tight">
            Transporteurs disponibles
          </h2>
        </div>
        <span className="text-[10px] font-mono font-semibold bg-beacon/10 text-beacon px-2 py-0.5 rounded-full">
          {COMPANIES.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
        <PanelContent />
      </div>
    </aside>
  );
}

// ── Mobile bottom sheet ──────────────────────────────────────────────────────
export function CompaniesBottomSheet() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 shadow-sm hover:border-beacon/40 hover:shadow-md transition-all duration-150 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-beacon/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-beacon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 18L4 12l4-6M16 6l4 6-4 6M12 4v16" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-ink900 leading-tight">Transporteurs disponibles</p>
            <p className="text-[11px] text-ink400 mt-0.5">Voir les {COMPANIES.length} entreprises partenaires</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono font-semibold bg-beacon/10 text-beacon px-2 py-0.5 rounded-full">
            {COMPANIES.length}
          </span>
          <svg className="w-4 h-4 text-ink400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-paper border-t border-line shadow-2xl max-h-[80vh]">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-line" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-line bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-confirmed" />
                <h2 className="font-display text-base text-ink900 tracking-tight">
                  Transporteurs disponibles
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full bg-paper border border-line flex items-center justify-center hover:bg-line transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-3.5 h-3.5 text-ink600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 px-4 py-4">
              <PanelContent />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
