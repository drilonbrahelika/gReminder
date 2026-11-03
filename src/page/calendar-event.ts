import { firstMessage, firstNumber, readFields } from './protobuf.ts';
import type { Schedule } from '../shared/schedule.ts';

/**
 * Joining a scheduled meeting makes Meet fetch its calendar event:
 *
 *   POST /$rpc/google.rtc.meetings.v1.MeetingCalendarAgendaService/FetchCalendarEvent
 *
 * The response is a protobuf message, usually sent as base64 text. Decoded
 * from a live call:
 *
 *   1        event
 *   1.10.1   start  (google.protobuf.Timestamp.seconds)
 *   1.11.1   end    (google.protobuf.Timestamp.seconds)
 *
 * Field numbers are the anchor. They cannot change without breaking every
 * deployed Meet client, so they are far steadier than Meet's minified class
 * names. The event also holds the title, organiser and links; none of that is
 * read.
 */
export const CALENDAR_EVENT_URL_RE = /MeetingCalendarAgendaService\/FetchCalendarEvent/;

const EVENT = 1;
const START = 10;
const END = 11;
const SECONDS = 1;

function timestampMs(event: ReturnType<typeof readFields>, field: number): number | null {
  const ts = firstMessage(event, field);
  const seconds = ts ? firstNumber(ts, SECONDS) : null;
  return seconds !== null && seconds > 0 ? seconds * 1000 : null;
}

/** The schedule in a FetchCalendarEvent response, or null for an instant meeting. */
export function scheduleFromResponse(bytes: Uint8Array): Schedule | null {
  const event = firstMessage(readFields(bytes), EVENT);
  if (!event) return null;
  const endMs = timestampMs(event, END);
  if (endMs === null) return null;
  return { startMs: timestampMs(event, START), endMs };
}

const BASE64_RE = /^[A-Za-z0-9+/_-]+={0,2}$/;

/**
 * The body as protobuf bytes. Meet sends base64 text today; raw binary is
 * accepted too so a transport change does not silently break the read.
 */
export function responseBytes(body: ArrayBuffer): Uint8Array | null {
  const raw = new Uint8Array(body);
  if (raw.length === 0) return null;

  const text = new TextDecoder('latin1').decode(raw).trim();
  if (!BASE64_RE.test(text)) return raw;
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  } catch {
    return raw;
  }
}
