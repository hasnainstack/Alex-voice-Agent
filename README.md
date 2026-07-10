# NEXTCITYS DÉMÉNAGEMENT — Vapi demo frontend

A Next.js 14 / TypeScript / Tailwind frontend for a client-facing demo of
Alex, the NEXTCITYS voice agent, built on [Vapi](https://vapi.ai)'s Web SDK.

This is a standard multi-file Next.js App Router project — not a single HTML
file — so it can grow into a real product frontend rather than a throwaway
prototype.

## Project structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout — loads fonts, sets metadata
│   ├── page.tsx           # Main page — assembles all components
│   └── globals.css        # Tailwind directives + accessibility defaults
├── components/
│   ├── DispatchHeader.tsx    # Shipping-label style header + error banner
│   ├── RouteVisualizer.tsx   # Signature element — animated route/beacon
│   ├── CallControls.tsx      # Start/end call buttons + duration readout
│   └── TranscriptLog.tsx     # Live transcript, manifest-ledger style
├── hooks/
│   └── useVapiCall.ts     # Owns all Vapi event wiring and call state
├── lib/
│   └── vapi-client.ts     # Singleton Vapi client, browser-only guard
└── types/
    └── call.ts             # Shared types: CallStatus, TranscriptEntry, etc.
```

Each piece has one job: `lib/` never touches React, `hooks/` never touches
JSX, `components/` never talks to Vapi directly — they only receive props
and callbacks from the hook. This keeps the Vapi integration swappable
(e.g. if you ever move off Vapi) without rewriting the UI.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Vapi credentials (see below), then:

```bash
npm run dev
```

Open **http://localhost:3000**.

## Getting your Vapi credentials

1. Sign up / log in at [dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Create an assistant — this is where you'd paste the NEXTCITYS system
   prompt (personality, tone, question pacing, price-deflection script,
   guardrails) from your existing script.
3. Copy your **Public Key** (Settings → API Keys) into
   `NEXT_PUBLIC_VAPI_PUBLIC_KEY`. This key is safe to expose client-side —
   it's scoped specifically for browser calls, unlike your private key.
4. Copy the **Assistant ID** into `NEXT_PUBLIC_VAPI_ASSISTANT_ID`.

## On the price-guardrail

Unlike the self-hosted Pipecat pipeline (where the guardrail is a
deterministic regex filter you control directly), Vapi is a managed
platform — the guardrail logic needs to live in the assistant's system
prompt and/or Vapi's own function-calling / guardrail features on their
dashboard, not in this frontend. This frontend only renders whatever the
assistant says; it doesn't intercept or filter it. If a hard guarantee
against quoting prices matters as much here as it did in the Pipecat
version, that's worth verifying directly against Vapi's current guardrail
capabilities before treating this as equivalent — happy to dig into that
specifically if you want.

## Design notes

The visual identity is built around a **dispatch manifest** concept rather
than a generic voice-assistant orb — a route line between departure and
arrival cities, with a beacon that travels it while the call is live,
mirrors an actual freight waybill tracker. Typography pairs Big Shoulders
Display (condensed, freight-signage character) with IBM Plex Sans for body
text and IBM Plex Mono for timestamps, call duration, and the waybill
number — leaning into the logistics identity throughout rather than using
generic UI chrome.

## Known gaps / next steps

- [ ] Wire the departure/arrival city labels in `RouteVisualizer` to actual
      values extracted from the conversation (currently static placeholders —
      would need a Vapi function-call/tool to extract structured fields
      mid-call, similar to what the post-call email step needed in the
      Pipecat version).
- [ ] Confirm Vapi's transcript message shape matches `types/call.ts`
      exactly for your assistant's configured transcriber — different
      providers can shape the `message` event slightly differently.
- [ ] Add a post-call summary view (reuses the same "email the client a
      summary" requirement from the original script).
- [ ] Production deployment: standard Next.js hosting (Vercel is the path
      of least resistance) — no WebRTC/TURN server concerns here since
      Vapi hosts that infrastructure for you, unlike the self-hosted
      Pipecat/SmallWebRTCTransport version.
