/* ==========================================================================
   views/postes.js — Postes de la DCIP et offres du Département
   --------------------------------------------------------------------------
   Deux niveaux d'affichage (§6) :
     · « Postes DCIP » — les 7 fiches rédigées, enrichies de leur statut réel
       (encore en ligne ? échéance dépassée ?) grâce à data/offers.json ;
     · « Toutes les offres » — les offres du Département, filtrables.

   L'application ne se substitue pas au site du Département : chaque poste
   garde son lien vers la fiche officielle, et l'âge de la donnée est affiché.
   ========================================================================== */

import {
  chargerOffres, chargerPostesDcip, chargerConfig, chargerDetail,
  croiserPostesEtOffres, statutEcheance, facettes, filtrer, trierParUrgence,
} from '../offers.js';
import { basculerSelection, estSelectionnee, surChangement } from '../store.js';
import { ico, icoService } from '../icones.js';
import { annoncer, ouvrirFeuille, fermerFeuille } from '../app.js';

/* Filtres actifs — conservés le temps de la session de navigation, pour
   qu'un retour depuis une fiche ne réinitialise pas la recherche. */
const etat = { onglet: 'dcip', domaine: '', categorie: '', filiere: '', recherche: '' };

/* =========================================================================
   Liste
   ========================================================================= */

export async function rendreListe(section) {
  section.innerHTML = `
    <div class="entete-vue">
      <p class="surtitre">Recrutement et mobilité interne</p>
      <h1 id="titre-postes">Les postes</h1>
      <p class="sous" id="postes-sous">Chargement des offres…</p>
    </div>
    <div class="section pile" id="postes-corps">
      <div class="squelette"></div><div class="squelette"></div><div class="squelette"></div>
    </div>`;

  const [postes, charge, config] = await Promise.all([
    chargerPostesDcip(), chargerOffres(), chargerConfig(),
  ]);

  const croises = croiserPostesEtOffres(postes, charge);
  const enLigne = croises.filter((p) => p.en_ligne).length;

  document.getElementById('postes-sous').textContent =
    `${postes.length} fiches DCIP · ${charge.count} offres au Département`;

  const corps = document.getElementById('postes-corps');
  corps.innerHTML = `
    <div class="segments" role="tablist" aria-label="Portée de la liste">
      <button type="button" class="segments__item" role="tab" data-onglet-liste="dcip"
        aria-selected="${etat.onglet === 'dcip'}">Postes DCIP</button>
      <button type="button" class="segments__item" role="tab" data-onglet-liste="tous"
        aria-selected="${etat.onglet === 'tous'}">Toutes les offres</button>
    </div>
    <div id="postes-bandeau" style="min-height:38px"></div>
    <div id="postes-filtres"></div>
    <div class="pile" id="postes-liste" role="list"></div>`;

  corps.querySelectorAll('[data-onglet-liste]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      etat.onglet = bouton.dataset.ongletListe;
      corps.querySelectorAll('[data-onglet-liste]').forEach((b) =>
        b.setAttribute('aria-selected', String(b.dataset.ongletListe === etat.onglet)));
      peupler(croises, charge, config, enLigne);
    });
  });

  peupler(croises, charge, config, enLigne);
  surChangement('selection', () => majBoutonsSelection());
}

