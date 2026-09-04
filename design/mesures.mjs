import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const ICI = path.dirname(new URL(import.meta.url).pathname);
process.chdir(ICI);
const canvas = JSON.parse(fs.readFileSync('sortie/canvas.json', 'utf8'));
fs.mkdirSync('mes', { recursive: true });
for (const a of canvas.artboards) {
  const nom = a.file.replace('.dc.html', '');
  execFileSync('node', ['mesurer.mjs', `sortie/${a.file}`, `mes/${nom}.html`]);
  execFileSync('chromium', ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--virtual-time-budget=3500', `--window-size=${a.w},${a.h + 500}`,
    `--screenshot=mes/${nom}.png`, `mes/${nom}.html`], { stdio: 'ignore', timeout: 60000 });
}
console.log(`${canvas.artboards.length} mesures`);
