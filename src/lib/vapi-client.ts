import Vapi from "@vapi-ai/web";

let client: Vapi | null = null;

/**
 * Returns a singleton Vapi client instance.
 * Lazily constructed so it's never touched during SSR (Vapi's SDK expects
 * a browser environment — window/mic access — which doesn't exist server-side).
 */
export function getVapiClient(): Vapi {
  if (typeof window === "undefined") {
    throw new Error("getVapiClient() must only be called in the browser.");
  }

  if (!client) {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error(
        "NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set. Copy .env.example to .env.local and fill it in."
      );
    }
    client = new Vapi(publicKey);
  }

  return client;
}

export function getAssistantId(): string {
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  if (!assistantId) {
    throw new Error(
      "NEXT_PUBLIC_VAPI_ASSISTANT_ID is not set. Copy .env.example to .env.local and fill it in."
    );
  }
  return assistantId;
}
