/* Planches Fondations et Composants — une par charte. */

import { ech, eyebrow, titre, bouton, badge, carte, cartePoste, optionQuiz,
         tabBar, bandeau, champ, ICONES, pastille } from './composants.mjs';
import { QUIZ } from './themes.mjs';

/* Ratios mesurés (algorithme WCAG 2.1) — repris des relevés du projet. */
const RATIOS = {
  a: {
    '#042C53': ['Bleu nuit — texte principal', '13,5:1', 'AAA'],
    '#0C447C': ['Bleu profond — titres, aplats', '9,4:1', 'AAA'],
    '#185FA5': ['Bleu moyen — liens', '6,2:1', 'AA'],
    '#378ADD': ['Bleu clair — bordures, icônes', '3,4:1', 'composants seulement'],
    '#B5D4F4': ['Bleu pâle — fonds de badges', '—', 'fond'],
    '#E6F1FB': ['Bleu glacé — blocs informatifs', '—', 'fond'],
    '#EF9F27': ['Ambre — aplats et filets', '2,1:1', 'jamais en texte sur clair'],
    '#96590A': ['Ambre foncé — texte sur clair', '5,4:1', 'AA'],
    '#0F6E56': ['Vert — validation', '5,9:1', 'AA'],
    '#993C1D': ['Rouge — alerte, échéance', '6,7:1', 'AA'],
    '#455465': ['Gris — métadonnées', '7,4:1', 'AAA'],
    '#616D82': ['Gris clair — mentions', '5,0:1', 'AA'],
  },
  b: {
    '#0B2E4F': ['Encre — aplats, texte inversé', '13,8:1', 'AAA'],
    '#123A5C': ['Encre claire — survol', '11,8:1', 'AAA'],
    '#14293D': ['Ardoise — texte principal', '14,2:1', 'AAA'],
    '#D4A24A': ['Or héraldique — sur encre', '6,0:1', 'AA (sur encre)'],
    '#8A6410': ['Or foncé — texte sur clair', '5,1:1', 'AA'],
    '#B02026': ['Gueules — alerte', '6,5:1', 'AA'],
    '#0F5B44': ['Vert — validation', '7,7:1', 'AAA'],
    '#4A5B6B': ['Gris — métadonnées', '6,7:1', 'AA'],
    '#5C6B77': ['Gris clair — mentions', '5,3:1', 'AA'],
    '#AFC4D6': ['Bleu pâle — bordures', '—', 'fond'],
    '#EAF0F5': ['Glace — blocs informatifs', '—', 'fond'],
    '#F2F0EA': ['Papier alterné', '—', 'fond'],
  },
};

const section = (T, t, contenu, sous) => `
  <div style="display:flex;flex-direction:column;gap:14px">
    <div style="border-bottom:2px solid ${T.encre};padding-bottom:7px">
      ${titre(T, t, 17)}
      ${sous ? `<div style="margin-top:3px;font-size:12px;color:${T.texteFaible}">${sous}</div>` : ''}
    </div>
    ${contenu}
  </div>`;

