/**
 * When the banner is up and what it says. Pure: no DOM, no clock of its own,
 * so every case can be tested by passing a time in.
 */

/** Default lead time; the person can pick another in the extension's popup. */
export const LEAD_MS = 5 * 60_000;
/** The banner turns urgent for the final minute. */
export const URGENT_MS = 60_000;
/** After the end time it says so, then clears itself. */
export const LINGER_MS = 2 * 60_000;

export type Tone = 'soon' | 'urgent' | 'ended';

export interface BannerView {
  tone: Tone;
  title: string;
  /** Live countdown, "4:59", or null once the call has run out. */
  countdown: string | null;
  endMs: number;
}

export function remainingLabel(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function titleFor(remaining: number): string {
  if (remaining <= 0) return 'Meeting time is up';
  if (remaining <= URGENT_MS) return 'Less than a minute left';
  const minutes = Math.ceil(remaining / 60_000);
  return `${minutes} minutes left in this meeting`;
}

/**
 * Tracks one meeting's reminder. Dismissing hides it for the current end time
 * only: if the event is moved later, the reminder arms again for the new end.
 */
export class Reminder {
  private dismissedFor: number | null = null;
  leadMs: number;

  constructor(leadMs = LEAD_MS) {
    this.leadMs = leadMs;
  }

  dismiss(endMs: number): void {
    this.dismissedFor = endMs;
  }

  view(endMs: number | null, now: number): BannerView | null {
    if (endMs === null || this.dismissedFor === endMs) return null;
    const remaining = endMs - now;
    if (remaining > this.leadMs || remaining <= -LINGER_MS) return null;

    const tone: Tone = remaining <= 0 ? 'ended' : remaining <= URGENT_MS ? 'urgent' : 'soon';
    return {
      tone,
      title: titleFor(remaining),
      countdown: remaining > 0 ? remainingLabel(remaining) : null,
      endMs,
    };
  }
}
