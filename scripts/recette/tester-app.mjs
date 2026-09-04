/* Recette de l'application dans un vrai navigateur. */
import { chromium } from 'playwright-core';

const BASE = process.env.URL_BASE || 'http://127.0.0.1:8123/';
const navigateur = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-gpu'],
});
const contexte = await navigateur.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true, hasTouch: true,
  locale: 'fr-FR',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const page = await contexte.newPage();

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push('EXCEPTION ' + e.message));

let ko = 0;
const ok = (nom, cond, detail = '') => {
  console.log((cond ? '  ✔ ' : '  ✘ ') + nom + (cond ? '' : '  ' + detail));
  if (!cond) ko++;
};

async function aller(hash) {
  // Un goto vers une URL identique ne recharge pas : on repart de la racine
  // pour garantir un module remis à zéro, puis on pose le fragment.
  await page.goto(BASE, { waitUntil: 'networkidle' });
  if (hash) {
    await page.evaluate((h) => { window.location.hash = h; }, hash.replace(/^#/, '#'));
  }
  await page.waitForTimeout(400);
}

console.log('\n— Démarrage —');
await aller('');
ok('la page se charge sans erreur console', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));
ok('le titre de l\'accueil est présent', await page.locator('#titre-accueil').isVisible());
ok('la barre d\'onglets a 5 entrées', await page.locator('.tabbar__item').count() === 5,
   String(await page.locator('.tabbar__item').count()));
ok('les libellés des onglets sont rendus',
   (await page.locator('.tabbar__item').first().textContent()).includes('Accueil'));
ok('le bandeau de fraîcheur des offres apparaît',
   await page.locator('#accueil-fraicheur .bandeau').isVisible());

console.log('\n— Navigation —');
await page.locator('.tabbar__item[data-onglet="postes"]').click();
await page.waitForTimeout(700);
ok('l\'onglet Postes s\'ouvre', await page.locator('#titre-postes').isVisible());
ok('l\'onglet actif est marqué',
   await page.locator('.tabbar__item[data-onglet="postes"]').getAttribute('aria-current') === 'page');
const nbCartes = await page.locator('#postes-liste > [role="listitem"]').count();
ok('les 7 fiches DCIP sont listées', nbCartes === 7, `trouvé ${nbCartes}`);
ok('le bandeau dit combien de fiches sont en ligne',
   (await page.locator('#postes-bandeau').textContent()).includes('encore en ligne'));

console.log('\n— Bascule vers toutes les offres —');
await page.locator('[data-onglet-liste="tous"]').click();
await page.waitForTimeout(500);
const nbOffres = await page.locator('#postes-liste > [role="listitem"]').count();
ok('les offres du Département sont listées', nbOffres > 40, `trouvé ${nbOffres}`);
ok('la recherche est présente', await page.locator('#postes-recherche').isVisible());
await page.locator('#postes-recherche').fill('ingénieur');
await page.waitForTimeout(600);
const filtres = await page.locator('#postes-liste > [role="listitem"]').count();
ok('la recherche filtre la liste', filtres > 0 && filtres < nbOffres, `${filtres} sur ${nbOffres}`);

console.log('\n— Fiche de poste et sélection —');
await aller('#/postes');
await page.locator('#postes-liste a.carte--action').first().click();
await page.waitForTimeout(500);
ok('la fiche de poste s\'ouvre', (await page.locator('#vue-poste .hero h1').textContent()).length > 10);
ok('les missions sont affichées', await page.locator('#vue-poste .points li').count() > 0);
await page.locator('#vue-poste [data-selection]').first().click();
await page.waitForTimeout(300);
ok('le compteur de la barre d\'onglets passe à 1',
   (await page.locator('.tabbar__pastille').first().textContent()) === '1');
ok('le bouton devient « Retirer »',
   (await page.locator('#vue-poste [data-selection] [data-selection-libelle]').first().textContent()).includes('Retirer'));

console.log('\n— Quiz —');
await aller('#/quiz');
ok('les 3 quiz sont proposés', await page.locator('#vue-quiz a.quiz').count() === 3);
const libelles = await page.locator('#vue-quiz a.quiz .mono').allTextContents();
ok('les compteurs annoncent 8, 6 et 6 questions',
   libelles.filter((t) => /questions/.test(t)).join(' ').replace(/\s+/g, ' ').includes('8 questions')
   && libelles.join(' ').includes('6 questions'),
   libelles.join(' | '));

await page.locator('#vue-quiz a.quiz').first().click();
await page.waitForTimeout(500);
ok('la première question s\'affiche', await page.locator('#quiz-question').isVisible());
ok('le compteur dit « 1 / 8 »',
   (await page.locator('.quiz__compteur').textContent()).replace(/\s+/g, ' ').includes('1 / 8'));
ok('le groupe de réponses est un radiogroup',
   await page.locator('#quiz-options').getAttribute('role') === 'radiogroup');
ok('le bouton Valider est désactivé sans choix',
   await page.locator('#quiz-action').isDisabled());

await page.locator('.option').first().click();
await page.waitForTimeout(200);
ok('choisir active le bouton', !(await page.locator('#quiz-action').isDisabled()));
ok('l\'option choisie est marquée',
   await page.locator('.option').first().getAttribute('aria-checked') === 'true');

await page.locator('#quiz-action').click();
await page.waitForTimeout(300);
ok('la correction s\'affiche', await page.locator('.correction').isVisible());
ok('la bonne réponse est signalée', await page.locator('.option[data-etat="juste"]').count() === 1);
ok('les options sont verrouillées après validation',
   await page.locator('.option').first().isDisabled());

console.log('\n— Aucun résidu technique dans les textes visibles —');
const texteVisible = await page.locator('body').innerText();
ok('pas de QF_ / QG_ / QS_ à l\'écran', !/Q[FGS]_/.test(texteVisible));

console.log('\n— Erreurs console cumulées —');
ok('aucune erreur JavaScript', erreurs.length === 0, erreurs.slice(0, 3).join(' | '));

await navigateur.close();
console.log(ko === 0 ? '\n✔ tous les contrôles passent\n' : `\n✘ ${ko} contrôle(s) en échec\n`);
process.exit(ko ? 1 : 0);
