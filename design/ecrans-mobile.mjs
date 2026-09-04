/* Les 11 écrans mobile, en 390×844. Même code pour les deux chartes. */

import {
  ech, eyebrow, titre, bouton, badge, meta, carte, cartePoste, optionQuiz,
  tabBar, bandeau, champ, progression, ICONES, pastille,
} from './composants.mjs';
import { QUIZ } from './themes.mjs';

const H = 844, L = 390;

/** Coque commune : barre haute, zone de contenu, barre d'onglets. */
export function coque(T, { entete, contenu, onglet, compteur = 0, fond, sansTabBar = false }) {
  return `<div style="width:${L}px;height:${H}px;display:flex;flex-direction:column;
      background:${fond || T.fond};font-family:${T.texte};color:${T.texteFort};
      -webkit-font-smoothing:antialiased;overflow:hidden">
    ${entete}
    <div style="flex:1;min-height:0;overflow:hidden">${contenu}</div>
    ${sansTabBar ? '' : tabBar(T, onglet, compteur)}
  </div>`;
}

/** Barre haute d'une vue de premier niveau. */
function enteteVue(T, surtitre, texte, options = {}) {
  return `<div style="padding:${options.hautPlein ? '16' : '14'}px 18px 12px;background:${T.surface};
      border-bottom:1px solid ${T.bordure}">
      ${eyebrow(T, surtitre, T.accentTexte)}
      <div style="margin-top:3px">${titre(T, texte, 22)}</div>
      ${options.sous ? `<div style="margin-top:3px;font-size:12.5px;color:${T.texteDoux}">${options.sous}</div>` : ''}
    </div>`;
}

/** Barre haute d'une vue de détail, avec retour. */
function enteteDetail(T, texte, fond, couleur) {
  return `<div style="display:flex;align-items:center;gap:12px;padding:0 14px;min-height:56px;
      background:${fond || T.surface};border-bottom:1px solid ${fond ? 'transparent' : T.bordure};
      color:${couleur || T.texteFort}">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;
        margin-left:-8px">${ICONES.retour(22)}</span>
      <span style="font-size:15px;font-weight:600">${ech(texte)}</span>
    </div>`;
}

