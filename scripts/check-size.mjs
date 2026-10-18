import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BUDGET = { htmlRaw: 250 * 1024, htmlGzip: 80 * 1024, total: 400 * 1024 };

const html = fs.readFileSync(path.join(dist, 'index.html'));
const gz = gzipSync(html).length;
let total = 0;
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else total += fs.statSync(p).size;
  }
};
walk(dist);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const rows = [
  ['index.html', html.length, BUDGET.htmlRaw],
  ['index.html (gzip)', gz, BUDGET.htmlGzip],
  ['dist total', total, BUDGET.total],
];
let failed = false;
for (const [name, size, max] of rows) {
  const ok = size <= max;
  if (!ok) failed = true;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(20)} ${kb(size).padStart(10)} / ${kb(max)}`);
}
process.exit(failed ? 1 : 0);
