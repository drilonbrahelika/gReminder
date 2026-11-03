/**
 * MAIN-world script, injected at document_start.
 *
 * Watches for the calendar-event request Meet makes on its own when a
 * scheduled call is joined, and passes the schedule to the content script.
 * It has to live in the page's world, because the isolated content-script
 * world cannot see the page's fetch or XHR.
 *
 * Read-only by construction: every request and response passes through
 * untouched, only a clone of the response is read, and only two timestamps
 * ever leave this script.
 */
import { CALENDAR_EVENT_URL_RE, responseBytes, scheduleFromResponse } from './calendar-event.ts';
import { meetingCode } from '../shared/meet.ts';
import { CHANNEL, isPlausible, type ScheduleMessage } from '../shared/schedule.ts';

function publish(body: ArrayBuffer): void {
  const code = meetingCode(location.pathname);
  if (!code) return;

  let schedule;
  try {
    const bytes = responseBytes(body);
    schedule = bytes && scheduleFromResponse(bytes);
  } catch {
    return; // malformed: say nothing rather than guess
  }
  if (!schedule || !isPlausible(schedule, Date.now())) return;

  const message: ScheduleMessage = { channel: CHANNEL, code, ...schedule };
  window.postMessage(message, location.origin);
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

const pageFetch = window.fetch;
window.fetch = function (this: unknown, ...args: Parameters<typeof fetch>) {
  const pending = pageFetch.apply(this, args);
  if (CALENDAR_EVENT_URL_RE.test(requestUrl(args[0]))) {
    pending
      .then((res) => res.clone().arrayBuffer())
      .then(publish)
      .catch(() => {});
  }
  return pending;
} as typeof fetch;

const xhrUrls = new WeakMap<XMLHttpRequest, string>();
const pageOpen = XMLHttpRequest.prototype.open;
const pageSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (
  this: XMLHttpRequest,
  ...args: [method: string, url: string | URL, ...rest: unknown[]]
) {
  xhrUrls.set(this, String(args[1]));
  return (pageOpen as (...a: unknown[]) => void).apply(this, args);
};

XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: Parameters<XMLHttpRequest['send']>) {
  if (CALENDAR_EVENT_URL_RE.test(xhrUrls.get(this) ?? '')) {
    this.addEventListener('load', () => {
      try {
        if (this.responseType === '' || this.responseType === 'text') {
          publish(new TextEncoder().encode(this.responseText).buffer as ArrayBuffer);
        } else if (this.responseType === 'arraybuffer') {
          publish(this.response as ArrayBuffer);
        }
      } catch {
        /* never disturb the page */
      }
    });
  }
  return pageSend.apply(this, args);
};