function peupler(croises, charge, config, enLigne) {
  const bandeau = document.getElementById('postes-bandeau');
  const filtres = document.getElementById('postes-filtres');
  const liste = document.getElementById('postes-liste');

  if (charge.erreur) {
    bandeau.innerHTML = `<div class="bandeau bandeau--alerte">${ico('alerte', 16)}
      <span>Les offres n'ont pas pu être chargées. Consultez le
      <a href="${(config.offres || {}).source}" rel="noopener">site du Département</a>.</span></div>`;
  } else {
    bandeau.innerHTML = '';
  }

  if (etat.onglet === 'dcip') {
    filtres.innerHTML = '';
    if (!charge.erreur) {
      bandeau.innerHTML += `<div class="bandeau bandeau--info">${ico('horloge', 16)}
        <span>${enLigne} fiche${enLigne > 1 ? 's' : ''} sur ${croises.length}
        ${enLigne > 1 ? 'sont' : 'est'} encore en ligne sur le site du Département.</span></div>`;
    }
    // Les postes encore ouverts d'abord, les annonces closes ensuite : un
    // visiteur qui a trois minutes doit voir en premier ce sur quoi il peut agir.
    const ordonnes = [...croises].sort((a, b) => {
      const rang = (p) => (p.statut && p.statut.expiree ? 1 : 0);
      return rang(a) - rang(b) || a.titre.localeCompare(b.titre, 'fr');
    });
    liste.innerHTML = ordonnes.map(cartePosteDcip).join('');
  } else {
    const offres = trierParUrgence(filtrer(charge.offers, etat));
    filtres.innerHTML = barreFiltres(charge.offers, offres.length);
    brancherFiltres(croises, charge, config, enLigne);
    liste.innerHTML = offres.length
      ? offres.map(carteOffre).join('')
      : `<p class="vide">Aucune offre ne correspond à ces critères.
         <button type="button" class="bouton bouton--secondaire bouton--compact"
           id="postes-reinit" style="margin-top:var(--pas-3)">Tout afficher</button></p>`;
    const reinit = document.getElementById('postes-reinit');
    if (reinit) reinit.addEventListener('click', () => {
      Object.assign(etat, { domaine: '', categorie: '', filiere: '', recherche: '' });
      peupler(croises, charge, config, enLigne);
    });
  }

  majBoutonsSelection();
  annoncer(`${liste.querySelectorAll('[role="listitem"]').length} postes affichés.`);
}

/* --- Cartes ---------------------------------------------------------------- */

function cartePosteDcip(p) {
  const s = p.statut || { libelle: '', expiree: false };
  return `
    <div role="listitem">
      <a class="carte carte--action" href="#/poste/${p.id}">
        <span class="pastille-service" aria-hidden="true">${icoService(p.service, 20)}</span>
        <span class="carte__corps">
          <span class="rangee" style="align-items:flex-start;gap:var(--pas-2)">
            <span class="carte__titre" style="flex:1">${p.titre}</span>
            ${badgeStatut(s)}
          </span>
          <span class="carte__sous">Service ${p.service}</span>
          <span class="metas" style="margin-top:var(--pas-2)">
            <span class="meta">${ico('diplome', 14)} Cat. ${p.cat}</span>
            <span class="meta">${ico('lieu', 14)} ${p.lieu}</span>
          </span>
        </span>
        <span aria-hidden="true" style="color:var(--texte-faible)">${ico('chevron', 18)}</span>
      </a>
      <div class="carte__pied ${s.expiree ? 'carte__pied--alerte' : ''}"
           style="background:var(--surface);border:1px solid rgba(0,0,0,.07);border-top:none;
                  border-radius:0 0 var(--rayon-lg) var(--rayon-lg);margin-top:-1px;padding:var(--pas-3) var(--pas-4)">
        ${ico(s.expiree ? 'alerte' : 'horloge', 14)}<span>${s.libelle}</span>
      </div>
    </div>`;
}

