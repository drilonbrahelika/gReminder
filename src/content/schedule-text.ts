import type { Schedule } from '../shared/schedule.ts';

/**
 * Reads the schedule line Meet renders in the meeting-details panel, such as
 *
 *   Thu, Sep 10, 2026 10:00 AM – 10:30 AM      (en-US)
 *   Wed, 9 Sept 2026 21:54–22:03               (en-GB, de)
 *   Wednesday, October 28 · 10:00 – 10:30am    (no year, shared suffix)
 *
 * It is user-facing text, so it is a steadier anchor than Meet's minified
 * class names. Month names are recognised in English and in the browser's
 * own languages, via Intl. The date is assembled from its parts; a locale
 * string is never handed to `new Date()`.
 */

const MONTH_LOCALES = ['en'];

/**
 * Month names, long and short, in English plus the browser's own languages,
 * normalised (lower case, no dots). Meet renders the schedule in the account's
 * language, which is usually one of these.
 */
export function monthNames(locales: readonly string[]): Map<string, number> {
  const names = new Map<string, number>();
  for (const locale of new Set([...MONTH_LOCALES, ...locales])) {
    for (const width of ['long', 'short'] as const) {
      let format: Intl.DateTimeFormat;
      try {
        format = new Intl.DateTimeFormat(locale, { month: width, timeZone: 'UTC' });
      } catch {
        continue; // unknown locale tag
      }
      for (let month = 0; month < 12; month++) {
        const name = normalise(format.format(Date.UTC(2026, month, 15)));
        if (name.length >= 3 && !names.has(name)) names.set(name, month);
      }
    }
  }
  return names;
}

function normalise(name: string): string {
  return name.toLocaleLowerCase().replace(/\./g, '').trim();
}

/** "Sep", "Sept", "September", "März", "ene" -> month index. */
function lookupMonth(token: string, names: Map<string, number>): number | undefined {
  const key = normalise(token);
  if (key.length < 3) return undefined;
  const exact = names.get(key);
  if (exact !== undefined) return exact;
  // Abbreviations vary ("Sept" against "Sep"); accept one that is a prefix of
  // a known name, or extends a known short name, as long as it is unambiguous.
  const found = new Set<number>();
  for (const [name, month] of names) {
    if (name.startsWith(key) || key.startsWith(name)) found.add(month);
  }
  return found.size === 1 ? [...found][0] : undefined;
}

let defaultNames: Map<string, number> | null = null;

function browserMonthNames(): Map<string, number> {
  defaultNames ??= monthNames(typeof navigator === 'undefined' ? [] : navigator.languages);
  return defaultNames;
}

const MONTH = '(\\p{L}{3,12})\\.?';
const DAY = '(\\d{1,2})(?:st|nd|rd|th)?\\.?';
const TIME = '(\\d{1,2})[:.](\\d{2})\\s*([AaPp]\\.?[Mm]\\.?)?';

const SCHEDULE_RE = new RegExp(
  '(?:\\p{L}{2,12}\\.?,?\\s+)?' +                // weekday
  `(?:${MONTH}\\s+${DAY}|${DAY}\\s+${MONTH})` +    // "Sep 10" or "9 Sept"
  '(?:,?\\s+(\\d{4}))?' +                          // year, optional
  '\\s*[,·⋅•]?\\s*' +                              // date/time separator
  TIME +
  '\\s*[–—-]\\s*' +                                // en dash, em dash, hyphen
  TIME,
  'gu',
);

type Meridiem = 'am' | 'pm' | null;

function meridiem(raw: string | undefined): Meridiem {
  if (!raw) return null;
  return raw.replace(/\./g, '').toLowerCase() === 'pm' ? 'pm' : 'am';
}

/** Minutes since midnight, or null when the clock reading is impossible. */
function minutes(h: number, m: number, suffix: Meridiem): number | null {
  if (m > 59) return null;
  if (suffix) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (suffix === 'pm' ? 12 : 0);
  } else if (h > 23) {
    return null;
  }
  return h * 60 + m;
}

export function parseScheduleText(
  text: string,
  now: number,
  names: Map<string, number> = browserMonthNames(),
): Schedule | null {
  // Take the first candidate that parses, so a look-alike earlier on the page
  // (an unknown word where the month would be) cannot hide the real line.
  for (const match of text.replace(/[  ]/g, ' ').matchAll(SCHEDULE_RE)) {
    const schedule = fromMatch(match, now, names);
    if (schedule) return schedule;
  }
  return null;
}

function fromMatch(match: RegExpMatchArray, now: number, names: Map<string, number>): Schedule | null {
  const [, monthA, dayA, dayB, monthB, year, sh, sm, sSuffix, eh, em, eSuffix] = match;

  const month = lookupMonth(monthA ?? monthB ?? '', names);
  const day = Number(dayA ?? dayB);
  if (month === undefined || !day || day > 31) return null;

  const endSuffix = meridiem(eSuffix);
  const end = minutes(Number(eh), Number(em), endSuffix);
  if (end === null) return null;

  // "10:00 – 10:30am": the start borrows the end's suffix, unless that would
  // put it after the end ("11:30 – 12:30 PM" starts at 11:30 AM).
  let start = minutes(Number(sh), Number(sm), meridiem(sSuffix) ?? endSuffix);
  if (start !== null && !sSuffix && endSuffix && start > end) {
    start = minutes(Number(sh), Number(sm), endSuffix === 'pm' ? 'am' : 'pm');
  }
  if (start === null) return null;

  const y = year ? Number(year) : new Date(now).getFullYear();
  const startDate = new Date(y, month, day, Math.floor(start / 60), start % 60);
  const endDate = new Date(y, month, day, Math.floor(end / 60), end % 60);
  if (startDate.getDate() !== day) return null; // "Feb 31" rolled over
  if (end <= start) endDate.setDate(endDate.getDate() + 1); // runs past midnight

  return { startMs: startDate.getTime(), endMs: endDate.getTime() };
}

/**
 * The page's visible text, one text node at a time with a space between, so
 * text split across elements ("2026" | "10:00 AM") still reads as one line.
 * Skips `exclude` so the banner never reads its own words back.
 */
export function pageText(root: Node, exclude: Node | null): string {
  const doc = root.ownerDocument ?? (root as Document);
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest('script,style,noscript')) return NodeFilter.FILTER_REJECT;
      if (exclude && exclude.contains(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const parts: string[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.nodeValue?.trim();
    if (value) parts.push(value);
  }
  return parts.join(' ');
}
