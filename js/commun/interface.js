/* ==========================================================================
   interface.js — Ce que les deux applications partagent de leur coque
   --------------------------------------------------------------------------
   Thème, annonces aux lecteurs d'écran, bandeau de réseau, service worker.
   Un seul exemplaire : dupliqué dans chaque application, ce code aurait
   divergé à la première correction.
   ========================================================================== */

import { obtenirPreferences, definirPreference } from './store.js';
import { ico } from './icones.js';

/** Applique le thème retenu, en laissant l'URL primer sur la préférence. */
export function appliquerTheme() {
  const prefs = obtenirPreferences();
  const demande = new URLSearchParams(window.location.search).get('theme');
  const theme = (demande === 'a' || demande === 'b') ? demande : prefs.theme;
  if (demande) definirPreference('theme', demande);
  document.documentElement.dataset.theme = theme;
  document.body.dataset.lisibilite = prefs.hauteLisibilite ? 'haute' : 'normale';
  return theme;
}

/**
 * Annonce un changement aux lecteurs d'écran.
 * On vide avant d'écrire : sans cela, un même message deux fois de suite
 * n'est pas relu.
 */
export function annoncer(texte) {
  const el = document.getElementById('annonce');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => { el.textContent = texte; }, 60);
}

/**
 * Bandeau de perte de réseau.
 *
 * `navigator.onLine` ne suffit pas : il annonce « en ligne » sur un wifi de
 * hall capté mais sans accès, et repasse à true au rechargement d'une page
 * servie par le service worker. On le croise donc avec un fait vérifiable,
 * fourni par l'appelant : les données ont-elles été servies depuis le cache ?
 *
 * @param {() => boolean} depuisCache  état à consulter à chaque évaluation
 * @param {string} message             ce qui reste possible hors ligne
 */
export function surveillerReseau(depuisCache, message) {
  const bandeau = document.getElementById('bandeau-reseau');
  if (!bandeau) return;
  const maj = () => {
    const horsLigne = !navigator.onLine || Boolean(depuisCache && depuisCache());
    bandeau.hidden = !horsLigne;
    if (horsLigne) bandeau.innerHTML = `${ico('horsligne', 16)}<span>${message}</span>`;
  };
  window.addEventListener('online', maj);
  window.addEventListener('offline', maj);
  maj();
  return maj;
}

/**
 * Enregistre le service worker de la racine.
 *
 * Les deux applications vivent dans des sous-dossiers mais partagent un seul
 * service worker, placé à la racine : il couvre ainsi les deux, plus les
 * pages de mentions. Un service worker par application aurait mis en cache
 * deux fois les mêmes polices et les mêmes feuilles de style.
 */
export function enregistrerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const url = new URL('../../sw.js', import.meta.url);
  navigator.serviceWorker.register(url, { scope: new URL('../../', import.meta.url).pathname })
    .catch((err) => console.warn('[interface] service worker non enregistré', err));
}
