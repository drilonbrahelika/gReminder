/**
 * Renders the Chrome Web Store images into store/images/:
 *
 *   screenshot-1-banner.png        1280x800  the banner in a call
 *   screenshot-2-final-minute.png  1280x800  the final-minute state
 *   screenshot-3-settings.png      1280x800  the reminder-time popup
 *   screenshot-4-privacy.png       1280x800  what it does and doesn't do
 *   promo-small-440x280.png        440x280   small promo tile
 *   promo-marquee-1400x560.png     1400x560  marquee promo tile (optional)
 *   store-icon-128.png             128x128   96px artwork, 16px clear border
 *
 * The banner in the pictures is the real one: src/content/banner.ts is
 * bundled and rendered over a mock Meet call. Run `npm run build` first (the
 * settings shot uses dist/popup.html), then `npm run store:assets`.
 *
 * Needs Playwright with Chromium, which is not a dependency of the extension.
 * Install it once with `npm i -g playwright && npx playwright install chromium`
 * if it is not already on the machine.
 */
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

interface Page {
  setContent(html: string, options?: { waitUntil?: 'load' | 'networkidle' }): Promise<void>;
  evaluate<T>(fn: string): Promise<T>;
  screenshot(options: { path: string; omitBackground?: boolean }): Promise<unknown>;
  close(): Promise<void>;
}
interface Browser {
  newPage(options: {
    viewport: { width: number; height: number };
    deviceScaleFactor?: number;
    locale?: string;
    timezoneId?: string;
  }): Promise<Page>;
  close(): Promise<void>;
}
interface Playwright {
  chromium: { launch(): Promise<Browser> };
}

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}store/images`;
/** Playwright from this project or NODE_PATH, else from npm's global root. */
function loadPlaywright(): Playwright {
  try {
    return createRequire(import.meta.url)('playwright') as Playwright;
  } catch {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return createRequire(`${globalRoot}/`)('playwright') as Playwright;
  }
}
const { chromium } = loadPlaywright();

// ---------------------------------------------------------------------------
// The real banner, bundled for the browser. Exposes window.showBanner(view).

const bannerBundle = await build({
  stdin: {
    contents: `
      import { Banner } from './src/content/banner.ts';
      const banner = new Banner(document, () => {}, 'open');
      (window as any).showBanner = (view: any) => banner.render(view);
    `,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'iife',
  target: 'chrome111',
});
const BANNER_JS = bannerBundle.outputFiles[0]!.text;

const icon128 = (await readFile(`${root}assets/icons/icon128.png`)).toString('base64');
const ICON = `data:image/png;base64,${icon128}`;
const POPUP_HTML = await readFile(`${root}dist/popup.html`, 'utf8').catch(() => {
  throw new Error('dist/popup.html is missing: run `npm run build` first.');
});

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Text:wght@400;500&display=block">`;

// The banner shows "Scheduled to end at 10:30 AM" in every picture.
const END = 'new Date(2026, 10, 2, 10, 30).getTime()';

// ---------------------------------------------------------------------------
// A mock Meet call: Meet's dark surface, a 2x2 grid, the bottom control bar.

const P = {
  mic: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
  cam: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
  present:
    'M21 3H3c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h18c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 16.02H3V4.98h18v14.04zM10 12H8l4-4 4 4h-2v4h-4v-4z',
  more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  end: 'M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z',
  info: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  people:
    'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  chat: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z',
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
};

const svg = (d: string, size = 24): string =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;

const PEOPLE: ReadonlyArray<[string, string]> = [
  ['Ana Kelmendi', '#8430ce'],
  ['Marcus Lee', '#0b8043'],
  ['Priya Nair', '#c5221f'],
  ['You', '#1967d2'],
];

const MEET_CSS = /* css */ `
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  background: #202124;
  color: #e8eaed;
  font-family: "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr 80px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  padding: 72px 16px 0;
}
.tile {
  position: relative;
  border-radius: 12px;
  background: #3c4043;
  display: grid;
  place-items: center;
}
.tile.speaking { box-shadow: inset 0 0 0 3px #8ab4f8; }
.avatar {
  width: 88px; height: 88px; border-radius: 50%;
  display: grid; place-items: center;
  font: 400 40px "Google Sans", Roboto, Arial, sans-serif; color: #fff;
}
.name {
  position: absolute; left: 16px; bottom: 12px;
  font: 500 14px "Google Sans Text", "Google Sans", Arial, sans-serif;
  text-shadow: 0 1px 2px rgba(0,0,0,.6);
}
.bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 24px;
}
.meta { font: 500 16px "Google Sans", Arial, sans-serif; color: #e8eaed; white-space: nowrap; }
.meta span { color: #9aa0a6; margin: 0 10px; font-weight: 400; }
.controls { display: flex; gap: 10px; }
.btn {
  width: 48px; height: 48px; border-radius: 24px;
  background: #3c4043; color: #e8eaed;
  display: grid; place-items: center;
}
.btn.end { width: 64px; background: #dc362e; }
.side { display: flex; gap: 6px; justify-content: flex-end; color: #e8eaed; }
.side .btn { background: transparent; }
`;

