/* ==========================================================================
   mailer.js — Envoi du récapitulatif d'offres
   --------------------------------------------------------------------------
   RAPPEL DU PROBLÈME (§7) : un site statique ne peut pas envoyer de courriel
   lui-même. Il délègue à un service tiers. Or les deux services envisagés ne
   couvrent pas le même besoin :

     • Web3Forms  → envoie vers UNE boîte fixée sur le compte.
                    Parfait pour la NOTIFICATION INTERNE à la DCIP.
                    L'accusé au visiteur (autoresponder) est payant.
     • EmailJS    → envoie vers une adresse ARBITRAIRE, donc au VISITEUR.
                    Gratuit jusqu'à ~200 envois/mois, largement suffisant
                    pour une journée de stand.

   D'où l'ordre retenu, configurable dans data/config.json :
     1. Web3Forms — BLOQUANT. C'est lui qui garantit que la demande est
        enregistrée côté DCIP. S'il échoue, la demande est mise en file.
     2. EmailJS — NON BLOQUANT. Si l'accusé au visiteur échoue, la demande
        interne est déjà partie : l'écran de confirmation le dit honnêtement
        (« la DCIP vous recontacte ») plutôt que d'annoncer un envoi qui
        n'a pas eu lieu.

   PLAN B — sans aucune clé configurée, le visiteur repart quand même avec
   ses offres : récapitulatif téléchargeable et lien mailto pré-rempli.
   Ce chemin est fonctionnel dès le premier commit, avant que les clés existent.

   RGPD : l'adresse du visiteur transite par ces services tiers, hébergés hors
   UE selon les cas. Ce point doit être validé par le DPO du Département avant
   mise en production (voir docs/RGPD.md et docs/EXPLOITATION.md).
   ========================================================================== */

import { chargerConfig } from './offers.js';
import {
  empilerEnvoi, depilerEnvoi, fileEnvois,
  envoiAutorise, enregistrerEnvoi,
} from './store.js';

const URL_WEB3FORMS = 'https://api.web3forms.com/submit';
const SDK_EMAILJS   = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

/** Délai minimum entre l'affichage du formulaire et sa soumission (anti-robot). */
export const DELAI_MINIMUM_MS = 3000;

/* =========================================================================
   1. Validation d'entrée
   ========================================================================= */

/**
 * Validation d'adresse volontairement permissive.
 * Une expression rationnelle stricte rejette des adresses valides (apostrophes,
 * domaines longs, sous-domaines). On vérifie la forme générale, le serveur
 * de courriel tranchera.
 */
export function adresseValide(adresse) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(adresse || '').trim());
}

/**
 * Contrôles anti-abus (§7), dans l'ordre où ils doivent être présentés
 * à l'utilisateur. Renvoie null si tout va bien, sinon un message en français.
 */
export function verifierSoumission({ email, piege, ouvertDepuisMs }) {
  if (piege) return 'ROBOT';                       // champ honeypot rempli : silence radio
  if (!adresseValide(email)) return "Cette adresse électronique ne semble pas valide.";
  if (ouvertDepuisMs < DELAI_MINIMUM_MS) {
    return 'Merci de patienter un instant avant de valider.';
  }
  const quota = envoiAutorise();
  if (!quota.autorise) {
    return `Vous avez déjà envoyé 3 récapitulatifs depuis ce navigateur. `
         + `Réessayez dans ${quota.minutes_attente} minutes.`;
  }
  return null;
}

/* =========================================================================
   2. Mise en forme du récapitulatif
   ========================================================================= */

