/* Briques partagées par les deux chartes. Une seule définition, deux rendus :
   tout ce qui varie passe par le thème T. Styles en ligne, pour que chaque
   élément reste modifiable dans l'éditeur. */

import { ICONES, pastille } from './icones.mjs';

export const ech = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Étiquette en petites capitales espacées, au-dessus d'un titre. */
export function eyebrow(T, texte, couleur) {
  return `<div style="font-family:${T.mono};font-size:10px;letter-spacing:${T.eyebrowEspace};`
       + `text-transform:uppercase;color:${couleur || T.texteFaible}">${ech(texte)}</div>`;
}

export function titre(T, texte, taille, couleur, options = {}) {
  const ital = options.italique ? `<em style="${T.titreItal}">${ech(options.italique)}</em>` : '';
  return `<div style="font-family:${T.titre};${T.titreStyle};font-size:${taille}px;`
       + `line-height:1.15;color:${couleur || T.texteFort}">${ech(texte)}${ital}</div>`;
}

/** Bouton. Variantes : primaire, secondaire, danger, fantôme. */
export function bouton(T, libelle, variante = 'primaire', options = {}) {
  const pleineLargeur = options.large ? 'width:100%;' : '';
  const hauteur = options.compact ? 40 : 48;    // 48 px : cible tactile minimale
  const fonds = {
    primaire:   `background:${T.encre};color:#fff;border:1px solid ${T.encre}`,
    secondaire: `background:transparent;color:${T.texteFort};border:1px solid ${T.bordure}`,
    danger:     `background:${T.alerte};color:#fff;border:1px solid ${T.alerte}`,
    fantome:    `background:transparent;color:${T.texteDoux};border:1px solid transparent`,
    or:         `background:${T.accent};color:${T.cle === 'b' ? '#2A1F06' : '#3A2606'};border:1px solid ${T.accent}`,
  };
  const ico = options.icone ? `<span style="display:inline-flex">${ICONES[options.icone](18)}</span>` : '';
  const suffixe = options.suffixe ? `<span style="display:inline-flex;margin-left:auto">${ICONES[options.suffixe](18)}</span>` : '';
  return `<button type="button" style="${pleineLargeur}display:inline-flex;align-items:center;justify-content:`
       + `${options.suffixe ? 'flex-start' : 'center'};gap:10px;min-height:${hauteur}px;padding:0 18px;`
       + `border-radius:${T.rayonPetit}px;font-family:${T.texte};font-size:15px;font-weight:600;`
       + `cursor:pointer;${fonds[variante]}">${ico}<span>${ech(libelle)}</span>${suffixe}</button>`;
}

/** Pastille d'état : Nouveau, Urgent, Cat. A… */
export function badge(T, texte, ton = 'neutre') {
  const tons = {
    neutre:  `background:${T.fondAlt};color:${T.texteDoux};border:1px solid ${T.bordure}`,
    accent:  `background:${T.accentFond};color:${T.accentTexte};border:1px solid ${T.accentTexte}33`,
    succes:  `background:${T.succesFond};color:${T.succes};border:1px solid ${T.succes}33`,
    alerte:  `background:${T.alerteFond};color:${T.alerte};border:1px solid ${T.alerte}33`,
    encre:   `background:${T.glace};color:${T.encre};border:1px solid ${T.clair}`,
  };
  return `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;`
       + `border-radius:${T.rayonPastille}px;font-family:${T.mono};font-size:10px;font-weight:500;`
       + `letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;${tons[ton]}">${ech(texte)}</span>`;
}

/** Ligne de métadonnée avec icône : catégorie, lieu, échéance. */
export function meta(T, entrees) {
  const items = entrees.map(([ico, texte]) =>
    `<span style="display:inline-flex;align-items:center;gap:5px;color:${T.texteFaible};`
    + `font-size:12px">${ICONES[ico](14)}<span>${ech(texte)}</span></span>`).join('');
  return `<div style="display:flex;flex-wrap:wrap;gap:6px 14px">${items}</div>`;
}

