/* Assemble les artboards .dc.html et le canvas.json du dossier de conception. */

import fs from 'node:fs';
import path from 'node:path';
import { A, B } from './themes.mjs';
import * as M from './ecrans-mobile.mjs';
import * as P from './ecrans-pc.mjs';
import { fondations, composants } from './planches.mjs';
import { eyebrow, titre, badge, ICONES } from './composants.mjs';

// Chemins relatifs au dépôt : le générateur suit le projet, où qu'il soit cloné.
const ICI = path.dirname(new URL(import.meta.url).pathname);
const RACINE = path.resolve(ICI, '..');
const SORTIE = process.argv[2] || path.join(ICI, 'sortie');
const lire = (f) => JSON.parse(fs.readFileSync(path.join(RACINE, 'data', f), 'utf8'));

const postes = lire('postes-dcip.json');
const quiz   = lire('quiz.json');
const cfg    = lire('config.json');

fs.mkdirSync(SORTIE, { recursive: true });

/** Enveloppe un fragment HTML dans le format Design Component. */
function artboard(nom, T, corps, { w, h }) {
  const fontes = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${T.fontesGoogle}&display=swap">`;
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${fontes}
  <style>
    /* Sans cela, un conteneur en height:100% additionne ses paddings à sa
       hauteur : l'écran de confirmation dépassait de 54 px et son dernier
       bouton était coupé. C'est aussi ce que fera css/base.css. */
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: ${T.texte}; }
    a { color: ${T.lien}; text-decoration: underline; }
    a:hover { color: ${T.encre2}; }
    button { font: inherit; }
  </style>