/* ── Planche Fondations ─────────────────────────────────────────────────── */
export function fondations(T) {
  const swatches = Object.entries(RATIOS[T.cle]).map(([hex, [nom, ratio, verdict]]) => {
    const ok = verdict.startsWith('AA');
    return `<div style="display:flex;flex-direction:column;gap:7px">
      <div style="height:56px;border-radius:${T.rayonPetit}px;background:${hex};
        border:1px solid ${T.bordureDouce}"></div>
      <div>
        <div style="font-family:${T.mono};font-size:10.5px;color:${T.texteFort}">${hex}</div>
        <div style="font-size:11px;color:${T.texteDoux};line-height:1.35;margin-top:2px">${nom}</div>
        <div style="margin-top:5px;display:inline-flex;align-items:center;gap:4px;padding:2px 7px;
          border-radius:${T.rayonPastille}px;font-family:${T.mono};font-size:9px;
          background:${ok ? T.succesFond : T.alerteFond};color:${ok ? T.succes : T.alerte}">
          ${ratio} · ${verdict}</div>
      </div>
    </div>`;
  }).join('');

  const echelle = [
    ['Titre XXL', 44, T.titre, T.titreStyle], ['Titre XL', 32, T.titre, T.titreStyle],
    ['Titre L', 24, T.titre, T.titreStyle], ['Titre M', 19, T.titre, T.titreStyle],
    ['Texte courant', 15, T.texte, 'font-weight:400'], ['Secondaire', 13, T.texte, 'font-weight:400'],
    ['Métadonnée', 12, T.texte, 'font-weight:400'], ['Surtitre', 10, T.mono, 'letter-spacing:' + T.eyebrowEspace + ';text-transform:uppercase'],
  ].map(([nom, taille, police, style]) => `
    <div style="display:flex;align-items:baseline;gap:18px;padding:9px 0;border-bottom:1px solid ${T.bordureDouce}">
      <span style="width:92px;flex:0 0 92px;font-family:${T.mono};font-size:10px;color:${T.texteFaible}">${nom} · ${taille}px</span>
      <span style="flex:1;font-family:${police};${style};font-size:${taille}px;color:${T.texteFort};
        line-height:1.2">Métiers &amp; mobilité</span>
    </div>`).join('');

  const espaces = [4, 8, 12, 16, 24, 32, 48, 64].map((n) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="width:${n}px;height:34px;background:${T.encre};border-radius:1px"></div>
      <span style="font-family:${T.mono};font-size:9.5px;color:${T.texteFaible}">${n}</span>
    </div>`).join('');

  const rayons = [[T.rayonPetit, 'petit'], [T.rayon, 'carte'], [999, 'pastille']].map(([r, n]) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="width:60px;height:44px;background:${T.glace};border:1.5px solid ${T.encre};
        border-radius:${r === 999 ? (T.cle === 'b' ? T.rayonPastille : 999) : r}px"></div>
      <span style="font-family:${T.mono};font-size:9.5px;color:${T.texteFaible}">${n}</span>
    </div>`).join('');

  const etats = [
    ['Par défaut', bouton(T, 'Ajouter', 'primaire', { compact: true })],
    ['Survol', `<span style="display:inline-flex;filter:brightness(1.18)">${bouton(T, 'Ajouter', 'primaire', { compact: true })}</span>`],
    ['Focus clavier', `<span style="display:inline-flex;border-radius:${T.rayonPetit + 3}px;
        box-shadow:0 0 0 3px ${T.lien}66">${bouton(T, 'Ajouter', 'primaire', { compact: true })}</span>`],
    ['Actif', `<span style="display:inline-flex;filter:brightness(.86)">${bouton(T, 'Ajouter', 'primaire', { compact: true })}</span>`],
    ['Désactivé', `<span style="display:inline-flex;opacity:.42">${bouton(T, 'Ajouter', 'primaire', { compact: true })}</span>`],
  ].map(([nom, el]) => `
    <div style="display:flex;flex-direction:column;gap:7px;align-items:flex-start">
      <span style="font-family:${T.mono};font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;
        color:${T.texteFaible}">${nom}</span>${el}</div>`).join('');

  return `<div style="width:1180px;padding:38px 40px 44px;background:${T.fond};font-family:${T.texte};
      color:${T.texteFort};display:flex;flex-direction:column;gap:34px">
    <div style="display:flex;align-items:flex-end;gap:20px;padding-bottom:20px;border-bottom:3px solid ${T.encre}">
      <div style="flex:1">
        ${eyebrow(T, `Design ${T.cle.toUpperCase()} · Fondations`, T.accentTexte)}
        <div style="margin-top:7px">${titre(T, T.nom, 40)}</div>
        <div style="margin-top:7px;font-size:14px;color:${T.texteDoux}">${T.devise}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;text-align:right">
        <span style="font-family:${T.mono};font-size:10.5px;color:${T.texteFaible}">Titres · ${T.titre.split(',')[0].replace(/'/g, '')}</span>
        <span style="font-family:${T.mono};font-size:10.5px;color:${T.texteFaible}">Texte · ${T.texte.split(',')[0].replace(/'/g, '')}</span>
        <span style="font-family:${T.mono};font-size:10.5px;color:${T.texteFaible}">Mono · ${T.mono.split(',')[0].replace(/'/g, '')}</span>
      </div>
    </div>

    ${section(T, 'Palette', `<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:18px">${swatches}</div>`,
      'Ratio de contraste mesuré sur le fond de la charte. AA exige 4,5:1 en texte courant, 3:1 pour les composants d\'interface.')}

    ${section(T, 'Échelle typographique', `<div>${echelle}</div>`)}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:34px">
      ${section(T, 'Espacements', `<div style="display:flex;align-items:flex-end;gap:14px">${espaces}</div>`, 'Base 4 px')}
      ${section(T, 'Rayons et ombres', `
        <div style="display:flex;gap:22px;align-items:flex-end">
          ${rayons}
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div style="width:60px;height:44px;background:${T.surface};border-radius:${T.rayonPetit}px;
              box-shadow:${T.ombre}"></div>
            <span style="font-family:${T.mono};font-size:9.5px;color:${T.texteFaible}">portée</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div style="width:60px;height:44px;background:${T.surface};border-radius:${T.rayonPetit}px;
              box-shadow:${T.ombreForte}"></div>
            <span style="font-family:${T.mono};font-size:9.5px;color:${T.texteFaible}">modale</span>
          </div>
        </div>`)}
    </div>

    ${section(T, 'États interactifs', `<div style="display:flex;gap:26px;flex-wrap:wrap">${etats}</div>`,
      'Le focus clavier est toujours visible — il n\'est jamais supprimé (RGAA 10.7).')}
  </div>`;
}

/* ── Planche Composants ─────────────────────────────────────────────────── */
export function composants(T, postes, quiz) {
  const Q = QUIZ.feu;
  const item = quiz[0].questions[3];

  const groupe = (nom, contenu, fondSombre) => `
    <div style="display:flex;flex-direction:column;gap:11px">
      <span style="font-family:${T.mono};font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;
        color:${T.texteFaible}">${nom}</span>
      <div style="padding:${fondSombre ? '16px' : '0'};border-radius:${T.rayonPetit}px;
        ${fondSombre ? `background:${fondSombre};` : ''}display:flex;flex-direction:column;gap:10px">${contenu}</div>
    </div>`;

  return `<div style="width:1180px;padding:38px 40px 44px;background:${T.fond};font-family:${T.texte};
      color:${T.texteFort};display:flex;flex-direction:column;gap:34px">
    <div style="padding-bottom:20px;border-bottom:3px solid ${T.encre}">
      ${eyebrow(T, `Design ${T.cle.toUpperCase()} · Composants`, T.accentTexte)}
      <div style="margin-top:7px">${titre(T, 'Inventaire des pièces', 34)}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px">
      ${groupe('Boutons', `
        <div style="display:flex;flex-wrap:wrap;gap:9px">
          ${bouton(T, 'Primaire', 'primaire', { compact: true })}
          ${bouton(T, 'Secondaire', 'secondaire', { compact: true })}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:9px">
          ${bouton(T, 'Danger', 'danger', { compact: true })}
          ${bouton(T, 'Fantôme', 'fantome', { compact: true })}
        </div>
        ${bouton(T, 'Recevoir par courriel', 'primaire', { large: true, icone: 'courriel' })}`)}

      ${groupe('Badges', `
        <div style="display:flex;flex-wrap:wrap;gap:7px">
          ${badge(T, 'Nouveau', 'accent')}${badge(T, 'Urgent', 'alerte')}
          ${badge(T, 'Cat. A', 'encre')}${badge(T, 'Cat. B', 'neutre')}
          ${badge(T, 'En ligne', 'succes')}${badge(T, 'Retirée', 'alerte')}
        </div>`)}

      ${groupe('Pastilles de service', `
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${pastille(T, 'energie', T.encre, T.glace, 42)}
          ${pastille(T, 'etudes', T.encre, T.glace, 42)}
          ${pastille(T, 'colleges', T.encre, T.glace, 42)}
          ${pastille(T, 'surete', T.encre, T.glace, 42)}
        </div>
        <div style="font-size:11px;line-height:1.45;color:${T.texteFaible}">
          Tracés, pas des émojis : ils se recolorent, restent nets à l'impression
          et ne dépendent pas de la police du téléphone.</div>`)}
    </div>

    <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:32px">
      ${groupe('Carte de poste', `
        ${cartePoste(T, postes[4], { statut: 'Candidature jusqu\'au 30 septembre 2026', badge: ['En ligne', 'succes'] })}
        ${cartePoste(T, postes[1], { statut: 'Annonce retirée du site', statutTon: 'alerte', badge: ['Close', 'neutre'] })}
        <div style="font-size:11px;line-height:1.45;color:${T.texteFaible}">
          Le badge se déduit du statut réel de l'annonce, jamais d'un champ figé dans la fiche :
          sinon un poste retiré du site s'affiche « Nouveau ».</div>`)}

      ${groupe('Options de quiz — les quatre états', `
        ${optionQuiz(Q, item.options[0], 'neutre', T)}
        ${optionQuiz(Q, item.options[1], 'choisie', T)}
        ${optionQuiz(Q, item.options[2], 'juste', T)}
        ${optionQuiz(Q, 'Il appelle les secours depuis l\'extérieur', 'fausse', T)}`, Q.fond)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;align-items:start">
      ${groupe('Champs', `
        ${champ(T, 'Adresse électronique', '', { obligatoire: true, exemple: 'prenom.nom@exemple.fr' })}
        ${champ(T, 'Adresse électronique', 'm.dupont@exemple.fr', { obligatoire: true, focus: true })}`)}

      ${groupe('Bandeaux', `
        ${bandeau(T, 'Offres mises à jour le 04/09', 'info', 'horloge')}
        ${bandeau(T, 'Hors ligne — quiz et parcours restent disponibles', 'alerte', 'horsligne')}
        ${bandeau(T, 'Demande enregistrée', 'succes', 'coche')}`)}

      ${groupe('Feuille modale', `
        <div style="border-radius:${T.rayon}px ${T.rayon}px 0 0;background:${T.surface};
          box-shadow:${T.ombreForte};padding:14px 16px 18px;border:1px solid ${T.bordureDouce}">
          <div style="width:38px;height:4px;border-radius:2px;background:${T.bordure};margin:0 auto 14px"></div>
          <div style="font-size:15px;font-weight:600">Filtrer les offres</div>
          <div style="margin-top:11px;display:flex;flex-wrap:wrap;gap:7px">
            ${badge(T, 'Patrimoine bâti', 'encre')}${badge(T, 'Technique', 'neutre')}${badge(T, 'Cat. A', 'neutre')}
          </div>
          <div style="margin-top:14px">${bouton(T, 'Appliquer', 'primaire', { large: true, compact: true })}</div>
        </div>`)}
    </div>

    ${groupe('Barre d\'onglets', `<div style="max-width:390px;border:1px solid ${T.bordure};
      border-radius:${T.rayonPetit}px;overflow:hidden">${tabBar(T, 'postes', 2)}</div>`)}
  </div>`;
}
