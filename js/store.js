/* ==========================================================================
   store.js — État de l'application et persistance locale
   --------------------------------------------------------------------------
   Un seul endroit détient l'état ; les vues s'y abonnent et n'écrivent jamais
   dans localStorage directement.

   RGPD : localStorage ne contient que la sélection d'offres, les préférences
   d'affichage et les scores de quiz. Aucun identifiant, aucun traceur, aucune
   donnée transmise à un tiers depuis ce module (voir docs/RGPD.md).
   ========================================================================== */

const PREFIXE = 'jdmm.';
const CLES = {
  selection:   `${PREFIXE}selection`,
  preferences: `${PREFIXE}preferences`,
  quiz:        `${PREFIXE}quiz`,
  file:        `${PREFIXE}file-envois`,
  envois:      `${PREFIXE}horodatages-envois`,
};

/* -------------------------------------------------------------------------
   Accès tolérant à localStorage.
   Il peut lever une exception : navigation privée Safari, quota dépassé,
   stockage désactivé par l'utilisateur. L'application doit alors continuer
   de fonctionner, simplement sans mémoire d'une session à l'autre.
   ------------------------------------------------------------------------- */

const memoireDeSecours = new Map();
let stockageDisponible = null;

function stockageUtilisable() {
  if (stockageDisponible !== null) return stockageDisponible;
  try {
    const sonde = `${PREFIXE}sonde`;
    localStorage.setItem(sonde, '1');
    localStorage.removeItem(sonde);
    stockageDisponible = true;
  } catch (err) {
    console.warn('[store] localStorage indisponible — mémoire volatile utilisée');
    stockageDisponible = false;
  }
  return stockageDisponible;
}

function lire(cle, defaut) {
  try {
    const brut = stockageUtilisable()
      ? localStorage.getItem(cle)
      : memoireDeSecours.get(cle);
    if (brut == null) return defaut;
    const valeur = JSON.parse(brut);
    return valeur == null ? defaut : valeur;
  } catch (err) {
    // Donnée corrompue (mise à jour de format, écriture interrompue) :
    // on repart du défaut plutôt que de planter au démarrage.
    console.warn(`[store] ${cle} illisible, réinitialisé`);
    return defaut;
  }
}

function ecrire(cle, valeur) {
  const brut = JSON.stringify(valeur);
  try {
    if (stockageUtilisable()) localStorage.setItem(cle, brut);
    else memoireDeSecours.set(cle, brut);
  } catch (err) {
    // Quota dépassé : on bascule en mémoire volatile pour la session.
    console.warn('[store] écriture impossible, bascule en mémoire volatile');
    stockageDisponible = false;
    memoireDeSecours.set(cle, brut);
  }
}

/* -------------------------------------------------------------------------
   Diffusion des changements
   ------------------------------------------------------------------------- */

const abonnes = new Map();   // événement → Set de fonctions

/** Abonne une fonction à un événement. Renvoie la fonction de désabonnement. */
export function surChangement(evenement, fonction) {
  if (!abonnes.has(evenement)) abonnes.set(evenement, new Set());
  abonnes.get(evenement).add(fonction);
  return () => abonnes.get(evenement).delete(fonction);
}

function diffuser(evenement, charge) {
  (abonnes.get(evenement) || []).forEach((fonction) => {
    try {
      fonction(charge);
    } catch (err) {
      console.error(`[store] abonné en erreur sur « ${evenement} »`, err);
    }
  });
}

/* =========================================================================
   1. Sélection d'offres (le « panier »)
   ========================================================================= */

/**
 * Une entrée de sélection est volontairement autonome : elle recopie les
 * champs nécessaires au récapitulatif par courriel. Si l'offre disparaît du
 * site du Département entre la sélection et l'envoi, le visiteur reçoit quand
 * même un récapitulatif exploitable.
 */
export function obtenirSelection() {
  const selection = lire(CLES.selection, []);
  return Array.isArray(selection) ? selection : [];
}

export function estSelectionnee(id) {
  return obtenirSelection().some((entree) => entree.id === id);
}

export function ajouterALaSelection(offre) {
  const selection = obtenirSelection();
  if (selection.some((entree) => entree.id === offre.id)) return selection;

  selection.push({
    id: offre.id,
    titre: offre.titre,
    url: offre.url,
    service: offre.service || '',
    domaine: offre.domaine || '',
    categorie: offre.categorie || '',
    filiere: offre.filiere || '',
    lieu: offre.lieu || (offre.detail && offre.detail['lieu-de-travail']
                          ? offre.detail['lieu-de-travail'].texte : ''),
    deadline: offre.deadline || '',
    deadline_label: offre.deadline_label || '',
    // Le statut réel accompagne l'entrée : un poste dont l'annonce est retirée
    // doit apparaître comme tel dans le récapitulatif reçu, pas comme ouvert.
    statut_libelle: (offre.statut && offre.statut.libelle) || '',
    statut_expiree: Boolean(offre.statut && offre.statut.expiree),
    source: offre.dcip === undefined ? 'poste-dcip' : 'offre-departement',
    ajoute_le: new Date().toISOString(),
  });

  ecrire(CLES.selection, selection);
  diffuser('selection', selection);
  return selection;
}

