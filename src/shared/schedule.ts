/**
 * The contract between the two scripts, and the sanity rules both apply.
 *
 * The page script (MAIN world) posts a schedule with window.postMessage. Any
 * script on the page can post the same shape, so the content script treats
 * every message as untrusted and re-checks it with the same rules.
 */

export const CHANNEL = 'greminder:schedule';

export interface Schedule {
  /** Scheduled start, epoch ms, when known. */
  startMs: number | null;
  /** Scheduled end, epoch ms. */
  endMs: number;
}

export interface ScheduleMessage extends Schedule {
  channel: typeof CHANNEL;
  /** Meeting code the schedule belongs to, so a stale post is ignored. */
  code: string;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** An end further than this from now is not the call in front of us. */
export const MAX_SKEW_MS = 12 * HOUR;
export const MIN_SPAN_MS = 5 * MINUTE;
export const MAX_SPAN_MS = 24 * HOUR;

/**
 * True when a schedule is shaped like the meeting happening right now.
 * Refusing anything else means a stray timestamp can never put a reminder on
 * a call that has no end time.
 */
export function isPlausible(schedule: Schedule, now: number): boolean {
  const { startMs, endMs } = schedule;
  if (!Number.isFinite(endMs) || Math.abs(endMs - now) > MAX_SKEW_MS) return false;
  if (startMs === null) return true;
  if (!Number.isFinite(startMs)) return false;
  const span = endMs - startMs;
  return span >= MIN_SPAN_MS && span <= MAX_SPAN_MS;
}

export function isScheduleMessage(data: unknown): data is ScheduleMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    msg['channel'] === CHANNEL &&
    typeof msg['code'] === 'string' &&
    typeof msg['endMs'] === 'number' &&
    (msg['startMs'] === null || typeof msg['startMs'] === 'number')
  );
}
