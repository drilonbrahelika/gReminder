/**
 * The one user setting: how many minutes before the end the banner shows.
 * Stored in chrome.storage.sync so it follows the person's Chrome profile.
 */

export const LEAD_CHOICES = [5, 10, 15, 20, 30] as const;
export const DEFAULT_LEAD_MINUTES = 5;
export const LEAD_KEY = 'leadMinutes';

/** Anything read back from storage is checked: only the offered choices count. */
export function leadMinutes(value: unknown): number {
  return typeof value === 'number' && (LEAD_CHOICES as readonly number[]).includes(value)
    ? value
    : DEFAULT_LEAD_MINUTES;
}

/** The slice of the chrome.* API this extension uses, so no @types package is needed. */
interface StorageChange {
  newValue?: unknown;
}

export interface ChromeStorage {
  storage: {
    sync: {
      get(key: string): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    };
    onChanged: {
      addListener(listener: (changes: Record<string, StorageChange>, area: string) => void): void;
    };
  };
}

/** chrome.storage when running as the extension; null in tests or if it is missing. */
export function chromeStorage(): ChromeStorage | null {
  const c = (globalThis as { chrome?: Partial<ChromeStorage> }).chrome;
  return c?.storage?.sync ? (c as ChromeStorage) : null;
}

export async function loadLeadMinutes(api: ChromeStorage): Promise<number> {
  try {
    return leadMinutes((await api.storage.sync.get(LEAD_KEY))[LEAD_KEY]);
  } catch {
    return DEFAULT_LEAD_MINUTES;
  }
}

export function onLeadMinutesChange(api: ChromeStorage, listener: (minutes: number) => void): void {
  api.storage.onChanged.addListener((changes, area) => {
    const change = changes[LEAD_KEY];
    if (area === 'sync' && change) listener(leadMinutes(change.newValue));
  });
}