/* ── 1. Accueil ─────────────────────────────────────────────────────────── */
export function accueil(T, cfg) {
  const tuile = (ico, titreT, sous, ton) => `
    <div style="display:flex;align-items:center;gap:14px;padding:15px;background:${T.surface};
      border:1px solid ${T.bordureDouce};border-radius:${T.rayon}px;box-shadow:${T.ombre}">
      ${pastille(T, ico, ton === 'or' ? T.accentTexte : T.encre, ton === 'or' ? T.accentFond : T.glace, 42)}
      <div style="flex:1">
        <div style="font-size:15px;font-weight:600;line-height:1.25">${titreT}</div>
        <div style="font-size:12.5px;color:${T.texteDoux};margin-top:2px">${sous}</div>
      </div>
      <span style="color:${T.texteFaible}">${ICONES.chevron(18)}</span>
    </div>`;

  const entete = `<div style="background:${T.entete};padding:26px 20px 24px;color:#fff;position:relative;overflow:hidden">
      ${T.cle === 'a' ? `<div style="position:absolute;right:-70px;top:-70px;width:300px;height:300px;
        border-radius:50%;background:radial-gradient(circle,rgba(239,159,39,.10) 0%,transparent 70%)"></div>` : ''}
      ${T.cle === 'b' ? `<div style="position:absolute;left:0;bottom:0;width:100%;height:5px;background:${T.accent}"></div>` : ''}
      <div style="position:relative">
        <div style="display:inline-flex;align-items:center;gap:7px;padding:4px 11px;border-radius:${T.rayonPastille}px;
          background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);
          font-family:${T.mono};font-size:9.5px;letter-spacing:${T.eyebrowEspace};text-transform:uppercase;color:${T.accent}">
          ${ech(cfg.evenement.lieu)} · ${ech(cfg.evenement.date)}</div>
        <div style="margin-top:14px;font-family:${T.titre};${T.titreStyle};font-size:31px;line-height:1.08;color:#fff">
          Métiers &amp; mobilité<br><em style="${T.cle === 'a' ? 'font-style:italic;color:' + T.accent : 'font-style:normal;color:' + T.accent}">à la DCIP</em></div>
        <div style="margin-top:9px;font-size:13px;line-height:1.5;color:rgba(255,255,255,.72);max-width:300px">
          Construire, entretenir et sécuriser les bâtiments du Département : 8 services, 10 phases, des métiers qu'on ne soupçonne pas.</div>
      </div>
    </div>`;

  return coque(T, { onglet: 'metiers', entete: '', compteur: 2, contenu: `
    <div style="height:100%;overflow:hidden">
      ${entete}
      <div style="padding:16px 18px;display:flex;flex-direction:column;gap:9px">
        ${tuile('metiers', 'La vie d\'un projet immobilier', '10 phases, de l\'intention à l\'exploitation')}
        ${tuile('quiz', 'Trois quiz, trois métiers', 'Incendie, gardiennage, sûreté — 20 questions', 'or')}
        ${tuile('postes', 'Les postes ouverts', '7 fiches DCIP et 52 offres du Département')}
      </div>
      <div style="padding:2px 18px">
        ${bandeau(T, 'Offres mises à jour aujourd\'hui', 'succes', 'coche')}
      </div>
    </div>` });
}

/* ── 2. Timeline métiers ────────────────────────────────────────────────── */
export function timeline(T) {
  const etapes = [
    ['Conception', T.encre, ['Programmation', 'Faisabilité', 'Études', 'Marchés']],
    ['Réalisation', T.accentTexte, ['Chantier', 'Réception', 'Livraison']],
    ['Exploitation', T.succes, ['Maintenance', 'Énergie', 'Sûreté']],
  ];
  let n = 0;
  const blocs = etapes.map(([nom, couleur, phases]) => `
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;gap:9px;padding-top:4px">
        <span style="width:9px;height:9px;border-radius:${T.cle === 'b' ? '1px' : '50%'};background:${couleur}"></span>
        <span style="font-family:${T.mono};font-size:10px;letter-spacing:${T.eyebrowEspace};
          text-transform:uppercase;color:${couleur};font-weight:500">${nom}</span>
        <span style="flex:1;height:1px;background:${T.bordure}"></span>
      </div>
      ${phases.map((p) => {
        n += 1;
        return `<div style="display:flex;gap:13px;align-items:center;padding:13px 14px;background:${T.surface};
          border:1px solid ${T.bordureDouce};border-left:3px solid ${couleur};
          border-radius:${T.rayonPetit}px;min-height:48px">
          <span style="font-family:${T.mono};font-size:12px;font-weight:500;color:${couleur};
            min-width:22px">${String(n).padStart(2, '0')}</span>
          <span style="flex:1;font-size:14px;font-weight:500">${p}</span>
          <span style="color:${T.texteFaible}">${ICONES.chevron(16)}</span>
        </div>`;
      }).join('')}
    </div>`).join('');

  return coque(T, { onglet: 'metiers', compteur: 2,
    entete: enteteVue(T, 'Le métier', 'Vie d\'un projet', { sous: '10 phases · 3 étapes · 8 services' }),
    contenu: `<div style="padding:14px 18px;display:flex;flex-direction:column;gap:16px">
      <div style="padding:10px 13px;border:1px dashed ${T.accentTexte};border-radius:${T.rayonPetit}px;
        background:${T.accentFond};font-size:11.5px;line-height:1.45;color:${T.accentTexte}">
        <strong>[CONTENU PROVISOIRE]</strong> — intitulés des 10 phases à reprendre du roll-up 60×160 cm, non fourni à ce jour.</div>
      ${blocs}
    </div>` });
}

/* ── 3. Détail d'une phase ──────────────────────────────────────────────── */
export function phase(T) {
  const services = [['etudes', 'Études et travaux'], ['energie', 'Énergie et fluides'], ['colleges', 'Maintenance des collèges']];
  return coque(T, { onglet: 'metiers', compteur: 2, entete: enteteDetail(T, 'Vie d\'un projet'), contenu: `
    <div style="padding:18px;display:flex;flex-direction:column;gap:16px">
      <div>
        ${eyebrow(T, 'Étape 1 · Conception', T.encre)}
        <div style="display:flex;align-items:baseline;gap:11px;margin-top:6px">
          <span style="font-family:${T.mono};font-size:30px;font-weight:500;color:${T.accent}">03</span>
          ${titre(T, 'Études', 26)}
        </div>
      </div>
      <div style="padding:15px;background:${T.glace};border-left:3px solid ${T.encre};
        border-radius:0 ${T.rayonPetit}px ${T.rayonPetit}px 0;font-family:${T.titre};
        ${T.cle === 'a' ? 'font-style:italic;' : 'font-weight:600;'}font-size:16px;line-height:1.45;color:${T.encre}">
        « [Phrase d'accroche du roll-up, à reprendre mot pour mot.] »</div>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${['[Point clé 1 de la phase]', '[Point clé 2 de la phase]', '[Point clé 3 de la phase]'].map((p) => `
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span style="color:${T.accentTexte};margin-top:1px">${ICONES.coche(16)}</span>
            <span style="flex:1;font-size:14px;line-height:1.5;color:${T.texteDoux}">${p}</span>
          </div>`).join('')}
      </div>
      <div>
        ${eyebrow(T, 'Services qui interviennent')}
        <div style="margin-top:9px;display:flex;flex-direction:column;gap:7px">
          ${services.map(([ico, nom]) => `
            <div style="display:flex;align-items:center;gap:11px;padding:10px 12px;background:${T.surface};
              border:1px solid ${T.bordureDouce};border-radius:${T.rayonPetit}px">
              ${pastille(T, ico, T.encre, T.glace, 32)}
              <span style="font-size:13.5px;font-weight:500">${nom}</span>
            </div>`).join('')}
        </div>
      </div>
      <div style="display:flex;gap:10px">
        ${bouton(T, 'Phase précédente', 'secondaire', { compact: true })}
        ${bouton(T, 'Phase suivante', 'primaire', { compact: true })}
      </div>
    </div>` });
}

