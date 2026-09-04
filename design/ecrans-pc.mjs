/* Les 4 écrans PC, en 1440×900 : borne du stand et consultation bureau.
   Au-delà de 1024 px, la barre d'onglets basse devient une navigation haute. */

import { ech, eyebrow, titre, bouton, badge, meta, carte, cartePoste,
         optionQuiz, bandeau, champ, progression, ICONES, pastille } from './composants.mjs';
import { QUIZ } from './themes.mjs';

const L = 1440, H = 900, CONTENU = 1100;

/** Navigation haute — l'équivalent desktop de la barre d'onglets. */
function navHaute(T, actif, compteur = 2) {
  const onglets = [['metiers', 'Métiers'], ['quiz', 'Quiz'], ['postes', 'Postes'], ['selection', 'Ma sélection']];
  return `<div style="background:${T.encre};color:#fff">
    <div style="max-width:${CONTENU}px;margin:0 auto;display:flex;align-items:center;gap:28px;
      height:62px;padding:0 24px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;
          border-radius:${T.cle === 'b' ? '3px' : '7px'};background:${T.accent};color:${T.encre};
          font-family:${T.mono};font-size:13px;font-weight:700">06</span>
        <span style="font-family:${T.titre};${T.cle === 'a' ? 'font-weight:400' : 'font-weight:700'};
          font-size:16px;color:#fff">Métiers <em style="${T.cle === 'a' ? 'font-style:italic;color:' + T.accent : 'font-style:normal;color:' + T.accent}">&amp; mobilité</em></span>
      </div>
      <div style="display:flex;gap:2px;flex:1">
        ${onglets.map(([id, lib]) => {
          const on = id === actif;
          const nb = (id === 'selection' && compteur)
            ? `<span style="min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:${T.accent};
                color:${T.encre};font-size:10.5px;font-weight:700;display:inline-flex;align-items:center;
                justify-content:center">${compteur}</span>` : '';
          return `<span style="display:inline-flex;align-items:center;gap:8px;height:62px;padding:0 16px;
            font-size:14px;font-weight:${on ? 600 : 500};color:${on ? '#fff' : 'rgba(255,255,255,.58)'};
            box-shadow:${on ? `inset 0 -3px 0 ${T.accent}` : 'none'}">${ICONES[id](18)}${lib}${nb}</span>`;
        }).join('')}
      </div>
      <span style="font-family:${T.mono};font-size:10px;letter-spacing:${T.eyebrowEspace};
        text-transform:uppercase;color:rgba(255,255,255,.34)">CADAM · 23 sept. 2026</span>
    </div>
  </div>`;
}

const coquePC = (T, actif, contenu, compteur = 2) => `
  <div style="width:${L}px;height:${H}px;display:flex;flex-direction:column;background:${T.fond};
    font-family:${T.texte};color:${T.texteFort};-webkit-font-smoothing:antialiased;overflow:hidden">
    ${navHaute(T, actif, compteur)}
    <div style="flex:1;min-height:0;overflow:hidden">${contenu}</div>
  </div>`;

/* ── PC 1 — Accueil et parcours ─────────────────────────────────────────── */
export function pcAccueil(T) {
  const etapes = [
    ['Conception', T.encre, ['Programmation', 'Faisabilité', 'Études', 'Marchés']],
    ['Réalisation', T.accentTexte, ['Chantier', 'Réception', 'Livraison']],
    ['Exploitation', T.succes, ['Maintenance', 'Énergie', 'Sûreté']],
  ];
  let n = 0;
  const colonnes = etapes.map(([nom, couleur, phases]) => `
    <div style="display:flex;flex-direction:column;gap:9px">
      <div style="display:flex;align-items:center;gap:9px;padding-bottom:8px;border-bottom:2px solid ${couleur}">
        <span style="font-family:${T.mono};font-size:10px;letter-spacing:${T.eyebrowEspace};
          text-transform:uppercase;color:${couleur};font-weight:500">${nom}</span>
        <span style="margin-left:auto;font-family:${T.mono};font-size:10px;color:${T.texteFaible}">${phases.length} phases</span>
      </div>
      ${phases.map((p) => { n += 1; return `
        <div style="display:flex;gap:12px;align-items:center;padding:13px 14px;background:${T.surface};
          border:1px solid ${T.bordureDouce};border-left:3px solid ${couleur};border-radius:${T.rayonPetit}px">
          <span style="font-family:${T.mono};font-size:12px;color:${couleur};font-weight:500">${String(n).padStart(2, '0')}</span>
          <span style="flex:1;font-size:14px;font-weight:500">${p}</span>
          <span style="color:${T.texteFaible}">${ICONES.chevron(15)}</span>
        </div>`; }).join('')}
    </div>`).join('');

  return coquePC(T, 'metiers', `
    <div style="background:${T.entete};color:#fff;padding:34px 24px">
      <div style="max-width:${CONTENU}px;margin:0 auto;display:flex;align-items:flex-end;gap:48px">
        <div style="flex:1">
          <div style="display:inline-flex;padding:4px 12px;border-radius:${T.rayonPastille}px;
            background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);font-family:${T.mono};
            font-size:10px;letter-spacing:${T.eyebrowEspace};text-transform:uppercase;color:${T.accent}">
            Journée des métiers et de la mobilité · CADAM</div>
          <div style="margin-top:16px;font-family:${T.titre};${T.titreStyle};font-size:46px;line-height:1.05;color:#fff">
            La vie d'un projet <em style="${T.cle === 'a' ? 'font-style:italic;color:' + T.accent : 'font-style:normal;color:' + T.accent}">immobilier</em></div>
          <div style="margin-top:12px;font-size:15px;line-height:1.6;color:rgba(255,255,255,.72);max-width:620px">
            De l'intention à l'exploitation, dix phases et huit services de la Direction de la Construction,
            de l'Immobilier et du Patrimoine.</div>
        </div>
        <div style="display:flex;gap:34px;padding-bottom:6px">
          ${[['10', 'phases'], ['8', 'services'], ['7', 'postes ouverts']].map(([n2, l]) => `
            <div style="text-align:right">
              <div style="font-family:${T.mono};font-size:34px;font-weight:500;color:${T.accent};line-height:1">${n2}</div>
              <div style="margin-top:4px;font-size:11.5px;color:rgba(255,255,255,.58)">${l}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div style="max-width:${CONTENU}px;margin:0 auto;padding:26px 24px">
      <div style="margin-bottom:18px;padding:10px 14px;border:1px dashed ${T.accentTexte};
        border-radius:${T.rayonPetit}px;background:${T.accentFond};font-size:12px;color:${T.accentTexte}">
        <strong>[CONTENU PROVISOIRE]</strong> — les intitulés des 10 phases proviendront du roll-up 60×160 cm, non fourni à ce jour.</div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px">${colonnes}</div>
    </div>`);
}

