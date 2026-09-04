/* ==========================================================================
   app.js — Démarrage, routage, navigation, état global de l'interface
   --------------------------------------------------------------------------
   Routage par fragment (#/postes). Choisi plutôt que l'History API parce que
   GitHub Pages sert des fichiers statiques : une URL /postes rechargée
   donnerait un 404. Le fragment survit au rechargement et au partage.
   ========================================================================== */

import { chargerConfig, chargerOffres, evaluerFraicheur } from './offers.js';
import {
  obtenirPreferences, definirPreference, surChangement, nombreSelectionnees,
} from './store.js';
import { activerRejeuAutomatique } from './mailer.js';
import { ico } from './icones.js';

import * as vueMetiers from './views/metiers.js';
import * as vueQuiz from './views/quiz.js';
import * as vuePostes from './views/postes.js';
import * as vueSelection from './views/selection.js';

const ONGLETS = [
  { id: 'metiers',   libelle: 'Métiers',      route: '#/metiers' },
  { id: 'quiz',      libelle: 'Quiz',         route: '#/quiz' },
  { id: 'postes',    libelle: 'Postes',       route: '#/postes' },
  { id: 'selection', libelle: 'Ma sélection', route: '#/selection' },
];

/* Chaque route nomme la vue à afficher, l'onglet à marquer comme courant,
   et la fonction qui la rend. `motif` capture les paramètres. */
