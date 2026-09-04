/* Cherche les <a> qui se retrouvent soulignés alors qu'ils sont des blocs
   cliquables (carte, onglet, phase) — le soulignement est réservé aux liens
   dans une phrase. */
import { chromium } from 'playwright-core';
const BASE = process.env.URL_BASE || 'http://127.0.0.1:8123/';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--disable-gpu'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, locale: 'fr-FR' })).newPage();
const vues = ['postes/', 'quiz/'];
let total = 0;
for (const v of vues) {
  await p.goto(BASE + v, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const soulignes = await p.evaluate(() => {
    const sortie = [];
    const SURFACES = '.poste-row, .carte--action, .bouton, .nf-btn, a.quiz, .phase, .tabbar__item';
    document.querySelectorAll(SURFACES).forEach((a) => {
      if (a.closest('.pied')) return;      // les liens de bas de page sont soulignés à dessein
      if (getComputedStyle(a).textDecorationLine.includes('underline')) {
        sortie.push((a.className || a.tagName) + ' — ' + (a.textContent || '').trim().slice(0, 34));
      }
    });
    return sortie;
  });
  if (soulignes.length) {
    console.log(`  ✘ ${v || '/'} : ${soulignes.length}`);
    soulignes.forEach((x) => console.log('      ' + x));
    total += soulignes.length;
  } else console.log(`  ✔ ${v || '/'}`);
}
await b.close();
console.log(total ? `\n✘ ${total} bloc(s) cliquable(s) souligné(s)` : '\n✔ aucun bloc cliquable souligné');
process.exit(total ? 1 : 0);
