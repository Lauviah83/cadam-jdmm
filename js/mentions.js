/* ==========================================================================
   mentions.js — Rend un document Markdown de docs/ dans une page
   --------------------------------------------------------------------------
   Les mentions légales, la politique de données et la déclaration
   d'accessibilité vivent en Markdown dans docs/ : c'est là qu'on les met à
   jour, et c'est ce que lit la personne qui reprend le projet.

   Plutôt que d'en tenir une seconde version en HTML — deux versions finissent
   toujours par diverger — la page les affiche directement. Le rendu couvre
   ce que ces documents utilisent : titres, listes, tableaux, gras, code,
   liens, citations, règles. Rien de plus : ce n'est pas une bibliothèque
   Markdown, c'est le strict nécessaire pour trois documents connus.
   ========================================================================== */

const DOCUMENTS = {
  rgpd: { fichier: 'docs/RGPD.md', titre: 'Protection des données personnelles' },
  accessibilite: { fichier: 'docs/ACCESSIBILITE.md', titre: "Déclaration d'accessibilité" },
  exploitation: { fichier: 'docs/EXPLOITATION.md', titre: "Guide d'exploitation" },
};

const echapper = (t) => String(t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Mise en forme à l'intérieur d'une ligne. */
function enLigne(texte) {
  return echapper(texte)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, libelle, cible) => {
      const externe = /^https?:/.test(cible);
      // Un .md pointé depuis une page de mentions reste dans la visionneuse.
      const href = cible.startsWith('docs/') && cible.endsWith('.md')
        ? `?doc=${cible.replace('docs/', '').replace('.md', '').toLowerCase()}`
        : cible;
      return `<a href="${href}"${externe ? ' target="_blank" rel="noopener"' : ''}>${libelle}${
        externe ? ' <span class="lecteur-seul">(nouvelle fenêtre)</span>' : ''}</a>`;
    });
}

function rendre(markdown) {
  const lignes = markdown.split('\n');
  const sortie = [];
  let dansListe = false;
  let dansTableau = false;
  // En Markdown, un paragraphe est un BLOC de lignes, terminé par une ligne
  // vide — pas une ligne. Les traiter une par une coupait chaque phrase à
  // l'endroit où l'auteur avait replié son texte à 95 colonnes.
  let paragraphe = [];
  let citation = [];

  const fermerListe = () => { if (dansListe) { sortie.push('</ul>'); dansListe = false; } };
  const fermerTableau = () => { if (dansTableau) { sortie.push('</tbody></table></div>'); dansTableau = false; } };
  const fermerParagraphe = () => {
    if (paragraphe.length) { sortie.push(`<p>${enLigne(paragraphe.join(' '))}</p>`); paragraphe = []; }
  };
  const fermerCitation = () => {
    if (citation.length) { sortie.push(`<blockquote>${enLigne(citation.join(' '))}</blockquote>`); citation = []; }
  };
  const toutFermer = () => { fermerParagraphe(); fermerCitation(); fermerListe(); fermerTableau(); };

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    const nu = ligne.trim();

    if (!nu) { toutFermer(); continue; }

    // Séparateur d'un tableau : on l'a déjà traité avec l'en-tête.
    if (/^\|[\s:|-]+\|$/.test(nu)) continue;

    if (nu.startsWith('|')) {
      fermerParagraphe(); fermerCitation();
      const cellules = nu.split('|').slice(1, -1).map((c) => enLigne(c.trim()));
      if (!dansTableau) {
        fermerListe();
        // Un tableau large doit défiler dans son propre cadre, pas emporter la page.
        sortie.push('<div class="tableau-defilant"><table><thead><tr>'
          + cellules.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>');
        dansTableau = true;
      } else {
        sortie.push('<tr>' + cellules.map((c) => `<td>${c}</td>`).join('') + '</tr>');
      }
      continue;
    }
    fermerTableau();

    const titre = nu.match(/^(#{1,4})\s+(.*)$/);
    if (titre) {
      fermerParagraphe(); fermerCitation(); fermerListe();
      const n = Math.min(titre[1].length + 1, 4);   // le h1 est celui de la page
      sortie.push(`<h${n}>${enLigne(titre[2])}</h${n}>`);
      continue;
    }

    if (/^[-*]\s+/.test(nu)) {
      fermerParagraphe(); fermerCitation();
      if (!dansListe) { sortie.push('<ul class="liste-doc">'); dansListe = true; }
      sortie.push(`<li>${enLigne(nu.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }
    fermerListe();

    if (nu.startsWith('>')) {
      fermerParagraphe();
      citation.push(nu.replace(/^>\s?/, ''));
      continue;
    }
    fermerCitation();

    if (/^-{3,}$/.test(nu)) { fermerParagraphe(); sortie.push('<hr>'); continue; }

    paragraphe.push(nu);
  }
  toutFermer();
  return sortie.join('\n');
}

async function afficher() {
  const cle = new URLSearchParams(window.location.search).get('doc') || 'rgpd';
  const doc = DOCUMENTS[cle] || DOCUMENTS.rgpd;
  const corps = document.getElementById('document');

  document.title = `${doc.titre} — Métiers & Mobilité DCIP`;
  document.getElementById('titre-document').textContent = doc.titre;

  try {
    const reponse = await fetch(`./${doc.fichier}`, { cache: 'no-cache' });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    const markdown = await reponse.text();
    // Le premier titre de niveau 1 fait doublon avec celui de la page.
    corps.innerHTML = rendre(markdown.replace(/^#\s+.*\n/, ''));
  } catch (err) {
    corps.innerHTML = `<div class="bandeau bandeau--alerte">
      <span>Ce document n'a pas pu être chargé. Il reste consultable dans le dépôt du projet,
      fichier <code>${doc.fichier}</code>.</span></div>`;
  }
}

afficher();
