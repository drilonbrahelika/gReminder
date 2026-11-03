import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHANNEL } from '../src/shared/schedule.ts';
import { base64, calendarResponse } from './protobuf-helpers.ts';

const CALENDAR_URL =
  'https://meet.google.com/$rpc/google.rtc.meetings.v1.MeetingCalendarAgendaService/FetchCalendarEvent';

async function loadTap(body: ArrayBuffer) {
  (window as unknown as { happyDOM: { setURL(url: string): void } }).happyDOM.setURL(
    'https://meet.google.com/abc-defg-hij',
  );
  const pageFetch = vi.fn(async () => new Response(body));
  window.fetch = pageFetch as unknown as typeof fetch;
  const posted = vi.spyOn(window, 'postMessage').mockImplementation(() => {});
  vi.resetModules();
  await import('../src/page/tap.ts');
  return { pageFetch, posted };
}

afterEach(() => vi.restoreAllMocks());

describe('page tap', () => {
  it('posts the schedule from the calendar request and leaves the response untouched', async () => {
    const now = Date.now();
    const start = Math.floor(now / 1000) * 1000;
    const end = start + 30 * 60_000;
    const body = base64(calendarResponse(start, end));
    const { pageFetch, posted } = await loadTap(body);

    const res = await window.fetch(CALENDAR_URL, { method: 'POST' });
    expect(await res.text()).toBe(new TextDecoder().decode(body));
    await vi.waitFor(() => expect(posted).toHaveBeenCalled());

    expect(pageFetch).toHaveBeenCalledOnce();
    expect(posted).toHaveBeenCalledWith(
      { channel: CHANNEL, code: 'abc-defg-hij', startMs: start, endMs: end },
      'https://meet.google.com',
    );
  });

  it('stays silent for other requests and for instant meetings', async () => {
    const { posted } = await loadTap(base64(new Uint8Array([])));
    await window.fetch('https://meet.google.com/other');
    await window.fetch(CALENDAR_URL);
    await new Promise((r) => setTimeout(r, 20));
    expect(posted).not.toHaveBeenCalled();
  });
});