function meetCall(clock: string): string {
  const tiles = PEOPLE.map(
    ([name, colour], i) => `
      <div class="tile${i === 0 ? ' speaking' : ''}">
        <div class="avatar" style="background:${colour}">${name[0]}</div>
        <div class="name">${name}</div>
      </div>`,
  ).join('');
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${MEET_CSS}</style></head>
  <body>
    <main class="grid">${tiles}</main>
    <footer class="bar">
      <div class="meta">${clock}<span>|</span>Weekly product sync</div>
      <div class="controls">
        <div class="btn">${svg(P.mic)}</div>
        <div class="btn">${svg(P.cam)}</div>
        <div class="btn">${svg(P.present)}</div>
        <div class="btn">${svg(P.more)}</div>
        <div class="btn end">${svg(P.end)}</div>
      </div>
      <div class="side">
        <div class="btn">${svg(P.info)}</div>
        <div class="btn">${svg(P.people)}</div>
        <div class="btn">${svg(P.chat)}</div>
      </div>
    </footer>
    <script>${BANNER_JS}</script>
  </body></html>`;
}

// ---------------------------------------------------------------------------
// Marketing layouts: a caption on the left, a picture on the right.

const CAPTION_CSS = /* css */ `
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  background: #e8f0fe;
  color: #1f1f1f;
  font-family: "Google Sans", Roboto, Arial, sans-serif;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 48px;
  padding: 0 80px;
}
h1 { font: 500 44px/54px "Google Sans", Arial, sans-serif; margin: 0 0 20px; letter-spacing: -0.5px; }
p { font: 400 20px/30px "Google Sans Text", "Google Sans", Arial, sans-serif; color: #444746; margin: 0; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; font: 500 22px "Google Sans", Arial, sans-serif; color: #0b57d0; }
.brand img { width: 40px; height: 40px; }
`;

function settingsShot(): string {
  // The popup's own HTML, shown in an iframe styled like Chrome's popup bubble.
  const popup = POPUP_HTML.replace('<script src="popup.js"></script>', '')
    .replace('src="icons/icon48.png"', `src="${ICON}"`)
    .replace('value="10">', 'value="10" checked>');
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${CAPTION_CSS}
    .bubble { justify-self: center; width: 300px; height: 334px; border-radius: 12px; overflow: hidden;
      background: #fff; box-shadow: 0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3); transform: scale(1.5); }
    iframe { border: 0; width: 300px; height: 334px; display: block; }
  </style></head><body>
    <div>
      <div class="brand"><img src="${ICON}" alt="">gReminder</div>
      <h1>You choose when the reminder appears</h1>
      <p>5, 10, 15, 20 or 30 minutes before the end. Pick it once from Chrome's toolbar and it follows your Chrome profile.</p>
    </div>
    <div class="bubble"><iframe srcdoc="${popup.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></iframe></div>
  </body></html>`;
}

