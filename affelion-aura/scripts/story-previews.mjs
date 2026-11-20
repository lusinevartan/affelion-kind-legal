// Renders the 9:16 "Share my color" card for three colors, free and Pro, from the web review
// build, and saves 1080x1920 PNGs to docs/previews.
//   npx expo export --platform web && npx serve -s dist -l 4180   (with demo/ assets copied in)
//   node scripts/story-previews.mjs http://localhost:4180 [path/to/demo-mask.json]
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }
const [base = 'http://localhost:4180', maskPath] = process.argv.slice(2);
const mask = maskPath ? readFileSync(maskPath, 'utf8') : null;
const out = new URL('../docs/previews/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await playwright.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const color of ['magenta', 'golden_yellow', 'sky_blue']) {
  for (const plan of ['free', 'pro']) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
    await ctx.addInitScript((m) => {
      localStorage.setItem('aura.demo', '1');
      localStorage.setItem('aura.demoStill', '/demo/model.jpg');
      if (m) localStorage.setItem('aura.demoMask', m);
    }, mask);
    const page = await ctx.newPage();
    await page.goto(`${base}/story-preview?color=${color}&plan=${plan}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${out}story-${color.replace('_', '-')}-${plan}.png`, clip: { x: 0, y: 0, width: 360, height: 640 } });
    await ctx.close();
  }
}
await browser.close();
console.log('saved to', out);
