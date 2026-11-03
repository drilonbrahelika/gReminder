import { Banner } from './banner.ts';
import { LEAD_MS, Reminder } from './reminder.ts';
import { pageText, parseScheduleText } from './schedule-text.ts';
import { meetingCode } from '../shared/meet.ts';
import { isPlausible, isScheduleMessage, type Schedule } from '../shared/schedule.ts';

export const TICK_MS = 1000;
/** How often the page text is searched while no end time is known. */
export const SCAN_EVERY_TICKS = 5;

export type Source = 'calendar-event' | 'details-panel';

export interface Status {
  code: string | null;
  endsAt: string | null;
  source: Source | null;
  remindsAt: string | null;
}

/**
 * Ties the parts together for one tab. Meet is a single-page app, so the
 * meeting can change under us without a reload: every tick compares the
 * meeting code and starts over when it moves.
 */
export class Controller {
  private code: string | null = null;
  private schedule: Schedule | null = null;
  private source: Source | null = null;
  private leadMs = LEAD_MS;
  private reminder = new Reminder();
  private ticks = 0;
  private readonly banner: Banner;
  private readonly win: Window;
  private readonly now: () => number;

  constructor(win: Window, now: () => number = Date.now, shadowMode?: ShadowRootMode) {
    this.win = win;
    this.now = now;
    this.banner = new Banner(win.document, () => this.dismiss(), shadowMode);
  }

  get bannerHost(): HTMLElement | null {
    return this.banner.host;
  }

  /**
   * A schedule posted by the page script. Untrusted: any script on the page
   * can post this shape, so origin, sender, meeting and plausibility are all
   * checked again here.
   */
  onMessage(event: MessageEvent): void {
    if (event.source !== this.win || event.origin !== this.win.location.origin) return;
    if (!isScheduleMessage(event.data)) return;
    const { code, startMs, endMs } = event.data;
    if (code !== meetingCode(this.win.location.pathname)) return;
    if (!isPlausible({ startMs, endMs }, this.now())) return;
    this.sync();
    this.use({ startMs, endMs }, 'calendar-event');
  }

  /** Lead time from the popup setting. Applies to the current meeting at once. */
  setLeadMinutes(minutes: number): void {
    this.leadMs = minutes * 60_000;
    this.reminder.leadMs = this.leadMs;
    this.render();
  }

  tick(): void {
    this.sync();
    if (!this.code) return;

    // The calendar event is the main source; the details panel only counts
    // if the person opened it themselves. It is never opened for them.
    if (this.source !== 'calendar-event' && this.ticks++ % SCAN_EVERY_TICKS === 0) {
      const found = parseScheduleText(pageText(this.win.document.body, this.banner.host), this.now());
      if (found && isPlausible(found, this.now())) this.use(found, 'details-panel');
    }
    this.render();
  }

  status(): Status {
    const end = this.schedule?.endMs ?? null;
    const clock = (ms: number) => new Date(ms).toLocaleTimeString();
    return {
      code: this.code,
      endsAt: end === null ? null : clock(end),
      source: this.source,
      remindsAt: end === null ? null : clock(end - this.leadMs),
    };
  }

  private use(schedule: Schedule, source: Source): void {
    if (this.schedule?.endMs !== schedule.endMs) {
      console.info(`[gReminder] meeting ends ${new Date(schedule.endMs).toLocaleString()} (${source})`);
    }
    this.schedule = schedule;
    this.source = source;
    this.render();
  }

  private dismiss(): void {
    if (this.schedule) this.reminder.dismiss(this.schedule.endMs);
  }

  private sync(): void {
    const code = meetingCode(this.win.location.pathname);
    if (code === this.code) return;
    this.code = code;
    this.schedule = null;
    this.source = null;
    this.reminder = new Reminder(this.leadMs);
    this.ticks = 0;
    this.banner.destroy();
  }

  private render(): void {
    this.banner.render(this.code ? this.reminder.view(this.schedule?.endMs ?? null, this.now()) : null);
  }
}
