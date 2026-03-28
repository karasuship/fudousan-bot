/**
 * Lightweight analytics helper.
 * Sends to window.gtag if present, window.dataLayer if present,
 * or console.debug in dev. Never throws.
 * Swap out the body of `track()` to integrate any real analytics SDK.
 */

type AnalyticsEvent =
  | "diagnosis_started"
  | "diagnosis_completed"
  | "result_cta_viewed"
  | "result_cta_clicked"
  | "email_lock_viewed"
  | "email_preview_copied"
  | "purchase_started"
  | "purchase_completed";

type Payload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (cmd: string, name: string, params?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, payload?: Payload): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, payload as Record<string, unknown>);
      return;
    }
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...payload });
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, payload);
    }
  } catch {
    // analytics must never throw
  }
}