</helmet>
<div style="width:${w}px;min-height:${h}px;background:${T.fond}">
${corps}
</div>
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {}
</script>
</body>
</html>`;
  fs.writeFileSync(path.join(SORTIE, `${nom}.dc.html`), html, 'utf8');
  return { file: `${nom}.dc.html`, w, h };
}

/* ── Planche d'arbitrage : les deux directions côte à côte ──────────────── */
function plancheArbitrage() {
  const colonne = (T, arguments_, reserve) => `
    <div style="flex:1;display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;align-items:flex-start;gap:14px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;
          border-radius:${T.cle === 'b' ? '4px' : '50%'};background:${T.encre};color:${T.accent};
          font-family:${T.mono};font-size:19px;font-weight:700">${T.cle.toUpperCase()}</span>
        <div style="flex:1">
          <div style="font-family:${T.titre};${T.titreStyle};font-size:25px;color:${T.texteFort}">${T.nom}</div>
          <div style="margin-top:3px;font-size:13px;color:${T.texteDoux}">${T.devise}</div>
        </div>
      </div>
      <div style="display:flex;gap:20px;align-items:flex-start">
        <div style="border:1px solid ${T.bordure};border-radius:${T.rayon}px;overflow:hidden;
          box-shadow:${T.ombreForte};flex:0 0 390px">${M.accueil(T, cfg)}</div>
        <div style="flex:1;display:flex;flex-direction:column;gap:13px">
          <div>
            <div style="font-family:${T.mono};font-size:9.5px;letter-spacing:${T.eyebrowEspace};
              text-transform:uppercase;color:${T.texteFaible}">Ce que ça apporte</div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:7px">
              ${arguments_.map((a) => `<div style="display:flex;gap:9px;align-items:flex-start">
                <span style="color:${T.succes};margin-top:2px">${ICONES.coche(14)}</span>
                <span style="flex:1;font-size:13px;line-height:1.5;color:${T.texteDoux}">${a}</span></div>`).join('')}
            </div>
          </div>
          <div style="padding:13px;background:${T.alerteFond};border-radius:${T.rayonPetit}px;
            border:1px solid ${T.alerte}2E">
            <div style="font-family:${T.mono};font-size:9.5px;letter-spacing:${T.eyebrowEspace};
              text-transform:uppercase;color:${T.alerte}">Sa contrepartie</div>
            <div style="margin-top:6px;font-size:12.5px;line-height:1.5;color:${T.texteDoux}">${reserve}</div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;padding-top:4px">
            ${[T.titre, T.texte].map((f) => `<span style="padding:4px 9px;border-radius:${T.rayonPastille}px;
              background:${T.fondAlt};border:1px solid ${T.bordure};font-family:${T.mono};font-size:10px;
              color:${T.texteDoux}">${f.split(',')[0].replace(/'/g, '')}</span>`).join('')}
            ${[T.encre, T.accent, T.alerte].map((c) => `<span style="width:22px;height:22px;border-radius:${T.cle === 'b' ? '3px' : '50%'};
              background:${c};border:1px solid ${T.bordureDouce}"></span>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

  const corps = `
    <div style="padding:38px 40px 44px;display:flex;flex-direction:column;gap:30px">
      <div style="padding-bottom:20px;border-bottom:3px solid ${A.encre}">
        ${eyebrow(A, 'Journée des métiers et de la mobilité · CADAM · 23 septembre 2026', A.accentTexte)}
        <div style="margin-top:8px">${titre(A, 'Deux directions à départager', 38)}</div>
        <div style="margin-top:9px;font-size:14.5px;line-height:1.6;color:${A.texteDoux};max-width:820px">
          Même contenu, même structure, mêmes écrans : seule la couche visuelle change. Les couleurs et
          les polices vivent dans un fichier de thème isolé, donc basculer de l'une à l'autre ne touche
          pas une ligne de code applicatif — y compris après la mise en ligne.</div>
      </div>
      <div style="display:flex;gap:44px;align-items:flex-start">
        ${colonne(A, [
          'Reprend à l\'identique la charte des maquettes déjà validées en interne : aucune discussion à rouvrir.',
          'Le couple Fraunces / Manrope donne un ton éditorial qui adoucit un sujet administratif.',
          'Les fonds sombres des quiz tranchent nettement avec le reste — le jeu se distingue de l\'information.',
        ], 'L\'ambre de la charte est inutilisable en texte sur fond clair (2,1:1). Il faut lui adjoindre une variante foncée, sinon l\'accent reste cantonné aux aplats.')}
        ${colonne(B, [
          'Part du blason départemental : encre, or héraldique, gueules en alerte seulement.',
          'Les angles francs et le grotesque de titrage évoquent la signalétique publique plutôt qu\'une application grand public.',
          'La palette tient hors de cette application : elle peut servir d\'autres supports de la DCIP.',
        ], 'C\'est une identité nouvelle : elle demande un accord explicite du service communication du Département avant d\'être exposée sur un stand.')}
      </div>
      <div style="padding:16px 18px;background:${A.glace};border-left:3px solid ${A.encre};
        border-radius:0 ${A.rayonPetit}px ${A.rayonPetit}px 0">
        <div style="font-size:13.5px;line-height:1.65;color:${A.encre}">
          <strong>Deux réserves qui valent pour les deux directions.</strong>
          Les intitulés des 10 phases du parcours sont des <strong>textes provisoires</strong> :
          le roll-up 60×160 cm n'a pas été fourni. Et le Design B a été construit à partir des couleurs
          héraldiques décrites, <strong>pas prélevées sur le logo officiel</strong>, qui manque encore —
          ses valeurs seront calées au pixel dès réception.</div>
      </div>
    </div>`;
  return artboard('Main', A, corps, { w: 1400, h: 1320 });
}

/* ── Génération ─────────────────────────────────────────────────────────── */
const artboards = [];
const pages = [
  { id: 'page-1', name: 'Arbitrage' },
  { id: 'page-2', name: 'Design A — Institutionnel' },
  { id: 'page-3', name: 'Design B — Signature' },
];

artboards.push({ ...plancheArbitrage(), x: 0, y: 0, page: 'page-1' });

const ECRANS_MOBILE = [
  ['Accueil',      (T) => M.accueil(T, cfg)],
  ['Parcours',     (T) => M.timeline(T)],
  ['Phase',        (T) => M.phase(T)],
  ['HubQuiz',      (T) => M.hubQuiz(T, quiz)],
  ['Question',     (T) => M.question(T, quiz[0])],
  ['Resultat',     (T) => M.resultat(T, quiz[0])],
  ['ListePostes',  (T) => M.listePostes(T, postes)],
  ['FichePoste',   (T) => M.fichePoste(T, postes[4])],
  ['Selection',    (T) => M.selection(T, postes)],
  ['Formulaire',   (T) => M.formulaire(T, cfg)],
  ['Confirmation', (T) => M.confirmation(T)],
];

const ECRANS_PC = [
  ['PcAccueil',   (T) => P.pcAccueil(T)],
  ['PcQuiz',      (T) => P.pcQuiz(T, quiz)],
  ['PcPostes',    (T) => P.pcPostes(T, postes)],
  ['PcSelection', (T) => P.pcSelection(T, postes, cfg)],
];

for (const [T, page] of [[A, 'page-2'], [B, 'page-3']]) {
  const S = T.cle.toUpperCase();

  // Rangée 1 : les deux planches de référence.
  artboards.push({ ...artboard(`Fondations${S}`, T, fondations(T), { w: 1180, h: 1560 }),
                   x: 0, y: 0, page });
  artboards.push({ ...artboard(`Composants${S}`, T, composants(T, postes, quiz), { w: 1180, h: 1560 }),
                   x: 1300, y: 0, page });

  // Rangée 2 : les 11 écrans mobile.
  ECRANS_MOBILE.forEach(([nom, rendu], i) => {
    artboards.push({ ...artboard(`${nom}${S}`, T, rendu(T), { w: 390, h: 844 }),
                     x: i * 470, y: 1740, page });
  });

  // Rangée 3 : les 4 écrans PC.
  ECRANS_PC.forEach(([nom, rendu], i) => {
    artboards.push({ ...artboard(`${nom}${S}`, T, rendu(T), { w: 1440, h: 900 }),
                     x: i * 1560, y: 2760, page });
  });
}

const annotations = [
  { id: 'note-arbitrage', page: 'page-1', x: 0, y: -110, w: 620,
    text: 'Point de départ : comparer les deux directions, puis ouvrir la page de celle qui vous parle.\nLes pages se changent depuis le menu de la barre d\'outils.' },
  { id: 'note-a-mobile', page: 'page-2', x: 0, y: 1620, w: 460,
    text: 'Les 11 écrans mobile, en 390 × 844 (iPhone 14/15). Barre d\'onglets basse, cibles de 48 px minimum, aucune barre d\'état factice : sur un vrai téléphone, la vraie se superpose.' },
  { id: 'note-a-pc', page: 'page-2', x: 0, y: 2640, w: 460,
    text: 'Au-delà de 1024 px, la barre d\'onglets devient une navigation haute et le contenu se borne à 1100 px.' },
  { id: 'note-b-mobile', page: 'page-3', x: 0, y: 1620, w: 460,
    text: 'Mêmes 11 écrans, même structure : seule la couche visuelle change. C\'est la démonstration que les deux thèmes sont interchangeables.' },
  { id: 'note-b-pc', page: 'page-3', x: 0, y: 2640, w: 460,
    text: 'Angles francs, or héraldique en accent, gueules réservé à l\'alerte. Les valeurs seront calées sur le logo officiel dès réception du fichier.' },
];

const canvas = {
  artboards: artboards.map(({ file, x, y, w, h, page }) => ({ file, x, y, w, h, page })),
  annotations,
  pages,
  launch: { view: 'canvas', page: 'page-1' },
};
fs.writeFileSync(path.join(SORTIE, 'canvas.json'), JSON.stringify(canvas, null, 2), 'utf8');

console.log(`${artboards.length} artboards générés dans ${SORTIE}`);
const total = artboards.reduce((s, a) =>
  s + fs.statSync(path.join(SORTIE, a.file)).size, 0);
console.log(`poids total : ${(total / 1024).toFixed(0)} ko`);
pages.forEach((p) => console.log(`  ${p.name} : ${artboards.filter((a) => a.page === p.id).length} artboards`));
