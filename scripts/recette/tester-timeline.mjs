import { chromium } from 'playwright-core';
const BASE = process.env.URL_BASE || 'http://127.0.0.1:8123/';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--disable-gpu'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, locale: 'fr-FR' })).newPage();
let ko = 0;
const ok = (n, c, d = '') => { console.log((c ? '  ✔ ' : '  ✘ ') + n + (c ? '' : '  → ' + d)); if (!c) ko++; };
p.on('pageerror', (e) => { console.log('   EXCEPTION ' + e.message); ko++; });

await p.goto(BASE, { waitUntil: 'networkidle' });
await p.evaluate(() => { window.location.hash = '#/metiers'; });
await p.waitForTimeout(900);

ok('le parcours annonce 10 phases, 3 étapes, 8 services',
   (await p.locator('#metiers-sous').textContent()).replace(/\s+/g,' ').includes('10 phases · 3 étapes · 8 services'),
   await p.locator('#metiers-sous').textContent());
ok('plus de bandeau « contenu en préparation »',
   !(await p.locator('#vue-metiers').innerText()).includes('pas encore disponible'));
ok('les 10 phases sont listées', await p.locator('#vue-metiers a.phase').count() === 10,
   String(await p.locator('#vue-metiers a.phase').count()));
ok('les 3 étapes ont leur intertitre', await p.locator('#vue-metiers .etape__nom').count() === 3);
ok('les 8 services sont listés',
   (await p.locator('#titre-services').textContent()).includes('8 services'));

await p.screenshot({ path: 'tl-liste.png' });

console.log('\n— Détail d\'une phase —');
await p.locator('#vue-metiers a.phase').nth(6).click();   // phase 07
await p.waitForTimeout(600);
const detail = await p.locator('#vue-phase').innerText();
ok('la phase 07 s\'ouvre', detail.includes('Sécurité, conformité & réception'), detail.slice(0,80));
ok('sa citation du roll-up est reprise', detail.includes('On valide et on sécurise'));
ok('ses 3 points clés sont là', await p.locator('#vue-phase .points li').count() === 3);
ok('ses 2 intervenants sont nommés', detail.includes('Sécurité, sûreté & prévention') && detail.includes('Études et travaux'));
ok('la navigation entre phases est proposée',
   await p.locator('#vue-phase a[href="#/phase/6"]').count() === 1
   && await p.locator('#vue-phase a[href="#/phase/8"]').count() === 1);
await p.screenshot({ path: 'tl-phase.png' });

console.log('\n— Bornes —');
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.evaluate(() => { window.location.hash = '#/phase/1'; });
await p.waitForTimeout(600);
ok('la phase 1 n\'offre pas de précédente',
   await p.locator('#vue-phase a[href="#/phase/0"]').count() === 0);
await p.evaluate(() => { window.location.hash = '#/phase/10'; });
await p.waitForTimeout(500);
ok('la phase 10 n\'offre pas de suivante',
   await p.locator('#vue-phase a[href="#/phase/11"]').count() === 0);
await p.evaluate(() => { window.location.hash = '#/phase/99'; });
await p.waitForTimeout(500);
ok('une phase inexistante est annoncée, sans planter',
   (await p.locator('#vue-phase').innerText()).includes("n'existe pas"));

await b.close();
console.log(ko === 0 ? '\n✔ tous les contrôles passent\n' : `\n✘ ${ko} contrôle(s) en échec\n`);
process.exit(ko ? 1 : 0);
