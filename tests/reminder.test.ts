import { describe, expect, it } from 'vitest';
import { LINGER_MS, Reminder, remainingLabel } from '../src/content/reminder.ts';

const END = 1_800_000_000_000;
const MIN = 60_000;

describe('Reminder', () => {
  it('stays hidden without an end time and before the last five minutes', () => {
    const r = new Reminder();
    expect(r.view(null, END)).toBeNull();
    expect(r.view(END, END - 5 * MIN - 1000)).toBeNull();
  });

  it('appears at five minutes and counts down', () => {
    const v = new Reminder().view(END, END - 5 * MIN);
    expect(v).toMatchObject({ tone: 'soon', title: '5 minutes left in this meeting', countdown: '5:00' });
    expect(new Reminder().view(END, END - 4 * MIN - 1000)?.countdown).toBe('4:01');
  });

  it('shows to someone joining with less than five minutes left', () => {
    expect(new Reminder().view(END, END - 3 * MIN)?.title).toBe('3 minutes left in this meeting');
  });

  it('turns urgent for the final minute', () => {
    expect(new Reminder().view(END, END - 30_000)).toMatchObject({
      tone: 'urgent',
      title: 'Less than a minute left',
      countdown: '0:30',
    });
  });

  it('says time is up at the end, then clears itself', () => {
    const r = new Reminder();
    expect(r.view(END, END)).toMatchObject({ tone: 'ended', title: 'Meeting time is up', countdown: null });
    expect(r.view(END, END + LINGER_MS)).toBeNull();
  });

  it('stays dismissed for the same end time but re-arms when the meeting is extended', () => {
    const r = new Reminder();
    r.dismiss(END);
    expect(r.view(END, END - MIN)).toBeNull();
    expect(r.view(END + 30 * MIN, END - MIN)).toBeNull();
    expect(r.view(END + 30 * MIN, END + 26 * MIN)?.tone).toBe('soon');
  });
});

describe('Reminder with another lead time', () => {
  it('appears at the chosen time', () => {
    const r = new Reminder(10 * MIN);
    expect(r.view(END, END - 10 * MIN - 1000)).toBeNull();
    expect(r.view(END, END - 10 * MIN)).toMatchObject({ title: '10 minutes left in this meeting', countdown: '10:00' });
  });
});

describe('remainingLabel', () => {
  it('rounds up so the label never reads 0:00 early', () => {
    expect(remainingLabel(300_000)).toBe('5:00');
    expect(remainingLabel(59_001)).toBe('1:00');
    expect(remainingLabel(1)).toBe('0:01');
    expect(remainingLabel(-5)).toBe('0:00');
  });
});
