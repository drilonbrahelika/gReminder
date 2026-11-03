import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Controller } from '../src/content/controller.ts';
import { CHANNEL } from '../src/shared/schedule.ts';

const MIN = 60_000;
const ORIGIN = 'https://meet.google.com';

let now = new Date(2026, 9, 28, 14, 0).getTime();
const END = now + 30 * MIN;

function goTo(path: string): void {
  (window as unknown as { happyDOM: { setURL(url: string): void } }).happyDOM.setURL(`${ORIGIN}${path}`);
}

function post(data: unknown, init: { source?: Window | null; origin?: string } = {}): MessageEvent {
  return new MessageEvent('message', {
    data,
    origin: init.origin ?? ORIGIN,
    source: init.source === undefined ? window : init.source,
  });
}

const schedule = (code = 'abc-defg-hij', endMs = END) => ({ channel: CHANNEL, code, startMs: endMs - 30 * MIN, endMs });

function card(c: Controller): HTMLElement | null {
  return c.bannerHost?.shadowRoot?.querySelector<HTMLElement>('.card') ?? null;
}

let controller: Controller;

beforeEach(() => {
  now = new Date(2026, 9, 28, 14, 0).getTime();
  goTo('/abc-defg-hij');
  // A stand-in for Meet's own controls: none of them may ever be clicked.
  document.body.innerHTML = '<button aria-label="Leave call"></button><button aria-label="Meeting details"></button>';
  controller = new Controller(window, () => now, 'open');
  controller.tick();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Controller', () => {
  it('shows nothing for a meeting with no known end time', () => {
    now = END;
    controller.tick();
    expect(controller.bannerHost).toBeNull();
  });

  it('shows the banner five minutes before the calendar end time', () => {
    controller.onMessage(post(schedule()));
    expect(controller.status().source).toBe('calendar-event');
    expect(controller.bannerHost).toBeNull();

    now = END - 5 * MIN;
    controller.tick();
    const el = card(controller)!;
    expect(el.dataset['tone']).toBe('soon');
    expect(el.querySelector('.title')!.textContent).toBe('5 minutes left in this meeting');
    expect(el.querySelector('.countdown')!.textContent).toBe('5:00');
    expect(el.querySelector('.detail')!.textContent).toMatch(/^Scheduled to end at /);
  });

  it('uses the reminder time picked in the popup, and keeps it across meetings', () => {
    controller.setLeadMinutes(15);
    controller.onMessage(post(schedule()));
    now = END - 16 * MIN;
    controller.tick();
    expect(controller.bannerHost).toBeNull();

    now = END - 15 * MIN;
    controller.tick();
    expect(card(controller)?.querySelector('.title')?.textContent).toBe('15 minutes left in this meeting');

    goTo('/xyz-abcd-efg');
    controller.onMessage(post(schedule('xyz-abcd-efg')));
    controller.tick();
    expect(controller.bannerHost?.isConnected).toBe(true);
  });

  it('hides a showing banner when the reminder time is made shorter', async () => {
    controller.setLeadMinutes(10);
    controller.onMessage(post(schedule()));
    now = END - 8 * MIN;
    controller.tick();
    expect(controller.bannerHost?.isConnected).toBe(true);
    controller.setLeadMinutes(5);
    await new Promise((r) => setTimeout(r, 250));
    expect(controller.bannerHost).toBeNull();
  });

  it.each([
    ['another window', { source: null }],
    ['another origin', { origin: 'https://evil.example' }],
  ])('ignores a message from %s', (_, init) => {
    controller.onMessage(post(schedule(), init));
    expect(controller.status().endsAt).toBeNull();
  });

  it('ignores a schedule for a different meeting, or an implausible one', () => {
    controller.onMessage(post(schedule('zzz-zzzz-zzz')));
    controller.onMessage(post(schedule('abc-defg-hij', now + 48 * 60 * MIN)));
    controller.onMessage(post({ channel: CHANNEL, code: 'abc-defg-hij', endMs: 'soon' }));
    expect(controller.status().endsAt).toBeNull();
  });

  it('falls back to the schedule text in the details panel', () => {
    const details = document.createElement('div');
    details.textContent = 'Wed, Oct 28, 2026 2:00 PM – 2:30 PM';
    document.body.append(details);
    now = END - 2 * MIN;
    for (let i = 0; i < 5; i++) controller.tick();
    expect(controller.status().source).toBe('details-panel');
    expect(card(controller)?.querySelector('.title')?.textContent).toBe('2 minutes left in this meeting');
  });

  it('stays dismissed once closed', async () => {
    controller.onMessage(post(schedule()));
    now = END - 4 * MIN;
    controller.tick();
    card(controller)!.querySelector<HTMLButtonElement>('.close')!.click();
    await new Promise((r) => setTimeout(r, 250));
    controller.tick();
    expect(controller.bannerHost).toBeNull();
  });

  it('clears the banner and forgets the schedule when the meeting changes', () => {
    controller.onMessage(post(schedule()));
    now = END - MIN;
    controller.tick();
    expect(controller.bannerHost?.isConnected).toBe(true);

    goTo('/');
    controller.tick();
    expect(controller.bannerHost).toBeNull();
    expect(controller.status()).toMatchObject({ code: null, endsAt: null });
  });

  it('never clicks or modifies Meet controls', () => {
    let clicks = 0;
    for (const b of document.querySelectorAll('button')) b.addEventListener('click', () => clicks++);
    const before = [...document.querySelectorAll('button')].map((b) => b.outerHTML).join();

    controller.onMessage(post(schedule()));
    for (const t of [END - 6 * MIN, END - 5 * MIN, END - 30_000, END, END + 3 * MIN]) {
      now = t;
      controller.tick();
    }
    expect(clicks).toBe(0);
    expect([...document.querySelectorAll('button')].map((b) => b.outerHTML).join()).toBe(before);
  });
});