export function retirerDeLaSelection(id) {
  const selection = obtenirSelection().filter((entree) => entree.id !== id);
  ecrire(CLES.selection, selection);
  diffuser('selection', selection);
  return selection;
}

/** Ajoute ou retire selon l'état courant. Renvoie true si l'offre est désormais retenue. */
export function basculerSelection(offre) {
  if (estSelectionnee(offre.id)) {
    retirerDeLaSelection(offre.id);
    return false;
  }
  ajouterALaSelection(offre);
  return true;
}

export function viderSelection() {
  ecrire(CLES.selection, []);
  diffuser('selection', []);
}

export function nombreSelectionnees() {
  return obtenirSelection().length;
}

/* =========================================================================
   2. Préférences d'affichage
   ========================================================================= */

const PREFERENCES_DEFAUT = {
  theme: 'a',                 // 'a' (institutionnel) ou 'b' (signature)
  hauteLisibilite: false,     // mode confort de lecture (§ principes UI, +50 ans)
};

export function obtenirPreferences() {
  return { ...PREFERENCES_DEFAUT, ...lire(CLES.preferences, {}) };
}

export function definirPreference(nom, valeur) {
  const preferences = { ...obtenirPreferences(), [nom]: valeur };
  ecrire(CLES.preferences, preferences);
  diffuser('preferences', preferences);
  return preferences;
}

/* =========================================================================
   3. Résultats de quiz
   ========================================================================= */

/** Enregistre un résultat. Le meilleur score par quiz est conservé. */
export function enregistrerResultatQuiz(idQuiz, score, total) {
  const resultats = lire(CLES.quiz, {});
  const precedent = resultats[idQuiz];
  resultats[idQuiz] = {
    score,
    total,
    meilleur: precedent ? Math.max(precedent.meilleur ?? 0, score) : score,
    tentatives: (precedent?.tentatives ?? 0) + 1,
    dernier_le: new Date().toISOString(),
  };
  ecrire(CLES.quiz, resultats);
  diffuser('quiz', resultats);
  return resultats[idQuiz];
}

export function obtenirResultatsQuiz() {
  return lire(CLES.quiz, {});
}

/* =========================================================================
   4. File d'attente des envois (mode hors-ligne)
   ========================================================================= */

/**
 * Une demande qui n'a pas pu partir est conservée et rejouée au retour du
 * réseau (§7). La file est volontairement courte : au-delà, c'est que quelque
 * chose ne va pas, et on évite de saturer le stockage du visiteur.
 */
const FILE_MAX = 10;

export function fileEnvois() {
  const file = lire(CLES.file, []);
  return Array.isArray(file) ? file : [];
}

export function empilerEnvoi(demande) {
  const file = fileEnvois();
  file.push({ ...demande, id_file: `f${Date.now()}`, empile_le: new Date().toISOString() });
  ecrire(CLES.file, file.slice(-FILE_MAX));
  diffuser('file', fileEnvois());
  return fileEnvois();
}

export function depilerEnvoi(idFile) {
  const file = fileEnvois().filter((demande) => demande.id_file !== idFile);
  ecrire(CLES.file, file);
  diffuser('file', file);
  return file;
}

/* =========================================================================
   5. Limitation anti-abus
   ========================================================================= */

const FENETRE_MS = 60 * 60 * 1000;   // une heure
const ENVOIS_MAX = 3;                // §7 : 3 envois par navigateur et par heure

/** Indique si un nouvel envoi est permis, et sinon dans combien de temps. */
export function envoiAutorise() {
  const maintenant = Date.now();
  const recents = lire(CLES.envois, []).filter((t) => maintenant - t < FENETRE_MS);
  ecrire(CLES.envois, recents);   // purge au passage

  if (recents.length < ENVOIS_MAX) return { autorise: true, restants: ENVOIS_MAX - recents.length };

  const prochain = Math.min(...recents) + FENETRE_MS;
  return {
    autorise: false,
    restants: 0,
    minutes_attente: Math.max(1, Math.ceil((prochain - maintenant) / 60000)),
  };
}

export function enregistrerEnvoi() {
  const recents = lire(CLES.envois, []);
  recents.push(Date.now());
  ecrire(CLES.envois, recents);
}

/* =========================================================================
   6. Utilitaires
   ========================================================================= */

/** Efface toutes les traces locales — bouton « Effacer mes données » (RGPD). */
export function toutEffacer() {
  Object.values(CLES).forEach((cle) => {
    try {
      localStorage.removeItem(cle);
    } catch (err) { /* stockage indisponible : rien à effacer */ }
    memoireDeSecours.delete(cle);
  });
  diffuser('selection', []);
  diffuser('quiz', {});
  diffuser('file', []);
}

/** Exposé pour la page d'exploitation et le débogage sur le stand. */
export function diagnostic() {
  return {
    stockage: stockageUtilisable() ? 'localStorage' : 'mémoire volatile',
    selection: nombreSelectionnees(),
    quiz: Object.keys(obtenirResultatsQuiz()).length,
    file_attente: fileEnvois().length,
    preferences: obtenirPreferences(),
  };
}
