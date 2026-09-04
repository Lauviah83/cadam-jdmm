/* ==========================================================================
   mailer.js — Envoi de la fiche d'un poste au demandeur
   --------------------------------------------------------------------------
   Parcours reproduit de dcip_postes.html : le visiteur ouvre une fiche, clique
   « Je suis intéressé(e) — recevoir la fiche », renseigne ses coordonnées, et
   reçoit la fiche par courriel. Une fiche, une demande.

   Le courriel part AU DEMANDEUR, avec une COPIE à l'adresse de la DCIP
   (data/config.json → emails_copie). Un seul fournisseur : EmailJS, seul à
   savoir écrire à une adresse arbitraire — celle que le visiteur vient de
   saisir. L'adresse d'expédition est celle du service configuré dans EmailJS,
   jamais une boîte personnelle.

   PLAN B — sans clé configurée, le visiteur repart quand même avec la fiche :
   téléchargement du document et lien mailto: pré-rempli. Ce chemin fonctionne
   dès maintenant, avant que le compte EmailJS existe.

   RGPD : l'adresse et les coordonnées du visiteur transitent par EmailJS,
   dont l'hébergement peut se situer hors UE. Point à valider par le DPO du
   Département avant mise en production (voir docs/RGPD.md).
   ========================================================================== */

import { chargerConfig } from './offers.js';
import {
  empilerEnvoi, depilerEnvoi, fileEnvois, envoiAutorise, enregistrerEnvoi,
} from './store.js';

const SDK_EMAILJS = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

/** Délai minimum entre l'affichage du formulaire et sa soumission (anti-robot). */
export const DELAI_MINIMUM_MS = 3000;

/* =========================================================================
   1. Validation
   ========================================================================= */

/**
 * Validation d'adresse volontairement permissive : une expression trop
 * stricte rejette des adresses valides (apostrophes, sous-domaines). On
 * vérifie la forme, le serveur de courriel tranchera.
 */
export function adresseValide(adresse) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(adresse || '').trim());
}

/**
 * Contrôle le formulaire dans l'ordre où l'utilisateur lit ses champs.
 * Renvoie `null` si tout va bien, sinon `{ champ, message }` — le champ sert
 * à porter le focus et le marquage `aria-invalid` sur le bon élément.
 *
 * Prénom, nom et direction sont OBLIGATOIRES, comme dans le fichier source :
 * la DCIP doit savoir qui demande, et depuis quelle direction.
 */
export function verifierFormulaire({ prenom, nom, direction, email, consentement, piege, ouvertDepuisMs }) {
  if (piege) return { champ: null, message: 'ROBOT' };

  if (!String(prenom || '').trim()) return { champ: 'prenom', message: 'Merci d’indiquer votre prénom.' };
  if (!String(nom || '').trim()) return { champ: 'nom', message: 'Merci d’indiquer votre nom.' };
  if (!String(direction || '').trim()) {
    return { champ: 'direction', message: 'Merci d’indiquer votre direction actuelle.' };
  }
  if (!adresseValide(email)) {
    return { champ: 'email', message: 'Cette adresse électronique ne semble pas valide.' };
  }
  if (!consentement) {
    return { champ: 'rgpd', message: 'Merci d’accepter d’être recontacté(e) avant d’envoyer votre demande.' };
  }
  if (ouvertDepuisMs < DELAI_MINIMUM_MS) {
    return { champ: null, message: 'Merci de patienter un instant avant de valider.' };
  }

  const quota = envoiAutorise();
  if (!quota.autorise) {
    return {
      champ: null,
      message: `Vous avez déjà envoyé 3 demandes depuis ce navigateur. `
             + `Réessayez dans ${quota.minutes_attente} minutes.`,
    };
  }
  return null;
}

/* =========================================================================
   2. Mise en forme de la fiche
   ========================================================================= */

