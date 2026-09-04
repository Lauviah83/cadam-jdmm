/* Recette des parcours complets : quiz de bout en bout, réponses multiples,
   formulaire en plan B, mode hors ligne, affichage PC. */
import { chromium } from 'playwright-core';

const BASE = process.env.URL_BASE || 'http://127.0.0.1:8123/';
const navigateur = await chromium.launch({
  executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-gpu'],
});

let ko = 0;
const ok = (nom, cond, detail = '') => {
  console.log((cond ? '  ✔ ' : '  ✘ ') + nom + (cond ? '' : '  → ' + detail));
  if (!cond) ko++;
};

async function nouvellePage(largeur = 390, hauteur = 844) {
  const ctx = await navigateur.newContext({
    viewport: { width: largeur, height: hauteur },
    isMobile: largeur < 900, hasTouch: largeur < 900, locale: 'fr-FR',
  });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { console.log('   EXCEPTION ' + e.message); ko++; });
  return p;
}

/* ── Quiz de bout en bout ─────────────────────────────────────────────── */
console.log('\n— Quiz « prévention incendie », les 8 questions —');
let page = await nouvellePage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => { window.location.hash = '#/quiz/feu'; });
await page.waitForTimeout(500);

for (let n = 1; n <= 8; n++) {
  const compteur = (await page.locator('.quiz__compteur').textContent()).replace(/\s+/g, ' ');
  if (!compteur.includes(`${n} / 8`)) { ok(`question ${n} affichée`, false, compteur); break; }
  await page.locator('.option').first().click();
  await page.locator('#quiz-action').click();      // valider
  await page.waitForTimeout(160);
  await page.locator('#quiz-action').click();      // suivante / résultat
  await page.waitForTimeout(220);
}
ok('les 8 questions s\'enchaînent jusqu\'au résultat', await page.locator('.score__grand').isVisible());
const total = await page.locator('.score__total').textContent();
ok('le total affiché est /8', total.trim() === '/8', total);
ok('un verdict est affiché', (await page.locator('.correction h1').textContent()).length > 5);
ok('le récapitulatif liste les 8 questions',
   await page.locator('#vue-partie ul li').count() === 8);
ok('le verdict ne contient aucun résidu technique',
   !/Q[FGS]_/.test(await page.locator('.correction').innerText()));

console.log('\n— Le score est mémorisé —');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => { window.location.hash = '#/quiz'; });
await page.waitForTimeout(400);
ok('le hub affiche le meilleur score obtenu',
   await page.locator('#vue-quiz .badge--succes').count() === 1);

/* ── Question à réponses multiples ─────────────────────────────────────── */
console.log('\n— Question à réponses multiples (gardiennage) —');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => { window.location.hash = '#/quiz/gard'; });
await page.waitForTimeout(500);
// La 3e question du quiz gardiennage est la seule à choix multiples.
for (let n = 1; n <= 2; n++) {
  await page.locator('.option').first().click();
  await page.locator('#quiz-action').click();
  await page.waitForTimeout(150);
  await page.locator('#quiz-action').click();
  await page.waitForTimeout(200);
}
ok('le groupe passe en role="group"',
   await page.locator('#quiz-options').getAttribute('role') === 'group');
ok('la consigne annonce plusieurs réponses',
   (await page.locator('#quiz-consigne').textContent()).includes('Plusieurs'));
ok('les marques sont carrées (choix multiple)',
   await page.locator('.option[data-multi="true"]').count() === 4);

// On coche les trois bonnes réponses : 0, 1 et 3.
for (const i of [0, 1, 3]) { await page.locator('.option').nth(i).click(); }
await page.waitForTimeout(150);
ok('trois options sont cochées simultanément',
   await page.locator('.option[aria-checked="true"]').count() === 3);
await page.locator('#quiz-action').click();
await page.waitForTimeout(250);
ok('l\'ensemble exact est reconnu comme juste',
   (await page.locator('.correction').innerText()).includes('Bonne réponse'));
ok('les 3 bonnes réponses sont signalées',
   await page.locator('.option[data-etat="juste"]').count() === 3);

/* ── Formulaire, plan B ────────────────────────────────────────────────── */
console.log('\n— Sélection puis formulaire (aucune clé configurée : plan B) —');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => { window.location.hash = '#/postes'; });
await page.waitForTimeout(600);
await page.locator('#postes-liste a.carte--action').nth(4).click();
await page.waitForTimeout(400);
await page.locator('#vue-poste [data-selection]').click();
await page.waitForTimeout(250);
await page.evaluate(() => { window.location.hash = '#/selection'; });
await page.waitForTimeout(400);
ok('le poste retenu apparaît dans le panier',
   await page.locator('#vue-selection [role="listitem"]').count() === 1);