function carteOffre(o) {
  const s = statutEcheance(o);
  return `
    <div role="listitem" class="carte">
      <div class="rangee" style="align-items:flex-start;gap:var(--pas-2)">
        <div style="flex:1;min-width:0">
          <p class="surtitre">${o.domaine || 'Département des Alpes-Maritimes'}</p>
          <p class="carte__titre" style="margin-top:2px">${o.titre}</p>
          <p class="metas" style="margin-top:var(--pas-2)">
            ${o.categorie ? `<span class="meta">${ico('diplome', 14)} Cat. ${o.categories.join(', ')}</span>` : ''}
            ${o.filiere ? `<span class="meta">${ico('postes', 14)} ${o.filieres.join(', ')}</span>` : ''}
          </p>
        </div>
        ${badgeStatut(s)}
      </div>
      <p class="texte-faible" style="margin-top:var(--pas-3);line-height:1.5">${o.resume || ''}</p>
      <div class="carte__pied ${s.expiree ? 'carte__pied--alerte' : ''}">
        ${ico(s.expiree ? 'alerte' : 'horloge', 14)}<span>${s.libelle}</span>
      </div>
      <div class="rangee" style="gap:var(--pas-2);margin-top:var(--pas-3)">
        <button type="button" class="bouton bouton--secondaire bouton--compact"
          data-selection="${o.id}">
          ${ico('plus', 16)} <span data-selection-libelle>Ajouter</span>
        </button>
        <a class="bouton bouton--fantome bouton--compact rangee-fin" href="${o.url}"
           target="_blank" rel="noopener">
          ${ico('lien', 16)} Fiche officielle
          <span class="lecteur-seul">(nouvelle fenêtre)</span>
        </a>
      </div>
    </div>`;
}

/** Le badge se déduit du statut réel, jamais d'un champ figé dans la fiche :
    sinon un poste dont l'annonce est retirée s'affiche « Nouveau ». */
function badgeStatut(s) {
  if (s.expiree) return `<span class="badge badge--neutre">${s.code === 'retiree' ? 'Retirée' : 'Close'}</span>`;
  if (s.urgent) return `<span class="badge badge--alerte">Urgent</span>`;
  if (s.code === 'permanente') return `<span class="badge badge--encre">Permanente</span>`;
  return `<span class="badge badge--succes">En ligne</span>`;
}

/* --- Filtres ---------------------------------------------------------------- */

function barreFiltres(offres, nb) {
  const f = facettes(offres);
  const actifs = [etat.domaine, etat.categorie, etat.filiere].filter(Boolean).length;
  return `
    <div class="rangee" style="gap:var(--pas-2)">
      <label class="champ" style="flex:1">
        <span class="lecteur-seul">Rechercher dans les offres</span>
        <input type="search" id="postes-recherche" value="${etat.recherche}"
               placeholder="Rechercher un intitulé" autocomplete="off" inputmode="search">
      </label>
      <button type="button" class="bouton bouton--secondaire bouton--compact" id="postes-filtrer">
        ${ico('filtre', 16)} Filtrer${actifs ? ` (${actifs})` : ''}
      </button>
    </div>
    <p class="texte-faible" style="margin-top:var(--pas-2)">${nb} offre${nb > 1 ? 's' : ''} affichée${nb > 1 ? 's' : ''}
      sur ${offres.length}</p>
    <div class="lecteur-seul" data-facettes='${JSON.stringify(f).replace(/'/g, '&#39;')}'></div>`;
}