function echapper(texte) {
  return String(texte ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Ce qu'il faut écrire à la place d'une date : l'état réel de l'annonce. */
function etatCandidature(poste) {
  const s = poste.statut || {};
  if (s.expiree) return `${s.libelle || 'Annonce close'} — fiche transmise pour information`;
  return s.libelle || poste.deadline_label || 'Voir la fiche officielle';
}

/** Version texte de la fiche — c'est elle qui part dans le lien mailto. */
export function ficheTexte(poste, contact, config = {}) {
  const ev = config.evenement || {};
  return [
    `${poste.titre}`,
    `Service ${poste.service} — ${ev.organisateur || 'DCIP, Département des Alpes-Maritimes'}`,
    '',
    `Catégorie ${poste.cat || '—'} · ${poste.filiere || ''} · ${poste.lieu || ''}`,
    `Candidature : ${etatCandidature(poste)}`,
    '',
    'LE POSTE',
    poste.desc || '',
    '',
    'MISSIONS PRINCIPALES',
    ...(poste.missions || []).map((m) => `  • ${m}`),
    '',
    'PROFIL RECHERCHÉ',
    ...(poste.profils || []).map((m) => `  • ${m}`),
    '',
    `Fiche officielle et candidature en ligne : ${poste.url}`,
    '',
    '— Demande transmise depuis le stand de la DCIP',
    ev.nom ? `  ${ev.nom}${ev.lieu ? `, ${ev.lieu}` : ''}${ev.date ? ` — ${ev.date}` : ''}` : '',
    contact && contact.prenom ? `  Par ${contact.prenom} ${contact.nom || ''} (${contact.direction || ''})` : '',
  ].filter((l) => l !== null && l !== undefined).join('\n');
}

/**
 * Version HTML de la fiche, pour le courriel et le téléchargement.
 *
 * Contraintes de compatibilité assumées : tableaux, largeur 600 px, styles en
 * ligne, aucune webfont, aucune image de fond. Outlook ne sait pas faire
 * mieux, et ce courriel doit s'afficher chez tout le monde.
 *
 * `options.fragment` renvoie le corps seul : EmailJS insère la valeur DANS son
 * propre gabarit, où un document complet serait imbriqué — donc invalide.
 */
export function ficheHTML(poste, contact, config = {}, options = {}) {
  const ev = config.evenement || {};
  const NAVY = '#042C53';
  const AMBRE = '#EF9F27';
  const s = poste.statut || {};

  const liste = (titre, items) => (items || []).length ? `
    <tr><td style="padding:0 24px 4px;">
      <p style="margin:18px 0 8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#616D82;">
        ${echapper(titre)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${items.map((m) => `<tr>
          <td width="16" valign="top" style="padding:3px 0 3px 0;color:${AMBRE};font-size:13px;">&bull;</td>
          <td style="padding:3px 0;font-size:13.5px;line-height:1.55;color:#455465;">${echapper(m)}</td>
        </tr>`).join('')}
      </table>
    </td></tr>` : '';

  const corps = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4EF;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0"
         style="width:600px;max-width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;
                font-family:Arial,Helvetica,sans-serif;">

    <tr><td style="background:${NAVY};padding:24px;border-bottom:4px solid ${AMBRE};">
      <p style="margin:0;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${AMBRE};">
        Service ${echapper(poste.service)}
      </p>
      <p style="margin:8px 0 0;font-size:21px;font-weight:700;color:#FFFFFF;line-height:1.25;">
        ${echapper(poste.titre)}
      </p>
      <p style="margin:10px 0 0;font-size:12.5px;color:#B5D4F4;">
        Catégorie ${echapper(poste.cat || '—')}
        ${poste.filiere ? ` &middot; ${echapper(poste.filiere)}` : ''}
        ${poste.lieu ? ` &middot; ${echapper(poste.lieu)}` : ''}
      </p>
    </td></tr>

    <tr><td style="padding:20px 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:${s.expiree ? '#FAECE7' : '#E6F1FB'};border-radius:8px;">
        <tr><td style="padding:11px 14px;font-size:13px;color:${s.expiree ? '#993C1D' : NAVY};">
          <strong>${echapper(etatCandidature(poste))}</strong>
        </td></tr>
      </table>
    </td></tr>

    ${poste.desc ? `<tr><td style="padding:18px 24px 0;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#455465;">${echapper(poste.desc)}</p>
    </td></tr>` : ''}

    ${liste('Missions principales', poste.missions)}
    ${liste('Profil recherché', poste.profils)}

    <tr><td style="padding:22px 24px;">
      <a href="${echapper(poste.url)}"
         style="display:inline-block;padding:12px 20px;background:${NAVY};color:#FFFFFF;
                text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
        Postuler en ligne sur departement06.fr
      </a>
    </td></tr>

    <tr><td style="padding:0 24px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#F6F4EF;border-radius:8px;">
        <tr><td style="padding:14px 16px;font-size:12.5px;line-height:1.6;color:#455465;">
          <strong style="color:${NAVY};">Votre demande</strong><br>
          ${echapper(contact.prenom || '')} ${echapper(contact.nom || '')}
          ${contact.direction ? `&mdash; ${echapper(contact.direction)}` : ''}<br>
          ${contact.projet ? `Projet de mobilité : ${echapper(contact.projet)}<br>` : ''}
          ${contact.message ? `Message : ${echapper(contact.message)}` : ''}
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:16px 24px;background:#F6F4EF;border-top:1px solid #D9DFE7;">
      <p style="margin:0;font-size:11px;color:#616D82;line-height:1.6;">
        Fiche transmise à votre demande depuis le stand de la
        ${echapper(ev.organisateur || 'DCIP')}${ev.nom ? `, ${echapper(ev.nom)}` : ''}${ev.date ? ` du ${echapper(ev.date)}` : ''}.
        Vos coordonnées sont conservées ${(config.rgpd || {}).duree_conservation_mois || 12} mois
        puis supprimées. Pour exercer vos droits :
        ${echapper((config.rgpd || {}).contact_dpo || 'contactez le DPO du Département')}.
        ${options.horodatage ? `<br>Établi le ${echapper(options.horodatage)}.` : ''}
      </p>
    </td></tr>

  </table>
</td></tr></table>`;

  if (options.fragment) return corps;

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${echapper(poste.titre)}</title></head>
<body style="margin:0;padding:0;background:#F6F4EF;">
${corps}
</body></html>`;
}

/* =========================================================================
   3. EmailJS
   ========================================================================= */

let promesseSdk = null;

/**
 * Charge le SDK à la demande, au moment de l'envoi seulement : sur un budget
 * de chargement initial serré, ce script n'a rien à faire dans l'app shell.
 */
function chargerSdk() {
  if (window.emailjs) return Promise.resolve(window.emailjs);
  if (promesseSdk) return promesseSdk;

  promesseSdk = new Promise((resoudre, rejeter) => {
    const balise = document.createElement('script');
    balise.src = SDK_EMAILJS;
    balise.async = true;
    balise.onload = () => (window.emailjs ? resoudre(window.emailjs) : rejeter(new Error('SDK absent')));
    balise.onerror = () => rejeter(new Error('SDK EmailJS inaccessible'));
    document.head.appendChild(balise);
  });
  return promesseSdk;
}

function reglagesComplets(config) {
  const r = config.emailjs || {};
  return Boolean(r.public_key && r.service_id && r.template_fiche);
}

async function envoyerParEmailJS({ poste, contact, config }) {
  if (!reglagesComplets(config)) return { ok: false, motif: 'non-configure' };

  const r = config.emailjs;
  // Les adresses en copie sont fixées dans config.json, jamais saisies par le
  // visiteur : sinon le formulaire deviendrait un relais d'envoi ouvert.
  const copie = (config.emails_copie || []).join(',');

  try {
    const sdk = await chargerSdk();
    sdk.init({ publicKey: r.public_key });
    await sdk.send(r.service_id, r.template_fiche, {
      // Destinataire : le visiteur qui vient de saisir son adresse.
      to_email: contact.email,
      to_name: `${contact.prenom} ${contact.nom}`.trim(),
      // Copie à la DCIP — le gabarit EmailJS place cette variable dans son champ Cc.
      copie_email: copie,
      prenom: contact.prenom,
      nom: contact.nom,
      direction: contact.direction,
      projet: contact.projet || 'Non précisé',
      message: contact.message || '—',
      poste_titre: poste.titre,
      poste_service: poste.service,
      poste_url: poste.url,
      poste_statut: etatCandidature(poste),
      fiche_texte: ficheTexte(poste, contact, config),
      // Fragment, pas un document : EmailJS l'insère dans son propre gabarit.
      fiche_html: ficheHTML(poste, contact, config, {
        horodatage: new Date().toLocaleString('fr-FR'), fragment: true,
      }),
      horodatage: new Date().toLocaleString('fr-FR'),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, motif: 'echec-envoi', erreur: err?.text || err?.message || String(err) };
  }
}

/* =========================================================================
   4. Plan B — sans clé, le visiteur repart quand même avec la fiche
   ========================================================================= */

/** Lien mailto pré-rempli, adressé au visiteur lui-même. */
export function lienMailto(poste, contact, config = {}) {
  const objet = `${poste.titre} — fiche de poste DCIP`;
  // Les mailto très longs sont tronqués par certains clients : on borne.
  const corps = ficheTexte(poste, contact, config).slice(0, 1800);
  return `mailto:${encodeURIComponent(contact.email || '')}`
       + `?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`;
}

/** Déclenche le téléchargement de la fiche en HTML autonome, imprimable en PDF. */
export function telechargerFiche(poste, contact, config = {}) {
  const html = ficheHTML(poste, contact, config, {
    horodatage: new Date().toLocaleString('fr-FR'),
  });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `fiche-${(poste.id || 'poste').slice(0, 60)}.html`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  // Libération différée : Safari annule le téléchargement si on révoque trop tôt.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Ouvre la fiche dans une fenêtre prête à imprimer ou enregistrer en PDF. */
export function imprimerFiche(poste, contact, config = {}) {
  const fenetre = window.open('', '_blank');
  if (!fenetre) return false;      // bloqueur de fenêtres : le téléchargement reste proposé
  fenetre.document.write(ficheHTML(poste, contact, config, {
    horodatage: new Date().toLocaleString('fr-FR'),
  }));
  fenetre.document.close();
  fenetre.focus();
  setTimeout(() => fenetre.print(), 400);
  return true;
}

/* =========================================================================
   5. Orchestration
   ========================================================================= */

/**
 * Envoie la fiche d'un poste au demandeur.
 *
 * Le résultat est détaillé à dessein : l'écran de confirmation doit dire ce
 * qui est réellement parti, et rien d'autre.
 */
export async function envoyerFiche({ poste, contact }) {
  const config = await chargerConfig();

  if (!reglagesComplets(config)) {
    // Ce n'est pas une panne : c'est l'état normal avant que les clés existent.
    return {
      ok: false, planB: true, misEnFile: false,
      message: 'L’envoi automatique n’est pas encore activé sur ce stand. '
             + 'Téléchargez la fiche ou envoyez-la-vous depuis votre messagerie.',
    };
  }

  const resultat = await envoyerParEmailJS({ poste, contact, config });

  if (!resultat.ok) {
    // Panne réelle : on met en file pour rejouer au retour du réseau.
    empilerEnvoi({ poste, contact });
    return {
      ok: false, planB: true, misEnFile: true,
      message: 'Votre demande sera envoyée dès le retour du réseau. '
             + 'Vous pouvez aussi télécharger la fiche dès maintenant.',
      erreur: resultat.erreur,
    };
  }

  enregistrerEnvoi();
  const copie = (config.emails_copie || []).length;
  return {
    ok: true, planB: false, misEnFile: false,
    message: `La fiche part à ${contact.email}. Pensez à vérifier vos indésirables.`
           + (copie ? ' La DCIP en reçoit une copie et vous recontactera.' : ''),
  };
}

/* =========================================================================
   6. Rejeu de la file au retour du réseau
   ========================================================================= */

let rejeuEnCours = false;

/**
 * Tente de renvoyer les demandes en attente. Une demande qui échoue de
 * nouveau reste en file : on ne perd jamais une demande de visiteur.
 */
export async function rejouerFile() {
  if (rejeuEnCours || !navigator.onLine) {
    return { rejouees: 0, restantes: fileEnvois().length };
  }
  rejeuEnCours = true;
  const config = await chargerConfig();
  let rejouees = 0;

  try {
    if (!reglagesComplets(config)) return { rejouees: 0, restantes: fileEnvois().length };
    for (const demande of fileEnvois()) {
      const r = await envoyerParEmailJS({
        poste: demande.poste, contact: demande.contact, config,
      });
      if (r.ok) { depilerEnvoi(demande.id_file); rejouees += 1; }
      else break;      // inutile d'insister sur les suivantes
    }
  } finally {
    rejeuEnCours = false;
  }
  return { rejouees, restantes: fileEnvois().length };
}

/** Branche le rejeu automatique. À appeler une fois, au démarrage. */
export function activerRejeuAutomatique(surRejeu) {
  const tenter = async () => {
    const bilan = await rejouerFile();
    if (bilan.rejouees > 0 && typeof surRejeu === 'function') surRejeu(bilan);
  };
  window.addEventListener('online', tenter);
  if (navigator.onLine && fileEnvois().length > 0) tenter();
}