function echapper(texte) {
  return String(texte ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Ce qu'il faut écrire à la place d'une date : l'état réel de l'annonce. */
function etatCandidature(offre) {
  if (offre.statut_expiree) return `${offre.statut_libelle || 'Annonce close'} — retenue pour information`;
  return offre.deadline_label || offre.statut_libelle || 'voir la fiche officielle';
}

function ligneOffreTexte(offre, index) {
  const morceaux = [
    `${index + 1}. ${offre.titre}`,
    offre.service ? `   Service : ${offre.service}` : (offre.domaine ? `   Domaine : ${offre.domaine}` : ''),
    (offre.categorie || offre.filiere)
      ? `   Catégorie ${offre.categorie || '—'} · Filière ${offre.filiere || '—'}` : '',
    offre.lieu ? `   Lieu : ${offre.lieu}` : '',
    `   Candidature : ${etatCandidature(offre)}`,
    `   Fiche officielle : ${offre.url}`,
  ];
  return morceaux.filter(Boolean).join('\n');
}

/** Version texte du récapitulatif — c'est elle qui part dans le mailto et en repli. */
export function recapitulatifTexte(offres, config = {}) {
  const evenement = config.evenement || {};
  return [
    `Récapitulatif de mes offres — ${evenement.nom || 'Journée des Métiers et de la Mobilité'}`,
    `${evenement.organisateur || 'DCIP — Département des Alpes-Maritimes'}`,
    '',
    `${offres.length} offre${offres.length > 1 ? 's' : ''} sélectionnée${offres.length > 1 ? 's' : ''} :`,
    '',
    offres.map(ligneOffreTexte).join('\n\n'),
    '',
    '— Pour postuler, utilisez le lien « Fiche officielle » de chaque offre',
    '  et suivez la procédure indiquée sur le site du Département.',
    `— Contact : ${(config.emails_internes || [])[0] || 'DCIP'}`,
  ].join('\n');
}

/**
 * Version HTML du récapitulatif, pour le courriel et pour le téléchargement.
 * Contraintes de compatibilité courriel assumées (§7) : tableaux, largeur
 * 600 px, styles en ligne, aucune webfont, aucune image de fond. Outlook ne
 * sait pas faire mieux, et ce mail doit s'afficher chez tout le monde.
 */
export function recapitulatifHTML(offres, config = {}, options = {}) {
  const evenement = config.evenement || {};
  const NAVY = '#042C53';
  const AMBRE = '#EF9F27';

  const cartes = offres.map((offre) => `
    <tr>
      <td style="padding:0 0 12px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #D9DFE7;border-radius:8px;border-collapse:separate;">
          <tr><td style="padding:16px;">
            <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#616D82;">
              ${echapper(offre.service || offre.domaine || 'Département des Alpes-Maritimes')}
            </p>
            <p style="margin:0 0 10px 0;font-size:17px;font-weight:700;color:${NAVY};line-height:1.3;">
              ${echapper(offre.titre)}
            </p>
            <p style="margin:0 0 12px 0;font-size:13px;color:#455465;line-height:1.6;">
              ${offre.categorie ? `Catégorie ${echapper(offre.categorie)}` : ''}
              ${offre.filiere ? ` &middot; Filière ${echapper(offre.filiere)}` : ''}
              ${offre.lieu ? `<br>Lieu : ${echapper(offre.lieu)}` : ''}
              <br><strong style="color:${offre.statut_expiree ? '#993C1D' : NAVY}">${echapper(etatCandidature(offre))}</strong>
            </p>
            <a href="${echapper(offre.url)}"
               style="display:inline-block;padding:9px 16px;background:${NAVY};color:#FFFFFF;
                      text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
              Consulter la fiche officielle
            </a>
          </td></tr>
        </table>
      </td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mes offres — ${echapper(evenement.nom || 'JDMM')}</title></head>
<body style="margin:0;padding:0;background:#F6F4EF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4EF;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0"
         style="width:600px;max-width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;
                font-family:Arial,Helvetica,sans-serif;">

    <tr><td style="background:${NAVY};padding:24px;border-bottom:4px solid ${AMBRE};">
      <p style="margin:0;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${AMBRE};">
        Département des Alpes-Maritimes
      </p>
      <p style="margin:6px 0 0 0;font-size:21px;font-weight:700;color:#FFFFFF;line-height:1.25;">
        Vos offres sélectionnées
      </p>
      <p style="margin:6px 0 0 0;font-size:13px;color:#B5D4F4;">
        ${echapper(evenement.nom || '')}${evenement.lieu ? ` &middot; ${echapper(evenement.lieu)}` : ''}
      </p>
    </td></tr>

    <tr><td style="padding:24px;">
      <p style="margin:0 0 18px 0;font-size:14px;color:#455465;line-height:1.6;">
        Voici le récapitulatif des ${offres.length} offre${offres.length > 1 ? 's' : ''}
        que vous avez retenue${offres.length > 1 ? 's' : ''} sur le stand de la
        ${echapper(evenement.organisateur || 'DCIP')}.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cartes}</table>
    </td></tr>

    <tr><td style="padding:0 24px 24px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#E6F1FB;border-radius:8px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:${NAVY};">Comment postuler</p>
          <p style="margin:0;font-size:13px;color:#455465;line-height:1.6;">
            Ouvrez la fiche de l'offre qui vous intéresse, puis utilisez le bouton
            « Postuler en ligne » du site du Département. Vérifiez la date limite :
            elle est propre à chaque offre.<br>
            Une question sur un poste de la DCIP ?
            <a href="mailto:${echapper((config.emails_internes || [])[0] || '')}"
               style="color:#185FA5;">${echapper((config.emails_internes || [])[0] || '')}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:16px 24px;background:#F6F4EF;border-top:1px solid #D9DFE7;">
      <p style="margin:0;font-size:11px;color:#616D82;line-height:1.6;">
        Ce message vous est adressé parce que vous avez demandé ce récapitulatif sur le stand
        de la ${echapper(evenement.organisateur || 'DCIP')}. Votre adresse est conservée
        ${(config.rgpd || {}).duree_conservation_mois || 12} mois puis supprimée.
        Pour exercer vos droits : ${echapper((config.rgpd || {}).contact_dpo || 'contactez le DPO du Département')}.
        ${options.horodatage ? `<br>Établi le ${echapper(options.horodatage)}.` : ''}
      </p>
    </td></tr>

  </table>
</td></tr></table>
</body></html>`;
}

/* =========================================================================
   3. Fournisseur 1 — Web3Forms (notification interne, bloquant)
   ========================================================================= */

async function envoyerWeb3Forms({ email, offres, contact, config }) {
  const cle = (config.web3forms || {}).access_key;
  if (!cle || cle === 'À_RENSEIGNER') {
    return { ok: false, motif: 'non-configure' };
  }

  const corps = {
    access_key: cle,
    subject: `[JDMM] ${offres.length} offre(s) demandée(s) par ${email}`,
    from_name: 'Stand DCIP — Journée des Métiers et de la Mobilité',
    // Web3Forms rejette l'envoi si ce champ est rempli : deuxième filet anti-robot.
    botcheck: '',
    email_visiteur: email,
    prenom: contact.prenom || '(non renseigné)',
    nom: contact.nom || '(non renseigné)',
    direction: contact.direction || '(non renseignée)',
    message_visiteur: contact.message || '(aucun)',
    horodatage: new Date().toLocaleString('fr-FR'),
    nombre_offres: offres.length,
    offres: recapitulatifTexte(offres, config),
  };

  try {
    const reponse = await fetch(URL_WEB3FORMS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(corps),
    });
    const donnees = await reponse.json().catch(() => ({}));
    if (reponse.ok && donnees.success) return { ok: true };
    return { ok: false, motif: donnees.message || `HTTP ${reponse.status}` };
  } catch (err) {
    return { ok: false, motif: 'reseau', erreur: err.message };
  }
}

/* =========================================================================
   4. Fournisseur 2 — EmailJS (accusé au visiteur, non bloquant)
   ========================================================================= */

let promesseSdkEmailJS = null;

/**
 * Charge le SDK EmailJS à la demande — uniquement au moment de l'envoi (§9 :
 * aucune dépendance CDN chargée au démarrage). Sur le budget de 150 ko de
 * chargement initial, ce SDK n'a rien à faire dans l'app shell.
 */
function chargerSdkEmailJS() {
  if (window.emailjs) return Promise.resolve(window.emailjs);
  if (promesseSdkEmailJS) return promesseSdkEmailJS;

  promesseSdkEmailJS = new Promise((resoudre, rejeter) => {
    const balise = document.createElement('script');
    balise.src = SDK_EMAILJS;
    balise.async = true;
    balise.onload = () => (window.emailjs ? resoudre(window.emailjs) : rejeter(new Error('SDK absent')));
    balise.onerror = () => rejeter(new Error('SDK EmailJS inaccessible'));
    document.head.appendChild(balise);
  });
  return promesseSdkEmailJS;
}

async function envoyerEmailJS({ email, offres, contact, config }) {
  const reglages = config.emailjs || {};
  if (!reglages.public_key || !reglages.service_id || !reglages.template_candidat) {
    return { ok: false, motif: 'non-configure' };
  }

  try {
    const sdk = await chargerSdkEmailJS();
    sdk.init({ publicKey: reglages.public_key });
    await sdk.send(reglages.service_id, reglages.template_candidat, {
      to_email: email,
      to_name: contact.prenom || 'Bonjour',
      nombre_offres: offres.length,
      offres_texte: recapitulatifTexte(offres, config),
      offres_html: recapitulatifHTML(offres, config, {
        horodatage: new Date().toLocaleString('fr-FR'),
      }),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, motif: 'echec-envoi', erreur: err?.text || err?.message || String(err) };
  }
}

/* =========================================================================
   5. Plan B — sans aucune clé, le visiteur repart quand même avec ses offres
   ========================================================================= */

/** Lien mailto pré-rempli, adressé au visiteur lui-même. */
export function lienMailto(email, offres, config = {}) {
  const objet = `Mes offres — ${(config.evenement || {}).nom || 'JDMM'}`;
  // Les mailto très longs sont tronqués par certains clients : on borne le corps.
  const corps = recapitulatifTexte(offres, config).slice(0, 1800);
  return `mailto:${encodeURIComponent(email || '')}`
       + `?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`;
}

/**
 * Déclenche le téléchargement du récapitulatif en HTML autonome.
 * Le fichier s'ouvre dans n'importe quel navigateur et s'imprime en PDF
 * (Fichier → Imprimer → Enregistrer au format PDF) : c'est le seul chemin
 * vers un PDF sans embarquer de bibliothèque, ce que le §9 interdit.
 */
export function telechargerRecapitulatif(offres, config = {}) {
  const html = recapitulatifHTML(offres, config, {
    horodatage: new Date().toLocaleString('fr-FR'),
  });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `mes-offres-dcip-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  // Libération différée : Safari annule le téléchargement si on révoque trop tôt.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Ouvre le récapitulatif dans une fenêtre prête à imprimer / enregistrer en PDF. */
export function imprimerRecapitulatif(offres, config = {}) {
  const fenetre = window.open('', '_blank');
  if (!fenetre) return false;   // bloqueur de fenêtres : la vue proposera le téléchargement
  fenetre.document.write(recapitulatifHTML(offres, config, {
    horodatage: new Date().toLocaleString('fr-FR'),
  }));
  fenetre.document.close();
  fenetre.focus();
  setTimeout(() => fenetre.print(), 400);
  return true;
}

/* =========================================================================
   6. Orchestration
   ========================================================================= */

/**
 * Envoie une demande.
 *
 * @param {{to:string, offers:Array, contact:Object}} demande
 * @returns {Promise<{ok:boolean, provider:string, interne:Object, candidat:Object,
 *                    planB:boolean, misEnFile:boolean, message:string}>}
 *
 * Le résultat est délibérément détaillé : l'écran de confirmation doit dire
 * la vérité sur ce qui est effectivement parti, et rien d'autre.
 */
export async function envoyer({ to, offers, contact = {} }) {
  const config = await chargerConfig();
  const offres = Array.isArray(offers) ? offers : [];

  const interne  = await envoyerWeb3Forms({ email: to, offres, contact, config });
  const candidat = await envoyerEmailJS({ email: to, offres, contact, config });

  // Aucun fournisseur configuré : ce n'est pas une panne, c'est l'état normal
  // avant que les clés existent. On bascule sur le plan B sans crier au loup.
  if (interne.motif === 'non-configure' && candidat.motif === 'non-configure') {
    return {
      ok: false, provider: 'plan-b', interne, candidat,
      planB: true, misEnFile: false,
      message: "L'envoi automatique n'est pas encore activé. "
             + 'Téléchargez votre récapitulatif ou envoyez-le-vous par courriel.',
    };
  }

  // La notification interne a échoué alors qu'elle est configurée : panne réelle.
  // On met en file pour rejouer au retour du réseau, et on le dit.
  if (!interne.ok && interne.motif !== 'non-configure') {
    empilerEnvoi({ to, offers: offres, contact });
    return {
      ok: false, provider: 'web3forms', interne, candidat,
      planB: true, misEnFile: true,
      message: 'Votre demande sera envoyée dès le retour du réseau. '
             + 'Vous pouvez aussi télécharger votre récapitulatif dès maintenant.',
    };
  }

  enregistrerEnvoi();

  if (candidat.ok) {
    return {
      ok: true, provider: 'web3forms+emailjs', interne, candidat,
      planB: false, misEnFile: false,
      message: `Récapitulatif envoyé à ${to}. Pensez à vérifier vos indésirables.`,
    };
  }

  // Cas fréquent et assumé : la DCIP est prévenue, mais le visiteur n'a pas
  // reçu de courriel. On ne prétend pas le contraire.
  return {
    ok: true, provider: 'web3forms', interne, candidat,
    planB: true, misEnFile: false,
    message: 'Votre demande est bien enregistrée : la DCIP vous recontacte. '
           + "L'accusé par courriel n'a pas pu être envoyé — "
           + 'téléchargez votre récapitulatif pour le conserver.',
  };
}

/* =========================================================================
   7. Rejeu de la file au retour du réseau
   ========================================================================= */

let rejeuEnCours = false;

/**
 * Tente de renvoyer les demandes en attente.
 * Appelée au démarrage et sur l'événement `online`. Une demande qui échoue
 * de nouveau reste en file : on ne perd jamais une demande de visiteur.
 */
export async function rejouerFile() {
  if (rejeuEnCours || !navigator.onLine) return { rejouees: 0, restantes: fileEnvois().length };
  rejeuEnCours = true;

  const config = await chargerConfig();
  let rejouees = 0;

  try {
    for (const demande of fileEnvois()) {
      const interne = await envoyerWeb3Forms({
        email: demande.to, offres: demande.offers || [],
        contact: demande.contact || {}, config,
      });
      if (interne.ok) {
        depilerEnvoi(demande.id_file);
        rejouees += 1;
        // L'accusé au visiteur est tenté sans bloquer le reste de la file.
        envoyerEmailJS({
          email: demande.to, offres: demande.offers || [],
          contact: demande.contact || {}, config,
        }).catch(() => {});
      } else if (interne.motif === 'non-configure') {
        break;   // inutile d'insister sur les suivantes
      }
    }
  } finally {
    rejeuEnCours = false;
  }

  return { rejouees, restantes: fileEnvois().length };
}

/** Branche le rejeu automatique. À appeler une fois, au démarrage de l'application. */
export function activerRejeuAutomatique(surRejeu) {
  const tenter = async () => {
    const bilan = await rejouerFile();
    if (bilan.rejouees > 0 && typeof surRejeu === 'function') surRejeu(bilan);
  };
  window.addEventListener('online', tenter);
  if (navigator.onLine && fileEnvois().length > 0) tenter();
}
