/**
 * Fundraising impact figures.
 *
 * Display only. Fundraising happens outside the app in this phase, so there is
 * deliberately **no payment gateway, no card handling and no donation flow**
 * here — which is also why this file carries no compliance burden. It exists so
 * a patient can see what the programme has achieved and what a contribution
 * buys.
 *
 * To update the numbers, edit the values below and ship a release.
 *
 * `REMOTE_IMPACT_URL` is the escape hatch from that release cycle: point it at
 * a small JSON file of the same shape and the app will prefer it, falling back
 * to these bundled figures whenever the fetch fails, times out, or returns
 * something unexpected. Left empty, the app makes no network request at all and
 * stays fully offline — which is the current default on purpose.
 */

export type ImpactFigures = {
  /** ISO 4217 code, e.g. 'INR' or 'USD'. */
  currency: string;
  /** Total raised, in major units. */
  raised: number;
  /** Spectacle frames funded so far. */
  framesFunded: number;
  /** What one frame costs, in the same currency. */
  costPerFrame: number;
  /** When these figures were last confirmed, `yyyy-MM-dd`. */
  asOf: string;
};

export const BUNDLED_IMPACT: ImpactFigures = {
  currency: 'USD',
  raised: 0,
  framesFunded: 0,
  costPerFrame: 5,
  asOf: '2026-09-10',
};

/** Empty disables remote lookup entirely — no request is made. */
export const REMOTE_IMPACT_URL = '';

/** How long to wait before giving up and using the bundled figures. */
const FETCH_TIMEOUT_MS = 4000;

function isImpactFigures(value: unknown): value is ImpactFigures {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<ImpactFigures>;
  return (
    typeof c.currency === 'string' &&
    typeof c.raised === 'number' &&
    Number.isFinite(c.raised) &&
    typeof c.framesFunded === 'number' &&
    Number.isFinite(c.framesFunded) &&
    typeof c.costPerFrame === 'number' &&
    c.costPerFrame > 0 &&
    typeof c.asOf === 'string'
  );
}

/**
 * The figures to display. Never throws and never leaves the caller without
 * something to show — a fundraising counter is not worth an error state.
 */
export async function loadImpact(): Promise<ImpactFigures> {
  if (REMOTE_IMPACT_URL.length === 0) return BUNDLED_IMPACT;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(REMOTE_IMPACT_URL, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) return BUNDLED_IMPACT;
    const parsed: unknown = await response.json();
    return isImpactFigures(parsed) ? parsed : BUNDLED_IMPACT;
  } catch {
    // Offline, timed out, or malformed — the bundled figures are still true.
    return BUNDLED_IMPACT;
  }
}

/** Formats an amount for display, falling back when the locale data is thin. */
export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}