const ROUTES = [
  { motif: /^#?\/?$/,                   vue: 'accueil',    onglet: 'metiers',   rendu: (a) => rendreAccueil(a) },
  { motif: /^#\/accueil$/,              vue: 'accueil',    onglet: 'metiers',   rendu: (a) => rendreAccueil(a) },
  { motif: /^#\/metiers$/,              vue: 'metiers',    onglet: 'metiers',   rendu: vueMetiers.rendreListe },
  { motif: /^#\/phase\/(\d+)$/,         vue: 'phase',      onglet: 'metiers',   rendu: vueMetiers.rendrePhase },
  { motif: /^#\/quiz$/,                 vue: 'quiz',       onglet: 'quiz',      rendu: vueQuiz.rendreHub },
  { motif: /^#\/quiz\/([a-z]+)$/,       vue: 'partie',     onglet: 'quiz',      rendu: vueQuiz.rendrePartie },
  { motif: /^#\/postes$/,               vue: 'postes',     onglet: 'postes',    rendu: vuePostes.rendreListe },
  { motif: /^#\/poste\/([\w-]+)$/,      vue: 'poste',      onglet: 'postes',    rendu: vuePostes.rendreFiche },
  { motif: /^#\/selection$/,            vue: 'selection',  onglet: 'selection', rendu: vueSelection.rendreListe },
  { motif: /^#\/formulaire$/,           vue: 'formulaire', onglet: 'selection', rendu: vueSelection.rendreFormulaire },
];

let config = {};

/* =========================================================================
   Démarrage
   ========================================================================= */

async function demarrer() {
  appliquerPreferences();
  config = await chargerConfig();

  construireNavigation();
  brancherSelecteurTheme();
  brancherLisibilite();
  surveillerReseau();
  afficherEvenement();

  // Le compteur de la sélection suit l'état, où qu'il change.
  surChangement('selection', majCompteurs);
  majCompteurs();

  window.addEventListener('hashchange', router);
  router();

  // Ces deux-là ne conditionnent pas l'affichage : on ne les attend pas.
  enregistrerServiceWorker();
  activerRejeuAutomatique((bilan) => {
    annoncer(`${bilan.rejouees} demande${bilan.rejouees > 1 ? 's' : ''} envoyée${bilan.rejouees > 1 ? 's' : ''} au retour du réseau.`);
  });
  afficherFraicheur();
}

/* =========================================================================
   Routage
   ========================================================================= */

function router() {
  const fragment = window.location.hash || '#/';
  const route = ROUTES.find((r) => r.motif.test(fragment));

  if (!route) {
    // Fragment inconnu (lien périmé, faute de frappe) : on ramène à l'accueil
    // plutôt que d'afficher une page blanche.
    window.location.hash = '#/';
    return;
  }

  const params = (fragment.match(route.motif) || []).slice(1);
  const section = document.getElementById(`vue-${route.vue}`);

  // `hidden` en plus de la classe : les vues inactives restent dans le DOM
  // (elles conservent leur état), mais elles sont explicitement retirées de
  // l'arbre d'accessibilité — sinon plusieurs h1 y coexistent.
  document.querySelectorAll('.vue').forEach((v) => {
    v.classList.remove('active');
    v.hidden = true;
  });
  section.hidden = false;
  section.classList.add('active');
  section.classList.remove('apparait');
  void section.offsetWidth;          // redémarre l'animation d'entrée
  section.classList.add('apparait');

  marquerOnglet(route.onglet);

  try {
    route.rendu(section, ...params);
  } catch (err) {
    console.error('[app] rendu en échec', err);
    section.innerHTML = `<div class="section"><div class="bandeau bandeau--alerte">
      ${ico('alerte', 16)}<span>Cette page n'a pas pu s'afficher. Réessayez, ou revenez à l'accueil.</span>
    </div></div>`;
  }

  // Une vue de détail s'ouvre en haut ; un retour vers une liste garde sa place
  // si le navigateur la restaure lui-même.
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  const titre = section.querySelector('h1');
  if (titre) annoncer(titre.textContent.trim());
}

/** Navigation programmée depuis une vue. */
export function aller(route) {
  window.location.hash = route;
}

/* =========================================================================
   Navigation
   ========================================================================= */

function construireNavigation() {
  document.querySelectorAll('[data-onglet]').forEach((lien) => {
    const onglet = ONGLETS.find((o) => o.id === lien.dataset.onglet);
    if (!onglet) return;
    const pastille = onglet.id === 'selection'
      ? `<span class="${lien.classList.contains('topnav__lien') ? 'topnav__pastille' : 'tabbar__pastille'}"
              data-compteur hidden></span>` : '';
    lien.innerHTML = `${pastille}${ico(onglet.id, lien.classList.contains('topnav__lien') ? 18 : 22)}
      <span>${onglet.libelle}</span>`;
  });
}

function marquerOnglet(id) {
  document.querySelectorAll('[data-onglet]').forEach((lien) => {
    if (lien.dataset.onglet === id) lien.setAttribute('aria-current', 'page');
    else lien.removeAttribute('aria-current');
  });
}

function majCompteurs() {
  const n = nombreSelectionnees();
  document.querySelectorAll('[data-compteur]').forEach((el) => {
    el.textContent = String(n);
    el.hidden = n === 0;
    // Le nombre seul ne dit rien à un lecteur d'écran hors contexte.
    el.setAttribute('aria-label', `${n} poste${n > 1 ? 's' : ''} dans ma sélection`);
  });
}

/* =========================================================================
   Accueil
   ========================================================================= */

async function rendreAccueil(section) {
  const ev = config.evenement || {};
  const date = ev.date_confirmee === false ? `${ev.date} (à confirmer)` : ev.date;

  const tuile = (route, icone, titre, sous) => `
    <a class="carte carte--action" href="${route}">
      <span class="pastille-service" aria-hidden="true">${ico(icone, 21)}</span>
      <span class="carte__corps">
        <span class="carte__titre">${titre}</span>
        <span class="carte__sous">${sous}</span>
      </span>
      <span aria-hidden="true" style="color:var(--texte-faible)">${ico('chevron', 18)}</span>
    </a>`;

  section.innerHTML = `
    <div class="hero">
      <div class="hero__interieur">
        <div>
          <p class="badge" style="background:rgba(255,255,255,.10);color:var(--accent);border-color:rgba(255,255,255,.18)">
            ${ev.lieu || ''} · ${date || ''}
          </p>
          <h1 id="titre-accueil">Métiers &amp; mobilité<br><em>à la DCIP</em></h1>
          <p class="sous">Construire, entretenir et sécuriser les bâtiments du Département :
            8 services, 10 phases, des métiers qu'on ne soupçonne pas.</p>
        </div>
      </div>
    </div>
    <div class="section pile">
      ${tuile('#/metiers', 'metiers', "La vie d'un projet immobilier", "10 phases, de l'intention à l'exploitation")}
      ${tuile('#/quiz', 'quiz', 'Trois quiz, trois métiers', 'Incendie, gardiennage, sûreté')}
      ${tuile('#/postes', 'postes', 'Les postes ouverts', 'Les fiches DCIP et les offres du Département')}
      <div id="accueil-fraicheur" style="min-height:38px"></div>
    </div>`;

  // La fraîcheur des offres arrive après coup : elle ne doit pas retarder l'écran.
  const charge = await chargerOffres();
  if (charge.depuisCache) { serviDepuisCache = true; majBandeauReseau(); }
  const f = evaluerFraicheur(charge, (config.offres || {}).fraicheur_alerte_heures ?? 72);
  const cible = document.getElementById('accueil-fraicheur');
  if (cible && charge.count) {
    cible.innerHTML = `<div class="bandeau bandeau--${f.perimee ? 'alerte' : 'succes'}">
      ${ico(f.perimee ? 'alerte' : 'coche', 16)}<span>${f.libelle} — ${charge.count} offres au Département</span></div>`;
  }
}

/* =========================================================================
   Éléments d'interface transverses
   ========================================================================= */

function afficherEvenement() {
  const ev = config.evenement || {};
  const el = document.getElementById('topnav-evenement');
  if (el) el.textContent = [ev.lieu, ev.date].filter(Boolean).join(' · ');
}

async function afficherFraicheur() {
  const charge = await chargerOffres();
  if (charge.depuisCache) { serviDepuisCache = true; majBandeauReseau(); }
  const f = evaluerFraicheur(charge, (config.offres || {}).fraicheur_alerte_heures ?? 72);
  const el = document.getElementById('pied-fraicheur');
  if (!el) return;
  el.textContent = charge.count
    ? `${f.libelle}. Les offres font foi sur le site du Département.`
    : 'Offres momentanément indisponibles — consultez le site du Département.';
}

/**
 * Bandeau de perte de réseau.
 *
 * `navigator.onLine` ne suffit pas : il ment dans les deux sens. Il dit
 * « en ligne » sur un wifi de hall d'exposition capté mais sans accès, et il
 * repasse à true au rechargement d'une page servie par le service worker.
 * On le croise donc avec un fait vérifiable : les offres ont-elles été
 * servies depuis le cache plutôt que depuis le réseau ? Le service worker
 * marque ces réponses (voir sw.js), et offers.js remonte l'information.
 */
let serviDepuisCache = false;

function surveillerReseau() {
  window.addEventListener('online', () => { serviDepuisCache = false; majBandeauReseau(); });
  window.addEventListener('offline', majBandeauReseau);
  majBandeauReseau();
}

function majBandeauReseau() {
  const bandeau = document.getElementById('bandeau-reseau');
  if (!bandeau) return;
  const horsLigne = !navigator.onLine || serviDepuisCache;
  bandeau.hidden = !horsLigne;
  if (horsLigne) {
    bandeau.innerHTML = `${ico('horsligne', 16)}
      <span>Hors ligne — les quiz et le parcours restent utilisables.</span>`;
  }
}

function appliquerPreferences() {
  const prefs = obtenirPreferences();

  // Le paramètre d'URL l'emporte et devient la préférence : c'est ce qui
  // permet de partager un lien vers l'un ou l'autre habillage.
  const demande = new URLSearchParams(window.location.search).get('theme');
  const theme = (demande === 'a' || demande === 'b') ? demande : prefs.theme;
  if (demande) definirPreference('theme', demande);

  document.documentElement.dataset.theme = theme;
  document.body.dataset.lisibilite = prefs.hauteLisibilite ? 'haute' : 'normale';
}

/* THEME SWITCHER — à supprimer après arbitrage (Design A retenu le 04/09/2026).
   Retirer cette fonction, son appel dans demarrer(), le bloc correspondant
   dans index.html, le <link> de themes/b.css et le fichier lui-même. */
function brancherSelecteurTheme() {
  const boutons = document.querySelectorAll('[data-theme-choix]');
  const majEtat = () => {
    const actif = document.documentElement.dataset.theme;
    boutons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoix === actif)));
  };
  boutons.forEach((b) => b.addEventListener('click', () => {
    document.documentElement.dataset.theme = b.dataset.themeChoix;
    definirPreference('theme', b.dataset.themeChoix);
    majEtat();
    annoncer(`Habillage ${b.dataset.themeChoix.toUpperCase()} appliqué.`);
  }));
  majEtat();
}
/* FIN THEME SWITCHER */

function brancherLisibilite() {
  const bouton = document.getElementById('bouton-lisibilite');
  if (!bouton) return;
  const majEtat = () => {
    const actif = obtenirPreferences().hauteLisibilite;
    bouton.setAttribute('aria-pressed', String(actif));
    document.body.dataset.lisibilite = actif ? 'haute' : 'normale';
  };
  bouton.addEventListener('click', () => {
    definirPreference('hauteLisibilite', !obtenirPreferences().hauteLisibilite);
    majEtat();
  });
  majEtat();
}

/* =========================================================================
   Feuille modale — piège de focus compris (RGAA 12.8)
   ========================================================================= */

let focusAvantModale = null;

export function ouvrirFeuille(titre, contenuHTML) {
  const voile = document.getElementById('voile');
  const feuille = document.getElementById('feuille');
  document.getElementById('feuille-contenu').innerHTML =
    `<h2 id="feuille-titre">${titre}</h2>${contenuHTML}`;

  focusAvantModale = document.activeElement;
  voile.hidden = false;
  feuille.hidden = false;
  // Le fond ne défile pas pendant qu'une feuille est ouverte.
  document.body.style.overflow = 'hidden';

  const focusables = feuille.querySelectorAll(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusables.length) focusables[0].focus();

  feuille.addEventListener('keydown', pieger);
  voile.addEventListener('click', fermerFeuille, { once: true });
}

function pieger(evenement) {
  if (evenement.key === 'Escape') { fermerFeuille(); return; }
  if (evenement.key !== 'Tab') return;

  const feuille = document.getElementById('feuille');
  const focusables = [...feuille.querySelectorAll(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.offsetParent !== null);
  if (!focusables.length) return;

  const premier = focusables[0];
  const dernier = focusables[focusables.length - 1];
  if (evenement.shiftKey && document.activeElement === premier) {
    evenement.preventDefault(); dernier.focus();
  } else if (!evenement.shiftKey && document.activeElement === dernier) {
    evenement.preventDefault(); premier.focus();
  }
}

export function fermerFeuille() {
  const feuille = document.getElementById('feuille');
  document.getElementById('voile').hidden = true;
  feuille.hidden = true;
  document.body.style.overflow = '';
  feuille.removeEventListener('keydown', pieger);
  // Le focus revient d'où il venait, sinon le clavier repart du début de page.
  if (focusAvantModale && focusAvantModale.focus) focusAvantModale.focus();
}

/* =========================================================================
   Annonces aux lecteurs d'écran
   ========================================================================= */

export function annoncer(texte) {
  const el = document.getElementById('annonce');
  if (!el) return;
  // Vider puis réécrire : sans cela, un même message deux fois de suite
  // n'est pas relu.
  el.textContent = '';
  setTimeout(() => { el.textContent = texte; }, 60);
}

/* =========================================================================
   Service worker
   ========================================================================= */

function enregistrerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Chemin relatif : l'application est servie depuis un sous-chemin sur
  // GitHub Pages, où « /sw.js » n'existerait pas.
  navigator.serviceWorker.register('./sw.js').catch((err) => {
    console.warn('[app] service worker non enregistré', err);
  });
}

/* Le module est chargé en différé par le navigateur (type="module") : le DOM
   peut déjà être prêt. On couvre les deux cas. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', demarrer);
} else {
  demarrer();
}
