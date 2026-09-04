/* ==========================================================================
   sw.js — Service worker de l'application « Métiers & Mobilité DCIP »
   --------------------------------------------------------------------------
   Deux stratégies, délibérément distinctes :

   • APP SHELL (HTML, CSS, JS, polices, icônes) → cache d'abord.
     C'est ce qui rend l'application utilisable en mode avion, exigence du §3.2 :
     le wifi d'un hall d'exposition est toujours mauvais.

   • DONNÉES (data/*.json) → réseau d'abord, repli sur le cache.
     Les offres d'emploi doivent être fraîches quand le réseau est là. Un cache
     d'abord servirait des offres périmées pendant des jours — précisément le
     piège signalé au §10.

   Toute modification de la liste RESSOURCES_SOCLE impose d'incrémenter
   CACHE_VERSION, sinon les anciens fichiers restent servis.
   ========================================================================== */

const CACHE_VERSION = 'v2';
const CACHE_SOCLE   = `jdmm-socle-${CACHE_VERSION}`;
const CACHE_DONNEES = `jdmm-donnees-${CACHE_VERSION}`;

// Chemins relatifs : l'application est servie depuis un sous-chemin sur
// GitHub Pages (/<depot>/), un chemin absolu « /index.html » y serait faux.
const RESSOURCES_SOCLE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/polices.css',
  // Les deux faces du premier rendu. Les autres (italique, latin-ext, mono)
  // sont mises en cache à la première rencontre, par la stratégie « cache
  // d'abord » : les précharger alourdirait l'installation sans nécessité.
  './assets/fonts/fraunces-normal-latin.woff2',
  './assets/fonts/manrope-normal-latin.woff2',
  './themes/tokens.css',
  './themes/a.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './js/app.js',
  './js/store.js',
  './js/offers.js',
  './js/mailer.js',
  './js/icones.js',
  './js/views/metiers.js',
  './js/views/quiz.js',
  './js/views/postes.js',
  './js/views/selection.js',
  './data/config.json',
  './data/quiz.json',
  './data/timeline.json',
  './data/postes-dcip.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/favicon-32.png',
  // La visionneuse de mentions et les documents qu'elle affiche : une
  // déclaration d'accessibilité inaccessible hors ligne serait paradoxale.
  './mentions.html',
  './js/mentions.js',
  './docs/RGPD.md',
  './docs/ACCESSIBILITE.md',
];

/* Volontairement ABSENT du socle : data/offers-details.json (296 ko).
   Il n'est utile qu'à l'ouverture d'une fiche d'offre, et la stratégie
   « réseau d'abord » le met en cache dès la première consultation. Le
   précharger multiplierait par sept le poids de l'installation. */

/* -------------------------------------------------------------------------
   Installation — on précharge le socle.
   `addAll` échoue en bloc si une seule ressource manque : on ajoute donc les
   fichiers un par un et on tolère les absents (le thème B ou une vue peuvent
   ne pas encore exister à un instant donné du développement).
   ------------------------------------------------------------------------- */
self.addEventListener('install', (evenement) => {
  evenement.waitUntil((async () => {
    const cache = await caches.open(CACHE_SOCLE);
    await Promise.all(RESSOURCES_SOCLE.map(async (chemin) => {
      try {
        await cache.add(new Request(chemin, { cache: 'reload' }));
      } catch (err) {
        console.warn('[sw] ressource non mise en cache :', chemin);
      }
    }));
    // Le nouveau service worker prend la main sans attendre la fermeture
    // de tous les onglets : sur un stand, personne ne ferme son navigateur.
    await self.skipWaiting();
  })());
});

/* -------------------------------------------------------------------------
   Activation — purge des caches des versions précédentes.
   ------------------------------------------------------------------------- */
self.addEventListener('activate', (evenement) => {
  evenement.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(
      noms
        .filter((nom) => nom.startsWith('jdmm-') &&
                         nom !== CACHE_SOCLE && nom !== CACHE_DONNEES)
        .map((nom) => caches.delete(nom))
    );
    await self.clients.claim();
  })());
});

