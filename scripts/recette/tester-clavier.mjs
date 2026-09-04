/* Navigation au clavier : ordre de tabulation, focus visible, piège de focus
   dans la feuille modale, raccourcis des quiz. */
import { chromium } from 'playwright-core';
const BASE = process.env.URL_BASE || 'http://127.0.0.1:8123/';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--disable-gpu'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' });
const p = await ctx.newPage();
let ko = 0;
const ok = (n, c, d = '') => { console.log((c ? '  ✔ ' : '  ✘ ') + n + (c ? '' : '  → ' + d)); if (!c) ko++; };

await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(700);

console.log('\n— Lien d\'évitement —');
await p.keyboard.press('Tab');
const premier = await p.evaluate(() => document.activeElement.className);
ok('le premier tabulation atteint le lien d\'évitement', premier.includes('evitement'), premier);
ok('il devient visible au focus', await p.locator('.evitement').isVisible());

console.log('\n— Ordre de tabulation —');
const ordre = [];
for (let i = 0; i < 12; i++) {
  await p.keyboard.press('Tab');
  ordre.push(await p.evaluate(() => {
    const e = document.activeElement;
    return (e.textContent || '').trim().slice(0, 26) || e.tagName;
  }));
}
console.log('     ' + ordre.join(' → '));
ok('la navigation précède le contenu',
   ordre.slice(0, 5).some((t) => t.includes('Métiers')) );
ok('aucun élément ne reçoit le focus deux fois de suite',
   !ordre.some((t, i) => i > 0 && t === ordre[i - 1] && t !== 'DIV'));

console.log('\n— Focus visible —');
const contour = await p.evaluate(() => {
  const e = document.activeElement;
  const s = getComputedStyle(e);
  return { outline: s.outlineWidth, style: s.outlineStyle };
});
ok('l\'élément focalisé porte un contour', contour.outline !== '0px' && contour.style !== 'none',
   JSON.stringify(contour));

console.log('\n— Raccourcis des quiz —');
await p.evaluate(() => { window.location.hash = '#/quiz/feu'; });
await p.waitForTimeout(600);
await p.keyboard.press('2');
await p.waitForTimeout(200);
ok('la touche 2 sélectionne la deuxième réponse',
   await p.locator('.option').nth(1).getAttribute('aria-checked') === 'true');
await p.keyboard.press('Enter');
await p.waitForTimeout(300);
ok('Entrée valide la réponse', await p.locator('.correction').isVisible());
await p.keyboard.press('Enter');
await p.waitForTimeout(300);
ok('Entrée enchaîne sur la question suivante',
   (await p.locator('.quiz__compteur').textContent()).replace(/\s+/g, ' ').includes('2 / 8'));

console.log('\n— Feuille modale : piège de focus —');
await p.evaluate(() => { window.location.hash = '#/postes'; });
await p.waitForTimeout(700);
await p.locator('[data-onglet-liste="tous"]').click();
await p.waitForTimeout(500);
await p.locator('#postes-filtrer').click();
await p.waitForTimeout(400);
ok('la feuille s\'ouvre', await p.locator('#feuille').isVisible());
ok('elle est annoncée comme dialogue',
   await p.locator('#feuille').getAttribute('role') === 'dialog'
   && await p.locator('#feuille').getAttribute('aria-modal') === 'true');
ok('le focus entre dans la feuille',
   await p.evaluate(() => document.getElementById('feuille').contains(document.activeElement)));

// On tabule abondamment : le focus ne doit jamais sortir de la feuille.
let sorti = false;
for (let i = 0; i < 30; i++) {
  await p.keyboard.press('Tab');
  const dedans = await p.evaluate(() =>
    document.getElementById('feuille').contains(document.activeElement));
  if (!dedans) { sorti = true; break; }
}
ok('le focus reste piégé dans la feuille', !sorti);

await p.keyboard.press('Escape');
await p.waitForTimeout(300);
ok('Échap ferme la feuille', !(await p.locator('#feuille').isVisible()));
ok('le focus revient sur le bouton d\'origine',
   await p.evaluate(() => document.activeElement.id === 'postes-filtrer'));

await b.close();
console.log(ko === 0 ? '\n✔ tous les contrôles passent\n' : `\n✘ ${ko} contrôle(s) en échec\n`);
process.exit(ko ? 1 : 0);
