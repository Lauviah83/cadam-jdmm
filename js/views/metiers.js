/* ==========================================================================
   views/metiers.js — Le parcours « Vie d'un projet immobilier »
   --------------------------------------------------------------------------
   Données : data/timeline.json (10 phases, 3 étapes, 8 services).

   Ce fichier est aujourd'hui un squelette : le roll-up 60×160 cm dont il
   reprend le contenu n'a pas été fourni. La vue le dit franchement plutôt
   que d'afficher une page vide ou d'inventer des intitulés — un visiteur du
   stand ne doit pas repartir avec des phases imaginaires.
   ========================================================================== */

import { ico } from '../icones.js';
import { annoncer } from '../app.js';

let timeline = null;

async function charger() {
  if (timeline) return timeline;
  try {
    const reponse = await fetch('./data/timeline.json', { cache: 'no-cache' });
    timeline = await reponse.json();
  } catch (err) {
    console.error('[metiers] timeline.json illisible', err);
    timeline = { etapes: [], phases: [], services: [] };
  }
  return timeline;
}

/** Couleur d'une étape, prise dans le fichier de données. */
function couleurEtape(t, idEtape) {
  const e = (t.etapes || []).find((x) => x.id === idEtape);
  return e ? e.couleur : 'var(--marque)';
}

/* --- Liste des phases ----------------------------------------------------- */

export async function rendreListe(section) {
  section.innerHTML = `
    <div class="entete-vue">
      <p class="surtitre">Le métier</p>
      <h1 id="titre-metiers">Vie d'un projet</h1>
      <p class="sous" id="metiers-sous">Chargement…</p>
    </div>
    <div class="section pile" id="metiers-corps"></div>`;

  const t = await charger();
  const corps = document.getElementById('metiers-corps');
  const sous = document.getElementById('metiers-sous');

  const nbPhases = (t.phases || []).length;
  const nbServices = (t.services || []).length;
  sous.textContent = nbPhases
    ? `${nbPhases} phases · ${(t.etapes || []).length} étapes · ${nbServices} services`
    : 'Contenu en préparation';

  if (!nbPhases) {
    corps.innerHTML = `
      <div class="bandeau bandeau--alerte">
        ${ico('alerte', 16)}
        <span>Le détail des phases n'est pas encore disponible.</span>
      </div>
      <div class="carte">
        <p>Le parcours « Vie d'un projet immobilier » présente les
        <strong>10 phases</strong> d'une opération de la DCIP, réparties en trois étapes —
        Conception, Réalisation, Exploitation — et les <strong>8 services</strong> qui y
        interviennent.</p>
        <p style="margin-top:var(--pas-3)" class="texte-doux">Il est présenté sur le roll-up
        du stand. Son contenu sera intégré ici dès qu'il aura été transmis.</p>
      </div>
      ${rendreEtapes(t)}`;
    return;
  }

  // Les phases sont regroupées par étape, dans l'ordre du roll-up.
  const parEtape = (t.etapes || []).map((etape) => {
    const phases = (t.phases || []).filter((p) => p.etape === etape.id);
    if (!phases.length) return '';
    return `
      <section class="pile-serree" aria-labelledby="etape-${etape.id}">
        <div class="etape__entete">
          <span class="etape__puce" style="background:${etape.couleur}" aria-hidden="true"></span>
          <h2 class="etape__nom" id="etape-${etape.id}" style="color:${etape.couleur}">${etape.titre}</h2>
          <span class="etape__filet" aria-hidden="true"></span>
        </div>
        ${phases.map((p) => `
          <a class="phase" href="#/phase/${p.num}" style="border-left-color:${etape.couleur}">
            <span class="phase__num" style="color:${etape.couleur}" aria-hidden="true">${String(p.num).padStart(2, '0')}</span>
            <span class="phase__titre">${p.titre}</span>
            <span aria-hidden="true" style="color:var(--texte-faible)">${ico('chevron', 16)}</span>
            <span class="lecteur-seul">Phase ${p.num} sur ${nbPhases}, étape ${etape.titre}</span>
          </a>`).join('')}
      </section>`;
  }).join('');

  corps.innerHTML = parEtape + rendreServices(t);
}

/** Rappel des trois étapes quand les phases manquent encore. */
function rendreEtapes(t) {
  if (!(t.etapes || []).length) return '';
  return `<div class="pile-serree">
    <p class="surtitre">Les trois étapes</p>
    ${t.etapes.map((e) => `
      <div class="phase" style="border-left-color:${e.couleur}">
        <span class="phase__num" style="color:${e.couleur}" aria-hidden="true">${e.num}</span>
        <span class="phase__titre">${e.titre}</span>
      </div>`).join('')}
  </div>`;
}