/* -------------------------------------------------------------------------
   Interception des requêtes.
   ------------------------------------------------------------------------- */
self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;

  // On ne touche qu'aux lectures. Les envois de formulaire (Web3Forms, EmailJS)
  // doivent passer directement au réseau — la mise en file est gérée côté
  // application, dans mailer.js, pas ici.
  if (requete.method !== 'GET') return;

  const url = new URL(requete.url);

  // Requêtes vers d'autres origines : plus aucune au chargement depuis que les
  // polices sont servies par l'application. Seul le SDK EmailJS en émet, au
  // moment d'un envoi — on le laisse au navigateur.
  if (url.origin !== self.location.origin) return;

  // Données applicatives : réseau d'abord.
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    evenement.respondWith(reseauDAbord(requete, CACHE_DONNEES));
    return;
  }

  // Navigation (l'utilisateur ouvre ou recharge une page) : réseau d'abord pour
  // récupérer une nouvelle version, repli sur index.html mis en cache.
  if (requete.mode === 'navigate') {
    evenement.respondWith((async () => {
      try {
        return await fetch(requete);
      } catch (err) {
        const cache = await caches.open(CACHE_SOCLE);
        return (await cache.match(requete)) ||
               (await cache.match('./index.html')) ||
               new Response('Hors ligne', { status: 503, statusText: 'Hors ligne' });
      }
    })());
    return;
  }

  // Tout le reste (CSS, JS, images) : cache d'abord.
  evenement.respondWith(cacheDAbord(requete, CACHE_SOCLE));
});

/* -------------------------------------------------------------------------
   Stratégies
   ------------------------------------------------------------------------- */

/** Sert depuis le cache ; sinon va au réseau et met en cache au passage. */
async function cacheDAbord(requete, nomCache) {
  const cache = await caches.open(nomCache);
  const enCache = await cache.match(requete);
  if (enCache) return enCache;
  try {
    const reponse = await fetch(requete);
    // On ne met en cache que les réponses exploitables (les réponses opaques
    // des CDN de polices ont un status 0 : on les accepte quand même).
    if (reponse && (reponse.ok || reponse.type === 'opaque')) {
      cache.put(requete, reponse.clone());
    }
    return reponse;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Ressource indisponible hors ligne' });
  }
}

/** Va au réseau ; en cas d'échec, sert la dernière version connue. */
async function reseauDAbord(requete, nomCache) {
  const cache = await caches.open(nomCache);
  try {
    const reponse = await fetch(requete, { cache: 'no-store' });
    if (reponse && reponse.ok) {
      cache.put(requete, reponse.clone());
      return reponse;
    }
    throw new Error(`HTTP ${reponse.status}`);
  } catch (err) {
    const enCache = await cache.match(requete);
    if (enCache) {
      // L'application lit cet en-tête pour afficher « Données du JJ/MM »
      // et distinguer une donnée fraîche d'une donnée servie hors ligne.
      const entetes = new Headers(enCache.headers);
      entetes.set('X-Servi-Depuis-Cache', '1');
      return new Response(await enCache.blob(), {
        status: 200, statusText: 'OK (cache)', headers: entetes,
      });
    }
    return new Response(JSON.stringify({ erreur: 'hors-ligne', offers: [] }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }
}

/* -------------------------------------------------------------------------
   Canal de service — l'application peut demander une purge immédiate
   (bouton « Vider le cache » de la page d'exploitation).
   ------------------------------------------------------------------------- */
self.addEventListener('message', (evenement) => {
  if (evenement.data === 'PURGER_CACHE') {
    evenement.waitUntil((async () => {
      const noms = await caches.keys();
      await Promise.all(noms.filter(n => n.startsWith('jdmm-')).map(n => caches.delete(n)));
      const clients = await self.clients.matchAll();
      clients.forEach((c) => c.postMessage('CACHE_PURGE'));
    })());
  }
  if (evenement.data === 'ACTIVER_MAINTENANT') self.skipWaiting();
});
