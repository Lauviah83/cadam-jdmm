/* ==========================================================================
   views/selection.js — Le panier et le formulaire d'envoi
   --------------------------------------------------------------------------
   Le parcours du §7 : sélectionner des postes, puis les recevoir par courriel
   en ne renseignant QUE son adresse. Nom, direction et message restent
   facultatifs et repliés : les demander d'emblée fait abandonner.
   ========================================================================== */

import { chargerConfig } from '../offers.js';
import {
  obtenirSelection, retirerDeLaSelection, viderSelection, surChangement,
} from '../store.js';
import {
  envoyer, verifierSoumission, telechargerRecapitulatif, imprimerRecapitulatif,
  lienMailto, DELAI_MINIMUM_MS,
} from '../mailer.js';
import { ico } from '../icones.js';
import { annoncer } from '../app.js';

/* =========================================================================
   Le panier
   ========================================================================= */

export async function rendreListe(section) {
  const config = await chargerConfig();
  const dessiner = () => {
    const selection = obtenirSelection();

    if (!selection.length) {
      section.innerHTML = `
        <div class="entete-vue">
          <p class="surtitre">Votre panier</p>
          <h1 id="titre-selection">Ma sélection</h1>
        </div>
        <div class="section">
          <div class="vide">
            <p style="color:var(--texte-faible)" aria-hidden="true">${ico('selection', 40)}</p>
            <p style="margin-top:var(--pas-3)">Votre sélection est vide.</p>
            <p class="texte-faible" style="margin-top:var(--pas-2)">
              Parcourez les postes et ajoutez ceux qui vous intéressent :
              vous pourrez ensuite les recevoir par courriel.</p>
            <a class="bouton bouton--primaire" style="margin-top:var(--pas-4)" href="#/postes">
              Voir les postes ouverts</a>
          </div>
        </div>`;
      return;
    }

    section.innerHTML = `
      <div class="entete-vue">
        <p class="surtitre">Votre panier</p>
        <h1 id="titre-selection">Ma sélection</h1>
        <p class="sous">${selection.length} poste${selection.length > 1 ? 's' : ''} retenu${selection.length > 1 ? 's' : ''}</p>
      </div>
      <div class="section pile">
        <ul class="pile-serree" role="list">
          ${selection.map(ligne).join('')}
        </ul>
        <div class="bandeau bandeau--info">${ico('courriel', 16)}
          <span>Renseignez seulement votre adresse : nous vous envoyons le récapitulatif.</span></div>
        <a class="bouton bouton--primaire bouton--large" href="#/formulaire">
          ${ico('courriel', 18)} Recevoir par courriel</a>
        <button type="button" class="bouton bouton--fantome bouton--compact" id="selection-vider">
          Vider ma sélection</button>
      </div>`;

    section.querySelectorAll('[data-retirer]').forEach((bouton) => {
      bouton.addEventListener('click', () => {
        const entree = selection.find((e) => e.id === bouton.dataset.retirer);
        retirerDeLaSelection(bouton.dataset.retirer);
        annoncer(`${entree ? entree.titre : 'Le poste'} retiré de votre sélection.`);
      });
    });
    document.getElementById('selection-vider').addEventListener('click', () => {
      viderSelection();
      annoncer('Sélection vidée.');
    });
  };

  dessiner();
  // Le panier se redessine si une autre vue le modifie.
  surChangement('selection', () => {
    if (section.classList.contains('active')) dessiner();
  });
}

function ligne(e) {
  return `
    <li role="listitem" class="carte" style="display:flex;gap:var(--pas-3);align-items:flex-start;padding:var(--pas-3)">
      <div style="flex:1;min-width:0">
        <p class="carte__titre">${e.titre}</p>
        <p class="carte__sous">${e.service ? `Service ${e.service}` : e.domaine || ''}${e.categorie ? ` · Cat. ${e.categorie}` : ''}</p>
        <p style="margin-top:var(--pas-2)">
          ${e.statut_expiree
            ? `<span class="badge badge--alerte">${e.statut_libelle || 'Annonce close'}</span>`
            : (e.deadline_label ? `<span class="badge badge--neutre">${e.deadline_label}</span>` : '')}
        </p>
      </div>
      <button type="button" class="bouton-icone" data-retirer="${e.id}"
              aria-label="Retirer « ${e.titre} » de ma sélection">${ico('croix', 18)}</button>
    </li>`;
}

/* =========================================================================
   Le formulaire
   ========================================================================= */

let ouvertA = 0;

