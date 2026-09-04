/* ==========================================================================
   postes/app.js — Application « Postes vacants · Mobilité interne »
   --------------------------------------------------------------------------
   Reproduction du parcours de sources/dcip_postes.html : liste filtrée par
   service → fiche complète → « Je suis intéressé(e) — recevoir la fiche » →
   formulaire → confirmation. Les intitulés, les libellés de boutons et les
   textes du formulaire sont ceux du fichier source.

   Deux écarts, tous deux imposés par les faits :

   1. Le sous-titre annonçait « Postuler avant le 31 mai 2026 ». Cette date est
      dépassée et 4 des 7 annonces ne sont plus en ligne : le compte des postes
      encore ouverts est calculé depuis data/offers.json, et chaque fiche porte
      son statut réel. Recopier la date d'origine enverrait des visiteurs vers
      des candidatures closes.
   2. Les émojis de service (⚡ 🏫 🔒 📐) sont remplacés par des tracés : ils se
      recolorent, restent nets à l'impression et ne dépendent pas de la police
      émoji du téléphone. Chaque tracé est décoratif et doublé de son libellé.
   ========================================================================== */

import {
  chargerConfig, chargerPostesDcip, chargerOffres,
  croiserPostesEtOffres, evaluerFraicheur,
} from '../commun/offers.js';
import {
  appliquerTheme, annoncer, surveillerReseau, enregistrerServiceWorker,
} from '../commun/interface.js';
import {
  envoyerFiche, verifierFormulaire, telechargerFiche, imprimerFiche,
  lienMailto, DELAI_MINIMUM_MS,
} from '../commun/mailer.js';
import { ico, icoService } from '../commun/icones.js';

/* Libellés raccourcis des filtres, repris du fichier source. */
const RACCOURCIS = {
  'Maintenance des bâtiments': 'Maint. bâtiments',
  'Maintenance des collèges': 'Maint. collèges',
  'Sécurité, Sûreté & Prévention': 'Sécurité & Sûreté',
};

/* Les quatre intentions de mobilité du formulaire d'origine. */
const PROJETS = [
  { id: 'curiosite', libelle: 'Curiosité', icone: 'recherche' },
  { id: 'court',     libelle: 'Court terme', icone: 'horloge' },
  { id: 'moyen',     libelle: 'Moyen terme', icone: 'etincelle' },
  { id: 'informe',   libelle: 'Me tenir informé', icone: 'courriel' },
];

const etat = {
  config: {},
  postes: [],
  service: null,      // filtre actif
  poste: null,        // fiche ouverte
  projet: null,
  ouvertA: 0,
};

/* =========================================================================
   Démarrage
   ========================================================================= */

async function demarrer() {
  appliquerTheme();

  etat.config = await chargerConfig();
  const [fiches, charge] = await Promise.all([chargerPostesDcip(), chargerOffres()]);
  etat.postes = croiserPostesEtOffres(fiches, charge);
  etat.charge = charge;

  construireEntete();
  surveillerReseau(() => etat.charge && etat.charge.depuisCache,
                   'Hors ligne — les fiches restent consultables.');
  window.addEventListener('hashchange', router);
  router();
  enregistrerServiceWorker();
}

/* =========================================================================
   En-tête : marque, filtres par service, date de l'événement
   ========================================================================= */

function construireEntete() {
  const ev = etat.config.evenement || {};
  document.getElementById('nav-tag').textContent =
    [ev.nom, ev.date].filter(Boolean).join(' · ');

  const services = [];
  etat.postes.forEach((p) => { if (!services.includes(p.service)) services.push(p.service); });

  const zone = document.getElementById('nav-filtres');
  zone.innerHTML = `
    <button type="button" class="nf-btn" data-service="">Tous les postes</button>
    ${services.map((s) => `
      <button type="button" class="nf-btn" data-service="${s}">
        <span aria-hidden="true">${icoService(s, 15)}</span>
        <span>${RACCOURCIS[s] || s}</span>
      </button>`).join('')}`;

  zone.querySelectorAll('[data-service]').forEach((b) => {
    b.addEventListener('click', () => {
      etat.service = b.dataset.service || null;
      window.location.hash = '#/';
      router();
    });
  });
  majFiltres();
}

function majFiltres() {
  document.querySelectorAll('[data-service]').forEach((b) => {
    const actif = (b.dataset.service || null) === etat.service;
    b.classList.toggle('on', actif);
    b.setAttribute('aria-pressed', String(actif));
  });
}

