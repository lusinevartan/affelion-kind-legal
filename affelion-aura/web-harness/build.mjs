import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'dist'), { recursive: true });
await build({
  entryPoints: [join(here, 'harness.ts')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  outfile: join(here, 'dist/harness.js'),
  sourcemap: false,
  logLevel: 'info',
});
copyFileSync(join(here, 'index.html'), join(here, 'dist/index.html'));
