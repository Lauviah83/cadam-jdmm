/* Contrôle de débordement : chaque artboard est rendu plus haut que son frame.
   Si le fond du thème dépasse la hauteur déclarée, le contenu sera coupé. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ICI = path.dirname(new URL(import.meta.url).pathname);
process.chdir(ICI);
const canvas = JSON.parse(fs.readFileSync('sortie/canvas.json', 'utf8'));
fs.mkdirSync('apercu', { recursive: true });
fs.mkdirSync('ctrl', { recursive: true });

const resultats = [];
for (const a of canvas.artboards) {
  const nom = a.file.replace('.dc.html', '');
  execFileSync('node', ['apercu.mjs', `sortie/${a.file}`, `apercu/${nom}.html`]);
  const marge = 420;
  try {
    execFileSync('chromium', ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--virtual-time-budget=3500', `--window-size=${a.w},${a.h + marge}`,
      `--screenshot=ctrl/${nom}.png`, `apercu/${nom}.html`], { stdio: 'ignore', timeout: 60000 });
    resultats.push({ nom, w: a.w, h: a.h, marge });
  } catch (err) {
    resultats.push({ nom, erreur: String(err).slice(0, 60) });
  }
}
fs.writeFileSync('ctrl/index.json', JSON.stringify(resultats, null, 1));
console.log(`${resultats.length} captures de contrôle`);
