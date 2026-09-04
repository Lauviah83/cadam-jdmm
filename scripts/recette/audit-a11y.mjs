/* Audit d'accessibilité sur chaque écran, moteur axe-core, règles WCAG 2.1 AA
   (socle du RGAA 4.1). Les fonds sombres des quiz sont inclus : c'est là que
   les contrastes sont les plus risqués. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const axe = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox','--disable-gpu'] });

const ECRANS = [
  ['Accueil', '', null],
  ['Parcours', '#/metiers', null],
  ['Hub des quiz', '#/quiz', null],
  ['Question de quiz (fond sombre)', '#/quiz/feu', null],
  ['Correction de quiz', '#/quiz/feu', async (p) => {
    await p.locator('.option').nth(1).click();
    await p.locator('#quiz-action').click(); await p.waitForTimeout(300);
  }],
  ['Liste des postes', '#/postes', null],
  ['Toutes les offres', '#/postes', async (p) => {
    await p.locator('[data-onglet-liste="tous"]').click(); await p.waitForTimeout(500);
  }],
  ['Fiche de poste', '#/postes', async (p) => {
    await p.locator('#postes-liste a.carte--action').first().click(); await p.waitForTimeout(400);
  }],
  ['Ma sélection', '#/postes', async (p) => {
    await p.locator('#postes-liste a.carte--action').first().click(); await p.waitForTimeout(300);
    await p.locator('#vue-poste [data-selection]').click(); await p.waitForTimeout(200);
    await p.evaluate(() => { window.location.hash = '#/selection'; }); await p.waitForTimeout(400);
  }],
  ['Formulaire', '#/postes', async (p) => {
    await p.locator('#postes-liste a.carte--action').first().click(); await p.waitForTimeout(300);
    await p.locator('#vue-poste [data-selection]').click(); await p.waitForTimeout(200);
    await p.evaluate(() => { window.location.hash = '#/formulaire'; }); await p.waitForTimeout(400);
  }],
];

const tousLesProblemes = [];

for (const largeur of [390, 1440]) {
  const ctx = await b.newContext({ viewport: { width: largeur, height: largeur === 390 ? 844 : 900 },
    isMobile: largeur === 390, hasTouch: largeur === 390, locale: 'fr-FR' });
  const page = await ctx.newPage();
  console.log(`\n═══ ${largeur === 390 ? 'MOBILE 390' : 'PC 1440'} ═══`);

  for (const [nom, hash, avant] of ECRANS) {
    await page.goto(process.env.URL_BASE || 'http://127.0.0.1:8123/', { waitUntil: 'networkidle' });
    if (hash) await page.evaluate((h) => { window.location.hash = h; }, hash);
    await page.waitForTimeout(600);
    if (avant) await avant(page);
    await page.waitForTimeout(200);

    await page.addScriptTag({ content: axe });
    const resultat = await page.evaluate(async () => {
      // On n'audite que la vue affichée : les vues inactives sont hidden.
      return await window.axe.run(document.body, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        resultTypes: ['violations'],
      });
    });

    const violations = resultat.violations.filter((v) => v.nodes.length > 0);
    if (!violations.length) {
      console.log(`  ✔ ${nom}`);
    } else {
      console.log(`  ✘ ${nom}`);
      violations.forEach((v) => {
        console.log(`      [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length})`);
        console.log(`        ex. ${v.nodes[0].html.slice(0, 130).replace(/\s+/g, ' ')}`);
        tousLesProblemes.push({ ecran: nom, largeur, id: v.id, impact: v.impact, aide: v.help,
          nb: v.nodes.length, exemple: v.nodes[0].html.slice(0, 200) });
      });
    }
  }
  await ctx.close();
}

await b.close();
fs.writeFileSync('audit-a11y.json', JSON.stringify(tousLesProblemes, null, 1));
console.log(`\n${tousLesProblemes.length} type(s) de violation à traiter`);
