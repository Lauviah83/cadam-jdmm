/* ==========================================================================
   quiz/app.js — Application « Trois quiz »
   --------------------------------------------------------------------------
   Reproduction de sources/quiz-hub-mobile.html : un hub de trois cartes, puis
   le quiz choisi. Le moteur est dans moteur.js — un seul, là où les sources
   en avaient trois copies préfixées (QF_, QG_, QS_), d'où trois occasions de
   diverger. Elles avaient d'ailleurs divergé : les compteurs annonçaient 9, 8
   et 8 questions pour des tableaux de 8, 6 et 6.
   ========================================================================== */

import {
  appliquerTheme, annoncer, surveillerReseau, enregistrerServiceWorker,
} from '../commun/interface.js';
import { chargerConfig } from '../commun/offers.js';
import { rendreHub, rendrePartie, memoriserConfig } from './moteur.js';

const ROUTES = [
  [/^#?\/?$/,              (cible) => rendreHub(cible)],
  [/^#\/([a-z]+)$/,        (cible, id) => rendrePartie(cible, id)],
];

async function demarrer() {
  appliquerTheme();

  memoriserConfig(await chargerConfig());

  // Les quiz sont entièrement embarqués : ils fonctionnent sans réseau.
  // Le bandeau ne signale donc que l'état, sans alarmer.
  surveillerReseau(() => false, 'Hors ligne — les quiz restent jouables.');

  window.addEventListener('hashchange', router);
  router();
  enregistrerServiceWorker();
}

function router() {
  const fragment = window.location.hash || '#/';
  const trouve = ROUTES.find(([motif]) => motif.test(fragment));
  const cible = document.getElementById('vue');

  if (!trouve) { window.location.hash = '#/'; return; }
  const params = (fragment.match(trouve[0]) || []).slice(1);

  try {
    trouve[1](cible, ...params);
  } catch (err) {
    console.error('[quiz] rendu en échec', err);
    cible.innerHTML = `<div class="section"><div class="bandeau bandeau--alerte">
      <span>Ce quiz n'a pas pu s'afficher. <a href="#/">Revenir au choix des quiz</a>.</span>
    </div></div>`;
  }
  window.scrollTo({ top: 0 });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', demarrer);
} else {
  demarrer();
}

export { annoncer };