export function carte(T, contenu, options = {}) {
  return `<div style="background:${T.surface};border:1px solid ${options.bordure || T.bordureDouce};`
       + `border-radius:${T.rayon}px;padding:${options.padding ?? 16}px;`
       + `${options.ombre === false ? '' : `box-shadow:${T.ombre};`}${options.style || ''}">${contenu}</div>`;
}

/** Carte de poste, telle qu'elle apparaît dans la liste. */
export function cartePoste(T, p, options = {}) {
  const icones = { 'Énergie et fluides': 'energie', 'Études et travaux': 'etudes',
                   'Maintenance des collèges': 'colleges', 'Sécurité, Sûreté & Prévention': 'surete' };
  const ico = icones[p.service] || 'postes';
  // Le badge se déduit du STATUT RÉEL de l'annonce, jamais du champ `tag`
  // figé dans la fiche rédigée : celui-ci vaut encore « new » sur un poste
  // dont l'annonce a été retirée du site, ce qui affiche « Nouveau » sur une
  // offre qu'on ne peut plus décrocher. Un badge ne doit jamais contredire
  // le statut affiché juste en dessous.
  const etiquette = options.badge ? badge(T, options.badge[0], options.badge[1]) : '';
  const statut = options.statut
    ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid ${T.bordureDouce};`
      + `display:flex;align-items:center;gap:6px;color:${options.statutTon === 'alerte' ? T.alerte : T.texteDoux};`
      + `font-size:12px">${ICONES[options.statutTon === 'alerte' ? 'alerte' : 'horloge'](14)}`
      + `<span>${ech(options.statut)}</span></div>` : '';
  const action = options.action || '';
  return carte(T, `
    <div style="display:flex;gap:14px;align-items:flex-start">
      ${pastille(T, ico, T.encre, T.glace, 40)}
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;gap:8px;align-items:flex-start">
          <div style="flex:1;font-family:${T.texte};font-size:15px;font-weight:600;line-height:1.3;color:${T.texteFort}">${ech(p.titre)}</div>
          ${etiquette}
        </div>
        <div style="font-size:12.5px;color:${T.texteDoux}">Service ${ech(p.service)}</div>
        ${meta(T, [['diplome', 'Cat. ' + p.cat], ['lieu', p.lieu || 'Nice — CADAM']])}
      </div>
      ${action}
    </div>${statut}`, { padding: 14 });
}

/** Option de quiz. États : neutre, choisie, juste, fausse. */
export function optionQuiz(Q, texte, etat = 'neutre', T, multi = false) {
  const etats = {
    neutre:  { bord: 'rgba(255,255,255,.14)', fond: 'rgba(255,255,255,.05)', couleur: Q.texte, marque: '' },
    choisie: { bord: Q.accent, fond: 'rgba(255,255,255,.10)', couleur: Q.texte, marque: '' },
    juste:   { bord: '#34D399', fond: 'rgba(52,211,153,.14)', couleur: Q.texte,
               marque: `<span style="display:inline-flex;align-items:center;gap:4px;color:#34D399;font-size:11px;font-weight:600">${ICONES.coche(14)}Bonne réponse</span>` },
    fausse:  { bord: '#F87171', fond: 'rgba(248,113,113,.12)', couleur: Q.texte,
               marque: `<span style="display:inline-flex;align-items:center;gap:4px;color:#F87171;font-size:11px;font-weight:600">${ICONES.croix(14)}Réponse écartée</span>` },
  }[etat];
  // Une case pour les choix multiples, un cercle pour les réponses uniques :
  // la forme annonce le nombre de réponses attendues avant même de lire.
  const forme = multi ? `${Math.round(T.rayonPetit / 2)}px` : '50%';
  const coche = (etat === 'choisie' || etat === 'juste')
    ? `<span style="color:${etat === 'juste' ? '#34D399' : Q.accent};display:inline-flex">${ICONES.coche(13)}</span>` : '';
  return `<div style="display:flex;align-items:flex-start;gap:11px;padding:13px 14px;min-height:48px;`
       + `border:1.5px solid ${etats.bord};border-radius:${T.rayonPetit}px;background:${etats.fond}">
      <span style="width:19px;height:19px;flex:0 0 19px;margin-top:1px;border-radius:${forme};
        border:1.5px solid ${etats.bord};display:inline-flex;align-items:center;justify-content:center">${coche}</span>
      <div style="flex:1;display:flex;flex-direction:column;gap:5px">
        <div style="font-size:14px;line-height:1.45;color:${etats.couleur}">${ech(texte)}</div>
        ${etats.marque}
      </div>
    </div>`;
}