/* =========================================================================
   Routage
   ========================================================================= */

const ROUTES = [
  [/^#?\/?$/,                  () => vueListe()],
  [/^#\/poste\/([\w-]+)$/,     (id) => vueFiche(id)],
  [/^#\/demande\/([\w-]+)$/,   (id) => vueFormulaire(id)],
];

function router() {
  const fragment = window.location.hash || '#/';
  const trouve = ROUTES.find(([motif]) => motif.test(fragment));
  if (!trouve) { window.location.hash = '#/'; return; }
  const params = (fragment.match(trouve[0]) || []).slice(1);
  try {
    trouve[1](...params);
  } catch (err) {
    console.error('[postes] rendu en échec', err);
    afficher('vide', `<div class="section"><div class="bandeau bandeau--alerte">
      ${ico('alerte', 16)}<span>Cette page n'a pas pu s'afficher.
      <a href="#/">Revenir à la liste</a>.</span></div></div>`);
  }
  window.scrollTo({ top: 0 });
}

/** Remplace le contenu de la coque et annonce le changement. */
function afficher(nom, html, titreAnnonce) {
  const cible = document.getElementById('vue');
  cible.innerHTML = html;
  cible.dataset.vue = nom;
  cible.classList.remove('apparait');
  void cible.offsetWidth;
  cible.classList.add('apparait');
  if (titreAnnonce) annoncer(titreAnnonce);
}

/* =========================================================================
   Vue liste
   ========================================================================= */

function vueListe() {
  majFiltres();
  const liste = etat.service
    ? etat.postes.filter((p) => p.service === etat.service)
    : etat.postes;

  // Les postes encore ouverts d'abord : un visiteur qui a trois minutes doit
  // voir en premier ce sur quoi il peut agir.
  const ordonnes = [...liste].sort((a, b) => {
    const rang = (p) => (p.statut && p.statut.expiree ? 1 : 0);
    return rang(a) - rang(b) || a.titre.localeCompare(b.titre, 'fr');
  });

  const ouverts = etat.postes.filter((p) => !(p.statut && p.statut.expiree)).length;
  const f = evaluerFraicheur(etat.charge, (etat.config.offres || {}).fraicheur_alerte_heures ?? 72);

  afficher('liste', `
    <div class="hero">
      <div class="hero__interieur">
        <div>
          <p class="hero-pill">Postes vacants · Mobilité interne</p>
          <h1 id="titre-liste">Rejoindre la <em>DCIP</em></h1>
          <p class="sous">${etat.postes.length} postes présentés · ${ouverts} encore ouverts
            · Touchez une fiche pour la découvrir</p>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="entete-liste">
        <h2>${etat.service || 'Tous les postes'}</h2>
        <p class="texte-faible">${liste.length} poste${liste.length > 1 ? 's' : ''}
          ${etat.service ? 'dans ce service' : 'de mobilité interne'}</p>
      </div>

      ${etat.charge.erreur ? `
        <div class="bandeau bandeau--alerte" style="margin-bottom:var(--pas-3)">
          ${ico('alerte', 16)}<span>Impossible de vérifier si les annonces sont encore
          en ligne. Les fiches ci-dessous restent consultables.</span></div>`
        : `<p class="texte-faible" style="margin-bottom:var(--pas-3)">${f.libelle}</p>`}

      <div class="pile-serree" role="list">
        ${ordonnes.length ? ordonnes.map(ligne).join('')
          : `<p class="vide">Aucun poste vacant pour ce service actuellement.</p>`}
      </div>
    </div>`, `${liste.length} postes affichés`);
}

function ligne(p) {
  const s = p.statut || {};
  const etiquette = s.expiree
    ? `<span class="badge badge--neutre">${s.code === 'retiree' ? 'Retirée' : 'Close'}</span>`
    : (s.urgent ? `<span class="badge badge--alerte">Urgent</span>`
                : `<span class="badge badge--succes">En ligne</span>`);
  return `
    <div role="listitem">
      <a class="poste-row" href="#/poste/${p.id}">
        <span class="pastille-service" aria-hidden="true">${icoService(p.service, 20)}</span>
        <span class="poste-row__info">
          <span class="poste-row__titre">${p.titre}</span>
          <span class="poste-row__svc">Service ${p.service}</span>
          <span class="metas">
            <span class="meta">${ico('diplome', 14)} ${p.cat}</span>
            <span class="meta">${ico('lieu', 14)} ${p.lieu}</span>
            <span class="meta">${ico(s.expiree ? 'alerte' : 'horloge', 14)} ${s.libelle || ''}</span>
          </span>
        </span>
        <span class="poste-row__tags">${etiquette}</span>
        <span class="poste-row__fleche" aria-hidden="true">${ico('chevron', 18)}</span>
      </a>
    </div>`;
}

/* =========================================================================
   Vue fiche
   ========================================================================= */

function vueFiche(id) {
  const p = etat.postes.find((x) => x.id === id);
  if (!p) { window.location.hash = '#/'; return; }
  etat.poste = p;
  const s = p.statut || {};

  const bloc = (titre, items, icone) => (items || []).length ? `
    <section aria-labelledby="t-${icone}">
      <h3 class="surtitre" id="t-${icone}">${titre}</h3>
      <ul class="points" style="margin-top:var(--pas-2)">
        ${items.map((m) => `<li>${ico(icone, 16)}<span>${m}</span></li>`).join('')}
      </ul>
    </section>` : '';

  afficher('fiche', `
    <div class="entete-detail">
      <a class="bouton-icone" href="#/" aria-label="Retour aux postes">${ico('retour', 22)}</a>
      <span class="titre">← Retour aux postes</span>
    </div>

    <div class="hero">
      <div class="hero__interieur">
        <div>
          <p class="hero-pill">Service ${p.service}</p>
          <h1>${p.titre}</h1>
          <p class="sous">${p.contrat} · ${p.lieu}</p>
        </div>
      </div>
    </div>

    <div class="section pile">
      <div class="bandeau bandeau--${s.expiree ? 'alerte' : 'info'}">
        ${ico(s.expiree ? 'alerte' : 'horloge', 16)}<span>${s.libelle || ''}</span>
      </div>

      <p class="metas">
        <span class="meta">${ico('diplome', 14)} ${p.cat}</span>
        <span class="meta">${ico('postes', 14)} ${p.filiere}</span>
        <span class="meta">${ico('lieu', 14)} ${p.lieu}</span>
      </p>

      <section aria-labelledby="t-desc">
        <h3 class="surtitre" id="t-desc">Description</h3>
        <p class="texte-doux" style="margin-top:var(--pas-2);line-height:1.6">${p.desc}</p>
      </section>

      ${bloc('Missions principales', p.missions, 'coche')}
      ${bloc('Profil recherché', p.profils, 'etincelle')}

      <div class="pile-serree" style="margin-top:var(--pas-3)">
        <a class="bouton bouton--primaire bouton--large" href="#/demande/${p.id}">
          ${ico('courriel', 18)} Je suis intéressé(e) — recevoir la fiche</a>
        <a class="bouton bouton--valide bouton--large" href="${p.url}" target="_blank" rel="noopener">
          Postuler en ligne ${ico('chevron', 16)}
          <span class="lecteur-seul">(nouvelle fenêtre, site du Département)</span></a>
        <a class="bouton bouton--secondaire bouton--large" href="#/">Voir les autres postes</a>
      </div>

      ${s.expiree ? `<p class="texte-faible">Cette annonce n'est plus en ligne. Vous pouvez tout
        de même recevoir la fiche : la DCIP saura que ce métier vous intéresse et pourra vous
        signaler la prochaine ouverture.</p>` : ''}
    </div>`, p.titre);
}

/* =========================================================================
   Vue formulaire
   ========================================================================= */

function vueFormulaire(id) {
  const p = etat.postes.find((x) => x.id === id);
  if (!p) { window.location.hash = '#/'; return; }
  etat.poste = p;
  etat.projet = null;
  etat.ouvertA = Date.now();

  const mois = (etat.config.rgpd || {}).duree_conservation_mois || 12;
  const dpo = (etat.config.rgpd || {}).contact_dpo || '';

  const champ = (nom, libelle, options = {}) => `
    <div class="champ">
      <label class="champ__libelle" for="${nom}">${libelle}
        ${options.facultatif
          ? '<span class="texte-faible">(optionnel)</span>'
          : '<span class="champ__obligatoire" aria-hidden="true">*</span><span class="lecteur-seul">(obligatoire)</span>'}
      </label>
      ${options.zone
        ? `<textarea id="${nom}" name="${nom}" rows="3"
             aria-describedby="err-${nom}"></textarea>`
        : `<input type="${options.type || 'text'}" id="${nom}" name="${nom}"
             ${options.autocomplete ? `autocomplete="${options.autocomplete}"` : ''}
             ${options.type === 'email' ? 'inputmode="email" spellcheck="false"' : ''}
             ${options.exemple ? `placeholder="${options.exemple}"` : ''}
             aria-describedby="err-${nom}">`}
      <p class="champ__erreur" id="err-${nom}" hidden></p>
    </div>`;

  afficher('formulaire', `
    <div class="entete-detail">
      <a class="bouton-icone" href="#/poste/${p.id}" aria-label="Retour à la fiche">${ico('retour', 22)}</a>
      <span class="titre">← Retour à la fiche</span>
    </div>

    <div class="hero">
      <div class="hero__interieur">
        <div>
          <p class="hero-pill">Candidature · Mobilité interne</p>
          <h1>Je suis <em>intéressé(e)</em></h1>
          <p class="sous">Laissez vos coordonnées — nous vous envoyons la fiche et vous recontactons.</p>
        </div>
      </div>
    </div>

    <div class="section pile">
      <div class="carte carte--plate recap-poste">
        <p class="surtitre">${ico('postes', 13)} Poste sélectionné</p>
        <p class="carte__titre" style="margin-top:var(--pas-2)">${p.titre}</p>
        <p class="carte__sous">Service ${p.service}</p>
      </div>

      <form id="formulaire" novalidate class="pile">
        <div class="leurre" aria-hidden="true">
          <label for="site-web">Ne pas remplir</label>
          <input type="text" id="site-web" name="site-web" tabindex="-1" autocomplete="off">
        </div>

        <div class="duo-champs">
          ${champ('prenom', 'Prénom', { autocomplete: 'given-name' })}
          ${champ('nom', 'Nom', { autocomplete: 'family-name' })}
        </div>
        ${champ('direction', 'Direction actuelle', { autocomplete: 'organization' })}
        ${champ('email', 'Email professionnel', { type: 'email', autocomplete: 'email',
                exemple: 'prenom.nom@departement06.fr' })}
        ${champ('message', 'Message', { zone: true, facultatif: true })}

        <fieldset class="champ" style="border:none;padding:0;margin:0">
          <legend class="champ__libelle" style="padding:0">Votre projet de mobilité
            <span class="texte-faible">(optionnel)</span></legend>
          <div class="filtres" style="flex-wrap:wrap;margin-top:var(--pas-2)">
            ${PROJETS.map((x) => `
              <button type="button" class="puce" data-projet="${x.id}" aria-pressed="false">
                <span aria-hidden="true">${ico(x.icone, 14)}</span> ${x.libelle}
              </button>`).join('')}
          </div>
        </fieldset>

        <div class="carte carte--plate" style="padding:var(--pas-3)">
          <label class="case">
            <input type="checkbox" id="rgpd" name="rgpd" aria-describedby="mention-rgpd err-rgpd">
            <span class="case__texte">J'accepte d'être recontacté(e) par la DCIP pour des
              opportunités de mobilité interne
              <span class="champ__obligatoire" aria-hidden="true">*</span>
              <span class="lecteur-seul">(obligatoire)</span></span>
          </label>
          <p class="mention-rgpd" id="mention-rgpd">
            <strong>RGPD</strong> — Données traitées par la DRH du Département des Alpes-Maritimes
            pour le suivi des mobilités internes. Conservation ${mois} mois. Droits d'accès et
            rectification${dpo && dpo !== 'À_RENSEIGNER' ? ` auprès de ${dpo}` : ' auprès du DPO'}.
            Aucun traceur, aucune mesure d'audience.
            <a href="../mentions.html?doc=rgpd" target="_blank" rel="noopener">En savoir plus<span
              class="lecteur-seul"> (nouvelle fenêtre)</span></a>.
          </p>
          <p class="champ__erreur" id="err-rgpd" hidden></p>
        </div>

        <p class="champ__erreur" id="err-general" hidden></p>

        <button type="submit" class="bouton bouton--primaire bouton--large" id="envoyer">
          Envoyer ma demande</button>
        <a class="bouton bouton--secondaire bouton--large" href="#/poste/${p.id}">
          ← Retour à la fiche</a>
      </form>
    </div>`, 'Formulaire de demande');

  document.querySelectorAll('[data-projet]').forEach((b) => {
    b.addEventListener('click', () => {
      etat.projet = etat.projet === b.dataset.projet ? null : b.dataset.projet;
      document.querySelectorAll('[data-projet]').forEach((x) =>
        x.setAttribute('aria-pressed', String(x.dataset.projet === etat.projet)));
    });
  });
  document.getElementById('formulaire').addEventListener('submit', (e) => {
    e.preventDefault();
    soumettre();
  });
}

async function soumettre() {
  const valeur = (id) => (document.getElementById(id) || {}).value?.trim() || '';
  const contact = {
    prenom: valeur('prenom'),
    nom: valeur('nom'),
    direction: valeur('direction'),
    email: valeur('email'),
    message: valeur('message'),
    projet: (PROJETS.find((x) => x.id === etat.projet) || {}).libelle || '',
  };

  ['prenom', 'nom', 'direction', 'email', 'rgpd', 'general'].forEach((n) => {
    const e = document.getElementById(`err-${n}`);
    if (e) e.hidden = true;
    const c = document.getElementById(n);
    if (c) c.removeAttribute('aria-invalid');
  });

  const probleme = verifierFormulaire({
    ...contact,
    consentement: document.getElementById('rgpd').checked,
    piege: document.getElementById('site-web').value,
    ouvertDepuisMs: Date.now() - etat.ouvertA,
  });

  if (probleme && probleme.message === 'ROBOT') { vueEnvoye({ ok: true, planB: false }, contact); return; }
  if (probleme) {
    const cible = document.getElementById(`err-${probleme.champ || 'general'}`);
    cible.innerHTML = `${ico('alerte', 15)}<span>${probleme.message}</span>`;
    cible.hidden = false;
    const champ = probleme.champ && document.getElementById(probleme.champ);
    if (champ) {
      if (champ.type !== 'checkbox') champ.setAttribute('aria-invalid', 'true');
      champ.focus();
    }
    annoncer(probleme.message);
    return;
  }

  const bouton = document.getElementById('envoyer');
  bouton.disabled = true;
  bouton.innerHTML = 'Envoi…';
  annoncer('Envoi en cours.');

  const bilan = await envoyerFiche({ poste: etat.poste, contact });
  vueEnvoye(bilan, contact);
}

/* =========================================================================
   Vue confirmation
   ========================================================================= */

function vueEnvoye(bilan, contact) {
  const p = etat.poste;
  afficher('envoye', `
    <div class="section pile" style="text-align:center;padding-top:var(--pas-7)">
      <p style="display:flex;justify-content:center">
        <span class="rond-succes" aria-hidden="true">${ico(bilan.ok ? 'coche' : 'courriel', 32)}</span>
      </p>
      <div>
        <h1>${bilan.ok ? 'Demande enregistrée&nbsp;!' : 'Encore une étape'}</h1>
        <p class="texte-doux" style="margin-top:var(--pas-3);line-height:1.6">
          ${bilan.ok
            ? `Merci ${contact.prenom}. ${bilan.message}`
            : bilan.message}
        </p>
      </div>

      <div class="carte carte--plate" style="text-align:left">
        <p class="surtitre">Poste d'intérêt</p>
        <p class="carte__titre" style="margin-top:var(--pas-2)">${p.titre}</p>
        <p class="carte__sous">Service ${p.service}</p>
      </div>

      <div class="pile-serree">
        ${bilan.planB ? `
          <button type="button" class="bouton bouton--primaire bouton--large" id="conf-telecharger">
            ${ico('telecharger', 18)} Télécharger la fiche</button>
          <a class="bouton bouton--secondaire bouton--large" id="conf-mailto"
             href="${lienMailto(p, contact, etat.config)}">
            ${ico('courriel', 18)} Me l'envoyer depuis ma messagerie</a>
          <button type="button" class="bouton bouton--fantome bouton--compact" id="conf-imprimer">
            Imprimer ou enregistrer en PDF</button>` : `
          <button type="button" class="bouton bouton--secondaire bouton--large" id="conf-telecharger">
            ${ico('telecharger', 18)} Télécharger une copie</button>`}
        <a class="bouton bouton--valide bouton--large" href="#/">Voir les autres postes</a>
      </div>
    </div>`, bilan.message);

  const tel = document.getElementById('conf-telecharger');
  if (tel) tel.addEventListener('click', () => telechargerFiche(p, contact, etat.config));
  const imp = document.getElementById('conf-imprimer');
  if (imp) imp.addEventListener('click', () => {
    if (!imprimerFiche(p, contact, etat.config)) {
      annoncer("L'aperçu a été bloqué par le navigateur. Utilisez le téléchargement.");
    }
  });
}




if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', demarrer);
} else {
  demarrer();
}