/* ── 4. Hub des quiz ────────────────────────────────────────────────────── */
export function hubQuiz(T, quiz) {
  const icones = { feu: 'flamme', gard: 'bouclier', surt: 'camera' };
  const cartes = quiz.map((q) => {
    const Q = QUIZ[q.id];
    return `<div style="border-radius:${T.rayon}px;overflow:hidden;background:${Q.fond};
        border:1px solid ${T.cle === 'b' ? Q.accent + '55' : 'transparent'}">
        <div style="padding:16px">
          <div style="display:flex;align-items:center;gap:11px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;
              border-radius:${T.cle === 'b' ? T.rayonPetit + 'px' : '50%'};background:${Q.accent}22;color:${Q.accent}">
              ${ICONES[icones[q.id]](20)}</span>
            <div style="flex:1">
              <div style="font-family:${T.mono};font-size:9.5px;letter-spacing:${T.eyebrowEspace};
                text-transform:uppercase;color:${Q.accentTexte}">${ech(q.categorie)}</div>
              <div style="font-size:15.5px;font-weight:600;color:${Q.texte};margin-top:2px;line-height:1.25">${ech(q.titre)}</div>
            </div>
          </div>
          <div style="margin-top:11px;font-size:12.5px;line-height:1.5;color:${Q.doux}">${ech(q.accroche)}</div>
          <div style="margin-top:13px;display:flex;align-items:center;gap:8px">
            <span style="font-family:${T.mono};font-size:10.5px;color:${Q.doux}">${q.questions.length} questions</span>
            <span style="width:3px;height:3px;border-radius:50%;background:${Q.doux}"></span>
            <span style="font-family:${T.mono};font-size:10.5px;color:${Q.doux}">${ech(q.meta.duree)}</span>
            <span style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:7px 13px;
              border-radius:${T.rayonPetit}px;background:${Q.accent};color:#0B0B0B;font-size:12.5px;
              font-weight:700">Commencer ${ICONES.chevron(14)}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  return coque(T, { onglet: 'quiz', compteur: 2,
    entete: enteteVue(T, 'Jouez, gagnez', 'Trois quiz', { sous: '20 questions · aucune inscription' }),
    contenu: `<div style="padding:14px 18px;display:flex;flex-direction:column;gap:11px">${cartes}</div>` });
}

/* ── 5. Question de quiz ────────────────────────────────────────────────── */
export function question(T, q) {
  const Q = QUIZ[q.id];
  const item = q.questions[3];      // « serre-file » : trois options, une bonne réponse
  return coque(T, { sansTabBar: true, fond: Q.fond,
    entete: enteteDetail(T, Q.nom, Q.fond, Q.texte),
    contenu: `<div style="padding:0 18px 18px;display:flex;flex-direction:column;gap:15px;height:100%">
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-family:${T.mono};font-size:11px;color:${Q.doux}">
            Question <strong style="color:${Q.texte}">4</strong> / ${q.questions.length}</span>
          <span style="padding:3px 9px;border-radius:${T.rayonPastille}px;background:${Q.accent}1F;
            color:${Q.accentTexte};font-family:${T.mono};font-size:9.5px;letter-spacing:.06em;
            text-transform:uppercase">${ech(item.cat)}</span>
        </div>
        ${progression(T, 4, q.questions.length, Q.accent)}
      </div>
      <div style="font-family:${T.titre};${T.cle === 'a' ? 'font-weight:400;' : 'font-weight:700;'}
        font-size:19px;line-height:1.32;color:${Q.texte}">${ech(item.q)}</div>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${optionQuiz(Q, item.options[0], 'neutre', T)}
        ${optionQuiz(Q, item.options[1], 'neutre', T)}
        ${optionQuiz(Q, item.options[2], 'choisie', T)}
      </div>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:9px">
        <div style="font-size:11px;color:${Q.doux};text-align:center">Une seule réponse attendue</div>
        <button type="button" style="width:100%;min-height:50px;border:none;border-radius:${T.rayonPetit}px;
          background:${Q.accent};color:#0B0B0B;font-family:${T.texte};font-size:15.5px;font-weight:700;
          cursor:pointer">Valider ma réponse</button>
      </div>
    </div>` });
}

/* ── 6. Résultat de quiz ────────────────────────────────────────────────── */
export function resultat(T, q) {
  const Q = QUIZ[q.id];
  const v = q.verdicts[1];          // palier 70 % : le cas le plus fréquent
  const score = 6;
  return coque(T, { sansTabBar: true, fond: Q.fond,
    entete: enteteDetail(T, Q.nom, Q.fond, Q.texte),
    contenu: `<div style="padding:0 18px 18px;display:flex;flex-direction:column;gap:16px;height:100%">
      <div style="text-align:center;padding-top:6px">
        ${eyebrow(T, 'Résultat final', Q.doux)}
        <div style="margin-top:6px;font-family:${T.mono};font-weight:500;color:${Q.texte};line-height:1">
          <span style="font-size:58px">${score}</span><span style="font-size:24px;color:${Q.doux}">/${q.questions.length}</span></div>
      </div>
      <div style="padding:15px;border-radius:${T.rayonPetit}px;background:${Q.accent}14;
        border:1px solid ${Q.accent}3D">
        <div style="font-family:${T.titre};${T.cle === 'a' ? 'font-weight:400' : 'font-weight:700'};
          font-size:17px;color:${Q.accentTexte};line-height:1.3">${ech(v.titre)}</div>
        <div style="margin-top:8px;font-size:13px;line-height:1.55;color:${Q.doux}">${ech(v.texte)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${eyebrow(T, 'Le détail', Q.doux)}
        ${q.questions.slice(0, 3).map((x, i) => `
          <div style="display:flex;gap:10px;align-items:flex-start;padding:11px 12px;
            border:1px solid rgba(255,255,255,.10);border-radius:${T.rayonPetit}px;background:rgba(255,255,255,.03)">
            <span style="color:${i === 2 ? '#F87171' : '#34D399'};margin-top:1px">
              ${i === 2 ? ICONES.croix(15) : ICONES.coche(15)}</span>
            <span style="flex:1;font-size:12.5px;line-height:1.45;color:${Q.doux}">${ech(x.q.slice(0, 74))}…</span>
          </div>`).join('')}
      </div>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:9px">
        <button type="button" style="width:100%;min-height:48px;border:none;border-radius:${T.rayonPetit}px;
          background:${Q.accent};color:#0B0B0B;font-family:${T.texte};font-size:15px;font-weight:700;
          cursor:pointer">Refaire ce quiz</button>
        <button type="button" style="width:100%;min-height:48px;border:1px solid rgba(255,255,255,.22);
          border-radius:${T.rayonPetit}px;background:transparent;color:${Q.texte};font-family:${T.texte};
          font-size:15px;font-weight:600;cursor:pointer">Voir les postes de la DCIP</button>
      </div>
    </div>` });
}

/* ── 7. Liste des postes ────────────────────────────────────────────────── */
export function listePostes(T, postes) {
  const bascule = (libelle, actif) => `
    <div style="flex:1;text-align:center;padding:9px 6px;border-radius:${T.rayonPetit}px;font-size:12.5px;
      font-weight:${actif ? 600 : 500};background:${actif ? T.surface : 'transparent'};
      color:${actif ? T.texteFort : T.texteDoux};${actif ? `box-shadow:${T.ombre}` : ''}">${libelle}</div>`;

  return coque(T, { onglet: 'postes', compteur: 2,
    entete: enteteVue(T, 'Recrutement', 'Les postes', { sous: '7 fiches DCIP · 52 offres au Département' }),
    contenu: `<div style="padding:12px 18px;display:flex;flex-direction:column;gap:11px">
      <div style="display:flex;gap:4px;padding:4px;background:${T.fondAlt};border-radius:${T.rayonPetit + 2}px">
        ${bascule('Postes DCIP', true)}${bascule('Toutes les offres', false)}
      </div>
      ${bandeau(T, 'Offres mises à jour aujourd\'hui — 3 fiches sur 7 encore en ligne', 'info', 'horloge')}
      ${cartePoste(T, postes[4], { statut: 'Candidature jusqu\'au 30 septembre 2026', badge: ['En ligne', 'succes'],
          action: `<span style="color:${T.texteFaible};align-self:center">${ICONES.chevron(18)}</span>` })}
      ${cartePoste(T, postes[3], { statut: 'Plus que 5 jours pour postuler', statutTon: 'alerte', badge: ['Urgent', 'alerte'],
          action: `<span style="color:${T.texteFaible};align-self:center">${ICONES.chevron(18)}</span>` })}
      ${cartePoste(T, postes[1], { statut: 'Annonce retirée du site', statutTon: 'alerte', badge: ['Close', 'neutre'],
          action: `<span style="color:${T.texteFaible};align-self:center">${ICONES.chevron(18)}</span>` })}
    </div>` });
}

/* ── 8. Fiche de poste ──────────────────────────────────────────────────── */
export function fichePoste(T, p) {
  const liste = (titreListe, items, ico) => `
    <div>
      ${eyebrow(T, titreListe)}
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:7px">
        ${items.map((m) => `<div style="display:flex;gap:9px;align-items:flex-start">
          <span style="color:${T.accentTexte};margin-top:2px">${ICONES[ico](15)}</span>
          <span style="flex:1;font-size:13.5px;line-height:1.5;color:${T.texteDoux}">${ech(m)}</span></div>`).join('')}
      </div>
    </div>`;

  return coque(T, { onglet: 'postes', compteur: 2, entete: enteteDetail(T, 'Les postes'), contenu: `
    <div style="height:100%;overflow:hidden">
      <div style="background:${T.entete};padding:18px;color:#fff">
        <div style="display:inline-flex;padding:3px 10px;border-radius:${T.rayonPastille}px;
          background:rgba(255,255,255,.12);font-family:${T.mono};font-size:9.5px;
          letter-spacing:${T.eyebrowEspace};text-transform:uppercase;color:${T.accent}">Service ${ech(p.service)}</div>
        <div style="margin-top:10px;font-family:${T.titre};${T.titreStyle};font-size:21px;
          line-height:1.2;color:#fff">${ech(p.titre)}</div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:7px 14px;font-size:12px;color:rgba(255,255,255,.66)">
          <span>Cat. ${ech(p.cat)}</span><span>${ech(p.filiere)}</span><span>${ech(p.lieu)}</span></div>
      </div>
      <div style="padding:16px 18px;display:flex;flex-direction:column;gap:15px">
        <div style="font-size:13.5px;line-height:1.55;color:${T.texteDoux}">${ech(p.desc)}</div>
        ${liste('Missions', p.missions.slice(0, 3), 'coche')}
        ${liste('Profil recherché', p.profils.slice(0, 2), 'etincelle')}
      </div>
      <div style="padding:0 18px;display:flex;flex-direction:column;gap:9px">
        ${bouton(T, 'Ajouter à ma sélection', 'primaire', { large: true, icone: 'plus' })}
        ${bouton(T, 'Voir la fiche officielle', 'secondaire', { large: true, icone: 'lien' })}
      </div>
    </div>` });
}

/* ── 9. Ma sélection ────────────────────────────────────────────────────── */
export function selection(T, postes) {
  const ligne = (p) => `
    <div style="display:flex;gap:12px;align-items:flex-start;padding:13px;background:${T.surface};
      border:1px solid ${T.bordureDouce};border-radius:${T.rayonPetit}px">
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600;line-height:1.3">${ech(p.titre)}</div>
        <div style="margin-top:3px;font-size:12px;color:${T.texteDoux}">Service ${ech(p.service)} · Cat. ${ech(p.cat)}</div>
        <div style="margin-top:6px">${badge(T, 'Jusqu\'au 30 septembre', 'neutre')}</div>
      </div>
      <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;
        color:${T.texteFaible}">${ICONES.croix(17)}</span>
    </div>`;

  return coque(T, { onglet: 'selection', compteur: 2,
    entete: enteteVue(T, 'Votre panier', 'Ma sélection', { sous: '2 postes retenus' }),
    contenu: `<div style="padding:14px 18px;display:flex;flex-direction:column;gap:10px;height:100%">
      ${ligne(postes[4])}
      ${ligne(postes[3])}
      <div style="margin-top:auto;padding-bottom:6px;display:flex;flex-direction:column;gap:9px">
        ${bandeau(T, 'Renseignez seulement votre adresse : nous vous envoyons le récapitulatif.', 'info', 'courriel')}
        ${bouton(T, 'Recevoir par courriel', 'primaire', { large: true, icone: 'courriel' })}
      </div>
    </div>` });
}

/* ── 10. Formulaire ─────────────────────────────────────────────────────── */
export function formulaire(T, cfg) {
  return coque(T, { sansTabBar: true, entete: enteteDetail(T, 'Ma sélection'), contenu: `
    <div style="padding:16px 18px;display:flex;flex-direction:column;gap:14px;height:100%">
      <div>
        ${eyebrow(T, '2 postes retenus', T.accentTexte)}
        <div style="margin-top:4px">${titre(T, 'Recevoir mon récapitulatif', 21)}</div>
      </div>
      ${champ(T, 'Votre adresse électronique', '', { obligatoire: true, focus: true,
        exemple: 'prenom.nom@exemple.fr', aide: 'C\'est le seul champ nécessaire.' })}
      <div style="display:flex;align-items:center;gap:9px;padding:11px 13px;background:${T.fondAlt};
        border:1px solid ${T.bordure};border-radius:${T.rayonPetit}px;color:${T.texteDoux};font-size:13px">
        <span style="flex:1;font-weight:500">Ajouter mon nom et ma direction</span>
        <span style="color:${T.texteFaible}">${ICONES.plus(17)}</span>
      </div>
      <div style="padding:12px 13px;background:${T.surface};border:1px solid ${T.bordure};
        border-radius:${T.rayonPetit}px">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <span style="width:21px;height:21px;flex:0 0 21px;border:1.5px solid ${T.texteFaible};
            border-radius:${T.cle === 'b' ? '2px' : '5px'};margin-top:1px"></span>
          <span style="flex:1;font-size:12.5px;line-height:1.5;color:${T.texteDoux}">
            J'accepte d'être recontacté(e) par la DCIP au sujet de ces postes.
            <span style="color:${T.alerte}">*</span></span>
        </div>
        <div style="margin-top:9px;padding-top:9px;border-top:1px solid ${T.bordureDouce};
          font-size:11px;line-height:1.5;color:${T.texteFaible}">
          Données traitées par la DRH et la DCIP du Département pour le suivi des mobilités.
          Conservation ${cfg.rgpd.duree_conservation_mois} mois. Droits d'accès et de rectification auprès du DPO.</div>
      </div>
      <div style="margin-top:auto;padding-bottom:6px;display:flex;flex-direction:column;gap:8px">
        ${bouton(T, 'Envoyer ma demande', 'primaire', { large: true })}
        <div style="text-align:center;font-size:11.5px;color:${T.texteFaible}">
          Ou <span style="color:${T.lien};font-weight:600;text-decoration:underline">télécharger le récapitulatif</span></div>
      </div>
    </div>` });
}

/* ── 11. Confirmation ───────────────────────────────────────────────────── */
export function confirmation(T) {
  return coque(T, { sansTabBar: true, entete: '', contenu: `
    <div style="padding:34px 22px 20px;display:flex;flex-direction:column;gap:18px;height:100%;text-align:center">
      <div style="display:flex;justify-content:center">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:66px;height:66px;
          border-radius:${T.cle === 'b' ? T.rayon + 'px' : '50%'};background:${T.succesFond};
          color:${T.succes}">${ICONES.coche(32)}</span>
      </div>
      <div>
        ${titre(T, 'C\'est envoyé', 25)}
        <div style="margin-top:9px;font-size:14px;line-height:1.55;color:${T.texteDoux}">
          Le récapitulatif de vos <strong style="color:${T.texteFort}">2 postes</strong> part à
          <strong style="color:${T.texteFort}">m.dupont@exemple.fr</strong>. Pensez à regarder vos indésirables.</div>
      </div>
      <div style="text-align:left;display:flex;flex-direction:column;gap:8px">
        ${eyebrow(T, 'Ce qui vous a été envoyé')}
        ${['Ingénieur chargé d\'études courants forts et faibles', 'Ingénieur conduite d\'opérations bâtiments OPC'].map((t) => `
          <div style="display:flex;gap:9px;align-items:flex-start;padding:11px 12px;background:${T.surface};
            border:1px solid ${T.bordureDouce};border-radius:${T.rayonPetit}px">
            <span style="color:${T.succes};margin-top:1px">${ICONES.coche(15)}</span>
            <span style="flex:1;font-size:13px;line-height:1.4;text-align:left">${t}</span></div>`).join('')}
      </div>
      <div style="margin-top:auto;padding-bottom:6px;display:flex;flex-direction:column;gap:9px">
        ${bouton(T, 'Continuer à explorer', 'primaire', { large: true })}
        ${bouton(T, 'Télécharger une copie', 'secondaire', { large: true, icone: 'telecharger' })}
      </div>
    </div>` });
}