export async function rendreFormulaire(section) {
  const config = await chargerConfig();
  const selection = obtenirSelection();

  if (!selection.length) { window.location.hash = '#/selection'; return; }

  ouvertA = Date.now();
  const mois = (config.rgpd || {}).duree_conservation_mois || 12;
  const dpo = (config.rgpd || {}).contact_dpo || '';

  section.innerHTML = `
    <div class="entete-detail">
      <a class="bouton-icone" href="#/selection" aria-label="Retour à ma sélection">${ico('retour', 22)}</a>
      <span class="titre">Ma sélection</span>
    </div>
    <div class="section pile">
      <div>
        <p class="surtitre">${selection.length} poste${selection.length > 1 ? 's' : ''} retenu${selection.length > 1 ? 's' : ''}</p>
        <h1 style="margin-top:var(--pas-1)">Recevoir mon récapitulatif</h1>
      </div>

      <form id="formulaire-envoi" novalidate class="pile">
        <!-- Leurre anti-robot : invisible pour l'œil et le lecteur d'écran. -->
        <div class="leurre" aria-hidden="true">
          <label for="site-web">Ne pas remplir</label>
          <input type="text" id="site-web" name="site-web" tabindex="-1" autocomplete="off">
        </div>

        <div class="champ">
          <label class="champ__libelle" for="email">
            Votre adresse électronique <span class="champ__obligatoire" aria-hidden="true">*</span>
            <span class="lecteur-seul">(obligatoire)</span>
          </label>
          <span class="champ__aide" id="aide-email">C'est le seul champ nécessaire.</span>
          <input type="email" id="email" name="email" required
                 autocomplete="email" inputmode="email" spellcheck="false"
                 aria-describedby="aide-email erreur-email" placeholder="prenom.nom@exemple.fr">
          <p class="champ__erreur" id="erreur-email" hidden></p>
        </div>

        <details class="carte carte--plate" style="padding:var(--pas-3)">
          <summary style="cursor:pointer;font-size:var(--txt-sm);font-weight:var(--graisse-moyenne)">
            Ajouter mon nom et ma direction <span class="texte-faible">(facultatif)</span>
          </summary>
          <div class="pile" style="margin-top:var(--pas-3)">
            <div class="champ">
              <label class="champ__libelle" for="prenom">Prénom <span class="texte-faible">(facultatif)</span></label>
              <input type="text" id="prenom" name="prenom" autocomplete="given-name">
            </div>
            <div class="champ">
              <label class="champ__libelle" for="nom">Nom <span class="texte-faible">(facultatif)</span></label>
              <input type="text" id="nom" name="nom" autocomplete="family-name">
            </div>
            <div class="champ">
              <label class="champ__libelle" for="direction">Direction actuelle <span class="texte-faible">(facultatif)</span></label>
              <input type="text" id="direction" name="direction" autocomplete="organization">
            </div>
            <div class="champ">
              <label class="champ__libelle" for="message">Message <span class="texte-faible">(facultatif)</span></label>
              <textarea id="message" name="message" rows="3"></textarea>
            </div>
          </div>
        </details>

        <div class="carte carte--plate" style="padding:var(--pas-3)">
          <label class="case">
            <input type="checkbox" id="rgpd" name="rgpd" required
                   aria-describedby="mention-rgpd">
            <span class="case__texte">J'accepte d'être recontacté(e) par la DCIP au sujet de ces postes.
              <span class="champ__obligatoire" aria-hidden="true">*</span>
              <span class="lecteur-seul">(obligatoire)</span></span>
          </label>
          <p class="mention-rgpd" id="mention-rgpd">
            Données traitées par la DRH et la DCIP du Département des Alpes-Maritimes pour le suivi
            des mobilités internes. Conservation ${mois} mois. Droits d'accès, de rectification et
            d'effacement${dpo && dpo !== 'À_RENSEIGNER' ? ` auprès de ${dpo}` : ' auprès du DPO du Département'}.
            Aucun traceur, aucune mesure d'audience. <a href="mentions.html?doc=rgpd" target="_blank" rel="noopener">En savoir plus<span class="lecteur-seul"> (nouvelle fenêtre)</span></a>.
          </p>
          <p class="champ__erreur" id="erreur-rgpd" hidden></p>
        </div>

        <p class="champ__erreur" id="erreur-generale" hidden></p>

        <button type="submit" class="bouton bouton--primaire bouton--large" id="bouton-envoyer">
          Envoyer ma demande</button>
      </form>

      <div style="text-align:center">
        <p class="texte-faible">Ou
          <button type="button" class="bouton bouton--fantome bouton--compact" id="bouton-telecharger"
            style="text-decoration:underline">télécharger le récapitulatif</button>
        </p>
      </div>
    </div>`;

  document.getElementById('bouton-telecharger').addEventListener('click', () => {
    telechargerRecapitulatif(obtenirSelection(), config);
    annoncer('Récapitulatif téléchargé.');
  });

  document.getElementById('formulaire-envoi').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    soumettre(section, config);
  });
}