/* ── PC 2 — Quiz en cours ───────────────────────────────────────────────── */
export function pcQuiz(T, quiz) {
  const q = quiz[1];                 // gardiennage : porte la question à choix multiples
  const Q = QUIZ.gard;
  const item = q.questions.find((x) => x.multi) || q.questions[0];
  return `<div style="width:${L}px;height:${H}px;background:${Q.fond};font-family:${T.texte};
      display:flex;flex-direction:column;overflow:hidden">
    <div style="display:flex;align-items:center;gap:16px;padding:0 30px;height:62px;
      border-bottom:1px solid rgba(255,255,255,.09);color:${Q.texte}">
      <span style="display:inline-flex;align-items:center;gap:9px;font-size:14px;font-weight:600">
        ${ICONES.retour(19)} Quitter le quiz</span>
      <span style="margin-left:auto;font-family:${T.mono};font-size:11.5px;color:${Q.doux}">
        ${ech(Q.nom)} · Question <strong style="color:${Q.texte}">3</strong> / ${q.questions.length}</span>
    </div>
    <div style="padding:0 30px"><div style="max-width:900px;margin:0 auto;padding-top:2px">
      ${progression(T, 3, q.questions.length, Q.accent)}</div></div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:30px">
      <div style="width:900px;display:flex;gap:48px;align-items:flex-start">
        <div style="flex:1">
          <div style="display:inline-flex;padding:4px 11px;border-radius:${T.rayonPastille}px;
            background:${Q.accent}1F;color:${Q.accentTexte};font-family:${T.mono};font-size:10px;
            letter-spacing:.06em;text-transform:uppercase">${ech(item.cat)}</div>
          <div style="margin-top:16px;font-family:${T.titre};${T.cle === 'a' ? 'font-weight:400' : 'font-weight:700'};
            font-size:31px;line-height:1.25;color:${Q.texte}">${ech(item.q)}</div>
          <div style="margin-top:16px;display:inline-flex;align-items:center;gap:8px;padding:8px 13px;
            border-radius:${T.rayonPetit}px;background:${Q.accent}14;border:1px solid ${Q.accent}33;
            color:${Q.accentTexte};font-size:12.5px">
            ${ICONES.etincelle(15)} Plusieurs réponses sont attendues</div>
          <div style="margin-top:22px;display:flex;gap:12px;align-items:center">
            <span style="font-family:${T.mono};font-size:11px;color:${Q.doux}">Raccourcis</span>
            ${['1', '2', '3', '4', '↵'].map((k) => `<span style="display:inline-flex;align-items:center;
              justify-content:center;min-width:26px;height:26px;padding:0 6px;border-radius:4px;
              border:1px solid rgba(255,255,255,.20);font-family:${T.mono};font-size:11px;
              color:${Q.doux}">${k}</span>`).join('')}
          </div>
        </div>
        <div style="width:432px;display:flex;flex-direction:column;gap:10px">
          ${optionQuiz(Q, item.options[0], 'choisie', T, true)}
          ${optionQuiz(Q, item.options[1], 'choisie', T, true)}
          ${optionQuiz(Q, item.options[2], 'neutre', T, true)}
          ${optionQuiz(Q, item.options[3], 'choisie', T, true)}
          <button type="button" style="margin-top:6px;width:100%;min-height:50px;border:none;
            border-radius:${T.rayonPetit}px;background:${Q.accent};color:#0B0B0B;font-family:${T.texte};
            font-size:15.5px;font-weight:700;cursor:pointer">Valider mes réponses</button>
        </div>
      </div>
    </div>
  </div>`;
}

/* ── PC 3 — Postes : liste et fiche côte à côte ─────────────────────────── */
export function pcPostes(T, postes) {
  const filtres = ['Tous les services', 'Énergie et fluides', 'Études et travaux',
                   'Maintenance des collèges', 'Sécurité, Sûreté & Prévention'];
  const p = postes[4];
  return coquePC(T, 'postes', `
    <div style="max-width:${CONTENU}px;margin:0 auto;padding:22px 24px;height:100%;
      display:flex;flex-direction:column;gap:16px;overflow:hidden">
      <div style="display:flex;align-items:flex-end;gap:20px">
        <div style="flex:1">
          ${eyebrow(T, 'Recrutement et mobilité interne', T.accentTexte)}
          <div style="margin-top:5px">${titre(T, 'Les postes ouverts', 28)}</div>
        </div>
        <div style="display:flex;gap:4px;padding:4px;background:${T.fondAlt};border-radius:${T.rayonPetit + 2}px">
          <span style="padding:8px 15px;border-radius:${T.rayonPetit}px;background:${T.surface};
            box-shadow:${T.ombre};font-size:13px;font-weight:600">Postes DCIP · 7</span>
          <span style="padding:8px 15px;font-size:13px;color:${T.texteDoux}">Toutes les offres · 52</span>
        </div>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap">
        ${filtres.map((f, i) => `<span style="padding:7px 13px;border-radius:${T.rayonPastille}px;font-size:12.5px;
          border:1px solid ${i === 0 ? T.encre : T.bordure};background:${i === 0 ? T.encre : 'transparent'};
          color:${i === 0 ? '#fff' : T.texteDoux}">${f}</span>`).join('')}
      </div>
      <div style="flex:1;min-height:0;display:grid;grid-template-columns:400px 1fr;gap:22px;overflow:hidden">
        <div style="display:flex;flex-direction:column;gap:9px;overflow:hidden">
          ${bandeau(T, 'Mises à jour aujourd\'hui', 'succes', 'coche')}
          ${[[4, 'Candidature jusqu\'au 30 septembre 2026', ['En ligne', 'succes'], null],
              [3, 'Plus que 5 jours pour postuler', ['Urgent', 'alerte'], 'alerte'],
              [5, 'Candidature jusqu\'au 30 septembre 2026', ['En ligne', 'succes'], null]]
            .map(([i, st, bg, ton]) => cartePoste(T, postes[i], { statut: st, badge: bg, statutTon: ton })).join('')}
        </div>
        <div style="background:${T.surface};border:1px solid ${T.bordureDouce};border-radius:${T.rayon}px;
          box-shadow:${T.ombre};overflow:hidden;display:flex;flex-direction:column">
          <div style="background:${T.entete};padding:22px 26px;color:#fff">
            <div style="display:inline-flex;padding:3px 10px;border-radius:${T.rayonPastille}px;
              background:rgba(255,255,255,.12);font-family:${T.mono};font-size:9.5px;
              letter-spacing:${T.eyebrowEspace};text-transform:uppercase;color:${T.accent}">Service ${ech(p.service)}</div>
            <div style="margin-top:11px;font-family:${T.titre};${T.titreStyle};font-size:25px;
              line-height:1.2;color:#fff">${ech(p.titre)}</div>
            <div style="margin-top:9px;display:flex;gap:18px;font-size:12.5px;color:rgba(255,255,255,.66)">
              <span>Cat. ${ech(p.cat)}</span><span>${ech(p.filiere)}</span><span>${ech(p.lieu)}</span>
              <span>Jusqu'au 30 septembre 2026</span></div>
          </div>
          <div style="padding:22px 26px;display:flex;flex-direction:column;gap:18px;flex:1;overflow:hidden">
            <div style="font-size:14px;line-height:1.6;color:${T.texteDoux}">${ech(p.desc)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
              <div>${eyebrow(T, 'Missions')}
                <div style="margin-top:9px;display:flex;flex-direction:column;gap:8px">
                  ${p.missions.slice(0, 3).map((m) => `<div style="display:flex;gap:9px">
                    <span style="color:${T.accentTexte};margin-top:2px">${ICONES.coche(14)}</span>
                    <span style="flex:1;font-size:13px;line-height:1.5;color:${T.texteDoux}">${ech(m)}</span></div>`).join('')}
                </div></div>
              <div>${eyebrow(T, 'Profil recherché')}
                <div style="margin-top:9px;display:flex;flex-direction:column;gap:8px">
                  ${p.profils.slice(0, 3).map((m) => `<div style="display:flex;gap:9px">
                    <span style="color:${T.accentTexte};margin-top:2px">${ICONES.etincelle(14)}</span>
                    <span style="flex:1;font-size:13px;line-height:1.5;color:${T.texteDoux}">${ech(m)}</span></div>`).join('')}
                </div></div>
            </div>
          </div>
          <div style="padding:16px 26px;border-top:1px solid ${T.bordureDouce};background:${T.fondAlt};
            display:flex;gap:11px">
            ${bouton(T, 'Ajouter à ma sélection', 'primaire', { icone: 'plus', compact: true })}
            ${bouton(T, 'Fiche officielle', 'secondaire', { icone: 'lien', compact: true })}
          </div>
        </div>
      </div>
    </div>`);
}

/* ── PC 4 — Ma sélection et formulaire ──────────────────────────────────── */
export function pcSelection(T, postes, cfg) {
  const ligne = (p) => `
    <div style="display:flex;gap:14px;align-items:center;padding:15px;background:${T.surface};
      border:1px solid ${T.bordureDouce};border-radius:${T.rayonPetit}px">
      ${pastille(T, 'energie', T.encre, T.glace, 38)}
      <div style="flex:1">
        <div style="font-size:14.5px;font-weight:600">${ech(p.titre)}</div>
        <div style="margin-top:3px;font-size:12.5px;color:${T.texteDoux}">
          Service ${ech(p.service)} · Cat. ${ech(p.cat)} · Jusqu'au 30 septembre 2026</div>
      </div>
      <span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;
        color:${T.texteFaible}">${ICONES.croix(17)}</span>
    </div>`;

  return coquePC(T, 'selection', `
    <div style="max-width:${CONTENU}px;margin:0 auto;padding:26px 24px;display:grid;
      grid-template-columns:1fr 400px;gap:34px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          ${eyebrow(T, 'Votre panier', T.accentTexte)}
          <div style="margin-top:5px">${titre(T, 'Ma sélection', 28)}</div>
          <div style="margin-top:5px;font-size:13.5px;color:${T.texteDoux}">
            2 postes retenus — vous recevrez pour chacun l'intitulé, le service, la date limite
            et le lien vers la fiche officielle du Département.</div>
        </div>
        ${ligne(postes[4])}${ligne(postes[3])}
        <div style="padding:15px;background:${T.glace};border-radius:${T.rayonPetit}px;
          border:1px solid ${T.clair};font-size:12.5px;line-height:1.6;color:${T.encre}">
          <strong>Pas de courriel&nbsp;?</strong> Vous pouvez télécharger le récapitulatif
          au format imprimable, ou vous l'envoyer depuis votre propre messagerie. Aucune donnée
          ne quitte alors votre navigateur.</div>
      </div>

      <div style="background:${T.surface};border:1px solid ${T.bordureDouce};border-radius:${T.rayon}px;
        box-shadow:${T.ombre};padding:22px;display:flex;flex-direction:column;gap:15px">
        ${titre(T, 'Recevoir par courriel', 20)}
        ${champ(T, 'Votre adresse électronique', '', { obligatoire: true, focus: true,
          exemple: 'prenom.nom@exemple.fr', aide: 'C\'est le seul champ nécessaire.' })}
        <div style="display:flex;align-items:center;gap:9px;padding:11px 13px;background:${T.fondAlt};
          border:1px solid ${T.bordure};border-radius:${T.rayonPetit}px;font-size:13px;color:${T.texteDoux}">
          <span style="flex:1;font-weight:500">Ajouter mon nom et ma direction</span>
          <span style="color:${T.texteFaible}">${ICONES.plus(16)}</span>
        </div>
        <div style="display:flex;gap:10px;align-items:flex-start">
          <span style="width:20px;height:20px;flex:0 0 20px;border:1.5px solid ${T.texteFaible};
            border-radius:${T.cle === 'b' ? '2px' : '5px'};margin-top:1px"></span>
          <span style="flex:1;font-size:12.5px;line-height:1.5;color:${T.texteDoux}">
            J'accepte d'être recontacté(e) par la DCIP au sujet de ces postes.
            <span style="color:${T.alerte}">*</span></span>
        </div>
        <div style="font-size:11px;line-height:1.55;color:${T.texteFaible};padding-top:11px;
          border-top:1px solid ${T.bordureDouce}">
          Données traitées par la DRH et la DCIP du Département pour le suivi des mobilités internes.
          Conservation ${cfg.rgpd.duree_conservation_mois} mois. Droits d'accès, de rectification et
          d'effacement auprès du DPO. Aucun traceur, aucune mesure d'audience.</div>
        ${bouton(T, 'Envoyer ma demande', 'primaire', { large: true })}
        ${bouton(T, 'Télécharger le récapitulatif', 'secondaire', { large: true, icone: 'telecharger' })}
      </div>
    </div>`);
}
