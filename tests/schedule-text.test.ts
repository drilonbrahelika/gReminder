import { describe, expect, it } from 'vitest';
import { monthNames, pageText, parseScheduleText } from '../src/content/schedule-text.ts';

const NOW = new Date(2026, 8, 10, 10, 5).getTime();
const at = (y: number, mo: number, d: number, h: number, mi: number) => new Date(y, mo, d, h, mi).getTime();

describe('parseScheduleText', () => {
  it.each([
    ['Thu, Sep 10, 2026 10:00 AM – 10:30 AM', at(2026, 8, 10, 10, 0), at(2026, 8, 10, 10, 30)],
    ['Wed, 9 Sept 2026 21:54–22:03', at(2026, 8, 9, 21, 54), at(2026, 8, 9, 22, 3)],
    ['Wed, Sep 9, 2026 9:42 PM - 10:10 PM', at(2026, 8, 9, 21, 42), at(2026, 8, 9, 22, 10)],
    ['Thursday, September 10 · 10:00 – 10:30am', at(2026, 8, 10, 10, 0), at(2026, 8, 10, 10, 30)],
    ['Thursday, September 10 · 11:30 – 12:30pm', at(2026, 8, 10, 11, 30), at(2026, 8, 10, 12, 30)],
    ['Do., 10. Sept. 2026 10:00–10:30', at(2026, 8, 10, 10, 0), at(2026, 8, 10, 10, 30)],
    ['Thu, Sep 10, 2026 10:00 a.m. – 10:30 a.m.', at(2026, 8, 10, 10, 0), at(2026, 8, 10, 10, 30)],
  ])('%s', (text, startMs, endMs) => {
    expect(parseScheduleText(text, NOW)).toEqual({ startMs, endMs });
  });

  it.each([
    ['de', 'Mi., 4. März 2026 14:00–14:30', at(2026, 2, 4, 14, 0), at(2026, 2, 4, 14, 30)],
    ['de', 'Mittwoch, 28. Oktober 2026 14:00–14:30', at(2026, 9, 28, 14, 0), at(2026, 9, 28, 14, 30)],
    ['es', 'mié, 28 ene 2026 9:00–9:45', at(2026, 0, 28, 9, 0), at(2026, 0, 28, 9, 45)],
    ['fr', 'mer. 28 juil. 2026 10:00 – 11:00', at(2026, 6, 28, 10, 0), at(2026, 6, 28, 11, 0)],
  ])('reads month names in the browser language (%s): %s', (locale, text, startMs, endMs) => {
    expect(parseScheduleText(text, NOW, monthNames([locale]))).toEqual({ startMs, endMs });
  });

  it('rejects a month abbreviation that matches more than one month', () => {
    expect(parseScheduleText('28 jui 2026 10:00 – 11:00', NOW, monthNames(['fr']))).toBeNull();
  });

  it('rolls the end into the next day when the call crosses midnight', () => {
    expect(parseScheduleText('Thu, Sep 10, 2026 23:30–00:15', NOW)).toEqual({
      startMs: at(2026, 8, 10, 23, 30),
      endMs: at(2026, 8, 11, 0, 15),
    });
  });

  it('rejects text that is not a schedule', () => {
    expect(parseScheduleText('Joined at 10:00', NOW)).toBeNull();
    expect(parseScheduleText('Feb 31, 2026 10:00 – 11:00', NOW)).toBeNull();
    expect(parseScheduleText('Sep 10, 2026 25:00 – 26:00', NOW)).toBeNull();
    expect(parseScheduleText('Foo 10, 2026 10:00 – 11:00', NOW)).toBeNull();
  });
});

describe('pageText', () => {
  it('joins text split across elements and skips the excluded subtree', () => {
    document.body.innerHTML =
      '<div><span>Thu, Sep 10, 2026</span><span>10:00 AM</span> – <span>10:30 AM</span></div>' +
      '<script>var x = "Sep 1, 2026 1:00 – 2:00"</script><aside>ignore me</aside>';
    const aside = document.querySelector('aside');
    const text = pageText(document.body, aside);
    expect(text).toBe('Thu, Sep 10, 2026 10:00 AM – 10:30 AM');
    expect(parseScheduleText(text, NOW)?.endMs).toBe(at(2026, 8, 10, 10, 30));
  });
});

describe('real Meet details panel', () => {
  it('reads the line from a live en-US call (2026-10-28)', () => {
    const now = new Date(2026, 9, 28, 23, 29).getTime();
    expect(parseScheduleText('test Wed, Oct 28, 2026 11:24 PM - 11:32 PM Joining info', now)).toEqual({
      startMs: new Date(2026, 9, 28, 23, 24).getTime(),
      endMs: new Date(2026, 9, 28, 23, 32).getTime(),
    });
  });
});