function brancherFiltres(croises, charge, config, enLigne) {
  const recherche = document.getElementById('postes-recherche');
  if (recherche) {
    let minuteur;
    recherche.addEventListener('input', () => {
      // On attend une pause de frappe : refiltrer à chaque touche fait
      // sauter la liste sous les doigts.
      clearTimeout(minuteur);
      minuteur = setTimeout(() => {
        etat.recherche = recherche.value;
        peupler(croises, charge, config, enLigne);
        document.getElementById('postes-recherche').focus();
      }, 250);
    });
  }

  const bouton = document.getElementById('postes-filtrer');
  if (bouton) bouton.addEventListener('click', () => {
    const f = facettes(charge.offers);
    const groupe = (titre, cle, valeurs) => `
      <fieldset style="border:none;padding:0;margin:0 0 var(--pas-4)">
        <legend class="surtitre" style="padding:0">${titre}</legend>
        <div class="filtres" style="flex-wrap:wrap;margin-top:var(--pas-2)">
          <button type="button" class="puce" data-filtre="${cle}" data-valeur=""
            aria-pressed="${!etat[cle]}">Tous</button>
          ${valeurs.map((v) => `<button type="button" class="puce" data-filtre="${cle}"
            data-valeur="${v}" aria-pressed="${etat[cle] === v}">${v}</button>`).join('')}
        </div>
      </fieldset>`;

    ouvrirFeuille('Filtrer les offres', `
      ${groupe("Domaine d'activité", 'domaine', f.domaines)}
      ${groupe('Catégorie', 'categorie', f.categories)}
      ${groupe('Filière', 'filiere', f.filieres)}
      <button type="button" class="bouton bouton--primaire bouton--large" id="filtres-appliquer">
        Voir les résultats
      </button>`);

    document.querySelectorAll('[data-filtre]').forEach((puce) => {
      puce.addEventListener('click', () => {
        etat[puce.dataset.filtre] = puce.dataset.valeur;
        document.querySelectorAll(`[data-filtre="${puce.dataset.filtre}"]`).forEach((p) =>
          p.setAttribute('aria-pressed', String(p.dataset.valeur === puce.dataset.valeur)));
      });
    });
    document.getElementById('filtres-appliquer').addEventListener('click', () => {
      fermerFeuille();
      peupler(croises, charge, config, enLigne);
    });
  });
}

/* =========================================================================
   Fiche de poste
   ========================================================================= */

