// Dynamic import — Vapi SDK is NOT in the main bundle.
// It is fetched and parsed only when preloadVapi() is called.
// This removes ~200ms of parse cost from the initial page load.

let vapiPromise: Promise<import("@vapi-ai/web").default> | null = null;
let vapiInstance: import("@vapi-ai/web").default | null = null;

// ── Timestamps ────────────────────────────────────────────────────────────────
// Exported so the hook can stamp call-start and speech-start against them.
export const T: Record<string, number> = {};

function stamp(key: string) {
  T[key] = performance.now();
}

function delta(from: string, to: string): string {
  const a = T[from];
  const b = T[to];
  if (a == null || b == null) return "?ms";
  return `${Math.round(b - a)}ms`;
}

export function logTimings() {
  console.group("[vapi timings]");
  console.log(`page-load  → hover-prefetch : ${delta("pageLoad",    "prefetch")}`);
  console.log(`hover      → sdk-ready      : ${delta("prefetch",    "sdkReady")}`);
  console.log(`click      → mic-granted    : ${delta("click",       "micGranted")}`);
  console.log(`click      → vapi.start()   : ${delta("click",       "vapiStart")}`);
  console.log(`vapi.start → call-start     : ${delta("vapiStart",   "callStart")}`);
  console.log(`call-start → speech-start   : ${delta("callStart",   "speechStart")}`);
  console.log(`TOTAL click → first audio   : ${delta("click",       "speechStart")}`);
  console.groupEnd();
}

// Stamp page load immediately
if (typeof window !== "undefined") {
  stamp("pageLoad");
  // Pre-fetch the SDK JS bundle on first pointer movement so it's parsed
  // and ready before the user clicks. Does NOT construct the Vapi instance
  // (no DOM injection yet) — construction happens in preloadVapi().
  const onFirstMove = () => {
    window.removeEventListener("pointermove", onFirstMove);
    import("@vapi-ai/web").catch(() => {});
  };
  window.addEventListener("pointermove", onFirstMove, { passive: true });
}

// ── SDK loader ────────────────────────────────────────────────────────────────

/**
 * Dynamically imports the Vapi SDK and constructs the singleton.
 * Safe to call multiple times — returns the same promise.
 * Call on hover/modal-open so the SDK is ready before the user clicks Start.
 */
export function preloadVapi(): Promise<import("@vapi-ai/web").default> {
  if (vapiInstance) return Promise.resolve(vapiInstance);
  if (vapiPromise)  return vapiPromise;

  stamp("prefetch");

  vapiPromise = import("@vapi-ai/web").then(({ default: Vapi }) => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) throw new Error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set.");
    vapiInstance = new Vapi(publicKey);
    stamp("sdkReady");
    console.log(`[vapi] SDK ready — parse+init took ${delta("prefetch", "sdkReady")}`);
    return vapiInstance;
  });

  return vapiPromise;
}

/**
 * Returns the already-constructed singleton.
 * Throws if preloadVapi() was never awaited — call preloadVapi() first.
 */
export function getVapiClient(): import("@vapi-ai/web").default {
  if (typeof window === "undefined") throw new Error("Browser only.");
  if (!vapiInstance) throw new Error("Call preloadVapi() before getVapiClient().");
  return vapiInstance;
}

export function getAssistantId(): string {
  const id = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  if (!id) throw new Error("NEXT_PUBLIC_VAPI_ASSISTANT_ID is not set.");
  return id;
}

/**
 * Single entry point — call on the earliest user gesture before Start.
 * Only preloads the SDK; mic is left entirely to Vapi to avoid stream conflicts.
 */
export async function prewarmAll(): Promise<void> {
  await preloadVapi();
}
