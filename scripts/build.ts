/**
 * Builds the unpacked extension into dist/:
 *
 *   dist/manifest.json   from src/manifest.ts
 *   dist/page.js         MAIN-world script (src/page/tap.ts)
 *   dist/content.js      isolated-world script (src/content/index.ts)
 *   dist/popup.html      settings popup markup (src/popup/html.ts)
 *   dist/popup.js        settings popup script (src/popup/index.ts)
 *   dist/icons/          copied from assets/icons
 *
 * Run with `npm run build`, or `npm run watch` while developing.
 */
import { build, context, type BuildOptions } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { manifest } from '../src/manifest.ts';
import { POPUP_HTML } from '../src/popup/html.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}dist`;
const watch = process.argv.includes('--watch');

const pkg = JSON.parse(await readFile(`${root}package.json`, 'utf8')) as { version: string };

const options: BuildOptions = {
  entryPoints: {
    page: `${root}src/page/tap.ts`,
    content: `${root}src/content/index.ts`,
    popup: `${root}src/popup/index.ts`,
  },
  outdir: out,
  bundle: true,
  format: 'iife',
  target: 'chrome111',
  legalComments: 'none',
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  logLevel: 'info',
};

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await writeFile(`${out}/manifest.json`, `${JSON.stringify(manifest(pkg.version), null, 2)}\n`);
await writeFile(`${out}/popup.html`, POPUP_HTML);
await cp(`${root}assets/icons`, `${out}/icons`, { recursive: true });

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
}
