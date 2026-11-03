import type { BannerView } from './reminder.ts';
import { STYLES } from './styles.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
// Material Icons "timer" and "close" (Apache 2.0).
const TIMER_PATH =
  'M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.96 8.96 0 0 0 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z';
const CLOSE_PATH =
  'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

const LEAVE_MS = 200;

export const HOST_TAG = 'greminder-banner';

function icon(doc: Document, path: string): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const p = doc.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', path);
  svg.append(p);
  return svg;
}

function el<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  node.className = className;
  return node;
}

export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

interface Parts {
  host: HTMLElement;
  card: HTMLElement;
  title: HTMLElement;
  detail: HTMLElement;
  countdown: HTMLElement;
}

/**
 * The reminder card, pinned to the top centre of the call over the strip
 * above the video grid. It lives in a closed shadow root on its own host
 * element on <body>, and never touches any of Meet's own nodes.
 */
export class Banner {
  private parts: Parts | null = null;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly doc: Document;
  private readonly onDismiss: () => void;
  private readonly shadowMode: ShadowRootMode;

  /** `shadowMode` is 'closed' in the extension; tests open it to look inside. */
  constructor(doc: Document, onDismiss: () => void, shadowMode: ShadowRootMode = 'closed') {
    this.doc = doc;
    this.onDismiss = onDismiss;
    this.shadowMode = shadowMode;
  }

  /** The host element, for tests and for keeping the banner out of text scans. */
  get host(): HTMLElement | null {
    return this.parts?.host ?? null;
  }

  render(view: BannerView | null): void {
    if (!view) {
      this.hide();
      return;
    }
    const parts = this.mount();
    const { card, title, detail, countdown } = parts;

    card.dataset['tone'] = view.tone;
    card.classList.remove('leaving');
    setText(title, view.title);
    setText(detail, `Scheduled to end at ${formatClock(view.endMs)}`);
    countdown.hidden = view.countdown === null;
    setText(countdown, view.countdown ?? '');
  }

  /** Removes the banner at once, without the exit animation. */
  destroy(): void {
    if (this.leaveTimer) clearTimeout(this.leaveTimer);
    this.leaveTimer = null;
    this.parts?.host.remove();
    this.parts = null;
  }

  private hide(): void {
    if (!this.parts || this.leaveTimer) return;
    this.parts.card.classList.add('leaving');
    this.leaveTimer = setTimeout(() => this.destroy(), LEAVE_MS);
  }

  private mount(): Parts {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
    if (this.parts) {
      // Meet re-renders large parts of the page; put the host back if it went.
      if (!this.parts.host.isConnected) this.doc.body.append(this.parts.host);
      return this.parts;
    }

    const doc = this.doc;
    const host = doc.createElement(HOST_TAG);
    const root = host.attachShadow({ mode: this.shadowMode });

    const style = doc.createElement('style');
    style.textContent = STYLES;

    const card = el(doc, 'div', 'card');
    const badge = el(doc, 'div', 'icon');
    badge.append(icon(doc, TIMER_PATH));

    const text = el(doc, 'div', 'text');
    const title = el(doc, 'div', 'title');
    title.setAttribute('role', 'status');
    title.setAttribute('aria-live', 'polite');
    const detail = el(doc, 'div', 'detail');
    text.append(title, detail);

    // Ticks every second, so it is kept out of the accessibility tree; the
    // title above already announces each minute.
    const countdown = el(doc, 'div', 'countdown');
    countdown.setAttribute('aria-hidden', 'true');

    const close = el(doc, 'button', 'close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss reminder');
    close.append(icon(doc, CLOSE_PATH));
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      this.onDismiss();
      this.hide();
    });

    card.append(badge, text, countdown, close);
    root.append(style, card);
    doc.body.append(host);

    this.parts = { host, card, title, detail, countdown };
    return this.parts;
  }
}

/** Writes only on change, so the live region is not re-announced each second. */
function setText(node: HTMLElement, value: string): void {
  if (node.textContent !== value) node.textContent = value;
}