export async function rendreFiche(section, id) {
  const [postes, charge] = await Promise.all([chargerPostesDcip(), chargerOffres()]);
  const p = croiserPostesEtOffres(postes, charge).find((x) => x.id === id)
         || charge.offers.find((o) => o.id === id);

  if (!p) {
    section.innerHTML = `<div class="section"><div class="bandeau bandeau--alerte">
      ${ico('alerte', 16)}<span>Ce poste est introuvable.</span></div>
      <p style="margin-top:var(--pas-4)"><a href="#/postes">Revenir à la liste</a></p></div>`;
    return;
  }

  const s = p.statut || statutEcheance(p);
  const liste = (titre, items, icone) => (items || []).length ? `
    <section aria-labelledby="titre-${icone}">
      <p class="surtitre" id="titre-${icone}">${titre}</p>
      <ul class="points" style="margin-top:var(--pas-2)">
        ${items.map((m) => `<li>${ico(icone, 16)}<span>${m}</span></li>`).join('')}
      </ul>
    </section>` : '';

  section.innerHTML = `
    <div class="entete-detail">
      <a class="bouton-icone" href="#/postes" aria-label="Retour à la liste des postes">${ico('retour', 22)}</a>
      <span class="titre">Les postes</span>
    </div>
    <div class="hero" style="padding:var(--pas-5)">
      <p class="badge" style="background:rgba(255,255,255,.12);color:var(--accent);border-color:rgba(255,255,255,.20)">
        ${p.service ? `Service ${p.service}` : (p.domaine || 'Département des Alpes-Maritimes')}</p>
      <h1 style="margin-top:var(--pas-3);font-size:var(--txt-xl)">${p.titre}</h1>
      <p class="metas" style="margin-top:var(--pas-3)">
        ${p.cat || p.categorie ? `<span class="meta">Cat. ${p.cat || p.categorie}</span>` : ''}
        ${p.filiere ? `<span class="meta">${p.filiere}</span>` : ''}
        ${p.lieu ? `<span class="meta">${p.lieu}</span>` : ''}
      </p>
    </div>
    <div class="section pile">
      <div class="bandeau bandeau--${s.expiree ? 'alerte' : 'info'}">
        ${ico(s.expiree ? 'alerte' : 'horloge', 16)}<span>${s.libelle}</span>
      </div>
      ${p.desc || p.resume ? `<p style="line-height:1.6" class="texte-doux">${p.desc || p.resume}</p>` : ''}
      ${liste('Missions', p.missions, 'coche')}
      ${liste('Profil recherché', p.profils, 'etincelle')}
      <div id="poste-detail"></div>
      <div class="pile-serree" style="margin-top:var(--pas-3)">
        <button type="button" class="bouton bouton--primaire bouton--large"
                data-selection="${p.id}">
          ${ico('plus', 18)} <span data-selection-libelle>Ajouter à ma sélection</span>
        </button>
        <a class="bouton bouton--secondaire bouton--large" href="${p.url}" target="_blank" rel="noopener">
          ${ico('lien', 18)} Voir la fiche officielle
          <span class="lecteur-seul">(nouvelle fenêtre, site du Département)</span>
        </a>
      </div>
      ${s.expiree ? `<p class="texte-faible">Cette annonce n'est plus ouverte. Vous pouvez tout de
        même la retenir : la DCIP saura que ce métier vous intéresse et pourra vous signaler la
        prochaine ouverture. Le récapitulatif indiquera que l'annonce est close.</p>` : ''}
    </div>`;

  // L'objet complet est mémorisé pour que le panier reçoive tous ses champs.
  section.querySelectorAll('[data-selection]').forEach((b) => { b._poste = p; });
  majBoutonsSelection();

  // Le corps de l'annonce arrive après coup : la fiche est déjà lisible sans lui.
  if (!p.missions) chargerCorpsAnnonce(p.id);
}

/** Affiche le corps d'une offre du Département (missions, activités, profil…). */
async function chargerCorpsAnnonce(id) {
  const cible = document.getElementById('poste-detail');
  if (!cible) return;

  const detail = await chargerDetail(id);
  if (!detail || !document.getElementById('poste-detail')) return;

  // On n'affiche que les sections rédigées, dans l'ordre du site du Département.
  const ORDRE = ['missions', 'activites', 'profil-du-candidat', 'prerequis',
                 'conditions-de-travail', 'lieu-de-travail', 'remuneration',
                 'modalites-de-recrutement'];

  const sections = ORDRE
    .map((cle) => detail[cle])
    .filter((s) => s && s.texte)
    .map((s) => {
      // Les fiches listent souvent les activités en « - item - item ».
      const items = (s.items || []).filter((x) => x.length > 8);
      return `<section style="margin-top:var(--pas-4)">
        <p class="surtitre">${s.titre}</p>
        ${items.length > 1
          ? `<ul class="points" style="margin-top:var(--pas-2)">
              ${items.map((x) => `<li>${ico('coche', 16)}<span>${x}</span></li>`).join('')}
             </ul>`
          : `<p class="texte-doux" style="margin-top:var(--pas-2);line-height:1.6">${s.texte}</p>`}
      </section>`;
    }).join('');

  cible.innerHTML = sections || '';
}

/* =========================================================================
   Boutons « Ajouter à ma sélection »
   ========================================================================= */

function majBoutonsSelection() {
  document.querySelectorAll('[data-selection]').forEach((bouton) => {
    const id = bouton.dataset.selection;
    const dedans = estSelectionnee(id);
    const libelle = bouton.querySelector('[data-selection-libelle]');
    if (libelle) libelle.textContent = dedans ? 'Retirer de ma sélection' : 'Ajouter à ma sélection';
    bouton.setAttribute('aria-pressed', String(dedans));

    if (!bouton._branche) {
      bouton._branche = true;
      bouton.addEventListener('click', async () => {
        const poste = bouton._poste || await retrouver(id);
        if (!poste) return;
        const ajoute = basculerSelection(poste);
        annoncer(ajoute
          ? `${poste.titre} ajouté à votre sélection.`
          : `${poste.titre} retiré de votre sélection.`);
        majBoutonsSelection();
      });
    }
  });
}

async function retrouver(id) {
  const [postes, charge] = await Promise.all([chargerPostesDcip(), chargerOffres()]);
  return croiserPostesEtOffres(postes, charge).find((x) => x.id === id)
      || charge.offers.find((o) => o.id === id);
}
