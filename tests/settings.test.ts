import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LEAD_MINUTES,
  LEAD_KEY,
  leadMinutes,
  loadLeadMinutes,
  onLeadMinutesChange,
  type ChromeStorage,
} from '../src/shared/settings.ts';

function fakeStorage(stored: Record<string, unknown> = {}) {
  const listeners: Parameters<ChromeStorage['storage']['onChanged']['addListener']>[0][] = [];
  const api: ChromeStorage = {
    storage: {
      sync: {
        get: async (key) => (key in stored ? { [key]: stored[key] } : {}),
        set: async (items) => {
          Object.assign(stored, items);
        },
      },
      onChanged: { addListener: (l) => listeners.push(l) },
    },
  };
  const change = (value: unknown, area = 'sync') => {
    for (const l of listeners) l({ [LEAD_KEY]: { newValue: value } }, area);
  };
  return { api, change };
}

describe('leadMinutes', () => {
  it('accepts only the offered choices and falls back to five', () => {
    expect(leadMinutes(10)).toBe(10);
    expect(leadMinutes(7)).toBe(DEFAULT_LEAD_MINUTES);
    expect(leadMinutes('10')).toBe(DEFAULT_LEAD_MINUTES);
    expect(leadMinutes(undefined)).toBe(5);
  });
});

describe('storage', () => {
  it('loads the saved choice, or the default when nothing is saved', async () => {
    expect(await loadLeadMinutes(fakeStorage({ [LEAD_KEY]: 15 }).api)).toBe(15);
    expect(await loadLeadMinutes(fakeStorage().api)).toBe(5);
  });

  it('reports changes made in the popup, from sync storage only', () => {
    const { api, change } = fakeStorage();
    const seen: number[] = [];
    onLeadMinutesChange(api, (m) => seen.push(m));
    change(20);
    change(30, 'local');
    change(undefined);
    expect(seen).toEqual([20, 5]);
  });
});
