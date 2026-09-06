/**
 * Registre des demandes — Journée des Métiers et de la Mobilité, DCIP
 * Département des Alpes-Maritimes
 *
 * Ce script tient le tableau des demandes et envoie un récapitulatif en fin
 * de journée. Il se déploie en « application web » depuis Google Apps Script ;
 * son adresse est ensuite collée dans data/config.json → registre.endpoint.
 *
 * Marche à suivre complète : docs/REGISTRE.md
 *
 * Deux entrées :
 *   · doPost(e)          — appelée par l'application à chaque demande
 *   · envoyerRecapitulatif() — appelée par un déclencheur quotidien
 */

// ── Réglages ───────────────────────────────────────────────────────────────

/** Adresse qui reçoit le récapitulatif de fin de journée. Une seule personne. */
var DESTINATAIRE = 'mickael@connect3s.fr';

/** Nom de l'onglet du tableau. Créé automatiquement s'il n'existe pas. */
var ONGLET = 'Demandes';

/**
 * Origines autorisées à écrire. Laisser vide pour tout accepter.
 * Un Web App Apps Script est public par nature : ce contrôle est un garde-fou
 * de confort, pas une sécurité. La vraie protection est que ce point d'entrée
 * ne fait qu'ajouter une ligne — il ne lit rien et ne supprime rien.
 */
var ORIGINES = ['https://dcip06.github.io'];

/** Colonnes du tableau, dans l'ordre. */
var COLONNES = [
  'Horodatage', 'Prénom', 'Nom', 'Direction', 'Email',
  'Projet de mobilité', 'Message',
  'Poste', 'Service', 'Catégorie', 'Statut de l\'annonce', 'URL du poste',
  'Récapitulatif envoyé',
];

// ── Réception d'une demande ────────────────────────────────────────────────

function doPost(e) {
  try {
    var demande = JSON.parse(e.postData.contents);

    // Contrôles minimaux : ce sont les quatre champs obligatoires du
    // formulaire. On refuse plutôt que d'écrire une ligne inexploitable.
    var manquants = ['prenom', 'nom', 'direction', 'email'].filter(function (c) {
      return !demande[c] || !String(demande[c]).trim();
    });
    if (manquants.length) {
      return reponse({ ok: false, erreur: 'champs manquants : ' + manquants.join(', ') });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(demande.email)) {
      return reponse({ ok: false, erreur: 'adresse invalide' });
    }

    var feuille = obtenirFeuille();

    // Deux visiteurs peuvent valider en même temps : le verrou évite que
    // deux écritures se marchent dessus et qu'une ligne soit perdue.
    var verrou = LockService.getScriptLock();
    verrou.waitLock(15000);
    try {
      feuille.appendRow([
        new Date(),
        demande.prenom, demande.nom, demande.direction, demande.email,
        demande.projet || '', demande.message || '',
        demande.poste_titre || '', demande.poste_service || '',
        demande.poste_categorie || '', demande.poste_statut || '',
        demande.poste_url || '',
        '',                                   // récapitulatif pas encore envoyé
      ]);
    } finally {
      verrou.releaseLock();
    }

    return reponse({ ok: true, reference: 'L' + feuille.getLastRow() });
  } catch (err) {
    console.error(err);
    return reponse({ ok: false, erreur: String(err) });
  }
}

/** Le navigateur appelle parfois l'adresse en GET : on répond poliment. */
function doGet() {
  return reponse({ ok: true, service: 'Registre des demandes DCIP' });
}

function reponse(objet) {
  return ContentService
    .createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}

function obtenirFeuille() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var feuille = classeur.getSheetByName(ONGLET);
  if (!feuille) {
    feuille = classeur.insertSheet(ONGLET);
  }
  if (feuille.getLastRow() === 0) {
    feuille.appendRow(COLONNES);
    feuille.getRange(1, 1, 1, COLONNES.length)
      .setFontWeight('bold')
      .setBackground('#042C53')
      .setFontColor('#FFFFFF');
    feuille.setFrozenRows(1);
    feuille.setColumnWidth(1, 150);   // horodatage
    feuille.setColumnWidth(8, 320);   // intitulé du poste
  }
  return feuille;
}

// ── Récapitulatif de fin de journée ────────────────────────────────────────

/**
 * Envoie le récapitulatif des demandes du jour, puis marque les lignes
 * traitées. Le marquage évite qu'une relance manuelle renvoie deux fois les
 * mêmes demandes, et qu'une exécution en échec les perde.
 *
 * À rattacher à un déclencheur quotidien (voir docs/REGISTRE.md).
 */
