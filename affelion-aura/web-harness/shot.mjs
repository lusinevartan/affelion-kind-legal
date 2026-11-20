/**
 * Renders each preset for a few seconds of simulated time in headless Chromium and writes
 * PNGs to docs/renders. Run `npm run harness:build` first.
 */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? '/opt/node-tools/node_modules/playwright');
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2] ?? join(here, '..', 'docs', 'renders');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 540, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => console.log('console', m.text()));
await page.goto(pathToFileURL(join(here, 'dist', 'index.html')).href);
await page.waitForFunction(() => document.getElementById('status')?.textContent === 'ready', null, { timeout: 20000 });
const info = await page.evaluate(() => window.__aura.info());
console.log('context', JSON.stringify(info));
const presets = await page.evaluate(() => window.__aura.presets());
for (const name of presets) {
  const params = await page.evaluate((n) => window.__aura.setPreset(n), name);
  // ~4 s of simulated time, in chunks so the page stays responsive.
  for (let i = 0; i < 8; i++) await page.evaluate(() => window.__aura.run(30));
  const file = join(outDir, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(name, '→', file, JSON.stringify({ hue: params.hue, sat: params.saturation, light: params.lightness, turb: params.turbulence, dom: params.dominant, sec: params.secondary, acc: params.accent }));
}
await browser.close();