function rendreServices(t) {
  if (!(t.services || []).length) return '';
  return `
    <section class="pile-serree" aria-labelledby="titre-services" style="margin-top:var(--pas-4)">
      <h2 class="surtitre" id="titre-services">Les services de la DCIP</h2>
      ${t.services.map((s) => `
        <div class="carte carte--plate" style="display:flex;align-items:center;gap:var(--pas-3);padding:var(--pas-3)">
          <span class="pastille-service pastille-service--petite" style="color:${s.couleur}" aria-hidden="true">${ico('postes', 16)}</span>
          <div class="carte__corps">
            <div class="carte__titre" style="font-size:var(--txt-sm)">${s.nom}</div>
            ${s.description ? `<div class="carte__sous">${s.description}</div>` : ''}
          </div>
        </div>`).join('')}
    </section>`;
}

/* --- Détail d'une phase ---------------------------------------------------- */

export async function rendrePhase(section, num) {
  const t = await charger();
  const numero = Number(num);
  const phase = (t.phases || []).find((p) => p.num === numero);

  if (!phase) {
    section.innerHTML = `
      <div class="entete-detail">
        <a class="bouton-icone" href="#/metiers" aria-label="Retour au parcours">${ico('retour', 22)}</a>
        <span class="titre">Vie d'un projet</span>
      </div>
      <div class="section">
        <div class="bandeau bandeau--alerte">${ico('alerte', 16)}
          <span>Cette phase n'existe pas encore.</span></div>
        <p style="margin-top:var(--pas-4)"><a href="#/metiers">Revenir au parcours</a></p>
      </div>`;
    return;
  }

  const etape = (t.etapes || []).find((e) => e.id === phase.etape) || {};
  const total = (t.phases || []).length;
  const services = (id) => ((t.services || []).find((s) => s.id === id) || { nom: id });

  section.innerHTML = `
    <div class="entete-detail">
      <a class="bouton-icone" href="#/metiers" aria-label="Retour au parcours">${ico('retour', 22)}</a>
      <span class="titre">Vie d'un projet</span>
    </div>
    <div class="section pile">
      <div>
        <p class="surtitre" style="color:${etape.couleur}">Étape ${etape.num} · ${etape.titre}</p>
        <div class="rangee" style="align-items:baseline;gap:var(--pas-3);margin-top:var(--pas-1)">
          <span class="mono" style="font-size:var(--txt-2xl);color:var(--accent)" aria-hidden="true">${String(phase.num).padStart(2, '0')}</span>
          <h1>${phase.titre}</h1>
        </div>
        <p class="lecteur-seul">Phase ${phase.num} sur ${total}</p>
      </div>

      ${phase.citation ? `<blockquote class="citation">« ${phase.citation} »</blockquote>` : ''}

      ${(phase.points || []).length ? `
        <ul class="points">
          ${phase.points.map((p) => `<li>${ico('coche', 16)}<span>${p}</span></li>`).join('')}
        </ul>` : ''}

      ${(phase.intervenants || []).length ? `
        <section aria-labelledby="titre-intervenants">
          <p class="surtitre" id="titre-intervenants">Services qui interviennent</p>
          <div class="pile-serree" style="margin-top:var(--pas-2)">
            ${phase.intervenants.map((id) => {
              const s = services(id);
              return `<div class="carte carte--plate" style="display:flex;align-items:center;gap:var(--pas-3);padding:var(--pas-3)">
                <span class="pastille-service pastille-service--petite" aria-hidden="true">${ico('postes', 16)}</span>
                <span style="font-size:var(--txt-sm);font-weight:var(--graisse-moyenne)">${s.nom}</span>
              </div>`;
            }).join('')}
          </div>
        </section>` : ''}

      <div class="rangee" style="gap:var(--pas-3);margin-top:var(--pas-3)">
        ${numero > 1
          ? `<a class="bouton bouton--secondaire bouton--compact" href="#/phase/${numero - 1}">${ico('retour', 16)} Précédente</a>`
          : ''}
        ${numero < total
          ? `<a class="bouton bouton--primaire bouton--compact rangee-fin" href="#/phase/${numero + 1}">Suivante ${ico('chevron', 16)}</a>`
          : ''}
      </div>
    </div>`;

  annoncer(`Phase ${phase.num} sur ${total} : ${phase.titre}`);
}
