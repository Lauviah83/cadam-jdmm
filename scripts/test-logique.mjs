// Simulacres minimaux du navigateur pour exercer la logique pure sous Node.
const memoire = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoire.has(k) ? memoire.get(k) : null),
  setItem: (k, v) => memoire.set(k, String(v)),
  removeItem: (k) => memoire.delete(k),
};
globalThis.window = { addEventListener() {} };
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
globalThis.fetch = async () => { throw new Error('réseau coupé (test)'); };

const M = await import('../js/mailer.js');
const S = await import('../js/store.js');
const O = await import('../js/offers.js');

const offres = [
  { id: 'ing-cff', titre: "Ingénieur chargé d'études courants forts et faibles DCIP H/F (30269)",
    url: 'https://www.departement06.fr/offres-demploi/ingenieur-cff-30269', service: 'Énergie et fluides',
    categorie: 'A', filiere: 'TECHNIQUE', lieu: 'CADAM — Nice', deadline: '2026-10-31',
    deadline_label: '31 octobre 2026' },
  { id: 'assist-col', titre: 'Assistant de gestion service maintenance des collèges DCIP (31438)',
    url: 'https://www.departement06.fr/offres-demploi/assistant-31438', domaine: 'Affaires générales',
    categorie: 'C', filiere: 'ADMINISTRATIVE', deadline_label: 'Candidature permanente' },
];
const config = {
  evenement: { nom: 'Journée des Métiers et de la Mobilité', lieu: 'CADAM — Nice', organisateur: 'DCIP' },
  emails_internes: ['dcip_affaires_generales@departement06.fr'],
  rgpd: { duree_conservation_mois: 12, contact_dpo: 'À_RENSEIGNER' },
};

let ko = 0;
const ok = (nom, cond) => { console.log((cond ? '  ✔ ' : '  ✘ ') + nom); if (!cond) ko++; };

console.log('\n— Validation d\'adresse —');
ok("accepte prenom.nom@departement06.fr", M.adresseValide('prenom.nom@departement06.fr'));
ok("accepte une apostrophe : o'brien@mail.fr", M.adresseValide("o'brien@mail.fr"));
ok('refuse « pasunemail »', !M.adresseValide('pasunemail'));
ok('refuse « a@b »', !M.adresseValide('a@b'));

console.log('\n— Anti-abus —');
ok('détecte le honeypot', M.verifierSoumission({ email: 'a@b.fr', piege: 'x', ouvertDepuisMs: 9e3 }) === 'ROBOT');
ok('refuse une soumission trop rapide',
   /patienter/.test(M.verifierSoumission({ email: 'a@b.fr', piege: '', ouvertDepuisMs: 500 }) || ''));
ok('laisse passer une soumission normale',
   M.verifierSoumission({ email: 'a@b.fr', piege: '', ouvertDepuisMs: 9e3 }) === null);
S.enregistrerEnvoi(); S.enregistrerEnvoi(); S.enregistrerEnvoi();
ok('bloque au 4e envoi dans l\'heure',
   /3 récapitulatifs/.test(M.verifierSoumission({ email: 'a@b.fr', piege: '', ouvertDepuisMs: 9e3 }) || ''));

console.log('\n— Récapitulatif —');
const txt = M.recapitulatifTexte(offres, config);
ok('le texte cite les 2 intitulés', txt.includes('courants forts') && txt.includes('maintenance des collèges'));
ok('le texte porte les liens officiels', (txt.match(/departement06\.fr/g) || []).length >= 2);
ok('le texte porte la date limite', txt.includes('31 octobre 2026'));
const html = M.recapitulatifHTML(offres, config, { horodatage: '04/09/2026' });
ok('le HTML fait 600 px de large', html.includes('width:600px'));
ok('le HTML ne charge aucune webfont', !/fonts\.googleapis|@font-face/.test(html));
ok('le HTML porte la mention RGPD', html.includes('12 mois'));
ok("le HTML échappe les caractères spéciaux",
   M.recapitulatifHTML([{ ...offres[0], titre: 'Test <script>alert(1)</script>' }], config)
    .includes('&lt;script&gt;'));

console.log('\n— Plan B —');
const lien = M.lienMailto('visiteur@exemple.fr', offres, config);
ok('mailto adressé au visiteur', lien.startsWith('mailto:visiteur%40exemple.fr'));
ok('mailto porte un objet et un corps', lien.includes('subject=') && lien.includes('body='));

console.log('\n— Sélection —');
S.ajouterALaSelection(offres[0]);
S.ajouterALaSelection(offres[1]);
S.ajouterALaSelection(offres[0]);            // doublon volontaire
ok('pas de doublon dans la sélection', S.nombreSelectionnees() === 2);
ok('bascule : retire une offre déjà retenue', S.basculerSelection(offres[0]) === false && S.nombreSelectionnees() === 1);
ok('bascule : ajoute une offre absente', S.basculerSelection(offres[0]) === true && S.nombreSelectionnees() === 2);

console.log('\n— Échéances —');
const dans3j = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
const hier   = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
ok('date limite dans 3 jours → urgente', O.statutEcheance({ deadline: dans3j }).code === 'urgente');
ok('date limite passée → expirée', O.statutEcheance({ deadline: hier }).expiree === true);
ok('sans date limite → candidature permanente',
   O.statutEcheance({ deadline: '', candidature_permanente: true }).code === 'permanente');
ok('date lointaine → ouverte', O.statutEcheance({ deadline: '2027-12-31', deadline_label: '31 décembre 2027' }).code === 'ouverte');

console.log('\n— Fraîcheur —');
ok('fichier de ce jour → non périmé',
   O.evaluerFraicheur({ generated_at: new Date().toISOString() }).perimee === false);
ok('fichier de 5 jours → périmé',
   O.evaluerFraicheur({ generated_at: new Date(Date.now() - 5 * 864e5).toISOString() }).perimee === true);
ok('date absente → signalée comme inconnue', O.evaluerFraicheur({}).connue === false);

console.log('\n— Mise en file hors ligne —');
const bilan = await M.envoyer({ to: 'v@exemple.fr', offers: offres, contact: {} });
ok('sans clé configurée → bascule plan B', bilan.planB === true && bilan.provider === 'plan-b');
ok('sans clé configurée → rien mis en file', bilan.misEnFile === false);

console.log(ko === 0 ? '\n✔ 24 contrôles passés\n' : `\n✘ ${ko} contrôle(s) en échec\n`);
process.exit(ko ? 1 : 0);
