import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build, transform } from 'esbuild';
import { generateIcons } from './gen-icons.mjs';
import { validateContent } from '../src/content/validate.js';
import { CONTENT } from '../src/content/registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => path.join(root, 'src', p);
const dist = path.join(root, 'dist');

const errors = validateContent(CONTENT);
if (errors.length) {
  console.error('Content validation failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });

const bundle = await build({
  entryPoints: [src('main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020', 'safari15'],
  write: false,
  legalComments: 'none',
});
const js = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script').trim();
const css = (
  await transform(fs.readFileSync(src('styles.css'), 'utf8'), { loader: 'css', minify: true })
).code.trim();

const sha = (s) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;
const csp = [
  "default-src 'self'",
  `script-src 'self' ${sha(js)}`,
  `style-src 'self' ${sha(css)}`,
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const html = fs
  .readFileSync(src('index.html'), 'utf8')
  .replace('__CSP__', () => csp)
  .replace('<!-- INLINE_CSS -->', () => `<style>${css}</style>`)
  .replace('<!-- INLINE_JS -->', () => `<script>${js}</script>`);
fs.writeFileSync(path.join(dist, 'index.html'), html);

fs.copyFileSync(
  path.join(root, 'public', 'manifest.webmanifest'),
  path.join(dist, 'manifest.webmanifest'),
);
const icons = generateIcons(path.join(dist, 'icons'));

const assets = [
  './',
  './index.html',
  './manifest.webmanifest',
  ...icons.map((f) => `./icons/${path.basename(f)}`),
];
const hash = createHash('sha256');
for (const a of assets.slice(1)) hash.update(fs.readFileSync(path.join(dist, a)));
const cacheName = `nightfall-${hash.digest('hex').slice(0, 12)}`;
const sw = fs
  .readFileSync(path.join(root, 'public', 'sw.template.js'), 'utf8')
  .replace('__CACHE_NAME__', () => cacheName)
  .replace('__ASSETS__', () => JSON.stringify(assets));
fs.writeFileSync(path.join(dist, 'sw.js'), sw);

const kb = (f) => (fs.statSync(path.join(dist, f)).size / 1024).toFixed(1);
console.log(
  `built dist/index.html (${kb('index.html')} KB), sw.js cache ${cacheName}, ${icons.length} icons`,
);
