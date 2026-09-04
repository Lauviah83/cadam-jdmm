/* Navigation au clavier sur les deux applications : lien d'évitement, ordre de
   tabulation, focus visible, raccourcis des quiz. */
import { chromium } from 'playwright-core';

const BASE = process.env.URL_BASE || 'http://127.0.0.1:8123/';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-gpu'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' })).newPage();

let ko = 0;
const ok = (n, c, d = '') => { console.log((c ? '  ✔ ' : '  ✘ ') + n + (c ? '' : '  → ' + d)); if (!c) ko++; };
p.on('pageerror', (e) => { console.log('   EXCEPTION ' + e.message); ko++; });

/* ── Application Postes ─────────────────────────────────────────────────── */
console.log('\n— Postes : lien d\'évitement et ordre de tabulation —');
await p.goto(BASE + 'postes/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);

await p.keyboard.press('Tab');
const premier = await p.evaluate(() => document.activeElement.className);
ok('la première tabulation atteint le lien d\'évitement', premier.includes('evitement'), premier);
ok('il devient visible au focus', await p.locator('.evitement').isVisible());

const ordre = [];
for (let i = 0; i < 10; i++) {
  await p.keyboard.press('Tab');
  ordre.push(await p.evaluate(() => (document.activeElement.textContent || '').trim().slice(0, 22)
    || document.activeElement.tagName));
}
console.log('     ' + ordre.join(' → '));
ok('la marque et les filtres précèdent la liste',
   ordre.slice(0, 4).some((t) => /DCIP|Tous les postes/.test(t)), ordre.slice(0, 4).join(' | '));

const contour = await p.evaluate(() => {
  const s = getComputedStyle(document.activeElement);
  return { largeur: s.outlineWidth, style: s.outlineStyle };
});
ok('l\'élément focalisé porte un contour visible',
   contour.largeur !== '0px' && contour.style !== 'none', JSON.stringify(contour));

console.log('\n— Postes : le formulaire au clavier —');
await p.goto(BASE + 'postes/', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.locator('.poste-row').first().click();
await p.waitForTimeout(500);
await p.locator('a[href^="#/demande/"]').click();
await p.waitForTimeout(600);
await p.locator('#prenom').focus();
await p.keyboard.type('Camille');
await p.keyboard.press('Tab');
ok('la tabulation passe du prénom au nom',
   await p.evaluate(() => document.activeElement.id) === 'nom');
await p.keyboard.type('Durand');
await p.keyboard.press('Tab');
ok('puis à la direction', await p.evaluate(() => document.activeElement.id) === 'direction');

/* ── Application Quiz ───────────────────────────────────────────────────── */
console.log('\n— Quiz : raccourcis clavier —');
await p.goto(BASE + 'quiz/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.evaluate(() => { window.location.hash = '#/feu'; });
await p.waitForTimeout(800);
ok('la première question est affichée', await p.locator('.option').count() === 3,
   String(await p.locator('.option').count()));

await p.keyboard.press('2');
await p.waitForTimeout(250);
ok('la touche 2 sélectionne la deuxième réponse',
   await p.locator('.option').nth(1).getAttribute('aria-checked') === 'true');

await p.keyboard.press('Enter');
await p.waitForTimeout(400);
ok('Entrée valide la réponse', await p.locator('.correction').isVisible());

await p.keyboard.press('Enter');
await p.waitForTimeout(400);
ok('Entrée enchaîne sur la question suivante',
   (await p.locator('.quiz__compteur').textContent()).replace(/\s+/g, ' ').includes('2 / 8'));

// Une touche chiffre ne doit pas être détournée pendant une saisie.
console.log('\n— Les raccourcis ne détournent pas la saisie —');
await p.goto(BASE + 'postes/', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.locator('.poste-row').first().click();
await p.waitForTimeout(400);
await p.locator('a[href^="#/demande/"]').click();
await p.waitForTimeout(500);
await p.locator('#prenom').focus();
await p.keyboard.type('2');
ok('un chiffre tapé dans un champ y reste',
   await p.evaluate(() => document.getElementById('prenom').value) === '2');

await b.close();
console.log(ko === 0 ? '\n✔ tous les contrôles passent\n' : `\n✘ ${ko} contrôle(s) en échec\n`);
process.exit(ko ? 1 : 0);