/** Barre d'onglets basse. La navigation principale sur mobile. */
export function tabBar(T, actif = 'metiers', compteur = 0) {
  const onglets = [
    ['metiers', 'Métiers'], ['quiz', 'Quiz'], ['postes', 'Postes'], ['selection', 'Ma sélection'],
  ];
  const cases = onglets.map(([id, libelle]) => {
    const on = id === actif;
    const pastilleNb = (id === 'selection' && compteur > 0)
      ? `<span style="position:absolute;top:-3px;right:12px;min-width:17px;height:17px;padding:0 4px;
          border-radius:999px;background:${T.alerte};color:#fff;font-size:10px;font-weight:700;
          display:inline-flex;align-items:center;justify-content:center">${compteur}</span>` : '';
    return `<div style="position:relative;flex:1;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:3px;min-height:56px;color:${on ? T.encre : T.texteFaible}">
        ${pastilleNb}${ICONES[id](22)}
        <span style="font-size:10.5px;font-weight:${on ? 600 : 500};letter-spacing:-.01em">${libelle}</span>
        ${on ? `<span style="position:absolute;top:0;width:26px;height:3px;border-radius:0 0 3px 3px;background:${T.accent}"></span>` : ''}
      </div>`;
  }).join('');
  return `<div style="display:flex;background:${T.surface};border-top:1px solid ${T.bordure};
      padding-bottom:18px">${cases}</div>`;   /* 18px = zone du geste d'accueil iPhone */
}

/** Bandeau d'information : fraîcheur des offres, mode hors ligne. */
export function bandeau(T, texte, ton = 'info', icone = 'horloge') {
  const tons = {
    info:   `background:${T.glace};color:${T.encre};border-color:${T.clair}`,
    alerte: `background:${T.alerteFond};color:${T.alerte};border-color:${T.alerte}33`,
    succes: `background:${T.succesFond};color:${T.succes};border-color:${T.succes}33`,
  };
  return `<div style="display:flex;align-items:center;gap:9px;padding:9px 13px;border:1px solid;
      border-radius:${T.rayonPetit}px;font-size:12.5px;line-height:1.4;${tons[ton]}">
      ${ICONES[icone](16)}<span>${texte}</span></div>`;
}

/** Champ de formulaire. Le libellé est un vrai libellé, jamais un placeholder seul. */
export function champ(T, libelle, valeur, options = {}) {
  const obligatoire = options.obligatoire
    ? `<span style="color:${T.alerte}" aria-hidden="true">*</span>` : '';
  const aide = options.aide
    ? `<div style="font-size:11.5px;color:${T.texteFaible};line-height:1.45">${options.aide}</div>` : '';
  return `<label style="display:flex;flex-direction:column;gap:6px">
      <span style="font-size:12.5px;font-weight:600;color:${T.texteFort}">${ech(libelle)} ${obligatoire}
        ${options.facultatif ? `<span style="font-weight:400;color:${T.texteFaible}">(facultatif)</span>` : ''}</span>
      ${aide}
      <span style="display:flex;align-items:center;min-height:48px;padding:0 13px;background:${T.surface};
        border:1.5px solid ${options.focus ? T.encre : T.bordure};border-radius:${T.rayonPetit}px;
        ${options.focus ? `box-shadow:0 0 0 3px ${T.encre}22;` : ''}font-size:15px;
        color:${valeur ? T.texteFort : T.texteFaible}">${ech(valeur || options.exemple || '')}</span>
    </label>`;
}

/** Barre de progression d'un quiz. */
export function progression(T, courant, total, couleur) {
  return `<div style="height:4px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden">
      <div style="width:${Math.round((courant / total) * 100)}%;height:100%;background:${couleur};
        border-radius:2px"></div></div>`;
}

export { ICONES, pastille };