async function soumettre(section, config) {
  const email = document.getElementById('email').value.trim();
  const piege = document.getElementById('site-web').value;
  const rgpd = document.getElementById('rgpd').checked;
  const bouton = document.getElementById('bouton-envoyer');

  const erreurEmail = document.getElementById('erreur-email');
  const erreurRgpd = document.getElementById('erreur-rgpd');
  const erreurGenerale = document.getElementById('erreur-generale');
  [erreurEmail, erreurRgpd, erreurGenerale].forEach((e) => { e.hidden = true; });
  document.getElementById('email').removeAttribute('aria-invalid');

  const afficher = (element, message, champ) => {
    element.innerHTML = `${ico('alerte', 15)}<span>${message}</span>`;
    element.hidden = false;
    if (champ) { champ.setAttribute('aria-invalid', 'true'); champ.focus(); }
    annoncer(message);
  };

  // Le consentement d'abord : c'est lui qui conditionne le traitement.
  if (!rgpd) {
    afficher(erreurRgpd, 'Merci de cocher la case avant d\'envoyer votre demande.');
    document.getElementById('rgpd').focus();
    return;
  }

  const probleme = verifierSoumission({ email, piege, ouvertDepuisMs: Date.now() - ouvertA });
  if (probleme === 'ROBOT') {
    // Leurre rempli : on n'envoie rien et on n'explique rien.
    afficherConfirmation(section, config, {
      ok: true, planB: false, misEnFile: false,
      message: 'Votre demande a bien été prise en compte.',
    }, email);
    return;
  }
  if (probleme) {
    afficher(erreurEmail, probleme, document.getElementById('email'));
    return;
  }

  bouton.disabled = true;
  bouton.textContent = 'Envoi en cours…';
  annoncer('Envoi en cours.');

  const bilan = await envoyer({
    to: email,
    offers: obtenirSelection(),
    contact: {
      prenom: document.getElementById('prenom').value.trim(),
      nom: document.getElementById('nom').value.trim(),
      direction: document.getElementById('direction').value.trim(),
      message: document.getElementById('message').value.trim(),
    },
  });

  afficherConfirmation(section, config, bilan, email);
}

/* =========================================================================
   Confirmation — elle dit ce qui est réellement parti, et rien d'autre
   ========================================================================= */

function afficherConfirmation(section, config, bilan, email) {
  const selection = obtenirSelection();
  const reussi = bilan.ok && !bilan.planB;

  section.innerHTML = `
    <div class="section pile" style="text-align:center;padding-top:var(--pas-7)">
      <p style="display:flex;justify-content:center">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:66px;height:66px;
          border-radius:50%;background:var(--${reussi ? 'succes' : 'accent'}-fond);
          color:var(--${reussi ? 'succes' : 'accent-texte'})" aria-hidden="true">
          ${ico(reussi ? 'coche' : 'courriel', 32)}</span>
      </p>
      <div>
        <h1>${reussi ? "C'est envoyé" : 'Demande enregistrée'}</h1>
        <p class="texte-doux" style="margin-top:var(--pas-3);line-height:1.6">${bilan.message}</p>
      </div>

      <section aria-labelledby="titre-envoye" style="text-align:left">
        <p class="surtitre" id="titre-envoye">Les postes concernés</p>
        <ul class="pile-serree" style="margin-top:var(--pas-2)" role="list">
          ${selection.map((e) => `
            <li role="listitem" class="carte carte--plate" style="display:flex;gap:var(--pas-2);padding:var(--pas-3)">
              <span style="color:var(--succes);margin-top:2px" aria-hidden="true">${ico('coche', 15)}</span>
              <span style="flex:1;font-size:var(--txt-sm);line-height:1.4">${e.titre}</span>
            </li>`).join('')}
        </ul>
      </section>

      <div class="pile-serree">
        <a class="bouton bouton--primaire bouton--large" href="#/postes">Continuer à explorer</a>
        <button type="button" class="bouton bouton--secondaire bouton--large" id="conf-telecharger">
          ${ico('telecharger', 18)} Télécharger une copie</button>
        ${bilan.planB ? `
          <a class="bouton bouton--secondaire bouton--large" id="conf-mailto"
             href="${lienMailto(email, selection, config)}">
            ${ico('courriel', 18)} Me l'envoyer depuis ma messagerie</a>
          <button type="button" class="bouton bouton--fantome bouton--compact" id="conf-imprimer">
            Imprimer ou enregistrer en PDF</button>` : ''}
      </div>
    </div>`;

  document.getElementById('conf-telecharger').addEventListener('click', () => {
    telechargerRecapitulatif(selection, config);
  });
  const imprimer = document.getElementById('conf-imprimer');
  if (imprimer) imprimer.addEventListener('click', () => {
    if (!imprimerRecapitulatif(selection, config)) {
      annoncer("L'aperçu a été bloqué par le navigateur. Utilisez le téléchargement.");
    }
  });

  annoncer(bilan.message);
  window.scrollTo({ top: 0 });
}
