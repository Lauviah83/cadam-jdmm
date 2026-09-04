import { chromium } from 'playwright-core';
const BASE = process.env.URL_BASE || 'http://127.0.0.1:8123/';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--disable-gpu'] });
let ko = 0;
const ok = (n, c, d = '') => { console.log((c ? '  ✔ ' : '  ✘ ') + n + (c ? '' : '  → ' + d)); if (!c) ko++; };

for (const [nom, l, h] of [['mobile 390', 390, 844], ['petit mobile 320', 320, 700], ['PC 1440', 1440, 900]]) {
  const p = await (await b.newContext({ viewport: { width: l, height: h }, isMobile: l < 900, locale: 'fr-FR' })).newPage();
  p.on('pageerror', (e) => { console.log('   EXCEPTION ' + e.message); ko++; });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  console.log(`\n— ${nom} —`);

  const barre = l < 1024 ? '.tabbar' : '.topnav';
  const items = l < 1024 ? '.tabbar__item' : '.topnav__lien';
  ok('5 entrées de navigation', await p.locator(items).count() === 5,
     String(await p.locator(items).count()));
  ok('la première est Accueil',
     (await p.locator(items).first().textContent()).includes('Accueil'));
  ok('Accueil est marqué courant au chargement',
     await p.locator(`${items}[data-onglet="accueil"]`).getAttribute('aria-current') === 'page');

  if (l < 1024) {
    const debord = await p.evaluate(() => {
      const bar = document.querySelector('.tabbar');
      return bar.scrollWidth > bar.clientWidth + 1;
    });
    ok('la barre ne déborde pas', !debord);
    const tronque = await p.evaluate(() => {
      const sortie = [];
      document.querySelectorAll('.tabbar__item > span:last-child').forEach((s) => {
        if (s.scrollWidth > s.clientWidth + 1) sortie.push(s.textContent);
      });
      return sortie;
    });
    ok('aucun libellé tronqué', tronque.length === 0, tronque.join(', '));
    const cible = await p.evaluate(() => {
      const r = document.querySelector('.tabbar__item').getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    ok(`cible tactile suffisante (${cible.w}×${cible.h})`, cible.h >= 44 && cible.w >= 44);
  }

  // On navigue vers une autre vue puis on revient par l'onglet Accueil.
  await p.locator(`${items}[data-onglet="quiz"]`).click();
  await p.waitForTimeout(600);
  ok('l\'onglet Quiz s\'ouvre', await p.locator('#vue-quiz').isVisible());
  await p.locator(`${items}[data-onglet="accueil"]`).click();
  await p.waitForTimeout(600);
  ok('l\'onglet Accueil ramène à l\'accueil', await p.locator('#titre-accueil').isVisible());
  ok('et il est marqué courant',
     await p.locator(`${items}[data-onglet="accueil"]`).getAttribute('aria-current') === 'page');
  if (l === 390) await p.screenshot({ path: 'nav5.png' });
}
await b.close();
console.log(ko === 0 ? '\n✔ tous les contrôles passent\n' : `\n✘ ${ko} contrôle(s) en échec\n`);
process.exit(ko ? 1 : 0);