await page.locator('#vue-selection a[href="#/formulaire"]').click();
await page.waitForTimeout(400);
ok('le formulaire s\'ouvre', await page.locator('#email').isVisible());
ok('l\'adresse est le seul champ visible obligatoire',
   await page.locator('#formulaire-envoi input[required]').count() === 2);  // email + case RGPD
ok('les champs facultatifs sont repliés',
   !(await page.locator('#prenom').isVisible()));

// Sans cocher la case
await page.locator('#email').fill('visiteur@exemple.fr');
await page.locator('#bouton-envoyer').click();
await page.waitForTimeout(250);
ok('l\'envoi est refusé sans consentement',
   await page.locator('#erreur-rgpd').isVisible());

// Adresse invalide
await page.locator('#rgpd').check();
await page.locator('#email').fill('pas-une-adresse');
await page.locator('#bouton-envoyer').click();
await page.waitForTimeout(250);
ok('une adresse invalide est refusée', await page.locator('#erreur-email').isVisible());
ok('le champ est marqué invalide',
   await page.locator('#email').getAttribute('aria-invalid') === 'true');

// Envoi valide → plan B (aucune clé)
await page.locator('#email').fill('visiteur@exemple.fr');
await page.waitForTimeout(3200);            // délai minimum anti-robot
await page.locator('#bouton-envoyer').click();
await page.waitForTimeout(900);
const conf = await page.locator('#vue-formulaire').innerText();
ok('la confirmation est affichée', conf.includes('Demande enregistrée') || conf.includes("C'est envoyé"));
ok('elle dit franchement que l\'envoi automatique n\'est pas activé',
   conf.includes("n'est pas encore activé"), conf.slice(0, 120));
ok('le téléchargement est proposé', await page.locator('#conf-telecharger').isVisible());
ok('le lien mailto pré-rempli est proposé', await page.locator('#conf-mailto').isVisible());
const mailto = await page.locator('#conf-mailto').getAttribute('href');
ok('le mailto vise bien le visiteur', mailto.startsWith('mailto:visiteur%40exemple.fr'));

/* ── Mode hors ligne ───────────────────────────────────────────────────── */
console.log('\n— Mode hors ligne —');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);              // laisse le service worker s'installer
await page.context().setOffline(true);
await page.waitForTimeout(400);
// Cas réel : le visiteur perd le réseau pendant sa visite.
ok('le bandeau hors ligne apparaît à la coupure',
   await page.locator('#bandeau-reseau').isVisible().catch(() => false));
// Puis il recharge. (Chromium remet navigator.onLine à true après un
// rechargement piloté : on vérifie que l'application se charge quand même
// depuis le cache, ce que seul le service worker permet.)
await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
await page.waitForTimeout(1200);
ok('l\'application se recharge hors ligne',
   await page.locator('#titre-accueil').isVisible().catch(() => false));
await page.evaluate(() => { window.location.hash = '#/quiz'; });
await page.waitForTimeout(500);
ok('les quiz restent utilisables hors ligne',
   await page.locator('#vue-quiz a.quiz').count() === 3);
await page.context().setOffline(false);

/* ── Affichage PC ──────────────────────────────────────────────────────── */
console.log('\n— Affichage PC (1440 × 900) —');
const pc = await nouvellePage(1440, 900);
await pc.goto(BASE, { waitUntil: 'networkidle' });
await pc.waitForTimeout(500);
ok('la barre d\'onglets basse disparaît', !(await pc.locator('.tabbar').isVisible()));
ok('la navigation haute apparaît', await pc.locator('.topnav').isVisible());
ok('les 5 entrées sont dans la navigation haute',
   await pc.locator('.topnav__lien').count() === 5,
   String(await pc.locator('.topnav__lien').count()));
const largeur = await pc.locator('#vue-accueil .section').first().evaluate((el) => el.getBoundingClientRect().width);
ok('le contenu est borné à 1100 px', largeur <= 1100, `${Math.round(largeur)}px`);

await navigateur.close();
console.log(ko === 0 ? '\n✔ tous les contrôles passent\n' : `\n✘ ${ko} contrôle(s) en échec\n`);
process.exit(ko ? 1 : 0);