function envoyerRecapitulatif() {
  var feuille = obtenirFeuille();
  var dernier = feuille.getLastRow();
  if (dernier < 2) {
    console.log('Aucune demande enregistrée.');
    return;
  }

  var valeurs = feuille.getRange(2, 1, dernier - 1, COLONNES.length).getValues();
  var aujourdhui = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var lignes = [];
  valeurs.forEach(function (v, i) {
    var date = v[0] instanceof Date
      ? Utilities.formatDate(v[0], Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
    // Du jour, et pas encore incluse dans un récapitulatif.
    if (date === aujourdhui && !v[12]) {
      lignes.push({ rang: i + 2, v: v });
    }
  });

  if (!lignes.length) {
    console.log('Aucune nouvelle demande aujourd’hui.');
    return;
  }

  var jour = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
  MailApp.sendEmail({
    to: DESTINATAIRE,
    subject: '[JDMM] ' + lignes.length + ' demande' + (lignes.length > 1 ? 's' : '')
             + ' de mobilité — ' + jour,
    htmlBody: corpsHTML(lignes, jour),
    name: 'Registre DCIP — Journée des Métiers et de la Mobilité',
  });

  // Marquage APRÈS l'envoi : si le courriel échoue, les demandes restent
  // dans le prochain récapitulatif plutôt que d'être silencieusement perdues.
  var horodatage = new Date();
  lignes.forEach(function (l) {
    feuille.getRange(l.rang, 13).setValue(horodatage);
  });
  console.log(lignes.length + ' demande(s) transmise(s) à ' + DESTINATAIRE);
}

function corpsHTML(lignes, jour) {
  var NAVY = '#042C53';
  var AMBRE = '#EF9F27';

  // Combien de demandes par poste : c'est le chiffre utile pour la DCIP.
  var parPoste = {};
  lignes.forEach(function (l) {
    var titre = l.v[7] || '(poste non précisé)';
    parPoste[titre] = (parPoste[titre] || 0) + 1;
  });
  var classement = Object.keys(parPoste).sort(function (a, b) {
    return parPoste[b] - parPoste[a];
  });

  var html = ''
    + '<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;">'
    + '<div style="background:' + NAVY + ';padding:22px;border-bottom:4px solid ' + AMBRE + ';">'
    + '<p style="margin:0;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:' + AMBRE + ';">'
    + 'Journée des Métiers et de la Mobilité — CADAM</p>'
    + '<p style="margin:7px 0 0;font-size:21px;font-weight:700;color:#fff;">'
    + lignes.length + ' demande' + (lignes.length > 1 ? 's' : '') + ' du ' + jour + '</p>'
    + '</div>'

    + '<div style="padding:20px 22px;">'
    + '<p style="margin:0 0 8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#616D82;">'
    + 'Postes les plus demandés</p><ul style="margin:0 0 24px;padding-left:20px;color:#455465;font-size:14px;">';

  classement.forEach(function (titre) {
    html += '<li style="margin:4px 0;"><strong style="color:' + NAVY + ';">'
         + parPoste[titre] + '</strong> — ' + echapper(titre) + '</li>';
  });

  html += '</ul>'
    + '<p style="margin:0 0 10px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#616D82;">'
    + 'Le détail</p>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">';

  lignes.forEach(function (l) {
    var v = l.v;
    var heure = v[0] instanceof Date
      ? Utilities.formatDate(v[0], Session.getScriptTimeZone(), 'HH:mm') : '';
    html += ''
      + '<tr><td style="padding:12px 0;border-bottom:1px solid #E4E7EC;">'
      + '<p style="margin:0;font-weight:700;color:' + NAVY + ';">'
      + echapper(v[1]) + ' ' + echapper(v[2])
      + ' <span style="font-weight:400;color:#616D82;">— ' + echapper(v[3]) + '</span></p>'
      + '<p style="margin:3px 0 0;color:#455465;">'
      + '<a href="mailto:' + echapper(v[4]) + '" style="color:#185FA5;">' + echapper(v[4]) + '</a>'
      + ' · ' + heure + (v[5] ? ' · ' + echapper(v[5]) : '') + '</p>'
      + '<p style="margin:5px 0 0;color:#455465;">→ ' + echapper(v[7])
      + (v[8] ? ' <span style="color:#616D82;">(' + echapper(v[8]) + ')</span>' : '') + '</p>'
      + (v[6] ? '<p style="margin:5px 0 0;color:#616D82;font-style:italic;">« '
                + echapper(v[6]) + ' »</p>' : '')
      + '</td></tr>';
  });

  html += '</table>'
    + '<p style="margin:22px 0 0;font-size:11px;line-height:1.6;color:#616D82;">'
    + 'Récapitulatif automatique du registre des demandes. Les coordonnées sont '
    + 'conservées 12 mois puis supprimées — pensez à purger la feuille de calcul '
    + 'à l’échéance.</p>'
    + '</div></div>';

  return html;
}

function echapper(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Utilitaires d'exploitation ─────────────────────────────────────────────

/** Envoie un récapitulatif de test avec une ligne fictive, sans rien marquer. */
function testerEnvoi() {
  MailApp.sendEmail({
    to: DESTINATAIRE,
    subject: '[JDMM] Test du registre',
    htmlBody: corpsHTML([{
      rang: 0,
      v: [new Date(), 'Camille', 'Durand', 'DRH', 'camille.durand@exemple.fr',
          'Court terme', 'Message de test', 'Ingénieur chargé d’études courants forts et faibles',
          'Énergie et fluides', 'A', '', '', ''],
    }], Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')),
    name: 'Registre DCIP — test',
  });
  console.log('Courriel de test envoyé à ' + DESTINATAIRE);
}

/** Pose le déclencheur quotidien. À lancer une seule fois. */
function installerDeclencheur() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'envoyerRecapitulatif') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('envoyerRecapitulatif')
    .timeBased()
    .atHour(18)          // entre 18 h et 19 h, heure du script
    .everyDays(1)
    .create();
  console.log('Déclencheur quotidien posé pour 18 h.');
}