function privacyShot(): string {
  const items = [
    'No sign-in, no Google account access',
    'No Calendar API, no consent screen',
    'Reads the meeting time from the Meet page',
    'Nothing is sent anywhere, ever',
    'Nothing added to Meet’s toolbar',
  ]
    .map((t) => `<li><span class="tick">${svg(P.check, 20)}</span>${t}</li>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${CAPTION_CSS}
    ul { list-style: none; margin: 0; padding: 32px 36px; background: #fff; border-radius: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.06); }
    li { display: flex; align-items: center; gap: 16px; padding: 14px 0; font: 400 20px "Google Sans Text", "Google Sans", Arial, sans-serif; }
    li + li { border-top: 1px solid #e3e3e3; }
    .tick { flex: none; width: 32px; height: 32px; border-radius: 50%; background: #c4eed0; color: #0d652d; display: grid; place-items: center; }
  </style></head><body>
    <div>
      <div class="brand"><img src="${ICON}" alt="">gReminder</div>
      <h1>Private by design</h1>
      <p>gReminder works entirely inside your browser tab. It only needs to know when the meeting ends.</p>
    </div>
    <ul>${items}</ul>
  </body></html>`;
}

function promo(width: number, height: number, withBanner: boolean): string {
  const big = width > 600;
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; }
    body {
      background: linear-gradient(135deg, #0b57d0 0%, #1a73e8 60%, #4285f4 100%);
      color: #fff; overflow: hidden; font-family: "Google Sans", Roboto, Arial, sans-serif;
      display: flex; align-items: center; justify-content: ${big ? 'space-between' : 'flex-start'};
      padding: 0 ${big ? 110 : 36}px; gap: ${big ? 40 : 22}px;
    }
    .lockup { display: flex; flex-direction: column; gap: ${big ? 20 : 12}px; }
    .row { display: flex; align-items: center; gap: ${big ? 24 : 16}px; }
    img { width: ${big ? 120 : 80}px; height: ${big ? 120 : 80}px; filter: drop-shadow(0 4px 10px rgba(0,0,0,.25)); }
    h1 { margin: 0; font: 500 ${big ? 72 : 40}px/1 "Google Sans", Arial, sans-serif; letter-spacing: -1px; }
    p { margin: 0; font: 400 ${big ? 30 : 19}px/1.3 "Google Sans", Arial, sans-serif; color: #d3e3fd; max-width: ${big ? 520 : 340}px; }
    greminder-banner { position: static !important; transform: scale(1.35) !important; transform-origin: right center; }
  </style></head><body>
    <div class="lockup">
      <div class="row"><img src="${ICON}" alt=""><h1>gReminder</h1></div>
      <p>A heads-up in Google Meet before your meeting runs out of time</p>
    </div>
    ${withBanner ? `<script>${BANNER_JS}</script>` : ''}
  </body></html>`;
}

const ICON_PAGE = `<!doctype html><html><head><style>
  html, body { margin: 0; background: transparent; }
  img { display: block; width: 96px; height: 96px; margin: 16px; }
</style></head><body><img src="${ICON}" alt=""></body></html>`;

// ---------------------------------------------------------------------------

await mkdir(out, { recursive: true });
const browser = await chromium.launch();

async function shoot(
  file: string,
  html: string,
  size: { width: number; height: number; scale?: number },
  script = '',
  transparent = false,
): Promise<void> {
  const scale = size.scale ?? 1;
  const page = await browser.newPage({
    viewport: { width: size.width / scale, height: size.height / scale },
    deviceScaleFactor: scale,
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate('document.fonts.ready');
  if (script) await page.evaluate(script);
  await page.evaluate('new Promise((r) => setTimeout(r, 500))'); // let the banner's entry animation finish
  await page.screenshot({ path: `${out}/${file}`, omitBackground: transparent });
  await page.close();
  console.log(`store/images/${file}`);
}

// The call is laid out at 1024x640 and captured at 1.25x, so the banner reads
// well in the store's smaller carousel while the picture is exactly 1280x800.
const SHOT = { width: 1280, height: 800, scale: 1.25 };

await shoot(
  'screenshot-1-banner.png',
  meetCall('10:25 AM'),
  SHOT,
  `showBanner({ tone: 'soon', title: '5 minutes left in this meeting', countdown: '4:59', endMs: ${END} })`,
);
await shoot(
  'screenshot-2-final-minute.png',
  meetCall('10:29 AM'),
  SHOT,
  `showBanner({ tone: 'urgent', title: 'Less than a minute left', countdown: '0:42', endMs: ${END} })`,
);
await shoot('screenshot-3-settings.png', settingsShot(), { width: 1280, height: 800 });
await shoot('screenshot-4-privacy.png', privacyShot(), { width: 1280, height: 800 });
await shoot('promo-small-440x280.png', promo(440, 280, false), { width: 440, height: 280 });
await shoot(
  'promo-marquee-1400x560.png',
  promo(1400, 560, true),
  { width: 1400, height: 560 },
  `showBanner({ tone: 'soon', title: '5 minutes left in this meeting', countdown: '4:59', endMs: ${END} });
   const host = document.querySelector('greminder-banner'); document.body.append(host);`,
);
await shoot('store-icon-128.png', ICON_PAGE, { width: 128, height: 128 }, '', true);

await browser.close();
